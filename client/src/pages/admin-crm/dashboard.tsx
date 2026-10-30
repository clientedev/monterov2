import { useState, useMemo, useEffect, Fragment } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Contact, Lead, Interaction, Task, User, Apolice, Cliente } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { useLocation } from "wouter";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import {
    Users,
    TrendingUp,
    DollarSign,
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
    ArrowRight,
    ArrowUpRight,
    Layers,
    Zap,
    Trophy,
    Calendar,
    CheckCircle2,
    BarChart3,
    Flame,
    Filter,
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
    Area,
    Legend,
} from "recharts";

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

function parseCurrencyValue(raw: string | number | null | undefined): number {
    if (raw === null || raw === undefined) return 0;
    if (typeof raw === "number") return Number.isFinite(raw) ? raw : 0;
    const cleaned = raw.replace(/[^\d.,-]/g, "").trim();
    if (!cleaned) return 0;

    const lastComma = cleaned.lastIndexOf(",");
    const lastDot = cleaned.lastIndexOf(".");

    let normalized = cleaned;
    if (lastComma > lastDot) {
        normalized = cleaned.replace(/\./g, "").replace(",", ".");
    } else if (lastDot > lastComma && lastComma !== -1) {
        normalized = cleaned.replace(/,/g, "");
    } else if (lastDot !== -1 && cleaned.split(".").length > 2) {
        normalized = cleaned.replace(/\./g, "");
    } else if (lastDot !== -1) {
        const [intPart, decPart] = cleaned.split(".");
        if (decPart && decPart.length === 3 && intPart.length >= 1 && intPart !== "0") {
            normalized = intPart + decPart;
        }
    }

    const num = parseFloat(normalized);
    return Number.isFinite(num) ? num : 0;
}

function formatBRL(value: number, compact = false): string {
    if (compact && value >= 1_000_000) {
        return `R$ ${(value / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}M`;
    }
    if (compact && value >= 10_000) {
        return `R$ ${(value / 1_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}k`;
    }
    return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
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

const DEFAULT_LEAD_COLUMNS = [
    { id: "new", label: "Novo Lead" },
    { id: "Respondida", label: "Respondida" },
    { id: "qualified", label: "Qualificado" },
    { id: "proposal", label: "Proposta" },
    { id: "implemented", label: "Implantado" },
    { id: "cancelled", label: "Cancelado" },
];

export interface WidgetItem {
    id: string;
    title: string;
    category: "banner" | "metric" | "chart";
    visible: boolean;
}

const DEFAULT_WIDGETS: WidgetItem[] = [
    { id: "aniversariantes", title: "🎂 Central de Aniversariantes", category: "banner", visible: true },
    { id: "pipelineOverview", title: "🚀 Raio-X do Pipeline & Funil Comercial", category: "banner", visible: true },
    { id: "apolicesMetrics", title: "🛡️ Seguros & Prêmios em Carteira", category: "metric", visible: true },
    { id: "vencimentos30", title: "⏳ Renovações de Seguro (30d)", category: "metric", visible: true },
    { id: "totalContacts", title: "👥 Total de Contatos", category: "metric", visible: true },
    { id: "contatosTipo", title: "🏢 Carteira PF vs PJ", category: "metric", visible: true },
    { id: "activeLeads", title: "📈 Leads Ativos no Funil", category: "metric", visible: true },
    { id: "leadsImplantados", title: "🏆 Negócios Implantados", category: "metric", visible: true },
    { id: "totalValue", title: "💰 Volume em Negociação", category: "metric", visible: true },
    { id: "ticketMedio", title: "💎 Ticket Médio Comercial", category: "metric", visible: true },
    { id: "conversionRate", title: "🎯 Taxa de Conversão", category: "metric", visible: true },
    { id: "pendingTasks", title: "✅ Tarefas Pendentes", category: "metric", visible: true },
    { id: "overdueTasks", title: "⚠️ Tarefas Atrasadas / Urgentes", category: "metric", visible: true },
    { id: "monthlyInteractions", title: "💬 Interações no Mês", category: "metric", visible: true },
    { id: "chartLeadFlow", title: "🌊 Captação de Leads (15 dias)", category: "chart", visible: true },
    { id: "chartMix", title: "🥧 Mix de Atividades & Canais", category: "chart", visible: true },
    { id: "chartApolicesSeguradora", title: "🏛️ Ranking por Seguradora", category: "chart", visible: true },
    { id: "chartApolicesProduto", title: "📦 Carteira por Ramo / Produto", category: "chart", visible: true },
    { id: "chartOrigemContatos", title: "🌐 Canais de Origem dos Clientes", category: "chart", visible: true },
    { id: "chartProspecting", title: "📊 Produtividade por Consultor", category: "chart", visible: true },
];

const STORAGE_KEY = "montero_crm_dashboard_layout_v5";
const CHART_COLORS = ["#0F6570", "#0d9488", "#c65f54", "#f59e0b", "#6366f1", "#10b981", "#ec4899", "#8b5cf6"];

function CustomChartTooltip({ active, payload, label, suffix = "" }: any) {
    if (!active || !payload || !payload.length) return null;
    return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white px-3.5 py-2.5 rounded-xl shadow-2xl border border-slate-700/70 text-xs space-y-1.5">
            {label && <p className="font-bold text-slate-300 border-b border-slate-700/70 pb-1">{label}</p>}
            {payload.map((entry: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: entry.color || entry.fill || "#14b8a6" }}
                        />
                        <span className="text-slate-300 font-medium">{entry.name}:</span>
                    </div>
                    <span className="font-extrabold text-white tabular-nums">
                        {typeof entry.value === "number" ? entry.value.toLocaleString("pt-BR") : entry.value}
                        {suffix}
                    </span>
                </div>
            ))}
        </div>
    );
}

