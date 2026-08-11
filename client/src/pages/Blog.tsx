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
  Star, ChevronRight
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
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

export default function Blog() {
  const { data: posts, isLoading, isError, error, refetch } = usePosts();
  const { toast } = useToast();
  const [liked, setLiked] = useState<Set<number>>(new Set());
  const [saved, setSaved] = useState<Set<number>>(new Set());

  const likeMut = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/posts/${id}/like`, {}),
    onSuccess: (_d, id) => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setLiked(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
    },
  });

  const handleShare = async (title: string, slug: string) => {
    const url = `${window.location.origin}/blog/${slug}`;
    if (typeof navigator.share === "function") {
      try { await navigator.share({ title, url }); } catch { }
    } else {
      navigator.clipboard?.writeText(url);
      toast({ title: "Link copiado!" });
    }
  };

  return (
    <div className="min-h-screen font-sans bg-[#f0ede8]">
      <Navbar />

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
            Dicas, tendências e conteúdos sobre seguros e benefícios para você e sua empresa.
          </p>
        </div>
      </div>

      {/* ── Feed ── */}
      <div className="max-w-[680px] mx-auto px-4 py-8 space-y-5">

        {/* Error */}
        {isError && (
          <div className="bg-white rounded-2xl border border-red-100 p-10 text-center space-y-4 shadow-sm">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
            <p className="font-bold text-red-600">{(error as Error)?.message ?? "Erro ao carregar."}</p>
            <button onClick={() => refetch()} className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-full text-sm font-bold hover:bg-red-700 transition-colors">
              <RefreshCw className="w-4 h-4" /> Tentar novamente
            </button>
          </div>
        )}

        {/* Skeletons */}
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
              <div className="h-3.5 bg-slate-200 rounded-full w-2/3" />
            </div>
          </div>
        ))}

        {/* Empty */}
        {!isLoading && !isError && (!posts || posts.length === 0) && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-5">
              <MessageCircle className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="font-bold text-slate-700 text-lg mb-1">Nenhum artigo ainda</h3>
            <p className="text-slate-400 text-sm">Em breve novos conteúdos serão publicados.</p>
          </div>
        )}

        {/* Posts */}
        {!isLoading && !isError && posts?.map((post, index) => (
          <Post
            key={post.id}
            post={post}
            index={index}
            isLiked={liked.has(post.id)}
            isSaved={saved.has(post.id)}
            onLike={() => likeMut.mutate(post.id)}
            onSave={() => setSaved(p => { const n = new Set(p); n.has(post.id) ? n.delete(post.id) : n.add(post.id); return n; })}
            onShare={() => handleShare(post.title, post.slug)}
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
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          {/* Avatar ring */}
          <div className="p-0.5 rounded-full bg-gradient-to-br from-[#c65f54] via-[#08454c] to-[#163b52] shrink-0">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden">
              <img
                src="/favicon.png"
                alt="Monteiro"
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
          title={isSaved ? "Salvo" : "Salvar"}
        >
          <Bookmark className={`w-5 h-5 ${isSaved ? "fill-current" : ""}`} />
        </button>
      </div>

      {/* ── Caption / Title above image ── */}
      <div className="px-4 pb-3">
        <p className="text-[#163b52] text-sm leading-relaxed">
          <span className="font-bold">{post.title}</span>
          {post.summary ? <span className="text-slate-500 font-light"> — {post.summary}</span> : null}
        </p>
      </div>

      {/* ── Media — full width, no crop ── */}
      <div
        className="relative w-full bg-slate-900 overflow-hidden cursor-pointer"
        onDoubleClick={triggerHeart}
      >
        {post.videoUrl ? (
          <video
            src={post.videoUrl}
            controls
            playsInline
            className="w-full max-h-[520px] object-contain bg-black"
          />
        ) : post.youtubeUrl && vid ? (
          <a href={`https://www.youtube.com/watch?v=${vid}`} target="_blank" rel="noopener noreferrer" className="block relative">
            <img
              src={`https://img.youtube.com/vi/${vid}/maxresdefault.jpg`}
              alt={post.title}
              className="w-full max-h-[520px] object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-xl">
                <Play className="w-6 h-6 text-white fill-white ml-1" />
              </div>
            </div>
          </a>
        ) : (
          <img
            src={cover!}
            alt={post.title}
            className="w-full max-h-[520px] object-cover"
            onError={e => {
              (e.target as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1454165833767-027ffea9e77b?auto=format&fit=crop&q=80&w=900";
            }}
          />
        )}

        {/* Double-tap heart */}
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

      {/* ── Reactions row ── */}
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
        <span className="text-xs text-slate-400">Ver comentários</span>
      </div>

      {/* ── Action buttons ── */}
      <div className="grid grid-cols-3 gap-0 px-2 py-1">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onLike}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-colors ${
            isLiked
              ? "text-red-500 bg-red-50"
              : "text-slate-500 hover:bg-slate-50 hover:text-red-400"
          }`}
        >
          <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
          Curtir
        </motion.button>

        <Link href={`/blog/${post.slug}#comments`}>
          <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 hover:text-[#08454c] transition-colors">
            <MessageCircle className="w-5 h-5" />
            Comentar
          </button>
        </Link>

        <button
          onClick={onShare}
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 hover:text-blue-500 transition-colors"
        >
          <Share2 className="w-5 h-5" />
          Compartilhar
        </button>
      </div>

      {/* ── Read more ── */}
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
