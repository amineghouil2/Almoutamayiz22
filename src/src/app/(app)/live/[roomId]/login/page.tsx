
'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, Eye, EyeOff, BrainCircuit, BookText, BookHeart } from 'lucide-react';

const roomDetails: { [key: string]: { name: string; icon: React.ElementType } } = {
    philosophy: { name: 'الفلسفة', icon: BrainCircuit },
    arabic: { name: 'اللغة العربية', icon: BookText },
    islamic: { name: 'العلوم الإسلامية', icon: BookHeart },
};

export default function LiveRoomLoginPage() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  
  const roomId = typeof params.roomId === 'string' ? params.roomId : '';
  const details = roomDetails[roomId] || { name: 'البث المباشر', icon: () => null };
  const Icon = details.icon;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Here you would typically validate the password against a backend service
    // For now, let's just show a toast and simulate loading.
    setTimeout(() => {
        toast({
            title: 'جاري التحقق...',
            description: 'سيتم توجيهك إلى الغرفة قريباً.',
        });
        setLoading(false);
        // On success, you would navigate to the actual live room:
        // router.push(`/live/session/${roomId}`);
    }, 1500);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-4">
        <Card className="w-full max-w-md" dir="rtl">
            <CardHeader className="text-center">
                <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-4">
                <Icon className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold">تسجيل الدخول إلى غرفة {details.name}</CardTitle>
                <CardDescription>أدخل كلمة المرور التي تلقيتها عند التسجيل.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2 relative">
                    <Label htmlFor="password">كلمة المرور</Label>
                    <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
                    />
                    <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute left-1 top-7 h-7 w-7 text-muted-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                    >
                    {showPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                    </Button>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'جاري الدخول...' : 'الدخول إلى الغرفة'}
                </Button>
                </form>
            </CardContent>
        </Card>
    </div>
  );
}
