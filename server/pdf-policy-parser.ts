import { createRequire } from "module";
import fs from "fs";
import path from "path";
import { db } from "./db";
import { clientes, seguradoras, produtosSeguro } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

async function getPDFParseClass() {
  try {
    if (typeof require !== "undefined") {
      const pkg = require("pdf-parse");
      return pkg.PDFParse || pkg.default?.PDFParse || pkg;
    }
  } catch {}
  try {
    const { createRequire } = await import("module");
    const req = createRequire(import.meta.url);
    const pkg = req("pdf-parse");
    return pkg.PDFParse || pkg.default?.PDFParse || pkg;
  } catch {
    const mod: any = await import("pdf-parse");
    return mod.PDFParse || mod.default?.PDFParse || mod;
  }
}

export interface ExtractedPolicyData {
  numeroApolice?: string;
  idProposta?: string;
  numeroProposta?: string;
  idApolice?: string;
  seguradoraNome?: string;
  seguradoraId?: number;
  produtoNome?: string;
  produtoId?: number;
  inicioVigencia?: string; // YYYY-MM-DD
  fimVigencia?: string;    // YYYY-MM-DD
  dataEmissao?: string;    // YYYY-MM-DD
  premio?: string;         // 1500.00
  valorSegurado?: string;  // 100000.00
  comissao?: string;
  formaPagamento?: string;
  cobertura?: string;
  clienteNome?: string;
  clienteCpfCnpj?: string;
  clienteId?: number;
  observacoes?: string;
  status?: string;
}

/** Formata data brasileira DD/MM/AAAA para YYYY-MM-DD */
function formatBRDateToISO(dateStr: string): string | undefined {
  if (!dateStr) return undefined;
  const clean = dateStr.trim().replace(/[\.-]/g, "/");
  const match = clean.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const day = match[1].padStart(2, "0");
    const month = match[2].padStart(2, "0");
    const year = match[3];
    return `${year}-${month}-${day}`;
  }
  return undefined;
}

/** Converte valor financeiro brasileiro (1.234,56 ou 1234,56) para float string (1234.56) */
function parseCurrencyString(val: string): string | undefined {
  if (!val) return undefined;
  let raw = val.replace(/^R\$\s*/i, "").replace(/\s/g, "").trim();
  if (raw.includes(",") && raw.includes(".")) {
    raw = raw.replace(/\./g, "").replace(",", ".");
  } else if (raw.includes(",")) {
    raw = raw.replace(",", ".");
  }
  const num = parseFloat(raw);
  return isNaN(num) ? undefined : num.toFixed(2);
}

/** Lista de seguradoras conhecidas no Brasil para detecção rápida */
const KNOWN_INSURERS = [
  "Porto Seguro", "Azul Seguros", "Bradesco Seguros", "Tokio Marine", "Allianz",
  "Mapfre", "HDI Seguros", "SulAmérica", "Liberty Seguros", "Sompo Seguros",
  "Zurich", "Santander Auto", "Mitsui Sumitomo", "Suhai Seguradora", "Ituran",
  "Chubb", "Generali", "Pottencial", "Too Seguros", "Youse", "Ezze Seguros",
  "Darwin", "MetLife", "Prudential", "Icatu", "Unimed Seguros", "Mongeral Aegon", "MAG Seguros"
];

/** Lista de ramos / produtos comuns */
const KNOWN_PRODUCTS = [
  { name: "Automóvel", keywords: ["automóvel", "auto", "veículo", "veicular", "compreensiva", "frota", "caminhão", "moto"] },
  { name: "Vida", keywords: ["vida", "acidentes pessoais", "morte", "invalidez", "vgbl", "pgbl", "funeral"] },
  { name: "Residencial", keywords: ["residencial", "residência", "casa", "apartamento", "habitacional"] },
  { name: "Empresarial", keywords: ["empresarial", "empresa", "patrimonial", "comércio", "multirrisco"] },
  { name: "Saúde", keywords: ["saúde", "médico", "hospitalar", "plano de saúde"] },
  { name: "Odontológico", keywords: ["odonto", "dental", "dentário"] },
  { name: "Condomínio", keywords: ["condomínio", "edifício"] },
  { name: "Transporte", keywords: ["transporte", "carga", "rctr-c"] },
  { name: "Responsabilidade Civil", keywords: ["responsabilidade civil", "rc profissional", "d&o", "e&o"] },
  { name: "Fiança Locatícia", keywords: ["fiança", "aluguel", "locatícia"] },
  { name: "Garantia", keywords: ["garantia", "garantia judicial"] },
  { name: "Viagem", keywords: ["viagem", "assistência viagem"] }
];

