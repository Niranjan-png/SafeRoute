"""
Graph Builder
"""
import networkx as nx
import logging
import random
import json
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
        try:
            async with async_session_factory() as db:
                logger.info("Loading nodes...")
                res = await db.execute(text("SELECT node_id, ST_Y(geom) as lat, ST_X(geom) as lng FROM nodes"))
                nodes = res.fetchall()
                if not nodes:
                    raise Exception("No nodes found in database")

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
        except Exception as e:
            logger.error(f"Failed to load graph from database: {e}. Building in-memory synthetic fallback graph...")
            self.build_synthetic_graph()

    def build_synthetic_graph(self):
        random.seed(42)
        self.G = nx.DiGraph()
        self.node_coords = {}
        
        neighborhoods = {
            "Koramangala": {"center": (12.9352, 77.6245), "grid": 8, "safety_base": 72},
            "Indiranagar": {"center": (12.9784, 77.6408), "grid": 8, "safety_base": 78},
            "MG Road": {"center": (12.9756, 77.6068), "grid": 6, "safety_base": 65},
            "Whitefield": {"center": (12.9698, 77.7500), "grid": 7, "safety_base": 70},
            "Majestic": {"center": (12.9716, 77.5946), "grid": 7, "safety_base": 55},
            "JP Nagar": {"center": (12.9063, 77.5857), "grid": 7, "safety_base": 68},
            "HSR Layout": {"center": (12.9116, 77.6389), "grid": 7, "safety_base": 75},
            "Jayanagar": {"center": (12.9250, 77.5838), "grid": 7, "safety_base": 74},
        }

        road_names = {
            "Koramangala": ["80 Feet Road", "100 Feet Road", "Forum Road", "St Johns Road", "1st Block Main", "4th Block Main", "5th Block Cross", "6th Block Road"],
            "Indiranagar": ["100 Feet Road", "12th Main", "CMH Road", "Defence Colony Road", "HAL 2nd Stage", "Chinmaya Mission Road", "ESI Hospital Road", "80 Feet Road"],
            "MG Road": ["MG Road", "Brigade Road", "Church Street", "St Marks Road", "Residency Road", "Museum Road", "Cubbon Road", "Vittal Mallya Road"],
            "Whitefield": ["Whitefield Main Road", "ITPL Road", "Varthur Main Road", "Hope Farm Road", "Kadugodi Main Road", "SAP Labs Road", "Palm Meadows Road", "Nallurhalli Road"],
            "Majestic": ["Dhanvanthri Road", "Tank Bund Road", "Seshadri Road", "Race Course Road", "Mysore Road", "JC Road", "KG Road", "Avenue Road"],
            "JP Nagar": ["24th Main Road", "15th Cross Road", "Bannerghatta Road", "Dollar Colony Road", "6th Phase Main", "Sarakki Signal Road", "Puttenahalli Road", "Gottigere Road"],
            "HSR Layout": ["27th Main Road", "Outer Ring Road", "14th Main Road", "Sector 2 Main", "BDA Complex Road", "Agara Lake Road", "17th Cross Road", "19th Main Road"],
            "Jayanagar": ["30th Main Road", "11th Main Road", "4th Block Main", "South End Circle Road", "9th Block Road", "Ashoka Pillar Road", "40th Cross Road", "33rd Cross Road"]
        }

        connectors = [
            ("Koramangala", "Indiranagar", "Old Airport Road"),
            ("Koramangala", "MG Road", "Hosur Road"),
            ("MG Road", "Majestic", "KG Road"),
            ("Indiranagar", "Whitefield", "Old Madras Road"),
            ("Koramangala", "JP Nagar", "Bannerghatta Road"),
            ("Koramangala", "HSR Layout", "Outer Ring Road"),
            ("HSR Layout", "JP Nagar", "Bannerghatta Main Road"),
            ("JP Nagar", "Jayanagar", "26th Main Road"),
            ("Jayanagar", "MG Road", "Lalbagh Road"),
            ("Jayanagar", "Majestic", "DVG Road"),
        ]

        def haversine(lat1, lon1, lat2, lon2):
            import math
            R = 6371000
            phi1, phi2 = math.radians(lat1), math.radians(lat2)
            dphi = math.radians(lat2 - lat1)
            dlambda = math.radians(lon2 - lon1)
            a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
            return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

        node_id_counter = 1000
        segment_id_counter = 1
        neighborhood_nodes = {}

        # 1. Create grid nodes for each neighborhood
        for hood_name, hood in neighborhoods.items():
            center_lat, center_lng = hood["center"]
            grid_size = hood["grid"]
            spacing = 0.002

            hood_nodes = {}
            for row in range(grid_size):
                for col in range(grid_size):
                    lat = center_lat + (row - grid_size / 2) * spacing
                    lng = center_lng + (col - grid_size / 2) * spacing
                    nid = node_id_counter
                    node_id_counter += 1
                    hood_nodes[(row, col)] = nid
                    self.node_coords[nid] = (lat, lng)
                    self.G.add_node(nid, lat=lat, lng=lng)

            neighborhood_nodes[hood_name] = hood_nodes

        # 2. Create edges (road segments) within each neighborhood
        for hood_name, hood in neighborhoods.items():
            grid_size = hood["grid"]
            safety_base = hood["safety_base"]
            hood_nodes = neighborhood_nodes[hood_name]
            roads = road_names.get(hood_name, ["Main Road"])

            for row in range(grid_size):
                for col in range(grid_size):
                    nid = hood_nodes[(row, col)]
                    lat1, lng1 = self.node_coords[nid]

                    # Connect right
                    if col < grid_size - 1:
                        neighbor = hood_nodes[(row, col + 1)]
                        lat2, lng2 = self.node_coords[neighbor]
                        dist = haversine(lat1, lng1, lat2, lng2)
                        safety = max(20, min(95, safety_base + random.uniform(-10, 10)))
                        road_name = roads[row % len(roads)]
                        
                        geojson = json.dumps({"type": "LineString", "coordinates": [[lng1, lat1], [lng2, lat2]]})
                        
                        data1 = {
                            "segment_id": segment_id_counter, "distance_m": dist, "travel_time_s": dist / 11.11,
                            "safety_score": safety, "cctv_score": random.uniform(30, 90),
                            "crowd_score": random.uniform(20, 80), "lighting_score": random.uniform(40, 95),
                            "emergency_score": random.uniform(30, 85), "crime_penalty": random.uniform(0, 15),
                            "geojson": geojson
                        }
                        self.G.add_edge(nid, neighbor, **data1)
                        segment_id_counter += 1

                        geojson_rev = json.dumps({"type": "LineString", "coordinates": [[lng2, lat2], [lng1, lat1]]})
                        data2 = data1.copy()
                        data2["segment_id"] = segment_id_counter
                        data2["geojson"] = geojson_rev
                        self.G.add_edge(neighbor, nid, **data2)
                        segment_id_counter += 1

                    # Connect down
                    if row < grid_size - 1:
                        neighbor = hood_nodes[(row + 1, col)]
                        lat2, lng2 = self.node_coords[neighbor]
                        dist = haversine(lat1, lng1, lat2, lng2)
                        safety = max(20, min(95, safety_base + random.uniform(-10, 10)))
                        road_name = roads[col % len(roads)]
                        
                        geojson = json.dumps({"type": "LineString", "coordinates": [[lng1, lat1], [lng2, lat2]]})
                        
                        data1 = {
                            "segment_id": segment_id_counter, "distance_m": dist, "travel_time_s": dist / 11.11,
                            "safety_score": safety, "cctv_score": random.uniform(30, 90),
                            "crowd_score": random.uniform(20, 80), "lighting_score": random.uniform(40, 95),
                            "emergency_score": random.uniform(30, 85), "crime_penalty": random.uniform(0, 15),
                            "geojson": geojson
                        }
                        self.G.add_edge(nid, neighbor, **data1)
                        segment_id_counter += 1

                        geojson_rev = json.dumps({"type": "LineString", "coordinates": [[lng2, lat2], [lng1, lat1]]})
                        data2 = data1.copy()
                        data2["segment_id"] = segment_id_counter
                        data2["geojson"] = geojson_rev
                        self.G.add_edge(neighbor, nid, **data2)
                        segment_id_counter += 1

        # 3. Create connectors between neighborhoods
        for hood_a, hood_b, road_name in connectors:
            nodes_a = neighborhood_nodes[hood_a]
            nodes_b = neighborhood_nodes[hood_b]
            grid_a = neighborhoods[hood_a]["grid"]
            grid_b = neighborhoods[hood_b]["grid"]

            edge_a = nodes_a[(grid_a - 1, grid_a // 2)]
            edge_b = nodes_b[(0, grid_b // 2)]

            lat1, lng1 = self.node_coords[edge_a]
            lat2, lng2 = self.node_coords[edge_b]

            n_intermediate = 8
            prev_node = edge_a
            # Compute perpendicular direction for lateral offsets
            dlat = lat2 - lat1
            dlng = lng2 - lng1
            length = (dlat**2 + dlng**2) ** 0.5
            perp_lat = -dlng / length if length > 0 else 0
            perp_lng = dlat / length if length > 0 else 0
            for i in range(1, n_intermediate + 1):
                frac = i / (n_intermediate + 1)
                # Lateral offset: sine-wave pattern with randomness for road-like curves
                import math
                lateral = 0.0015 * math.sin(frac * math.pi * 2) + random.uniform(-0.0008, 0.0008)
                lat_i = lat1 + frac * (lat2 - lat1) + lateral * perp_lat
                lng_i = lng1 + frac * (lng2 - lng1) + lateral * perp_lng
                mid_node = node_id_counter
                node_id_counter += 1
                self.node_coords[mid_node] = (lat_i, lng_i)
                self.G.add_node(mid_node, lat=lat_i, lng=lng_i)

                plat, plng = self.node_coords[prev_node]
                dist = haversine(plat, plng, lat_i, lng_i)
                safety = max(40, min(85, 60 + random.uniform(-10, 10)))

                geojson = json.dumps({"type": "LineString", "coordinates": [[plng, plat], [lng_i, lat_i]]})
                data1 = {
                    "segment_id": segment_id_counter, "distance_m": dist, "travel_time_s": dist / 11.11,
                    "safety_score": safety, "cctv_score": random.uniform(40, 80),
                    "crowd_score": random.uniform(30, 70), "lighting_score": random.uniform(50, 85),
                    "emergency_score": random.uniform(40, 75), "crime_penalty": random.uniform(0, 10),
                    "geojson": geojson
                }
                self.G.add_edge(prev_node, mid_node, **data1)
                segment_id_counter += 1

                geojson_rev = json.dumps({"type": "LineString", "coordinates": [[lng_i, lat_i], [plng, plat]]})
                data2 = data1.copy()
                data2["segment_id"] = segment_id_counter
                data2["geojson"] = geojson_rev
                self.G.add_edge(mid_node, prev_node, **data2)
                segment_id_counter += 1

                prev_node = mid_node

            plat, plng = self.node_coords[prev_node]
            dist = haversine(plat, plng, lat2, lng2)
            safety = max(40, min(85, 60 + random.uniform(-10, 10)))
            
            geojson = json.dumps({"type": "LineString", "coordinates": [[plng, plat], [lng2, lat2]]})
            data1 = {
                "segment_id": segment_id_counter, "distance_m": dist, "travel_time_s": dist / 11.11,
                "safety_score": safety, "cctv_score": random.uniform(40, 80),
                "crowd_score": random.uniform(30, 70), "lighting_score": random.uniform(50, 85),
                "emergency_score": random.uniform(40, 75), "crime_penalty": random.uniform(0, 10),
                "geojson": geojson
            }
            self.G.add_edge(prev_node, edge_b, **data1)
            segment_id_counter += 1

            geojson_rev = json.dumps({"type": "LineString", "coordinates": [[lng2, lat2], [plng, plat]]})
            data2 = data1.copy()
            data2["segment_id"] = segment_id_counter
            data2["geojson"] = geojson_rev
            self.G.add_edge(edge_b, prev_node, **data2)
            segment_id_counter += 1

        self._build_kd_tree()
        logger.info(f"Fallback synthetic graph built in-memory with {self.G.number_of_nodes()} nodes and {self.G.number_of_edges()} edges.")

    def snap_to_nearest_node(self, lat: float, lng: float) -> int:
        if not self.kd_tree:
            return None
        dist, idx = self.kd_tree.query((lat, lng))
        return self.node_mapping[idx]
