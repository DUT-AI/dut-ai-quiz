import random
from typing import Any
from uuid import UUID

from app.infrastructure.persistence.models import Question


def build_shuffled_exam_payload(
    questions_in_order: list[Question],
    seed: int,
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    rng = random.Random(seed)
    ordered = list(questions_in_order)
    rng.shuffle(ordered)
    snapshot: dict[str, Any] = {"question_order": [str(q.id) for q in ordered], "options": {}}
    presentation: list[dict[str, Any]] = []
    for q in ordered:
        opts = []
        for o in q.options:
            d = dict(o)
            d.pop("is_correct", None)
            opts.append(d)
        idx = list(range(len(opts)))
        rng.shuffle(idx)
        shuffled_opts = [opts[i] for i in idx]
        snapshot["options"][str(q.id)] = [o["id"] for o in shuffled_opts]
        presentation.append(
            {
                "question_id": str(q.id),
                "content": q.content,
                "options": shuffled_opts,
                "difficulty": q.difficulty.value,
                "tags": q.tags,
            }
        )
    return presentation, snapshot


def presentation_from_snapshot(
    questions_by_id: dict[UUID, Question],
    snapshot: dict[str, Any],
) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for qid_str in snapshot.get("question_order", []):
        qid = UUID(qid_str)
        q = questions_by_id[qid]
        order_ids = snapshot.get("options", {}).get(qid_str, [])
        opts_by_id = {str(o["id"]): o for o in q.options}
        shuffled_opts: list[dict[str, Any]] = []
        for oid in order_ids:
            o = dict(opts_by_id[str(oid)])
            o.pop("is_correct", None)
            shuffled_opts.append(o)
        out.append(
            {
                "question_id": qid_str,
                "content": q.content,
                "options": shuffled_opts,
                "difficulty": q.difficulty.value,
                "tags": q.tags,
            }
        )
    return out
