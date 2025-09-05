
'use client';

import { useState, useTransition } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { gradeExam } from '@/ai/flows/grade-exam-flow';
import { completeMiniExam } from '@/lib/services/progress';
import { Sparkles, FileQuestion, Wand2, LockKeyhole } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { User } from 'firebase/auth';
import CustomLoader from '@/components/ui/custom-loader';

interface MiniExamProps {
  examId: string;
  lessonId: string;
  question: string;
  modelAnswer: string;
  isCompleted: boolean;
  user: User | null;
  isFocused: boolean;
  onFocus: () => void;
}

export default function MiniExam({ examId, lessonId, question, modelAnswer, isCompleted, user, isFocused, onFocus }: MiniExamProps) {
  const [studentAnswer, setStudentAnswer] = useState('');
  const [result, setResult] = useState<{ grade: string; feedback: string } | null>(null);
  const [isGrading, startGradingTransition] = useTransition();
  const [wasCompleted, setWasCompleted] = useState(isCompleted);

  const { toast } = useToast();

  const handleGrade = () => {
    if (!studentAnswer.trim()) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'الرجاء كتابة إجابتك أولاً.' });
      return;
    }
    if (!user) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'يجب تسجيل الدخول لتصحيح الامتحان.' });
      return;
    }
    setResult(null);
    startGradingTransition(async () => {
      try {
        const gradingResult = await gradeExam({
          question: question,
          modelAnswer: modelAnswer,
          studentAnswer: studentAnswer,
        });
        setResult(gradingResult);
        // Award points only if it's the first time
        if (!wasCompleted) {
          await completeMiniExam(user.uid, lessonId, examId);
          setWasCompleted(true);
          toast({
            title: 'أحسنت!',
            description: 'تم تصحيح إجابتك وإضافة النقاط إلى رصيدك.',
            className: 'bg-green-500/20 border-green-500/30 text-white'
          });
        }
      } catch (error: any) {
        console.error('Failed to grade exam:', error);
        toast({
          variant: 'destructive',
          title: 'حدث خطأ',
          description: error.message || 'فشل تصحيح الامتحان. يرجى المحاولة مرة أخرى.',
        });
      }
    });
  };

  const handleReveal = () => {
    if (isFocused) return;
    onFocus();
  };

  return (
    <div 
        className={cn(
            "relative transition-all duration-500",
            !isFocused && "opacity-50 blur-md pointer-events-auto cursor-pointer"
        )}
        onClick={handleReveal}
    >
        <Card className="bg-purple-900/20 border-purple-500/30 shadow-lg overflow-hidden">
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-300">
            <FileQuestion />
            امتحان مصغر (تصحيح تلقائي)
            </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div 
                className="relative p-4 rounded-lg bg-black/20 min-h-[80px] flex items-center justify-center"
            >
                <p className="font-semibold text-lg text-center">{question}</p>
            </div>
            
            <div className="space-y-4 animate-in fade-in-50">
                <Textarea
                    placeholder="اكتب إجابتك هنا..."
                    value={studentAnswer}
                    onChange={(e) => setStudentAnswer(e.target.value)}
                    className="min-h-[150px]"
                    disabled={isGrading || !isFocused}
                />
                <Button onClick={handleGrade} disabled={isGrading || !studentAnswer.trim() || !isFocused}>
                {isGrading ? (
                    <>
                    <CustomLoader className="ml-2 h-4 w-4" />
                    جاري التصحيح...
                    </>
                ) : (
                    <>
                    <Wand2 className="ml-2 h-4 w-4" />
                    صحح إجابتي بالذكاء الاصطناعي
                    </>
                )}
                </Button>

                {isGrading && (
                <div className="space-y-3 pt-4">
                    <Skeleton className="h-8 w-1/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                </div>
                )}

                {result && (
                <div className="mt-6 border-t border-purple-500/30 pt-4 space-y-4 animate-in fade-in-50">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-primary">
                    <Sparkles />
                    النتيجة والتقييم
                    </h3>
                    <div className="p-4 rounded-lg bg-black/30">
                    <p className="text-sm font-semibold mb-1">علامتك:</p>
                    <p className="text-3xl font-bold text-primary">{result.grade}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-black/30">
                    <p className="text-sm font-semibold mb-1">ملاحظات المصحح الآلي:</p>
                    <p className="whitespace-pre-wrap text-foreground/90">{result.feedback}</p>
                    </div>
                </div>
                )}
            </div>
        </CardContent>
        </Card>

        {!isFocused && (
            <div className="absolute inset-0 z-10 flex items-center justify-center">
                <div className="bg-black/50 p-4 rounded-xl text-white text-center">
                    <LockKeyhole className="h-8 w-8 mx-auto mb-2" />
                    <p className="font-bold">عرض سؤال الامتحان</p>
                    <p className="text-xs">سيؤدي هذا إلى إخفاء الدرس.</p>
                </div>
            </div>
        )}
    </div>
  );
}
