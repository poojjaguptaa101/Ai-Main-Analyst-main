import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle, X, AlertCircle } from 'lucide-react';
import { uploadCsvFiles, loadSampleDatasets } from '../services/api';

export default function FileUploadModal({ isOpen, onClose, onRefreshTables }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFiles(Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.csv')));
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files).filter(f => f.name.endsWith('.csv')));
    }
  };

  const handleUpload = async () => {
    if (!selectedFiles.length) return;
    setUploading(true);
    setErrorMsg('');
    try {
      const res = await uploadCsvFiles(selectedFiles);
      setStatusMsg(`Successfully registered ${res.total_loaded} table(s) in DuckDB!`);
      setSelectedFiles([]);
      await onRefreshTables();
      setTimeout(() => {
        onClose();
        setStatusMsg('');
      }, 1200);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleLoadSamples = async () => {
    setUploading(true);
    setErrorMsg('');
    try {
      await loadSampleDatasets();
      setStatusMsg('Loaded enterprise sales, customers, products, and anomaly datasets!');
      await onRefreshTables();
      setTimeout(() => {
        onClose();
        setStatusMsg('');
      }, 1200);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px'
    }}>
      <div style={{
        background: '#111827',
        border: '1px solid #374151',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '540px',
        padding: '24px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f3f4f6' }}>Upload CSV Datasets</h2>
            <p style={{ fontSize: '12px', color: '#9ca3af' }}>Multi-file ingestion with automatic DuckDB schema indexing</p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Drop zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragActive ? '#3b82f6' : '#374151'}`,
            borderRadius: '10px',
            padding: '32px 20px',
            textAlign: 'center',
            background: dragActive ? 'rgba(59, 130, 246, 0.05)' : '#1f2937',
            marginBottom: '16px',
            cursor: 'pointer'
          }}
          onClick={() => document.getElementById('file-input').click()}
        >
          <UploadCloud size={40} color={dragActive ? '#3b82f6' : '#9ca3af'} style={{ margin: '0 auto 12px' }} />
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#e5e7eb', marginBottom: '4px' }}>
            Drag and drop CSV files here
          </p>
          <p style={{ fontSize: '12px', color: '#9ca3af' }}>or click to browse from your device</p>
          <input
            id="file-input"
            type="file"
            multiple
            accept=".csv"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>

        {/* Selected files list */}
        {selectedFiles.length > 0 && (
          <div style={{ marginBottom: '16px', maxHeight: '120px', overflowY: 'auto' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#d1d5db', marginBottom: '6px' }}>Selected files:</p>
            {selectedFiles.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#9ca3af', padding: '4px 0' }}>
                <FileText size={14} color="#60a5fa" />
                <span>{f.name}</span>
                <span style={{ fontSize: '10px', color: '#6b7280' }}>({(f.size / 1024).toFixed(1)} KB)</span>
              </div>
            ))}
          </div>
        )}

        {/* Status messages */}
        {statusMsg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: '#064e3b', color: '#a7f3d0', borderRadius: '6px', fontSize: '12px', marginBottom: '16px' }}>
            <CheckCircle size={16} />
            <span>{statusMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: '#7f1d1d', color: '#fecaca', borderRadius: '6px', fontSize: '12px', marginBottom: '16px' }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={handleLoadSamples}
            disabled={uploading}
            style={{
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 600,
              background: '#374151',
              color: '#d1d5db',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Load 5 Sample Datasets
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading || selectedFiles.length === 0}
            style={{
              padding: '8px 18px',
              fontSize: '12px',
              fontWeight: 600,
              background: selectedFiles.length > 0 ? '#2563eb' : '#1e3a8a',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: selectedFiles.length > 0 ? 'pointer' : 'not-allowed'
            }}
          >
            {uploading ? 'Processing...' : 'Upload & Index'}
          </button>
        </div>
      </div>
    </div>
  );
}
