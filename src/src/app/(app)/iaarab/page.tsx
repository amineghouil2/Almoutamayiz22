
'use client';

import { useState, useTransition, useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Brain, Sparkles, Wand2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { iaarab } from '@/ai/flows/iaarab-flow';
import type { IaarabInput } from '@/ai/flows/iaarab-types';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

type ParseMode = 'word' | 'sentence';

export default function IaarabPage() {
  const [parseMode, setParseMode] = useState<ParseMode>('word');
  const [sentence, setSentence] = useState('');
  const [wordToParse, setWordToParse] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [isParsing, startParsingTransition] = useTransition();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleParse = () => {
    if (!user) {
        toast({ variant: 'destructive', title: 'خطأ', description: 'الرجاء تسجيل الدخول أولاً.' });
        return;
    }

    if (!sentence.trim()) {
        toast({ variant: 'destructive', title: 'خطأ', description: 'الرجاء إدخال نص الجملة الكاملة.' });
        return;
    }

    if (parseMode === 'word' && !wordToParse.trim()) {
        toast({ variant: 'destructive', title: 'خطأ', description: 'الرجاء إدخال الكلمة المراد إعرابها.' });
        return;
    }

    setAnalysis('');
    startParsingTransition(async () => {
      try {
        const input: IaarabInput = {
          mode: parseMode,
          sentence: sentence,
          wordToParse: parseMode === 'word' ? wordToParse : undefined,
        };
        const result = await iaarab(input);
        setAnalysis(result.analysis);
      } catch (error: any) {
        console.error('Failed to parse text:', error);
        toast({
          variant: 'destructive',
          title: 'حدث خطأ',
          description: error.message || 'فشل تحليل النص. يرجى المحاولة مرة أخرى.',
        });
      }
    });
  };

  return (
    <div className="animate-in fade-in-50 space-y-6" dir="rtl">
      <header className="text-center">
        <h1 className="text-4xl font-headline font-bold text-primary flex items-center justify-center gap-3">
          <Brain className="h-10 w-10" />
          المعرب الذكي
        </h1>
        <p className="text-muted-foreground mt-2">
          أدخل أي كلمة، جملة، أو فقرة للحصول على إعرابها المفصل.
        </p>
      </header>

      <Card>
        <CardHeader>
            <CardTitle>حدد طلبك</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <RadioGroup
            value={parseMode}
            onValueChange={(value: string) => setParseMode(value as ParseMode)}
            className="grid grid-cols-2 gap-4"
          >
            <Label htmlFor="mode-word" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
              <RadioGroupItem value="word" id="mode-word" className="sr-only" />
              إعراب كلمة
            </Label>
            <Label htmlFor="mode-sentence" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
              <RadioGroupItem value="sentence" id="mode-sentence" className="sr-only" />
              إعراب جملة
            </Label>
          </RadioGroup>

          <div className="space-y-4 pt-4">
            <div className="space-y-2">
                <Label htmlFor="sentence-context">
                    {parseMode === 'word' ? 'الجملة الكاملة (للسياق)' : 'الجملة المراد إعرابها'}
                </Label>
                <Textarea
                    id="sentence-context"
                    placeholder="اكتب الجملة الكاملة هنا..."
                    className="min-h-[100px] text-base"
                    value={sentence}
                    onChange={(e) => setSentence(e.target.value)}
                />
            </div>
            
            {parseMode === 'word' && (
                <div className="space-y-2 animate-in fade-in-20">
                    <Label htmlFor="word-to-parse">الكلمة المراد إعرابها</Label>
                    <Input
                        id="word-to-parse"
                        placeholder="اكتب الكلمة المحددة هنا..."
                        value={wordToParse}
                        onChange={(e) => setWordToParse(e.target.value)}
                    />
                </div>
            )}
          </div>
          
          <div className="flex items-center justify-center pt-4">
            <Button onClick={handleParse} disabled={isParsing} size="lg" className="w-full max-w-sm">
                {isParsing ? 'جاري الإعراب...' : (
                <>
                    <Wand2 className="ml-2 h-5 w-5" />
                    أعرب النص
                </>
                )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {(isParsing || analysis) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
                <Sparkles />
                التحليل النحوي
            </CardTitle>
            <CardDescription>
              {parseMode === 'word' ? `إعراب كلمة "${wordToParse}" في سياق الجملة.` : 'إعراب الجملة المحددة.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isParsing ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : (
              <div className="prose prose-invert prose-lg max-w-none whitespace-pre-wrap font-body text-foreground/90">
                {analysis}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
