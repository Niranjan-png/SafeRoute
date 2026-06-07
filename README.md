# SafeRoute Bengaluru 🚦🛡️

SafeRoute is a safety-first routing engine and community safety app built for Bengaluru. It prioritizes user safety over pure travel speed by combining OSM road networks with real and simulated safety data (CCTV coverage, crime incidents, lighting, and emergency facilities).

This repository contains the complete **Backend API**. The **Frontend** will be added to this repository by the frontend team.

## 📂 Project Structure

```
SafeRoute/
├── backend/                # FastAPI backend, Celery workers, and PostGIS data
│   ├── app/                # Core application logic
│   ├── data/               # OSM and synthetic seeding scripts
│   ├── docs/               # Technical backend documentation
│   └── tests/              # Pytest test suite
├── frontend/               # (To be added) React/Next.js/Flutter application
├── infra/                  # Docker Compose files for DB/Redis
└── SafeRoute_Bengaluru_PRD.md # Product Requirements Document
```

---

## 🚀 For Frontend Developers: Getting Started

The backend provides a complete RESTful API and WebSocket server. To start building the frontend against it, you need to spin up the local backend server.

### Prerequisites
1. **Python 3.11+**
2. **Docker Desktop** (needed for the PostGIS database and Redis)

### Step 1: Start the Database
The backend relies on PostgreSQL (with PostGIS) and Redis.
```bash
cd infra
docker-compose up -d
```

### Step 2: Setup the Backend Environment
Open a new terminal in the `backend/` folder and setup the virtual environment.

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate      # On Windows
# source venv/bin/activate # On Mac/Linux

# Install dependencies (Poetry is recommended, but you can install directly via pip if needed)
pip install poetry
poetry install
```

### Step 3: Start the Backend Server
```bash
# Run the API server with auto-reload
uvicorn app.main:app --reload
```

The API will now be running at `http://127.0.0.1:8000`.

---

## 📖 API Documentation

Once the backend is running, the interactive API documentation is automatically available here:
👉 **[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)**

This Swagger UI allows you to test all endpoints, see expected JSON payloads, and view error codes. There is also a detailed manual reference available in [`docs/api.md`](docs/api.md).

### 🔐 Authentication (Important!)
Most endpoints are protected by JWT authentication. For development purposes, the SMS gateway is mocked.

**To log in and get a token:**
1. Call `POST /api/v1/auth/request-otp` with any dummy phone number (e.g. `+919876543210`).
2. Call `POST /api/v1/auth/verify-otp` with the same phone number and the **development OTP**: `123456`.
3. You will receive an `access_token` to use in your `Authorization: Bearer <token>` headers for all other requests.

*(Note: If using the "Authorize" button in Swagger UI, type your phone number as the username and `123456` as the password).*

---

## 🗺️ Key Features to Integrate

Here are the primary flows you will need to build in the frontend:

### 1. Safety-Weighted Routing
Endpoint: `POST /api/v1/route/options`
- Provide `source` and `destination` coordinates.
- It returns 3 distinct route options in GeoJSON format.
- Render the GeoJSON polylines on a map (e.g. Mapbox, Leaflet). Each segment in the polyline has a `safety_score` property (0-100) you can use to color-code the road (e.g., Red = unsafe, Green = safe).

### 2. Live Safety Heatmap
Endpoint: `GET /api/v1/safety/heatmap`
- Pass bounding box parameters based on the user's visible map bounds.
- Renders a GeoJSON FeatureCollection of all road segments and their safety scores.

### 3. SOS Trigger
Endpoint: `POST /api/v1/sos/trigger`
- Triggered by an emergency button. Sends mocked SMS messages to emergency contacts.

### 4. Real-time Danger Alerts (WebSocket)
Endpoint: `ws://127.0.0.1:8000/api/v1/ws/live`
- Connect to this WebSocket and send the user's live GPS coordinates.
- The server will push `DANGER_ALERT` JSON messages if the user enters a road segment with a safety score below `50`.

---

*For full project requirements, refer to the [PRD](SafeRoute_Bengaluru_PRD.md).*
