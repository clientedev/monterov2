import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { usePosts } from "@/hooks/use-content";
import { format } from "date-fns";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Share2, ShieldCheck, TrendingUp, Users } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function Blog() {
  const { data: posts, isLoading } = usePosts();
  const { user } = useAuth();
  const { toast } = useToast();
  const [postText, setPostText] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const likeMutation = useMutation({
    mutationFn: async (postId: number) => {
      await apiRequest("POST", `/api/posts/${postId}/like`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    }
  });

  const createPostMutation = useMutation({
    mutationFn: async (text: string) => {
      const payload = {
        title: text.substring(0, 30) + (text.length > 30 ? "..." : ""),
        slug: `post-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        content: text,
        summary: text,
        coverImage: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=800", // Default placeholder
      };
      await apiRequest("POST", "/api/posts", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setPostText("");
      setIsCreating(false);
      toast({
        title: "Sucesso!",
        description: "Postagem enviada para moderação. Será exibida após aprovação do administrador.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Erro",
        description: err.message || "Falha ao enviar postagem",
        variant: "destructive"
      });
    }
  });

  const handleCreateClick = () => {
    if (!user) {
      toast({
        title: "Acesso Negado",
        description: "Você precisa estar logado para publicar no blog.",
        variant: "destructive"
      });
      return;
    }
    setIsCreating(true);
  };

  const handleShare = async (title: string, slug: string) => {
    const url = `${window.location.origin}/blog/${slug}`;
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, url });
      } catch (err) {
        // user cancelled share
      }
    } else {
      window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank', 'width=600,height=400');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-primary/20">
      <Navbar />

      <div className="pt-32 pb-8 bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="container px-4 mx-auto md:max-w-4xl flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900 group flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Users className="w-5 h-5" />
              </span>
              Comunidade Monteiro
            </h1>
            <p className="text-sm text-slate-500 mt-1 font-medium hidden sm:block">
              Fique por dentro das novidades, interaja e compartilhe experiências.
            </p>
          </div>
          <div className="flex gap-2">
            <div className="px-4 py-2 rounded-full bg-slate-100 flex items-center gap-2 text-sm font-semibold text-slate-600">
              <TrendingUp className="w-4 h-4 text-primary" />
              Em alta
            </div>
          </div>
        </div>
      </div>

      <div className="container px-4 py-8 mx-auto md:max-w-4xl flex flex-col md:flex-row gap-8">
        
        {/* Feed Column */}
        <div className="w-full md:w-2/3 space-y-8">
          {/* Create Post Field */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
               <span className="font-bold">{user ? user.name.substring(0,2).toUpperCase() : "VC"}</span>
            </div>
            <div className="flex-1">
              {!isCreating ? (
                <div 
                  onClick={handleCreateClick}
                  className="w-full bg-slate-50 border border-slate-100 rounded-full py-3 px-5 text-slate-400 text-sm font-medium cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  O que você está pensando sobre seguros hoje?
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea
                    value={postText}
                    onChange={(e) => setPostText(e.target.value)}
                    placeholder="Escreva sua publicação..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[100px] resize-none"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => setIsCreating(false)}
                      className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={() => createPostMutation.mutate(postText)}
                      disabled={createPostMutation.isPending || !postText.trim()}
                      className="px-6 py-2 bg-primary text-white text-sm font-semibold rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {createPostMutation.isPending ? "Enviando..." : "Publicar"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl h-80 animate-pulse border border-slate-100" />
              ))}
            </div>
          ) : (
            <div className="space-y-8">
              {posts?.map((post, index) => (
                <motion.article 
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  viewport={{ once: true, margin: "-50px" }}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 group"
                >
                  {/* Post Header */}
                  <div className="p-5 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-white shrink-0">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900">Monteiro Corretora</h3>
                        <span className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white shrink-0">
                           <ShieldCheck className="w-2.5 h-2.5" />
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-500">
                        {post.publishedAt ? format(new Date(post.publishedAt), "dd 'de' MMMM 'às' HH:mm") : 'Rascunho'} • Especialista
                      </p>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="px-5 pb-3">
                    <h2 className="text-xl font-display font-bold text-slate-900 mb-2">
                      {post.title}
                    </h2>
                    <p className="text-slate-600 text-sm leading-relaxed mb-4">
                      {post.summary}
                    </p>
                  </div>

                  {/* Post Media */}
                  <div className="relative">
                    <Link href={`/blog/${post.slug}`}>
                      <div className="block cursor-pointer overflow-hidden border-y border-slate-100 bg-slate-50">
                        <img 
                          src={post.coverImage} 
                          alt={post.title} 
                          className="w-full max-h-[400px] object-cover hover:scale-105 transition-transform duration-700"
                        />
                      </div>
                    </Link>
                  </div>

                  {/* Post Stats */}
                  <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between text-xs font-medium text-slate-500">
                    <div className="flex items-center gap-1">
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                        <Heart className="w-3 h-3 fill-current" />
                      </div>
                      <span>{post.likes || 0} curtidas</span>
                    </div>
                    <div>
                      <span className="hover:underline cursor-pointer">Ver comentários </span>
                    </div>
                  </div>

                  {/* Post Actions */}
                  <div className="px-2 py-1 flex items-center justify-between">
                    <button 
                      onClick={() => likeMutation.mutate(post.id)}
                      disabled={likeMutation.isPending}
                      className="flex-1 py-3 flex items-center justify-center gap-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors font-semibold text-sm group/btn"
                    >
                      <Heart className={`w-5 h-5 group-hover/btn:text-red-500 transition-colors ${likeMutation.isPending ? 'animate-pulse' : ''}`} />
                      <span className="group-hover/btn:text-red-500 transition-colors">Curtir</span>
                    </button>
                    
                    <Link href={`/blog/${post.slug}`} className="flex-1">
                      <button className="w-full py-3 flex items-center justify-center gap-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors font-semibold text-sm group/btn">
                        <MessageCircle className="w-5 h-5 group-hover/btn:text-primary transition-colors" />
                        <span className="group-hover/btn:text-primary transition-colors">Comentar</span>
                      </button>
                    </Link>

                    <button 
                      onClick={() => handleShare(post.title, post.slug)}
                      className="flex-1 py-3 flex items-center justify-center gap-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors font-semibold text-sm group/btn"
                    >
                      <Share2 className="w-5 h-5 group-hover/btn:text-blue-500 transition-colors" />
                      <span className="group-hover/btn:text-blue-500 transition-colors">Compartilhar</span>
                    </button>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-full md:w-1/3 hidden md:block">
           <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-56">
             <h3 className="font-display font-bold text-lg text-slate-900 mb-4">Sobre a Comunidade</h3>
             <p className="text-slate-600 text-sm leading-relaxed mb-6">
               Este é o nosso espaço de interação. Compartilhamos dicas valiosas e as últimas tendências do mercado de seguros para manter você e seu patrimônio protegidos.
             </p>
             <div className="space-y-4">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                   <ShieldCheck className="w-5 h-5" />
                 </div>
                 <div className="text-sm">
                   <p className="font-bold text-slate-900">Moderação Ativa</p>
                   <p className="text-slate-500">Ambiente seguro e confiável</p>
                 </div>
               </div>
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                   <Users className="w-5 h-5" />
                 </div>
                 <div className="text-sm">
                   <p className="font-bold text-slate-900">+500 Membros</p>
                   <p className="text-slate-500">Especialistas e clientes</p>
                 </div>
               </div>
             </div>
           </div>
        </div>

      </div>

      <Footer />
    </div>
  );
}
