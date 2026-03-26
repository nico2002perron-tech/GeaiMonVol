'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import type { DealItem } from '@/lib/types/deals';
import './agent.css';

type ChatMsg = { role: 'user' | 'assistant'; content: string };

const SUGGESTIONS = [
  "Ou aller pour pas cher en ce moment?",
  "Je veux du beach, budget 600$",
  "Meilleur deal cette semaine?",
  "Weekend en Europe, c'est possible?",
  "Planifie-moi 5 jours a Barcelone",
  "Quoi faire a Cancun?",
];

interface AgentClientProps {
  deals: DealItem[];
}

export default function AgentClient({ deals }: AgentClientProps) {
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

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;
    const userMsg: ChatMsg = { role: 'user', content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsStreaming(true);

    // Reset textarea height
    if (inputRef.current) inputRef.current.style.height = 'auto';

    try {
      const res = await fetch('/api/geai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          deals: deals.slice(0, 25).map(d => ({
            city: d.city, country: d.country, price: Math.round(d.price),
            discount: d.discount, dealLevel: d.dealLevel,
          })),
        }),
      });

      if (!res.ok || !res.body) throw new Error();

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let aiText = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        aiText += decoder.decode(value, { stream: true });
        const current = aiText;
        setMessages(prev => {
          const msgs = [...prev];
          msgs[msgs.length - 1] = { role: 'assistant', content: current };
          return msgs;
        });
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
  }, [messages, isStreaming, deals]);

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
          <span>GeaiAI</span>
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
              Ton agent de voyage IA. Je connais tous les deals de vols en direct depuis Montreal.
              Dis-moi ou tu reves d&apos;aller!
            </p>
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
                <div className={`agent-bubble ${msg.role === 'assistant' ? 'agent-bubble-ai' : 'agent-bubble-user'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
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
          GeaiAI peut faire des erreurs. Verifie les prix avant de reserver.
        </p>
      </div>
    </div>
  );
}
