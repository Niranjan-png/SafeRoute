# SafeRoute Bengaluru — Product Requirements Document (PRD)
## Version 1.0 | AI-Powered Women Safety Navigation System

---

## 1. Executive Summary

SafeRoute Bengaluru is a safety-first navigation web and mobile application designed specifically for women, college students, night-shift workers, and vulnerable citizens navigating Bengaluru. Unlike Google Maps or Ola Maps that optimize for time and distance, SafeRoute computes routes using a composite **Safety Score** derived from CCTV density, crime history, crowd activity, emergency access, and lighting data.

The core innovation is a **multi-parameter graph-based routing engine** that treats every road segment as a weighted edge — not by travel time, but by its calculated risk-to-safety ratio. The user gets the safest *practical* route, not just the shortest one.

---

## 2. Problem Statement

### 2.1 What's Missing in Current Navigation
| Feature | Google Maps | Ola Maps | SafeRoute |
|---|---|---|---|
| Shortest distance | ✅ | ✅ | ✅ |
| Fastest route | ✅ | ✅ | ✅ |
| Safety-first routing | ❌ | ❌ | ✅ |
| CCTV-aware routing | ❌ | ❌ | ✅ |
| Crime zone avoidance | ❌ | ❌ | ✅ |
| SOS integration | ❌ | ❌ | ✅ |
| Night-mode safety | ❌ | ❌ | ✅ |

### 2.2 Target User Personas
1. **College students** — traveling late from libraries, labs, or events
2. **IT/BPO women employees** — night shifts in Whitefield, Electronic City
3. **Tourists** — unfamiliar with city geography and risk zones
4. **Elderly citizens** — need proximity to medical/police infrastructure

---

## 3. Vision & Success Metrics

### 3.1 Product Vision
> Provide the safest *practical* route — not necessarily the shortest, not the fastest, but the one where a woman feels safe.

### 3.2 KPIs (MVP Phase)
| Metric | Target (3 months post-launch) |
|---|---|
| Routes computed / day | 500+ |
| Avg safety score of recommended routes | > 72 / 100 |
| SOS activations resolved within 5 min | > 90% |
| User-reported incidents resolved | > 80% |
| DAU / MAU ratio | > 0.25 |

---

## 4. Core Features

### 4.1 Safest Route Computation (P0)
- Input: Source + Destination
- Output: Top 3 routes ranked by Safety Score (not time)
- Each route shows: distance, ETA, overall safety score, unsafe segment warnings

### 4.2 Safety Score Display (P0)
- Per-route composite score (0–100)
- Breakdown: CCTV, crowd, crime, lighting, emergency proximity
- Color indicator: Green (>75), Amber (50–75), Red (<50)

### 4.3 SOS Button (P0)
- One-tap emergency alert
- Auto-sends GPS location to registered emergency contacts
- Simultaneously dials Namma 112

### 4.4 Real-Time Danger Alerts (P1)
- Push notification when user enters a low-safety zone
- Triggered when safety score of current road drops below threshold

### 4.5 Community Safety Reports (P1)
- Users can report: Harassment, Poor lighting, Suspicious activity, Road blocked
- Reports geo-tagged and timestamped; contribute to real-time score updates

### 4.6 Safe Zone Finder (P1)
- Nearest: Police station, Hospital, Women's help center, 24hr petrol pump, Metro station

### 4.7 Night Mode (P2)
- Activates after 9 PM or manually
- Stricter safety thresholds — avoids isolated roads even if shorter
- Interface shifts to low-brightness dark UI

### 4.8 Emergency Contact Management (P2)
- Add up to 5 trusted contacts
- Auto-share live location on SOS trigger
- Pre-trip share: "I'm going from X to Y, ETA: Z"

---

## 5. Safety Score Algorithm (Core Logic)

### 5.1 Score Formula
```
Safety Score (0–100) =
  (0.30 × CCTV_Score)
+ (0.25 × HumanActivity_Score)
+ (0.20 × EmergencyAccess_Score)
+ (0.15 × Lighting_Score)
+ (0.10 × InverseCrimeRisk_Score)
```

### 5.2 Parameter Definitions

