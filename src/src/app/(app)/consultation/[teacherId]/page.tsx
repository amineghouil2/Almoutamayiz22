
'use client';

import { useState, useEffect, useTransition } from 'react';
import { useParams } from 'next/navigation';
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { getTeacherById } from '@/lib/services/teachers';
import type { TeacherData } from '@/lib/services/teachers';
import { 
    sendConsultationQuestion,
    getConsultationsForStudent,
    deleteConsultation,
    type Consultation
} from '@/lib/services/consultations';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Mail, CheckCircle, Trash2, XCircle, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import CustomLoader from '@/components/ui/custom-loader';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ConsultationPage() {
    const params = useParams();
    const teacherId = typeof params.teacherId === 'string' ? params.teacherId : '';
    const [teacher, setTeacher] = useState<(TeacherData & {subjectName: string}) | null>(null);

    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    
    const [question, setQuestion] = useState('');
    const [isSending, setIsSending] = useState(false);

    const [pastConsultations, setPastConsultations] = useState<Consultation[]>([]);
    const [isLoadingHistory, startHistoryTransition] = useTransition();
    
    const { toast } = useToast();
    
    useEffect(() => {
        getTeacherById(teacherId).then(setTeacher);
    }, [teacherId]);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setAuthLoading(false);
            if (currentUser && teacherId) {
                fetchHistory(currentUser.uid, teacherId);
            }
        });
        return () => unsubscribeAuth();
    }, [teacherId]);

    const fetchHistory = (studentId: string, teacherId: string) => {
        startHistoryTransition(async () => {
            try {
                const history = await getConsultationsForStudent(studentId, teacherId);
                setPastConsultations(history);
            } catch (error) {
                console.error(error);
                toast({ variant: 'destructive', title: 'خطأ', description: 'فشل تحميل سجل الاستشارات.'});
            }
        });
    };
    
    const handleSendQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!question.trim() || !user || !teacher) return;
        
        setIsSending(true);
        try {
            await sendConsultationQuestion({
                question: question,
                studentId: user.uid,
                studentName: user.displayName || 'طالب',
                teacherId: teacher.uid,
            });
            setQuestion('');
            toast({
                title: 'تم إرسال سؤالك بنجاح',
                description: `سيقوم الأستاذ بالرد في أقرب وقت ممكن.`
            });
            // Refresh history
            if(user && teacher) fetchHistory(user.uid, teacher.uid);
        } catch (error: any) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: 'خطأ',
                description: error.message || 'فشل إرسال السؤال. يرجى المحاولة مرة أخرى.',
            });
        } finally {
            setIsSending(false);
        }
    };
    
    const handleDelete = async (consultationId: string) => {
        try {
            await deleteConsultation(consultationId);
            setPastConsultations(prev => prev.filter(c => c.id !== consultationId));
            toast({ title: "تم حذف الاستشارة بنجاح" });
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'خطأ', description: 'فشل حذف الاستشارة.' });
        }
    };

    if (authLoading || !teacher) {
       return (
            <div className="flex flex-col h-full space-y-6">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
       );
    }

    if (!user) {
         return (
             <div className="text-center py-10" dir="rtl">
                <h2 className="text-2xl font-bold">الرجاء تسجيل الدخول</h2>
                <p className="text-muted-foreground">يجب عليك تسجيل الدخول لإرسال استشارة.</p>
            </div>
        )
    }

    const renderStatus = (consultation: Consultation) => {
        switch (consultation.status) {
            case 'answered':
                return (
                    <div className="border-t pt-4 mt-4">
                        <p className="text-sm font-semibold mb-2 text-primary flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" />
                            رد الأستاذ:
                        </p>
                        <p className="text-foreground/90 whitespace-pre-wrap">{consultation.answer}</p>
                        {consultation.answeredAt && (
                            <p className="text-xs text-muted-foreground mt-2">
                                {`تم الرد في: ${format(consultation.answeredAt.toDate(), "PPPp", { locale: ar })}`}
                            </p>
                        )}
                    </div>
                );
            case 'rejected':
                 return (
                     <div className="border-t pt-4 mt-4">
                         <p className="text-sm font-semibold text-destructive flex items-center gap-1">
                            <XCircle className="h-4 w-4" />
                             الحالة: تم رفض رسالتك.
                         </p>
                    </div>
                );
            default: // 'new' status
                 return (
                     <div className="border-t pt-4 mt-4">
                         <p className="text-sm font-semibold text-amber-400">الحالة: قيد الانتظار، لم يتم الرد بعد.</p>
                    </div>
                );
        }
    };

    return (
        <div className="flex flex-col h-full space-y-8" dir="rtl">
            {/* Header */}
            <header className="flex flex-col items-center text-center p-4 border-b bg-card rounded-xl">
                <Avatar className="h-16 w-16 mb-2">
                    <AvatarFallback>{teacher.firstName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <h1 className="text-2xl font-bold">استشارة في {teacher.subjectName}</h1>
                    <p className="text-muted-foreground">مع الأستاذ {teacher.firstName} {teacher.lastName}</p>
                </div>
            </header>

            {/* Input Form Card */}
            <Card>
                <CardHeader>
                    <CardTitle>اطرح سؤالك</CardTitle>
                    <CardDescription>اكتب سؤالك بوضوح ليتمكن الأستاذ من مساعدتك.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSendQuestion} className="space-y-4">
                        <Textarea
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="اكتب استشارتك أو سؤالك هنا..."
                            className="min-h-[150px]"
                            disabled={isSending}
                        />
                        <div className="flex justify-between items-center">
                            <Button type="submit" size="lg" disabled={isSending || !question.trim()}>
                                {isSending ? <CustomLoader /> : <Send className="ml-2 h-5 w-5" />}
                                {isSending ? 'جاري الإرسال...' : 'إرسال السؤال'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
            
            {/* History Section */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold">سجل استشاراتك السابقة</h2>
                {isLoadingHistory ? (
                     <div className="flex justify-center items-center h-40">
                        <CustomLoader className="h-8 w-8 text-primary" />
                    </div>
                ) : pastConsultations.length === 0 ? (
                    <div className="text-center text-muted-foreground py-10 flex flex-col items-center gap-4">
                         <Mail className="h-12 w-12" />
                        <p>لم تطرح أي أسئلة على هذا الأستاذ بعد.</p>
                    </div>
                ) : (
                    pastConsultations.map((item) => (
                        <Card key={item.id}>
                             <CardHeader className="flex flex-row justify-between items-start">
                                <div>
                                    <CardDescription>
                                        {item.createdAt ? `سُئل في: ${format(item.createdAt.toDate(), "PPPp", { locale: ar })}` : '...'}
                                    </CardDescription>
                                </div>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 h-8 w-8">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent dir="rtl">
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            هذا الإجراء لا يمكن التراجع عنه. سيؤدي هذا إلى حذف الاستشارة بشكل دائم.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(item.id)} className="bg-destructive hover:bg-destructive/90">
                                            نعم، قم بالحذف
                                        </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm font-semibold mb-2">سؤالك:</p>
                                    <p className="text-muted-foreground whitespace-pre-wrap">{item.question}</p>
                                </div>
                                {renderStatus(item)}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