/** Extração via Regex e Heurística de Apólices Brasileiras */
export function extractPolicyFieldsRegex(text: string): ExtractedPolicyData {
  const result: ExtractedPolicyData = {
    status: "ativa"
  };

  const normalizedText = text.replace(/\r\n/g, "\n");

  // 1. Número da Apólice
  // Procura padrões como "Apólice: 01.077.531.000000" ou "Nº da Apólice: 123456"
  const apoliceMatch =
    normalizedText.match(/(?:ap[óo]lice\s*n[ºo°]?|n[ºo°]?\s*da\s*ap[óo]lice|n[ºo°]?\s*ap[óo]lice|ap[óo]lice)[\s:]+([0-9]{2,}[0-9.\-\/]{3,})/i) ||
    normalizedText.match(/(?:ap[óo]lice)[\s:]+([A-Za-z0-9.\-\/]{5,})/i);
  if (apoliceMatch) {
    result.numeroApolice = apoliceMatch[1].trim();
  }

  // 2. Proposta / ID Proposta
  const propostaMatch =
    normalizedText.match(/(?:proposta\s*n[ºo°]?|n[ºo°]?\s*da\s*proposta|proposta\s*comercial|n[ºo°]?\s*proposta)[\s:]+([0-9]{2,}[0-9.\-\/]{2,})/i) ||
    normalizedText.match(/(?:id\s*proposta)[\s:]+([A-Za-z0-9.\-\/]{3,})/i);
  if (propostaMatch) {
    result.numeroProposta = propostaMatch[1].trim();
    result.idProposta = propostaMatch[1].trim();
  }

  // 3. ID da Apólice / CI (Código de Identificação)
  const ciMatch = normalizedText.match(/(?:c\.?i\.?|c[óo]digo\s+de\s+identifica[çc][ãa]o|id\s+ap[óo]lice)[\s:]+([A-Za-z0-9.\-\/]{4,})/i);
  if (ciMatch) {
    result.idApolice = ciMatch[1].trim();
  }

  // 4. Vigência: Início e Fim
  // Ex: "Vigência: das 24h de 10/05/2026 até às 24h de 10/05/2027" ou "10/05/2026 a 10/05/2027"
  const vigenciaRangeMatch =
    normalizedText.match(/(?:vig[êe]ncia|per[íi]odo\s+de\s+cobertura)[^\n\r\d]*?(?:das\s+24(?::00)?(?:h)?\s+d[eo]\s+dia\s+|de\s+|a\s+partir\s+de\s+)?(\d{2}[\/\.\-]\d{2}[\/\.\-]\d{4})[^\n\r\d]*?(?:at[ée]\s+(?:[àa]s\s+)?24(?::00)?(?:h)?\s+d[eo]\s+dia\s+|a\s+|at[ée]\s+)(\d{2}[\/\.\-]\d{2}[\/\.\-]\d{4})/i) ||
    normalizedText.match(/vig[êe]ncia[^\n\r\d]*?(\d{2}[\/\.\-]\d{2}[\/\.\-]\d{4})\s*(?:a|at[ée]|\-)\s*(\d{2}[\/\.\-]\d{2}[\/\.\-]\d{4})/i);
  if (vigenciaRangeMatch) {
    result.inicioVigencia = formatBRDateToISO(vigenciaRangeMatch[1]);
    result.fimVigencia = formatBRDateToISO(vigenciaRangeMatch[2]);
  } else {
    // Início isolado
    const inicioMatch =
      normalizedText.match(/(?:in[íi]cio\s+da\s+vig[êe]ncia|in[íi]cio\s+de\s+vig[êe]ncia|vig[êe]ncia\s+inicial|data\s+in[íi]cio|a\s+partir\s+de)[\s:]+(\d{2}[\/\.\-]\d{2}[\/\.\-]\d{4})/i);
    if (inicioMatch) result.inicioVigencia = formatBRDateToISO(inicioMatch[1]);

    // Fim isolado
    const fimMatch =
      normalizedText.match(/(?:fim\s+da\s+vig[êe]ncia|fim\s+de\s+vig[êe]ncia|vig[êe]ncia\s+final|t[ée]rmino(?:\s+da\s+vig[êe]ncia)?|data\s+t[ée]rmino|data\s+fim|vencimento(?:\s+da\s+ap[óo]lice)?)[\s:]+(\d{2}[\/\.\-]\d{2}[\/\.\-]\d{4})/i);
    if (fimMatch) result.fimVigencia = formatBRDateToISO(fimMatch[1]);
  }

  // 5. Data de Emissão
  const emissaoMatch = normalizedText.match(/(?:data\s+de\s+emiss[ãa]o|emitid[ao]\s+em|emiss[ãa]o)[\s:]+(\d{2}[\/\.\-]\d{2}[\/\.\-]\d{4})/i);
  if (emissaoMatch) {
    result.dataEmissao = formatBRDateToISO(emissaoMatch[1]);
  }

  // 6. Prêmio Total / Líquido / Valor
  const premioMatch =
    normalizedText.match(/(?:pr[êe]mio\s+total|pr[êe]mio\s+bruto|pr[êe]mio\s+comercial|total\s+a\s+pagar|valor\s+total(?:\s+do\s+seguro)?|valor\s+do\s+pr[êe]mio|pr[êe]mio\s+l[íi]quido|valor\s+da\s+ap[óo]lice)[\s:]*R?\$?\s*([0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2}|[0-9]+,[0-9]{2}|[0-9]+\.[0-9]{2})/i) ||
    normalizedText.match(/pr[êe]mio[^\n\r\d]*?R?\$?\s*([0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2}|[0-9]+\.[0-9]{2})/i);
  if (premioMatch) {
    result.premio = parseCurrencyString(premioMatch[1]);
  }

  // 7. Valor Segurado / Importância Segurada (LMG / IS) / Capital Segurado
  const isMatch =
    normalizedText.match(/(?:import[âa]ncia\s+segurada|limite\s+m[áa]ximo\s+de\s+garantia|capital\s+segurado|lmg|is\s+total|valor\s+do\s+bem|valor\s+segurado)[\s:]*R?\$?\s*([0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2}|[0-9]+,[0-9]{2}|[0-9]+\.[0-9]{2})/i);
  if (isMatch) {
    result.valorSegurado = parseCurrencyString(isMatch[1]);
  }

  // 8. Seguradora
  const upperText = normalizedText.toUpperCase();
  for (const ins of KNOWN_INSURERS) {
    if (upperText.includes(ins.toUpperCase())) {
      result.seguradoraNome = ins;
      break;
    }
  }

  // 9. Ramo / Produto de Seguro
  for (const prod of KNOWN_PRODUCTS) {
    const matched = prod.keywords.some(k => normalizedText.toLowerCase().includes(k.toLowerCase()));
    if (matched) {
      result.produtoNome = prod.name;
      break;
    }
  }

  // 10. Forma de Pagamento
  if (upperText.includes("CARTÃO DE CRÉDITO") || upperText.includes("CARTAO DE CREDITO")) {
    result.formaPagamento = "Cartão de Crédito";
  } else if (upperText.includes("DÉBITO EM CONTA") || upperText.includes("DEBITO EM CONTA") || upperText.includes("DÉBITO AUTOMÁTICO")) {
    result.formaPagamento = "Débito em Conta";
  } else if (upperText.includes("BOLETO")) {
    result.formaPagamento = "Boleto Bancário";
  } else if (upperText.includes("PIX")) {
    result.formaPagamento = "Pix";
  }

  // Parcelamento
  const parcelasMatch = normalizedText.match(/(\d{1,2})x\s+de\s+R?\$?\s*([0-9.,]+)/i);
  if (parcelasMatch) {
    result.formaPagamento = result.formaPagamento
      ? `${result.formaPagamento} (${parcelasMatch[1]}x de R$ ${parcelasMatch[2]})`
      : `${parcelasMatch[1]}x de R$ ${parcelasMatch[2]}`;
  }

  // 11. Cobertura / Veículo / Bem Segurado
  const vehicleParts: string[] = [];
  const veicMatch = normalizedText.match(/(?:ve[íi]culo|modelo|marca\/modelo)[\s:]+([^\n\r,]+)/i);
  if (veicMatch) vehicleParts.push(`Veículo: ${veicMatch[1].trim()}`);

  const placaMatch = normalizedText.match(/(?:placa)[\s:]+([A-Z]{3}[0-9][A-Z0-9][0-9]{2}|[A-Z]{3}-?[0-9]{4})/i);
  if (placaMatch) vehicleParts.push(`Placa: ${placaMatch[1].trim()}`);

  const chassiMatch = normalizedText.match(/(?:chassi)[\s:]+([A-HJ-NPR-Z0-9]{17})/i);
  if (chassiMatch) vehicleParts.push(`Chassi: ${chassiMatch[1].trim()}`);

  const anoMatch = normalizedText.match(/(?:ano(?:\s*fabr[^\n\r]*)?)[\s:]+(\d{4}\/\d{4}|\d{4})/i);
  if (anoMatch) vehicleParts.push(`Ano: ${anoMatch[1].trim()}`);

  if (vehicleParts.length > 0) {
    result.cobertura = vehicleParts.join(" | ");
  }

  // 12. Nome do Segurado / Cliente
  const seguradoMatch =
    normalizedText.match(/(?:nome\s+do\s+segurado|segurado|proponente|raz[ãa]o\s+social)[\s:]+([A-Za-zÀ-ÖØ-öø-ÿ\s]{4,60})/i);
  if (seguradoMatch) {
    const rawName = seguradoMatch[1].trim().split("\n")[0].trim();
    // Evita falsos positivos como títulos
    if (!rawName.toUpperCase().includes("APÓLICE") && !rawName.toUpperCase().includes("SEGUROS")) {
      result.clienteNome = rawName;
    }
  }

  // 13. CPF / CNPJ do Segurado
  const docMatch = normalizedText.match(/(?:cpf\/cnpj|cpf|cnpj)[\s:]*([0-9]{2,3}[\.\-]?[0-9]{3}[\.\-]?[0-9]{3}[\/\-]?[0-9]{2,4}[-]?[0-9]{2})/i);
  if (docMatch) {
    result.clienteCpfCnpj = docMatch[1].trim();
  }

  return result;
}

