"""
Generate realistic synthetic data for restricted data sources.

Generates CCTV cameras, crime incidents, and streetlights seeded
around real Bengaluru locations for plausible safety scores.

Usage:
    python -m data.scripts.generate_synthetic
"""

import asyncio
import logging
import random
from datetime import datetime, timedelta

import numpy as np
from sqlalchemy import text

from app.models.base import async_session_factory

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger(__name__)

# Seed for reproducibility
random.seed(42)
np.random.seed(42)

# ============================================================================
# Bengaluru landmark coordinates for anchoring synthetic data
# ============================================================================

# Major junctions / high-surveillance areas (CCTV clusters)
HIGH_SURVEILLANCE_POINTS = [
    (12.9716, 77.5946, "Majestic / KR Market"),
    (12.9352, 77.6245, "Koramangala"),
    (12.9784, 77.6408, "Indiranagar"),
    (12.9767, 77.5713, "Rajajinagar"),
    (12.9563, 77.6013, "MG Road / Brigade Road"),
    (12.9344, 77.6101, "Jayanagar"),
    (12.9698, 77.7500, "Whitefield"),
    (12.8449, 77.6633, "Electronic City"),
    (12.9250, 77.5897, "Banashankari"),
    (12.9941, 77.5604, "Yeshwanthpur"),
    (13.0067, 77.5671, "Malleshwaram"),
    (12.9854, 77.6047, "Cubbon Park"),
    (12.9996, 77.5387, "Peenya"),
    (12.9101, 77.6446, "HSR Layout"),
    (12.9063, 77.5857, "JP Nagar"),
    (12.9177, 77.6238, "BTM Layout"),
]

# Known trouble spots (crime clusters)
CRIME_HOTSPOTS = [
    (12.9753, 77.5717, "Majestic area", 1.5),         # High foot traffic, petty crimes
    (12.9400, 77.5850, "Banashankari outskirts", 1.0),
    (12.8500, 77.6600, "Electronic City outskirts", 1.2),
    (12.9850, 77.5500, "Rajajinagar industrial", 0.8),
    (12.9600, 77.7400, "Whitefield remote", 1.0),
    (12.9200, 77.5300, "RR Nagar outskirts", 0.7),
    (12.8900, 77.6200, "Silk Board area", 0.6),
    (13.0200, 77.6500, "Hebbal outskirts", 0.5),
    (12.9100, 77.5700, "Kanakapura Road", 0.8),
    (12.8700, 77.6000, "Kengeri outskirts", 0.7),
]

# Crime type definitions with weights (per PRD §5.2)
CRIME_TYPES = [
    ("harassment", 2.0, 0.35),    # type, weight, probability
    ("stalking", 2.5, 0.25),
    ("snatching", 1.0, 0.20),
    ("robbery", 1.5, 0.15),
    ("assault", 3.0, 0.05),
]


async def generate_all_synthetic_data():
    """Generate all synthetic data."""
    async with async_session_factory() as db:
        await generate_cctv_cameras(db)
        await generate_crime_incidents(db)
        await generate_streetlights(db)
        await db.commit()

    logger.info("🎉 All synthetic data generated!")


async def generate_cctv_cameras(db, total: int = 5000):
    """
    Generate realistic CCTV camera locations.

    Strategy:
    - High density (10-20) around police stations, metro stations, major junctions
    - Medium density (5-10) along primary roads
    - Low density (1-3) on secondary residential roads
    - Gaussian spatial noise to avoid perfect clustering
    """
    logger.info(f"📹 Generating {total} synthetic CCTV cameras...")

    await db.execute(text("DELETE FROM cctv_cameras"))

    cameras_placed = 0

    # 1. High-density clusters around major junctions (60% of cameras)
    high_density_count = int(total * 0.60)
    per_cluster = high_density_count // len(HIGH_SURVEILLANCE_POINTS)

    for lat, lng, name in HIGH_SURVEILLANCE_POINTS:
        n = per_cluster + random.randint(-3, 5)
        for _ in range(n):
            # Gaussian noise: σ=0.001° ≈ 100m
            cam_lat = lat + np.random.normal(0, 0.001)
            cam_lng = lng + np.random.normal(0, 0.001)
            operator = random.choice(["police", "bbmp", "bbmp", "private"])

            await db.execute(
                text("""
                    INSERT INTO cctv_cameras (geom, operator, is_active)
                    VALUES (ST_SetSRID(ST_MakePoint(:lng, :lat), 4326), :operator, :active)
                """),
                {"lat": cam_lat, "lng": cam_lng, "operator": operator, "active": random.random() > 0.05},
            )
            cameras_placed += 1

    # 2. Medium-density along major roads (30% of cameras)
    medium_count = int(total * 0.30)
    for _ in range(medium_count):
        # Pick two random surveillance points and place cameras along the line
        p1 = random.choice(HIGH_SURVEILLANCE_POINTS)
        p2 = random.choice(HIGH_SURVEILLANCE_POINTS)
        t = random.random()
        cam_lat = p1[0] + t * (p2[0] - p1[0]) + np.random.normal(0, 0.0005)
        cam_lng = p1[1] + t * (p2[1] - p1[1]) + np.random.normal(0, 0.0005)
        operator = random.choice(["bbmp", "private", "private"])

        await db.execute(
            text("""
                INSERT INTO cctv_cameras (geom, operator, is_active)
                VALUES (ST_SetSRID(ST_MakePoint(:lng, :lat), 4326), :operator, :active)
            """),
            {"lat": cam_lat, "lng": cam_lng, "operator": operator, "active": random.random() > 0.1},
        )
        cameras_placed += 1

    # 3. Sparse cameras in residential areas (10%)
    sparse_count = total - cameras_placed
    for _ in range(sparse_count):
        # Random point within Bengaluru bounds
        cam_lat = random.uniform(12.82, 13.05)
        cam_lng = random.uniform(77.48, 77.78)

        await db.execute(
            text("""
                INSERT INTO cctv_cameras (geom, operator, is_active)
                VALUES (ST_SetSRID(ST_MakePoint(:lng, :lat), 4326), :operator, :active)
            """),
            {"lat": cam_lat, "lng": cam_lng, "operator": "private", "active": random.random() > 0.15},
        )
        cameras_placed += 1

    logger.info(f"✅ Generated {cameras_placed} CCTV cameras")


