import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Lead, Contact, InsertLead, insertLeadSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import { Loader2, Plus, ArrowRight, Target, TrendingUp, Filter, Search, Maximize2, Minimize2 } from "lucide-react";
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

const DEFAULT_LEAD_COLUMNS = [
    { id: "new", label: "Novo Lead", color: "text-blue-500", bg: "bg-blue-50/50", accent: "border-blue-300" },
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
    const { settings, updateSettings } = useSiteSettings();
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [editingLeadId, setEditingLeadId] = useState<number | null>(null);
    const [deleteLeadId, setDeleteLeadId] = useState<number | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    // Dynamic Columns State
    const [columnDialogOpen, setColumnDialogOpen] = useState(false);
    const [editingColumn, setEditingColumn] = useState<any>(null);
    const [newColLabel, setNewColLabel] = useState("");
    const [newColColor, setNewColColor] = useState("blue");

    const columns = useMemo(() => {
        if (settings?.leadColumns) {
            try {
                return JSON.parse(settings.leadColumns);
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

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: number; status: string }) => {
            const res = await apiRequest("PATCH", `/api/leads/${id}/status`, { status });
            return await res.json();
        },
        onSuccess: () => {
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

    if (leadsLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${isExpanded ? "fixed inset-0 z-50 bg-[#f1f5f9] p-8 overflow-hidden flex flex-col transition-all duration-300" : ""}`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-display font-bold text-gray-900">Funil de Vendas</h2>
                    <p className="text-muted-foreground mt-1">Gerencie seus negócios e acompanhe a conversão de leads.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Button 
                        variant="outline" 
                        onClick={() => setIsExpanded(!isExpanded)} 
                        className="bg-white hover:bg-gray-50 border-gray-200 text-gray-700 h-10 px-4 rounded-xl shadow-sm"
                    >
                        {isExpanded ? <Minimize2 className="mr-2 h-4 w-4" /> : <Maximize2 className="mr-2 h-4 w-4" />}
                        {isExpanded ? "Reduzir Tela" : "Expandir Quadro"}
                    </Button>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Buscar lead..."
                            className="pl-9 h-10 w-64 rounded-xl border-gray-200"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button
                                onClick={() => {
                                    setEditingLeadId(null);
                                    setOpen(true);
                                }}
                                className="bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 h-10 px-6 font-bold"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Novo Negócio
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[450px] rounded-2xl border-none shadow-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-display font-bold tracking-tight">
                                    {editingLeadId ? "Editar Negócio" : "Iniciar Novo Negócio"}
                                </DialogTitle>
                            </DialogHeader>
                            <LeadForm
                                contacts={contacts || []}
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
                        </DialogContent>
                    </Dialog>
                </div>
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

            <div className={`flex-1 overflow-x-auto pb-6 scrollbar-elegant ${isExpanded ? "flex-1" : ""}`}>
                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="board" type="column" direction="horizontal">
                        {(provided) => (
                            <div 
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className="flex gap-6 h-full min-w-[900px]"
                            >
                                {columns.map((column: any, index: number) => (
                                    <Draggable key={column.id} draggableId={column.id} index={index}>
                                        {(columnProvided, columnSnapshot) => (
                                            <div
                                                ref={columnProvided.innerRef}
                                                {...columnProvided.draggableProps}
                                                className={cn(
                                                    "flex-shrink-0 w-80 flex flex-col relative bg-slate-100/40 rounded-2xl border border-slate-200/60 p-3 h-full",
                                                    columnSnapshot.isDragging ? "shadow-2xl ring-2 ring-primary/10 rotate-[1deg]" : "",
                                                    isExpanded ? "h-[calc(100vh-160px)]" : "h-[calc(100vh-280px)]"
                                                )}
                                            >
                                                {/* Column Header */}
                                                <div 
                                                    {...columnProvided.dragHandleProps}
                                                    className="flex items-center justify-between mb-4 px-2 cursor-grab active:cursor-grabbing"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn("h-2.5 w-2.5 rounded-full", column.color?.replace("text-", "bg-") || "bg-blue-500")} />
                                                        <h3 className="font-display font-bold text-gray-800 tracking-tight">{column.label}</h3>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 text-slate-400 hover:text-slate-900 hover:bg-slate-200/50 rounded-lg"
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
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteColumn(column.id);
                                                            }}
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                <Droppable droppableId={column.id}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            {...provided.droppableProps}
                                                            ref={provided.innerRef}
                                                            className={cn(
                                                                "flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin rounded-xl p-1",
                                                                snapshot.isDraggingOver ? "bg-slate-200/30" : ""
                                                            )}
                                                        >
                                                            {leads?.filter(l => l.status === column.id && (
                                                                search === "" ||
                                                                contacts?.find(c => c.id === l.contactId)?.name.toLowerCase().includes(search.toLowerCase())
                                                            )).map((lead, index) => (
                                                                <Draggable key={lead.id} draggableId={lead.id.toString()} index={index}>
                                                                    {(provided, snapshot) => (
                                                                        <div
                                                                            ref={provided.innerRef}
                                                                            {...provided.draggableProps}
                                                                            {...provided.dragHandleProps}
                                                                            style={{
                                                                                ...provided.draggableProps.style,
                                                                                cursor: snapshot.isDragging ? 'grabbing' : 'grab'
                                                                            }}
                                                                        >
                                                                            <LeadCard
                                                                                lead={lead}
                                                                                contact={contacts?.find(c => c.id === lead.contactId)}
                                                                                columns={columns}
                                                                                onMove={(newStatus) => updateStatusMutation.mutate({ id: lead.id, status: newStatus })}
                                                                                onEdit={() => {
                                                                                    setEditingLeadId(lead.id);
                                                                                    setOpen(true);
                                                                                }}
                                                                                onDelete={() => setDeleteLeadId(lead.id)}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </Draggable>
                                                            ))}
                                                            {provided.placeholder}
                                                        </div>
                                                    )}
                                                </Droppable>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}

                                <div className="w-80 shrink-0">
                                    <button
                                        onClick={() => {
                                            setEditingColumn(null);
                                            setNewColLabel("");
                                            setNewColColor("blue");
                                            setColumnDialogOpen(true);
                                        }}
                                        className="w-full h-14 rounded-2xl border-2 border-dashed border-slate-300 hover:border-slate-400 hover:bg-white text-slate-400 hover:text-slate-600 transition-all font-bold text-sm flex items-center justify-center gap-2 group shadow-sm"
                                    >
                                        <Plus className="h-5 w-5 transition-transform group-hover:scale-125" />
                                        Nova Coluna
                                    </button>
                                </div>
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            </div>

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
        </div>
    );
}

function LeadCard({
    lead,
    contact,
    columns,
    onMove,
    onEdit,
    onDelete
}: {
    lead: Lead,
    contact?: Contact,
    columns: any[],
    onMove: (s: string) => void,
    onEdit: () => void,
    onDelete: () => void
}) {
    const statusIndex = columns.findIndex(s => s.id === lead.status);
    const nextStatus = statusIndex !== -1 && statusIndex < columns.length - 1 ? columns[statusIndex + 1].id : null;
    const prevStatus = statusIndex > 0 ? columns[statusIndex - 1].id : null;

    return (
        <div className="group bg-white p-5 rounded-xl border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-[#1A3A4F] opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm rounded-lg p-1 shadow-sm border border-gray-100">
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-100" onClick={onEdit}>
                    <Edit2 className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50" onClick={onDelete}>
                    <Trash2 className="h-3 w-3" />
                </Button>
            </div>

            <div className="flex justify-between items-start mb-4">
                <div className="flex-1 pr-12">
                    <h4 className="font-bold text-gray-900 line-clamp-1">{contact?.name || "Desconhecido"}</h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-gray-100 text-gray-600">
                            {lead.source || "Direto"}
                        </span>
                        {lead.product && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary">
                                {lead.product}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="mb-4">
                <Select value={lead.status} onValueChange={onMove}>
                    <SelectTrigger className="h-8 text-[11px] font-bold border-gray-100 bg-slate-50/50 hover:bg-slate-50 rounded-lg">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {columns.map(s => (
                            <SelectItem key={s.id} value={s.id} className="text-xs font-bold">
                                {s.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="bg-slate-50 rounded-lg p-3 mb-4">
                <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Valor Estimado:</span>
                    <strong className="text-secondary font-display font-black text-sm text-right leading-none">
                        {lead.value ? `R$ ${lead.value}` : "Sob consulta"}
                    </strong>
                </div>
            </div>

            {lead.notes ? (
                <p className="text-xs text-gray-500 mb-4 line-clamp-2 leading-relaxed italic border-l-2 border-primary/20 pl-2">
                    "{lead.notes}"
                </p>
            ) : (
                <div className="h-4"></div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex gap-2">
                    {prevStatus && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 px-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                            onClick={() => onMove(prevStatus)}
                        >
                            <ArrowRight className="h-4 w-4 rotate-180" />
                        </Button>
                    )}
                </div>

                <div className="flex gap-2">
                    {nextStatus && (
                        <Button
                            variant="default"
                            size="sm"
                            className="h-8 px-4 text-[11px] font-bold bg-primary hover:bg-[#1A3A4F] text-white shadow-md shadow-primary/20 transition-all group-hover:shadow-lg"
                            onClick={() => onMove(nextStatus)}
                        >
                            Avançar
                            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

function LeadForm({ contacts, columns, onSubmit, isPending, initialData }: any) {
    const form = useForm<InsertLead>({
        resolver: zodResolver(insertLeadSchema),
        defaultValues: initialData ? {
            ...initialData,
            value: initialData.value || "",
            source: initialData.source || "",
            product: initialData.product || "",
            notes: initialData.notes || "",
        } : {
            contactId: 0,
            status: columns[0]?.id || "new",
            source: "",
            product: "",
            value: "",
            notes: "",
        },
    });

    const { data: products, isLoading: productsLoading } = useQuery<any[]>({
        queryKey: ["/api/products-active"],
        queryFn: async () => {
            const res = await fetch("/api/products?activeOnly=true", { credentials: "include" });
            if (!res.ok) throw new Error("Erro ao carregar produtos");
            return res.json();
        },
        staleTime: 0,
        retry: 2,
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField
                    control={form.control}
                    name="contactId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-gray-600 font-bold">Contato / Cliente</FormLabel>
                            <Select
                                onValueChange={(val) => field.onChange(parseInt(val))}
                                defaultValue={field.value.toString()}
                                disabled={!!initialData}
                            >
                                <FormControl>
                                    <SelectTrigger className="rounded-xl h-11">
                                        <SelectValue placeholder="Selecione um contato" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {contacts.map((c: any) => (
                                        <SelectItem key={c.id} value={c.id.toString()}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="source"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-gray-600 font-bold">Origem</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value || ""}
                                    value={field.value || ""}
                                >
                                    <FormControl>
                                        <SelectTrigger className="rounded-xl h-11">
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
                            <FormItem>
                                <FormLabel className="text-gray-600 font-bold">Produto</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value || ""}
                                    value={field.value || ""}
                                >
                                    <FormControl>
                                        <SelectTrigger className="rounded-xl h-11">
                                            <SelectValue placeholder={productsLoading ? "Carregando..." : "Selecione"} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {productsLoading && (
                                            <div className="flex items-center justify-center py-4 text-sm text-slate-500">
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando produtos...
                                            </div>
                                        )}
                                        {!productsLoading && (!products || products.length === 0) && (
                                            <div className="py-3 px-3 text-sm text-slate-400 text-center">Nenhum produto cadastrado</div>
                                        )}
                                        {products?.map((p: any) => (
                                            <SelectItem key={p.id} value={p.name}>
                                                {p.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-gray-600 font-bold">Valor (R$)</FormLabel>
                            <FormControl>
                                <Input placeholder="0,00" className="rounded-xl h-11" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-gray-600 font-bold">Observações</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Detalhes do negócio..." className="rounded-xl min-h-[100px]" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button
                    type="submit"
                    className="w-full h-12 rounded-xl text-lg font-bold shadow-lg shadow-primary/20"
                    disabled={isPending}
                >
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {initialData ? "Salvar Alterações" : "Criar Negócio"}
                </Button>
            </form>
        </Form>
    );
}
