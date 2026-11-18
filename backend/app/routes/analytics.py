from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.analytics import BankingAnalytics

router = APIRouter(prefix="/api/analytics", tags=["Data Mining & Analytics"])

@router.get("/segmentation")
def get_segmentation(db: Session = Depends(get_db)):
    """
    Returns customer segmentation across tiers (Retail, SME, Corporate, HNW),
    KYC verification status, and risk distribution.
    """
    return BankingAnalytics.get_customer_segmentation(db)

@router.get("/trends")
def get_trends(db: Session = Depends(get_db)):
    """
    Returns monthly transaction count, volume, credit, and debit trends.
    """
    return BankingAnalytics.get_transaction_trends(db)

@router.get("/credit-debit")
def get_credit_debit(db: Session = Depends(get_db)):
    """
    Returns credit vs debit volume analysis, count breakdown, and liquidity ratio.
    """
    return BankingAnalytics.get_credit_debit_analysis(db)

@router.get("/channels-types")
def get_channels_types(db: Session = Depends(get_db)):
    """
    Returns breakdown across channels (Mobile, ATM, Online, POS, Wire) and transaction types.
    """
    return BankingAnalytics.get_channel_and_type_breakdown(db)

@router.get("/anomalies-and-leaders")
def get_anomalies_and_leaders(
    limit: int = Query(15, ge=5, le=100),
    db: Session = Depends(get_db)
):
    """
    Returns detected suspicious/anomalous transactions and top customers by activity.
    """
    return BankingAnalytics.get_anomalies_and_top_customers(db, limit=limit)
