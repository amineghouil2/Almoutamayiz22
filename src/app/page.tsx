
'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { LogIn, UserPlus } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import CustomLoader from '@/components/ui/custom-loader';
import { useUserPersonalization } from '@/hooks/use-user-personalization';

// Lazy load the FeaturesSection
const FeaturesSection = React.lazy(() => import('./(welcome)/features-section').then(mod => ({ default: mod.FeaturesSection })));

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


export default function WelcomePage() {
   const { user, loading } = useUserPersonalization();
   const router = useRouter();

   const plugin = React.useRef(
    Autoplay({ delay: 5500, stopOnInteraction: true })
  );

  React.useEffect(() => {
    if (!loading && user) {
      router.replace('/home');
    }
  }, [user, loading, router]);


  if (loading || user) {
      return (
          <div className="flex flex-col min-h-screen items-center justify-center bg-background p-4" dir="rtl">
              <CustomLoader className="h-12 w-12 text-primary" />
              <p className="mt-4 text-muted-foreground">جاري التحميل</p>
          </div>
      );
  }


  return (
    <div
      className="flex flex-col min-h-screen items-center justify-center bg-background p-4 space-y-8 animate-in fade-in-50"
      dir="rtl"
    >
      <header className="relative w-full flex justify-center pt-8">
        <div className="absolute top-0 -z-10 h-40 w-56 bg-primary/30 blur-3xl" />
        <Image
          src="https://i.ibb.co/bjLDwBbd/IMG-20250722-114332.png"
          alt="المتميز Logo"
          width={180}
          height={60}
          priority={true}
          className="drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]"
        />
      </header>

      <main className="w-full max-w-md space-y-8">
        
        {/* Motivational Quote Carousel */}
        <Card className="relative text-center py-2 px-4 rounded-xl bg-transparent border border-primary/20 shadow-lg flex flex-col justify-center overflow-hidden">
            <span className="absolute top-1 right-2 text-4xl font-serif text-primary/30 opacity-50">“</span>
            <Carousel
            plugins={[plugin.current]}
            className="w-full"
            opts={{
                align: "start",
                loop: true,
                direction: 'rtl',
            }}
            onMouseEnter={plugin.current.stop}
            onMouseLeave={plugin.current.reset}
            >
            <CarouselContent>
                {motivationalQuotes.map((item, index) => (
                <CarouselItem key={index}>
                    <div className="px-4 text-center">
                    <p className="text-sm font-headline text-foreground/90 z-10 relative">
                        {item.quote}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">- {item.author}</p>
                    </div>
                </CarouselItem>
                ))}
            </CarouselContent>
            </Carousel>
            <span className="absolute bottom-1 left-2 text-4xl font-serif text-primary/30 opacity-50">”</span>
        </Card>

        <Card className="bg-card/80 border-border/60 shadow-lg">
          <CardContent className="p-6 text-center">
            <h1 className="text-3xl font-bold font-headline text-primary">
              مرحباً بك في تطبيق المتميز
            </h1>
            <p className="text-md text-muted-foreground mt-4">
              سلام الله عليكم طلبتنا الأحباء،
            </p>
            <p className="text-foreground/90 mt-2 leading-relaxed">
              إنما هذا التطبيق قد وجد من أجلكم ليكون لكم عوناً لا يخون، وسنداً
              لا يلين، يرافقكم طيلة السنة، في الدروس والملخصات، في التمارين
              والدعم النفسي والمعرفي، هو رفيق دربكم نحو الامتياز، ومنارة
              تهديكم في درب الاستعداد والثقة.
            </p>
          </CardContent>
        </Card>
        
        <div className="w-full rounded-xl overflow-hidden shadow-lg">
            <YouTubeEmbed videoUrl="https://youtu.be/jWDE4GbSE6U?si=yDi_8kC27M-756GV" />
        </div>


        <div className="w-full space-y-4">
            <Button 
                onClick={() => router.push('/login')}
                onPointerDown={() => router.prefetch('/login')}
                size="sm" 
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(250,204,21,0.5)] hover:shadow-[0_0_25px_rgba(250,204,21,0.7)] transition-all"
            >
                <LogIn className="ml-2" />
                تسجيل الدخول
            </Button>
            <Button 
                onClick={() => router.push('/signup')}
                onPointerDown={() => router.prefetch('/signup')}
                variant="outline" 
                size="sm" 
                className="w-full h-12 rounded-xl bg-purple-500/10 border-purple-500/30 text-purple-300 hover:bg-purple-500/20 hover:text-purple-200 transition-all"
            >
                <UserPlus className="ml-2" />
                إنشاء حساب جديد
            </Button>
        </div>
      </main>

      {/* Features Section */}
       <React.Suspense fallback={
        <div className="w-full max-w-4xl space-y-8 py-12">
            <div className="text-center space-y-2">
                <Skeleton className="h-9 w-3/4 mx-auto" />
                <Skeleton className="h-4 w-full max-w-2xl mx-auto" />
                <Skeleton className="h-4 w-1/2 max-w-2xl mx-auto" />
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-48 w-full" />
                ))}
            </div>
        </div>
      }>
        <FeaturesSection />
      </React.Suspense>
    </div>
  );
}
