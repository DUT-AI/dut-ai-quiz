# Homework submission system

The homework feature is implemented natively in `dut-ai-quiz`. The quiz
database owns homework and submission records.

## Data model

- `homeworks`: prompt, deadline, attachment key, creator and archive timestamp.
- Every new homework belongs to one lesson through `homeworks.lesson_id`.
- `homework_submissions`: append-only submission attempts and grading results.
- `homework_submission_fingerprints`: source-code fingerprints used only to
  compare submissions for the same homework and flag likely plagiarism.

Manage user IDs are intentionally not foreign keys to the local `users` table.
Every authenticated user can view every homework for a lesson and submit
attempts. There is no per-user or per-team assignment table.

## Worker packages and queues

| Package | Redis queue | Responsibility |
| --- | --- | --- |
| `worker_hackathon` | `arq:hackathon` | Hackathon sandbox evaluation |
| `worker_lesson_index` | `arq:lesson-index` | Lesson embedding indexing |
| `worker_evaluate_homework` | `arq:homework` | Internal rubric generation, grading and plagiarism checks |

Run locally:

```bash
make worker-hackathon
make worker-lesson-index
make worker-evaluate-homework
```

Or start all services with `docker compose up`.

## Homework API

- `GET /api/v1/homeworks/me`
- `GET|POST /api/v1/homeworks`
- `PATCH|DELETE /api/v1/homeworks/{homework_id}`
- `POST /api/v1/homeworks/{homework_id}/submissions`
- `GET /api/v1/homeworks/{homework_id}/submission/me`
- `GET /api/v1/homeworks/{homework_id}/submissions`
- Download endpoints return short-lived presigned URLs.

Student homework is displayed inside the **Bài tập coding** tab on
`/lessons/{slug}`. The standalone `/homeworks` page redirects to `/lessons`.
Both list endpoints accept `lesson_id` as a query parameter; create and update
forms send `lesson_id` as multipart form data.

## Automatic grading

The homework worker is self-contained inside this repository. It reads
attachments and submissions from the existing S3-compatible storage, generates
a rubric with Gemini, performs static Python analysis, grades against a fixed
weighted checklist and stores source fingerprints for plagiarism comparison.
It does not execute submitted code.

Required configuration:

```dotenv
GEMINI_API_KEY=
HOMEWORK_GRADING_ENABLED=true
HOMEWORK_GRADING_MODEL=gemini-3.5-flash
```

Apply migrations before starting the worker:

```bash
cd apps/api
uv run alembic upgrade head
```

Then keep the homework worker running:

```powershell
.\scripts\start-worker.ps1 evaluate-homework
```

Creating or updating homework automatically queues rubric generation. The
generated rubric contains assignment-specific criteria and weights totaling 10
points; it is stored on that homework and reused for its submissions. Each new
submission automatically queues grading; no per-submission command is needed.
For predictable extraction, homework attachments must be PDF or ZIP containing
one PDF. Student submissions may use `.zip`, `.rar`, `.7z`, `.tar.gz`, or
`.gz`; archives must contain Python source files. A plain `.gz` is treated as
one compressed Python source file.

The worker validates archive paths, rejects links and password-protected
content, and limits entry count, Python file count, and total decompressed
source size. The Docker image includes the system tools required by `rarfile`;
ZIP, TAR.GZ, GZ, and 7Z are read by Python libraries without executing student
code.
