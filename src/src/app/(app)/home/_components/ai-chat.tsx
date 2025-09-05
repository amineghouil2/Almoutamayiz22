
'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BrainCircuit, Send, User, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { chat, type ChatHistory } from '@/ai/flows/chat-flow';
import CustomLoader from '@/components/ui/custom-loader';
import { useUserPersonalization } from '@/hooks/use-user-personalization';

interface Message {
    role: 'user' | 'model';
    text: string;
}

export default function AiChat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isPending, startTransition] = useTransition();
    const { user: currentUser } = useUserPersonalization();

    const { toast } = useToast();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isPending) return;

        const userMessage: Message = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');

        startTransition(async () => {
            try {
                // Convert Message[] to ChatHistory[]
                const history: ChatHistory = messages.map(msg => ({
                    role: msg.role,
                    parts: [{ text: msg.text }]
                }));
                
                const result = await chat({ prompt: currentInput, history });

                if (result.response) {
                    const modelMessage: Message = { role: 'model', text: result.response };
                    setMessages(prev => [...prev, modelMessage]);
                } else {
                     throw new Error("لم يتم تلقي أي استجابة.");
                }

            } catch (error: any) {
                console.error("AI chat error:", error);
                toast({
                    variant: 'destructive',
                    title: 'خطأ في الاتصال بالأستاذ IA',
                    description: error.message || 'فشل الحصول على استجابة. قد يكون مفتاح API غير صحيح أو غير موجود.'
                });
                // Remove the user's message if the call fails
                setMessages(prev => prev.slice(0, -1));
            }
        });
    };

    return (
        <Card className="bg-card border-border shadow-lg rounded-2xl flex flex-col h-[60vh]">
            <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-3 font-headline text-xl">
                    <BrainCircuit className="h-7 w-7 text-primary" />
                    الأستاذ IA
                </CardTitle>
                <CardDescription>اطرح أي سؤال يخطر ببالك واحصل على إجابة فورية.</CardDescription>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                        <Sparkles className="h-12 w-12 mb-4" />
                        <p className="text-lg font-semibold">أهلاً بك!</p>
                        <p>أنا هنا لمساعدتك في رحلتك الدراسية. كيف يمكنني خدمتك اليوم؟</p>
                    </div>
                )}
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'model' && (
                            <Avatar className="h-8 w-8 bg-primary/10 border border-primary/20">
                                <AvatarFallback className="bg-transparent">
                                    <BrainCircuit className="h-5 w-5 text-primary" />
                                </AvatarFallback>
                            </Avatar>
                        )}
                        <div
                            className={`max-w-xs md:max-w-md p-3 rounded-2xl ${
                                msg.role === 'user'
                                    ? 'bg-primary text-primary-foreground rounded-br-none'
                                    : 'bg-card-foreground/5 border rounded-bl-none'
                            }`}
                        >
                            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                        </div>
                         {msg.role === 'user' && (
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={currentUser?.photoURL ?? undefined} />
                                <AvatarFallback>
                                    <User className="h-4 w-4" />
                                </AvatarFallback>
                            </Avatar>
                        )}
                    </div>
                ))}
                 {isPending && (
                    <div className="flex items-start gap-3 justify-start">
                        <Avatar className="h-8 w-8 bg-primary/10 border border-primary/20">
                            <AvatarFallback className="bg-transparent">
                                <CustomLoader className="h-5 w-5 text-primary" />
                            </AvatarFallback>
                        </Avatar>
                        <div className="max-w-xs md:max-w-md p-3 rounded-2xl bg-card-foreground/5 border rounded-bl-none">
                            <p className="text-sm text-muted-foreground animate-pulse">يفكر...</p>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </CardContent>

            <div className="p-4 border-t bg-background/90 backdrop-blur-sm rounded-b-2xl">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="اسأل الأستاذ IA..."
                        disabled={isPending}
                    />
                    <Button type="submit" size="icon" disabled={isPending || !input.trim()}>
                        {isPending ? <CustomLoader className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                    </Button>
                </form>
            </div>
        </Card>
    );
}
