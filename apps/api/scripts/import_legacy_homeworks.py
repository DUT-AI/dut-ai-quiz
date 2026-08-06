"""Import homework data exported from the legacy DUT AI Manager database.

The import is deterministic and safe to repeat: legacy integer IDs are mapped
to UUIDv5 values, and rows are upserted by those UUIDs.  The script defaults to
validation-only mode; pass ``--apply`` to commit a single database transaction.
"""

from __future__ import annotations

import argparse
import asyncio
import json
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any
from urllib.parse import unquote, urlsplit
from uuid import UUID, uuid5

from app.config import settings
from app.core.datetime_utils import VIETNAM_TZ
from app.infrastructure.persistence.models.homework import (
    Homework,
    HomeworkSubmission,
)
from sqlalchemy import inspect
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncConnection, create_async_engine

LEGACY_IMPORT_NAMESPACE = UUID("af739f4a-107d-4dd8-a045-90547326ba70")
REQUIRED_TABLES = {
    "homeworks",
    "homework_submissions",
}


@dataclass(frozen=True, slots=True)
class ImportPlan:
    homeworks: list[dict[str, Any]]
    submissions: list[dict[str, Any]]
    skipped_deleted_submissions: int
    skipped_empty_submissions: int


def legacy_uuid(kind: str, legacy_id: int) -> UUID:
    return uuid5(LEGACY_IMPORT_NAMESPACE, f"{kind}:{legacy_id}")


