
'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { getSuggestionsForUser, addSuggestion, type Suggestion } from '@/lib/services/suggestions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail, MessageSquare, AlertTriangle, Send, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import CustomLoader from '@/components/ui/custom-loader';

function NewMessageDialog({ user, onMessageSent }: { user: User; onMessageSent: () => void; }) {
    const [suggestion, setSuggestion] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isDialogOpen, setDialogOpen] = useState(false);
    const { toast } = useToast();

    const handleSendSuggestion = async () => {
        if (!suggestion.trim() || !user) return;

        setIsSending(true);
        try {
            await addSuggestion({
                message: suggestion,
                userId: user.uid,
                userDisplayName: user.displayName,
                userEmail: user.email,
            });
            toast({
                title: 'تم إرسال رسالتك بنجاح',
                description: 'شكرًا لك على مساهمتك، ستظهر رسالتك في السجل الآن.',
            });
            setSuggestion('');
            setDialogOpen(false);
            onMessageSent(); // Trigger refresh
        } catch (error) {
            console.error("Failed to send suggestion:", error);
            toast({
                variant: 'destructive',
                title: 'خطأ في الإرسال',
                description: 'حدث خطأ أثناء إرسال رسالتك، يرجى المحاولة مرة أخرى.',
            });
        } finally {
            setIsSending(false);
        }
    }

    return (
        <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
           <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="ml-2 h-4 w-4"/>
                    رسالة جديدة
                </Button>
           </DialogTrigger>
           <DialogContent dir="rtl">
             <DialogHeader className="text-center">
               <DialogTitle>تواصل مع المدير</DialogTitle>
               <DialogDescription>
                  نحن نستمع إليك! كل رسالة تصلنا هي فرصة لنا لنتحسن.
               </DialogDescription>
             </DialogHeader>
             <div className="grid gap-4 py-4">
                <Textarea 
                    placeholder="اكتب هنا اقتراحك، ملاحظتك، أو أي مشكلة تواجهك..." 
                    value={suggestion}
                    onChange={(e) => setSuggestion(e.target.value)}
                    className="min-h-[150px]"
                />
             </div>
             <Button type="button" onClick={handleSendSuggestion} disabled={isSending || !suggestion.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(250,204,21,0.5)]">
                {isSending ? 'جاري الإرسال...' : (
                    <>
                        <Send className="ml-2 h-4 w-4"/>
                        إرسال الرسالة
                    </>
                )}
             </Button>
           </DialogContent>
         </Dialog>
    );
}

export default function MyMessagesPage() {
    const [user, setUser] = useState<User | null>(null);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchSuggestions = async (uid: string) => {
        setLoading(true);
        setError(null);
        try {
            const userSuggestions = await getSuggestionsForUser(uid);
            setSuggestions(userSuggestions);
        } catch (err: any) {
            setError(err.message || "حدث خطأ غير متوقع.");
            toast({
                variant: 'destructive',
                title: 'خطأ في جلب الرسائل',
                description: err.message,
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                fetchSuggestions(currentUser.uid);
            } else {
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, [toast]);

    const handleRefresh = () => {
        if (user) {
            fetchSuggestions(user.uid);
        }
    }


    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <CustomLoader className="h-12 w-12 text-primary" />
            </div>
        );
    }
    
    if (!user) {
        return (
             <div className="text-center py-10" dir="rtl">
                <h2 className="text-2xl font-bold">الرجاء تسجيل الدخول</h2>
                <p className="text-muted-foreground">يجب عليك تسجيل الدخول لعرض هذه الصفحة.</p>
            </div>
        )
    }

    if (error) {
        return (
            <Card className="bg-destructive/10 border-destructive" dir="rtl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle />
                        حدث خطأ
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p>{error}</p>
                    <p className="text-sm mt-2">قد يتطلب هذا الإجراء إنشاء فهرس في قاعدة البيانات. يرجى مراجعة المدير.</p>
                </CardContent>
            </Card>
        );
    }


    return (
        <div className="animate-in fade-in-50 space-y-6" dir="rtl">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-3">
                        <MessageSquare />
                        سجل رسائلي
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        هنا تجد جميع رسائلك للمدير والردود عليها.
                    </p>
                </div>
                <NewMessageDialog user={user} onMessageSent={handleRefresh} />
            </header>

            <div className="space-y-6">
                {suggestions.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground flex flex-col items-center gap-4">
                        <Mail className="h-16 w-16" />
                        <h3 className="text-xl font-semibold">لا توجد رسائل بعد</h3>
                        <p>لم تقم بإرسال أي رسائل حتى الآن. يمكنك إرسال رسالتك الأولى الآن.</p>
                    </div>
                ) : (
                    suggestions.map((s) => (
                        <Card key={s.id} className="overflow-hidden">
                            <CardHeader className="bg-card-foreground/5 p-4">
                                <CardDescription>
                                    أرسلت في: {s.createdAt ? format(s.createdAt.toDate(), "PPPp", { locale: ar }) : '...'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                <div>
                                    <p className="text-sm font-semibold mb-2">رسالتك:</p>
                                    <p className="text-muted-foreground whitespace-pre-wrap">{s.message}</p>
                                </div>
                                
                                {s.status === 'replied' && s.reply ? (
                                    <div className="border-t pt-4 mt-4">
                                        <p className="text-sm font-semibold mb-2 text-primary">رد المدير:</p>
                                        <p className="text-foreground/90 whitespace-pre-wrap">{s.reply}</p>
                                         {s.repliedAt && (
                                            <p className="text-xs text-muted-foreground mt-2">
                                                تم الرد في: {format(s.repliedAt.toDate(), "PPPp", { locale: ar })}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                     <div className="border-t pt-4 mt-4">
                                         <p className="text-sm font-semibold text-amber-400">الحالة: قيد الانتظار، لم يتم الرد بعد.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
