import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, User, Bot, MinusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import carolAvatar from "@assets/carolzinha.png";
import carolAnim from "@assets/carol_anim.mp4";

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export function ChatBubble() {
    // Chat component with Carol animated avatar support
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Olá! Sou a Carol, especialista da Monteiro Corretora. Como posso ajudar com seus seguros e planos de saúde hoje?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (isOpen && !isMinimized && scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
    }, [messages, isOpen, isMinimized]);

    useEffect(() => {
        const handleOpen = () => {
            setIsOpen(true);
            setIsMinimized(false);
        };
        window.addEventListener('open-carol-chat', handleOpen);
        return () => window.removeEventListener('open-carol-chat', handleOpen);
    }, []);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg: Message = { role: 'user', content: input.trim() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: [...messages, userMsg] })
            });

            if (!response.ok) {
                throw new Error('Falha ao conectar com a Carol.');
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let assistantContent = '';

            setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value, { stream: true });
                    assistantContent += chunk;

                    setMessages(prev => {
                        const newMessages = [...prev];
                        newMessages[newMessages.length - 1].content = assistantContent;
                        return newMessages;
                    });
                }
            }
        } catch (error: any) {
            toast({
                title: 'Erro no chat',
                description: error.message || 'Houve um problema ao processar sua mensagem.',
                variant: 'destructive'
            });
            // Remove the last user message if API failed, or add an error message.
            // For simplicity, just show toast.
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <div className="fixed bottom-6 right-6 z-50 group">
                {/* Pop-out Avatar */}
                <div className="absolute bottom-2 left-2 w-14 h-14 z-20 pointer-events-none transition-all duration-500 ease-out group-hover:-translate-y-12 group-hover:scale-[2.2] origin-bottom">
                    <img 
                        src={carolAvatar} 
                        className="w-full h-full object-contain mix-blend-multiply transition-opacity duration-300 group-hover:opacity-0 translate-y-1" 
                    />
                    <video 
                        src={carolAnim} 
                        autoPlay 
                        loop 
                        muted 
                        playsInline 
                        className="absolute inset-0 w-full h-full object-contain mix-blend-multiply opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
                    />
                </div>

                <Button
                    onClick={() => { setIsOpen(true); setIsMinimized(false); }}
                    className="h-16 rounded-full shadow-2xl bg-white hover:bg-slate-50 transition-all duration-300 flex items-center justify-center p-0 overflow-hidden w-16 hover:w-64 border-2 border-primary"
                >
                    <div className="flex items-center justify-start w-full h-full relative z-10 pl-16 pr-4">
                        <span className="text-primary font-bold whitespace-nowrap overflow-hidden transition-all duration-300 max-w-0 opacity-0 group-hover:max-w-[200px] group-hover:opacity-100">
                            Converse com a Carol
                        </span>
                    </div>
                </Button>
            </div>
        );
    }

    return (
        <Card className={`fixed right-6 z-50 shadow-2xl transition-all duration-300 flex flex-col overflow-hidden border-2 border-primary/20 ${isMinimized ? 'bottom-6 h-16 w-80' : 'bottom-6 w-96 max-h-[600px] h-[80vh]'}`}>
            <CardHeader className="bg-primary text-primary-foreground py-3 px-4 flex flex-row items-center justify-between shrink-0 cursor-pointer" onClick={() => setIsMinimized(!isMinimized)}>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full border-2 border-white/20 flex items-center justify-center bg-white shrink-0 overflow-hidden">
                            <video src={carolAnim} autoPlay loop muted playsInline className="w-full h-full object-cover scale-125 mix-blend-multiply" />
                        </div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-base font-bold">Carol - Especialista</CardTitle>
                        <p className="text-xs text-primary-foreground/80 font-medium">Online e pronta para ajudar</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground hover:bg-white/20 rounded-full" onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}>
                        <MinusCircle className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground hover:bg-white/20 rounded-full" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>
            </CardHeader>

            {!isMinimized && (
                <>
                    <CardContent 
                        ref={scrollContainerRef}
                        className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 relative hide-scrollbar"
                        style={{ overscrollBehavior: 'contain' }}
                    >
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                                <div className={`max-w-[85%] rounded-2xl p-3 ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 shadow-sm rounded-tl-sm'}`}>
                                    {msg.role === 'assistant' && i > 0 && (
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                                            <Bot className="w-3 h-3" /> Carol
                                        </div>
                                    )}
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-4 shadow-sm flex items-center gap-2">
                                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                                </div>
                            </div>
                        )}
                    </CardContent>

                    <CardFooter className="p-3 bg-white border-t border-slate-100 shrink-0">
                        <div className="w-full flex items-center gap-2 relative">
                            <Input
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                placeholder="Digite sua dúvida..."
                                className="pr-12 rounded-xl border-slate-200 bg-slate-50 focus-visible:ring-primary"
                                disabled={isLoading}
                            />
                            <Button
                                type="button"
                                onClick={() => handleSend()}
                                size="icon"
                                className="absolute right-1 top-1 h-8 w-8 rounded-lg"
                                disabled={!input.trim() || isLoading}
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardFooter>
                </>
            )}
        </Card>
    );
}
