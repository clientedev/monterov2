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
          ? "bg-slate-50/60 border-slate-200 opacity-60"
          : isOverdue
          ? "bg-red-50/50 border-red-200 hover:border-red-300"
          : "bg-white border-gray-100 hover:border-primary/30 hover:shadow-md shadow-sm"
      }`}
      onClick={() => onSelectTask(task)}
    >
      {/* Checkbox */}
      <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => onToggleComplete(task.id)}
          className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
            isDone
              ? "bg-emerald-600 border-emerald-600 text-white"
              : `${pInfo.borderCol} hover:scale-110 hover:bg-slate-100`
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
              isDone ? "line-through text-slate-400" : "text-slate-900"
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
              className="text-[10px] font-medium px-2 py-0.5 rounded flex items-center gap-1 border border-slate-200"
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
          <p className="text-xs text-slate-500 line-clamp-1 mt-1 font-normal">
            {task.description}
          </p>
        )}

        {/* Meta details footer */}
        <div className="flex items-center gap-4 mt-2.5 text-xs text-slate-500 flex-wrap">
          {/* Assigned user badge */}
          {task.assigneeUser && (
            <div className="flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px] font-semibold">
              <User className="h-3 w-3 text-primary" />
              <span>{task.assigneeUser.name}</span>
            </div>
          )}

          {/* Due date */}
          {dateFormatted && (
            <div className={`flex items-center gap-1 font-medium ${isOverdue ? "text-red-600 font-bold" : "text-slate-500"}`}>
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
            <div className="flex items-center gap-1 text-emerald-600 font-medium">
              <Repeat className="h-3.5 w-3.5" />
              <span>Recorrente</span>
            </div>
          )}

          {/* Subtask progress */}
          {subtasks.length > 0 && (
            <div className="flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
              <span>Checklist: {completedSubtasks}/{subtasks.length}</span>
            </div>
          )}

          {/* Comments count */}
          {task.commentsCount > 0 && (
            <div className="flex items-center gap-1 text-slate-500">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>{task.commentsCount}</span>
            </div>
          )}

          {/* CRM Badges */}
          {task.contact && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 gap-1 text-[11px] font-medium">
              <User className="h-3 w-3" />
              {task.contact.name}
            </Badge>
          )}

          {task.lead && (
            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 gap-1 text-[11px] font-medium">
              <FileText className="h-3 w-3" />
              Oportunidade #{task.lead.id}
            </Badge>
          )}

          {task.cliente && (
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 text-[11px] font-medium">
              <ShieldCheck className="h-3 w-3" />
              {task.cliente.nome}
            </Badge>
          )}

          {task.apolice && (
            <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200 gap-1 text-[11px] font-medium">
              <Building className="h-3 w-3" />
              Apólice #{task.apolice.numeroApolice || task.apolice.id}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
