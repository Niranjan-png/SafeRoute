"""
Import emergency facilities from OpenStreetMap via OSMnx.

Downloads police stations, hospitals, metro stations, and bus stops
for Bengaluru and inserts them into the PostGIS database.

Usage:
    python -m data.scripts.import_emergency
"""

import asyncio
import logging

import osmnx as ox
from sqlalchemy import text

from app.models.base import async_session_factory

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger(__name__)

PLACE_NAME = "Bengaluru, India"

async def import_emergency_facilities():
    """Download and import emergency facilities from OSM."""
    logger.info(f"📥 Fetching emergency facilities for {PLACE_NAME} using OSMnx...")

    tags = {
        "amenity": ["police", "hospital"],
        "railway": ["station"],
        "station": ["subway"],
        "highway": ["bus_stop"]
    }
    
    try:
        # Fetch features
        gdf = ox.features_from_place(PLACE_NAME, tags=tags)
        logger.info(f"   Found {len(gdf)} potential emergency facilities")
        
        all_facilities = []
        for idx, row in gdf.iterrows():
            # Get center point of the geometry
            geom = row.geometry
            if geom.geom_type == 'Point':
                lat, lon = geom.y, geom.x
            else:
                centroid = geom.centroid
                lat, lon = centroid.y, centroid.x
                
            facility_type = "unknown"
            if row.get("amenity") == "police":
                facility_type = "police_station"
            elif row.get("amenity") == "hospital":
                facility_type = "hospital"
            elif row.get("highway") == "bus_stop":
                facility_type = "bus_stop"
            elif row.get("railway") == "station" or row.get("station") == "subway":
                facility_type = "metro_station"
                
            if facility_type != "unknown":
                name = row.get("name") or row.get("name:en") or f"Unknown {facility_type}"
                phone = row.get("phone") or row.get("contact:phone")
                is_24hr = str(row.get("opening_hours", "")).lower() in ("24/7", "24h")
                
                all_facilities.append({
                    "lat": lat,
                    "lng": lon,
                    "facility_type": facility_type,
                    "name": str(name)[:200] if name else None,
                    "phone": str(phone)[:20] if phone else None,
                    "is_24hr": is_24hr,
                })

        logger.info(f"\n📊 Processed {len(all_facilities)} emergency facilities")

        # Insert into database
        async with async_session_factory() as db:
            logger.info("🗑️  Clearing existing emergency facility data...")
            await db.execute(text("DELETE FROM emergency_facilities"))
            await db.commit()

            logger.info("📝 Inserting facilities...")
            count = 0
            for fac in all_facilities:
                await db.execute(
                    text("""
                        INSERT INTO emergency_facilities
                            (geom, facility_type, name, phone, is_24hr)
                        VALUES
                            (ST_SetSRID(ST_MakePoint(:lng, :lat), 4326),
                             :facility_type, :name, :phone, :is_24hr)
                    """),
                    fac,
                )
                count += 1
            await db.commit()
            logger.info(f"✅ Inserted {count} emergency facilities")

    except Exception as e:
        logger.error(f"❌ Failed to fetch emergency facilities: {e}")

    await import_pois()
    logger.info("🎉 Emergency facility import complete!")


async def import_pois():
    """Import points of interest for the crowd scorer."""
    logger.info(f"📥 Fetching POIs for {PLACE_NAME} using OSMnx...")

    tags = {
        "shop": True,
        "amenity": ["restaurant", "cafe", "fast_food", "atm", "fuel"]
    }
    
    try:
        gdf = ox.features_from_place(PLACE_NAME, tags=tags)
        logger.info(f"   Found {len(gdf)} potential POIs")
        
        all_pois = []
        for idx, row in gdf.iterrows():
            geom = row.geometry
            if geom.geom_type == 'Point':
                lat, lon = geom.y, geom.x
            else:
                centroid = geom.centroid
                lat, lon = centroid.y, centroid.x
                
            poi_type = "shop"
            if row.get("amenity") == "restaurant":
                poi_type = "restaurant"
            elif row.get("amenity") == "cafe":
                poi_type = "cafe"
            elif row.get("amenity") == "fast_food":
                poi_type = "fast_food"
            elif row.get("amenity") == "atm":
                poi_type = "atm"
            elif row.get("amenity") == "fuel":
                poi_type = "petrol_pump"
                
            name = row.get("name") or row.get("name:en")
            is_24hr = str(row.get("opening_hours", "")).lower() in ("24/7", "24h")
            
            all_pois.append({
                "lat": lat,
                "lng": lon,
                "poi_type": poi_type,
                "name": str(name)[:200] if name else None,
                "is_24hr": is_24hr,
            })

        logger.info(f"📊 Processed {len(all_pois)} POIs")

        async with async_session_factory() as db:
            await db.execute(text("DELETE FROM pois"))
            await db.commit()

            count = 0
            for poi in all_pois:
                await db.execute(
                    text("""
                        INSERT INTO pois (geom, poi_type, name, is_24hr)
                        VALUES (ST_SetSRID(ST_MakePoint(:lng, :lat), 4326),
                                :poi_type, :name, :is_24hr)
                    """),
                    poi,
                )
                count += 1
            await db.commit()
            logger.info(f"✅ Inserted {count} POIs")

    except Exception as e:
        logger.error(f"❌ Failed to fetch POIs: {e}")

if __name__ == "__main__":
    asyncio.run(import_emergency_facilities())
