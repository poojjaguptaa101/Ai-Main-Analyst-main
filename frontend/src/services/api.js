const API_BASE = '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function fetchTables() {
  const res = await fetch(`${API_BASE}/tables`);
  return res.json();
}

export async function loadSampleDatasets() {
  const res = await fetch(`${API_BASE}/load-samples`, { method: 'POST' });
  return res.json();
}

export async function uploadCsvFiles(files) {
  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
    formData.append('files', files[i]);
  }
  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Upload failed');
  }
  return res.json();
}

export async function fetchDashboard() {
  const res = await fetch(`${API_BASE}/dashboard`);
  return res.json();
}

export async function sendChatMessage(message, sessionId = 'default_session', provider = 'auto', apiKey = '') {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      message,
      provider,
      api_key: apiKey
    })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Chat query failed');
  }
  return res.json();
}

export async function detectAnomalies(tableName, method = 'isolation_forest', contamination = 0.05, zThreshold = 3.0) {
  const res = await fetch(`${API_BASE}/anomalies/detect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      table_name: tableName,
      method,
      contamination,
      z_threshold: zThreshold
    })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Anomaly detection failed');
  }
  return res.json();
}

export async function runForecast(tableName, dateCol, valueCol, horizon = 6, aggregation = 'month') {
  const res = await fetch(`${API_BASE}/forecast/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      table_name: tableName,
      date_column: dateCol,
      value_column: valueCol,
      horizon,
      aggregation
    })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Forecasting failed');
  }
  return res.json();
}

export async function fetchDataQuality() {
  const res = await fetch(`${API_BASE}/quality/audit`);
  return res.json();
}

export async function executeSql(sql) {
  const res = await fetch(`${API_BASE}/query/sql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql })
  });
  return res.json();
}

export async function executePandas(code) {
  const res = await fetch(`${API_BASE}/query/pandas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code })
  });
  return res.json();
}

export async function runEvaluation() {
  const res = await fetch(`${API_BASE}/evaluate/run`);
  return res.json();
}

export async function fetchObservability() {
  const res = await fetch(`${API_BASE}/observability/stats`);
  return res.json();
}

export function getReportDownloadUrl(sessionId = 'default_session') {
  return `${API_BASE}/export/html?session_id=${sessionId}`;
}
