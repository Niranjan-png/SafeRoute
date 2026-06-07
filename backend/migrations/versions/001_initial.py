"""Initial schema — all tables

Revision ID: 001_initial
Revises: None
Create Date: 2026-06-07

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import geoalchemy2
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enable PostGIS extension
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")

    # --- Users ---
    op.create_table(
        "users",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("phone", sa.String(15), unique=True, nullable=False),
        sa.Column("name", sa.String(100), nullable=True),
        sa.Column("emergency_contacts", postgresql.JSONB, server_default="[]"),
        sa.Column("preferences", postgresql.JSONB, server_default="{}"),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("hashed_otp", sa.String(128), nullable=True),
        sa.Column("otp_expires_at", sa.DateTime, nullable=True),
    )

    # --- Nodes ---
    op.create_table(
        "nodes",
        sa.Column("node_id", sa.BigInteger, primary_key=True),
        sa.Column("geom", geoalchemy2.Geometry(geometry_type="POINT", srid=4326), nullable=False),
        sa.Column("node_type", sa.String(30), nullable=True),
        sa.Column("area_name", sa.String(100), nullable=True),
    )


    # --- Road Segments ---
    op.create_table(
        "road_segments",
        sa.Column("segment_id", sa.BigInteger, primary_key=True),
        sa.Column("start_node", sa.BigInteger, sa.ForeignKey("nodes.node_id"), nullable=False),
        sa.Column("end_node", sa.BigInteger, sa.ForeignKey("nodes.node_id"), nullable=False),
        sa.Column("geom", geoalchemy2.Geometry(geometry_type="LINESTRING", srid=4326), nullable=False),
        sa.Column("length_m", sa.Float, nullable=False),
        sa.Column("road_name", sa.String(200), nullable=True),
        sa.Column("road_type", sa.String(50), nullable=True),
        sa.Column("is_bidirectional", sa.Boolean, server_default="true"),
        sa.Column("safety_score", sa.Float, server_default="50.0"),
        sa.Column("cctv_score", sa.Float, server_default="0.0"),
        sa.Column("crowd_score", sa.Float, server_default="0.0"),
        sa.Column("lighting_score", sa.Float, server_default="0.0"),
        sa.Column("emergency_score", sa.Float, server_default="0.0"),
        sa.Column("crime_penalty", sa.Float, server_default="0.0"),
        sa.Column("score_updated_at", sa.DateTime, server_default=sa.func.now()),
    )

    op.create_index("idx_road_segments_start", "road_segments", ["start_node"])
    op.create_index("idx_road_segments_end", "road_segments", ["end_node"])

    # --- Crime Incidents ---
    op.create_table(
        "crime_incidents",
        sa.Column("crime_id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("geom", geoalchemy2.Geometry(geometry_type="POINT", srid=4326), nullable=False),
        sa.Column("crime_type", sa.String(50), nullable=True),
        sa.Column("crime_weight", sa.Float, nullable=False),
        sa.Column("source", sa.String(50), nullable=True),
        sa.Column("occurred_at", sa.DateTime, nullable=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("is_verified", sa.Boolean, server_default="false"),
    )


    # --- CCTV Cameras ---
    op.create_table(
        "cctv_cameras",
        sa.Column("camera_id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("geom", geoalchemy2.Geometry(geometry_type="POINT", srid=4326), nullable=False),
        sa.Column("operator", sa.String(50), nullable=True),
        sa.Column("is_active", sa.Boolean, server_default="true"),
        sa.Column("last_seen", sa.DateTime, nullable=True),
    )


    # --- Emergency Facilities ---
    op.create_table(
        "emergency_facilities",
        sa.Column("facility_id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("geom", geoalchemy2.Geometry(geometry_type="POINT", srid=4326), nullable=False),
        sa.Column("facility_type", sa.String(50), nullable=True),
        sa.Column("name", sa.String(200), nullable=True),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("is_24hr", sa.Boolean, server_default="false"),
    )


    # --- Safety Reports ---
    op.create_table(
        "safety_reports",
        sa.Column("report_id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.user_id"), nullable=True),
        sa.Column("geom", geoalchemy2.Geometry(geometry_type="POINT", srid=4326), nullable=False),
        sa.Column("report_type", sa.String(50), nullable=True),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("verified_count", sa.Integer, server_default="0"),
        sa.Column("is_active", sa.Boolean, server_default="true"),
    )


    # --- POIs ---
    op.create_table(
        "pois",
        sa.Column("poi_id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("geom", geoalchemy2.Geometry(geometry_type="POINT", srid=4326), nullable=False),
        sa.Column("poi_type", sa.String(50), nullable=True),
        sa.Column("name", sa.String(200), nullable=True),
        sa.Column("is_24hr", sa.Boolean, server_default="false"),
    )


    # --- Streetlights ---
    op.create_table(
        "streetlights",
        sa.Column("light_id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("geom", geoalchemy2.Geometry(geometry_type="POINT", srid=4326), nullable=False),
        sa.Column("source", sa.String(50), nullable=True),
        sa.Column("is_active", sa.Boolean, server_default="true"),
    )


    # --- SOS Events ---
    op.create_table(
        "sos_events",
        sa.Column("event_id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.user_id"), nullable=False),
        sa.Column("geom", geoalchemy2.Geometry(geometry_type="POINT", srid=4326), nullable=False),
        sa.Column("triggered_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("contacts_notified", postgresql.JSONB, server_default="[]"),
        sa.Column("resolved_at", sa.DateTime, nullable=True),
    )


    # --- Route Results ---
    op.create_table(
        "route_results",
        sa.Column("route_id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.user_id"), nullable=True),
        sa.Column("source_lat", sa.Float, nullable=False),
        sa.Column("source_lng", sa.Float, nullable=False),
        sa.Column("dest_lat", sa.Float, nullable=False),
        sa.Column("dest_lng", sa.Float, nullable=False),
        sa.Column("route_geojson", postgresql.JSONB, nullable=False),
        sa.Column("safety_score", sa.Float, nullable=False),
        sa.Column("distance_m", sa.Float, nullable=False),
        sa.Column("eta_seconds", sa.Integer, nullable=False),
        sa.Column("segment_scores", postgresql.JSONB, nullable=False),
        sa.Column("computed_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("expires_at", sa.DateTime, nullable=True),
    )


def downgrade() -> None:
    op.drop_table("route_results")
    op.drop_table("sos_events")
    op.drop_table("streetlights")
    op.drop_table("pois")
    op.drop_table("safety_reports")
    op.drop_table("emergency_facilities")
    op.drop_table("cctv_cameras")
    op.drop_table("crime_incidents")
    op.drop_table("road_segments")
    op.drop_table("nodes")
    op.drop_table("users")
    op.execute("DROP EXTENSION IF EXISTS postgis")
