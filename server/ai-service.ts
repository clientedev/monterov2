import Groq from "groq-sdk";
import { storage } from "./storage";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `Você é a Carol, assistente virtual oficial e especialista da Monteiro Seguros & Benefícios.
Você ajuda clientes com planos de saúde (PME e familiares), seguros de vida, odontológicos e patrimoniais.
Regras:
1. Seja sempre acolhedora, humana, elegante, profissional e direta.
2. Responda em português do Brasil com naturalidade e texto generativo dinâmico de alta qualidade.
3. Tire dúvidas com clareza e convide o cliente a solicitar uma cotação rápida.`;

/**
 * Strategy 1: Official Google Gemini 1.5 / 2.0 Flash (Free Tier)
 */
async function tryGeminiLLM(messages: ChatMessage[], res?: any): Promise<boolean> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey || !apiKey.trim()) return false;

  const cleanKey = apiKey.trim();
  const cleanMessages = messages.filter(m => m && m.content && m.content.trim());

  const contents = cleanMessages.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content.trim() }]
  }));

  const models = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"];

  for (const model of models) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: SYSTEM_PROMPT }]
          },
          contents: contents.length > 0 ? contents : [{ role: "user", parts: [{ text: "Olá" }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800
          }
        })
      });

      if (response.ok) {
        const data: any = await response.json();
        const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (replyText && replyText.trim()) {
          if (res) {
            res.setHeader("Content-Type", "text/plain; charset=utf-8");
            res.write(replyText.trim());
            res.end();
          }
          return true;
        }
      }
    } catch (err: any) {
      console.warn(`[AI Engine] Gemini API model ${model} error:`, err.message || err);
    }
  }

  return false;
}

/**
 * Todoist NLP Task Parser using Gemini Flash Free Tier
 */
export async function parseTaskWithGemini(text: string): Promise<any | null> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey || !apiKey.trim()) return null;

  const cleanKey = apiKey.trim();
  const todayStr = new Date().toISOString().split("T")[0];

  const prompt = `Você é um assistente de IA especialista em extrair dados de tarefas para o CRM Todoist.
Data atual de hoje para referência: ${todayStr}.
Texto informado pelo usuário: "${text}"

Extraia os campos em um JSON VÁLIDO E ESTRITO (sem marcadores de código markdown, apenas o objeto JSON puro):
{
  "title": "título limpo e objetivo da tarefa",
  "priority": "P1" ou "P2" ou "P3" ou "P4",
  "dueDate": "YYYY-MM-DD" (ou null se não for informada nenhuma data),
  "dueTime": "HH:mm" (ou null se não for informado nenhum horário),
  "contactName": "nome da pessoa ou cliente citado no texto, se houver" (ou null)
}`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${cleanKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
      })
    });

    if (response.ok) {
      const data: any = await response.json();
      const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawJson) {
        const cleanedJson = rawJson.replace(/```json|```/g, "").trim();
        return JSON.parse(cleanedJson);
      }
    }
  } catch (err: any) {
    console.warn("[Gemini Task Interpreter] Failed to parse task with Gemini:", err.message || err);
  }

  return null;
}

/**
 * Strategy 2: Universal Cloud LLM (Groq / xAI Grok / OpenAI)
 */
async function tryUniversalCloudLLM(messages: ChatMessage[], res?: any): Promise<boolean> {
  const apiKey = process.env.GROQ_API_KEY || 
                 process.env.GROQ_KEY || 
                 process.env.XAI_API_KEY || 
                 process.env.GROK_API_KEY || 
                 process.env.OPENAI_API_KEY || 
                 process.env.AI_API_KEY;

  if (!apiKey || !apiKey.trim()) return false;

  const cleanKey = apiKey.trim();
  const cleanMessages = messages
    .filter(m => m && m.content && m.content.trim())
    .map(m => ({
      role: m.role === "assistant" ? "assistant" : m.role === "system" ? "system" : "user",
      content: m.content.trim()
    }));

  const formattedMessages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...cleanMessages
  ];

  // A. Check if it's an xAI Grok key (starts with xai-)
  if (cleanKey.startsWith("xai-") || process.env.XAI_API_KEY || process.env.GROK_API_KEY) {
    try {
      const response = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${cleanKey}`
        },
        body: JSON.stringify({
          model: "grok-beta",
          messages: formattedMessages,
          temperature: 0.7,
          stream: false
        })
      });

      if (response.ok) {
        const data: any = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content && content.trim()) {
          if (res) {
            res.setHeader("Content-Type", "text/plain; charset=utf-8");
            res.write(content);
            res.end();
          }
          return true;
        }
      }
    } catch (err: any) {
      console.warn("[AI Engine] xAI Grok API error:", err.message || err);
    }
  }

  // B. Check Groq SDK (gsk_ or generic key)
  try {
    const groq = new Groq({ apiKey: cleanKey });
    const GROQ_MODELS = [
      "llama-3.3-70b-versatile",
      "llama-3.1-8b-instant",
      "llama3-70b-8192",
      "mixtral-8x7b-32768"
    ];

    for (const model of GROQ_MODELS) {
      try {
        const stream = await groq.chat.completions.create({
          messages: formattedMessages as any,
          model,
          temperature: 0.7,
          max_tokens: 600,
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
      } catch (err: any) {
        // try next model
      }
    }
  } catch (err: any) {
    console.warn("[AI Engine] Groq SDK error:", err.message || err);
  }

  return false;
}

/**
 * Strategy 2: Free Public Cloud LLM (Generative Llama 3.3 Engine with Zero API Key needed)
 */
async function tryFreeCloudGenerativeLLM(messages: ChatMessage[], res?: any): Promise<boolean> {
  try {
    const cleanMessages = messages
      .filter(m => m && m.content && m.content.trim())
      .map(m => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content.trim()
      }));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const response = await fetch("https://text.pollinations.ai/openai/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: "llama",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...cleanMessages
        ],
        temperature: 0.7
      })
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data: any = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content && content.trim()) {
        if (res) {
          res.setHeader("Content-Type", "text/plain; charset=utf-8");
          res.write(content.trim());
          res.end();
        }
        return true;
      }
    }
  } catch (error: any) {
    console.info("[AI Engine] Free Public LLM timeout or offline, skipping to local/database.");
  }

  return false;
}

/**
 * Strategy 3: Ollama Local (Offline Machine)
 */
async function tryOllama(messages: ChatMessage[], res?: any): Promise<boolean> {
  const host = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";
  const candidateModels = ["llama3.3", "llama3", "llama2", "qwen2.5", "mistral"];

  const cleanMessages = messages
    .filter(m => m && m.content && m.content.trim())
    .map(m => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content.trim()
    }));

  for (const model of candidateModels) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`${host}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          messages: [{ role: "system", content: SYSTEM_PROMPT }, ...cleanMessages],
          stream: false,
          options: { temperature: 0.7 }
        }),
      });

      clearTimeout(timeoutId);

      if (response.ok) {
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
      }
    } catch (error) {
      // Ignore and try next
    }
  }

  return false;
}

