/**
 * Email Notification Service — Resend Integration
 * All CRM email notifications are handled here.
 * Failures are caught silently so CRM operations never block.
 */

import { db } from "./db";
import { emailNotificationLogs, users } from "@shared/schema";
import { eq } from "drizzle-orm";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM || "CRM Monteiro <notificacoes@monteiroseguros.com.br>";
const CRM_BASE_URL = process.env.CRM_URL || "https://monterov2.replit.app/admin";

export type EmailEventType =
  | "lead_assigned"
  | "lead_updated"
  | "lead_status_changed"
  | "task_assigned"
  | "deal_won"
  | "deal_lost";

export interface EmailNotificationPayload {
  userId: number;
  eventType: EmailEventType;
  recordType: "lead" | "task" | "contact" | "apolice";
  recordId: number;
  subject: string;
  htmlBody: string;
  skipIfNoEmail?: boolean;
}

/** Send an email via Resend API */
async function sendViaResend(to: string, subject: string, html: string): Promise<{ success: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return { success: false, error: `Resend API error ${response.status}: ${errorBody}` };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Unknown error" };
  }
}

/** Log notification attempt to database */
async function logNotification(
  userId: number | null,
  eventType: string,
  recordType: string,
  recordId: number,
  status: "sent" | "failed" | "skipped",
  errorMessage?: string
) {
  try {
    await db.insert(emailNotificationLogs).values({
      userId,
      eventType,
      recordType,
      recordId,
      status,
      errorMessage: errorMessage || null,
    });
  } catch (err) {
    // Log failure should never crash anything
    console.error("[email] Failed to write log:", err);
  }
}

/** Main function: send a CRM notification email */
export async function sendCrmNotification(payload: EmailNotificationPayload): Promise<void> {
  const { userId, eventType, recordType, recordId, subject, htmlBody } = payload;

  try {
    // Get user's email
    const [user] = await db.select({ email: users.email, name: users.name }).from(users).where(eq(users.id, userId));

    if (!user?.email) {
      await logNotification(userId, eventType, recordType, recordId, "skipped", "User has no email address");
      return;
    }

    // Send the email
    const result = await sendViaResend(user.email, subject, htmlBody);

    if (result.success) {
      await logNotification(userId, eventType, recordType, recordId, "sent");
      console.log(`[email] ✅ Sent "${eventType}" to ${user.email}`);
    } else {
      await logNotification(userId, eventType, recordType, recordId, "failed", result.error);
      console.warn(`[email] ⚠️ Failed "${eventType}" to ${user.email}: ${result.error}`);
    }
  } catch (err: any) {
    // NEVER let email errors bubble up to break CRM operations
    console.error("[email] ❌ Unexpected error in sendCrmNotification:", err);
    try {
      await logNotification(userId, eventType, recordType, recordId, "failed", err.message);
    } catch (_) { /* ignore */ }
  }
}

/** ============================================================
 * Email Template Builders
 * ============================================================ */

