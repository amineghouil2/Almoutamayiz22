
'use client';

import { useState, useEffect } from 'react';
import { getLeaderboard, type LeaderboardUser } from '@/lib/services/lessons';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Trophy, Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { User as UserIcon } from 'lucide-react';
import { getStarLevel } from '@/lib/services/progress';
import CustomLoader from '@/components/ui/custom-loader';

const getPodiumClass = (rank: number) => {
    switch (rank) {
        case 1:
            return 'bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500 text-black';
        case 2:
            return 'bg-gradient-to-br from-slate-300 via-slate-200 to-gray-400 text-black';
        case 3:
            return 'bg-gradient-to-br from-amber-600 via-yellow-700 to-orange-800 text-white';
        default:
            return 'bg-[#E0F3A3]/10 border-[#c2e646]/30 backdrop-blur-sm';
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

export default function LeaderboardPage() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const data = await getLeaderboard(20); // Fetch top 20 users
                setLeaderboard(data);
            } catch (err: any) {
                console.error(err);
                setError('فشل تحميل لائحة المتقدمين.');
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, []);

    return (
        <div className="animate-in fade-in-50" dir="rtl">
            <style>
                {`
                    @keyframes shimmer {
                        0% { transform: translateX(-100%); }
                        100% { transform: translateX(170%); }
                    }
                `}
            </style>
            <header className="text-center mb-8">
                <h1 className="text-4xl font-headline font-bold text-primary flex items-center justify-center gap-3">
                    <Trophy className="h-10 w-10" />
                    لائحة المتقدمين
                </h1>
                <p className="text-muted-foreground mt-2">
                    شاهد ترتيب أكثر الطلاب اجتهادًا على المنصة. كن واحدًا منهم!
                </p>
            </header>

            {loading && (
                <div className="flex justify-center items-center h-64">
                    <CustomLoader className="h-12 w-12 text-primary" />
                </div>
            )}

            {error && (
                <Card className="bg-destructive/10 border-destructive">
                    <CardContent className="p-4 flex items-center gap-2 text-destructive">
                        <AlertTriangle />
                        <span>{error}</span>
                    </CardContent>
                </Card>
            )}

            {!loading && !error && (
                <div className="space-y-4">
                    {leaderboard.map((user, index) => {
                        const rank = index + 1;
                        const isPodium = rank <= 3;
                        return (
                            <Card 
                                key={user.userId} 
                                className={cn(
                                    "overflow-hidden relative transition-all duration-300", 
                                    getPodiumClass(rank)
                                )}
                            >
                                {isPodium && <ShimmerEffect />}
                                <CardContent className="p-3 flex items-center gap-4 relative">
                                    <div className="flex-shrink-0 text-2xl font-bold w-10 text-center">
                                        {rank}
                                    </div>
                                    <div className="relative">
                                        <Avatar className="h-12 w-12 border-2 border-primary/50">
                                            <AvatarImage src={user.photoURL || ''} alt={user.displayName} />
                                            <AvatarFallback>
                                                <UserIcon className="h-6 w-6" />
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>
                                    <div className="flex-grow">
                                        <h3 className="font-bold text-lg">{user.displayName || 'طالب متميز'}</h3>
                                    </div>
                                    <div className="flex items-center gap-1 font-bold text-lg">
                                        <span>{user.points}</span>
                                        <Star className="h-5 w-5 text-yellow-400" />
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                    {leaderboard.length === 0 && (
                        <p className="text-center text-muted-foreground py-10">
                            لائحة المتقدمين فارغة حاليًا. كن أول من يبدأ المنافسة!
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
