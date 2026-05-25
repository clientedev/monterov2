import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Task, InsertTask, insertTaskSchema, User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
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
import {
    Loader2,
    Plus,
    Trash2,
    Calendar,
    AlertCircle,
    CheckCircle2,
    Clock,
    Filter,
    GripVertical,
    MoreVertical,
    Edit2,
    Maximize2,
    Minimize2
} from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { useSiteSettings } from "@/hooks/use-site-settings";
import * as LucideIcons from "lucide-react";

const DEFAULT_TASK_COLUMNS = [
    { id: "pendencia", label: "Pendência", icon: "Clock", color: "text-slate-400", bg: "bg-slate-100/50", accent: "border-slate-300" },
    { id: "revisao", label: "Revisão", icon: "MoreVertical", color: "text-blue-500", bg: "bg-blue-50/50", accent: "border-blue-300" },
    { id: "prospect", label: "Prospect", icon: "Plus", color: "text-indigo-500", bg: "bg-indigo-50/50", accent: "border-indigo-300" },
    { id: "cotacao_enviada", label: "Cotação enviada", icon: "Filter", color: "text-amber-500", bg: "bg-amber-50/50", accent: "border-amber-300" },
    { id: "implantacao", label: "Implantação", icon: "AlertCircle", color: "text-orange-500", bg: "bg-orange-50/50", accent: "border-orange-300" },
    { id: "fechado", label: "Fechado", icon: "CheckCircle2", color: "text-emerald-500", bg: "bg-emerald-50/50", accent: "border-emerald-300" },
    { id: "venda_perdida", label: "Venda Perdida", icon: "Trash2", color: "text-rose-500", bg: "bg-rose-50/50", accent: "border-rose-300" },
    { id: "venda_cancelada", label: "Venda Cancelada", icon: "CheckCircle2", color: "text-slate-500", bg: "bg-slate-50/50", accent: "border-slate-300" },
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

const CARD_COLORS: Record<string, { bg: string, border: string, label: string }> = {
    default: { bg: "bg-white", border: "border-slate-200", label: "Branco (Padrão)" },
    blue: { bg: "bg-blue-50/50", border: "border-blue-200", label: "Azul" },
    emerald: { bg: "bg-emerald-50/50", border: "border-emerald-200", label: "Verde" },
    amber: { bg: "bg-amber-50/50", border: "border-amber-200", label: "Amarelo" },
    rose: { bg: "bg-rose-50/50", border: "border-rose-200", label: "Vermelho" },
    purple: { bg: "bg-purple-50/50", border: "border-purple-200", label: "Roxo" }
};

function getIcon(name: string) {
    return (LucideIcons as any)[name] || LucideIcons.HelpCircle;
}

export default function TasksPage() {
    const { toast } = useToast();
    const { user: currentUser } = useAuth();
    const { settings, updateSettings } = useSiteSettings();
    const [open, setOpen] = useState(false);
    const [quickAddStatus, setQuickAddStatus] = useState<string | null>(null);
    const [filterUser, setFilterUser] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    // Dynamic Columns State
    const [columnDialogOpen, setColumnDialogOpen] = useState(false);
    const [editingColumn, setEditingColumn] = useState<any>(null);
    const [newColLabel, setNewColLabel] = useState("");
    const [newColColor, setNewColColor] = useState("blue");

    const columns = useMemo(() => {
        if (settings?.taskColumns) {
            try {
                return JSON.parse(settings.taskColumns);
            } catch (e) {
                return DEFAULT_TASK_COLUMNS;
            }
        }
        return DEFAULT_TASK_COLUMNS;
    }, [settings?.taskColumns]);

    const { data: tasks, isLoading } = useQuery<Task[]>({
        queryKey: ["/api/tasks", { 
            assignedTo: filterUser !== "all" ? filterUser : undefined, 
            status: filterStatus !== "all" ? filterStatus : undefined 
        }],
        queryFn: async ({ queryKey }) => {
            const [_url, params] = queryKey as any;
            let url = "/api/tasks?";
            if (params?.assignedTo) url += `assignedTo=${params.assignedTo}&`;
            if (params?.status) url += `status=${params.status}&`;
            const res = await fetch(url);
            if (!res.ok) throw new Error("Erro ao carregar tarefas");
            return res.json();
        }
    });

    const { data: users } = useQuery<User[]>({
        queryKey: ["/api/users"],
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: number; status: string }) => {
            const res = await apiRequest("PATCH", `/api/tasks/${id}/status`, { status });
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data: InsertTask) => {
            const res = await apiRequest("POST", "/api/tasks", data);
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
            toast({ title: "Tarefa criada com sucesso" });
            setOpen(false);
            setQuickAddStatus(null);
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (data: Partial<InsertTask>) => {
            const res = await apiRequest("PATCH", `/api/tasks/${editingTaskId}`, data);
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
            toast({ title: "Tarefa atualizada" });
            setOpen(false);
            setEditingTaskId(null);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/tasks/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
            toast({ title: "Tarefa removida" });
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
                icon: "Clock",
                color: colorConfig.color,
                bg: colorConfig.bg,
                accent: colorConfig.accent
            });
            toast({ title: "Coluna criada!" });
        }

        await updateSettings({ taskColumns: JSON.stringify(updatedColumns) });
        setColumnDialogOpen(false);
        setEditingColumn(null);
        setNewColLabel("");
    };

    const handleDeleteColumn = async (columnId: string) => {
        if (columns.length <= 1) {
            toast({ title: "Você precisa manter pelo menos uma coluna!", variant: "destructive" });
            return;
        }
        if (!confirm("Tem certeza que deseja excluir esta coluna? Todas as tarefas nela serão movidas para a primeira coluna.")) {
            return;
        }

        const columnTasks = tasks?.filter(t => t.status === columnId) || [];
        const firstColId = columns.find((c: any) => c.id !== columnId)?.id || "pendencia";

        for (const t of columnTasks) {
            await apiRequest("PATCH", `/api/tasks/${t.id}/status`, { status: firstColId });
        }

        const updatedColumns = columns.filter((c: any) => c.id !== columnId);
        await updateSettings({ taskColumns: JSON.stringify(updatedColumns) });
        queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
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
            updateSettings({ taskColumns: JSON.stringify(reordered) });
            return;
        }

        const taskId = parseInt(draggableId);
        const newStatus = destination.droppableId;

        updateStatusMutation.mutate({ id: taskId, status: newStatus });
    };

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className={`h-full flex flex-col ${isExpanded ? "fixed inset-0 z-50 bg-[#f1f5f9] p-8 overflow-hidden transition-all duration-300" : "space-y-6"}`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div>
                    <h2 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Quadro de Planejamento</h2>
                    <p className="text-slate-500 text-sm mt-1 font-medium">Gerencie o fluxo de trabalho da sua corretora em tempo real.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Button 
                        variant="outline" 
                        onClick={() => setIsExpanded(!isExpanded)} 
                        className="bg-white hover:bg-slate-50 border-slate-200 text-slate-700 h-10 px-4 rounded-xl shadow-sm"
                    >
                        {isExpanded ? <Minimize2 className="mr-2 h-4 w-4" /> : <Maximize2 className="mr-2 h-4 w-4" />}
                        {isExpanded ? "Reduzir Tela" : "Expandir Quadro"}
                    </Button>

                    {currentUser?.role === "admin" && (
                        <>
                            <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 px-4 py-2 text-sm shadow-sm">
                                <Filter className="h-4 w-4 text-slate-400" />
                                <select
                                    className="bg-transparent border-none focus:outline-none text-slate-700 font-semibold appearance-none pr-4"
                                    value={filterUser}
                                    onChange={(e) => setFilterUser(e.target.value)}
                                >
                                    <option value="all">Equipe Completa</option>
                                    <option value={currentUser?.id.toString()}>Minhas Atividades</option>
                                    {users?.filter(u => u.id !== currentUser?.id && (u.role === "admin" || u.role === "employee")).map(user => (
                                        <option key={user.id} value={user.id.toString()}>{user.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 px-4 py-2 text-sm shadow-sm">
                                <Filter className="h-4 w-4 text-slate-400" />
                                <select
                                    className="bg-transparent border-none focus:outline-none text-slate-700 font-semibold appearance-none pr-4"
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                >
                                    <option value="all">Todos Status</option>
                                    {columns.map((col: any) => (
                                        <option key={col.id} value={col.id}>{col.label}</option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}

                    <TaskDialog
                        open={open || quickAddStatus !== null || editingTaskId !== null}
                        setOpen={(val: boolean) => {
                            setOpen(val);
                            if (!val) {
                                setQuickAddStatus(null);
                                setEditingTaskId(null);
                            }
                        }}
                        columns={columns}
                        users={users || []}
                        currentUser={currentUser}
                        onSubmit={(data: InsertTask) => {
                            if (editingTaskId) {
                                updateMutation.mutate(data);
                            } else {
                                createMutation.mutate(data);
                            }
                        }}
                        isPending={createMutation.isPending || updateMutation.isPending}
                        defaultStatus={quickAddStatus || "pendencia"}
                        initialData={editingTaskId ? tasks?.find(t => t.id === editingTaskId) : undefined}
                    />
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

            <div className="flex-1 overflow-x-auto pb-6">
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
                                                    "flex flex-col w-[320px] bg-slate-100/40 rounded-2xl border border-slate-200/60 p-3 h-full shrink-0 relative",
                                                    columnSnapshot.isDragging ? "shadow-2xl ring-2 ring-primary/10 rotate-[1deg]" : ""
                                                )}
                                            >
                                                {/* Column Header */}
                                                <div 
                                                    {...columnProvided.dragHandleProps}
                                                    className="flex items-center justify-between mb-4 px-2 cursor-grab active:cursor-grabbing"
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <div className={cn("p-1.5 rounded-lg bg-white shadow-sm border border-slate-100", column.color)}>
                                                            {(() => {
                                                                const Icon = getIcon(column.icon);
                                                                return <Icon className="h-4 w-4" />;
                                                            })()}
                                                        </div>
                                                        <h3 className="font-display font-bold text-slate-700 tracking-tight text-sm uppercase">{column.label}</h3>
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
                                                                `flex-1 space-y-3 p-1 transition-colors duration-200 rounded-xl overflow-y-auto ${isExpanded ? "max-h-[calc(100vh-160px)]" : "max-h-[calc(100vh-280px)]"}`,
                                                                snapshot.isDraggingOver ? "bg-slate-200/30" : ""
                                                            )}
                                                        >
                                                            {tasks?.filter(t => t.status === column.id).map((task, index) => (
                                                                <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
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
                                                                            <TaskCard
                                                                                task={task}
                                                                                users={users || []}
                                                                                deleteMutation={deleteMutation}
                                                                                onEdit={() => setEditingTaskId(task.id)}
                                                                                isDragging={snapshot.isDragging}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </Draggable>
                                                            ))}
                                                            {provided.placeholder}
                                                        </div>
                                                    )}
                                                </Droppable>

                                                <button
                                                    onClick={() => setQuickAddStatus(column.id)}
                                                    className="mt-3 w-full py-2.5 rounded-xl border border-dashed border-slate-300 hover:border-slate-400 hover:bg-white text-slate-400 hover:text-slate-600 transition-all text-xs font-bold flex items-center justify-center gap-2 group"
                                                >
                                                    <Plus className="h-3.5 w-3.5 transition-transform group-hover:scale-125" />
                                                    Adicionar Cartão
                                                </button>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}

                                <div className="w-[320px] shrink-0">
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
        </div>
    );
}

