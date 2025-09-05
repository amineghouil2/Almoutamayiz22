
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Gamepad2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function GamesPage() {
  const router = useRouter();
  
  return (
    <div 
        className="animate-in fade-in-50 flex flex-col items-center justify-center min-h-[70vh] p-4 text-center"
        dir="rtl"
    >
        <Card className="w-full max-w-lg bg-card/80 border-border/60 shadow-2xl backdrop-blur-lg p-8 rounded-3xl">
            <div className="flex flex-col items-center gap-4 mb-8">
                <div className="p-4 bg-primary/20 rounded-full animate-pulse">
                    <Gamepad2 className="h-12 w-12 text-primary" />
                </div>
                <h1 className="text-3xl font-bold font-headline">
                    مرحباً في قسم الألعاب
                </h1>
                <p className="text-muted-foreground">
                    اختبر معلوماتك، تحدى نفسك، واجمع النقاط لتتصدر لائحة المتقدمين!
                </p>
            </div>
            
            <Button 
                onClick={() => router.push('/games/select-subject')}
                size="lg" 
                className="w-full h-16 text-lg rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(250,204,21,0.5)] hover:shadow-[0_0_25px_rgba(250,204,21,0.7)] transition-all"
            >
                ابدأ اللعب الآن
                <ArrowLeft className="mr-3" />
            </Button>
        </Card>
    </div>
  );
}
