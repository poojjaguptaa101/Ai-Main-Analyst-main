import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, Zap, Play, Database, Layers } from 'lucide-react';
import { runEvaluation, fetchObservability } from '../services/api';

export default function ObservabilityView() {
  const [obs, setObs] = useState(null);
  const [evalResult, setEvalResult] = useState(null);
  const [runningEval, setRunningEval] = useState(false);

  useEffect(() => {
    fetchObservability().then(setObs);
  }, []);

  const handleRunEvaluation = async () => {
    setRunningEval(true);
    try {
      const res = await runEvaluation();
      setEvalResult(res);
    } catch (e) {
      alert(e.message);
    } finally {
      setRunningEval(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#f3f4f6', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={22} color="#8b5cf6" /> Observability & AI Benchmark Suite
          </h2>
          <p style={{ fontSize: '12px', color: '#9ca3af' }}>
            Real-time query performance, system health, and rigorous automated evaluation framework
          </p>
        </div>

        <button
          onClick={handleRunEvaluation}
          disabled={runningEval}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#7c3aed', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
        >
          <Play size={14} fill="white" />
          {runningEval ? 'Executing Benchmark...' : 'Run Automated Benchmark'}
        </button>
      </div>

      {/* System Telemetry Cards */}
      {obs && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ background: '#111827', border: '1px solid #374151', borderRadius: '10px', padding: '16px' }}>
            <span style={{ fontSize: '11px', color: '#9ca3af' }}>Indexed Tables</span>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#60a5fa' }}>{obs.active_tables}</div>
            <span style={{ fontSize: '11px', color: '#6b7280' }}>{obs.total_records_indexed.toLocaleString()} total rows</span>
          </div>
          <div style={{ background: '#111827', border: '1px solid #374151', borderRadius: '10px', padding: '16px' }}>
            <span style={{ fontSize: '11px', color: '#9ca3af' }}>Relational Foreign Keys</span>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#34d399' }}>{obs.detected_relationships}</div>
            <span style={{ fontSize: '11px', color: '#6b7280' }}>Cross-table joins detected</span>
          </div>
          <div style={{ background: '#111827', border: '1px solid #374151', borderRadius: '10px', padding: '16px' }}>
            <span style={{ fontSize: '11px', color: '#9ca3af' }}>Cache Entries & Hits</span>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#f59e0b' }}>{obs.cache.hits} Hits</div>
            <span style={{ fontSize: '11px', color: '#6b7280' }}>{obs.cache.hit_ratio_pct}% hit ratio</span>
          </div>
          <div style={{ background: '#111827', border: '1px solid #374151', borderRadius: '10px', padding: '16px' }}>
            <span style={{ fontSize: '11px', color: '#9ca3af' }}>Execution Architecture</span>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#f3f4f6', marginTop: '6px' }}>DuckDB OLAP + ReAct</div>
            <span style={{ fontSize: '11px', color: '#10b981' }}>System Status: Healthy</span>
          </div>
        </div>
      )}

      {/* Benchmark Results */}
      {evalResult && (
        <div style={{ background: '#111827', border: '1px solid #374151', borderRadius: '10px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #1f2937', paddingBottom: '12px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f3f4f6' }}>Evaluation Benchmark Scorecard</h3>
              <p style={{ fontSize: '11px', color: '#9ca3af' }}>Evaluated against the 5 core assignment test queries</p>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '10px', color: '#9ca3af', display: 'block' }}>Accuracy Score</span>
                <span style={{ fontSize: '18px', fontWeight: 800, color: '#10b981' }}>{evalResult.accuracy_score_pct}%</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '10px', color: '#9ca3af', display: 'block' }}>Avg Latency</span>
                <span style={{ fontSize: '18px', fontWeight: 800, color: '#38bdf8' }}>{evalResult.average_latency_ms} ms</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {evalResult.results.map((r, i) => (
              <div key={i} style={{ background: '#1f2937', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {r.passed ? <CheckCircle2 size={18} color="#10b981" /> : <XCircle size={18} color="#ef4444" />}
                  <div>
                    <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 600 }}>{r.test_id} • {r.category}</span>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#f3f4f6' }}>{r.question}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '11px', color: '#9ca3af' }}>
                  <span>{r.thought_steps} thought steps</span>
                  <span>{r.insights_generated} insights</span>
                  <span style={{ color: '#38bdf8', fontWeight: 600 }}>{r.latency_ms} ms</span>
                  <span style={{ padding: '2px 8px', borderRadius: '4px', background: r.passed ? '#064e3b' : '#7f1d1d', color: r.passed ? '#a7f3d0' : '#fecaca', fontWeight: 700 }}>
                    {r.passed ? 'PASSED' : 'FAILED'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
