"""
Import Bengaluru's road network from OpenStreetMap using OSMnx.

Downloads the full Bengaluru road network, extracts nodes and edges,
and inserts them into the PostGIS database.

Usage:
    python -m data.scripts.import_osm
"""

import asyncio
import logging
import sys

import osmnx as ox
from sqlalchemy import text

from app.models.base import async_session_factory

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger(__name__)

# Bengaluru bounding box (approximate BBMP limits)
PLACE_NAME = "Bengaluru, India"
NETWORK_TYPE = "drive"  # Road network for vehicles


async def import_osm_road_network():
    """Download and import Bengaluru's road network from OSM."""

    logger.info(f"📥 Downloading road network for: {PLACE_NAME}")
    logger.info(f"   Network type: {NETWORK_TYPE}")

    # Download the road graph from OSM
    # This can take a few minutes for a city the size of Bengaluru
    G = ox.graph_from_place(PLACE_NAME, network_type=NETWORK_TYPE, simplify=True)

    logger.info(f"✅ Downloaded: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")

    # Also get the walking network for pedestrian paths
    logger.info("📥 Downloading pedestrian network...")
    try:
        G_walk = ox.graph_from_place(PLACE_NAME, network_type="walk", simplify=True)
        # Merge walking edges that aren't already in the driving graph
        walk_only_edges = 0
        for u, v, data in G_walk.edges(data=True):
            if not G.has_edge(u, v):
                # Add the walking node if not present
                if u not in G:
                    G.add_node(u, **G_walk.nodes[u])
                if v not in G:
                    G.add_node(v, **G_walk.nodes[v])
                data["highway"] = data.get("highway", "footway")
                G.add_edge(u, v, **data)
                walk_only_edges += 1
        logger.info(f"✅ Added {walk_only_edges} pedestrian-only edges")
    except Exception as e:
        logger.warning(f"⚠️ Could not download pedestrian network: {e}")

    logger.info(f"📊 Total graph: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")

    # Insert into PostGIS
    async with async_session_factory() as db:
        # Ensure PostGIS extension
        await db.execute(text("CREATE EXTENSION IF NOT EXISTS postgis"))
        await db.commit()

        # Clear existing data
        logger.info("🗑️  Clearing existing road data...")
        await db.execute(text("DELETE FROM road_segments"))
        await db.execute(text("DELETE FROM nodes"))
        await db.commit()

        # Insert nodes
        logger.info("📝 Inserting nodes...")
        node_count = 0
        batch = []

        for node_id, data in G.nodes(data=True):
            lat = data.get("y", 0)
            lng = data.get("x", 0)
            node_type = "intersection"

            batch.append({
                "node_id": int(node_id),
                "lat": lat,
                "lng": lng,
                "node_type": node_type,
            })

            if len(batch) >= 1000:
                await _insert_nodes_batch(db, batch)
                node_count += len(batch)
                batch = []
                logger.info(f"   Inserted {node_count} nodes...")

        if batch:
            await _insert_nodes_batch(db, batch)
            node_count += len(batch)

        await db.commit()
        logger.info(f"✅ Inserted {node_count} nodes")

        # Insert edges (road segments)
        logger.info("📝 Inserting road segments...")
        segment_count = 0
        batch = []
        segment_id_counter = 1

        for u, v, data in G.edges(data=True):
            # Extract road properties
            highway = data.get("highway", "unclassified")
            if isinstance(highway, list):
                highway = highway[0]

            road_name = data.get("name", None)
            if isinstance(road_name, list):
                road_name = road_name[0]

            length_m = data.get("length", 0)

            # Check if bidirectional
            is_bidirectional = not data.get("oneway", False)

            # Build LineString from nodes
            u_data = G.nodes[u]
            v_data = G.nodes[v]

            # Use geometry if available, otherwise build from endpoints
            if "geometry" in data:
                coords = list(data["geometry"].coords)
                linestring_wkt = "LINESTRING(" + ", ".join(
                    f"{c[0]} {c[1]}" for c in coords
                ) + ")"
            else:
                linestring_wkt = (
                    f"LINESTRING({u_data['x']} {u_data['y']}, "
                    f"{v_data['x']} {v_data['y']})"
                )

            batch.append({
                "segment_id": segment_id_counter,
                "start_node": int(u),
                "end_node": int(v),
                "geom_wkt": linestring_wkt,
                "length_m": length_m,
                "road_name": road_name,
                "road_type": highway,
                "is_bidirectional": is_bidirectional,
            })
            segment_id_counter += 1

            if len(batch) >= 1000:
                await _insert_segments_batch(db, batch)
                segment_count += len(batch)
                batch = []
                logger.info(f"   Inserted {segment_count} segments...")

        if batch:
            await _insert_segments_batch(db, batch)
            segment_count += len(batch)

        await db.commit()
        logger.info(f"✅ Inserted {segment_count} road segments")

    logger.info("🎉 OSM import complete!")


async def _insert_nodes_batch(db, batch):
    """Insert a batch of nodes using raw SQL for performance."""
    for node in batch:
        await db.execute(
            text("""
                INSERT INTO nodes (node_id, geom, node_type)
                VALUES (:node_id, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326), :node_type)
                ON CONFLICT (node_id) DO NOTHING
            """),
            node,
        )


async def _insert_segments_batch(db, batch):
    """Insert a batch of road segments using raw SQL for performance."""
    for seg in batch:
        await db.execute(
            text("""
                INSERT INTO road_segments
                    (segment_id, start_node, end_node, geom, length_m,
                     road_name, road_type, is_bidirectional)
                VALUES
                    (:segment_id, :start_node, :end_node,
                     ST_SetSRID(ST_GeomFromText(:geom_wkt), 4326), :length_m,
                     :road_name, :road_type, :is_bidirectional)
                ON CONFLICT (segment_id) DO NOTHING
            """),
            seg,
        )


if __name__ == "__main__":
    asyncio.run(import_osm_road_network())
