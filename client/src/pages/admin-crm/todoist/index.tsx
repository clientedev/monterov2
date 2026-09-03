import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckSquare,
  Sun,
  Inbox as InboxIcon,
  Calendar as CalendarIcon,
  Folder,
  Tag,
  Filter,
  Kanban,
  CheckCircle2,
  BarChart2,
  Zap,
  Plus,
  Search,
  Clock,
  AlertTriangle,
  Flame,
  User,
  ShieldCheck,
  Building,
  FileText,
  Trash2,
  Settings,
  Sparkles,
  ChevronRight,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { TodoistTaskItem } from "@/components/todoist/TodoistTaskItem";
import { TodoistTaskDetailModal } from "@/components/todoist/TodoistTaskDetailModal";
import { TodoistQuickAddModal } from "@/components/todoist/TodoistQuickAddModal";

export default function TodoistModulePage() {
  const { toast } = useToast();
  const { user } = useAuth();

  // Navigation tab view state
  const [activeView, setActiveView] = useState<string>("today");

  // Selection & Modal states
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>("all");
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>("all");
  const [selectedLabelFilter, setSelectedLabelFilter] = useState<number | null>(null);

  // Project creation modal
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectColor, setNewProjectColor] = useState("#0F6570");

  // Label creation modal
  const [newLabelOpen, setNewLabelOpen] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#3b82f6");

  // Automation creation modal
  const [newAutomationOpen, setNewAutomationOpen] = useState(false);
  const [autoName, setAutoName] = useState("");
  const [autoEventType, setAutoEventType] = useState("new_lead");
  const [autoActionTitle, setAutoActionTitle] = useState("");
  const [autoPriority, setAutoPriority] = useState("P2");

  // Fetching data
  const { data: projects = [] } = useQuery<any[]>({ queryKey: ["/api/todoist/projects"] });
  const { data: labels = [] } = useQuery<any[]>({ queryKey: ["/api/todoist/labels"] });
  const { data: automations = [] } = useQuery<any[]>({ queryKey: ["/api/todoist/automations"] });
  const { data: dashboardStats } = useQuery<any>({ queryKey: ["/api/todoist/dashboard"] });

  // Query parameter building
  const queryParams = new URLSearchParams();
  if (activeView === "today") queryParams.append("view", "today");
  if (activeView === "overdue") queryParams.append("view", "overdue");
  if (activeView === "upcoming") queryParams.append("view", "upcoming");
  if (activeView === "completed") queryParams.append("view", "completed");
  if (activeView === "inbox") queryParams.append("projectId", "0");
  if (activeView.startsWith("project_")) {
    const pId = activeView.replace("project_", "");
    queryParams.append("projectId", pId);
  }
  if (selectedPriorityFilter !== "all") queryParams.append("priority", selectedPriorityFilter);
  if (selectedLabelFilter) queryParams.append("labelId", String(selectedLabelFilter));
  if (searchQuery.trim()) queryParams.append("search", searchQuery.trim());

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<any[]>({
    queryKey: ["/api/todoist/tasks", activeView, selectedPriorityFilter, selectedLabelFilter, searchQuery],
    queryFn: async () => {
      const res = await fetch(`/api/todoist/tasks?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Erro ao carregar tarefas");
      return res.json();
    },
  });

  // Complete task mutation
  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const res = await apiRequest("POST", `/api/todoist/tasks/${taskId}/complete`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todoist/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/todoist/dashboard"] });
    },
  });

  // Update Kanban Column Mutation
  const updateKanbanMutation = useMutation({
    mutationFn: async ({ taskId, kanbanColumn, status }: { taskId: number; kanbanColumn: string; status?: string }) => {
      const payload: any = { kanbanColumn };
      if (status) payload.status = status;
      const res = await apiRequest("PATCH", `/api/todoist/tasks/${taskId}`, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todoist/tasks"] });
    },
  });

  // Project Creation Mutation
  const createProjectMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/todoist/projects", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todoist/projects"] });
      setNewProjectOpen(false);
      setNewProjectName("");
      toast({ title: "Projeto criado com sucesso!" });
    },
  });

  // Label Creation Mutation
  const createLabelMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/todoist/labels", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todoist/labels"] });
      setNewLabelOpen(false);
      setNewLabelName("");
      toast({ title: "Etiqueta criada com sucesso!" });
    },
  });

  // Automation Creation Mutation
  const createAutomationMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/todoist/automations", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todoist/automations"] });
      setNewAutomationOpen(false);
      setAutoName("");
      setAutoActionTitle("");
      toast({ title: "Regra de automação criada com sucesso!" });
    },
  });

  // Drag and Drop Handler for Kanban
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const taskId = parseInt(draggableId);
    const newCol = destination.droppableId;
    let newStatus = undefined;
    if (newCol === "concluido") newStatus = "done";
    else if (newCol === "em_andamento") newStatus = "in_progress";
    else if (newCol === "a_fazer" || newCol === "backlog") newStatus = "todo";

    updateKanbanMutation.mutate({ taskId, kanbanColumn: newCol, status: newStatus });
  };

  // Grouping tasks for Today view (Atrasadas, Hoje, Próximas)
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const overdueTasks = tasks.filter((t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "done");
  const todayTasks = tasks.filter((t) => t.dueDate && new Date(t.dueDate) >= now && new Date(t.dueDate) <= endOfDay && t.status !== "done");
  const upcomingTasks = tasks.filter((t) => (!t.dueDate || new Date(t.dueDate) > endOfDay) && t.status !== "done");

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#0F6570] via-[#164e57] to-[#0f172a] p-6 rounded-2xl border border-white/10 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <CheckSquare className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              TODOIST <span className="text-xs px-2 py-0.5 bg-amber-500 text-slate-950 rounded font-black">CRM INTEGRADO</span>
            </h1>
            <p className="text-xs text-slate-300">
              Gerenciador completo de tarefas e produtividade comercial sincronizado ao CRM.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setQuickAddOpen(true)}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 gap-2 active:scale-95 transition-all"
          >
            <Plus className="h-5 w-5" /> + Tarefa Rápida
          </Button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar Navigation (Menu Items) */}
        <div className="space-y-4 bg-[#0f172a] p-4 rounded-2xl border border-white/10 h-fit shadow-xl">
          <p className="text-[11px] uppercase font-bold text-amber-400 px-3 tracking-widest">Navegação Principal</p>

          <nav className="space-y-1">
            <Button
              variant="ghost"
              onClick={() => setActiveView("today")}
              className={`w-full justify-start gap-3 text-xs font-semibold rounded-xl px-3 py-2.5 ${
                activeView === "today" ? "bg-amber-500 text-slate-950 shadow-md font-bold" : "text-slate-300 hover:bg-white/5"
              }`}
            >
              <Sun className="h-4 w-4 text-amber-400" /> Hoje
              {dashboardStats?.myTasks?.todayCount > 0 && (
                <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                  {dashboardStats.myTasks.todayCount}
                </span>
              )}
            </Button>

            <Button
              variant="ghost"
              onClick={() => setActiveView("inbox")}
              className={`w-full justify-start gap-3 text-xs font-semibold rounded-xl px-3 py-2.5 ${
                activeView === "inbox" ? "bg-amber-500 text-slate-950 shadow-md font-bold" : "text-slate-300 hover:bg-white/5"
              }`}
            >
              <InboxIcon className="h-4 w-4 text-blue-400" /> Inbox (Não organizadas)
            </Button>

            <Button
              variant="ghost"
              onClick={() => setActiveView("upcoming")}
              className={`w-full justify-start gap-3 text-xs font-semibold rounded-xl px-3 py-2.5 ${
                activeView === "upcoming" ? "bg-amber-500 text-slate-950 shadow-md font-bold" : "text-slate-300 hover:bg-white/5"
              }`}
            >
              <CalendarIcon className="h-4 w-4 text-emerald-400" /> Próximas
            </Button>

            <Button
              variant="ghost"
              onClick={() => setActiveView("kanban")}
              className={`w-full justify-start gap-3 text-xs font-semibold rounded-xl px-3 py-2.5 ${
                activeView === "kanban" ? "bg-amber-500 text-slate-950 shadow-md font-bold" : "text-slate-300 hover:bg-white/5"
              }`}
            >
              <Kanban className="h-4 w-4 text-indigo-400" /> Quadro Kanban
            </Button>

            <Button
              variant="ghost"
              onClick={() => setActiveView("completed")}
              className={`w-full justify-start gap-3 text-xs font-semibold rounded-xl px-3 py-2.5 ${
                activeView === "completed" ? "bg-amber-500 text-slate-950 shadow-md font-bold" : "text-slate-300 hover:bg-white/5"
              }`}
            >
              <CheckCircle2 className="h-4 w-4 text-teal-400" /> Concluídas
            </Button>

            <Button
              variant="ghost"
              onClick={() => setActiveView("dashboard")}
              className={`w-full justify-start gap-3 text-xs font-semibold rounded-xl px-3 py-2.5 ${
                activeView === "dashboard" ? "bg-amber-500 text-slate-950 shadow-md font-bold" : "text-slate-300 hover:bg-white/5"
              }`}
            >
              <BarChart2 className="h-4 w-4 text-purple-400" /> Dashboard & Inteligência CRM
            </Button>

            <Button
              variant="ghost"
              onClick={() => setActiveView("automations")}
              className={`w-full justify-start gap-3 text-xs font-semibold rounded-xl px-3 py-2.5 ${
                activeView === "automations" ? "bg-amber-500 text-slate-950 shadow-md font-bold" : "text-slate-300 hover:bg-white/5"
              }`}
            >
              <Zap className="h-4 w-4 text-yellow-400" /> Automações CRM
            </Button>
          </nav>

          <hr className="border-white/10 my-3" />

          {/* Projects Submenu */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-3">
              <span className="text-[11px] uppercase font-bold text-slate-400 tracking-widest">Projetos</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-slate-400 hover:text-amber-400"
                onClick={() => setNewProjectOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="space-y-1 max-h-44 overflow-y-auto custom-scrollbar">
              {projects.map((p) => (
                <Button
                  key={p.id}
                  variant="ghost"
                  onClick={() => setActiveView(`project_${p.id}`)}
                  className={`w-full justify-start gap-2.5 text-xs font-medium rounded-lg px-3 py-2 ${
                    activeView === `project_${p.id}` ? "bg-white/10 text-white font-bold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="truncate">{p.name}</span>
                </Button>
              ))}
              {projects.length === 0 && (
                <p className="text-[11px] text-slate-500 italic px-3">Nenhum projeto cadastrado.</p>
              )}
            </div>
          </div>

          <hr className="border-white/10 my-3" />

          {/* Labels Submenu */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-3">
              <span className="text-[11px] uppercase font-bold text-slate-400 tracking-widest">Etiquetas</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-slate-400 hover:text-amber-400"
                onClick={() => setNewLabelOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-1.5 px-3">
              {labels.map((l) => (
                <Badge
                  key={l.id}
                  variant="outline"
                  onClick={() => setSelectedLabelFilter(selectedLabelFilter === l.id ? null : l.id)}
                  className={`cursor-pointer text-[10px] font-bold ${
                    selectedLabelFilter === l.id ? "ring-2 ring-amber-400" : ""
                  }`}
                  style={{ backgroundColor: `${l.color}15`, borderColor: `${l.color}40`, color: l.color }}
                >
                  #{l.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Right Main Content Panel */}
        <div className="lg:col-span-3 space-y-6">
          {/* Global Search & Filters Bar */}
          {activeView !== "dashboard" && activeView !== "automations" && (
            <div className="bg-[#0f172a] p-4 rounded-2xl border border-white/10 flex flex-col md:flex-row gap-3 items-center justify-between shadow-xl">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Pesquisar tarefas por título, descrição ou dados..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-900/80 border-white/10 pl-9 text-xs text-white"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <Select value={selectedPriorityFilter} onValueChange={setSelectedPriorityFilter}>
                  <SelectTrigger className="bg-slate-900 border-white/10 text-xs text-white w-36">
                    <SelectValue placeholder="Prioridade" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/10 text-white">
                    <SelectItem value="all">Todas Prioridades</SelectItem>
                    <SelectItem value="P1">P1 — Urgente</SelectItem>
                    <SelectItem value="P2">P2 — Alta</SelectItem>
                    <SelectItem value="P3">P3 — Normal</SelectItem>
                    <SelectItem value="P4">P4 — Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* VIEW: HOJE (Today, Overdue, Upcoming sections) */}
          {activeView === "today" && (
            <div className="space-y-6">
              {/* Overdue Section */}
              {overdueTasks.length > 0 && (
                <div className="bg-red-950/20 p-5 rounded-2xl border border-red-500/30 space-y-3">
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertTriangle className="h-5 w-5" />
                    <h3 className="text-sm font-bold uppercase tracking-wider">ATRASADAS ({overdueTasks.length})</h3>
                  </div>
                  <div className="space-y-2.5">
                    {overdueTasks.map((t) => (
                      <TodoistTaskItem
                        key={t.id}
                        task={t}
                        onToggleComplete={(id) => completeTaskMutation.mutate(id)}
                        onSelectTask={(task) => setSelectedTaskId(task.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Today Section */}
              <div className="bg-[#0f172a] p-5 rounded-2xl border border-white/10 space-y-3 shadow-xl">
                <div className="flex items-center gap-2 text-amber-400">
                  <Sun className="h-5 w-5" />
                  <h3 className="text-sm font-bold uppercase tracking-wider">HOJE ({todayTasks.length})</h3>
                </div>
                {todayTasks.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center italic">Nenhuma tarefa agendada para hoje. Parabéns!</p>
                ) : (
                  <div className="space-y-2.5">
                    {todayTasks.map((t) => (
                      <TodoistTaskItem
                        key={t.id}
                        task={t}
                        onToggleComplete={(id) => completeTaskMutation.mutate(id)}
                        onSelectTask={(task) => setSelectedTaskId(task.id)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Upcoming Section */}
              <div className="bg-[#0f172a] p-5 rounded-2xl border border-white/10 space-y-3 shadow-xl">
                <div className="flex items-center gap-2 text-slate-300">
                  <Clock className="h-5 w-5" />
                  <h3 className="text-sm font-bold uppercase tracking-wider">PRÓXIMAS ({upcomingTasks.length})</h3>
                </div>
                {upcomingTasks.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center italic">Sem mais tarefas pendentes.</p>
                ) : (
                  <div className="space-y-2.5">
                    {upcomingTasks.map((t) => (
                      <TodoistTaskItem
                        key={t.id}
                        task={t}
                        onToggleComplete={(id) => completeTaskMutation.mutate(id)}
                        onSelectTask={(task) => setSelectedTaskId(task.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW: INBOX / UPCOMING / COMPLETED / PROJECTS */}
          {activeView !== "today" && activeView !== "kanban" && activeView !== "dashboard" && activeView !== "automations" && (
            <div className="bg-[#0f172a] p-5 rounded-2xl border border-white/10 space-y-4 shadow-xl">
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                {activeView === "inbox" && "Caixa de Entrada (Inbox)"}
                {activeView === "upcoming" && "Próximas Tarefas"}
                {activeView === "completed" && "Tarefas Concluídas"}
                {activeView.startsWith("project_") && "Tarefas do Projeto"}
              </h3>

              {tasksLoading ? (
                <p className="text-xs text-slate-400 py-6 text-center">Carregando...</p>
              ) : tasks.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center italic">Nenhuma tarefa encontrada para esta visão.</p>
              ) : (
                <div className="space-y-2.5">
                  {tasks.map((t) => (
                    <TodoistTaskItem
                      key={t.id}
                      task={t}
                      onToggleComplete={(id) => completeTaskMutation.mutate(id)}
                      onSelectTask={(task) => setSelectedTaskId(task.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VIEW: KANBAN */}
          {activeView === "kanban" && (
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { id: "backlog", title: "Backlog", color: "border-slate-500/30 text-slate-400" },
                  { id: "a_fazer", title: "A Fazer", color: "border-blue-500/30 text-blue-400" },
                  { id: "em_andamento", title: "Em Andamento", color: "border-amber-500/30 text-amber-400" },
                  { id: "concluido", title: "Concluído", color: "border-emerald-500/30 text-emerald-400" },
                ].map((col) => {
                  const colTasks = tasks.filter((t) => t.kanbanColumn === col.id);
                  return (
                    <Droppable key={col.id} droppableId={col.id}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="bg-[#0f172a] p-4 rounded-2xl border border-white/10 min-h-[500px] flex flex-col space-y-3 shadow-xl"
                        >
                          <div className={`flex items-center justify-between pb-2 border-b border-white/10 ${col.color}`}>
                            <h4 className="text-xs font-bold uppercase tracking-wider">{col.title}</h4>
                            <span className="text-xs px-2 py-0.5 rounded bg-white/10 font-bold">{colTasks.length}</span>
                          </div>

                          <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar">
                            {colTasks.map((t, idx) => (
                              <Draggable key={t.id} draggableId={String(t.id)} index={idx}>
                                {(dragProvided) => (
                                  <div
                                    ref={dragProvided.innerRef}
                                    {...dragProvided.draggableProps}
                                    {...dragProvided.dragHandleProps}
                                  >
                                    <TodoistTaskItem
                                      task={t}
                                      onToggleComplete={(id) => completeTaskMutation.mutate(id)}
                                      onSelectTask={(task) => setSelectedTaskId(task.id)}
                                    />
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        </div>
                      )}
                    </Droppable>
                  );
                })}
              </div>
            </DragDropContext>
          )}

          {/* VIEW: DASHBOARD & CRM INTELLIGENCE */}
          {activeView === "dashboard" && (
            <div className="space-y-6">
              {/* Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-[#0f172a] border-white/10 text-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs text-slate-400 font-medium">Tarefas Hoje</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-black text-amber-400">
                      {dashboardStats?.myTasks?.todayCount || 0}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#0f172a] border-white/10 text-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs text-slate-400 font-medium">Atrasadas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-black text-red-500">
                      {dashboardStats?.myTasks?.overdueCount || 0}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#0f172a] border-white/10 text-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs text-slate-400 font-medium">Concluídas Hoje</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-black text-emerald-400">
                      {dashboardStats?.myTasks?.completedTodayCount || 0}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#0f172a] border-white/10 text-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs text-slate-400 font-medium">Total Pendente</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-black text-blue-400">
                      {dashboardStats?.myTasks?.totalPending || 0}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* CRM Intelligence Section */}
              <div className="bg-gradient-to-r from-[#0F6570]/30 to-indigo-950/40 p-6 rounded-2xl border border-amber-500/30 space-y-4 shadow-xl">
                <div className="flex items-center gap-2 text-amber-400">
                  <Sparkles className="h-5 w-5" />
                  <h3 className="text-sm font-black uppercase tracking-wider">INTELIGÊNCIA CRM + TAREFAS</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Leads without contact */}
                  <div className="bg-slate-900/80 p-4 rounded-xl border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-200">Leads Sem Nenhum Contato</h4>
                      <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30 font-bold">
                        {dashboardStats?.crmIntelligence?.leadsWithoutContactCount || 0}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {dashboardStats?.crmIntelligence?.leadsWithoutContact?.map((lead: any) => (
                        <div key={lead.id} className="flex items-center justify-between p-2 rounded bg-slate-800/60 text-xs">
                          <span className="text-white font-medium">Oportunidade #{lead.id} ({lead.product || "Lead"})</span>
                          <Button
                            size="sm"
                            onClick={() => setQuickAddOpen(true)}
                            className="h-6 text-[10px] bg-amber-500 text-slate-950 font-bold"
                          >
                            + Follow-up
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stale Leads > 7 Days */}
                  <div className="bg-slate-900/80 p-4 rounded-xl border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-200">Oportunidades Paradas (&gt; 7 dias)</h4>
                      <Badge variant="outline" className="bg-orange-500/20 text-orange-400 border-orange-500/30 font-bold">
                        {dashboardStats?.crmIntelligence?.staleLeadsCount || 0}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {dashboardStats?.crmIntelligence?.staleLeads?.map((lead: any) => (
                        <div key={lead.id} className="flex items-center justify-between p-2 rounded bg-slate-800/60 text-xs">
                          <span className="text-white font-medium">Oportunidade #{lead.id} ({lead.status})</span>
                          <Button
                            size="sm"
                            onClick={() => setQuickAddOpen(true)}
                            className="h-6 text-[10px] bg-amber-500 text-slate-950 font-bold"
                          >
                            + Reativar
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: AUTOMATIONS */}
          {activeView === "automations" && (
            <div className="bg-[#0f172a] p-6 rounded-2xl border border-white/10 space-y-5 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-yellow-400">
                  <Zap className="h-5 w-5" />
                  <h3 className="text-sm font-bold uppercase tracking-wider">Regras de Automação de Tarefas CRM</h3>
                </div>
                <Button
                  onClick={() => setNewAutomationOpen(true)}
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs gap-1"
                >
                  <Plus className="h-4 w-4" /> Nova Regra
                </Button>
              </div>

              <div className="space-y-3">
                {automations.map((a: any) => (
                  <div key={a.id} className="p-4 bg-slate-900/60 rounded-xl border border-white/10 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-white">{a.name}</h4>
                      <p className="text-xs text-slate-400">
                        Quando ocorrer: <span className="text-amber-300 font-semibold">{a.eventType}</span> → Gerar Tarefa:{" "}
                        <span className="text-white font-semibold">"{a.actionTaskTitle}"</span> ({a.actionPriority})
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold">
                      Ativa
                    </Badge>
                  </div>
                ))}

                {automations.length === 0 && (
                  <p className="text-xs text-slate-500 py-6 text-center italic">Nenhuma regra de automação cadastrada.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <TodoistTaskDetailModal
        taskId={selectedTaskId}
        open={!!selectedTaskId}
        onOpenChange={(open) => !open && setSelectedTaskId(null)}
      />

      <TodoistQuickAddModal open={quickAddOpen} onOpenChange={setQuickAddOpen} />

      {/* New Project Dialog */}
      <Dialog open={newProjectOpen} onOpenChange={setNewProjectOpen}>
        <DialogContent className="bg-[#0f172a] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Novo Projeto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs text-slate-400">Nome do Projeto *</label>
              <Input
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Ex: Vendas, Marketing, Implantação"
                className="bg-slate-900 border-white/10 text-xs mt-1 text-white"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400">Cor do Projeto</label>
              <Input
                type="color"
                value={newProjectColor}
                onChange={(e) => setNewProjectColor(e.target.value)}
                className="bg-slate-900 border-white/10 h-10 mt-1 cursor-pointer"
              />
            </div>

            <Button
              onClick={() => {
                if (newProjectName.trim()) {
                  createProjectMutation.mutate({
                    name: newProjectName.trim(),
                    color: newProjectColor,
                    createdBy: user?.id,
                  });
                }
              }}
              className="w-full bg-amber-500 text-slate-950 font-bold text-xs"
            >
              Criar Projeto
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Label Dialog */}
      <Dialog open={newLabelOpen} onOpenChange={setNewLabelOpen}>
        <DialogContent className="bg-[#0f172a] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Nova Etiqueta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs text-slate-400">Nome da Etiqueta *</label>
              <Input
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                placeholder="Ex: ligacao, whatsapp, reuniao"
                className="bg-slate-900 border-white/10 text-xs mt-1 text-white"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400">Cor</label>
              <Input
                type="color"
                value={newLabelColor}
                onChange={(e) => setNewLabelColor(e.target.value)}
                className="bg-slate-900 border-white/10 h-10 mt-1 cursor-pointer"
              />
            </div>

            <Button
              onClick={() => {
                if (newLabelName.trim()) {
                  createLabelMutation.mutate({
                    name: newLabelName.trim().replace(/^#/, ""),
                    color: newLabelColor,
                    createdBy: user?.id,
                  });
                }
              }}
              className="w-full bg-amber-500 text-slate-950 font-bold text-xs"
            >
              Criar Etiqueta
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Automation Dialog */}
      <Dialog open={newAutomationOpen} onOpenChange={setNewAutomationOpen}>
        <DialogContent className="bg-[#0f172a] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Nova Regra de Automação CRM</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs text-slate-400">Nome da Regra *</label>
              <Input
                value={autoName}
                onChange={(e) => setAutoName(e.target.value)}
                placeholder="Ex: Follow-up de Novo Lead"
                className="bg-slate-900 border-white/10 text-xs mt-1 text-white"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400">Gatilho do CRM</label>
              <Select value={autoEventType} onValueChange={setAutoEventType}>
                <SelectTrigger className="bg-slate-900 border-white/10 text-xs text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10 text-white">
                  <SelectItem value="new_lead">Quando Novo Lead Entrar</SelectItem>
                  <SelectItem value="lead_status_changed">Quando Status da Oportunidade Mudar</SelectItem>
                  <SelectItem value="deal_closed">Quando Venda for Fechada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-slate-400">Título da Tarefa Automática *</label>
              <Input
                value={autoActionTitle}
                onChange={(e) => setAutoActionTitle(e.target.value)}
                placeholder="Ex: Entrar em contato com novo lead"
                className="bg-slate-900 border-white/10 text-xs mt-1 text-white"
              />
            </div>

            <Button
              onClick={() => {
                if (autoName.trim() && autoActionTitle.trim()) {
                  createAutomationMutation.mutate({
                    name: autoName.trim(),
                    eventType: autoEventType,
                    actionTaskTitle: autoActionTitle.trim(),
                    actionPriority: autoPriority,
                    isActive: true,
                  });
                }
              }}
              className="w-full bg-amber-500 text-slate-950 font-bold text-xs"
            >
              Salvar Regra
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
