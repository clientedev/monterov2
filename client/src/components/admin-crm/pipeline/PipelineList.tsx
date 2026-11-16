import { useMemo, useState } from "react";
import type { Lead } from "@shared/schema";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDown, ArrowUp, ChevronsUpDown, Columns3, MessageCircle, Phone, Bell, Edit2 } from "lucide-react";
import { Avatar, LeadActionsMenu, type LeadCardProps, type PipelineUser } from "./PipelineCards";
import {
  URGENCY_META, firstName, formatBRL, fullDateTime, loadPref, parseBRL, savePref, shortRelative, telUrl, whatsappUrl,
} from "./pipeline-utils";

export type ListRow = Omit<LeadCardProps, "dragging">;

type ColId = "cliente" | "valor" | "etapa" | "responsavel" | "ultima" | "proxima" | "prioridade" | "origem" | "acoes";
const COLS: { id: ColId; label: string; sortable: boolean; align?: "right"; width: string; required?: boolean }[] = [
  { id: "cliente", label: "Cliente / Oportunidade", sortable: true, width: "minmax(220px,2.2fr)", required: true },
  { id: "valor", label: "Valor", sortable: true, align: "right", width: "minmax(108px,0.9fr)" },
  { id: "etapa", label: "Etapa", sortable: true, width: "minmax(140px,1.1fr)" },
  { id: "responsavel", label: "Responsável", sortable: true, width: "minmax(140px,1.1fr)" },
  { id: "ultima", label: "Última interação", sortable: true, width: "minmax(104px,0.8fr)" },
  { id: "proxima", label: "Próxima atividade", sortable: true, width: "minmax(150px,1.3fr)" },
  { id: "prioridade", label: "Prioridade", sortable: true, width: "minmax(84px,0.6fr)" },
  { id: "origem", label: "Origem", sortable: true, width: "minmax(110px,0.8fr)" },
  { id: "acoes", label: "Ações", sortable: false, width: "128px", required: true },
];
const DEFAULT_HIDDEN: ColId[] = ["origem"];

interface Props {
  rows: ListRow[];
  columns: { id: string; label: string; color?: string }[];
  staff: PipelineUser[];
  prefKey: string;
  maxHeight: string;
}

