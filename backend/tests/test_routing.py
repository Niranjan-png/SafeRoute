"""
Tests for the routing engine — Dijkstra, Yen's K-Shortest, cost function.
"""

from datetime import datetime

import networkx as nx
import pytest

from app.core.routing.cost_function import edge_cost
from app.core.routing.dijkstra import dijkstra_safest_route
from app.core.routing.graph_builder import GraphBuilder
from app.core.routing.yen_k_shortest import yen_k_shortest_paths
from app.core.scoring.score_engine import SafetyScoreEngine


class TestCostFunction:
    """Test the edge cost computation."""

    def test_safe_edge_has_low_cost(self):
        """A very safe edge should have lower cost than an unsafe one."""
        safe_edge = {"safety_score": 95, "distance_m": 100, "travel_time_s": 10}
        unsafe_edge = {"safety_score": 20, "distance_m": 100, "travel_time_s": 10}
        timestamp = datetime(2024, 1, 15, 14, 0)  # 2 PM — multiplier = 1.0

        safe_cost = edge_cost(safe_edge, timestamp)
        unsafe_cost = edge_cost(unsafe_edge, timestamp)

        assert safe_cost < unsafe_cost

    def test_nighttime_increases_cost(self):
        """Same edge should have higher cost at night due to multiplier."""
        edge = {"safety_score": 70, "distance_m": 200, "travel_time_s": 30}
        daytime = datetime(2024, 1, 15, 14, 0)    # 2 PM — multiplier = 1.0
        midnight = datetime(2024, 1, 15, 2, 0)     # 2 AM — multiplier = 0.65

        day_cost = edge_cost(edge, daytime)
        night_cost = edge_cost(edge, midnight)

        assert night_cost > day_cost

    def test_cost_weights_sum_to_one(self):
        """Alpha + beta + gamma should sum to 1.0 for proper normalization."""
        assert abs(0.5 + 0.3 + 0.2 - 1.0) < 1e-10

    def test_zero_distance_edge(self):
        """Edge with zero distance should still compute a valid cost."""
        edge = {"safety_score": 50, "distance_m": 0, "travel_time_s": 0}
        timestamp = datetime(2024, 1, 15, 14, 0)
        cost = edge_cost(edge, timestamp)
        assert cost >= 0
        assert cost < float("inf")


class TestTimeMultiplier:
    """Test time-of-day safety multipliers."""

    def test_daytime_is_one(self):
        """8 AM to 8 PM should have a multiplier of 1.0."""
        for hour in range(8, 20):
            ts = datetime(2024, 1, 15, hour, 0)
            assert SafetyScoreEngine.time_multiplier(ts) == 1.0

    def test_deep_night_is_lowest(self):
        """Midnight to 5 AM should have the lowest multiplier (0.65)."""
        for hour in range(0, 5):
            ts = datetime(2024, 1, 15, hour, 0)
            assert SafetyScoreEngine.time_multiplier(ts) == 0.65

    def test_late_evening(self):
        """10 PM to midnight should have 0.70 multiplier."""
        for hour in range(22, 24):
            ts = datetime(2024, 1, 15, hour, 0)
            assert SafetyScoreEngine.time_multiplier(ts) == 0.70


class TestDijkstra:
    """Test Dijkstra's shortest path algorithm."""

    def _build_test_graph(self):
        """Build a small test graph with known safety scores."""
        G = nx.DiGraph()
        # Nodes
        for i in range(1, 6):
            G.add_node(i, lat=12.9 + i * 0.01, lng=77.6 + i * 0.01)

        # Edges: 1→2→5 (safe route, longer)
        G.add_edge(1, 2, segment_id=1, distance_m=500, travel_time_s=60,
                    safety_score=90, geojson=None)
        G.add_edge(2, 5, segment_id=2, distance_m=800, travel_time_s=100,
                    safety_score=85, geojson=None)

        # Edges: 1→3→5 (unsafe route, shorter)
        G.add_edge(1, 3, segment_id=3, distance_m=300, travel_time_s=40,
                    safety_score=20, geojson=None)
        G.add_edge(3, 5, segment_id=4, distance_m=400, travel_time_s=50,
                    safety_score=15, geojson=None)

        # Edges: 1→4→5 (medium safety, medium distance)
        G.add_edge(1, 4, segment_id=5, distance_m=400, travel_time_s=50,
                    safety_score=60, geojson=None)
        G.add_edge(4, 5, segment_id=6, distance_m=500, travel_time_s=60,
                    safety_score=55, geojson=None)

        return G

    def test_finds_safest_route(self):
        """Dijkstra should prefer the safer route over the shorter one."""
        G = self._build_test_graph()
        timestamp = datetime(2024, 1, 15, 14, 0)

        result = dijkstra_safest_route(
            G, 1, 5, timestamp, alpha=0.8, beta=0.1, gamma=0.1
        )
        assert result is not None
        path, cost = result

        # With high alpha (safety weight), should choose 1→2→5 (safest)
        assert path == [1, 2, 5]

    def test_shortest_when_distance_weighted(self):
        """With high distance weight, Dijkstra should prefer shorter routes."""
        G = self._build_test_graph()
        timestamp = datetime(2024, 1, 15, 14, 0)

        result = dijkstra_safest_route(
            G, 1, 5, timestamp, alpha=0.1, beta=0.8, gamma=0.1
        )
        assert result is not None
        path, cost = result

        # With high beta (distance weight), should choose 1→3→5 (shortest)
        assert path == [1, 3, 5]

    def test_no_path_returns_none(self):
        """Should return None when no path exists."""
        G = nx.DiGraph()
        G.add_node(1)
        G.add_node(2)
        # No edges

        result = dijkstra_safest_route(
            G, 1, 2, datetime(2024, 1, 15, 14, 0)
        )
        assert result is None

    def test_invalid_node_returns_none(self):
        """Should return None for non-existent nodes."""
        G = self._build_test_graph()
        result = dijkstra_safest_route(
            G, 1, 99, datetime(2024, 1, 15, 14, 0)
        )
        assert result is None


