import asyncio
import json
from unittest.mock import AsyncMock
from uuid import uuid4

import httpx
import pytest
from app.config import settings
from arq import Retry
from worker_evaluate_homework.application.use_cases.retry_stale_homework import (
    RetryStaleHomeworkUseCase,
)
from worker_evaluate_homework.domain import HomeworkRubric, SourceFile
from worker_evaluate_homework.domain.errors import ContextLimitError, LLMError
from worker_evaluate_homework.domain.models import (
    ChecklistEvaluation,
    ChunkEvidence,
    GradingCriterion,
)
from worker_evaluate_homework.infrastructure.archive_reader import _compact_training_output
from worker_evaluate_homework.infrastructure.gemini_grading_engine import (
    HomeworkGradingEngine,
    _pack_sources,
)
from worker_evaluate_homework.infrastructure.llm_clients import OpenAILLMClient
from worker_evaluate_homework.presentation.arq_tasks import evaluate_homework_job


def rubric():
    return HomeworkRubric(
        topic="Print",
        criteria=[
            GradingCriterion(
                id="print_output",
                criterion="Output",
                description="Print answer",
                weight=10,
            )
        ],
    )


def transport(handler, *, token_count=100, context=66816):
    def respond(request):
        body = json.loads(request.content) if request.content else {}
        path = request.url.path
        if path == "/props":
            return httpx.Response(200, json={"default_generation_settings": {"n_ctx": context}})
        if path == "/apply-template":
            assert body["chat_template_kwargs"] == {"enable_thinking": False}
            assert body["reasoning_effort"] == "none"
            return httpx.Response(200, json={"prompt": "CHAT:" + body["messages"][-1]["content"]})
        if path == "/tokenize":
            assert body["content"].startswith("CHAT:")
            assert body["add_special"] and body["parse_special"]
            return httpx.Response(200, json={"tokens": list(range(token_count))})
        return handler(request, body)

    return httpx.MockTransport(respond)


@pytest.mark.asyncio
async def test_native_tokenizer_prevents_oversized_generation():
    generated = []
    async with httpx.AsyncClient(
        transport=transport(
            lambda request, body: generated.append(body),
            token_count=70000,
        )
    ) as http:
        client = OpenAILLMClient(api_url="https://example.test/v1", http_client=http)
        with pytest.raises(ContextLimitError):
            await client.generate_structured("too long", ChecklistEvaluation)
    assert generated == []


@pytest.mark.asyncio
async def test_server_context_and_output_reserve_are_applied():
    sent = []

    def handler(request, body):
        sent.append(body)
        return httpx.Response(
            200,
            json={
                "choices": [
                    {
                        "finish_reason": "stop",
                        "message": {
                            "content": '{"evaluations": []}',
                        },
                    }
                ]
            },
        )

    async with httpx.AsyncClient(transport=transport(handler, context=8192)) as http:
        client = OpenAILLMClient(
            api_url="https://example.test/v1/chat/completions", http_client=http
        )
        await client.generate_structured("short", ChecklistEvaluation)
        assert (
            client.input_token_budget
            == 8192 - settings.homework_llm_max_output_tokens - settings.homework_llm_token_margin
        )
    assert sent[0]["max_tokens"] == settings.homework_llm_max_output_tokens
    assert sent[0]["response_format"] == {
        "type": "json_object",
        "schema": ChecklistEvaluation.model_json_schema(),
    }
    assert sent[0]["chat_template_kwargs"] == {"enable_thinking": False}
    assert sent[0]["reasoning_effort"] == "none"


@pytest.mark.asyncio
@pytest.mark.parametrize("status,retryable", [(400, False), (401, False), (429, True), (503, True)])
async def test_http_errors_have_explicit_retry_policy(status, retryable):
    async with httpx.AsyncClient(
        transport=transport(
            lambda request, body: httpx.Response(status, json={"error": {"message": "failure"}}),
        )
    ) as http:
        with pytest.raises(LLMError) as failure:
            await OpenAILLMClient(
                api_url="https://example.test/v1", http_client=http
            ).generate_structured("short", ChecklistEvaluation)
    assert failure.value.retryable is retryable


