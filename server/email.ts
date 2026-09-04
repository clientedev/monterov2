/**
 * Email Notification Service — Monteiro Seguros & Benefícios
 * Handles all email notifications with brand design, SMTP & Resend support.
 */

import { db } from "./db";
import { emailNotificationLogs, users } from "@shared/schema";
import { eq } from "drizzle-orm";
import nodemailer from "nodemailer";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM || process.env.SMTP_FROM || "Monteiro Seguros <notificacoes@monteiroseguros.com.br>";
const CRM_BASE_URL = process.env.CRM_URL || "https://monteiroseguros.com.br/admin";

export type EmailEventType =
  | "lead_assigned"
  | "lead_updated"
  | "lead_status_changed"
  | "task_assigned"
  | "deal_won"
  | "deal_lost"
  | "birthday_email"
  | "client_welcome_email"
  | "inquiry_email";

export interface EmailNotificationPayload {
  userId: number;
  eventType: EmailEventType;
  recordType: "lead" | "task" | "contact" | "apolice" | "user";
  recordId: number;
  subject: string;
  htmlBody: string;
  skipIfNoEmail?: boolean;
}

/** Get Nodemailer transporter if SMTP environment variables exist */
function getSmtpTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: process.env.SMTP_SECURE === "true" || port === 465,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
    });
  }
  return null;
}

/** Robust Email Dispatcher: Tries SMTP first, then Resend API, with fallback */
export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; error?: string }> {
  const { to, subject, html } = params;

  if (!to || !to.includes("@")) {
    return { success: false, error: "E-mail de destino inválido." };
  }

  // 1. Try Nodemailer SMTP if configured
  const smtpTransporter = getSmtpTransporter();
  if (smtpTransporter) {
    try {
      const from = process.env.SMTP_FROM || process.env.SMTP_USER || FROM_EMAIL;
      await smtpTransporter.sendMail({
        from,
        to,
        subject,
        html,
      });
      console.log(`[email] ✅ E-mail enviado com sucesso via SMTP para ${to}`);
      return { success: true };
    } catch (err: any) {
      console.error(`[email] ⚠️ Falha no envio via SMTP (${to}):`, err.message);
    }
  }

  // 2. Try Resend API if API Key is set
  if (RESEND_API_KEY) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [to],
          subject,
          html,
        }),
      });

      if (response.ok) {
        console.log(`[email] ✅ E-mail enviado com sucesso via Resend API para ${to}`);
        return { success: true };
      }

      const errorText = await response.text();
      console.warn(`[email] ⚠️ Resend API retornou erro (${response.status}): ${errorText}`);

      // Fallback for testing/unverified domain accounts on Resend
      if (errorText.includes("onboarding@resend.dev") || errorText.includes("domain") || errorText.includes("validation_error")) {
        console.log(`[email] 🔄 Tentando envio via Resend Fallback (onboarding@resend.dev)...`);
        const fallbackRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Monteiro Seguros <onboarding@resend.dev>",
            to: [to],
            subject,
            html,
          }),
        });

        if (fallbackRes.ok) {
          console.log(`[email] ✅ E-mail enviado via Resend Fallback para ${to}`);
          return { success: true };
        }
      }

      return { success: false, error: `Resend API Error: ${errorText}` };
    } catch (err: any) {
      console.error(`[email] ⚠️ Erro inesperado na Resend API (${to}):`, err.message);
    }
  }

  const errMessage = "Credenciais de e-mail não configuradas no servidor (defina SMTP_USER/SMTP_PASS ou RESEND_API_KEY em .env).";
  console.warn(`[email] ⚠️ ${errMessage}`);
  return { success: false, error: errMessage };
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
    console.error("[email] Failed to write log:", err);
  }
}

/** Main function: send a CRM notification email */
export async function sendCrmNotification(payload: EmailNotificationPayload): Promise<void> {
  const { userId, eventType, recordType, recordId, subject, htmlBody } = payload;

  try {
    const [user] = await db.select({ email: users.email, name: users.name }).from(users).where(eq(users.id, userId));

    if (!user?.email) {
      await logNotification(userId, eventType, recordType, recordId, "skipped", "User has no email address");
      return;
    }

    const result = await sendEmail({ to: user.email, subject, html: htmlBody });

    if (result.success) {
      await logNotification(userId, eventType, recordType, recordId, "sent");
    } else {
      await logNotification(userId, eventType, recordType, recordId, "failed", result.error);
    }
  } catch (err: any) {
    console.error("[email] ❌ Unexpected error in sendCrmNotification:", err);
    try {
      await logNotification(userId, eventType, recordType, recordId, "failed", err.message);
    } catch (_) { /* ignore */ }
  }
}

