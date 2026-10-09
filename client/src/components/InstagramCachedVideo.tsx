import React, { useState, useRef } from "react";
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

  // Detect if there is a direct playable video URL
  const hasPlayableVideo = Boolean(
    videoUrl &&
    !videoUrl.includes("instagram.com") &&
    (videoUrl.startsWith("/api/posts/") ||
     videoUrl.endsWith(".mp4") ||
     videoUrl.endsWith(".webm") ||
     videoUrl.startsWith("data:") ||
     videoUrl.startsWith("blob:") ||
     videoUrl.startsWith("http"))
  );

  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [hasVideoError, setHasVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

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

  const defaultCover = "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=800";
  const coverSrc = fallbackImage || defaultCover;

  // Se tiver vídeo direto jogável (e sem erro de reprodução)
  if (hasPlayableVideo && !hasVideoError) {
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
          ref={(el) => {
            (videoRef as any).current = el;
            if (el) {
              el.muted = true;
              if (isPlaying) {
                el.play().catch(() => {});
              }
            }
          }}
          src={videoUrl!}
          autoPlay
          muted={isMuted}
          loop
          playsInline
          preload="metadata"
          poster={coverSrc}
          onError={() => setHasVideoError(true)}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

        {/* Badge do Instagram ou Vídeo */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-bold border border-white/10 shadow-sm pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          {instaInfo ? (
            <>
              <Instagram className="w-3.5 h-3.5 text-[#f09433]" />
              <span>{instaInfo.type === "reel" ? "Reel Oficial" : "Instagram"}</span>
            </>
          ) : (
            <>
              <Play className="w-3 h-3 text-white fill-white" />
              <span>Vídeo</span>
            </>
          )}
        </div>

        {instaInfo && (
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
        )}

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

  // Se for Post do Instagram ou Imagem com visual do Reel/Instagram
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-slate-950 group select-none flex items-center justify-center",
        aspectClass,
        className
      )}
    >
      {/* Imagem de Capa em Alta Definição */}
      <img
        src={coverSrc}
        alt={title || "Publicação"}
        loading="lazy"
        decoding="async"
        onError={(e) => {
          e.currentTarget.src = defaultCover;
        }}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      />

      {/* Gradientes elegantes de contraste */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/30 pointer-events-none" />

      {/* Badge Reel / Instagram no canto superior esquerdo */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-bold border border-white/10 shadow-sm pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <Instagram className="w-3.5 h-3.5 text-[#f09433]" />
        <span>{instaInfo?.type === "reel" ? "Reel Oficial" : "Instagram"}</span>
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

      {/* Botão Play central elegante indicando conteúdo multimídia */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300">
        <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-xl">
          <Play className="w-5 h-5 text-white ml-0.5 fill-white" />
        </div>
      </div>
    </div>
  );
}