#### CCTV Score (0–30 points)
| Cameras within 200m radius | Score |
|---|---|
| 0 | 0 |
| 1–5 | 10 |
| 6–20 | 20 |
| 20+ | 30 |

Source: Bengaluru Safe City geo-tagged CCTV database (5.3 lakh+ cameras)

#### Human Activity Score (0–25 points)
Computed from OpenStreetMap POI density:
- Shops / restaurants / cafes within 300m: +10
- Bus stops / metro stations within 500m: +8
- Petrol pumps / ATMs within 300m: +4
- Active hours bonus (8am–10pm): +3

#### Emergency Access Score (0–20 points)
| Emergency facility | Distance | Score |
|---|---|---|
| Police station | < 500m | 10 |
| Police station | 500m–1km | 6 |
| Women police station | < 1km | 5 (bonus) |
| Hospital | < 500m | 8 |
| Namma 112 avg response zone | — | 2 (base) |

#### Lighting Score (0–15 points)
- Phase 1: User-reported data + BBMP streetlight CSV
- Phase 2: Satellite imagery (NASA VIIRS night-light dataset)
- Phase 3: ML classification from street-level imagery

#### Crime Risk Score (0–10 points, inverted)
- Pull from NCRB district-level data + Karnataka Police FIR dataset
- Weight crimes by recency (last 6 months 2×, last 1 year 1×)
- Crime types weighted: Assault (×3), Stalking (×2.5), Harassment (×2), Robbery (×1.5), Snatching (×1)
- Road segment receives penalty if within 500m of a crime cluster

### 5.3 Time-of-Day Multipliers
```
nighttime_multiplier = {
  "00:00–05:00": 0.65,  # Score severely reduced
  "05:00–08:00": 0.80,
  "08:00–20:00": 1.00,  # Base score
  "20:00–22:00": 0.85,
  "22:00–00:00": 0.70
}

effective_score = safety_score * time_multiplier
```

---

## 6. Routing Algorithm

### 6.1 Graph Representation
- **Nodes**: Road intersections, metro stations, bus stops, major junctions
- **Edges**: Road segments with multi-attribute weights
- **Edge Schema**:
  ```
  {
    edge_id, start_node, end_node,
    distance_m, travel_time_s,
    safety_score, cctv_score, crowd_score,
    lighting_score, emergency_score, crime_penalty,
    last_updated
  }
  ```

### 6.2 Cost Function
```python
def edge_cost(edge, alpha=0.5, beta=0.3, gamma=0.2):
    """
    alpha = safety weight
    beta  = distance weight
    gamma = time weight
    """
    safety_cost = (100 - edge.safety_score) / 100   # Lower is better
    distance_cost = edge.distance_m / MAX_DISTANCE   # Normalized
    time_cost = edge.travel_time_s / MAX_TIME        # Normalized

    return (alpha * safety_cost) + (beta * distance_cost) + (gamma * time_cost)
```

### 6.3 Algorithm Phases

**Phase 1 — MVP (Dijkstra)**
```python
import heapq

def safest_route_dijkstra(graph, source, target):
    dist = {node: float('inf') for node in graph.nodes}
    dist[source] = 0
    prev = {}
    pq = [(0, source)]

    while pq:
        cost, u = heapq.heappop(pq)
        if u == target:
            break
        for v, edge in graph.neighbors(u):
            new_cost = cost + edge_cost(edge)
            if new_cost < dist[v]:
                dist[v] = new_cost
                prev[v] = u
                heapq.heappush(pq, (new_cost, v))

    return reconstruct_path(prev, source, target)
```

**Phase 2 — A* with Safety Heuristic**
```python
def safety_heuristic(node, target, graph):
    # Euclidean distance to target, scaled by avg safety of remaining region
    h_dist = haversine(node.coords, target.coords)
    region_safety = graph.get_region_safety(node)
    return h_dist * (1 + (100 - region_safety) / 100)

def safest_route_astar(graph, source, target):
    open_set = [(0, source)]
    g = {source: 0}
    f = {source: safety_heuristic(source, target, graph)}

    while open_set:
        _, current = heapq.heappop(open_set)
        if current == target:
            return reconstruct_path(came_from, source, target)

        for neighbor, edge in graph.neighbors(current):
            tentative_g = g[current] + edge_cost(edge)
            if tentative_g < g.get(neighbor, float('inf')):
                came_from[neighbor] = current
                g[neighbor] = tentative_g
                f[neighbor] = tentative_g + safety_heuristic(neighbor, target, graph)
                heapq.heappush(open_set, (f[neighbor], neighbor))
```

