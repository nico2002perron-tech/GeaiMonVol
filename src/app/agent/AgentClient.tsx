'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import './agent.css';

// ── Types ──
type ToolCall = {
  tool: string;
  id: string;
  input: Record<string, any>;
  result?: Record<string, any>;
  status: 'running' | 'done';
};

type ChatMsg = {
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCall[];
};

// ── Tool display names & icons ──
const TOOL_META: Record<string, { label: string; icon: string }> = {
  chercher_deals: { label: 'Recherche des deals', icon: '🔍' },
  chercher_vols: { label: 'Recherche de vols', icon: '✈️' },
  historique_prix: { label: 'Analyse des prix', icon: '📊' },
  ajouter_watchlist: { label: 'Ajout à la watchlist', icon: '🔔' },
  info_destination: { label: 'Infos destination', icon: '🌍' },
};

const SUGGESTIONS = [
  "Ou aller pour pas cher en ce moment?",
  "Je veux du beach, budget 600$",
  "Meilleur deal cette semaine?",
  "C'est tu un bon prix 400$ pour Cancun?",
  "Surveille Paris pour moi si ça descend sous 500$",
  "Parle-moi de Barcelone",
];

export default function AgentClient() {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new content
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Auto-resize textarea
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 150) + 'px';
  }, []);

  // ── Send message & process SSE stream ──
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;
    const userMsg: ChatMsg = { role: 'user', content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsStreaming(true);

    if (inputRef.current) inputRef.current.style.height = 'auto';

    try {
      const res = await fetch('/api/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok || !res.body) throw new Error();

      // Add empty assistant message that we'll build up
      const assistantMsg: ChatMsg = { role: 'assistant', content: '', toolCalls: [] };
      setMessages(prev => [...prev, assistantMsg]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events from buffer
        const lines = buffer.split('\n');
        buffer = '';

        let eventType = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            try {
              const data = JSON.parse(dataStr);
              handleSSEEvent(eventType, data, setMessages);
            } catch {
              // incomplete JSON, put back in buffer
              buffer = line + '\n';
            }
          }
        }
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Oups, j'ai eu un petit bug! Reessaie dans quelques secondes 😅",
      }]);
    } finally {
      setIsStreaming(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [messages, isStreaming]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  }, [input, sendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }, [input, sendMessage]);

  const newChat = useCallback(() => {
    setMessages([]);
    setInput('');
    inputRef.current?.focus();
  }, []);

  return (
    <div className="agent-page">
      {/* ── Header ── */}
      <header className="agent-topbar">
        <Link href="/" className="agent-logo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
          <span className="agent-logo-text">Geai<strong>MonVol</strong></span>
        </Link>
        <div className="agent-topbar-center">
          <div className="agent-topbar-dot" />
          <span>GeaiAI Agent</span>
        </div>
        <div className="agent-topbar-right">
          {messages.length > 0 && (
            <button className="agent-new-chat" onClick={newChat} title="Nouvelle conversation">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14m-7-7h14"/></svg>
            </button>
          )}
          <Link href="/deals" className="agent-topbar-link">Deals</Link>
        </div>
      </header>

      {/* ── Chat body ── */}
      <main className="agent-body" ref={bodyRef}>
        {messages.length === 0 ? (
          <div className="agent-welcome">
            <div className="agent-welcome-icon">🐦</div>
            <h1 className="agent-welcome-title">Salut! Moi c&apos;est GeaiAI.</h1>
            <p className="agent-welcome-desc">
              Ton agent de voyage IA. Je peux chercher des vols, analyser les prix,
              surveiller des destinations et te donner des infos en temps reel.
              Dis-moi ce que tu veux!
            </p>
            {/* Tool badges */}
            <div className="agent-capabilities">
              {Object.entries(TOOL_META).map(([key, { label, icon }]) => (
                <span key={key} className="agent-capability">
                  {icon} {label}
                </span>
              ))}
            </div>
            <div className="agent-suggestions">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} className="agent-suggestion" onClick={() => sendMessage(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="agent-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`agent-msg ${msg.role === 'assistant' ? 'agent-msg-ai' : 'agent-msg-user'}`}>
                {msg.role === 'assistant' && (
                  <div className="agent-msg-avatar">🐦</div>
                )}
                <div className="agent-msg-content">
                  {/* Tool calls */}
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div className="agent-tools">
                      {msg.toolCalls.map(tc => (
                        <ToolCallCard key={tc.id} toolCall={tc} />
                      ))}
                    </div>
                  )}
                  {/* Text content */}
                  {msg.content && (
                    <div className={`agent-bubble ${msg.role === 'assistant' ? 'agent-bubble-ai' : 'agent-bubble-user'}`}>
                      {msg.content}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isStreaming && messages[messages.length - 1]?.content === '' && !messages[messages.length - 1]?.toolCalls?.length && (
              <div className="agent-msg agent-msg-ai">
                <div className="agent-msg-avatar">🐦</div>
                <div className="agent-bubble agent-bubble-ai agent-typing">
                  <span className="agent-dot" />
                  <span className="agent-dot" />
                  <span className="agent-dot" />
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Input bar ── */}
      <div className="agent-input-area">
        <form className="agent-input-bar" onSubmit={handleSubmit}>
          <textarea
            ref={inputRef}
            className="agent-input"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ecris ton message..."
            rows={1}
            disabled={isStreaming}
          />
          <button
            type="submit"
            className="agent-send"
            disabled={!input.trim() || isStreaming}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
          </button>
        </form>
        <p className="agent-disclaimer">
          GeaiAI Agent — Propulse par Claude (Anthropic). Verifie les prix avant de reserver.
        </p>
      </div>
    </div>
  );
}

// ── SSE Event Handler ──
function handleSSEEvent(
  event: string,
  data: any,
  setMessages: React.Dispatch<React.SetStateAction<ChatMsg[]>>,
) {
  switch (event) {
    case 'text':
      // Append text to the last assistant message
      setMessages(prev => {
        const msgs = [...prev];
        const last = msgs[msgs.length - 1];
        if (last?.role === 'assistant') {
          msgs[msgs.length - 1] = { ...last, content: last.content + data.content };
        }
        return msgs;
      });
      break;

    case 'tool_call':
      // Add a tool call to the last assistant message
      setMessages(prev => {
        const msgs = [...prev];
        const last = msgs[msgs.length - 1];
        if (last?.role === 'assistant') {
          const toolCalls = [...(last.toolCalls || []), {
            tool: data.tool,
            id: data.id,
            input: data.input,
            status: 'running' as const,
          }];
          msgs[msgs.length - 1] = { ...last, toolCalls };
        }
        return msgs;
      });
      break;

    case 'tool_result':
      // Update the tool call with its result
      setMessages(prev => {
        const msgs = [...prev];
        const last = msgs[msgs.length - 1];
        if (last?.role === 'assistant' && last.toolCalls) {
          const toolCalls = last.toolCalls.map(tc =>
            tc.id === data.id
              ? { ...tc, result: data.result, status: 'done' as const }
              : tc
          );
          msgs[msgs.length - 1] = { ...last, toolCalls };
        }
        return msgs;
      });
      break;

    case 'error':
      setMessages(prev => {
        const msgs = [...prev];
        const last = msgs[msgs.length - 1];
        if (last?.role === 'assistant') {
          msgs[msgs.length - 1] = {
            ...last,
            content: last.content + `\n\nOups, erreur: ${data.message}`,
          };
        }
        return msgs;
      });
      break;
  }
}

// ── Tool Call Card Component ──
function ToolCallCard({ toolCall }: { toolCall: ToolCall }) {
  const meta = TOOL_META[toolCall.tool] || { label: toolCall.tool, icon: '🔧' };
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`agent-tool-card ${toolCall.status === 'running' ? 'agent-tool-running' : 'agent-tool-done'}`}>
      <button className="agent-tool-header" onClick={() => setExpanded(!expanded)}>
        <span className="agent-tool-icon">{meta.icon}</span>
        <span className="agent-tool-label">{meta.label}</span>
        {toolCall.status === 'running' ? (
          <span className="agent-tool-spinner" />
        ) : (
          <svg className={`agent-tool-chevron ${expanded ? 'agent-tool-chevron-open' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
        )}
      </button>
      {expanded && toolCall.result && (
        <div className="agent-tool-details">
          <ToolResultDisplay tool={toolCall.tool} result={toolCall.result} />
        </div>
      )}
    </div>
  );
}

// ── Tool Result Display ──
function ToolResultDisplay({ tool, result }: { tool: string; result: Record<string, any> }) {
  if (result.error) {
    return <p className="agent-tool-error">{result.error}</p>;
  }

  switch (tool) {
    case 'chercher_deals':
      return (
        <div className="agent-tool-deals">
          <p className="agent-tool-count">{result.nombre_deals} deal(s) trouves</p>
          {result.deals?.slice(0, 5).map((d: any, i: number) => (
            <div key={i} className="agent-tool-deal-row">
              <span className="agent-tool-deal-dest">{d.destination}</span>
              <span className="agent-tool-deal-price">{d.prix}</span>
              <span className="agent-tool-deal-info">{d.escales}</span>
            </div>
          ))}
          {result.nombre_deals > 5 && (
            <p className="agent-tool-more">+{result.nombre_deals - 5} autres deals</p>
          )}
        </div>
      );

    case 'chercher_vols':
      return (
        <div className="agent-tool-deals">
          <p className="agent-tool-count">
            {result.destination} — min {result.prix_minimum}, moy {result.prix_moyen}
          </p>
          {result.vols?.slice(0, 4).map((v: any, i: number) => (
            <div key={i} className="agent-tool-deal-row">
              <span className="agent-tool-deal-dest">{v.compagnie}</span>
              <span className="agent-tool-deal-price">{v.prix}</span>
              <span className="agent-tool-deal-info">{v.depart}</span>
            </div>
          ))}
        </div>
      );

    case 'historique_prix':
      return (
        <div className="agent-tool-history">
          <div className="agent-tool-history-grid">
            <div><strong>Min:</strong> {result.prix_minimum}</div>
            <div><strong>Moy:</strong> {result.prix_moyen}</div>
            <div><strong>Max:</strong> {result.prix_maximum}</div>
            <div><strong>Tendance:</strong> {result.tendance}</div>
          </div>
          <p className={`agent-tool-verdict ${result.verdict?.includes('BON') ? 'agent-verdict-good' : 'agent-verdict-high'}`}>
            {result.verdict}
          </p>
        </div>
      );

    case 'ajouter_watchlist':
      return (
        <p className={result.success ? 'agent-tool-success' : 'agent-tool-error'}>
          {result.message}
        </p>
      );

    case 'info_destination':
      return (
        <div className="agent-tool-info">
          {result.meteo && <div>🌤 {result.meteo}</div>}
          {result.budget_quotidien && <div>💰 ~{result.budget_quotidien}/jour</div>}
          {result.quartier && <div>📍 Quartier: {result.quartier}</div>}
          {result.conseil && <div>💡 {result.conseil}</div>}
        </div>
      );

    default:
      return <pre className="agent-tool-raw">{JSON.stringify(result, null, 2)}</pre>;
  }
}
