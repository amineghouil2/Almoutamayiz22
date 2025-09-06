

'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Brain, Youtube, BookOpen, Download, HelpCircle, FileQuestion, CheckCircle, Timer, FileText, LockKeyhole, Feather, MessageSquareQuote, ChevronsUpDown, CaseSensitive } from 'lucide-react';
import LessonDetailLoading from './loading';
import { getLessonById } from '@/lib/services/lessons';
import { completeLesson, getUserProgress } from '@/lib/services/progress';
import type { Lesson, Topic, Philosopher } from '@/lib/data';
import type { UserProgress } from '@/lib/services/progress';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import MentalMapGenerator from './_components/mental-map-generator';
import MiniExam from './_components/mini-exam';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase/config';
import type { User } from 'firebase/auth';
import { cn } from '@/lib/utils';


function LessonTimer({ timeLimit, onComplete }: { timeLimit: number, onComplete: () => void }) {
    const [timeLeft, setTimeLeft] = useState(timeLimit * 60);
    const [isTimeUp, setIsTimeUp] = useState(false);

    useEffect(() => {
        if (timeLeft <= 0) {
            if(!isTimeUp) {
                setIsTimeUp(true);
                onComplete();
            }
            return;
        }

        const interval = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [timeLeft, onComplete, isTimeUp]);

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
        <Card className="sticky top-20 z-30 bg-primary/20 border-primary/30 backdrop-blur-md">
            <CardContent className="p-3 flex items-center justify-center gap-4">
                <Timer className="h-6 w-6 text-primary" />
                <div className="text-center">
                    <p className="text-sm text-primary/80">الوقت المتبقي لإنهاء الدرس</p>
                    <p className="text-2xl font-bold font-mono text-white">{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</p>
                </div>
            </CardContent>
        </Card>
    );
}

function YouTubeEmbed({ videoUrl }: { videoUrl: string }) {
  const getYouTubeVideoId = (url: string) => {
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname === 'youtu.be') {
            return urlObj.pathname.slice(1);
        }
        if (urlObj.hostname.includes('youtube.com')) {
            return urlObj.searchParams.get('v');
        }
    } catch(e) {
        // invalid URL
    }
    return null;
  };

  const videoId = getYouTubeVideoId(videoUrl);

  if (!videoId) {
    return <p className="text-destructive">رابط يوتيوب غير صالح.</p>;
  }

  return (
    <div className="aspect-video w-full">
      <iframe
        className="w-full h-full rounded-lg"
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  );
}

function renderGeneralLessonContent(lesson: Lesson) {
    if (lesson.contentLines && lesson.contentLines.length > 0) {
        return lesson.contentLines.map((line, index) => {
            if (!line.text.trim()) return null;

            switch (line.type) {
                case 'main_title':
                    return <h2 key={index} className="text-2xl font-bold text-purple-400 mt-6 mb-3">{line.text}</h2>;
                case 'subtitle':
                    return <h3 key={index} className="text-lg font-semibold text-gray-400 mt-4 mb-2">{line.text}</h3>;
                case 'paragraph':
                default:
                    return <p key={index} className="text-base leading-relaxed text-foreground/90 mb-2">{line.text}</p>;
            }
        });
    }
    // Fallback to old content field if new one is empty
    return (
         <div className="whitespace-pre-wrap font-body text-foreground/90">
            {lesson.content}
        </div>
    );
}

