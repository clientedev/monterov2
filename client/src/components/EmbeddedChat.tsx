import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export function EmbeddedChat({ initialMessage = "Olá! Como posso ajudar você a entender melhor este serviço?" }) {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: initialMessage }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
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
                throw new Error('Falha ao conectar com a IA.');
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
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[500px]">
            <div className="bg-primary px-6 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20 relative">
                        <Bot className="w-6 h-6 text-white" />
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-primary" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white">Assistente Especialista</h3>
                        <p className="text-xs text-primary-200 font-medium">Tire suas dúvidas sobre o serviço em tempo real</p>
                    </div>
                </div>
            </div>

            <div 
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 relative scroll-smooth" 
                style={{ overscrollBehavior: 'contain' }}
            >
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                        <div className={`max-w-[85%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 shadow-sm rounded-tl-sm'}`}>
                            {msg.role === 'assistant' && i > 0 && (
                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
                                    <Bot className="w-3 h-3" /> Assistente
                                </div>
                            )}
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-2">
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                        </div>
                    </div>
                )}

            </div>

            <div className="p-4 bg-white border-t border-slate-100 shrink-0">
                <form onSubmit={handleSend} className="flex flex-col sm:flex-row gap-3">
                    <Input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Quais são as coberturas deste serviço?"
                        className="flex-1 rounded-xl border-slate-200 bg-slate-50 h-12 focus-visible:ring-primary"
                        disabled={isLoading}
                    />
                    <Button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="h-12 px-6 rounded-xl font-bold w-full sm:w-auto shrink-0"
                    >
                        <Send className="w-4 h-4 mr-2" />
                        Enviar
                    </Button>
                </form>
            </div>
        </div>
    );
}
