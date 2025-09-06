
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { PREDEFINED_SUBJECTS } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function LessonsPage() {
  const router = useRouter();
  const subjects = PREDEFINED_SUBJECTS;

  const handleNavigate = (href: string) => {
    router.push(href);
  };
  
  const handlePrefetch = (href: string) => {
      router.prefetch(href);
  }

  return (
    <div className="animate-in fade-in-50" dir="rtl">
       <header className="mb-8 text-center">
        <h1 className="text-4xl font-headline font-bold text-primary">المواد الدراسية</h1>
        <p className="text-muted-foreground mt-2">
          اختر المادة التي تريد البدء في مراجعتها.
        </p>
      </header>
      <div className="space-y-4">
        {subjects.map((subject) => (
          <Card 
            key={subject.id}
            onClick={() => handleNavigate(`/lessons/${subject.id}`)}
            onPointerDown={() => handlePrefetch(`/lessons/${subject.id}`)}
            className="bg-card border-border shadow-lg rounded-3xl cursor-pointer transition-all overflow-hidden flex flex-col mb-2 hover:border-primary/50"
          >
            <CardContent className="p-4 flex flex-col items-center text-center gap-3 flex-1">
               <div className="p-3 rounded-full bg-primary/10 mb-1">
                 <BookOpen className="h-7 w-7 text-primary" />
               </div>
               <div className="flex-1">
                <h2 className="text-xl font-bold font-headline mb-1">{subject.name}</h2>
                <p className="text-xs text-muted-foreground">ملخصات للدروس، تقاويم نقدية، بلاغة وقواعد.</p>
               </div>
               <Button size="sm" className="w-full mt-2 rounded-xl shadow-[0_0_20px_rgba(250,204,21,0.4)] hover:shadow-[0_0_25px_rgba(250,204,21,0.6)] transition-all pointer-events-none">
                    ابدأ المراجعة
                    <ArrowLeft className="mr-2 h-4 w-4"/>
               </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
