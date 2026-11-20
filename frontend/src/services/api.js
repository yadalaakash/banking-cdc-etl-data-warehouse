const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

export async function fetchStats() {
  const res = await fetch(`${API_BASE}/dashboard/stats`);
  if (!res.ok) throw new Error("Failed to load dashboard statistics");
  return res.json();
}

export async function fetchCharts() {
  const res = await fetch(`${API_BASE}/dashboard/charts`);
  if (!res.ok) throw new Error("Failed to load chart metrics");
  return res.json();
}

export async function fetchSources() {
  const res = await fetch(`${API_BASE}/sources/status`);
  if (!res.ok) throw new Error("Failed to fetch sources status");
  return res.json();
}

export async function uploadSourceFile(formData) {
  const res = await fetch(`${API_BASE}/sources/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Upload failed");
  }
  return res.json();
}

export async function generateSampleFiles() {
  const res = await fetch(`${API_BASE}/sources/generate-sample-files`);
  if (!res.ok) throw new Error("Failed to generate sample files");
  return res.json();
}

export async function fetchCDCEvents(page = 1, limit = 25, operation = "", tableName = "", isProcessed = null) {
  let url = `${API_BASE}/cdc/events?page=${page}&limit=${limit}`;
  if (operation) url += `&operation=${encodeURIComponent(operation)}`;
  if (tableName) url += `&table_name=${encodeURIComponent(tableName)}`;
  if (isProcessed !== null && isProcessed !== "") url += `&is_processed=${isProcessed}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch CDC events");
  return res.json();
}

export async function simulateCDCEvents(insertCount = 25, updateCount = 15, deleteCount = 5) {
  const res = await fetch(`${API_BASE}/cdc/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      insert_count: insertCount,
      update_count: updateCount,
      delete_count: deleteCount,
    }),
  });
  if (!res.ok) throw new Error("Simulation failed");
  return res.json();
}

export async function fetchCDCMetrics() {
  const res = await fetch(`${API_BASE}/cdc/metrics`);
  if (!res.ok) throw new Error("Failed to fetch CDC metrics");
  return res.json();
}

export async function runIncrementalETL(batchLimit = 2000) {
  const res = await fetch(`${API_BASE}/pipeline/run-incremental?batch_limit=${batchLimit}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Incremental pipeline execution failed");
  return res.json();
}

export async function runFullETL() {
  const res = await fetch(`${API_BASE}/pipeline/run-full`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Full pipeline execution failed");
  return res.json();
}

export async function runBenchmark(deltaEvents = 40) {
  const res = await fetch(`${API_BASE}/pipeline/benchmark`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ delta_events: deltaEvents }),
  });
  if (!res.ok) throw new Error("Benchmark execution failed");
  return res.json();
}

export async function fetchPipelineRuns(page = 1, limit = 15, runType = "") {
  let url = `${API_BASE}/pipeline/runs?page=${page}&limit=${limit}`;
  if (runType) url += `&run_type=${runType}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch pipeline runs");
  return res.json();
}

export async function fetchOptimizationStats() {
  const res = await fetch(`${API_BASE}/pipeline/optimization-stats`);
  if (!res.ok) throw new Error("Failed to fetch optimization history");
  return res.json();
}

export async function fetchWarehouseTables() {
  const res = await fetch(`${API_BASE}/warehouse/tables`);
  if (!res.ok) throw new Error("Failed to fetch warehouse tables");
  return res.json();
}

export async function fetchTablePreview(tableName, page = 1, limit = 20) {
  const res = await fetch(`${API_BASE}/warehouse/preview/${tableName}?page=${page}&limit=${limit}`);
  if (!res.ok) throw new Error("Failed to load table preview");
  return res.json();
}

export async function executeWarehouseQuery(sql, limit = 50) {
  const res = await fetch(`${API_BASE}/warehouse/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql, limit }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Query execution failed");
  }
  return res.json();
}

export async function fetchSegmentation() {
  const res = await fetch(`${API_BASE}/analytics/segmentation`);
  if (!res.ok) throw new Error("Failed to fetch segmentation");
  return res.json();
}

export async function fetchAnomaliesAndLeaders(limit = 15) {
  const res = await fetch(`${API_BASE}/analytics/anomalies-and-leaders?limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch anomalies and leaders");
  return res.json();
}

export async function fetchReportData(reportType, page = 1, limit = 25) {
  let url = `${API_BASE}/reports/${reportType}?page=${page}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch report data");
  return res.json();
}

export function getExportUrl(reportType, format = "csv") {
  return `${API_BASE}/reports/export?report_type=${reportType}&export_format=${format}`;
}