export function PipelineList({ rows, columns, staff, prefKey, maxHeight }: Props) {
  const [hidden, setHidden] = useState<ColId[]>(() => loadPref(`${prefKey}:hidden`, DEFAULT_HIDDEN));
  const [sort, setSort] = useState<{ col: ColId; dir: "asc" | "desc" }>(() => loadPref(`${prefKey}:sort`, { col: "prioridade", dir: "desc" }));

  const visible = COLS.filter((c) => !hidden.includes(c.id));
  const grid = visible.map((c) => c.width).join(" ");
  const stageIndex = useMemo(() => new Map(columns.map((c, i) => [c.id.toLowerCase(), i])), [columns]);

  const toggleCol = (id: ColId) => {
    const next = hidden.includes(id) ? hidden.filter((h) => h !== id) : [...hidden, id];
    setHidden(next);
    savePref(`${prefKey}:hidden`, next);
  };
  const toggleSort = (col: ColId) => {
    const next = sort.col === col ? { col, dir: sort.dir === "asc" ? "desc" : "asc" } as const : { col, dir: col === "cliente" || col === "responsavel" || col === "etapa" ? "asc" : "desc" } as const;
    setSort(next);
    savePref(`${prefKey}:sort`, next);
  };

  const sorted = useMemo(() => {
    const val = (r: ListRow): string | number => {
      switch (sort.col) {
        case "cliente": return (r.contact?.name || "").toLowerCase();
        case "valor": return parseBRL(r.lead.value);
        case "etapa": return stageIndex.get((r.lead.status || "").toLowerCase()) ?? 999;
        case "responsavel": return (r.responsible?.name || "~").toLowerCase();
        case "ultima": return r.activity.lastInteraction?.getTime() || 0;
        case "proxima": return r.activity.next ? r.activity.next.date.getTime() : Number.MAX_SAFE_INTEGER;
        case "prioridade": return URGENCY_META[r.activity.urgency].rank * 1e13 - (r.activity.next?.date.getTime() || 9e12) / 1;
        case "origem": return (r.lead.source || "Direto").toLowerCase();
        default: return 0;
      }
    };
    const out = [...rows];
    out.sort((a, b) => {
      const x = val(a), y = val(b);
      const c = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "pt-BR");
      return sort.dir === "asc" ? c : -c;
    });
    return out;
  }, [rows, sort, stageIndex]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="overflow-auto scrollbar-thin" style={{ maxHeight }}>
        <div className="min-w-[980px]">
          {/* Cabeçalho fixo */}
          <div
            role="row"
            className="sticky top-0 z-10 grid items-center gap-3 border-b border-slate-200 bg-slate-50/95 backdrop-blur px-3 h-9 text-[11px] font-semibold uppercase tracking-wide text-slate-500"
            style={{ gridTemplateColumns: grid }}
          >
            {visible.map((c) => (
              <div key={c.id} className={cn("flex items-center gap-1 min-w-0", c.align === "right" && "justify-end")}>
                {c.sortable ? (
                  <button type="button" onClick={() => toggleSort(c.id)} className="inline-flex items-center gap-1 hover:text-slate-900 truncate">
                    {c.label}
                    {sort.col === c.id ? (sort.dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ChevronsUpDown className="h-3 w-3 opacity-40" />}
                  </button>
                ) : c.id === "acoes" ? (
                  <div className="flex w-full items-center justify-between">
                    <span>{c.label}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button type="button" title="Escolher colunas" className="h-6 w-6 inline-flex items-center justify-center rounded-md hover:bg-slate-200/70 text-slate-500">
                          <Columns3 className="h-3.5 w-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuLabel className="text-xs">Colunas visíveis</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {COLS.filter((x) => !x.required).map((x) => (
                          <DropdownMenuCheckboxItem key={x.id} checked={!hidden.includes(x.id)} onCheckedChange={() => toggleCol(x.id)} onSelect={(e) => e.preventDefault()} className="text-xs">
                            {x.label}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ) : (
                  <span>{c.label}</span>
                )}
              </div>
            ))}
          </div>

          {sorted.length === 0 && <div className="px-4 py-10 text-center text-sm text-slate-400">Nenhuma oportunidade encontrada com os filtros atuais.</div>}

          {sorted.map((r) => (
            <ListRowView key={r.lead.id} row={r} visible={visible.map((v) => v.id)} grid={grid} columns={columns} staff={staff} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ListRowView({ row, visible, grid, columns, staff }: { row: ListRow; visible: ColId[]; grid: string; columns: Props["columns"]; staff: PipelineUser[] }) {
  const { lead, contact, responsible, activity } = row;
  const wa = whatsappUrl(contact?.phone);
  const tel = telUrl(contact?.phone);
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();
  const meta = URGENCY_META[activity.urgency];
  const value = parseBRL(lead.value);
  const nextOverdue = activity.next && activity.next.date.getTime() < Date.now();

  const cell: Record<ColId, JSX.Element> = {
    cliente: (
      <div className="min-w-0">
        <div className="truncate text-[13px] font-medium text-slate-900">{contact?.name || "Desconhecido"}</div>
        <div className="truncate text-[11px] text-slate-500">{lead.product || "Oportunidade"}{lead.notes ? <span className="text-slate-400"> · {lead.notes}</span> : null}</div>
      </div>
    ),
    valor: <div className={cn("text-right tabular-nums text-[13px]", value ? "font-semibold text-slate-900" : "text-slate-400")}>{formatBRL(value)}</div>,
    etapa: (
      <div onClick={stop}>
        <Select value={lead.status} onValueChange={row.onMove}>
          <SelectTrigger className="h-7 border-transparent bg-transparent px-1.5 text-[12px] hover:bg-slate-100 hover:border-slate-200 focus:ring-0 shadow-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {columns.map((c) => (
              <SelectItem key={c.id} value={c.id} className="text-xs">
                <span className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", c.color?.replace("text-", "bg-") || "bg-slate-400")} />
                  {c.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    ),
    responsavel: (
      <div onClick={stop}>
        <Select value={lead.assignedTo ? String(lead.assignedTo) : "none"} onValueChange={(v) => row.onAssign(v === "none" ? null : Number(v))}>
          <SelectTrigger className="h-7 border-transparent bg-transparent px-1.5 text-[12px] hover:bg-slate-100 hover:border-slate-200 focus:ring-0 shadow-none">
            <span className="flex items-center gap-1.5 min-w-0">
              <Avatar user={responsible} size="xs" />
              <span className={cn("truncate", !responsible && "text-amber-700")}>{responsible ? firstName(responsible.name) : "Atribuir"}</span>
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none" className="text-xs text-amber-700">Não atribuído</SelectItem>
            {staff.map((u) => <SelectItem key={u.id} value={String(u.id)} className="text-xs">{u.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    ),
    ultima: <div className="text-[12px] text-slate-600" title={fullDateTime(activity.lastInteraction)}>{shortRelative(activity.lastInteraction)}</div>,
    proxima: activity.next ? (
      <div className="min-w-0" title={`${activity.next.label} · ${fullDateTime(activity.next.date)}`}>
        <div className={cn("text-[12px] tabular-nums", nextOverdue ? "text-rose-700 font-medium" : "text-slate-700")}>{shortRelative(activity.next.date)}</div>
        <div className="truncate text-[11px] text-slate-400">{activity.next.label}</div>
      </div>
    ) : <span className="text-[12px] text-slate-300">—</span>,
    prioridade: (
      <span className={cn("inline-flex items-center gap-1.5 text-[12px]", meta.text)}>
        <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />{meta.label}
      </span>
    ),
    origem: <div className="truncate text-[12px] text-slate-600">{lead.source || "Direto"}</div>,
    acoes: (
      <div className="flex items-center justify-end gap-0.5" onClick={stop}>
        <IconLink href={wa} title="WhatsApp" external><MessageCircle className="h-3.5 w-3.5 text-emerald-600" /></IconLink>
        <IconLink href={tel} title={contact?.phone ? `Ligar ${contact.phone}` : "Sem telefone"}><Phone className="h-3.5 w-3.5" /></IconLink>
        <IconButton title={lead.reminderDate ? "Gerenciar retorno" : "Agendar retorno"} onClick={row.onReminder}>
          <Bell className={cn("h-3.5 w-3.5", lead.reminderDate && !lead.reminderSent && "text-amber-600 fill-amber-500/20")} />
        </IconButton>
        <IconButton title="Editar" onClick={row.onEdit}><Edit2 className="h-3.5 w-3.5" /></IconButton>
        <LeadActionsMenu {...row} />
      </div>
    ),
  };

  return (
    <div
      role="row"
      onClick={row.onOpen}
      className="grid items-center gap-3 border-b border-slate-100 px-3 h-11 cursor-pointer hover:bg-slate-50/80 transition-colors"
      style={{ gridTemplateColumns: grid }}
    >
      {visible.map((id) => <div key={id} className="min-w-0">{cell[id]}</div>)}
    </div>
  );
}

function IconLink({ href, title, external, children }: { href: string | null; title: string; external?: boolean; children: React.ReactNode }) {
  if (!href) {
    return <span title={title} className="h-7 w-7 inline-flex items-center justify-center rounded-md text-slate-300 cursor-not-allowed">{children}</span>;
  }
  return (
    <a href={href} title={title} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}
      className="h-7 w-7 inline-flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900">
      {children}
    </a>
  );
}
function IconButton({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" title={title} onClick={onClick} className="h-7 w-7 inline-flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900">
      {children}
    </button>
  );
}
