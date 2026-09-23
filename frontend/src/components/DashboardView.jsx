import React, { useEffect, useState } from 'react';
import { LayoutDashboard, TrendingUp, DollarSign, Database, Table, RefreshCw } from 'lucide-react';
import { fetchDashboard } from '../services/api';
import ChartRenderer from './ChartRenderer';

export default function DashboardView({ onSelectTab }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchDashboard();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#9ca3af' }}>
        <RefreshCw size={24} className="animate-spin" />
        <span style={{ marginLeft: '10px' }}>Synthesizing Executive Dashboard...</span>
      </div>
    );
  }

  if (!data || !data.has_data) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
        <LayoutDashboard size={48} color="#4b5563" style={{ margin: '0 auto 16px' }} />
        <h3 style={{ fontSize: '18px', color: '#e5e7eb', marginBottom: '8px' }}>No Data Loaded Yet</h3>
        <p style={{ fontSize: '13px', maxWidth: '400px', margin: '0 auto 20px' }}>
          Click "Samples" in the top bar or upload your CSV files to automatically generate KPIs and visual distributions.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#f3f4f6' }}>Executive BI Dashboard</h2>
          <p style={{ fontSize: '12px', color: '#9ca3af' }}>
            Instant operational metrics & distribution across table: <code style={{ color: '#60a5fa' }}>{data.primary_table}</code>
          </p>
        </div>
        <button
          onClick={loadData}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#1f2937', color: '#d1d5db', border: '1px solid #374151', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {data.kpis.map((kpi, idx) => (
          <div key={idx} style={{ background: '#111827', border: '1px solid #374151', borderRadius: '10px', padding: '18px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 600 }}>{kpi.title}</span>
              <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={14} color="#60a5fa" />
              </div>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#f9fafb', marginBottom: '4px' }}>
              {kpi.value}
            </div>
            <div style={{ fontSize: '11px', color: '#6b7280' }}>
              {kpi.subtitle}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {data.charts.map((chart, idx) => (
          <div key={idx} style={{ background: '#111827', border: '1px solid #374151', borderRadius: '10px', padding: '20px' }}>
            <ChartRenderer spec={chart} />
          </div>
        ))}
      </div>
    </div>
  );
}
