import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Task, InsertTask, insertTaskSchema, User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
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
import {
    Loader2,
    Plus,
    Trash2,
    Calendar,
    AlertCircle,
    CheckCircle2,
    Clock,
    Filter
} from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const COLUMNS = [
    { id: "todo", label: "A Fazer", icon: Clock, color: "text-gray-500", bg: "bg-gray-100" },
    { id: "in_progress", label: "Em Andamento", icon: AlertCircle, color: "text-blue-500", bg: "bg-blue-100" },
    { id: "done", label: "Concluído", icon: CheckCircle2, color: "text-green-500", bg: "bg-green-100" },
];

export default function TasksPage() {
    const { toast } = useToast();
    const { user: currentUser } = useAuth();
    const [open, setOpen] = useState(false);
    const [filterUser, setFilterUser] = useState<string>("all");

    const { data: tasks, isLoading } = useQuery<Task[]>({
        queryKey: ["/api/tasks", filterUser !== "all" ? { assignedTo: filterUser } : undefined],
        queryFn: async ({ queryKey }) => {
            const [_url, params] = queryKey as any;
            const url = params ? `/api/tasks?assignedTo=${params.assignedTo}` : "/api/tasks";
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

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-display font-bold text-gray-900">Tarefas Diárias</h2>
                    <p className="text-muted-foreground mt-1">Gerencie as atividades da equipe e acompanhe o progresso.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white rounded-lg border px-3 py-1 text-sm shadow-sm">
                        <Filter className="h-4 w-4 text-gray-400" />
                        <select
                            className="bg-transparent border-none focus:outline-none text-gray-600 font-medium"
                            value={filterUser}
                            onChange={(e) => setFilterUser(e.target.value)}
                        >
                            <option value="all">Todos os Funcionários</option>
                            <option value={currentUser?.id.toString()}>Minhas Tarefas</option>
                            {users?.filter(u => u.id !== currentUser?.id).map(user => (
                                <option key={user.id} value={user.id.toString()}>{user.name}</option>
                            ))}
                        </select>
                    </div>

                    <CreateTaskDialog
                        open={open}
                        setOpen={setOpen}
                        users={users || []}
                        currentUser={currentUser}
                        createMutation={createMutation}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {COLUMNS.map((column) => (
                    <div key={column.id} className="flex flex-col h-full bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200/50 p-4">
                        <div className="flex items-center justify-between mb-4 px-2">
                            <div className="flex items-center gap-2">
                                <column.icon className={`h-5 w-5 ${column.id === 'todo' ? 'text-gray-400' : column.id === 'in_progress' ? 'text-blue-500' : 'text-green-500'}`} />
                                <h3 className="font-display font-bold text-gray-700">{column.label}</h3>
                            </div>
                            <Badge variant="outline" className="bg-white text-gray-500 border-gray-200">
                                {tasks?.filter(t => t.status === column.id).length || 0}
                            </Badge>
                        </div>

                        <div className="flex-1 space-y-3">
                            {tasks?.filter(t => t.status === column.id).map(task => (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    users={users || []}
                                    updateStatusMutation={updateStatusMutation}
                                    deleteMutation={deleteMutation}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function TaskCard({ task, users, updateStatusMutation, deleteMutation }: any) {
    const assignedUser = users.find((u: any) => u.id === task.assignedTo);

    return (
        <div className="group bg-white p-4 rounded-xl border border-gray-200 shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/20 relative overflow-hidden">
            {/* Priority Indicator */}
            <div className={`absolute top-0 left-0 w-1 h-full ${task.priority === 'high' ? 'bg-red-500' :
                    task.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-400'
                }`} />

            <div className="flex justify-between items-start gap-2 mb-2">
                <h4 className="font-semibold text-gray-900 leading-tight">{task.title}</h4>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-gray-400 hover:text-red-500"
                        onClick={() => { if (confirm("Remover tarefa?")) deleteMutation.mutate(task.id) }}
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            <p className="text-xs text-gray-500 mb-4 line-clamp-2">{task.description}</p>

            <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
                <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                        {assignedUser?.username.charAt(0).toUpperCase() || "?"}
                    </div>
                    <span className="text-[10px] font-medium text-gray-400">{assignedUser?.name || "Sem atribuição"}</span>
                </div>

                <div className="flex gap-1">
                    {task.status !== 'todo' && (
                        <button
                            onClick={() => updateStatusMutation.mutate({ id: task.id, status: task.status === 'done' ? 'in_progress' : 'todo' })}
                            className="text-[10px] bg-gray-100 px-2 py-0.5 rounded hover:bg-gray-200 font-medium"
                        >
                            Anterior
                        </button>
                    )}
                    {task.status !== 'done' && (
                        <button
                            onClick={() => updateStatusMutation.mutate({ id: task.id, status: task.status === 'todo' ? 'in_progress' : 'done' })}
                            className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded hover:bg-primary/20 font-bold"
                        >
                            Próximo
                        </button>
                    )}
                </div>
            </div>

            {task.dueDate && (
                <div className="mt-2 flex items-center gap-1 text-[10px] text-gray-400">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(task.dueDate), "dd/MM")}
                </div>
            )}
        </div>
    );
}

function CreateTaskDialog({ open, setOpen, users, currentUser, createMutation }: any) {
    const form = useForm<InsertTask>({
        resolver: zodResolver(insertTaskSchema),
        defaultValues: {
            title: "",
            description: "",
            status: "todo",
            priority: "medium",
            assignedTo: currentUser?.id,
        },
    });

    const onSubmit = (data: InsertTask) => {
        createMutation.mutate(data);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 h-10 px-6">
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Tarefa
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] rounded-2xl border-none shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-display font-bold">Adicionar Atividade</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-gray-600 font-bold">Título da Tarefa</FormLabel>
                                    <FormControl>
                                        <Input placeholder="O que precisa ser feito?" className="rounded-xl" {...field} />
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
                                    <FormLabel className="text-gray-600 font-bold">Descrição</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Detalhes da atividade..." className="rounded-xl min-h-[100px]" {...field} value={field.value || ""} />
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
                                        <FormLabel className="text-gray-600 font-bold">Responsável</FormLabel>
                                        <Select
                                            onValueChange={(val) => field.onChange(parseInt(val))}
                                            defaultValue={field.value?.toString()}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="rounded-xl">
                                                    <SelectValue placeholder="Selecione" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
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
                                        <FormLabel className="text-gray-600 font-bold">Prioridade</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="rounded-xl">
                                                    <SelectValue placeholder="Selecione" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="low">Baixa</SelectItem>
                                                <SelectItem value="medium">Média</SelectItem>
                                                <SelectItem value="high">Alta</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 rounded-xl text-lg font-bold"
                            disabled={createMutation.isPending}
                        >
                            {createMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Criar Tarefa
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
