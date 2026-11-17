import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Lead, Contact, InsertLead, insertLeadSchema, User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Loader2, Plus, ArrowRight, Target, TrendingUp, Filter, Search, Maximize2, Minimize2, UserPlus, User as UserIcon, CheckCircle2, X, Check, Bell, BellRing, Clock, Mail, Send, Calendar, AlertCircle, Columns3, Rows3, Rows4 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Edit2, Trash2 } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { cn } from "@/lib/utils";
import { ContactProfile } from "@/components/ContactProfile";
import { useAuth } from "@/hooks/use-auth";
import { CompactLeadCard, UltraLeadCard } from "@/components/admin-crm/pipeline/PipelineCards";
import { PipelineList } from "@/components/admin-crm/pipeline/PipelineList";
import {
    type LeadActivity, type PipelineView, PIPELINE_VIEWS, DEFAULT_PIPELINE_VIEW, computeActivity, formatBRL, leadInColumn, loadPref, parseBRL, savePref,
} from "@/components/admin-crm/pipeline/pipeline-utils";
import { ContactFormModal } from "@/components/ContactFormModal";
import { STANDARD_PRODUCTS, isLifeInsuranceProduct } from "@/components/ProductSelector";
import { LifeInsuranceFieldsSection, LifeInsuranceSummary } from "@/components/LifeInsuranceFieldsSection";

const ESTADOS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

const DEFAULT_LEAD_COLUMNS = [
    { id: "new", label: "Novo Lead", color: "text-blue-500", bg: "bg-blue-50/50", accent: "border-blue-300" },
    { id: "Respondida", label: "Respondida", color: "text-indigo-500", bg: "bg-indigo-50/50", accent: "border-indigo-300" },
    { id: "qualified", label: "Qualificado", color: "text-purple-500", bg: "bg-purple-50/50", accent: "border-purple-300" },
    { id: "proposal", label: "Proposta", color: "text-amber-500", bg: "bg-amber-50/50", accent: "border-amber-300" },
    { id: "cancelled", label: "Cancelado", color: "text-rose-500", bg: "bg-rose-50/50", accent: "border-rose-300" },
    { id: "implemented", label: "Implantado", color: "text-emerald-500", bg: "bg-emerald-50/50", accent: "border-emerald-300" }
];

const COLOR_OPTIONS = [
    { value: "slate", label: "Cinza", color: "text-slate-500", bg: "bg-slate-50/50", accent: "border-slate-300" },
    { value: "blue", label: "Azul", color: "text-blue-500", bg: "bg-blue-50/50", accent: "border-blue-300" },
    { value: "indigo", label: "Indigo", color: "text-indigo-500", bg: "bg-indigo-50/50", accent: "border-indigo-300" },
    { value: "amber", label: "Amarelo", color: "text-amber-500", bg: "bg-amber-50/50", accent: "border-amber-300" },
    { value: "orange", label: "Laranja", color: "text-orange-500", bg: "bg-orange-50/50", accent: "border-orange-300" },
    { value: "emerald", label: "Verde", color: "text-emerald-500", bg: "bg-emerald-50/50", accent: "border-emerald-300" },
    { value: "rose", label: "Vermelho", color: "text-rose-500", bg: "bg-rose-50/50", accent: "border-rose-300" }
];

