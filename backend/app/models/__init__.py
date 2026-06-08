"""
SafeRoute Bengaluru — Database Models

All SQLAlchemy models are imported here so Alembic can discover them.
"""

from app.models.base import Base
from app.models.cctv_camera import CCTVCamera
from app.models.crime_incident import CrimeIncident
from app.models.emergency_facility import EmergencyFacility
from app.models.node import Node
from app.models.poi import POI
from app.models.road_segment import RoadSegment
from app.models.route_result import RouteResult
from app.models.safety_report import SafetyReport
from app.models.sos_event import SOSEvent
from app.models.streetlight import Streetlight
from app.models.user import User

__all__ = [
    "Base",
    "CCTVCamera",
    "CrimeIncident",
    "EmergencyFacility",
    "Node",
    "POI",
    "RoadSegment",
    "RouteResult",
    "SafetyReport",
    "SOSEvent",
    "Streetlight",
    "User",
]
