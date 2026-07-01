import random
from typing import Any
from uuid import UUID, uuid4

from fastapi import HTTPException

from app.core.datetime_utils import now_ict
from app.domain.entities.practice import PracticeSessionEntity
from app.domain.interfaces import (
    ILessonRepository,
    IPracticeSessionRepository,
    IQuestionRepository,
)
from app.domain.value_objects.gamification import ITEM_PRICES, GamificationItem
from app.infrastructure.persistence.models import (
    Difficulty,
    PoolType,
    PracticeSessionStatus,
)
from app.presentation.schemas.practice import (
    GamificationAnswerPatchIn,
    GamificationAnswerResultOut,
    GamificationStartIn,
    GamificationUseItemIn,
)


class StartGamificationSessionUseCase:
    def __init__(
        self, 
        ps_repo: IPracticeSessionRepository, 
        question_repo: IQuestionRepository,
        lesson_repo: ILessonRepository
    ):
        self._ps_repo = ps_repo
        self._question_repo = question_repo
        self._lesson_repo = lesson_repo

    async def execute(self, user_id: int, payload: GamificationStartIn) -> PracticeSessionEntity:
        # Find lesson by slug (name)
        lessons = await self._lesson_repo.list_all()
        target_lesson_id = None
        for lesson in lessons:
            # Simple slug comparison
            slug = lesson.name.lower().replace(" ", "-").replace("_", "-")
            if slug == payload.lesson_slug.lower().replace(" ", "-").replace("_", "-"):
                target_lesson_id = lesson.id
                break
        
        # We can still proceed even if target_lesson_id is None, it just won't filter by lesson.
        # But if the user provided a slug, we might want to restrict it or raise an error.
        # For safety, let's just use it to filter questions.
        
        questions = await self._question_repo.list_all(
            pool_type=PoolType.PRACTICE,
            lesson_id=target_lesson_id,
            offset=0,
            limit=1000,
        )
        
        # Check user's history to prioritize unseen questions
        history = await self._ps_repo.list_history(user_id)
        seen_question_ids = set()
        for session in history:
            if session.snapshot and "questions" in session.snapshot:
                for q in session.snapshot["questions"]:
                    if "id" in q:
                        seen_question_ids.add(q["id"])
                    
        def prioritize_and_limit(q_list, limit):
            unseen = [q for q in q_list if str(q.id) not in seen_question_ids]
            seen = [q for q in q_list if str(q.id) in seen_question_ids]
            random.shuffle(unseen)
            random.shuffle(seen)
            return (unseen + seen)[:limit]

        # Select questions for each tier
        easy_qs = [q for q in questions if q.difficulty == Difficulty.EASY]
        med_qs = [q for q in questions if q.difficulty == Difficulty.MEDIUM]
        hard_qs = [q for q in questions if q.difficulty == Difficulty.HARD]
        
        tier1_qs = prioritize_and_limit(easy_qs, 10)
        tier2_qs = prioritize_and_limit(med_qs, 5)
        tier3_qs = prioritize_and_limit(hard_qs, 5)
        

            

        def clean_options(options):
            cleaned = []
            for opt in options:
                o_dict = opt.to_dict()
                o_dict.pop("is_correct", None)
                cleaned.append(o_dict)
            return cleaned

        selected_questions = []
        
        for i, q in enumerate(tier1_qs):
            is_boss = (i == len(tier1_qs) - 1) and len(tier1_qs) > 0
            q_dict = {
                "id": str(q.id),
                "content": q.content,
                "options": clean_options(q.options),
                "time_limit": 30 if is_boss else 60,
                "time_response": 0,
                "tier": 1,
                "is_boss": is_boss
            }
            selected_questions.append(q_dict)

        for i, q in enumerate(tier2_qs):
            is_boss = (i == len(tier2_qs) - 1) and len(tier2_qs) > 0
            q_dict = {
                "id": str(q.id),
                "content": q.content,
                "options": clean_options(q.options),
                "time_limit": 60 if is_boss else 120,
                "time_response": 0,
                "tier": 2,
                "is_boss": is_boss
            }
            selected_questions.append(q_dict)

        for i, q in enumerate(tier3_qs):
            is_boss = (i == len(tier3_qs) - 1) and len(tier3_qs) > 0
            q_dict = {
                "id": str(q.id),
                "content": q.content,
                "options": clean_options(q.options),
                "time_limit": 120 if is_boss else 300,
                "time_response": 0,
                "tier": 3,
                "is_boss": is_boss
            }
            selected_questions.append(q_dict)
                
        snapshot = {
            "lesson_slug": payload.lesson_slug,
            "questions": selected_questions,
            "answers": {},
            "gamification": {
                "lives": 3,
                "gold": 0,
                "points": 0,
                "current_tier": 1,
                "last_question_index": 0,
                "boss_hp": 1 if (selected_questions and selected_questions[0].get("is_boss", False)) else 0,
                "shield_used_in_tier": {},
                "current_question_started_at": now_ict().isoformat()
            }
        }
        
        entity = PracticeSessionEntity(
            id=uuid4(),
            user_id=user_id,
            started_at=now_ict(),
            completed_at=None,
            status=PracticeSessionStatus.IN_PROGRESS,
            snapshot=snapshot,
            tags_filter=[payload.lesson_slug],
            question_limit=len(selected_questions),
        )
        return await self._ps_repo.add(entity)

