import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Contact, Lead, Interaction, Task, User, Apolice, Cliente } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import {
    Users,
    TrendingUp,
    DollarSign,
    BarChart,
    CheckSquare,
    MessageSquare,
    Target,
    PieChart as PieChartIcon,
    Activity,
    Cake,
    Mail,
    Sparkles,
    Loader2,
    MessageCircle,
    Gift,
    SlidersHorizontal,
    ArrowUp,
    ArrowDown,
    RotateCcw,
    Check,
    GripVertical,
    ShieldCheck,
    Clock,
    AlertTriangle,
    Building2,
    Package,
    Globe,
    Move,
    Eye,
    EyeOff,
    Building,
    Award
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
    BarChart as ReBarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area
} from 'recharts';

function calcAge(dateStr: string | null | undefined): number | null {
    if (!dateStr) return null;
    const parts = dateStr.split("/");
    if (parts.length !== 3) return null;
    const [day, month, year] = parts.map(Number);
    if (!year || year < 1900 || year > new Date().getFullYear()) return null;
    const today = new Date();
    let age = today.getFullYear() - year;
    if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) age--;
    return age >= 0 ? age : null;
}

export interface WidgetItem {
    id: string;
    title: string;
    category: "banner" | "metric" | "chart";
    visible: boolean;
}

const DEFAULT_WIDGETS: WidgetItem[] = [
    { id: "aniversariantes", title: "🎂 Aniversariantes do Mês", category: "banner", visible: true },
    { id: "apolicesMetrics", title: "🛡️ Seguros & Prêmios em Carteira", category: "metric", visible: true },
    { id: "vencimentos30", title: "⏳ Renovações de Seguro (30d)", category: "metric", visible: true },
    { id: "totalContacts", title: "👥 Total de Contatos", category: "metric", visible: true },
    { id: "contatosTipo", title: "🏢 Carteira PF vs PJ", category: "metric", visible: true },
    { id: "activeLeads", title: "📈 Leads no Funil", category: "metric", visible: true },
    { id: "totalValue", title: "💰 Valor em Negociação", category: "metric", visible: true },
    { id: "ticketMedio", title: "💎 Ticket Médio de Oportunidades", category: "metric", visible: true },
    { id: "conversionRate", title: "🎯 Taxa de Conversão", category: "metric", visible: true },
    { id: "pendingTasks", title: "✅ Tarefas Pendentes", category: "metric", visible: true },
    { id: "overdueTasks", title: "⚠️ Tarefas Atrasadas / Urgentes", category: "metric", visible: true },
    { id: "monthlyInteractions", title: "💬 Interações no Mês", category: "metric", visible: true },
    { id: "chartApolicesSeguradora", title: "🏛️ Apólices por Seguradora", category: "chart", visible: true },
    { id: "chartApolicesProduto", title: "📦 Carteira por Produto", category: "chart", visible: true },
    { id: "chartProspecting", title: "📊 Prospecção por Consultor", category: "chart", visible: true },
    { id: "chartLeadFlow", title: "🌊 Fluxo de Novos Leads (15d)", category: "chart", visible: true },
    { id: "chartMix", title: "🥧 Mix de Atividades", category: "chart", visible: true },
    { id: "chartOrigemContatos", title: "🌐 Origem dos Clientes", category: "chart", visible: true },
];

const STORAGE_KEY = "montero_crm_dashboard_layout_v4";
const CHART_COLORS = ["#0F6570", "#08454c", "#c65f54", "#f59e0b", "#10b981", "#6366f1", "#ec4899", "#8b5cf6"];

