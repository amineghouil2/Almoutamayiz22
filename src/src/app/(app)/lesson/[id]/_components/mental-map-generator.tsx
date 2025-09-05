
'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { generateMentalMap } from '@/ai/flows/summarize-lesson';
import { Sparkles, Bot, BrainCircuit } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function MentalMapGenerator({ lessonContent }: { lessonContent: string }) {
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [mentalMap, setMentalMap] = useState('');
    const [isLoading, startTransition] = useTransition();
    const { toast } = useToast();

    const handleGenerate = async () => {
        if (!lessonContent) return;
        setDialogOpen(true);
        setMentalMap('');
        startTransition(async () => {
            try {
                const result = await generateMentalMap({ lessonContent });
                setMentalMap(result.mentalMap);
            } catch (error) {
                console.error('Failed to generate mental map:', error);
                toast({
                    variant: 'destructive',
                    title: 'خطأ',
                    description: 'فشل إنشاء الصور الذهنية. يرجى المحاولة مرة أخرى.',
                });
                setDialogOpen(false);
            }
        });
    };

    return (
        <>
            <Button onClick={handleGenerate} size="lg" className="bg-primary/90 hover:bg-primary text-primary-foreground">
                <BrainCircuit className="ml-2 h-5 w-5" />
                إنشاء صور ذهنية
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[425px] md:sm:max-w-[600px]" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-primary font-headline text-2xl">
                    <Bot />
                    الصور الذهنية ومساعدات الحفظ
                    </DialogTitle>
                    <DialogDescription>أفكار ورموز وتشبيهات لمساعدتك على ترسيخ الدرس في الذاكرة.</DialogDescription>
                </DialogHeader>
                <div className="py-4 max-h-[70vh] overflow-y-auto">
                    {isLoading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-full mt-4" />
                        <Skeleton className="h-4 w-5/6" />
                    </div>
                    ) : (
                    <div className="whitespace-pre-wrap text-base leading-relaxed" dangerouslySetInnerHTML={{ __html: mentalMap.replace(/\n/g, '<br />') }} />
                    )}
                </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
