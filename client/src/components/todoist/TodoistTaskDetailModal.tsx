import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Folder,
  Tag,
  CheckSquare,
  Plus,
  Trash2,
  Send,
  History,
  MessageSquare,
  ExternalLink,
  ShieldCheck,
  Building,
  FileText,
  Repeat
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "wouter";

interface TodoistTaskDetailModalProps {
  taskId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TodoistTaskDetailModal({ taskId, open, onOpenChange }: TodoistTaskDetailModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newCommentText, setNewCommentText] = useState("");

  const { data: task, isLoading } = useQuery<any>({
    queryKey: ["/api/todoist/tasks", taskId],
    queryFn: async () => {
      if (!taskId) return null;
      const res = await fetch(`/api/todoist/tasks/${taskId}`);
      if (!res.ok) throw new Error("Erro ao carregar tarefa");
      return res.json();
    },
    enabled: !!taskId && open,
  });

  const { data: projects = [] } = useQuery<any[]>({
    queryKey: ["/api/todoist/projects"],
  });

  const { data: labelsList = [] } = useQuery<any[]>({
    queryKey: ["/api/todoist/labels"],
  });

  const { data: usersList = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
  });

  const updateTaskMutation = useMutation({
    mutationFn: async (updates: any) => {
      const res = await apiRequest("PATCH", `/api/todoist/tasks/${taskId}`, updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todoist/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/todoist/tasks", taskId] });
      toast({ title: "Tarefa atualizada!" });
    },
  });

  const completeTaskMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/todoist/tasks/${taskId}/complete`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todoist/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/todoist/tasks", taskId] });
    },
  });

  const addSubtaskMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await apiRequest("POST", `/api/todoist/subtasks`, {
        taskId,
        title,
        completed: false,
      });
      return res.json();
    },
    onSuccess: () => {
      setNewSubtaskTitle("");
      queryClient.invalidateQueries({ queryKey: ["/api/todoist/tasks", taskId] });
      queryClient.invalidateQueries({ queryKey: ["/api/todoist/tasks"] });
    },
  });

  const toggleSubtaskMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: number; completed: boolean }) => {
      const res = await apiRequest("PATCH", `/api/todoist/subtasks/${id}`, { completed });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todoist/tasks", taskId] });
      queryClient.invalidateQueries({ queryKey: ["/api/todoist/tasks"] });
    },
  });

  const deleteSubtaskMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/todoist/subtasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todoist/tasks", taskId] });
      queryClient.invalidateQueries({ queryKey: ["/api/todoist/tasks"] });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", `/api/todoist/tasks/${taskId}/comments`, { content });
      return res.json();
    },
    onSuccess: () => {
      setNewCommentText("");
      queryClient.invalidateQueries({ queryKey: ["/api/todoist/tasks", taskId] });
    },
  });

  if (!open || !taskId) return null;

  const subtasks = task?.subtasks || [];
  const completedSubtasksCount = subtasks.filter((s: any) => s.completed).length;
  const progressPercent = subtasks.length > 0 ? Math.round((completedSubtasksCount / subtasks.length) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-[#0f172a] text-slate-100 border-white/10 p-0 overflow-hidden rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        {isLoading || !task ? (
          <div className="p-12 text-center text-slate-400">Carregando detalhes...</div>
        ) : (
          <>
            {/* Header */}
            <div className="p-6 bg-[#162032] border-b border-white/10 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <button
                  onClick={() => completeTaskMutation.mutate()}
                  className={`mt-1 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    task.status === "done"
                      ? "bg-emerald-500 border-emerald-500 text-slate-950"
                      : "border-slate-400 hover:border-amber-400"
                  }`}
                >
                  {task.status === "done" && <CheckSquare className="h-4 w-4" />}
                </button>
                <div className="flex-1">
                  <Input
                    defaultValue={task.title}
                    onBlur={(e) => {
                      if (e.target.value !== task.title) {
                        updateTaskMutation.mutate({ title: e.target.value });
                      }
                    }}
                    className="bg-transparent text-xl font-bold border-none px-0 text-white focus-visible:ring-0 shadow-none focus-visible:bg-black/20"
                  />
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                    <span>Criado por {task.createdBy}</span>
                    <span>•</span>
                    <span>{format(new Date(task.createdAt), "dd/MM/yyyy 'às' HH:mm")}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 custom-scrollbar">
              {/* Left Column: Details, Subtasks, Comments */}
              <div className="lg:col-span-2 space-y-6">
                {/* Description */}
                <div>
                  <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2">Descrição</h4>
                  <Textarea
                    placeholder="Adicionar descrição detalhada..."
                    defaultValue={task.description || ""}
                    onBlur={(e) => {
                      if (e.target.value !== (task.description || "")) {
                        updateTaskMutation.mutate({ description: e.target.value });
                      }
                    }}
                    className="bg-slate-900/50 border-white/10 text-sm text-slate-200 min-h-[90px] focus-visible:ring-amber-500/50"
                  />
                </div>

                {/* Subtasks Checklist */}
                <div className="bg-slate-900/40 p-4 rounded-xl border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-2">
                      <CheckSquare className="h-4 w-4 text-amber-400" />
                      Checklist / Subtarefas ({completedSubtasksCount}/{subtasks.length})
                    </h4>
                    <span className="text-xs font-bold text-amber-400">{progressPercent}%</span>
                  </div>

                  {subtasks.length > 0 && (
                    <Progress value={progressPercent} className="h-1.5 bg-slate-800" />
                  )}

                  <div className="space-y-2 mt-3">
                    {subtasks.map((st: any) => (
                      <div key={st.id} className="flex items-center justify-between gap-3 p-2 rounded-lg bg-slate-800/40 hover:bg-slate-800/70 border border-white/5">
                        <div className="flex items-center gap-3 flex-1">
                          <Checkbox
                            checked={st.completed}
                            onCheckedChange={(checked) =>
                              toggleSubtaskMutation.mutate({ id: st.id, completed: !!checked })
                            }
                          />
                          <span className={`text-sm ${st.completed ? "line-through text-slate-500" : "text-slate-200"}`}>
                            {st.title}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                          onClick={() => deleteSubtaskMutation.mutate(st.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Add subtask input */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (newSubtaskTitle.trim()) {
                        addSubtaskMutation.mutate(newSubtaskTitle.trim());
                      }
                    }}
                    className="flex gap-2 pt-2"
                  >
                    <Input
                      placeholder="Adicionar item ao checklist..."
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      className="bg-slate-800/60 border-white/10 text-xs h-9"
                    />
                    <Button type="submit" size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold h-9">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </form>
                </div>

                {/* CRM Entity Linkage Display Card */}
                {(task.contact || task.lead || task.cliente || task.apolice) && (
                  <div className="bg-gradient-to-r from-amber-500/10 to-emerald-500/10 p-4 rounded-xl border border-amber-500/20 space-y-2">
                    <h4 className="text-xs uppercase font-bold text-amber-400 tracking-wider flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Vínculo com CRM
                    </h4>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {task.contact && (
                        <Link href="/admin/contacts">
                          <Button variant="outline" size="sm" className="bg-slate-900/80 border-amber-500/30 text-amber-300 text-xs gap-1.5 hover:bg-amber-500/20">
                            <User className="h-3.5 w-3.5" />
                            Contato: {task.contact.name}
                          </Button>
                        </Link>
                      )}
                      {task.lead && (
                        <Link href="/admin/leads">
                          <Button variant="outline" size="sm" className="bg-slate-900/80 border-indigo-500/30 text-indigo-300 text-xs gap-1.5 hover:bg-indigo-500/20">
                            <FileText className="h-3.5 w-3.5" />
                            Oportunidade #{task.lead.id} ({task.lead.status})
                          </Button>
                        </Link>
                      )}
                      {task.cliente && (
                        <Link href={`/admin/clientes/${task.cliente.id}`}>
                          <Button variant="outline" size="sm" className="bg-slate-900/80 border-emerald-500/30 text-emerald-300 text-xs gap-1.5 hover:bg-emerald-500/20">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Cliente Seguro: {task.cliente.nome}
                          </Button>
                        </Link>
                      )}
                      {task.apolice && (
                        <Link href="/admin/apolices">
                          <Button variant="outline" size="sm" className="bg-slate-900/80 border-cyan-500/30 text-cyan-300 text-xs gap-1.5 hover:bg-cyan-500/20">
                            <Building className="h-3.5 w-3.5" />
                            Apólice: {task.apolice.numeroApolice || `#${task.apolice.id}`}
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                )}

                {/* Comments & Discussion */}
                <div className="space-y-3">
                  <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-blue-400" />
                    Comentários & Anotações
                  </h4>

                  <div className="space-y-3 max-h-52 overflow-y-auto pr-2 custom-scrollbar">
                    {task.comments?.map((c: any) => (
                      <div key={c.id} className="p-3 bg-slate-900/50 rounded-xl border border-white/5 space-y-1">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span className="font-semibold text-amber-400">{c.user?.name || c.user?.username || "Usuário"}</span>
                          <span>{format(new Date(c.createdAt), "dd/MM 'às' HH:mm")}</span>
                        </div>
                        <p className="text-xs text-slate-200 whitespace-pre-wrap">{c.content}</p>
                      </div>
                    ))}
                    {(!task.comments || task.comments.length === 0) && (
                      <p className="text-xs text-slate-500 italic">Nenhum comentário cadastrado.</p>
                    )}
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (newCommentText.trim()) {
                        addCommentMutation.mutate(newCommentText.trim());
                      }
                    }}
                    className="flex gap-2"
                  >
                    <Input
                      placeholder="Escrever um comentário..."
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      className="bg-slate-900/60 border-white/10 text-xs"
                    />
                    <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                  </form>
                </div>

                {/* Activity History Trail */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-2">
                    <History className="h-4 w-4 text-slate-400" />
                    Histórico de Alterações
                  </h4>

                  <div className="space-y-2 text-xs text-slate-400 max-h-40 overflow-y-auto custom-scrollbar">
                    {task.activityLogs?.map((log: any) => (
                      <div key={log.id} className="flex items-start gap-2 text-[11px]">
                        <span className="text-amber-400 font-semibold">{log.user?.name || log.user?.username}:</span>
                        <span>{log.action}</span>
                        <span className="text-slate-500 font-mono">({format(new Date(log.createdAt), "HH:mm dd/MM")})</span>
                        {log.details && <span className="text-slate-400">— {log.details}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Settings & Attributes */}
              <div className="space-y-6 bg-slate-900/50 p-5 rounded-2xl border border-white/5 h-fit">
                {/* Priority */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    Prioridade
                  </label>
                  <Select
                    value={task.priority}
                    onValueChange={(val) => updateTaskMutation.mutate({ priority: val })}
                  >
                    <SelectTrigger className="bg-slate-800 border-white/10 text-xs font-bold text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/10 text-white">
                      <SelectItem value="P1" className="text-red-400 font-bold">P1 — Urgente</SelectItem>
                      <SelectItem value="P2" className="text-orange-400 font-bold">P2 — Alta</SelectItem>
                      <SelectItem value="P3" className="text-blue-400 font-bold">P3 — Normal</SelectItem>
                      <SelectItem value="P4" className="text-slate-400 font-bold">P4 — Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Project */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <Folder className="h-3.5 w-3.5" /> Projeto
                  </label>
                  <Select
                    value={task.projectId ? String(task.projectId) : "0"}
                    onValueChange={(val) =>
                      updateTaskMutation.mutate({ projectId: val === "0" ? null : parseInt(val) })
                    }
                  >
                    <SelectTrigger className="bg-slate-800 border-white/10 text-xs text-white">
                      <SelectValue placeholder="Selecione um projeto" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/10 text-white">
                      <SelectItem value="0">Inbox (Sem Projeto)</SelectItem>
                      {projects.map((p: any) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Assignee */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" /> Responsável
                  </label>
                  <Select
                    value={task.assignedTo ? String(task.assignedTo) : ""}
                    onValueChange={(val) => updateTaskMutation.mutate({ assignedTo: parseInt(val) })}
                  >
                    <SelectTrigger className="bg-slate-800 border-white/10 text-xs text-white">
                      <SelectValue placeholder="Atribuir a..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/10 text-white">
                      {usersList.map((u: any) => (
                        <SelectItem key={u.id} value={String(u.id)}>
                          {u.name || u.username} ({u.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Due Date & Time */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                      <CalendarIcon className="h-3.5 w-3.5" /> Data
                    </label>
                    <Input
                      type="date"
                      value={task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : ""}
                      onChange={(e) =>
                        updateTaskMutation.mutate({ dueDate: e.target.value ? new Date(e.target.value) : null })
                      }
                      className="bg-slate-800 border-white/10 text-xs text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> Horário
                    </label>
                    <Input
                      type="time"
                      value={task.dueTime || ""}
                      onChange={(e) => updateTaskMutation.mutate({ dueTime: e.target.value || null })}
                      className="bg-slate-800 border-white/10 text-xs text-white"
                    />
                  </div>
                </div>

                {/* Recurrence */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <Repeat className="h-3.5 w-3.5 text-emerald-400" /> Recorrência
                  </label>
                  <Select
                    value={task.isRecurring ? task.recurrenceRule || "weekly" : "none"}
                    onValueChange={(val) => {
                      if (val === "none") {
                        updateTaskMutation.mutate({ isRecurring: false, recurrenceRule: null });
                      } else {
                        updateTaskMutation.mutate({ isRecurring: true, recurrenceRule: val });
                      }
                    }}
                  >
                    <SelectTrigger className="bg-slate-800 border-white/10 text-xs text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/10 text-white">
                      <SelectItem value="none">Não se repete</SelectItem>
                      <SelectItem value="daily">Todos os dias</SelectItem>
                      <SelectItem value="weekdays">Dias úteis (Seg-Sex)</SelectItem>
                      <SelectItem value="weekly">Semanalmente</SelectItem>
                      <SelectItem value="monthly">Mensalmente</SelectItem>
                      <SelectItem value="yearly">Anualmente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
