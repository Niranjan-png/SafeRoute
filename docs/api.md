# SafeRoute Bengaluru — API Reference

> **Base URL**: `http://localhost:8000/api/v1`
> **Interactive docs**: `http://localhost:8000/docs`
> **Auth**: JWT Bearer tokens via phone OTP

---

## Authentication

All endpoints marked 🔒 require a valid JWT token in the `Authorization` header:
```
Authorization: Bearer <token>
```

### Request OTP
```
POST /auth/request-otp
```
**Body:**
```json
{
  "phone": "+919876543210"
}
```
**Response:** `200 OK`
```json
{
  "message": "OTP sent successfully",
  "phone": "+919876543210"
}
```
> In development (SMS_BACKEND=mock), the OTP is printed to the console.

### Verify OTP
```
POST /auth/verify-otp
```
**Body:**
```json
{
  "phone": "+919876543210",
  "otp": "123456"
}
```
**Response:** `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 86400
}
```

### Get Profile 🔒
```
GET /auth/me
```

### Update Profile 🔒
```
PUT /auth/me
```
**Body:**
```json
{
  "name": "Priya Kumar",
  "emergency_contacts": [
    {"name": "Mom", "phone": "+919812345678", "relationship": "mother"},
    {"name": "Roommate", "phone": "+919887654321", "relationship": "friend"}
  ]
}
```

---

## Routing

### Safest Route
```
POST /route/safest
```
**Body:**
```json
{
  "source": {"lat": 12.9352, "lng": 77.6245},
  "destination": {"lat": 12.9784, "lng": 77.6408}
}
```
**Response:** `200 OK`
```json
{
  "route_id": "550e8400-e29b-41d4-a716-446655440000",
  "geojson": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": {"type": "LineString", "coordinates": [[77.6245, 12.9352], ...]},
        "properties": {
          "segment_id": 12345,
          "safety_score": 72.5,
          "road_name": "100 Feet Road",
          "distance_m": 450.3,
          "is_unsafe": false
        }
      }
    ]
  },
  "safety_score": 74.2,
  "distance_m": 3250.5,
  "eta_seconds": 480,
  "segment_count": 12,
  "unsafe_segment_count": 2,
  "safety_label": "amber"
}
```

### Route Options (Top 3)
```
POST /route/options
```
Same request body as `/route/safest`. Returns up to 3 routes:
```json
{
  "routes": [
    { "route_id": "...", "safety_score": 82.3, "safety_label": "green", ... },
    { "route_id": "...", "safety_score": 68.1, "safety_label": "amber", ... },
    { "route_id": "...", "safety_score": 55.9, "safety_label": "amber", ... }
  ],
  "computed_at": "2024-06-07T14:30:00Z"
}
```

### Explain Route
```
GET /route/explain/{route_id}
```
**Response:** `200 OK`
```json
{
  "route_id": "550e8400-...",
  "safety_score": 74.2,
  "distance_m": 3250.5,
  "eta_seconds": 480,
  "segments": [
    {
      "segment_id": 12345,
      "road_name": "100 Feet Road",
      "length_m": 450.3,
      "safety_score": 82.0,
      "cctv_score": 20.0,
      "crowd_score": 18.0,
      "lighting_score": 12.0,
      "emergency_score": 14.0,
      "crime_penalty": 2.0,
      "is_unsafe": false
    }
  ],
  "summary": "This route covers 3251m with an estimated travel time of 8 minutes. Overall safety score: 74.2/100. 83% of segments are rated safe (score ≥ 50). ⚠️ 2 segment(s) have safety scores below 50.",
  "safest_segment": { ... },
  "most_dangerous_segment": { ... }
}
```

---

## Safety Scores

### Segment Score
```
GET /safety/score/{segment_id}
```

### Safety Heatmap
```
GET /safety/heatmap?min_lat=12.9&min_lng=77.5&max_lat=13.0&max_lng=77.7&limit=2000
```
Returns a GeoJSON FeatureCollection for map overlay rendering.

---

## SOS 🔒

### Trigger SOS Alert
```
POST /sos/trigger
```
**Body:**
```json
{
  "lat": 12.9352,
  "lng": 77.6245
}
```
**Response:** `200 OK`
```json
{
  "event_id": "...",
  "status": "triggered",
  "contacts_notified": 2,
  "contact_names": ["Mom", "Roommate"],
  "message": "SOS alert sent successfully"
}
```

---

## Community Reports

### Create Report 🔒
```
POST /report/create
```
**Body:**
```json
{
  "lat": 12.9352,
  "lng": 77.6245,
  "report_type": "harassment",
  "description": "Poorly lit area near park, suspicious activity observed"
}
```
Valid `report_type` values: `harassment`, `poor_lighting`, `suspicious_activity`, `unsafe_road`

### Nearby Reports
```
GET /report/nearby?lat=12.9352&lng=77.6245&radius_m=500&report_type=harassment
```

---

## Safe Zones

### Find Nearby
```
GET /safe-zones/nearby?lat=12.9352&lng=77.6245&types=police_station,hospital&radius_m=2000
```
Valid `types`: `police_station`, `women_police`, `hospital`, `metro_station`, `bus_stop`, `namma_112_post`

---

## WebSocket

### Live Updates
```
WS ws://localhost:8000/api/v1/ws/live
```

**Protocol:**
```json
// Client → Server: Authenticate
{"type": "auth", "user_id": "your-user-id"}

// Client → Server: Location update
{"type": "location", "lat": 12.9352, "lng": 77.6245}

// Server → Client: Danger alert
{"type": "danger_alert", "data": {
  "segment_id": 12345,
  "safety_score": 35.0,
  "road_name": "8th Cross Road",
  "message": "⚠️ You are entering a low-safety area on 8th Cross Road. Safety score: 35/100."
}}

// Server → Client: Score update
{"type": "score_update", "data": {
  "updated_segments": [12345, 12346],
  "message": "Safety scores updated for 2 segments."
}}
```

---

## Health Check
```
GET /health
```
Returns graph status and node/edge counts.

---

## Error Codes

| Code | Meaning |
|------|---------|
| 400  | Bad request — invalid input |
| 401  | Unauthorized — missing or invalid JWT |
| 404  | Not found — resource doesn't exist |
| 422  | Validation error — malformed request body |
| 500  | Internal server error |
| 503  | Service unavailable — graph not loaded |
