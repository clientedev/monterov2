import React, { useState, useEffect } from "react";
import { Instagram, ExternalLink, Heart, MessageCircle, Share2, Bookmark, Play, ShieldCheck, Sparkles } from "lucide-react";

export function extractInstagramInfo(url: string | null | undefined): { id: string; type: "post" | "reel" | "tv"; embedUrl: string; cleanUrl: string } | null {
  if (!url) return null;
  const match = url.match(/(?:instagram\.com|instagr\.am)\/(p|reel|tv)\/([A-Za-z0-9_-]+)/i);
  if (!match) return null;
  const rawType = match[1].toLowerCase();
  const type = rawType === "reel" ? "reel" : rawType === "tv" ? "tv" : "post";
  const id = match[2];
  const cleanUrl = `https://www.instagram.com/${type}/${id}/`;
  const embedUrl = `https://www.instagram.com/${type}/${id}/embed/captioned/`;

  return { id, type, embedUrl, cleanUrl };
}

interface InstagramEmbedProps {
  url: string;
  title?: string;
  coverImage?: string;
  summary?: string;
  likes?: number;
  className?: string;
  compact?: boolean;
}

export function InstagramEmbed({
  url,
  title,
  coverImage,
  summary,
  likes = 0,
  className = "",
  compact = false,
}: InstagramEmbedProps) {
  const info = extractInstagramInfo(url);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  const [saved, setSaved] = useState(false);
  const [viewMode, setViewMode] = useState<"embed" | "card">("embed");
  const [iframeLoaded, setIframeLoaded] = useState(false);

  useEffect(() => {
    setLikeCount(likes);
  }, [likes]);

  if (!info) {
    return (
      <div className={`p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-center gap-3 ${className}`}>
        <Instagram className="w-5 h-5 text-amber-600 shrink-0" />
        <div>
          <p className="font-semibold">Link do Instagram</p>
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs underline break-all">
            {url}
          </a>
        </div>
      </div>
    );
  }

  const handleLike = () => {
    if (liked) {
      setLiked(false);
      setLikeCount((c) => Math.max(0, c - 1));
    } else {
      setLiked(true);
      setLikeCount((c) => c + 1);
    }
  };

  return (
    <div className={`w-full max-w-[540px] mx-auto bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-xl transition-all duration-300 hover:shadow-2xl ${className}`}>
      {/* Top Header - Authentic Instagram Aesthetic */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white">
        <div className="flex items-center gap-3">
          {/* Gradient Story Ring Avatar */}
          <div className="p-[2.5px] rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] shadow-sm">
            <div className="p-0.5 bg-white rounded-full">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#08454c] to-[#163b52] flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                <img
                  src="/favicon.png"
                  alt="Monteiro Seguros"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const el = e.target as HTMLImageElement;
                    el.style.display = "none";
                  }}
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-slate-900 tracking-tight">monteiroseguros</span>
              <ShieldCheck className="w-4 h-4 text-sky-500 fill-sky-500" />
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888]">
                <Instagram className="w-2.5 h-2.5" />
                {info.type === "reel" ? "Reel" : "Post"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Monteiro Corretora de Seguros</p>
          </div>
        </div>

        <a
          href={info.cleanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white transition-all transform hover:scale-105 shadow-sm"
          style={{ background: "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)" }}
          title="Ver publicação no Instagram"
        >
          <span>Ver no Insta</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Media / Embed Body */}
      {viewMode === "embed" ? (
        <div className="relative w-full bg-slate-50 min-h-[480px] flex items-center justify-center overflow-hidden">
          {!iframeLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 gap-3 z-10 p-6 text-center">
              <div className="w-12 h-12 rounded-full border-3 border-slate-200 border-t-[#dc2743] animate-spin" />
              <p className="text-xs font-medium text-slate-500">Carregando post do Instagram...</p>
              <button
                type="button"
                onClick={() => setViewMode("card")}
                className="text-xs text-[#08454c] underline hover:text-[#c65f54]"
              >
                Alternar para visualização em card
              </button>
            </div>
          )}
          <iframe
            src={info.embedUrl}
            title={title || "Post do Instagram"}
            className="w-full border-none"
            style={{
              height: compact ? "480px" : "560px",
              minHeight: "460px",
            }}
            loading="lazy"
            allowTransparency
            onLoad={() => setIframeLoaded(true)}
          />
        </div>
      ) : (
        /* Alternative Creative Card Mode */
        <div className="relative aspect-square w-full bg-slate-900 overflow-hidden group">
          <img
            src={coverImage || "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=800"}
            alt={title || "Instagram Post"}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=800";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5 text-white">
            {info.type === "reel" && (
              <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center">
                <Play className="w-5 h-5 text-white fill-white ml-0.5" />
              </div>
            )}
            <h4 className="font-bold text-base line-clamp-2 mb-2 text-white">{title}</h4>
            {summary && <p className="text-xs text-slate-200 line-clamp-3 mb-3">{summary}</p>}
            <a
              href={info.cleanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-white text-slate-900 text-xs font-bold hover:bg-slate-100 transition-colors"
            >
              <Instagram className="w-4 h-4 text-[#dc2743]" />
              Abrir Post Oficial no Instagram
            </a>
          </div>
        </div>
      )}

      {/* Social Action Bar */}
      <div className="px-4 py-3 bg-white border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 transition-transform active:scale-125 ${
              liked ? "text-red-500" : "text-slate-700 hover:text-red-500"
            }`}
          >
            <Heart className={`w-5 h-5 ${liked ? "fill-red-500" : ""}`} />
            <span className="text-xs font-bold">{likeCount}</span>
          </button>

          <a
            href={info.cleanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-slate-700 hover:text-blue-500 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-xs font-medium">Comentar</span>
          </a>

          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: title || "Post do Instagram",
                  url: info.cleanUrl,
                });
              } else {
                navigator.clipboard.writeText(info.cleanUrl);
              }
            }}
            className="text-slate-700 hover:text-green-600 transition-colors"
            title="Compartilhar"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode(viewMode === "embed" ? "card" : "embed")}
            className="text-[11px] font-semibold text-slate-500 hover:text-[#08454c] px-2 py-1 rounded-md bg-slate-100 transition-colors"
            title="Alternar modo de exibição"
          >
            {viewMode === "embed" ? "Modo Card" : "Modo Embed"}
          </button>

          <button
            onClick={() => setSaved(!saved)}
            className={`transition-colors ${saved ? "text-amber-500" : "text-slate-700 hover:text-amber-500"}`}
          >
            <Bookmark className={`w-5 h-5 ${saved ? "fill-amber-500" : ""}`} />
          </button>
        </div>
      </div>

      {/* Caption & Info Snippet */}
      {summary && (
        <div className="px-4 pb-3.5 pt-1 text-xs text-slate-700 leading-relaxed bg-white">
          <span className="font-bold mr-1.5 text-slate-900">monteiroseguros</span>
          <span className="text-slate-600">{summary}</span>
        </div>
      )}
    </div>
  );
}
