import { useState, type ReactNode } from "react";
import type { Lead } from "@shared/schema";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger, DropdownMenuRadioGroup, DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { LifeInsuranceSummary } from "@/components/LifeInsuranceFieldsSection";
import {
  MoreHorizontal, Bell, BellRing, Edit2, Trash2, Phone, MessageCircle, ArrowRight, ListChecks, ExternalLink, Users,
} from "lucide-react";
import {
  type LeadActivity, URGENCY_META, firstName, fullDateTime, initials, leadValueLabel, parseBRL, formatBRLShort, shortRelative, telUrl, whatsappUrl,
} from "./pipeline-utils";

export interface PipelineContact { id: number; name: string; phone?: string | null; email?: string | null; [k: string]: any }
export interface PipelineUser { id: number; name: string; avatar?: string | null }

export interface LeadCardProps {
  lead: Lead;
  contact: PipelineContact | null;
  responsible: PipelineUser | null;
  activity: LeadActivity;
  columns: { id: string; label: string; color?: string }[];
  staff: PipelineUser[];
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onReminder: () => void;
  onMove: (status: string) => void;
  onAssign: (userId: number | null) => void;
  dragging?: boolean;
}

/* ---------- peças pequenas ---------- */

export function Avatar({ user, size = "sm" }: { user: PipelineUser | null; size?: "xs" | "sm" }) {
  const dim = size === "xs" ? "h-[18px] w-[18px] text-[8.5px]" : "h-5 w-5 text-[9px]";
  if (user?.avatar) {
    return <img src={user.avatar} alt={user.name} title={user.name} className={cn(dim, "rounded-full object-cover shrink-0 ring-1 ring-white")} />;
  }
  return (
    <span
      title={user ? user.name : "Não atribuído"}
      className={cn(
        dim,
        "rounded-full shrink-0 inline-flex items-center justify-center font-semibold tracking-tight",
        user ? "bg-primary/10 text-primary" : "bg-transparent text-slate-400 border border-dashed border-slate-300",
      )}
    >
      {user ? initials(user.name) : "?"}
    </span>
  );
}

export function UrgencyDot({ activity, className }: { activity: LeadActivity; className?: string }) {
  const meta = URGENCY_META[activity.urgency];
  return (
    <span
      title={`Prioridade ${meta.label.toLowerCase()}${activity.next ? ` · ${activity.next.label}: ${fullDateTime(activity.next.date)}` : ""}`}
      className={cn("h-1.5 w-1.5 rounded-full shrink-0", meta.dot, activity.urgency === "normal" && "opacity-60", className)}
    />
  );
}

function ReminderChip({ lead }: { lead: Lead }) {
  // Retorno já disparado não é pendência: fica só nos detalhes
  if (!lead.reminderDate || lead.reminderSent) return null;
  const d = new Date(lead.reminderDate);
  const overdue = !lead.reminderSent && d.getTime() < Date.now();
  const rel = shortRelative(d);
  return (
    <span
      title={lead.reminderSent ? `Retorno disparado em ${fullDateTime(d)}` : `Retorno ao cliente: ${fullDateTime(d)}`}
      className={cn(
        "inline-flex items-center gap-0.5 rounded px-1 py-px text-[10px] font-medium leading-none",
        lead.reminderSent ? "text-emerald-700 bg-emerald-50" : overdue ? "text-rose-700 bg-rose-50" : "text-amber-700 bg-amber-50",
      )}
    >
      {lead.reminderSent ? <Bell className="h-2.5 w-2.5" /> : <BellRing className="h-2.5 w-2.5" />}
      {lead.reminderSent ? "ok" : overdue ? "atrasado" : rel}
    </span>
  );
}

function TasksChip({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span title={`${count} atividade(s) pendente(s)`} className="inline-flex items-center gap-0.5 rounded px-1 py-px text-[10px] font-medium leading-none text-slate-600 bg-slate-100">
      <ListChecks className="h-2.5 w-2.5" />
      {count}
    </span>
  );
}

/* ---------- menu de ações rápidas (mesmo em todos os modos) ---------- */