**Phase 3 — Multi-Objective Optimization (NSGA-II inspired)**
- Optimize simultaneously for: safety, distance, time
- Returns Pareto-optimal front of routes
- User selects their preference (slider: "Safety ↔ Speed")

---

## 7. Data Sources & Integration Plan

### 7.1 Crime Data
| Source | Type | Frequency | Access |
|---|---|---|---|
| NCRB Annual Report | District-level crime stats | Annual | Public PDF |
| Karnataka Police Open Data | FIR locations (aggregated) | Monthly | API (pending) |
| Safe City Bengaluru | Incident reports | Real-time | MoU required |
| Community reports (in-app) | Hyperlocal incidents | Real-time | Own data |
| Crime news scraping (The Hindu, TOI) | Incident mentions | Daily | Web scraper |

### 7.2 Infrastructure Data
| Source | Data | Format |
|---|---|---|
| OpenStreetMap (OSM) | Road network, POIs | GeoJSON / Overpass API |
| BMTC Open Data | Bus stops, routes | CSV/API |
| BMRCL | Metro station locations | Public |
| BBMP Portal | Street lights (partial) | CSV |
| Bengaluru Safe City (5.3L CCTV) | Camera locations | MoU / API |

### 7.3 Real-Time Data
| Source | Data | Update |
|---|---|---|
| Google Maps API | Traffic density | Real-time |
| BMTC GTFS feed | Live bus positions | Real-time |
| Namma 112 API | Emergency zone coverage | Real-time |
| In-app crowd reports | Crowd density proxy | Real-time |

---

## 8. Technical Architecture

### 8.1 System Overview
```
Client Layer (React Web / Flutter Mobile)
         │
         ▼
    API Gateway (FastAPI)
    ├── Auth Service (JWT + OTP)
    ├── Routing Engine Service
    ├── Safety Score Engine
    ├── SOS Service
    └── Report Ingestion Service
         │
         ▼
   Core Services Layer
   ├── Graph Engine (NetworkX / C++ Boost Graph)
   ├── Geospatial Engine (PostGIS)
   ├── Score Engine (Python)
   └── Real-Time Engine (Redis + WebSockets)
         │
         ▼
   Data Layer
   ├── PostgreSQL + PostGIS (road graph, scores)
   ├── Redis (live score cache, sessions)
   └── S3 / R2 (crime data files, CCTV snapshots)
```

### 8.2 Database Schema (Core Tables)

