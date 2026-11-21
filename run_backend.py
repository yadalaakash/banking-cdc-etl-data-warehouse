import uvicorn
import os
from backend.app.config import HOST, PORT, ENVIRONMENT

if __name__ == "__main__":
    host = os.getenv("HOST", HOST)
    port = int(os.getenv("PORT", PORT))
    is_dev = ENVIRONMENT.lower() == "development"
    print(f"Starting Banking CDC-ETL Data Warehouse Engine on http://{host}:{port} (env: {ENVIRONMENT})")
    uvicorn.run("backend.app.main:app", host=host, port=port, reload=is_dev)