/** ============================================================
 * Official Brand HTML Email Template System
 * Monteiro Seguros & Benefícios Visual Guidelines:
 * Navy (#0F172A), Teal (#08454C), Emerald (#059669 / #10B981)
 * ============================================================ */

export function baseLayout(params: {
  title: string;
  badge?: string;
  content: string;
  buttonUrl?: string;
  buttonText?: string;
}): string {
  const { title, badge, content, buttonUrl, buttonText } = params;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F8FAFC; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #FFFFFF; border-radius: 24px; overflow: hidden; box-shadow: 0 12px 40px rgba(15, 23, 42, 0.08); border: 1px solid #E2E8F0;">
          
          <!-- BRAND HEADER WITH LOGO -->
          <tr>
            <td style="background: linear-gradient(135deg, #0F172A 0%, #08454C 100%); padding: 36px 40px 32px; text-align: center; border-bottom: 4px solid #10B981;">
              <table align="center" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td align="center">
                    <div style="background: rgba(255, 255, 255, 0.12); border: 1px solid rgba(255, 255, 255, 0.22); border-radius: 50px; padding: 8px 24px; display: inline-block; margin-bottom: 12px;">
                      <span style="color: #FFFFFF; font-size: 16px; font-weight: 800; font-family: Arial, sans-serif; text-transform: uppercase; letter-spacing: 1px;">
                        🛡️ MONTEIRO <span style="color: #10B981;">SEGUROS</span>
                      </span>
                    </div>
                    <div style="color: #94A3B8; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 3px; font-family: Arial, sans-serif;">
                      SEGUROS & BENEFÍCIOS
                    </div>
                  </td>
                </tr>
              </table>

              <h1 style="margin: 20px 0 0; color: #FFFFFF; font-size: 22px; font-weight: 800; line-height: 1.3; font-family: Arial, sans-serif;">
                ${title}
              </h1>
              ${badge ? `<div style="margin-top: 10px;"><span style="background: rgba(16, 185, 129, 0.15); color: #34D399; font-size: 12px; font-weight: 700; padding: 4px 14px; border-radius: 20px; border: 1px solid rgba(16, 185, 129, 0.3); display: inline-block;">${badge}</span></div>` : ""}
            </td>
          </tr>

          <!-- MAIN CONTENT -->
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>

          <!-- CALL TO ACTION BUTTON (IF PROVIDED) -->
          ${buttonUrl && buttonText ? `
          <tr>
            <td style="padding: 0 40px 40px;" align="center">
              <a href="${buttonUrl}" target="_blank" 
                 style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #10B981 100%); color: #FFFFFF; text-decoration: none; padding: 16px 36px; border-radius: 14px; font-weight: 800; font-size: 15px; font-family: Arial, sans-serif; box-shadow: 0 8px 20px rgba(16, 185, 129, 0.25); border: 1px solid #059669;">
                ${buttonText}
              </a>
            </td>
          </tr>` : ""}

          <!-- BRAND FOOTER -->
          <tr>
            <td style="background-color: #0F172A; padding: 32px 40px; text-align: center; border-top: 1px solid #1E293B;">
              <p style="margin: 0 0 6px; color: #FFFFFF; font-size: 14px; font-weight: 800; font-family: Arial, sans-serif;">
                Monteiro Seguros & Benefícios
              </p>
              <p style="margin: 0 0 16px; color: #94A3B8; font-size: 12px; line-height: 1.5; font-family: Arial, sans-serif;">
                Protegendo o que mais importa para você, sua família e sua empresa.
              </p>
              <div style="margin-bottom: 20px;">
                <a href="https://monteiroseguros.com.br" target="_blank" style="color: #10B981; text-decoration: none; font-size: 12px; font-weight: 700; margin: 0 8px; font-family: Arial, sans-serif;">monteiroseguros.com.br</a>
                <span style="color: #475569;">&bull;</span>
                <a href="mailto:contato@monteiroseguros.com.br" style="color: #10B981; text-decoration: none; font-size: 12px; font-weight: 700; margin: 0 8px; font-family: Arial, sans-serif;">contato@monteiroseguros.com.br</a>
              </div>
              <p style="margin: 0; color: #64748B; font-size: 11px; font-family: Arial, sans-serif;">
                © ${new Date().getFullYear()} Monteiro Corretora de Seguros. Todos os direitos reservados.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function infoRow(label: string, value: string): string {
  return `
  <tr>
    <td style="padding: 10px 0; border-bottom: 1px solid #F1F5F9;">
      <span style="color: #64748B; font-size: 13px; font-family: Arial, sans-serif;">${label}</span>
    </td>
    <td style="padding: 10px 0; border-bottom: 1px solid #F1F5F9; text-align: right;">
      <strong style="color: #0F172A; font-size: 13px; font-family: Arial, sans-serif;">${value}</strong>
    </td>
  </tr>`;
}

/** Build email for client welcome and first login account setup */
export async function sendClientWelcomeEmail(params: {
  clientName: string;
  email: string;
  setupUrl: string;
}): Promise<{ success: boolean; error?: string }> {
  const { clientName, email, setupUrl } = params;

  const content = `
    <div style="text-align: left;">
      <p style="color: #1E293B; font-size: 16px; line-height: 1.6; margin: 0 0 16px; font-weight: 700;">
        Olá, ${clientName}! 👋
      </p>
      <p style="color: #334155; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
        Sua conta de cliente na <strong>Monteiro Seguros & Benefícios</strong> foi gerada com sucesso!
      </p>
      <p style="color: #334155; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
        A partir de agora, você possui um portal exclusivo onde poderá visualizar com total comodidade:
      </p>

      <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px; padding: 20px; margin-bottom: 28px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 6px 0; color: #0F172A; font-weight: 700; font-size: 14px;">
              📄 Suas Apólices e Contratos de Seguro
            </td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #0F172A; font-weight: 700; font-size: 14px;">
              📁 Documentos, Arquivos e PDF de Propostas
            </td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #0F172A; font-weight: 700; font-size: 14px;">
              💼 Produtos e Ramos Contratados
            </td>
          </tr>
        </table>
      </div>

      <div style="background-color: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 16px; padding: 20px; margin-bottom: 28px; text-align: center;">
        <p style="margin: 0 0 8px; font-weight: 800; font-size: 15px; color: #065F46;">
          🔑 Ative sua Conta e Escolha sua Senha
        </p>
        <p style="margin: 0; font-size: 13px; color: #047857; line-height: 1.5;">
          Clique no botão verde abaixo para escolher sua nova senha e acessar a Área do Cliente:
        </p>
      </div>
    </div>`;

  const subject = `🔑 Ativação de Conta — Monteiro Seguros & Benefícios`;
  const html = baseLayout({
    title: "Seja Bem-Vindo(a)!",
    badge: "Área do Cliente",
    content,
    buttonUrl: setupUrl,
    buttonText: "Criar Minha Senha de Acesso →",
  });

  const res = await sendEmail({ to: email, subject, html });
  await logNotification(null, "client_welcome_email", "user", 0, res.success ? "sent" : "failed", res.error);
  return res;
}

/** Build commemorative birthday email */
export function buildBirthdayEmail(params: {
  recipientName: string;
  age?: number | null;
}): { subject: string; html: string } {
  const { recipientName, age } = params;

  const content = `
    <div style="text-align: center; padding: 10px 0;">
      <div style="font-size: 52px; margin-bottom: 16px;">🎉 🎂 🎈</div>
      <h2 style="color: #08454C; font-size: 24px; margin-bottom: 16px; font-weight: 800;">
        Feliz Aniversário, ${recipientName}!
      </h2>
      <p style="color: #334155; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
        Em nome de toda a equipe da <strong>Monteiro Seguros & Benefícios</strong>, desejamos a você um dia repleto de alegrias, saúde, paz e muitas realizações! ${age ? `Parabéns pelos seus <strong>${age} anos</strong>!` : ""}
      </p>
      <p style="color: #64748B; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
        Agradecemos imensamente por sua parceria e confiança em nosso trabalho. É um privilégio enorme tê-lo(a) conosco!
      </p>
      <div style="background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 16px; padding: 18px; margin-bottom: 24px;">
        <p style="margin: 0; color: #047857; font-weight: 700; font-size: 14px;">
          ✨ Monteiro Seguros &bull; Protegendo o que mais importa para você.
        </p>
      </div>
    </div>`;

  return {
    subject: `🎂 Feliz Aniversário, ${recipientName}! ✨ Monteiro Seguros`,
    html: baseLayout({
      title: `Feliz Aniversário! 🎉`,
      badge: "Dia Especial",
      content,
      buttonUrl: "https://monteiroseguros.com.br",
      buttonText: "Visitar Monteiro Seguros →",
    }),
  };
}

/** Send birthday email directly to a contact */
export async function sendBirthdayEmailToContact(email: string, name: string, age?: number | null): Promise<{ success: boolean; error?: string }> {
  const { subject, html } = buildBirthdayEmail({ recipientName: name, age });
  const res = await sendEmail({ to: email, subject, html });
  await logNotification(null, "birthday_email", "contact", 0, res.success ? "sent" : "failed", res.error);
  return res;
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
  const { recipientName, assignerName, clientName, product, value, status } = params;

  const content = `
    <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
      Olá, <strong>${recipientName}</strong>! <br/>
      <strong>${assignerName}</strong> atribuiu uma nova oportunidade de negócio a você.
    </p>
    <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${infoRow("Cliente", clientName)}
        ${product ? infoRow("Produto", product) : ""}
        ${value ? infoRow("Valor Estimado", `R$ ${value}`) : ""}
        ${status ? infoRow("Etapa Atual", status) : ""}
      </table>
    </div>
    <p style="color: #64748B; font-size: 13px; line-height: 1.6;">
      Acesse o CRM para visualizar todos os detalhes e iniciar o atendimento ao cliente.
    </p>`;

  return {
    subject: `🎯 Nova oportunidade atribuída: ${clientName}`,
    html: baseLayout({
      title: "Nova Oportunidade Atribuída",
      badge: "Gestão de Vendas",
      content,
      buttonUrl: `${CRM_BASE_URL}/leads`,
      buttonText: "Ver Oportunidade no CRM →",
    }),
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
  const { recipientName, changerName, clientName, oldStatus, newStatus, product } = params;

  const content = `
    <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
      Olá, <strong>${recipientName}</strong>! <br/>
      <strong>${changerName}</strong> atualizou o status de uma oportunidade sua no funil.
    </p>
    <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${infoRow("Cliente", clientName)}
        ${product ? infoRow("Produto", product) : ""}
        ${infoRow("Status Anterior", oldStatus)}
        ${infoRow("Novo Status", `<span style="color: #059669; font-weight: 800;">${newStatus}</span>`)}
      </table>
    </div>`;

  return {
    subject: `🔄 Oportunidade movida para "${newStatus}": ${clientName}`,
    html: baseLayout({
      title: "Mudança de Etapa no Funil",
      badge: "Funil de Vendas",
      content,
      buttonUrl: `${CRM_BASE_URL}/leads`,
      buttonText: "Acompanhar no CRM →",
    }),
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
  const { recipientName, assignerName, taskTitle, dueDate, priority, relatedRecord } = params;
  const priorityLabel: Record<string, string> = { P1: "🔴 Urgente", P2: "🟠 Alta", P3: "🟡 Média", P4: "🔵 Baixa" };

  const content = `
    <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
      Olá, <strong>${recipientName}</strong>! <br/>
      <strong>${assignerName}</strong> atribuiu uma nova tarefa a você.
    </p>
    <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
      <p style="margin: 0 0 10px; font-weight: 800; font-size: 16px; color: #0F172A;">${taskTitle}</p>
      ${priority ? `<span style="background: #05966915; color: #059669; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 700;">${priorityLabel[priority] || priority}</span>` : ""}
    </div>
    <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${dueDate ? infoRow("Prazo Limite", dueDate) : ""}
        ${relatedRecord ? infoRow("Relacionado a", relatedRecord) : ""}
      </table>
    </div>`;

  return {
    subject: `✅ Nova tarefa atribuída: ${taskTitle}`,
    html: baseLayout({
      title: "Nova Tarefa Atribuída",
      badge: "Produtividade",
      content,
      buttonUrl: `${CRM_BASE_URL}/todoist`,
      buttonText: "Ver Tarefa no CRM →",
    }),
  };
}