export default function AdminDashboard() {
    const { toast } = useToast();
    const { user } = useAuth();
    const { settings } = useSiteSettings();
    const [, setLocation] = useLocation();

    const [birthdayModalOpen, setBirthdayModalOpen] = useState(false);
    const [customizeOpen, setCustomizeOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [sendingContactId, setSendingContactId] = useState<number | null>(null);

    // Interactive Pipeline Centerpiece State
    const [selectedPipelineStage, setSelectedPipelineStage] = useState<string>("all");
    const [pipelineRightTab, setPipelineRightTab] = useState<"deals" | "products">("deals");

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

    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed: WidgetItem[] = JSON.parse(saved);
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
        const updated = widgets.map(w => (w.id === id ? { ...w, visible: !w.visible } : w));
        saveLayout(updated);
    };

    const setAllVisibility = (visible: boolean) => {
        const updated = widgets.map(w => ({ ...w, visible }));
        saveLayout(updated);
    };

    const handleModalDragEnd = (result: DropResult) => {
        if (!result.destination) return;
        const updated = Array.from(widgets);
        const [moved] = updated.splice(result.source.index, 1);
        updated.splice(result.destination.index, 0, moved);
        saveLayout(updated);
    };

    const handleMainDragEnd = (result: DropResult) => {
        if (!result.destination) return;
        const visibleIndexes = widgets.map((w, i) => (w.visible ? i : -1)).filter(i => i !== -1);
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

    // Humor Diário da Equipe
    const { data: todayMoodsData, refetch: refetchMoods } = useQuery<{ date: string; moods: Array<{ id: number; userId: number; userName: string; moodKey: string; moodLabel: string; moodEmoji: string; quote: string; date: string; updatedAt: string }> }>({
        queryKey: ["/api/user-moods/today"],
        refetchInterval: 30000,
    });

    const setMoodMutation = useMutation({
        mutationFn: async (payload: { moodKey: string; moodLabel: string; moodEmoji: string; quote: string }) => {
            const res = await apiRequest("POST", "/api/user-moods", payload);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/user-moods/today"] });
            toast({ title: "Humor registrado!", description: "Sua mensagem inspiradora já está visível para a equipe." });
        },
        onError: (err: any) => {
            toast({ title: "Erro ao registrar humor", description: err.message, variant: "destructive" });
        }
    });

    // Pipeline Columns from Site Settings
    const leadColumns = useMemo(() => {
        if (settings?.leadColumns) {
            try {
                const parsed = JSON.parse(settings.leadColumns);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    const copy = [...parsed];
                    if (!copy.some((c: any) => c.id?.toLowerCase() === "respondida")) {
                        copy.splice(1, 0, { id: "Respondida", label: "Respondida" });
                    }
                    return copy as Array<{ id: string; label: string }>;
                }
            } catch {}
        }
        return DEFAULT_LEAD_COLUMNS;
    }, [settings?.leadColumns]);

    const isWonStatus = (s?: string | null) => /^(implemented|closed|ganho|fechado|implantado)$/i.test((s || "").trim());
    const isLostStatus = (s?: string | null) => /^(cancelled|canceled|lost|perdido|cancelado)$/i.test((s || "").trim());
    const isProposalStatus = (s?: string | null) => /^(proposal|proposta|cotacao|cotação)$/i.test((s || "").trim());

    // Contacts & Leads Computed Metrics
    const totalContacts = contacts?.length || 0;
    const pfContacts = contacts?.filter(c => (c.type || "individual") === "individual").length || 0;
    const pjContacts = contacts?.filter(c => c.type === "company").length || 0;

    const allLeads = leads || [];
    const activeLeadsList = useMemo(
        () => allLeads.filter(l => !isWonStatus(l.status) && !isLostStatus(l.status)),
        [allLeads]
    );
    const wonLeadsList = useMemo(() => allLeads.filter(l => isWonStatus(l.status)), [allLeads]);
    const lostLeadsList = useMemo(() => allLeads.filter(l => isLostStatus(l.status)), [allLeads]);
    const proposalLeadsList = useMemo(() => allLeads.filter(l => isProposalStatus(l.status)), [allLeads]);

    const activeLeads = activeLeadsList.length;
    const wonLeadsCount = wonLeadsList.length;

    const activePipelineValue = useMemo(
        () => activeLeadsList.reduce((acc, curr) => acc + parseCurrencyValue(curr.value), 0),
        [activeLeadsList]
    );
    const wonPipelineValue = useMemo(
        () => wonLeadsList.reduce((acc, curr) => acc + parseCurrencyValue(curr.value), 0),
        [wonLeadsList]
    );
    const proposalPipelineValue = useMemo(
        () => proposalLeadsList.reduce((acc, curr) => acc + parseCurrencyValue(curr.value), 0),
        [proposalLeadsList]
    );
    const totalValue = activePipelineValue;

    const pricedActiveOrWon = useMemo(
        () => [...activeLeadsList, ...wonLeadsList].filter(l => parseCurrencyValue(l.value) > 0),
        [activeLeadsList, wonLeadsList]
    );
    const ticketMedio =
        pricedActiveOrWon.length > 0
            ? pricedActiveOrWon.reduce((acc, l) => acc + parseCurrencyValue(l.value), 0) / pricedActiveOrWon.length
            : activeLeads > 0
            ? activePipelineValue / activeLeads
            : 0;

    const decidedLeadsTotal = wonLeadsCount + lostLeadsList.length;
    const leadWinRate =
        decidedLeadsTotal > 0
            ? ((wonLeadsCount / decidedLeadsTotal) * 100).toFixed(0)
            : allLeads.length > 0
            ? ((wonLeadsCount / allLeads.length) * 100).toFixed(0)
            : "0";

    const conversionRate =
        totalContacts > 0 ? ((totalContacts / (totalContacts + activeLeads)) * 100).toFixed(1) : "0";

    const sevenDaysAgo = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);

    const newLeadsLast7d = useMemo(
        () => allLeads.filter(l => l.createdAt && new Date(l.createdAt) >= sevenDaysAgo).length,
        [allLeads, sevenDaysAgo]
    );

    // Stage Funnel Computation
    const pipelineStagesData = useMemo(() => {
        const orderedCols = [
            ...leadColumns.filter(c => !isLostStatus(c.id) && !isWonStatus(c.id)),
            ...leadColumns.filter(c => isWonStatus(c.id)),
            ...leadColumns.filter(c => isLostStatus(c.id)),
        ];

        // Include any orphan status present on leads not in orderedCols
        const knownIds = new Set(orderedCols.map(c => c.id));
        for (const l of allLeads) {
            if (l.status && !knownIds.has(l.status)) {
                knownIds.add(l.status);
                orderedCols.push({ id: l.status, label: l.status });
            }
        }

        const stagePalette = [
            { bar: "from-sky-500 to-blue-600", badge: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" },
            { bar: "from-indigo-500 to-violet-600", badge: "bg-indigo-50 text-indigo-700 border-indigo-200", dot: "bg-indigo-500" },
            { bar: "from-violet-500 to-purple-600", badge: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-purple-500" },
            { bar: "from-amber-400 to-orange-500", badge: "bg-amber-50 text-amber-800 border-amber-200", dot: "bg-amber-500" },
            { bar: "from-teal-500 to-cyan-600", badge: "bg-teal-50 text-teal-800 border-teal-200", dot: "bg-teal-500" },
        ];

        let activeIdx = 0;
        const rawStages = orderedCols.map(col => {
            const stageLeads = allLeads.filter(l => l.status === col.id);
            const value = stageLeads.reduce((s, l) => s + parseCurrencyValue(l.value), 0);
            const won = isWonStatus(col.id);
            const lost = isLostStatus(col.id);

            let style = stagePalette[activeIdx % stagePalette.length];
            if (won) {
                style = {
                    bar: "from-emerald-500 to-teal-600",
                    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
                    dot: "bg-emerald-500",
                };
            } else if (lost) {
                style = {
                    bar: "from-rose-400 to-red-500",
                    badge: "bg-rose-50 text-rose-700 border-rose-200",
                    dot: "bg-rose-500",
                };
            } else if (isProposalStatus(col.id)) {
                style = {
                    bar: "from-amber-400 to-orange-500",
                    badge: "bg-amber-50 text-amber-800 border-amber-200",
                    dot: "bg-amber-500",
                };
                activeIdx++;
            } else {
                activeIdx++;
            }

            return {
                id: col.id,
                label: col.label,
                count: stageLeads.length,
                value,
                won,
                lost,
                ...style,
            };
        });

        const maxCount = Math.max(1, ...rawStages.map(s => s.count));
        const totalCount = Math.max(1, allLeads.length);

        return rawStages.map(s => ({
            ...s,
            pctOfTotal: Math.round((s.count / totalCount) * 100),
            barWidthPct: s.count === 0 ? 4 : Math.max(12, Math.round((s.count / maxCount) * 100)),
        }));
    }, [leadColumns, allLeads]);

    // Resolve Contact/Cliente Name & Consultant for Pipeline Radar
    const getLeadClientName = (contactId: number) => {
        const c = contacts?.find(item => item.id === contactId);
        if (c) return c.name;
        const cl = clientes?.find(item => item.id === contactId || item.contactId === contactId);
        if (cl) return cl.nome;
        return `Contato #${contactId}`;
    };

    const getConsultantFirstName = (userId?: number | null) => {
        if (!userId) return "Sem resp.";
        const u = users?.find(item => item.id === userId);
        return u ? u.name.split(" ")[0] : "Consultor";
    };

    const getStageMeta = (statusId: string) => {
        return (
            pipelineStagesData.find(s => s.id === statusId) || {
                label: statusId,
                badge: "bg-slate-100 text-slate-700 border-slate-200",
                dot: "bg-slate-400",
            }
        );
    };

    const highlightedLeads = useMemo(() => {
        const pool =
            selectedPipelineStage === "all"
                ? allLeads.filter(l => !isLostStatus(l.status))
                : allLeads.filter(l => l.status === selectedPipelineStage);

        return [...pool]
            .sort((a, b) => {
                const valDiff = parseCurrencyValue(b.value) - parseCurrencyValue(a.value);
                if (valDiff !== 0) return valDiff;
                const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return timeB - timeA;
            })
            .slice(0, 5);
    }, [allLeads, selectedPipelineStage]);

    const pipelineProductsBreakdown = useMemo(() => {
        const map = new Map<string, { name: string; count: number; value: number }>();
        for (const l of allLeads) {
            if (isLostStatus(l.status)) continue;
            const rawProd = (l.product || "Consultoria / Geral").split(",")[0].trim() || "Consultoria / Geral";
            const existing = map.get(rawProd) || { name: rawProd, count: 0, value: 0 };
            existing.count += 1;
            existing.value += parseCurrencyValue(l.value);
            map.set(rawProd, existing);
        }
        return Array.from(map.values())
            .sort((a, b) => b.count - a.count || b.value - a.value)
            .slice(0, 6);
    }, [allLeads]);

    // Operational Tasks & Interactions Metrics
    const pendingTasks = tasks?.filter(t => t.status !== "done").length || 0;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const overdueTasks =
        tasks?.filter(t => {
            if (t.status === "done") return false;
            if (!t.dueDate) return false;
            return new Date(t.dueDate) < todayStart;
        }).length || 0;

    const currentMonth = new Date().getMonth();
    const monthlyInteractions =
        interactionHistory?.filter(i => {
            if (!i.date) return false;
            return new Date(i.date).getMonth() === currentMonth;
        }).length || 0;

    // Seguros Computed Metrics
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

    // Birthdays Logic
    const currentMonthNum = todayStart.getMonth() + 1;
    const currentDayNum = todayStart.getDate();
    const monthNames = [
        "Janeiro",
        "Fevereiro",
        "Março",
        "Abril",
        "Maio",
        "Junho",
        "Julho",
        "Agosto",
        "Setembro",
        "Outubro",
        "Novembro",
        "Dezembro",
    ];
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
                customMessage,
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
        },
    });

    // ── Analytics Studio Datasets ────────────────────────────────────────────
    // 1. Lead Flow (Last 15 days)
    const last15Days = Array.from({ length: 15 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (14 - i));
        return d.toISOString().split("T")[0];
    });

    const leadFlowData = last15Days.map(date => ({
        date: date.split("-").slice(1).reverse().join("/"),
        count:
            allLeads.filter(l => l.createdAt && new Date(l.createdAt).toISOString().split("T")[0] === date).length || 0,
    }));
    const totalLeads15d = leadFlowData.reduce((s, d) => s + d.count, 0);
    const peakLeadDay = leadFlowData.reduce(
        (best, cur) => (cur.count > best.count ? cur : best),
        leadFlowData[0] || { date: "—", count: 0 }
    );

    // 2. Mix de Atividades (dynamic categorization of all interaction types)
    const typeDistribution = useMemo(() => {
        const buckets: Record<string, { name: string; value: number; color: string }> = {
            call: { name: "Ligações", value: 0, color: "#0F6570" },
            whatsapp: { name: "WhatsApp", value: 0, color: "#10b981" },
            email: { name: "E-mails", value: 0, color: "#6366f1" },
            meeting: { name: "Reuniões", value: 0, color: "#f59e0b" },
            note: { name: "Notas / Outros", value: 0, color: "#c65f54" },
        };

        for (const i of interactionHistory || []) {
            const t = (i.type || "").toLowerCase();
            if (t.includes("call") || t.includes("liga") || t.includes("telef")) {
                buckets.call.value++;
            } else if (t.includes("whats") || t.includes("mensagem")) {
                buckets.whatsapp.value++;
            } else if (t.includes("mail") || t.includes("anivers")) {
                buckets.email.value++;
            } else if (t.includes("meet") || t.includes("reuni") || t.includes("visita")) {
                buckets.meeting.value++;
            } else {
                buckets.note.value++;
            }
        }

        return Object.values(buckets)
            .filter(d => d.value > 0)
            .sort((a, b) => b.value - a.value);
    }, [interactionHistory]);

    const totalInteractionsCount = typeDistribution.reduce((s, d) => s + d.value, 0);

    // 3. Seguradoras & Produtos
    const seguradorasData: Array<{ nome: string; total: number }> = useMemo(
        () => [...(seguroStats?.porSeguradora || [])].sort((a, b) => b.total - a.total),
        [seguroStats?.porSeguradora]
    );
    const produtosData: Array<{ nome: string; total: number }> = useMemo(
        () => [...(seguroStats?.porProduto || [])].sort((a, b) => b.total - a.total),
        [seguroStats?.porProduto]
    );

    // 4. Origem de Contatos
    const origensData = useMemo(() => {
        const origensMap: Record<string, number> = {};
        (contacts || []).forEach(c => {
            const origin = (c.contactOrigin || (c.isReferral ? "Indicação" : "Direto / Outros")).trim();
            origensMap[origin] = (origensMap[origin] || 0) + 1;
        });
        return Object.entries(origensMap)
            .map(([nome, total]) => ({ nome, total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 7);
    }, [contacts]);

    // 5. Team Commercial Productivity (Leads + Prospecções + Interações por Consultor)
    const consultantPerformanceData = useMemo(() => {
        const staff = (users || []).filter(u => u.role === "admin" || u.role === "employee");
        return staff
            .map(u => {
                const leadsCount = allLeads.filter(l => l.assignedTo === u.id).length;
                const prospCount = (prospectingHistory || []).filter(p => p.userId === u.id).length;
                const interCount = (interactionHistory || []).filter(i => i.userId === u.id).length;
                return {
                    name: u.name.trim().split(" ")[0],
                    leads: leadsCount,
                    atividades: prospCount + interCount,
                    total: leadsCount + prospCount + interCount,
                };
            })
            .filter(d => d.total > 0)
            .sort((a, b) => b.total - a.total)
            .slice(0, 8);
    }, [users, allLeads, prospectingHistory, interactionHistory]);

    // Widget Grid Span Classes (Balanced 12-Col Architecture)
    const getWidgetSpanClass = (category: string, id: string) => {
        if (id === "aniversariantes" || id === "pipelineOverview") return "col-span-12";
        if (category === "banner") return "col-span-12";
        if (category === "metric") return "col-span-12 sm:col-span-6 lg:col-span-3";
        if (id === "chartLeadFlow") return "col-span-12 lg:col-span-8";
        if (id === "chartMix") return "col-span-12 lg:col-span-4";
        if (category === "chart") return "col-span-12 lg:col-span-6";
        return "col-span-12 sm:col-span-6 lg:col-span-4";
    };

    // Render Widget Content
    const renderWidgetContent = (id: string) => {
        switch (id) {
            case "aniversariantes": {
                const previewList =
                    upcomingBirthdayContacts.length > 0
                        ? upcomingBirthdayContacts.slice(0, 3)
                        : pastBirthdayContacts.slice(-3).reverse();
                const nextBirthday = upcomingBirthdayContacts[0] || null;
                const daysUntilNext = nextBirthday ? nextBirthday.day - currentDayNum : null;

                return (
                    <Card
                        className={`rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 border shadow-lg hover:shadow-xl relative bg-white ${
                            todayBirthdayContacts.length > 0
                                ? "border-rose-300/90 ring-2 ring-rose-200/60"
                                : "border-slate-200/90 hover:border-rose-200"
                        }`}
                        onClick={() => setBirthdayModalOpen(true)}
                    >
                        {/* Top celebratory accent bar */}
                        <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 via-amber-400 to-pink-500" />

                        {/* Ambient decorative glow */}
                        <div className="pointer-events-none absolute -top-16 -left-16 h-48 w-48 rounded-full bg-rose-400/10 blur-3xl" />
                        <div className="pointer-events-none absolute -bottom-16 right-1/3 h-48 w-48 rounded-full bg-amber-300/15 blur-3xl" />

                        <div className="grid grid-cols-1 lg:grid-cols-12 relative">
                            {/* Left / Main VIP Spotlight Stage */}
                            <div className="lg:col-span-8 p-6 flex flex-col justify-between gap-5">
                                <div className="flex items-center justify-between gap-3 flex-wrap">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`h-11 w-11 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0 ${
                                                todayBirthdayContacts.length > 0
                                                    ? "bg-gradient-to-br from-rose-500 via-pink-600 to-amber-500 shadow-rose-500/25"
                                                    : "bg-gradient-to-br from-rose-500 to-pink-600"
                                            }`}
                                        >
                                            <Cake className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="text-base sm:text-lg font-display font-bold text-slate-900">
                                                    Central de Aniversariantes • {currentMonthName}
                                                </h3>
                                                {todayBirthdayContacts.length > 0 && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-sm animate-pulse">
                                                        <Sparkles className="h-3 w-3" />
                                                        {todayBirthdayContacts.length === 1
                                                            ? "1 Hoje!"
                                                            : `${todayBirthdayContacts.length} Hoje!`}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 font-medium">
                                                Relacionamento ativo e régua de felicitações com clientes e equipe
                                            </p>
                                        </div>
                                    </div>

                                    <Badge
                                        variant="outline"
                                        className="rounded-full bg-rose-50/80 text-rose-700 font-bold px-3 py-1 border-rose-200"
                                    >
                                        🎂 {monthlyBirthdayContacts.length} em {currentMonthName}
                                    </Badge>
                                </div>

                                {todayBirthdayContacts.length > 0 ? (
                                    <div className="rounded-2xl border-2 border-rose-200/90 bg-gradient-to-r from-rose-50/90 via-amber-50/50 to-pink-50/60 p-4 space-y-3">
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                            <span className="text-[11px] font-black uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                                                <Gift className="h-4 w-4 text-rose-500 shrink-0" />
                                                {todayBirthdayContacts.length === 1
                                                    ? "🎉 Aniversariante do Dia em Destaque"
                                                    : `🎉 Aniversariantes do Dia em Destaque (${todayBirthdayContacts.length})`}
                                            </span>
                                            <span className="text-[11px] font-bold text-rose-800 bg-white/90 border border-rose-200 px-2.5 py-0.5 rounded-full shadow-sm">
                                                Hoje • {String(currentDayNum).padStart(2, "0")}/{String(currentMonthNum).padStart(2, "0")}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 gap-2.5">
                                            {todayBirthdayContacts.map(person => {
                                                const age = calcAge(person.anniversaryDate);
                                                const cleanPhone = person.phone?.replace(/\D/g, "");
                                                const formattedPhone =
                                                    cleanPhone && cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
                                                const quickMsg = formatBirthdayText(birthdayTemplate, person);

                                                return (
                                                    <div
                                                        key={person.id}
                                                        className="bg-white rounded-xl border border-rose-200/90 px-3.5 py-3 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-rose-400 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="relative shrink-0">
                                                                <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-rose-600 via-pink-500 to-amber-400 text-white font-display font-black text-base flex items-center justify-center shadow-sm ring-2 ring-rose-200">
                                                                    {person.name.charAt(0).toUpperCase()}
                                                                </div>
                                                                <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-amber-300 border border-white flex items-center justify-center text-[10px] shadow-sm">
                                                                    🎂
                                                                </span>
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <span className="font-display font-extrabold text-slate-900 text-base sm:text-lg truncate">
                                                                        {person.name}
                                                                    </span>
                                                                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-600 text-white">
                                                                        🥳 É Hoje!
                                                                    </span>
                                                                    {age !== null && (
                                                                        <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                                                                            {age} anos
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {person.productType && (
                                                                    <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                                                                        Carteira: {person.productType}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div
                                                            className="flex items-center gap-2 shrink-0 self-end sm:self-auto"
                                                            onClick={e => e.stopPropagation()}
                                                        >
                                                            {person.phone && cleanPhone && (
                                                                <a
                                                                    href={`https://wa.me/${formattedPhone}?text=${encodeURIComponent(quickMsg)}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                >
                                                                    <Button
                                                                        type="button"
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="h-8 rounded-lg text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 gap-1.5 px-2.5"
                                                                    >
                                                                        <MessageCircle className="h-3.5 w-3.5" />
                                                                        WhatsApp
                                                                    </Button>
                                                                </a>
                                                            )}
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                onClick={() => openDispatchModal(person)}
                                                                className="h-8 rounded-lg text-xs font-bold bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white gap-1.5 px-3 shadow-sm"
                                                            >
                                                                <Gift className="h-3.5 w-3.5" />
                                                                Parabenizar
                                                            </Button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-bold text-slate-800">
                                                Nenhum aniversariante hoje ({String(currentDayNum).padStart(2, "0")}/{String(currentMonthNum).padStart(2, "0")})
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {nextBirthday
                                                    ? `Próxima comemoração: ${nextBirthday.name} no dia ${String(nextBirthday.day).padStart(2, "0")} (${
                                                          daysUntilNext === 1 ? "amanhã!" : `em ${daysUntilNext} dias`
                                                      }).`
                                                    : `Confira os ${monthlyBirthdayContacts.length} aniversariantes registrados em ${currentMonthName}.`}
                                            </p>
                                        </div>
                                        {nextBirthday && (
                                            <Badge className="bg-amber-100 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs px-3 py-1 rounded-xl shrink-0 self-start sm:self-auto">
                                                🔜 Dia {String(nextBirthday.day).padStart(2, "0")} • {nextBirthday.name.split(" ")[0]}
                                            </Badge>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Right / Monthly Agenda Concierge Panel */}
                            <div className="lg:col-span-4 bg-gradient-to-br from-slate-50 via-rose-50/30 to-amber-50/40 border-t lg:border-t-0 lg:border-l border-slate-100 p-5 flex flex-col justify-between gap-4">
                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5 text-rose-500" />
                                            {upcomingBirthdayContacts.length > 0 ? "Próximos do Mês" : "Destaques do Mês"}
                                        </span>
                                        <span className="text-[11px] font-bold text-slate-400">
                                            {monthlyBirthdayContacts.length} total
                                        </span>
                                    </div>

                                    {previewList.length === 0 ? (
                                        <div className="py-4 text-xs text-slate-400 font-medium">
                                            {todayBirthdayContacts.length > 0
                                                ? "Todos os aniversariantes cadastrados deste mês comemoram hoje!"
                                                : "Sem outros aniversários neste mês."}
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {previewList.map(item => (
                                                <div
                                                    key={item.id}
                                                    className="flex items-center justify-between gap-2 bg-white/90 border border-slate-200/70 rounded-xl px-3 py-2 shadow-sm"
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className="h-7 w-7 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                                                            {item.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="text-xs font-bold text-slate-800 truncate">
                                                            {item.name}
                                                        </span>
                                                    </div>
                                                    <span className="text-[11px] font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md shrink-0 tabular-nums">
                                                        Dia {String(item.day).padStart(2, "0")}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="w-full rounded-xl font-bold text-xs h-9 bg-white hover:bg-rose-50 text-rose-600 border-rose-200 shadow-sm justify-between px-3.5"
                                >
                                    <span>Abrir Lista & Disparos ({monthlyBirthdayContacts.length})</span>
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                );
            }

            case "pipelineOverview":
                return (
                    <Card className="rounded-3xl bg-white border border-slate-200/80 shadow-lg overflow-hidden">
                        {/* Executive Pipeline Header */}
                        <div className="px-6 py-5 bg-gradient-to-r from-[#08454c] via-[#0F6570] to-[#163b52] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3.5">
                                <div className="h-11 w-11 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 flex items-center justify-center shrink-0">
                                    <Layers className="h-5 w-5 text-amber-300" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="text-lg font-display font-bold text-white tracking-tight">
                                            Raio-X do Pipeline & Funil Comercial
                                        </h3>
                                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                                            Interativo
                                        </span>
                                    </div>
                                    <p className="text-xs text-teal-100/85 mt-0.5">
                                        Clique em qualquer etapa do funil abaixo para filtrar os negócios em destaque ao lado
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                {selectedPipelineStage !== "all" && (
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setSelectedPipelineStage("all")}
                                        className="h-9 rounded-xl text-xs font-bold text-amber-200 hover:text-white hover:bg-white/10 gap-1.5"
                                    >
                                        <Filter className="h-3.5 w-3.5" />
                                        Limpar Filtro
                                    </Button>
                                )}
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => setLocation("/admin/leads")}
                                    className="h-9 rounded-xl text-xs font-bold bg-white text-[#08454c] hover:bg-amber-50 shadow-sm gap-1.5 px-4"
                                >
                                    Abrir Kanban Completo
                                    <ArrowUpRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* 4 Pipeline KPI Summary Strip */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/70 bg-slate-50/70 border-b border-slate-200/70">
                            <div className="p-4 sm:px-6 flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                        Pipeline em Aberto
                                    </p>
                                    <p className="text-2xl font-display font-bold text-slate-900 tabular-nums mt-0.5">
                                        {formatBRL(activePipelineValue)}
                                    </p>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                                        {activeLeads} {activeLeads === 1 ? "oportunidade ativa" : "oportunidades ativas"}
                                    </p>
                                </div>
                                <div className="h-10 w-10 rounded-xl bg-teal-100/70 text-[#0F6570] flex items-center justify-center shrink-0">
                                    <TrendingUp className="h-5 w-5" />
                                </div>
                            </div>

                            <div className="p-4 sm:px-6 flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                                        Em Fase de Proposta
                                    </p>
                                    <p className="text-2xl font-display font-bold text-amber-600 tabular-nums mt-0.5">
                                        {formatBRL(proposalPipelineValue)}
                                    </p>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                                        {proposalLeadsList.length}{" "}
                                        {proposalLeadsList.length === 1 ? "proposta enviada" : "propostas na mesa"}
                                    </p>
                                </div>
                                <div className="h-10 w-10 rounded-xl bg-amber-100/80 text-amber-600 flex items-center justify-center shrink-0">
                                    <Flame className="h-5 w-5" />
                                </div>
                            </div>

                            <div className="p-4 sm:px-6 flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                                        Implantados (Ganhos)
                                    </p>
                                    <p className="text-2xl font-display font-bold text-emerald-600 tabular-nums mt-0.5">
                                        {formatBRL(wonPipelineValue)}
                                    </p>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                                        {wonLeadsCount} fechados • Win rate <strong className="text-emerald-700">{leadWinRate}%</strong>
                                    </p>
                                </div>
                                <div className="h-10 w-10 rounded-xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center shrink-0">
                                    <Trophy className="h-5 w-5" />
                                </div>
                            </div>

                            <div className="p-4 sm:px-6 flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                                        Tração (Últimos 7d)
                                    </p>
                                    <p className="text-2xl font-display font-bold text-slate-900 tabular-nums mt-0.5">
                                        +{newLeadsLast7d} <span className="text-sm font-semibold text-slate-500">novos</span>
                                    </p>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                                        Ticket médio {formatBRL(ticketMedio, true)}
                                    </p>
                                </div>
                                <div className="h-10 w-10 rounded-xl bg-indigo-100/80 text-indigo-600 flex items-center justify-center shrink-0">
                                    <Zap className="h-5 w-5" />
                                </div>
                            </div>
                        </div>

                        {/* 2-Column Body: Visual Stage Funnel + Live Opportunity Radar */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
                            {/* Left: Interactive Conversion Funnel */}
                            <div className="lg:col-span-7 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                                        Arquitetura de Etapas do Funil ({allLeads.length} leads totais)
                                    </h4>
                                    <span className="text-[11px] text-slate-400 font-medium">
                                        {selectedPipelineStage === "all"
                                            ? "Mostrando todas as etapas"
                                            : `Filtrado: ${getStageMeta(selectedPipelineStage).label}`}
                                    </span>
                                </div>

                                <div className="space-y-2.5">
                                    {pipelineStagesData.map(stage => {
                                        const isSelected = selectedPipelineStage === stage.id;
                                        return (
                                            <button
                                                key={stage.id}
                                                type="button"
                                                onClick={() =>
                                                    setSelectedPipelineStage(prev => (prev === stage.id ? "all" : stage.id))
                                                }
                                                className={`w-full text-left rounded-2xl p-3.5 border transition-all group ${
                                                    isSelected
                                                        ? "bg-slate-900/[0.03] border-[#0F6570] ring-2 ring-[#0F6570]/20 shadow-sm"
                                                        : "bg-slate-50/60 hover:bg-white border-slate-200/80 hover:border-slate-300"
                                                }`}
                                            >
                                                <div className="flex items-center justify-between gap-2 mb-2">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${stage.dot}`} />
                                                        <span className="font-bold text-sm text-slate-800 truncate">
                                                            {stage.label}
                                                        </span>
                                                        {stage.won && (
                                                            <Badge className="bg-emerald-100 hover:bg-emerald-100 text-emerald-800 border-none text-[10px] font-bold px-2 py-0">
                                                                Ganho
                                                            </Badge>
                                                        )}
                                                        {stage.lost && (
                                                            <Badge className="bg-rose-100 hover:bg-rose-100 text-rose-700 border-none text-[10px] font-bold px-2 py-0">
                                                                Perdido
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-2.5 shrink-0 tabular-nums">
                                                        {stage.value > 0 && (
                                                            <span className="text-xs font-extrabold text-slate-700">
                                                                {formatBRL(stage.value, true)}
                                                            </span>
                                                        )}
                                                        <span
                                                            className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${stage.badge}`}
                                                        >
                                                            {stage.count} ({stage.pctOfTotal}%)
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="h-2.5 w-full bg-slate-200/70 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full bg-gradient-to-r ${stage.bar} transition-all duration-500`}
                                                        style={{ width: `${stage.barWidthPct}%` }}
                                                    />
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Right: Live Opportunity Radar & Product Demand */}
                            <div className="lg:col-span-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 flex flex-col justify-between gap-4">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between gap-2 bg-white p-1 rounded-xl border border-slate-200/80">
                                        <button
                                            type="button"
                                            onClick={() => setPipelineRightTab("deals")}
                                            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                                                pipelineRightTab === "deals"
                                                    ? "bg-[#08454c] text-white shadow-sm"
                                                    : "text-slate-600 hover:text-slate-900"
                                            }`}
                                        >
                                            🔥 Oportunidades ({highlightedLeads.length})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPipelineRightTab("products")}
                                            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                                                pipelineRightTab === "products"
                                                    ? "bg-[#08454c] text-white shadow-sm"
                                                    : "text-slate-600 hover:text-slate-900"
                                            }`}
                                        >
                                            📦 Demanda por Produto
                                        </button>
                                    </div>

                                    {pipelineRightTab === "deals" ? (
                                        highlightedLeads.length === 0 ? (
                                            <div className="py-12 text-center space-y-2">
                                                <Target className="h-9 w-9 text-slate-300 mx-auto" />
                                                <p className="text-sm font-bold text-slate-600">
                                                    Nenhuma oportunidade nesta etapa
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    Selecione outra etapa ao lado ou cadastre um novo lead no Pipeline.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2.5">
                                                {highlightedLeads.map(lead => {
                                                    const stageInfo = getStageMeta(lead.status);
                                                    const val = parseCurrencyValue(lead.value);
                                                    const clientName = getLeadClientName(lead.contactId);
                                                    return (
                                                        <div
                                                            key={lead.id}
                                                            onClick={() => setLocation("/admin/leads")}
                                                            className="bg-white rounded-xl border border-slate-200/80 hover:border-[#0F6570] p-3 shadow-sm cursor-pointer transition-all group flex items-center justify-between gap-3"
                                                        >
                                                            <div className="min-w-0 space-y-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-sm text-slate-900 truncate group-hover:text-[#0F6570] transition-colors">
                                                                        {clientName}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                                    <span
                                                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${stageInfo.badge}`}
                                                                    >
                                                                        {stageInfo.label}
                                                                    </span>
                                                                    {lead.product && (
                                                                        <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full truncate max-w-[120px]">
                                                                            {lead.product}
                                                                        </span>
                                                                    )}
                                                                    <span className="text-[10px] text-slate-400 font-medium">
                                                                        • {getConsultantFirstName(lead.assignedTo)}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="text-right shrink-0">
                                                                <p className="text-xs font-extrabold text-[#08454c] tabular-nums">
                                                                    {val > 0 ? formatBRL(val) : "Sob consulta"}
                                                                </p>
                                                                <span className="text-[10px] font-bold text-slate-400 group-hover:text-[#0F6570] inline-flex items-center gap-0.5">
                                                                    Ver <ArrowRight className="h-2.5 w-2.5" />
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )
                                    ) : pipelineProductsBreakdown.length === 0 ? (
                                        <div className="py-12 text-center text-xs text-slate-400">
                                            Nenhum produto vinculado aos leads ativos.
                                        </div>
                                    ) : (
                                        <div className="space-y-2.5 pt-1">
                                            {pipelineProductsBreakdown.map((prod, idx) => {
                                                const maxProd = Math.max(1, pipelineProductsBreakdown[0].count);
                                                const pct = Math.max(12, Math.round((prod.count / maxProd) * 100));
                                                return (
                                                    <div
                                                        key={prod.name}
                                                        className="bg-white rounded-xl border border-slate-200/80 p-3 space-y-1.5"
                                                    >
                                                        <div className="flex items-center justify-between text-xs">
                                                            <span className="font-bold text-slate-800 truncate">
                                                                {idx + 1}. {prod.name}
                                                            </span>
                                                            <span className="font-extrabold text-[#0F6570] tabular-nums shrink-0 ml-2">
                                                                {prod.count} {prod.count === 1 ? "lead" : "leads"}
                                                                {prod.value > 0 ? ` • ${formatBRL(prod.value, true)}` : ""}
                                                            </span>
                                                        </div>
                                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full bg-gradient-to-r from-[#08454c] to-teal-500"
                                                                style={{ width: `${pct}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setLocation("/admin/leads")}
                                    className="w-full rounded-xl font-bold text-xs h-9 bg-white hover:bg-slate-100 text-slate-700 border-slate-200 justify-between px-3.5"
                                >
                                    <span>Gerenciar todos os negócios no Pipeline</span>
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                );

            // ── 12 Executive KPI Cards (3 Full Rows × 4 Columns) ─────────────────
            case "apolicesMetrics":
                return (
                    <Card
                        className="rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md overflow-hidden group cursor-pointer transition-all h-full"
                        onClick={() => setLocation("/admin/apolices")}
                    >
                        <div className="h-1 w-full bg-teal-600" />
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                                Carteira de Seguros
                            </CardTitle>
                            <div className="h-9 w-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
                                <ShieldCheck className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline justify-between gap-2">
                                <div className="text-3xl font-display font-bold text-slate-900 tabular-nums">
                                    {totalApolicesAtivas}{" "}
                                    <span className="text-xs font-medium text-slate-400">ativas</span>
                                </div>
                                <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2.5 py-0.5 rounded-full tabular-nums">
                                    {formatBRL(totalPremioSeguros, true)}
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1.5">Prêmio ativo sob gestão</p>
                        </CardContent>
                    </Card>
                );

            case "vencimentos30":
                return (
                    <Card
                        className={`rounded-2xl bg-white border shadow-sm hover:shadow-md overflow-hidden group cursor-pointer transition-all h-full ${
                            totalSegurosUrgentes > 0 ? "border-amber-300 ring-1 ring-amber-200/60" : "border-slate-200/80"
                        }`}
                        onClick={() => setLocation("/admin/apolices")}
                    >
                        <div className="h-1 w-full bg-amber-500" />
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                                Renovações (30 dias)
                            </CardTitle>
                            <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                                <Clock className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline justify-between gap-2">
                                <div className="text-3xl font-display font-bold text-amber-600 tabular-nums">
                                    {vencendo30List.length}
                                </div>
                                {emAtrasoApolicesList.length > 0 && (
                                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 animate-pulse">
                                        {emAtrasoApolicesList.length} em atraso
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-400 mt-1.5">Apólices próximas do vencimento</p>
                        </CardContent>
                    </Card>
                );

            case "totalContacts":
                return (
                    <Card
                        className="rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md overflow-hidden group cursor-pointer transition-all h-full"
                        onClick={() => setLocation("/admin/contacts")}
                    >
                        <div className="h-1 w-full bg-blue-600" />
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                                Base de Contatos
                            </CardTitle>
                            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <Users className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline justify-between gap-2">
                                <div className="text-3xl font-display font-bold text-slate-900 tabular-nums">
                                    {totalContacts}
                                </div>
                                <div className="flex gap-1 flex-wrap justify-end">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                                        {contacts?.filter(c => (c.status || "Ativo") === "Ativo").length || 0} ativos
                                    </span>
                                </div>
                            </div>
                            <p className="text-xs text-slate-400 mt-1.5">
                                {contacts?.filter(c => c.status === "Prospects").length || 0} prospects em prospecção
                            </p>
                        </CardContent>
                    </Card>
                );

            case "contatosTipo":
                return (
                    <Card
                        className="rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md overflow-hidden group cursor-pointer transition-all h-full"
                        onClick={() => setLocation("/admin/contacts")}
                    >
                        <div className="h-1 w-full bg-indigo-600" />
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                                Perfil PF vs PJ
                            </CardTitle>
                            <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <Building className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline justify-between gap-2 tabular-nums">
                                <div className="text-2xl font-display font-bold text-slate-900">
                                    {pfContacts} <span className="text-xs font-semibold text-slate-400">PF</span>
                                </div>
                                <div className="text-2xl font-display font-bold text-indigo-600">
                                    {pjContacts} <span className="text-xs font-semibold text-indigo-400">PJ</span>
                                </div>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2.5 flex">
                                <div
                                    className="bg-blue-500 h-full transition-all"
                                    style={{ width: totalContacts > 0 ? `${(pfContacts / totalContacts) * 100}%` : "50%" }}
                                    title="Pessoa Física"
                                />
                                <div
                                    className="bg-indigo-600 h-full transition-all"
                                    style={{ width: totalContacts > 0 ? `${(pjContacts / totalContacts) * 100}%` : "50%" }}
                                    title="Pessoa Jurídica"
                                />
                            </div>
                        </CardContent>
                    </Card>
                );

            case "activeLeads":
                return (
                    <Card
                        className="rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md overflow-hidden group cursor-pointer transition-all h-full"
                        onClick={() => setLocation("/admin/leads")}
                    >
                        <div className="h-1 w-full bg-[#0F6570]" />
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                                Leads em Aberto
                            </CardTitle>
                            <div className="h-9 w-9 rounded-xl bg-teal-50 text-[#0F6570] flex items-center justify-center group-hover:bg-[#0F6570] group-hover:text-white transition-colors">
                                <TrendingUp className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline justify-between gap-2">
                                <div className="text-3xl font-display font-bold text-slate-900 tabular-nums">
                                    {activeLeads}
                                </div>
                                <span className="text-[11px] font-bold text-[#0F6570] bg-teal-50 px-2 py-0.5 rounded-full">
                                    +{newLeadsLast7d} em 7d
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1.5">Oportunidades ativas no funil</p>
                        </CardContent>
                    </Card>
                );

            case "leadsImplantados":
                return (
                    <Card
                        className="rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md overflow-hidden group cursor-pointer transition-all h-full"
                        onClick={() => setLocation("/admin/leads")}
                    >
                        <div className="h-1 w-full bg-emerald-500" />
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                                Negócios Implantados
                            </CardTitle>
                            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                <CheckCircle2 className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline justify-between gap-2">
                                <div className="text-3xl font-display font-bold text-emerald-600 tabular-nums">
                                    {wonLeadsCount}
                                </div>
                                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-full tabular-nums">
                                    {formatBRL(wonPipelineValue, true)}
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1.5">Fechamentos concluídos no pipeline</p>
                        </CardContent>
                    </Card>
                );

            case "totalValue":
                return (
                    <Card
                        className="rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md overflow-hidden group cursor-pointer transition-all h-full"
                        onClick={() => setLocation("/admin/leads")}
                    >
                        <div className="h-1 w-full bg-emerald-600" />
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                                Volume em Negociação
                            </CardTitle>
                            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                <DollarSign className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tabular-nums truncate">
                                {formatBRL(totalValue)}
                            </div>
                            <p className="text-xs text-slate-400 mt-1.5">Potencial financeiro em aberto</p>
                        </CardContent>
                    </Card>
                );

            case "ticketMedio":
                return (
                    <Card
                        className="rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md overflow-hidden group cursor-pointer transition-all h-full"
                        onClick={() => setLocation("/admin/leads")}
                    >
                        <div className="h-1 w-full bg-purple-600" />
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                                Ticket Médio Lead
                            </CardTitle>
                            <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                <Award className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tabular-nums truncate">
                                {formatBRL(ticketMedio)}
                            </div>
                            <p className="text-xs text-slate-400 mt-1.5">Valor médio por oportunidade</p>
                        </CardContent>
                    </Card>
                );

            case "conversionRate":
                return (
                    <Card className="rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md overflow-hidden group transition-all h-full">
                        <div className="h-1 w-full bg-cyan-600" />
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                                Taxa de Conversão
                            </CardTitle>
                            <div className="h-9 w-9 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center group-hover:bg-cyan-600 group-hover:text-white transition-colors">
                                <Target className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline justify-between gap-2">
                                <div className="text-3xl font-display font-bold text-slate-900 tabular-nums">
                                    {conversionRate}%
                                </div>
                                <span className="text-[11px] font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-full">
                                    Win {leadWinRate}%
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1.5">Clientes ativos vs pipeline aberto</p>
                        </CardContent>
                    </Card>
                );

            case "pendingTasks":
                return (
                    <Card
                        className="rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md overflow-hidden group cursor-pointer transition-all h-full"
                        onClick={() => setLocation("/admin/todoist")}
                    >
                        <div className="h-1 w-full bg-sky-500" />
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                                Tarefas Pendentes
                            </CardTitle>
                            <div className="h-9 w-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-colors">
                                <CheckSquare className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-display font-bold text-slate-900 tabular-nums">
                                {pendingTasks}
                            </div>
                            <p className="text-xs text-slate-400 mt-1.5">Atividades em aberto na operação</p>
                        </CardContent>
                    </Card>
                );

            case "overdueTasks":
                return (
                    <Card
                        className={`rounded-2xl bg-white border shadow-sm hover:shadow-md overflow-hidden group cursor-pointer transition-all h-full ${
                            overdueTasks > 0 ? "border-rose-300 bg-rose-50/20" : "border-slate-200/80"
                        }`}
                        onClick={() => setLocation("/admin/todoist")}
                    >
                        <div className="h-1 w-full bg-rose-500" />
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                                Tarefas Atrasadas
                            </CardTitle>
                            <div className="h-9 w-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors">
                                <AlertTriangle className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-display font-bold text-rose-600 tabular-nums">
                                {overdueTasks}
                            </div>
                            <p className="text-xs text-slate-400 mt-1.5">
                                {overdueTasks > 0 ? "Exigem prioridade imediata" : "Operação 100% em dia"}
                            </p>
                        </CardContent>
                    </Card>
                );

            case "monthlyInteractions":
                return (
                    <Card
                        className="rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md overflow-hidden group cursor-pointer transition-all h-full"
                        onClick={() => setLocation("/admin/interactions")}
                    >
                        <div className="h-1 w-full bg-[#c65f54]" />
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                                Interações ({currentMonthName.slice(0, 3)})
                            </CardTitle>
                            <div className="h-9 w-9 rounded-xl bg-orange-50 text-[#c65f54] flex items-center justify-center group-hover:bg-[#c65f54] group-hover:text-white transition-colors">
                                <MessageSquare className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-display font-bold text-slate-900 tabular-nums">
                                {monthlyInteractions}
                            </div>
                            <p className="text-xs text-slate-400 mt-1.5">Pontos de contato registrados no mês</p>
                        </CardContent>
                    </Card>
                );

            // ── Redesigned Analytics Studio Charts ───────────────────────────────
            case "chartLeadFlow":
                return (
                    <Card className="rounded-3xl bg-white border border-slate-200/80 shadow-md overflow-hidden h-full flex flex-col">
                        <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-start justify-between gap-4 flex-wrap">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-teal-50 text-[#0F6570] flex items-center justify-center shrink-0">
                                    <Activity className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-display font-bold text-slate-900">
                                        Ritmo de Captação de Novos Leads
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Volume diário de entrada de oportunidades nos últimos 15 dias
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {peakLeadDay.count > 0 && (
                                    <Badge variant="outline" className="rounded-lg bg-slate-50 text-slate-600 border-slate-200 font-bold text-xs">
                                        Pico: {peakLeadDay.date} ({peakLeadDay.count})
                                    </Badge>
                                )}
                                <Badge className="rounded-lg bg-[#08454c] hover:bg-[#08454c] text-white font-bold text-xs px-3 py-1">
                                    {totalLeads15d} em 15 dias
                                </Badge>
                            </div>
                        </div>

                        <CardContent className="pt-6 pb-4 px-4 sm:px-6 h-[310px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={leadFlowData} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="leadAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#0F6570" stopOpacity={0.35} />
                                            <stop offset="65%" stopColor="#14b8a6" stopOpacity={0.08} />
                                            <stop offset="100%" stopColor="#14b8a6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        fontSize={11}
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fill: "#64748b", fontWeight: 600 }}
                                    />
                                    <YAxis
                                        fontSize={11}
                                        tickLine={false}
                                        axisLine={false}
                                        allowDecimals={false}
                                        tick={{ fill: "#64748b" }}
                                    />
                                    <Tooltip content={<CustomChartTooltip />} />
                                    <Area
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#0F6570"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#leadAreaGrad)"
                                        name="Novos Leads"
                                        activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff", fill: "#08454c" }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                );

            case "chartMix":
                return (
                    <Card className="rounded-3xl bg-white border border-slate-200/80 shadow-md overflow-hidden h-full flex flex-col">
                        <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                    <PieChartIcon className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-display font-bold text-slate-900">
                                        Mix de Canais & Atividades
                                    </h3>
                                    <p className="text-xs text-slate-500">Distribuição da régua de relacionamento</p>
                                </div>
                            </div>
                        </div>

                        <CardContent className="p-5 flex-1 flex flex-col justify-between">
                            {typeDistribution.length === 0 ? (
                                <div className="h-[260px] flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
                                    <MessageSquare className="h-10 w-10 text-slate-200" />
                                    <p className="text-sm font-semibold text-slate-500">Sem interações registradas</p>
                                    <p className="text-xs">Registre contatos na Régua de Relacionamento.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="relative h-[165px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={typeDistribution}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={52}
                                                    outerRadius={74}
                                                    paddingAngle={4}
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    {typeDistribution.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip content={<CustomChartTooltip />} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-2xl font-display font-extrabold text-slate-900 tabular-nums leading-none">
                                                {totalInteractionsCount}
                                            </span>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                                                Total
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-2 mt-2">
                                        {typeDistribution.slice(0, 4).map(t => {
                                            const pct =
                                                totalInteractionsCount > 0
                                                    ? Math.round((t.value / totalInteractionsCount) * 100)
                                                    : 0;
                                            return (
                                                <div key={t.name} className="flex items-center justify-between text-xs">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <span
                                                            className="h-2.5 w-2.5 rounded-full shrink-0"
                                                            style={{ backgroundColor: t.color }}
                                                        />
                                                        <span className="font-semibold text-slate-700 truncate">
                                                            {t.name}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0 tabular-nums">
                                                        <span className="font-extrabold text-slate-900">{t.value}</span>
                                                        <span className="text-[11px] font-semibold text-slate-400 w-9 text-right">
                                                            ({pct}%)
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                );

            case "chartApolicesSeguradora": {
                const topInsurer = seguradorasData[0];
                return (
                    <Card className="rounded-3xl bg-white border border-slate-200/80 shadow-md overflow-hidden h-full flex flex-col">
                        <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-start justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-teal-50 text-[#0F6570] flex items-center justify-center shrink-0">
                                    <Building2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-display font-bold text-slate-900">
                                        Ranking de Apólices por Seguradora
                                    </h3>
                                    <p className="text-xs text-slate-500">Concentração de apólices pelas cias parceiras</p>
                                </div>
                            </div>
                            {topInsurer && (
                                <Badge variant="outline" className="rounded-lg bg-teal-50/70 text-[#08454c] border-teal-200 font-bold text-xs">
                                    🏆 Líder: {topInsurer.nome} ({topInsurer.total})
                                </Badge>
                            )}
                        </div>

                        <CardContent className="pt-5 pb-4 px-4 sm:px-6 h-[300px]">
                            {seguradorasData.length === 0 ? (
                                <div className="flex flex-col h-full items-center justify-center text-slate-400 text-sm gap-2">
                                    <Building2 className="h-10 w-10 text-slate-200" />
                                    <span className="font-semibold text-slate-500">Nenhuma apólice vinculada a seguradora</span>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <ReBarChart data={seguradorasData} layout="vertical" margin={{ top: 4, right: 20, left: 4, bottom: 4 }}>
                                        <defs>
                                            <linearGradient id="insurerBarGrad" x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="0%" stopColor="#08454c" />
                                                <stop offset="100%" stopColor="#14b8a6" />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                                        <XAxis
                                            type="number"
                                            fontSize={11}
                                            tickLine={false}
                                            axisLine={false}
                                            allowDecimals={false}
                                            tick={{ fill: "#64748b" }}
                                        />
                                        <YAxis
                                            type="category"
                                            dataKey="nome"
                                            fontSize={11}
                                            tickLine={false}
                                            axisLine={false}
                                            width={115}
                                            tick={{ fill: "#334155", fontWeight: 600 }}
                                        />
                                        <Tooltip content={<CustomChartTooltip />} cursor={{ fill: "#f1f5f9" }} />
                                        <Bar
                                            dataKey="total"
                                            fill="url(#insurerBarGrad)"
                                            radius={[0, 8, 8, 0]}
                                            barSize={22}
                                            name="Apólices"
                                        />
                                    </ReBarChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                );
            }

            case "chartApolicesProduto": {
                const topProd = produtosData[0];
                return (
                    <Card className="rounded-3xl bg-white border border-slate-200/80 shadow-md overflow-hidden h-full flex flex-col">
                        <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-start justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                    <Package className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-display font-bold text-slate-900">
                                        Carteira por Ramo / Produto
                                    </h3>
                                    <p className="text-xs text-slate-500">Mix de ramos de seguro contratados na base</p>
                                </div>
                            </div>
                            {topProd && (
                                <Badge variant="outline" className="rounded-lg bg-emerald-50 text-emerald-800 border-emerald-200 font-bold text-xs">
                                    Principal: {topProd.nome} ({topProd.total})
                                </Badge>
                            )}
                        </div>

                        <CardContent className="pt-5 pb-4 px-4 sm:px-6 h-[300px]">
                            {produtosData.length === 0 ? (
                                <div className="flex flex-col h-full items-center justify-center text-slate-400 text-sm gap-2">
                                    <Package className="h-10 w-10 text-slate-200" />
                                    <span className="font-semibold text-slate-500">Sem produtos de seguro cadastrados</span>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <ReBarChart data={produtosData} margin={{ top: 8, right: 10, left: -18, bottom: 4 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                        <XAxis
                                            dataKey="nome"
                                            fontSize={11}
                                            tickLine={false}
                                            axisLine={false}
                                            tick={{ fill: "#334155", fontWeight: 600 }}
                                        />
                                        <YAxis
                                            fontSize={11}
                                            tickLine={false}
                                            axisLine={false}
                                            allowDecimals={false}
                                            tick={{ fill: "#64748b" }}
                                        />
                                        <Tooltip content={<CustomChartTooltip />} cursor={{ fill: "#f8fafc" }} />
                                        <Bar dataKey="total" radius={[8, 8, 0, 0]} barSize={34} name="Apólices">
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
            }

            case "chartOrigemContatos": {
                const topOrigin = origensData[0];
                return (
                    <Card className="rounded-3xl bg-white border border-slate-200/80 shadow-md overflow-hidden h-full flex flex-col">
                        <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-start justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                                    <Globe className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-display font-bold text-slate-900">
                                        Canais de Aquisição de Clientes
                                    </h3>
                                    <p className="text-xs text-slate-500">Origem declarada dos clientes da carteira</p>
                                </div>
                            </div>
                            {topOrigin && (
                                <Badge variant="outline" className="rounded-lg bg-amber-50 text-amber-800 border-amber-200 font-bold text-xs">
                                    🌟 Top: {topOrigin.nome} ({topOrigin.total})
                                </Badge>
                            )}
                        </div>

                        <CardContent className="pt-5 pb-4 px-4 sm:px-6 h-[300px]">
                            {origensData.length === 0 ? (
                                <div className="flex flex-col h-full items-center justify-center text-slate-400 text-sm gap-2">
                                    <Globe className="h-10 w-10 text-slate-200" />
                                    <span className="font-semibold text-slate-500">Nenhuma origem registrada nos contatos</span>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <ReBarChart data={origensData} layout="vertical" margin={{ top: 4, right: 20, left: 4, bottom: 4 }}>
                                        <defs>
                                            <linearGradient id="originBarGrad" x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="0%" stopColor="#c65f54" />
                                                <stop offset="100%" stopColor="#f59e0b" />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                                        <XAxis
                                            type="number"
                                            fontSize={11}
                                            tickLine={false}
                                            axisLine={false}
                                            allowDecimals={false}
                                            tick={{ fill: "#64748b" }}
                                        />
                                        <YAxis
                                            type="category"
                                            dataKey="nome"
                                            fontSize={11}
                                            tickLine={false}
                                            axisLine={false}
                                            width={115}
                                            tick={{ fill: "#334155", fontWeight: 600 }}
                                        />
                                        <Tooltip content={<CustomChartTooltip />} cursor={{ fill: "#f8fafc" }} />
                                        <Bar
                                            dataKey="total"
                                            fill="url(#originBarGrad)"
                                            radius={[0, 8, 8, 0]}
                                            barSize={22}
                                            name="Clientes"
                                        />
                                    </ReBarChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                );
            }

            case "chartProspecting":
                return (
                    <Card className="rounded-3xl bg-white border border-slate-200/80 shadow-md overflow-hidden h-full flex flex-col">
                        <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-start justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                    <BarChart3 className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-display font-bold text-slate-900">
                                        Produtividade Comercial por Consultor
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Leads atribuídos vs atividades comerciais realizadas pela equipe
                                    </p>
                                </div>
                            </div>
                        </div>

                        <CardContent className="pt-5 pb-4 px-4 sm:px-6 h-[300px]">
                            {consultantPerformanceData.length === 0 ? (
                                <div className="flex flex-col h-full items-center justify-center text-slate-400 text-sm gap-2 text-center">
                                    <Users className="h-10 w-10 text-slate-200" />
                                    <span className="font-semibold text-slate-500">
                                        Nenhuma atividade atribuída aos consultores ainda
                                    </span>
                                    <span className="text-xs max-w-xs">
                                        Atribua leads ou registre prospecções e interações para acompanhar o ranking.
                                    </span>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <ReBarChart
                                        data={consultantPerformanceData}
                                        margin={{ top: 8, right: 10, left: -18, bottom: 0 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                        <XAxis
                                            dataKey="name"
                                            fontSize={11}
                                            tickLine={false}
                                            axisLine={false}
                                            tick={{ fill: "#334155", fontWeight: 600 }}
                                        />
                                        <YAxis
                                            fontSize={11}
                                            tickLine={false}
                                            axisLine={false}
                                            allowDecimals={false}
                                            tick={{ fill: "#64748b" }}
                                        />
                                        <Tooltip content={<CustomChartTooltip />} cursor={{ fill: "#f8fafc" }} />
                                        <Legend
                                            iconType="circle"
                                            wrapperStyle={{ fontSize: "11px", fontWeight: 600, paddingTop: "6px" }}
                                        />
                                        <Bar
                                            dataKey="leads"
                                            fill="#0F6570"
                                            radius={[6, 6, 0, 0]}
                                            barSize={20}
                                            name="Leads na Carteira"
                                        />
                                        <Bar
                                            dataKey="atividades"
                                            fill="#f59e0b"
                                            radius={[6, 6, 0, 0]}
                                            barSize={20}
                                            name="Prospecções & Interações"
                                        />
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

    const MOOD_OPTIONS = [
        {
            key: "motivado",
            label: "Motivado a Vencer",
            emoji: "🚀",
            color: "from-amber-400 to-orange-500",
            quotes: [
                "O sucesso não é um acidente, é trabalho duro e paixão por proteger o cliente!",
                "Foco na meta e sangue nos olhos: hoje vamos bater novos recordes!",
                "Grandes desafios constroem grandes profissionais. Para cima!"
            ]
        },
        {
            key: "feliz",
            label: "Feliz & Radiante",
            emoji: "😄",
            color: "from-emerald-400 to-teal-500",
            quotes: [
                "A alegria de servir e transformar vidas é o nosso maior diferencial!",
                "Gratidão por cada conquista e entusiasmo em cada conversa hoje!",
                "Sorriso no rosto e confiança inabalável para abrir novos caminhos!"
            ]
        },
        {
            key: "focado",
            label: "Focado & Estratégico",
            emoji: "🎯",
            color: "from-sky-400 to-blue-600",
            quotes: [
                "Disciplina é a ponte que liga o planejamento aos resultados extraordinários.",
                "Execução afiada, prioridade clara e atenção total a cada oportunidade.",
                "O detalhe faz o fechamento: foco no que realmente gera valor hoje."
            ]
        },
        {
            key: "tranquilo",
            label: "Tranquilo & Seguro",
            emoji: "🌿",
            color: "from-teal-400 to-cyan-600",
            quotes: [
                "Com calma, clareza e segurança encontramos a solução perfeita para o cliente.",
                "Paz de espírito gera clareza nas melhores decisões de negócios.",
                "Segurança não é sorte, é planejamento consistente dia após dia."
            ]
        },
        {
            key: "desafiado",
            label: "Pronto pro Desafio",
            emoji: "⚡",
            color: "from-purple-400 to-indigo-600",
            quotes: [
                "Onde outros veem barreiras, nós enxergamos a nossa próxima grande vitória!",
                "Nenhum mar calmo fez bom marinheiro. Vamos encarar e vencer hoje!",
                "Com garra e método, qualquer obstáculo vira degrau rumo ao topo."
            ]
        },
        {
            key: "cansado",
            label: "Buscando Energia",
            emoji: "☕",
            color: "from-rose-400 to-pink-500",
            quotes: [
                "Tome aquele café forte, respire fundo e lembre-se do propósito que te move!",
                "Um passo de cada vez: sua dedicação de hoje constrói o seu futuro de amanhã.",
                "O cansaço é passageiro, o orgulho de vencer dura para sempre. Força!"
            ]
        }
    ];

    const currentLoggedUserMood = todayMoodsData?.moods?.find(m => m.userId === user?.id);
    const userFirstName = user?.name?.trim().split(" ")[0] || "Monteiro";
    const formattedTodayFull = new Intl.DateTimeFormat("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
    }).format(new Date());

    const handleSelectMood = (mood: typeof MOOD_OPTIONS[0]) => {
        // Escolhe uma frase de efeito aleatória do humor escolhido
        const quote = mood.quotes[Math.floor(Math.random() * mood.quotes.length)];
        setMoodMutation.mutate({
            moodKey: mood.key,
            moodLabel: mood.label,
            moodEmoji: mood.emoji,
            quote,
        });
    };

    return (
        <div className="space-y-8 pb-12">
            {/* ── Executive Command Header com Humor Diário da Equipe ── */}
            <div className="rounded-3xl bg-gradient-to-br from-[#08454c] via-[#0F6570] to-[#163b52] p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
                <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-teal-300/10 blur-3xl" />
                <div className="pointer-events-none absolute left-1/3 -bottom-16 h-48 w-48 rounded-full bg-amber-400/10 blur-3xl" />

                <div className="relative flex flex-col gap-6">
                    {/* Linha superior: Saudação + Data + Botões de Ação */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-bold uppercase tracking-wider text-teal-100">
                                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="capitalize">{formattedTodayFull}</span>
                                <span className="text-teal-300/70">• Reseta à meia-noite</span>
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
                                Olá, {userFirstName}! Como está seu humor hoje?
                            </h2>
                        </div>

                        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                            <Button
                                type="button"
                                onClick={() => setLocation("/admin/leads")}
                                className="h-9 px-3.5 rounded-xl font-bold text-xs bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md gap-1.5"
                            >
                                <Layers className="h-4 w-4" />
                                Pipeline
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsEditMode(!isEditMode)}
                                className={`h-9 px-3.5 rounded-xl font-bold text-xs transition-all gap-1.5 border ${
                                    isEditMode
                                        ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-400 ring-2 ring-amber-300/50 animate-pulse"
                                        : "bg-white/10 border-white/20 hover:bg-white/20 text-white"
                                }`}
                            >
                                <Move className="h-3.5 w-3.5" />
                                {isEditMode ? "Concluir" : "Arrastar"}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setCustomizeOpen(true)}
                                className="h-9 px-3.5 rounded-xl font-bold text-xs bg-white/10 border-white/20 hover:bg-white/20 text-white gap-1.5"
                            >
                                <SlidersHorizontal className="h-3.5 w-3.5 text-amber-300" />
                                Personalizar
                            </Button>
                        </div>
                    </div>

                    {/* Linha do Seletor de Humor do Usuário */}
                    <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 border border-white/10 space-y-3">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                            <span className="text-xs font-bold uppercase tracking-wider text-teal-200 flex items-center gap-1.5">
                                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                                Escolha seu estado de espírito para hoje:
                            </span>
                            {currentLoggedUserMood && (
                                <span className="text-xs text-teal-100 font-medium">
                                    Seu registro hoje: <strong className="text-amber-300">{currentLoggedUserMood.moodEmoji} {currentLoggedUserMood.moodLabel}</strong>
                                </span>
                            )}
                        </div>

                        {/* Botões dos 6 Humores */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                            {MOOD_OPTIONS.map(mood => {
                                const isSelected = currentLoggedUserMood?.moodKey === mood.key;
                                return (
                                    <button
                                        key={mood.key}
                                        type="button"
                                        onClick={() => handleSelectMood(mood)}
                                        disabled={setMoodMutation.isPending}
                                        className={`group relative flex items-center gap-2 p-2.5 rounded-xl border transition-all text-left ${
                                            isSelected
                                                ? "bg-white text-slate-900 border-amber-400 shadow-lg shadow-amber-500/20 ring-2 ring-amber-300 scale-[1.02]"
                                                : "bg-white/10 hover:bg-white/20 text-white border-white/15 hover:border-white/30"
                                        }`}
                                    >
                                        <span className="text-xl shrink-0 group-hover:scale-110 transition-transform">
                                            {mood.emoji}
                                        </span>
                                        <div className="min-w-0">
                                            <p className={`text-xs font-extrabold truncate ${isSelected ? "text-slate-900" : "text-white"}`}>
                                                {mood.label.split(" ")[0]}
                                            </p>
                                            <p className={`text-[10px] truncate ${isSelected ? "text-slate-500 font-bold" : "text-teal-200/80"}`}>
                                                {mood.label.split(" ").slice(1).join(" ") || "Hoje"}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Frase de Efeito Ativa do Usuário Logado */}
                        {currentLoggedUserMood?.quote && (
                            <div className="pt-1 flex items-start gap-2 text-xs text-amber-200 font-medium italic bg-amber-400/10 rounded-xl p-2.5 border border-amber-300/20">
                                <span className="text-base leading-none">💡</span>
                                <div>
                                    <strong className="text-white not-italic">Sua frase de motivação: </strong>
                                    "{currentLoggedUserMood.quote}"
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Mural Coletivo de Respostas da Equipe */}
                    <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-bold uppercase tracking-wider text-teal-200 flex items-center gap-1.5">
                                <Users className="h-3.5 w-3.5" />
                                Energia da Equipe Hoje ({todayMoodsData?.moods?.length || 0} respostas):
                            </span>
                            <span className="text-[11px] text-teal-300/80 font-medium">
                                Todos os registros da equipe aparecem aqui em tempo real
                            </span>
                        </div>

                        {(!todayMoodsData?.moods || todayMoodsData.moods.length === 0) ? (
                            <div className="bg-white/5 rounded-xl p-3 border border-white/10 text-xs text-teal-100/70 flex items-center gap-2">
                                <span>🌱</span>
                                <span>Nenhum membro da equipe registrou o humor hoje ainda. Seja o primeiro a inspirar o time!</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 flex-wrap">
                                {todayMoodsData.moods.map((m) => (
                                    <div
                                        key={m.id}
                                        className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/20 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full text-xs text-white shadow-sm transition-all"
                                        title={`"${m.quote}"`}
                                    >
                                        <span className="font-extrabold text-amber-300">{m.userName.split(" ")[0]}:</span>
                                        <span className="flex items-center gap-1 text-teal-100 font-semibold">
                                            <span>{m.moodEmoji}</span>
                                            <span>{m.moodLabel}</span>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Warning bar in Edit Mode */}
            {isEditMode && (
                <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 flex items-center justify-between gap-4 shadow-md animate-in fade-in duration-300">
                    <div className="flex items-center gap-3">
                        <Move className="h-6 w-6 text-amber-600 shrink-0" />
                        <div>
                            <p className="font-bold text-sm">Modo de Arraste Ativo!</p>
                            <p className="text-xs text-amber-700">
                                Clique e segure nas barras superiores dos cartões para reposicioná-los livremente pela tela.
                            </p>
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

            {/* Unified Dynamic Drag and Drop Grid Layout with Section Headers */}
            <DragDropContext onDragEnd={handleMainDragEnd}>
                <Droppable droppableId="main-dashboard-grid" isDropDisabled={!isEditMode}>
                    {provided => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="grid grid-cols-12 gap-6 items-stretch"
                        >
                            {visibleWidgets.map((widget, idx) => {
                                const prevCategory = idx > 0 ? visibleWidgets[idx - 1].category : null;
                                const showMetricHeader =
                                    !isEditMode && widget.category === "metric" && prevCategory !== "metric";
                                const showChartHeader =
                                    !isEditMode && widget.category === "chart" && prevCategory !== "chart";

                                return (
                                    <Fragment key={widget.id}>
                                        {showMetricHeader && (
                                            <div className="col-span-12 pt-2 flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-2.5">
                                                    <span className="h-2 w-2 rounded-full bg-[#0F6570]" />
                                                    <h3 className="text-xs font-extrabold uppercase tracking-[0.15em] text-slate-500">
                                                        Indicadores Executivos & Operacionais
                                                    </h3>
                                                </div>
                                                <div className="h-px flex-1 bg-slate-200/80" />
                                            </div>
                                        )}

                                        {showChartHeader && (
                                            <div className="col-span-12 pt-4 flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-2.5">
                                                    <span className="h-2 w-2 rounded-full bg-[#c65f54]" />
                                                    <h3 className="text-xs font-extrabold uppercase tracking-[0.15em] text-slate-500">
                                                        Inteligência Analítica & Performance
                                                    </h3>
                                                </div>
                                                <div className="h-px flex-1 bg-slate-200/80" />
                                                <button
                                                    type="button"
                                                    onClick={() => setLocation("/admin/seguros")}
                                                    className="text-xs font-bold text-[#0F6570] hover:underline flex items-center gap-1 shrink-0"
                                                >
                                                    BI de Seguros <ArrowRight className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        )}

                                        <Draggable
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
                                                                    onClick={e => {
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

                                                    <div
                                                        className={
                                                            isEditMode
                                                                ? "rounded-b-2xl overflow-hidden border-2 border-dashed border-amber-300 bg-amber-50/10 p-1 h-full"
                                                                : "h-full"
                                                        }
                                                    >
                                                        {renderWidgetContent(widget.id)}
                                                    </div>
                                                </div>
                                            )}
                                        </Draggable>
                                    </Fragment>
                                );
                            })}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>

            {/* Empty State when all widgets are hidden */}
            {visibleWidgets.length === 0 && (
                <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200 space-y-4">
                    <SlidersHorizontal className="h-12 w-12 mx-auto text-slate-400" />
                    <h3 className="text-xl font-bold text-slate-700">Todos os widgets do Dashboard estão ocultos</h3>
                    <p className="text-slate-500 text-sm max-w-md mx-auto">
                        Clique em "Personalizar" para reativar os indicadores, métricas e gráficos desejados.
                    </p>
                    <Button
                        onClick={resetLayout}
                        className="font-bold bg-primary hover:bg-primary/90 text-white rounded-xl"
                    >
                        Restaurar Todos os Widgets
                    </Button>
                </div>
            )}

            {/* ── Dialog Personalizar Dashboard ── */}
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

                    <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
                        <DragDropContext onDragEnd={handleModalDragEnd}>
                            <Droppable droppableId="modal-widgets-list">
                                {provided => (
                                    <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
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
                                                            <div
                                                                {...providedWidget.dragHandleProps}
                                                                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-grab active:cursor-grabbing shrink-0"
                                                                title="Segure para arrastar"
                                                            >
                                                                <GripVertical className="h-5 w-5" />
                                                            </div>

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
                                                                <span className="font-bold text-slate-900 text-sm block truncate">
                                                                    {widget.title}
                                                                </span>
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase">
                                                                    {widget.category === "banner"
                                                                        ? "Painel Destaque"
                                                                        : widget.category === "metric"
                                                                        ? "Métrica / KPI"
                                                                        : "Gráfico Analítico"}
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
                                {monthlyBirthdayContacts.length}{" "}
                                {monthlyBirthdayContacts.length === 1 ? "cliente comemora" : "clientes comemoram"} aniversário neste mês.
                            </span>
                            {todayBirthdayContacts.length > 0 && (
                                <span className="inline-flex items-center gap-1 bg-amber-300 text-rose-950 font-black text-[11px] uppercase px-2.5 py-0.5 rounded-full shadow-sm">
                                    🎉 {todayBirthdayContacts.length}{" "}
                                    {todayBirthdayContacts.length === 1 ? "aniversariante hoje!" : "aniversariantes hoje!"}
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
                                                🎉{" "}
                                                {todayBirthdayContacts.length === 1
                                                    ? "Aniversariante do Dia"
                                                    : `Aniversariantes do Dia (${todayBirthdayContacts.length})`}
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
                                    {todayBirthdayContacts.map(contact => renderBirthdayContactCard(contact, true))}
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
                                    <Badge
                                        variant="outline"
                                        className="text-[10px] bg-white border-rose-200 text-rose-600 font-bold px-1.5 py-0"
                                    >
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
                                            Tags disponíveis:{" "}
                                            <code className="bg-slate-100 px-1 py-0.5 rounded text-rose-600 font-mono">
                                                {"{nome}"}
                                            </code>
                                            ,{" "}
                                            <code className="bg-slate-100 px-1 py-0.5 rounded text-rose-600 font-mono">
                                                {"{primeiro_nome}"}
                                            </code>
                                            ,{" "}
                                            <code className="bg-slate-100 px-1 py-0.5 rounded text-rose-600 font-mono">
                                                {"{idade}"}
                                            </code>
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
                                        onChange={e => handleBirthdayTemplateChange(e.target.value)}
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
                                <p className="font-bold text-slate-600">
                                    Nenhum aniversariante cadastrado para {currentMonthName}.
                                </p>
                                <p className="text-xs">
                                    Certifique-se de preencher a data comemorativa nos cadastros dos clientes.
                                </p>
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
                                        {upcomingBirthdayContacts.map(contact => renderBirthdayContactCard(contact, false))}
                                    </div>
                                )}

                                {pastBirthdayContacts.length > 0 && (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between px-1">
                                            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                                                📅 Já comemoraram em {currentMonthName} ({pastBirthdayContacts.length})
                                            </span>
                                        </div>
                                        {pastBirthdayContacts.map(contact => renderBirthdayContactCard(contact, false))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── Modal de Edição e Disparo Personalizado ──────────────────────── */}
            <Dialog open={dispatchContact !== null} onOpenChange={open => !open && setDispatchContact(null)}>
                <DialogContent className="sm:max-w-[550px] w-full rounded-3xl border-none shadow-2xl p-0 overflow-hidden bg-white">
                    <DialogHeader className="p-5 bg-gradient-to-r from-rose-500 via-pink-600 to-rose-600 text-white shrink-0">
                        <DialogTitle className="text-xl font-display font-bold flex items-center gap-2 text-white">
                            <Gift className="h-5 w-5 text-amber-300" />
                            Disparar Parabéns de Aniversário
                        </DialogTitle>
                        <DialogDescription className="text-rose-100 text-xs mt-0.5">
                            Edite e confira a mensagem antes de disparar para{" "}
                            <strong className="text-white">{dispatchContact?.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-5 space-y-4">
                        <div className="flex items-center justify-between p-3 bg-rose-50/70 rounded-2xl border border-rose-100 text-xs">
                            <div className="space-y-0.5">
                                <div className="font-bold text-slate-900 text-sm">{dispatchContact?.name}</div>
                                <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
                                    {dispatchContact?.phone ? (
                                        <span>📱 {dispatchContact.phone}</span>
                                    ) : (
                                        <span className="text-slate-400">Sem telefone</span>
                                    )}
                                    <span>•</span>
                                    {dispatchContact?.email ? (
                                        <span>✉️ {dispatchContact.email}</span>
                                    ) : (
                                        <span className="text-slate-400">Sem e-mail</span>
                                    )}
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
                                <span className="text-[10px] text-slate-400 font-mono">
                                    {customizedMessage.length} caracteres
                                </span>
                            </div>
                            <Textarea
                                rows={5}
                                value={customizedMessage}
                                onChange={e => {
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
                                onChange={e => setSaveAsNewDefault(e.target.checked)}
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
                                        const formattedPhone =
                                            cleanPhone && cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
                                        const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(
                                            customizedMessage
                                        )}`;
                                        window.open(waUrl, "_blank", "noopener,noreferrer");
                                        setDispatchContact(null);
                                    }}
                                    className="rounded-xl font-bold text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto gap-1.5 shadow-md shadow-emerald-600/20"
                                >
                                    <MessageCircle className="h-4 w-4" /> Abrir no WhatsApp
                                </Button>
                            )}

                            {(() => {
                                const emailTargetId =
                                    dispatchContact?.contactIdForEmail ??
                                    (!dispatchContact?.isEmployee ? dispatchContact?.id : null);
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
                                                customMessage: customizedMessage,
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