```sql
-- Road network nodes
CREATE TABLE nodes (
    node_id     BIGINT PRIMARY KEY,
    geom        GEOMETRY(POINT, 4326) NOT NULL,
    node_type   VARCHAR(30),  -- intersection, metro, bus_stop, junction
    area_name   VARCHAR(100)
);

-- Road segments (edges of the graph)
CREATE TABLE road_segments (
    segment_id      BIGINT PRIMARY KEY,
    start_node      BIGINT REFERENCES nodes(node_id),
    end_node        BIGINT REFERENCES nodes(node_id),
    geom            GEOMETRY(LINESTRING, 4326) NOT NULL,
    length_m        FLOAT NOT NULL,
    road_name       VARCHAR(200),
    road_type       VARCHAR(50),  -- primary, secondary, residential, footway
    is_bidirectional BOOLEAN DEFAULT TRUE,

    -- Safety attributes (updated by score engine)
    safety_score    FLOAT DEFAULT 50.0,
    cctv_score      FLOAT DEFAULT 0.0,
    crowd_score     FLOAT DEFAULT 0.0,
    lighting_score  FLOAT DEFAULT 0.0,
    emergency_score FLOAT DEFAULT 0.0,
    crime_penalty   FLOAT DEFAULT 0.0,
    score_updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_road_segments_geom ON road_segments USING GIST(geom);

-- Crime incidents
CREATE TABLE crime_incidents (
    crime_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    geom            GEOMETRY(POINT, 4326) NOT NULL,
    crime_type      VARCHAR(50),  -- harassment, stalking, assault, robbery, snatching
    crime_weight    FLOAT NOT NULL,
    source          VARCHAR(50),  -- NCRB, community_report, news
    occurred_at     TIMESTAMP,
    created_at      TIMESTAMP DEFAULT NOW(),
    is_verified     BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_crime_geom ON crime_incidents USING GIST(geom);

-- CCTV camera locations
CREATE TABLE cctv_cameras (
    camera_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    geom        GEOMETRY(POINT, 4326) NOT NULL,
    operator    VARCHAR(50),  -- bbmp, police, private
    is_active   BOOLEAN DEFAULT TRUE,
    last_seen   TIMESTAMP
);

CREATE INDEX idx_cctv_geom ON cctv_cameras USING GIST(geom);

-- Emergency facilities
CREATE TABLE emergency_facilities (
    facility_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    geom            GEOMETRY(POINT, 4326) NOT NULL,
    facility_type   VARCHAR(50),  -- police_station, women_police, hospital, namma_112_post
    name            VARCHAR(200),
    phone           VARCHAR(20),
    is_24hr         BOOLEAN DEFAULT FALSE
);

-- Community safety reports
CREATE TABLE safety_reports (
    report_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(user_id),
    geom            GEOMETRY(POINT, 4326) NOT NULL,
    report_type     VARCHAR(50),  -- harassment, poor_lighting, suspicious_activity, unsafe_road
    description     TEXT,
    created_at      TIMESTAMP DEFAULT NOW(),
    verified_count  INT DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE
);

-- Users
CREATE TABLE users (
    user_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone           VARCHAR(15) UNIQUE NOT NULL,
    name            VARCHAR(100),
    emergency_contacts JSONB DEFAULT '[]',
    preferences     JSONB DEFAULT '{}',
    created_at      TIMESTAMP DEFAULT NOW()
);
```

### 8.3 Safety Score Computation Service
```python
# score_engine.py

class SafetyScoreEngine:
    def __init__(self, db: AsyncSession, redis: Redis):
        self.db = db
        self.redis = redis
        self.CACHE_TTL = 300  # 5 min

    async def compute_segment_score(self, segment_id: int, timestamp: datetime) -> float:
        cache_key = f"score:{segment_id}:{timestamp.hour}"
        cached = await self.redis.get(cache_key)
        if cached:
            return float(cached)

        segment = await self.db.get(RoadSegment, segment_id)

        cctv_score    = await self._cctv_score(segment.geom)
        crowd_score   = await self._crowd_score(segment.geom, timestamp)
        emerg_score   = await self._emergency_score(segment.geom)
        light_score   = await self._lighting_score(segment.geom, timestamp)
        crime_score   = await self._crime_score(segment.geom, timestamp)

        final_score = (
            0.30 * cctv_score +
            0.25 * crowd_score +
            0.20 * emerg_score +
            0.15 * light_score +
            0.10 * crime_score
        ) * self._time_multiplier(timestamp)

        await self.redis.setex(cache_key, self.CACHE_TTL, str(final_score))
        return round(final_score, 2)

    async def _cctv_score(self, geom) -> float:
        count = await self.db.scalar(
            select(func.count(CCTVCamera.camera_id))
            .where(func.ST_DWithin(CCTVCamera.geom, geom, 200))
            .where(CCTVCamera.is_active == True)
        )
        if count == 0:   return 0
        if count <= 5:   return 10
        if count <= 20:  return 20
        return 30

    async def _crime_score(self, geom, timestamp: datetime) -> float:
        six_months_ago = timestamp - timedelta(days=180)
        one_year_ago = timestamp - timedelta(days=365)

        crimes_recent = await self.db.scalars(
            select(CrimeIncident)
            .where(func.ST_DWithin(CrimeIncident.geom, geom, 500))
            .where(CrimeIncident.occurred_at >= six_months_ago)
        )
        crimes_older = await self.db.scalars(
            select(CrimeIncident)
            .where(func.ST_DWithin(CrimeIncident.geom, geom, 500))
            .where(CrimeIncident.occurred_at.between(one_year_ago, six_months_ago))
        )

        penalty = sum(c.crime_weight * 2.0 for c in crimes_recent.all())
        penalty += sum(c.crime_weight * 1.0 for c in crimes_older.all())
        return max(0, 10 - min(penalty, 10))  # Inverted, capped at 10

    def _time_multiplier(self, timestamp: datetime) -> float:
        h = timestamp.hour
        if 0 <= h < 5:   return 0.65
        if 5 <= h < 8:   return 0.80
        if 8 <= h < 20:  return 1.00
        if 20 <= h < 22: return 0.85
        return 0.70
```