/** Tenta enriquecer com IA se alguma chave estiver configurada */
async function tryAIEnrichment(text: string, current: ExtractedPolicyData): Promise<ExtractedPolicyData> {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const groqKey = process.env.GROQ_API_KEY || process.env.GROQ_KEY;

  if (!geminiKey && !groqKey) return current;

  const prompt = `Você é um perito especialista em apólices de seguros brasileiras.
Analise as primeiras páginas deste documento de apólice e extraia os dados em um JSON estrito.
Texto extraído:
---
${text.slice(0, 5000)}
---

Retorne APENAS um objeto JSON com esta estrutura (use null quando o dado não for encontrado):
{
  "numeroApolice": "número da apólice",
  "idProposta": "número ou ID da proposta",
  "numeroProposta": "número da proposta",
  "idApolice": "ID ou CI da apólice",
  "seguradoraNome": "nome da seguradora (ex: Porto Seguro, Tokio Marine, Bradesco, Allianz, etc.)",
  "produtoNome": "ramo ou produto (ex: Automóvel, Vida, Residencial, Saúde, etc.)",
  "inicioVigencia": "YYYY-MM-DD",
  "fimVigencia": "YYYY-MM-DD",
  "dataEmissao": "YYYY-MM-DD",
  "premio": "valor numérico decimal ex: 1540.50",
  "valorSegurado": "valor numérico decimal ex: 100000.00",
  "comissao": "percentual de comissão ex: 15.0",
  "formaPagamento": "forma de pagamento ex: Boleto Bancário 10x, Cartão de Crédito",
  "cobertura": "resumo das coberturas e/ou dados do veículo (placa, modelo, etc.)",
  "clienteNome": "nome completo do segurado",
  "clienteCpfCnpj": "CPF ou CNPJ formatado ou apenas dígitos",
  "observacoes": "observações relevantes"
}`;

  try {
    if (geminiKey) {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey.trim()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
        })
      });
      if (response.ok) {
        const json: any = await response.json();
        const rawJsonText = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawJsonText) {
          const aiParsed = JSON.parse(rawJsonText);
          return {
            ...current,
            ...Object.fromEntries(Object.entries(aiParsed).filter(([_, v]) => v !== null && v !== undefined && v !== ""))
          };
        }
      }
    }
  } catch (err: any) {
    console.warn("[PDF Parser] AI enrichment error:", err.message || err);
  }

  return current;
}

