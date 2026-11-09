import { db } from "./db";
import { storage } from "./storage";
import { leads, users, contacts } from "@shared/schema";
import { eq, and, lte, isNotNull, or, isNull } from "drizzle-orm";
import { sendEmail, buildLeadReminderEmail } from "./email";

/** Format date/time to Brazilian Portuguese */
export function formatDateTimeBR(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "";
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    }).format(d);
  } catch {
    return String(dateInput);
  }
}

/** Check database for overdue or due reminders and dispatch them via email */
export async function checkAndSendDueReminders(): Promise<number> {
  const now = new Date();
  let dispatchedCount = 0;

  try {
    let dueLeads: any[] = [];

    try {
      dueLeads = await db
        .select()
        .from(leads)
        .where(
          and(
            isNotNull(leads.reminderDate),
            lte(leads.reminderDate, now),
            or(eq(leads.reminderSent, false), isNull(leads.reminderSent))
          )
        );
    } catch (dbErr: any) {
      // Fallback for storage memory / timeout
      const allLeads = await storage.getLeads();
      dueLeads = allLeads.filter(
        (l) => l.reminderDate && new Date(l.reminderDate) <= now && !l.reminderSent
      );
    }

    if (!dueLeads || dueLeads.length === 0) {
      return 0;
    }

    console.log(`[reminder-service] ⏰ Encontrados ${dueLeads.length} lembrete(s) pendente(s) para disparo.`);

    const settings = await storage.getSiteSettings();
    const fallbackEmail =
      settings?.smtpUser || process.env.NOTIFICATION_EMAIL || "contato@monteiroseguros.com.br";

    for (const lead of dueLeads) {
      try {
        const contact = lead.contactId ? await storage.getContact(lead.contactId) : null;
        const assignedUser = lead.assignedTo ? await storage.getUser(lead.assignedTo) : null;

        const targetEmail =
          lead.reminderEmail?.trim() ||
          assignedUser?.email?.trim() ||
          fallbackEmail;

        if (!targetEmail || !targetEmail.includes("@")) {
          console.warn(`[reminder-service] ⚠️ Lead #${lead.id} sem e-mail válido para envio de lembrete.`);
          // Mark sent to avoid infinite loop on unconfigured lead
          await storage.updateLead(lead.id, { reminderSent: true } as any);
          continue;
        }

        const clientName = contact?.name || `Oportunidade #${lead.id}`;
        const formattedDate = formatDateTimeBR(lead.reminderDate);

        const { subject, html } = buildLeadReminderEmail({
          recipientName: assignedUser?.name || "Equipe Monteiro",
          clientName,
          leadId: lead.id,
          reminderNote: lead.reminderNote || undefined,
          reminderDate: formattedDate,
          product: lead.product || undefined,
          value: lead.value || undefined,
          status: lead.status || undefined,
        });

        const sendResult = await sendEmail({
          to: targetEmail,
          subject,
          html,
        });

        if (sendResult.success) {
          console.log(`[reminder-service] ✅ Lembrete disparado com sucesso para ${targetEmail} (Lead #${lead.id} - ${clientName})`);
          await storage.updateLead(lead.id, { reminderSent: true } as any);
          dispatchedCount++;
        } else {
          console.error(`[reminder-service] ❌ Falha no envio para ${targetEmail} (Lead #${lead.id}):`, sendResult.error);
          // Mark as sent so it doesn't repeatedly fail every minute
          await storage.updateLead(lead.id, { reminderSent: true } as any);
        }
      } catch (itemErr: any) {
        console.error(`[reminder-service] ❌ Erro ao processar lead #${lead.id}:`, itemErr.message);
      }
    }
  } catch (err: any) {
    console.error("[reminder-service] ❌ Erro geral ao checar lembretes:", err.message);
  }

  return dispatchedCount;
}

/** Immediately send a test reminder email for a specific lead */
export async function sendTestReminderEmail(
  leadId: number,
  overrideData?: {
    reminderDate?: string | Date;
    reminderNote?: string;
    reminderEmail?: string;
  }
): Promise<{ success: boolean; targetEmail: string; message: string }> {
  const lead = await storage.getLead(leadId);
  if (!lead) {
    throw new Error("Lead não encontrado");
  }

  const contact = lead.contactId ? await storage.getContact(lead.contactId) : null;
  const assignedUser = lead.assignedTo ? await storage.getUser(lead.assignedTo) : null;
  const settings = await storage.getSiteSettings();

  const fallbackEmail =
    settings?.smtpUser || process.env.NOTIFICATION_EMAIL || "contato@monteiroseguros.com.br";

  const targetEmail =
    overrideData?.reminderEmail?.trim() ||
    lead.reminderEmail?.trim() ||
    assignedUser?.email?.trim() ||
    fallbackEmail;

  if (!targetEmail || !targetEmail.includes("@")) {
    throw new Error("Nenhum endereço de e-mail de destino configurado ou disponível.");
  }

  const clientName = contact?.name || `Oportunidade #${lead.id}`;
  const reminderDateVal = overrideData?.reminderDate || lead.reminderDate || new Date();
  const formattedDate = formatDateTimeBR(reminderDateVal);
  const reminderNote = overrideData?.reminderNote ?? lead.reminderNote ?? "Teste de disparo imediato do alarme.";

  const { subject, html } = buildLeadReminderEmail({
    recipientName: assignedUser?.name || "Equipe Monteiro",
    clientName,
    leadId: lead.id,
    reminderNote,
    reminderDate: formattedDate,
    product: lead.product || undefined,
    value: lead.value || undefined,
    status: lead.status || undefined,
  });

  const sendResult = await sendEmail({
    to: targetEmail,
    subject: `[TESTE] ${subject}`,
    html,
  });

  if (!sendResult.success) {
    throw new Error(sendResult.error || "Falha ao enviar e-mail através do serviço configurado.");
  }

  return {
    success: true,
    targetEmail,
    message: `E-mail de teste enviado com sucesso para ${targetEmail}!`,
  };
}

let schedulerTimer: NodeJS.Timeout | null = null;

/** Start background scheduler checking for due reminders every 60 seconds */
export function startReminderScheduler(): void {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
  }

  console.log("[reminder-service] 🚀 Agendador de lembretes de pipeline iniciado (checagem a cada 60s)");

  // Initial check after 5 seconds to allow DB tables and connections to settle
  setTimeout(() => {
    checkAndSendDueReminders().catch(() => {});
  }, 5000);

  // Recurring check every 60 seconds
  schedulerTimer = setInterval(() => {
    checkAndSendDueReminders().catch(() => {});
  }, 60 * 1000);
}