@pytest.mark.asyncio
async def test_provider_context_error_never_retries_and_refreshes_budget():
    async with httpx.AsyncClient(
        transport=transport(
            lambda request, body: httpx.Response(
                400,
                json={
                    "error": {"type": "exceed_context_size_error", "n_ctx": 8192},
                },
            )
        )
    ) as http:
        client = OpenAILLMClient(api_url="https://example.test/v1", http_client=http)
        with pytest.raises(ContextLimitError) as failure:
            await client.generate_structured("short", ChecklistEvaluation)
        assert not failure.value.retryable
        assert client.input_token_budget < 8192


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "content,reason", [('{"evaluations":[', "stop"), ('{"evaluations":[]}', "length"), ("", "stop")]
)
async def test_bad_json_and_truncated_response_are_bounded_retryable_errors(content, reason):
    async with httpx.AsyncClient(
        transport=transport(
            lambda request, body: httpx.Response(
                200,
                json={
                    "choices": [{"finish_reason": reason, "message": {"content": content}}],
                },
            )
        )
    ) as http:
        with pytest.raises(LLMError) as failure:
            await OpenAILLMClient(
                api_url="https://example.test/v1", http_client=http
            ).generate_structured("short", ChecklistEvaluation)
    assert failure.value.retryable


@pytest.mark.asyncio
async def test_missing_native_tokenizer_fails_closed():
    async with httpx.AsyncClient(
        transport=httpx.MockTransport(lambda request: httpx.Response(404))
    ) as http:
        with pytest.raises(LLMError, match="TOKENIZER_URL") as failure:
            await OpenAILLMClient(
                api_url="https://example.test/v1", http_client=http
            ).generate_structured("short", ChecklistEvaluation)
    assert not failure.value.retryable


@pytest.mark.asyncio
async def test_large_native_payload_is_split_before_network_request():
    requests = []

    def handler(request):
        requests.append(request)
        return httpx.Response(500)

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as http:
        client = OpenAILLMClient(api_url="https://example.test/v1", http_client=http)
        with pytest.raises(ContextLimitError, match="payload"):
            await client.generate_structured(
                "a" * (settings.homework_llm_max_tokenizer_bytes + 1), ChecklistEvaluation
            )
    assert not requests


class EvidenceClient:
    input_token_budget = 3200

    def __init__(self):
        self.fragments = []
        self.final_calls = 0
        self.merge_calls = 0

    async def count_tokens(self, prompt, system_instruction=""):
        return len(prompt) + len(system_instruction)

    async def generate_structured(self, prompt, schema, system_instruction=""):
        assert await self.count_tokens(prompt, system_instruction) <= self.input_token_budget
        if schema is ChunkEvidence:
            if "\nFRAGMENT:\n" in prompt:
                fragment = prompt.split("\nFRAGMENT:\n", 1)[1].split("\n", 1)[1]
                self.fragments.append(fragment)
            else:
                self.merge_calls += 1
            return ChunkEvidence(findings=[{"id": "print_output", "evidence": "observed " * 100}])
        self.final_calls += 1
        return ChecklistEvaluation(
            evaluations=[{"id": "print_output", "status": True, "description": "Combined evidence"}]
        )


@pytest.mark.asyncio
async def test_long_submission_reads_all_parts_and_scores_once(monkeypatch):
    monkeypatch.setattr(settings, "homework_grading_chunk_chars", 1000)
    source = SourceFile(name="main.py", content="# " + "a" * 11000 + "\nprint('tail evidence')\n")
    client = EvidenceClient()
    result = await HomeworkGradingEngine(client).grade(rubric(), [source])
    assert "".join(client.fragments) == source.content
    assert client.final_calls == 1
    assert client.merge_calls > 0
    assert result.score == 10
    assert len(result.score_details) == 1


@pytest.mark.asyncio
async def test_chunk_limit_fails_without_partial_grade(monkeypatch):
    monkeypatch.setattr(settings, "homework_grading_chunk_chars", 1000)
    monkeypatch.setattr(settings, "homework_grading_max_chunks", 1)
    client = EvidenceClient()
    with pytest.raises(ContextLimitError, match="nhiều lượt"):
        await HomeworkGradingEngine(client).grade(
            rubric(), [SourceFile(name="main.py", content="# " + "a" * 5000)]
        )
    assert client.final_calls == 0
    assert client.fragments == []


