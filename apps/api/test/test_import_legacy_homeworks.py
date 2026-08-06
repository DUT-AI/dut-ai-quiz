from scripts.import_legacy_homeworks import (
    build_import_plan,
    legacy_uuid,
    original_filename,
)


def test_build_import_plan_preserves_legacy_data_and_is_deterministic() -> None:
    homeworks = [
        {
            "id": 7,
            "title": "Legacy homework",
            "description": "Description",
            "deadline": "2026-08-01 12:00:00",
            "file_url": "https://legacy.example/bucket/homework.pdf",
            "created_by": 12,
            "created_at": "2026-07-01 10:00:00",
            "updated_at": "2026-07-02 10:00:00",
            "is_deleted": False,
        }
    ]
    submissions = [
        {
            "id": 21,
            "homework_id": 7,
            "owner_id": 99,
            "link": "",
            "created_at": "2026-07-03 10:00:00",
            "is_late": False,
            "is_deleted": False,
            "is_pass": None,
            "score": None,
            "feedback": None,
            "score_details": None,
            "plagiarism_info": None,
            "is_plagiarized": False,
            "plagiarized_from_user_id": None,
        },
        {
            "id": 22,
            "homework_id": 7,
            "owner_id": 100,
            "link": "https://legacy.example/submissions/result.zip",
            "created_at": "2026-07-04 10:00:00",
            "is_late": True,
            "is_deleted": False,
            "is_pass": True,
            "score": 8,
            "feedback": "Good",
            "score_details": '[{"criterion": "tests", "score": 8}]',
            "plagiarism_info": "[]",
            "is_plagiarized": False,
            "plagiarized_from_user_id": None,
        },
        {
            "id": 23,
            "homework_id": 7,
            "owner_id": 101,
            "link": "https://legacy.example/submissions/deleted.zip",
            "created_at": "2026-07-04 11:00:00",
            "is_late": False,
            "is_deleted": True,
            "is_pass": None,
            "score": None,
            "feedback": None,
            "score_details": None,
            "plagiarism_info": None,
            "is_plagiarized": False,
            "plagiarized_from_user_id": None,
        },
    ]

    plan = build_import_plan(homeworks, submissions)

    assert plan.homeworks[0]["id"] == legacy_uuid("homework", 7)
    assert plan.homeworks[0]["lesson_id"] is None
    assert plan.homeworks[0]["attachment_key"].startswith("https://")
    assert len(plan.submissions) == 1
    assert plan.submissions[0]["status"] == "GRADED"
    assert plan.submissions[0]["score"] == 8.0
    assert plan.submissions[0]["score_details"][0]["criterion"] == "tests"
    assert plan.skipped_deleted_submissions == 1
    assert plan.skipped_empty_submissions == 1


def test_external_folder_link_gets_safe_display_filename() -> None:
    assert original_filename(
        "https://drive.google.com/drive/folders/abc123", 42
    ) == "legacy-submission-42-drive.google.com.url"
