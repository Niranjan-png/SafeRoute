"""
SOS API endpoints.

POST /api/v1/sos/trigger — trigger SOS alert
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth.sms_client import get_sms_client
from app.core.sos.sos_service import SOSService
from app.dependencies import get_current_user, get_db
from app.schemas.sos import SOSTriggerRequest, SOSTriggerResponse

router = APIRouter(prefix="/sos", tags=["SOS"])


@router.post(
    "/trigger",
    response_model=SOSTriggerResponse,
    summary="Trigger SOS alert",
    description="Send an emergency SOS alert with your GPS location "
                "to all registered emergency contacts.",
)
async def trigger_sos(
    request: SOSTriggerRequest,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    sms_client = get_sms_client()
    sos_service = SOSService(sms_client)

    try:
        result = await sos_service.trigger_sos(
            db=db,
            user=user,
            lat=request.lat,
            lng=request.lng,
        )
        await db.commit()
        return SOSTriggerResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SOS trigger failed: {e}")
