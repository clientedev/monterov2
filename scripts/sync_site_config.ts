import { db } from "../server/db";
import { siteSettings, heroSlides } from "../shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Iniciando sincronização precisa...");

  // 1. Sincronizar site_settings
  const existingSettings = await db.select().from(siteSettings);
  const settingsData = {
    siteName: "Monteiro Seguros e Benefícios",
    instagramUrl: "https://www.instagram.com/monteirosegurosebeneficios/",
    contactPhone: "+55 (11) 94454-7444",
    contactEmail: "carolina@monteirocorretora.com.br",
    address: "Av. Santa Marina, 2569 - São Paulo, SP",
    servicesTitle: "Seguros Estruturados & Benefícios Inteligentes",
    servicesSubtitle: "Modelos boutique de apólices elaboradas para resguardar sua vida corporativa, saúde familiar e legado patrimonial de forma sustentável.",
    blogTitle: "Nossos Posts & Publicações",
    blogSubtitle: "Fique por dentro das novidades, orientações e publicações da Monteiro Seguros e Benefícios.",
    footerText: "Oferecemos uma verdadeira consultoria em seguros e benefícios para você e sua empresa.",
    aboutTitle: "Sobre a Monteiro Seguros e Benefícios",
    aboutContent: "A Monteiro Seguros e Benefícios é especializada em oferecer consultoria estratégica em proteção e benefícios para empresas e famílias.\n\nMais do que comercializar seguros, atuamos como parceiros na construção de soluções que equilibram cuidado com pessoas, controle de custos e segurança financeira, tanto no ambiente corporativo quanto na vida pessoal.\n\nPara empresas, desenvolvemos estratégias que fortalecem a retenção de talentos e organizam os benefícios de forma inteligente.\n\nPara pessoas e famílias, criamos proteções personalizadas que garantem tranquilidade em todas as fases da vida.\n\nNosso trabalho começa antes da contratação e continua no dia a dia, garantindo que cada decisão esteja sempre alinhada ao momento e às necessidades de quem atendemos.",
    aboutImageBase64: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=1600",
    primaryColor: "#08454c",
    secondaryColor: "#c65f54",
    fontSans: "Inter",
    fontDisplay: "Outfit",
    logoScale: 160,
    logoScaleMobile: 140,
    updatedAt: new Date(),
  };

  if (existingSettings.length > 0) {
    await db
      .update(siteSettings)
      .set(settingsData)
      .where(eq(siteSettings.id, existingSettings[0].id));
    console.log("✅ site_settings atualizado!");
  } else {
    await db.insert(siteSettings).values(settingsData as any);
    console.log("✅ site_settings inserido!");
  }

  // 2. Sincronizar hero_slides com os 3 slides reais postados no site
  await db.delete(heroSlides);

  const slidesToInsert = [
    {
      title: "Planos de Saúde Individuais & Familiares",
      subtitle:
        "A proteção mais completa para quem você ama. Acesso aos melhores hospitais do país com condições diferenciadas e atendimento personalizado.",
      imageBase64:
        "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&q=80&w=2000",
      buttonText: "Cotação Individual",
      buttonLink: "/contact",
      order: 0,
      isActive: true,
    },
    {
      title: "Benefícios Corporativos Sob Medida",
      subtitle:
        "Reduza a sinistralidade e valorize sua equipe. Planos de saúde empresariais customizados para pequenas, médias e grandes empresas.",
      imageBase64:
        "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=2000",
      buttonText: "Cotação Corporativa",
      buttonLink: "/contact",
      order: 1,
      isActive: true,
    },
    {
      title: "Planos de Saúde Premium & Reembolso",
      subtitle:
        "Reembolsos diferenciados, telemedicina de ponta e assistência nacional e internacional. O padrão de saúde que sua família e executivos merecem.",
      imageBase64:
        "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=2000",
      buttonText: "Planos Premium",
      buttonLink: "/contact",
      order: 2,
      isActive: true,
    },
  ];

  for (const slide of slidesToInsert) {
    await db.insert(heroSlides).values(slide);
  }
  console.log("✅ 3 hero_slides inseridos com sucesso!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Erro na sincronização:", err);
  process.exit(1);
});