### 8.4 Routing API Endpoints

```
POST   /api/v1/route/safest          → Compute safest route
POST   /api/v1/route/options         → Return 3 route options
GET    /api/v1/safety/score/{seg_id} → Safety score for segment
GET    /api/v1/safety/heatmap        → GeoJSON heatmap for map overlay
POST   /api/v1/sos/trigger           → Trigger SOS alert
POST   /api/v1/report/create         → Submit community report
GET    /api/v1/safe-zones/nearby     → Police, hospitals near lat/lng
GET    /api/v1/route/explain/{rid}   → Why this route was chosen (explain)
```

---

## 9. Project File Structure

```
saferoute-bengaluru/
│
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI app entry
│   │   ├── config.py                  # ENV, DB config
│   │   ├── dependencies.py            # DI: DB, Redis, Auth
│   │   │
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   ├── router.py          # Aggregate all routers
│   │   │   │   ├── route.py           # /route endpoints
│   │   │   │   ├── safety.py          # /safety endpoints
│   │   │   │   ├── sos.py             # /sos endpoints
│   │   │   │   ├── report.py          # /report endpoints
│   │   │   │   ├── auth.py            # /auth endpoints
│   │   │   │   └── safe_zones.py      # /safe-zones endpoints
│   │   │
│   │   ├── core/
│   │   │   ├── routing/
│   │   │   │   ├── graph_builder.py   # Build NetworkX graph from DB
│   │   │   │   ├── dijkstra.py        # Phase 1 routing
│   │   │   │   ├── astar.py           # Phase 2 routing
│   │   │   │   ├── multi_obj.py       # Phase 3 multi-objective
│   │   │   │   └── cost_function.py   # Edge cost computation
│   │   │   │
│   │   │   ├── scoring/
│   │   │   │   ├── score_engine.py    # Main scoring orchestrator
│   │   │   │   ├── cctv_scorer.py     # CCTV density scoring
│   │   │   │   ├── crime_scorer.py    # Crime risk scoring
│   │   │   │   ├── crowd_scorer.py    # Human activity scoring
│   │   │   │   ├── lighting_scorer.py # Lighting scoring
│   │   │   │   └── emergency_scorer.py # Emergency access scoring
│   │   │   │
│   │   │   ├── sos/
│   │   │   │   ├── sos_service.py     # SOS trigger, notify
│   │   │   │   └── sms_client.py      # Twilio/AWS SNS SMS
│   │   │   │
│   │   │   └── realtime/
│   │   │       ├── ws_manager.py      # WebSocket connection manager
│   │   │       └── live_score.py      # Push score updates
│   │   │
│   │   ├── models/
│   │   │   ├── node.py
│   │   │   ├── road_segment.py
│   │   │   ├── crime_incident.py
│   │   │   ├── cctv_camera.py
│   │   │   ├── emergency_facility.py
│   │   │   ├── safety_report.py
│   │   │   └── user.py
│   │   │
│   │   ├── schemas/                   # Pydantic request/response models
│   │   │   ├── route.py
│   │   │   ├── safety.py
│   │   │   ├── sos.py
│   │   │   └── report.py
│   │   │
│   │   └── workers/
│   │       ├── score_refresh.py       # Celery: refresh scores nightly
│   │       ├── crime_ingest.py        # Celery: pull new crime data
│   │       └── graph_rebuild.py       # Celery: rebuild road graph weekly
│   │
│   ├── data/
│   │   ├── osm/                       # OpenStreetMap extracts for Bengaluru
│   │   ├── ncrb/                      # NCRB crime datasets
│   │   ├── bbmp/                      # Street light data
│   │   └── scripts/
│   │       ├── import_osm.py          # Import OSM road network
│   │       ├── import_ncrb.py         # Parse & import NCRB data
│   │       └── import_cctv.py         # Import CCTV locations
│   │
│   ├── migrations/                    # Alembic DB migrations
│   ├── tests/
│   │   ├── test_routing.py
│   │   ├── test_scoring.py
│   │   └── test_sos.py
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── app/                       # Next.js app router
│   │   ├── components/
│   │   │   ├── Map/                   # Mapbox/Leaflet map component
│   │   │   ├── RouteCard/             # Route option cards
│   │   │   ├── SafetyMeter/           # Animated score display
│   │   │   ├── SOSButton/             # Emergency SOS widget
│   │   │   ├── ReportModal/           # Community report form
│   │   │   └── SafeZoneList/          # Nearby safe zones
│   │   ├── hooks/
│   │   │   ├── useRoute.ts
│   │   │   ├── useSafetyScore.ts
│   │   │   └── useLocation.ts
│   │   ├── services/
│   │   │   ├── api.ts                 # Axios API client
│   │   │   └── websocket.ts           # WS live updates
│   │   └── store/
│   │       └── routeStore.ts          # Zustand state
│   ├── public/
│   └── package.json
│
├── infra/
│   ├── docker-compose.yml             # Local dev stack
│   ├── nginx.conf
│   └── deploy/
│       └── railway.toml               # Railway deployment
│
└── docs/
    ├── api.md
    ├── data_sources.md
    └── algorithm.md
```

