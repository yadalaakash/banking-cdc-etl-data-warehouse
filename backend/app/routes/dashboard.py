from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.analytics import BankingAnalytics

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    """
    Returns executive KPI summary cards for the admin dashboard.
    """
    return BankingAnalytics.get_dashboard_summary(db)

@router.get("/charts")
def get_dashboard_charts(db: Session = Depends(get_db)):
    """
    Returns aggregated charts data: monthly trends, credit vs debit, channels, and types.
    """
    trends = BankingAnalytics.get_transaction_trends(db)
    liquidity = BankingAnalytics.get_credit_debit_analysis(db)
    breakdowns = BankingAnalytics.get_channel_and_type_breakdown(db)
    segmentation = BankingAnalytics.get_customer_segmentation(db)

    return {
        **trends,
        "credit_debit": liquidity,
        **breakdowns,
        **segmentation
    }
