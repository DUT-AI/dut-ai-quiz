import io
import os
import re
import unicodedata
import urllib.parse
import zipfile
from uuid import UUID, uuid4

from app.config import settings
from app.core.datetime_utils import now_ict
from app.domain.entities.lesson import LessonEntity
from app.domain.interfaces import ILessonRepository, IS3Client
from app.application.services.lesson_index_scheduler import LessonIndexScheduler


def slugify_vietnamese(text: str) -> str:
    """Convert Vietnamese and special characters to clean URL slug."""
    vietnamese_map = {
        'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
        'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
        'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
        'đ': 'd',
        'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
        'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
        'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
        'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
        'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
        'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
        'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
        'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
        'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
        'À': 'a', 'Á': 'a', 'Ả': 'a', 'Ã': 'a', 'Ạ': 'a',
        'Ă': 'a', 'Ằ': 'a', 'Ắ': 'a', 'Ẳ': 'a', 'Ẵ': 'a', 'Ặ': 'a',
        'Â': 'a', 'Ầ': 'a', 'Ấ': 'a', 'Ẩ': 'a', 'Ẫ': 'a', 'Ậ': 'a',
        'Đ': 'd',
        'È': 'e', 'É': 'e', 'Ẻ': 'e', 'Ẽ': 'e', 'Ẹ': 'e',
        'Ê': 'e', 'Ề': 'e', 'Ế': 'e', 'Ể': 'e', 'Ễ': 'e', 'Ệ': 'e',
        'Ì': 'i', 'Í': 'i', 'Ỉ': 'i', 'Ĩ': 'i', 'Ị': 'i',
        'Ò': 'o', 'Ó': 'o', 'Ỏ': 'o', 'Õ': 'o', 'Ọ': 'o',
        'Ô': 'o', 'Ồ': 'o', 'Ố': 'o', 'Ổ': 'o', 'Ỗ': 'o', 'Ộ': 'o',
        'Ơ': 'o', 'Ờ': 'o', 'Ớ': 'o', 'Ở': 'o', 'Ỡ': 'o', 'Ợ': 'o',
        'Ù': 'u', 'Ú': 'u', 'Ủ': 'u', 'Ũ': 'u', 'Ụ': 'u',
        'Ư': 'u', 'Ừ': 'u', 'Ứ': 'u', 'Ử': 'u', 'Ữ': 'u', 'Ự': 'u',
        'Ý': 'y', 'Ỳ': 'y', 'Ỷ': 'y', 'Ỹ': 'y', 'Ỵ': 'y'
    }
    for char, replacement in vietnamese_map.items():
        text = text.replace(char, replacement)
    
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("utf-8")
    text = text.lower()
    text = re.sub(r"[^a-z0-9_-]", "-", text)
    text = re.sub(r"-+", "-", text)
    return text.strip("-")


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

        # 4. Generate lesson ID
        lesson_id = uuid4()

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

        # 7. Generate unique slug
        base_slug = slugify_vietnamese(lesson_name)
        slug = base_slug
        counter = 1
        while await self._repo.get_by_slug(slug) is not None:
            slug = f"{base_slug}-{counter}"
            counter += 1

        # 8. Create & Save lesson entity
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
