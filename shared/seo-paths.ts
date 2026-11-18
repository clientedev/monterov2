// Endereços públicos amigáveis para buscadores, usados pelo site e pelo servidor.

export function slugify(text: string): string {
  return (text || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " e ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** /services/12-plano-de-saude-empresarial (o número continua sendo o que identifica o serviço). */
export function servicePath(service: { id: number; title?: string | null }): string {
  const slug = slugify(service.title || "");
  return slug ? `/services/${service.id}-${slug}` : `/services/${service.id}`;
}
