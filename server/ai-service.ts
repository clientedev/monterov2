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
2. Responda em português do Brasil com naturalidade, variando o tom e sem repetir frases prontas.
3. Tire dúvidas com clareza e convide o cliente a solicitar uma cotação rápida.`;

const GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "llama3-70b-8192",
  "llama3-8b-8192",
  "mixtral-8x7b-32768"
];

/**
 * Strategy 1: Groq Cloud (Llama 3.3 70B & Models Fallback)
 */
async function tryGroq(messages: ChatMessage[], res?: any): Promise<boolean> {
  const apiKey = process.env.GROQ_API_KEY || process.env.GROQ_KEY || process.env.AI_API_KEY;
  if (!apiKey) return false;

  const groq = new Groq({ apiKey });

  // Filter out any invalid messages and construct prompt
  const cleanMessages: ChatMessage[] = messages
    .filter(m => m && m.content && m.content.trim())
    .map(m => ({
      role: m.role === "assistant" ? "assistant" : m.role === "system" ? "system" : "user",
      content: m.content.trim()
    }));

  const formattedMessages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...cleanMessages
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
    } catch (error: any) {
      console.warn(`[AI Engine] Groq modelo ${model} falhou:`, error.message || error);
    }
  }

  return false;
}

/**
 * Strategy 2: Ollama Local (Offline Machine)
 */
async function tryOllama(messages: ChatMessage[], res?: any): Promise<boolean> {
  const host = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";
  const preferredModel = process.env.OLLAMA_MODEL || "llama3.3";
  const candidateModels = [preferredModel, "llama3", "llama2", "qwen2.5", "mistral"];

  const cleanMessages = messages
    .filter(m => m && m.content && m.content.trim())
    .map(m => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content.trim()
    }));

  for (const model of candidateModels) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s per model

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
      // Ignore and try next model or fallback
    }
  }

  return false;
}

/**
 * Strategy 3: Dynamic Intelligent DB Fallback Engine ("Carol IA Local no Banco")
 * Generates rich, contextual, non-repetitive answers based on database content.
 */
async function runSmartDatabaseFallback(messages: ChatMessage[], res?: any): Promise<void> {
  const userMessages = messages.filter(m => m.role === "user");
  const lastUserMsg = userMessages[userMessages.length - 1]?.content || "";
  const query = lastUserMsg.toLowerCase().trim();

  // Load database knowledge dynamically
  let siteName = "Monteiro Seguros & Benefícios";
  let phone = "(11) 99999-9999";
  let email = "contato@monteiroseguros.com.br";
  let address = "São Paulo, SP";
  let serviceTitles: string[] = [];
  let postTitles: string[] = [];

  try {
    const [services, settings, posts] = await Promise.all([
      storage.getServices().catch(() => []),
      storage.getSiteSettings().catch(() => null),
      storage.getPosts().catch(() => []),
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
    if (posts.length > 0) {
      postTitles = posts.slice(0, 3).map(p => p.title);
    }
  } catch (e) {
    // Keep defaults
  }

  // Greetings variations
  const greetings = [
    `Olá! Sou a Carol da ${siteName}. `,
    `Oi! Que ótimo falar com você. `,
    `Com certeza! É um prazer te atender. `,
    `Olá! Como posso ajudar você hoje? `,
  ];
  const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];

  let replyBody = "";

  // Intent recognition & dynamic generation
  if (/saúde|plano|médico|hospital|convênio|bradesco|porto|sulamérica|amil|omint|pme|empresarial/.test(query)) {
    replyBody = `Na ${siteName}, somos especialistas em **Planos de Saúde** corporativos e familiares. Trabalhamos com as melhores operadoras do mercado (como Porto Seguro, Bradesco Saúde, SulAmérica, Amil e Omint) garantindo redução de custos e excelente rede credenciada.\n\nVocê busca um plano para sua **empresa (PME/Corporativo)** ou **familiar/individual**? Se preferir, fale comigo direto no WhatsApp ${phone} para um estudo comparativo sem compromisso!`;
  } 
  else if (/vida|seguro de vida|invalidez|acidente|cobertura/.test(query)) {
    replyBody = `O **Seguro de Vida** da ${siteName} oferece proteção financeira completa em casos de imprevistos, acidentes e doenças graves. Temos apólices sob medida tanto para convenções coletivas de empresas quanto para proteção de famílias.\n\nGostaria de receber uma simulação no seu e-mail (${email}) ou WhatsApp (${phone})?`;
  }
  else if (/preço|quanto custa|valor|cotação|cotar|orçamento|simulação/.test(query)) {
    replyBody = `Os valores dos planos e seguros variam de acordo com o número de vidas, faixas etárias e coberturas escolhidas.\n\nPara fazermos uma **cotação exata e com desconto especial**, você pode nos mandar uma mensagem no WhatsApp ${phone} ou deixar seu telefone aqui no chat. Retornamos em poucos minutos!`;
  }
  else if (/contato|telefone|whatsapp|falar|atendimento|suporte|ligar|e-mail|email/.test(query)) {
    replyBody = `Você pode falar diretamente com nossos consultores pelos canais:\n- 📞 **WhatsApp / Telefone**: ${phone}\n- ✉️ **E-mail**: ${email}\n- 📍 **Endereço**: ${address}\n\nEstamos prontos para te atender!`;
  }
  else if (/serviço|produtos|o que vocês fazem|opções|trabalham com/.test(query)) {
    const listStr = serviceTitles.length > 0 ? serviceTitles.join(", ") : "Planos de Saúde Corporativos e Familiares, Seguro de Vida, Seguro Odontológico e Proteção Empresarial";
    replyBody = `A ${siteName} oferece consultoria completa nas seguintes soluções:\n\n✨ **${listStr}**\n\nQual dessas soluções você gostaria de conhecer melhor?`;
  }
  else if (/empresa|monteiro|quem é|sobre|história|corretora/.test(query)) {
    replyBody = `A **${siteName}** é uma corretora especializada em consultoria de alta performance em seguros e benefícios. Atuamos como parceiros estratégicos para empresas na retenção de talentos e gestão de benefícios, e para famílias no cuidado com a saúde e proteção patrimonial.`;
  }
  else if (/notícia|blog|post|artigo|dica/.test(query)) {
    const postsStr = postTitles.length > 0 ? `Confira nossas últimas matérias:\n- ${postTitles.join("\n- ")}` : "Temos artigos atualizados sobre gestão de benefícios e saúde preventiva.";
    replyBody = `No blog da ${siteName}, compartilhamos guias e novidades sobre o mercado de seguros.\n\n${postsStr}\n\nAcesse a aba Blog no menu principal para ler na íntegra!`;
  }
  else if (/obrigado|valeu|tchau|obrigada|agradeço|ok/.test(query)) {
    const thanks = [
      `Imagina! Estou sempre por aqui se precisar de mais informações. Tenha um excelente dia!`,
      `Por nada! Qualquer dúvida sobre seguros ou planos de saúde, conte comigo e com a equipe da ${siteName}.`,
      `À disposição! Se quiser cotar algo mais tarde, estamos no WhatsApp ${phone}. Um grande abraço!`
    ];
    replyBody = thanks[Math.floor(Math.random() * thanks.length)];
  }
  else if (/oi|olá|boa tarde|bom dia|boa noite|carol/.test(query)) {
    replyBody = `Tudo ótimo! Como posso te ajudar hoje com seguros, planos de saúde ou benefícios para você ou sua empresa?`;
  }
  else {
    // Dynamic context-aware default response
    const variations = [
      `Entendi a sua dúvida sobre "${lastUserMsg}". Na ${siteName}, oferecemos consultoria personalizada em planos de saúde, seguros de vida e odontológicos.\n\nPosso agilizar uma cotação sob medida para você! Quer tirar mais dúvidas ou chamar nossa equipe no WhatsApp ${phone}?`,
      `Excelente questão. Para te responder com precisão sobre "${lastUserMsg}", nossa equipe pode analisar o seu perfil de forma detalhada.\n\nFale conosco pelo WhatsApp ${phone} ou pelo e-mail ${email}. Qual o melhor horário para entrarmos em contato?`,
      `Na ${siteName}, estamos prontos para ajudar com qualquer solicitação relacionada a proteção familiar ou empresarial.\n\nSe quiser uma simulação de planos de saúde ou seguros, nos chame no WhatsApp ${phone}. Como posso te auxiliar melhor agora?`
    ];
    replyBody = variations[Math.floor(Math.random() * variations.length)];
  }

  const fullText = randomGreeting + replyBody;

  if (res) {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.write(fullText);
    res.end();
  }
}

/**
 * Unified Multi-tier AI Processor
 */
export async function processAiChat(messages: ChatMessage[], res: any) {
  // 1. Try Groq (Llama 3.3 70B Cloud with multiple fallback models)
  const groqSuccess = await tryGroq(messages, res);
  if (groqSuccess) return;

  // 2. Try Ollama (Local Machine)
  const ollamaSuccess = await tryOllama(messages, res);
  if (ollamaSuccess) return;

  // 3. Dynamic Intelligent Database Fallback (Zero Failures & Dynamic Responses)
  await runSmartDatabaseFallback(messages, res);
}
