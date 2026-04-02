import type { Metadata } from 'next';
import { AppProvider } from '@/contexts/AppContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Fruit Grading System',
  description: 'Real-time fruit quality classification with AI',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