class UseItemGamificationUseCase:
    def __init__(self, ps_repo: IPracticeSessionRepository, question_repo: IQuestionRepository):
        self._ps_repo = ps_repo
        self._question_repo = question_repo

    async def execute(self, session_id: UUID, user_id: int, payload: GamificationUseItemIn) -> dict[str, Any] | None:
        session = await self._ps_repo.get(session_id)
        if not session or session.user_id != user_id:
            raise HTTPException(status_code=404, detail="Practice session not found")
            
        if session.status != PracticeSessionStatus.IN_PROGRESS:
            raise HTTPException(status_code=400, detail="Session is not in progress")

        if not session.snapshot or "gamification" not in session.snapshot:
            raise HTTPException(status_code=400, detail="Not a gamified session")

        # Find current question
        questions = session.snapshot.get("questions", [])
        current_idx = session.snapshot["gamification"].get("last_question_index", 0)
        if current_idx >= len(questions):
            raise HTTPException(status_code=400, detail="All questions already answered")

        current_q = questions[current_idx]
        if current_q["id"] != str(payload.question_id):
            raise HTTPException(status_code=400, detail="Question ID does not match current question index")

        try:
            item = GamificationItem(payload.item_name.lower())
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid item: {payload.item_name}")

        is_boss = current_q.get("is_boss", False)
        price_multiplier = 2 if is_boss else 1
        price = ITEM_PRICES[item] * price_multiplier

        gold = session.snapshot["gamification"].get("gold", 0)
        if gold < price:
            raise HTTPException(status_code=400, detail="Not enough gold to use this item")

        # Process item
        result = {}
        if item == GamificationItem.MICROSCOPE:
            q_db = await self._question_repo.get(payload.question_id)
            if not q_db:
                raise HTTPException(status_code=404, detail="Question not found")
            
            correct_opt_id = None
            all_opt_ids = []
            for opt in q_db.options:
                all_opt_ids.append(opt.id)
                if opt.is_correct:
                    correct_opt_id = opt.id
            
            incorrect_opt_ids = [oid for oid in all_opt_ids if oid != correct_opt_id]
            if len(incorrect_opt_ids) >= 2:
                eliminated = random.sample(incorrect_opt_ids, 2)
            else:
                eliminated = incorrect_opt_ids
            
            result["eliminated_option_ids"] = eliminated
        elif item == GamificationItem.TIME_FREEZE:
            result["time_freeze_active"] = True
            
            from datetime import datetime, timedelta
            started_at_str = session.snapshot["gamification"].get("current_question_started_at")
            if started_at_str:
                started_at = datetime.fromisoformat(started_at_str)
                # Dời thời điểm bắt đầu lên 30s -> người dùng có thêm 30s để trả lời
                new_started_at = started_at + timedelta(seconds=30)
                session.snapshot["gamification"]["current_question_started_at"] = new_started_at.isoformat()
        else:
            raise HTTPException(status_code=400, detail=f"Item {item.value} must be activated when submitting your answer")

        # Deduct gold and save
        session.snapshot["gamification"]["gold"] = gold - price
        await self._ps_repo.save(session)
        
        result["gold"] = session.snapshot["gamification"]["gold"]
        return result


