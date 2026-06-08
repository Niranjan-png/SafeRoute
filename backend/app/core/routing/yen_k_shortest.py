"""
Yen's K-Shortest Paths
"""
import networkx as nx
from typing import List, Tuple
from datetime import datetime
from app.core.routing.dijkstra import dijkstra_safest_route

def yen_k_shortest_paths(
    G: nx.DiGraph,
    source: int,
    target: int,
    timestamp: datetime,
    k: int = 3
) -> List[Tuple[List[int], float]]:
    
    A = []
    B = []
    
    first_path = dijkstra_safest_route(G, source, target, timestamp)
    if not first_path:
        return []
        
    A.append(first_path)
    
    for k_idx in range(1, k):
        prev_path = A[k_idx-1][0]
        
        for i in range(len(prev_path) - 1):
            spur_node = prev_path[i]
            root_path = prev_path[:i+1]
            
            removed_edges = []
            for p, _ in A:
                if len(p) > i and p[:i+1] == root_path:
                    u, v = p[i], p[i+1]
                    if G.has_edge(u, v):
                        edge_data = G[u][v].copy()
                        removed_edges.append((u, v, edge_data))
                        G.remove_edge(u, v)
                        
            spur_path = dijkstra_safest_route(G, spur_node, target, timestamp)
            
            for u, v, edge_data in removed_edges:
                G.add_edge(u, v, **edge_data)
                
            if spur_path:
                total_path = root_path[:-1] + spur_path[0]
                
                def edge_cost_func(data):
                    from app.core.routing.cost_function import edge_cost
                    return edge_cost(data, timestamp)
                    
                total_cost = sum(edge_cost_func(G[total_path[j]][total_path[j+1]]) for j in range(len(total_path)-1))
                
                path_entry = (total_path, total_cost)
                if path_entry not in B:
                    B.append(path_entry)
                    
        if not B:
            break
            
        B.sort(key=lambda x: x[1])
        A.append(B.pop(0))
        
    return A
