"""
Cost Function
"""
from datetime import datetime
from app.core.scoring.score_engine import SafetyScoreEngine


def edge_cost(edge_data: dict, timestamp: datetime, alpha: float = 0.8, beta: float = 0.1, gamma: float = 0.1) -> float:
    """
    Compute the cost of traversing an edge.

    The cost is a weighted combination of:
      - alpha: safety penalty (higher = prefer safer routes)
      - beta:  distance (higher = prefer shorter routes)
      - gamma: travel time (higher = prefer faster routes)
    """
    dist = edge_data.get("distance_m", 1.0)
    time_s = edge_data.get("travel_time_s", 1.0)
    score = edge_data.get("safety_score", 50.0)

    multiplier = SafetyScoreEngine.time_multiplier(timestamp)
    adjusted_score = max(score * multiplier, 1e-6)

    # Normalized components (all roughly 0-1 scale)
    safety_penalty = (100.0 - adjusted_score) / 100.0  # 0 = perfectly safe, 1 = completely unsafe
    dist_norm = dist / 1000.0  # Normalize to km
    time_norm = time_s / 120.0  # Normalize to ~2 minutes

    cost = (alpha * safety_penalty) + (beta * dist_norm) + (gamma * time_norm)
    return cost
