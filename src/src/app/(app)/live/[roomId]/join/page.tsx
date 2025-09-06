
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Facebook, Loader2, BookHeart, BrainCircuit, BookText, Hash, Clock } from 'lucide-react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { submitLiveRequest } from '@/lib/services/liveRequests';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';

const roomDetails: { [key: string]: { name: string; icon: React.ElementType } } = {
    philosophy: { name: 'الفلسفة', icon: BrainCircuit },
    arabic: { name: 'اللغة العربية', icon: BookText },
    islamic: { name: 'العلوم الإسلامية', icon: BookHeart },
};

const joinSchema = z.object({
  facebookUrl: z.string().url({ message: "الرجاء إدخال رابط صحيح." }).refine(
    (url) => /^https?:\/\/(www\.)?facebook\.com\/.+$/.test(url),
    "يجب أن يكون الرابط من موقع فيسبوك."
  ),
  transactionId: z.string().min(5, { message: 'الرجاء إدخال رقم معاملة صحيح.' }),
  transactionTime: z.string().min(8, { message: 'الرجاء إدخال وقت وتاريخ صحيحين.' }),
});

type JoinFormData = z.infer<typeof joinSchema>;

export default function LiveRoomJoinPage() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();

  const { control, handleSubmit, formState: { errors } } = useForm<JoinFormData>({
    resolver: zodResolver(joinSchema),
    defaultValues: {
        facebookUrl: '',
        transactionId: '',
        transactionTime: ''
    }
  });

  useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          setUser(currentUser);
          setAuthLoading(false);
          if (!currentUser) {
              toast({ variant: 'destructive', title: 'خطأ', description: 'يجب تسجيل الدخول لتقديم طلب.' });
              router.push('/login');
          }
      });
      return () => unsubscribe();
  }, [router, toast]);

  const roomId = typeof params.roomId === 'string' ? params.roomId : '';
  const details = roomDetails[roomId] || { name: 'البث المباشر', icon: () => null };

  const handleJoin = async (data: JoinFormData) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'خطأ', description: 'المستخدم غير مسجل.' });
        return;
    }
    setLoading(true);
    try {
        await submitLiveRequest({
            user,
            roomId,
            roomName: details.name,
            facebookUrl: data.facebookUrl,
            transactionId: data.transactionId,
            transactionTime: data.transactionTime,
        });

        toast({
            title: 'تم إرسال طلبك بنجاح',
            description: 'ستتم مراجعة طلبك وتأكيده في أقرب وقت. سيتم اعلامك عند القبول.',
        });
        router.push(`/teachers`);
    } catch (error: any) {
         toast({
            variant: 'destructive',
            title: 'فشل إرسال الطلب',
            description: error.message || 'حدث خطأ ما، يرجى المحاولة مرة أخرى.',
        });
    } finally {
        setLoading(false);
    }
  };
  
  if (authLoading) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[70vh] p-4">
              <Card className="w-full max-w-lg">
                  <CardHeader>
                    <Skeleton className="h-8 w-8 mx-auto rounded-full" />
                    <Skeleton className="h-7 w-3/4 mx-auto mt-4" />
                    <Skeleton className="h-4 w-full mx-auto mt-2" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-12 w-full mt-2" />
                  </CardContent>
              </Card>
          </div>
      )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-4">
        <Card className="w-full max-w-lg" dir="rtl">
        <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-4">
            <UserPlus className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">الانضمام إلى بث {details.name}</CardTitle>
            <CardDescription>املأ المعلومات التالية لإرسال طلب الانضمام.</CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSubmit(handleJoin)} className="space-y-4">
              
            <Alert>
                <Facebook className="h-4 w-4" />
                <AlertTitle>ملاحظة هامة</AlertTitle>
                <AlertDescription>
                    لتسريع عملية قبولك في المجموعة بعد الموافقة، يرجى إرسال طلب صداقة إلى هذا الحساب:
                    <Link href="https://www.facebook.com/share/1CN9fV6dFQ/" target="_blank" rel="noopener noreferrer" className="text-blue-400 font-semibold hover:underline mr-1">
                        اضغط هنا
                    </Link>
                </AlertDescription>
            </Alert>

            <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني (نفس بريد حسابك)</Label>
                <Input id="email" type="email" value={user?.email || ''} disabled />
            </div>

            <div className="space-y-2">
                <Label htmlFor="facebookUrl">رابط حسابك على فيسبوك</Label>
                <div className="relative">
                    <Controller name="facebookUrl" control={control} render={({ field }) => (
                        <Input id="facebookUrl" type="url" placeholder="https://www.facebook.com/yourprofile" {...field} className="pr-8"/>
                    )}/>
                    <Facebook className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"/>
                </div>
                {errors.facebookUrl && <p className="text-destructive text-sm mt-1">{errors.facebookUrl.message}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="transactionId">رقم المعاملة</Label>
                 <div className="relative">
                    <Controller name="transactionId" control={control} render={({ field }) => (
                        <Input id="transactionId" type="text" placeholder="اكتب رقم المعاملة الموجود في الوصل" {...field} className="pr-8"/>
                    )}/>
                    <Hash className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"/>
                </div>
                {errors.transactionId && <p className="text-destructive text-sm mt-1">{errors.transactionId.message}</p>}
            </div>

             <div className="space-y-2">
                <Label htmlFor="transactionTime">وقت وتاريخ العملية</Label>
                 <div className="relative">
                    <Controller name="transactionTime" control={control} render={({ field }) => (
                        <Input id="transactionTime" type="text" placeholder="مثال: 14:30 - 2024/07/25" {...field} className="pr-8"/>
                    )}/>
                    <Clock className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"/>
                </div>
                {errors.transactionTime && <p className="text-destructive text-sm mt-1">{errors.transactionTime.message}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={loading || authLoading}>
                {loading ? <Loader2 className="animate-spin" /> : 'إرسال طلب الانضمام'}
            </Button>
            </form>
        </CardContent>
        </Card>
    </div>
  );
}
