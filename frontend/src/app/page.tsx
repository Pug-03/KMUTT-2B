'use client';

import { useState } from 'react';
import TopNav from '@/components/layout/TopNav';
import ScannerHub from '@/components/scanner/ScannerHub';
import MachineControls from '@/components/controls/MachineControls';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import ChatBot from '@/components/chatbot/ChatBot';
import NotificationToast from '@/components/notifications/NotificationToast';
import { useApp } from '@/contexts/AppContext';

type AppTab = 'camera' | 'dashboard';

export default function Home() {
  const [activeTab, setActiveTab] = useState<AppTab>('camera');
  const { t } = useApp();

  return (
    <div
      className="flex flex-col overflow-hidden bg-base"
      style={{ height: '100dvh', minHeight: '-webkit-fill-available' }}
    >
      <TopNav />

      {/* Desktop: Apple-style Segmented Control (hidden on mobile) */}
      <div className="hidden lg:flex shrink-0 px-6 py-4 justify-center">
        <div className="inline-flex p-1.5 rounded-[14px] gap-1.5 border border-[var(--border)] shadow-sm" style={{ background: 'var(--bg-input)' }}>
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex items-center gap-2 px-7 py-3 text-[14px] font-semibold rounded-[11px] transition-all duration-300 active:scale-95 ${
              activeTab === 'camera'
                ? 'bg-[var(--accent)] text-white shadow-[0_4px_16px_rgba(10,132,255,0.35)] scale-[1.02]'
                : 'text-secondary hover:text-primary hover:bg-[var(--bg-card-hover)]'
            }`}
          >
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={activeTab === 'camera' ? 2.5 : 2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {t.scanner.title}
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-7 py-3 text-[14px] font-semibold rounded-[11px] transition-all duration-300 active:scale-95 ${
              activeTab === 'dashboard'
                ? 'bg-[var(--accent)] text-white shadow-[0_4px_16px_rgba(10,132,255,0.35)] scale-[1.02]'
                : 'text-secondary hover:text-primary hover:bg-[var(--bg-card-hover)]'
            }`}
          >
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={activeTab === 'dashboard' ? 2.5 : 2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {t.analytics.title}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden relative">
        <div
          className={`absolute inset-0 transition-all duration-400 ${
            activeTab === 'camera'
              ? 'opacity-100 translate-x-0 pointer-events-auto'
              : 'opacity-0 -translate-x-4 pointer-events-none'
          }`}
          style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}
        >
          <div className="flex h-full overflow-hidden">
            <section className="flex-1 scroll-area min-w-0">
              <ScannerHub />
            </section>
            <aside className="hidden lg:block w-80 xl:w-96 border-l border-border scroll-area-hover shrink-0">
              <MachineControls />
            </aside>
          </div>
        </div>

        <div
          className={`absolute inset-0 transition-all duration-400 ${
            activeTab === 'dashboard'
              ? 'opacity-100 translate-x-0 pointer-events-auto'
              : 'opacity-0 translate-x-4 pointer-events-none'
          }`}
          style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}
        >
          <main className="h-full scroll-area-hover">
            <AnalyticsDashboard />
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation — Apple-style tab bar */}
      <nav className="lg:hidden glass-nav safe-area-bottom shrink-0 relative z-30" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex">
          {([
            {
              id: 'camera' as AppTab,
              label: t.scanner.title,
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={activeTab === 'camera' ? 2.5 : 1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              ),
            },
            {
              id: 'dashboard' as AppTab,
              label: t.analytics.title,
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={activeTab === 'dashboard' ? 2.5 : 1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              ),
            },
          ]).map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 flex flex-col items-center justify-center gap-1 relative transition-all duration-300 active:scale-95"
                style={{ WebkitTapHighlightColor: 'transparent', minHeight: '56px', paddingTop: '8px', paddingBottom: '6px' }}
              >
                {/* Active indicator bar */}
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 h-[3px] rounded-full transition-all duration-300"
                  style={{
                    width: isActive ? '40px' : '0px',
                    background: isActive ? 'var(--accent)' : 'transparent',
                    boxShadow: isActive ? '0 2px 8px rgba(10, 132, 255, 0.5)' : 'none',
                  }}
                />
                {/* Icon pill — prominent filled background when active */}
                <div
                  className="transition-all duration-300 flex items-center justify-center rounded-[10px]"
                  style={{
                    color: isActive ? '#ffffff' : 'var(--text-muted)',
                    background: isActive ? 'var(--accent)' : 'transparent',
                    transform: isActive ? 'scale(1.05)' : 'scale(1)',
                    padding: isActive ? '6px 14px' : '6px',
                    boxShadow: isActive ? '0 4px 12px rgba(10, 132, 255, 0.35)' : 'none',
                  }}
                >
                  {tab.icon}
                </div>
                {/* Label */}
                <span
                  className="text-[10px] font-semibold transition-all duration-300"
                  style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)' }}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Global overlays */}
      <NotificationToast />
      <ChatBot />
    </div>
  );
}