export function LeadActionsMenu(p: LeadCardProps & { trigger?: ReactNode; align?: "start" | "end"; onOpenChange?: (open: boolean) => void }) {
  const { lead, contact, columns, staff } = p;
  const wa = whatsappUrl(contact?.phone);
  const tel = telUrl(contact?.phone);
  const idx = columns.findIndex((c) => c.id === lead.status);
  const next = idx !== -1 && idx < columns.length - 1 ? columns[idx + 1] : null;
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <DropdownMenu onOpenChange={p.onOpenChange}>
      <DropdownMenuTrigger asChild onClick={stop} onPointerDown={stop}>
        {p.trigger || (
          <button
            type="button"
            aria-label="Ações da oportunidade"
            className="h-6 w-6 -mr-1 inline-flex items-center justify-center rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100 data-[state=open]:bg-slate-100 data-[state=open]:text-slate-800"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={p.align || "end"} className="w-56" onClick={stop}>
        <DropdownMenuLabel className="text-xs font-semibold text-slate-500 truncate">{contact?.name || "Oportunidade"}</DropdownMenuLabel>
        <DropdownMenuItem onSelect={p.onOpen}><ExternalLink className="mr-2 h-3.5 w-3.5" />Abrir cliente</DropdownMenuItem>
        <DropdownMenuItem onSelect={p.onEdit}><Edit2 className="mr-2 h-3.5 w-3.5" />Editar oportunidade</DropdownMenuItem>
        <DropdownMenuItem onSelect={p.onReminder}>
          <Bell className="mr-2 h-3.5 w-3.5" />{lead.reminderDate ? "Gerenciar retorno ao cliente" : "Agendar retorno ao cliente"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={!wa} onSelect={() => wa && window.open(wa, "_blank", "noopener")}>
          <MessageCircle className="mr-2 h-3.5 w-3.5 text-emerald-600" />WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!tel} onSelect={() => tel && (window.location.href = tel)}>
          <Phone className="mr-2 h-3.5 w-3.5" />Ligar{contact?.phone ? <span className="ml-auto text-[10px] text-slate-400">{contact.phone}</span> : null}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {next && (
          <DropdownMenuItem onSelect={() => p.onMove(next.id)}>
            <ArrowRight className="mr-2 h-3.5 w-3.5" />Avançar para {next.label}
          </DropdownMenuItem>
        )}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger><ListChecks className="mr-2 h-3.5 w-3.5" />Mover para etapa</DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-48">
            <DropdownMenuRadioGroup value={lead.status} onValueChange={p.onMove}>
              {columns.map((c) => (
                <DropdownMenuRadioItem key={c.id} value={c.id} className="text-xs">{c.label}</DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger><Users className="mr-2 h-3.5 w-3.5" />Alterar responsável</DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-52 max-h-72 overflow-y-auto">
            <DropdownMenuRadioGroup value={lead.assignedTo ? String(lead.assignedTo) : "none"} onValueChange={(v) => p.onAssign(v === "none" ? null : Number(v))}>
              <DropdownMenuRadioItem value="none" className="text-xs text-amber-700">Não atribuído</DropdownMenuRadioItem>
              {staff.map((u) => (
                <DropdownMenuRadioItem key={u.id} value={String(u.id)} className="text-xs">{u.name}</DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={p.onDelete} className="text-rose-600 focus:text-rose-700 focus:bg-rose-50">
          <Trash2 className="mr-2 h-3.5 w-3.5" />Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ---------- detalhes no hover (informação secundária) ---------- */

export function LeadDetails({ lead, contact, responsible, activity, columns }: LeadCardProps) {
  const stage = columns.find((c) => c.id === lead.status)?.label || lead.status;
  return (
    <div className="space-y-2.5 text-xs">
      <div>
        <div className="font-semibold text-sm text-slate-900 leading-tight">{contact?.name || "Desconhecido"}</div>
        <div className="text-slate-500 mt-0.5">{[lead.product, lead.source || "Direto"].filter(Boolean).join(" · ")}</div>
      </div>
      <dl className="grid grid-cols-[104px_1fr] gap-x-2 gap-y-1">
        <dt className="text-slate-400">Valor</dt><dd className="font-semibold tabular-nums text-slate-900">{leadValueLabel(lead)}</dd>
        <dt className="text-slate-400">Etapa</dt><dd className="text-slate-700">{stage}</dd>
        <dt className="text-slate-400">Responsável</dt><dd className="text-slate-700">{responsible?.name || "Não atribuído"}</dd>
        <dt className="text-slate-400">Última interação</dt><dd className="text-slate-700">{fullDateTime(activity.lastInteraction)}</dd>
        <dt className="text-slate-400">Próxima</dt>
        <dd className="text-slate-700">{activity.next ? `${activity.next.label} · ${fullDateTime(activity.next.date)}` : "—"}</dd>
        {contact?.phone && (<><dt className="text-slate-400">Telefone</dt><dd className="text-slate-700">{contact.phone}</dd></>)}
        {lead.reminderEmail && (<><dt className="text-slate-400">E-mail retorno</dt><dd className="text-slate-700 truncate">{lead.reminderEmail}</dd></>)}
      </dl>
      {activity.openTasks.length > 0 && (
        <div>
          <div className="text-slate-400 mb-1">Atividades pendentes</div>
          <ul className="space-y-0.5">
            {activity.openTasks.slice(0, 4).map((t) => (
              <li key={t.id} className="flex gap-1.5 text-slate-700"><span className="text-slate-300">•</span><span className="truncate">{t.title}</span></li>
            ))}
          </ul>
        </div>
      )}
      {lead.reminderNote && <p className="text-slate-600 border-l-2 border-amber-300 pl-2">{lead.reminderNote}</p>}
      {lead.notes && <p className="text-slate-600 italic border-l-2 border-primary/25 pl-2 line-clamp-4">“{lead.notes}”</p>}
      <LifeInsuranceSummary
        values={{ lifeHeight: lead.lifeHeight, lifeWeight: lead.lifeWeight, lifeProfession: lead.lifeProfession, lifeIncome: lead.lifeIncome }}
        variant="card"
      />
    </div>
  );
}

function WithDetails({ children, props, suppressed }: { children: ReactNode; props: LeadCardProps; suppressed?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <HoverCard open={open && !suppressed && !props.dragging} onOpenChange={setOpen} openDelay={550} closeDelay={80}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent side="right" align="start" className="w-80 p-3.5 rounded-xl">
        <LeadDetails {...props} />
      </HoverCardContent>
    </HoverCard>
  );
}

/* ---------- Modo 1: Kanban compacto ---------- */

export function CompactLeadCard(props: LeadCardProps) {
  const { lead, contact, responsible, activity } = props;
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <WithDetails props={props} suppressed={menuOpen}>
      <div
        onClick={props.onOpen}
        className={cn(
          "group rounded-lg border border-slate-200/80 bg-white px-2.5 py-2 transition-colors hover:border-slate-300",
          props.dragging && "shadow-lg border-primary/30 ring-1 ring-primary/10",
        )}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <UrgencyDot activity={activity} />
          <span className="flex-1 min-w-0 truncate text-[13px] font-semibold text-slate-900 leading-5" title={contact?.name || ""}>
            {contact?.name || "Desconhecido"}
          </span>
          <LeadActionsMenu {...props} onOpenChange={setMenuOpen} />
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 min-w-0 pl-3">
          {lead.product && <span className="truncate text-[11px] font-medium text-primary/90">{lead.product}</span>}
          <span className="truncate text-[11px] text-slate-400">{lead.source || "Direto"}</span>
          <span className={cn("ml-auto shrink-0 text-[12px] font-semibold tabular-nums", parseBRL(lead.value) ? "text-slate-900" : "text-slate-400 font-normal")}>
            {leadValueLabel(lead)}
          </span>
        </div>
        <div className="mt-1.5 flex items-center gap-1.5 pl-3 min-w-0">
          <Avatar user={responsible} size="xs" />
          <span className="truncate text-[11px] text-slate-500">{responsible ? firstName(responsible.name) : "Sem responsável"}</span>
          <span className="text-slate-300 text-[10px]">·</span>
          <span className="shrink-0 text-[11px] text-slate-500" title={`Última interação: ${fullDateTime(activity.lastInteraction)}`}>
            {shortRelative(activity.lastInteraction)}
          </span>
          <span className="ml-auto flex items-center gap-1 shrink-0">
            <TasksChip count={activity.openTasks.length} />
            <ReminderChip lead={lead} />
          </span>
        </div>
      </div>
    </WithDetails>
  );
}

/* ---------- Modo 3: Kanban ultra compacto ---------- */

export function UltraLeadCard(props: LeadCardProps) {
  const { lead, contact, responsible, activity } = props;
  const [menuOpen, setMenuOpen] = useState(false);
  const pending = activity.openTasks.length + (lead.reminderDate && !lead.reminderSent ? 1 : 0);
  return (
    <WithDetails props={props} suppressed={menuOpen}>
      <div
        onClick={props.onOpen}
        className={cn(
          "group flex items-center gap-1.5 h-[30px] rounded-md border border-transparent bg-white px-2 hover:border-slate-300 transition-colors",
          props.dragging && "shadow-lg border-primary/30",
        )}
      >
        <UrgencyDot activity={activity} />
        <span className="flex-1 min-w-0 truncate text-[12px] font-medium text-slate-800" title={contact?.name || ""}>
          {contact?.name || "Desconhecido"}
        </span>
        {pending > 0 && <span className="h-1 w-1 rounded-full bg-amber-500 shrink-0" title={`${pending} pendência(s)`} />}
        <span className={cn("shrink-0 text-[11px] tabular-nums", parseBRL(lead.value) ? "font-semibold text-slate-700" : "text-slate-300")}>
          {formatBRLShort(parseBRL(lead.value))}
        </span>
        <span className="shrink-0 w-[30px] text-right text-[10px] text-slate-400 tabular-nums">{shortRelative(activity.lastInteraction)}</span>
        <Avatar user={responsible} size="xs" />
        <span className={cn(menuOpen ? "inline-flex" : "hidden group-hover:inline-flex")}><LeadActionsMenu {...props} onOpenChange={setMenuOpen} /></span>
      </div>
    </WithDetails>
  );
}

