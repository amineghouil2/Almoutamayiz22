
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookText, BrainCircuit, Video, ArrowLeft, Radio, Heart, BookHeart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAllTeachers, type TeacherData } from "@/lib/services/teachers";
import CustomLoader from "@/components/ui/custom-loader";

export default function TeachersPage() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<TeacherData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllTeachers().then(data => {
        setTeachers(data);
        setLoading(false);
    }).catch(err => {
        console.error(err);
        setLoading(false);
    })
  }, []);

  const handleNavigate = (href: string) => {
    router.push(href);
  };
  
  const handlePrefetch = (href: string) => {
      router.prefetch(href);
  }

  const getTeacherIcon = (subjectId: string) => {
    if (subjectId === 'philosophy') return <BrainCircuit className="h-6 w-6 text-green-300" />;
    if (subjectId === 'arabic') return <BookText className="h-6 w-6 text-green-300" />;
    return <BookHeart className="h-6 w-6 text-green-300" />;
  }

  const getSubjectName = (subjectId: string) => {
      if (subjectId === 'philosophy') return 'الفلسفة';
      if (subjectId === 'arabic') return 'اللغة العربية';
      if (subjectId === 'islamic') return 'الشريعة الإسلامية';
      return 'مادة غير محددة';
  }

  const isTeacherLive = (subjectId: string) => {
      const teacher = teachers.find(t => t.subjectId === subjectId);
      return teacher?.isLive || false;
  }

  return (
    <div className="animate-in fade-in-50 space-y-6" dir="rtl">
      <header className="text-center">
        <h1 className="text-4xl font-headline font-bold text-primary">قسم الأساتذة</h1>
        <p className="text-muted-foreground mt-2">
          تواصل مع أساتذة متخصصين واحضر بثوثًا مباشرة تفاعلية.
        </p>
      </header>
      
      {/* Live Broadcasts Card */}
      <Card className="bg-blue-900/20 border-blue-400/30 backdrop-blur-sm shadow-2xl shadow-blue-500/10 rounded-2xl transition-all overflow-hidden text-center">
        <CardHeader>
          <div className="flex flex-col items-center gap-3 text-blue-300">
            <Video className="h-10 w-10" />
            <CardTitle className="text-2xl font-bold">البثوث المباشرة</CardTitle>
          </div>
          <CardDescription className="text-blue-300/80 pt-2">
            انضم إلى جلسات تفاعلية مباشرة مع الأساتذة لمراجعة الدروس وحل التمارين.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-2 space-y-4">
          {/* Philosophy Room */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-black/30">
            <div className="flex items-center gap-3">
              <BrainCircuit className="h-6 w-6 text-blue-300" />
              <span className="font-semibold text-lg text-white">غرفة الفلسفة</span>
              {isTeacherLive('philosophy') && <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>}
            </div>
            <Button onClick={() => handleNavigate('/live/philosophy')} onPointerDown={() => handlePrefetch('/live/philosophy')} variant="secondary" className="bg-blue-500/80 hover:bg-blue-500 text-white rounded-lg">
              <Radio className="ml-2 h-4 w-4 animate-pulse" />
              انضم الآن
            </Button>
          </div>
          {/* Arabic Room */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-black/30">
            <div className="flex items-center gap-3">
              <BookText className="h-6 w-6 text-blue-300" />
              <span className="font-semibold text-lg text-white">غرفة اللغة العربية</span>
               {isTeacherLive('arabic') && <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>}
            </div>
            <Button variant="secondary" className="bg-slate-600 text-white rounded-lg cursor-not-allowed">
              مغلق حاليًا
            </Button>
          </div>
           {/* Islamic Sciences Room */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-black/30">
            <div className="flex items-center gap-3">
              <BookHeart className="h-6 w-6 text-blue-300" />
              <span className="font-semibold text-lg text-white">غرفة العلوم الإسلامية</span>
               {isTeacherLive('islamic') && <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>}
            </div>
            <Button variant="secondary" className="bg-slate-600 text-white rounded-lg cursor-not-allowed">
              مغلق حاليًا
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Consultations Grid */}
      {loading ? (
        <div className="flex justify-center p-8">
            <CustomLoader className="h-10 w-10" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teachers.map((teacher) => (
            <Card key={teacher.uid} 
                onClick={() => handleNavigate(`/consultation/${teacher.uid}`)} 
                onPointerDown={() => handlePrefetch(`/consultation/${teacher.uid}`)}
                className="bg-green-900/20 border-green-500/30 backdrop-blur-sm shadow-2xl shadow-green-500/10 rounded-2xl transition-all overflow-hidden flex flex-col text-center hover:border-green-400/60 cursor-pointer">
                <CardContent className="p-4 flex flex-col items-center justify-center gap-3 flex-grow">
                <div className="p-2 bg-green-400/10 rounded-full mb-1">
                    {getTeacherIcon(teacher.subjectId)}
                </div>
                <div className="text-center flex-grow">
                    <p className="text-lg font-bold text-center text-white">استشارة في {getSubjectName(teacher.subjectId)}</p>
                    <p className="text-xs text-center text-green-300/80 mt-1">
                    مع الأستاذ {teacher.firstName} {teacher.lastName}.
                    </p>
                </div>
                <Button size="sm" className="w-full mt-2 rounded-lg bg-green-500/80 hover:bg-green-500 text-white pointer-events-none">
                    اطلب استشارتك
                    <ArrowLeft className="mr-2 h-4 w-4" />
                </Button>
                </CardContent>
            </Card>
            ))}
        </div>
      )}
    </div>
  );
}
