
'use client';

import { useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, updateProfile, EmailAuthProvider, reauthenticateWithCredential, updatePassword, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { User as UserIcon, KeyRound, Timer, Star, Eye, EyeOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import CustomLoader from '@/components/ui/custom-loader';

// --- Countdown Component ---
function BacCountdown() {
  const targetDate = useMemo(() => new Date('2026-06-10T08:00:00'), []);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
      <div className="bg-primary/10 p-4 rounded-lg">
        <p className="text-4xl font-bold text-primary">{timeLeft.days}</p>
        <p className="text-sm text-muted-foreground">أيام</p>
      </div>
      <div className="bg-primary/10 p-4 rounded-lg">
        <p className="text-4xl font-bold text-primary">{timeLeft.hours}</p>
        <p className="text-sm text-muted-foreground">ساعات</p>
      </div>
      <div className="bg-primary/10 p-4 rounded-lg">
        <p className="text-4xl font-bold text-primary">{timeLeft.minutes}</p>
        <p className="text-sm text-muted-foreground">دقائق</p>
      </div>
      <div className="bg-primary/10 p-4 rounded-lg">
        <p className="text-4xl font-bold text-primary">{timeLeft.seconds}</p>
        <p className="text-sm text-muted-foreground">ثواني</p>
      </div>
    </div>
  );
}


export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setDisplayName(currentUser?.displayName || '');
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleUpdateProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await updateProfile(user, { displayName });
      toast({
        title: 'تم تحديث الاسم بنجاح',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: error.message || 'فشل تحديث الملف الشخصي.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user || !user.email) return;
    if (newPassword !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'كلمتا المرور الجديدتان غير متطابقتين.',
      });
      return;
    }
    if (newPassword.length < 6) {
       toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'يجب أن تتكون كلمة المرور الجديدة من 6 أحرف على الأقل.',
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, oldPassword);
      await reauthenticateWithCredential(user, credential);
      // User re-authenticated successfully. Now change the password.
      await updatePassword(user, newPassword);
      
      toast({
        title: 'تم تغيير كلمة المرور بنجاح',
      });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error(error);
      let description = 'فشل تغيير كلمة المرور. يرجى المحاولة مرة أخرى.';
      if (error.code === 'auth/wrong-password') {
        description = 'كلمة المرور القديمة غير صحيحة.';
      } else if (error.code === 'auth/too-many-requests') {
        description = 'تم حظر هذا الحساب مؤقتًا بسبب كثرة محاولات تسجيل الدخول الفاشلة.';
      }
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: description,
      });
    } finally {
      setIsChangingPassword(false);
    }
  };


  if (authLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-10" dir="rtl">
        <h2 className="text-2xl font-bold">الرجاء تسجيل الدخول</h2>
        <p className="text-muted-foreground">يجب عليك تسجيل الدخول لعرض هذه الصفحة.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in-50" dir="rtl">
      {/* General Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon />
            الملف الشخصي
          </CardTitle>
          <CardDescription>
            تعديل معلومات حسابك الشخصي.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="displayName">الاسم الكامل</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="اسمك الذي سيظهر للآخرين"
            />
          </div>
          <Button onClick={handleUpdateProfile} disabled={isSaving}>
            {isSaving ? <CustomLoader /> : 'حفظ التغييرات'}
          </Button>
        </CardContent>
      </Card>
      
      {/* Change Password Card */}
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <KeyRound />
                تغيير كلمة المرور
            </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2 relative">
                <Label htmlFor="oldPassword">كلمة المرور القديمة</Label>
                <Input
                    id="oldPassword"
                    type={showOldPassword ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pr-10"
                />
                 <Button type="button" variant="ghost" size="icon" className="absolute left-1 top-7 h-7 w-7 text-muted-foreground" onClick={() => setShowOldPassword(!showOldPassword)}>
                    {showOldPassword ? <EyeOff /> : <Eye />}
                 </Button>
            </div>
            <div className="space-y-2 relative">
                <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pr-10"
                />
                <Button type="button" variant="ghost" size="icon" className="absolute left-1 top-7 h-7 w-7 text-muted-foreground" onClick={() => setShowNewPassword(!showNewPassword)}>
                    {showNewPassword ? <EyeOff /> : <Eye />}
                 </Button>
            </div>
            <div className="space-y-2 relative">
                <Label htmlFor="confirmPassword">تأكيد كلمة المرور الجديدة</Label>
                <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pr-10"
                />
                 <Button type="button" variant="ghost" size="icon" className="absolute left-1 top-7 h-7 w-7 text-muted-foreground" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <EyeOff /> : <Eye />}
                 </Button>
            </div>
            <Button onClick={handleChangePassword} disabled={isChangingPassword}>
                {isChangingPassword ? <CustomLoader /> : 'تغيير كلمة المرور'}
            </Button>
        </CardContent>
      </Card>

      {/* Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star />
            تقدمك في الدروس
          </CardTitle>
           <CardDescription>
            هذا الشريط يمثل مدى تقدمك في إكمال جميع الدروس المتاحة.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div>
             <div className="flex justify-between mb-1">
                <span className="text-base font-medium text-primary">مكتمل</span>
                <span className="text-sm font-medium text-primary">35%</span>
            </div>
            <Progress value={35} />
           </div>
        </CardContent>
      </Card>

      {/* Countdown Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer />
            العد التنازلي لشهادة البكالوريا
          </CardTitle>
          <CardDescription>الوقت المتبقي حتى 10 جوان 2026</CardDescription>
        </CardHeader>
        <CardContent>
            <BacCountdown />
        </CardContent>
      </Card>

    </div>
  );
}
