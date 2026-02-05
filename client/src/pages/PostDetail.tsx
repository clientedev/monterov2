import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { usePost } from "@/hooks/use-content";
import { useRoute, Link } from "wouter";
import { format } from "date-fns";
import { ArrowLeft, Share2, MessageSquare } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function PostDetail() {
  const [match, params] = useRoute("/blog/:slug");
  const slug = params?.slug || "";
  const { data: post, isLoading, refetch } = usePost(slug);
  const { user } = useAuth();
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      await api.post(`/posts/${post?.id}/comments`, { content: comment });
      toast({ title: "Comentário enviado", description: "Aguardando aprovação." });
      setComment("");
    } catch {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao enviar." });
    } finally {
      setSubmitting(false);
    }
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
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Post Not Found</h1>
          <Link href="/blog" className="text-primary hover:underline">Return to Blog</Link>
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
              Back to Blog
            </button>
          </Link>

          <header className="mb-10">
            <div className="flex gap-4 items-center text-sm text-slate-500 mb-6">
              <span className="bg-slate-100 px-3 py-1 rounded-full text-slate-800 font-medium">News</span>
              <span>{post.publishedAt && format(new Date(post.publishedAt), 'MMMM dd, yyyy')}</span>
              <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {post.comments?.length || 0}</span>
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
            {/* HTML Content support */}
            <div className="whitespace-pre-line text-slate-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>

          <div className="mt-12 pt-8 border-t border-slate-100 flex justify-between items-center">
            <span className="font-display font-bold text-slate-900">Share this article:</span>
            <div className="flex gap-2">
              <button className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-600">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Comments Section */}
          <section className="mt-16">
            <h3 className="text-2xl font-bold mb-8">Comentários ({post.comments?.length || 0})</h3>

            <div className="space-y-6 mb-10">
              {post.comments?.map((c) => (
                <div key={c.id} className="bg-slate-50 p-6 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-slate-900">{c.author.username}</span>
                    <span className="text-xs text-slate-500">{format(new Date(c.createdAt), 'dd MMMM yyyy HH:mm')}</span>
                  </div>
                  <p className="text-slate-700">{c.content}</p>
                </div>
              ))}
              {(!post.comments || post.comments.length === 0) && <p className="text-slate-500 italic">Seja o primeiro a comentar!</p>}
            </div>

            {user ? (
              <form onSubmit={handleComment} className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <h4 className="font-semibold mb-4">Deixe um comentário</h4>
                <Textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Escreva sua opinião..."
                  className="bg-white mb-4"
                  required
                />
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Enviando..." : "Enviar Comentário"}
                </Button>
              </form>
            ) : (
              <div className="bg-slate-50 p-6 rounded-xl text-center">
                <p className="text-slate-600 mb-4">Faça login para comentar.</p>
                <Link href="/login"><Button variant="outline">Login</Button></Link>
              </div>
            )}
          </section>
        </div>
      </article>

      <Footer />
    </div>
  );
}
