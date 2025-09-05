
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Home } from 'lucide-react';
import { PREDEFINED_SUBJECTS } from '@/lib/data';
import { useEffect, useState } from 'react';
import { getSubjectById } from '@/lib/services/lessons';
import Link from 'next/link';

const getTitle = (pathname: string, subjectName: string | null): string => {
    const segments = pathname.split('/').filter(Boolean);

    // Admin titles
    if (pathname.startsWith('/admin')) {
      if (pathname.includes('add-titles')) return 'إدارة الدروس - إضافة عناوين';
      if (pathname.includes('manage-content')) return 'إدارة الدروس - إدارة المحتوى';
      if (pathname.includes('published')) return 'إدارة الدروس - الدروس المنشورة';
      if (pathname.includes('topics/new')) return 'إدارة المواضيع';
      if (pathname.includes('notifications/send')) return 'إدارة الإشعارات';
      if (pathname.includes('suggestions')) return 'رسائل الطلاب';
      return 'لوحة التحكم';
    }

    // App titles
    if (pathname.startsWith('/lessons')) {
        if (segments.length === 2 && segments[1] !== 'undefined') {
            return 'المواد';
        }
        if (segments.length === 3 && subjectName) {
            return subjectName;
        }
        if (segments.length > 3) {
            const semester = PREDEFINED_SUBJECTS.flatMap(s => s.semesters).find(sem => sem.id === segments[3]);
            return semester?.name || 'الدروس';
        }
        return 'الدروس';
    }
    if (pathname.startsWith('/community')) return 'المجتمع';
    if (pathname.startsWith('/teachers')) return 'الأساتذة';
    if (pathname.startsWith('/games')) return 'الألعاب';
    if (pathname.startsWith('/iaarab')) return 'المعرب الذكي';
    if (pathname.startsWith('/settings')) return 'إعدادات الحساب';
    
    return '';
};


export default function PageHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [subjectName, setSubjectName] = useState<string | null>(null);

  const segments = pathname.split('/').filter(Boolean);
  const subjectId = segments.length >= 3 && segments[1] === 'lessons' ? segments[2] : null;

  useEffect(() => {
    if (subjectId) {
      getSubjectById(subjectId).then(subject => {
        setSubjectName(subject?.name ?? null);
      });
    } else {
      setSubjectName(null);
    }
  }, [subjectId]);

  if (pathname === '/home' || pathname === '/admin/dashboard') {
    return null;
  }
  
  const isAdminPage = pathname.startsWith('/admin/');

  const title = getTitle(pathname, subjectName);

  return (
    <div className="container flex items-center justify-between h-12 mb-4">
        <Button variant="outline" size="icon" className="rounded-full h-9 w-9" onClick={() => router.back()}>
            <ArrowRight className="h-5 w-5" />
            <span className="sr-only">تراجع</span>
        </Button>
        <div className="flex items-center gap-2">
            {isAdminPage && (
                <Button variant="ghost" size="icon" className="rounded-full h-9 w-9" asChild>
                    <Link href="/admin/dashboard">
                        <Home className="h-5 w-5 text-muted-foreground" />
                    </Link>
                </Button>
            )}
             <h2 className="text-sm font-semibold text-muted-foreground sr-only">{title}</h2>
        </div>
        <Button variant="outline" size="icon" className="rounded-full h-9 w-9" onClick={() => router.forward()}>
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">تقدم</span>
        </Button>
    </div>
  );
}
