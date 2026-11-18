import random
import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.models import (
    SourceBranch, SourceCustomer, SourceAccount, SourceTransaction,
    DimDate, DimBranch, DimCustomer, DimAccount, FactTransactions,
    CDCChangeLog, PipelineRun
)
from backend.app.cdc_engine import CDCEngine

FIRST_NAMES = [
    "James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda",
    "David", "Elizabeth", "William", "Barbara", "Richard", "Susan", "Joseph", "Jessica",
    "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Nancy", "Daniel", "Lisa",
    "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra", "Donald", "Ashley",
    "Steven", "Kimberly", "Paul", "Emily", "Andrew", "Donna", "Joshua", "Michelle",
    "Kenneth", "Dorothy", "Kevin", "Carol", "Brian", "Amanda", "George", "Melissa",
    "Edward", "Deborah", "Ronald", "Stephanie", "Timothy", "Rebecca", "Jason", "Sharon",
    "Jeffrey", "Laura", "Ryan", "Cynthia", "Jacob", "Kathleen", "Gary", "Amy",
    "Nicholas", "Shirley", "Eric", "Angela", "Jonathan", "Helen", "Stephen", "Anna",
    "Larry", "Brenda", "Justin", "Pamela", "Scott", "Nicole", "Brandon", "Emma",
    "Benjamin", "Samantha", "Samuel", "Katherine", "Gregory", "Christine", "Alexander", "Debra",
    "Frank", "Rachel", "Patrick", "Catherine", "Raymond", "Carolyn", "Jack", "Janet",
    "Dennis", "Ruth", "Jerry", "Maria", "Tyler", "Heather", "Aaron", "Diane",
    "Jose", "Virginia", "Adam", "Julie", "Nathan", "Joyce", "Henry", "Victoria"
]

LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
    "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas",
    "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White",
    "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young",
    "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
    "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell",
    "Carter", "Roberts", "Gomez", "Phillips", "Evans", "Turner", "Diaz", "Parker",
    "Cruz", "Edwards", "Collins", "Reyes", "Stewart", "Morris", "Morales", "Murphy",
    "Cook", "Rogers", "Gutierrez", "Ortiz", "Morgan", "Cooper", "Peterson", "Bailey",
    "Reed", "Kelly", "Howard", "Ramos", "Kim", "Cox", "Ward", "Richardson",
    "Watson", "Brooks", "Chavez", "Wood", "James", "Bennett", "Gray", "Mendoza",
    "Ruiz", "Hughes", "Price", "Alvarez", "Castillo", "Sanders", "Patel", "Myers"
]

CITIES_STATES = [
    ("New York", "NY"), ("Los Angeles", "CA"), ("Chicago", "IL"), ("Houston", "TX"),
    ("Phoenix", "AZ"), ("Philadelphia", "PA"), ("San Antonio", "TX"), ("San Diego", "CA"),
    ("Dallas", "TX"), ("San Jose", "CA"), ("Austin", "TX"), ("Jacksonville", "FL"),
    ("San Francisco", "CA"), ("Charlotte", "NC"), ("Indianapolis", "IN"), ("Seattle", "WA"),
    ("Denver", "CO"), ("Boston", "MA"), ("Nashville", "TN"), ("Atlanta", "GA")
]

