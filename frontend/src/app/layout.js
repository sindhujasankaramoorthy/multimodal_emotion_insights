import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'Clinical Mood Monitor',
  description: 'AI-Powered Mood Tracking for Patients',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          {/* Main Content Area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <main style={{ padding: '2rem 4rem', flex: 1, overflowY: 'auto' }}>
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
