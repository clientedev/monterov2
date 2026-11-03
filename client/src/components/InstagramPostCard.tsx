import React, { useState, useRef, useEffect } from "react";
import { 
  Instagram, Heart, Share2, Bookmark, ExternalLink, Play, Pause, 
  Volume2, VolumeX, ShieldCheck, Check, Sparkles, FileText, ArrowRight,
  Clock, BookOpen, ChevronRight, Award, CheckCircle2
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

// Imagem corporativa executiva exclusiva para Sucessão Empresarial & Patrimonial
const CORPORATE_SUCCESSION_COVER = "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&q=80&w=1200";

// Destaques e tópicos para preencher o card com informações valiosas quando for um artigo
function getArticleInsights(post: PostCardData): { category: string; iconColor: string; highlights: string[] } {
  const combined = `${post.title || ""} ${post.summary || ""} ${post.content || ""}`.toLowerCase();

  if (combined.includes("sucess") || combined.includes("patrimon") || combined.includes("herdeir")) {
    return {
      category: "Sucessão Empresarial & Patrimonial",
      iconColor: "text-amber-600 bg-amber-50 border-amber-200",
      highlights: [
        "Liquidez imediata aos herdeiros sem bloqueios de inventário",
        "Preservação do controle societário e governança familiar",
        "Planejamento tributário estratégico e proteção contra ITCMD"
      ]
    };
  }

  if (combined.includes("alice") || combined.includes("saúde") || combined.includes("hospital") || combined.includes("médic")) {
    return {
      category: "Saúde & Medicina Preventiva",
      iconColor: "text-emerald-700 bg-emerald-50 border-emerald-200",
      highlights: [
        "Acesso à melhor rede hospitalar e laboratorial do país",
        "Acompanhamento médico contínuo com tecnologia preventiva",
        "Gestão humanizada e suporte ágil nas internações e exames"
      ]
    };
  }

  if (combined.includes("benefício") || combined.includes("coparticipação") || combined.includes("custo")) {
    return {
      category: "Engenharia de Benefícios Corporativos",
      iconColor: "text-blue-700 bg-blue-50 border-blue-200",
      highlights: [
        "Auditoria de contas médicas e gestão ativa de sinistralidade",
        "Coparticipação inteligente para equilibrar custos da empresa",
        "Redução média no reajuste anual e previsibilidade financeira"
      ]
    };
  }

  if (combined.includes("vida") || combined.includes("seguro")) {
    return {
      category: "Seguro de Vida & Proteção",
      iconColor: "text-teal-700 bg-teal-50 border-teal-200",
      highlights: [
        "Garantia financeira completa para o futuro de quem você ama",
        "Indenização rápida e sem burocracia nos momentos cruciais",
        "Coberturas customizadas com as principais seguradoras do país"
      ]
    };
  }

  return {
    category: "Consultoria Monteiro Seguros",
    iconColor: "text-slate-700 bg-slate-100 border-slate-200",
    highlights: [
      "Consultoria especializada independente e sob medida",
      "Análise aprofundada de riscos para sua família e empresa",
      "Suporte humanizado e ágil da equipe de especialistas Monteiro"
    ]
  };
}

// Estimativa de tempo de leitura
function calculateReadingTime(post: PostCardData): string {
  const fullText = `${post.title || ""} ${post.summary || ""} ${post.content || ""}`.replace(/<[^>]*>?/gm, "");
  const words = fullText.trim().split(/\s+/).length;
  const minutes = Math.max(2, Math.ceil(words / 140));
  return `${minutes} min de leitura`;
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
  const [copied, setCopied] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLikeCount(post.likes ?? 0);
  }, [post.likes]);

  // Economia de memória e CPU: só reproduz o vídeo quando o card estiver visível na tela
  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [streamUrl]);

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

  // Identificação do post de sucessão empresarial para garantir capa 100% corporativa
  const isSuccessionPost = Boolean(
    (post.title && /sucess[aã]o/i.test(post.title)) ||
    (post.slug && /sucess[aã]o/i.test(post.slug))
  );

  // Imagem de fallback autêntica (bloqueia o modelo genérico 1507679799987 e o banner antigo 1611162617474)
  const isBadCover = Boolean(
    post.coverImage && (
      post.coverImage.includes("1611162617474") || 
      post.coverImage.includes("1507679799987")
    )
  );

  const cleanCoverImage = isBadCover
    ? (isSuccessionPost ? CORPORATE_SUCCESSION_COVER : null)
    : (isSuccessionPost && (!post.coverImage || post.coverImage.includes("1507679799987")) ? CORPORATE_SUCCESSION_COVER : post.coverImage);

  const fallbackCover = cleanCoverImage || (isSuccessionPost ? CORPORATE_SUCCESSION_COVER : (officialThumb || "/assets/reel_thumb_DaySDnWBdW6.jpg"));

  // Título e legenda com fallbacks garantidos
  const rawTitle = (post.title || "").trim();
  const isGenericTitle = !rawTitle || rawTitle.startsWith("Publicação do Instagram - Reel") || rawTitle === "Publicação Monteiro Seguros";
  const displayTitle = isGenericTitle
    ? (isInsta ? "Orientações & Dicas • Monteiro Seguros" : "Artigo Especial • Monteiro Seguros")
    : rawTitle;

  // Limpeza de texto da legenda/resumo com fallback garantido
  const rawCaption = (post.summary || post.content || "")
    .replace(/<[^>]*>?/gm, "")
    .trim();
  const fallbackCaption = isInsta
    ? "Confira este conteúdo exclusivo em nosso perfil oficial no Instagram @monteirosegurosebeneficios com orientações e dicas práticas."
    : "Planejamento sucessório, gestão inteligente de benefícios e proteção sob medida com a equipe da Monteiro Seguros.";
  const resolvedCaption = rawCaption || fallbackCaption;
  const isLongCaption = resolvedCaption.length > 180;
  const displayCaption = isExpanded || !isLongCaption 
    ? resolvedCaption 
    : `${resolvedCaption.slice(0, 180)}...`;

  // Informações ricas do artigo (categoria, reading time e tópicos)
  const articleMeta = getArticleInsights(post);
  const readingTime = calculateReadingTime(post);

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

  // Proporções: Reels do Instagram usam formato vertical padrão (4/5)
  // Artigos usam altura equilibrada (16/11) garantindo enquadramento perfeito sem esticar
  const aspectClass = isInsta
    ? (aspectRatio === "vertical" ? "aspect-[9/16]" : "aspect-[4/5]")
    : "aspect-[16/11] max-h-[260px]";

  return (
    <div
      className={cn(
        "group relative bg-white text-slate-900 rounded-[22px] overflow-hidden border border-slate-200/90 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 h-full",
        className
      )}
      style={{ backgroundColor: "#ffffff", color: "#0f172a" }}
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
                <span className="font-bold text-xs md:text-sm text-slate-900 truncate tracking-tight" style={{ color: "#0f172a" }}>
                  {post.authorName || "monteirosegurosebeneficios"}
                </span>
                <ShieldCheck className="w-3.5 h-3.5 text-sky-500 fill-sky-500 shrink-0" />
              </div>
              <p className="text-[10px] md:text-[11px] text-slate-400 font-medium" style={{ color: "#94a3b8" }}>
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
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs md:text-sm text-slate-900 block truncate" style={{ color: "#0f172a" }}>
                  {post.authorName || "Monteiro Seguros & Benefícios"}
                </span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              </div>
              <p className="text-[10px] md:text-[11px] text-slate-400 font-medium" style={{ color: "#94a3b8" }}>
                {formattedDate} • Blog Oficial
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
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold text-slate-700 bg-slate-100 border border-slate-200">
              <FileText className="w-3 h-3 text-[#08454c]" />
              <span>Artigo</span>
            </span>
          )}
        </div>
      </div>

      {/* ── 2. ÁREA DE MÍDIA COM ENQUADRAMENTO PROFISSIONAL ── */}
      <div
        ref={containerRef}
        className={cn("relative w-full overflow-hidden select-none flex items-center justify-center bg-slate-900", aspectClass)}
      >
        {/* Badge de Data sobreposto */}
        <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-[10px] font-bold border border-white/10 shadow-xs pointer-events-none">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{formattedDate}</span>
        </div>

        {/* Reprodução de Vídeo Automática para Reels */}
        {Boolean(streamUrl) && !hasVideoError ? (
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              src={streamUrl}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              preload="metadata"
              poster={fallbackCover}
              onError={() => setHasVideoError(true)}
              onLoadedMetadata={(e) => {
                e.currentTarget.muted = true;
                e.currentTarget.play().catch(() => {});
              }}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-102"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />

            <div className="absolute bottom-3 right-3 z-20">
              <button
                type="button"
                onClick={toggleSound}
                aria-label={isMuted ? "Ativar som" : "Desativar som"}
                className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md hover:bg-black/80 text-white flex items-center justify-center transition-all border border-white/15 shadow-md active:scale-95 cursor-pointer"
                title={isMuted ? "Ativar áudio" : "Silenciar áudio"}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-white/90" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              </button>
            </div>
          </div>
        ) : isInsta && Boolean(embedUrl) ? (
          <div className="relative w-full h-full bg-slate-900 flex items-center justify-center overflow-hidden">
            <iframe
              src={embedUrl}
              title={post.title}
              className="w-full h-full border-none"
              style={{ minHeight: "360px" }}
              loading="lazy"
              allowTransparency
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            />
          </div>
        ) : (
          /* Enquadramento elegante de imagem sem sobras e sem cortes indesejados */
          <div className="relative w-full h-full overflow-hidden bg-slate-100 flex items-center justify-center">
            <img
              src={fallbackCover}
              alt={displayTitle}
              loading="lazy"
              decoding="async"
              onError={(e) => {
                e.currentTarget.src = isSuccessionPost ? CORPORATE_SUCCESSION_COVER : "/assets/reel_thumb_DaySDnWBdW6.jpg";
              }}
              className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
          </div>
        )}
      </div>

      {/* ── 3. CORPO DO CARD PREENCHIDO COM INFOS DO POST ── */}
      <div 
        className="p-5 flex-1 flex flex-col justify-between bg-white z-10" 
        style={{ backgroundColor: "#ffffff" }}
      >
        <div className="flex-1 flex flex-col">
          {/* Metadados para Artigos (Categoria + Leitura) */}
          {!isInsta && (
            <div className="flex items-center justify-between gap-2 mb-2.5 flex-wrap">
              <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border shadow-2xs", articleMeta.iconColor)}>
                <Sparkles className="w-3 h-3 shrink-0" />
                <span>{articleMeta.category}</span>
              </span>

              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500" style={{ color: "#64748b" }}>
                <Clock className="w-3 h-3 text-slate-400" />
                <span>{readingTime}</span>
              </span>
            </div>
          )}

          {/* Título da Postagem */}
          {post.slug ? (
            <Link href={`/blog/${post.slug}`}>
              <h3 
                className="font-bold text-base md:text-lg text-slate-900 hover:text-[#08454c] transition-colors leading-snug mb-2 font-display cursor-pointer line-clamp-2 md:line-clamp-3"
                style={{ color: "#0f172a" }}
              >
                {displayTitle}
              </h3>
            </Link>
          ) : (
            <h3 
              className="font-bold text-base md:text-lg text-slate-900 leading-snug mb-2 font-display line-clamp-2 md:line-clamp-3"
              style={{ color: "#0f172a" }}
            >
              {displayTitle}
            </h3>
          )}

          {/* Resumo do Conteúdo */}
          <div className="text-xs md:text-sm text-slate-600 font-normal leading-relaxed mb-3" style={{ color: "#334155" }}>
            <p className={isInsta ? "inline line-clamp-3" : "inline line-clamp-3 md:line-clamp-4"} style={{ color: "#334155" }}>
              {displayCaption}
            </p>
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

          {/* Box de Informações e Destaques do Post (Preenche o espaço em branco para artigos com conteúdo relevante) */}
          {!isInsta && (
            <div className="mt-2 mb-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
              <div className="font-semibold text-slate-800 flex items-center gap-1.5 mb-1.5" style={{ color: "#0f172a" }}>
                <ShieldCheck className="w-3.5 h-3.5 text-[#08454c] shrink-0" />
                <span>Destaques desta consultoria:</span>
              </div>
              <ul className="space-y-1 text-[11px] text-slate-600 leading-tight">
                {articleMeta.highlights.slice(0, 2).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5" style={{ color: "#334155" }}>
                    <span className="text-[#c65f54] font-bold shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* ── 4. RODAPÉ DE AÇÕES ── */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-slate-600 mt-2 shrink-0">
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
              style={{ color: isLiked ? "#ef4444" : "#475569" }}
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
              style={{ color: "#475569" }}
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
              <a className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#08454c]/10 text-[#08454c] hover:bg-[#08454c] hover:text-white transition-all uppercase tracking-wider shadow-2xs">
                <span>Ler Artigo</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
