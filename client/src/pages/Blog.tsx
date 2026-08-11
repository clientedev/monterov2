import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { usePosts } from "@/hooks/use-content";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, MessageCircle, Share2, Bookmark,
  AlertCircle, RefreshCw, Play, MoreHorizontal,
  ShieldCheck, BadgeCheck, Sparkles, Star
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

const formatRelativeDate = (dateInput: string | Date | null | undefined) => {
  if (!dateInput) return "recentemente";
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "recentemente";
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffH = Math.floor(diffMs / 3600000);
    const diffD = Math.floor(diffH / 24);
    if (diffH < 1) return "agora mesmo";
    if (diffH < 24) return `${diffH}h atrás`;
    if (diffD < 7) return `${diffD}d atrás`;
    return format(d, "d 'de' MMM", { locale: ptBR });
  } catch { return "recentemente"; }
};

const getYoutubeId = (url: string) =>
  url?.match(/^.*(youtu\.be\/|v\/|embed\/|watch\?v=|&v=)([^#&?]*).*/)?.[2] ?? null;

export default function Blog() {
  const { data: posts, isLoading, isError, error, refetch } = usePosts();
  const { toast } = useToast();
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<number>>(new Set());

  const likeMutation = useMutation({
    mutationFn: async (postId: number) => {
      await apiRequest("POST", `/api/posts/${postId}/like`, {});
    },
    onSuccess: (_data, postId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setLikedPosts((prev) => {
        const next = new Set(prev);
        next.has(postId) ? next.delete(postId) : next.add(postId);
        return next;
      });
    },
  });

  const handleSave = (postId: number) => {
    setSavedPosts((prev) => {
      const next = new Set(prev);
      next.has(postId) ? next.delete(postId) : next.add(postId);
      return next;
    });
    toast({ title: savedPosts.has(postId) ? "Removido dos salvos" : "Salvo!" });
  };

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
    <div className="min-h-screen font-sans bg-[#fafafa]">
      <Navbar />

      {/* ── Profile / Channel Header ── */}
      <div className="bg-white border-b border-slate-100 pt-24 pb-0">
        <div className="max-w-[600px] mx-auto px-4">
          {/* Profile row */}
          <div className="flex items-center gap-6 py-8">
            {/* Avatar */}
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-[#08454c] via-[#163b52] to-[#c65f54] p-0.5 shrink-0">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                <img
                  src="/favicon.png"
                  alt="Monteiro"
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    const t = e.target as HTMLImageElement;
                    t.style.display = "none";
                    t.parentElement!.innerHTML = `<div class="w-full h-full rounded-full bg-[#08454c] flex items-center justify-center"><span class="text-white font-bold text-2xl">M</span></div>`;
                  }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-[#163b52] text-base">monteiro.seguros</span>
                <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500" />
              </div>
              <p className="text-slate-500 text-xs mb-4">Corretora de Seguros &amp; Benefícios • São Paulo</p>
              <div className="flex items-center gap-6 text-center">
                <div>
                  <p className="font-bold text-[#163b52] text-sm">{posts?.length ?? 0}</p>
                  <p className="text-slate-500 text-xs">publicações</p>
                </div>
                <div>
                  <p className="font-bold text-[#163b52] text-sm">+500</p>
                  <p className="text-slate-500 text-xs">seguidores</p>
                </div>
                <div>
                  <p className="font-bold text-[#163b52] text-sm">12</p>
                  <p className="text-slate-500 text-xs">seguindo</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="pb-4 text-sm text-[#163b52] leading-relaxed">
            <p>🛡️ Seguros &amp; Benefícios para empresas e famílias</p>
            <p>💼 Consultoria personalizada, sem enrolação</p>
            <p>📍 São Paulo — atendimento em todo o Brasil</p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pb-5">
            <Link href="/contact">
              <button className="flex-1 py-2.5 rounded-xl bg-[#08454c] text-white text-sm font-bold hover:bg-[#08454c]/90 transition-colors">
                Seguir
              </button>
            </Link>
            <Link href="/contact">
              <button className="flex-1 py-2.5 rounded-xl bg-slate-100 text-[#163b52] text-sm font-bold hover:bg-slate-200 transition-colors">
                Mensagem
              </button>
            </Link>
          </div>

          {/* Story-style highlights */}
          <div className="flex gap-5 pb-4 overflow-x-auto scrollbar-hide">
            {[
              { label: "Saúde", emoji: "🏥", color: "from-[#08454c] to-[#163b52]" },
              { label: "Vida", emoji: "💚", color: "from-[#c65f54] to-[#e07a6e]" },
              { label: "Auto", emoji: "🚗", color: "from-[#809ba6] to-[#5a7a87]" },
              { label: "Empresa", emoji: "🏢", color: "from-[#163b52] to-[#08454c]" },
              { label: "Dicas", emoji: "💡", color: "from-[#c65f54] to-[#08454c]" },
            ].map((h) => (
              <Link key={h.label} href="/services">
                <div className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${h.color} p-0.5`}>
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-2xl">
                      {h.emoji}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-600 font-medium">{h.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Tab bar */}
        <div className="max-w-[600px] mx-auto border-t border-slate-100">
          <div className="flex">
            <button className="flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold text-[#08454c] border-t-2 border-[#08454c]">
              <Sparkles className="w-4 h-4" /> ARTIGOS
            </button>
          </div>
        </div>
      </div>

      {/* ── Feed ── */}
      <div className="max-w-[600px] mx-auto">

        {/* Error */}
        {isError && (
          <div className="m-4 bg-red-50 border border-red-200 rounded-3xl p-8 text-center space-y-4">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
            <h3 className="font-bold text-red-700">Erro ao carregar</h3>
            <p className="text-red-500 text-sm">{(error as Error)?.message}</p>
            <button onClick={() => refetch()} className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-full text-sm font-bold">
              <RefreshCw className="w-4 h-4" /> Tentar novamente
            </button>
          </div>
        )}

        {/* Skeletons */}
        {isLoading && [1, 2, 3].map((i) => (
          <div key={i} className="bg-white border-b border-slate-100 animate-pulse">
            <div className="flex items-center gap-3 p-3.5">
              <div className="w-9 h-9 rounded-full bg-slate-200" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-slate-200 rounded w-1/3" />
                <div className="h-2.5 bg-slate-200 rounded w-1/4" />
              </div>
            </div>
            <div className="w-full aspect-square bg-slate-200" />
            <div className="p-4 space-y-2">
              <div className="h-3 bg-slate-200 rounded w-1/2" />
              <div className="h-3 bg-slate-200 rounded w-3/4" />
            </div>
          </div>
        ))}

        {/* Empty */}
        {!isLoading && !isError && (!posts || posts.length === 0) && (
          <div className="text-center py-20 px-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="font-bold text-slate-600 text-lg mb-1">Nenhuma publicação ainda</h3>
            <p className="text-slate-400 text-sm">Em breve novos conteúdos aparecerão aqui.</p>
          </div>
        )}

        {/* Posts */}
        {!isLoading && !isError && posts?.map((post, index) => (
          <InstaPost
            key={post.id}
            post={post}
            index={index}
            isLiked={likedPosts.has(post.id)}
            isSaved={savedPosts.has(post.id)}
            onLike={() => likeMutation.mutate(post.id)}
            onSave={() => handleSave(post.id)}
            onShare={() => handleShare(post.title, post.slug)}
          />
        ))}
      </div>

      <Footer />
    </div>
  );
}

/* ─────────────────────────────────────────
   Single Instagram-style post
───────────────────────────────────────── */
function InstaPost({
  post, index, isLiked, isSaved, onLike, onSave, onShare
}: {
  post: any; index: number;
  isLiked: boolean; isSaved: boolean;
  onLike: () => void; onSave: () => void; onShare: () => void;
}) {
  const [heartAnim, setHeartAnim] = useState(false);
  const lastTap = useRef(0);

  const handleDoubleTap = () => {
    if (!isLiked) onLike();
    setHeartAnim(true);
    setTimeout(() => setHeartAnim(false), 900);
  };

  const handleImageClick = () => {
    const now = Date.now();
    if (now - lastTap.current < 320) {
      handleDoubleTap();
    }
    lastTap.current = now;
  };

  const ytId = post.youtubeUrl ? getYoutubeId(post.youtubeUrl) : null;
  const coverSrc = post.videoUrl
    ? null
    : ytId
    ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`
    : post.coverImage || "https://images.unsplash.com/photo-1454165833767-027ffea9e77b?auto=format&fit=crop&q=80&w=800";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ delay: Math.min(index * 0.05, 0.25) }}
      className="bg-white border-b border-slate-100"
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-3.5 py-3">
        <div className="flex items-center gap-2.5">
          {/* Avatar ring */}
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#c65f54] via-[#08454c] to-[#163b52] p-0.5 shrink-0">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
              <ShieldCheck className="w-4 h-4 text-[#08454c]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-[#163b52]">monteiro.seguros</span>
              <BadgeCheck className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />
            </div>
            <span className="text-[10px] text-slate-400">{formatRelativeDate(post.publishedAt)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {post.isFeatured && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-600 text-[10px] font-bold">
              <Star className="w-2.5 h-2.5 fill-current" /> Destaque
            </div>
          )}
          <button className="p-1 text-slate-400 hover:text-slate-600">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Media ── */}
      <div
        className="relative w-full aspect-square bg-slate-100 cursor-pointer overflow-hidden"
        onClick={handleImageClick}
      >
        {post.videoUrl ? (
          <video
            src={post.videoUrl}
            className="w-full h-full object-cover"
            controls
            playsInline
          />
        ) : (
          <img
            src={coverSrc!}
            alt={post.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1454165833767-027ffea9e77b?auto=format&fit=crop&q=80&w=800";
            }}
          />
        )}

        {/* YouTube play badge */}
        {post.youtubeUrl && !post.videoUrl && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-6 h-6 text-white fill-white ml-1" />
            </div>
          </div>
        )}

        {/* Double-tap heart animation */}
        <AnimatePresence>
          {heartAnim && (
            <motion.div
              key="heart"
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 1.4, opacity: 1 }}
              exit={{ scale: 1.6, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <Heart className="w-24 h-24 text-white fill-white drop-shadow-2xl" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Action bar ── */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1">
        <div className="flex items-center gap-4">
          {/* Like */}
          <button
            onClick={onLike}
            className="flex items-center gap-1.5 group"
          >
            <motion.div whileTap={{ scale: 1.35 }} transition={{ type: "spring", stiffness: 400 }}>
              <Heart
                className={`w-6 h-6 transition-colors duration-150 ${
                  isLiked ? "text-red-500 fill-red-500" : "text-slate-700 group-hover:text-red-400"
                }`}
              />
            </motion.div>
          </button>

          {/* Comment */}
          <Link href={`/blog/${post.slug}#comments`}>
            <button className="group">
              <MessageCircle className="w-6 h-6 text-slate-700 group-hover:text-[#08454c] transition-colors" />
            </button>
          </Link>

          {/* Share */}
          <button onClick={onShare} className="group">
            <Share2 className="w-6 h-6 text-slate-700 group-hover:text-blue-500 transition-colors" />
          </button>
        </div>

        {/* Save */}
        <button onClick={onSave} className="group">
          <Bookmark
            className={`w-6 h-6 transition-colors duration-150 ${
              isSaved ? "text-[#08454c] fill-[#08454c]" : "text-slate-700 group-hover:text-[#08454c]"
            }`}
          />
        </button>
      </div>

      {/* ── Likes count ── */}
      <div className="px-3.5 pb-1">
        <span className="text-xs font-bold text-[#163b52]">
          {(post.likes ?? 0) + (isLiked ? 1 : 0)} curtidas
        </span>
      </div>

      {/* ── Caption ── */}
      <div className="px-3.5 pb-3">
        <p className="text-sm text-[#163b52] leading-snug">
          <span className="font-bold mr-2">monteiro.seguros</span>
          <span className="font-bold">{post.title} — </span>
          <span className="text-slate-600 font-light">{post.summary}</span>
        </p>

        <Link href={`/blog/${post.slug}`}>
          <button className="text-xs text-[#c65f54] font-bold mt-1.5 hover:text-[#c65f54]/80 transition-colors">
            Ler artigo completo →
          </button>
        </Link>
      </div>

      {/* ── Timestamp ── */}
      <div className="px-3.5 pb-4">
        <span className="text-[10px] text-slate-400 uppercase tracking-wider">
          {formatRelativeDate(post.publishedAt)}
        </span>
      </div>
    </motion.div>
  );
}
