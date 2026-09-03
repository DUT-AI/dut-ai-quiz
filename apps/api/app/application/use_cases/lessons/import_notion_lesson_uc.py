import io
import os
import re
import unicodedata
import urllib.parse
import zipfile
from uuid import UUID, uuid4

from app.config import settings
from app.core.datetime_utils import now_ict
from app.core.string_utils import slugify_vietnamese
from app.domain.entities.lesson import LessonEntity
from app.domain.interfaces import ILessonRepository, IS3Client
from app.application.services.lesson_index_scheduler import LessonIndexScheduler


class ImportNotionLessonUseCase:
    """Use case to import a lesson from a ZIP file containing Markdown and images."""

    def __init__(
        self,
        repo: ILessonRepository,
        storage: IS3Client,
        scheduler: LessonIndexScheduler,
    ) -> None:
        self._repo = repo
        self._storage = storage
        self._scheduler = scheduler

    async def execute(
        self,
        zip_bytes: bytes,
        module_id: UUID | None = None,
        custom_name: str | None = None,
        custom_description: str | None = None,
        lesson_id: UUID | None = None,
    ) -> LessonEntity:
        """Parse ZIP file, extract & upload images, update MD links, and save the lesson."""
        
        # 1. Read ZIP in memory
        try:
            z = zipfile.ZipFile(io.BytesIO(zip_bytes))
        except zipfile.BadZipFile:
            raise ValueError("Invalid ZIP file")

        # 2. Separate markdown file and image files (recursively handling nested zip files)
        md_filename = None
        md_content = None
        images_data: dict[str, bytes] = {}  # maps full zip path and basename to bytes
        
        image_extensions = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".bmp"}
        
        def process_zip(zip_obj: zipfile.ZipFile) -> None:
            nonlocal md_filename, md_content
            for name in zip_obj.namelist():
                # Skip directories
                if name.endswith("/"):
                    continue
                    
                _, ext = os.path.splitext(name.lower())
                if ext == ".md":
                    # Save first markdown file found
                    if md_filename is None:
                        md_filename = name
                        md_content = zip_obj.read(name).decode("utf-8", errors="ignore")
                elif ext in image_extensions:
                    file_bytes = zip_obj.read(name)
                    # Map full path and basename to easily lookup
                    images_data[name] = file_bytes
                    images_data[os.path.basename(name)] = file_bytes
                elif ext == ".zip":
                    # Recursively process nested zip files
                    inner_zip_bytes = zip_obj.read(name)
                    try:
                        with zipfile.ZipFile(io.BytesIO(inner_zip_bytes)) as inner_z:
                            process_zip(inner_z)
                    except zipfile.BadZipFile:
                        pass
        
        process_zip(z)

        if not md_filename or md_content is None:
            raise ValueError("No markdown file (.md) found in ZIP")

        # 3. Determine lesson name and description
        lesson_name = custom_name
        if lesson_name and lesson_name.strip().lower() == "string":
            lesson_name = None
        if not lesson_name:
            # Look for H1 heading: e.g. "# Lesson Title"
            h1_match = re.search(r"^#\s+(.+)$", md_content, re.MULTILINE)
            if h1_match:
                lesson_name = h1_match.group(1).strip()
            else:
                # Fallback to filename (strip notion hex code if present)
                base_name, _ = os.path.splitext(os.path.basename(md_filename))
                # Strip trailing Notion hex ID (e.g. "Buoi 50 393396cc2b8280aa87cdf193ab23" -> "Buoi 50")
                lesson_name = re.sub(r"[\s_]+[0-9a-fA-F]{32}$", "", base_name).strip()

        lesson_description = custom_description
        if lesson_description and lesson_description.strip().lower() == "string":
            lesson_description = None
        if not lesson_description:
            # Extrapolate description from the first paragraph of markdown (max 200 chars)
            # Strip titles and find first text line
            lines = [line.strip() for line in md_content.splitlines() if line.strip()]
            text_lines = [line for line in lines if not line.startswith("#") and not line.startswith("![") and not line.startswith("<")]
            if text_lines:
                lesson_description = text_lines[0][:200]
                if len(text_lines[0]) > 200:
                    lesson_description += "..."
            else:
                lesson_description = f"Lesson imported from {os.path.basename(md_filename)}"

        # 4. Generate or use existing lesson ID
        lesson_id = lesson_id or uuid4()

        # 5. Upload images and collect public URLs
        uploaded_urls: dict[str, str] = {}
        for img_name, img_bytes in images_data.items():
            # Only upload unique original names (skip basenames to avoid double upload if full path is also mapped)
            if img_name in uploaded_urls or ("/" not in img_name and os.path.basename(img_name) != img_name):
                continue
            
            # Sanitize image filename
            safe_basename = slugify_vietnamese(os.path.splitext(os.path.basename(img_name))[0])
            ext = os.path.splitext(img_name)[1].lower()
            s3_key = f"uploads/lessons/{lesson_id}/{safe_basename}{ext}"
            
            # Upload
            self._storage.upload_fileobj(
                io.BytesIO(img_bytes),
                settings.s3_bucket_name,
                s3_key
            )
            public_url = self._storage.get_object_url(settings.s3_bucket_name, s3_key)
            
            # Map both full name and basename to this URL
            uploaded_urls[img_name] = public_url
            uploaded_urls[os.path.basename(img_name)] = public_url

        # 6. Update image paths in Markdown
        def md_img_replacer(match: re.Match) -> str:
            alt = match.group(1)
            url = match.group(2)
            # URL decode path and normalize separators
            decoded = urllib.parse.unquote(url.split("#")[0].split("?")[0]).replace("\\", "/")
            basename = os.path.basename(decoded)
            
            if decoded in uploaded_urls:
                return f"![{alt}]({uploaded_urls[decoded]})"
            elif basename in uploaded_urls:
                return f"![{alt}]({uploaded_urls[basename]})"
            return match.group(0)

        content_md = re.sub(r"!\[(.*?)\]\((.*?)\)", md_img_replacer, md_content)

        def html_img_replacer(match: re.Match) -> str:
            full_tag = match.group(0)
            src_match = re.search(r'src=["\']([^"\']+)["\']', full_tag)
            if src_match:
                url = src_match.group(1)
                decoded = urllib.parse.unquote(url.split("#")[0].split("?")[0]).replace("\\", "/")
                basename = os.path.basename(decoded)
                
                if decoded in uploaded_urls:
                    return full_tag.replace(url, uploaded_urls[decoded])
                elif basename in uploaded_urls:
                    return full_tag.replace(url, uploaded_urls[basename])
            return full_tag

        content_md = re.sub(r"<img\s+[^>]*src=[\"']([^\"']+)[\"'][^>]*>", html_img_replacer, content_md)

        # 7. Generate unique slug (allow same slug if updating the same lesson)
        base_slug = slugify_vietnamese(lesson_name)
        slug = base_slug
        counter = 1
        while True:
            existing = await self._repo.get_by_slug(slug)
            if existing is None or existing.id == lesson_id:
                break
            slug = f"{base_slug}-{counter}"
            counter += 1

        # 8. Create or Update lesson entity
        existing_entity = None
        if lesson_id:
            existing_entity = await self._repo.get(lesson_id)

        if existing_entity:
            existing_entity.name = lesson_name
            existing_entity.description = lesson_description
            existing_entity.content_md = content_md
            existing_entity.slug = slug
            if module_id:
                existing_entity.module_id = module_id
            saved = await self._repo.update(existing_entity)
        else:
            entity = LessonEntity(
                id=lesson_id,
                name=lesson_name,
                description=lesson_description,
                content_md=content_md,
                order=0, # Defaults to 0, can be updated later
                slug=slug,
                module_id=module_id,
                created_at=now_ict(),
            )
            saved = await self._repo.add(entity)
        
        # 9. Trigger semantic indexing for search
        await self._scheduler.schedule(saved)
        
        return saved
