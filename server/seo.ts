// SEO do site público.
//
// O site é uma aplicação React: sem isto, o Google recebia a mesma página vazia
// (mesmo título, nenhum texto) em todas as URLs. Aqui o servidor monta, para cada
// página pública, título, descrição, URL canônica, Open Graph, dados estruturados
// (schema.org) e uma versão em HTML do conteúdo, tudo a partir dos dados reais do
// banco (configurações do site, serviços e posts do blog). O React substitui esse
// HTML assim que carrega, então nada muda para o visitante.
//
// Também gera /robots.txt e /sitemap.xml e marca áreas privadas como noindex.

import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { slugify, servicePath } from "@shared/seo-paths";

export const SITE_URL = (process.env.PUBLIC_SITE_URL || "https://www.monteiroseguros.com.br").replace(/\/+$/, "");
const CANONICAL_HOST = new URL(SITE_URL).host;
const OG_IMAGE = `${SITE_URL}/og-image.jpg`;
const LOGO = `${SITE_URL}/logo-monteiro-512.png`;

type JsonLd = Record<string, any>;

export interface PageSeo {
  status: number;
  title: string;
  description: string;
  canonical: string | null;
  robots: string;
  ogType: "website" | "article";
  image: string;
  imageAlt: string;
  jsonLd: JsonLd[];
  body: string;
  publishedTime?: string;
}

// ---------------------------------------------------------------- utilidades

const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Texto puro a partir de HTML/markdown simples. */
function plain(s: unknown): string {
  return String(s ?? "")
    .replace(/\\n/g, "\n")
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_#>`~]+/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*/g, "\n\n")
    .trim();
}

/** Corta em ~max caracteres sem quebrar palavra. */
function clip(s: string, max = 158): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const at = cut.lastIndexOf(" ");
  return (at > max * 0.6 ? cut.slice(0, at) : cut).replace(/[\s,;:.\-–—]+$/, "") + "…";
}

const paragraphs = (s: unknown, limit = 60) =>
  plain(s)
    .split(/\n{2,}|\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, limit)
    .map((p) => `<p>${esc(p)}</p>`)
    .join("");