BRANCH_INFO = [
    ("BR001", "Manhattan Flagship Branch", "MB01", "New York", "NY", "Northeast", "Sarah Jenkins"),
    ("BR002", "Wall Street Financial Center", "WS02", "New York", "NY", "Northeast", "Arthur Vance"),
    ("BR003", "Silicon Valley Tech Branch", "SV03", "San Francisco", "CA", "West", "Elena Rostova"),
    ("BR004", "SoMa Commercial Center", "SM04", "San Francisco", "CA", "West", "David Liang"),
    ("BR005", "Loop Banking Hub", "LP05", "Chicago", "IL", "Midwest", "Marcus Brody"),
    ("BR006", "Michigan Ave Retail Branch", "MA06", "Chicago", "IL", "Midwest", "Claire Dupont"),
    ("BR007", "Houston Energy Corridor", "EC07", "Houston", "TX", "South", "Robert Sterling"),
    ("BR008", "Austin Innovation Branch", "AI08", "Austin", "TX", "South", "Maya Patel"),
    ("BR009", "Seattle Downtown Branch", "SD09", "Seattle", "WA", "Northwest", "Owen Wright"),
    ("BR100", "Boston Back Bay Branch", "BB10", "Boston", "MA", "Northeast", "Grace Hopper"),
    ("BR101", "Miami Brickell Center", "MB11", "Miami", "FL", "Southeast", "Carlos Silva"),
    ("BR102", "Atlanta Peachtree Branch", "PT12", "Atlanta", "GA", "Southeast", "Latoya Washington"),
    ("BR103", "Denver Rocky Mountain", "RM13", "Denver", "CO", "West", "Travis Cole"),
    ("BR104", "Dallas Uptown Financial", "DF14", "Dallas", "TX", "South", "Brenton Walsh"),
    ("BR105", "Charlotte Queen City Center", "QC15", "Charlotte", "NC", "Southeast", "Hannah Abbott")
]

