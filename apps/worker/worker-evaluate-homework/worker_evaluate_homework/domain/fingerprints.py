import ast
import hashlib
import io
import tokenize

from .models import SourceFile, StoredFingerprint


def build_fingerprint(source: SourceFile, k: int = 5) -> dict:
    normalized = _normalize_python(source.content)
    tokens = normalized.split()
    if len(tokens) < k:
        fingerprints = {_digest(normalized)} if normalized else set()
    else:
        fingerprints = {
            _digest(" ".join(tokens[index : index + k])) for index in range(len(tokens) - k + 1)
        }
    return {
        "file_name": source.name,
        "code_hash": _digest(normalized),
        "fingerprints": sorted(fingerprints),
    }


def find_plagiarism(
    current: list[dict],
    previous: list[StoredFingerprint],
) -> tuple[list[dict], float, int | None]:
    results: list[dict] = []
    candidate_user_ids = sorted({item.user_id for item in previous})
    candidate_weighted_scores = {user_id: 0.0 for user_id in candidate_user_ids}
    previous_by_file: dict[str, list[StoredFingerprint]] = {}
    for candidate in previous:
        previous_by_file.setdefault(candidate.file_name.casefold(), []).append(candidate)
    total_weight = sum(len(set(item["fingerprints"])) for item in current)

    for item in current:
        current_set = set(item["fingerprints"])
        best_file_score = 0.0
        best_file_user: int | None = None
        file_scores: dict[int, float] = {}
        for candidate in previous_by_file.get(item["file_name"].casefold(), []):
            candidate_set = set(candidate.fingerprints)
            denominator = min(len(current_set), len(candidate_set))
            score = len(current_set & candidate_set) / denominator if denominator else 0.0
            file_scores[candidate.user_id] = max(
                file_scores.get(candidate.user_id, 0.0),
                score,
            )

        for user_id in sorted(file_scores):
            user_file_score = file_scores[user_id]
            candidate_weighted_scores[user_id] += user_file_score * len(current_set)
            if user_file_score > best_file_score:
                best_file_score = user_file_score
                best_file_user = user_id

        results.append(
            {
                item["file_name"]: {
                    "best_user_id_match": (
                        str(best_file_user) if best_file_user is not None else None
                    ),
                    "score": {
                        "similarity_score": round(best_file_score, 4),
                    },
                }
            }
        )

    candidate_scores = {
        user_id: weighted_score / total_weight if total_weight else 0.0
        for user_id, weighted_score in candidate_weighted_scores.items()
    }
    best_user_id = max(
        candidate_user_ids,
        key=lambda user_id: candidate_scores[user_id],
        default=None,
    )
    best_score = candidate_scores.get(best_user_id, 0.0)
    if best_score == 0.0:
        best_user_id = None
    return results, best_score, best_user_id


def _normalize_python(code: str) -> str:
    try:
        tree = ast.parse(code)
        return ast.dump(tree, annotate_fields=False, include_attributes=False)
    except SyntaxError:
        result: list[str] = []
        try:
            for token in tokenize.generate_tokens(io.StringIO(code).readline):
                if token.type in {
                    tokenize.COMMENT,
                    tokenize.ENCODING,
                    tokenize.NL,
                    tokenize.NEWLINE,
                    tokenize.INDENT,
                    tokenize.DEDENT,
                }:
                    continue
                result.append(token.string)
        except (tokenize.TokenError, IndentationError):
            return " ".join(code.split())
        return " ".join(result)


def _digest(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()
