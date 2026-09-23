import React from 'react';
import { X, FileDown, ExternalLink, Printer } from 'lucide-react';
import { getReportDownloadUrl } from '../services/api';

export default function ExportModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const reportUrl = getReportDownloadUrl('default_session');

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.75)',
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
        maxWidth: '850px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #374151', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f3f4f6' }}>Executive BI Summary Report</h3>
            <p style={{ fontSize: '11px', color: '#9ca3af' }}>Audit-ready report of all insights, data health scores, and SQL transcripts</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <a
              href={reportUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: '#2563eb',
                color: 'white',
                borderRadius: '6px',
                fontSize: '12px',
                textDecoration: 'none',
                fontWeight: 600
              }}
            >
              <ExternalLink size={14} /> Open in New Tab / Print PDF
            </a>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Live Preview Iframe */}
        <div style={{ flex: 1, minHeight: '500px', background: '#fff' }}>
          <iframe
            src={reportUrl}
            title="Report Preview"
            style={{ width: '100%', height: '100%', minHeight: '500px', border: 'none' }}
          />
        </div>
      </div>
    </div>
  );
}
