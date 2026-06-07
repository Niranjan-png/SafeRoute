"""
Seed a synthetic road network for SafeRoute Bengaluru testing.

Creates a grid-based road network across 6 key Bengaluru neighborhoods
with realistic road names, safety scores, and infrastructure data.
Runs in ~30 seconds instead of hours.
"""

import asyncio
import logging
import math
import random

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger(__name__)

DATABASE_URL = "postgresql+asyncpg://saferoute:saferoute_dev@localhost:5432/saferoute"

# Key Bengaluru neighborhoods with center coords
NEIGHBORHOODS = {
    "Koramangala": {"center": (12.9352, 77.6245), "grid": 8, "safety_base": 72},
    "Indiranagar": {"center": (12.9784, 77.6408), "grid": 8, "safety_base": 78},
    "MG Road": {"center": (12.9756, 77.6068), "grid": 6, "safety_base": 65},
    "Whitefield": {"center": (12.9698, 77.7500), "grid": 7, "safety_base": 70},
    "Majestic": {"center": (12.9716, 77.5946), "grid": 7, "safety_base": 55},
    "JP Nagar": {"center": (12.9063, 77.5857), "grid": 7, "safety_base": 68},
    "HSR Layout": {"center": (12.9116, 77.6389), "grid": 7, "safety_base": 75},
    "Jayanagar": {"center": (12.9250, 77.5838), "grid": 7, "safety_base": 74},
}

# Road name templates per neighborhood
ROAD_NAMES = {
    "Koramangala": ["80 Feet Road", "100 Feet Road", "Forum Road", "St Johns Road",
                     "1st Block Main", "4th Block Main", "5th Block Cross", "6th Block Road"],
    "Indiranagar": ["100 Feet Road", "12th Main", "CMH Road", "Defence Colony Road",
                     "HAL 2nd Stage", "Chinmaya Mission Road", "ESI Hospital Road", "80 Feet Road"],
    "MG Road": ["MG Road", "Brigade Road", "Church Street", "St Marks Road",
                 "Residency Road", "Museum Road", "Cubbon Road", "Vittal Mallya Road"],
    "Whitefield": ["Whitefield Main Road", "ITPL Road", "Varthur Main Road", "Hope Farm Road",
                    "Kadugodi Main Road", "SAP Labs Road", "Palm Meadows Road", "Nallurhalli Road"],
    "Majestic": ["Dhanvanthri Road", "Tank Bund Road", "Seshadri Road", "Race Course Road",
                  "Mysore Road", "JC Road", "KG Road", "Avenue Road"],
    "JP Nagar": ["24th Main Road", "15th Cross Road", "Bannerghatta Road", "Dollar Colony Road",
                  "6th Phase Main", "Sarakki Signal Road", "Puttenahalli Road", "Gottigere Road"],
    "HSR Layout": ["27th Main Road", "Outer Ring Road", "14th Main Road", "Sector 2 Main",
                    "BDA Complex Road", "Agara Lake Road", "17th Cross Road", "19th Main Road"],
    "Jayanagar": ["30th Main Road", "11th Main Road", "4th Block Main", "South End Circle Road",
                   "9th Block Road", "Ashoka Pillar Road", "40th Cross Road", "33rd Cross Road"],
}

ROAD_TYPES = ["primary", "secondary", "tertiary", "residential", "residential"]

# Connector roads between neighborhoods
CONNECTORS = [
    ("Koramangala", "Indiranagar", "Old Airport Road"),
    ("Koramangala", "MG Road", "Hosur Road"),
    ("MG Road", "Majestic", "KG Road"),
    ("Indiranagar", "Whitefield", "Old Madras Road"),
    ("Koramangala", "JP Nagar", "Bannerghatta Road"),
    ("Koramangala", "HSR Layout", "Outer Ring Road"),
    ("HSR Layout", "JP Nagar", "Bannerghatta Main Road"),
    ("JP Nagar", "Jayanagar", "26th Main Road"),
    ("Jayanagar", "MG Road", "Lalbagh Road"),
    ("Jayanagar", "Majestic", "DVG Road"),
]


