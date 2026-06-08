"""
NCRB crime data import stub.

In a full implementation, this would parse NCRB annual report PDFs
and extract district-level crime statistics. For MVP, the synthetic
data generator provides the detailed spatial crime data.

Usage:
    python -m data.scripts.import_ncrb
"""

import asyncio
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger(__name__)


async def import_ncrb_data():
    """
    Import NCRB crime data.

    TODO: Implementation phases:
    1. Download NCRB annual report PDF from ncrb.gov.in
    2. Parse district-level crime stats for Bengaluru (Urban)
    3. Extract crime counts by type: crimes against women, robbery, etc.
    4. Geocode to approximate ward/area level using BBMP ward boundaries
    5. Insert as crime_incidents with source='NCRB' and is_verified=True

    For MVP, use the synthetic data from generate_synthetic.py instead.
    """
    logger.info("📊 NCRB import stub — using synthetic data for MVP")
    logger.info("   To use real NCRB data:")
    logger.info("   1. Download PDF from ncrb.gov.in/en/crime-in-india-table-addl-table-chapter-content")
    logger.info("   2. Extract Bengaluru district data using tabula-py or camelot")
    logger.info("   3. Map to ward-level coordinates using BBMP GIS boundaries")
    logger.info("   4. Insert into crime_incidents table")


if __name__ == "__main__":
    asyncio.run(import_ncrb_data())
