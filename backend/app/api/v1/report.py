"""
Community Safety Reporting Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
import json

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.report import ReportCreateRequest, ReportResponse, ReportListResponse
from app.models.safety_report import SafetyReport

router = APIRouter()


@router.post("/create", response_model=ReportResponse)
async def create_report(
    request: ReportCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    report = SafetyReport(
        user_id=current_user.user_id,
        report_type=request.report_type,
        description=request.description,
    )
    db.add(report)
    await db.flush()
    await db.execute(
        text(
            "UPDATE safety_reports SET geom = ST_SetSRID(ST_MakePoint(:lng, :lat), 4326) WHERE report_id = :id"
        ),
        {"lng": request.lng, "lat": request.lat, "id": report.report_id},
    )
    await db.commit()

    return ReportResponse(
        report_id=report.report_id,
        lat=request.lat,
        lng=request.lng,
        report_type=report.report_type,
        description=report.description,
        created_at=report.created_at,
        verified_count=0,
    )


@router.get("/nearby", response_model=ReportListResponse)
async def get_nearby_reports(
    lat: float,
    lng: float,
    radius_m: float = 500,
    report_type: str = None,
    db: AsyncSession = Depends(get_db),
):
    query = """
        SELECT report_id, report_type, description, created_at,
               ST_Y(geom) as lat, ST_X(geom) as lng, verified_count, is_active
        FROM safety_reports
        WHERE ST_DWithin(
            geom::geography,
            ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
            :radius
        )
        AND is_active = true
    """
    params = {"lat": lat, "lng": lng, "radius": radius_m}
    if report_type:
        query += " AND report_type = :rtype"
        params["rtype"] = report_type

    result = await db.execute(text(query), params)
    rows = result.fetchall()

    reports = [
        ReportResponse(
            report_id=r.report_id,
            lat=r.lat,
            lng=r.lng,
            report_type=r.report_type,
            description=r.description,
            created_at=r.created_at,
            verified_count=r.verified_count,
        )
        for r in rows
    ]
    return ReportListResponse(reports=reports, total=len(reports))
