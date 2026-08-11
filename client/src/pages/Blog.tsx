import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { usePosts } from "@/hooks/use-content";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, MessageCircle, Share2, Bookmark,
  AlertCircle, RefreshCw, Play, BadgeCheck,
  Star, ChevronRight, X, Copy, Check, Download
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

const formatDate = (d: string | Date | null | undefined) => {
  if (!d) return "";
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return "";
    const now = new Date();
    const diffH = Math.floor((now.getTime() - dt.getTime()) / 3_600_000);
    if (diffH < 1) return "agora mesmo";
    if (diffH < 24) return `${diffH}h atrás`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `${diffD}d atrás`;
    return format(dt, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
  } catch { return ""; }
};

const ytId = (url: string) =>
  url?.match(/^.*(youtu\.be\/|v\/|embed\/|watch\?v=|&v=)([^#&?]*).*/)?.[2] ?? null;

/* ─────────────────────────────────────────
   Share Modal with Instagram Story Preview
───────────────────────────────────────── */
function ShareModal({ post, onClose }: { post: any; onClose: () => void }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const postUrl = `${window.location.origin}/blog/${post.slug}`;

  const coverSrc =
    post.youtubeUrl && ytId(post.youtubeUrl)
      ? `https://img.youtube.com/vi/${ytId(post.youtubeUrl)}/maxresdefault.jpg`
      : post.coverImage ||
        "https://images.unsplash.com/photo-1454165833767-027ffea9e77b?auto=format&fit=crop&q=80&w=900";

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(postUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${post.title}\n${postUrl}`)}`,
      "_blank"
    );
  };

  const handleTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(postUrl)}`,
      "_blank"
    );
  };

  /* Generate Story card on canvas (9:16) and download/share it */
  const generateStoryImage = useCallback(async () => {
    setGenerating(true);
    try {
      const W = 1080, H = 1920;
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d")!;

      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#08454c");
      grad.addColorStop(0.5, "#163b52");
      grad.addColorStop(1, "#0d2e3a");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Decorative top arc
      ctx.save();
      ctx.beginPath();
      ctx.arc(W / 2, -200, 900, 0, Math.PI);
      ctx.fillStyle = "rgba(198,95,84,0.12)";
      ctx.fill();
      ctx.restore();

      // Load & draw post image
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = coverSrc;
      });

      // Image area: centered, rounded rect (1080 x 700)
      const imgY = 260, imgH = 700;
      ctx.save();
      ctx.beginPath();
      const r = 60;
      const ix = 60, iy = imgY, iw = W - 120;
      ctx.moveTo(ix + r, iy);
      ctx.lineTo(ix + iw - r, iy);
      ctx.arcTo(ix + iw, iy, ix + iw, iy + r, r);
      ctx.lineTo(ix + iw, iy + imgH - r);
      ctx.arcTo(ix + iw, iy + imgH, ix + iw - r, iy + imgH, r);
      ctx.lineTo(ix + r, iy + imgH);
      ctx.arcTo(ix, iy + imgH, ix, iy + imgH - r, r);
      ctx.lineTo(ix, iy + r);
      ctx.arcTo(ix, iy, ix + r, iy, r);
      ctx.closePath();
      ctx.clip();

      if (img.width > 0) {
        const aspect = img.width / img.height;
        let sx = 0, sy = 0, sw = img.width, sh = img.height;
        if (aspect > iw / imgH) {
          sw = img.height * (iw / imgH);
          sx = (img.width - sw) / 2;
        } else {
          sh = img.width / (iw / imgH);
          sy = (img.height - sh) / 2;
        }
        ctx.drawImage(img, sx, sy, sw, sh, ix, iy, iw, imgH);
      } else {
        ctx.fillStyle = "#1a4a52";
        ctx.fillRect(ix, iy, iw, imgH);
      }
      ctx.restore();

      // Brand pill at top
      ctx.save();
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      const pillW = 380, pillH = 72, pillX = (W - pillW) / 2, pillY = 100;
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, 36);
      ctx.fill();
      ctx.fillStyle = "#c65f54";
      ctx.font = "bold 28px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Monteiro Seguros", W / 2, pillY + pillH / 2);
      ctx.restore();

      // Title box
      const textY = imgY + imgH + 80;
      ctx.save();
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.beginPath();
      ctx.roundRect(60, textY - 30, W - 120, 320, 32);
      ctx.fill();

      // Title text (wrapped)
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 58px system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      const words = post.title.split(" ");
      let line = "";
      let lineY = textY + 20;
      const maxWidth = W - 160;
      for (const word of words) {
        const test = line + (line ? " " : "") + word;
        if (ctx.measureText(test).width > maxWidth && line) {
          ctx.fillText(line, 80, lineY);
          line = word;
          lineY += 72;
          if (lineY > textY + 220) { line += "..."; break; }
        } else {
          line = test;
        }
      }
      if (line) ctx.fillText(line, 80, lineY);
      ctx.restore();

      // Summary (lighter)
      if (post.summary) {
        ctx.save();
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.font = "36px system-ui, sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        const sumY = textY + 300;
        const sumWords = post.summary.split(" ");
        let sumLine = "";
        let sumLineY = sumY;
        let sumLines = 0;
        for (const word of sumWords) {
          const test = sumLine + (sumLine ? " " : "") + word;
          if (ctx.measureText(test).width > maxWidth && sumLine) {
            ctx.fillText(sumLine, 80, sumLineY);
            sumLine = word;
            sumLineY += 50;
            sumLines++;
            if (sumLines >= 2) { ctx.fillText(sumLine + "...", 80, sumLineY); break; }
          } else {
            sumLine = test;
          }
        }
        if (sumLine && sumLines < 2) ctx.fillText(sumLine, 80, sumLineY);
        ctx.restore();
      }

      // Bottom CTA strip
      ctx.save();
      ctx.fillStyle = "#c65f54";
      ctx.beginPath();
      ctx.roundRect(60, H - 260, W - 120, 100, 50);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 40px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("👉 Leia o artigo completo", W / 2, H - 210);
      ctx.restore();

      // URL hint
      ctx.fillStyle = "rgba(255,255,255,0.30)";
      ctx.font = "28px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText("monteiroseguros.com.br", W / 2, H - 60);

      // Try Web Share API with files (works on mobile)
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], "story-monteiro.png", { type: "image/png" });
        const canShareFile =
          typeof navigator.canShare === "function" && navigator.canShare({ files: [file] });
        if (canShareFile) {
          try {
            await navigator.share({ files: [file], title: post.title });
            setGenerating(false);
            return;
          } catch { /* fallback to download */ }
        }
        // Fallback: download image + open Instagram
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "story-monteiro.png";
        a.click();
        URL.revokeObjectURL(url);
        setTimeout(() => {
          window.open("instagram://camera", "_blank");
        }, 800);
        setGenerating(false);
      }, "image/png");
    } catch {
      setGenerating(false);
      toast({ title: "Erro ao gerar Story. Tente copiar o link.", variant: "destructive" });
    }
  }, [post, coverSrc, toast]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", damping: 24, stiffness: 280 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-display font-bold text-[#163b52] text-lg">Compartilhar</h3>
            <p className="text-slate-400 text-xs mt-0.5 line-clamp-1">{post.title}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instagram Story preview */}
        <div className="px-5 pt-4 pb-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Story do Instagram</p>
          <div className="flex gap-4 items-stretch">
            {/* Story preview card */}
            <div
              className="relative rounded-2xl overflow-hidden shrink-0 shadow-lg border border-slate-100"
              style={{ width: 90, height: 160 }}
            >
              <img
                src={coverSrc}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1454165833767-027ffea9e77b?auto=format&fit=crop&q=80&w=300"; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#08454c]/90 via-[#163b52]/40 to-transparent" />
              {/* Brand */}
              <div className="absolute top-2 left-0 right-0 text-center">
                <span className="text-[7px] font-bold text-[#c65f54] uppercase tracking-wider">Monteiro</span>
              </div>
              {/* Title */}
              <div className="absolute bottom-2 left-1.5 right-1.5">
                <p className="text-white font-bold text-[7px] leading-tight line-clamp-3">{post.title}</p>
              </div>
            </div>

            {/* Info + generate button */}
            <div className="flex-1 flex flex-col justify-between py-1">
              <div className="space-y-1">
                <p className="text-[#163b52] font-semibold text-sm">Pré-visualização do Story</p>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Gera uma imagem 9:16 com design Monteiro, pronta para postar no Instagram Stories.
                </p>
              </div>
              <button
                onClick={generateStoryImage}
                disabled={generating}
                className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-white text-sm font-bold transition-all disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)" }}
              >
                {generating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {generating ? "Gerando..." : "Baixar Story"}
              </button>
              <p className="text-[10px] text-slate-400 text-center mt-1">
                Baixa a imagem e abre o Instagram
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 px-5 py-3">
          <div className="flex-1 h-px bg-slate-100" />
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">outras opções</span>
          <div className="flex-1 h-px bg-slate-100" />
        </div>

        {/* Share options grid */}
        <div className="grid grid-cols-3 gap-3 px-5 pb-5">
          {/* Copy Link */}
          <button
            onClick={handleCopyLink}
            className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors group"
          >
            <div className="w-11 h-11 rounded-full bg-slate-200 group-hover:bg-slate-300 flex items-center justify-center transition-colors">
              {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5 text-slate-600" />}
            </div>
            <span className="text-[10px] font-bold text-slate-600">{copied ? "Copiado!" : "Copiar link"}</span>
          </button>

          {/* WhatsApp */}
          <button
            onClick={handleWhatsApp}
            className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 transition-colors group"
          >
            <div className="w-11 h-11 rounded-full bg-[#25D366] flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.12 1.535 5.845L.057 23.428a.5.5 0 00.615.615l5.632-1.474A11.953 11.953 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.846 0-3.576-.5-5.063-1.374l-.363-.216-3.748.98.999-3.655-.233-.374A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
              </svg>
            </div>
            <span className="text-[10px] font-bold text-slate-600">WhatsApp</span>
          </button>

          {/* Twitter/X */}
          <button
            onClick={handleTwitter}
            className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors group"
          >
            <div className="w-11 h-11 rounded-full bg-black flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L2.002 2.25h6.896l4.264 5.638zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </div>
            <span className="text-[10px] font-bold text-slate-600">X (Twitter)</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────
   Main Blog Page
───────────────────────────────────────── */
export default function Blog() {
  const { data: posts, isLoading, isError, error, refetch } = usePosts();
  const { toast } = useToast();
  const [liked, setLiked] = useState<Set<number>>(new Set());
  const [saved, setSaved] = useState<Set<number>>(new Set());
  const [sharingPost, setSharingPost] = useState<any | null>(null);

  const likeMut = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/posts/${id}/like`, {}),
    onSuccess: (_d, id) => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setLiked(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
    },
  });

  const now = new Date();
  const visiblePosts = posts?.filter((p) => {
    if (!p.publishedAt) return true;
    const d = new Date(p.publishedAt);
    return !isNaN(d.getTime()) && d <= now;
  });

  return (
    <div className="min-h-screen font-sans bg-[#f0ede8]">
      <Navbar />

      {/* Share modal */}
      <AnimatePresence>
        {sharingPost && <ShareModal post={sharingPost} onClose={() => setSharingPost(null)} />}
      </AnimatePresence>

      {/* ── Page Banner ── */}
      <div className="bg-[#08454c] pt-28 pb-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/soft-wallpaper.png')] opacity-[0.03]" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#c65f54]/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="container px-4 md:px-6 mx-auto relative z-10 text-center">
          <p className="text-[#c65f54] font-bold uppercase tracking-widest text-xs mb-3">Blog &amp; Conteúdo</p>
          <h1 className="text-3xl md:text-5xl font-display font-bold text-white mb-3 leading-tight">
            Artigos &amp; Novidades
          </h1>
          <p className="text-white/50 text-sm md:text-base max-w-md mx-auto font-light">
            Dicas, tendências e novidades sobre seguros e benefícios.
          </p>
          <div className="flex items-center justify-center mt-5">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/60 text-sm font-semibold">
              {visiblePosts?.length ?? 0} artigos publicados
            </div>
          </div>
        </div>
      </div>

      {/* ── Feed ── */}
      <div className="max-w-[680px] mx-auto px-4 py-8 space-y-5">

        {isError && (
          <div className="bg-white rounded-2xl border border-red-100 p-10 text-center space-y-4 shadow-sm">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
            <p className="font-bold text-red-600">{(error as Error)?.message ?? "Erro ao carregar."}</p>
            <button onClick={() => refetch()} className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-full text-sm font-bold hover:bg-red-700 transition-colors">
              <RefreshCw className="w-4 h-4" /> Tentar novamente
            </button>
          </div>
        )}

        {isLoading && [1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-pulse">
            <div className="flex items-center gap-3 p-4">
              <div className="w-11 h-11 rounded-full bg-slate-200" />
              <div className="space-y-2 flex-1">
                <div className="h-3.5 bg-slate-200 rounded-full w-2/5" />
                <div className="h-2.5 bg-slate-200 rounded-full w-1/4" />
              </div>
            </div>
            <div className="w-full h-72 bg-slate-200" />
            <div className="p-4 space-y-2.5">
              <div className="h-4 bg-slate-200 rounded-full w-3/4" />
              <div className="h-3.5 bg-slate-200 rounded-full w-full" />
            </div>
          </div>
        ))}

        {!isLoading && !isError && (!visiblePosts || visiblePosts.length === 0) && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-5">
              <MessageCircle className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="font-bold text-slate-700 text-lg mb-1">Nenhum artigo ainda</h3>
            <p className="text-slate-400 text-sm">Em breve novos conteúdos serão publicados.</p>
          </div>
        )}

        {!isLoading && !isError && visiblePosts?.map((post, index) => (
          <Post
            key={post.id}
            post={post}
            index={index}
            isLiked={liked.has(post.id)}
            isSaved={saved.has(post.id)}
            onLike={() => likeMut.mutate(post.id)}
            onSave={() => setSaved(p => { const n = new Set(p); n.has(post.id) ? n.delete(post.id) : n.add(post.id); return n; })}
            onShare={() => setSharingPost(post)}
          />
        ))}
      </div>

      <Footer />
    </div>
  );
}

