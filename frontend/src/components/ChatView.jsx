import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Sparkles, Terminal, ChevronDown, ChevronRight, 
  Copy, Check, Clock, Bot, User, Trash2, Lightbulb 
} from 'lucide-react';
import { sendChatMessage } from '../services/api';
import ChartRenderer from './ChartRenderer';

export default function ChatView({ apiKey, provider }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I am your **Autonomous AI Data Analyst**. Upload one or more CSVs, or click **Samples** above to query sales, customers, and financial data in natural language.",
      thought_process: ["System initialized with in-memory DuckDB analytical engine.", "Ready to execute SQL, Pandas transforms, Anomaly Detection, and Forecasting."],
      insights: [
        "Ask questions across single or joined tables (e.g. sales joined with customers).",
        "Try asking: 'Which region generated the highest revenue?' or 'Detect anomalies in the dataset.'"
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [openThoughts, setOpenThoughts] = useState({ 0: false });
  const messagesEndRef = useRef(null);

  const sampleQuestions = [
    "Which region generated the highest revenue?",
    "Show monthly sales trends.",
    "Which products are underperforming?",
    "What are the top five customers?",
    "Generate SQL for this analysis.",
    "Detect anomalies in the dataset."
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const q = textToSend || input;
    if (!q.trim() || loading) return;

    const userMsg = { role: 'user', content: q };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await sendChatMessage(q, 'default_session', provider, apiKey);
      const assistantMsg = {
        role: 'assistant',
        content: res.response,
        thought_process: res.thought_process,
        sql_query: res.sql_query,
        chart_spec: res.chart_spec,
        data_table: res.data_table,
        insights: res.insights,
        execution_time_ms: res.execution_time_ms,
        suggested_questions: res.suggested_questions
      };
      setMessages(prev => [...prev, assistantMsg]);
      // Auto open thought for latest
      setOpenThoughts(prev => ({ ...prev, [messages.length + 1]: true }));
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${err.message}. Please make sure sample data or a CSV file is loaded.`
      }]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  const toggleThought = (idx) => {
    setOpenThoughts(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '16px' }}>
      
      {/* Suggestions bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '8px' }}>
        <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
          <Sparkles size={13} color="#60a5fa" /> Quick Prompts:
        </span>
        {sampleQuestions.map((q, i) => (
          <button
            key={i}
            onClick={() => handleSend(q)}
            style={{
              fontSize: '11px',
              padding: '4px 10px',
              background: '#1f2937',
              color: '#d1d5db',
              border: '1px solid #374151',
              borderRadius: '9999px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = '#374151'}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '8px' }}>
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                gap: '12px',
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                maxWidth: isUser ? '80%' : '90%'
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: isUser ? '#2563eb' : '#374151',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {isUser ? <User size={16} color="#fff" /> : <Bot size={16} color="#60a5fa" />}
              </div>

              <div style={{
                background: isUser ? '#1e3a8a' : '#111827',
                border: `1px solid ${isUser ? '#3b82f6' : '#374151'}`,
                borderRadius: '12px',
                padding: '16px',
                color: '#f3f4f6',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.2)'
              }}>
                {/* Assistant Thought Process Drawer */}
                {!isUser && msg.thought_process && msg.thought_process.length > 0 && (
                  <div style={{ marginBottom: '12px', borderBottom: '1px solid #1f2937', paddingBottom: '10px' }}>
                    <button
                      onClick={() => toggleThought(idx)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'transparent',
                        border: 'none',
                        color: '#9ca3af',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      {openThoughts[idx] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      <span>Analyst Thought Process ({msg.thought_process.length} steps)</span>
                      {msg.execution_time_ms && (
                        <span style={{ color: '#10b981', marginLeft: 'auto' }}>
                          <Clock size={11} style={{ display: 'inline', marginRight: '3px' }} />
                          {msg.execution_time_ms}ms
                        </span>
                      )}
                    </button>
                    {openThoughts[idx] && (
                      <div style={{ marginTop: '8px', padding: '8px 12px', background: '#1f2937', borderRadius: '6px', fontSize: '11px', color: '#93c5fd', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {msg.thought_process.map((t, i) => (
                          <div key={i} style={{ display: 'flex', gap: '6px' }}>
                            <span style={{ color: '#3b82f6' }}>•</span>
                            <span>{t}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Message text */}
                <div style={{ fontSize: '13px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {msg.content}
                </div>

                {/* SQL Query Block */}
                {!isUser && msg.sql_query && (
                  <div style={{ marginTop: '12px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #374151' }}>
                    <div style={{ background: '#1f2937', padding: '6px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Terminal size={12} color="#38bdf8" /> Generated DuckDB SQL
                      </span>
                      <button
                        onClick={() => copyToClipboard(msg.sql_query, idx)}
                        style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px' }}
                      >
                        {copiedIdx === idx ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                        {copiedIdx === idx ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <pre style={{ margin: 0, padding: '10px 12px', background: '#0b0f19', color: '#38bdf8', fontSize: '11px', overflowX: 'auto', fontFamily: 'JetBrains Mono, monospace' }}>
                      {msg.sql_query}
                    </pre>
                  </div>
                )}

                {/* Interactive Chart */}
                {!isUser && msg.chart_spec && (
                  <ChartRenderer spec={msg.chart_spec} />
                )}

                {/* Data Table Preview */}
                {!isUser && msg.data_table && msg.data_table.rows && msg.data_table.rows.length > 0 && (
                  <div style={{ marginTop: '14px', border: '1px solid #374151', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ background: '#1f2937', padding: '6px 12px', fontSize: '11px', fontWeight: 600, color: '#9ca3af' }}>
                      Result Preview ({msg.data_table.total_rows} rows)
                    </div>
                    <div style={{ overflowX: 'auto', maxHeight: '180px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                        <thead>
                          <tr style={{ background: '#111827', borderBottom: '1px solid #374151' }}>
                            {msg.data_table.columns.map((c, i) => (
                              <th key={i} style={{ padding: '6px 10px', textAlign: 'left', color: '#9ca3af', fontWeight: 600 }}>{c}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {msg.data_table.rows.slice(0, 5).map((row, rIdx) => (
                            <tr key={rIdx} style={{ borderBottom: '1px solid #1f2937' }}>
                              {msg.data_table.columns.map((col, cIdx) => (
                                <td key={cIdx} style={{ padding: '6px 10px', color: '#d1d5db' }}>
                                  {typeof row[col] === 'number' ? row[col].toLocaleString() : String(row[col] ?? '')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Business Insights Bullets */}
                {!isUser && msg.insights && msg.insights.length > 0 && (
                  <div style={{ marginTop: '14px', background: 'rgba(16, 185, 129, 0.08)', borderLeft: '3px solid #10b981', padding: '10px 12px', borderRadius: '0 8px 8px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#34d399', marginBottom: '6px' }}>
                      <Lightbulb size={13} /> Business Takeaways
                    </div>
                    {msg.insights.map((ins, i) => (
                      <div key={i} style={{ fontSize: '11px', color: '#e5e7eb', marginBottom: '4px', lineHeight: 1.5 }}>
                        • {ins}
                      </div>
                    ))}
                  </div>
                )}

                {/* Suggested Questions Pills for Ambiguous / Vague Queries */}
                {!isUser && msg.suggested_questions && msg.suggested_questions.length > 0 && (
                  <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {msg.suggested_questions.map((sq, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(sq)}
                        style={{
                          background: 'rgba(59, 130, 246, 0.12)',
                          border: '1px solid #3b82f6',
                          color: '#93c5fd',
                          borderRadius: '16px',
                          padding: '6px 12px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          textAlign: 'left'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.25)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.12)'; }}
                      >
                        💡 {sq}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div style={{ display: 'flex', gap: '12px', alignSelf: 'flex-start' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={16} color="#60a5fa" />
            </div>
            <div style={{ background: '#111827', border: '1px solid #374151', borderRadius: '12px', padding: '14px', color: '#9ca3af', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', animation: 'ping 1s infinite' }} />
              Reasoning across tables & executing DuckDB query...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input box */}
      <div style={{ marginTop: '12px', position: 'relative' }}>
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about your data (e.g., 'Which region generated the highest revenue?', 'Show monthly trends')..."
            style={{
              flex: 1,
              background: '#111827',
              border: '1px solid #374151',
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '13px',
              color: '#f3f4f6',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            style={{
              background: input.trim() && !loading ? '#2563eb' : '#374151',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '0 20px',
              cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 600,
              fontSize: '13px'
            }}
          >
            <Send size={16} />
            Ask
          </button>
        </form>
      </div>
    </div>
  );
}