const abs = (u?: string | null) => {
  if (!u || u.startsWith("data:")) return null;
  if (/^https?:\/\//i.test(u)) return u;
  return `${SITE_URL}${u.startsWith("/") ? "" : "/"}${u}`;
};

/** Telefone de exemplo ("9999-9999") nunca vai para o Google. */
function realPhone(p?: string | null): string | null {
  const digits = (p || "").replace(/\D/g, "");
  if (digits.length < 10 || /9{7,}|0{7,}|1234567/.test(digits)) return null;
  return p!.trim();
}

function cityOf(address?: string | null): { city?: string; uf?: string; street?: string } {
  const a = (address || "").replace(/\s+/g, " ").trim();
  if (!a || /Rua do Com[eé]rcio, 123/i.test(a)) return {};
  const m = a.match(/([A-Za-zÀ-ÿ'. ]{3,}?)\s*[-,/]\s*([A-Z]{2})\b/);
  const city = m?.[1]?.split(",").pop()?.trim();
  const uf = m?.[2];
  const street = m ? a.slice(0, m.index).replace(/[\s,\-–]+$/, "").trim() : "";
  return { city, uf, street: street.length > 5 ? street : undefined };
}

function socials(s: any): string[] {
  return [s?.instagramUrl, s?.facebookUrl, s?.linkedinUrl, s?.twitterUrl]
    .filter((u: any) => typeof u === "string" && /^https?:\/\//i.test(u.trim()))
    .map((u: string) => u.trim());
}

// ---------------------------------------------------------------- dados

interface SiteData {
  settings: any;
  services: any[];
  posts: any[];
}

async function loadData(): Promise<SiteData> {
  const [settings, services, posts] = await Promise.all([
    storage.getSiteSettings().catch(() => ({} as any)),
    storage.getServices().catch(() => [] as any[]),
    storage.getPosts(true, false).catch(() => [] as any[]),
  ]);
  return { settings: settings || {}, services: services || [], posts: posts || [] };
}

function brand(d: SiteData) {
  const s = d.settings;
  const name = (s.siteName || "Monteiro Seguros e Benefícios").trim();
  const { city, uf, street } = cityOf(s.address);
  const where = city || "";
  return { name, city, uf, street, where, phone: realPhone(s.contactPhone), email: (s.contactEmail || "").trim() };
}

function organization(d: SiteData): JsonLd {
  const b = brand(d);
  const s = d.settings;
  const org: JsonLd = {
    "@type": "InsuranceAgency",
    "@id": `${SITE_URL}/#organizacao`,
    name: b.name,
    alternateName: ["Monteiro Seguros", "Monteiro Corretora de Seguros"],
    url: `${SITE_URL}/`,
    logo: { "@type": "ImageObject", url: LOGO, width: 512, height: 512 },
    image: OG_IMAGE,
    description: clip(plain(s.heroSubtitle || s.aboutContent || ""), 300),
    slogan: plain(s.footerText || "") || undefined,
    founder: {
      "@type": "Person",
      name: "Carolina Monteiro",
      jobTitle: "Diretora Executiva e Consultora Estratégica",
    },
    knowsAbout: d.services.map((x) => x.title).filter(Boolean),
    areaServed: { "@type": "Country", name: "Brasil" },
  };
  if (b.phone) org.telephone = b.phone;
  if (b.email) org.email = b.email;
  if (b.city) {
    org.address = {
      "@type": "PostalAddress",
      ...(b.street ? { streetAddress: b.street } : {}),
      addressLocality: b.city,
      ...(b.uf ? { addressRegion: b.uf } : {}),
      addressCountry: "BR",
    };
  }
  const same = socials(s);
  if (same.length) org.sameAs = same;
  if (d.services.length) {
    org.hasOfferCatalog = {
      "@type": "OfferCatalog",
      name: "Seguros e benefícios",
      itemListElement: d.services.map((x) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: x.title, url: `${SITE_URL}${servicePath(x)}` },
      })),
    };
  }
  if (b.phone) {
    org.contactPoint = {
      "@type": "ContactPoint",
      telephone: b.phone,
      contactType: "customer service",
      areaServed: "BR",
      availableLanguage: "Portuguese",
    };
  }
  return org;
}

const website = (d: SiteData): JsonLd => ({
  "@type": "WebSite",
  "@id": `${SITE_URL}/#site`,
  url: `${SITE_URL}/`,
  name: brand(d).name,
  inLanguage: "pt-BR",
  publisher: { "@id": `${SITE_URL}/#organizacao` },
});

function breadcrumb(items: Array<[string, string]>): JsonLd {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map(([name, path], i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
      item: `${SITE_URL}${path}`,
    })),
  };
}

// ---------------------------------------------------------------- HTML de conteúdo

function shell(d: SiteData, inner: string, crumbs?: Array<[string, string]>): string {
  const b = brand(d);
  const nav = [
    ["/", "Início"],
    ["/sobre", "Sobre"],
    ["/services", "Soluções"],
    ["/blog", "Blog"],
    ["/contact", "Contato"],
  ]
    .map(([h, t]) => `<a href="${h}">${t}</a>`)
    .join(" ");
  const trail = crumbs && crumbs.length > 1
    ? `<nav aria-label="Você está em" class="seo-crumbs">${crumbs
        .map(([n, p], i) => (i < crumbs.length - 1 ? `<a href="${p}">${esc(n)}</a> › ` : `<span>${esc(n)}</span>`))
        .join("")}</nav>`
    : "";
  const contact = [b.where && esc(b.where), b.phone && esc(b.phone), b.email && `<a href="mailto:${esc(b.email)}">${esc(b.email)}</a>`]
    .filter(Boolean)
    .join(" · ");
  const svc = d.services.length
    ? `<p>${d.services.map((x) => `<a href="${servicePath(x)}">${esc(x.title)}</a>`).join(" · ")}</p>`
    : "";
  return `<div id="seo-ssr"><header><a href="/" class="seo-brand">${esc(b.name)}</a><nav>${nav}</nav></header>${trail}<main>${inner}</main><footer><strong>${esc(b.name)}</strong>${svc}<p>${contact}</p></footer></div>`;
}