/* ─────────────────────────────────────────
   Post card
───────────────────────────────────────── */
function Post({ post, index, isLiked, isSaved, onLike, onSave, onShare }: {
  post: any; index: number;
  isLiked: boolean; isSaved: boolean;
  onLike: () => void; onSave: () => void; onShare: () => void;
}) {
  const [showHeart, setShowHeart] = useState(false);
  const vid = post.youtubeUrl ? ytId(post.youtubeUrl) : null;
  const cover = post.videoUrl ? null
    : vid ? `https://img.youtube.com/vi/${vid}/maxresdefault.jpg`
    : post.coverImage || "https://images.unsplash.com/photo-1454165833767-027ffea9e77b?auto=format&fit=crop&q=80&w=900";

  const triggerHeart = () => {
    if (!isLiked) onLike();
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 900);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: Math.min(index * 0.06, 0.3), duration: 0.45 }}
      className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-0.5 rounded-full bg-gradient-to-br from-[#c65f54] via-[#08454c] to-[#163b52] shrink-0">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden">
              <img
                src="/favicon.png" alt="Monteiro"
                className="w-full h-full object-cover"
                onError={e => {
                  const t = e.target as HTMLImageElement;
                  t.style.display = "none";
                  t.parentElement!.innerHTML = `<span class="font-bold text-[#08454c] text-sm">M</span>`;
                }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold text-[#163b52]">Monteiro Seguros</span>
              <BadgeCheck className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />
              {post.isFeatured && (
                <span className="inline-flex items-center gap-0.5 ml-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600 text-[9px] font-bold">
                  <Star className="w-2.5 h-2.5 fill-current" /> Destaque
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">{formatDate(post.publishedAt)} · 🌐 Público</p>
          </div>
        </div>
        <button
          onClick={onSave}
          className={`p-2 rounded-xl transition-colors ${isSaved ? "text-[#08454c]" : "text-slate-400 hover:text-[#08454c] hover:bg-slate-50"}`}
        >
          <Bookmark className={`w-5 h-5 ${isSaved ? "fill-current" : ""}`} />
        </button>
      </div>

      {/* Title + Description */}
      <div className="px-4 pb-3 space-y-1.5">
        <h2 className="text-[#163b52] font-display font-bold text-base md:text-lg leading-snug">
          {post.title}
        </h2>
        {post.summary && (
          <p className="text-slate-500 text-sm font-light leading-relaxed line-clamp-3">
            {post.summary}
          </p>
        )}
      </div>

      {/* Media */}
      <div className="relative w-full aspect-[16/9] bg-slate-900 overflow-hidden cursor-pointer" onDoubleClick={triggerHeart}>
        {post.videoUrl ? (
          <video src={post.videoUrl} controls playsInline className="w-full h-full object-contain bg-black" />
        ) : post.youtubeUrl && vid ? (
          <a href={`https://www.youtube.com/watch?v=${vid}`} target="_blank" rel="noopener noreferrer" className="block relative w-full h-full">
            <img src={`https://img.youtube.com/vi/${vid}/maxresdefault.jpg`} alt={post.title} className="w-full h-full object-cover object-center" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-xl">
                <Play className="w-6 h-6 text-white fill-white ml-1" />
              </div>
            </div>
          </a>
        ) : (
          <img
            src={cover!} alt={post.title}
            className="w-full h-full object-cover object-center"
            onError={e => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1454165833767-027ffea9e77b?auto=format&fit=crop&q=80&w=900"; }}
          />
        )}

        <AnimatePresence>
          {showHeart && (
            <motion.div
              key="heart"
              initial={{ scale: 0.3, opacity: 1 }}
              animate={{ scale: 1.2, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <Heart className="w-28 h-28 text-white fill-white drop-shadow-2xl" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Reactions row */}
      <div className="px-4 py-2.5 flex items-center justify-between border-b border-slate-50">
        <div className="flex items-center gap-1.5">
          <div className="flex -space-x-0.5">
            <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-[10px]">❤️</div>
            <div className="w-5 h-5 rounded-full bg-[#08454c] flex items-center justify-center text-[10px]">👍</div>
          </div>
          <span className="text-xs text-slate-500">
            {(post.likes ?? 0) + (isLiked ? 1 : 0)} pessoas curtiram
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-3 gap-0 px-2 py-1">
        <motion.button whileTap={{ scale: 0.95 }} onClick={onLike}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-colors ${isLiked ? "text-red-500 bg-red-50" : "text-slate-500 hover:bg-slate-50 hover:text-red-400"}`}>
          <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
          Curtir
        </motion.button>

        <Link href={`/blog/${post.slug}#comments`}>
          <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 hover:text-[#08454c] transition-colors">
            <MessageCircle className="w-5 h-5" />
            Comentar
          </button>
        </Link>

        <button onClick={onShare}
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 hover:text-blue-500 transition-colors">
          <Share2 className="w-5 h-5" />
          Compartilhar
        </button>
      </div>

      {/* Read more */}
      <div className="px-4 pb-4 pt-1 border-t border-slate-50">
        <Link href={`/blog/${post.slug}`}>
          <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#08454c]/5 hover:bg-[#08454c]/10 text-[#08454c] text-sm font-bold transition-colors group">
            Ler artigo completo
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </Link>
      </div>
    </motion.div>
  );
}
