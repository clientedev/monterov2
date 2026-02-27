import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Contact, Task } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
    PhoneCall,
    Search,
    Calendar,
    CheckCircle2,
    Clock,
    AlertCircle,
    TrendingUp,
    UserPlus,
    History
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

export default function ProspectingPage() {
    const { toast } = useToast();
    const [selectedContactId, setSelectedContactId] = useState<string>("");
    const [callOutcome, setCallOutcome] = useState<string>("connected");
    const [interestLevel, setInterestLevel] = useState<string>("medium");
    const [notes, setNotes] = useState("");
    const [nextContactDate, setNextContactDate] = useState("");

    const { data: contacts } = useQuery<Contact[]>({
        queryKey: ["/api/contacts"]
    });

    const { data: tasks } = useQuery<Task[]>({
        queryKey: ["/api/tasks"]
    });

    const { data: prospectingHistory } = useQuery<any[]>({
        queryKey: ["/api/prospecting"]
    });

    const saveProspectingMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await apiRequest("POST", "/api/prospecting", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/prospecting"] });
            queryClient.invalidateQueries({ queryKey: ["/api/interactions"] });
            toast({
                title: "Sucesso",
                description: "Prospecção registrada com sucesso.",
            });
            // Reset form
            setNotes("");
            setNextContactDate("");
        }
    });

    const scheduleTaskMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await apiRequest("POST", "/api/tasks", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedContactId) {
            toast({
                title: "Erro",
                description: "Selecione um contato para prosseguir.",
                variant: "destructive"
            });
            return;
        }

        saveProspectingMutation.mutate({
            contactId: parseInt(selectedContactId),
            callOutcome,
            interestLevel,
            notes,
            checklistData: JSON.stringify({
                talkedToDecisionMaker: true,
                presentedOffers: true,
            })
        });

        if (nextContactDate) {
            scheduleTaskMutation.mutate({
                title: `Retorno de Prospecção: ${contacts?.find(c => c.id === parseInt(selectedContactId))?.name}`,
                description: `Retornar contato conforme notas: ${notes}`,
                status: "todo",
                priority: interestLevel === "high" ? "high" : "medium",
                contactId: parseInt(selectedContactId),
                dueDate: new Date(nextContactDate).toISOString(),
                assignedTo: 1, // Defaulting to admin for now
            });
        }
    };

    const upcomingAlerts = tasks?.filter(t =>
        t.status === "todo" &&
        t.dueDate &&
        new Date(t.dueDate) >= new Date()
    ).sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()) || [];

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Célula de Prospecção</h2>
                <p className="text-slate-500 mt-2 font-medium">Gerencie suas chamadas ativas e acompanhamentos.</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Call Selection and Form */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="premium-card border-none shadow-xl">
                        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                            <div className="flex items-center gap-3 text-primary">
                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <PhoneCall className="h-5 w-5" />
                                </div>
                                <CardTitle>Registro de Chamada</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Empresa/Contato</Label>
                                        <Select value={selectedContactId} onValueChange={setSelectedContactId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione um contato" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {contacts?.map(c => (
                                                    <SelectItem key={c.id} value={c.id.toString()}>
                                                        {c.name} {c.type === 'company' ? '(Empresa)' : '(Pessoa)'}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Resultado da Ligação</Label>
                                        <Select value={callOutcome} onValueChange={setCallOutcome}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="connected">Conectado / Falamos</SelectItem>
                                                <SelectItem value="no_answer">Não atende</SelectItem>
                                                <SelectItem value="busy">Ocupado</SelectItem>
                                                <SelectItem value="wrong_number">Número Errado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <Label>Checklist de Qualificação</Label>
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-white hover:bg-slate-50 transition-colors cursor-pointer group">
                                            <div className="h-5 w-5 rounded border border-slate-300 group-hover:border-primary flex items-center justify-center">
                                                <CheckCircle2 className="h-3 w-3 text-white" />
                                            </div>
                                            <span className="text-sm font-medium text-slate-700">Falei com o Tomador de Decisão</span>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-white hover:bg-slate-50 transition-colors cursor-pointer">
                                            <div className="h-5 w-5 rounded border border-slate-300 flex items-center justify-center">
                                                <div className="h-2 w-2 rounded-full bg-slate-300" />
                                            </div>
                                            <span className="text-sm font-medium text-slate-700">Apresentei as Soluções</span>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-white hover:bg-slate-50 transition-colors cursor-pointer">
                                            <div className="h-5 w-5 rounded border border-slate-300 flex items-center justify-center">
                                                <div className="h-2 w-2 rounded-full bg-slate-300" />
                                            </div>
                                            <span className="text-sm font-medium text-slate-700">Identifiquei Necessidade de Seguro</span>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-white hover:bg-slate-50 transition-colors cursor-pointer">
                                            <div className="h-5 w-5 rounded border border-slate-300 flex items-center justify-center">
                                                <div className="h-2 w-2 rounded-full bg-slate-300" />
                                            </div>
                                            <span className="text-sm font-medium text-slate-700">Possui Seguro Atualmente</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Nível de Interesse</Label>
                                        <Select value={interestLevel} onValueChange={setInterestLevel}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="high">Alto - Quente</SelectItem>
                                                <SelectItem value="medium">Médio - Morno</SelectItem>
                                                <SelectItem value="low">Baixo - Frio</SelectItem>
                                                <SelectItem value="none">Nenhum</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Agendar Próximo Contato</Label>
                                        <Input
                                            type="datetime-local"
                                            value={nextContactDate}
                                            onChange={(e) => setNextContactDate(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Notas da Conversa</Label>
                                    <Textarea
                                        placeholder="Descreva como foi o contato, objeções levantadas, etc..."
                                        rows={4}
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20"
                                    disabled={saveProspectingMutation.isPending}
                                >
                                    <TrendingUp className="mr-2 h-5 w-5" />
                                    Salvar e Registrar Prospecto
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Prospecting History Section */}
                    <Card className="premium-card border-none shadow-xl">
                        <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
                            <div className="flex items-center gap-3 text-primary">
                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <History className="h-5 w-5" />
                                </div>
                                <CardTitle>Histórico de Prospecção</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="space-y-4">
                                {!prospectingHistory || prospectingHistory.length === 0 ? (
                                    <p className="text-center py-8 text-slate-500 italic">Nenhuma prospecção registrada recentemente.</p>
                                ) : (
                                    <div className="grid gap-4">
                                        {prospectingHistory.slice(0, 5).map((item) => {
                                            const contact = contacts?.find(c => c.id === item.contactId);
                                            return (
                                                <div key={item.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-900">{contact?.name || "Contato Removido"}</span>
                                                            <span className="text-[10px] text-slate-500 uppercase font-black">
                                                                {item.createdAt ? format(new Date(item.createdAt), "dd/MM/yyyy HH:mm") : ""}
                                                            </span>
                                                        </div>
                                                        <Badge className={`rounded-full px-2 py-0.5 text-[9px] uppercase font-bold
                                                            ${item.interestLevel === 'high' ? 'bg-red-500' :
                                                                item.interestLevel === 'medium' ? 'bg-amber-500' : 'bg-slate-500'}
                                                        `}>
                                                            Interesse {item.interestLevel === 'high' ? 'Alto' : item.interestLevel === 'medium' ? 'Médio' : 'Baixo'}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs text-slate-600 line-clamp-2 italic">
                                                        {item.notes || "Sem notas registradas."}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Alerts Panel */}
                <div className="space-y-6">
                    <Card className="premium-card border-none shadow-xl bg-[#0f172a] text-white">
                        <CardHeader className="border-b border-white/5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                                        <AlertCircle className="h-5 w-5" />
                                    </div>
                                    <CardTitle className="text-lg">Painel de Alertas</CardTitle>
                                </div>
                                <div className="bg-amber-500 text-primary font-bold text-xs px-2 py-1 rounded-full animate-pulse">
                                    {upcomingAlerts.length} AGENDADOS
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="space-y-4 max-h-[600px] overflow-y-auto px-1 custom-scrollbar">
                                {upcomingAlerts.length === 0 ? (
                                    <div className="text-center py-8 text-slate-500 font-medium">
                                        Nenhum retorno agendado para hoje.
                                    </div>
                                ) : (
                                    upcomingAlerts.map(alert => (
                                        <div
                                            key={alert.id}
                                            className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group cursor-pointer"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${alert.priority === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                                                    }`}>
                                                    {alert.priority}
                                                </span>
                                                <div className="flex items-center text-[10px] text-slate-400 font-medium gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {alert.dueDate ? format(new Date(alert.dueDate), "HH:mm", { locale: ptBR }) : ''}
                                                </div>
                                            </div>
                                            <h4 className="font-bold text-sm text-white truncate">{alert.title}</h4>
                                            <p className="text-xs text-slate-400 line-clamp-2 mt-1 italic">
                                                "{alert.description}"
                                            </p>
                                            <div className="mt-3 flex items-center justify-between">
                                                <div className="text-[10px] text-slate-300 font-bold bg-white/5 px-2 py-1 rounded border border-white/5">
                                                    {alert.dueDate ? format(new Date(alert.dueDate), "dd 'de' MMM", { locale: ptBR }) : ''}
                                                </div>
                                                <Button variant="ghost" size="sm" className="h-7 text-[10px] text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 p-0 font-bold">
                                                    Ligar Agora
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="premium-card border-none shadow-xl border-t-4 border-emerald-500">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest">Dica de Performance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                Prospectos "Quentes" têm 70% mais chance de fechar se o retorno ocorrer em menos de 24h. Use o painel de alertas para priorizar!
                            </p>
                            <div className="mt-4 flex items-center gap-2 text-emerald-600 font-black text-xs">
                                <TrendingUp className="h-4 w-4" />
                                META DIÁRIA: 15 LIGAÇÕES
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