const SSR_STYLE = `<style id="seo-ssr-style">#seo-ssr{font-family:Inter,system-ui,sans-serif;color:#163b52;max-width:1100px;margin:0 auto;padding:24px;line-height:1.6}#seo-ssr header{display:flex;flex-wrap:wrap;gap:16px;justify-content:space-between;align-items:center;padding:12px 0 24px}#seo-ssr a{color:#08454c}#seo-ssr nav a{margin-right:14px;text-decoration:none;font-weight:600}#seo-ssr .seo-brand{font-weight:800;font-size:1.25rem;text-decoration:none}#seo-ssr h1{font-size:2.2rem;line-height:1.2;margin:.4em 0}#seo-ssr h2{font-size:1.4rem;margin:1.4em 0 .4em}#seo-ssr footer{margin-top:48px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:.9rem}#seo-ssr .seo-crumbs{font-size:.85rem;margin-bottom:8px}#seo-ssr ul{padding-left:1.2em}</style>`;

// ---------------------------------------------------------------- páginas

const NOINDEX_PREFIXES = ["/admin", "/login", "/register", "/criar-senha", "/embed", "/dashboard", "/profile"];

export function isPrivatePath(p: string) {
  return NOINDEX_PREFIXES.some((x) => p === x || p.startsWith(`${x}/`));
}

function base(d: SiteData, partial: Partial<PageSeo> & { title: string; description: string; canonical: string | null }): PageSeo {
  return {
    status: 200,
    robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    ogType: "website",
    image: OG_IMAGE,
    imageAlt: brand(d).name,
    jsonLd: [],
    body: "",
    ...partial,
  };
}

