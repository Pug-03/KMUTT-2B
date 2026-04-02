'use client';

import TopNav from '@/components/layout/TopNav';
import AnalyticsSidebar from '@/components/analytics/AnalyticsSidebar';
import ScannerHub from '@/components/scanner/ScannerHub';
import MachineControls from '@/components/controls/MachineControls';

export default function Home() {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <TopNav />
      <main className="flex flex-1 overflow-hidden flex-col lg:flex-row">
        {/* Left Sidebar - Analytics */}
        <aside className="w-full lg:w-80 xl:w-96 border-b lg:border-b-0 lg:border-r border-gray-800 overflow-y-auto shrink-0">
          <AnalyticsSidebar />
        </aside>

        {/* Center - Scanner Hub */}
        <section className="flex-1 overflow-y-auto min-w-0">
          <ScannerHub />
        </section>

        {/* Right Sidebar - Machine Controls */}
        <aside className="w-full lg:w-80 xl:w-96 border-t lg:border-t-0 lg:border-l border-gray-800 overflow-y-auto shrink-0">
          <MachineControls />
        </aside>
      </main>
    </div>
  );
}