function baseLayout(title: string, content: string, crmLink: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#08454c,#1A3A4F);padding:32px 40px;">
            <p style="margin:0;color:rgba(255,255,255,0.7);font-size:12px;text-transform:uppercase;letter-spacing:2px;">Monteiro Seguros e Benefícios</p>
            <h1 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:700;">${title}</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            ${content}
          </td>
        </tr>

        <!-- CTA Button -->
        <tr>
          <td style="padding:0 40px 36px;" align="center">
            <a href="${crmLink}" 
               style="display:inline-block;background:#08454c;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;">
              Ver no CRM →
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">
              Esta é uma notificação automática do CRM Monteiro. Não responda este e-mail.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function infoRow(label: string, value: string): string {
  return `
  <tr>
    <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;">
      <span style="color:#64748b;font-size:13px;">${label}</span>
    </td>
    <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;text-align:right;">
      <strong style="color:#0f172a;font-size:13px;">${value}</strong>
    </td>
  </tr>`;
}

/** Build email for lead assignment */
export function buildLeadAssignedEmail(params: {
  recipientName: string;
  assignerName: string;
  clientName: string;
  leadId: number;
  product?: string;
  value?: string;
  status?: string;
}): { subject: string; html: string } {
  const { recipientName, assignerName, clientName, leadId, product, value, status } = params;
  const crmLink = `${CRM_BASE_URL}/leads`;

  const content = `
    <p style="color:#334155;font-size:15px;line-height:1.6;margin-bottom:24px;">
      Olá, <strong>${recipientName}</strong>! <br/>
      <strong>${assignerName}</strong> atribuiu uma nova oportunidade a você.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      ${infoRow("Cliente", clientName)}
      ${product ? infoRow("Produto", product) : ""}
      ${value ? infoRow("Valor Estimado", `R$ ${value}`) : ""}
      ${status ? infoRow("Etapa Atual", status) : ""}
    </table>
    <p style="color:#64748b;font-size:13px;line-height:1.6;">
      Acesse o CRM para ver todos os detalhes e acompanhar o histórico desta oportunidade.
    </p>`;

  return {
    subject: `🎯 Nova oportunidade atribuída: ${clientName}`,
    html: baseLayout("Nova Oportunidade Atribuída", content, crmLink),
  };
}

/** Build email for lead status change */
export function buildLeadStatusChangedEmail(params: {
  recipientName: string;
  changerName: string;
  clientName: string;
  leadId: number;
  oldStatus: string;
  newStatus: string;
  product?: string;
}): { subject: string; html: string } {
  const { recipientName, changerName, clientName, leadId, oldStatus, newStatus, product } = params;
  const crmLink = `${CRM_BASE_URL}/leads`;

  const content = `
    <p style="color:#334155;font-size:15px;line-height:1.6;margin-bottom:24px;">
      Olá, <strong>${recipientName}</strong>! <br/>
      <strong>${changerName}</strong> alterou o status de uma oportunidade sua.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      ${infoRow("Cliente", clientName)}
      ${product ? infoRow("Produto", product) : ""}
      ${infoRow("Status Anterior", oldStatus)}
      ${infoRow("Novo Status", `<span style="color:#08454c;font-weight:700;">${newStatus}</span>`)}
    </table>`;

  return {
    subject: `🔄 Oportunidade movida para "${newStatus}": ${clientName}`,
    html: baseLayout("Mudança de Etapa no Funil", content, crmLink),
  };
}

/** Build email for task assignment */
export function buildTaskAssignedEmail(params: {
  recipientName: string;
  assignerName: string;
  taskTitle: string;
  taskId: number;
  dueDate?: string;
  priority?: string;
  relatedRecord?: string;
}): { subject: string; html: string } {
  const { recipientName, assignerName, taskTitle, taskId, dueDate, priority, relatedRecord } = params;
  const crmLink = `${CRM_BASE_URL}/todoist`;

  const priorityLabel: Record<string, string> = { P1: "🔴 Urgente", P2: "🟠 Alta", P3: "🟡 Média", P4: "🔵 Baixa" };

  const content = `
    <p style="color:#334155;font-size:15px;line-height:1.6;margin-bottom:24px;">
      Olá, <strong>${recipientName}</strong>! <br/>
      <strong>${assignerName}</strong> atribuiu uma nova tarefa a você.
    </p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 8px;font-weight:700;font-size:16px;color:#0f172a;">${taskTitle}</p>
      ${priority ? `<span style="background:#08454c10;color:#08454c;padding:3px 10px;border-radius:6px;font-size:12px;font-weight:600;">${priorityLabel[priority] || priority}</span>` : ""}
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      ${dueDate ? infoRow("Prazo", dueDate) : ""}
      ${relatedRecord ? infoRow("Relacionado a", relatedRecord) : ""}
    </table>`;

  return {
    subject: `✅ Nova tarefa atribuída: ${taskTitle}`,
    html: baseLayout("Nova Tarefa Atribuída", content, crmLink),
  };
}
