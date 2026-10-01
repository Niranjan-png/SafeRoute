# SafeRoute Bengaluru — Algorithm Documentation

## Safety Score Algorithm

### Composite Formula

```
Safety Score (0–100) =
  (0.30 × CCTV_Score)          [0–30 points]
+ (0.25 × HumanActivity_Score) [0–25 points]
+ (0.20 × EmergencyAccess)     [0–20 points]
+ (0.15 × Lighting_Score)      [0–15 points]
+ (0.10 × InverseCrimeRisk)    [0–10 points]
```

### Sub-Score Details

#### 1. CCTV Density Score (0–30)
- Counts active CCTV cameras within **200m** of a road segment centroid
- Uses PostGIS `ST_DWithin` with UTM Zone 43N projection for accurate meter distance

| Cameras within 200m | Score |
|---------------------|-------|
| 0                   | 0     |
| 1–5                 | 10    |
| 6–20                | 20    |
| 20+                 | 30    |

#### 2. Human Activity Score (0–25)
- Shops/restaurants/cafes within 300m: **+10** (capped)
- Bus stops/metro within 500m: **+8** (capped)
- Petrol pumps/ATMs within 300m: **+4** (capped)
- Active hours bonus (8AM–10PM): **+3**

#### 3. Emergency Access Score (0–20)
- Police station < 500m: **+10**
- Police station 500m–1km: **+6**
- Women police station < 1km: **+5** (bonus)
- Hospital < 500m: **+8**
- Base Namma 112 coverage: **+2**

#### 4. Lighting Score (0–15)
- Based on streetlight density per 100m of road
- Dense (≥5 per 100m): **15**
- Medium (2–5): **10**
- Sparse (1): **5**
- None: **0**

#### 5. Crime Risk Score (0–10, inverted)
- Queries crime incidents within **500m** of segment
- Recent crimes (last 6 months): weight × 2.0
- Older crimes (6–12 months): weight × 1.0
- Crime weights: Assault (×3), Stalking (×2.5), Harassment (×2), Robbery (×1.5), Snatching (×1)
- **Inverted**: `score = max(0, 10 - min(penalty, 10))`
- 10 = safest (no crime), 0 = highest crime

### Time-of-Day Multiplier

Applied at query time on top of pre-computed base scores:

| Time Range    | Multiplier | Effective Score Reduction |
|---------------|------------|--------------------------|
| 00:00–05:00   | 0.65       | −35%                     |
| 05:00–08:00   | 0.80       | −20%                     |
| 08:00–20:00   | 1.00       | None (baseline)          |
| 20:00–22:00   | 0.85       | −15%                     |
| 22:00–00:00   | 0.70       | −30%                     |

---

## Routing Algorithm

### Graph Representation

- **Nodes**: Road intersections from OSM (node IDs preserved)
- **Edges**: Road segments with multi-attribute weights
- **Graph type**: NetworkX DiGraph (directed)
- **Storage**: In-memory, built from PostGIS at startup
- **Node snapping**: KD-tree (scipy.spatial) for O(log n) nearest-node lookup

### Edge Cost Function

```python
cost = (alpha × safety_cost) + (beta × distance_cost) + (gamma × time_cost)

where:
  safety_cost   = (100 - effective_safety) / 100    # Lower safety → higher cost
  distance_cost = distance_m / 5000                  # Normalized to 5km
  time_cost     = travel_time_s / 600                # Normalized to 10 min
  
  effective_safety = base_safety_score × time_multiplier(now)

default weights: alpha=0.5, beta=0.3, gamma=0.2
```

### Dijkstra's Algorithm

Standard Dijkstra with the composite cost function. Returns the minimum-cost path (safest practical route).

### Yen's K-Shortest Paths

Used to generate **top 3 route options**:

1. Find the shortest path via Dijkstra
2. For each node in the path, compute a "spur path" by:
   - Removing edges shared with existing shortest paths
   - Running Dijkstra from the spur node to the destination
3. Combine the root path + spur path into a candidate
4. Select the candidate with the lowest cost that is sufficiently different
5. Repeat until K paths are found

**Dissimilarity check**: A candidate is accepted only if ≥20% of its edges are unique compared to the union of edges from all previously accepted paths (union interpretation).

### Travel Time Estimation

Travel time is estimated from segment length and OSM road type:

| Road Type      | Speed (km/h) |
|----------------|---------------|
| primary/trunk  | 40            |
| secondary      | 30            |
| tertiary       | 25            |
| residential    | 20            |
| footway/path   | 5 (walking)   |
| default        | 25            |

---

## Data Pipeline

### Score Computation Flow

```
[Celery Beat] → nightly at 2 AM IST
    ↓
[score_refresh task]
    ↓
[SafetyScoreEngine.refresh_all_scores()]
    ↓
[For each road segment (batched, 500 at a time)]:
    ├─ CCTVScorer.score(segment_geom) → ST_DWithin query
    ├─ CrowdScorer.score(segment_geom, time) → POI + transit queries
    ├─ CrimeScorer.score(segment_geom, time) → crime incidents query
    ├─ EmergencyScorer.score(segment_geom) → facility proximity queries
    └─ LightingScorer.score(segment_geom, length) → streetlight density
    ↓
[Composite score written to road_segments table]
    ↓
[Graph rebuilt in-memory (weekly, or on demand)]
```

### Spatial Queries

All spatial queries use **UTM Zone 43N (EPSG:32643)** projection for accurate meter-based distances. This is the appropriate UTM zone for Bengaluru (longitude ~77.5°E).

```sql
ST_DWithin(
    ST_Transform(geom1, 32643),
    ST_Transform(geom2, 32643),
    distance_in_meters
)
```