class TestYenKShortest:
    """Test Yen's K-Shortest Paths algorithm."""

    def _build_test_graph(self):
        """Build a test graph with multiple possible paths."""
        G = nx.DiGraph()
        for i in range(1, 7):
            G.add_node(i, lat=12.9 + i * 0.01, lng=77.6 + i * 0.01)

        # Path 1: 1→2→5 (safest)
        G.add_edge(1, 2, segment_id=1, distance_m=500, travel_time_s=60,
                    safety_score=90, geojson=None)
        G.add_edge(2, 5, segment_id=2, distance_m=800, travel_time_s=100,
                    safety_score=85, geojson=None)

        # Path 2: 1→3→5 (shortest but unsafe)
        G.add_edge(1, 3, segment_id=3, distance_m=300, travel_time_s=40,
                    safety_score=20, geojson=None)
        G.add_edge(3, 5, segment_id=4, distance_m=400, travel_time_s=50,
                    safety_score=15, geojson=None)

        # Path 3: 1→4→5 (medium)
        G.add_edge(1, 4, segment_id=5, distance_m=400, travel_time_s=50,
                    safety_score=60, geojson=None)
        G.add_edge(4, 5, segment_id=6, distance_m=500, travel_time_s=60,
                    safety_score=55, geojson=None)

        # Path 4: 1→2→6→5 (alternate via 6)
        G.add_edge(2, 6, segment_id=7, distance_m=300, travel_time_s=35,
                    safety_score=70, geojson=None)
        G.add_edge(6, 5, segment_id=8, distance_m=400, travel_time_s=45,
                    safety_score=75, geojson=None)

        return G

    def test_returns_k_paths(self):
        """Should return up to K distinct paths."""
        G = self._build_test_graph()
        timestamp = datetime(2024, 1, 15, 14, 0)

        paths = yen_k_shortest_paths(G, 1, 5, timestamp, k=3)
        assert len(paths) >= 2  # At least 2 distinct paths
        assert len(paths) <= 3

    def test_paths_are_sorted_by_cost(self):
        """Returned paths should be sorted by total cost ascending."""
        G = self._build_test_graph()
        timestamp = datetime(2024, 1, 15, 14, 0)

        paths = yen_k_shortest_paths(G, 1, 5, timestamp, k=3)
        costs = [cost for _, cost in paths]
        assert costs == sorted(costs)

    def test_first_path_is_optimal(self):
        """The first path should be the same as Dijkstra's result."""
        G = self._build_test_graph()
        timestamp = datetime(2024, 1, 15, 14, 0)

        yen_paths = yen_k_shortest_paths(G, 1, 5, timestamp, k=3)
        dijkstra_result = dijkstra_safest_route(G, 1, 5, timestamp)

        assert yen_paths[0][0] == dijkstra_result[0]

    def test_paths_are_different(self):
        """Returned paths should be distinct (no duplicates)."""
        G = self._build_test_graph()
        timestamp = datetime(2024, 1, 15, 14, 0)

        paths = yen_k_shortest_paths(G, 1, 5, timestamp, k=3)
        path_lists = [tuple(p) for p, _ in paths]
        assert len(set(path_lists)) == len(path_lists)


class TestGraphBuilder:
    """Test the graph builder utilities."""

    def test_snap_to_nearest_node(self):
        """KD-tree should snap to the closest node."""
        builder = GraphBuilder()
        builder.node_coords = {
            1: (12.9352, 77.6245),  # Koramangala
            2: (12.9784, 77.6408),  # Indiranagar
            3: (12.9563, 77.6013),  # MG Road
        }
        builder._build_kd_tree()

        # Snap to a point very close to Koramangala
        result = builder.snap_to_nearest_node(12.9355, 77.6240)
        assert result == 1  # Should snap to Koramangala node

    def test_snap_returns_none_when_empty(self):
        """Should return None if graph has no nodes."""
        builder = GraphBuilder()
        result = builder.snap_to_nearest_node(12.9, 77.6)
        assert result is None