function renderPhilosophyLessonContent(lesson: Lesson) {
    return (
        <div className="space-y-6">
            {lesson.definitions && (
                <Card className="bg-card/90 border-border/60 shadow-lg backdrop-blur-sm">
                    <CardHeader><CardTitle className="flex items-center gap-2 text-primary"><CaseSensitive />التعاريف</CardTitle></CardHeader>
                    <CardContent><p className="whitespace-pre-wrap">{lesson.definitions}</p></CardContent>
                </Card>
            )}
            {lesson.youtubeUrl && (
                <Card className="bg-red-900/20 border-red-500/30 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-300">
                            <Youtube />
                            فيديو الدرس
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <YouTubeEmbed videoUrl={lesson.youtubeUrl} />
                    </CardContent>
                </Card>
            )}
            {lesson.positions && (
                <Card className="bg-card/90 border-border/60 shadow-lg backdrop-blur-sm">
                    <CardHeader><CardTitle className="flex items-center gap-2 text-primary"><ChevronsUpDown />مواقف الأنصار</CardTitle></CardHeader>
                    <CardContent><p className="whitespace-pre-wrap">{lesson.positions}</p></CardContent>
                </Card>
            )}
            {lesson.philosophers && lesson.philosophers.length > 0 && (
                <div>
                     <h3 className="text-2xl font-bold text-center my-4">الفلاسفة وحججهم</h3>
                     <div className="space-y-4">
                        {lesson.philosophers.map((philosopher, index) => (
                             <Card key={index} className="bg-card/90 border-border/60 shadow-lg backdrop-blur-sm">
                                <CardHeader><CardTitle className="flex items-center gap-2 text-indigo-400"><Feather />{philosopher.name}</CardTitle></CardHeader>
                                <CardContent className="space-y-3">
                                    <p className="font-semibold">الحجة:</p>
                                    <p className="whitespace-pre-wrap text-foreground/80">{philosopher.argument}</p>
                                    {philosopher.quote && (
                                        <div className="border-t pt-3 mt-3">
                                            <p className="font-semibold flex items-center gap-2"><MessageSquareQuote className="h-4 w-4" />القول:</p>
                                            <blockquote className="border-r-4 border-primary pr-4 italic text-foreground/70">
                                                {philosopher.quote}
                                            </blockquote>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
            {lesson.solution && (
                 <Card className="bg-card/90 border-border/60 shadow-lg backdrop-blur-sm">
                    <CardHeader><CardTitle className="flex items-center gap-2 text-primary"><CheckCircle />الحل النهائي / التركيب</CardTitle></CardHeader>
                    <CardContent><p className="whitespace-pre-wrap">{lesson.solution}</p></CardContent>
                </Card>
            )}
        </div>
    );
}

function LessonContent({ lessonPromise, lessonId }: { lessonPromise: Promise<Lesson | null>, lessonId: string }) {
    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [progress, setProgress] = useState<UserProgress | null>(null);
    const [isTimeUp, setIsTimeUp] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const { toast } = useToast();
    
    // State to manage which element is in focus: 'lesson' or 'exam_INDEX'
    const [focusedElement, setFocusedElement] = useState<string>('lesson');

    const searchParams = useSearchParams();
    const articleId = searchParams.get('articleId');
    const selectedArticle = lesson?.articles?.find(a => a.id === articleId);
    
    const isLessonCompleted = progress?.completedLessons.includes(lessonId) ?? false;


    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(currentUser => {
            setUser(currentUser);
            if (currentUser) {
                getUserProgress(currentUser.uid).then(setProgress);
            }
        });

        lessonPromise.then(lessonData => {
            if (lessonData) {
                setLesson(lessonData);
                // If lesson is already completed, we don't need the timer.
                if (progress?.completedLessons.includes(lessonData.id)) {
                    setIsTimeUp(true);
                }
            }
            setIsLoading(false);
        }).catch(err => {
            console.error(err);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [lessonPromise, progress?.completedLessons]);

    const handleCompleteLesson = async () => {
        if (!user || !lesson) return;
        try {
            await completeLesson(user.uid, lesson.id, lesson.subjectId);
            setProgress(prev => prev ? {
                ...prev,
                completedLessons: [...prev.completedLessons, lesson.id]
            } : null);
            toast({
                title: 'مبارك!',
                description: `لقد أكملت درس "${lesson.title}" بنجاح وحصلت على نقاط.`,
                className: 'bg-green-500/20 border-green-500/30 text-white'
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'خطأ',
                description: error.message || 'فشل إكمال الدرس.',
            });
        }
    };

    if (isLoading) {
        return <LessonDetailLoading />;
    }

    if (!lesson) {
        return (
            <div className="text-center py-10" dir="rtl">
                <h2 className="text-2xl font-bold">لم يتم العثور على الدرس</h2>
                <p className="text-muted-foreground">هذا الدرس غير موجود أو لا يمكن تحميله.</p>
            </div>
        );
    }
    
    const isLessonFocused = focusedElement === 'lesson';
    const isPhilosophyLesson = lesson.subjectId === 'philosophy';


    return (
        <div className="max-w-4xl mx-auto animate-in fade-in-50 space-y-8" dir="rtl">
            <header>
                <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary mb-2">{lesson.title}</h1>
                 {selectedArticle && (
                    <div className="flex items-center gap-2 text-xl text-muted-foreground mt-2">
                        <FileText className="h-5 w-5"/>
                        <h2 className="font-semibold">{selectedArticle.title}</h2>
                    </div>
                )}
            </header>
            
            {lesson.timeLimit && lesson.timeLimit > 0 && !isLessonCompleted && (
                <LessonTimer timeLimit={lesson.timeLimit} onComplete={() => setIsTimeUp(true)} />
            )}
            
            <div 
                className={cn(
                    "relative transition-all duration-500",
                    !isLessonFocused && "opacity-50 blur-md pointer-events-auto cursor-pointer"
                )}
                onClick={() => !isLessonFocused && setFocusedElement('lesson')}
            >
                 <div className="max-w-none">
                    {isPhilosophyLesson ? renderPhilosophyLessonContent(lesson) : renderGeneralLessonContent(lesson)}
                 </div>
                
                 <div className="my-8 text-center space-y-4">
                    <MentalMapGenerator lessonContent={lesson.content} />
                    <Button
                        onClick={handleCompleteLesson}
                        disabled={!isTimeUp || isLessonCompleted}
                        size="lg"
                        className={cn(
                            "bg-green-600 hover:bg-green-700 disabled:bg-gray-500",
                            isLessonCompleted && "bg-green-800 cursor-not-allowed"
                        )}
                    >
                        <CheckCircle className="ml-2 h-5 w-5" />
                        {isLessonCompleted ? 'لقد أتممت هذا الدرس' : 'لقد أتممت الدرس'}
                    </Button>
                    {!isLessonCompleted && !isTimeUp && (
                         <p className="text-xs text-muted-foreground">يجب انتهاء الوقت أولاً لتتمكن من إكمال الدرس.</p>
                    )}
                </div>

                {!isPhilosophyLesson && lesson.youtubeUrl && (
                    <Card className="bg-red-900/20 border-red-500/30 shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-300">
                                <Youtube />
                                فيديو الدرس
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <YouTubeEmbed videoUrl={lesson.youtubeUrl} />
                        </CardContent>
                    </Card>
                )}

                {lesson.memoryAids && (
                    <Card className="bg-green-900/20 border-green-500/30 shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-green-300">
                                <Brain />
                                تسهيلات للحفظ
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="whitespace-pre-wrap font-body text-foreground/90">
                                {lesson.memoryAids}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {!isPhilosophyLesson && lesson.fiveQuestions && (
                    <Card className="bg-blue-900/20 border-blue-500/30 shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-blue-300">
                                <HelpCircle />
                                أسئلة للمراجعة
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="whitespace-pre-wrap font-body text-foreground/90">
                                {lesson.fiveQuestions}
                            </div>
                        </CardContent>
                    </Card>
                )}

                 {!isLessonFocused && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center">
                        <div className="bg-black/50 p-4 rounded-xl text-white text-center">
                            <LockKeyhole className="h-8 w-8 mx-auto mb-2" />
                            <p className="font-bold">الدرس مخفي</p>
                            <p className="text-xs">انقر هنا للعودة إلى الدرس.</p>
                        </div>
                    </div>
                )}
            </div>

             {lesson.miniQuizzes && lesson.miniQuizzes.length > 0 && (
                <div className="space-y-6">
                    {lesson.miniQuizzes.map((quiz, index) => {
                         const examId = `${lessonId}_quiz_${index}`;
                         const isExamCompleted = progress?.completedMiniExams?.includes(examId) ?? false;
                         return (
                            quiz.question && quiz.answer && (
                                <MiniExam
                                    key={index}
                                    examId={examId}
                                    lessonId={lessonId}
                                    question={quiz.question}
                                    modelAnswer={quiz.answer}
                                    isCompleted={isExamCompleted}
                                    user={user}
                                    isFocused={focusedElement === `exam_${index}`}
                                    onFocus={() => setFocusedElement(`exam_${index}`)}
                                />
                            )
                        )
                    })}
                </div>
            )}
        </div>
    );
}


export default function LessonPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const lessonPromise = getLessonById(id);

  return (
    <Suspense fallback={<LessonDetailLoading />}>
        <LessonContent lessonPromise={lessonPromise} lessonId={id} />
    </Suspense>
  );
}
