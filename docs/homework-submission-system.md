# Homework submission system

The homework feature is implemented natively in `dut-ai-quiz`. DUT Manager is
the source of user and team identities; the quiz database owns homework,
assignment, and submission records.

## Data model

- `homeworks`: prompt, deadline, attachment key, creator and archive timestamp.
- Every new homework belongs to one lesson through `homeworks.lesson_id`.
- `homework_assignments`: assignment membership by Manage user ID.
- `homework_submissions`: append-only submission attempts and grading results.

Manage user IDs are intentionally not foreign keys to the local `users` table.
Only `service_a` (DUT Manager) identities can use homework endpoints.

## Worker packages and queues

| Package | Redis queue | Responsibility |
| --- | --- | --- |
| `worker_hackathon` | `arq:hackathon` | Hackathon sandbox evaluation |
| `worker_lesson_index` | `arq:lesson-index` | Lesson embedding indexing |
| `worker_evaluate_homework` | `arq:homework` | Homework registration and grading API calls |

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
- `GET /api/v1/homeworks/{homework_id}/unsubmitted`
- Download endpoints return short-lived presigned URLs.

Student homework is displayed inside the **Bài tập coding** tab on
`/lessons/{slug}`. The standalone `/homeworks` page redirects to `/lessons`.
Both list endpoints accept `lesson_id` as a query parameter; create and update
forms send `lesson_id` as multipart form data.

## Required configuration

Storage uses the existing `S3_*` variables. Automatic grading is enabled only
when these URLs are configured:

```dotenv
HOMEWORK_CHECKER_API_URL=
SUBMISSION_CHECKER_API_URL=
```

Without those URLs, creation and submission still work; new submissions remain
in `UPLOADED` and are not sent to a grader.