function TaskCard({ task, users, deleteMutation, onEdit, isDragging }: any) {
    const assignedUser = users.find((u: any) => u.id === task.assignedTo);
    const priorityColors: Record<string, { bg: string, text: string, dot: string, label: string }> = {
        high: { bg: "bg-rose-50", text: "text-rose-600", dot: "bg-rose-500", label: "Prioridade Ata" },
        medium: { bg: "bg-amber-50", text: "text-amber-600", dot: "bg-amber-500", label: "Média" },
        low: { bg: "bg-sky-50", text: "text-sky-600", dot: "bg-sky-500", label: "Baixa" }
    };
    const priority = priorityColors[task.priority] || priorityColors.medium;
    const cardColor = CARD_COLORS[task.color || "default"] || CARD_COLORS.default;

    return (
        <div className={cn(
            "group p-4 rounded-xl border shadow-sm transition-all duration-200 relative select-none",
            cardColor.bg, cardColor.border,
            isDragging ? "shadow-2xl ring-2 ring-primary/20 rotate-[2deg] z-50" : "hover:shadow-md hover:-translate-y-0.5"
        )}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#0F6570] to-[#1A3A4F] opacity-0 group-hover:opacity-100 transition-opacity rounded-t-xl" />
            <div className="flex justify-between items-start gap-2 mb-3">
                <div className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-full", priority.bg)}>
                    <div className={cn("w-1.5 h-1.5 rounded-full", priority.dot)} />
                    <span className={cn("text-[9px] font-black uppercase tracking-tight", priority.text)}>
                        {priority.label}
                    </span>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit();
                        }}
                    >
                        <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Deseja arquivar esta tarefa?")) deleteMutation.mutate(task.id);
                        }}
                    >
                        <Trash2 className="h-3 w-3" />
                    </Button>
                </div>
            </div>

            <h4 className="font-bold text-slate-800 leading-tight mb-2 text-[13px] tracking-tight">
                {task.title}
            </h4>

            {task.description && (
                <p className="text-[11px] text-slate-500 mb-4 line-clamp-3 leading-relaxed font-medium">
                    {task.description}
                </p>
            )}

            <div className="flex items-center justify-between mt-4">
                <div className="flex items-center -space-x-1">
                    <div className="h-6 w-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[9px] font-black text-slate-500 shadow-sm" title={assignedUser?.name}>
                        {assignedUser?.username.charAt(0).toUpperCase() || "?"}
                    </div>
                </div>

                {task.dueDate && (
                    <div className={cn(
                        "flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-lg",
                        new Date(task.dueDate) < new Date() ? "text-rose-500 bg-rose-50" : "text-slate-400 bg-slate-50"
                    )}>
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(task.dueDate), "dd/MM")}</span>
                    </div>
                )}
            </div>

            <div className="absolute right-2 top-2 h-4 w-4 text-slate-300 opacity-20">
                <GripVertical className="h-full w-full" />
            </div>
        </div>
    );
}

