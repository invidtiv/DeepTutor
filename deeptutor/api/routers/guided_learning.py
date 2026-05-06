"""Guided Learning API Router."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from deeptutor.learning.models import QuizAttempt
from deeptutor.learning.scheduler import SpacedRepetitionScheduler
from deeptutor.learning.service import LearningService
from deeptutor.learning.storage import LearningStore

router = APIRouter()

_store = LearningStore()
_service = LearningService(_store)
_scheduler = SpacedRepetitionScheduler()


def get_learning_service() -> LearningService:
    return _service


def get_scheduler() -> SpacedRepetitionScheduler:
    return _scheduler


# ── Request models ───────────────────────────────────────────────────────────


class AnswerRequest(BaseModel):
    question_id: str
    knowledge_point_id: str
    module_id: str = ""
    is_correct: bool
    user_answer: str | None = None
    error_type: str | None = None
    self_attribution: str = ""


# ── Endpoints ────────────────────────────────────────────────────────────────


@router.get("/progress/{book_id}")
async def get_progress(book_id: str):
    service = get_learning_service()
    progress = service.get_or_create(book_id)
    return progress.model_dump()


@router.post("/progress/{book_id}/answer")
async def submit_answer(book_id: str, body: AnswerRequest):
    service = get_learning_service()
    scheduler = get_scheduler()

    progress = service.get_or_create(book_id)

    attempt = QuizAttempt(
        question_id=body.question_id,
        knowledge_point_id=body.knowledge_point_id,
        module_id=body.module_id,
        is_correct=body.is_correct,
        user_answer=body.user_answer,
        error_type=body.error_type,
        self_attribution=body.self_attribution,
    )
    service.record_quiz_attempt(progress, attempt)

    # Update spaced repetition state
    kp_type = progress.knowledge_types.get(attempt.knowledge_point_id)
    if kp_type is not None:
        state = progress.repetition_states.get(attempt.knowledge_point_id)
        if state is not None:
            scheduler.schedule_next(state, kp_type, attempt.is_correct)

    # Update mastery estimate
    if attempt.mastery_estimate > 0:
        service.update_mastery(progress, attempt.knowledge_point_id, attempt.mastery_estimate)

    service.save(progress)
    return progress.model_dump()


@router.get("/progress/{book_id}/reviews")
async def get_reviews(book_id: str):
    service = get_learning_service()
    scheduler = get_scheduler()

    progress = service.get_or_create(book_id)
    tasks = scheduler.get_due_tasks(progress)
    return {"tasks": [t.model_dump() for t in tasks]}
