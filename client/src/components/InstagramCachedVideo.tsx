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

const CACHE_NAME = "monteiro-insta-video-v2";

export function InstagramCachedVideo({
  videoUrl,
  instagramUrl,
  fallbackImage,
  title,
  className = "",
  aspectRatio = "video",
  showSoundToggle = false,
}: InstagramCachedVideoProps) {
  const [cachedSrc, setCachedSrc] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const instaInfo = extractInstagramInfo(instagramUrl || videoUrl);

  // Se tiver um vídeo direto real (ex: .mp4, data:, etc)
  const hasDirectVideo = Boolean(
    videoUrl &&
    (videoUrl.startsWith("http") || videoUrl.startsWith("data:") || videoUrl.endsWith(".mp4") || videoUrl.endsWith(".webm")) &&
    !videoUrl.includes("instagram.com")
  );

  useEffect(() => {
    if (!hasDirectVideo || !videoUrl) return;

    let isMounted = true;
    let objectUrlToRevoke: string | null = null;

    async function loadVideoWithCache() {
      if (videoUrl!.startsWith("data:")) {
        if (isMounted) {
          setCachedSrc(videoUrl!);
          setIsFromCache(true);
        }
        return;
      }

      if (typeof window !== "undefined" && "caches" in window) {
        try {
          const cache = await caches.open(CACHE_NAME);
          const cachedResponse = await cache.match(videoUrl!);

          if (cachedResponse) {
            const blob = await cachedResponse.blob();
            objectUrlToRevoke = URL.createObjectURL(blob);
            if (isMounted) {
              setCachedSrc(objectUrlToRevoke);
              setIsFromCache(true);
            }
            return;
          }

          const networkResponse = await fetch(videoUrl!, { cache: "force-cache" });
          if (networkResponse.ok) {
            await cache.put(videoUrl!, networkResponse.clone());
            const blob = await networkResponse.blob();
            objectUrlToRevoke = URL.createObjectURL(blob);
            if (isMounted) {
              setCachedSrc(objectUrlToRevoke);
              setIsFromCache(true);
            }
            return;
          }
        } catch (err) {
          console.warn("[VideoCache] Erro ao cachear:", err);
        }
      }

      if (isMounted) {
        setCachedSrc(videoUrl!);
      }
    }

    loadVideoWithCache();

    return () => {
      isMounted = false;
      if (objectUrlToRevoke) {
        URL.revokeObjectURL(objectUrlToRevoke);
      }
    };
  }, [hasDirectVideo, videoUrl]);

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
      : "aspect-[16/9]";

  // CASO 1: Temos um vídeo direto real configurado (roda direto e em cache)
  if (hasDirectVideo && cachedSrc && !hasError) {
    return (
      <div
        onClick={togglePlay}
        className={cn(
          "relative w-full overflow-hidden bg-slate-950 group cursor-pointer select-none",
          aspectClass,
          className
        )}
      >
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

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-bold border border-white/10 shadow-sm pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <Instagram className="w-3.5 h-3.5 text-[#f09433]" />
          <span>Reel Instagram</span>
        </div>

        {showSoundToggle && (
          <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSound}
              aria-label={isMuted ? "Ativar som" : "Desativar som"}
              className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md hover:bg-black/80 text-white flex items-center justify-center transition-all border border-white/15 shadow-md"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-white/90" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
          </div>
        )}
      </div>
    );
  }

  // CASO 2: É um post do Instagram com link (Embed autêntico do próprio post do Instagram, zero gif)
  if (instaInfo) {
    return (
      <div className={cn("relative w-full overflow-hidden bg-slate-950 group", aspectClass, className)}>
        {fallbackImage ? (
          <div className="relative w-full h-full">
            <img
              src={fallbackImage}
              alt={title || "Instagram Post"}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/30 flex flex-col justify-between p-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold border border-white/15">
                  <Instagram className="w-3 h-3 text-[#f09433]" />
                  <span>{instaInfo.type === "reel" ? "Reel" : "Post"} Oficial</span>
                </span>
                <span className="text-[10px] text-white/80 font-mono">@monteiro</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-hover:bg-[#d94676] transition-all">
                  <Play className="w-5 h-5 fill-white ml-0.5" />
                </div>
                <span className="text-xs text-white font-medium flex items-center gap-1 bg-black/40 px-2.5 py-1 rounded-full backdrop-blur-sm">
                  Ver no Instagram <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>
        ) : (
          <iframe
            src={instaInfo.embedUrl}
            title={title || "Post Instagram"}
            className="w-full h-full border-0 pointer-events-none"
            loading="lazy"
            allowTransparency
          />
        )}
      </div>
    );
  }

  // CASO 3: Fallback de imagem real
  return (
    <div className={cn("relative w-full overflow-hidden bg-slate-900 group", aspectClass, className)}>
      <img
        src={fallbackImage || "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=800"}
        alt={title || "Instagram Post"}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 pointer-events-none" />
    </div>
  );
}
