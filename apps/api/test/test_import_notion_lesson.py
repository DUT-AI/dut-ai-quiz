import io
import zipfile
from uuid import UUID, uuid4

import pytest
from app.application.use_cases.lessons.import_notion_lesson_uc import ImportNotionLessonUseCase
from app.core.datetime_utils import now_ict
from app.domain.entities.lesson import LessonEntity
from app.domain.interfaces import ILessonRepository, IS3Client


class MockLessonRepository(ILessonRepository):
    def __init__(self):
        self.lessons = []

    async def list_all(self):
        return self.lessons

    async def get(self, lesson_id: UUID):
        for les in self.lessons:
            if les.id == lesson_id:
                return les
        return None

    async def get_by_slug(self, slug: str):
        for les in self.lessons:
            if les.slug == slug:
                return les
        return None

    async def add(self, entity: LessonEntity):
        self.lessons.append(entity)
        return entity

    async def update(self, entity: LessonEntity):
        for i, les in enumerate(self.lessons):
            if les.id == entity.id:
                self.lessons[i] = entity
                return entity
        return entity

    async def delete(self, entity: LessonEntity):
        self.lessons = [les for les in self.lessons if les.id != entity.id]


class MockS3Client(IS3Client):
    def __init__(self):
        self.uploads = []

    def upload_fileobj(self, file_obj, bucket, key):
        self.uploads.append((bucket, key, file_obj.read()))

    def get_object_url(self, bucket, key):
        return f"http://fake-s3/{bucket}/{key}"

    def generate_presigned_upload_url(self, bucket, key, content_type, expires_in=3600):
        return f"http://fake-s3-presigned-upload/{bucket}/{key}"

    def generate_presigned_download_url(self, bucket, key, expires_in=3600):
        return f"http://fake-s3-presigned-download/{bucket}/{key}"


class MockLessonIndexScheduler:
    def __init__(self):
        self.scheduled = []

    async def schedule(self, lesson: LessonEntity):
        self.scheduled.append(lesson)
        return True


@pytest.mark.asyncio
async def test_import_notion_lesson_success():
    # 1. Create a mock zip file in memory
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w") as zf:
        # Markdown file with image references
        md_content = """# Buổi 50: Tìm hiểu DistilBERT

Học máy và xử lý ngôn ngữ tự nhiên.

![Hình minh họa 1](image%201.png)

Dưới đây là sơ đồ so sánh:
<img src="images/hardware_tradeoff.png" alt="Hardware Tradeoff" width="500" />
"""
        zf.writestr("Buổi 50 DistilBERT 393396cc2b8280aa87cdf193ab23.md", md_content)
        # Mock image files
        zf.writestr("image 1.png", b"fake_png_bytes_1")
        zf.writestr("images/hardware_tradeoff.png", b"fake_png_bytes_2")

    zip_bytes = zip_buffer.getvalue()

    # 2. Setup mocks
    repo = MockLessonRepository()
    storage = MockS3Client()
    scheduler = MockLessonIndexScheduler()

    use_case = ImportNotionLessonUseCase(repo, storage, scheduler)

    # 3. Execute
    module_id = uuid4()
    lesson = await use_case.execute(
        zip_bytes=zip_bytes,
        module_id=module_id
    )

    # 4. Assertions
    assert lesson.id is not None
    assert lesson.module_id == module_id
    assert lesson.name == "Buổi 50: Tìm hiểu DistilBERT"
    assert lesson.slug == "buoi-50-tim-hieu-distilbert"

    # Check S3 uploads
    assert len(storage.uploads) == 2

    # Expect keys in uploads/lessons/{lesson_id}/...
    uploaded_keys = [item[1] for item in storage.uploads]
    assert f"uploads/lessons/{lesson.id}/image-1.png" in uploaded_keys
    assert f"uploads/lessons/{lesson.id}/hardware_tradeoff.png" in uploaded_keys

    # Check replaced URLs in Markdown
    expected_url1 = f"http://fake-s3/lms-dev/uploads/lessons/{lesson.id}/image-1.png"
    expected_url2 = f"http://fake-s3/lms-dev/uploads/lessons/{lesson.id}/hardware_tradeoff.png"

    assert f"![Hình minh họa 1]({expected_url1})" in lesson.content_md
    assert f'src="{expected_url2}"' in lesson.content_md

    # Verify DB save
    assert len(repo.lessons) == 1
    assert repo.lessons[0].id == lesson.id

    # Verify index scheduler trigger
    assert len(scheduler.scheduled) == 1
    assert scheduler.scheduled[0].id == lesson.id


@pytest.mark.asyncio
async def test_import_notion_lesson_no_md():
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w") as zf:
        zf.writestr("image 1.png", b"fake_png_bytes")

    zip_bytes = zip_buffer.getvalue()

    repo = MockLessonRepository()
    storage = MockS3Client()
    scheduler = MockLessonIndexScheduler()
    use_case = ImportNotionLessonUseCase(repo, storage, scheduler)

    with pytest.raises(ValueError, match="No markdown file"):
        await use_case.execute(zip_bytes=zip_bytes)


@pytest.mark.asyncio
async def test_import_notion_lesson_update():
    # 1. Create a mock ZIP file
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w") as zf:
        md_content = "# Mask RCNN\nHọc máy và xử lý ngôn ngữ tự nhiên.\n"
        zf.writestr("Mask RCNN.md", md_content)
    zip_bytes = zip_buffer.getvalue()

    # 2. Setup mocks with an existing lesson
    existing_id = uuid4()
    existing_lesson = LessonEntity(
        id=existing_id,
        name="Old Name",
        description="Old Description",
        content_md="Old Content",
        order=5,
        slug="mask-rcnn",
        module_id=None,
        created_at=now_ict()
    )
    repo = MockLessonRepository()
    repo.lessons.append(existing_lesson)
    storage = MockS3Client()
    scheduler = MockLessonIndexScheduler()
    use_case = ImportNotionLessonUseCase(repo, storage, scheduler)

    # 3. Execute update by passing lesson_id
    updated_lesson = await use_case.execute(
        zip_bytes=zip_bytes,
        lesson_id=existing_id
    )

    # 4. Assertions
    assert updated_lesson.id == existing_id
    assert updated_lesson.name == "Mask RCNN"
    assert updated_lesson.slug == "mask-rcnn"  # It shouldn't conflict with itself and change to mask-rcnn-1
    assert updated_lesson.content_md == "# Mask RCNN\nHọc máy và xử lý ngôn ngữ tự nhiên.\n"
    assert len(repo.lessons) == 1  # No duplicate lesson created