class SyntheticDataGenerator:
    """
    Industry-Level Synthetic Banking Dataset Generator.
    Generates >= 1,000 customers, >= 5,000 transactions, dimensional dates, accounts,
    and seed CDC events for incremental demonstration.
    """

    @classmethod
    def populate_dim_dates(cls, db: Session, start_year: int = 2025, end_year: int = 2027):
        """
        Populate calendar date dimension.
        """
        existing_count = db.query(func.count(DimDate.date_key)).scalar()
        if existing_count and existing_count > 300:
            return

        cur = datetime.date(start_year, 1, 1)
        end = datetime.date(end_year, 12, 31)
        delta = datetime.timedelta(days=1)

        dates = []
        while cur <= end:
            d_key = int(cur.strftime("%Y%m%d"))
            dates.append(DimDate(
                date_key=d_key,
                full_date=cur,
                day_of_week=cur.isoweekday(),
                day_name=cur.strftime("%A"),
                day_of_month=cur.day,
                month=cur.month,
                month_name=cur.strftime("%B"),
                quarter=(cur.month - 1) // 3 + 1,
                year=cur.year,
                is_weekend=cur.isoweekday() in [6, 7],
                is_holiday=(cur.month == 1 and cur.day == 1) or (cur.month == 12 and cur.day == 25)
            ))
            cur += delta

        db.bulk_save_objects(dates)
        db.commit()

    @classmethod
    def generate_all(
        cls,
        db: Session,
        customer_count: int = 1000,
        transaction_count: int = 5000,
        sample_cdc_delta: int = 50
    ) -> Dict[str, Any]:
        """
        Generates full operational dataset if empty, or adds incremental records.
        """
        # Ensure Date Dimension
        cls.populate_dim_dates(db)

        # Check existing customers
        existing_cust = db.query(func.count(SourceCustomer.customer_id)).scalar() or 0
        if existing_cust >= customer_count:
            return {
                "message": f"Database already seeded with {existing_cust} customers.",
                "customers": existing_cust,
                "transactions": db.query(func.count(SourceTransaction.transaction_id)).scalar() or 0
            }

        # 1. Populate Branches
        branch_objs = []
        for bid, bname, bcode, bcity, bstate, bregion, bmgr in BRANCH_INFO:
            branch_objs.append(SourceBranch(
                branch_id=bid,
                branch_name=bname,
                branch_code=bcode,
                city=bcity,
                state=bstate,
                region=bregion,
                manager_name=bmgr
            ))
            # Also populate DimBranch
            db.add(DimBranch(
                branch_id=bid,
                branch_name=bname,
                branch_code=bcode,
                city=bcity,
                state=bstate,
                region=bregion,
                manager_name=bmgr
            ))
        db.bulk_save_objects(branch_objs)
        db.commit()

        # 2. Populate Customers (>= 1,000)
        customers = []
        dim_customers = []
        segments = ["Retail", "Retail", "Retail", "SME", "SME", "Corporate", "HNW"]
        kyc_options = ["Verified", "Verified", "Verified", "Verified", "Pending Review", "Re-KYC Required"]

        now = datetime.datetime.utcnow()
        for i in range(1, customer_count + 1):
            cid = f"CUST{i:05d}"
            fname = random.choice(FIRST_NAMES)
            lname = random.choice(LAST_NAMES)
            email = f"{fname.lower()}.{lname.lower()}{random.randint(10,999)}@example.com"
            phone = f"+1-{random.randint(200,999)}-{random.randint(100,999)}-{random.randint(1000,9999)}"
            city, state = random.choice(CITIES_STATES)
            seg = random.choice(segments)
            kyc = random.choice(kyc_options)
            risk = random.randint(10, 85)
            gender = random.choice(["Male", "Female", "Non-Binary"])

            created_days_ago = random.randint(30, 700)
            created_at = now - datetime.timedelta(days=created_days_ago)

            cust = SourceCustomer(
                customer_id=cid,
                first_name=fname,
                last_name=lname,
                email=email,
                phone=phone,
                gender=gender,
                segment=seg,
                kyc_status=kyc,
                risk_score=risk,
                city=city,
                state=state,
                country="United States",
                created_at=created_at,
                updated_at=created_at
            )
            customers.append(cust)

            # Mirror into DimCustomer
            dim_c = DimCustomer(
                customer_id=cid,
                first_name=fname,
                last_name=lname,
                full_name=f"{fname} {lname}",
                email=email,
                phone=phone,
                gender=gender,
                segment=seg,
                kyc_status=kyc,
                risk_score=risk,
                city=city,
                state=state,
                country="United States",
                scd_start_date=created_at,
                is_current=True,
                version=1,
                dw_loaded_at=now
            )
            dim_customers.append(dim_c)

        db.bulk_save_objects(customers)
        db.bulk_save_objects(dim_customers)
        db.commit()

        # 3. Populate Accounts (>= 1,200)
        accounts = []
        dim_accounts = []
        acc_types = ["Savings", "Checking", "Fixed Deposit", "Loan", "Credit Card"]
        branch_ids = [b[0] for b in BRANCH_INFO]

        acc_counter = 1
        for i in range(1, customer_count + 1):
            cid = f"CUST{i:05d}"
            # Give every customer at least 1 account, some 2 or 3
            num_accs = random.choices([1, 2, 3], weights=[0.65, 0.25, 0.10])[0]

            for _ in range(num_accs):
                aid = f"ACC{acc_counter:06d}"
                acc_num = f"{random.randint(1000000000, 9999999999)}"
                atype = random.choice(acc_types)
                bal = round(random.uniform(500.0, 75000.0) if atype != "Loan" else random.uniform(5000.0, 250000.0), 2)
                bid = random.choice(branch_ids)
                op_date = datetime.date.today() - datetime.timedelta(days=random.randint(30, 600))

                src_a = SourceAccount(
                    account_id=aid,
                    customer_id=cid,
                    account_number=acc_num,
                    account_type=atype,
                    status="Active",
                    balance=bal,
                    currency="USD",
                    branch_id=bid,
                    opened_date=op_date,
                    updated_at=now
                )
                accounts.append(src_a)

                dim_a = DimAccount(
                    account_id=aid,
                    customer_id=cid,
                    account_number=acc_num,
                    account_type=atype,
                    status="Active",
                    currency="USD",
                    branch_id=bid,
                    opened_date=op_date,
                    dw_loaded_at=now
                )
                dim_accounts.append(dim_a)
                acc_counter += 1

        db.bulk_save_objects(accounts)
        db.bulk_save_objects(dim_accounts)
        db.commit()

        # 4. Generate Transactions (>= 5,000)
        # Fetch surrogate keys for dimensional relations
        cust_map = {c.customer_id: c.customer_key for c in db.query(DimCustomer.customer_id, DimCustomer.customer_key).all()}
        acc_map = {a.account_id: (a.account_key, a.customer_id, a.branch_id) for a in db.query(DimAccount.account_id, DimAccount.account_key, DimAccount.customer_id, DimAccount.branch_id).all()}
        branch_map = {b.branch_id: b.branch_key for b in db.query(DimBranch.branch_id, DimBranch.branch_key).all()}

        all_acc_ids = list(acc_map.keys())
        transactions = []
        fact_transactions = []

        txn_configs = [
            ("Deposit", True, False, 50, 4500, ["Online Banking", "Branch POS", "ATM"]),
            ("Withdrawal", False, True, 20, 600, ["ATM", "Branch POS"]),
            ("Transfer", False, True, 30, 3000, ["Mobile Banking", "Online Banking", "Wire"]),
            ("Card Payment", False, True, 5, 250, ["Mobile Banking", "POS Terminal", "Online Banking"]),
            ("Loan Repayment", False, True, 150, 1200, ["Online Banking", "Direct Debit"])
        ]

        # Generate timestamps over the past 365 days
        for t_idx in range(1, transaction_count + 1):
            tid = f"TXN{t_idx:07d}"
            aid = random.choice(all_acc_ids)
            akey, cid, bid = acc_map[aid]
            ckey = cust_map.get(cid, 1)
            bkey = branch_map.get(bid, 1)

            ttype, is_cr, is_db, min_val, max_val, channels = random.choice(txn_configs)
            chan = random.choice(channels)
            amt = round(random.uniform(min_val, max_val), 2)
            bal_after = round(random.uniform(100.0, 50000.0), 2)

            days_ago = random.randint(0, 360)
            txn_time = now - datetime.timedelta(days=days_ago, hours=random.randint(0, 23), minutes=random.randint(0, 59))
            d_key = int(txn_time.strftime("%Y%m%d"))

            # Anomaly / Fraud scoring
            fraud = False
            anom_score = 0.05
            if amt > 9000.0 or (chan == "Wire" and amt > 7000.0):
                anom_score = min(0.98, round(0.55 + (amt / 20000.0), 2))
                if amt > 14000.0:
                    fraud = True

            src_txn = SourceTransaction(
                transaction_id=tid,
                account_id=aid,
                customer_id=cid,
                branch_id=bid,
                transaction_type=ttype,
                channel=chan,
                amount=amt,
                balance_after=bal_after,
                is_credit=is_cr,
                is_debit=is_db,
                status="Completed",
                transaction_timestamp=txn_time,
                created_at=txn_time
            )
            transactions.append(src_txn)

            fact = FactTransactions(
                transaction_id=tid,
                date_key=d_key,
                customer_key=ckey,
                account_key=akey,
                branch_key=bkey,
                transaction_type=ttype,
                channel=chan,
                amount=amt,
                balance_after=bal_after,
                is_credit=is_cr,
                is_debit=is_db,
                status="Completed",
                fraud_flag=fraud,
                anomaly_score=anom_score,
                cdc_operation="INSERT",
                dw_loaded_at=now
            )
            fact_transactions.append(fact)

        # Batch insert for performance
        batch_size = 1000
        for i in range(0, len(transactions), batch_size):
            db.bulk_save_objects(transactions[i:i+batch_size])
            db.bulk_save_objects(fact_transactions[i:i+batch_size])
            db.commit()

        # 5. Seed initial Pipeline Run history record
        initial_run = PipelineRun(
            run_id="init_full_seed_001",
            pipeline_name="Banking_Full_ETL_Pipeline",
            run_type="FULL",
            start_time=now - datetime.timedelta(hours=2),
            end_time=now - datetime.timedelta(hours=2) + datetime.timedelta(seconds=8),
            duration_ms=8120.4,
            records_extracted=customer_count + len(accounts) + transaction_count,
            records_transformed=customer_count + len(accounts) + transaction_count,
            records_loaded=customer_count + len(accounts) + transaction_count,
            inserts_count=customer_count + len(accounts) + transaction_count,
            updates_count=0,
            deletes_count=0,
            status="SUCCESS",
            source_type="Full_Warehouse_Rebuild",
            throughput_rps=886.5,
            memory_mb=128.0,
            time_saved_percent=0.0
        )
        db.add(initial_run)
        db.commit()

        # 6. Generate Pre-Staged CDC Delta Events for Immediate Demo
        CDCEngine.simulate_events(
            db,
            insert_count=35,
            update_count=18,
            delete_count=6
        )

        return {
            "status": "SUCCESS",
            "customers_generated": customer_count,
            "accounts_generated": len(accounts),
            "transactions_generated": transaction_count,
            "branches_seeded": len(BRANCH_INFO),
            "message": "Synthetic banking data and CDC demo events initialized successfully."
        }
