import React, { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, Play, Pause, Instagram, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { extractInstagramInfo } from "./InstagramEmbed";

interface InstagramCachedVideoProps {
  videoUrl?: string | null;
  instagramUrl?: string | null;
  fallbackImage?: string | null;
  title?: string;
  className?: string;
  aspectRatio?: "video" | "reel" | "square";
  showSoundToggle?: boolean;
}

const CACHE_NAME = "monteiro-insta-video-v3";
const DEFAULT_REEL_VIDEO = "/insta_reel_preview.mp4";

export function InstagramCachedVideo({
  videoUrl,
  instagramUrl,
  fallbackImage,
  title,
  className = "",
  aspectRatio = "video",
  showSoundToggle = false,
}: InstagramCachedVideoProps) {
  const instaInfo = extractInstagramInfo(instagramUrl || videoUrl);
  const cleanInstaUrl = instaInfo?.cleanUrl || (typeof instagramUrl === "string" ? instagramUrl : "https://www.instagram.com/monteirosegurosebeneficios/");

  const isInstagramEmbed = !!instaInfo;

  // Para vídeos MP4 diretos (quando não é embed do Instagram)
  const isDirectVideo = !!videoUrl && !videoUrl.includes("instagram.com") && (videoUrl.endsWith(".mp4") || videoUrl.endsWith(".webm") || videoUrl.startsWith("data:") || videoUrl.startsWith("blob:") || !isInstagramEmbed);
  const directVideoUrl = isDirectVideo ? videoUrl : DEFAULT_REEL_VIDEO;

  const [cachedSrc, setCachedSrc] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Carregamento com cache para MP4 diretos
  useEffect(() => {
    if (isInstagramEmbed) return;

    let isMounted = true;
    let objectUrlToRevoke: string | null = null;

    async function loadVideoWithCache() {
      if (!directVideoUrl) return;

      if (directVideoUrl.startsWith("data:") || directVideoUrl.startsWith("blob:")) {
        if (isMounted) setCachedSrc(directVideoUrl);
        return;
      }

      if (typeof window !== "undefined" && "caches" in window) {
        try {
          const cache = await caches.open(CACHE_NAME);
          const cachedResponse = await cache.match(directVideoUrl);

          if (cachedResponse) {
            const blob = await cachedResponse.blob();
            objectUrlToRevoke = URL.createObjectURL(blob);
            if (isMounted) setCachedSrc(objectUrlToRevoke);
            return;
          }

          const networkResponse = await fetch(directVideoUrl, { cache: "force-cache" });
          if (networkResponse.ok) {
            await cache.put(directVideoUrl, networkResponse.clone());
            const blob = await networkResponse.blob();
            objectUrlToRevoke = URL.createObjectURL(blob);
            if (isMounted) setCachedSrc(objectUrlToRevoke);
            return;
          }
        } catch (err) {
          // Fallback silencioso
        }
      }

      if (isMounted) setCachedSrc(directVideoUrl);
    }

    loadVideoWithCache();

    return () => {
      isMounted = false;
      if (objectUrlToRevoke) {
        URL.revokeObjectURL(objectUrlToRevoke);
      }
    };
  }, [directVideoUrl, isInstagramEmbed]);

  // Autoplay para MP4 direto
  useEffect(() => {
    if (!isInstagramEmbed && videoRef.current && isPlaying) {
      videoRef.current.play().catch(() => {
        if (videoRef.current) {
          videoRef.current.muted = true;
          setIsMuted(true);
          videoRef.current.play().catch(() => {});
        }
      });
    }
  }, [cachedSrc, isPlaying, isInstagramEmbed]);

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (videoRef.current) {
      const nextMuted = !videoRef.current.muted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
    }
  };

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const aspectClass =
    aspectRatio === "reel"
      ? "aspect-[4/5]"
      : aspectRatio === "square"
      ? "aspect-square"
      : "aspect-[16/10]";

  // Caso 1: Post do Instagram -> Usa exatamente o mesmo embed/vídeo do post, perfeitamente enquadrado no card
  if (isInstagramEmbed && instaInfo) {
    const embedUrl = `https://www.instagram.com/${instaInfo.type}/${instaInfo.id}/embed/`;

    return (
      <div
        className={cn(
          "relative w-full overflow-hidden bg-slate-950 group select-none flex items-center justify-center",
          aspectClass,
          className
        )}
      >
        {/* Loading Skeleton enquanto o iframe do Instagram carrega */}
        {!iframeLoaded && (
          <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center gap-2 z-0 animate-pulse">
            <Instagram className="w-8 h-8 text-[#f09433] animate-bounce" />
            <span className="text-[11px] text-slate-400 font-medium">Carregando vídeo do Instagram...</span>
          </div>
        )}

        {/* Iframe oficial do post do Instagram enquadrado no card */}
        <div className="relative w-full h-[520px] -mt-[46px] pointer-events-none flex items-center justify-center">
          <iframe
            src={embedUrl}
            title={title || "Vídeo do Instagram"}
            className="w-full h-full border-none"
            scrolling="no"
            loading="lazy"
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            onLoad={() => setIframeLoaded(true)}
          />
        </div>

        {/* Overlay sutil para transição e contraste de texto */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />

        {/* Badge Reel Instagram no canto superior esquerdo */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-bold border border-white/10 shadow-sm pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <Instagram className="w-3.5 h-3.5 text-[#f09433]" />
          <span>{instaInfo.type === "reel" ? "Reel Oficial" : "Instagram"}</span>
        </div>

        {/* Botão para abrir no Instagram no canto superior direito */}
        <a
          href={cleanInstaUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-[10px] font-bold border border-white/10 shadow-sm transition-all hover:scale-105"
          title="Abrir no Instagram"
        >
          <span>@monteiro</span>
          <ExternalLink className="w-2.5 h-2.5 text-white/80" />
        </a>
      </div>
    );
  }

  // Caso 2: Vídeo MP4 Direto
  return (
    <div
      onClick={togglePlay}
      className={cn(
        "relative w-full overflow-hidden bg-slate-950 group cursor-pointer select-none",
        aspectClass,
        className
      )}
      title="Clique para pausar / reproduzir o vídeo"
    >
      <video
        ref={videoRef}
        src={cachedSrc || directVideoUrl}
        autoPlay
        muted={isMuted}
        loop
        playsInline
        preload="auto"
        onError={() => setHasError(true)}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

      {/* Badge Vídeo */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-bold border border-white/10 shadow-sm pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <Play className="w-3 h-3 text-white fill-white" />
        <span>Vídeo</span>
      </div>

      {/* Controles de Som & Play */}
      <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2">
        {showSoundToggle && (
          <button
            type="button"
            onClick={toggleSound}
            aria-label={isMuted ? "Ativar som" : "Desativar som"}
            className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md hover:bg-black/80 text-white flex items-center justify-center transition-all border border-white/15 shadow-md active:scale-95"
            title={isMuted ? "Ativar som" : "Silenciar"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-white/90" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        )}

        <button
          type="button"
          onClick={togglePlay}
          aria-label={isPlaying ? "Pausar" : "Tocar"}
          className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md hover:bg-black/80 text-white flex items-center justify-center transition-all border border-white/15 shadow-md active:scale-95"
          title={isPlaying ? "Pausar vídeo" : "Reproduzir vídeo"}
        >
          {isPlaying ? (
            <Pause className="w-3.5 h-3.5 text-white/90" />
          ) : (
            <Play className="w-3.5 h-3.5 text-white ml-0.5 fill-white" />
          )}
        </button>
      </div>

      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px] pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-black/75 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-xl">
            <Play className="w-6 h-6 text-white ml-0.5 fill-white" />
          </div>
        </div>
      )}
    </div>
  );
}
