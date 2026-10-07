/**
 * Utilitários para detecção e embed inteligente de vídeos nos banners e páginas
 */

export interface VideoEmbedInfo {
  type: "youtube" | "vimeo" | "direct" | null;
  embedUrl?: string;
}

export function getVideoEmbedInfo(url?: string | null, isMuted: boolean = true): VideoEmbedInfo {
  if (!url) return { type: null };
  const trimmed = url.trim();

  // YouTube
  const ytMatch = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i
  );
  if (ytMatch) {
    const id = ytMatch[1];
    const muteParam = isMuted ? 1 : 0;
    return {
      type: "youtube",
      embedUrl: `https://www.youtube.com/embed/${id}?autoplay=1&mute=${muteParam}&loop=1&playlist=${id}&controls=0&showinfo=0&rel=0&iv_load_policy=3&disablekb=1&modestbranding=1&playsinline=1`
    };
  }

  // Vimeo
  const vimeoMatch = trimmed.match(/(?:vimeo\.com\/)(\d+)/i);
  if (vimeoMatch) {
    const id = vimeoMatch[1];
    const muteParam = isMuted ? 1 : 0;
    return {
      type: "vimeo",
      embedUrl: `https://player.vimeo.com/video/${id}?background=1&autoplay=1&loop=1&byline=0&title=0&muted=${muteParam}`
    };
  }

  // Vídeo direto (MP4, WebM, MOV, Data URL ou link de storage CDN)
  return { type: "direct" };
}
