
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PREDEFINED_SUBJECTS } from '@/lib/data';
import { Button } from '@/components/ui/button';

export default function CommunityPage() {
  const router = useRouter();

  const handleNavigate = (href: string) => {
    router.push(href);
  };
  
  const handlePrefetch = (href: string) => {
      router.prefetch(href);
  }

  return (
    <div className="animate-in fade-in-50" dir="rtl">
       <header className="mb-8 text-center">
        <h1 className="text-4xl font-headline font-bold text-primary">ملتقى المتميزون</h1>
        <p className="text-muted-foreground mt-2">
          اختر المادة التي تريد النقاش حولها مع زملائك.
        </p>
      </header>
      <div className="space-y-4">
        {PREDEFINED_SUBJECTS.map((subject) => {
          const Icon = subject.icon;
          const href = `/community/${subject.id}`;
          return (
            <Card 
              key={subject.id}
              className="bg-card border-border shadow-lg rounded-3xl cursor-pointer transition-all overflow-hidden flex flex-col hover:border-primary/50 mb-2"
              onClick={() => handleNavigate(href)}
              onPointerDown={() => handlePrefetch(href)}
            >
              <CardContent className="p-4 flex flex-col items-center text-center gap-3 flex-1">
                 <div className="p-3 rounded-full bg-primary/10 mb-1">
                   {Icon && <Icon className="h-7 w-7 text-primary" />}
                 </div>
                 <div className="flex-1">
                  <h2 className="text-xl font-bold font-headline mb-1">{subject.name}</h2>
                 </div>
                 <Button size="sm" className="w-full mt-2 rounded-xl shadow-[0_0_20px_rgba(250,204,21,0.4)] hover:shadow-[0_0_25px_rgba(250,204,21,0.6)] transition-all pointer-events-none">
                      ادخل إلى الملتقى
                      <ArrowLeft className="mr-2 h-4 w-4"/>
                 </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  );
}
