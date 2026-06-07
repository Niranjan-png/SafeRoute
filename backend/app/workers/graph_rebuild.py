"""
Celery task: Rebuild the in-memory road network graph.

Triggered after score refresh or on a weekly schedule.
Sends a signal to the API to reload the graph.
"""

import asyncio
import logging

import httpx

from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="app.workers.graph_rebuild.rebuild_graph", bind=True)
def rebuild_graph(self):
    """
    Rebuild the in-memory road network graph.

    This task signals the API service to rebuild its graph by hitting
    the internal rebuild endpoint. In production, this could use
    Redis pub/sub or direct function calls.
    """
    logger.info("🔄 Triggering graph rebuild...")

    async def _run():
        from app.core.routing.graph_builder import GraphBuilder
        from app.models.base import async_session_factory

        builder = GraphBuilder()
        async with async_session_factory() as db:
            graph = await builder.build_from_db(db)
            return graph.number_of_nodes(), graph.number_of_edges()

    try:
        nodes, edges = asyncio.run(_run())
        logger.info(f"✅ Graph rebuild complete: {nodes} nodes, {edges} edges")
        return {"status": "success", "nodes": nodes, "edges": edges}
    except Exception as e:
        logger.error(f"❌ Graph rebuild failed: {e}")
        raise self.retry(exc=e, countdown=300, max_retries=3)
