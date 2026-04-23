import { db } from "./server/db";
import { services, products } from "./shared/schema";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("🌱 Seeding services and products...");

  // Seed Products
  const productsToSeed = [
    { name: 'Plano de Saúde', description: 'Planos de saúde individuais, familiares e empresariais' },
    { name: 'Plano Odontológico', description: 'Planos odontológicos individuais, familiares e corporativos' },
    { name: 'Seguro de Vida', description: 'Seguro de vida individual, empresarial e para estagiários' },
    { name: 'Previdência Privada', description: 'Planejamento financeiro e aposentadoria complementar' },
    { name: 'Seguro Viagem', description: 'Cobertura para viagens nacionais e internacionais' },
    { name: 'Seguro Auto', description: 'Proteção veicular completa com cobertura personalizada' },
    { name: 'Seguro Pet', description: 'Saúde e proteção para animais de estimação' },
    { name: 'Assistência Funeral', description: 'Cobertura funeral individual e familiar' },
    { name: 'Acidentes Pessoais', description: 'Proteção financeira em acidentes com invalidez ou morte' },
    { name: 'Renda por Incapacidade (DIT/RIT)', description: 'Proteção de renda durante afastamento temporário' },
  ];

  for (const p of productsToSeed) {
    const existing = await db.select().from(products).where(eq(products.name, p.name));
    if (existing.length === 0) {
      await db.insert(products).values(p);
      console.log(`+ Product: ${p.name}`);
    }
  }

  // Seed Services
  const servicesToSeed = [
    { title: 'Plano de Saúde', description: 'Consultoria em planos de saúde empresariais e familiares, focada em otimização de custos e ampla rede credenciada.', icon: 'HeartPulse' },
    { title: 'Plano Odontológico', description: 'Soluções completas para saúde bucal com as melhores operadoras do mercado.', icon: 'Stethoscope' },
    { title: 'Seguro de Vida', description: 'Proteção financeira personalizada para garantir a tranquilidade de quem você ama.', icon: 'Shield' },
    { title: 'Previdência Privada', description: 'Planejamento estratégico para aposentadoria e sucessão patrimonial.', icon: 'TrendingUp' },
    { title: 'Seguro Viagem', description: 'Cobertura internacional e nacional para viagens de lazer ou negócios.', icon: 'Plane' },
    { title: 'Seguro Auto', description: 'Proteção veicular completa com assistência 24h e coberturas exclusivas.', icon: 'Car' },
    { title: 'Seguro Pet', description: 'Cuidado e proteção para a saúde do seu melhor amigo.', icon: 'Heart' },
    { title: 'Assistência Funeral', description: 'Suporte completo e humanizado em momentos difíceis.', icon: 'Activity' },
    { title: 'Acidentes Pessoais', description: 'Cobertura para morte acidental, invalidez e despesas médico-hospitalares.', icon: 'AlertTriangle' },
    { title: 'Renda por Incapacidade (DIT/RIT)', description: 'Garantia de renda para profissionais liberais e autônomos em caso de afastamento.', icon: 'Briefcase' },
  ];

  for (const s of servicesToSeed) {
    const existing = await db.select().from(services).where(eq(services.title, s.title));
    if (existing.length === 0) {
      await db.insert(services).values(s);
      console.log(`+ Service: ${s.title}`);
    }
  }

  console.log("✅ Seeding completed!");
}

seed().catch(console.error).finally(() => process.exit(0));