class PatchGamificationAnswerUseCase:
    def __init__(self, ps_repo: IPracticeSessionRepository, question_repo: IQuestionRepository):
        self._ps_repo = ps_repo
        self._question_repo = question_repo

    async def execute(self, session_id: UUID, user_id: int, payload: GamificationAnswerPatchIn) -> GamificationAnswerResultOut:
        session = await self._ps_repo.get(session_id)
        if not session or session.user_id != user_id:
            raise HTTPException(status_code=404, detail="Practice session not found")
            
        if session.status != PracticeSessionStatus.IN_PROGRESS:
            raise HTTPException(status_code=400, detail="Session is not in progress")

        if not session.snapshot or "gamification" not in session.snapshot:
            raise HTTPException(status_code=400, detail="Not a gamified session")

        # Find current question
        questions = session.snapshot.get("questions", [])
        current_idx = session.snapshot["gamification"].get("last_question_index", 0)
        if current_idx >= len(questions):
            raise HTTPException(status_code=400, detail="All questions already answered")

        current_q = questions[current_idx]
        if current_q["id"] != str(payload.question_id):
            raise HTTPException(status_code=400, detail="Question ID does not match current question index")

        # Verify answer correctness from DB
        q_db = await self._question_repo.get(payload.question_id)
        if not q_db:
            raise HTTPException(status_code=404, detail="Question not found")

        correct_opt_id = None
        for opt in q_db.options:
            if opt.is_correct:
                correct_opt_id = opt.id
                break

        is_correct = str(payload.option_id) == str(correct_opt_id)

        # Anti-cheat: Check if time limit exceeded
        from datetime import datetime
        from app.core.datetime_utils import now_ict
        
        started_at_str = session.snapshot["gamification"].get("current_question_started_at")
        if started_at_str:
            started_at = datetime.fromisoformat(started_at_str)
            elapsed = (now_ict() - started_at).total_seconds()
            time_limit = current_q.get("time_limit", 60)
            
            # Anti-cheat check: allow 10 seconds buffer for network latency/UI animations
            if elapsed > time_limit + 10.0:
                is_correct = False
                payload.time_response = float(time_limit)  # Max out the time response

        # Calculate item costs
        is_boss = current_q.get("is_boss", False)
        price_multiplier = 2 if is_boss else 1
        
        cost = 0
        current_tier = current_q.get("tier", 1)
        
        if payload.activate_double_points:
            cost += ITEM_PRICES[GamificationItem.DOUBLE_POINTS] * price_multiplier
        if payload.activate_shield:
            shield_used_in_tier = session.snapshot["gamification"].setdefault("shield_used_in_tier", {})
            if shield_used_in_tier.get(str(current_tier), False):
                raise HTTPException(status_code=400, detail=f"Shield already used in Tier {current_tier}")
            cost += ITEM_PRICES[GamificationItem.SHIELD] * price_multiplier

        gold = session.snapshot["gamification"].get("gold", 0)
        if gold < cost:
            raise HTTPException(status_code=400, detail="Not enough gold to activate items")

        # Deduct item costs
        gold -= cost
        session.snapshot["gamification"]["gold"] = gold

        # Record item usages
        if payload.activate_shield:
            session.snapshot["gamification"]["shield_used_in_tier"][str(current_tier)] = True

        # Calculate Points & Gold rewards
        points_gained = 0
        coins_gained = 0
        
        if is_correct:
            base_points = 10
            time_limit = current_q.get("time_limit", 60)
            speed_ratio = payload.time_response / time_limit if time_limit > 0 else 1.0
            
            speed_points_bonus = 0
            speed_gold_bonus = 0
            if speed_ratio <= 0.3:
                speed_points_bonus = 5
                speed_gold_bonus = 15
            elif speed_ratio <= 0.6:
                speed_points_bonus = 2
                speed_gold_bonus = 5
                
            points_gained = base_points + speed_points_bonus
            coins_gained = 20 + speed_gold_bonus
            
            if is_boss:
                points_gained *= 2
            if payload.activate_double_points:
                points_gained *= 2
                
            session.snapshot["gamification"]["points"] = session.snapshot["gamification"].get("points", 0) + points_gained
            session.snapshot["gamification"]["gold"] = session.snapshot["gamification"].get("gold", 0) + coins_gained
            
            if is_boss:
                session.snapshot["gamification"]["boss_hp"] = 0
        else:
            if payload.activate_shield:
                pass
            else:
                lives_lost = 2 if is_boss else 1
                current_lives = session.snapshot["gamification"].get("lives", 3)
                session.snapshot["gamification"]["lives"] = max(0, current_lives - lives_lost)

        # Record answer and time response
        session.snapshot["answers"][str(payload.question_id)] = str(payload.option_id)
        current_q["time_response"] = payload.time_response
        
        # Tự động cộng dồn tổng thời gian làm bài của toàn bộ session
        current_total_time = session.snapshot["gamification"].get("total_time_response", 0.0)
        session.snapshot["gamification"]["total_time_response"] = current_total_time + payload.time_response

        # Check if we are advancing to next tier
        next_idx = current_idx + 1
        session.snapshot["gamification"]["last_question_index"] = next_idx
        
        if next_idx < len(questions):
            next_q = questions[next_idx]
            if next_q["tier"] > current_tier:
                current_lives = session.snapshot["gamification"].get("lives", 0)
                if current_lives > 0:
                    session.snapshot["gamification"]["lives"] = min(5, current_lives + 2)
                    session.snapshot["gamification"]["current_tier"] = next_q["tier"]
            session.snapshot["gamification"]["boss_hp"] = 1 if next_q.get("is_boss", False) else 0
        else:
            session.snapshot["gamification"]["boss_hp"] = 0

        # Check game over conditions
        is_game_over = False
        if session.snapshot["gamification"].get("lives", 0) <= 0:
            is_game_over = True
            session.status = PracticeSessionStatus.COMPLETED
            session.completed_at = now_ict()
        elif next_idx >= len(questions):
            is_game_over = True
            session.status = PracticeSessionStatus.COMPLETED
            session.completed_at = now_ict()

        # Set started_at for next question
        session.snapshot["gamification"]["current_question_started_at"] = now_ict().isoformat()

        await self._ps_repo.save(session)

        return GamificationAnswerResultOut(
            is_correct=is_correct,
            points_gained=points_gained,
            coins_gained=coins_gained,
            updated_gamification=session.snapshot["gamification"],
            is_game_over=is_game_over
        )

