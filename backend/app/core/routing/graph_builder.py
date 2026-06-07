"""
Graph Builder
"""
import networkx as nx
import logging
from scipy.spatial import cKDTree
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.models.base import async_session_factory

logger = logging.getLogger(__name__)


class GraphBuilder:
    def __init__(self):
        self.G = nx.DiGraph()
        self.kd_tree = None
        self.node_mapping = []
        self.node_coords = {}  # {node_id: (lat, lng)}

    def _build_kd_tree(self):
        """Build a KD-tree from node_coords for nearest-neighbor lookups."""
        if not self.node_coords:
            self.kd_tree = None
            self.node_mapping = []
            return

        self.node_mapping = list(self.node_coords.keys())
        coords = [self.node_coords[nid] for nid in self.node_mapping]
        self.kd_tree = cKDTree(coords)

    async def build_graph(self):
        async with async_session_factory() as db:
            logger.info("Loading nodes...")
            res = await db.execute(text("SELECT node_id, ST_Y(geom) as lat, ST_X(geom) as lng FROM nodes"))
            nodes = res.fetchall()

            for row in nodes:
                self.G.add_node(row.node_id, lat=row.lat, lng=row.lng)
                self.node_coords[row.node_id] = (row.lat, row.lng)

            self._build_kd_tree()

            logger.info("Loading edges...")
            res = await db.execute(text("""
                SELECT segment_id, start_node, end_node, length_m, safety_score,
                       cctv_score, crowd_score, lighting_score, emergency_score, crime_penalty, ST_AsGeoJSON(geom) as geojson
                FROM road_segments
            """))
            edges = res.fetchall()

            for row in edges:
                data = {
                    "segment_id": row.segment_id,
                    "distance_m": row.length_m,
                    "travel_time_s": row.length_m / 11.11,  # ~40km/h
                    "safety_score": row.safety_score,
                    "cctv_score": row.cctv_score,
                    "crowd_score": row.crowd_score,
                    "lighting_score": row.lighting_score,
                    "emergency_score": row.emergency_score,
                    "crime_penalty": row.crime_penalty,
                    "geojson": row.geojson,
                }
                self.G.add_edge(row.start_node, row.end_node, **data)

            logger.info(f"Graph loaded with {self.G.number_of_nodes()} nodes and {self.G.number_of_edges()} edges")

    def snap_to_nearest_node(self, lat: float, lng: float) -> int:
        if not self.kd_tree:
            return None
        dist, idx = self.kd_tree.query((lat, lng))
        return self.node_mapping[idx]
