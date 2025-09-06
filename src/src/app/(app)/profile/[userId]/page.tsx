
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { getFullUserProfile, type FullUserProfile } from '@/lib/services/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, BookOpen, AlertCircle, Award } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

function ProfileLoadingSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <Card className="flex flex-col items-center justify-center text-center p-6">
                <Skeleton className="h-24 w-24 rounded-full" />
                <Skeleton className="h-7 w-48 mt-4" />
                <Skeleton className="h-4 w-32 mt-2" />
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-40" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
        </div>
    );
}

function UserProfileComponent() {
    const params = useParams();
    const userId = typeof params.userId === 'string' ? params.userId : '';
    const [profile, setProfile] = useState<FullUserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (userId) {
            setLoading(true);
            getFullUserProfile(userId)
                .then(data => {
                    if (data) {
                        setProfile(data);
                    } else {
                        setError('لم يتم العثور على ملف تعريف هذا المستخدم.');
                    }
                })
                .catch(err => {
                    console.error(err);
                    setError('حدث خطأ أثناء جلب بيانات الملف الشخصي.');
                })
                .finally(() => setLoading(false));
        }
    }, [userId]);

    if (loading) {
        return <ProfileLoadingSkeleton />;
    }

    if (error) {
        return (
            <Card className="bg-destructive/10 border-destructive">
                <CardContent className="p-4 flex items-center gap-2 text-destructive">
                    <AlertCircle />
                    <span>{error}</span>
                </CardContent>
            </Card>
        );
    }

    if (!profile) {
        return null;
    }

    const getStatusInfo = (status: FullUserProfile['subjects'][0]['status']) => {
        switch (status) {
            case 'on_track':
                return { text: 'جيد', color: 'text-green-400' };
            case 'slightly_behind':
                return { text: 'يوجد متسع من الوقت', color: 'text-yellow-400' };
            case 'behind':
                return { text: 'متأخر', color: 'text-red-400' };
            default:
                return { text: 'لم يبدأ بعد', color: 'text-gray-500' };
        }
    };

    return (
        <div className="animate-in fade-in-50 space-y-6" dir="rtl">
            <Card className="flex flex-col items-center justify-center text-center p-6 bg-card/80 border-border/60 shadow-lg">
                <Avatar className="h-24 w-24 border-4 border-primary">
                    <AvatarImage src={profile.photoURL} alt={profile.displayName} />
                    <AvatarFallback className="text-3xl">
                        {profile.displayName.charAt(0)}
                    </AvatarFallback>
                </Avatar>
                <h1 className="text-2xl font-bold mt-4">{profile.displayName}</h1>
                <div className="flex items-center gap-2 text-muted-foreground mt-1">
                    <Award className="h-4 w-4 text-yellow-400" />
                    <span>المستوى {profile.starLevel}: {profile.starTitle}</span>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between text-lg">
                            <span>النقاط</span>
                            <Star className="text-yellow-400" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold text-primary">{profile.totalPoints}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between text-lg">
                            <span>الدروس المكتملة</span>
                            <BookOpen className="text-blue-400" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold text-primary">{profile.completedLessonsCount}</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>التقدم في المواد</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {Object.values(profile.subjects).map(subject => {
                        const statusInfo = getStatusInfo(subject.status);
                        return (
                             <div key={subject.subjectId} className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold">{subject.subjectName}</span>
                                    <span className={`text-sm font-bold ${statusInfo.color}`}>{statusInfo.text}</span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {subject.lastCompletedLessonTitle || 'لم يكمل أي درس بعد'}
                                </div>
                                 <Progress value={(subject.completedCount / (subject.totalLessonsInSubject || 1)) * 100} className="h-2" />
                            </div>
                        )
                    })}
                </CardContent>
            </Card>
        </div>
    );
}


export default function ProfilePage() {
    return (
        <Suspense fallback={<ProfileLoadingSkeleton />}>
            <UserProfileComponent />
        </Suspense>
    )
}