/** Salva o PDF no disco e processa o documento */
export async function parsePolicyPdf(
  buffer: Buffer,
  originalFilename = "apolice.pdf"
): Promise<{ pdfUrl: string; extracted: ExtractedPolicyData; rawTextSnippet: string }> {
  // 1. Garante o diretório de destino
  const uploadsDir = path.resolve(process.cwd(), "attached_assets", "apolices");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // 2. Sanitiza nome do arquivo e salva
  const timestamp = Date.now();
  const safeBaseName = originalFilename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storedFilename = `${timestamp}_${safeBaseName}`;
  const filePath = path.join(uploadsDir, storedFilename);
  fs.writeFileSync(filePath, buffer);

  const pdfUrl = `/attached_assets/apolices/${storedFilename}`;

  // 3. Lê as primeiras 3 páginas com pdf-parse
  let rawText = "";
  try {
    const PDFParseConstructor = await getPDFParseClass();
    const parser = new PDFParseConstructor({ data: buffer });
    const parsed = await parser.getText({ first: 3 });
    rawText = parsed?.text || "";
    if (typeof parser.destroy === "function") {
      await parser.destroy();
    }
  } catch (e: any) {
    console.error("[PDF Parser] Erro ao extrair texto do PDF:", e);
  }

  // 4. Executa extração baseada em heurísticas
  let extracted = extractPolicyFieldsRegex(rawText);

  // 5. Tenta enriquecer com IA se disponível
  if (rawText.length > 50) {
    extracted = await tryAIEnrichment(rawText, extracted);
  }

  // 6. Resolução no banco de dados: Seguradora
  try {
    const allSeguradoras = await db.select().from(seguradoras);
    if (extracted.seguradoraNome) {
      const targetSeg = extracted.seguradoraNome.toLowerCase().trim();
      const matchedSeg = allSeguradoras.find(s =>
        s.nome.toLowerCase().includes(targetSeg) || targetSeg.includes(s.nome.toLowerCase())
      );
      if (matchedSeg) {
        extracted.seguradoraId = matchedSeg.id;
        extracted.seguradoraNome = matchedSeg.nome;
      } else {
        // Cria seguradora automaticamente para conveniência
        const [newSeg] = await db.insert(seguradoras).values({ nome: extracted.seguradoraNome }).returning();
        extracted.seguradoraId = newSeg.id;
      }
    }

    // 7. Resolução no banco de dados: Produto
    const allProdutos = await db.select().from(produtosSeguro);
    if (extracted.produtoNome) {
      const targetProd = extracted.produtoNome.toLowerCase().trim();
      const matchedProd = allProdutos.find(p =>
        p.nome.toLowerCase().includes(targetProd) || targetProd.includes(p.nome.toLowerCase())
      );
      if (matchedProd) {
        extracted.produtoId = matchedProd.id;
        extracted.produtoNome = matchedProd.nome;
      }
    }

    // 8. Resolução no banco de dados: Cliente existente por CPF/CNPJ ou Nome
    const allClientes = await db.select().from(clientes);
    if (extracted.clienteCpfCnpj) {
      const cleanDigits = extracted.clienteCpfCnpj.replace(/\D/g, "");
      const matchedByDoc = allClientes.find(c => (c.cpfCnpj || "").replace(/\D/g, "") === cleanDigits);
      if (matchedByDoc) {
        extracted.clienteId = matchedByDoc.id;
        extracted.clienteNome = matchedByDoc.nome;
      }
    }
    if (!extracted.clienteId && extracted.clienteNome) {
      const cleanName = extracted.clienteNome.toLowerCase().trim();
      const matchedByName = allClientes.find(c => c.nome.toLowerCase().trim() === cleanName);
      if (matchedByName) {
        extracted.clienteId = matchedByName.id;
      }
    }
  } catch (dbErr) {
    console.warn("[PDF Parser] DB match error:", dbErr);
  }

  return {
    pdfUrl,
    extracted,
    rawTextSnippet: rawText.slice(0, 1000)
  };
}
