"""
Dijkstra's Algorithm
"""
import networkx as nx
from typing import List, Tuple, Optional
from datetime import datetime
from app.core.routing.cost_function import edge_cost

def dijkstra_safest_route(
    G: nx.DiGraph,
    source: int,
    target: int,
    timestamp: datetime,
    alpha: float = 0.8,
    beta: float = 0.1,
    gamma: float = 0.1
) -> Optional[Tuple[List[int], float]]:
    
    def weight_func(u, v, data):
        return edge_cost(data, timestamp, alpha, beta, gamma)
        
    try:
        path = nx.dijkstra_path(G, source, target, weight=weight_func)
        cost = sum(weight_func(path[i], path[i+1], G[path[i]][path[i+1]]) for i in range(len(path)-1))
        return path, cost
    except nx.NetworkXNoPath:
        return None
    except nx.NodeNotFound:
        return None
