import React from 'react';
import { 
  Sparkles, Database, LayoutDashboard, AlertTriangle, 
  TrendingUp, ShieldCheck, Terminal, CheckCircle2, 
  FileDown, Settings, UploadCloud 
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  tableCount, 
  onOpenUpload, 
  onLoadSamples, 
  onOpenExport, 
  onOpenSettings,
  isLoadingSamples 
}) {
  const tabs = [
    { id: 'chat', label: 'AI Analyst', icon: Sparkles },
    { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
    { id: 'anomalies', label: 'Anomaly Hunter', icon: AlertTriangle },
    { id: 'forecast', label: 'Forecast Studio', icon: TrendingUp },
    { id: 'quality', label: 'Data Quality', icon: ShieldCheck },
    { id: 'sql', label: 'SQL Lab', icon: Terminal },
    { id: 'observability', label: 'Benchmarks & Ops', icon: CheckCircle2 }
  ];

  return (
    <header style={{
      background: 'rgba(17, 24, 39, 0.95)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid #374151',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '0 24px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px', gap: '16px' }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 12px rgba(59, 130, 246, 0.5)'
          }}>
            <Sparkles size={20} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>DataMind AI</h1>
              <span style={{ fontSize: '10px', background: '#1e3a8a', color: '#93c5fd', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                ENTERPRISE
              </span>
            </div>
            <p style={{ fontSize: '11px', color: '#9ca3af' }}>Autonomous Data Analyst • Digital Back Office Ltd.</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '4px', overflowX: 'auto' }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 500,
                  background: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                  color: isActive ? '#60a5fa' : '#9ca3af',
                  border: isActive ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={onLoadSamples}
            disabled={isLoadingSamples}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 600,
              background: '#065f46',
              color: '#a7f3d0',
              border: '1px solid #059669',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            <Database size={14} />
            {isLoadingSamples ? 'Loading...' : `Samples (${tableCount})`}
          </button>

          <button
            onClick={onOpenUpload}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 600,
              background: '#1e3a8a',
              color: '#bfdbfe',
              border: '1px solid #2563eb',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            <UploadCloud size={14} />
            Upload CSV
          </button>

          <button
            onClick={onOpenExport}
            title="Export PDF / HTML Executive Report"
            style={{
              padding: '7px',
              background: '#374151',
              color: '#e5e7eb',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            <FileDown size={16} />
          </button>

          <button
            onClick={onOpenSettings}
            title="Configure LLM API Keys"
            style={{
              padding: '7px',
              background: '#374151',
              color: '#e5e7eb',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            <Settings size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
