import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ChatView from './components/ChatView';
import DashboardView from './components/DashboardView';
import AnomalyView from './components/AnomalyView';
import ForecastView from './components/ForecastView';
import DataQualityView from './components/DataQualityView';
import SqlPlaygroundView from './components/SqlPlaygroundView';
import ObservabilityView from './components/ObservabilityView';
import FileUploadModal from './components/FileUploadModal';
import ExportModal from './components/ExportModal';
import SettingsModal from './components/SettingsModal';
import { fetchTables, loadSampleDatasets } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [tableCount, setTableCount] = useState(0);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState('auto');
  const [loadingSamples, setLoadingSamples] = useState(false);

  const refreshTables = async () => {
    try {
      const res = await fetchTables();
      setTableCount((res.tables || []).length);
    } catch (e) {
      console.error("Failed to fetch tables", e);
    }
  };

  const handleLoadSamples = async () => {
    setLoadingSamples(true);
    try {
      await loadSampleDatasets();
      await refreshTables();
    } catch (e) {
      alert("Error loading sample data: " + e.message);
    } finally {
      setLoadingSamples(false);
    }
  };

  useEffect(() => {
    // Auto-load sample datasets on startup
    handleLoadSamples();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tableCount={tableCount}
        onOpenUpload={() => setUploadOpen(true)}
        onLoadSamples={handleLoadSamples}
        onOpenExport={() => setExportOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        isLoadingSamples={loadingSamples}
      />

      <main style={{ flex: 1 }}>
        {activeTab === 'chat' && <ChatView apiKey={apiKey} provider={provider} />}
        {activeTab === 'dashboard' && <DashboardView onSelectTab={setActiveTab} />}
        {activeTab === 'anomalies' && <AnomalyView />}
        {activeTab === 'forecast' && <ForecastView />}
        {activeTab === 'quality' && <DataQualityView />}
        {activeTab === 'sql' && <SqlPlaygroundView />}
        {activeTab === 'observability' && <ObservabilityView />}
      </main>

      {/* Modals */}
      <FileUploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onRefreshTables={refreshTables}
      />
      <ExportModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
      />
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        apiKey={apiKey}
        setApiKey={setApiKey}
        provider={provider}
        setProvider={setProvider}
      />
    </div>
  );
}
