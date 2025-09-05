
'use client';

import { Card } from "@/components/ui/card";
import { BookOpen, Brain, Users, FileCheck, Trophy, Gamepad2, Video } from "lucide-react";


const features = [
    {
        icon: BookOpen,
        title: "دروس شاملة ومنظمة",
        description: "ملخصات مركزة، فيديوهات توضيحية، ومواضيع قابلة للتحميل لكل المواد."
    },
    {
        icon: FileCheck,
        title: "تصحيح المقالات الفلسفية",
        description: "احصل على تقييم فوري لمقالاتك الفلسفية مع نصائح لتحسين المنهجية والأفكار."
    },
     {
        icon: Video,
        title: "بثوث مباشرة مع خبراء",
        description: "انضم إلى جلسات تفاعلية مباشرة مع أساتذة متخصصين لمراجعة الدروس وحل التمارين."
    },
    {
        icon: Trophy,
        title: "منافسة وتحدي",
        description: "اجمع النقاط من خلال إكمال الدروس وحل الامتحانات، وتصدر لائحة المتقدمين."
    },
    {
        icon: Users,
        title: "مجتمع تفاعلي",
        description: "تواصل مع زملائك، تبادل الأفكار، واطرح أسئلتك في مساحة آمنة ومحفزة."
    },
    {
        icon: Gamepad2,
        title: "ألعاب تعليمية",
        description: "اختبر معلوماتك بطرق ممتعة ومبتكرة لترسيخ المفاهيم التي تعلمتها."
    },
]

export function FeaturesSection() {
    return (
         <section className="w-full max-w-4xl space-y-8 py-12">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold font-headline text-primary">كل ما تحتاجه للتميز في مكان واحد</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                    لقد صممنا "المتميز" ليكون رفيقك الدراسي الشامل، حيث جمعنا لك أدوات مبتكرة ومحتوى غني لمساعدتك على تحقيق التفوق.
                </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((feature, index) => (
                    <Card key={index} className="bg-card/80 border-border/60 shadow-lg text-center flex flex-col items-center p-6 hover:border-primary/50 transition-all">
                        <div className="p-3 bg-primary/10 rounded-full mb-4">
                            <feature.icon className="h-8 w-8 text-primary"/>
                        </div>
                        <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground flex-grow">{feature.description}</p>
                    </Card>
                ))}
            </div>
        </section>
    );
}
