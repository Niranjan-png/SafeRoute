# SafeRoute Bengaluru

An AI-powered navigation system optimized for women's safety, utilizing live crowd density, street lighting, and CCTV coverage metrics to compute the safest walking, biking, or driving paths.

Developed by **Niranjan K** and **Tushar Jain**.

---

## Folder Structure

```
women-safety/
├── frontend/               # Next.js 16 Web Application (React 19, Tailwind v4, Leaflet)
│   ├── src/
│   │   ├── app/            # App router pages (Home, Safety Feed, Settings)
│   │   ├── components/     # Reusable components (Leaflet Dynamic Map)
│   │   └── utils/          # Core utilities (API Client, Navigation math)
│   └── package.json
│
├── backend/                # FastAPI Application (Python 3.12, PostgreSQL + PostGIS)
│   ├── app/                # Core FastAPI routes, models, schemas, and services
│   ├── migrations/         # Alembic database migrations
│   ├── tests/              # Pytest backend test suite
│   ├── pyproject.toml      # Poetry package configuration
│   └── Dockerfile
│
├── .gitignore              # Workspace-wide git ignore rules
└── README.md               # Main project documentation
```

---

## Features

- **Safe Navigation Routing**: Choose between Safest, Balanced, and Fastest paths. Safety scores are calculated using live weights for Streetlights, CCTV, Crowd Density, and Security Patrol reports.
- **Turn-by-Turn Directions**: Generates directions dynamically (e.g., "Turn left onto Richmond Road in 250 meters") by calculating geometry headings.
- **Multimodal Routing Options**: Select between Walking 🚶, Biking 🚴, and Driving 🚗 modes. Distance calculations, speed ETAs, and safety scores adapt automatically to your transit choice.
- **Real-Time Geolocation**: Integrated HTML5 Geolocation API. Check your live position with pulsing radar marker waves.
- **Google Maps-Style Navigation HUD**: Simulates active path tracking with an interactive HUD displaying turn arrows, distance counts, step progress bars, and ETA indicators.
- **Community Safety Feed**: Read and broadcast live safety alerts (broken streetlights, suspicious activities, construction blocks) with user verification checks.
- **Auto-SOS & Emergency Control**: Set up trusted contacts and preferences. Features a 3-second abort countdown overlay to prevent accidental SOS alerts.

---

## Getting Started

### 1. Prerequisites

- **Node.js** (v18 or higher)
- **Python** (v3.11 or higher)
- **PostgreSQL** with **PostGIS** extension
- **Redis** server

### 2. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create your local configuration file:
   ```bash
   copy .env.example .env
   ```
   *Note: Edit `.env` to configure your PostgreSQL credentials, Redis URLs, and Twilio API keys.*
3. Install dependencies and start the FastAPI server:
   ```bash
   poetry install
   poetry run uvicorn app.main:app --reload --port 8000
   ```
   *The backend will run on `http://localhost:8000`.*

### 3. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   *Open `http://localhost:3000` in your browser to run the application.*

---

## License & Contributors

Created for safety mapping in Bengaluru.

- **Niranjan K**
- **Tushar Jain**
