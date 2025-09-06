
'use client';

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BrainCircuit, BookText, BookHeart, DoorOpen, UserPlus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const roomDetails: { [key: string]: { name: string; icon: React.ElementType } } = {
    philosophy: { name: 'الفلسفة', icon: BrainCircuit },
    arabic: { name: 'اللغة العربية', icon: BookText },
    islamic: { name: 'العلوم الإسلامية', icon: BookHeart },
};

export default function LiveRoomGatewayPage() {
    const params = useParams();
    const router = useRouter();
    const roomId = typeof params.roomId === 'string' ? params.roomId : '';
    const details = roomDetails[roomId] || { name: 'بث مباشر', icon: () => null };
    const Icon = details.icon;

    return (
        <div 
            className="animate-in fade-in-50 flex flex-col items-center justify-center min-h-[70vh] p-4 text-center"
            dir="rtl"
        >
            <Card className="w-full max-w-md bg-card/80 border-border/60 shadow-2xl backdrop-blur-lg p-8 rounded-3xl">
                <div className="flex flex-col items-center gap-4 mb-8">
                    <div className="p-4 bg-primary/20 rounded-full">
                        <Icon className="h-12 w-12 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold font-headline">
                        بوابة الدخول إلى غرفة {details.name}
                    </h1>
                    <p className="text-muted-foreground">
                        اختر طريقة الدخول المناسبة لك للبدء في المراجعة.
                    </p>
                </div>

                <div className="space-y-4">
                     <Link href={`/live/${roomId}/join`} className="w-full block">
                        <Button 
                            size="lg" 
                            className="w-full h-16 text-base rounded-xl bg-green-500/20 border-2 border-green-500/50 text-green-300 hover:bg-green-500/30 hover:text-green-200 transition-all shadow-lg shadow-green-500/10"
                        >
                            <UserPlus className="ml-3" />
                            الانضمام الى almoutamayiz live
                        </Button>
                    </Link>
                    <Link href={`/live/${roomId}/login`} className="w-full block">
                        <Button 
                            size="lg" 
                            className="w-full h-16 text-lg rounded-xl bg-blue-500/20 border-2 border-blue-500/50 text-blue-300 hover:bg-blue-500/30 hover:text-blue-200 transition-all shadow-lg shadow-blue-500/10"
                        >
                            <DoorOpen className="ml-3" />
                            لقد سجلت بالفعل
                        </Button>
                    </Link>
                </div>
            </Card>
        </div>
    );
}
