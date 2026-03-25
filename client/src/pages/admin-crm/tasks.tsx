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
    Edit2
} from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const COLUMNS = [
    { id: "pendencia", label: "Pendência", icon: Clock, color: "text-slate-400", bg: "bg-slate-100/50", accent: "border-slate-300" },
    { id: "revisao", icon: MoreVertical, label: "Revisão", color: "text-blue-500", bg: "bg-blue-50/50", accent: "border-blue-300" },
    { id: "prospect", icon: Plus, label: "Prospect", color: "text-indigo-500", bg: "bg-indigo-50/50", accent: "border-indigo-300" },
    { id: "cotacao_enviada", icon: Filter, label: "Cotação enviada", color: "text-amber-500", bg: "bg-amber-50/50", accent: "border-amber-300" },
    { id: "implantacao", icon: AlertCircle, label: "Implantação", color: "text-orange-500", bg: "bg-orange-50/50", accent: "border-orange-300" },
    { id: "fechado", icon: CheckCircle2, label: "Fechado", color: "text-emerald-500", bg: "bg-emerald-50/50", accent: "border-emerald-300" },
    { id: "venda_perdida", icon: Trash2, label: "Venda Perdida", color: "text-rose-500", bg: "bg-rose-50/50", accent: "border-rose-300" },
    { id: "venda_cancelada", icon: CheckCircle2, label: "Venda Cancelada", color: "text-slate-500", bg: "bg-slate-50/50", accent: "border-slate-300" },
];

export default function TasksPage() {
    const { toast } = useToast();
    const { user: currentUser } = useAuth();
    const [open, setOpen] = useState(false);
    const [quickAddStatus, setQuickAddStatus] = useState<string | null>(null);
    const [filterUser, setFilterUser] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [editingTaskId, setEditingTaskId] = useState<number | null>(null);

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

    const onDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
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
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div>
                    <h2 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Quadro de Planejamento</h2>
                    <p className="text-slate-500 text-sm mt-1 font-medium">Gerencie o fluxo de trabalho da sua corretora em tempo real.</p>
                </div>

                <div className="flex items-center gap-3">
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
                                    {users?.filter(u => u.id !== currentUser?.id).map(user => (
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
                                    {COLUMNS.map(col => (
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

            <div className="flex-1 overflow-x-auto pb-6">
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex gap-6 h-full min-w-[900px]">
                        {COLUMNS.map((column) => (
                            <div key={column.id} className="flex flex-col w-[320px] bg-slate-100/40 rounded-2xl border border-slate-200/60 p-3 h-full">
                                <div className="flex items-center justify-between mb-4 px-2">
                                    <div className="flex items-center gap-2.5">
                                        <div className={cn("p-1.5 rounded-lg bg-white shadow-sm border border-slate-100", column.color)}>
                                            <column.icon className="h-4 w-4" />
                                        </div>
                                        <h3 className="font-display font-bold text-slate-700 tracking-tight text-sm uppercase">{column.label}</h3>
                                    </div>
                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-200/50 text-slate-500">
                                        {tasks?.filter(t => t.status === column.id).length || 0}
                                    </span>
                                </div>

                                <Droppable droppableId={column.id}>
                                    {(provided, snapshot) => (
                                        <div
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            className={cn(
                                                "flex-1 space-y-3 p-1 transition-colors duration-200 rounded-xl overflow-y-auto max-h-[calc(100vh-280px)]",
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
                        ))}
                    </div>
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

    return (
        <div className={cn(
            "group bg-white p-4 rounded-xl border border-slate-200 shadow-sm transition-all duration-200 relative select-none",
            isDragging ? "shadow-2xl ring-2 ring-primary/20 rotate-[2deg] z-50" : "hover:border-slate-300 hover:shadow-md"
        )}>
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

function TaskDialog({ open, setOpen, users, currentUser, onSubmit, isPending, defaultStatus, initialData }: any) {
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
                                                {users.map((u: any) => (
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

                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
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
                                                {COLUMNS.map(col => (
                                                    <SelectItem key={col.id} value={col.id}>{col.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

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