function TaskDialog({ open, setOpen, columns, users, currentUser, onSubmit, isPending, defaultStatus, initialData }: any) {
    const clientTaskSchema = insertTaskSchema.omit({ createdBy: true });

    const form = useForm<any>({
        resolver: zodResolver(clientTaskSchema),
        defaultValues: initialData ? {
            ...initialData,
            dueDate: initialData.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : "",
        } : {
            title: "",
            description: "",
            status: defaultStatus || "pendencia",
            priority: "medium",
            color: "default",
            assignedTo: currentUser?.id,
        },
    });

    useEffect(() => {
        if (open) {
            if (initialData) {
                form.reset({
                    ...initialData,
                    dueDate: initialData.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : "",
                });
            } else {
                form.reset({
                    title: "",
                    description: "",
                    status: defaultStatus || "pendencia",
                    priority: "medium",
                    color: "default",
                    assignedTo: currentUser?.id,
                });
            }
        }
    }, [open, initialData, defaultStatus, currentUser, form.reset]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {!initialData && (
                <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 h-11 px-6 font-bold rounded-xl transition-all hover:scale-[1.02]">
                        <Plus className="mr-2 h-5 w-5" />
                        Nova Atividade
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[500px] rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
                <DialogHeader className="p-8 bg-slate-50 border-b border-slate-100">
                    <DialogTitle className="text-2xl font-display font-bold text-slate-900">
                        {initialData ? "Editar Tarefa" : "Nova Tarefa Profissional"}
                    </DialogTitle>
                    <p className="text-slate-500 text-sm mt-1">
                        {initialData ? "Atualize os detalhes da atividade." : "Defina os detalhes da atividade para a equipe."}
                    </p>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="p-8 space-y-5 bg-white">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-700 font-bold text-sm">Título Principal</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Renovar apólice Porto Seguro" className="rounded-xl border-slate-200 h-11 focus:ring-primary/20" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-700 font-bold text-sm">Detalhamento (Opcional)</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Descreva os passos necessários..." className="rounded-xl border-slate-200 min-h-[120px] focus:ring-primary/20" {...field} value={field.value || ""} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="assignedTo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-700 font-bold text-sm">Responsável</FormLabel>
                                        <Select
                                            onValueChange={(val) => field.onChange(parseInt(val))}
                                            defaultValue={field.value?.toString()}
                                            disabled={currentUser?.role !== "admin"}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="rounded-xl border-slate-200 h-11 bg-slate-50/50">
                                                    <SelectValue placeholder="Selecione" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                                {users.filter((u: any) => u.role === "admin" || u.role === "employee").map((u: any) => (
                                                    <SelectItem key={u.id} value={u.id.toString()}>
                                                        {u.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="priority"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-700 font-bold text-sm">Nível de Urgência</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="rounded-xl border-slate-200 h-11 bg-slate-50/50">
                                                    <SelectValue placeholder="Selecione" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                                <SelectItem value="low" className="text-sky-600 font-medium text-sm">Baixa (Rotina)</SelectItem>
                                                <SelectItem value="medium" className="text-amber-600 font-medium text-sm">Média (Acompanhar)</SelectItem>
                                                <SelectItem value="high" className="text-rose-600 font-bold text-sm">Alta (Urgente!)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-700 font-bold text-sm">Status Atual</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="rounded-xl border-slate-200 h-11 bg-slate-50/50">
                                                    <SelectValue placeholder="Selecione" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                                {columns?.map((col: any) => (
                                                    <SelectItem key={col.id} value={col.id}>{col.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="color"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-700 font-bold text-sm">Cor do Cartão</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="rounded-xl border-slate-200 h-11 bg-slate-50/50">
                                                    <SelectValue placeholder="Selecione a cor" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                                {Object.entries(CARD_COLORS).map(([key, config]) => (
                                                    <SelectItem key={key} value={key}>
                                                        <div className="flex items-center gap-2">
                                                            <div className={cn("w-3 h-3 rounded-full border", config.bg, config.border)} />
                                                            {config.label}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                            <Button
                                type="submit"
                                className="w-full h-14 rounded-2xl text-lg font-black shadow-lg shadow-primary/20 mt-4 transition-all active:scale-95"
                                disabled={isPending}
                            >
                                {isPending ? (
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                ) : (
                                    initialData ? "Salvar Alterações" : "Confirmar e Agendar"
                                )}
                            </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
