import React, { useState, useEffect } from 'react';
import { TrendingUp, Calendar, RefreshCw, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { runForecast, fetchTables } from '../services/api';
import ChartRenderer from './ChartRenderer';

export default function ForecastView() {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('sales_data');
  const [dateCol, setDateCol] = useState('order_date');
  const [valueCol, setValueCol] = useState('revenue');
  const [horizon, setHorizon] = useState(6);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTables().then(res => {
      setTables(res.tables || []);
    });
  }, []);

  const executeForecast = async () => {
    if (!selectedTable) return;
    setLoading(true);
    try {
      const res = await runForecast(selectedTable, dateCol, valueCol, horizon, 'month');
      setResults(res);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeForecast();
  }, [selectedTable]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#f3f4f6', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={22} color="#10b981" /> Time-Series Forecast Studio
          </h2>
          <p style={{ fontSize: '12px', color: '#9ca3af' }}>
            Holt-Winters & exponential smoothing projection with 95% confidence intervals
          </p>
        </div>

        <button
          onClick={executeForecast}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#059669', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Forecasting...' : 'Generate Forecast'}
        </button>
      </div>

      {/* Parameters */}
      <div style={{ background: '#111827', border: '1px solid #374151', borderRadius: '10px', padding: '16px', marginBottom: '24px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div>
          <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Table:</label>
          <select
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
            style={{ background: '#1f2937', color: '#f3f4f6', border: '1px solid #374151', borderRadius: '6px', padding: '6px 12px', fontSize: '12px' }}
          >
            {tables.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Timestamp Column:</label>
          <input
            type="text"
            value={dateCol}
            onChange={(e) => setDateCol(e.target.value)}
            style={{ background: '#1f2937', color: '#f3f4f6', border: '1px solid #374151', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', width: '130px' }}
          />
        </div>

        <div>
          <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Metric Column:</label>
          <input
            type="text"
            value={valueCol}
            onChange={(e) => setValueCol(e.target.value)}
            style={{ background: '#1f2937', color: '#f3f4f6', border: '1px solid #374151', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', width: '130px' }}
          />
        </div>

        <div>
          <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Forecast Horizon ({horizon} months):</label>
          <input
            type="range"
            min="3"
            max="12"
            value={horizon}
            onChange={(e) => setHorizon(parseInt(e.target.value))}
            style={{ width: '120px' }}
          />
        </div>
      </div>

      {results && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Insight Banner */}
          {(() => {
            const isUpward = results.trend_direction === 'Upward';
            const isDownward = results.trend_direction === 'Downward';
            const badgeColor = isUpward ? '#34d399' : (isDownward ? '#f87171' : '#60a5fa');
            const borderColor = isUpward ? '#059669' : (isDownward ? '#dc2626' : '#2563eb');
            const bgColor = isUpward ? 'rgba(16, 185, 129, 0.1)' : (isDownward ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)');

            return (
              <div style={{ background: bgColor, border: `1px solid ${borderColor}`, borderRadius: '8px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: badgeColor, marginBottom: '4px' }}>
                    {results.trend_direction} Trajectory ({results.projected_growth_pct >= 0 ? '+' : ''}{results.projected_growth_pct}%)
                    {results.is_capped ? ' (Clamped)' : ''}
                  </div>
                  <div style={{ fontSize: '12px', color: '#d1d5db' }}>
                    {results.summary_insight}
                  </div>
                </div>
                {isUpward ? (
                  <ArrowUpRight size={32} color="#10b981" />
                ) : isDownward ? (
                  <ArrowDownRight size={32} color="#ef4444" />
                ) : (
                  <TrendingUp size={32} color="#60a5fa" />
                )}
              </div>
            );
          })()}

          {/* Chart */}
          <div style={{ background: '#111827', border: '1px solid #374151', borderRadius: '10px', padding: '20px' }}>
            <ChartRenderer spec={{
              type: 'forecast_line',
              title: `Forecast Projection for ${valueCol.toUpperCase()} (${results.horizon_periods} Months Ahead)`,
              historical: results.historical_points,
              forecast: results.forecast_points
            }} />
          </div>

          {/* Forecast Points Table */}
          <div style={{ background: '#111827', border: '1px solid #374151', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', background: '#1f2937', borderBottom: '1px solid #374151', fontSize: '13px', fontWeight: 600, color: '#f3f4f6' }}>
              Projected Monthly Figures
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: '#111827', borderBottom: '1px solid #374151' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: '#9ca3af' }}>Month</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: '#9ca3af' }}>Forecast</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: '#9ca3af' }}>Lower Bound (95%)</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: '#9ca3af' }}>Upper Bound (95%)</th>
                </tr>
              </thead>
              <tbody>
                {results.forecast_points.map((pt, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #1f2937' }}>
                    <td style={{ padding: '10px 14px', color: '#f3f4f6' }}>{pt.date}</td>
                    <td style={{ padding: '10px 14px', color: '#34d399', fontWeight: 700 }}>${pt.forecast.toLocaleString()}</td>
                    <td style={{ padding: '10px 14px', color: '#9ca3af' }}>${pt.lower_bound.toLocaleString()}</td>
                    <td style={{ padding: '10px 14px', color: '#9ca3af' }}>${pt.upper_bound.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
