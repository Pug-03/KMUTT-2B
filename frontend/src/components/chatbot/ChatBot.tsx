'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

interface Message {
  role: 'user' | 'bot';
  text: string;
  timestamp: number;
}

const QUICK_ACTIONS = [
  { label: 'Grading Summary', message: 'Show today\'s grading summary' },
  { label: 'Find Markets', message: 'Where can I sell my fruit?' },
  { label: 'Pricing Info', message: 'What are the current prices?' },
  { label: 'Quality Tips', message: 'How to improve fruit quality?' },
];

export default function ChatBot() {
  const { t } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || isLoading) return;

    const userMsg: Message = { role: 'user', text: msg, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role === 'user' ? 'user' : 'model', text: m.text }));
      const res = await fetch(`${BACKEND_URL}/api/chatbot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'bot', text: data.reply || 'Sorry, something went wrong.', timestamp: Date.now() }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'bot', text: 'Could not reach the server.', timestamp: Date.now() }]);
    }
    setIsLoading(false);
  }, [input, isLoading, messages]);

  const formatBotText = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('\u2022') || line.startsWith('- ') || line.startsWith('* ')) {
        return <p key={i} className="pl-2 py-0.5">{line}</p>;
      }
      if (line.match(/^\*\*.+\*\*$/)) {
        return <p key={i} className="font-semibold mt-1">{line.replace(/\*\*/g, '')}</p>;
      }
      return <p key={i} className={line ? 'py-0.5' : 'h-2'}>{line}</p>;
    });
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95"
        style={{
          background: 'linear-gradient(135deg, #4285f4, #34a853)',
          boxShadow: '0 4px 24px rgba(66, 133, 244, 0.4)',
        }}
      >
        {isOpen ? (
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
          </svg>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div
          className="fixed bottom-36 right-4 lg:bottom-24 lg:right-6 z-50 w-[340px] sm:w-[400px] flex flex-col overflow-hidden animate-scale-in"
          style={{
            maxHeight: 'min(560px, calc(100vh - 200px))',
            background: 'var(--bg-card-solid)',
            border: '1px solid var(--border)',
            borderRadius: '24px',
            boxShadow: '0 12px 48px rgba(0, 0, 0, 0.25), 0 4px 16px rgba(0, 0, 0, 0.15)',
          }}
        >
          {/* Header */}
          <div
            className="px-5 py-4 flex items-center gap-3 shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgba(66, 133, 244, 0.08), rgba(52, 168, 83, 0.08))',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div
              className="w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #4285f4, #34a853)' }}
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] font-semibold text-primary">{t.chatbot.title}</h3>
              <p className="text-[11px] text-muted">Powered by Gemini AI</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-full flex items-center justify-center text-muted hover:text-primary transition-colors"
              style={{ background: 'var(--bg-input)' }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 scroll-area" style={{ minHeight: '240px' }}>
            {messages.length === 0 && (
              <div className="animate-fade-in">
                {/* Welcome */}
                <div className="text-center mb-5 mt-2">
                  <div
                    className="w-12 h-12 rounded-[14px] flex items-center justify-center mx-auto mb-3"
                    style={{ background: 'linear-gradient(135deg, rgba(66, 133, 244, 0.1), rgba(52, 168, 83, 0.1))' }}
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="var(--accent)" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-primary">How can I help?</p>
                  <p className="text-[12px] text-muted mt-1">Ask about grades, markets, farms, pricing</p>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => sendMessage(action.message)}
                      className="text-left rounded-[14px] p-3 text-[12px] font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
                      style={{
                        background: 'var(--bg-input)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                {msg.role === 'bot' && (
                  <div
                    className="w-6 h-6 rounded-[8px] flex items-center justify-center mr-2 mt-1 shrink-0"
                    style={{ background: 'linear-gradient(135deg, #4285f4, #34a853)' }}
                  >
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-[18px] px-4 py-2.5 text-[13px] leading-relaxed ${
                    msg.role === 'user' ? 'rounded-br-[6px]' : 'rounded-bl-[6px]'
                  }`}
                  style={msg.role === 'user'
                    ? { background: 'var(--accent)', color: 'white' }
                    : { background: 'var(--bg-input)', color: 'var(--text-primary)' }
                  }
                >
                  {msg.role === 'bot' ? formatBotText(msg.text) : msg.text}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start animate-fade-in">
                <div
                  className="w-6 h-6 rounded-[8px] flex items-center justify-center mr-2 mt-1 shrink-0"
                  style={{ background: 'linear-gradient(135deg, #4285f4, #34a853)' }}
                >
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <div className="rounded-[18px] rounded-bl-[6px] px-4 py-3" style={{ background: 'var(--bg-input)' }}>
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#4285f4', animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#34a853', animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#fbbc04', animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="flex gap-2 items-center rounded-[16px] px-3 py-1" style={{ background: 'var(--bg-input)' }}>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder={t.chatbot.placeholder}
                className="flex-1 bg-transparent border-none outline-none text-[14px] py-2"
                style={{ color: 'var(--text-primary)' }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={isLoading || !input.trim()}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-30 hover:scale-105 active:scale-95 shrink-0"
                style={{ background: 'linear-gradient(135deg, #4285f4, #34a853)' }}
              >
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
