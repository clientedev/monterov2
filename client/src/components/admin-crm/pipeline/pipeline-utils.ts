import type { Lead } from "@shared/schema";

export type PipelineView = "compact" | "list" | "ultra";

export const PIPELINE_VIEWS: { id: PipelineView; label: string; hint: string }[] = [
  { id: "compact", label: "Compacto", hint: "Kanban com cards enxutos" },
  { id: "list", label: "Lista", hint: "Tabela com ordenação e colunas configuráveis" },
  { id: "ultra", label: "Ultra", hint: "Máxima densidade: uma linha por oportunidade" },
];

/** Preferência salva por usuário e por dispositivo (localStorage). */
export function loadPref<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
export function savePref(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* modo privado / armazenamento bloqueado: segue sem persistir */
  }
}

/** "R$ 3.800,00", "3.800,00", "3800", "3800.5" -> número */
export function parseBRL(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return isFinite(value) ? value : 0;
  let s = String(value).replace(/[^\d,.-]/g, "");
  if (!s) return 0;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  else if ((s.match(/\./g) || []).length > 1) s = s.replace(/\./g, "");
  else if (/\.\d{3}$/.test(s)) s = s.replace(".", "");
  const n = parseFloat(s);
  return isFinite(n) ? n : 0;
}

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });
const brlShort = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 });

/** Valor curto para o modo ultra: "R$ 950", "R$ 3,8 mil", "R$ 1,2 mi" */
export function formatBRLShort(n: number): string {
  if (!n) return "—";
  if (n >= 1_000_000) return `R$ ${(n / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi`;
  if (n >= 1000) return `R$ ${(n / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`;
  return `R$ ${Math.round(n)}`;
}

export function formatBRL(n: number, compact = false): string {
  if (!n) return compact ? "—" : "Sob consulta";
  return compact && n >= 10000 ? brlShort.format(n) : brl.format(n);
}

/** Valor exibido no card: usa o texto salvo, igual ao comportamento anterior. */
export function leadValueLabel(lead: Lead): string {
  const n = parseBRL(lead.value);
  return n ? brl.format(n) : "Sob consulta";
}

export function initials(name?: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return ((parts[0][0] || "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function firstName(name?: string | null): string {
  return name ? name.trim().split(/\s+/)[0] : "";
}

const DAY = 24 * 60 * 60 * 1000;

/** "hoje", "ontem", "há 3d", "12/11" */
export function shortRelative(date?: string | Date | null): string {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  const today = new Date();
  const a = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const b = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((a - b) / DAY);
  if (diff === 0) return "hoje";
  if (diff === 1) return "ontem";
  if (diff === -1) return "amanhã";
  if (diff > 1 && diff < 7) return `há ${diff}d`;
  if (diff < -1 && diff > -7) return `em ${-diff}d`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", ...(d.getFullYear() !== today.getFullYear() ? { year: "2-digit" } : {}) });
}

export function fullDateTime(date?: string | Date | null): string {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export type Urgency = "alta" | "media" | "normal";

export interface LeadActivity {
  /** Data da última interação registrada com o contato (ou criação da oportunidade). */
  lastInteraction: Date | null;
  /** Tarefas em aberto ligadas à oportunidade ou ao contato. */
  openTasks: { id: number; title: string; dueDate: string | null }[];
  /** Próxima atividade: retorno agendado ou tarefa com vencimento mais próximo. */
  next: { label: string; date: Date } | null;
  urgency: Urgency;
}

export const URGENCY_META: Record<Urgency, { label: string; dot: string; text: string; rank: number }> = {
  alta: { label: "Alta", dot: "bg-rose-500", text: "text-rose-700", rank: 3 },
  media: { label: "Média", dot: "bg-amber-400", text: "text-amber-700", rank: 2 },
  normal: { label: "Normal", dot: "bg-slate-300", text: "text-slate-500", rank: 1 },
};

/**
 * A prioridade não existe como campo no banco; ela é calculada a partir do que já existe:
 * retorno ao cliente atrasado ou tarefa vencida = Alta; retorno/tarefa para hoje ou amanhã = Média.
 */
export function computeActivity(
  lead: Lead,
  interactionsByContact: Map<number, Date>,
  tasks: { id: number; title: string; status: string; dueDate: string | null; leadId: number | null; contactId: number | null }[],
): LeadActivity {
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const endTomorrow = startToday + 2 * DAY;

  const lastInt = interactionsByContact.get(lead.contactId) || null;
  const created = lead.createdAt ? new Date(lead.createdAt) : null;
  const lastInteraction = lastInt && created ? (lastInt > created ? lastInt : created) : lastInt || created;

  const openTasks = tasks
    .filter((t) => t.status !== "done" && t.status !== "cancelled" && (t.leadId === lead.id || (!t.leadId && t.contactId === lead.contactId)))
    .map((t) => ({ id: t.id, title: t.title, dueDate: t.dueDate }));

  const candidates: { label: string; date: Date }[] = [];
  if (lead.reminderDate && !lead.reminderSent) candidates.push({ label: "Retorno ao cliente", date: new Date(lead.reminderDate) });
  for (const t of openTasks) if (t.dueDate) candidates.push({ label: t.title, date: new Date(t.dueDate) });
  candidates.sort((a, b) => a.date.getTime() - b.date.getTime());
  const next = candidates[0] || null;

  let urgency: Urgency = "normal";
  for (const c of candidates) {
    const t = c.date.getTime();
    if (t < startToday || (c.label === "Retorno ao cliente" && t < now.getTime())) { urgency = "alta"; break; }
    if (t < endTomorrow) urgency = "media";
  }
  return { lastInteraction, openTasks, next, urgency };
}

export function whatsappUrl(phone?: string | null): string | null {
  const d = String(phone || "").replace(/\D/g, "");
  if (d.length < 10) return null;
  return `https://wa.me/${d.startsWith("55") ? d : "55" + d}`;
}
export function telUrl(phone?: string | null): string | null {
  const d = String(phone || "").replace(/\D/g, "");
  return d.length >= 8 ? `tel:+${d.startsWith("55") ? d : "55" + d}` : null;
}

/** Mesmo critério de coluna usado antes: status igual (sem diferenciar maiúsculas) ou fallback na 1ª coluna. */
export function leadInColumn(lead: Lead, column: { id: string }, columns: { id: string }[], index: number): boolean {
  const st = lead.status || "";
  const direct = st === column.id || (Boolean(st) && Boolean(column.id) && st.toLowerCase() === column.id.toLowerCase());
  const unmapped =
    (st === "Ativo" || st === "ativo" || !columns.some((c) => c.id === st || (st && c.id && c.id.toLowerCase() === st.toLowerCase()))) &&
    (column.id === "new" || index === 0);
  return direct || unmapped;
}
