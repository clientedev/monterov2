import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AdminLayout } from "@/components/AdminLayout";

export default function AdminChat() {
  const [reply, setReply] = useState("");
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["/api/admin/chat"],
    refetchInterval: 5000,
  });

  const mutation = useMutation({
    mutationFn: async ({ content, sessionId }: { content: string; sessionId: string }) => {
      return apiRequest("POST", "/api/admin/chat/reply", { content, sessionId });
    },
    onSuccess: () => {
      setReply("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chat"] });
    },
  });

  if (isLoading) return <div>Carregando...</div>;

  const sessions = messages.reduce((acc: any, msg: any) => {
    if (!acc[msg.sessionId]) acc[msg.sessionId] = [];
    acc[msg.sessionId].push(msg);
    return acc;
  }, {});

  const sessionIds = Object.keys(sessions).sort((a, b) => {
    const lastA = sessions[a][sessions[a].length - 1].createdAt;
    const lastB = sessions[b][sessions[b].length - 1].createdAt;
    return new Date(lastB).getTime() - new Date(lastA).getTime();
  });

  const handleReply = (sessionId: string) => {
    if (!reply.trim()) return;
    mutation.mutate({ content: reply, sessionId });
  };

  return (
    <AdminLayout>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
        <Card className="md:col-span-1 flex flex-col overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg">Conversas</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full">
              {sessionIds.map((sid) => (
                <button
                  key={sid}
                  onClick={() => setSelectedSession(sid)}
                  className={`w-full text-left p-4 border-b hover:bg-muted transition-colors ${
                    selectedSession === sid ? "bg-muted border-l-4 border-l-primary" : ""
                  }`}
                >
                  <p className="font-medium text-sm truncate">Sessão: {sid}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {sessions[sid][sessions[sid].length - 1].content}
                  </p>
                </button>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="md:col-span-3 flex flex-col overflow-hidden">
          {selectedSession ? (
            <>
              <CardHeader className="border-b">
                <CardTitle className="text-lg">Sessão: {selectedSession}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full p-4">
                  <div className="space-y-4">
                    {sessions[selectedSession].map((msg: any) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.isAdmin ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 text-sm ${
                            msg.isAdmin
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          {msg.content}
                          <p className="text-[10px] mt-1 opacity-70">
                            {new Date(msg.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
              <div className="p-4 border-t flex gap-2">
                <Input
                  placeholder="Escreva sua resposta..."
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleReply(selectedSession)}
                />
                <Button onClick={() => handleReply(selectedSession)} disabled={mutation.isPending}>
                  Enviar
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Selecione uma conversa para começar
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