@pytest.mark.asyncio
async def test_fragments_are_split_again_when_exact_token_count_exceeds_budget(monkeypatch):
    monkeypatch.setattr(settings, "homework_grading_chunk_chars", 4000)
    client = EvidenceClient()
    client.input_token_budget = 2400

    async def generate(prompt, schema, system_instruction=""):
        assert await client.count_tokens(prompt, system_instruction) <= client.input_token_budget
        if schema is ChunkEvidence:
            client.fragments.append(prompt.split("\nFRAGMENT:\n", 1)[1].split("\n", 1)[1])
            return ChunkEvidence(findings=[{"id": "print_output", "evidence": "observed"}])
        client.final_calls += 1
        return ChecklistEvaluation(
            evaluations=[{"id": "print_output", "status": True, "description": "All parts read"}]
        )

    client.generate_structured = generate
    source = SourceFile(name="main.py", content="# " + "a" * 3000 + "\nprint(42)\n")
    result = await HomeworkGradingEngine(client).grade(rubric(), [source])
    assert "".join(client.fragments) == source.content
    assert len(client.fragments) > 1
    assert client.final_calls == 1 and result.score == 10


def test_pack_sources_retains_tail_and_later_files():
    sources = [
        SourceFile(name="a.py", content="#" + "a" * 210000),
        SourceFile(name="z.py", content="print('last')"),
    ]
    assert _pack_sources(sources).endswith("print('last')")


def test_compact_only_repetitive_training_logs_retains_final_metrics():
    output = (
        "".join(f"Epoch {i}/1000\nloss: 0.2 - accuracy: 0.9\n" for i in range(1, 1001))
        + "test_accuracy: 0.97\n"
    )
    compacted = _compact_training_output(output)
    assert len(compacted) < 6500
    assert "Epoch 1/1000" in compacted and "Epoch 1000/1000" in compacted
    assert "test_accuracy: 0.97" in compacted and "COMPACTED" in compacted
    ordinary = "important evidence\n" * 1000
    assert _compact_training_output(ordinary) == ordinary


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "error,job_try,should_retry",
    [
        (ContextLimitError("context exceeded"), 1, False),
        (LLMError("429", retryable=True), 1, True),
        (LLMError("429", retryable=True), 3, False),
        (ValueError("bug"), 1, False),
    ],
)
async def test_arq_retries_only_transient_failures(error, job_try, should_retry):
    use_case = AsyncMock()
    use_case.execute.side_effect = error
    expected = Retry if should_retry else type(error)
    with pytest.raises(expected):
        await evaluate_homework_job(
            {"evaluate_use_case": use_case, "job_try": job_try}, str(uuid4())
        )


@pytest.mark.asyncio
async def test_cron_does_not_count_deduplicated_jobs_as_new():
    repo = AsyncMock()
    repo.list_stale_homework_ids.return_value = [uuid4()]
    repo.list_stale_submission_ids.return_value = [uuid4()]
    redis = AsyncMock()
    redis.enqueue_job.return_value = None
    result = await RetryStaleHomeworkUseCase(repo, "arq:homework").execute(redis)
    assert result == {"homeworks_enqueued": 0, "submissions_enqueued": 0}


@pytest.mark.asyncio
async def test_cancelled_submission_saves_retry_metadata():
    from worker_evaluate_homework.application.use_cases.evaluate_submission import (
        EvaluateHomeworkSubmissionUseCase,
    )
    from worker_evaluate_homework.domain import HomeworkGradingRecord, SubmissionGradingRecord

    submission_id, homework_id = uuid4(), uuid4()
    repo, reader, engine = AsyncMock(), AsyncMock(), AsyncMock()
    repo.get_submission.return_value = SubmissionGradingRecord(
        submission_id, homework_id, 1, "sample.zip", "UPLOADED", None
    )
    repo.get_homework.return_value = HomeworkGradingRecord(
        homework_id, "sample", "", None, rubric().model_dump()
    )
    reader.read_submission_sources.side_effect = asyncio.CancelledError
    use_case = EvaluateHomeworkSubmissionUseCase(repo, reader, engine, AsyncMock(), 0.8)
    with pytest.raises(asyncio.CancelledError):
        await use_case.execute(submission_id, final_attempt=False)
    assert repo.save_submission_error.call_args.kwargs["retryable"] is True
