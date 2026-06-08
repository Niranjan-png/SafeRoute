# SafeRoute Bengaluru 🚦🛡️

An AI-powered navigation system optimized for women's safety, utilizing live crowd density, street lighting, and CCTV coverage metrics to compute the safest walking, biking, or driving paths.

SafeRoute is a safety-first routing engine and community safety app built for Bengaluru. It prioritizes user safety over pure travel speed by combining OpenStreetMap (OSM) road networks with real and simulated safety data (CCTV coverage, crime incidents, lighting, and emergency facilities).

Developed by **Niranjan K** and **Tushar Jain**.

---

## 📂 Project Structure

```
SafeRoute/
├── backend/                # FastAPI backend, Celery workers, and PostGIS data
│   ├── app/                # Core application logic
│   ├── data/               # OSM and synthetic seeding scripts
│   ├── docs/               # Technical backend documentation
│   └── tests/              # Pytest test suite
├── frontend/               # Next.js 16 Web Application (React 19, Tailwind v4, Leaflet)
│   └── src/
│       ├── app/            # App router pages (Home, Safety Feed, Settings)
│       ├── components/     # Reusable components (Leaflet Dynamic Map)
│       └── utils/          # Core utilities (API Client, Navigation math)
├── infra/                  # Docker Compose files for DB/Redis
├── .gitignore              # Workspace-wide git ignore rules
├── README.md               # Main project documentation
└── SafeRoute_Bengaluru_PRD.md # Product Requirements Document
```

---

## ✨ Features

- **Safe Navigation Routing**: Choose between Safest, Balanced, and Fastest paths. Safety scores are calculated using live weights for Streetlights, CCTV, Crowd Density, and Security Patrol reports.
- **Turn-by-Turn Directions**: Generates directions dynamically (e.g., "Turn left onto Richmond Road in 250 meters") by calculating geometry headings.
- **Multimodal Routing Options**: Select between Walking 🚶, Biking 🚴, and Driving 🚗 modes. Distance calculations, speed ETAs, and safety scores adapt automatically to your transit choice.
- **Real-Time Geolocation**: Integrated HTML5 Geolocation API. Check your live position with pulsing radar marker waves.
- **Google Maps-Style Navigation HUD**: Simulates active path tracking with an interactive HUD displaying turn arrows, distance counts, step progress bars, and ETA indicators.
- **Community Safety Feed**: Read and broadcast live safety alerts (broken streetlights, suspicious activities, construction blocks) with user verification checks.
- **Auto-SOS & Emergency Control**: Set up trusted contacts and preferences. Features a 3-second abort countdown overlay to prevent accidental SOS alerts.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **Python** (v3.11 or higher)
- **Docker Desktop** (needed for local PostGIS database and Redis)

---

### 2. Backend Setup

The backend relies on PostgreSQL (with PostGIS) and Redis.

#### Step 2.1: Start the Database via Docker
Navigate to the `infra/` folder and run Docker Compose:
```bash
cd infra
docker-compose up -d
```

#### Step 2.2: Setup the Python Environment
Open a terminal in the `backend/` folder:
```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate      # On Windows
# source venv/bin/activate # On Mac/Linux

# Create your local configuration file
copy .env.example .env     # On Windows
# cp .env.example .env     # On Mac/Linux

# Install dependencies via Poetry (Poetry is recommended)
pip install poetry
poetry install
```
*Note: Make sure to edit `.env` to configure your PostgreSQL credentials, Redis URLs, and Twilio API keys.*

#### Step 2.3: Start the Backend API Server
```bash
# Run the API server with auto-reload
poetry run uvicorn app.main:app --reload --port 8000
```
The API server will run at `http://localhost:8000`.

---

### 3. Frontend Setup

Open a terminal in the `frontend/` folder:
```bash
cd frontend

# Install frontend dependencies
npm install

# Start the Next.js development server
npm run dev
```
Open `http://localhost:3000` in your browser to run the web application.

---

## 📖 API Documentation & Integration

Once the backend is running, the interactive Swagger API documentation is available at:
👉 **[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)**

Detailed manual references are also available in [`docs/api.md`](docs/api.md) and the algorithm details in [`docs/algorithm.md`](docs/algorithm.md).

### 🔐 Authentication (Important!)
Most endpoints are protected by JWT authentication. For development purposes, the SMS gateway is mocked.

**To log in and get a token:**
1. Call `POST /api/v1/auth/request-otp` with any dummy phone number (e.g. `+919876543210`).
2. Call `POST /api/v1/auth/verify-otp` with the same phone number and the **development OTP**: `123456`.
3. You will receive an `access_token` to use in your `Authorization: Bearer <token>` headers for all other requests.

*(Note: If using the "Authorize" button in Swagger UI, type your phone number as the username and `123456` as the password).*

### 🗺️ Key Integration Endpoints

#### 1. Safety-Weighted Routing (`POST /api/v1/route/options`)
- Provide `source` and `destination` coordinates.
- It returns 3 distinct route options in GeoJSON format.
- Render the GeoJSON polylines on a map (e.g. Leaflet). Each segment in the polyline has a `safety_score` property (0-100) that you can use to color-code the road (e.g., Red = unsafe, Green = safe).

#### 2. Live Safety Heatmap (`GET /api/v1/safety/heatmap`)
- Pass bounding box parameters based on the user's visible map bounds.
- Renders a GeoJSON FeatureCollection of all road segments and their safety scores.

#### 3. SOS Trigger (`POST /api/v1/sos/trigger`)
- Triggered by an emergency button. Sends mocked SMS messages to emergency contacts.

#### 4. Real-time Danger Alerts (WebSocket `ws://127.0.0.1:8000/api/v1/ws/live`)
- Connect to this WebSocket and send the user's live GPS coordinates.
- The server will push `DANGER_ALERT` JSON messages if the user enters a road segment with a safety score below `50`.

---

*For full project requirements, refer to the [PRD](SafeRoute_Bengaluru_PRD.md).*

