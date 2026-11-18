// Artigos de blog escritos para o SEO do site (novembro de 2026).
// Roda uma única vez: fica registrado em seed_runs, então um artigo apagado ou
// editado pelo painel nunca é recriado nem sobrescrito.

import { pool } from "./db";
import { storage } from "./storage";

const KEY = "seo-blog-posts-2026-11";

const POSTS = [
  {
    "title": "Plano de saúde empresarial para MEI e pequenas empresas: como funciona",
    "slug": "plano-de-saude-empresarial-mei-pequenas-empresas",
    "summary": "Entenda quem pode contratar plano de saúde pelo CNPJ, como funcionam carência e reajuste em contratos com menos de 30 vidas e o que comparar antes de fechar.",
    "coverImage": "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=1200",
    "content": "<p>O plano de saúde empresarial é contratado pelo CNPJ para oferecer assistência médica a sócios, funcionários e seus dependentes. Para muitas pequenas empresas e para o microempreendedor individual (MEI), ele é a forma mais acessível de ter um bom plano, porque o risco é dividido dentro de um contrato coletivo.</p><h2>MEI pode contratar plano de saúde empresarial?</h2><p>Sim. A ANS regulamenta a contratação de plano coletivo empresarial por empresário individual, e o requisito principal é ter CNPJ ativo e regular. Cada operadora define quantas vidas aceita no contrato, e várias já trabalham com contratos pequenos. Se a regularidade do CNPJ não for comprovada, a operadora pode rescindir o contrato após aviso prévio, por isso vale manter o cadastro em dia.</p><h2>Carência: o que muda com o número de vidas</h2><p>O número de pessoas no contrato faz diferença:</p><ul><li><strong>30 ou mais beneficiários:</strong> não há carência para quem entra em até 30 dias da assinatura do contrato ou da sua vinculação à empresa.</li><li><strong>Menos de 30 beneficiários:</strong> a operadora pode exigir carência, respeitando os prazos máximos da ANS (24 horas para urgência e emergência, 300 dias para parto a termo e 180 dias para os demais casos).</li><li><strong>Doenças e lesões preexistentes:</strong> podem ter Cobertura Parcial Temporária de até 24 meses, conforme as regras do contrato.</li></ul><p>Quem já tem plano há algum tempo pode, em muitos casos, usar a portabilidade de carências para não cumprir os prazos de novo. Vale checar essa possibilidade antes de trocar de plano.</p><h2>Como funciona o reajuste</h2><p>Nos planos coletivos não existe o teto de reajuste que a ANS define para os planos individuais. Os contratos com menos de 30 vidas de uma mesma operadora são agrupados e recebem o mesmo percentual de reajuste anual, o chamado pool de risco. Já nos contratos maiores, o reajuste é negociado entre a empresa e a operadora.</p><h2>O que comparar antes de contratar</h2><ul><li>Rede credenciada: hospitais, laboratórios e médicos que a sua equipe realmente usa.</li><li>Abrangência: municipal, estadual ou nacional.</li><li>Acomodação: enfermaria ou apartamento.</li><li>Coparticipação: mensalidade menor em troca de um valor por consulta ou exame, o que compensa para quem usa pouco.</li><li>Histórico de reajustes da operadora nos contratos pequenos.</li></ul><p>Uma corretora compara várias operadoras ao mesmo tempo, explica as regras de cada contrato e acompanha a empresa depois da assinatura, no reajuste, na inclusão de novos funcionários e no uso do plano.</p><p>Quer ajuda para escolher? <a href=\"/contact\">Fale com a Monteiro Seguros e Benefícios</a> e receba uma análise sem compromisso.</p>"
  },
  {
    "title": "PGBL ou VGBL: qual previdência privada escolher",
    "slug": "pgbl-ou-vgbl-qual-previdencia-privada-escolher",
    "summary": "A diferença entre PGBL e VGBL está no Imposto de Renda: veja para quem a dedução de 12% vale a pena, como funciona a tabela regressiva e como decidir.",
    "coverImage": "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=1200",
    "content": "<p>PGBL e VGBL são os dois tipos de plano de previdência privada vendidos no Brasil. Os dois servem para acumular recursos no longo prazo. A grande diferença está no Imposto de Renda: quando você paga e sobre qual valor.</p><h2>PGBL: dedução de até 12% da renda</h2><p>No PGBL, as contribuições podem ser deduzidas da base de cálculo do Imposto de Renda até o limite de 12% da renda bruta tributável anual. Essa vantagem só vale para quem faz a declaração completa e contribui para o INSS ou para um regime próprio de previdência. Em troca, no resgate o imposto incide sobre o valor total: o que você aplicou mais os rendimentos.</p><h2>VGBL: imposto só sobre os rendimentos</h2><p>No VGBL não há dedução na declaração, mas no resgate o imposto incide apenas sobre os rendimentos. Por isso ele costuma ser indicado para quem faz a declaração simplificada, é isento, não contribui para o INSS ou já usa todo o limite de 12% no PGBL e quer aplicar mais.</p><h2>Tabela progressiva ou regressiva</h2><p>Os dois planos permitem escolher a forma de tributação. Na tabela regressiva, a alíquota começa em 35% para resgates feitos em até 2 anos e cai até 10% para valores que ficam mais de 10 anos no plano. É a opção comum para quem pensa em aposentadoria. A escolha é feita na contratação, então vale decidir com calma.</p><h2>Resumo para decidir</h2><ul><li>Faz declaração completa e contribui para o INSS: o PGBL tende a ser mais vantajoso, até 12% da renda bruta.</li><li>Faz declaração simplificada, é isento ou já usa os 12%: o VGBL tende a ser a melhor escolha.</li><li>Pretende deixar o dinheiro por mais de 10 anos: considere a tabela regressiva.</li></ul><p>Taxas de administração e de carregamento, o histórico do fundo e a portabilidade entre planos também pesam no resultado. Este conteúdo é informativo e não substitui uma análise da sua situação.</p><p>Quer ajuda para escolher? <a href=\"/contact\">Fale com a Monteiro Seguros e Benefícios</a> e receba uma análise sem compromisso.</p>"
  }
];

export async function seedSeoPosts() {
  try {
    await pool.query("CREATE TABLE IF NOT EXISTS seed_runs (key TEXT PRIMARY KEY, ran_at TIMESTAMP DEFAULT NOW())");
    const done = await pool.query("SELECT 1 FROM seed_runs WHERE key = $1", [KEY]);
    if (done.rowCount) return;
    for (const p of POSTS) {
      const exists = await pool.query("SELECT 1 FROM posts WHERE slug = $1", [p.slug]);
      if (exists.rowCount) continue;
      await storage.createPost({ ...p, postType: "article", isApproved: true, isFeatured: false } as any);
      console.log(`[SEO] artigo publicado: ${p.slug}`);
    }
    await pool.query("INSERT INTO seed_runs (key) VALUES ($1) ON CONFLICT DO NOTHING", [KEY]);
  } catch (err: any) {
    console.warn("[SEO] não foi possível publicar os artigos:", err?.message);
  }
}