async def generate_crime_incidents(db, total: int = 2000):
    """
    Generate realistic crime incident data.

    Strategy:
    - Clustered around known trouble spots with Gaussian noise
    - Crime type distribution per PRD: Harassment 35%, Stalking 25%, etc.
    - 60% between 8PM-6AM, 40% daytime
    - 40% in last 6 months, 60% in 6-12 months ago
    """
    logger.info(f"🔴 Generating {total} synthetic crime incidents...")

    await db.execute(text("DELETE FROM crime_incidents"))

    now = datetime.utcnow()
    crime_types_flat = [(ct, w) for ct, w, _ in CRIME_TYPES]
    crime_probs = [p for _, _, p in CRIME_TYPES]

    count = 0
    for _ in range(total):
        # Pick a crime hotspot (weighted by severity)
        hotspot_weights = [h[3] for h in CRIME_HOTSPOTS]
        total_w = sum(hotspot_weights)
        hotspot_probs = [w / total_w for w in hotspot_weights]
        hotspot = CRIME_HOTSPOTS[np.random.choice(len(CRIME_HOTSPOTS), p=hotspot_probs)]

        # Position: Gaussian noise around hotspot (σ=0.005° ≈ 500m)
        lat = hotspot[0] + np.random.normal(0, 0.005)
        lng = hotspot[1] + np.random.normal(0, 0.005)

        # Crime type (weighted random)
        idx = np.random.choice(len(CRIME_TYPES), p=crime_probs)
        crime_type, crime_weight, _ = CRIME_TYPES[idx]

        # Source
        source = random.choice(["NCRB", "NCRB", "community_report", "news"])

        # Recency: 40% last 6 months, 60% 6-12 months
        if random.random() < 0.4:
            days_ago = random.randint(1, 180)
        else:
            days_ago = random.randint(180, 365)

        occurred_at = now - timedelta(days=days_ago)

        # Time of day: 60% night (8PM-6AM), 40% day
        if random.random() < 0.6:
            hour = random.choice(list(range(20, 24)) + list(range(0, 6)))
        else:
            hour = random.randint(6, 19)
        occurred_at = occurred_at.replace(hour=hour, minute=random.randint(0, 59))

        await db.execute(
            text("""
                INSERT INTO crime_incidents
                    (geom, crime_type, crime_weight, source, occurred_at, is_verified)
                VALUES
                    (ST_SetSRID(ST_MakePoint(:lng, :lat), 4326),
                     :crime_type, :crime_weight, :source, :occurred_at, :is_verified)
            """),
            {
                "lat": lat, "lng": lng,
                "crime_type": crime_type,
                "crime_weight": crime_weight,
                "source": source,
                "occurred_at": occurred_at,
                "is_verified": source == "NCRB",
            },
        )
        count += 1

    logger.info(f"✅ Generated {count} crime incidents")


async def generate_streetlights(db, total: int = 8000):
    """
    Generate realistic streetlight locations.

    Strategy:
    - Dense along primary/secondary roads (every 30-50m)
    - Sparse on residential roads (every 100-200m)
    - Concentrated around landmarks and major corridors
    """
    logger.info(f"💡 Generating {total} synthetic streetlights...")

    await db.execute(text("DELETE FROM streetlights"))

    count = 0

    # 1. Dense along major corridors (70%)
    dense_count = int(total * 0.7)
    for _ in range(dense_count):
        # Pick two landmarks and place lights along the corridor
        p1 = random.choice(HIGH_SURVEILLANCE_POINTS)
        p2 = random.choice(HIGH_SURVEILLANCE_POINTS)
        t = random.random()
        lat = p1[0] + t * (p2[0] - p1[0]) + np.random.normal(0, 0.0002)
        lng = p1[1] + t * (p2[1] - p1[1]) + np.random.normal(0, 0.0002)

        await db.execute(
            text("""
                INSERT INTO streetlights (geom, source, is_active)
                VALUES (ST_SetSRID(ST_MakePoint(:lng, :lat), 4326), :source, :active)
            """),
            {"lat": lat, "lng": lng, "source": "simulated", "active": random.random() > 0.05},
        )
        count += 1

    # 2. Sparse in residential areas (30%)
    sparse_count = total - count
    for _ in range(sparse_count):
        lat = random.uniform(12.82, 13.05)
        lng = random.uniform(77.48, 77.78)

        await db.execute(
            text("""
                INSERT INTO streetlights (geom, source, is_active)
                VALUES (ST_SetSRID(ST_MakePoint(:lng, :lat), 4326), :source, :active)
            """),
            {"lat": lat, "lng": lng, "source": "simulated", "active": random.random() > 0.15},
        )
        count += 1

    logger.info(f"✅ Generated {count} streetlights")


if __name__ == "__main__":
    asyncio.run(generate_all_synthetic_data())
