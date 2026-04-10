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
    <div className="flex flex-col h-screen overflow-hidden bg-base">
      <TopNav />

      {/* Desktop: Apple-style Segmented Control (hidden on mobile) */}
      <div className="hidden lg:flex shrink-0 px-6 py-3 justify-center">
        <div className="inline-flex p-1 rounded-[12px] gap-1" style={{ background: 'var(--bg-input)' }}>
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex items-center gap-2 px-6 py-2.5 text-[13px] font-semibold rounded-[10px] transition-all duration-300 ${
              activeTab === 'camera'
                ? 'bg-[var(--bg-card-solid)] text-primary shadow-md'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {t.scanner.title}
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-6 py-2.5 text-[13px] font-semibold rounded-[10px] transition-all duration-300 ${
              activeTab === 'dashboard'
                ? 'bg-[var(--bg-card-solid)] text-primary shadow-md'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
      <nav className="lg:hidden glass-nav safe-area-bottom" style={{ borderTop: '1px solid var(--border)' }}>
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
                className="flex-1 flex flex-col items-center gap-0.5 pt-2 pb-1.5 relative transition-all duration-300"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                {/* Active indicator bar */}
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 h-[3px] rounded-full transition-all duration-300"
                  style={{
                    width: isActive ? '32px' : '0px',
                    background: isActive ? 'var(--accent)' : 'transparent',
                  }}
                />
                {/* Icon */}
                <div
                  className="transition-all duration-300"
                  style={{
                    color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                    transform: isActive ? 'scale(1.1)' : 'scale(1)',
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
