#!/usr/bin/env python3
"""
CLI Utility for Banking CDC Data Warehouse Pipeline.
Usage:
    python run_pipeline_cli.py --action seed
    python run_pipeline_cli.py --action incremental
    python run_pipeline_cli.py --action full
    python run_pipeline_cli.py --action benchmark --delta 50
    python run_pipeline_cli.py --action status
"""

import argparse
import sys
import json
from backend.app.database import engine, Base, SessionLocal
from backend.app.generator import SyntheticDataGenerator
from backend.app.etl_pipeline import ETLPipeline
from backend.app.optimizer import PipelineOptimizer
from backend.app.cdc_engine import CDCEngine
from backend.app.analytics import BankingAnalytics

def main():
    parser = argparse.ArgumentParser(description="Banking CDC-ETL Pipeline CLI Tool")
    parser.add_argument(
        "--action",
        choices=["seed", "incremental", "full", "benchmark", "simulate", "status"],
        default="status",
        help="Pipeline action to execute"
    )
    parser.add_argument("--delta", type=int, default=40, help="Number of simulated delta records for benchmark")
    parser.add_argument("--customers", type=int, default=1000, help="Number of customers to seed")
    parser.add_argument("--transactions", type=int, default=5000, help="Number of transactions to seed")
    args = parser.parse_args()

    # Ensure tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        if args.action == "seed":
            print(f"[*] Seeding database with {args.customers} customers and {args.transactions} transactions...")
            res = SyntheticDataGenerator.generate_all(db, customer_count=args.customers, transaction_count=args.transactions)
            print(f"[+] Success: {res}")

        elif args.action == "incremental":
            print("[*] Running CDC Incremental ETL Pipeline...")
            res = ETLPipeline.run_incremental_etl(db)
            print(f"[+] Incremental Run Result: {json.dumps(res, indent=2)}")

        elif args.action == "full":
            print("[*] Running Full Warehouse Load ETL...")
            res = ETLPipeline.run_full_etl(db)
            print(f"[+] Full Run Result: {json.dumps(res, indent=2)}")

        elif args.action == "benchmark":
            print(f"[*] Running Performance Benchmark with {args.delta} delta events...")
            res = PipelineOptimizer.run_benchmark_comparison(db, simulated_delta_events=args.delta)
            print(f"[+] Benchmark Metrics: {json.dumps(res, indent=2)}")

        elif args.action == "simulate":
            print("[*] Simulating live operational banking transactions & customer changes...")
            res = CDCEngine.simulate_events(db, insert_count=25, update_count=15, delete_count=5)
            print(f"[+] Simulated Events: {json.dumps(res, indent=2)}")

        elif args.action == "status":
            stats = BankingAnalytics.get_dashboard_summary(db)
            print("==================================================")
            print(" BANKING CDC DATA WAREHOUSE PIPELINE STATUS")
            print("==================================================")
            for k, v in stats.items():
                print(f"  {k:30}: {v}")
            print("==================================================")

    except Exception as e:
        print(f"[-] Execution Error: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    main()
