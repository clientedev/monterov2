import Groq from "groq-sdk";
import { storage } from "./storage";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `Você é a Carol, assistente virtual inteligente e especialista da Monteiro Seguros e Benefícios (focada em planos de saúde corporativos e familiares, seguros de vida e odontológicos).
Seu objetivo é auxiliar os clientes com extrema cordialidade, objetividade e clareza em português do Brasil.`;

/**
 * Strategy 1: Groq Cloud (Llama 3.3 70B Versatile)
 */
async function tryGroq(messages: ChatMessage[], res?: any): Promise<boolean> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return false;

  try {
    const groq = new Groq({ apiKey });
    const formattedMessages: ChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages
    ];

    const stream = await groq.chat.completions.create({
      messages: formattedMessages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.5,
      max_tokens: 512,
      stream: true,
    });

    if (res) {
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Transfer-Encoding", "chunked");
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || "";
        if (text) res.write(text);
      }
      res.end();
    }
    return true;
  } catch (error: any) {
    console.warn("[AI Engine] Groq API falhou ou está indisponível:", error.message || error);
    return false;
  }
}

/**
 * Strategy 2: Ollama Local (Offline Machine)
 */
async function tryOllama(messages: ChatMessage[], res?: any): Promise<boolean> {
  const host = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";
  const model = process.env.OLLAMA_MODEL || "llama3.3";

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s timeout for local check

    const formattedMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages
    ];

    const response = await fetch(`${host}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages: formattedMessages,
        stream: false,
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) return false;

    const data: any = await response.json();
    const content = data.message?.content;

    if (content && content.trim()) {
      if (res) {
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.write(content);
        res.end();
      }
      return true;
    }
    return false;
  } catch (error: any) {
    console.info("[AI Engine] Ollama offline ou indisponível localmente.");
    return false;
  }
}

/**
 * Strategy 3: Intelligent DB & Knowledge Base Fallback ("Carol Local Inteligente no Banco")
 */
async function runSmartDatabaseFallback(messages: ChatMessage[], res?: any): Promise<void> {
  const lastUserMsg = [...messages].reverse().find(m => m.role === "user")?.content || "";
  const query = lastUserMsg.toLowerCase();

  // Load database knowledge
  let reply = "";
  try {
    const [services, settings] = await Promise.all([
      storage.getServices().catch(() => []),
      storage.getSiteSettings().catch(() => null),
    ]);

    const siteName = settings?.siteName || "Monteiro Seguros & Benefícios";
    const phone = settings?.contactPhone || "(11) 99999-9999";
    const email = settings?.contactEmail || "contato@monteiroseguros.com.br";

    if (query.includes("saúde") || query.includes("plano") || query.includes("medico") || query.includes("hospital")) {
      reply = `Olá! Na ${siteName}, trabalhamos com os melhores planos de saúde individuais, familiares e corporativos (Porto Seguro, Bradesco, Amil, SulAmérica, Omint, entre outros). Posso agilizar uma cotação personalizada para você! Quer nos chamar pelo WhatsApp no número ${phone}?`;
    } else if (query.includes("vida") || query.includes("seguro de vida") || query.includes("acidentes")) {
      reply = `O Seguro de Vida da ${siteName} garante proteção financeira completa para você e sua família. Temos condições exclusivas para apólices individuais e empresariais! Gostaria de receber uma simulação no seu e-mail ou WhatsApp (${phone})?`;
    } else if (query.includes("contato") || query.includes("telefone") || query.includes("whatsapp") || query.includes("falar") || query.includes("atendimento")) {
      reply = `Você pode falar diretamente com nossa equipe de especialistas através do WhatsApp / Telefone ${phone} ou pelo e-mail ${email}. Estamos à disposição para ajudar!`;
    } else if (query.includes("serviço") || query.includes("opções") || query.includes("produto")) {
      const activeTitles = services.map(s => s.title).join(", ");
      reply = `A ${siteName} oferece soluções completas em corretagem: ${activeTitles || "Planos de Saúde, Seguro de Vida, Odontológico e Empresarial"}. Qual dessas áreas melhor atende sua necessidade no momento?`;
    } else if (query.includes("quem é") || query.includes("empresa") || query.includes("monteiro") || query.includes("sobre")) {
      reply = `A ${siteName} é uma corretora especializada em consultoria de saúde e seguros de alta performance, focada em cuidar do que mais importa: sua vida, sua família e sua empresa.`;
    } else {
      reply = `Olá! Sou a Carol da ${siteName}. Posso ajudar você a encontrar o plano de saúde ou seguro ideal para suas necessidades. Se preferir atendimento humano imediato, fale conosco no WhatsApp ${phone}!`;
    }
  } catch (err) {
    reply = "Olá! Sou a Carol, assistente da Monteiro Seguros & Benefícios. Como posso ajudar com seus seguros e planos de saúde hoje?";
  }

  if (res) {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.write(reply);
    res.end();
  }
}

/**
 * Unified Multi-tier AI Processor
 */
export async function processAiChat(messages: ChatMessage[], res: any) {
  // 1. Try Groq (Llama 3.3 70B Cloud)
  const groqSuccess = await tryGroq(messages, res);
  if (groqSuccess) return;

  // 2. Try Ollama (Local Machine)
  const ollamaSuccess = await tryOllama(messages, res);
  if (ollamaSuccess) return;

  // 3. Intelligent Database Fallback (Zero Failures Guarantee)
  await runSmartDatabaseFallback(messages, res);
}
