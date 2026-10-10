import json
from pathlib import Path

from scripts.import_legacy_homeworks import (
    build_import_plan,
    legacy_uuid,
    load_legacy_data,
    original_filename,
    parse_bool,
    parse_optional_bool,
    parse_optional_float,
    parse_optional_int,
)


def test_parsing_helpers() -> None:
    assert parse_bool("true") is True
    assert parse_bool("false") is False
    assert parse_bool(True) is True
    assert parse_bool(False) is False
    assert parse_bool("0") is False
    assert parse_bool("1") is True

    assert parse_optional_bool(None) is None
    assert parse_optional_bool("") is None
    assert parse_optional_bool("true") is True
    assert parse_optional_bool("false") is False

    assert parse_optional_int(None) is None
    assert parse_optional_int("") is None
    assert parse_optional_int("42") == 42
    assert parse_optional_int(42) == 42

    assert parse_optional_float(None) is None
    assert parse_optional_float("") is None
    assert parse_optional_float("8.5") == 8.5
    assert parse_optional_float(8) == 8.0


def test_build_import_plan_preserves_legacy_data_and_is_deterministic() -> None:
    homeworks = [
        {
            "id": 7,
            "title": "Legacy homework",
            "description": "Description",
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
    assert "deadline" not in plan.homeworks[0]
    assert plan.homeworks[0]["attachment_key"].startswith("https://")
    assert len(plan.submissions) == 1
    assert plan.submissions[0]["status"] == "GRADED"
    assert plan.submissions[0]["score"] == 8.0
    assert plan.submissions[0]["score_details"][0]["criterion"] == "tests"
    assert plan.skipped_deleted_submissions == 1
    assert plan.skipped_empty_submissions == 1


def test_build_import_plan_with_v2_string_types() -> None:
    homeworks = [
        {
            "id": "3",
            "title": "MLP v2",
            "description": "Desc v2",
            "file_url": "https://minio.example/file.zip",
            "created_by": "1",
            "created_at": "2026-01-14 11:37:31.460498",
            "updated_at": "2026-02-16 21:36:33.981870",
            "is_deleted": "false",
        }
    ]
    submissions = [
        {
            "id": "150",
            "homework_id": "3",
            "owner_id": "2",
            "link": "https://minio.example/sub.zip",
            "created_at": "2026-01-14 11:37:31.465597",
            "is_late": "true",
            "is_deleted": "false",
            "is_pass": None,
            "score": None,
            "feedback": None,
            "score_details": None,
            "plagiarism_info": None,
            "is_plagiarized": "false",
            "plagiarized_from_user_id": None,
        }
    ]
    plan = build_import_plan(homeworks, submissions)
    assert plan.homeworks[0]["id"] == legacy_uuid("homework", 3)
    assert plan.homeworks[0]["created_by"] == 1
    assert len(plan.submissions) == 1
    assert plan.submissions[0]["is_late"] is True
    assert plan.submissions[0]["is_plagiarized"] is False
    assert plan.submissions[0]["status"] == "UPLOADED"


def test_load_legacy_data_combined_dict(tmp_path: Path) -> None:
    combined_file = tmp_path / "combined.json"
    combined_file.write_text(
        json.dumps(
            {
                "public.homeworks": [
                    {
                        "id": "1",
                        "title": "H1",
                        "description": "",
                        "file_url": "",
                        "created_by": "1",
                        "created_at": "2026-01-01 00:00:00",
                        "updated_at": "2026-01-01 00:00:00",
                        "is_deleted": "false",
                    }
                ],
                "public.homework_submissions": [],
            }
        ),
        encoding="utf-8",
    )
    hw, sub = load_legacy_data(combined_file)
    assert len(hw) == 1
    assert len(sub) == 0


def test_external_folder_link_gets_safe_display_filename() -> None:
    assert (
        original_filename("https://drive.google.com/drive/folders/abc123", 42)
        == "legacy-submission-42-drive.google.com.url"
    )
