
'use client';

import { BookOpen, Users, Home, Gamepad2, GraduationCap, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/lessons', icon: BookOpen, label: 'الدروس' },
  { href: '/teachers', icon: GraduationCap, label: 'الأساتذة' },
  { href: '/home', icon: Home, label: 'الرئيسية' },
  { href: '/games', icon: Gamepad2, label: 'الألعاب' },
  { href: '/community', icon: Users, label: 'المجتمع' },
];

const INITIAL_VISIBLE_DURATION = 15000;
const AUTO_COLLAPSE_DURATION = 5000;

export default function BottomNav() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const collapseTimer = useRef<NodeJS.Timeout | null>(null);

  const collapseNav = useCallback(() => {
    setIsCollapsed(true);
  }, []);

  const expandNav = useCallback(() => {
    setIsCollapsed(false);
    if (collapseTimer.current) {
      clearTimeout(collapseTimer.current);
    }
    collapseTimer.current = setTimeout(collapseNav, AUTO_COLLAPSE_DURATION);
  }, [collapseNav]);


  useEffect(() => {
    expandNav();

    const initialTimer = setTimeout(() => {
      collapseNav();
    }, INITIAL_VISIBLE_DURATION);
    
    return () => {
      if (initialTimer) clearTimeout(initialTimer);
      if (collapseTimer.current) clearTimeout(collapseTimer.current);
    };
  }, [expandNav, collapseNav]);


  useEffect(() => {
    collapseNav();
  }, [pathname, collapseNav]);

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 transition-transform duration-500 ease-in-out',
        isCollapsed ? 'translate-y-[calc(100%-2.0rem)]' : 'translate-y-0'
      )}
    >
      {isCollapsed && (
        <div className="flex justify-center">
          <button
            onClick={expandNav}
            className="w-16 h-8 bg-primary/20 backdrop-blur-lg border-t border-x border-primary/20 rounded-t-lg flex items-center justify-center text-primary/80"
            aria-label={'إظهار شريط التنقل'}
          >
            <ChevronUp className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className="bg-black/80 backdrop-blur-lg h-16 flex justify-around items-center border-t border-white/10 rounded-t-xl">
        {navItems.map((item) => {
          const isActive = item.href === '/home' ? pathname === item.href : pathname.startsWith(item.href) && item.href !== '/home';
          return (
            <Link href={item.href} key={item.href} className="flex-1 h-full flex items-center justify-center">
                <div
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 transition-colors duration-200',
                    isActive ? 'text-primary' : 'text-gray-400 hover:text-white'
                  )}
                >
                  <item.icon className="h-6 w-6" />
                  <span className="text-xs font-medium">{item.label}</span>
                </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
