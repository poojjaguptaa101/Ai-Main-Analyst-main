import React, { useState } from 'react';
import { Terminal, Play, Clock, CheckCircle, AlertCircle, Copy, Check } from 'lucide-react';
import { executeSql } from '../services/api';

export default function SqlPlaygroundView() {
  const [sql, setSql] = useState("SELECT region, ROUND(SUM(revenue), 2) AS total_revenue, COUNT(*) AS orders FROM sales_data GROUP BY region ORDER BY total_revenue DESC;");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const sampleQueries = [
    { label: "Regional Revenue", sql: "SELECT region, ROUND(SUM(revenue), 2) as total_rev FROM sales_data GROUP BY region ORDER BY total_rev DESC;" },
    { label: "Monthly Momentum", sql: "SELECT strftime('%Y-%m', CAST(order_date AS DATE)) as month, ROUND(SUM(revenue), 2) as monthly_rev FROM sales_data GROUP BY month ORDER BY month ASC;" },
    { label: "Customer Join", sql: "SELECT c.customer_name, c.segment, ROUND(SUM(s.revenue), 2) as total_spent FROM sales_data s JOIN customers c ON s.customer_id = c.customer_id GROUP BY c.customer_name, c.segment ORDER BY total_spent DESC LIMIT 5;" },
    { label: "Outlier Check", sql: "SELECT * FROM financial_anomalies WHERE is_flagged_fraud = 1;" }
  ];

  const runQuery = async () => {
    if (!sql.trim()) return;
    setLoading(true);
    try {
      const res = await executeSql(sql);
      setResult(res);
    } catch (e) {
      setResult({ success: false, error: e.message });
    } finally {
      setLoading(false);
    }
  };

  const copySql = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#f3f4f6', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={22} color="#38bdf8" /> DuckDB SQL Lab
          </h2>
          <p style={{ fontSize: '12px', color: '#9ca3af' }}>
            Execute analytical SQL directly on in-memory vectorized columnar DuckDB tables
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={copySql}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#1f2937', color: '#d1d5db', border: '1px solid #374151', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
          >
            {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            onClick={runQuery}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#0284c7', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
          >
            <Play size={14} fill="white" />
            {loading ? 'Running...' : 'Run SQL'}
          </button>
        </div>
      </div>

      {/* Query shortcuts */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', overflowX: 'auto' }}>
        <span style={{ fontSize: '11px', color: '#9ca3af', display: 'flex', alignItems: 'center' }}>Presets:</span>
        {sampleQueries.map((q, i) => (
          <button
            key={i}
            onClick={() => setSql(q.sql)}
            style={{ fontSize: '11px', padding: '4px 10px', background: '#1f2937', color: '#60a5fa', border: '1px solid #374151', borderRadius: '6px', cursor: 'pointer' }}
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* SQL Editor Area */}
      <div style={{ background: '#0b0f19', border: '1px solid #374151', borderRadius: '10px', overflow: 'hidden', marginBottom: '24px' }}>
        <textarea
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          rows={5}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#38bdf8',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '13px',
            padding: '16px',
            resize: 'vertical'
          }}
        />
      </div>

      {/* Results Display */}
      {result && (
        <div style={{ background: '#111827', border: '1px solid #374151', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', background: '#1f2937', borderBottom: '1px solid #374151', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#f3f4f6', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {result.success ? <CheckCircle size={15} color="#10b981" /> : <AlertCircle size={15} color="#ef4444" />}
              {result.success ? `Execution Succeeded (${result.total_rows} rows)` : 'Execution Failed'}
            </span>
            {result.execution_time_ms !== undefined && (
              <span style={{ fontSize: '11px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} /> {result.execution_time_ms} ms
              </span>
            )}
          </div>

          {result.success ? (
            <div style={{ overflowX: 'auto', maxHeight: '400px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#111827', borderBottom: '1px solid #374151' }}>
                    {result.columns.map((col, i) => (
                      <th key={i} style={{ padding: '10px 14px', textAlign: 'left', color: '#9ca3af', fontWeight: 600 }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, rIdx) => (
                    <tr key={rIdx} style={{ borderBottom: '1px solid #1f2937' }}>
                      {result.columns.map((col, cIdx) => (
                        <td key={cIdx} style={{ padding: '8px 14px', color: '#e5e7eb' }}>
                          {typeof row[col] === 'number' ? row[col].toLocaleString() : String(row[col] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '16px', color: '#f87171', fontFamily: 'monospace', fontSize: '12px', background: '#1f1315' }}>
              {result.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
