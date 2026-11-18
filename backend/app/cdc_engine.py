import json
import hashlib
import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.app.models import (
    CDCChangeLog, SourceCustomer, SourceAccount, SourceTransaction, SourceBranch
)

class CDCEngine:
    """
    Change Data Capture (CDC) Engine.
    Provides change event detection, log capture, idempotency validation,
    and simulation of operational banking events (INSERT, UPDATE, DELETE).
    """

    @staticmethod
    def calculate_checksum(table_name: str, record_id: str, operation: str, data: Dict[str, Any]) -> str:
        payload = f"{table_name}:{record_id}:{operation}:{json.dumps(data, sort_keys=True, default=str)}"
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()

    @classmethod
    def record_change(
        cls,
        db: Session,
        table_name: str,
        record_id: str,
        operation: str,
        old_data: Optional[Dict[str, Any]] = None,
        new_data: Optional[Dict[str, Any]] = None,
        batch_id: Optional[str] = None
    ) -> CDCChangeLog:
        """
        Record a change event idempotently into cdc_change_log.
        """
        data_to_hash = new_data if new_data is not None else old_data or {}
        checksum = cls.calculate_checksum(table_name, record_id, operation, data_to_hash)

        # Check if identical unprocessed change already logged
        existing = db.query(CDCChangeLog).filter(
            CDCChangeLog.table_name == table_name,
            CDCChangeLog.record_id == record_id,
            CDCChangeLog.checksum == checksum,
            CDCChangeLog.is_processed == False
        ).first()

        if existing:
            return existing

        change_entry = CDCChangeLog(
            table_name=table_name,
            record_id=str(record_id),
            operation=operation.upper(),
            old_data=json.dumps(old_data, default=str) if old_data else None,
            new_data=json.dumps(new_data, default=str) if new_data else None,
            captured_at=datetime.datetime.utcnow(),
            is_processed=False,
            batch_id=batch_id,
            checksum=checksum
        )
        db.add(change_entry)
        db.flush()
        return change_entry

    @classmethod
    def get_unprocessed_changes(cls, db: Session, limit: int = 1000) -> List[CDCChangeLog]:
        return db.query(CDCChangeLog).filter(
            CDCChangeLog.is_processed == False
        ).order_by(CDCChangeLog.captured_at.asc()).limit(limit).all()

    @classmethod
    def mark_processed(cls, db: Session, change_ids: List[int], batch_id: Optional[str] = None):
        if not change_ids:
            return
        now = datetime.datetime.utcnow()
        db.query(CDCChangeLog).filter(CDCChangeLog.change_id.in_(change_ids)).update(
            {
                CDCChangeLog.is_processed: True,
                CDCChangeLog.processed_at: now,
                CDCChangeLog.batch_id: batch_id or CDCChangeLog.batch_id
            },
            synchronize_session=False
        )
        db.commit()

    @classmethod
    def simulate_events(
        cls,
        db: Session,
        insert_count: int = 25,
        update_count: int = 15,
        delete_count: int = 5
    ) -> Dict[str, Any]:
        """
        Simulate realistic OLTP banking activity:
        - INSERTS: New transactions and new customer registrations.
        - UPDATES: Customer KYC status, address changes, account tier upgrades, balances.
        - DELETES: Soft deletion / account closure / cancelled transactions.
        """
        import random
        from decimal import Decimal

        captured = {"inserts": 0, "updates": 0, "deletes": 0}
        batch_id = f"sim_batch_{int(datetime.datetime.utcnow().timestamp())}"

        # 1. Simulate INSERTS (New Transactions)
        active_accounts = db.query(SourceAccount).filter(SourceAccount.is_deleted == False).limit(50).all()
        if active_accounts:
            for _ in range(insert_count):
                acc = random.choice(active_accounts)
                txn_types = [
                    ("Deposit", True, False, 100, 5000),
                    ("Withdrawal", False, True, 20, 800),
                    ("Transfer", False, True, 50, 2000),
                    ("Card Payment", False, True, 10, 350),
                    ("Loan Repayment", False, True, 200, 1500)
                ]
                ttype, is_cr, is_db, min_amt, max_amt = random.choice(txn_types)
                amt = round(random.uniform(min_amt, max_amt), 2)
                
                # Update account balance
                old_bal = acc.balance
                new_bal = round(old_bal + amt if is_cr else max(0.0, old_bal - amt), 2)
                acc.balance = new_bal
                acc.updated_at = datetime.datetime.utcnow()

                txn_id = f"TXN{random.randint(10000000, 99999999)}"
                new_txn = SourceTransaction(
                    transaction_id=txn_id,
                    account_id=acc.account_id,
                    customer_id=acc.customer_id,
                    branch_id=acc.branch_id,
                    transaction_type=ttype,
                    channel=random.choice(["Mobile Banking", "ATM", "Online Banking", "Branch POS", "Wire"]),
                    amount=amt,
                    balance_after=new_bal,
                    is_credit=is_cr,
                    is_debit=is_db,
                    status="Completed",
                    transaction_timestamp=datetime.datetime.utcnow(),
                    created_at=datetime.datetime.utcnow()
                )
                db.add(new_txn)
                
                # Capture CDC for Transaction INSERT
                cls.record_change(
                    db=db,
                    table_name="source_transactions",
                    record_id=txn_id,
                    operation="INSERT",
                    old_data=None,
                    new_data={
                        "transaction_id": txn_id,
                        "account_id": acc.account_id,
                        "customer_id": acc.customer_id,
                        "branch_id": acc.branch_id,
                        "transaction_type": ttype,
                        "amount": amt,
                        "balance_after": new_bal,
                        "is_credit": is_cr,
                        "is_debit": is_db,
                        "channel": new_txn.channel,
                        "timestamp": str(new_txn.transaction_timestamp)
                    },
                    batch_id=batch_id
                )
                captured["inserts"] += 1

        # 2. Simulate UPDATES (Customer profile / KYC changes / Account tier)
        customers = db.query(SourceCustomer).filter(SourceCustomer.is_deleted == False).limit(30).all()
        if customers:
            cities = ["New York", "San Francisco", "Austin", "Chicago", "Seattle", "Charlotte", "Miami", "Denver"]
            segments = ["Retail", "SME", "Corporate", "HNW"]
            kyc_statuses = ["Verified", "Pending Review", "Re-KYC Completed"]

            for cust in random.sample(customers, min(len(customers), update_count)):
                old_data = {
                    "customer_id": cust.customer_id,
                    "city": cust.city,
                    "segment": cust.segment,
                    "kyc_status": cust.kyc_status,
                    "risk_score": cust.risk_score
                }
                cust.city = random.choice(cities)
                cust.segment = random.choice(segments)
                cust.kyc_status = random.choice(kyc_statuses)
                cust.risk_score = max(5, min(95, cust.risk_score + random.randint(-10, 15)))
                cust.updated_at = datetime.datetime.utcnow()

                new_data = {
                    "customer_id": cust.customer_id,
                    "first_name": cust.first_name,
                    "last_name": cust.last_name,
                    "email": cust.email,
                    "phone": cust.phone,
                    "city": cust.city,
                    "state": cust.state,
                    "country": cust.country,
                    "segment": cust.segment,
                    "kyc_status": cust.kyc_status,
                    "risk_score": cust.risk_score
                }
                cls.record_change(
                    db=db,
                    table_name="source_customers",
                    record_id=cust.customer_id,
                    operation="UPDATE",
                    old_data=old_data,
                    new_data=new_data,
                    batch_id=batch_id
                )
                captured["updates"] += 1

        # 3. Simulate DELETES (Account Soft Deletion or Transaction Cancellation)
        deletable_accounts = db.query(SourceAccount).filter(
            SourceAccount.is_deleted == False,
            SourceAccount.balance <= 10.0
        ).limit(10).all()
        if deletable_accounts:
            for acc in random.sample(deletable_accounts, min(len(deletable_accounts), delete_count)):
                old_data = {
                    "account_id": acc.account_id,
                    "customer_id": acc.customer_id,
                    "account_number": acc.account_number,
                    "status": acc.status,
                    "balance": acc.balance
                }
                acc.is_deleted = True
                acc.status = "Closed"
                acc.updated_at = datetime.datetime.utcnow()

                cls.record_change(
                    db=db,
                    table_name="source_accounts",
                    record_id=acc.account_id,
                    operation="DELETE",
                    old_data=old_data,
                    new_data={"status": "Closed", "is_deleted": True},
                    batch_id=batch_id
                )
                captured["deletes"] += 1

        db.commit()
        return {
            "batch_id": batch_id,
            "captured": captured,
            "total_events": sum(captured.values())
        }
