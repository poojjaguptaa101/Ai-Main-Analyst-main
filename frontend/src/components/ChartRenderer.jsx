import React, { useState } from 'react';

export default function ChartRenderer({ spec }) {
  if (!spec) return null;

  const { type, title } = spec;

  return (
    <div style={{
      background: 'rgba(17, 24, 39, 0.95)',
      border: '1px solid #374151',
      borderRadius: '10px',
      padding: '16px',
      marginTop: '14px',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3)'
    }}>
      {title && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#f3f4f6' }}>{title}</h4>
          <span style={{ fontSize: '11px', color: '#9ca3af', background: '#374151', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
            {type.replace('_', ' ')}
          </span>
        </div>
      )}

      {type === 'bar' && <BarChart spec={spec} />}
      {type === 'line' && <LineChart spec={spec} />}
      {type === 'pie' && <PieChart spec={spec} />}
      {type === 'scatter' && <ScatterChart spec={spec} />}
      {type === 'forecast_line' && <ForecastChart spec={spec} />}
    </div>
  );
}

function BarChart({ spec }) {
  const labels = spec.labels || [];
  const values = spec.values || [];
  const color = spec.color || '#3b82f6';
  
  const maxVal = Math.max(...values, 1);
  const chartHeight = 200;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', height: `${chartHeight}px`, gap: '12px', paddingBottom: '8px', borderBottom: '1px solid #4b5563' }}>
        {values.map((val, idx) => {
          const heightPct = Math.max((val / maxVal) * 100, 4);
          return (
            <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '4px' }}>
                {typeof val === 'number' && val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
              </span>
              <div
                title={`${labels[idx]}: ${val}`}
                style={{
                  width: '100%',
                  maxWidth: '48px',
                  height: `${heightPct}%`,
                  background: `linear-gradient(180deg, ${color} 0%, rgba(59, 130, 246, 0.4) 100%)`,
                  borderRadius: '4px 4px 0 0',
                  transition: 'height 0.4s ease',
                  cursor: 'pointer'
                }}
              />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-around' }}>
        {labels.map((lbl, idx) => (
          <span key={idx} style={{ flex: 1, textAlign: 'center', fontSize: '11px', color: '#d1d5db', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {lbl}
          </span>
        ))}
      </div>
    </div>
  );
}

function LineChart({ spec }) {
  const labels = spec.labels || [];
  const values = spec.values || [];
  const color = spec.color || '#10b981';

  if (!values.length) return null;

  const width = 500;
  const height = 180;
  const padding = 30;
  const maxVal = Math.max(...values, 1);
  const minVal = Math.min(...values, 0);
  const range = maxVal - minVal || 1;

  const points = values.map((val, idx) => {
    const x = padding + (idx / Math.max(values.length - 1, 1)) * (width - 2 * padding);
    const y = height - padding - ((val - minVal) / range) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '200px' }}>
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#4b5563" strokeWidth="1" />
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="3"
          points={points}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {values.map((val, idx) => {
          const x = padding + (idx / Math.max(values.length - 1, 1)) * (width - 2 * padding);
          const y = height - padding - ((val - minVal) / range) * (height - 2 * padding);
          return (
            <g key={idx}>
              <circle cx={x} cy={y} r="4" fill={color} />
              <text x={x} y={height - 10} fill="#9ca3af" fontSize="10" textAnchor="middle">
                {labels[idx] || idx}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function PieChart({ spec }) {
  const labels = spec.labels || [];
  const values = spec.values || [];
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
  const total = values.reduce((a, b) => a + b, 0) || 1;

  let cumulativeAngle = 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: '20px', flexWrap: 'wrap' }}>
      <svg viewBox="0 0 160 160" style={{ width: '150px', height: '150px', transform: 'rotate(-90deg)' }}>
        {values.map((val, idx) => {
          const sliceAngle = (val / total) * 360;
          const startAngle = cumulativeAngle;
          cumulativeAngle += sliceAngle;

          const x1 = 80 + 70 * Math.cos((Math.PI * startAngle) / 180);
          const y1 = 80 + 70 * Math.sin((Math.PI * startAngle) / 180);
          const x2 = 80 + 70 * Math.cos((Math.PI * (startAngle + sliceAngle)) / 180);
          const y2 = 80 + 70 * Math.sin((Math.PI * (startAngle + sliceAngle)) / 180);
          const largeArc = sliceAngle > 180 ? 1 : 0;
          const d = `M 80 80 L ${x1} ${y1} A 70 70 0 ${largeArc} 1 ${x2} ${y2} Z`;

          return <path key={idx} d={d} fill={colors[idx % colors.length]} stroke="#111827" strokeWidth="2" />;
        })}
      </svg>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {labels.map((lbl, idx) => {
          const pct = Math.round((values[idx] / total) * 100);
          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: colors[idx % colors.length] }} />
              <span style={{ color: '#d1d5db' }}>{lbl}</span>
              <span style={{ color: '#9ca3af', fontWeight: 600 }}>{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ScatterChart({ spec }) {
  const data = spec.data || [];
  const width = 500;
  const height = 220;
  const padding = 35;

  const yVals = data.map(d => d.y);
  const maxY = Math.max(...yVals, 1);
  const minY = Math.min(...yVals, 0);
  const rangeY = maxY - minY || 1;

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '220px' }}>
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#4b5563" strokeWidth="1" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#4b5563" strokeWidth="1" />

        <text x={padding + 5} y={padding + 10} fill="#9ca3af" fontSize="10">{spec.y_axis}</text>

        {data.map((pt, idx) => {
          const x = padding + (idx / Math.max(data.length - 1, 1)) * (width - 2 * padding);
          const y = height - padding - ((pt.y - minY) / rangeY) * (height - 2 * padding);
          const isAnom = pt.is_anomaly;

          return (
            <circle
              key={idx}
              cx={x}
              cy={y}
              r={isAnom ? '6' : '3'}
              fill={isAnom ? '#ef4444' : '#3b82f6'}
              stroke={isAnom ? '#fee2e2' : 'none'}
              strokeWidth={isAnom ? '2' : '0'}
              style={{ cursor: 'pointer' }}
            >
              <title>{`Row #${pt.index || idx}: ${pt.y} ${isAnom ? '(ANOMALY DETECTED)' : ''}`}</title>
            </circle>
          );
        })}
      </svg>
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '6px', fontSize: '11px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#9ca3af' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }} /> Normal Records
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f87171', fontWeight: 600 }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', border: '1px solid white' }} /> Flagged Anomalies
        </span>
      </div>
    </div>
  );
}

function ForecastChart({ spec }) {
  const historical = spec.historical || [];
  const forecast = spec.forecast || [];
  const width = 550;
  const height = 220;
  const padding = 35;

  const allVals = [
    ...historical.map(h => h.actual),
    ...forecast.map(f => f.upper_bound),
    ...forecast.map(f => f.lower_bound)
  ];
  const maxVal = Math.max(...allVals, 1);
  const minVal = Math.min(...allVals, 0);
  const range = maxVal - minVal || 1;

  const totalPoints = historical.length + forecast.length;

  const histPoints = historical.map((h, idx) => {
    const x = padding + (idx / (totalPoints - 1)) * (width - 2 * padding);
    const y = height - padding - ((h.actual - minVal) / range) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');

  const lastHistIdx = historical.length - 1;
  const fcPoints = [
    `${padding + (lastHistIdx / (totalPoints - 1)) * (width - 2 * padding)},${height - padding - ((historical[lastHistIdx]?.actual - minVal) / range) * (height - 2 * padding)}`,
    ...forecast.map((f, idx) => {
      const realIdx = historical.length + idx;
      const x = padding + (realIdx / (totalPoints - 1)) * (width - 2 * padding);
      const y = height - padding - ((f.forecast - minVal) / range) * (height - 2 * padding);
      return `${x},${y}`;
    })
  ].join(' ');

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '220px' }}>
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#4b5563" strokeWidth="1" />
        
        {/* Historical line */}
        <polyline fill="none" stroke="#3b82f6" strokeWidth="3" points={histPoints} />

        {/* Forecast dashed line */}
        <polyline fill="none" stroke="#10b981" strokeWidth="3" strokeDasharray="5,5" points={fcPoints} />

        {/* Dots */}
        {forecast.map((f, idx) => {
          const realIdx = historical.length + idx;
          const x = padding + (realIdx / (totalPoints - 1)) * (width - 2 * padding);
          const y = height - padding - ((f.forecast - minVal) / range) * (height - 2 * padding);
          return (
            <circle key={idx} cx={x} cy={y} r="4" fill="#10b981" stroke="#fff" strokeWidth="1">
              <title>{`${f.date}: ${f.forecast} (Bounds: ${f.lower_bound} - ${f.upper_bound})`}</title>
            </circle>
          );
        })}
      </svg>
      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '6px', fontSize: '11px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#93c5fd' }}>
          <span style={{ width: '16px', height: '3px', background: '#3b82f6' }} /> Historical
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6ee7b7', fontWeight: 600 }}>
          <span style={{ width: '16px', height: '3px', borderTop: '2px dashed #10b981' }} /> Projected Forecast
        </span>
      </div>
    </div>
  );
}
