import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertCircle, CheckCircle2, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { fetchDataQuality } from '../services/api';

export default function DataQualityView() {
  const [audit, setAudit] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAudit = async () => {
    setLoading(true);
    try {
      const res = await fetchDataQuality();
      setAudit(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAudit();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#9ca3af' }}>
        <RefreshCw size={24} className="animate-spin" />
        <span style={{ marginLeft: '10px' }}>Profiling Schema & Health Metrics...</span>
      </div>
    );
  }

  const overallScore = audit?.overall_score || 100;
  const tables = audit?.tables || {};

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#f3f4f6', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={22} color="#10b981" /> Data Quality & Schema Health
          </h2>
          <p style={{ fontSize: '12px', color: '#9ca3af' }}>
            Automated schema profiling, completeness audits, null analysis, and outlier inspection
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: '#111827', border: '1px solid #374151', padding: '6px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>Overall Health:</span>
            <span style={{ fontSize: '16px', fontWeight: 800, color: overallScore >= 90 ? '#10b981' : '#f59e0b' }}>
              {overallScore}%
            </span>
          </div>
          <button
            onClick={loadAudit}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#1f2937', color: '#d1d5db', border: '1px solid #374151', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
          >
            <RefreshCw size={13} /> Re-Audit
          </button>
        </div>
      </div>

      {Object.keys(tables).map((tblName) => {
        const tbl = tables[tblName];
        return (
          <div key={tblName} style={{ background: '#111827', border: '1px solid #374151', borderRadius: '10px', padding: '20px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileSpreadsheet size={18} color="#60a5fa" />
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f3f4f6' }}>{tblName}</h3>
                <span style={{ fontSize: '11px', background: '#1e3a8a', color: '#bfdbfe', padding: '2px 8px', borderRadius: '4px' }}>
                  {tbl.total_rows.toLocaleString()} rows • {tbl.total_columns} columns
                </span>
              </div>
              <span style={{ fontSize: '13px', fontWeight: 700, color: tbl.health_score >= 90 ? '#34d399' : '#fbbf24' }}>
                {tbl.health_score}% Score
              </span>
            </div>

            {/* Quick Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: '#1f2937', padding: '10px', borderRadius: '6px', fontSize: '12px' }}>
                <span style={{ color: '#9ca3af' }}>Completeness:</span>
                <div style={{ fontWeight: 700, color: '#f3f4f6' }}>{tbl.completeness_pct}%</div>
              </div>
              <div style={{ background: '#1f2937', padding: '10px', borderRadius: '6px', fontSize: '12px' }}>
                <span style={{ color: '#9ca3af' }}>Uniqueness:</span>
                <div style={{ fontWeight: 700, color: '#f3f4f6' }}>{tbl.uniqueness_pct}%</div>
              </div>
              <div style={{ background: '#1f2937', padding: '10px', borderRadius: '6px', fontSize: '12px' }}>
                <span style={{ color: '#9ca3af' }}>Duplicate Rows:</span>
                <div style={{ fontWeight: 700, color: tbl.duplicate_rows > 0 ? '#ef4444' : '#10b981' }}>{tbl.duplicate_rows}</div>
              </div>
            </div>

            {/* Recommendations */}
            {tbl.recommendations && tbl.recommendations.length > 0 && (
              <div style={{ background: 'rgba(59, 130, 246, 0.08)', borderLeft: '3px solid #3b82f6', padding: '10px 14px', borderRadius: '0 6px 6px 0', marginBottom: '16px', fontSize: '12px' }}>
                <span style={{ fontWeight: 600, color: '#60a5fa' }}>Audit Insights & Recommendations:</span>
                {tbl.recommendations.map((rec, i) => (
                  <div key={i} style={{ color: '#d1d5db', marginTop: '4px' }}>• {rec}</div>
                ))}
              </div>
            )}

            {/* Column Profile Table */}
            <div style={{ overflowX: 'auto', borderRadius: '6px', border: '1px solid #374151' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#1f2937', borderBottom: '1px solid #374151' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', color: '#9ca3af' }}>Column</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', color: '#9ca3af' }}>Type</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', color: '#9ca3af' }}>Nulls</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', color: '#9ca3af' }}>Distinct Values</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', color: '#9ca3af' }}>Outliers</th>
                  </tr>
                </thead>
                <tbody>
                  {tbl.column_profiles.map((col, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #1f2937' }}>
                      <td style={{ padding: '8px 12px', color: '#f3f4f6', fontWeight: 600 }}>{col.column}</td>
                      <td style={{ padding: '8px 12px', color: '#9ca3af', fontFamily: 'monospace' }}>{col.data_type}</td>
                      <td style={{ padding: '8px 12px', color: col.null_count > 0 ? '#f59e0b' : '#10b981' }}>
                        {col.null_count} ({col.null_pct}%)
                      </td>
                      <td style={{ padding: '8px 12px', color: '#d1d5db' }}>{col.unique_values}</td>
                      <td style={{ padding: '8px 12px', color: col.outlier_count > 0 ? '#ef4444' : '#9ca3af' }}>
                        {col.outlier_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
