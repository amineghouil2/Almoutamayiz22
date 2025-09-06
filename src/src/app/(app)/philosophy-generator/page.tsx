
'use client';

import { useState, useTransition, useEffect, Suspense } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Sparkles, Wand2, PencilLine } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { generateEssay } from '@/ai/flows/philosophy-generator-flow';
import type { GenerateEssayOutput, GenerateEssayInput } from '@/ai/flows/philosophy-generator-flow';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getLessonsForAdminBySemester } from '@/lib/services/lessons';
import type { Lesson } from '@/lib/data';
import CustomLoader from '@/components/ui/custom-loader';

type Methodology = GenerateEssayInput['methodology'];

function PhilosophyGeneratorComponent() {
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [methodology, setMethodology] = useState<Methodology | null>(null);
  const [generatedEssay, setGeneratedEssay] = useState('');
  const [isGenerating, startGenerationTransition] = useTransition();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(true);
  
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    // Fetch all philosophy lessons across all semesters
    const fetchPhilosophyLessons = async () => {
        setLoadingLessons(true);
        try {
            const s1 = await getLessonsForAdminBySemester('philosophy', 'philosophy-s1');
            const s2 = await getLessonsForAdminBySemester('philosophy', 'philosophy-s2');
            const s3 = await getLessonsForAdminBySemester('philosophy', 'philosophy-s3');
            const publishedLessons = [...s1, ...s2, ...s3].filter(l => l.status === 'published');
            setLessons(publishedLessons);
        } catch (error) {
            console.error("Failed to fetch lessons:", error);
            toast({ variant: 'destructive', title: 'خطأ', description: 'فشل تحميل قائمة الدروس.' });
        } finally {
            setLoadingLessons(false);
        }
    };
    fetchPhilosophyLessons();
    return () => unsubscribe();
  }, [toast]);

  const handleGenerate = () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'الرجاء تسجيل الدخول أولاً.' });
      return;
    }
    if (!selectedLessonId) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'الرجاء اختيار الدرس أولاً.' });
      return;
    }
    if (!methodology) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'الرجاء اختيار المنهجية.' });
      return;
    }
    const selectedLesson = lessons.find(l => l.id === selectedLessonId);
    if (!selectedLesson) return;

    // Combine all relevant lesson content
    const lessonContent = [
        `عنوان الدرس: ${selectedLesson.title}`,
        selectedLesson.definitions ? `التعاريف: ${selectedLesson.definitions}` : '',
        selectedLesson.positions ? `مواقف الأنصار: ${selectedLesson.positions}` : '',
        selectedLesson.philosophers ? `الفلاسفة وحججهم: ${selectedLesson.philosophers.map(p => `${p.name}: ${p.argument} (${p.quote || ''})`).join('; ')}` : '',
        selectedLesson.solution ? `الحل: ${selectedLesson.solution}` : ''
    ].filter(Boolean).join('\n\n');

    setGeneratedEssay('');
    startGenerationTransition(async () => {
      try {
        const result = await generateEssay({ lessonContent, methodology });
        setGeneratedEssay(result.generatedEssay);
      } catch (error: any) {
        console.error('Failed to generate essay:', error);
        toast({
          variant: 'destructive',
          title: 'حدث خطأ',
          description: 'فشل إنشاء المقال. قد يكون محتوى الدرس غير كافٍ. يرجى المحاولة مرة أخرى.',
        });
      }
    });
  };

  return (
    <div className="animate-in fade-in-50 space-y-6" dir="rtl">
      <header className="text-center">
        <h1 className="text-4xl font-headline font-bold text-primary flex items-center justify-center gap-3">
          <PencilLine className="h-10 w-10" />
          مولّد المقالات الفلسفية
        </h1>
        <p className="text-muted-foreground mt-2">
          اختر درسًا ومنهجية، ودع الذكاء الاصطناعي يكتب لك مقالة احترافية.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>الخطوة 1: اختر الدرس والمنهجية</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>اختر الدرس</Label>
            <Select onValueChange={setSelectedLessonId} value={selectedLessonId} disabled={loadingLessons}>
              <SelectTrigger>
                <SelectValue placeholder={loadingLessons ? "جاري تحميل الدروس..." : "اختر درسًا لتكتب عنه مقالة..."} />
              </SelectTrigger>
              <SelectContent>
                {lessons.length > 0 ? (
                    lessons.map(lesson => (
                        <SelectItem key={lesson.id} value={lesson.id}>
                            {lesson.title}
                        </SelectItem>
                    ))
                ) : (
                    <SelectItem value="no-lessons" disabled>لا توجد دروس فلسفة منشورة حاليًا.</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>اختر المنهجية</Label>
            <RadioGroup
              value={methodology || ''}
              onValueChange={(value) => setMethodology(value as Methodology)}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2"
            >
              <Label htmlFor="method-dialectic" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                <RadioGroupItem value="جدلية" id="method-dialectic" className="sr-only" />
                جدلية
              </Label>
              <Label htmlFor="method-comparison" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                <RadioGroupItem value="مقارنة" id="method-comparison" className="sr-only" />
                مقارنة
              </Label>
              <Label htmlFor="method-inquiry" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                <RadioGroupItem value="استقصاء بالوضع" id="method-inquiry" className="sr-only" />
                استقصاء بالوضع
              </Label>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex items-center justify-center">
        <Button onClick={handleGenerate} disabled={isGenerating || !selectedLessonId || !methodology} size="lg" className="w-full max-w-xs">
          {isGenerating ? 'جاري إنشاء المقال...' : (
            <>
              <Wand2 className="ml-2 h-5 w-5" />
              أنشئ المقال الآن
            </>
          )}
        </Button>
      </div>

      {(isGenerating || generatedEssay) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Sparkles />
              المقال المُنشأ بواسطة الذكاء الاصطناعي
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isGenerating ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <br/>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : (
              <div className="prose prose-invert prose-lg max-w-none whitespace-pre-wrap font-body text-foreground/90">
                {generatedEssay}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}


export default function PhilosophyGeneratorPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><CustomLoader className="h-10 w-10" /></div>}>
            <PhilosophyGeneratorComponent />
        </Suspense>
    )
}
