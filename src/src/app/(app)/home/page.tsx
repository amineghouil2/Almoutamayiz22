
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, CalendarCheck, BookCopy, BrainCircuit, Activity, Trophy, Star } from "lucide-react";
import Link from 'next/link';
import { useEffect, useState, useMemo, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { PREDEFINED_SUBJECTS, type Lesson } from '@/lib/data';
import { getLatestLessonForEachSubject, getLeaderboard, type LeaderboardUser } from '@/lib/services/lessons';
import { getUserProgress, type UserProgress } from "@/lib/services/progress";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User as UserIcon } from 'lucide-react';
import { useUserPersonalization } from '@/hooks/use-user-personalization';


const motivationalQuotes = [
    { quote: "التعليم هو أقوى سلاح يمكنك استخدامه لتغيير العالم.", author: "نيلسون مانديلا" },
    { quote: "النجاح هو مجموع الجهود الصغيرة التي تتكرر كل يوم.", author: "روبرت كوليير" },
    { quote: "لن تصل إلى القمة، ما لم تتعب في الصعود.", author: "ابن خلدون" },
    { quote: "اعمل بجد في صمت، ودع نجاحك يصنع الضجيج.", author: "فرانك أوشن" },
    { quote: "افعل اليوم ما لا يريد غيرك فعله، لتعيش غدًا كما لا يستطيعون.", author: "جيري رايس" },
    { quote: "اعمل كأنك تعيش أبداً، وتعلم كأنك تموت غداً.", author: "غاندي" },
    { quote: "العلم لا يعطيك بعضه حتى تعطيه كلك.", author: "الإمام الشافعي" },
    { quote: "إذا كنت تعتقد أن التعليم مكلف، جرّب الجهل.", author: "ديريك بوك" },
    { quote: "التعليم هو جواز سفرك إلى المستقبل، فالغد لمن يستعد له اليوم.", author: "مالكوم إكس" },
];

const getPodiumClass = (rank: number) => {
    switch (rank) {
        case 1:
            return 'bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500 text-black';
        case 2:
            return 'bg-gradient-to-br from-slate-300 via-slate-200 to-gray-400 text-black';
        case 3:
            return 'bg-gradient-to-br from-amber-600 via-yellow-700 to-orange-800 text-white';
        default:
            return 'bg-card border-border';
    }
};

const ShimmerEffect = () => (
    <div className="absolute top-0 left-[-150%] h-full w-[150%] 
                    bg-gradient-to-r from-transparent via-white/30 to-transparent 
                    animate-[shimmer_2.5s_infinite]"
         style={{
             animationName: 'shimmer',
             animationDuration: '3s',
             animationIterationCount: 'infinite'
         }}
    />
);