---

## 10. MVP Delivery Roadmap

### Phase 1 — Core (Weeks 1–2)
- [ ] PostgreSQL + PostGIS setup on Railway
- [ ] OSM Bengaluru road network import (osm2pgsql)
- [ ] Police station, hospital, metro station data import
- [ ] Basic Dijkstra routing with distance-only cost
- [ ] Safety score engine skeleton (CCTV + emergency access)

### Phase 2 — Safety Engine (Weeks 3–4)
- [ ] NCRB crime data import and crime scorer
- [ ] CCTV density scorer using geo-tagged camera data
- [ ] Crowd activity scorer using OSM POI density
- [ ] Full safety score computation per road segment
- [ ] Route API returning safety-weighted route

### Phase 3 — UI (Weeks 5–6)
- [ ] React + Leaflet map with Bengaluru base layer
- [ ] Route display with safety score overlay
- [ ] Route options card (3 options: Safest / Balanced / Fastest)
- [ ] Safety heatmap overlay
- [ ] Mobile-responsive UI

### Phase 4 — Live Features (Weeks 7–8)
- [ ] SOS button with Twilio SMS integration
- [ ] Community report submission
- [ ] Real-time score update via WebSockets
- [ ] Night mode toggle
- [ ] Emergency contacts management

---

## 11. Tech Stack Summary

| Layer | Technology | Reason |
|---|---|---|
| Backend framework | FastAPI (Python) | Async, fast, easy routing |
| Database | PostgreSQL + PostGIS | Geospatial queries, ST_DWithin |
| Cache | Redis | Score caching, WebSocket sessions |
| Graph engine | NetworkX (MVP) → OSMnx + Boost Graph (scale) | Flexible, Python-native |
| Frontend | Next.js + Leaflet.js | SSR, map rendering |
| Maps | OpenStreetMap + Mapbox tiles | Free + customizable |
| SMS / SOS | Twilio | Reliable, India-ready |
| Deployment | Railway (DB + API) + Vercel (Frontend) | Free tier friendly |
| Background jobs | Celery + Redis broker | Score refresh, data ingestion |
| Auth | JWT + Twilio OTP (phone-based) | No email needed, Indian user UX |

---

## 12. Risk Register

| Risk | Impact | Mitigation |
|---|---|---|
| CCTV data not publicly accessible | High | Use proxy: OSM + community reports + satellite imagery |
| NCRB data too coarse (district-level) | Medium | Supplement with news scraping + community reports |
| Routing too slow for dense city graph | Medium | A* heuristic + graph pruning + Redis segment cache |
| User trust in safety scores | Medium | Full score breakdown + explainability endpoint |
| Misuse / panic UI perception | Low | Warm UI palette, avoid red-dominant design |

---

*Document prepared for SafeRoute Bengaluru MVP — Vital Health Tech / PulsePredict Team*
*Confidential — Internal Use Only*