def load_json_rows(path: Path) -> list[dict[str, Any]]:
    try:
        payload = json.loads(path.read_text(encoding="utf-8-sig"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        raise ValueError(f"Cannot read valid JSON from {path}: {exc}") from exc
    if not isinstance(payload, list) or not all(
        isinstance(row, dict) for row in payload
    ):
        raise ValueError(f"{path} must contain a JSON array of objects")
    return payload


def require_fields(
    rows: list[dict[str, Any]],
    fields: set[str],
    *,
    source: str,
) -> None:
    for index, row in enumerate(rows):
        missing = fields - row.keys()
        if missing:
            raise ValueError(
                f"{source}[{index}] is missing fields: {sorted(missing)}"
            )


def parse_legacy_datetime(value: Any, *, field: str, row_id: int) -> datetime:
    if not isinstance(value, str):
        raise TypeError(f"Legacy row {row_id} has invalid {field}: {value!r}")
    try:
        parsed = datetime.fromisoformat(value)
    except ValueError as exc:
        raise ValueError(
            f"Legacy row {row_id} has invalid {field}: {value!r}"
        ) from exc
    if parsed.tzinfo is not None:
        parsed = parsed.astimezone(VIETNAM_TZ).replace(tzinfo=None)
    return parsed


def parse_json_list(value: Any, *, field: str, row_id: int) -> list[dict[str, Any]] | None:
    if value is None or value == "":
        return None
    try:
        parsed = json.loads(value) if isinstance(value, str) else value
    except json.JSONDecodeError as exc:
        raise ValueError(
            f"Legacy submission {row_id} has invalid JSON in {field}"
        ) from exc
    if parsed is None:
        return None
    if not isinstance(parsed, list) or not all(
        isinstance(item, dict) for item in parsed
    ):
        raise ValueError(
            f"Legacy submission {row_id} must contain a list of objects in {field}"
        )
    return parsed


def original_filename(link: str, legacy_id: int) -> str:
    parsed = urlsplit(link)
    filename = unquote(Path(parsed.path.rstrip("/")).name)
    if (
        not filename
        or filename.casefold() in {"view", "folders", "tree"}
        or not Path(filename).suffix
    ):
        host = parsed.hostname or "external"
        return f"legacy-submission-{legacy_id}-{host}.url"
    return filename[:255]


def submission_status(
    row: dict[str, Any],
    score_details: list[dict[str, Any]] | None,
    plagiarism_info: list[dict[str, Any]] | None,
) -> str:
    has_grading_result = any(
        (
            row.get("is_pass") is not None,
            row.get("score") is not None,
            bool(row.get("feedback")),
            bool(score_details),
            bool(plagiarism_info),
            bool(row.get("is_plagiarized")),
            row.get("plagiarized_from_user_id") is not None,
        )
    )
    return "GRADED" if has_grading_result else "UPLOADED"


def build_import_plan(
    legacy_homeworks: list[dict[str, Any]],
    legacy_submissions: list[dict[str, Any]],
) -> ImportPlan:
    require_fields(
        legacy_homeworks,
        {
            "id",
            "title",
            "description",
            "deadline",
            "file_url",
            "created_by",
            "created_at",
            "updated_at",
            "is_deleted",
        },
        source="homeworks",
    )
    require_fields(
        legacy_submissions,
        {
            "id",
            "homework_id",
            "owner_id",
            "link",
            "created_at",
            "is_late",
            "is_deleted",
            "is_pass",
            "score",
            "feedback",
            "score_details",
            "plagiarism_info",
            "is_plagiarized",
            "plagiarized_from_user_id",
        },
        source="homework_submissions",
    )

    homework_ids = [int(row["id"]) for row in legacy_homeworks]
    submission_ids = [int(row["id"]) for row in legacy_submissions]
    if len(set(homework_ids)) != len(homework_ids):
        raise ValueError("Duplicate legacy homework IDs found")
    if len(set(submission_ids)) != len(submission_ids):
        raise ValueError("Duplicate legacy submission IDs found")
    unknown_homeworks = {
        int(row["homework_id"]) for row in legacy_submissions
    } - set(homework_ids)
    if unknown_homeworks:
        raise ValueError(
            f"Submissions reference unknown homework IDs: {sorted(unknown_homeworks)}"
        )

    homeworks: list[dict[str, Any]] = []
    for row in legacy_homeworks:
        legacy_id = int(row["id"])
        created_at = parse_legacy_datetime(
            row["created_at"], field="created_at", row_id=legacy_id
        )
        updated_at = parse_legacy_datetime(
            row["updated_at"], field="updated_at", row_id=legacy_id
        )
        is_deleted = bool(row["is_deleted"])
        homeworks.append(
            {
                "id": legacy_uuid("homework", legacy_id),
                "lesson_id": None,
                "title": str(row["title"]).strip(),
                "description": str(row["description"] or ""),
                "deadline": parse_legacy_datetime(
                    row["deadline"], field="deadline", row_id=legacy_id
                ),
                # Keep legacy HTTP(S) resources as URLs. The homework download
                # use cases support both external URLs and native S3 keys.
                "attachment_key": str(row["file_url"]).strip() or None,
                "created_by": int(row["created_by"]),
                "created_at": created_at,
                "updated_at": updated_at,
                "archived_at": updated_at if is_deleted else None,
            }
        )

    attempts: defaultdict[tuple[int, int], int] = defaultdict(int)
    submissions: list[dict[str, Any]] = []
    skipped_deleted = 0
    skipped_empty = 0
    ordered_submissions = sorted(
        legacy_submissions,
        key=lambda row: (
            int(row["homework_id"]),
            int(row["owner_id"]),
            parse_legacy_datetime(
                row["created_at"],
                field="created_at",
                row_id=int(row["id"]),
            ),
            int(row["id"]),
        ),
    )
    for row in ordered_submissions:
        if row["is_deleted"]:
            skipped_deleted += 1
            continue
        link = str(row["link"] or "").strip()
        if not link:
            skipped_empty += 1
            continue
        legacy_id = int(row["id"])
        homework_id = int(row["homework_id"])
        owner_id = int(row["owner_id"])
        score_details = parse_json_list(
            row["score_details"], field="score_details", row_id=legacy_id
        )
        plagiarism_info = parse_json_list(
            row["plagiarism_info"], field="plagiarism_info", row_id=legacy_id
        )
        attempt_key = (homework_id, owner_id)
        attempts[attempt_key] += 1
        submissions.append(
            {
                "id": legacy_uuid("homework-submission", legacy_id),
                "homework_id": legacy_uuid("homework", homework_id),
                "user_id": owner_id,
                "object_key": link,
                "original_filename": original_filename(link, legacy_id),
                "submitted_at": parse_legacy_datetime(
                    row["created_at"], field="created_at", row_id=legacy_id
                ),
                "is_late": bool(row["is_late"]),
                "attempt_number": attempts[attempt_key],
                "status": submission_status(row, score_details, plagiarism_info),
                "is_pass": row["is_pass"],
                "score": float(row["score"]) if row["score"] is not None else None,
                "feedback": row["feedback"],
                "score_details": score_details,
                "plagiarism_info": plagiarism_info,
                "is_plagiarized": bool(row["is_plagiarized"]),
                "plagiarized_from_user_id": row["plagiarized_from_user_id"],
                "grading_error": None,
            }
        )

    return ImportPlan(
        homeworks=homeworks,
        submissions=submissions,
        skipped_deleted_submissions=skipped_deleted,
        skipped_empty_submissions=skipped_empty,
    )


async def assert_schema_ready(connection: AsyncConnection) -> None:
    table_names = await connection.run_sync(
        lambda sync_connection: set(inspect(sync_connection).get_table_names())
    )
    missing = REQUIRED_TABLES - table_names
    if missing:
        raise RuntimeError(
            f"Database is not migrated; missing tables: {sorted(missing)}"
        )


async def apply_import(plan: ImportPlan, database_url: str) -> None:
    engine = create_async_engine(database_url)
    try:
        async with engine.begin() as connection:
            await assert_schema_ready(connection)

            homework_insert = insert(Homework).values(plan.homeworks)
            await connection.execute(
                homework_insert.on_conflict_do_update(
                    index_elements=[Homework.id],
                    set_={
                        column.name: getattr(homework_insert.excluded, column.name)
                        for column in Homework.__table__.columns
                        if column.name != "id"
                    },
                )
            )

            if plan.submissions:
                submission_insert = insert(HomeworkSubmission).values(
                    plan.submissions
                )
                await connection.execute(
                    submission_insert.on_conflict_do_update(
                        index_elements=[HomeworkSubmission.id],
                        set_={
                            column.name: getattr(
                                submission_insert.excluded, column.name
                            )
                            for column in HomeworkSubmission.__table__.columns
                            if column.name != "id"
                        },
                    )
                )
    finally:
        await engine.dispose()


def masked_database_target(database_url: str) -> str:
    parsed = urlsplit(database_url.replace("+asyncpg", ""))
    host = parsed.hostname or "unknown-host"
    port = f":{parsed.port}" if parsed.port else ""
    return f"{parsed.username or 'unknown-user'}@{host}{port}{parsed.path}"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("homeworks_json", type=Path)
    parser.add_argument("homework_submissions_json", type=Path)
    parser.add_argument(
        "--database-url",
        default=settings.database_url,
        help="SQLAlchemy async PostgreSQL URL (defaults to DATABASE_URL)",
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Commit the import; without this flag only validate and summarize",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    plan = build_import_plan(
        load_json_rows(args.homeworks_json),
        load_json_rows(args.homework_submissions_json),
    )
    print(f"Database target: {masked_database_target(args.database_url)}")
    print(f"Homeworks: {len(plan.homeworks)}")
    print(f"Submissions: {len(plan.submissions)}")
    print(
        "Skipped submission rows: "
        f"{plan.skipped_deleted_submissions} deleted, "
        f"{plan.skipped_empty_submissions} without a file/link"
    )
    if not args.apply:
        print("Validation passed. No database changes made; use --apply to import.")
        return
    asyncio.run(apply_import(plan, args.database_url))
    print("Import committed successfully.")


if __name__ == "__main__":
    main()
