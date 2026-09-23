import React, { useState } from 'react';
import { X, Key, Shield, Check } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, apiKey, setApiKey, provider, setProvider }) {
  if (!isOpen) return null;

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
        maxWidth: '460px',
        padding: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Key size={18} color="#60a5fa" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f3f4f6' }}>AI Provider Configuration</h3>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #059669', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '11px', color: '#a7f3d0' }}>
          <strong>Zero-Key Ready:</strong> By default, DataMind AI operates seamlessly with its deterministic smart engine. Providing an API key below enables live generative multi-LLM reasoning.
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>LLM Engine:</label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            style={{ width: '100%', background: '#1f2937', color: '#f3f4f6', border: '1px solid #374151', borderRadius: '6px', padding: '8px 12px', fontSize: '12px' }}
          >
            <option value="auto">Auto / Smart Deterministic Analyst (Default)</option>
            <option value="gemini">Google Gemini 1.5</option>
            <option value="openai">OpenAI GPT-4o-mini</option>
            <option value="groq">Groq (Llama 3.3 70B)</option>
            <option value="ollama">Local Ollama (Llama 3)</option>
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>Optional API Key:</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter API Key (Optional)..."
            style={{ width: '100%', background: '#1f2937', color: '#f3f4f6', border: '1px solid #374151', borderRadius: '6px', padding: '8px 12px', fontSize: '12px' }}
          />
        </div>

        <button
          onClick={onClose}
          style={{ width: '100%', background: '#2563eb', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
        >
          Save & Continue
        </button>
      </div>
    </div>
  );
}
