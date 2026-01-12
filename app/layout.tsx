import './globals.css';
import './design-system.css';
import './mobile-responsive.css';
import type { Metadata } from 'next';
import { AuthProvider } from '@/components/AuthProvider';
import { AppShell } from '@/components/AppShell';
import { ToastProvider } from '@/components/Toast';

export const metadata: Metadata = {
  title: 'Raven',
  description: 'Technician search and compliance platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>
          <ToastProvider>
            <AppShell>
              {children}
            </AppShell>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
