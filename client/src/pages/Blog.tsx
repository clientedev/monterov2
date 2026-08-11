import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { usePosts } from "@/hooks/use-content";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Heart, MessageCircle, Share2, ShieldCheck,
  AlertCircle, RefreshCw, Play, ArrowRight,
  Sparkles, Calendar, BookOpen, Star
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const formatDate = (dateInput: string | Date | null | undefined) => {
  if (!dateInput) return "Novidade";
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "Novidade";
    return format(d, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  } catch {
    return "Novidade";
  }
};

const getYoutubeId = (url: string) => {
  const match = url?.match(/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
  return match?.[2] ?? null;
};

export default function Blog() {
  const { data: posts, isLoading, isError, error, refetch } = usePosts();
  const { toast } = useToast();
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());

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

  const handleShare = async (title: string, slug: string) => {
    const url = `${window.location.origin}/blog/${slug}`;
    if (typeof navigator.share === "function") {
      try { await navigator.share({ title, url }); } catch { }
    } else {
      navigator.clipboard?.writeText(url);
      toast({ title: "Link copiado!", description: "Cole onde quiser compartilhar." });
    }
  };

  return (
    <div className="min-h-screen font-sans bg-[#eae4da]">
      <Navbar />

      {/* ── Page Header ── */}
      <div className="bg-[#08454c] pt-28 pb-14 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#c65f54]/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#809ba6]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="container px-4 md:px-6 mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#c65f54]/15 border border-[#c65f54]/30 text-[#c65f54] text-xs font-bold uppercase tracking-widest mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            Blog Monteiro
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-bold text-white leading-tight mb-4">
            Artigos &amp; <span className="text-[#c65f54]">Novidades</span>
          </h1>
          <p className="text-white/60 text-base md:text-lg max-w-xl font-light">
            Dicas, tendências e novidades do universo de seguros e benefícios para você e sua empresa.
          </p>
          <div className="flex items-center gap-3 mt-6">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/60 text-sm font-semibold">
              <BookOpen className="w-4 h-4 text-[#c65f54]" />
              {posts?.length ?? 0} artigos publicados
            </div>
          </div>
        </div>
      </div>

      {/* ── Article List ── */}
      <div className="container px-4 md:px-6 mx-auto py-14">
        <div className="max-w-3xl mx-auto space-y-5">

          {/* Error */}
          {isError && (
            <div className="bg-red-50 border border-red-200 rounded-3xl p-10 text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
              <h3 className="font-bold text-red-700 text-lg">Erro ao carregar artigos</h3>
              <p className="text-red-500 text-sm">{(error as Error)?.message ?? "Não foi possível carregar os artigos."}</p>
              <button
                onClick={() => refetch()}
                className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-full text-sm font-bold hover:bg-red-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> Tentar novamente
              </button>
            </div>
          )}

          {/* Skeletons */}
          {isLoading &&
            [1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white rounded-3xl border border-slate-100 overflow-hidden flex h-44 animate-pulse">
                <div className="w-48 shrink-0 bg-slate-200" />
                <div className="flex-1 p-6 space-y-3">
                  <div className="h-3 bg-slate-200 rounded-full w-1/4" />
                  <div className="h-5 bg-slate-200 rounded-full w-3/4" />
                  <div className="h-4 bg-slate-200 rounded-full w-full" />
                  <div className="h-4 bg-slate-200 rounded-full w-2/3" />
                </div>
              </div>
            ))}

          {/* Empty */}
          {!isLoading && !isError && (!posts || posts.length === 0) && (
            <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-5">
                <BookOpen className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="font-bold text-slate-700 text-xl mb-2">Nenhum artigo publicado ainda</h3>
              <p className="text-slate-400 text-sm">Em breve novos conteúdos serão publicados aqui.</p>
            </div>
          )}

          {/* Article cards */}
          {!isLoading &&
            !isError &&
            posts?.map((post, index) => {
              const isLiked = likedPosts.has(post.id);
              const ytId = post.youtubeUrl ? getYoutubeId(post.youtubeUrl) : null;
              const thumbSrc = post.videoUrl
                ? null
                : ytId
                ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`
                : post.coverImage || "https://images.unsplash.com/photo-1454165833767-027ffea9e77b?auto=format&fit=crop&q=80&w=600";

              return (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: Math.min(index * 0.06, 0.3), duration: 0.45 }}
                  className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-400 group"
                >
                  <Link href={`/blog/${post.slug}`}>
                    <a className="flex h-44 cursor-pointer">
                      {/* Thumbnail */}
                      <div className="w-44 md:w-56 shrink-0 relative overflow-hidden bg-slate-100">
                        {post.videoUrl ? (
                          <video
                            src={post.videoUrl}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-600"
                            muted
                          />
                        ) : (
                          <img
                            src={thumbSrc!}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-600"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "https://images.unsplash.com/photo-1454165833767-027ffea9e77b?auto=format&fit=crop&q=80&w=600";
                            }}
                          />
                        )}
                        {/* Overlay tint */}
                        <div className="absolute inset-0 bg-[#08454c]/20 group-hover:bg-[#08454c]/10 transition-colors duration-400" />

                        {/* Media type badge */}
                        {(post.videoUrl || post.youtubeUrl) && (
                          <div className="absolute bottom-3 left-3 w-8 h-8 rounded-full bg-[#c65f54] flex items-center justify-center shadow-lg">
                            <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
                          </div>
                        )}

                        {/* Featured badge */}
                        {post.isFeatured && (
                          <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold shadow">
                            <Star className="w-2.5 h-2.5 fill-white" /> Destaque
                          </div>
                        )}
                      </div>

                      {/* Text */}
                      <div className="flex-1 flex flex-col justify-between p-5 md:p-6 min-w-0">
                        <div>
                          <div className="flex items-center gap-2 mb-2.5">
                            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              <Calendar className="w-3 h-3" />
                              {formatDate(post.publishedAt)}
                            </div>
                            <span className="text-slate-200">•</span>
                            <div className="flex items-center gap-1 text-[10px] font-bold text-[#c65f54] uppercase tracking-wider">
                              <ShieldCheck className="w-3 h-3" />
                              Monteiro Blog
                            </div>
                          </div>

                          <h2 className="font-display font-bold text-[#163b52] text-base md:text-lg leading-snug line-clamp-2 group-hover:text-[#08454c] transition-colors duration-300 mb-2">
                            {post.title}
                          </h2>
                          <p className="text-slate-500 text-sm font-light leading-relaxed line-clamp-2">
                            {post.summary}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#c65f54] uppercase tracking-wider group-hover:gap-2.5 transition-all">
                            Ler artigo
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                          </span>
                        </div>
                      </div>
                    </a>
                  </Link>

                  {/* Actions bar — outside the link so clicks don't navigate */}
                  <div className="border-t border-slate-50 px-5 py-2.5 flex items-center gap-1">
                    <button
                      onClick={(e) => { e.preventDefault(); likeMutation.mutate(post.id); }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                        isLiked
                          ? "bg-red-50 text-red-500"
                          : "text-slate-400 hover:bg-slate-50 hover:text-red-400"
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isLiked ? "fill-current" : ""}`} />
                      {post.likes ?? 0} Curtir
                    </button>

                    <Link href={`/blog/${post.slug}#comments`}>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-slate-400 hover:bg-slate-50 hover:text-[#08454c] transition-all">
                        <MessageCircle className="w-3.5 h-3.5" />
                        Comentar
                      </button>
                    </Link>

                    <button
                      onClick={() => handleShare(post.title, post.slug)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-slate-400 hover:bg-slate-50 hover:text-blue-500 transition-all"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      Compartilhar
                    </button>
                  </div>
                </motion.article>
              );
            })}
        </div>
      </div>

      <Footer />
    </div>
  );
}
