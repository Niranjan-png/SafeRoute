"""
Route Service
"""
import uuid
import json
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.routing.graph_builder import GraphBuilder
from app.core.routing.yen_k_shortest import yen_k_shortest_paths
from app.schemas.route import RouteRequest, RouteOptionsResponse, RouteResponse, Coordinates

class RouteService:
    def __init__(self, graph_builder: GraphBuilder):
        self.graph_builder = graph_builder

    async def compute_routes(self, db: AsyncSession, source: Coordinates, dest: Coordinates) -> RouteOptionsResponse:
        start_node = self.graph_builder.snap_to_nearest_node(source.lat, source.lng)
        end_node = self.graph_builder.snap_to_nearest_node(dest.lat, dest.lng)
        
        if not start_node or not end_node:
            return None
            
        timestamp = datetime.utcnow()
        paths = yen_k_shortest_paths(self.graph_builder.G, start_node, end_node, timestamp, k=3)
        
        if not paths:
            return None
            
        routes = []
        for path_nodes, cost in paths:
            features = []
            total_dist = 0
            total_time = 0
            unsafe_count = 0
            score_sum = 0
            
            for i in range(len(path_nodes)-1):
                u = path_nodes[i]
                v = path_nodes[i+1]
                edge_data = self.graph_builder.G[u][v]
                
                total_dist += edge_data["distance_m"]
                total_time += edge_data.get("travel_time_s", 0)
                score = edge_data.get("safety_score", 50)
                score_sum += score * edge_data["distance_m"]
                
                if score < 50:
                    unsafe_count += 1
                    
                geojson_str = edge_data.get("geojson")
                if geojson_str:
                    geom = json.loads(geojson_str)
                    features.append({
                        "type": "Feature",
                        "geometry": geom,
                        "properties": {
                            "segment_id": edge_data.get("segment_id"),
                            "safety_score": score
                        }
                    })
                    
            avg_score = score_sum / total_dist if total_dist > 0 else 50
            
            r = RouteResponse(
                route_id=uuid.uuid4(),
                geojson={"type": "FeatureCollection", "features": features},
                safety_score=avg_score,
                distance_m=total_dist,
                eta_seconds=int(total_time),
                segment_count=len(path_nodes)-1,
                unsafe_segment_count=unsafe_count,
                safety_label=RouteResponse.compute_safety_label(avg_score)
            )
            routes.append(r)
            
        return RouteOptionsResponse(routes=routes, computed_at=timestamp)
