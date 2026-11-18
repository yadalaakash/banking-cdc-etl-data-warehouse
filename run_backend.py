import uvicorn
import os
from backend.app.config import HOST, PORT

if __name__ == "__main__":
    print(f"Starting Banking CDC-ETL Data Warehouse Engine on http://{HOST}:{PORT}")
    uvicorn.run("backend.app.main:app", host=HOST, port=PORT, reload=True)
