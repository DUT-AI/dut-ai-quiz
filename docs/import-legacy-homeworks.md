# Import legacy homework data

`apps/api/scripts/import_legacy_homeworks.py` imports the legacy DUT AI Manager
`homeworks.json` and `homework_submissions.json` exports into the current quiz
database.

The importer:

- maps legacy integer IDs to deterministic UUIDv5 values, so rerunning the same
  files does not create duplicates;
- imports deleted homeworks as archived and skips deleted or `NOT_SUBMITTED`
  submission rows without creating fake uploads;
- preserves legacy MinIO, Google Drive, and GitHub URLs so existing files remain
  downloadable without copying objects into the current S3 bucket;
- validates first and commits all changes in one transaction only with `--apply`;
- leaves `lesson_id` empty because the legacy export has no lesson relation.

Run from an API environment with `DATABASE_URL` set to the intended database:

```bash
# Validate only (default)
python -m scripts.import_legacy_homeworks \
  /path/to/homeworks.json \
  /path/to/homework_submissions.json

# Import after checking the printed database target and counts
python -m scripts.import_legacy_homeworks \
  /path/to/homeworks.json \
  /path/to/homework_submissions.json \
  --apply
```

The database must already be at the current Alembic head. On a fresh PostgreSQL
database, an administrator may need to run `CREATE EXTENSION IF NOT EXISTS
vector;` before `alembic upgrade head`, because the application role normally
does not have permission to create extensions.

After import, admins can see legacy homework on `/teacher/homeworks` under
"Bài học không xác định" and edit each item to assign it to a current lesson.
