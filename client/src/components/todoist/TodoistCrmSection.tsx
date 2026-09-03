import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Plus, CheckSquare, Calendar, Clock, AlertCircle } from "lucide-react";
import { TodoistTaskItem } from "./TodoistTaskItem";
import { TodoistTaskDetailModal } from "./TodoistTaskDetailModal";
import { TodoistQuickAddModal } from "./TodoistQuickAddModal";

interface TodoistCrmSectionProps {
  contactId?: number;
  leadId?: number;
  clienteId?: number;
  apoliceId?: number;
  title?: string;
}

export function TodoistCrmSection({
  contactId,
  leadId,
  clienteId,
  apoliceId,
  title = "Tarefas Vinculadas (TODOIST)",
}: TodoistCrmSectionProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  // Build query string
  const queryParams = new URLSearchParams();
  if (contactId) queryParams.append("contactId", String(contactId));
  if (leadId) queryParams.append("leadId", String(leadId));
  if (clienteId) queryParams.append("clienteId", String(clienteId));
  if (apoliceId) queryParams.append("apoliceId", String(apoliceId));

  const { data: tasks = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/todoist/tasks", "crm", contactId, leadId, clienteId, apoliceId],
    queryFn: async () => {
      const res = await fetch(`/api/todoist/tasks?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Erro ao buscar tarefas do CRM");
      return res.json();
    },
  });

  const toggleCompleteMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const res = await apiRequest("POST", `/api/todoist/tasks/${taskId}/complete`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todoist/tasks"] });
    },
  });

  const pendingTasks = tasks.filter((t) => t.status !== "done");
  const completedTasks = tasks.filter((t) => t.status === "done");

  return (
    <div className="bg-[#0f172a] p-5 rounded-2xl border border-white/10 space-y-4 shadow-xl">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-amber-400" />
          <h3 className="text-base font-bold text-white">{title}</h3>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
            {pendingTasks.length} pendente(s)
          </span>
        </div>
        <Button
          onClick={() => setQuickAddOpen(true)}
          size="sm"
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs gap-1"
        >
          <Plus className="h-4 w-4" /> Nova Tarefa
        </Button>
      </div>

      {/* Task List */}
      {isLoading ? (
        <div className="py-6 text-center text-xs text-slate-400">Carregando tarefas...</div>
      ) : tasks.length === 0 ? (
        <div className="py-8 text-center bg-slate-900/40 rounded-xl border border-dashed border-white/10 space-y-2">
          <p className="text-xs text-slate-400">Nenhuma tarefa vinculada a este registro.</p>
          <Button
            onClick={() => setQuickAddOpen(true)}
            variant="outline"
            size="sm"
            className="bg-transparent border-amber-500/30 text-amber-400 text-xs hover:bg-amber-500/10"
          >
            + Criar Primeira Tarefa
          </Button>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
          {pendingTasks.map((task) => (
            <TodoistTaskItem
              key={task.id}
              task={task}
              onToggleComplete={(id) => toggleCompleteMutation.mutate(id)}
              onSelectTask={(t) => setSelectedTaskId(t.id)}
            />
          ))}

          {completedTasks.length > 0 && (
            <div className="pt-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Concluídas ({completedTasks.length})
              </span>
              <div className="space-y-2">
                {completedTasks.map((task) => (
                  <TodoistTaskItem
                    key={task.id}
                    task={task}
                    onToggleComplete={(id) => toggleCompleteMutation.mutate(id)}
                    onSelectTask={(t) => setSelectedTaskId(t.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Task Detail Modal */}
      <TodoistTaskDetailModal
        taskId={selectedTaskId}
        open={!!selectedTaskId}
        onOpenChange={(open) => !open && setSelectedTaskId(null)}
      />

      {/* Quick Add Modal pre-bound to CRM record */}
      <TodoistQuickAddModal
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
        defaultContactId={contactId}
        defaultLeadId={leadId}
        defaultClienteId={clienteId}
        defaultApoliceId={apoliceId}
      />
    </div>
  );
}