export default function LeadsPage() {
    const { toast } = useToast();
    const { user: authUser } = useAuth();
    const { settings, updateSettings } = useSiteSettings();
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedResponsible, setSelectedResponsible] = useState<string>("all");
    const [editingLeadId, setEditingLeadId] = useState<number | null>(null);
    const [deleteLeadId, setDeleteLeadId] = useState<number | null>(null);
    const [viewContactId, setViewContactId] = useState<number | null>(null);
    const [reminderLead, setReminderLead] = useState<Lead | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    // Dynamic Columns State
    const [columnDialogOpen, setColumnDialogOpen] = useState(false);
    const [editingColumn, setEditingColumn] = useState<any>(null);
    const [newColLabel, setNewColLabel] = useState("");
    const [newColColor, setNewColColor] = useState("blue");

    const columns = useMemo(() => {
        if (settings?.leadColumns) {
            try {
                const parsed = JSON.parse(settings.leadColumns);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    if (!parsed.some((c: any) => c.id?.toLowerCase() === "respondida")) {
                        parsed.splice(1, 0, { id: "Respondida", label: "Respondida", color: "text-indigo-500", bg: "bg-indigo-50/50", accent: "border-indigo-300" });
                    }
                    return parsed;
                }
                return DEFAULT_LEAD_COLUMNS;
            } catch (e) {
                return DEFAULT_LEAD_COLUMNS;
            }
        }
        return DEFAULT_LEAD_COLUMNS;
    }, [settings?.leadColumns]);

    const { data: leads, isLoading: leadsLoading } = useQuery<Lead[]>({
        queryKey: ["/api/leads"],
    });

    const { data: contacts } = useQuery<Contact[]>({
        queryKey: ["/api/contacts"],
    });

    const { data: clientes } = useQuery<any[]>({
        queryKey: ["/api/clientes"],
    });

    const { data: users } = useQuery<User[]>({
        queryKey: ["/api/users"],
    });

    const staffUsers = useMemo(() => {
        return (users || []).filter((u: any) => u.role === "admin" || u.role === "employee");
    }, [users]);

    const getResponsibleUser = (userId?: number | null) => {
        if (!userId) return null;
        return users?.find(u => u.id === userId) || null;
    };

    const getContactForLead = (contactId?: number | string | null) => {
        if (!contactId) return null;
        const contact = contacts?.find(c => String(c.id) === String(contactId));
        if (contact) return contact;
        // Contatos e clientes de seguro são tabelas diferentes: o id 388 de um não é o id 388 do outro.
        // Só usa o cliente que está VINCULADO a este contato (antes, um contato recém-criado pelo
        // Conecta aparecia com o nome de outro cliente que tinha o mesmo número de id).
        const cliente = clientes?.find(c => c.contactId != null && String(c.contactId) === String(contactId));
        if (cliente) {
            return {
                id: cliente.id,
                name: cliente.nome,
                phone: cliente.telefone,
                email: cliente.email,
                document: cliente.cpfCnpj
            };
        }
        return null;
    };

    // Oportunidade criada fora desta tela (Conecta, site) com contato novo: recarrega a lista de contatos.
    const missingContactKey = useMemo(() => {
        if (!leads || !contacts) return "";
        const known = new Set(contacts.map(c => String(c.id)));
        return Array.from(new Set(leads.filter(l => l.contactId && !known.has(String(l.contactId))).map(l => String(l.contactId)))).sort().join(",");
    }, [leads, contacts]);
    useEffect(() => {
        if (missingContactKey) queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
    }, [missingContactKey]);

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: number; status: string }) => {
            const res = await apiRequest("PATCH", `/api/leads/${id}/status`, { status });
            return await res.json();
        },
        onMutate: async ({ id, status }) => {
            await queryClient.cancelQueries({ queryKey: ["/api/leads"] });
            const previousLeads = queryClient.getQueryData<Lead[]>(["/api/leads"]);
            if (previousLeads) {
                queryClient.setQueryData<Lead[]>(
                    ["/api/leads"],
                    previousLeads.map((l) => (l.id === id ? { ...l, status } : l))
                );
            }
            return { previousLeads };
        },
        onError: (_err, _variables, context) => {
            if (context?.previousLeads) {
                queryClient.setQueryData(["/api/leads"], context.previousLeads);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data: InsertLead) => {
            const res = await apiRequest("POST", "/api/leads", data);
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
            toast({ title: "Lead criado com sucesso" });
            setOpen(false);
        },
    });

    const updateLeadMutation = useMutation({
        mutationFn: async (data: Partial<InsertLead>) => {
            const res = await apiRequest("PATCH", `/api/leads/${editingLeadId}`, data);
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
            toast({ title: "Lead atualizado" });
            setOpen(false);
            setEditingLeadId(null);
        },
    });

    const deleteLeadMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/leads/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
            toast({ title: "Lead removido" });
            setDeleteLeadId(null);
        },
    });

    const saveReminderMutation = useMutation({
        mutationFn: async ({ id, reminderDate, reminderNote, reminderEmail }: { id: number; reminderDate: string | null; reminderNote: string | null; reminderEmail: string | null }) => {
            const res = await apiRequest("PATCH", `/api/leads/${id}/reminder`, { reminderDate, reminderNote, reminderEmail });
            return await res.json();
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
            if (variables.reminderDate) {
                toast({ title: "⏰ Retorno salvo com sucesso!", description: "O retorno para o cliente será disparado automaticamente por e-mail." });
            } else {
                toast({ title: "Retorno para o cliente removido deste lead." });
            }
            setReminderLead(null);
        },
        onError: (err: any) => {
            toast({ title: "Erro ao salvar retorno para o cliente", description: err.message, variant: "destructive" });
        }
    });

    const testReminderMutation = useMutation({
        mutationFn: async ({ id, reminderDate, reminderNote, reminderEmail }: { id: number; reminderDate?: string; reminderNote?: string; reminderEmail?: string }) => {
            const res = await apiRequest("POST", `/api/leads/${id}/reminder/test`, { reminderDate, reminderNote, reminderEmail });
            return await res.json();
        },
        onSuccess: (data: any) => {
            toast({ title: "✅ E-mail de teste disparado!", description: data.message || `Enviado para ${data.targetEmail}` });
        },
        onError: (err: any) => {
            toast({ title: "Falha ao enviar teste", description: err.message, variant: "destructive" });
        }
    });

    const handleSaveColumn = async () => {
        if (!newColLabel.trim()) {
            toast({ title: "Nome da coluna é obrigatório", variant: "destructive" });
            return;
        }

        const colorConfig = COLOR_OPTIONS.find(c => c.value === newColColor) || COLOR_OPTIONS[0];
        let updatedColumns = [...columns];

        if (editingColumn) {
            updatedColumns = updatedColumns.map(col => col.id === editingColumn.id ? {
                ...col,
                label: newColLabel,
                color: colorConfig.color,
                bg: colorConfig.bg,
                accent: colorConfig.accent
            } : col);
            toast({ title: "Coluna atualizada!" });
        } else {
            const newId = newColLabel.toLowerCase().replace(/[^a-z0-9]/g, "_") + "_" + Date.now();
            updatedColumns.push({
                id: newId,
                label: newColLabel,
                color: colorConfig.color,
                bg: colorConfig.bg,
                accent: colorConfig.accent
            });
            toast({ title: "Coluna criada!" });
        }

        await updateSettings({ leadColumns: JSON.stringify(updatedColumns) });
        setColumnDialogOpen(false);
        setEditingColumn(null);
        setNewColLabel("");
    };

    const handleDeleteColumn = async (columnId: string) => {
        if (columns.length <= 1) {
            toast({ title: "Você precisa manter pelo menos uma coluna!", variant: "destructive" });
            return;
        }
        if (!confirm("Tem certeza que deseja excluir esta coluna? Todos os leads nela serão movidos para a primeira coluna.")) {
            return;
        }

        const columnLeads = leads?.filter(l => l.status === columnId) || [];
        const firstColId = columns.find((c: any) => c.id !== columnId)?.id || "new";

        for (const l of columnLeads) {
            await apiRequest("PATCH", `/api/leads/${l.id}/status`, { status: firstColId });
        }

        const updatedColumns = columns.filter((c: any) => c.id !== columnId);
        await updateSettings({ leadColumns: JSON.stringify(updatedColumns) });
        queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
        toast({ title: "Coluna excluída com sucesso!" });
    };

    const onDragEnd = (result: DropResult) => {
        const { destination, source, draggableId, type } = result;

        if (!destination) return;

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        if (type === "column") {
            const reordered = Array.from(columns);
            const [removed] = reordered.splice(source.index, 1);
            reordered.splice(destination.index, 0, removed);
            updateSettings({ leadColumns: JSON.stringify(reordered) });
            return;
        }

        const leadId = parseInt(draggableId);
        const newStatus = destination.droppableId;

        updateStatusMutation.mutate({ id: leadId, status: newStatus });
    };

    const viewPrefKey = `monteiro:pipeline:${authUser?.id ?? "anon"}`;
    const [view, setViewState] = useState<PipelineView>(() => loadPref<PipelineView>(`${viewPrefKey}:view`, DEFAULT_PIPELINE_VIEW));
    useEffect(() => {
        // troca de usuário no mesmo navegador: carrega a preferência dele
        setViewState(loadPref<PipelineView>(`${viewPrefKey}:view`, DEFAULT_PIPELINE_VIEW));
    }, [viewPrefKey]);
    const setView = (v: PipelineView) => {
        setViewState(v);
        savePref(`${viewPrefKey}:view`, v);
    };

    const [productFilter, setProductFilter] = useState<string>("all");
    const [urgencyFilter, setUrgencyFilter] = useState<string>("all");

    const { data: interactions } = useQuery<any[]>({ queryKey: ["/api/interactions"] });
    const { data: pipelineTasks } = useQuery<any[]>({ queryKey: ["/api/todoist/tasks?assignedTo=all"] });

    const interactionsByContact = useMemo(() => {
        const m = new Map<number, Date>();
        for (const it of interactions || []) {
            if (!it?.contactId || !it?.date) continue;
            const d = new Date(it.date);
            if (isNaN(d.getTime())) continue;
            const prev = m.get(it.contactId);
            if (!prev || d > prev) m.set(it.contactId, d);
        }
        return m;
    }, [interactions]);

    const taskList = useMemo(() => (pipelineTasks || []).map((t: any) => ({
        id: t.id, title: t.title, status: t.status, dueDate: t.dueDate, leadId: t.leadId ?? null, contactId: t.contactId ?? null,
    })), [pipelineTasks]);

    const activityByLead = useMemo(() => {
        const m = new Map<number, LeadActivity>();
        for (const l of leads || []) m.set(l.id, computeActivity(l, interactionsByContact, taskList));
        return m;
    }, [leads, interactionsByContact, taskList]);

    const productOptions = useMemo(() => {
        const s = new Set<string>();
        for (const l of leads || []) if (l.product) s.add(l.product);
        return Array.from(s).sort((a, b) => a.localeCompare(b, "pt-BR"));
    }, [leads]);

    const filteredLeads = useMemo(() => {
        const q = search.trim().toLowerCase();
        const qDigits = q.replace(/\D/g, "");
        return (leads || []).filter((l) => {
            if (selectedResponsible !== "all" && (selectedResponsible === "unassigned" ? !!l.assignedTo : String(l.assignedTo) !== String(selectedResponsible))) return false;
            if (productFilter !== "all" && (l.product || "") !== productFilter) return false;
            if (urgencyFilter !== "all" && activityByLead.get(l.id)?.urgency !== urgencyFilter) return false;
            if (!q) return true;
            const c = getContactForLead(l.contactId);
            const hay = `${c?.name || ""} ${c?.email || ""} ${l.product || ""} ${l.source || ""} ${l.notes || ""}`.toLowerCase();
            return hay.includes(q) || (qDigits.length >= 4 && String(c?.phone || "").replace(/\D/g, "").includes(qDigits));
        });
    }, [leads, search, selectedResponsible, productFilter, urgencyFilter, activityByLead, contacts, clientes]);

    const isClosedLost = (status?: string | null) => /cancel|perdid/i.test(status || "");
    const totals = useMemo(() => {
        let open = 0, count = 0;
        for (const l of filteredLeads) {
            count++;
            if (!isClosedLost(l.status)) open += parseBRL(l.value);
        }
        return { open, count };
    }, [filteredLeads]);

    const assignMutation = useMutation({
        mutationFn: async ({ id, assignedTo }: { id: number; assignedTo: number | null }) => {
            const res = await apiRequest("PATCH", `/api/leads/${id}`, { assignedTo });
            return await res.json();
        },
        onMutate: async ({ id, assignedTo }) => {
            await queryClient.cancelQueries({ queryKey: ["/api/leads"] });
            const previousLeads = queryClient.getQueryData<Lead[]>(["/api/leads"]);
            if (previousLeads) queryClient.setQueryData<Lead[]>(["/api/leads"], previousLeads.map((l) => (l.id === id ? { ...l, assignedTo } : l)));
            return { previousLeads };
        },
        onError: (_e, _v, ctx) => {
            if (ctx?.previousLeads) queryClient.setQueryData(["/api/leads"], ctx.previousLeads);
            toast({ title: "Não foi possível alterar o responsável", variant: "destructive" });
        },
        onSuccess: () => toast({ title: "Responsável atualizado" }),
        onSettled: () => queryClient.invalidateQueries({ queryKey: ["/api/leads"] }),
    });

    const cardProps = (lead: Lead) => ({
        lead,
        contact: getContactForLead(lead.contactId) as any,
        responsible: getResponsibleUser(lead.assignedTo) as any,
        activity: activityByLead.get(lead.id) || computeActivity(lead, interactionsByContact, taskList),
        columns,
        staff: staffUsers as any,
        onOpen: () => lead.contactId && setViewContactId(lead.contactId),
        onEdit: () => { setEditingLeadId(lead.id); setOpen(true); },
        onDelete: () => setDeleteLeadId(lead.id),
        onReminder: () => setReminderLead(lead),
        onMove: (status: string) => updateStatusMutation.mutate({ id: lead.id, status }),
        onAssign: (userId: number | null) => assignMutation.mutate({ id: lead.id, assignedTo: userId }),
    });

    if (leadsLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const boardHeight = isExpanded ? "h-[calc(100vh-92px)]" : "h-[calc(100vh-196px)] min-h-[420px]";
    const colWidth = view === "ultra" ? "w-[78vw] sm:w-[248px]" : "w-[82vw] sm:w-[276px]";
    const filtersActive = selectedResponsible !== "all" || productFilter !== "all" || urgencyFilter !== "all" || search !== "";

    return (
        <div className={cn("flex flex-col gap-3", isExpanded && "fixed inset-0 z-50 bg-[#f1f5f9] p-4 sm:p-5 overflow-hidden")}>
            {/* Cabeçalho compacto */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <div className="flex items-baseline gap-3 mr-auto min-w-0">
                    <h2 className="text-xl sm:text-2xl font-display font-bold text-gray-900 whitespace-nowrap">Funil de Vendas</h2>
                    <div className="flex items-baseline gap-2 text-[12px] text-slate-500 whitespace-nowrap">
                        <span><strong className="font-semibold text-slate-800 tabular-nums">{totals.count}</strong> oportunidades</span>
                        <span className="text-slate-300">·</span>
                        <span title="Soma dos valores, sem as canceladas"><strong className="font-semibold text-slate-800 tabular-nums">{formatBRL(totals.open, true)}</strong> no funil</span>
                    </div>
                </div>

                <div className="relative order-last w-full sm:order-none sm:w-56">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                        placeholder="Buscar cliente, produto, telefone…"
                        className="pl-8 h-8 rounded-lg border-slate-200 bg-white text-[13px]"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-1.5 max-w-full overflow-x-auto scrollbar-none -mx-1 px-1 py-0.5">
                    <Select value={selectedResponsible} onValueChange={setSelectedResponsible}>
                        <SelectTrigger className={cn("h-8 w-auto shrink-0 whitespace-nowrap min-w-[120px] gap-1.5 rounded-lg border-slate-200 bg-white px-2.5 text-[12px] font-medium", selectedResponsible !== "all" && "border-primary/40 text-primary")}>
                            <UserIcon className="h-3.5 w-3.5 text-slate-400" />
                            <SelectValue placeholder="Responsável" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all" className="text-xs font-semibold">Todos os responsáveis</SelectItem>
                            <SelectItem value="unassigned" className="text-xs text-amber-700">Não atribuído</SelectItem>
                            {staffUsers.map((u) => <SelectItem key={u.id} value={u.id.toString()} className="text-xs">{u.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={productFilter} onValueChange={setProductFilter}>
                        <SelectTrigger className={cn("h-8 w-auto shrink-0 whitespace-nowrap min-w-[104px] gap-1.5 rounded-lg border-slate-200 bg-white px-2.5 text-[12px] font-medium", productFilter !== "all" && "border-primary/40 text-primary")}>
                            <Filter className="h-3.5 w-3.5 text-slate-400" />
                            <SelectValue placeholder="Produto" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all" className="text-xs font-semibold">Todos os produtos</SelectItem>
                            {productOptions.map((p) => <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                        <SelectTrigger className={cn("h-8 w-auto shrink-0 whitespace-nowrap min-w-[104px] gap-1.5 rounded-lg border-slate-200 bg-white px-2.5 text-[12px] font-medium", urgencyFilter !== "all" && "border-primary/40 text-primary")}>
                            <AlertCircle className="h-3.5 w-3.5 text-slate-400" />
                            <SelectValue placeholder="Prioridade" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all" className="text-xs font-semibold">Todas as prioridades</SelectItem>
                            <SelectItem value="alta" className="text-xs">Alta · retorno ou tarefa atrasada</SelectItem>
                            <SelectItem value="media" className="text-xs">Média · hoje ou amanhã</SelectItem>
                            <SelectItem value="normal" className="text-xs">Normal</SelectItem>
                        </SelectContent>
                    </Select>
                    {filtersActive && (
                        <Button variant="ghost" size="sm" className="h-8 px-2 shrink-0 text-[12px] text-slate-500" onClick={() => { setSearch(""); setSelectedResponsible("all"); setProductFilter("all"); setUrgencyFilter("all"); }}>
                            <X className="h-3.5 w-3.5 mr-1" />Limpar
                        </Button>
                    )}
                </div>

                {/* Seletor de visualização */}
                <div role="radiogroup" aria-label="Modo de visualização" className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 h-8">
                    {PIPELINE_VIEWS.map((v) => {
                        const Icon = v.id === "compact" ? Columns3 : v.id === "list" ? Rows3 : Rows4;
                        const active = view === v.id;
                        return (
                            <button
                                key={v.id}
                                type="button"
                                role="radio"
                                aria-checked={active}
                                title={v.hint}
                                onClick={() => setView(v.id)}
                                className={cn(
                                    "flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[12px] font-medium transition-colors",
                                    active ? "bg-primary text-primary-foreground shadow-sm" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100",
                                )}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                <span className="hidden md:inline">{v.label}</span>
                            </button>
                        );
                    })}
                </div>

                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsExpanded(!isExpanded)}
                    title={isExpanded ? "Reduzir tela" : "Expandir quadro"}
                    className="h-8 w-8 rounded-lg border-slate-200 bg-white text-slate-600"
                >
                    {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                </Button>

                <Dialog open={open} onOpenChange={(v) => {
                    setOpen(v);
                    if (!v) setEditingLeadId(null);
                }}>
                    <DialogTrigger asChild>
                        <Button
                            onClick={() => {
                                setEditingLeadId(null);
                                setOpen(true);
                            }}
                            className="h-8 px-3 rounded-lg bg-primary hover:bg-primary/90 text-white text-[12px] font-semibold"
                        >
                            <Plus className="mr-1 h-3.5 w-3.5" />
                            Nova oportunidade
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] w-[92vw] max-h-[90vh] rounded-3xl border-none shadow-2xl p-0 overflow-hidden bg-white flex flex-col">
                        <DialogHeader className="p-6 bg-slate-50 border-b border-slate-100 shrink-0">
                            <DialogTitle className="text-2xl font-display font-bold text-slate-900 tracking-tight">
                                {editingLeadId ? "Editar Negócio" : "Iniciar Novo Negócio"}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="p-6 overflow-y-auto flex-1 box-border">
                            <LeadForm
                                contacts={contacts || []}
                                users={staffUsers}
                                columns={columns}
                                initialData={editingLeadId ? leads?.find(l => l.id === editingLeadId) : undefined}
                                onSubmit={(data: InsertLead) => {
                                    if (editingLeadId) {
                                        updateLeadMutation.mutate(data);
                                    } else {
                                        createMutation.mutate(data);
                                    }
                                }}
                                isPending={createMutation.isPending || updateLeadMutation.isPending}
                            />
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Custom Column Dialog */}
            <Dialog open={columnDialogOpen} onOpenChange={setColumnDialogOpen}>
                <DialogContent className="sm:max-w-[400px] rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold font-display">
                            {editingColumn ? "Editar Coluna" : "Adicionar Nova Coluna"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600">Nome da Coluna</label>
                            <Input
                                placeholder="Ex: Negociação, Emissão..."
                                value={newColLabel}
                                onChange={(e) => setNewColLabel(e.target.value)}
                                className="rounded-xl h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600">Cor do Destaque</label>
                            <Select value={newColColor} onValueChange={setNewColColor}>
                                <SelectTrigger className="rounded-xl h-11">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {COLOR_OPTIONS.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            <div className="flex items-center gap-2">
                                                <div className={cn("w-3 h-3 rounded-full", opt.bg, opt.accent, "border")} />
                                                {opt.label}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={handleSaveColumn} className="w-full h-11 rounded-xl font-bold mt-4 shadow-lg shadow-primary/20">
                            Salvar Coluna
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {view === "list" ? (
                <PipelineList
                    rows={filteredLeads.map(cardProps)}
                    columns={columns}
                    staff={staffUsers as any}
                    prefKey={viewPrefKey}
                    maxHeight={isExpanded ? "calc(100vh - 92px)" : "calc(100vh - 196px)"}
                />
            ) : (
            <div className="flex-1 min-h-0 overflow-x-auto pb-2 scrollbar-elegant snap-x snap-mandatory sm:snap-none">
                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="board" type="column" direction="horizontal">
                        {(provided) => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className="flex gap-2.5 h-full"
                            >
                                {columns.map((column: any, index: number) => {
                                    const columnLeads = filteredLeads.filter((l) => leadInColumn(l, column, columns, index));
                                    const columnTotal = columnLeads.reduce((acc, l) => acc + parseBRL(l.value), 0);
                                    return (
                                    <Draggable key={column.id} draggableId={column.id} index={index}>
                                        {(columnProvided, columnSnapshot) => (
                                            <div
                                                ref={columnProvided.innerRef}
                                                {...columnProvided.draggableProps}
                                                className={cn(
                                                    "flex-shrink-0 snap-start flex flex-col rounded-xl border border-slate-200/70 bg-slate-100/50",
                                                    colWidth,
                                                    boardHeight,
                                                    columnSnapshot.isDragging && "shadow-xl ring-1 ring-primary/20",
                                                )}
                                            >
                                                {/* Cabeçalho da coluna */}
                                                <div
                                                    {...columnProvided.dragHandleProps}
                                                    className="group/col flex items-center gap-1.5 px-2.5 pt-2 pb-1.5 cursor-grab active:cursor-grabbing"
                                                >
                                                    <span className={cn("h-2 w-2 rounded-full shrink-0", column.color?.replace("text-", "bg-") || "bg-blue-500")} />
                                                    <h3 className="font-semibold text-[13px] text-slate-800 truncate">{column.label}</h3>
                                                    <span className="text-[11px] font-medium text-slate-400 tabular-nums">{columnLeads.length}</span>
                                                    <span className="ml-auto text-[11px] font-medium text-slate-500 tabular-nums group-hover/col:hidden">{formatBRL(columnTotal, true)}</span>
                                                    <div className="ml-auto hidden group-hover/col:flex items-center">
                                                        <button
                                                            type="button"
                                                            title="Editar coluna"
                                                            className="h-6 w-6 inline-flex items-center justify-center rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-200/60"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditingColumn(column);
                                                                setNewColLabel(column.label);
                                                                const matchColor = COLOR_OPTIONS.find(o => o.color === column.color)?.value || "blue";
                                                                setNewColColor(matchColor);
                                                                setColumnDialogOpen(true);
                                                            }}
                                                        >
                                                            <Edit2 className="h-3 w-3" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            title="Excluir coluna"
                                                            className="h-6 w-6 inline-flex items-center justify-center rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteColumn(column.id);
                                                            }}
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                </div>

                                                <Droppable droppableId={column.id}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            {...provided.droppableProps}
                                                            ref={provided.innerRef}
                                                            className={cn(
                                                                "flex-1 overflow-y-auto scrollbar-thin px-1.5 pb-1.5 rounded-b-xl transition-colors",
                                                                view === "ultra" ? "space-y-[3px]" : "space-y-1.5",
                                                                snapshot.isDraggingOver && "bg-primary/5",
                                                            )}
                                                        >
                                                            {columnLeads.map((lead, leadIdx) => (
                                                                <Draggable key={lead.id} draggableId={lead.id.toString()} index={leadIdx}>
                                                                    {(provided, snapshot) => (
                                                                        <div
                                                                            ref={provided.innerRef}
                                                                            {...provided.draggableProps}
                                                                            {...provided.dragHandleProps}
                                                                            style={{
                                                                                ...provided.draggableProps.style,
                                                                                cursor: snapshot.isDragging ? "grabbing" : "pointer",
                                                                            }}
                                                                        >
                                                                            {view === "ultra" ? (
                                                                                <UltraLeadCard {...cardProps(lead)} dragging={snapshot.isDragging} />
                                                                            ) : (
                                                                                <CompactLeadCard {...cardProps(lead)} dragging={snapshot.isDragging} />
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </Draggable>
                                                            ))}
                                                            {provided.placeholder}
                                                            {columnLeads.length === 0 && !snapshot.isDraggingOver && (
                                                                <div className="py-6 text-center text-[11px] text-slate-400">Sem oportunidades</div>
                                                            )}
                                                        </div>
                                                    )}
                                                </Droppable>
                                            </div>
                                        )}
                                    </Draggable>
                                    );
                                })}
                                {provided.placeholder}

                                <div className="w-44 shrink-0">
                                    <button
                                        onClick={() => {
                                            setEditingColumn(null);
                                            setNewColLabel("");
                                            setNewColColor("blue");
                                            setColumnDialogOpen(true);
                                        }}
                                        className="w-full h-10 rounded-xl border border-dashed border-slate-300 hover:border-slate-400 hover:bg-white text-slate-400 hover:text-slate-600 transition-colors font-medium text-[12px] flex items-center justify-center gap-1.5"
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                        Nova coluna
                                    </button>
                                </div>
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            </div>
            )}

            <AlertDialog open={!!deleteLeadId} onOpenChange={(open) => !open && setDeleteLeadId(null)}>
                <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza que deseja excluir?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O negócio e todo o seu histórico no funil serão removidos permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl border-gray-200">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteLeadId && deleteLeadMutation.mutate(deleteLeadId)}
                            className="bg-red-500 hover:bg-red-600 text-white rounded-xl border-none shadow-lg shadow-red-200"
                        >
                            {deleteLeadMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                "Confirmar Exclusão"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <ContactProfile
                contactId={viewContactId}
                open={!!viewContactId}
                onOpenChange={(open) => !open && setViewContactId(null)}
            />

            <LeadReminderModal
                isOpen={Boolean(reminderLead)}
                onClose={() => setReminderLead(null)}
                lead={reminderLead}
                contact={reminderLead ? getContactForLead(reminderLead.contactId) : null}
                responsible={reminderLead ? getResponsibleUser(reminderLead.assignedTo) : null}
                onSave={(data) => saveReminderMutation.mutate(data)}
                onTest={(data) => testReminderMutation.mutate(data)}
                isSaving={saveReminderMutation.isPending}
                isTesting={testReminderMutation.isPending}
            />
        </div>
    );
}

function LeadForm({ contacts, users = [], columns, onSubmit, isPending, initialData }: any) {
    const { toast } = useToast();

    // Direct text search input state
    const [searchQuery, setSearchQuery] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [showContactModal, setShowContactModal] = useState(false);

    const form = useForm<InsertLead>({
        resolver: zodResolver(insertLeadSchema),
        defaultValues: initialData ? {
            ...initialData,
            value: initialData.value || "",
            source: initialData.source || "",
            product: initialData.product || "",
            lifeHeight: initialData.lifeHeight || "",
            lifeWeight: initialData.lifeWeight || "",
            lifeProfession: initialData.lifeProfession || "",
            lifeIncome: initialData.lifeIncome || "",
            notes: initialData.notes || "",
            assignedTo: initialData.assignedTo || undefined,
        } : {
            contactId: 0,
            status: columns[0]?.id || "new",
            source: "",
            product: "",
            lifeHeight: "",
            lifeWeight: "",
            lifeProfession: "",
            lifeIncome: "",
            value: "",
            notes: "",
            assignedTo: undefined,
        },
    });

    const selectedContactId = form.watch("contactId");
    const selectedProduct = form.watch("product");
    const lifeHeight = form.watch("lifeHeight");
    const lifeWeight = form.watch("lifeWeight");
    const lifeProfession = form.watch("lifeProfession");
    const lifeIncome = form.watch("lifeIncome");

    // Sync input text query with selected contact
    useEffect(() => {
        if (selectedContactId) {
            const found = contacts?.find((c: any) => String(c.id) === String(selectedContactId));
            if (found) {
                setSearchQuery(found.name);
            }
        }
    }, [selectedContactId, contacts]);

    // Close autocomplete dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (initialData) {
            form.reset({
                ...initialData,
                value: initialData.value || "",
                source: initialData.source || "",
                product: initialData.product || "",
                lifeHeight: initialData.lifeHeight || "",
                lifeWeight: initialData.lifeWeight || "",
                lifeProfession: initialData.lifeProfession || "",
                lifeIncome: initialData.lifeIncome || "",
                notes: initialData.notes || "",
                assignedTo: initialData.assignedTo || undefined,
            });
        }
    }, [initialData, form]);

    const { data: services, isLoading: servicesLoading } = useQuery<any[]>({
        queryKey: ["/api/services"],
        queryFn: async () => {
            const res = await fetch("/api/services", { credentials: "include" });
            if (!res.ok) throw new Error("Erro ao carregar serviços");
            return res.json();
        },
        staleTime: 0,
        retry: 2,
    });

    // Filter contacts based on text typed in search input box
    const filteredContacts = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return contacts;
        return contacts.filter((c: any) => 
            (c.name || "").toLowerCase().includes(q) ||
            (c.phone || "").includes(q) ||
            (c.document || "").includes(q) ||
            (c.email || "").toLowerCase().includes(q)
        );
    }, [contacts, searchQuery]);

    const handleFormSubmit = form.handleSubmit(
        (data) => {
            if (!data.contactId) {
                toast({ title: "Selecione um cliente válido", variant: "destructive" });
                return;
            }
            onSubmit(data);
        },
        (errors) => {
            console.error("Lead form errors:", errors);
            toast({
                title: "Verifique os campos do formulário",
                description: "Certifique-se de ter selecionado um contato válido.",
                variant: "destructive",
            });
        }
    );

    return (
        <>
            <Form {...form}>
                <form onSubmit={handleFormSubmit} className="space-y-4 w-full box-border">
                    <FormField
                        control={form.control}
                        name="contactId"
                        render={({ field }) => (
                            <FormItem className="w-full min-w-0 relative">
                                <div className="flex items-center justify-between">
                                    <FormLabel className="text-gray-600 font-bold">Contato / Cliente *</FormLabel>
                                    {!initialData && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2 text-primary hover:bg-primary/10 text-xs font-bold gap-1"
                                            onClick={() => setShowContactModal(true)}
                                        >
                                            <UserPlus className="h-3.5 w-3.5" />
                                            + Novo Cliente Completo
                                        </Button>
                                    )}
                                </div>
                                <FormControl className="w-full min-w-0">
                                    <div className="flex items-center gap-2" ref={dropdownRef}>
                                        <div className="relative flex-1 min-w-0">
                                            <Input
                                                type="text"
                                                placeholder="Digite o nome ou telefone para pesquisar..."
                                                value={searchQuery}
                                                disabled={!!initialData}
                                                onChange={(e) => {
                                                    setSearchQuery(e.target.value);
                                                    setIsDropdownOpen(true);
                                                }}
                                                onFocus={() => setIsDropdownOpen(true)}
                                                className="rounded-xl h-11 pr-8 text-slate-900 font-medium"
                                            />
                                            {searchQuery && !initialData && (
                                                <button
                                                    type="button"
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                    onClick={() => {
                                                        setSearchQuery("");
                                                        field.onChange(0);
                                                        setIsDropdownOpen(true);
                                                    }}
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            )}

                                            {/* Autocomplete Dropdown List */}
                                            {isDropdownOpen && !initialData && (
                                                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 max-h-64 overflow-y-auto p-1 space-y-0.5">
                                                    <button
                                                        type="button"
                                                        className="w-full text-left px-3 py-2.5 rounded-xl bg-primary/5 hover:bg-primary/10 text-primary font-bold text-xs flex items-center gap-2 transition-colors border-b border-primary/10 mb-1"
                                                        onClick={() => {
                                                            setIsDropdownOpen(false);
                                                            setShowContactModal(true);
                                                        }}
                                                    >
                                                        <span className="h-5 w-5 rounded-full bg-primary text-white flex items-center justify-center text-xs font-black">+</span>
                                                        Cadastrar Novo Cliente Completo
                                                    </button>

                                                    {filteredContacts.length === 0 ? (
                                                        <div className="p-4 text-center text-sm text-slate-400 italic">
                                                            Nenhum contato encontrado para "{searchQuery}".
                                                        </div>
                                                    ) : (
                                                        filteredContacts.map((c: any) => (
                                                            <div
                                                                key={c.id}
                                                                className={cn(
                                                                    "px-3 py-2.5 rounded-xl cursor-pointer hover:bg-slate-100 flex items-center justify-between transition-colors",
                                                                    field.value === c.id ? "bg-primary/10 font-bold text-primary" : "text-slate-800"
                                                                )}
                                                                onClick={() => {
                                                                    field.onChange(c.id);
                                                                    setSearchQuery(c.name);
                                                                    setIsDropdownOpen(false);
                                                                }}
                                                            >
                                                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                                    <div className="h-7 w-7 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                                                                        {c.name.charAt(0).toUpperCase()}
                                                                    </div>
                                                                    <div className="truncate">
                                                                        <p className="text-sm font-semibold truncate">{c.name}</p>
                                                                        {c.phone && <p className="text-xs text-slate-400 truncate">{c.phone}</p>}
                                                                    </div>
                                                                </div>
                                                                {field.value === c.id && (
                                                                    <Check className="h-4 w-4 text-primary shrink-0 ml-2" />
                                                                )}
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {!initialData && (
                                            <Button
                                                type="button"
                                                size="icon"
                                                className="h-11 w-11 rounded-xl bg-primary hover:bg-primary/90 text-white shrink-0 shadow-md transition-all active:scale-95"
                                                onClick={() => setShowContactModal(true)}
                                                title="Cadastrar Novo Cliente Completo (Com todas as informações)"
                                            >
                                                <Plus className="h-5 w-5" />
                                            </Button>
                                        )}
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Field for Responsável pela Venda */}
                    <FormField
                        control={form.control}
                        name="assignedTo"
                        render={({ field }) => (
                            <FormItem className="w-full min-w-0">
                                <FormLabel className="text-gray-600 font-bold">Responsável pela Venda (Funcionário)</FormLabel>
                                <Select
                                    onValueChange={(val) => field.onChange(!val || val === "none" ? null : parseInt(val))}
                                    value={field.value ? field.value.toString() : "none"}
                                >
                                    <FormControl className="w-full min-w-0">
                                        <SelectTrigger className="rounded-xl h-11 w-full min-w-0">
                                            <SelectValue placeholder="Selecione o funcionário responsável..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="none" className="text-slate-500 italic text-xs">
                                            Nenhum responsável (Não atribuído)
                                        </SelectItem>
                                        {users?.map((u: any) => (
                                            <SelectItem key={u.id} value={u.id.toString()}>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-5 w-5 rounded-full bg-primary/20 text-primary font-bold text-[10px] flex items-center justify-center">
                                                        {u.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span>{u.name}</span>
                                                    {u.role === "admin" && (
                                                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">Admin</span>
                                                    )}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full min-w-0">
                        <FormField
                            control={form.control}
                            name="source"
                            render={({ field }) => (
                                <FormItem className="w-full min-w-0">
                                    <FormLabel className="text-gray-600 font-bold">Origem</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value || ""}
                                    >
                                        <FormControl className="w-full min-w-0">
                                            <SelectTrigger className="rounded-xl h-11 w-full min-w-0">
                                                <SelectValue placeholder="Selecione a origem" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Indicação">Indicação</SelectItem>
                                            <SelectItem value="Carteira">Carteira</SelectItem>
                                            <SelectItem value="BNI">BNI</SelectItem>
                                            <SelectItem value="MA">MA</SelectItem>
                                            <SelectItem value="GWM">GWM</SelectItem>
                                            <SelectItem value="Redes Sociais">Redes Sociais</SelectItem>
                                            {field.value && !["Indicação", "Carteira", "BNI", "MA", "GWM", "Redes Sociais"].includes(field.value) && (
                                                <SelectItem value={field.value}>{field.value}</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="product"
                            render={({ field }) => (
                                <FormItem className="w-full min-w-0">
                                    <FormLabel className="text-gray-600 font-bold">Produto</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value || ""}
                                    >
                                        <FormControl className="w-full min-w-0">
                                            <SelectTrigger className="rounded-xl h-11 w-full min-w-0">
                                                <SelectValue placeholder={servicesLoading ? "Carregando..." : "Selecione"} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {servicesLoading && (
                                                <div className="flex items-center justify-center py-4 text-sm text-slate-500">
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando serviços...
                                                </div>
                                            )}
                                            {STANDARD_PRODUCTS.map((prod) => (
                                                <SelectItem key={prod} value={prod}>
                                                    {prod}
                                                </SelectItem>
                                            ))}
                                            {services?.filter((s: any) => !(STANDARD_PRODUCTS as readonly string[]).includes(s.title)).map((s: any) => (
                                                <SelectItem key={s.id} value={s.title}>
                                                    {s.title}
                                                </SelectItem>
                                            ))}
                                            {field.value && !(STANDARD_PRODUCTS as readonly string[]).includes(field.value as any) && !services?.some((s: any) => s.title === field.value) && (
                                                <SelectItem value={field.value}>
                                                    {field.value}
                                                </SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {isLifeInsuranceProduct(selectedProduct) && (
                        <LifeInsuranceFieldsSection
                            values={{ lifeHeight, lifeWeight, lifeProfession, lifeIncome }}
                            onChange={(field, val) => form.setValue(field, val)}
                        />
                    )}

                    <FormField
                        control={form.control}
                        name="value"
                        render={({ field }) => (
                            <FormItem className="w-full min-w-0">
                                <FormLabel className="text-gray-600 font-bold">Valor (R$)</FormLabel>
                                <FormControl className="w-full min-w-0">
                                    <Input placeholder="0,00" className="rounded-xl h-11 w-full min-w-0 box-border" {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                            <FormItem className="w-full min-w-0">
                                <FormLabel className="text-gray-600 font-bold">Observações</FormLabel>
                                <FormControl className="w-full min-w-0">
                                    <Textarea placeholder="Detalhes do negócio..." className="rounded-xl min-h-[100px] w-full min-w-0 box-border resize-y" {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button
                        type="submit"
                        className="w-full h-12 rounded-xl text-lg font-bold shadow-lg shadow-primary/20 mt-2"
                        disabled={isPending}
                    >
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {initialData ? "Salvar Alterações" : "Criar Negócio"}
                    </Button>
                </form>
            </Form>

            <ContactFormModal
                open={showContactModal}
                onOpenChange={setShowContactModal}
                onSuccess={(newContact) => {
                    form.setValue("contactId", newContact.id);
                    setSearchQuery(newContact.name);
                    toast({ title: `✅ Contato "${newContact.name}" cadastrado e selecionado!` });
                }}
            />
        </>
    );
}

function toDateInputValue(dateInput?: string | Date | null): string {
    if (!dateInput) return "";
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function formatLeadReminderDisplay(dateVal: string | Date | null | undefined): { text: string; isOverdue: boolean; isToday: boolean; isTomorrow: boolean } {
    if (!dateVal) return { text: "", isOverdue: false, isToday: false, isTomorrow: false };
    const date = new Date(dateVal);
    if (isNaN(date.getTime())) return { text: String(dateVal), isOverdue: false, isToday: false, isTomorrow: false };

    // Comparação de dia de calendário em meia-noite local
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const isToday = targetDate.getTime() === today.getTime();
    const isTomorrow = targetDate.getTime() === tomorrow.getTime();
    const isOverdue = targetDate.getTime() < today.getTime();

    let text = "";
    if (isToday) {
        text = "Hoje";
    } else if (isTomorrow) {
        text = "Amanhã";
    } else {
        text = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
    }

    return { text, isOverdue, isToday, isTomorrow };
}

function LeadReminderModal({
    isOpen,
    onClose,
    lead,
    contact,
    responsible,
    onSave,
    onTest,
    isSaving,
    isTesting,
}: {
    isOpen: boolean;
    onClose: () => void;
    lead: Lead | null;
    contact?: any;
    responsible?: any;
    onSave: (data: { id: number; reminderDate: string | null; reminderNote: string | null; reminderEmail: string | null }) => void;
    onTest: (data: { id: number; reminderDate?: string; reminderNote?: string; reminderEmail?: string }) => void;
    isSaving: boolean;
    isTesting: boolean;
}) {
    const { toast } = useToast();
    const [reminderDate, setReminderDate] = useState("");
    const [reminderNote, setReminderNote] = useState("");
    const [reminderEmail, setReminderEmail] = useState("");

    useEffect(() => {
        if (lead) {
            setReminderDate(toDateInputValue(lead.reminderDate));
            setReminderNote(lead.reminderNote || "");
            setReminderEmail(lead.reminderEmail || responsible?.email || "");
        } else {
            setReminderDate("");
            setReminderNote("");
            setReminderEmail("");
        }
    }, [lead, responsible]);

    if (!lead) return null;

    const setPresetDay = (preset: "today" | "tomorrow" | "in_3_days" | "in_7_days" | "next_monday") => {
        const d = new Date();
        if (preset === "today") {
            // Mantém hoje
        } else if (preset === "tomorrow") {
            d.setDate(d.getDate() + 1);
        } else if (preset === "in_3_days") {
            d.setDate(d.getDate() + 3);
        } else if (preset === "in_7_days") {
            d.setDate(d.getDate() + 7);
        } else if (preset === "next_monday") {
            const dayOfWeek = d.getDay(); // 0 domingo, 1 segunda
            const daysUntilMonday = ((1 + 7 - dayOfWeek) % 7) || 7;
            d.setDate(d.getDate() + daysUntilMonday);
        }
        setReminderDate(toDateInputValue(d));
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!reminderDate) {
            toast({
                title: "Selecione o dia do retorno",
                description: "Escolha uma data para o disparo do retorno para o cliente por e-mail.",
                variant: "destructive"
            });
            return;
        }

        onSave({
            id: lead.id,
            reminderDate, // Formato YYYY-MM-DD
            reminderNote: reminderNote.trim() || null,
            reminderEmail: reminderEmail.trim() || null,
        });
    };

    const handleClear = () => {
        onSave({
            id: lead.id,
            reminderDate: null,
            reminderNote: null,
            reminderEmail: null,
        });
    };

    const handleTest = () => {
        onTest({
            id: lead.id,
            reminderDate: reminderDate || undefined,
            reminderNote: reminderNote.trim() || undefined,
            reminderEmail: reminderEmail.trim() || undefined,
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-lg p-0 overflow-hidden rounded-3xl border border-slate-200/80 shadow-2xl">
                <div className="bg-gradient-to-br from-[#08454c] via-[#0b545d] to-[#163b52] p-6 text-white relative overflow-hidden">
                    <div className="absolute top-[-40px] right-[-40px] w-36 h-36 bg-amber-400/15 rounded-full blur-2xl pointer-events-none" />

                    <div className="relative z-10 flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shadow-sm shrink-0">
                            <BellRing className="w-6 h-6 animate-pulse" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20 inline-block mb-1">
                                Pipeline • Disparo no Dia
                            </span>
                            <DialogTitle className="text-xl font-display font-bold text-white tracking-tight">
                                Agendar Retorno para o Cliente
                            </DialogTitle>
                            <p className="text-slate-300 text-xs mt-1 leading-relaxed">
                                Escolha o dia para disparar o retorno para o cliente por e-mail, independente do horário.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-5 bg-white max-h-[75vh] overflow-y-auto">
                    {/* Resumo da Oportunidade */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-800 truncate">
                                👤 {contact?.name || `Lead #${lead.id}`}
                            </span>
                            <Badge variant="outline" className="text-[10px] font-semibold">
                                {lead.status}
                            </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                            {lead.product && (
                                <span><strong>Produto:</strong> {lead.product}</span>
                            )}
                            {lead.value && (
                                <span><strong>Valor:</strong> R$ {lead.value}</span>
                            )}
                            <span><strong>Responsável:</strong> {responsible?.name || "Não atribuído"}</span>
                        </div>
                    </div>

                    <form onSubmit={handleSave} className="space-y-4">
                        {/* Seletor Rápido de Dias */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Sugestões Rápidas de Dia
                            </Label>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPresetDay("today")}
                                    className="h-8 text-xs font-bold rounded-lg border-amber-200 bg-amber-50/50 hover:bg-amber-100 text-amber-900"
                                >
                                    ⚡ Hoje
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPresetDay("tomorrow")}
                                    className="h-8 text-xs rounded-lg border-slate-200 hover:border-amber-400 hover:bg-amber-50"
                                >
                                    Amanhã
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPresetDay("in_3_days")}
                                    className="h-8 text-xs rounded-lg border-slate-200 hover:border-amber-400 hover:bg-amber-50"
                                >
                                    Em 3 dias
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPresetDay("in_7_days")}
                                    className="h-8 text-xs rounded-lg border-slate-200 hover:border-amber-400 hover:bg-amber-50"
                                >
                                    Em 1 semana
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPresetDay("next_monday")}
                                    className="h-8 text-xs rounded-lg border-slate-200 hover:border-amber-400 hover:bg-amber-50"
                                >
                                    Próx. Segunda
                                </Button>
                            </div>
                        </div>

                        {/* Campo Data */}
                        <div className="space-y-1.5">
                            <Label htmlFor="reminder-date-input" className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                                Dia do Retorno para o Cliente *
                            </Label>
                            <Input
                                id="reminder-date-input"
                                type="date"
                                value={reminderDate}
                                onChange={(e) => setReminderDate(e.target.value)}
                                required
                                className="h-11 rounded-xl border-slate-200 focus:border-[#08454c] text-sm font-semibold"
                            />
                            <p className="text-[11px] text-slate-500 font-medium">
                                ⚡ O e-mail será disparado no dia selecionado, independente da hora. Ao agendar para hoje, o disparo é feito imediatamente.
                            </p>
                        </div>

                        {/* Campo E-mail Destinatário */}
                        <div className="space-y-1.5">
                            <Label htmlFor="reminder-email" className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 text-[#08454c]" />
                                Enviar E-mail de Notificação Para:
                            </Label>
                            <Input
                                id="reminder-email"
                                type="email"
                                value={reminderEmail}
                                onChange={(e) => setReminderEmail(e.target.value)}
                                placeholder="ex: corretor@monteiroseguros.com.br"
                                className="h-11 rounded-xl border-slate-200 focus:border-[#08454c] text-sm"
                            />
                            <p className="text-[11px] text-slate-400">
                                Por padrão, enviado ao e-mail do responsável ({responsible?.email || "configurado no sistema"}). Você pode alterar para qualquer outro destinatário.
                            </p>
                        </div>

                        {/* Campo Nota do Lembrete */}
                        <div className="space-y-1.5">
                            <Label htmlFor="reminder-note" className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                📝 Mensagem / Instruções do Follow-up
                            </Label>
                            <Textarea
                                id="reminder-note"
                                value={reminderNote}
                                onChange={(e) => setReminderNote(e.target.value)}
                                placeholder="ex: Cobrar retorno do diretor comercial referente à proposta do Plano de Saúde e inclusão dos dependentes..."
                                rows={3}
                                className="rounded-xl border-slate-200 focus:border-[#08454c] text-sm"
                            />
                        </div>

                        {/* Banner de Status Atual */}
                        {lead.reminderDate && (
                            <div className={cn(
                                "p-3 rounded-xl border text-xs flex items-center justify-between gap-2",
                                lead.reminderSent
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                                    : "bg-amber-50 border-amber-200 text-amber-800"
                            )}>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 shrink-0" />
                                    <span>
                                        {lead.reminderSent
                                            ? "Último e-mail de retorno para o cliente já foi disparado. Ao salvar uma nova data futura, ele será rearmado."
                                            : "Retorno para o cliente atualmente ativo para disparo no dia programado."}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Botões do Rodapé */}
                        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                {lead.reminderDate && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleClear}
                                        disabled={isSaving}
                                        className="h-10 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl"
                                    >
                                        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                        Remover Retorno
                                    </Button>
                                )}
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleTest}
                                    disabled={isTesting || isSaving}
                                    className="h-10 text-xs rounded-xl border-slate-200 hover:bg-slate-100"
                                    title="Dispara imediatamente um e-mail de teste para o endereço configurado acima"
                                >
                                    {isTesting ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Send className="w-3.5 h-3.5 mr-1.5 text-blue-600" />}
                                    Testar E-mail Agora
                                </Button>
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={onClose}
                                    className="h-10 text-xs rounded-xl"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSaving}
                                    className="h-10 text-xs rounded-xl bg-[#08454c] hover:bg-[#0c5963] text-white font-bold px-5 shadow-sm"
                                >
                                    {isSaving && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                                    Salvar Retorno
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
