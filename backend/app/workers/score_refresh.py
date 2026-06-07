"""
Celery task: Refresh safety scores for all road segments.

Runs nightly at 2 AM IST via Celery Beat.
"""

import asyncio
import logging

from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="app.workers.score_refresh.refresh_all_scores", bind=True)
def refresh_all_scores(self):
    """
    Refresh safety scores for all road segments.

    This task runs synchronously in the Celery worker but uses asyncio
    internally to interact with the async database and score engine.
    """
    logger.info("🔄 Starting nightly safety score refresh...")

    async def _run():
        from app.core.scoring.score_engine import SafetyScoreEngine
        from app.models.base import async_session_factory

        engine = SafetyScoreEngine()
        async with async_session_factory() as db:
            total = await engine.refresh_all_scores(db)
            await db.commit()
            return total

    try:
        total = asyncio.run(_run())
        logger.info(f"✅ Score refresh complete. Updated {total} segments.")
        return {"status": "success", "segments_updated": total}
    except Exception as e:
        logger.error(f"❌ Score refresh failed: {e}")
        raise self.retry(exc=e, countdown=300, max_retries=3)
