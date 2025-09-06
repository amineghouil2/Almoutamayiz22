

'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import type { Worker } from 'tesseract.js';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Brain, Sparkles, Wand2, FileImage, AlertCircle, CheckCircle, XCircle, Star, ListChecks } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { correctEssay } from '@/ai/flows/philosophy-corrector-flow';
import type { CorrectEssayOutput, CorrectEssayInput } from '@/ai/flows/philosophy-corrector-flow';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import CustomLoader from '@/components/ui/custom-loader';
import { Badge } from '@/components/ui/badge';

type Methodology = CorrectEssayInput['methodology'];
type EssayPart = CorrectEssayInput['essayPart'];

export default function PhilosophyCorrectorPage() {
  const [essayText, setEssayText] = useState('');
  const [methodology, setMethodology] = useState<Methodology | null>(null);
  const [essayPart, setEssayPart] = useState<EssayPart | null>(null);
  const [analysis, setAnalysis] = useState<CorrectEssayOutput | null>(null);
  const [isAnalyzing, startAnalysisTransition] = useTransition();
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [user, setUser] = useState<User | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleAnalyze = () => {
    if (!user) {
        toast({ variant: 'destructive', title: 'خطأ', description: 'الرجاء تسجيل الدخول أولاً.' });
        return;
    }
    if (!methodology) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'الرجاء اختيار منهجية المقال أولاً.' });
      return;
    }
    if (!essayPart) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'الرجاء اختيار الجزء المراد تصحيحه.' });
      return;
    }
    if (!essayText.trim()) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'الرجاء إدخال نص المقال أو رفع صورة.' });
      return;
    }
    setAnalysis(null);
    startAnalysisTransition(async () => {
      try {
        const result = await correctEssay({ essay: essayText, methodology, essayPart });
        setAnalysis(result);
      } catch (error) {
        console.error('Failed to analyze essay:', error);
        toast({
          variant: 'destructive',
          title: 'حدث خطأ',
          description: 'فشل تحليل المقال. يرجى المحاولة مرة أخرى.',
        });
      }
    });
  };
  
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    if (imageFiles.length === 0) {
        toast({ variant: 'destructive', title: 'ملفات غير صالحة', description: 'الرجاء اختيار ملفات صور فقط.' });
        return;
    }
    
    setUploadedImages(imageFiles);
    setIsProcessingImage(true);
    setOcrStatus('جاري تهيئة المحرك...');
    setOcrProgress(0);
    setEssayText('');

    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker('ara', 1, {
      logger: m => {
        if (m.status === 'recognizing text') {
          const overallProgress = (m.progress + (imageFiles.indexOf(m.userJobId as any) / imageFiles.length)) * 100 / imageFiles.length;
          setOcrProgress(Math.round(overallProgress));
          setOcrStatus(`جاري التعرف على النص في الصورة ${imageFiles.indexOf(m.userJobId as any) + 1}...`);
        }
      },
    });

    try {
      let combinedText = '';
      for (const file of imageFiles) {
        const { data: { text } } = await worker.recognize(file, {}, {userJobId: file.name});
        combinedText += text + '\n\n';
      }
      setEssayText(combinedText);
      toast({ title: 'نجاح', description: `تم استخراج النص من ${imageFiles.length} صور بنجاح.` });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل استخراج النص من إحدى الصور.' });
    } finally {
      await worker.terminate();
      setIsProcessingImage(false);
      setOcrProgress(0);
      setOcrStatus('');
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };


  return (
    <div className="animate-in fade-in-50 space-y-6" dir="rtl">
      <header className="text-center">
        <h1 className="text-4xl font-headline font-bold text-primary flex items-center justify-center gap-3">
          <Brain className="h-10 w-10" />
          مُصحح المقالات الفلسفية
        </h1>
        <p className="text-muted-foreground mt-2">
          احصل على تحليل وتصحيح لمقالاتك الفلسفية بالذكاء الاصطناعي.
        </p>
      </header>

       <Card>
        <CardHeader>
          <CardTitle>الخطوة 1: اختر المنهجية والجزء المراد تصحيحه</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
            <div>
              <Label className="mb-2 block font-semibold">أولاً: اختر المنهجية المتبعة:</Label>
              <RadioGroup
                value={methodology || ''}
                onValueChange={(value) => setMethodology(value as Methodology)}
                className="grid grid-cols-1 sm:grid-cols-3 gap-4"
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
            <div>
                <Label className="mb-2 block font-semibold">ثانياً: اختر الجزء الذي تريد تصحيحه:</Label>
                 <RadioGroup
                    value={essayPart || ''}
                    onValueChange={(value) => setEssayPart(value as EssayPart)}
                    className="grid grid-cols-2 sm:grid-cols-5 gap-4"
                >
                    {(['مقدمة', 'موقف', 'نقد', 'خاتمة', 'مقالة كاملة'] as EssayPart[]).map(part => (
                        <Label key={part} htmlFor={`part-${part}`} className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                            <RadioGroupItem value={part} id={`part-${part}`} className="sr-only" />
                            {part}
                        </Label>
                    ))}
                </RadioGroup>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>الخطوة 2: أدخل مقالك</CardTitle>
            <CardDescription>الصق نص مقالك هنا، أو قم برفع صورة واضحة له (يمكن رفع عدة صور).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="اكتب أو الصق نص المقال هنا..."
            className="min-h-[250px] text-base"
            value={essayText}
            onChange={(e) => setEssayText(e.target.value)}
            disabled={isProcessingImage}
          />
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" multiple />
           <Button onClick={() => fileInputRef.current?.click()} disabled={isProcessingImage} variant="secondary" className="w-full">
              {isProcessingImage ? <CustomLoader className="ml-2" /> : <FileImage className="ml-2 h-5 w-5" />}
              {isProcessingImage ? 'جاري معالجة الصور...' : 'رفع صورة (أو عدة صور) للمقال'}
          </Button>
          {isProcessingImage && (
            <div className="space-y-2 pt-2">
                <Progress value={ocrProgress} className="w-full" />
                <p className="text-sm text-center text-muted-foreground">{ocrStatus} ({ocrProgress}%)</p>
            </div>
          )}
           {uploadedImages.length > 0 && !isProcessingImage && (
                <div className="pt-2">
                    <p className="text-sm font-semibold mb-2">الصور المرفوعة:</p>
                    <div className="flex flex-wrap gap-2">
                        {uploadedImages.map((file, index) => (
                            <Badge key={index} variant="secondary">{file.name}</Badge>
                        ))}
                    </div>
                </div>
            )}
        </CardContent>
      </Card>
      
      <div className="flex items-center justify-center gap-4">
        <Button onClick={handleAnalyze} disabled={isAnalyzing || isProcessingImage || !essayText.trim() || !methodology || !essayPart} size="lg" className="w-full max-w-xs">
            {isAnalyzing ? 'جاري التحليل...' : (
            <>
                <Wand2 className="ml-2 h-5 w-5" />
                حلل وصحح المقال
            </>
            )}
        </Button>
      </div>


      {(isAnalyzing || analysis) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
                <Sparkles />
                تحليل الذكاء الاصطناعي
            </CardTitle>
            <CardDescription>هذا هو تحليل وتصحيح <span className='font-bold'>{essayPart}</span> الذي أدخلته وفق منهجية: <span className="font-bold">{methodology}</span></CardDescription>
          </CardHeader>
          <CardContent>
            {isAnalyzing ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-1/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-8 w-1/4 mt-4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : analysis && (
              <div className="space-y-6">
                
                {/* Strengths */}
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2 text-green-400 mb-2">
                        <CheckCircle />
                        نقاط القوة
                    </h3>
                    <div className="prose prose-invert max-w-none whitespace-pre-wrap text-foreground/90 p-3 bg-green-500/10 rounded-md">
                        {analysis.strengths}
                    </div>
                </div>

                 {/* Weaknesses */}
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2 text-red-400 mb-2">
                        <XCircle />
                        نقاط الضعف
                    </h3>
                     <div className="prose prose-invert max-w-none whitespace-pre-wrap text-foreground/90 p-3 bg-red-500/10 rounded-md">
                        {analysis.weaknesses}
                    </div>
                </div>

                {/* Methodology Feedback */}
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2 text-blue-400 mb-2">
                        <ListChecks />
                        تصحيح المنهجية
                    </h3>
                    <div className="prose prose-invert max-w-none whitespace-pre-wrap text-foreground/90 p-3 bg-blue-500/10 rounded-md">
                        {analysis.methodologyFeedback}
                    </div>
                </div>

                {/* Knowledge Feedback */}
                 <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2 text-purple-400 mb-2">
                        <Brain />
                        تصحيح المعرفة
                    </h3>
                     <div className="prose prose-invert max-w-none whitespace-pre-wrap text-foreground/90 p-3 bg-purple-500/10 rounded-md">
                        {analysis.knowledgeFeedback}
                    </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
