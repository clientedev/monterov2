import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { MessageCircle, X, Send } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ScrollArea } from "@/components/ui/scroll-area";

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sessionId] = useState(() => {
    const saved = localStorage.getItem("chat_session_id");
    if (saved) return saved;
    const newId = Math.random().toString(36).substring(7);
    localStorage.setItem("chat_session_id", newId);
    return newId;
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["/api/chat/messages", { sessionId }],
    enabled: isOpen,
    refetchInterval: 3000,
  });

  const mutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", "/api/chat/messages", { content, sessionId });
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/chat/messages", { sessionId }] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    mutation.mutate(message);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <Button
          onClick={() => setIsOpen(true)}
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      ) : (
        <Card className="w-80 h-96 flex flex-col shadow-2xl border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
            <CardTitle className="text-sm font-bold">Chat de Suporte</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full p-4">
              <div className="space-y-4">
                {messages.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground mt-4">
                    Olá! Como podemos ajudar hoje?
                  </p>
                )}
                {messages.map((msg: any) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isAdmin ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-2 text-xs ${
                        msg.isAdmin
                          ? "bg-muted text-muted-foreground"
                          : "bg-primary text-primary-foreground"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="p-4 border-t">
            <form onSubmit={handleSubmit} className="flex w-full gap-2">
              <Input
                placeholder="Mensagem..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="h-9 text-xs"
              />
              <Button type="submit" size="icon" className="h-9 w-9" disabled={mutation.isPending}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
