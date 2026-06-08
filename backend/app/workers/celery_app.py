"""
Celery application configuration for SafeRoute Bengaluru.

Configures the Celery worker with Redis broker and periodic task schedule.
"""

from celery import Celery
from celery.schedules import crontab

from app.config import settings

celery_app = Celery(
    "saferoute",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=[
        "app.workers.score_refresh",
        "app.workers.crime_ingest",
        "app.workers.graph_rebuild",
    ],
)

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Kolkata",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)

# Periodic task schedule (Celery Beat)
celery_app.conf.beat_schedule = {
    # Refresh safety scores every night at 2 AM IST
    "nightly-score-refresh": {
        "task": "app.workers.score_refresh.refresh_all_scores",
        "schedule": crontab(hour=2, minute=0),
    },
    # Ingest new crime data every 6 hours
    "crime-data-ingest": {
        "task": "app.workers.crime_ingest.ingest_crime_data",
        "schedule": crontab(hour="*/6", minute=15),
    },
    # Rebuild graph weekly on Sunday at 3 AM IST
    "weekly-graph-rebuild": {
        "task": "app.workers.graph_rebuild.rebuild_graph",
        "schedule": crontab(hour=3, minute=0, day_of_week=0),
    },
}
