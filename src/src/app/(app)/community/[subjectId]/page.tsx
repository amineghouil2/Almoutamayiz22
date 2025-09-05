
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, storage } from '@/lib/firebase/config';
import { getSubjectById } from '@/lib/services/lessons';
import { sendMessage, listenToMessages, reactToMessage, type ChatMessage } from '@/lib/services/chat';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Send, User as UserIcon, Heart, ArrowRight, ImagePlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import CustomLoader from '@/components/ui/custom-loader';
import { cn } from '@/lib/utils';


function ChatHeader({ subjectName }: { subjectName: string }) {
    const router = useRouter();
    return (
        <header className="absolute top-0 left-0 right-0 z-20 flex items-center p-2 bg-background/80 backdrop-blur-sm border-b">
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.back()}>
                <ArrowRight className="h-5 w-5" />
            </Button>
            <div className="flex-1 text-center">
                <h1 className="text-md font-bold">{subjectName ? `ملتقى ${subjectName}` : 'جاري التحميل...'}</h1>
            </div>
            <div className="w-10"></div>
        </header>
    )
}

export default function ChatRoomPage() {
    const params = useParams();
    const router = useRouter();
    const subjectId = typeof params.subjectId === 'string' ? params.subjectId : '';

    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);

    const [subjectName, setSubjectName] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [messagesLoading, setMessagesLoading] = useState(true);
    const [reactingTo, setReactingTo] = useState<string | null>(null);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    useEffect(() => {
        getSubjectById(subjectId).then(subject => {
            if (subject) setSubjectName(subject.name);
        });

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setAuthLoading(false);
        });

        return () => unsubscribe();
    }, [subjectId]);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [authLoading, user, router]);


    useEffect(() => {
        if (!subjectId) return;

        setMessagesLoading(true);
        const unsubscribe = listenToMessages(subjectId, (newMessages) => {
            setMessages(newMessages);
            setMessagesLoading(false);
        });

        return () => unsubscribe();
    }, [subjectId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    
    const handleReaction = async (messageId: string) => {
        if (!user || reactingTo) return;
        setReactingTo(messageId);
        try {
            await reactToMessage(subjectId, messageId, user.uid, 'love');
        } catch (error: any) {
            console.error('Failed to react:', error);
            toast({
                variant: 'destructive',
                title: 'خطأ',
                description: 'فشل التفاعل مع الرسالة.',
            });
        } finally {
            setReactingTo(null);
        }
    };
    
    const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user || !subjectId || isSending) return;

        const textContent = newMessage.trim();
        const imageFile = fileInputRef.current?.files?.[0];

        if (!textContent && !imageFile) return;
        
        setIsSending(true);

        try {
            let imageUrl: string | undefined = undefined;

            if (imageFile) {
                toast({ title: 'جاري رفع الصورة...' });
                const storageRef = ref(storage, `chat_images/${subjectId}/${Date.now()}_${imageFile.name}`);
                const snapshot = await uploadBytes(storageRef, imageFile);
                imageUrl = await getDownloadURL(snapshot.ref);
            }
            
            await sendMessage({
                subjectId,
                userId: user.uid,
                userName: user.displayName || 'طالب',
                userAvatar: user.photoURL || '',
                text: textContent,
                imageUrl,
            });

            setNewMessage('');
            if (fileInputRef.current) fileInputRef.current.value = "";
        } catch (error: any) {
             console.error('Failed to send message:', error);
            toast({
                variant: 'destructive',
                title: 'خطأ',
                description: 'فشل إرسال الرسالة. ' + error.message,
            });
        } finally {
            setIsSending(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const form = e.currentTarget.form;
        if (form) {
            handleSendMessage(new Event('submit', { cancelable: true }) as unknown as React.FormEvent<HTMLFormElement>);
        }
    }
    
    if (authLoading) {
        return <div className="flex justify-center items-center h-screen"><CustomLoader className="h-10 w-10" /></div>;
    }

    if (!user) {
        return null; // Redirecting in useEffect
    }

    return (
        <div className="flex flex-col h-full w-full bg-black" dir="rtl">
            <ChatHeader subjectName={subjectName} />
            
            <main className="flex-1 overflow-y-auto pt-16 pb-4 px-2 space-y-4">
                {messagesLoading && (
                    <div className="space-y-4">
                        {[...Array(8)].map((_, i) => (
                             <div key={i} className={`flex items-start gap-2.5 ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                                <Skeleton className="h-8 w-8 rounded-full" />
                                <div className="flex-1 space-y-2 max-w-xs">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-10 w-48" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {!messagesLoading && messages.map(msg => {
                    const isCurrentUser = msg.userId === user.uid;
                    const loveCount = msg.reactions?.love?.length || 0;
                    const isLovedByCurrentUser = msg.reactions?.love?.includes(user.uid);

                    return (
                        <div key={msg.id} className={`flex flex-col gap-1 ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                            <div className={`flex items-end gap-2 max-w-[80%]`}>
                                {!isCurrentUser && (
                                    <Link href={`/profile/${msg.userId}`}>
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={msg.userAvatar ?? ''} />
                                            <AvatarFallback><UserIcon className="h-3 w-3" /></AvatarFallback>
                                        </Avatar>
                                    </Link>
                                )}
                               <div className={`flex flex-col gap-1.5`}>
                                     {!isCurrentUser && (
                                        <Link href={`/profile/${msg.userId}`}>
                                            <p className="text-xs font-semibold text-muted-foreground px-2">{msg.userName}</p>
                                        </Link>
                                    )}
                                    <div className={cn(
                                        "p-2.5 rounded-xl text-sm leading-relaxed",
                                        isCurrentUser
                                        ? 'bg-primary text-primary-foreground rounded-br-none' 
                                        : 'bg-zinc-800 text-zinc-200 rounded-bl-none'
                                    )}>
                                        {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
                                        {msg.imageUrl && (
                                            <Image 
                                                src={msg.imageUrl} 
                                                alt="صورة مرسلة"
                                                width={250}
                                                height={250}
                                                className="rounded-md mt-2 max-w-full h-auto"
                                            />
                                        )}
                                    </div>
                               </div>
                                {isCurrentUser && (
                                    <Link href={`/profile/${msg.userId}`}>
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={msg.userAvatar ?? ''} />
                                            <AvatarFallback><UserIcon className="h-3 w-3" /></AvatarFallback>
                                        </Avatar>
                                    </Link>
                                )}
                            </div>
                             <div className={`flex items-center gap-2 ${isCurrentUser ? 'ml-8' : 'mr-8'}`}>
                                <span className="text-xs text-zinc-500">
                                    {msg.createdAt ? formatDistanceToNow(msg.createdAt.toDate(), { locale: ar, addSuffix: true }) : '...'}
                                </span>
                                {loveCount > 0 && (
                                     <div className="flex items-center gap-1 text-zinc-400">
                                        <Heart className={cn("h-3 w-3", isLovedByCurrentUser ? "fill-pink-500 text-pink-500" : "text-zinc-500")} />
                                        <span className="text-xs font-semibold">{loveCount}</span>
                                    </div>
                                )}
                                <button onClick={() => handleReaction(msg.id)} disabled={reactingTo === msg.id}>
                                     <Heart className={cn(
                                         "h-4 w-4 transition-colors",
                                         isLovedByCurrentUser 
                                         ? "fill-pink-500 text-pink-500" 
                                         : "text-zinc-600 hover:text-pink-400"
                                     )} />
                                </button>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </main>

            <footer className="p-2 bg-background/80 backdrop-blur-sm border-t">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isSending}>
                        <ImagePlus />
                    </Button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />

                    <Input 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="اكتب رسالتك..."
                        disabled={isSending}
                        className="h-10 text-base"
                    />
                    <Button type="submit" size="icon" className="h-10 w-10" disabled={isSending || (!newMessage.trim() && !fileInputRef.current?.files?.length)}>
                        {isSending ? <CustomLoader className="h-4 w-4"/> : <Send className="h-4 w-4" />}
                    </Button>
                </form>
            </footer>
        </div>
    );
}
