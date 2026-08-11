import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { usePosts } from "@/hooks/use-content";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Heart, MessageCircle, Share2, ShieldCheck, TrendingUp,
  Image as ImageIcon, AlertCircle, RefreshCw, Play, ArrowRight,
  Sparkles, Calendar, BookOpen
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

const formatDate = (dateInput: string | Date | null | undefined) => {
  if (!dateInput) return 'Novidade';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return 'Novidade';
    return format(d, "dd 'de' MMM", { locale: ptBR });
  } catch {
    return 'Novidade';
  }
};

export default function Blog() {
  const { data: posts, isLoading, isError, error, refetch } = usePosts();
  const { user } = useAuth();
  const { toast } = useToast();
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());

  const likeMutation = useMutation({
    mutationFn: async (postId: number) => {
      await apiRequest("POST", `/api/posts/${postId}/like`, {});
    },
    onSuccess: (_data, postId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setLikedPosts(prev => {
        const next = new Set(prev);
        if (next.has(postId)) next.delete(postId); else next.add(postId);
        return next;
      });
    }
  });

  const handleShare = async (title: string, slug: string) => {
    const url = `${window.location.origin}/blog/${slug}`;
    if (typeof navigator.share === 'function') {
      try { await navigator.share({ title, url }); } catch { }
    } else {
      navigator.clipboard?.writeText(url);
      toast({ title: "Link copiado!", description: "Cole o link onde quiser compartilhar." });
    }
  };

  return (
    <div className="min-h-screen font-sans" style={{ background: "linear-gradient(to bottom, #0d2e3a 0%, #0a3a42 60%, #08454c 100%)" }}>
      <Navbar />

      {/* ── Hero Header ── */}
      <div className="pt-28 pb-10 relative overflow-hidden">
        {/* Glow orbs */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#c65f54]/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-[#809ba6]/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="container px-4 md:px-6 mx-auto relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#c65f54]/15 border border-[#c65f54]/30 text-[#c65f54] text-xs font-bold uppercase tracking-widest mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                Comunidade Monteiro
              </div>
              <h1 className="text-4xl md:text-6xl font-display font-bold text-white leading-tight">
                Blog &amp; <span className="text-[#c65f54]">Conteúdo</span>
              </h1>
              <p className="text-slate-300 mt-3 text-base md:text-lg max-w-xl font-light">
                Dicas, tendências e novidades do universo de seguros e benefícios.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white/70 text-sm font-semibold">
                <TrendingUp className="w-4 h-4 text-[#c65f54]" />
                Em alta
              </div>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white/70 text-sm font-semibold">
                <BookOpen className="w-4 h-4 text-[#c65f54]" />
                {posts?.length ?? 0} artigos
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Feed ── */}
      <div className="container px-4 md:px-6 mx-auto pb-24 relative z-10">

        {/* Error */}
        {isError && (
          <div className="bg-red-900/30 border border-red-500/30 rounded-3xl p-10 text-center space-y-4 backdrop-blur-sm">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
            <h3 className="font-bold text-red-300 text-lg">Erro ao carregar artigos</h3>
            <p className="text-red-400/80 text-sm">{(error as Error)?.message ?? "Não foi possível carregar os artigos."}</p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-full text-sm font-bold hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Tentar novamente
            </button>
          </div>
        )}

        {/* Skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="rounded-[2rem] bg-white/5 animate-pulse border border-white/8 overflow-hidden">
                <div className="h-64 bg-white/10" />
                <div className="p-5 space-y-3">
                  <div className="h-3 bg-white/10 rounded-full w-1/3" />
                  <div className="h-5 bg-white/10 rounded-full w-4/5" />
                  <div className="h-4 bg-white/10 rounded-full w-full" />
                  <div className="h-4 bg-white/10 rounded-full w-2/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && (!posts || posts.length === 0) && (
          <div className="text-center py-24">
            <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-10 h-10 text-white/30" />
            </div>
            <h3 className="text-white/60 font-bold text-xl mb-2">Nenhum artigo publicado ainda</h3>
            <p className="text-white/30 text-sm">Em breve novos conteúdos serão publicados.</p>
          </div>
        )}

        {/* ── Card Grid — TikTok/Reels Style ── */}
        {!isLoading && !isError && posts && posts.length > 0 && (
          <>
            {/* First post — Hero card (full width) */}
            <HeroCard post={posts[0]} likedPosts={likedPosts} onLike={(id) => likeMutation.mutate(id)} onShare={handleShare} />

            {/* Remaining posts — 3-column masonry-like grid */}
            {posts.length > 1 && (
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-auto">
                {posts.slice(1).map((post, index) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    index={index}
                    likedPosts={likedPosts}
                    onLike={(id) => likeMutation.mutate(id)}
                    onShare={handleShare}
                    tall={index % 5 === 1 || index % 5 === 3}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}

/* ─────────────────────────────────────────
   Hero Card — large featured first post
───────────────────────────────────────── */
function HeroCard({ post, likedPosts, onLike, onShare }: any) {
  const isLiked = likedPosts.has(post.id);

  const getYoutubeId = (url: string) => {
    const match = url?.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
    return match?.[2] ?? null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative w-full rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl group"
      style={{ minHeight: 480 }}
    >
      {/* Background media */}
      <div className="absolute inset-0 z-0">
        {post.videoUrl ? (
          <video
            src={post.videoUrl}
            className="w-full h-full object-cover"
            autoPlay muted loop playsInline
          />
        ) : post.youtubeUrl ? (
          <img
            src={`https://img.youtube.com/vi/${getYoutubeId(post.youtubeUrl)}/maxresdefault.jpg`}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <img
            src={post.coverImage || "https://images.unsplash.com/photo-1454165833767-027ffea9e77b?auto=format&fit=crop&q=80&w=1600"}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1454165833767-027ffea9e77b?auto=format&fit=crop&q=80&w=1600"; }}
          />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" />
      </div>

      {/* Featured badge */}
      {post.isFeatured && (
        <div className="absolute top-5 left-5 z-20 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#c65f54] text-white text-xs font-bold uppercase tracking-wider shadow-lg">
          <Sparkles className="w-3 h-3" /> Destaque
        </div>
      )}

      {post.youtubeUrl && (
        <div className="absolute top-5 right-5 z-20 w-10 h-10 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
          <Play className="w-4 h-4 text-white fill-white ml-0.5" />
        </div>
      )}

      {/* Content overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-7 md:p-10">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-white/70 text-xs font-semibold">
            <Calendar className="w-3 h-3" />
            {formatDate(post.publishedAt)}
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#08454c]/80 backdrop-blur-sm border border-[#809ba6]/30 text-white/70 text-xs font-semibold">
            <ShieldCheck className="w-3 h-3 text-[#c65f54]" />
            Monteiro Blog
          </div>
        </div>

        <Link href={`/blog/${post.slug}`}>
          <h2 className="text-2xl md:text-4xl font-display font-bold text-white leading-tight mb-3 hover:text-[#c65f54] transition-colors cursor-pointer line-clamp-3">
            {post.title}
          </h2>
        </Link>

        <p className="text-white/70 text-sm md:text-base font-light leading-relaxed line-clamp-2 mb-6 max-w-2xl">
          {post.summary}
        </p>

        <div className="flex items-center justify-between">
          <Link href={`/blog/${post.slug}`}>
            <button className="flex items-center gap-2 px-6 py-3 bg-[#c65f54] text-white rounded-full font-bold text-sm hover:bg-[#c65f54]/90 transition-all hover:shadow-lg hover:shadow-[#c65f54]/30 group/btn">
              Ler artigo completo
              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </Link>

          <div className="flex items-center gap-2">
            <ActionBtn
              icon={<Heart className={`w-5 h-5 transition-colors ${isLiked ? 'text-red-400 fill-red-400' : 'text-white/70'}`} />}
              label={`${post.likes ?? 0}`}
              onClick={() => onLike(post.id)}
            />
            <Link href={`/blog/${post.slug}`}>
              <ActionBtn icon={<MessageCircle className="w-5 h-5 text-white/70" />} label="Comentar" />
            </Link>
            <ActionBtn icon={<Share2 className="w-5 h-5 text-white/70" />} label="Compartilhar" onClick={() => onShare(post.title, post.slug)} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────
   Regular Post Card — TikTok-inspired
───────────────────────────────────────── */
function PostCard({ post, index, likedPosts, onLike, onShare, tall }: any) {
  const isLiked = likedPosts.has(post.id);

  const getYoutubeId = (url: string) => {
    const match = url?.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
    return match?.[2] ?? null;
  };

  const coverSrc = post.videoUrl
    ? undefined
    : post.youtubeUrl
    ? `https://img.youtube.com/vi/${getYoutubeId(post.youtubeUrl)}/mqdefault.jpg`
    : post.coverImage || "https://images.unsplash.com/photo-1454165833767-027ffea9e77b?auto=format&fit=crop&q=80&w=800";

  return (
    <motion.article
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: index * 0.07, duration: 0.5 }}
      className={`relative rounded-[2rem] overflow-hidden border border-white/10 group flex flex-col ${tall ? 'row-span-2' : ''}`}
      style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(10px)" }}
    >
      {/* Media area */}
      <div className={`relative overflow-hidden ${tall ? 'h-80' : 'h-56'} bg-slate-900`}>
        {post.videoUrl ? (
          <video
            src={post.videoUrl}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            muted
            onMouseOver={e => (e.target as HTMLVideoElement).play()}
            onMouseOut={e => (e.target as HTMLVideoElement).pause()}
          />
        ) : (
          <img
            src={coverSrc}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1454165833767-027ffea9e77b?auto=format&fit=crop&q=80&w=800"; }}
          />
        )}
        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Badges */}
        {post.isFeatured && (
          <div className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#c65f54] text-white text-[10px] font-bold uppercase tracking-wider">
            <Sparkles className="w-2.5 h-2.5" /> Destaque
          </div>
        )}
        {post.youtubeUrl && (
          <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
            <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
          </div>
        )}
        {post.videoUrl && (
          <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-black/60 text-white text-[10px] font-bold uppercase flex items-center gap-1">
            <Play className="w-2.5 h-2.5 fill-current" /> Vídeo
          </div>
        )}

        {/* Date overlay at bottom of image */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1 text-white/70 text-[10px] font-semibold">
          <Calendar className="w-3 h-3" />
          {formatDate(post.publishedAt)}
        </div>
      </div>

      {/* Text content */}
      <div className="flex-1 flex flex-col p-5">
        <Link href={`/blog/${post.slug}`}>
          <h3 className="font-display font-bold text-white text-base leading-snug mb-2 line-clamp-2 hover:text-[#c65f54] transition-colors cursor-pointer group-hover:text-[#c65f54]/90">
            {post.title}
          </h3>
        </Link>
        <p className="text-white/50 text-xs font-light leading-relaxed line-clamp-2 flex-1">
          {post.summary}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/8">
          <div className="flex items-center gap-1">
            <button
              onClick={() => onLike(post.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${isLiked ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-red-300'}`}
            >
              <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
              {post.likes ?? 0}
            </button>
            <button
              onClick={() => onShare(post.title, post.slug)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 text-white/50 hover:bg-white/10 hover:text-blue-300 text-xs font-bold transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <Link href={`/blog/${post.slug}`}>
            <button className="flex items-center gap-1 text-[#c65f54] text-xs font-bold hover:text-[#c65f54]/80 transition-colors group/read">
              Ler
              <ArrowRight className="w-3.5 h-3.5 group-hover/read:translate-x-0.5 transition-transform" />
            </button>
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

/* ─────────────────────────────────────────
   Shared action button helper
───────────────────────────────────────── */
function ActionBtn({ icon, label, onClick }: { icon: React.ReactNode; label?: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 text-white/80 text-xs font-bold transition-all"
    >
      {icon}
      {label && <span>{label}</span>}
    </button>
  );
}
