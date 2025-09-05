
'use client';

import BottomNav from '@/components/bottom-nav';
import AppHeader from '@/components/app-header';
import PageHeader from '@/components/page-header';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHomePage = pathname === '/home';
  const isChatPage = pathname.startsWith('/community/');

  return (
    <div className="flex flex-col min-h-screen">
      {!isChatPage && <AppHeader />}
      {!isChatPage && <PageHeader />}
      <main
        className={cn(
          'flex-1 w-full',
          isChatPage ? 'h-[100vh]' : 'max-w-4xl mx-auto px-4 space-y-8',
          isHomePage ? 'pt-4 pb-8' : 'py-8'
        )}
      >
        {children}
      </main>
      {!isChatPage && <div className="pb-20" />}
      {!isChatPage && <BottomNav />}
    </div>
  );
}
