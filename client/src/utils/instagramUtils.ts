/**
 * Utilitários para detecção, extração e geração de URLs do Instagram
 * Suporta publicações (/p/), reels (/reel/), vídeos IGTV (/tv/) e códigos embed HTML.
 */

/**
 * Detecta se uma string ou URL representa conteúdo do Instagram
 */
export function isInstagramContent(content: string | null | undefined): boolean {
  if (!content || typeof content !== "string") return false;
  const str = content.trim();
  if (str.length === 0) return false;

  return (
    str.includes("instagram.com") ||
    str.includes("instagr.am") ||
    str.includes("data-instgrm-permalink") ||
    str.includes("instagram-media") ||
    /^[A-Za-z0-9_-]{9,15}$/.test(str) // ID direto comum do Instagram (ex: DaySDnWBdW6)
  );
}

/**
 * Extrai o ID/shortcode do post ou Reel do Instagram a partir de múltiplos formatos:
 * - https://www.instagram.com/reel/{ID}/
 * - https://www.instagram.com/reels/{ID}/
 * - https://www.instagram.com/p/{ID}/
 * - https://www.instagram.com/tv/{ID}/
 * - Código HTML embed (blockquote com data-instgrm-permalink)
 * - ID puro (ex: DaySDnWBdW6)
 */
export function extractInstagramId(content: string | null | undefined): string | null {
  if (!content || typeof content !== "string") return null;
  const str = content.trim();
  if (!str) return null;

  // 1. Caso seja código embed com data-instgrm-permalink
  const embedMatch = str.match(/data-instgrm-permalink=["'](?:https?:\/\/)?(?:www\.)?(?:instagram\.com|instagr\.am)\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i);
  if (embedMatch && embedMatch[1]) {
    return embedMatch[1];
  }

  // 2. Caso seja URL padrão do Instagram (/p/, /reel/, /reels/, /tv/)
  const urlMatch = str.match(/(?:instagram\.com|instagr\.am)\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1];
  }

  // 3. Caso o usuário já tenha fornecido diretamente o shortcode
  if (/^[A-Za-z0-9_-]{9,15}$/.test(str)) {
    return str;
  }

  return null;
}

/**
 * Gera o permalink canônico limpo da publicação no Instagram
 */
export function getInstagramPermalink(idOrUrl: string): string {
  const id = extractInstagramId(idOrUrl) || idOrUrl.trim();
  return `https://www.instagram.com/p/${id}/`;
}

/**
 * Gera a URL oficial para embed do Instagram (iframe)
 * @param idOrUrl ID ou URL do post
 * @param captioned Se true, inclui a legenda no embed
 */
export function getInstagramEmbedUrl(idOrUrl: string, captioned: boolean = false): string {
  const id = extractInstagramId(idOrUrl) || idOrUrl.trim();
  return `https://www.instagram.com/p/${id}/embed/${captioned ? "captioned/" : ""}`;
}

/**
 * Gera a rota interna de stream e proxy do vídeo MP4
 */
export function getInstagramDirectStreamUrl(idOrUrl: string | null | undefined): string {
  if (!idOrUrl) return "";
  const id = extractInstagramId(idOrUrl);
  if (!id) return "";
  return `/api/instagram-stream/${id}`;
}

/**
 * Gera a URL de miniatura/capa oficial do Instagram
 */
export function getInstagramThumbnailUrl(idOrUrl: string): string {
  const id = extractInstagramId(idOrUrl) || idOrUrl.trim();
  return `https://www.instagram.com/p/${id}/media/?size=l`;
}

/**
 * Extrai todas as informações consolidadas do post
 */
export function parseInstagramPost(content: string | null | undefined) {
  const id = extractInstagramId(content);
  if (!id) return null;

  return {
    id,
    permalink: getInstagramPermalink(id),
    embedUrl: getInstagramEmbedUrl(id, false),
    embedCaptionedUrl: getInstagramEmbedUrl(id, true),
    streamUrl: getInstagramDirectStreamUrl(id),
    thumbnailUrl: getInstagramThumbnailUrl(id),
  };
}
