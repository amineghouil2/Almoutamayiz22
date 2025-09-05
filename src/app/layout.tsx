
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Tajawal } from 'next/font/google';
import ClientBody from './client-body';
import { PersonalizationProvider } from '@/hooks/use-user-personalization';

// استيراد الخطوط الجديدة
const tajawal = Tajawal({
  subsets: ['arabic'],
  weight: ['400', '700'],
  variable: '--font-tajawal',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'المتميز',
  description: 'تطبيق تعليمي شامل لمساعدتك على التفوق.',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`dark ${tajawal.variable}`}>
      <ClientBody>
        <PersonalizationProvider>
          {children}
          <Toaster />
        </PersonalizationProvider>
      </ClientBody>
    </html>
  );
}
