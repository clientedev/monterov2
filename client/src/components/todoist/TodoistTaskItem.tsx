import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  MessageSquare,
  Repeat,
  CheckCircle2,
  Building,
  User,
  ShieldCheck,
  FileText,
  Tag,
  Folder
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TodoistTaskItemProps {
  task: any;
  onToggleComplete: (id: number) => void;
  onSelectTask: (task: any) => void;
}

export function TodoistTaskItem({ task, onToggleComplete, onSelectTask }: TodoistTaskItemProps) {
  const isDone = task.status === "done";
  
  // Priority styling
  const priorityConfig: Record<string, { label: string; badgeBg: string; textCol: string; borderCol: string }> = {
    P1: { label: "P1 — Urgente", badgeBg: "bg-red-500/10 text-red-500 border-red-500/30", textCol: "text-red-500", borderCol: "border-red-500" },
    P2: { label: "P2 — Alta", badgeBg: "bg-orange-500/10 text-orange-500 border-orange-500/30", textCol: "text-orange-500", borderCol: "border-orange-500" },
    P3: { label: "P3 — Normal", badgeBg: "bg-blue-500/10 text-blue-500 border-blue-500/30", textCol: "text-blue-500", borderCol: "border-blue-500" },
    P4: { label: "P4 — Baixa", badgeBg: "bg-slate-500/10 text-slate-400 border-slate-500/30", textCol: "text-slate-400", borderCol: "border-slate-500" },
  };

  const pInfo = priorityConfig[task.priority] || priorityConfig.P3;

  // Due date status
  let dateFormatted = "";
  let isOverdue = false;
  if (task.dueDate) {
    const d = new Date(task.dueDate);
    dateFormatted = format(d, "dd 'de' MMM", { locale: ptBR });
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (d < now && !isDone) {
      isOverdue = true;
    }
  }

  // Calculate subtask progress
  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter((s: any) => s.completed).length;

  return (
    <div
      className={`group relative flex items-start gap-3.5 p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
        isDone
          ? "bg-slate-900/40 border-white/5 opacity-60"
          : isOverdue
          ? "bg-red-950/10 border-red-500/20 hover:border-red-500/40"
          : "bg-[#11161d] border-white/10 hover:border-amber-500/30 hover:bg-[#161d26]"
      }`}
      onClick={() => onSelectTask(task)}
    >
      {/* Checkbox */}
      <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => onToggleComplete(task.id)}
          className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
            isDone
              ? "bg-emerald-500 border-emerald-500 text-slate-950"
              : `${pInfo.borderCol} hover:scale-110 hover:bg-white/10`
          }`}
        >
          {isDone && <CheckCircle2 className="h-4 w-4 stroke-[3]" />}
        </button>
      </div>

      {/* Main Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4
            className={`text-sm font-semibold truncate ${
              isDone ? "line-through text-slate-400" : "text-white"
            }`}
          >
            {task.title}
          </h4>

          {/* Priority Badge */}
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${pInfo.badgeBg}`}>
            {task.priority}
          </span>

          {/* Project Badge */}
          {task.project && (
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded flex items-center gap-1 border border-white/10"
              style={{ backgroundColor: `${task.project.color}15`, color: task.project.color }}
            >
              <Folder className="h-3 w-3" />
              {task.project.name}
            </span>
          )}

          {/* Labels */}
          {task.labels?.map((label: any) => (
            <span
              key={label.id}
              className="text-[10px] font-medium px-2 py-0.5 rounded border"
              style={{ backgroundColor: `${label.color}15`, borderColor: `${label.color}40`, color: label.color }}
            >
              #{label.name}
            </span>
          ))}
        </div>

        {/* Description snippet */}
        {task.description && (
          <p className="text-xs text-slate-400 line-clamp-1 mt-1 font-normal">
            {task.description}
          </p>
        )}

        {/* Meta details footer */}
        <div className="flex items-center gap-4 mt-2.5 text-xs text-slate-400 flex-wrap">
          {/* Due date */}
          {dateFormatted && (
            <div className={`flex items-center gap-1 font-medium ${isOverdue ? "text-red-400 font-bold" : "text-slate-400"}`}>
              <Calendar className="h-3.5 w-3.5" />
              <span>{dateFormatted}</span>
              {task.dueTime && (
                <span className="flex items-center gap-0.5 text-[11px] opacity-80">
                  <Clock className="h-3 w-3" />
                  {task.dueTime}
                </span>
              )}
            </div>
          )}

          {/* Recurrence */}
          {task.isRecurring && (
            <div className="flex items-center gap-1 text-emerald-400 font-medium">
              <Repeat className="h-3.5 w-3.5" />
              <span>Recorrente</span>
            </div>
          )}

          {/* Subtask progress */}
          {subtasks.length > 0 && (
            <div className="flex items-center gap-1 text-slate-400 bg-white/5 px-2 py-0.5 rounded text-[11px]">
              <span>Checklist: {completedSubtasks}/{subtasks.length}</span>
            </div>
          )}

          {/* Comments count */}
          {task.commentsCount > 0 && (
            <div className="flex items-center gap-1 text-slate-400">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>{task.commentsCount}</span>
            </div>
          )}

          {/* CRM Badges */}
          {task.contact && (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-300 border-amber-500/30 gap-1 text-[11px]">
              <User className="h-3 w-3" />
              {task.contact.name}
            </Badge>
          )}

          {task.lead && (
            <Badge variant="outline" className="bg-indigo-500/10 text-indigo-300 border-indigo-500/30 gap-1 text-[11px]">
              <FileText className="h-3 w-3" />
              Oportunidade #{task.lead.id}
            </Badge>
          )}

          {task.cliente && (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30 gap-1 text-[11px]">
              <ShieldCheck className="h-3 w-3" />
              {task.cliente.nome}
            </Badge>
          )}

          {task.apolice && (
            <Badge variant="outline" className="bg-cyan-500/10 text-cyan-300 border-cyan-500/30 gap-1 text-[11px]">
              <Building className="h-3 w-3" />
              Apólice #{task.apolice.numeroApolice || task.apolice.id}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
