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
    Award,
    Copy,
    Edit3,
    ExternalLink
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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

function parseBirthdayDate(dateStr: string | null | undefined): { day: number; month: number; year: number | null } | null {
    if (!dateStr) return null;
    const trimmed = dateStr.trim();
    if (!trimmed) return null;

    // Format YYYY-MM-DD or ISO YYYY-MM-DDTHH:mm...
    const isoMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (isoMatch) {
        const year = parseInt(isoMatch[1], 10);
        const month = parseInt(isoMatch[2], 10);
        const day = parseInt(isoMatch[3], 10);
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            return { day, month, year: year >= 1900 ? year : null };
        }
    }

    // Format DD/MM/YYYY, DD/MM, or DD-MM-YYYY
    const brMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?$/);
    if (brMatch) {
        const day = parseInt(brMatch[1], 10);
        const month = parseInt(brMatch[2], 10);
        let year: number | null = brMatch[3] ? parseInt(brMatch[3], 10) : null;
        if (year !== null && year < 100) {
            year += year > new Date().getFullYear() % 100 ? 1900 : 2000;
        }
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            return { day, month, year: year && year >= 1900 ? year : null };
        }
    }

    return null;
}

function calcAge(dateStr: string | null | undefined): number | null {
    const parsed = parseBirthdayDate(dateStr);
    if (!parsed || !parsed.year || parsed.year > new Date().getFullYear()) return null;
    const today = new Date();
    let age = today.getFullYear() - parsed.year;
    if (today.getMonth() + 1 < parsed.month || (today.getMonth() + 1 === parsed.month && today.getDate() < parsed.day)) age--;
    return age >= 0 ? age : null;
}

interface BirthdayContactItem {
    id: number;
    contactIdForEmail?: number | null;
    name: string;
    email?: string | null;
    phone?: string | null;
    anniversaryDate?: string | null;
    day: number;
    month: number;
    productType?: string | null;
    isEmployee?: boolean;
}

const STORAGE_KEY_BIRTHDAY_TEMPLATE = "monteiro_birthday_message_template";
const DEFAULT_BIRTHDAY_TEMPLATE =
    "Olá, {nome}! 🎉 Desejamos a você um Feliz Aniversário repleto de alegrias, saúde e sucesso! É uma honra tê-lo(a) como cliente e parceiro(a) da Monteiro Seguros e Benefícios! 🎂🎁";