def haversine(lat1, lon1, lat2, lon2):
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


async def seed():
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as db:
        # Check current state
        result = await db.execute(text("SELECT COUNT(*) FROM nodes"))
        existing = result.scalar()
        if existing > 0:
            logger.info(f"Found {existing} existing nodes. Clearing tables...")
            await db.execute(text("TRUNCATE road_segments, nodes CASCADE"))
            await db.commit()

        node_id_counter = 1000
        segment_id_counter = 1
        neighborhood_nodes = {}  # {neighborhood: {(row,col): node_id}}
        node_coords = {}  # {node_id: (lat, lng)}

        # === Phase 1: Create grid nodes for each neighborhood ===
        logger.info("📍 Creating neighborhood grid nodes...")
        for hood_name, hood in NEIGHBORHOODS.items():
            center_lat, center_lng = hood["center"]
            grid_size = hood["grid"]
            spacing = 0.002  # ~220m between nodes

            hood_nodes = {}
            for row in range(grid_size):
                for col in range(grid_size):
                    lat = center_lat + (row - grid_size / 2) * spacing + random.uniform(-0.0002, 0.0002)
                    lng = center_lng + (col - grid_size / 2) * spacing + random.uniform(-0.0002, 0.0002)
                    nid = node_id_counter
                    node_id_counter += 1
                    hood_nodes[(row, col)] = nid
                    node_coords[nid] = (lat, lng)

                    await db.execute(text("""
                        INSERT INTO nodes (node_id, geom, node_type)
                        VALUES (:nid, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326), 'intersection')
                        ON CONFLICT (node_id) DO NOTHING
                    """), {"nid": nid, "lat": lat, "lng": lng})

            neighborhood_nodes[hood_name] = hood_nodes
            logger.info(f"  ✅ {hood_name}: {len(hood_nodes)} nodes")

        await db.commit()

        # === Phase 2: Create edges (road segments) within each neighborhood ===
        logger.info("🛣️  Creating road segments...")
        for hood_name, hood in NEIGHBORHOODS.items():
            grid_size = hood["grid"]
            safety_base = hood["safety_base"]
            hood_nodes = neighborhood_nodes[hood_name]
            roads = ROAD_NAMES.get(hood_name, ["Main Road"] * 8)

            for row in range(grid_size):
                for col in range(grid_size):
                    nid = hood_nodes[(row, col)]
                    lat1, lng1 = node_coords[nid]

                    # Connect to right neighbor
                    if col < grid_size - 1:
                        neighbor = hood_nodes[(row, col + 1)]
                        lat2, lng2 = node_coords[neighbor]
                        dist = haversine(lat1, lng1, lat2, lng2)
                        safety = max(20, min(95, safety_base + random.uniform(-15, 15)))
                        road_name = roads[row % len(roads)]
                        road_type = random.choice(ROAD_TYPES)

                        wkt = f"LINESTRING({lng1} {lat1}, {lng2} {lat2})"
                        await db.execute(text("""
                            INSERT INTO road_segments
                                (segment_id, start_node, end_node, geom, length_m,
                                 road_name, road_type, is_bidirectional,
                                 safety_score, cctv_score, crowd_score, lighting_score,
                                 emergency_score, crime_penalty, score_updated_at)
                            VALUES
                                (:sid, :sn, :en, ST_SetSRID(ST_GeomFromText(:wkt), 4326), :len,
                                 :rn, :rt, true, :ss, :cctv, :crowd, :light, :emg, :crime, CURRENT_TIMESTAMP)
                            ON CONFLICT (segment_id) DO NOTHING
                        """), {
                            "sid": segment_id_counter, "sn": nid, "en": neighbor, "wkt": wkt,
                            "len": dist, "rn": road_name, "rt": road_type,
                            "ss": safety, "cctv": random.uniform(30, 90),
                            "crowd": random.uniform(20, 80), "light": random.uniform(40, 95),
                            "emg": random.uniform(30, 85), "crime": random.uniform(0, 25),
                        })
                        segment_id_counter += 1

                        # Reverse direction
                        await db.execute(text("""
                            INSERT INTO road_segments
                                (segment_id, start_node, end_node, geom, length_m,
                                 road_name, road_type, is_bidirectional,
                                 safety_score, cctv_score, crowd_score, lighting_score,
                                 emergency_score, crime_penalty, score_updated_at)
                            VALUES
                                (:sid, :sn, :en, ST_SetSRID(ST_GeomFromText(:wkt), 4326), :len,
                                 :rn, :rt, true, :ss, :cctv, :crowd, :light, :emg, :crime, CURRENT_TIMESTAMP)
                            ON CONFLICT (segment_id) DO NOTHING
                        """), {
                            "sid": segment_id_counter, "sn": neighbor, "en": nid,
                            "wkt": f"LINESTRING({lng2} {lat2}, {lng1} {lat1})",
                            "len": dist, "rn": road_name, "rt": road_type,
                            "ss": safety, "cctv": random.uniform(30, 90),
                            "crowd": random.uniform(20, 80), "light": random.uniform(40, 95),
                            "emg": random.uniform(30, 85), "crime": random.uniform(0, 25),
                        })
                        segment_id_counter += 1

                    # Connect to bottom neighbor
                    if row < grid_size - 1:
                        neighbor = hood_nodes[(row + 1, col)]
                        lat2, lng2 = node_coords[neighbor]
                        dist = haversine(lat1, lng1, lat2, lng2)
                        safety = max(20, min(95, safety_base + random.uniform(-15, 15)))
                        road_name = roads[col % len(roads)]
                        road_type = random.choice(ROAD_TYPES)

                        wkt = f"LINESTRING({lng1} {lat1}, {lng2} {lat2})"
                        await db.execute(text("""
                            INSERT INTO road_segments
                                (segment_id, start_node, end_node, geom, length_m,
                                 road_name, road_type, is_bidirectional,
                                 safety_score, cctv_score, crowd_score, lighting_score,
                                 emergency_score, crime_penalty, score_updated_at)
                            VALUES
                                (:sid, :sn, :en, ST_SetSRID(ST_GeomFromText(:wkt), 4326), :len,
                                 :rn, :rt, true, :ss, :cctv, :crowd, :light, :emg, :crime, CURRENT_TIMESTAMP)
                            ON CONFLICT (segment_id) DO NOTHING
                        """), {
                            "sid": segment_id_counter, "sn": nid, "en": neighbor, "wkt": wkt,
                            "len": dist, "rn": road_name, "rt": road_type,
                            "ss": safety, "cctv": random.uniform(30, 90),
                            "crowd": random.uniform(20, 80), "light": random.uniform(40, 95),
                            "emg": random.uniform(30, 85), "crime": random.uniform(0, 25),
                        })
                        segment_id_counter += 1

                        # Reverse direction
                        await db.execute(text("""
                            INSERT INTO road_segments
                                (segment_id, start_node, end_node, geom, length_m,
                                 road_name, road_type, is_bidirectional,
                                 safety_score, cctv_score, crowd_score, lighting_score,
                                 emergency_score, crime_penalty, score_updated_at)
                            VALUES
                                (:sid, :sn, :en, ST_SetSRID(ST_GeomFromText(:wkt), 4326), :len,
                                 :rn, :rt, true, :ss, :cctv, :crowd, :light, :emg, :crime, CURRENT_TIMESTAMP)
                            ON CONFLICT (segment_id) DO NOTHING
                        """), {
                            "sid": segment_id_counter, "sn": neighbor, "en": nid,
                            "wkt": f"LINESTRING({lng2} {lat2}, {lng1} {lat1})",
                            "len": dist, "rn": road_name, "rt": road_type,
                            "ss": safety, "cctv": random.uniform(30, 90),
                            "crowd": random.uniform(20, 80), "light": random.uniform(40, 95),
                            "emg": random.uniform(30, 85), "crime": random.uniform(0, 25),
                        })
                        segment_id_counter += 1

            logger.info(f"  ✅ {hood_name}: segments created")

        await db.commit()

        # === Phase 3: Create connector roads between neighborhoods ===
        logger.info("🔗 Creating connector roads between neighborhoods...")
        for hood_a, hood_b, road_name in CONNECTORS:
            nodes_a = neighborhood_nodes[hood_a]
            nodes_b = neighborhood_nodes[hood_b]
            grid_a = NEIGHBORHOODS[hood_a]["grid"]
            grid_b = NEIGHBORHOODS[hood_b]["grid"]

            # Pick edge node from each neighborhood (closest edge)
            edge_a = nodes_a[(grid_a - 1, grid_a // 2)]
            edge_b = nodes_b[(0, grid_b // 2)]

            lat1, lng1 = node_coords[edge_a]
            lat2, lng2 = node_coords[edge_b]

            # Create intermediate nodes along the connector
            n_intermediate = 5
            prev_node = edge_a
            for i in range(1, n_intermediate + 1):
                frac = i / (n_intermediate + 1)
                lat_i = lat1 + frac * (lat2 - lat1) + random.uniform(-0.001, 0.001)
                lng_i = lng1 + frac * (lng2 - lng1) + random.uniform(-0.001, 0.001)
                mid_node = node_id_counter
                node_id_counter += 1
                node_coords[mid_node] = (lat_i, lng_i)

                await db.execute(text("""
                    INSERT INTO nodes (node_id, geom, node_type)
                    VALUES (:nid, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326), 'intersection')
                    ON CONFLICT (node_id) DO NOTHING
                """), {"nid": mid_node, "lat": lat_i, "lng": lng_i})

                plat, plng = node_coords[prev_node]
                dist = haversine(plat, plng, lat_i, lng_i)
                safety = max(40, min(85, 60 + random.uniform(-10, 15)))

                for sn, en, l1, l2 in [(prev_node, mid_node, plat, plng), (mid_node, prev_node, lat_i, lng_i)]:
                    elat, elng = node_coords[en]
                    slat, slng = node_coords[sn]
                    await db.execute(text("""
                        INSERT INTO road_segments
                            (segment_id, start_node, end_node, geom, length_m,
                             road_name, road_type, is_bidirectional,
                             safety_score, cctv_score, crowd_score, lighting_score,
                             emergency_score, crime_penalty, score_updated_at)
                        VALUES
                            (:sid, :sn, :en, ST_SetSRID(ST_GeomFromText(:wkt), 4326), :len,
                             :rn, 'primary', true, :ss, :cctv, :crowd, :light, :emg, :crime, CURRENT_TIMESTAMP)
                        ON CONFLICT (segment_id) DO NOTHING
                    """), {
                        "sid": segment_id_counter, "sn": sn, "en": en,
                        "wkt": f"LINESTRING({slng} {slat}, {elng} {elat})",
                        "len": dist, "rn": road_name,
                        "ss": safety, "cctv": random.uniform(40, 80),
                        "crowd": random.uniform(30, 70), "light": random.uniform(50, 85),
                        "emg": random.uniform(40, 75), "crime": random.uniform(0, 20),
                    })
                    segment_id_counter += 1

                prev_node = mid_node

            # Final link to edge_b
            plat, plng = node_coords[prev_node]
            dist = haversine(plat, plng, lat2, lng2)
            safety = max(40, min(85, 60 + random.uniform(-10, 15)))
            for sn, en in [(prev_node, edge_b), (edge_b, prev_node)]:
                slat, slng = node_coords[sn]
                elat, elng = node_coords[en]
                await db.execute(text("""
                    INSERT INTO road_segments
                        (segment_id, start_node, end_node, geom, length_m,
                         road_name, road_type, is_bidirectional,
                         safety_score, cctv_score, crowd_score, lighting_score,
                         emergency_score, crime_penalty, score_updated_at)
                    VALUES
                        (:sid, :sn, :en, ST_SetSRID(ST_GeomFromText(:wkt), 4326), :len,
                         :rn, 'primary', true, :ss, :cctv, :crowd, :light, :emg, :crime, CURRENT_TIMESTAMP)
                    ON CONFLICT (segment_id) DO NOTHING
                """), {
                    "sid": segment_id_counter, "sn": sn, "en": en,
                    "wkt": f"LINESTRING({slng} {slat}, {elng} {elat})",
                    "len": dist, "rn": road_name,
                    "ss": safety, "cctv": random.uniform(40, 80),
                    "crowd": random.uniform(30, 70), "light": random.uniform(50, 85),
                    "emg": random.uniform(40, 75), "crime": random.uniform(0, 20),
                })
                segment_id_counter += 1

            logger.info(f"  ✅ {hood_a} ↔ {hood_b} via {road_name}")

        await db.commit()

        # === Phase 4: Seed emergency facilities ===
        logger.info("🏥 Seeding emergency facilities...")
        facilities = [
            ("Koramangala Police Station", "police_station", 12.9345, 77.6260, True, "080-25531555"),
            ("Indiranagar Police Station", "police_station", 12.9780, 77.6400, True, "080-25210333"),
            ("MG Road Police Station", "police_station", 12.9750, 77.6060, True, "080-22943700"),
            ("St Johns Hospital", "hospital", 12.9290, 77.6210, True, "080-22065000"),
            ("Manipal Hospital", "hospital", 12.9630, 77.5960, True, "080-25024444"),
            ("Apollo Hospital", "hospital", 12.9355, 77.6115, True, "080-26304050"),
            ("Jayanagar Fire Station", "fire_station", 12.9250, 77.5830, True, "101"),
            ("Whitefield Fire Station", "fire_station", 12.9700, 77.7490, True, "101"),
            ("Koramangala Fire Station", "fire_station", 12.9340, 77.6230, True, "101"),
            ("Bowring Hospital", "hospital", 12.9850, 77.5990, True, "080-25591325"),
            ("Victoria Hospital", "hospital", 12.9570, 77.5730, True, "080-26704550"),
            ("HSR Police Station", "police_station", 12.9120, 77.6380, True, "080-22975656"),
            ("JP Nagar Police Station", "police_station", 12.9060, 77.5850, True, "080-26583100"),
            ("Jayanagar Police Station", "police_station", 12.9240, 77.5835, True, "080-26543100"),
        ]
        for name, ftype, lat, lng, is_24hr, phone in facilities:
            await db.execute(text("""
                INSERT INTO emergency_facilities (facility_id, facility_type, name, geom, phone, is_24hr)
                VALUES (gen_random_uuid(), :ft, :name, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326), :phone, :is24)
                ON CONFLICT DO NOTHING
            """), {"ft": ftype, "name": name, "lat": lat, "lng": lng, "phone": phone, "is24": is_24hr})
        await db.commit()

        # Final counts
        nodes_count = (await db.execute(text("SELECT COUNT(*) FROM nodes"))).scalar()
        segments_count = (await db.execute(text("SELECT COUNT(*) FROM road_segments"))).scalar()
        facilities_count = (await db.execute(text("SELECT COUNT(*) FROM emergency_facilities"))).scalar()
        cctv_count = (await db.execute(text("SELECT COUNT(*) FROM cctv_cameras"))).scalar()
        crime_count = (await db.execute(text("SELECT COUNT(*) FROM crime_incidents"))).scalar()
        light_count = (await db.execute(text("SELECT COUNT(*) FROM streetlights"))).scalar()

        logger.info("=" * 50)
        logger.info("🎉 Synthetic seed complete!")
        logger.info(f"  📍 Nodes:               {nodes_count}")
        logger.info(f"  🛣️  Road Segments:       {segments_count}")
        logger.info(f"  🏥 Emergency Facilities: {facilities_count}")
        logger.info(f"  📷 CCTV Cameras:         {cctv_count}")
        logger.info(f"  🚨 Crime Incidents:      {crime_count}")
        logger.info(f"  💡 Streetlights:         {light_count}")
        logger.info("=" * 50)

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
