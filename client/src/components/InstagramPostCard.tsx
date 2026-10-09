import React, { useState, useRef, useEffect } from "react";
import { 
  Instagram, Heart, Share2, Bookmark, ExternalLink, Play, Pause, 
  Volume2, VolumeX, ShieldCheck, Check, Sparkles, FileText, ArrowRight 
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "wouter";
import { 
  isInstagramContent, 
  extractInstagramId, 
  getInstagramPermalink, 
  getInstagramEmbedUrl, 
  getInstagramDirectStreamUrl,
  getInstagramThumbnailUrl 
} from "@/utils/instagramUtils";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export interface PostCardData {
  id: number | string;
  title: string;
  summary?: string | null;
  content?: string | null;
  slug?: string;
  coverImage?: string | null;
  media_url?: string | null;
  videoUrl?: string | null;
  instagramUrl?: string | null;
  youtubeUrl?: string | null;
  postType?: string | null;
  publishedAt?: string | Date | null;
  likes?: number;
  authorName?: string;
  authorAvatar?: string;
}

interface InstagramPostCardProps {
  post: PostCardData;
  className?: string;
  aspectRatio?: "vertical" | "reel" | "video" | "square";
  onLike?: (postId: number | string) => void;
  isLiked?: boolean;
}

export function InstagramPostCard({
  post,
  className = "",
  aspectRatio = "reel",
  onLike,
  isLiked: initialLiked = false,
}: InstagramPostCardProps) {
  const { toast } = useToast();

  // 1. Detecção do conteúdo do Instagram
  const rawTarget = post.instagramUrl || post.media_url || (post.postType === "instagram" ? post.videoUrl : null);
  const isInsta = Boolean(isInstagramContent(rawTarget) || post.instagramUrl || post.postType === "instagram");
  const instaId = extractInstagramId(rawTarget) || (post.instagramUrl ? extractInstagramId(post.instagramUrl) : null);

  const permalink = instaId ? getInstagramPermalink(instaId) : "https://www.instagram.com/monteirosegurosebeneficios/";
  const streamUrl = instaId ? getInstagramDirectStreamUrl(instaId) : (post.videoUrl && !post.videoUrl.includes("insta_reel_preview") ? post.videoUrl : "");
  const embedUrl = instaId ? getInstagramEmbedUrl(instaId, false) : "";
  const officialThumb = instaId ? getInstagramThumbnailUrl(instaId) : null;

  // Estados de reprodução e resiliência
  const [hasVideoError, setHasVideoError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(post.likes ?? 0);
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setLikeCount(post.likes ?? 0);
  }, [post.likes]);

  // Formatação de data
  const formattedDate = post.publishedAt
    ? (() => {
        try {
          return format(new Date(post.publishedAt), "dd 'de' MMM, yyyy", { locale: ptBR });
        } catch {
          return "Recente";
        }
      })()
    : "Recente";

  // Imagem de fallback autêntica (garante que nunca exiba imagens genéricas ou inválidas)
  const isBadCover = Boolean(post.coverImage && (post.coverImage.includes("1611162617474") || post.coverImage.includes("unsplash.com")));
  const cleanCoverImage = isBadCover ? null : post.coverImage;
  const fallbackCover = cleanCoverImage || officialThumb || "/assets/reel_thumb_DaySDnWBdW6.jpg";
  const [showEmbedPlayer, setShowEmbedPlayer] = useState(false);

  // Limpeza de texto da legenda/resumo
  const captionText = (post.summary || post.content || "")
    .replace(/<[^>]*>?/gm, "")
    .trim();
  const isLongCaption = captionText.length > 150;
  const displayCaption = isExpanded || !isLongCaption 
    ? captionText 
    : `${captionText.slice(0, 150)}...`;

  // Ações sociais
  const handleToggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLiked) {
      setIsLiked(false);
      setLikeCount((c) => Math.max(0, c - 1));
    } else {
      setIsLiked(true);
      setLikeCount((c) => c + 1);
    }
    if (onLike) {
      onLike(post.id);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = post.slug 
      ? `${window.location.origin}/blog/${post.slug}` 
      : permalink;

    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.summary || post.title,
          url: shareUrl,
        });
        return;
      } catch {}
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Link copiado!",
        description: "O link da publicação foi copiado para a sua área de transferência.",
      });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast({
        title: "Compartilhar",
        description: shareUrl,
      });
    }
  };

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      const nextMuted = !videoRef.current.muted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
    }
  };

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  // Classes de proporção
  const aspectClass =
    aspectRatio === "vertical"
      ? "aspect-[9/16]"
      : aspectRatio === "reel"
      ? "aspect-[4/5]"
      : aspectRatio === "square"
      ? "aspect-square"
      : "aspect-[16/10]";

  return (
    <div
      className={cn(
        "group relative bg-white text-slate-900 rounded-[20px] overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1",
        className
      )}
    >
      {/* ── 1. TOPO DO CARD ── */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100 z-10 shrink-0">
        {isInsta ? (
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Story Gradient Ring */}
            <div className="p-[2px] rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] shrink-0 shadow-xs">
              <div className="w-8 h-8 rounded-full bg-white p-[1.5px] overflow-hidden">
                <img
                  src="/favicon.png"
                  alt="Monteiro Seguros"
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    const el = e.currentTarget;
                    el.style.display = "none";
                  }}
                />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-xs md:text-sm text-slate-900 truncate tracking-tight">
                  {post.authorName || "monteirosegurosebeneficios"}
                </span>
                <ShieldCheck className="w-3.5 h-3.5 text-sky-500 fill-sky-500 shrink-0" />
              </div>
              <p className="text-[10px] md:text-[11px] text-slate-400 font-medium">
                {formattedDate}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#08454c] to-[#163b52] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-xs">
              {post.authorAvatar ? (
                <img src={post.authorAvatar} alt="Autor" className="w-full h-full object-cover" />
              ) : (
                <img src="/favicon.png" alt="Monteiro" className="w-full h-full object-cover" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <span className="font-bold text-xs md:text-sm text-slate-900 block truncate">
                {post.authorName || "Monteiro Seguros"}
              </span>
              <p className="text-[10px] md:text-[11px] text-slate-400 font-medium">
                {formattedDate}
              </p>
            </div>
          </div>
        )}

        {/* Tag do Tipo no Topo Direito */}
        <div className="shrink-0 flex items-center gap-2">
          {isInsta ? (
            <a
              href={permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold text-white shadow-xs hover:opacity-90 transition-opacity bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888]"
              title="Abrir no Instagram"
            >
              <Instagram className="w-3 h-3" />
              <span>Instagram</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-80" />
            </a>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200">
              <FileText className="w-3 h-3 text-[#08454c]" />
              <span>Artigo</span>
            </span>
          )}
        </div>
      </div>

      {/* ── 2. ÁREA DE MÍDIA ── */}
      <div className={cn("relative w-full max-h-[520px] bg-slate-950 overflow-hidden select-none flex items-center justify-center", aspectClass)}>
        {/* Badge de Data sobreposto */}
        <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold border border-white/10 shadow-xs pointer-events-none">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{formattedDate}</span>
        </div>

        {/* Opção 1: Player Embed Ativo do Instagram ao Clicar */}
        {showEmbedPlayer && isInsta && instaId ? (
          <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
            <iframe
              src={embedUrl || `https://www.instagram.com/reel/${instaId}/embed/`}
              title={post.title}
              className="w-full h-full border-none"
              style={{ minHeight: "360px" }}
              loading="lazy"
              allowTransparency
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowEmbedPlayer(false);
              }}
              className="absolute top-3 right-3 z-30 px-2.5 py-1 bg-black/80 hover:bg-black text-white text-[11px] font-bold rounded-full backdrop-blur-md border border-white/20 transition-all shadow-md"
            >
              ✕ Fechar
            </button>
          </div>
        ) : Boolean(streamUrl) && !hasVideoError ? (
          /* Opção 2: Tag <video> nativa (se houver stream direto disponível) */
          <div className="relative w-full h-full cursor-pointer" onClick={togglePlay}>
            <video
              ref={(el) => {
                (videoRef as any).current = el;
                if (el) {
                  el.muted = true;
                  if (isPlaying) {
                    el.play().catch(() => {});
                  }
                }
              }}
              src={streamUrl}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              controls={false}
              preload="auto"
              poster={fallbackCover}
              onError={() => setHasVideoError(true)}
              onLoadedMetadata={(e) => {
                e.currentTarget.muted = true;
                e.currentTarget.play().catch(() => {});
              }}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-102"
            />

            {/* Gradiente de contraste */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

            {/* Controles de Som & Play Flutuantes */}
            <div className="absolute bottom-3 right-3 z-20 flex items-center gap-2">
              <button
                type="button"
                onClick={toggleSound}
                aria-label={isMuted ? "Ativar som" : "Desativar som"}
                className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md hover:bg-black/80 text-white flex items-center justify-center transition-all border border-white/15 shadow-md active:scale-95"
                title={isMuted ? "Ativar áudio" : "Silenciar áudio"}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-white/90" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              </button>

              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? "Pausar vídeo" : "Reproduzir vídeo"}
                className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md hover:bg-black/80 text-white flex items-center justify-center transition-all border border-white/15 shadow-md active:scale-95"
                title={isPlaying ? "Pausar" : "Reproduzir"}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 text-white/90" /> : <Play className="w-3.5 h-3.5 text-white ml-0.5 fill-white" />}
              </button>
            </div>

            {/* Play Overlay quando pausado */}
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px] pointer-events-none">
                <div className="w-12 h-12 rounded-full bg-black/75 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-xl">
                  <Play className="w-5 h-5 text-white ml-0.5 fill-white" />
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Opção 3: Capa Autêntica em Alta Definição com Botão Interativo de Assistir Reel */
          <div
            className="relative w-full h-full bg-slate-900 flex items-center justify-center overflow-hidden cursor-pointer"
            onClick={() => {
              if (isInsta && instaId) {
                setShowEmbedPlayer(true);
              }
            }}
          >
            <img
              src={fallbackCover}
              alt={post.title}
              loading="lazy"
              decoding="async"
              onError={(e) => {
                e.currentTarget.src = "/assets/reel_thumb_DaySDnWBdW6.jpg";
              }}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/40 pointer-events-none" />

            {isInsta && (
              <div className="absolute inset-0 flex items-center justify-center transition-all duration-300">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/75 hover:bg-black/90 backdrop-blur-md text-white border border-white/20 shadow-2xl group-hover:scale-110 transition-transform">
                  <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                  <span className="text-xs font-bold tracking-wide">Assistir Reel</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 3. CORPO DO CARD ── */}
      <div className="p-4 md:p-5 flex-1 flex flex-col justify-between bg-white z-10">
        <div>
          {/* Título da Postagem */}
          {post.slug ? (
            <Link href={`/blog/${post.slug}`}>
              <h3 className="font-bold text-base md:text-lg text-slate-900 hover:text-[#08454c] transition-colors leading-snug mb-2 font-display cursor-pointer line-clamp-2">
                {post.title}
              </h3>
            </Link>
          ) : (
            <h3 className="font-bold text-base md:text-lg text-slate-900 leading-snug mb-2 font-display line-clamp-2">
              {post.title}
            </h3>
          )}

          {/* Legenda com opção de Ver Mais */}
          {captionText && (
            <div className="text-xs md:text-sm text-slate-600 font-light leading-relaxed mb-3">
              <p className="inline">{displayCaption}</p>
              {isLongCaption && (
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="inline-block ml-1.5 font-bold text-[#c65f54] hover:underline cursor-pointer"
                >
                  {isExpanded ? "ver menos" : "ver mais"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Rodapé de Ações Sociais */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-slate-600 mt-2">
          <div className="flex items-center gap-3">
            {/* Curtidas */}
            <button
              type="button"
              onClick={handleToggleLike}
              className={cn(
                "flex items-center gap-1.5 text-xs font-semibold transition-all active:scale-125 cursor-pointer",
                isLiked ? "text-red-500" : "text-slate-600 hover:text-red-500"
              )}
              title="Curtir post"
            >
              <Heart className={cn("w-4 h-4", isLiked ? "fill-red-500" : "")} />
              <span>{likeCount}</span>
            </button>

            {/* Compartilhar */}
            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#08454c] transition-colors cursor-pointer"
              title="Compartilhar"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? "Copiado!" : "Compartilhar"}</span>
            </button>
          </div>

          {/* Link para Acessar Publicação */}
          {isInsta ? (
            <a
              href={permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#c65f54] hover:text-[#08454c] transition-colors uppercase tracking-wider"
            >
              <span>Ver no Insta</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </a>
          ) : post.slug ? (
            <Link href={`/blog/${post.slug}`}>
              <a className="inline-flex items-center gap-1 text-xs font-bold text-[#08454c] hover:text-[#c65f54] transition-colors uppercase tracking-wider">
                <span>Ler Artigo</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </a>
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