export async function seoForPath(rawPath: string): Promise<PageSeo & { redirect?: string }> {
  const path = decodeURIComponent(rawPath.split("?")[0] || "/").replace(/\/+$/, "") || "/";
  const d = await loadData();
  const b = brand(d);
  const s = d.settings;
  const tagline = `Corretora de Seguros e Benefícios${b.where ? ` em ${b.where}` : ""}`;
  const svcNames = d.services.map((x) => x.title).filter(Boolean);
  const graph = (...nodes: JsonLd[]) => [{ "@context": "https://schema.org", "@graph": [organization(d), website(d), ...nodes] }];

  if (isPrivatePath(path)) {
    return base(d, {
      title: `Área restrita | ${b.name}`,
      description: `Acesso restrito da ${b.name}.`,
      canonical: null,
      robots: "noindex, nofollow",
    });
  }

  // Início
  if (path === "/") {
    const hero = plain(s.heroSubtitle || "");
    // Descrição montada com os serviços cadastrados: é o que as pessoas buscam no Google.
    const list = svcNames.map((n, i) => (i === 0 ? n : n.charAt(0).toLowerCase() + n.slice(1)));
    const make = (k: number) => {
      const l = list.slice(0, k);
      const j = l.length > 1 ? `${l.slice(0, -1).join(", ")} e ${l[l.length - 1]}` : l[0] || "";
      return `Corretora de seguros e benefícios${b.where ? ` em ${b.where}` : ""}: ${j}. Consultoria para empresas e famílias.`;
    };
    let k = list.length;
    while (k > 1 && make(k).length > 160) k--;
    const desc = svcNames.length
      ? clip(make(k), 160)
      : clip(hero.includes(b.name) ? hero : `${b.name}: ${hero}`);
    const posts = d.posts.slice(0, 6);
    const inner = `<h1>${esc(b.name)} — ${esc(tagline)}</h1>
<p>${esc(hero)}</p>
${d.services.length ? `<h2>${esc(plain(s.servicesTitle) || "Nossas soluções")}</h2><p>${esc(plain(s.servicesSubtitle || ""))}</p><ul>${d.services
      .map((x) => `<li><a href="${servicePath(x)}">${esc(x.title)}</a> — ${esc(clip(plain(x.description), 160))}</li>`)
      .join("")}</ul>` : ""}
<h2>${esc(plain(s.aboutTitle) || "Sobre nós")}</h2>${paragraphs(s.aboutContent, 6)}<p><a href="/sobre">Conheça a ${esc(b.name)}</a></p>
${posts.length ? `<h2>${esc(plain(s.blogTitle) || "Blog")}</h2><ul>${posts.map((p) => `<li><a href="/blog/${esc(p.slug)}">${esc(p.title)}</a></li>`).join("")}</ul>` : ""}
<p><a href="/contact">Fale com um consultor</a></p>`;
    return base(d, {
      title: `${b.name} | ${tagline}`,
      description: desc,
      canonical: `${SITE_URL}/`,
      jsonLd: graph({
        "@type": "WebPage",
        "@id": `${SITE_URL}/#pagina`,
        url: `${SITE_URL}/`,
        name: `${b.name} | ${tagline}`,
        description: desc,
        isPartOf: { "@id": `${SITE_URL}/#site` },
        about: { "@id": `${SITE_URL}/#organizacao` },
        inLanguage: "pt-BR",
      }),
      body: shell(d, inner),
    });
  }

  if (path === "/sobre") {
    const crumbs: Array<[string, string]> = [["Início", "/"], ["Sobre", "/sobre"]];
    const desc = clip(plain(s.aboutContent || s.heroSubtitle || ""));
    const inner = `<h1>${esc(plain(s.aboutTitle) || `Sobre a ${b.name}`)}</h1>${paragraphs(s.aboutContent, 20)}
<h2>Carolina Monteiro</h2><p>Diretora Executiva e Consultora Estratégica. Carolina Monteiro estruturou a ${esc(b.name)} trazendo como fundação sua bagagem de mais de 10 anos em gestão estratégica de riscos, com atuação no mercado corporativo (B2B) e no atendimento a famílias (B2C).</p>`;
    return base(d, {
      title: `Sobre a ${b.name} | Quem somos`,
      description: desc,
      canonical: `${SITE_URL}/sobre`,
      jsonLd: graph({ "@type": "AboutPage", url: `${SITE_URL}/sobre`, name: `Sobre a ${b.name}`, description: desc, inLanguage: "pt-BR", about: { "@id": `${SITE_URL}/#organizacao` } }, breadcrumb(crumbs)),
      body: shell(d, inner, crumbs),
    });
  }

  if (path === "/services") {
    const crumbs: Array<[string, string]> = [["Início", "/"], ["Soluções", "/services"]];
    const desc = clip(`${plain(s.servicesSubtitle || "")} ${svcNames.length ? `${svcNames.join(", ")} com a ${b.name}.` : ""}`);
    const inner = `<h1>${esc(plain(s.servicesTitle) || "Seguros e benefícios")}</h1><p>${esc(plain(s.servicesSubtitle || ""))}</p>${d.services
      .map((x) => `<h2><a href="${servicePath(x)}">${esc(x.title)}</a></h2><p>${esc(clip(plain(x.description), 320))}</p>`)
      .join("")}`;
    return base(d, {
      title: `Seguros e Benefícios para Empresas e Famílias | ${b.name}`,
      description: desc,
      canonical: `${SITE_URL}/services`,
      jsonLd: graph(
        {
          "@type": "CollectionPage",
          url: `${SITE_URL}/services`,
          name: plain(s.servicesTitle) || "Soluções",
          description: desc,
          inLanguage: "pt-BR",
          mainEntity: {
            "@type": "ItemList",
            itemListElement: d.services.map((x, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}${servicePath(x)}`, name: x.title })),
          },
        },
        breadcrumb(crumbs),
      ),
      body: shell(d, inner, crumbs),
    });
  }

  const svcMatch = path.match(/^\/services\/(\d+)(?:-[a-z0-9-]*)?$/);
  if (svcMatch) {
    const svc = d.services.find((x) => x.id === Number(svcMatch[1]));
    if (svc) {
      const canonicalPath = servicePath(svc);
      if (canonicalPath !== path) return { ...base(d, { title: "", description: "", canonical: null }), redirect: canonicalPath };
      const crumbs: Array<[string, string]> = [["Início", "/"], ["Soluções", "/services"], [svc.title, canonicalPath]];
      const desc = clip(plain(svc.description));
      const inner = `<h1>${esc(svc.title)}</h1>${paragraphs(svc.description, 40)}
<h2>Fale com um especialista</h2><p>Receba uma consultoria da ${esc(b.name)} sobre ${esc(svc.title)}. <a href="/contact">Entre em contato</a>.</p>
<h2>Outras soluções</h2><ul>${d.services.filter((x) => x.id !== svc.id).map((x) => `<li><a href="${servicePath(x)}">${esc(x.title)}</a></li>`).join("")}</ul>`;
      return base(d, {
        title: `${svc.title}${b.where ? ` em ${b.where}` : ""} | ${b.name}`,
        description: desc,
        canonical: `${SITE_URL}${canonicalPath}`,
        jsonLd: graph(
          {
            "@type": "Service",
            "@id": `${SITE_URL}${canonicalPath}#servico`,
            name: svc.title,
            serviceType: svc.title,
            description: clip(plain(svc.description), 500),
            url: `${SITE_URL}${canonicalPath}`,
            provider: { "@id": `${SITE_URL}/#organizacao` },
            areaServed: { "@type": "Country", name: "Brasil" },
          },
          breadcrumb(crumbs),
        ),
        body: shell(d, inner, crumbs),
      });
    }
  }

  if (path === "/blog") {
    const crumbs: Array<[string, string]> = [["Início", "/"], ["Blog", "/blog"]];
    const desc = clip(plain(s.blogSubtitle || "") || `Artigos e novidades sobre seguros e benefícios da ${b.name}.`);
    const inner = `<h1>${esc(plain(s.blogTitle) || "Blog")}</h1><p>${esc(plain(s.blogSubtitle || ""))}</p><ul>${d.posts
      .map((p) => `<li><h2><a href="/blog/${esc(p.slug)}">${esc(p.title)}</a></h2><p>${esc(clip(plain(p.summary), 220))}</p></li>`)
      .join("")}</ul>`;
    return base(d, {
      title: `Blog: dicas sobre seguros e benefícios | ${b.name}`,
      description: desc,
      canonical: `${SITE_URL}/blog`,
      jsonLd: graph(
        {
          "@type": "Blog",
          url: `${SITE_URL}/blog`,
          name: plain(s.blogTitle) || "Blog",
          description: desc,
          inLanguage: "pt-BR",
          publisher: { "@id": `${SITE_URL}/#organizacao` },
          blogPost: d.posts.slice(0, 30).map((p) => ({ "@type": "BlogPosting", headline: p.title, url: `${SITE_URL}/blog/${p.slug}` })),
        },
        breadcrumb(crumbs),
      ),
      body: shell(d, inner, crumbs),
    });
  }

  const postMatch = path.match(/^\/blog\/([^/]+)$/);
  if (postMatch) {
    const post = await storage.getPostBySlug(postMatch[1]).catch(() => undefined);
    if (post && post.isApproved !== false) {
      const url = `${SITE_URL}/blog/${post.slug}`;
      const crumbs: Array<[string, string]> = [["Início", "/"], ["Blog", "/blog"], [post.title, `/blog/${post.slug}`]];
      const desc = clip(plain(post.summary || post.content));
      const img = abs(post.coverImage) || OG_IMAGE;
      const published = (post.publishedAt || post.createdAt) ? new Date((post.publishedAt || post.createdAt) as any).toISOString() : undefined;
      const inner = `<article><h1>${esc(post.title)}</h1>${published ? `<p><time datetime="${published}">${new Date(published).toLocaleDateString("pt-BR")}</time></p>` : ""}<p><strong>${esc(plain(post.summary))}</strong></p>${paragraphs(post.content, 200)}</article>
<p><a href="/blog">Mais artigos</a> · <a href="/contact">Fale com um consultor</a></p>`;
      return base(d, {
        title: `${post.title} | ${b.name}`,
        description: desc,
        canonical: url,
        ogType: "article",
        image: img,
        imageAlt: post.title,
        publishedTime: published,
        jsonLd: graph(
          {
            "@type": "BlogPosting",
            "@id": `${url}#artigo`,
            headline: clip(post.title, 110),
            description: desc,
            image: [img],
            url,
            mainEntityOfPage: url,
            inLanguage: "pt-BR",
            ...(published ? { datePublished: published, dateModified: published } : {}),
            author: { "@type": "Organization", name: b.name, url: `${SITE_URL}/` },
            publisher: { "@id": `${SITE_URL}/#organizacao` },
          },
          breadcrumb(crumbs),
        ),
        body: shell(d, inner, crumbs),
      });
    }
  }

  if (path === "/contact") {
    const crumbs: Array<[string, string]> = [["Início", "/"], ["Contato", "/contact"]];
    const bits = [b.phone, b.email].filter(Boolean).join(" · ");
    const desc = clip(`Fale com a ${b.name}${b.where ? ` em ${b.where}` : ""} e receba uma consultoria em seguros e benefícios para você, sua família ou sua empresa.${bits ? ` ${bits}.` : ""}`);
    const inner = `<h1>Contato</h1><p>${esc(desc)}</p><ul>${b.where ? `<li>Endereço: ${esc(plain(s.address))}</li>` : ""}${b.phone ? `<li>Telefone e WhatsApp: ${esc(b.phone)}</li>` : ""}${b.email ? `<li>E-mail: <a href="mailto:${esc(b.email)}">${esc(b.email)}</a></li>` : ""}</ul>`;
    return base(d, {
      title: `Contato | ${b.name}${b.where ? ` em ${b.where}` : ""}`,
      description: desc,
      canonical: `${SITE_URL}/contact`,
      jsonLd: graph({ "@type": "ContactPage", url: `${SITE_URL}/contact`, name: `Contato | ${b.name}`, description: desc, inLanguage: "pt-BR", about: { "@id": `${SITE_URL}/#organizacao` } }, breadcrumb(crumbs)),
      body: shell(d, inner, crumbs),
    });
  }

  // Qualquer outra URL: página não encontrada de verdade (status 404), fora do índice.
  return base(d, {
    status: 404,
    title: `Página não encontrada | ${b.name}`,
    description: `A página procurada não existe. Conheça as soluções em seguros e benefícios da ${b.name}.`,
    canonical: null,
    robots: "noindex, follow",
    body: shell(d, `<h1>Página não encontrada</h1><p>Esta página não existe ou foi removida. <a href="/">Voltar ao início</a>.</p>`),
  });
}

// ---------------------------------------------------------------- injeção no index.html

const cache = new Map<string, { at: number; seo: Awaited<ReturnType<typeof seoForPath>> }>();
const TTL = 60_000;

export async function cachedSeo(path: string) {
  const key = path.split("?")[0];
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.seo;
  const seo = await seoForPath(key);
  if (cache.size > 500) cache.clear();
  cache.set(key, { at: Date.now(), seo });
  return seo;
}

export function headTags(seo: PageSeo, siteName: string): string {
  const v = process.env.GOOGLE_SITE_VERIFICATION;
  const tags = [
    `<title>${esc(seo.title)}</title>`,
    `<meta name="description" content="${esc(seo.description)}" />`,
    `<meta name="robots" content="${esc(seo.robots)}" />`,
    seo.canonical ? `<link rel="canonical" href="${esc(seo.canonical)}" />` : "",
    `<meta property="og:locale" content="pt_BR" />`,
    `<meta property="og:site_name" content="${esc(siteName)}" />`,
    `<meta property="og:type" content="${seo.ogType}" />`,
    `<meta property="og:title" content="${esc(seo.title)}" />`,
    `<meta property="og:description" content="${esc(seo.description)}" />`,
    seo.canonical ? `<meta property="og:url" content="${esc(seo.canonical)}" />` : "",
    `<meta property="og:image" content="${esc(seo.image)}" />`,
    `<meta property="og:image:alt" content="${esc(seo.imageAlt)}" />`,
    seo.image === OG_IMAGE ? `<meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" />` : "",
    seo.publishedTime ? `<meta property="article:published_time" content="${seo.publishedTime}" />` : "",
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(seo.title)}" />`,
    `<meta name="twitter:description" content="${esc(seo.description)}" />`,
    `<meta name="twitter:image" content="${esc(seo.image)}" />`,
    v ? `<meta name="google-site-verification" content="${esc(v)}" />` : "",
    ...seo.jsonLd.map((j) => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, "\\u003c")}</script>`),
  ];
  return tags.filter(Boolean).join("\n  ");
}

/** Aplica o SEO da URL ao index.html (usado em produção e no modo de desenvolvimento). */
export async function renderIndex(template: string, url: string): Promise<{ html: string; status: number; redirect?: string; robots: string }> {
  const seo = await cachedSeo(url);
  if (seo.redirect) return { html: "", status: 301, redirect: seo.redirect, robots: seo.robots };
  const settings = await storage.getSiteSettings().catch(() => ({} as any));
  const siteName = (settings?.siteName || "Monteiro Seguros e Benefícios").trim();
  // Funções na substituição: o conteúdo pode ter "$", que o replace() interpretaria.
  const head = `${headTags(seo, siteName)}\n  ${seo.body ? SSR_STYLE : ""}`;
  let html = template.replace(/<!--SEO:START-->[\s\S]*?<!--SEO:END-->/, () => head);
  html = html.replace(/<div id="root"><\/div>/, () => `<div id="root">${seo.body}</div>`);
  return { html, status: seo.status, robots: seo.robots };
}

// ---------------------------------------------------------------- rotas

function xml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function registerSeo(app: Express) {
  // Um único endereço oficial: monteiroseguros.com.br -> www, e sem barra no final.
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    const host = (req.headers["x-forwarded-host"] as string) || req.headers.host || "";
    const bareHost = CANONICAL_HOST.replace(/^www\./, "");
    if (host === bareHost) return res.redirect(301, `${SITE_URL}${req.originalUrl}`);
    if (req.path.length > 1 && req.path.endsWith("/") && !req.path.startsWith("/api/")) {
      const q = req.originalUrl.slice(req.path.length);
      return res.redirect(301, `${req.path.replace(/\/+$/, "") || "/"}${q}`);
    }
    // Respostas da API e áreas privadas nunca entram no índice do Google.
    if (req.path.startsWith("/api/") && !/\/(image|video)$/.test(req.path)) res.setHeader("X-Robots-Tag", "noindex");
    else if (isPrivatePath(req.path)) res.setHeader("X-Robots-Tag", "noindex, nofollow");
    next();
  });

  app.get("/robots.txt", (_req, res) => {
    res.type("text/plain").setHeader("Cache-Control", "public, max-age=3600");
    res.send(
      [
        "User-agent: *",
        "Allow: /",
        "Disallow: /admin",
        "Disallow: /dashboard",
        "Disallow: /profile",
        "Disallow: /criar-senha",
        "Disallow: /embed/",
        "",
        `Sitemap: ${SITE_URL}/sitemap.xml`,
        "",
      ].join("\n"),
    );
  });

  app.get("/sitemap.xml", async (_req, res) => {
    try {
      const d = await loadData();
      const day = (v: any) => (v ? new Date(v).toISOString().slice(0, 10) : undefined);
      const latestPost = d.posts.map((p) => day(p.publishedAt || p.createdAt)).filter(Boolean).sort().pop();
      const urls: Array<{ loc: string; lastmod?: string; priority: string; changefreq: string }> = [
        { loc: "/", priority: "1.0", changefreq: "weekly" },
        { loc: "/services", priority: "0.9", changefreq: "monthly" },
        ...d.services.map((x) => ({ loc: servicePath(x), priority: "0.9", changefreq: "monthly" })),
        { loc: "/sobre", priority: "0.7", changefreq: "monthly" },
        { loc: "/contact", priority: "0.7", changefreq: "yearly" },
        { loc: "/blog", lastmod: latestPost, priority: "0.7", changefreq: "weekly" },
        ...d.posts.map((p) => ({ loc: `/blog/${p.slug}`, lastmod: day(p.publishedAt || p.createdAt), priority: "0.6", changefreq: "monthly" })),
      ];
      const body = urls
        .map(
          (u) =>
            `  <url><loc>${xml(SITE_URL + u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}<changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`,
        )
        .join("\n");
      res.type("application/xml").setHeader("Cache-Control", "public, max-age=3600");
      res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`);
    } catch (e: any) {
      res.status(500).type("text/plain").send("sitemap indisponível");
    }
  });

  // Usado pelo site para atualizar título e descrição ao navegar entre páginas.
  app.get("/api/seo", async (req, res) => {
    const p = typeof req.query.path === "string" ? req.query.path : "/";
    const seo = await cachedSeo(p.startsWith("/") ? p : `/${p}`);
    res.setHeader("Cache-Control", "public, max-age=60");
    res.json({ title: seo.title, description: seo.description, canonical: seo.canonical, robots: seo.robots, image: seo.image, ogType: seo.ogType });
  });
}

export { slugify };