export default function AdminDashboard() {
    const { toast } = useToast();
    const [, setLocation] = useLocation();
    const [birthdayModalOpen, setBirthdayModalOpen] = useState(false);
    const [customizeOpen, setCustomizeOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [sendingContactId, setSendingContactId] = useState<number | null>(null);

    // Layout configuration state
    const [widgets, setWidgets] = useState<WidgetItem[]>(DEFAULT_WIDGETS);

    // Load custom layout from localStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed: WidgetItem[] = JSON.parse(saved);
                // Ensure all default items exist
                const merged = parsed.filter(p => DEFAULT_WIDGETS.some(d => d.id === p.id));
                for (const def of DEFAULT_WIDGETS) {
                    if (!merged.some(m => m.id === def.id)) {
                        merged.push(def);
                    }
                }
                setWidgets(merged);
            }
        } catch (_) {}
    }, []);

    const saveLayout = (updatedWidgets: WidgetItem[]) => {
        setWidgets(updatedWidgets);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedWidgets));
        } catch (_) {}
    };

    const resetLayout = () => {
        setWidgets(DEFAULT_WIDGETS);
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (_) {}
        toast({ title: "Layout do Dashboard restaurado ao padrão" });
    };

    const moveWidget = (index: number, direction: "up" | "down") => {
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= widgets.length) return;
        const updated = [...widgets];
        const [moved] = updated.splice(index, 1);
        updated.splice(targetIndex, 0, moved);
        saveLayout(updated);
    };

    const toggleVisibility = (id: string) => {
        const updated = widgets.map(w => w.id === id ? { ...w, visible: !w.visible } : w);
        saveLayout(updated);
    };

    const setAllVisibility = (visible: boolean) => {
        const updated = widgets.map(w => ({ ...w, visible }));
        saveLayout(updated);
    };

    // Drag and Drop Handler in Modal
    const handleModalDragEnd = (result: DropResult) => {
        if (!result.destination) return;
        const updated = Array.from(widgets);
        const [moved] = updated.splice(result.source.index, 1);
        updated.splice(result.destination.index, 0, moved);
        saveLayout(updated);
    };

    // Drag and Drop Handler on Main Grid
    const handleMainDragEnd = (result: DropResult) => {
        if (!result.destination) return;
        const visibleIndexes = widgets.map((w, i) => w.visible ? i : -1).filter(i => i !== -1);
        const realSourceIndex = visibleIndexes[result.source.index];
        const realDestIndex = visibleIndexes[result.destination.index];
        if (realSourceIndex === undefined || realDestIndex === undefined) return;

        const updated = Array.from(widgets);
        const [moved] = updated.splice(realSourceIndex, 1);
        updated.splice(realDestIndex, 0, moved);
        saveLayout(updated);
    };

    // Data queries
    const { data: contacts } = useQuery<Contact[]>({ queryKey: ["/api/contacts"] });
    const { data: leads } = useQuery<Lead[]>({ queryKey: ["/api/leads"] });
    const { data: interactionHistory } = useQuery<Interaction[]>({ queryKey: ["/api/interactions"] });
    const { data: tasks } = useQuery<Task[]>({ queryKey: ["/api/tasks"] });
    const { data: prospectingHistory } = useQuery<any[]>({ queryKey: ["/api/prospecting"] });
    const { data: users } = useQuery<User[]>({ queryKey: ["/api/users"] });
    const { data: apolices } = useQuery<Apolice[]>({ queryKey: ["/api/apolices"] });
    const { data: seguroStats } = useQuery<any>({ queryKey: ["/api/seguros/dashboard"] });

    // Computed metrics
    const totalContacts = contacts?.length || 0;
    const pfContacts = contacts?.filter(c => (c.type || "individual") === "individual").length || 0;
    const pjContacts = contacts?.filter(c => c.type === "company").length || 0;

    const activeLeads = leads?.filter(l => l.status !== "closed" && l.status !== "lost").length || 0;
    const totalValue = leads?.reduce((acc, curr) => acc + Number(curr.value || 0), 0) || 0;
    const ticketMedio = activeLeads > 0 ? totalValue / activeLeads : 0;
    const conversionRate = totalContacts > 0 ? ((totalContacts / (totalContacts + activeLeads)) * 100).toFixed(1) : 0;

    const pendingTasks = tasks?.filter(t => t.status !== "done").length || 0;
    
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const overdueTasks = tasks?.filter(t => {
        if (t.status === "done") return false;
        if (!t.dueDate) return false;
        return new Date(t.dueDate) < todayStart;
    }).length || 0;

    const currentMonth = new Date().getMonth();
    const monthlyInteractions = interactionHistory?.filter(i => {
        if (!i.date) return false;
        return new Date(i.date).getMonth() === currentMonth;
    }).length || 0;

    // Seguros computed metrics
    const activeApolices = apolices?.filter(a => a.status === "ativa") || [];
    const totalApolicesAtivas = activeApolices.length;
    const totalPremioSeguros = activeApolices.reduce((acc, curr) => acc + (parseFloat(curr.premio || "0") || 0), 0);

    const now = new Date();
    const in30 = new Date(now);
    in30.setDate(in30.getDate() + 30);

    const vencendo30List = (apolices || []).filter(a => {
        if (a.status !== "ativa" || !a.fimVigencia) return false;
        const fim = new Date(a.fimVigencia);
        fim.setHours(23, 59, 59, 999);
        return fim >= now && fim <= in30;
    });
    const emAtrasoApolicesList = (apolices || []).filter(a => a.status === "em_atraso");
    const totalSegurosUrgentes = vencendo30List.length + emAtrasoApolicesList.length;

    // Birthdays logic
    const currentMonthNum = todayStart.getMonth() + 1;
    const currentDayNum = todayStart.getDate();
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const currentMonthName = monthNames[todayStart.getMonth()];

    const monthlyBirthdayContacts = useMemo(() => {
        const list: Array<{ id: number; name: string; email?: string | null; phone?: string | null; anniversaryDate?: string | null; productType?: string | null; isEmployee?: boolean }> = [];
        
        if (contacts) {
            for (const c of contacts) {
                if (c.anniversaryDate) {
                    list.push({ id: c.id, name: c.name, email: c.email, phone: c.phone, anniversaryDate: c.anniversaryDate, productType: c.productType, isEmployee: false });
                }
            }
        }
        
        if (users) {
            for (const u of users) {
                if (u.anniversaryDate && u.role !== "client") {
                    list.push({ id: u.id + 100000, name: `${u.name} (Funcionário)`, email: u.email, phone: null, anniversaryDate: u.anniversaryDate, productType: "Equipe Interna", isEmployee: true });
                }
            }
        }

        return list.filter(item => {
            if (!item.anniversaryDate) return false;
            const parts = item.anniversaryDate.split("/");
            if (parts.length < 2) return false;
            const m = parseInt(parts[1], 10);
            return m === currentMonthNum;
        }).sort((a, b) => {
            const dayA = parseInt(a.anniversaryDate?.split("/")[0] || "0", 10);
            const dayB = parseInt(b.anniversaryDate?.split("/")[0] || "0", 10);
            return dayA - dayB;
        });
    }, [contacts, users, currentMonthNum]);

    const todayBirthdayContacts = useMemo(() => {
        return monthlyBirthdayContacts.filter(c => {
            const parts = c.anniversaryDate?.split("/");
            if (!parts || parts.length < 2) return false;
            const d = parseInt(parts[0], 10);
            return d === currentDayNum;
        });
    }, [monthlyBirthdayContacts, currentDayNum]);

    const sendEmailMutation = useMutation({
        mutationFn: async (contactId: number) => {
            setSendingContactId(contactId);
            const res = await apiRequest("POST", `/api/contacts/${contactId}/send-birthday-email`);
            return await res.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["/api/interactions"] });
            toast({
                title: "🎂 E-mail Comemorativo Enviado!",
                description: data.message || "E-mail de feliz aniversário disparado com sucesso.",
            });
        },
        onError: (err: any) => {
            toast({
                title: "Falha ao enviar e-mail",
                description: err.message || "Verifique se o serviço de e-mail está configurado.",
                variant: "destructive",
            });
        },
        onSettled: () => {
            setSendingContactId(null);
        }
    });

    // Chart Data 1: Prospecting by User
    const prospectingByUser = users?.map(u => ({
        name: u.name.split(' ')[0],
        count: prospectingHistory?.filter(p => p.userId === u.id).length || 0
    })).filter(d => d.count > 0) || [];

    // Chart Data 2: Lead Flow (Last 15 days)
    const last15Days = Array.from({ length: 15 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (14 - i));
        return d.toISOString().split('T')[0];
    });

    const leadFlowData = last15Days.map(date => ({
        date: date.split('-').slice(1).join('/'),
        count: leads?.filter(l => l.createdAt && new Date(l.createdAt).toISOString().split('T')[0] === date).length || 0
    }));

    // Chart Data 3: Interaction Types
    const typeDistribution = [
        { name: 'Chamadas', value: interactionHistory?.filter(i => i.type === 'call').length || 0, color: '#3b82f6' },
        { name: 'Emails', value: interactionHistory?.filter(i => i.type === 'email').length || 0, color: '#10b981' },
        { name: 'Reuniões', value: interactionHistory?.filter(i => i.type === 'meeting').length || 0, color: '#f59e0b' },
        { name: 'Notas', value: interactionHistory?.filter(i => i.type === 'note').length || 0, color: '#6366f1' },
    ].filter(d => d.value > 0);

    // Chart Data 4: Seguradoras Data
    const seguradorasData = seguroStats?.porSeguradora || [];

    // Chart Data 5: Produtos Data
    const produtosData = seguroStats?.porProduto || [];

    // Chart Data 6: Origem de Contatos
    const origensMap: Record<string, number> = {};
    (contacts || []).forEach(c => {
        const origin = c.contactOrigin || (c.isReferral ? "Indicação" : "Outros");
        origensMap[origin] = (origensMap[origin] || 0) + 1;
    });
    const origensData = Object.entries(origensMap).map(([nome, total]) => ({ nome, total }));

    // Map widget IDs to their layout col spans
    const getWidgetSpanClass = (category: string, id: string) => {
        if (id === "aniversariantes") return "col-span-12";
        if (category === "banner") return "col-span-12";
        if (category === "metric") return "col-span-12 sm:col-span-6 lg:col-span-3";
        if (category === "chart") return "col-span-12 md:col-span-6 lg:col-span-6";
        return "col-span-12 sm:col-span-6 lg:col-span-4";
    };

    // Map widget IDs to their JSX renderer
    const renderWidgetContent = (id: string) => {
        switch (id) {
            case "aniversariantes":
                return (
                    <Card
                        className={`premium-card border-2 cursor-pointer transition-all hover:shadow-xl ${
                            todayBirthdayContacts.length > 0
                                ? "border-rose-300 bg-gradient-to-r from-rose-50/80 via-amber-50/50 to-pink-50/80 shadow-rose-100"
                                : "border-amber-200 bg-gradient-to-r from-amber-50/60 via-orange-50/30 to-amber-50/60"
                        }`}
                        onClick={() => setBirthdayModalOpen(true)}
                    >
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                <Cake className="h-5 w-5 text-rose-500 animate-bounce" />
                                Aniversariantes de {currentMonthName}
                            </CardTitle>
                            <div className="flex items-center gap-2">
                                {todayBirthdayContacts.length > 0 && (
                                    <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-rose-600 text-white shadow-sm flex items-center gap-1.5 animate-pulse">
                                        <Sparkles className="h-3.5 w-3.5" /> {todayBirthdayContacts.length} {todayBirthdayContacts.length === 1 ? 'ANIVERSARIANTE HOJE!' : 'ANIVERSARIANTES HOJE!'}
                                    </span>
                                )}
                                <Badge variant="outline" className="rounded-full bg-white/90 text-slate-800 font-bold px-3 py-1 border-slate-300 shadow-sm">
                                    🎂 {monthlyBirthdayContacts.length} neste mês
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
                            <div>
                                <div className="text-3xl font-display font-bold text-slate-900 flex items-center gap-2">
                                    {monthlyBirthdayContacts.length} {monthlyBirthdayContacts.length === 1 ? 'cliente faz aniversário' : 'clientes fazem aniversário'} em {currentMonthName}
                                </div>
                                <p className="text-sm text-slate-600 mt-1 font-medium flex items-center gap-1.5">
                                    {todayBirthdayContacts.length > 0 ? (
                                        <span className="text-rose-600 font-bold flex items-center gap-1">
                                            <Gift className="h-4 w-4" /> Clique para ver quem são e enviar o e-mail comemorativo de hoje!
                                        </span>
                                    ) : (
                                        <span>Clique para visualizar a lista completa do mês e preparar as felicitações.</span>
                                    )}
                                </p>
                            </div>
                            <Button variant="ghost" size="sm" className="font-bold text-rose-600 hover:bg-rose-100 rounded-xl gap-1 shrink-0 bg-white/80 border border-rose-200 shadow-sm">
                                Ver Aniversariantes →
                            </Button>
                        </CardContent>
                    </Card>
                );

            case "apolicesMetrics":
                return (
                    <Card
                        className="premium-card border-none overflow-hidden group cursor-pointer hover:shadow-xl transition-all"
                        onClick={() => setLocation("/admin/apolices")}
                    >
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Carteira de Seguros</CardTitle>
                            <div className="h-10 w-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors duration-300">
                                <ShieldCheck className="h-5 w-5" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline justify-between gap-2">
                                <div className="text-3xl font-display font-bold text-slate-900">{totalApolicesAtivas} <span className="text-xs font-normal text-slate-500">ativas</span></div>
                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                    R$ {totalPremioSeguros.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">Prêmio total em vigência regular</p>
                        </CardContent>
                    </Card>
                );

            case "vencimentos30":
                return (
                    <Card
                        className={`premium-card border-none overflow-hidden group cursor-pointer hover:shadow-xl transition-all ${
                            totalSegurosUrgentes > 0 ? "ring-2 ring-amber-400/50 bg-amber-50/30" : ""
                        }`}
                        onClick={() => setLocation("/admin/apolices")}
                    >
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Renovações Seguros (30d)</CardTitle>
                            <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors duration-300">
                                <Clock className="h-5 w-5" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline justify-between gap-2">
                                <div className="text-3xl font-display font-bold text-amber-600">{vencendo30List.length}</div>
                                {emAtrasoApolicesList.length > 0 && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 animate-pulse">
                                        {emAtrasoApolicesList.length} em atraso
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-400 mt-1">Apólices com vigência finalizando</p>
                        </CardContent>
                    </Card>
                );

            case "totalContacts":
                return (
                    <Card className="premium-card border-none overflow-hidden group">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total de Contatos</CardTitle>
                            <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                                <Users className="h-5 w-5" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline justify-between gap-2">
                                <div className="text-3xl font-display font-bold text-slate-900">{totalContacts}</div>
                                <div className="flex gap-1 flex-wrap justify-end">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                        {contacts?.filter(c => (c.status || "Ativo") === "Ativo").length || 0} Ativos
                                    </span>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                        {contacts?.filter(c => c.status === "Prospects").length || 0} Prospects
                                    </span>
                                </div>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">Base total de clientes sincronizada</p>
                        </CardContent>
                    </Card>
                );

            case "contatosTipo":
                return (
                    <Card className="premium-card border-none overflow-hidden group">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Carteira PF vs PJ</CardTitle>
                            <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                                <Building className="h-5 w-5" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline justify-between gap-2">
                                <div className="text-3xl font-display font-bold text-slate-900">{pfContacts} <span className="text-xs font-medium text-slate-500">PF</span></div>
                                <div className="text-3xl font-display font-bold text-indigo-600">{pjContacts} <span className="text-xs font-medium text-indigo-500">PJ</span></div>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2 flex">
                                <div className="bg-blue-500 h-full" style={{ width: totalContacts > 0 ? `${(pfContacts / totalContacts) * 100}%` : '50%' }} title="Pessoa Física" />
                                <div className="bg-indigo-600 h-full" style={{ width: totalContacts > 0 ? `${(pjContacts / totalContacts) * 100}%` : '50%' }} title="Pessoa Jurídica" />
                            </div>
                        </CardContent>
                    </Card>
                );

            case "activeLeads":
                return (
                    <Card className="premium-card border-none overflow-hidden group">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Leads no Funil</CardTitle>
                            <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors duration-300">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <div className="text-3xl font-display font-bold text-slate-900">{activeLeads}</div>
                                <span className="text-xs font-bold text-amber-500 flex items-center">
                                    Em progresso
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">Negociações em aberto no Pipeline</p>
                        </CardContent>
                    </Card>
                );

            case "totalValue":
                return (
                    <Card className="premium-card border-none overflow-hidden group">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Valor em Negociação</CardTitle>
                            <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                                <DollarSign className="h-5 w-5" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <div className="text-3xl font-display font-bold text-slate-900">R$ {totalValue.toLocaleString('pt-BR')}</div>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">Potencial de conversão imediato</p>
                        </CardContent>
                    </Card>
                );

            case "ticketMedio":
                return (
                    <Card className="premium-card border-none overflow-hidden group">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Ticket Médio Lead</CardTitle>
                            <div className="h-10 w-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
                                <Award className="h-5 w-5" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-display font-bold text-slate-900">
                                R$ {ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </div>
                            <p className="text-xs text-slate-400 mt-1">Valor médio estimado por oportunidade</p>
                        </CardContent>
                    </Card>
                );

            case "pendingTasks":
                return (
                    <Card className="premium-card border-none overflow-hidden group">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Tarefas Pendentes</CardTitle>
                            <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                                <CheckSquare className="h-5 w-5" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-display font-bold text-slate-900">{pendingTasks}</div>
                            <p className="text-xs text-slate-400 mt-1">Acões necessárias no CRM</p>
                        </CardContent>
                    </Card>
                );

            case "overdueTasks":
                return (
                    <Card
                        className={`premium-card border-none overflow-hidden group cursor-pointer hover:shadow-xl transition-all ${
                            overdueTasks > 0 ? "bg-rose-50/50" : ""
                        }`}
                        onClick={() => setLocation("/admin/todoist")}
                    >
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Tarefas Atrasadas</CardTitle>
                            <div className="h-10 w-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors duration-300">
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-display font-bold text-rose-600">{overdueTasks}</div>
                            <p className="text-xs text-slate-400 mt-1">Exigem atenção operacional urgente</p>
                        </CardContent>
                    </Card>
                );

            case "conversionRate":
                return (
                    <Card className="premium-card border-none overflow-hidden group">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Taxa de Conversão</CardTitle>
                            <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                                <Target className="h-5 w-5" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-display font-bold text-slate-900">{conversionRate}%</div>
                            <p className="text-xs text-slate-400 mt-1">Leads qualificados vs convertidos</p>
                        </CardContent>
                    </Card>
                );

            case "monthlyInteractions":
                return (
                    <Card className="premium-card border-none overflow-hidden group">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Interações (Mês)</CardTitle>
                            <div className="h-10 w-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
                                <MessageSquare className="h-5 w-5" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-display font-bold text-slate-900">{monthlyInteractions}</div>
                            <p className="text-xs text-slate-400 mt-1">Pontos de contato registrados</p>
                        </CardContent>
                    </Card>
                );

            case "chartApolicesSeguradora":
                return (
                    <Card className="premium-card border-none shadow-xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-[#0F6570]" />
                                Apólices por Seguradora
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            {seguradorasData.length === 0 ? (
                                <div className="flex h-full items-center justify-center text-slate-400 text-sm">Sem dados de seguradora cadastrados.</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <ReBarChart data={seguradorasData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                        <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                                        <YAxis type="category" dataKey="nome" fontSize={11} tickLine={false} axisLine={false} width={110} />
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                        <Bar dataKey="total" fill="#0F6570" radius={[0, 4, 4, 0]} name="Apólices" />
                                    </ReBarChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                );

            case "chartApolicesProduto":
                return (
                    <Card className="premium-card border-none shadow-xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Package className="h-4 w-4 text-emerald-600" />
                                Carteira por Produto
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            {produtosData.length === 0 ? (
                                <div className="flex h-full items-center justify-center text-slate-400 text-sm">Sem produtos de seguro cadastrados.</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <ReBarChart data={produtosData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                        <XAxis dataKey="nome" fontSize={11} tickLine={false} axisLine={false} />
                                        <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                        <Bar dataKey="total" radius={[4, 4, 0, 0]} name="Apólices">
                                            {produtosData.map((_: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </ReBarChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                );

            case "chartProspecting":
                return (
                    <Card className="premium-card border-none shadow-xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Users className="h-4 w-4 text-blue-500" />
                                Prospecção por Consultor
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <ReBarChart data={prospectingByUser}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Prospecções" />
                                </ReBarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                );

            case "chartLeadFlow":
                return (
                    <Card className="premium-card border-none shadow-xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-amber-500" />
                                Fluxo de Novos Leads (15d)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={leadFlowData}>
                                    <defs>
                                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#C45A4A" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#C45A4A" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                    <Area type="monotone" dataKey="count" stroke="#C45A4A" fillOpacity={1} fill="url(#colorCount)" name="Novos Leads" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                );

            case "chartMix":
                return (
                    <Card className="premium-card border-none shadow-xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <PieChartIcon className="h-4 w-4 text-purple-500" />
                                Mix de Atividades
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px] flex items-center justify-center">
                            <div className="w-full h-full flex items-center">
                                <ResponsiveContainer width="60%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={typeDistribution}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {typeDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="flex flex-col gap-2 ml-4">
                                    {typeDistribution.map((t, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: t.color }} />
                                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">{t.name}: {t.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );

            case "chartOrigemContatos":
                return (
                    <Card className="premium-card border-none shadow-xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Globe className="h-4 w-4 text-indigo-500" />
                                Origem dos Clientes
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            {origensData.length === 0 ? (
                                <div className="flex h-full items-center justify-center text-slate-400 text-sm">Nenhuma origem registrada.</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <ReBarChart data={origensData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                        <XAxis dataKey="nome" fontSize={11} tickLine={false} axisLine={false} />
                                        <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                        <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} name="Contatos" />
                                    </ReBarChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                );

            default:
                return null;
        }
    };

    // Visible widgets list
    const visibleWidgets = widgets.filter(w => w.visible);

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-4xl font-display font-bold text-slate-900 tracking-tight">Bem-vindo, Monteiro</h2>
                    <p className="text-slate-500 mt-2 text-lg font-medium">Aqui está um resumo dinâmico e personalizado do seu CRM.</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <Button
                        variant={isEditMode ? "default" : "outline"}
                        onClick={() => setIsEditMode(!isEditMode)}
                        className={`h-11 px-5 rounded-xl font-bold transition-all gap-2 shadow-sm ${
                            isEditMode
                                ? "bg-amber-500 hover:bg-amber-600 text-white ring-2 ring-amber-400/50 animate-pulse"
                                : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                        }`}
                    >
                        <Move className="h-4 w-4" />
                        {isEditMode ? "Concluir Arraste" : "Modo Arraste na Tela"}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setCustomizeOpen(true)}
                        className="h-11 px-5 rounded-xl font-bold bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm gap-2"
                    >
                        <SlidersHorizontal className="h-4 w-4 text-primary" />
                        Editar Dashboard
                    </Button>
                </div>
            </div>

            {/* Warning bar in Edit Mode */}
            {isEditMode && (
                <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 flex items-center justify-between gap-4 shadow-md animate-in fade-in duration-300">
                    <div className="flex items-center gap-3">
                        <Move className="h-6 w-6 text-amber-600 shrink-0" />
                        <div>
                            <p className="font-bold text-sm">Modo de Arraste Ativo!</p>
                            <p className="text-xs text-amber-700">Clique e segure nas barras superiores dos cartões para reposicioná-los livremente pela tela.</p>
                        </div>
                    </div>
                    <Button
                        size="sm"
                        onClick={() => setIsEditMode(false)}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs h-9 px-4 shrink-0 shadow-sm"
                    >
                        Salvar Posições
                    </Button>
                </div>
            )}

            {/* Unified Dynamic Drag and Drop Grid Layout */}
            <DragDropContext onDragEnd={handleMainDragEnd}>
                <Droppable droppableId="main-dashboard-grid" isDropDisabled={!isEditMode}>
                    {(provided) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="grid grid-cols-12 gap-6"
                        >
                            {visibleWidgets.map((widget, idx) => (
                                <Draggable
                                    key={widget.id}
                                    draggableId={widget.id}
                                    index={idx}
                                    isDragDisabled={!isEditMode}
                                >
                                    {(providedWidget, snapshot) => (
                                        <div
                                            ref={providedWidget.innerRef}
                                            {...providedWidget.draggableProps}
                                            className={`${getWidgetSpanClass(widget.category, widget.id)} transition-shadow duration-200 ${
                                                snapshot.isDragging ? "z-50 opacity-90 scale-[1.02] shadow-2xl" : ""
                                            }`}
                                        >
                                            {/* Drag Bar visible during Edit Mode */}
                                            {isEditMode && (
                                                <div
                                                    {...providedWidget.dragHandleProps}
                                                    className="bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-t-2xl flex items-center justify-between gap-2 border-b border-slate-700 cursor-grab active:cursor-grabbing select-none"
                                                >
                                                    <div className="flex items-center gap-2 truncate">
                                                        <GripVertical className="h-4 w-4 text-amber-400 shrink-0" />
                                                        <span className="truncate">{widget.title}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        <span className="text-[9px] uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-extrabold">
                                                            {widget.category}
                                                        </span>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleVisibility(widget.id);
                                                            }}
                                                            className="h-6 w-6 p-0 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded"
                                                            title="Ocultar Widget"
                                                        >
                                                            <EyeOff className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            <div className={isEditMode ? "rounded-b-2xl overflow-hidden border-2 border-dashed border-amber-300 bg-amber-50/10 p-1" : ""}>
                                                {renderWidgetContent(widget.id)}
                                            </div>
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>

            {/* Empty State when all widgets are hidden */}
            {visibleWidgets.length === 0 && (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 space-y-4">
                    <SlidersHorizontal className="h-12 w-12 mx-auto text-slate-400" />
                    <h3 className="text-xl font-bold text-slate-700">Todos os widgets do Dashboard estão ocultos</h3>
                    <p className="text-slate-500 text-sm max-w-md mx-auto">
                        Clique em "Editar Dashboard" para reativar os indicadores, métricas e gráficos desejados.
                    </p>
                    <Button
                        onClick={resetLayout}
                        className="font-bold bg-primary hover:bg-primary/90 text-white rounded-xl"
                    >
                        Restaurar Todos os Widgets
                    </Button>
                </div>
            )}

            {/* ── Dialog Personalizar Dashboard (Drag & Drop Reordering Modal) ── */}
            <Dialog open={customizeOpen} onOpenChange={setCustomizeOpen}>
                <DialogContent className="sm:max-w-[600px] w-full max-w-[95vw] rounded-3xl border-none shadow-2xl overflow-hidden p-0 max-h-[85vh] flex flex-col bg-white">
                    <DialogHeader className="p-6 pb-4 bg-slate-900 text-white shrink-0">
                        <DialogTitle className="text-2xl font-display font-bold flex items-center gap-2 text-white">
                            <SlidersHorizontal className="h-6 w-6 text-amber-400" />
                            Personalizar Dashboard
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-300 mt-1">
                            Arraste os cards para reorganizar a ordem de exibição na tela ou utilize a chave seletora para ocultar/exibir.
                        </DialogDescription>
                    </DialogHeader>

                    {/* DragDropContext inside Modal */}
                    <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
                        <DragDropContext onDragEnd={handleModalDragEnd}>
                            <Droppable droppableId="modal-widgets-list">
                                {(provided) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className="space-y-3"
                                    >
                                        {widgets.map((widget, idx) => (
                                            <Draggable key={widget.id} draggableId={widget.id} index={idx}>
                                                {(providedWidget, snapshot) => (
                                                    <div
                                                        ref={providedWidget.innerRef}
                                                        {...providedWidget.draggableProps}
                                                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                                                            snapshot.isDragging
                                                                ? "bg-amber-50 border-amber-400 shadow-xl scale-[1.02] z-50"
                                                                : widget.visible
                                                                ? "bg-white border-slate-200 shadow-sm hover:border-slate-300"
                                                                : "bg-slate-100/70 border-slate-200 opacity-60"
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                                            {/* Drag Handle */}
                                                            <div
                                                                {...providedWidget.dragHandleProps}
                                                                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-grab active:cursor-grabbing shrink-0"
                                                                title="Segure para arrastar"
                                                            >
                                                                <GripVertical className="h-5 w-5" />
                                                            </div>

                                                            {/* Up/Down Quick Buttons */}
                                                            <div className="flex items-center gap-0.5 shrink-0">
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    disabled={idx === 0}
                                                                    onClick={() => moveWidget(idx, "up")}
                                                                    className="h-7 w-7 p-0 rounded-lg text-slate-400 hover:text-slate-900 disabled:opacity-20"
                                                                    title="Subir"
                                                                >
                                                                    <ArrowUp className="h-3.5 w-3.5" />
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    disabled={idx === widgets.length - 1}
                                                                    onClick={() => moveWidget(idx, "down")}
                                                                    className="h-7 w-7 p-0 rounded-lg text-slate-400 hover:text-slate-900 disabled:opacity-20"
                                                                    title="Descer"
                                                                >
                                                                    <ArrowDown className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </div>

                                                            <div className="min-w-0">
                                                                <span className="font-bold text-slate-900 text-sm block truncate">{widget.title}</span>
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase">
                                                                    {widget.category === "banner" ? "Banner Especial" : widget.category === "metric" ? "Métrica / BI" : "Gráfico"}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3 shrink-0">
                                                            <Switch
                                                                checked={widget.visible}
                                                                onCheckedChange={() => toggleVisibility(widget.id)}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                    </div>

                    <div className="p-4 bg-white border-t border-slate-200 shrink-0 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setAllVisibility(true)}
                                className="font-bold text-slate-600 hover:bg-slate-100 rounded-xl text-xs h-8 px-2.5"
                            >
                                <Eye className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                                Mostrar Todos
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={resetLayout}
                                className="font-bold text-slate-600 hover:bg-slate-100 rounded-xl text-xs h-8 px-2.5"
                            >
                                <RotateCcw className="h-3.5 w-3.5 mr-1 text-slate-400" />
                                Restaurar Padrão
                            </Button>
                        </div>
                        <Button
                            type="button"
                            onClick={() => {
                                setCustomizeOpen(false);
                                toast({ title: "✅ Layout do Dashboard atualizado com sucesso!" });
                            }}
                            className="font-bold text-xs h-10 px-6 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-md gap-1.5"
                        >
                            <Check className="h-4 w-4" />
                            Salvar e Concluir
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── Dialog Lista de Aniversariantes do Mês ────────────────────────── */}
            <Dialog open={birthdayModalOpen} onOpenChange={setBirthdayModalOpen}>
                <DialogContent className="sm:max-w-[700px] w-full max-w-[95vw] rounded-3xl border-none shadow-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden bg-white">
                    <DialogHeader className="p-6 bg-gradient-to-r from-rose-500 via-pink-600 to-rose-600 text-white shrink-0">
                        <DialogTitle className="text-2xl font-display font-bold flex items-center gap-2.5 text-white">
                            <Cake className="h-7 w-7 text-amber-300" />
                            Aniversariantes do Mês de {currentMonthName}
                        </DialogTitle>
                        <DialogDescription className="text-rose-100 text-sm font-medium mt-1">
                            {monthlyBirthdayContacts.length} {monthlyBirthdayContacts.length === 1 ? 'cliente comemora' : 'clientes comemoram'} aniversário neste mês.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-6 space-y-4 overflow-y-auto flex-1 bg-slate-50/50">
                        {monthlyBirthdayContacts.length === 0 ? (
                            <div className="text-center py-12 text-slate-400 space-y-2">
                                <Cake className="h-12 w-12 mx-auto opacity-30 text-rose-400" />
                                <p className="font-bold text-slate-600">Nenhum aniversariante cadastrado para {currentMonthName}.</p>
                                <p className="text-xs">Certifique-se de preencher a data comemorativa nos cadastros dos clientes.</p>
                            </div>
                        ) : (
                            monthlyBirthdayContacts.map((contact) => {
                                const parts = contact.anniversaryDate?.split("/");
                                const dayStr = parts?.[0] || "";
                                const isToday = parseInt(dayStr, 10) === currentDayNum;
                                const age = calcAge(contact.anniversaryDate);
                                const cleanPhone = contact.phone?.replace(/\D/g, "");
                                const waMsg = encodeURIComponent(
                                    `Olá, ${contact.name}! 🎉 Desejamos a você um Feliz Aniversário repleto de alegrias, saúde e sucesso! É uma honra tê-lo(a) como cliente da Monteiro Seguros e Benefícios! 🎂🎁`
                                );

                                return (
                                    <div
                                        key={contact.id}
                                        className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                                            isToday
                                                ? "bg-gradient-to-r from-rose-50 via-pink-50 to-amber-50 border-rose-300 shadow-md ring-2 ring-rose-400/30"
                                                : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3.5 min-w-0">
                                            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm ${
                                                isToday ? "bg-gradient-to-tr from-rose-500 to-amber-400" : "bg-primary/80"
                                            }`}>
                                                {contact.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0 space-y-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-bold text-slate-900 text-base truncate">{contact.name}</span>
                                                    {isToday && (
                                                        <Badge className="bg-rose-500 text-white font-black text-[10px] uppercase px-2 py-0.5 rounded-full animate-pulse shadow-sm">
                                                            🥳 É HOJE!
                                                        </Badge>
                                                    )}
                                                    {contact.productType && (
                                                        <Badge variant="outline" className="bg-slate-100 text-slate-700 font-bold text-[10px] border-slate-200">
                                                            {contact.productType.split(",")[0]}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                                                    <span className="flex items-center gap-1 font-bold text-rose-600">
                                                        📅 Dia {dayStr} de {currentMonthName}
                                                    </span>
                                                    {age !== null && (
                                                        <span className="text-slate-600 font-bold">🎂 {age} anos</span>
                                                    )}
                                                    {contact.email && (
                                                        <span className="hidden md:inline text-slate-400 truncate max-w-[160px]">{contact.email}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                                            {contact.phone && cleanPhone && (
                                                <a
                                                    href={`https://wa.me/55${cleanPhone}?text=${waMsg}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="rounded-xl font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 text-xs h-9 px-3 gap-1.5 shadow-sm"
                                                        title="Enviar parabéns pelo WhatsApp"
                                                    >
                                                        <MessageCircle className="h-4 w-4 text-emerald-600" />
                                                        WhatsApp
                                                    </Button>
                                                </a>
                                            )}

                                            <Button
                                                type="button"
                                                size="sm"
                                                disabled={!contact.email || (sendEmailMutation.isPending && sendingContactId === contact.id)}
                                                onClick={() => sendEmailMutation.mutate(contact.id)}
                                                className={`rounded-xl font-bold text-xs h-9 px-3.5 gap-1.5 shadow-sm ${
                                                    isToday
                                                        ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200"
                                                        : "bg-primary hover:bg-primary/90 text-white"
                                                }`}
                                                title={contact.email ? "Disparar e-mail de feliz aniversário" : "Contato sem e-mail"}
                                            >
                                                {sendEmailMutation.isPending && sendingContactId === contact.id ? (
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                ) : (
                                                    <Mail className="h-3.5 w-3.5" />
                                                )}
                                                Disparar E-mail
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
