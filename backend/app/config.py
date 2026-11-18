import os
from pathlib import Path

# Base Paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
UPLOAD_DIR = DATA_DIR / "uploads"
RAW_DIR = DATA_DIR / "raw"
CDC_BATCH_DIR = DATA_DIR / "cdc_batches"

# Ensure directories exist
for directory in [DATA_DIR, UPLOAD_DIR, RAW_DIR, CDC_BATCH_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

# Environment configuration
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'banking_dw.db'}")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
DEFAULT_BATCH_SIZE = int(os.getenv("DEFAULT_BATCH_SIZE", "1000"))
SCD_MODE = os.getenv("SCD_MODE", "scd_type_2")
ENABLE_ANOMALY_DETECTION = os.getenv("ENABLE_ANOMALY_DETECTION", "true").lower() == "true"