function ProgressStatusCard() {
    const { user } = useUserPersonalization();
    const [progress, setProgress] = useState<UserProgress | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            getUserProgress(user.uid).then(data => {
                setProgress(data);
                setLoading(false);
            }).catch(err => {
                console.error(err);
                setLoading(false);
            });
        }
    }, [user]);

    const getStatusInfo = (status: UserProgress['subjects'][0]['status']) => {
        switch (status) {
            case 'on_track':
                return { text: 'جيد', color: 'text-green-900' };
            case 'slightly_behind':
                return { text: 'يوجد متسع من الوقت', color: 'text-yellow-900' };
            case 'behind':
                return { text: 'أنت متأخر', color: 'text-red-900' };
            default:
                return { text: 'ابدأ الآن!', color: 'text-gray-800' };
        }
    };
    
    return (
        <Card className="bg-[#8fff41]/90 border-[#6aaa34] text-black">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl text-black">
                    <Activity className="h-6 w-6 text-black" />
                    حالة التقدم
                </CardTitle>
                <p className="text-sm text-black/70 pt-1">
                    تابع تقدمك في كل مادة مقارنة بالمنهج الدراسي الموصى به.
                </p>
            </CardHeader>
            <CardContent className="space-y-2 pt-2">
                {loading ? (
                    <div className="space-y-2">
                        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full bg-black/10" />)}
                    </div>
                ) : progress ? (
                    Object.values(progress.subjects).map(subjectProgress => {
                        const statusInfo = getStatusInfo(subjectProgress.status);
                        return (
                            <div key={subjectProgress.subjectId} className="flex items-center justify-between p-2 bg-black/10 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <span className="font-semibold text-sm">{subjectProgress.subjectName}</span>
                                </div>
                                <div className="text-left">
                                     <p className="text-xs text-black/70">{subjectProgress.lastCompletedLessonTitle || 'لم تبدأ بعد'}</p>
                                     <p className={`text-xs font-bold ${statusInfo.color}`}>{statusInfo.text}</p>
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <p className="text-center text-black/70 py-4">لا توجد بيانات تقدم لعرضها.</p>
                )}
            </CardContent>
        </Card>
    );
}

export default function HomePage() {
  const { user, loading: authLoading, isFemale } = useUserPersonalization();
  const [latestLessons, setLatestLessons] = useState<Record<string, Lesson | null>>({});
  const [lessonsLoading, setLessonsLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const router = useRouter();

  const plugin = useRef(
    Autoplay({ delay: 5500, stopOnInteraction: true })
  );
  
  useEffect(() => {
      const fetchInitialData = async () => {
          try {
              const [lessons, leaders] = await Promise.all([
                  getLatestLessonForEachSubject(),
                  getLeaderboard(3) // Fetch top 3 for the carousel
              ]);
              setLatestLessons(lessons);
              setLeaderboard(leaders);
          } catch (error) {
              console.error("Failed to fetch initial page data:", error);
          } finally {
              setLessonsLoading(false);
          }
      };

      fetchInitialData();
  }, []);

  const userName = user?.displayName || user?.email?.split('@')[0] || (isFemale ? 'المستخدمة' : 'المستخدم');

  const carouselItems = useMemo(() => {
    const items: ( { type: 'quote', data: typeof motivationalQuotes[0] } | { type: 'leader', data: LeaderboardUser, rank: number } )[] = [];
    motivationalQuotes.forEach((quote, index) => {
        items.push({ type: 'quote', data: quote });
        if (leaderboard[index]) {
            items.push({ type: 'leader', data: leaderboard[index], rank: index + 1 });
        }
    });
    return items;
  }, [leaderboard]);

  return (
    <div className="space-y-8 animate-in fade-in-50" dir="rtl">
        <style>
        {`
            @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(170%); }
            }
        `}
        </style>
        {/* Carousel */}
        <Card className="text-center rounded-xl bg-transparent border border-primary/20 shadow-lg flex flex-col justify-center overflow-hidden h-28">
            <Carousel
                plugins={[plugin.current]}
                className="w-full"
                opts={{ align: "start", loop: true, direction: 'rtl' }}
                onMouseEnter={plugin.current.stop}
                onMouseLeave={plugin.current.reset}
            >
            <CarouselContent>
                {carouselItems.map((item, index) => (
                    <CarouselItem key={index}>
                        <div className="h-full flex items-center justify-center p-1">
                        {item.type === 'quote' ? (
                             <div className="px-4 text-center relative w-full">
                                <span className="absolute -top-2 right-2 text-4xl font-serif text-primary/30 opacity-50">“</span>
                                <p className="text-sm font-headline text-foreground/90 z-10 relative">{item.data.quote}</p>
                                <p className="mt-2 text-xs text-muted-foreground">- {item.data.author}</p>
                                <span className="absolute -bottom-2 left-2 text-4xl font-serif text-primary/30 opacity-50">”</span>
                            </div>
                        ) : (
                            <Link href={`/profile/${item.data.userId}`} className="w-full block">
                                <Card className={cn("overflow-hidden relative transition-all duration-300 w-full h-[90px] flex items-center p-2", getPodiumClass(item.rank))}>
                                    <ShimmerEffect />
                                    {item.rank === 1 ? (
                                        <>
                                        <Trophy className="h-6 w-6 mx-2" />
                                        <Avatar className="h-10 w-10 border-2 border-yellow-600">
                                            <AvatarImage src={item.data.photoURL || ''} alt={item.data.displayName} />
                                            <AvatarFallback><UserIcon /></AvatarFallback>
                                        </Avatar>
                                        <div className="flex-grow text-right mx-2">
                                            <h3 className="font-bold text-base leading-tight">{item.data.displayName}</h3>
                                            <p className="text-xs font-semibold">المركز #{item.rank}</p>
                                        </div>
                                        <div className="flex items-center gap-1 font-bold text-base mx-2">
                                            <span>{item.data.points}</span>
                                            <Star className="h-4 w-4 text-yellow-500" />
                                        </div>
                                        </>
                                    ) : (
                                        <>
                                            <Trophy className="h-8 w-8 mx-4" />
                                            <div className="flex-grow text-right">
                                                <h3 className="font-bold text-lg">{item.data.displayName}</h3>
                                                <p className="text-sm font-semibold">المركز #{item.rank}</p>
                                            </div>
                                            <div className="flex items-center gap-1 font-bold text-lg mx-4">
                                                <span>{item.data.points}</span>
                                                <Star className="h-5 w-5 text-yellow-400" />
                                            </div>
                                        </>
                                    )}
                                </Card>
                            </Link>
                        )}
                        </div>
                    </CarouselItem>
                ))}
            </CarouselContent>
            </Carousel>
        </Card>

        {/* Welcome Card */}
        <Card className="bg-card border-border shadow-md rounded-xl text-center">
            <CardHeader>
                <CardTitle className="text-xl font-bold font-headline text-center">
                    {authLoading ? <Skeleton className="h-7 w-40 mx-auto" /> : `مرحباً بعودتكِ، ${userName}!`}
                </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
                <p>سلام الله عليكِ أيتها المتميزة.</p>
                <p>نحن هنا لنرافقكِ في رحلتكِ نحو التفوق. استغلي كل الموارد المتاحة من دروس وتمارين ومجتمع تفاعلي لتحقيق أفضل النتائج.</p>
                <p className="font-bold text-base text-foreground pt-2">
                    بسيركِ رفقتنا لا نعدكِ فقط بالنجاح بل 
                    <span> نعدكِ بالتم<Link href="/admin/login" className="no-underline text-inherit">يز</Link></span>.
                </p>
            </CardContent>
        </Card>

        {/* AI Chat Card */}
        <Card 
            className="bg-blue-900/20 border-blue-500/30 shadow-lg rounded-xl text-center cursor-pointer hover:border-blue-400/40 transition-all p-4 flex flex-col items-center justify-center"
            onClick={() => router.push('/ai-chat')}
        >
            <Link href="/ai-chat" className="w-full h-full flex flex-col items-center justify-center">
                <div className="p-2 bg-blue-400/10 rounded-full mb-3">
                    <BrainCircuit className="h-6 w-6 text-blue-300" />
                </div>
                <CardTitle className="text-lg font-bold font-headline mb-1 text-blue-300">اسأل الأستاذ IA</CardTitle>
                <p className="text-sm text-muted-foreground">احصل على إجابات فورية لأسئلتك الدراسية.</p>
            </Link>
        </Card>

        {/* Contact Manager Card */}
        <Card 
            className="bg-[#14150F] border-[#f5c026]/20 shadow-lg rounded-xl text-center cursor-pointer hover:border-primary/40 transition-all p-4 flex flex-col items-center justify-center"
            onClick={() => router.push('/my-messages')}
        >
            <Link href="/my-messages" className="w-full h-full flex flex-col items-center justify-center">
                <div className="p-2 bg-[#f5c026]/10 rounded-full mb-3">
                    <Lightbulb className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg font-bold font-headline mb-1">تواصل مع المدير</CardTitle>
                <p className="text-sm text-muted-foreground">أرسل اقتراحاتك وملاحظاتك مباشرة.</p>
            </Link>
        </Card>

        {/* Progress Status Card */}
        <ProgressStatusCard />

        {/* Weekly Study Plan */}
        <Card className="bg-purple-900/10 border-purple-500/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                    <CalendarCheck className="h-6 w-6 text-primary" />
                    واكبي المنهج الدراسي
                </CardTitle>
                <p className="text-sm text-muted-foreground pt-1">
                    تعرض هذه الاداة آخر الدروس التي بلغها الطلبة النظاميون في كل مادة.
                </p>
            </CardHeader>
            <CardContent className="space-y-2 pt-2">
                {lessonsLoading ? (
                    <div className="space-y-2">
                        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
                    </div>
                ) : (
                    PREDEFINED_SUBJECTS.map(subject => {
                        const lesson = latestLessons[subject.id];
                        return (
                            <div key={subject.id} className="flex items-center justify-between p-2 bg-card-foreground/5 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <BookCopy className="h-4 w-4 text-primary/80" />
                                    <span className="font-semibold text-sm">{subject.name}</span>
                                </div>
                                <span className="text-xs text-muted-foreground text-left">
                                    {lesson ? lesson.title : 'لم تضف دروس بعد'}
                                </span>
                            </div>
                        )
                    })
                )}
            </CardContent>
        </Card>
    </div>
  );
}
