import { db } from './server/db';
import { siteSettings } from './shared/schema';
import { eq } from 'drizzle-orm';

async function main() {
  const existing = await db.select().from(siteSettings);
  if (existing.length > 0) {
    const newContent = "Com anos de experiência no mercado, trabalhando com seguradoras e corretoras líderes no mercado mundial, a Monteiro Corretora oferece sempre o seguro mais adequado ao seu perfil – pessoal ou empresarial – e às suas expectativas, com um atendimento personalizado, humano e qualificado.\n\nNos preocupamos em oferecer aos segurados acompanhamento durante todas as etapas do processo, ou seja, durante a contratação e também no pós-venda, garantindo tranquilidade e segurança.";
    await db.update(siteSettings).set({ aboutContent: newContent }).where(eq(siteSettings.id, existing[0].id));
    console.log('Database updated successfully.');
  } else {
    console.log('No site settings found.');
  }
}

main().catch(console.error).finally(() => process.exit(0));