/**
 * Strategy 4: Dynamic Intelligent DB Fallback Engine ("Carol Local no Banco")
 */
async function runSmartDatabaseFallback(messages: ChatMessage[], res?: any): Promise<void> {
  const userMessages = messages.filter(m => m.role === "user");
  const lastUserMsg = userMessages[userMessages.length - 1]?.content || "";
  const query = lastUserMsg.toLowerCase().trim();

  let siteName = "Monteiro Seguros & Benefícios";
  let phone = "(11) 99999-9999";
  let email = "contato@monteiroseguros.com.br";
  let address = "São Paulo, SP";
  let serviceTitles: string[] = [];

  try {
    const [services, settings] = await Promise.all([
      storage.getServices().catch(() => []),
      storage.getSiteSettings().catch(() => null),
    ]);

    if (settings) {
      if (settings.siteName) siteName = settings.siteName;
      if (settings.contactPhone) phone = settings.contactPhone;
      if (settings.contactEmail) email = settings.contactEmail;
      if (settings.address) address = settings.address;
    }
    if (services.length > 0) {
      serviceTitles = services.map(s => s.title);
    }
  } catch (e) {}

  const greetings = [
    `Olá! Sou a Carol da ${siteName}. `,
    `Oi! Que ótimo falar com você. `,
    `Com certeza! É um prazer te atender. `,
  ];
  const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];

  let replyBody = "";

  if (/saúde|plano|médico|hospital|convênio|bradesco|porto|sulamérica|amil|omint|pme/.test(query)) {
    replyBody = `Na ${siteName}, oferecemos consultoria especializada em **Planos de Saúde** individuais e corporativos (Porto Seguro, Bradesco, Amil, SulAmérica, etc).\n\nVocê deseja uma cotação para sua **empresa** ou para sua **família**? Nos chame no WhatsApp ${phone} para atendermos você imediatamente!`;
  } else if (/vida|seguro de vida|cobertura/.test(query)) {
    replyBody = `O **Seguro de Vida** da ${siteName} oferece tranquilidade e proteção financeira completa para você e sua família.\n\nGostaria de receber uma simulação no seu e-mail (${email}) ou WhatsApp (${phone})?`;
  } else if (/preço|quanto custa|valor|cotação|cotar|orçamento/.test(query)) {
    replyBody = `Para entregarmos uma **cotação exata com valores e opções**, precisamos apenas de algumas informações simples.\n\nFale conosco diretamente pelo WhatsApp ${phone} ou nos informe seu telefone aqui no chat!`;
  } else if (/contato|telefone|whatsapp|falar|atendimento|e-mail/.test(query)) {
    replyBody = `Você pode falar diretamente com nossa equipe:\n- 📞 **WhatsApp / Telefone**: ${phone}\n- ✉️ **E-mail**: ${email}\n- 📍 **Endereço**: ${address}`;
  } else {
    replyBody = `Para respondermos melhor a sua dúvida sobre "${lastUserMsg}", nossa equipe está pronta para te atender no WhatsApp ${phone} ou pelo e-mail ${email}. Como podemos te ajudar hoje?`;
  }

  const fullText = randomGreeting + replyBody;

  if (res) {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.write(fullText);
    res.end();
  }
}

/**
 * Multi-Tier Generative AI Processor
 */
export async function processAiChat(messages: ChatMessage[], res: any) {
  // 1. Primary: Google Gemini 1.5/2.0 Flash (Free Tier API Key)
  const geminiSuccess = await tryGeminiLLM(messages, res);
  if (geminiSuccess) return;

  // 2. Secondary: Universal Cloud API (Groq / xAI Grok / OpenAI API keys if set)
  const universalSuccess = await tryUniversalCloudLLM(messages, res);
  if (universalSuccess) return;

  // 3. Free Cloud Generative Engine (Llama 3.3 Public Generative Model - Zero Key needed!)
  const freeCloudSuccess = await tryFreeCloudGenerativeLLM(messages, res);
  if (freeCloudSuccess) return;

  // 4. Local Ollama (if running on user machine)
  const ollamaSuccess = await tryOllama(messages, res);
  if (ollamaSuccess) return;

  // 5. Intelligent Database Fallback
  await runSmartDatabaseFallback(messages, res);
}
