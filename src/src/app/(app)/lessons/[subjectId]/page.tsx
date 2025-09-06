
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Wand2, Lightbulb, ArrowLeft, PencilLine } from 'lucide-react';
import { getSubjectById } from '@/lib/services/lessons';
import LessonsLoading from '../loading';
import { Suspense } from 'react';
import { useRouter } from 'next/navigation';

async function SubjectDetailsContent({ subjectId, onNavigate, onPrefetch }: { subjectId: string, onNavigate: (href: string) => void, onPrefetch: (href: string) => void}) {
    const subject = await getSubjectById(subjectId);

    if (!subject) {
        return (
            <div className="text-center py-10" dir="rtl">
                <h2 className="text-2xl font-bold">لم يتم العثور على المادة</h2>
            </div>
        );
    }

    const toolCards = [
        {
            id: 'arabic',
            href: '/iaarab',
            title: 'المعرب الذكي',
            description: 'أداة متقدمة لتحليل النصوص والجمل بالذكاء الاصطناعي.',
            icon: Wand2,
        },
        {
            id: 'philosophy',
            href: '/philosophy-corrector',
            title: 'مصحح المقالات الفلسفية',
            description: 'احصل على تصحيح وتحليل دقيق لمقالاتك الفلسفية.',
            icon: Lightbulb,
        },
        {
            id: 'philosophy-generator', // New tool
            href: '/philosophy-generator',
            title: 'مولد المقالات الفلسفية',
            description: 'أنشئ مقالة احترافية بناءً على درس ومنهجية من اختيارك.',
            icon: PencilLine,
        }
    ];
    
    // Filter tools for the current subject
    const subjectTools = toolCards.filter(tool => tool.id.startsWith(subject.id) || tool.id.startsWith(subject.id.split('_')[0]));


    return (
        <div className="animate-in fade-in-50" dir="rtl">
            <header className="flex items-center justify-center mb-8 relative">
                <h1 className="text-2xl font-headline font-bold text-center">{subject.name}</h1>
            </header>
            <div className="space-y-4">
                {subject.semesters?.map((semester) => (
                    <Card
                        key={semester.id}
                        onClick={() => onNavigate(`/lessons/${subjectId}/${semester.id}`)}
                        onPointerDown={() => onPrefetch(`/lessons/${subjectId}/${semester.id}`)}
                        className="bg-card/80 border-border/60 shadow-md rounded-2xl cursor-pointer hover:border-primary/50 transition-all mb-4"
                    >
                        <CardContent className="p-4">
                            <p className="text-xl font-semibold text-center">{semester.name}</p>
                        </CardContent>
                    </Card>
                ))}
                
                 {subjectTools.map((tool, index) => (
                    <Card
                        key={tool.href}
                        onClick={() => onNavigate(tool.href)}
                        onPointerDown={() => onPrefetch(tool.href)}
                        className="bg-[#14150F] border-[#f5c026]/20 shadow-lg rounded-2xl cursor-pointer hover:border-primary/40 transition-all mb-4"
                    >
                        <CardContent className="p-6 flex flex-col items-center justify-center gap-4">
                            <div className="p-2 bg-[#f5c026]/10 rounded-full mb-2">
                                <tool.icon className="h-8 w-8 text-primary" />
                            </div>
                            <div className="text-center">
                                <p className="text-xl font-bold text-center text-primary">{tool.title}</p>
                                <p className="text-sm text-center text-muted-foreground mt-1">{tool.description}</p>
                            </div>
                            <Button size="lg" className="rounded-xl shadow-[0_0_20px_rgba(250,204,21,0.5)] hover:shadow-[0_0_25px_rgba(250,204,21,0.7)] transition-all pointer-events-none">
                                <Wand2 className="ml-2 h-5 w-5" />
                                جرب الآن
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

// A client component that wraps the async component and provides the router functionality.
function SubjectPageClient({ params }: { params: { subjectId: string } }) {
    const router = useRouter();
    const handleNavigate = (href: string) => {
        router.push(href);
    };
    const handlePrefetch = (href: string) => {
        router.prefetch(href);
    }

    return (
        <Suspense fallback={<LessonsLoading />}>
            <SubjectDetailsContent subjectId={params.subjectId} onNavigate={handleNavigate} onPrefetch={handlePrefetch} />
        </Suspense>
    );
}

export default function SubjectPage({ params }: { params: { subjectId: string } }) {
  return <SubjectPageClient params={params} />;
}
