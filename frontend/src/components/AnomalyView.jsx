import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldAlert, Sliders, CheckCircle2, RefreshCw } from 'lucide-react';
import { detectAnomalies, fetchTables } from '../services/api';
import ChartRenderer from './ChartRenderer';

export default function AnomalyView() {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [method, setMethod] = useState('isolation_forest');
  const [contamination, setContamination] = useState(0.05);
  const [zThreshold, setZThreshold] = useState(3.0);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTables().then(res => {
      setTables(res.tables || []);
      if (res.tables && res.tables.length > 0) {
        // Default to financial_anomalies or sales_data
        const def = res.tables.includes('financial_anomalies') ? 'financial_anomalies' : res.tables[0];
        setSelectedTable(def);
      }
    });
  }, []);

  const runDetection = async () => {
    if (!selectedTable) return;
    setLoading(true);
    try {
      const res = await detectAnomalies(selectedTable, method, contamination, zThreshold);
      setResults(res);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTable) {
      runDetection();
    }
  }, [selectedTable, method]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#f3f4f6', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={22} color="#f43f5e" /> Anomaly & Outlier Hunter
          </h2>
          <p style={{ fontSize: '12px', color: '#9ca3af' }}>
            Multi-model statistical & machine learning outlier engine with natural language explanation
          </p>
        </div>

        <button
          onClick={runDetection}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#dc2626', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Scanning...' : 'Re-Run Anomaly Scan'}
        </button>
      </div>

      {/* Control Panel */}
      <div style={{ background: '#111827', border: '1px solid #374151', borderRadius: '10px', padding: '16px', marginBottom: '24px', display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Target Table:</label>
          <select
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
            style={{ background: '#1f2937', color: '#f3f4f6', border: '1px solid #374151', borderRadius: '6px', padding: '6px 12px', fontSize: '12px' }}
          >
            {tables.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Algorithm Model:</label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            style={{ background: '#1f2937', color: '#f3f4f6', border: '1px solid #374151', borderRadius: '6px', padding: '6px 12px', fontSize: '12px' }}
          >
            <option value="isolation_forest">Isolation Forest (Unsupervised ML)</option>
            <option value="z_score">Z-Score Deviation (|Z| &gt; Threshold)</option>
            <option value="iqr">Interquartile Range (IQR)</option>
          </select>
        </div>

        {method === 'isolation_forest' ? (
          <div>
            <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>
              Contamination Rate: {Math.round(contamination * 100)}%
            </label>
            <input
              type="range"
              min="0.01"
              max="0.15"
              step="0.01"
              value={contamination}
              onChange={(e) => setContamination(parseFloat(e.target.value))}
              style={{ width: '130px' }}
            />
          </div>
        ) : (
          <div>
            <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>
              Z-Threshold: {zThreshold} σ
            </label>
            <input
              type="range"
              min="2.0"
              max="5.0"
              step="0.5"
              value={zThreshold}
              onChange={(e) => setZThreshold(parseFloat(e.target.value))}
              style={{ width: '130px' }}
            />
          </div>
        )}
      </div>

      {/* Results */}
      {results && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Stat Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{ background: '#111827', border: '1px solid #374151', borderRadius: '8px', padding: '16px' }}>
              <span style={{ fontSize: '11px', color: '#9ca3af' }}>Total Scanned Records</span>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#f3f4f6' }}>{results.total_rows.toLocaleString()}</div>
            </div>
            <div style={{ background: '#111827', border: '1px solid #dc2626', borderRadius: '8px', padding: '16px' }}>
              <span style={{ fontSize: '11px', color: '#fca5a5' }}>Flagged Anomalies</span>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#ef4444' }}>{results.anomaly_count}</div>
            </div>
            <div style={{ background: '#111827', border: '1px solid #374151', borderRadius: '8px', padding: '16px' }}>
              <span style={{ fontSize: '11px', color: '#9ca3af' }}>Anomaly Rate</span>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#f59e0b' }}>{results.anomaly_percentage}%</div>
            </div>
            <div style={{ background: '#111827', border: '1px solid #374151', borderRadius: '8px', padding: '16px' }}>
              <span style={{ fontSize: '11px', color: '#9ca3af' }}>Features Evaluated</span>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#60a5fa', marginTop: '4px' }}>
                {results.feature_columns.join(', ')}
              </div>
            </div>
          </div>

          {/* Scatter Plot */}
          <div style={{ background: '#111827', border: '1px solid #374151', borderRadius: '10px', padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#f3f4f6', marginBottom: '10px' }}>
              Outlier Distribution Scatter Plot
            </h3>
            <ChartRenderer spec={{
              type: 'scatter',
              title: `Anomalies vs Normal Distribution (${results.y_axis_label})`,
              x_axis: results.x_axis_label,
              y_axis: results.y_axis_label,
              data: results.scatter_data
            }} />
          </div>

          {/* Detailed Flagged Records Table with Explanations */}
          <div style={{ background: '#111827', border: '1px solid #374151', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', background: '#1f2937', borderBottom: '1px solid #374151' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#f3f4f6' }}>
                Flagged Outliers & Root-Cause Explanations ({results.flagged_records.length} records)
              </h3>
            </div>
            <div style={{ overflowX: 'auto', maxHeight: '350px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#111827', borderBottom: '1px solid #374151' }}>
                    <th style={{ padding: '10px 14px', textAlign: 'left', color: '#9ca3af' }}>Row #</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', color: '#9ca3af' }}>Score</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', color: '#9ca3af' }}>AI Explanation</th>
                  </tr>
                </thead>
                <tbody>
                  {results.flagged_records.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #1f2937' }}>
                      <td style={{ padding: '10px 14px', color: '#60a5fa', fontWeight: 600 }}>#{r.row_index}</td>
                      <td style={{ padding: '10px 14px', color: '#f87171', fontWeight: 600 }}>{r.anomaly_score}</td>
                      <td style={{ padding: '10px 14px', color: '#fca5a5' }}>{r.explanation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