function formatBirthdayText(template: string, contact: { name: string; anniversaryDate?: string | null }) {
    const age = calcAge(contact.anniversaryDate);
    const firstName = contact.name.trim().split(" ")[0] || contact.name;
    return template
        .replace(/\{nome\}/gi, contact.name)
        .replace(/\{primeiro_nome\}/gi, firstName)
        .replace(/\{idade\}/gi, age !== null ? `${age} anos` : "")
        .replace(/\{empresa\}/gi, "Monteiro Seguros e Benefícios");
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

    // Birthday Message Template State (persisted in localStorage)
    const [birthdayTemplate, setBirthdayTemplate] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY_BIRTHDAY_TEMPLATE);
            if (saved !== null && saved.trim().length > 0) return saved;
        } catch {}
        return DEFAULT_BIRTHDAY_TEMPLATE;
    });
    const [showTemplateEditor, setShowTemplateEditor] = useState(false);

    // Individual contact dispatch modal state
    const [dispatchContact, setDispatchContact] = useState<BirthdayContactItem | null>(null);
    const [customizedMessage, setCustomizedMessage] = useState("");
    const [saveAsNewDefault, setSaveAsNewDefault] = useState(true);

    const handleBirthdayTemplateChange = (val: string) => {
        setBirthdayTemplate(val);
        try {
            localStorage.setItem(STORAGE_KEY_BIRTHDAY_TEMPLATE, val);
        } catch {}
    };

    const handleResetBirthdayTemplate = () => {
        setBirthdayTemplate(DEFAULT_BIRTHDAY_TEMPLATE);
        try {
            localStorage.setItem(STORAGE_KEY_BIRTHDAY_TEMPLATE, DEFAULT_BIRTHDAY_TEMPLATE);
        } catch {}
        toast({ title: "Modelo de mensagem restaurado ao padrão" });
    };

    const openDispatchModal = (contact: BirthdayContactItem) => {
        setDispatchContact(contact);
        setCustomizedMessage(formatBirthdayText(birthdayTemplate, contact));
    };

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
    const { data: clientes } = useQuery<Cliente[]>({ queryKey: ["/api/clientes"] });
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
        const list: BirthdayContactItem[] = [];
        const seenContactIds = new Set<number>();
        const seenDocs = new Set<string>();
        const seenNames = new Set<string>();

        const clienteByContactId = new Map<number, Cliente>();
        if (clientes) {
            for (const cl of clientes) {
                if (cl.contactId) {
                    clienteByContactId.set(cl.contactId, cl);
                }
            }
        }

        if (contacts) {
            for (const c of contacts) {
                const linkedCliente = clienteByContactId.get(c.id);
                const rawDate = c.anniversaryDate || linkedCliente?.anniversaryDate || linkedCliente?.dataNascimento;
                const parsed = parseBirthdayDate(rawDate);
                seenContactIds.add(c.id);
                const cleanDoc = (c.document || "").replace(/\D/g, "");
                if (cleanDoc.length >= 11) seenDocs.add(cleanDoc);
                if (c.name) seenNames.add(c.name.trim().toLowerCase());

                if (parsed && parsed.month === currentMonthNum) {
                    list.push({
                        id: c.id,
                        contactIdForEmail: c.id,
                        name: c.name,
                        email: c.email || linkedCliente?.email,
                        phone: c.phone || linkedCliente?.whatsapp || linkedCliente?.telefone,
                        anniversaryDate: rawDate,
                        day: parsed.day,
                        month: parsed.month,
                        productType: c.productType || linkedCliente?.productType,
                        isEmployee: false,
                    });
                }
            }
        }

        if (clientes) {
            for (const cl of clientes) {
                if (cl.contactId && seenContactIds.has(cl.contactId)) continue;
                const cleanDoc = (cl.cpfCnpj || "").replace(/\D/g, "");
                const cleanName = (cl.nome || "").trim().toLowerCase();
                if ((cleanDoc.length >= 11 && seenDocs.has(cleanDoc)) || (cleanName && seenNames.has(cleanName))) {
                    continue;
                }
                const rawDate = cl.anniversaryDate || cl.dataNascimento;
                const parsed = parseBirthdayDate(rawDate);
                if (parsed && parsed.month === currentMonthNum) {
                    if (cleanDoc.length >= 11) seenDocs.add(cleanDoc);
                    if (cleanName) seenNames.add(cleanName);
                    list.push({
                        id: cl.id + 200000,
                        contactIdForEmail: cl.contactId || null,
                        name: cl.nome,
                        email: cl.email,
                        phone: cl.whatsapp || cl.telefone,
                        anniversaryDate: rawDate,
                        day: parsed.day,
                        month: parsed.month,
                        productType: cl.productType,
                        isEmployee: false,
                    });
                }
            }
        }

        if (users) {
            for (const u of users) {
                if (u.anniversaryDate && u.role !== "client") {
                    const parsed = parseBirthdayDate(u.anniversaryDate);
                    if (parsed && parsed.month === currentMonthNum) {
                        list.push({
                            id: u.id + 100000,
                            contactIdForEmail: u.contactId || null,
                            name: `${u.name} (Funcionário)`,
                            email: u.email,
                            phone: null,
                            anniversaryDate: u.anniversaryDate,
                            day: parsed.day,
                            month: parsed.month,
                            productType: "Equipe Interna",
                            isEmployee: true,
                        });
                    }
                }
            }
        }

        // Sort priority:
        // 0: Today's birthday(s) ALWAYS FIRST
        // 1: Upcoming birthdays in the current month (ascending by day)
        // 2: Past birthdays in the current month (ascending by day)
        const getBucket = (day: number) => {
            if (day === currentDayNum) return 0;
            if (day > currentDayNum) return 1;
            return 2;
        };

        return list.sort((a, b) => {
            const bucketDiff = getBucket(a.day) - getBucket(b.day);
            if (bucketDiff !== 0) return bucketDiff;
            if (a.day !== b.day) return a.day - b.day;
            return a.name.localeCompare(b.name, "pt-BR");
        });
    }, [contacts, clientes, users, currentMonthNum, currentDayNum]);

    const todayBirthdayContacts = useMemo(
        () => monthlyBirthdayContacts.filter(c => c.day === currentDayNum),
        [monthlyBirthdayContacts, currentDayNum]
    );

    const upcomingBirthdayContacts = useMemo(
        () => monthlyBirthdayContacts.filter(c => c.day > currentDayNum),
        [monthlyBirthdayContacts, currentDayNum]
    );

    const pastBirthdayContacts = useMemo(
        () => monthlyBirthdayContacts.filter(c => c.day < currentDayNum),
        [monthlyBirthdayContacts, currentDayNum]
    );

    const sendEmailMutation = useMutation({
        mutationFn: async ({ contactId, customMessage }: { contactId: number; customMessage?: string }) => {
            setSendingContactId(contactId);
            const res = await apiRequest("POST", `/api/contacts/${contactId}/send-birthday-email`, {
                customMessage
            });
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
                                ? "border-rose-400 bg-gradient-to-r from-rose-50/95 via-amber-50/70 to-pink-50/95 shadow-md shadow-rose-100"
                                : "border-amber-200 bg-gradient-to-r from-amber-50/60 via-orange-50/30 to-amber-50/60"
                        }`}
                        onClick={() => setBirthdayModalOpen(true)}
                    >
                        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap pb-2 space-y-0">
                            <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                <Cake className="h-5 w-5 text-rose-500 animate-bounce" />
                                Aniversariantes de {currentMonthName}
                            </CardTitle>
                            <div className="flex items-center gap-2 flex-wrap">
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
                        <CardContent className="space-y-3.5 pt-2">
                            {todayBirthdayContacts.length > 0 ? (
                                <>
                                    <div className="w-full rounded-2xl bg-white/95 border-2 border-rose-300/90 shadow-sm p-3.5 sm:p-4 space-y-2.5">
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                            <span className="text-xs font-black uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                                                <Gift className="h-4 w-4 text-rose-500 shrink-0" />
                                                {todayBirthdayContacts.length === 1
                                                    ? "🎉 Aniversariante do Dia:"
                                                    : `🎉 Aniversariantes do Dia (${todayBirthdayContacts.length}):`}
                                            </span>
                                            <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                                                Hoje • Dia {String(currentDayNum).padStart(2, "0")} de {currentMonthName}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2.5">
                                            {todayBirthdayContacts.map((person) => {
                                                const age = calcAge(person.anniversaryDate);
                                                return (
                                                    <div
                                                        key={person.id}
                                                        className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-500 text-white shadow-md shadow-rose-500/20 ring-2 ring-amber-300/80"
                                                    >
                                                        <span className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center text-sm shrink-0 border border-white/40">
                                                            🎂
                                                        </span>
                                                        <span className="font-display font-extrabold text-sm sm:text-base tracking-tight text-white">
                                                            {person.name}
                                                        </span>
                                                        {age !== null && (
                                                            <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-amber-300 text-rose-950">
                                                                {age} anos
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <p className="text-sm text-slate-700 font-medium flex items-center gap-1.5">
                                            <Sparkles className="h-4 w-4 text-rose-500 shrink-0" />
                                            <span>
                                                Clique para parabenizar agora e ver todos os{" "}
                                                <strong className="text-slate-900">{monthlyBirthdayContacts.length}</strong>{" "}
                                                {monthlyBirthdayContacts.length === 1 ? "aniversariante" : "aniversariantes"} de {currentMonthName}.
                                            </span>
                                        </p>
                                        <Button variant="ghost" size="sm" className="font-bold text-rose-600 hover:bg-rose-100 rounded-xl gap-1 shrink-0 bg-white/90 border border-rose-200 shadow-sm self-start sm:self-auto">
                                            Parabenizar / Ver Lista →
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div>
                                        <div className="text-3xl font-display font-bold text-slate-900 flex items-center gap-2">
                                            {monthlyBirthdayContacts.length} {monthlyBirthdayContacts.length === 1 ? 'cliente faz aniversário' : 'clientes fazem aniversário'} em {currentMonthName}
                                        </div>
                                        <p className="text-sm text-slate-600 mt-1 font-medium">
                                            Nenhum aniversariante hoje • Clique para visualizar a lista completa do mês e preparar as felicitações.
                                        </p>
                                    </div>
                                    <Button variant="ghost" size="sm" className="font-bold text-rose-600 hover:bg-rose-100 rounded-xl gap-1 shrink-0 bg-white/80 border border-rose-200 shadow-sm">
                                        Ver Aniversariantes →
                                    </Button>
                                </div>
                            )}
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

    const renderBirthdayContactCard = (contact: BirthdayContactItem, isTodayHighlight: boolean) => {
        const dayStr = String(contact.day).padStart(2, "0");
        const age = calcAge(contact.anniversaryDate);
        const cleanPhone = contact.phone?.replace(/\D/g, "");
        const formattedPhone = cleanPhone && cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
        const personalizedMsg = formatBirthdayText(birthdayTemplate, contact);
        const emailContactId = contact.contactIdForEmail ?? (!contact.isEmployee ? contact.id : null);
        const canSendEmail = Boolean(contact.email && emailContactId);

        return (
            <div
                key={contact.id}
                className={`rounded-2xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isTodayHighlight
                        ? "p-4 sm:p-5 bg-white border-2 border-rose-400 shadow-lg shadow-rose-200/50 ring-2 ring-amber-300/60"
                        : "p-4 bg-white border border-slate-200 hover:border-slate-300 shadow-sm"
                }`}
            >
                <div className="flex items-center gap-3.5 min-w-0">
                    <div className="relative shrink-0">
                        <div
                            className={`rounded-2xl flex items-center justify-center text-white font-bold shadow-sm ${
                                isTodayHighlight
                                    ? "h-14 w-14 text-xl bg-gradient-to-tr from-rose-600 via-pink-500 to-amber-400 ring-4 ring-rose-200/80"
                                    : "h-12 w-12 text-lg bg-primary/80"
                            }`}
                        >
                            {contact.name.charAt(0).toUpperCase()}
                        </div>
                        {isTodayHighlight && (
                            <span className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-amber-300 border-2 border-white flex items-center justify-center text-xs shadow-sm">
                                🎂
                            </span>
                        )}
                    </div>
                    <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span
                                className={`truncate ${
                                    isTodayHighlight
                                        ? "font-display font-extrabold text-rose-950 text-lg"
                                        : "font-bold text-slate-900 text-base"
                                }`}
                            >
                                {contact.name}
                            </span>
                            {isTodayHighlight && (
                                <Badge className="bg-gradient-to-r from-rose-600 to-pink-600 text-white font-black text-[10px] uppercase px-2.5 py-0.5 rounded-full animate-pulse shadow-sm border-none">
                                    🥳 É HOJE!
                                </Badge>
                            )}
                            {contact.productType && (
                                <Badge variant="outline" className="bg-slate-100 text-slate-700 font-bold text-[10px] border-slate-200">
                                    {contact.productType.split(",")[0]}
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 font-medium flex-wrap">
                            <span className={`flex items-center gap-1 font-bold ${isTodayHighlight ? "text-rose-700" : "text-rose-600"}`}>
                                📅 Dia {dayStr} de {currentMonthName}
                            </span>
                            {age !== null && (
                                <span className={`font-bold ${isTodayHighlight ? "text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full" : "text-slate-600"}`}>
                                    🎂 {age} anos
                                </span>
                            )}
                            {contact.email && (
                                <span className="hidden md:inline text-slate-400 truncate max-w-[160px]">{contact.email}</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <Button
                        type="button"
                        size="sm"
                        onClick={() => openDispatchModal(contact)}
                        className="rounded-xl font-bold bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs h-9 px-3 gap-1.5 shadow-sm"
                        title="Revisar e personalizar mensagem antes de disparar"
                    >
                        <Edit3 className="h-3.5 w-3.5" />
                        Disparar
                    </Button>

                    {contact.phone && cleanPhone && (
                        <a
                            href={`https://wa.me/${formattedPhone}?text=${encodeURIComponent(personalizedMsg)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="rounded-xl font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 text-xs h-9 px-3 gap-1.5 shadow-sm"
                                title="Abrir WhatsApp direto com modelo atual"
                            >
                                <MessageCircle className="h-4 w-4 text-emerald-600" />
                                WhatsApp
                            </Button>
                        </a>
                    )}

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!canSendEmail || (sendEmailMutation.isPending && sendingContactId === emailContactId)}
                        onClick={() => emailContactId && sendEmailMutation.mutate({ contactId: emailContactId, customMessage: personalizedMsg })}
                        className={`rounded-xl font-bold text-xs h-9 px-3 gap-1.5 shadow-sm ${
                            isTodayHighlight
                                ? "border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700"
                                : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                        }`}
                        title={canSendEmail ? "Disparar e-mail com o modelo atual" : "Contato sem e-mail vinculado"}
                    >
                        {sendEmailMutation.isPending && sendingContactId === emailContactId ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <Mail className="h-3.5 w-3.5 text-rose-500" />
                        )}
                        E-mail
                    </Button>
                </div>
            </div>
        );
    };

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
                        <DialogDescription className="text-rose-100 text-sm font-medium mt-1 flex items-center gap-2 flex-wrap">
                            <span>
                                {monthlyBirthdayContacts.length} {monthlyBirthdayContacts.length === 1 ? 'cliente comemora' : 'clientes comemoram'} aniversário neste mês.
                            </span>
                            {todayBirthdayContacts.length > 0 && (
                                <span className="inline-flex items-center gap-1 bg-amber-300 text-rose-950 font-black text-[11px] uppercase px-2.5 py-0.5 rounded-full shadow-sm">
                                    🎉 {todayBirthdayContacts.length} {todayBirthdayContacts.length === 1 ? "aniversariante hoje!" : "aniversariantes hoje!"}
                                </span>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-6 space-y-5 overflow-y-auto flex-1 bg-slate-50/50">
                        {/* ── DESTAQUE #1: Aniversariante(s) do Dia (Sempre em Primeiro) ── */}
                        {todayBirthdayContacts.length > 0 && (
                            <div className="rounded-3xl border-2 border-rose-400 bg-gradient-to-br from-rose-100/90 via-pink-50/95 to-amber-100/80 p-4 space-y-3 shadow-md">
                                <div className="flex items-center justify-between gap-2 flex-wrap px-1">
                                    <div className="flex items-center gap-2.5">
                                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-rose-600 text-white shadow-sm">
                                            <Sparkles className="h-4 w-4" />
                                        </span>
                                        <div>
                                            <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-rose-950">
                                                🎉 {todayBirthdayContacts.length === 1 ? "Aniversariante do Dia" : `Aniversariantes do Dia (${todayBirthdayContacts.length})`}
                                            </h4>
                                            <p className="text-[11px] font-semibold text-rose-700">
                                                Em destaque — Hoje, dia {String(currentDayNum).padStart(2, "0")} de {currentMonthName}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge className="bg-rose-600 hover:bg-rose-600 text-white font-black text-[10px] uppercase px-3 py-1 rounded-full shadow-sm">
                                        🎂 PARABENIZE HOJE!
                                    </Badge>
                                </div>
                                <div className="space-y-3">
                                    {todayBirthdayContacts.map((contact) => renderBirthdayContactCard(contact, true))}
                                </div>
                            </div>
                        )}

                        {/* ── Editor do Modelo Padrão de Aniversário ── */}
                        <div className="bg-white rounded-2xl border border-rose-200/90 shadow-sm overflow-hidden transition-all">
                            <div
                                onClick={() => setShowTemplateEditor(!showTemplateEditor)}
                                className="px-4 py-3 bg-gradient-to-r from-rose-50/80 via-pink-50/60 to-amber-50/40 flex items-center justify-between cursor-pointer hover:bg-rose-100/50 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-rose-500" />
                                    <span className="text-xs font-bold text-slate-800">
                                        Modelo da Mensagem de Aniversário
                                    </span>
                                    <Badge variant="outline" className="text-[10px] bg-white border-rose-200 text-rose-600 font-bold px-1.5 py-0">
                                        Salvo Automático
                                    </Badge>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-100/60 gap-1 px-2"
                                >
                                    <Edit3 className="h-3 w-3" />
                                    {showTemplateEditor ? "Ocultar Editor ▲" : "Editar Modelo Padrão ▼"}
                                </Button>
                            </div>

                            {showTemplateEditor && (
                                <div className="p-4 space-y-3 bg-white border-t border-rose-100">
                                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                                        <span className="text-[11px]">
                                            Tags disponíveis: <code className="bg-slate-100 px-1 py-0.5 rounded text-rose-600 font-mono">{"{nome}"}</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-rose-600 font-mono">{"{primeiro_nome}"}</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-rose-600 font-mono">{"{idade}"}</code>
                                        </span>
                                        <button
                                            type="button"
                                            onClick={handleResetBirthdayTemplate}
                                            className="text-[11px] text-slate-400 hover:text-rose-600 underline transition-colors"
                                        >
                                            Restaurar Padrão
                                        </button>
                                    </div>
                                    <Textarea
                                        rows={3}
                                        value={birthdayTemplate}
                                        onChange={(e) => handleBirthdayTemplateChange(e.target.value)}
                                        className="text-xs border-rose-200 focus:border-rose-400 rounded-xl leading-relaxed resize-none"
                                        placeholder="Escreva sua mensagem de parabéns..."
                                    />
                                    <div className="flex items-center justify-between text-[11px]">
                                        <span className="text-emerald-600 font-medium flex items-center gap-1">
                                            <Check className="h-3.5 w-3.5" /> A última mensagem editada fica salva automaticamente.
                                        </span>
                                        <span className="text-slate-400 font-mono">{birthdayTemplate.length} caracteres</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {monthlyBirthdayContacts.length === 0 ? (
                            <div className="text-center py-12 text-slate-400 space-y-2">
                                <Cake className="h-12 w-12 mx-auto opacity-30 text-rose-400" />
                                <p className="font-bold text-slate-600">Nenhum aniversariante cadastrado para {currentMonthName}.</p>
                                <p className="text-xs">Certifique-se de preencher a data comemorativa nos cadastros dos clientes.</p>
                            </div>
                        ) : (
                            <>
                                {upcomingBirthdayContacts.length > 0 && (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between px-1">
                                            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                                                🔜 Próximos aniversariantes em {currentMonthName} ({upcomingBirthdayContacts.length})
                                            </span>
                                        </div>
                                        {upcomingBirthdayContacts.map((contact) => renderBirthdayContactCard(contact, false))}
                                    </div>
                                )}

                                {pastBirthdayContacts.length > 0 && (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between px-1">
                                            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                                                📅 Já comemoraram em {currentMonthName} ({pastBirthdayContacts.length})
                                            </span>
                                        </div>
                                        {pastBirthdayContacts.map((contact) => renderBirthdayContactCard(contact, false))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── Modal de Edição e Disparo Personalizado ──────────────────────── */}
            <Dialog open={dispatchContact !== null} onOpenChange={(open) => !open && setDispatchContact(null)}>
                <DialogContent className="sm:max-w-[550px] w-full rounded-3xl border-none shadow-2xl p-0 overflow-hidden bg-white">
                    <DialogHeader className="p-5 bg-gradient-to-r from-rose-500 via-pink-600 to-rose-600 text-white shrink-0">
                        <DialogTitle className="text-xl font-display font-bold flex items-center gap-2 text-white">
                            <Gift className="h-5 w-5 text-amber-300" />
                            Disparar Parabéns de Aniversário
                        </DialogTitle>
                        <DialogDescription className="text-rose-100 text-xs mt-0.5">
                            Edite e confira a mensagem antes de disparar para <strong className="text-white">{dispatchContact?.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-5 space-y-4">
                        <div className="flex items-center justify-between p-3 bg-rose-50/70 rounded-2xl border border-rose-100 text-xs">
                            <div className="space-y-0.5">
                                <div className="font-bold text-slate-900 text-sm">{dispatchContact?.name}</div>
                                <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
                                    {dispatchContact?.phone ? <span>📱 {dispatchContact.phone}</span> : <span className="text-slate-400">Sem telefone</span>}
                                    <span>•</span>
                                    {dispatchContact?.email ? <span>✉️ {dispatchContact.email}</span> : <span className="text-slate-400">Sem e-mail</span>}
                                </div>
                            </div>
                            {calcAge(dispatchContact?.anniversaryDate) !== null && (
                                <Badge variant="outline" className="bg-white border-rose-200 text-rose-700 font-bold">
                                    🎂 {calcAge(dispatchContact?.anniversaryDate)} anos
                                </Badge>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-bold text-slate-700">Mensagem Comemorativa</Label>
                                <span className="text-[10px] text-slate-400 font-mono">{customizedMessage.length} caracteres</span>
                            </div>
                            <Textarea
                                rows={5}
                                value={customizedMessage}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setCustomizedMessage(val);
                                    if (saveAsNewDefault) {
                                        handleBirthdayTemplateChange(val);
                                    }
                                }}
                                className="text-xs border-slate-200 focus:border-rose-400 rounded-xl leading-relaxed resize-none"
                                placeholder="Escreva a mensagem personalizada..."
                            />
                        </div>

                        <div className="flex items-center gap-2 pt-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                            <input
                                type="checkbox"
                                id="saveBirthdayAsDefault"
                                checked={saveAsNewDefault}
                                onChange={(e) => setSaveAsNewDefault(e.target.checked)}
                                className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-4 w-4 cursor-pointer"
                            />
                            <label htmlFor="saveBirthdayAsDefault" className="text-xs text-slate-700 font-medium cursor-pointer">
                                Salvar este texto como novo modelo padrão para os próximos disparos
                            </label>
                        </div>

                        <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    navigator.clipboard.writeText(customizedMessage);
                                    toast({ title: "Mensagem copiada para a área de transferência!" });
                                }}
                                className="rounded-xl text-xs h-9 w-full sm:w-auto font-medium"
                            >
                                <Copy className="h-3.5 w-3.5 mr-1" /> Copiar Texto
                            </Button>

                            {dispatchContact?.phone && (
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => {
                                        if (saveAsNewDefault) {
                                            handleBirthdayTemplateChange(customizedMessage);
                                        }
                                        const cleanPhone = dispatchContact.phone?.replace(/\D/g, "");
                                        const formattedPhone = cleanPhone && cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
                                        const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(customizedMessage)}`;
                                        window.open(waUrl, "_blank", "noopener,noreferrer");
                                        setDispatchContact(null);
                                    }}
                                    className="rounded-xl font-bold text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto gap-1.5 shadow-md shadow-emerald-600/20"
                                >
                                    <MessageCircle className="h-4 w-4" /> Abrir no WhatsApp
                                </Button>
                            )}

                            {(() => {
                                const emailTargetId = dispatchContact?.contactIdForEmail ?? (!dispatchContact?.isEmployee ? dispatchContact?.id : null);
                                if (!dispatchContact?.email || !emailTargetId) return null;
                                return (
                                    <Button
                                        type="button"
                                        size="sm"
                                        disabled={sendEmailMutation.isPending && sendingContactId === emailTargetId}
                                        onClick={() => {
                                            if (saveAsNewDefault) {
                                                handleBirthdayTemplateChange(customizedMessage);
                                            }
                                            sendEmailMutation.mutate({
                                                contactId: emailTargetId,
                                                customMessage: customizedMessage
                                            });
                                            setDispatchContact(null);
                                        }}
                                        className="rounded-xl font-bold text-xs h-9 bg-rose-600 hover:bg-rose-700 text-white w-full sm:w-auto gap-1.5 shadow-md shadow-rose-600/20"
                                    >
                                        {sendEmailMutation.isPending && sendingContactId === emailTargetId ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <Mail className="h-3.5 w-3.5" />
                                        )}
                                        Disparar E-mail
                                    </Button>
                                );
                            })()}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
