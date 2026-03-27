import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { usePost, useComments } from "@/hooks/use-content";
import { useRoute, Link } from "wouter";
import { format } from "date-fns";
import { ArrowLeft, Share2, Heart, MessageSquare, Facebook, Twitter, Linkedin } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

function getYouTubeID(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export default function PostDetail() {
  const [match, params] = useRoute("/blog/:slug");
  const slug = params?.slug || "";
  const { data: post, isLoading } = usePost(slug);
  const { data: comments, isLoading: isLoadingComments } = useComments(post?.id ?? 0);
  const { toast } = useToast();

  const [commentName, setCommentName] = useState("");
  const [commentText, setCommentText] = useState("");

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!post) return;
      await apiRequest("POST", `/api/posts/${post.id}/like`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts", slug] });
    }
  });

  const commentMutation = useMutation({
    mutationFn: async () => {
      if (!post) return;
      await apiRequest("POST", `/api/posts/${post.id}/comments`, {
        authorName: commentName,
        content: commentText
      });
    },
    onSuccess: () => {
      toast({
        title: "Comentário enviado!",
        description: "Seu comentário foi enviado e aguarda aprovação do administrador.",
      });
      setCommentName("");
      setCommentText("");
    },
    onError: () => {
      toast({
        title: "Erro ao enviar",
        description: "Não foi possível enviar seu comentário no momento.",
        variant: "destructive"
      });
    }
  });

  const handleShare = async (platform: 'native' | 'facebook' | 'twitter' | 'linkedin') => {
    const url = window.location.href;
    const title = post?.title || '';

    if (platform === 'native' && navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch (err) {
        // user cancelled share
      }
      return;
    }

    let shareUrl = '';
    if (platform === 'facebook') shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    if (platform === 'twitter') shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
    if (platform === 'linkedin') shareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;

    if (shareUrl) window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="pt-32 container px-4 mx-auto max-w-3xl">
          <div className="h-8 bg-slate-100 w-24 mb-6 rounded animate-pulse" />
          <div className="h-12 bg-slate-100 w-3/4 mb-6 rounded animate-pulse" />
          <div className="h-96 bg-slate-100 w-full rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Postagem não encontrada</h1>
          <Link href="/blog" className="text-primary hover:underline">Voltar para a Comunidade</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      <Navbar />

      <article className="pt-32 pb-20">
        <div className="container px-4 mx-auto max-w-3xl">
          <Link href="/blog">
            <button className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors mb-8 text-sm font-medium">
              <ArrowLeft className="w-4 h-4" />
              Voltar para a Comunidade
            </button>
          </Link>

          <header className="mb-10">
            <div className="flex gap-4 items-center text-sm text-slate-500 mb-6">
              <span className="bg-slate-100 px-3 py-1 rounded-full text-slate-800 font-medium">Notícias</span>
              <span>{post.publishedAt && format(new Date(post.publishedAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-900 leading-tight mb-8">
              {post.title}
            </h1>
          </header>

          <div className="aspect-video rounded-2xl overflow-hidden mb-12 shadow-lg">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="prose prose-lg prose-slate prose-headings:font-display prose-headings:font-bold prose-a:text-primary max-w-none">
            <div className="whitespace-pre-line text-slate-600 leading-relaxed">
              {post.content}
            </div>
          </div>

          {(post.videoUrl || post.youtubeUrl) && (
            <div className="mt-12 space-y-8">
              {post.videoUrl && (
                <div className="rounded-2xl overflow-hidden shadow-lg bg-black">
                  <video 
                    src={post.videoUrl} 
                    controls 
                    className="w-full h-auto max-h-[600px]"
                  />
                </div>
              )}
              
              {post.youtubeUrl && getYouTubeID(post.youtubeUrl) && (
                <div className="aspect-video rounded-2xl overflow-hidden shadow-lg bg-black">
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${getYouTubeID(post.youtubeUrl)}`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              )}
            </div>
          )}

          <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="lg"
                className="rounded-full gap-2 border-slate-200 hover:border-red-200 hover:bg-red-50 hover:text-red-500 transition-colors"
                onClick={() => likeMutation.mutate()}
                disabled={likeMutation.isPending}
              >
                <Heart className={`w-5 h-5 ${likeMutation.isPending ? 'animate-pulse' : ''}`} />
                <span className="font-semibold">{post.likes || 0} Curtidas</span>
              </Button>

              <div className="flex items-center gap-2 text-slate-500 font-medium">
                <MessageSquare className="w-5 h-5" />
                <span>{comments?.length || 0} Comentários</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-display font-medium text-slate-500 text-sm">Compartilhar:</span>
              <div className="flex gap-2">
                {typeof navigator.share === 'function' && (
                  <button onClick={() => handleShare('native')} className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors text-slate-600">
                    <Share2 className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => handleShare('facebook')} className="p-2 rounded-full bg-blue-50 hover:bg-blue-100 transition-colors text-blue-600">
                  <Facebook className="w-4 h-4" />
                </button>
                <button onClick={() => handleShare('linkedin')} className="p-2 rounded-full bg-blue-50 hover:bg-blue-100 transition-colors text-blue-700">
                  <Linkedin className="w-4 h-4" />
                </button>
                <button onClick={() => handleShare('twitter')} className="p-2 rounded-full bg-slate-50 hover:bg-slate-200 transition-colors text-slate-800">
                  <Twitter className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-16 bg-slate-50 rounded-3xl p-6 md:p-10">
            <h3 className="text-2xl font-display font-bold text-slate-900 mb-8">Comentários</h3>

            <form
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-10 space-y-4"
              onSubmit={(e) => { e.preventDefault(); commentMutation.mutate(); }}
            >
              <h4 className="font-medium text-slate-900 mb-2">Deixe seu comentário</h4>
              <Input
                placeholder="Seu nome"
                required
                value={commentName}
                onChange={(e) => setCommentName(e.target.value)}
                className="bg-slate-50 border-slate-200 focus-visible:ring-primary"
              />
              <Textarea
                placeholder="O que você achou deste artigo?"
                required
                rows={4}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="bg-slate-50 border-slate-200 focus-visible:ring-primary resize-none"
              />
              <Button type="submit" disabled={commentMutation.isPending || !commentName.trim() || !commentText.trim()} className="w-full sm:w-auto">
                {commentMutation.isPending ? "Enviando..." : "Enviar Comentário"}
              </Button>
            </form>

            <div className="space-y-6">
              {isLoadingComments ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-20 bg-slate-200 rounded-2xl w-full"></div>
                  <div className="h-20 bg-slate-200 rounded-2xl w-full"></div>
                </div>
              ) : comments && comments.filter((c: any) => c.isApproved).length > 0 ? (
                comments.filter((c: any) => c.isApproved).map((comment: any) => (
                  <div key={comment.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-primary font-bold text-lg">{comment.authorName.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <div className="flex items-baseline gap-3 mb-2">
                        <h5 className="font-bold text-slate-900">{comment.authorName}</h5>
                        <span className="text-sm text-slate-500">{format(new Date(comment.createdAt), "dd MMM yyyy")}</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">Nenhum comentário ainda. Seja o primeiro!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </article>

      <Footer />
    </div>
  );
}
