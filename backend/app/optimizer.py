import time
import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from backend.app.models import PipelineRun, CDCChangeLog, FactTransactions, SourceTransaction
from backend.app.etl_pipeline import ETLPipeline
from backend.app.cdc_engine import CDCEngine

class PipelineOptimizer:
    """
    Engine for benchmarking Full ETL vs Incremental ETL.
    Calculates execution metrics, processing time saved, throughput ratio,
    and optimization gains based on real execution data.
    """

    @classmethod
    def run_benchmark_comparison(cls, db: Session, simulated_delta_events: int = 40) -> Dict[str, Any]:
        """
        Execute an automated, scientific benchmark comparing Full ETL vs Incremental CDC ETL:
        1. Injects sample CDC events (inserts, updates, deletes).
        2. Measures Incremental ETL duration, throughput, and records loaded.
        3. Measures Full ETL duration, throughput, and records loaded over the entire warehouse.
        4. Calculates exact % time saved and throughput improvement ratio.
        """
        # 1. Generate delta events
        sim_res = CDCEngine.simulate_events(
            db,
            insert_count=int(simulated_delta_events * 0.6),
            update_count=int(simulated_delta_events * 0.3),
            delete_count=max(1, int(simulated_delta_events * 0.1))
        )

        # 2. Run Incremental CDC ETL
        inc_res = ETLPipeline.run_incremental_etl(db)

        # 3. Run Full Load ETL
        full_res = ETLPipeline.run_full_etl(db)

        inc_time = max(1.0, float(inc_res.get("duration_ms", 1.0)))
        full_time = max(1.0, float(full_res.get("duration_ms", 1.0)))

        # If synthetic timing is too small for microsecond resolutions, provide realistic scale bounds
        time_saved_ms = max(0.0, full_time - inc_time)
        time_saved_percent = round((time_saved_ms / full_time) * 100.0, 2)
        speedup_factor = round(full_time / inc_time, 2)

        records_inc = inc_res.get("records_loaded", 0)
        records_full = full_res.get("records_loaded", 0)
        records_ratio = round((records_inc / records_full) * 100.0, 2) if records_full > 0 else 0.0

        benchmark_summary = {
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "incremental": {
                "run_id": inc_res.get("run_id"),
                "duration_ms": inc_time,
                "records_processed": inc_res.get("records_extracted", 0),
                "records_loaded": records_inc,
                "throughput_rps": inc_res.get("throughput_rps", 0.0),
                "inserts": inc_res.get("inserts", 0),
                "updates": inc_res.get("updates", 0),
                "deletes": inc_res.get("deletes", 0)
            },
            "full": {
                "run_id": full_res.get("run_id"),
                "duration_ms": full_time,
                "records_processed": full_res.get("records_extracted", 0),
                "records_loaded": records_full,
                "throughput_rps": full_res.get("throughput_rps", 0.0)
            },
            "optimization_metrics": {
                "time_saved_ms": round(time_saved_ms, 2),
                "time_saved_percent": time_saved_percent,
                "speedup_factor": f"{speedup_factor}x faster",
                "io_reduction_percent": round(100.0 - records_ratio, 2),
                "throughput_gain": f"{round((inc_res.get('throughput_rps', 1.0) / max(1.0, full_res.get('throughput_rps', 1.0))), 2)}x",
                "efficiency_verdict": f"Incremental CDC achieved {time_saved_percent}% latency reduction by processing only {records_ratio}% delta volume."
            }
        }
        return benchmark_summary

    @classmethod
    def get_performance_history(cls, db: Session, limit: int = 15) -> Dict[str, Any]:
        """
        Retrieve historical comparison stats across previous pipeline runs.
        """
        runs = db.query(PipelineRun).order_by(desc(PipelineRun.start_time)).limit(limit).all()

        full_runs = [r for r in runs if r.run_type == "FULL"]
        inc_runs = [r for r in runs if r.run_type == "INCREMENTAL"]

        avg_full_ms = round(sum(r.duration_ms for r in full_runs) / len(full_runs), 2) if full_runs else 0.0
        avg_inc_ms = round(sum(r.duration_ms for r in inc_runs) / len(inc_runs), 2) if inc_runs else 0.0

        overall_time_saved = 0.0
        if avg_full_ms > 0 and avg_inc_ms > 0:
            overall_time_saved = round(((avg_full_ms - avg_inc_ms) / avg_full_ms) * 100.0, 2)

        return {
            "total_runs_analyzed": len(runs),
            "avg_full_load_ms": avg_full_ms,
            "avg_incremental_ms": avg_inc_ms,
            "average_time_saved_percent": overall_time_saved,
            "recent_runs": [
                {
                    "run_id": r.run_id,
                    "pipeline_name": r.pipeline_name,
                    "run_type": r.run_type,
                    "duration_ms": r.duration_ms,
                    "records_loaded": r.records_loaded,
                    "throughput_rps": r.throughput_rps,
                    "status": r.status,
                    "time_saved_percent": r.time_saved_percent,
                    "start_time": r.start_time.isoformat() if r.start_time else None
                }
                for r in runs
            ]
        }
