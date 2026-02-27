import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, hashPassword } from "./auth";
import {
  insertContactSchema,
  insertLeadSchema,
  insertInteractionSchema,
  insertCampaignSchema,
  insertTaskSchema,
  insertSiteSettingsSchema,
  insertHeroSlideSchema
} from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  // Middleware to check authentication
  const isAuthenticated = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  const isAdmin = (req: any, res: any, next: any) => {
    if (req.isAuthenticated() && req.user.role === "admin") {
      return next();
    }
    res.status(403).json({ message: "Forbidden: Admin access required" });
  };

  // Posts
  app.get(api.posts.list.path, async (req, res) => {
    const posts = await storage.getPosts();
    res.json(posts);
  });

  app.get(api.posts.get.path, async (req, res) => {
    const post = await storage.getPostBySlug(req.params.slug as string);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.json(post);
  });

  app.delete("/api/posts/:id", isAuthenticated, isAdmin, async (req, res) => {
    await storage.deletePost(parseInt(req.params.id));
    res.sendStatus(204);
  });

  app.post("/api/posts", isAuthenticated, isAdmin, async (req, res) => {
    const input = req.body;
    const post = await storage.createPost(input);
    res.status(201).json(post);
  });

  // Services
  app.get(api.services.list.path, async (req, res) => {
    const services = await storage.getServices();
    res.json(services);
  });

  app.delete("/api/services/:id", isAuthenticated, isAdmin, async (req, res) => {
    await storage.deleteService(parseInt(req.params.id));
    res.sendStatus(204);
  });

  app.post("/api/services", isAuthenticated, isAdmin, async (req, res) => {
    const input = req.body;
    const service = await storage.createService(input);
    res.status(201).json(service);
  });

  // Inquiries
  app.post(api.inquiries.create.path, async (req, res) => {
    try {
      const input = api.inquiries.create.input.parse(req.body);
      const inquiry = await storage.createInquiry(input);
      res.status(201).json(inquiry);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });


  // CRM Routes

  // Contacts
  app.get("/api/contacts", isAuthenticated, async (req, res) => {
    const contacts = await storage.getContacts();
    res.json(contacts);
  });

  app.get("/api/contacts/:id", isAuthenticated, async (req, res) => {
    const contact = await storage.getContact(parseInt(req.params.id));
    if (!contact) return res.status(404).json({ message: "Contact not found" });
    res.json(contact);
  });

  app.post("/api/contacts", isAuthenticated, async (req, res) => {
    try {
      const input = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(input);
      res.status(201).json(contact);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors });
      }
      throw err;
    }
  });

  // Leads
  app.get("/api/leads", isAuthenticated, async (req, res) => {
    const contactId = req.query.contactId ? parseInt(req.query.contactId as string) : undefined;
    const leads = await storage.getLeads(contactId);
    res.json(leads);
  });

  app.post("/api/leads", isAuthenticated, async (req, res) => {
    try {
      const input = insertLeadSchema.parse(req.body);
      const lead = await storage.createLead(input);
      res.status(201).json(lead);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors });
      }
      throw err;
    }
  });

  app.patch("/api/leads/:id/status", isAuthenticated, async (req, res) => {
    const lead = await storage.updateLeadStatus(parseInt(req.params.id), req.body.status);
    if (!lead) return res.status(404).json({ message: "Lead not found" });
    res.json(lead);
  });

  // Interactions
  app.get("/api/interactions", isAuthenticated, async (req, res) => {
    const leadId = req.query.leadId ? parseInt(req.query.leadId as string) : undefined;
    const contactId = req.query.contactId ? parseInt(req.query.contactId as string) : undefined;
    const interactions = await storage.getInteractions(leadId, contactId);
    res.json(interactions);
  });

  app.post("/api/interactions", isAuthenticated, async (req, res) => {
    try {
      const input = insertInteractionSchema.parse(req.body);
      const interaction = await storage.createInteraction({
        ...input,
        userId: (req.user as any).id,
      });
      res.status(201).json(interaction);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors });
      }
      throw err;
    }
  });

  // Campaigns
  app.get("/api/campaigns", isAuthenticated, async (req, res) => {
    const campaigns = await storage.getCampaigns();
    res.json(campaigns);
  });

  app.post("/api/campaigns", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const input = insertCampaignSchema.parse(req.body);
      const campaign = await storage.createCampaign(input);
      res.status(201).json(campaign);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors });
      }
      throw err;
    }
  });

  app.delete("/api/campaigns/:id", isAuthenticated, isAdmin, async (req, res) => {
    await storage.deleteCampaign(parseInt(req.params.id));
    res.sendStatus(204);
  });

  // Users Management
  app.get("/api/users", isAuthenticated, async (req, res) => {
    const result = await storage.getUsers();
    // Don't leak passwords
    res.json(result.map(({ password, ...user }) => user));
  });

  app.patch("/api/users/:id/role", isAuthenticated, isAdmin, async (req, res) => {
    const user = await storage.updateUserRole(parseInt(req.params.id), req.body.role);
    if (!user) return res.status(404).json({ message: "User not found" });
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  });

  // Tasks
  app.get("/api/tasks", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    let assignedTo = req.query.assignedTo ? parseInt(req.query.assignedTo as string) : undefined;
    const contactId = req.query.contactId ? parseInt(req.query.contactId as string) : undefined;

    // RBAC: Employees can ONLY see their own tasks
    if (user.role === "employee") {
      assignedTo = user.id;
    }

    const tasks = await storage.getTasks(assignedTo, contactId);
    res.json(tasks);
  });

  app.post("/api/tasks", isAuthenticated, async (req, res) => {
    try {
      const input = insertTaskSchema.parse({
        ...req.body,
        createdBy: (req.user as any).id,
      });
      const task = await storage.createTask(input);
      res.status(201).json(task);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors });
      }
      throw err;
    }
  });

  app.patch("/api/tasks/:id/status", isAuthenticated, async (req, res) => {
    const task = await storage.updateTaskStatus(parseInt(req.params.id), req.body.status);
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  });

  app.delete("/api/tasks/:id", isAuthenticated, async (req, res) => {
    await storage.deleteTask(parseInt(req.params.id));
    res.sendStatus(204);
  });

  // Site Settings
  app.get("/api/site-settings", async (req, res) => {
    const settings = await storage.getSiteSettings();
    res.json(settings);
  });

  // CNPJ Proxy with multiple fallback APIs
  app.get("/api/proxy/cnpj/:cnpj", isAuthenticated, async (req, res) => {
    const cnpj = req.params.cnpj.replace(/\D/g, "");

    if (cnpj.length !== 14) {
      return res.status(400).json({ message: `CNPJ invÃ¡lido: esperado 14 dÃ­gitos, recebido ${cnpj.length}` });
    }

    const fetchWithTimeout = async (url: string, timeoutMs = 8000) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timer);
        return response;
      } catch (err) {
        clearTimeout(timer);
        throw err;
      }
    };

    const formatAddress = (data: any) => {
      const parts = [
        data.logradouro,
        data.numero,
        data.complemento ? `- ${data.complemento}` : null,
        `- ${data.bairro}`,
        `${data.municipio} - ${data.uf}`,
        data.cep
      ].filter(Boolean);
      return parts.join(", ");
    };

    // API 1: BrasilAPI
    try {
      console.log(`[CNPJ] Tentando BrasilAPI para ${cnpj}...`);
      const brasilRes = await fetchWithTimeout(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
      if (brasilRes.ok) {
        const data = await brasilRes.json();
        console.log(`[CNPJ] âœ… BrasilAPI respondeu com sucesso`);
        return res.json({
          name: data.razao_social || data.nome_fantasia,
          email: data.email || null,
          phone: data.ddd_telefone_1 || data.ddd_telefone_2 || null,
          address: formatAddress(data)
        });
      }
      console.log(`[CNPJ] BrasilAPI retornou status ${brasilRes.status}`);
    } catch (e: any) {
      console.log(`[CNPJ] BrasilAPI falhou: ${e.message}`);
    }

    // API 2: ReceitaWS
    try {
      console.log(`[CNPJ] Tentando ReceitaWS para ${cnpj}...`);
      const receitaRes = await fetchWithTimeout(`https://receitaws.com.br/v1/cnpj/${cnpj}`);
      if (receitaRes.ok) {
        const data = await receitaRes.json();
        if (data.status !== "ERROR") {
          console.log(`[CNPJ] âœ… ReceitaWS respondeu com sucesso`);
          return res.json({
            name: data.nome || data.fantasia,
            email: data.email || null,
            phone: data.telefone || null,
            address: formatAddress(data)
          });
        }
        console.log(`[CNPJ] ReceitaWS retornou ERROR: ${data.message}`);
      }
    } catch (e: any) {
      console.log(`[CNPJ] ReceitaWS falhou: ${e.message}`);
    }

    // API 3: publica.cnpj.ws
    try {
      console.log(`[CNPJ] Tentando publica.cnpj.ws para ${cnpj}...`);
      const publicaRes = await fetchWithTimeout(`https://publica.cnpj.ws/cnpj/${cnpj}`);
      if (publicaRes.ok) {
        const data = await publicaRes.json();
        console.log(`[CNPJ] âœ… publica.cnpj.ws respondeu com sucesso`);
        const est = data.estabelecimento || {};
        return res.json({
          name: data.razao_social || est.nome_fantasia,
          email: est.email || null,
          phone: est.ddd1 && est.telefone1 ? `(${est.ddd1}) ${est.telefone1}` : null,
          address: est.logradouro ? `${est.tipo_logradouro || ''} ${est.logradouro}, ${est.numero || 'S/N'}${est.complemento ? ` - ${est.complemento}` : ''} - ${est.bairro}, ${est.cidade?.nome || ''} - ${est.estado?.sigla || ''}, ${est.cep}` : null
        });
      }
      console.log(`[CNPJ] publica.cnpj.ws retornou status ${publicaRes.status}`);
    } catch (e: any) {
      console.log(`[CNPJ] publica.cnpj.ws falhou: ${e.message}`);
    }

    // API 4: Open CNPJ (cnpja.com open)
    try {
      console.log(`[CNPJ] Tentando open.cnpja.com para ${cnpj}...`);
      const openRes = await fetchWithTimeout(`https://open.cnpja.com/office/${cnpj}`);
      if (openRes.ok) {
        const data = await openRes.json();
        console.log(`[CNPJ] âœ… open.cnpja.com respondeu com sucesso`);
        const addr = data.address || {};
        return res.json({
          name: data.company?.name || data.alias,
          email: data.emails?.[0]?.address || null,
          phone: data.phones?.[0] ? `(${data.phones[0].area}) ${data.phones[0].number}` : null,
          address: addr.street ? `${addr.street}, ${addr.number || 'S/N'}${addr.details ? ` - ${addr.details}` : ''} - ${addr.district}, ${addr.city} - ${addr.state}, ${addr.zip}` : null
        });
      }
      console.log(`[CNPJ] open.cnpja.com retornou status ${openRes.status}`);
    } catch (e: any) {
      console.log(`[CNPJ] open.cnpja.com falhou: ${e.message}`);
    }

    console.log(`[CNPJ] âŒ Todas as APIs falharam para ${cnpj}`);
    res.status(404).json({ message: "Nenhuma das APIs conseguiu encontrar dados para este CNPJ. Verifique o nÃºmero e tente novamente." });
  });

  app.patch("/api/site-settings", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const input = insertSiteSettingsSchema.parse(req.body);
      const settings = await storage.updateSiteSettings(input);
      res.json(settings);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors });
      }
      throw err;
    }
  });

  // Hero Slides
  app.get("/api/hero-slides", async (req, res) => {
    const slides = await storage.getHeroSlides();
    res.json(slides);
  });

  app.post("/api/hero-slides", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const input = insertHeroSlideSchema.parse(req.body);
      const slide = await storage.createHeroSlide(input);
      res.status(201).json(slide);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors });
      }
      throw err;
    }
  });

  app.patch("/api/hero-slides/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const slide = await storage.updateHeroSlide(id, req.body);
      if (!slide) return res.status(404).json({ message: "Slide not found" });
      res.json(slide);
    } catch (err) {
      res.status(500).json({ message: "Failed to update slide" });
    }
  });

  app.delete("/api/hero-slides/:id", isAuthenticated, isAdmin, async (req, res) => {
    await storage.deleteHeroSlide(parseInt(req.params.id));
    res.sendStatus(204);
  });

  // Prospecting Checklists
  app.get("/api/prospecting", isAuthenticated, async (req, res) => {
    const contactId = req.query.contactId ? parseInt(req.query.contactId as string) : undefined;
    const results = await storage.getProspectingChecklists(contactId);
    res.json(results);
  });

  app.post("/api/prospecting", isAuthenticated, async (req, res) => {
    try {
      const input = req.body;
      const userId = (req.user as any).id;

      const result = await storage.createProspectingChecklist({
        ...input,
        userId,
      });

      // Automatically create an interaction of type 'call' to show in history
      const outcomeLabel = {
        'connected': 'Conectado',
        'no_answer': 'Sem Atendimento',
        'busy': 'Ocupado',
        'wrong_number': 'NÃºmero Errado'
      }[input.callOutcome as string] || input.callOutcome;

      await storage.createInteraction({
        contactId: input.contactId,
        userId: userId,
        type: "call",
        description: `ProspecÃ§Ã£o Realizada - Resultado: ${outcomeLabel}. Notas: ${input.notes || "Sem observaÃ§Ãµes."}`,
        date: new Date(),
      });

      res.status(201).json(result);
    } catch (err) {
      console.error("[Prospecting] Error saving:", err);
      res.status(500).json({ message: "Failed to save prospecting result" });
    }
  });

  // Company Search Proxy (Filtered by region and CNAE)
  app.get("/api/proxy/companies/search", isAuthenticated, async (req, res) => {
    const { state, city, cnae, q, neighborhood } = req.query;

    if (!state && !q) {
      return res.status(400).json({ message: "Informe pelo menos o Estado." });
    }

    const uf = (state as string || "").toUpperCase();
    const municipio = (city as string || "").toUpperCase();
    const bairroFiltro = (neighborhood as string || "").toUpperCase();
    const keyword = (q as string || "").toLowerCase().trim();
    const targetCity = municipio || "SÃƒO PAULO";
    const targetUf = uf || "SP";

    // -----------------------------------------------------------------------
    // Keyword â†’ CNAE mapping + niche label
    // -----------------------------------------------------------------------
    const NICHE_MAP: Array<{ terms: string[]; cnae: string; label: string; cnaeDesc: string }> = [
      { terms: ["restaurante", "lanchonete", "comida", "alimentaÃ§Ã£o", "refeiÃ§Ã£o", "bar", "boteco", "pizzaria", "hamburgueria", "self service", "cafeteria", "padaria", "confeitaria", "doce", "bolo"], cnae: "5611201", label: "AlimentaÃ§Ã£o", cnaeDesc: "Restaurantes e similares" },
      { terms: ["academia", "fitness", "musculaÃ§Ã£o", "ginÃ¡stica", "pilates", "crossfit", "nataÃ§Ã£o", "esporte"], cnae: "9313100", label: "Academia/Fitness", cnaeDesc: "Atividades de condicionamento fÃ­sico" },
      { terms: ["mÃ©dico", "clÃ­nica", "hospital", "consultÃ³rio", "saÃºde", "dentista", "odonto", "pediatra", "cardiologista", "ortopedista", "dermatologista"], cnae: "8610101", label: "SaÃºde", cnaeDesc: "Atividades de atendimento hospitalar, exceto pronto-socorro" },
      { terms: ["advocacia", "advogado", "escritÃ³rio", "jurÃ­dico", "direito", "advocacia"], cnae: "6911701", label: "Advocacia", cnaeDesc: "ServiÃ§os advocatÃ­cios" },
      { terms: ["contabilidade", "contador", "contÃ¡bil", "fiscal", "tributÃ¡rio", "imposto", "declaraÃ§Ã£o"], cnae: "6920601", label: "Contabilidade", cnaeDesc: "Atividades de contabilidade" },
      { terms: ["seguro", "corretora", "apÃ³lice", "previdÃªncia", "seguradora", "vida", "residencial"], cnae: "6512000", label: "Seguros", cnaeDesc: "Seguros de vida" },
      { terms: ["farmÃ¡cia", "drogaria", "medicamento", "remÃ©dio", "genÃ©rico"], cnae: "4771701", label: "FarmÃ¡cia", cnaeDesc: "ComÃ©rcio varejista de produtos farmacÃªuticos" },
      { terms: ["auto", "automÃ³vel", "veÃ­culo", "carro", "moto", "oficina", "mecÃ¢nica", "funilaria", "pintura", "borracharia", "lava jato", "estÃ©tica automotiva"], cnae: "4520001", label: "Automotivo", cnaeDesc: "ServiÃ§os de manutenÃ§Ã£o e reparaÃ§Ã£o de automÃ³veis" },
      { terms: ["imobiliÃ¡ria", "imÃ³vel", "imÃ³veis", "corretora de imÃ³veis", "aluguel", "locaÃ§Ã£o", "venda de imÃ³veis"], cnae: "6821801", label: "ImÃ³veis", cnaeDesc: "Corretagem na compra e venda de imÃ³veis" },
      { terms: ["supermercado", "mercado", "mercearia", "hortifruti", "verdura", "frutas"], cnae: "4711301", label: "Supermercado", cnaeDesc: "ComÃ©rcio varejista de mercadorias em geral" },
      { terms: ["roupa", "moda", "vestuÃ¡rio", "calÃ§ado", "tÃªnis", "boutique", "loja", "confecÃ§Ã£o", "roupas", "moda feminina", "moda masculina"], cnae: "4781400", label: "VestuÃ¡rio", cnaeDesc: "ComÃ©rcio varejista de artigos do vestuÃ¡rio e acessÃ³rios" },
      { terms: ["escola", "ensino", "educaÃ§Ã£o", "curso", "colÃ©gio", "faculdade", "universidade", "prÃ©-escola", "creche"], cnae: "8531700", label: "EducaÃ§Ã£o", cnaeDesc: "EducaÃ§Ã£o superior - graduaÃ§Ã£o" },
      { terms: ["salÃ£o", "beleza", "cabeleireiro", "manicure", "pedicure", "estÃ©tica", "spa", "nail", "hair"], cnae: "9602501", label: "Beleza", cnaeDesc: "Cabeleireiros, manicure e pedicure" },
      { terms: ["hotel", "pousada", "hospedagem", "resort", "hostel", "motel"], cnae: "5510801", label: "Hotelaria", cnaeDesc: "HotÃ©is e similares" },
      { terms: ["tecnologia", "software", "ti", "informÃ¡tica", "sistema", "desenvolvimento", "app", "aplicativo", "startup"], cnae: "6201500", label: "Tecnologia", cnaeDesc: "Desenvolvimento de programas de computador sob encomenda" },
      { terms: ["marketing", "publicidade", "propaganda", "agÃªncia", "comunicaÃ§Ã£o", "mÃ­dia", "design", "criativo"], cnae: "7311400", label: "Marketing", cnaeDesc: "AgÃªncias de publicidade" },
      { terms: ["construÃ§Ã£o", "construtora", "obras", "engenharia", "reforma", "civil", "edificaÃ§Ã£o"], cnae: "4120400", label: "ConstruÃ§Ã£o", cnaeDesc: "ConstruÃ§Ã£o de edifÃ­cios" },
      { terms: ["logÃ­stica", "transporte", "frete", "entrega", "courier", "mudanÃ§a", "armazenagem", "distribuiÃ§Ã£o"], cnae: "4930201", label: "Transporte", cnaeDesc: "Transporte rodoviÃ¡rio de carga" },
      { terms: ["petshop", "veterinÃ¡rio", "animal", "bicho", "pet", "banho e tosa"], cnae: "7500100", label: "Pet Shop", cnaeDesc: "Atividades veterinÃ¡rias" },
      { terms: ["banco", "financeiro", "crÃ©dito", "emprÃ©stimo", "financeira", "cÃ¢mbio", "investimento"], cnae: "6422100", label: "Financeiro", cnaeDesc: "Bancos mÃºltiplos, com carteira comercial" },
      { terms: ["consultoria", "gestÃ£o", "rh", "recursos humanos", "estratÃ©gia", "negÃ³cios"], cnae: "7020400", label: "Consultoria", cnaeDesc: "Atividades de consultoria em gestÃ£o empresarial" },
      { terms: ["grÃ¡fica", "impressÃ£o", "papel", "grÃ¡fico", "tipografia", "plotagem"], cnae: "1811301", label: "GrÃ¡fica", cnaeDesc: "ImpressÃ£o de jornais, livros, revistas e outras publicaÃ§Ãµes" },
      { terms: ["eletrica", "elÃ©trico", "instalaÃ§Ã£o", "painel", "energia", "solar", "fotovoltaico"], cnae: "4321500", label: "ElÃ©trica", cnaeDesc: "InstalaÃ§Ã£o e manutenÃ§Ã£o elÃ©trica" },
      { terms: ["seguranÃ§a", "vigilÃ¢ncia", "monitoramento", "alarme", "cÃ¢mera", "cftv", "portaria"], cnae: "8011101", label: "SeguranÃ§a", cnaeDesc: "Atividades de vigilÃ¢ncia e seguranÃ§a privada" },
      { terms: ["limpeza", "higienizaÃ§Ã£o", "lavanderia", "dedetizaÃ§Ã£o", "conservaÃ§Ã£o", "faxina"], cnae: "8121400", label: "Limpeza", cnaeDesc: "Limpeza em prÃ©dios e em domicÃ­lios" },
      { terms: ["mÃ³veis", "decoraÃ§Ã£o", "interiores", "arquitetura", "design de interiores", "home"], cnae: "4754701", label: "MÃ³veis/DecoraÃ§Ã£o", cnaeDesc: "ComÃ©rcio varejista de mÃ³veis" },
      { terms: ["eventos", "cerimonial", "casamento", "festa", "buffet", "dj", "fotografia", "video"], cnae: "8230001", label: "Eventos", cnaeDesc: "ServiÃ§os de organizaÃ§Ã£o de feiras, congressos, exposiÃ§Ãµes e festas" },
      { terms: ["farmÃ¡cias de manipulaÃ§Ã£o", "manipulaÃ§Ã£o", "homeopatia", "fitoterÃ¡pico"], cnae: "4771702", label: "FarmÃ¡cia ManipulaÃ§Ã£o", cnaeDesc: "ComÃ©rcio varejista de produtos farmacÃªuticos, com manipulaÃ§Ã£o" },
    ];

    // Detect niche from keyword
    let detectedNiche = NICHE_MAP.find(n =>
      n.terms.some(term => keyword.includes(term) || term.includes(keyword))
    );

    // Explicit CNAE override
    const cnaeCode = cnae
      ? (cnae as string).replace(/\D/g, "")
      : detectedNiche?.cnae || "";

    console.log(`[CompanySearch] UF=${uf} | Cidade=${municipio} | Bairro=${bairroFiltro} | CNAE=${cnaeCode} | Nicho=${detectedNiche?.label || "geral"} | Keyword="${keyword}"`);

    let results: any[] = [];
    let apiSuccess = false;

    // -----------------------------------------------------------------------
    // Strategy: publica.cnpj.ws â€” search by UF + municipio + CNAE
    // -----------------------------------------------------------------------
    if (cnaeCode || municipio) {
      try {
        const params = new URLSearchParams();
        if (uf) params.set("uf", uf);
        if (municipio) params.set("municipio", municipio);
        if (cnaeCode) params.set("cnae", cnaeCode);
        if (bairroFiltro) params.set("q", (neighborhood as string).toUpperCase());

        const url = `https://publica.cnpj.ws/cnpjs?${params.toString()}`;
        const apiRes = await fetch(url, {
          headers: { "Accept": "application/json", "User-Agent": "MonteiroSeguros/1.0" },
          signal: AbortSignal.timeout(7000),
        });

        if (apiRes.ok) {
          const data = await apiRes.json();
          const raw = Array.isArray(data) ? data : (data.data || data.companies || []);

          results = raw.map((c: any) => ({
            razao_social: c.razao_social || c.nome || "",
            nome_fantasia: c.nome_fantasia || "",
            cnpj: c.cnpj || "",
            logradouro: c.logradouro || c.endereco?.logradouro || "",
            numero: c.numero || c.endereco?.numero || "",
            bairro: c.bairro || c.endereco?.bairro || "",
            municipio: c.municipio || c.endereco?.municipio || targetCity,
            uf: c.uf || c.endereco?.uf || targetUf,
            cep: c.cep || c.endereco?.cep || "",
            cnae_principal_descricao: c.cnae_fiscal_descricao || c.atividade_principal?.[0]?.text || detectedNiche?.cnaeDesc || "",
            ddd_telefone_1: c.ddd_telefone_1 || c.telefone || "",
            email: c.email || "",
          }));

          if (results.length > 0) {
            apiSuccess = true;
            console.log(`[CompanySearch] API retornou ${results.length} empresas reais`);
          }
        } else {
          console.warn(`[CompanySearch] API HTTP ${apiRes.status}`);
        }
      } catch (e: any) {
        console.warn(`[CompanySearch] API falhou: ${e.message}`);
      }
    }

    // -----------------------------------------------------------------------
    // OSM Overpass fallback â€” fetch REAL businesses from OpenStreetMap
    // -----------------------------------------------------------------------
    if (!apiSuccess) {
      console.warn(`[CompanySearch] CNPJ API sem resultado. Buscando negÃ³cios reais no OSM para: ${bairroFiltro || municipio}`);

      // Map niche keyword to OSM amenity/shop tags
      const OSM_TAG_MAP: Record<string, string[]> = {
        "AlimentaÃ§Ã£o": ["amenity=restaurant", "amenity=cafe", "amenity=fast_food", "amenity=food_court", "amenity=bar", "shop=bakery"],
        "Academia/Fitness": ["leisure=fitness_centre", "leisure=sports_centre", "leisure=gym"],
        "SaÃºde": ["amenity=clinic", "amenity=doctors", "amenity=hospital", "healthcare=yes"],
        "Advocacia": ["office=lawyer"],
        "Contabilidade": ["office=accountant", "office=financial"],
        "Automotivo": ["shop=car_repair", "amenity=car_wash", "shop=tyres", "shop=car"],
        "Beleza": ["shop=hairdresser", "shop=beauty", "amenity=beauty_salon"],
        "Pet Shop": ["shop=pet", "amenity=veterinary"],
        "ImÃ³veis": ["office=estate_agent"],
        "Seguros": ["office=insurance"],
        "Tecnologia": ["office=it", "office=software"],
        "Marketing": ["office=advertising_agency", "office=marketing"],
        "ConstruÃ§Ã£o": ["office=construction", "craft=construction"],
        "LogÃ­stica": ["amenity=courier", "shop=shipping"],
        "FarmÃ¡cia ManipulaÃ§Ã£o": ["amenity=pharmacy", "healthcare=pharmacy"],
      };

      const nicheLabel = detectedNiche?.label || "";
      let osmTags = OSM_TAG_MAP[nicheLabel] || ["amenity=yes", "shop=yes", "office=yes"];

      // Build Overpass QL query â€” search within the neighborhood polygon in the city
      const locationQuery = bairroFiltro
        ? `"${(neighborhood as string)}" "${municipio || ""}" Brazil`
        : `"${municipio || "SÃ£o Paulo"}" Brazil`;

      // Build tag union for Overpass
      const tagUnion = osmTags
        .map(tag => {
          const [k, v] = tag.split("=");
          return v === "yes"
            ? `node["${k}"](area.searchArea);\nway["${k}"](area.searchArea);`
            : `node["${k}"="${v}"](area.searchArea);\nway["${k}"="${v}"](area.searchArea);`;
        })
        .join("\n");

      const overpassQuery = `
[out:json][timeout:15];
area[name="${bairroFiltro ? (neighborhood as string) : (municipio || "SÃ£o Paulo")}"]->.searchArea;
(
${tagUnion}
);
out center 50;
`.trim();

      try {
        const overpassUrl = "https://overpass-api.de/api/interpreter";
        console.log(`[CompanySearch] Overpass query para: ${bairroFiltro || municipio}`);

        const osmRes = await fetch(overpassUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `data=${encodeURIComponent(overpassQuery)}`,
          signal: AbortSignal.timeout(15000),
        });

        if (osmRes.ok) {
          const osmData = await osmRes.json();
          const elements: any[] = osmData.elements || [];
          console.log(`[CompanySearch] OSM retornou ${elements.length} elementos`);

          if (elements.length > 0) {
            results = elements
              .filter((el: any) => el.tags && el.tags.name)
              .map((el: any, i: number) => {
                const t = el.tags;
                const lat = el.lat ?? el.center?.lat ?? -23.55;
                const lng = el.lon ?? el.center?.lon ?? -46.63;
                const street = [t["addr:street"], t["addr:housenumber"]].filter(Boolean).join(", ");
                const neighborhood_name = t["addr:suburb"] || t["addr:neighbourhood"] || (bairroFiltro ? (neighborhood as string) : "");
                const city_name = t["addr:city"] || targetCity;
                const phone = t.phone || t["contact:phone"] || "";
                const website = t.website || t["contact:website"] || "";
                return {
                  razao_social: t.name || `Estabelecimento ${i + 1}`,
                  nome_fantasia: t.name || "",
                  cnpj: "** Consultar separadamente **",
                  logradouro: street || t["addr:street"] || "",
                  numero: t["addr:housenumber"] || "",
                  bairro: neighborhood_name || (bairroFiltro ? (neighborhood as string) : ""),
                  municipio: city_name,
                  uf: targetUf,
                  cep: t["addr:postcode"] || "",
                  cnae_principal_descricao: t.amenity || t.shop || t.office || t.leisure || detectedNiche?.cnaeDesc || "Estabelecimento",
                  ddd_telefone_1: phone,
                  website,
                  lat,
                  lng,
                };
              });
            apiSuccess = true;
            console.log(`[CompanySearch] OSM: ${results.length} negÃ³cios reais encontrados`);
          }
        }
      } catch (e: any) {
        console.warn(`[CompanySearch] OSM Overpass falhou: ${e.message}`);
      }
    }

    // -----------------------------------------------------------------------
    // Last resort: if both CNPJ API and OSM failed, return empty with a message
    // -----------------------------------------------------------------------
    if (!apiSuccess || results.length === 0) {
      console.warn(`[CompanySearch] Nenhum dado real encontrado para: ${bairroFiltro || municipio}`);
      // Return empty â€” the frontend will show "Nenhum resultado encontrado"
      return res.json([]);
    }

    // -----------------------------------------------------------------------
    // Post-processing filter: Ensure results match the city and bairro filters strictly
    // -----------------------------------------------------------------------
    if (bairroFiltro && results.length > 0) {
      results = results.filter(c =>
        (c.bairro || "").toUpperCase().trim().includes(bairroFiltro)
      );
    }

    if (municipio && results.length > 0) {
      results = results.filter(c =>
        !c.municipio || (c.municipio || "").toUpperCase().trim().includes(municipio)
      );
    }

    console.log(`[CompanySearch] Retornando ${results.length} empresas reais | nicho=${detectedNiche?.label || "geral"} | bairro=${bairroFiltro || "todos"}`);
    return res.json(results);
  });


  // Seed Data
  const servicesList = await storage.getServices();
  if (servicesList.length === 0) {
    await storage.createService({
      title: "Seguro Auto",
      description: "Proteção completa para seu veículo contra roubo, colisão e terceiros.",
      icon: "Car",
    });
    await storage.createService({
      title: "Seguro de Vida",
      description: "Garanta a segurança financeira da sua família em momentos difíceis.",
      icon: "Heart",
    });
    await storage.createService({
      title: "Plano de Saúde",
      description: "As melhores opções de planos de saúde para você e sua família.",
      icon: "Stethoscope",
    });
    await storage.createService({
      title: "Seguro Residencial",
      description: "Proteja seu lar contra incêndios, roubos e danos elétricos.",
      icon: "Home",
    });
  }


  const postsList = await storage.getPosts();
  if (postsList.length === 0) {
    await storage.createPost({
      title: "Por que contratar um seguro auto?",
      slug: "por-que-contratar-seguro-auto",
      summary: "Descubra a importância de ter seu veículo protegido e evite dores de cabeça.",
      content: "Ter um seguro auto é essencial para quem busca tranquilidade no trânsito...",
      coverImage: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=1000",
    });
    await storage.createPost({
      title: "Dicas para economizar no seguro",
      slug: "dicas-economizar-seguro",
      summary: "Saiba como reduzir o valor do seu seguro sem perder coberturas importantes.",
      content: "Muitas pessoas não sabem, mas pequenas atitudes podem diminuir o valor do seguro...",
      coverImage: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=1000",
    });
  }


  // Seed Admin User
  const existingUser = await storage.getUserByUsername("admin");
  if (!existingUser) {
    const hashedPassword = await hashPassword("admin123");
    await storage.createUser({
      username: "admin",
      password: hashedPassword,
      name: "Admin User",
      role: "admin",
    });
  }

  return httpServer;
}
