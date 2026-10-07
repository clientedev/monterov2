import React, { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, Play, Pause, Instagram, Sparkles, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface InstagramCachedVideoProps {
  videoUrl?: string | null;
  fallbackImage?: string | null;
  title?: string;
  className?: string;
  aspectRatio?: "video" | "reel" | "square";
  showSoundToggle?: boolean;
}

const CACHE_NAME = "monteiro-insta-video-v1";
const DEFAULT_PREVIEW_VIDEO = "/insta_reel_preview.mp4";

export function InstagramCachedVideo({
  videoUrl,
  fallbackImage,
  title,
  className = "",
  aspectRatio = "video",
  showSoundToggle = true,
}: InstagramCachedVideoProps) {
  const targetUrl = videoUrl || DEFAULT_PREVIEW_VIDEO;
  const [cachedSrc, setCachedSrc] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let isMounted = true;
    let objectUrlToRevoke: string | null = null;

    async function loadVideoWithCache() {
      // 1. Se for data: URI (ex.: base64 local), use diretamente
      if (targetUrl.startsWith("data:")) {
        if (isMounted) {
          setCachedSrc(targetUrl);
          setIsFromCache(true);
        }
        return;
      }

      // 2. Se a Cache API estiver disponível no navegador
      if (typeof window !== "undefined" && "caches" in window) {
        try {
          const cache = await caches.open(CACHE_NAME);
          const cachedResponse = await cache.match(targetUrl);

          if (cachedResponse) {
            // Sucesso: já guardado no cache! Zero egress!
            const blob = await cachedResponse.blob();
            objectUrlToRevoke = URL.createObjectURL(blob);
            if (isMounted) {
              setCachedSrc(objectUrlToRevoke);
              setIsFromCache(true);
            }
            return;
          }

          // Não está no cache ainda: baixa uma única vez e guarda no cache local
          const networkResponse = await fetch(targetUrl, { cache: "force-cache" });
          if (networkResponse.ok) {
            // Clona a resposta para guardar no cache
            await cache.put(targetUrl, networkResponse.clone());
            const blob = await networkResponse.blob();
            objectUrlToRevoke = URL.createObjectURL(blob);
            if (isMounted) {
              setCachedSrc(objectUrlToRevoke);
              setIsFromCache(true);
            }
            return;
          }
        } catch (err) {
          console.warn("[VideoCache] Erro ao acessar Cache API, usando URL direta:", err);
        }
      }

      // 3. Fallback: URL direta
      if (isMounted) {
        setCachedSrc(targetUrl);
      }
    }

    loadVideoWithCache();

    return () => {
      isMounted = false;
      if (objectUrlToRevoke) {
        URL.revokeObjectURL(objectUrlToRevoke);
      }
    };
  }, [targetUrl]);

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

  if (hasError && fallbackImage) {
    return (
      <div className={cn("overflow-hidden relative bg-slate-900", className)}>
        <img
          src={fallbackImage}
          alt={title || "Instagram Post"}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  const aspectClass =
    aspectRatio === "reel"
      ? "aspect-[4/5]"
      : aspectRatio === "square"
      ? "aspect-square"
      : "aspect-[16/10]";

  return (
    <div
      onClick={togglePlay}
      className={cn(
        "relative w-full overflow-hidden bg-slate-950 group cursor-pointer select-none",
        aspectClass,
        className
      )}
    >
      {cachedSrc ? (
        <video
          ref={videoRef}
          src={cachedSrc}
          autoPlay
          muted={isMuted}
          loop
          playsInline
          onError={() => setHasError(true)}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-slate-900">
          <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-[#dc2743] animate-spin" />
        </div>
      )}

      {/* Sutil gradiente para leitura e estética Instagram */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

      {/* Badge Reel Instagram no canto superior esquerdo */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-white text-[11px] font-bold border border-white/10 shadow-sm pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <Instagram className="w-3 h-3 text-[#f09433]" />
        <span>Reel</span>
        {isFromCache && (
          <span className="text-[9px] text-white/70 font-normal pl-0.5 border-l border-white/20 ml-0.5">
            cache
          </span>
        )}
      </div>

      {/* Controles de Som e Play no canto inferior */}
      <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2">
        {showSoundToggle && (
          <button
            type="button"
            onClick={toggleSound}
            aria-label={isMuted ? "Ativar som" : "Desativar som"}
            className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md hover:bg-black/80 text-white flex items-center justify-center transition-all transform active:scale-90 border border-white/15 shadow-md"
            title={isMuted ? "Ativar áudio" : "Mudo"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-white/90" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        )}

        <button
          type="button"
          onClick={togglePlay}
          aria-label={isPlaying ? "Pausar vídeo" : "Reproduzir vídeo"}
          className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md hover:bg-black/80 text-white flex items-center justify-center transition-all transform active:scale-90 border border-white/15 shadow-md"
          title={isPlaying ? "Pausar" : "Tocar"}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5 text-white/90" /> : <Play className="w-3.5 h-3.5 text-white ml-0.5" />}
        </button>
      </div>

      {/* Overlay de pausa sutil quando pausado */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px] pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-black/70 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-xl">
            <Play className="w-6 h-6 text-white ml-0.5 fill-white" />
          </div>
        </div>
      )}
    </div>
  );
}
