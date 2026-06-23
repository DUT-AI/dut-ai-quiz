from dataclasses import dataclass, asdict
from typing import Any
from uuid import UUID

from app.domain.entities.question import QuestionEntity


@dataclass(frozen=True)
class ShuffledOption:
    id: str
    text: str
    fixed: bool


@dataclass(frozen=True)
class ShuffledQuestion:
    question_id: str
    content: str
    options: list[ShuffledOption]
    tags: list[str]


@dataclass(frozen=True)
class ShuffledSnapshot:
    question_order: list[str]
    options: dict[str, list[str]]

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "ShuffledSnapshot":
        return cls(
            question_order=data.get("question_order", []),
            options=data.get("options", {}),
        )

    def reconstruct_presentation(
        self, questions_by_id: dict[UUID, QuestionEntity]
    ) -> list[ShuffledQuestion]:
        out = []
        for qid_str in self.question_order:
            qid = UUID(qid_str)
            q = questions_by_id.get(qid)
            if not q:
                continue
            order_ids = self.options.get(qid_str, [])
            opts_by_id = {str(o.id): o for o in q.options}
            shuffled_opts = []
            for oid in order_ids:
                o_data = opts_by_id.get(str(oid))
                if o_data:
                    shuffled_opts.append(
                        ShuffledOption(
                            id=str(o_data.id),
                            text=str(o_data.text),
                            fixed=bool(o_data.fixed),
                        )
                    )
            out.append(
                ShuffledQuestion(
                    question_id=qid_str,
                    content=q.content,
                    options=shuffled_opts,
                    tags=q.tags,
                )
            )
        return out


@dataclass(frozen=True)
class ShuffledExamResult:
    presentation: list[ShuffledQuestion]
    snapshot: ShuffledSnapshot
