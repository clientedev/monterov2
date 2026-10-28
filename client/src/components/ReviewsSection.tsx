import { useState } from "react";
import { 
  Star, 
  MessageSquare, 
  Quote, 
  Send, 
  Loader2, 
  ExternalLink, 
  CheckCircle2, 
  Sparkles, 
  Copy, 
  Check, 
  HeartHandshake,
  Filter
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useApprovedReviews, useCreateReview } from "@/hooks/use-reviews";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function GoogleIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}

// Fallback Google reviews if none loaded yet from backend
const DEFAULT_GOOGLE_REVIEWS = [
  {
    id: 9001,
    authorName: "Margareth Cardoso da Silva",
    authorPhoto: "https://lh3.googleusercontent.com/a-/ALV-UjWn-oGfZ4Hydyt0aR4pK7DDNKpR6kmfxKubzVN8kdTO5lraVjuX9w=s128-c0x00000000-cc-rp-mo-ba2",
    authorTitle: "Avaliação verificada no Google",
    rating: 5,
    comment: "Recentemente contratei meu seguro viagem com a Monteiro Corretora de Seguros e Planos de Saúde, e preciso destacar o atendimento incrível da Carol. Desde o primeiro contato, a Carol foi extremamente atenciosa, paciente e clara nas explicações. O que mais me marcou foi a forma humanizada como fui atendida. Não foi apenas uma contratação, foi um cuidado. Super recomendo! 🌍✨",
    source: "google",
    relativeTime: "6 meses atrás",
    isFeatured: true,
    isApproved: true,
    googleReviewUrl: "https://g.page/r/CfNsrw-dt3q3EAE/review",
    createdAt: new Date("2026-04-08")
  },
  {
    id: 9002,
    authorName: "Magda Cristiane Tomazinho",
    authorPhoto: "https://lh3.googleusercontent.com/a-/ALV-UjXZip4XCHTb-vF20irxg8izK0aFZY6KjgRhUNM3HJ7Cy9P2s2HQig=s128-c0x00000000-cc-rp-mo",
    authorTitle: "Avaliação verificada no Google",
    rating: 5,
    comment: "Quero deixar meu reconhecimento e agradecimento a essa corretora simplesmente sensacional! Uma profissional extremamente parceira, correta e transparente em todos os momentos. Sempre atenciosa, prestativa e comprometida em oferecer o melhor atendimento, transmitindo segurança e confiança em cada etapa do processo. Recomendo de olhos fechados!",
    source: "google",
    relativeTime: "6 meses atrás",
    isFeatured: true,
    isApproved: true,
    googleReviewUrl: "https://g.page/r/CfNsrw-dt3q3EAE/review",
    createdAt: new Date("2026-04-08")
  },
  {
    id: 9003,
    authorName: "Glenda Ramos",
    authorPhoto: "https://lh3.googleusercontent.com/a/ACg8ocLTvFOZGplwH3kUDJgs8dmCm7-HcDw4lOBj6UEoLTxGQI41Kw=s128-c0x00000000-cc-rp-mo-ba2",
    authorTitle: "Avaliação verificada no Google",
    rating: 5,
    comment: "Excelente assistência sobre contratar o melhor produto de plano de saúde e seguro de vida. A Carolina Monteiro fez todo um estudo sobre qual a melhor operadora de saúde, e me indicou o melhor seguro de vida pra que eu não passe por situações desafiadoras no futuro. Recomendo pra todos os amigos e parceiros de negócios!",
    source: "google",
    relativeTime: "6 meses atrás",
    isFeatured: true,
    isApproved: true,
    googleReviewUrl: "https://g.page/r/CfNsrw-dt3q3EAE/review",
    createdAt: new Date("2026-04-07")
  },
  {
    id: 9004,
    authorName: "Marcos Monteiro",
    authorPhoto: "https://lh3.googleusercontent.com/a/ACg8ocKj4W2-Wg0oBeRbnOloVIC_wOac_hf7XhPiMDD_sJwSOrnkiA=s128-c0x00000000-cc-rp-mo",
    authorTitle: "Avaliação verificada no Google",
    rating: 5,
    comment: "Competência e experiência são alguns dos predicados que fazem desta corretora ter chegado até aqui, superando concorrentes com excelência nos serviços prestados. Parabéns Carol, são mais de 10 anos de superação, resiliência e conquistas merecidas!",
    source: "google",
    relativeTime: "6 meses atrás",
    isFeatured: false,
    isApproved: true,
    googleReviewUrl: "https://g.page/r/CfNsrw-dt3q3EAE/review",
    createdAt: new Date("2026-04-08")
  }
];

export function ReviewsSection() {
  const { user } = useAuth();
  const { data: responseData, isLoading: isLoadingReviews } = useApprovedReviews();
  const createReview = useCreateReview();
  
  const googleReviewUrl = responseData?.googleReviewUrl || "https://g.page/r/CfNsrw-dt3q3EAE/review";
  const googleRating = responseData?.googleRating || "5.0";
  const googleTotalReviews = responseData?.googleTotalReviews || 12;

  // Active reviews list (merge backend reviews with default Google reviews if list is empty)
  const rawReviews = responseData?.reviews && responseData.reviews.length > 0 
    ? responseData.reviews 
    : DEFAULT_GOOGLE_REVIEWS;

  const [activeFilter, setActiveFilter] = useState<"all" | "google" | "site">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<"form" | "success">("form");
  const [copied, setCopied] = useState(false);

  // Form State
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [authorName, setAuthorName] = useState(user?.username || "");
  const [authorTitle, setAuthorTitle] = useState("");
  const [comment, setComment] = useState("");

  const filteredReviews = rawReviews.filter((r) => {
    if (activeFilter === "google") return r.source === "google";
    if (activeFilter === "site") return r.source !== "google";
    return true;
  });

  const googleCount = rawReviews.filter((r) => r.source === "google").length;
  const siteCount = rawReviews.filter((r) => r.source !== "google").length;

  const handleOpenModal = () => {
    setRating(5);
    setComment("");
    setAuthorName(user?.username || "");
    setAuthorTitle("");
    setModalStep("form");
    setCopied(false);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    createReview.mutate(
      {
        rating,
        comment: comment.trim(),
        authorName: authorName.trim() || "Cliente",
        authorTitle: authorTitle.trim() || "Cliente Monteiro Seguros",
        source: "site",
      },
      {
        onSuccess: () => {
          setModalStep("success");
        },
      }
    );
  };

  const handleCopyAndOpenGoogle = () => {
    if (comment) {
      navigator.clipboard.writeText(comment);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
    window.open(googleReviewUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <section id="avaliacoes" className="py-24 bg-[#f8f6f0] overflow-hidden border-t border-[#809ba6]/15 relative">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#08454c]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 -right-32 w-96 h-96 bg-[#c65f54]/5 rounded-full blur-3xl" />
      </div>

      <div className="container px-4 mx-auto relative z-10">
        
        {/* Header & Google Trust Badge */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 gap-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 font-bold tracking-wider text-xs uppercase mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              Depoimentos & Avaliações Verificadas
            </div>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-[#163b52] leading-tight">
              O que nossos clientes dizem sobre a Monteiro
            </h2>
            <p className="text-slate-600 text-lg font-light leading-relaxed mt-3">
              Transparência, atendimento humanizado e segurança em cada contratação. Veja os relatos de quem confia na nossa assessoria.
            </p>
          </div>

          {/* Google Rating Hero Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-[0_10px_35px_rgba(8,69,76,0.06)] flex flex-col sm:flex-row items-center gap-6 lg:self-center">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-inner">
                <GoogleIcon className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-extrabold text-slate-900 leading-none">{googleRating}</span>
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
                <p className="text-xs font-semibold text-slate-700 mt-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Excelente no Google Reviews
                </p>
                <p className="text-[11px] text-slate-400 font-medium">
                  {googleTotalReviews} avaliações reais de clientes
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
              <Button
                asChild
                className="bg-[#08454c] hover:bg-[#08454c]/90 text-white rounded-2xl font-bold px-5 h-12 shadow-sm transition-all hover:shadow-md"
              >
                <a href={googleReviewUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                  <GoogleIcon className="w-4 h-4" />
                  <span>Avaliar no Google</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-0.5 opacity-80" />
                </a>
              </Button>

              <Button
                onClick={handleOpenModal}
                variant="outline"
                className="rounded-2xl border-slate-200 text-[#163b52] hover:bg-slate-50 font-bold px-4 h-12"
              >
                <MessageSquare className="w-4 h-4 mr-2 text-[#c65f54]" />
                Avaliar pelo Site
              </Button>
            </div>
          </div>
        </div>

        {/* Filter Navigation Chips */}
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-4 mb-10 overflow-x-auto gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-2 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filtrar:
            </span>
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                activeFilter === "all"
                  ? "bg-[#163b52] text-white shadow-sm shadow-[#163b52]/20"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60"
              }`}
            >
              Todas ({rawReviews.length})
            </button>
            <button
              onClick={() => setActiveFilter("google")}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeFilter === "google"
                  ? "bg-[#4285F4] text-white shadow-sm shadow-[#4285F4]/20"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60"
              }`}
            >
              <GoogleIcon className="w-3.5 h-3.5" />
              Google Reviews ({googleCount})
            </button>
            <button
              onClick={() => setActiveFilter("site")}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                activeFilter === "site"
                  ? "bg-[#08454c] text-white shadow-sm shadow-[#08454c]/20"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60"
              }`}
            >
              Depoimentos no Site ({siteCount})
            </button>
          </div>

          <a
            href={googleReviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-[#08454c] hover:text-[#c65f54] transition-colors flex items-center gap-1 whitespace-nowrap"
          >
            <span>Ver perfil no Google Meu Negócio</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Reviews Cards Grid */}
        {isLoadingReviews ? (
          <div className="flex justify-center items-center py-24 bg-white rounded-3xl border border-slate-100">
            <Loader2 className="w-8 h-8 animate-spin text-[#08454c]" />
          </div>
        ) : filteredReviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredReviews.map((review, index) => {
                const isGoogle = review.source === "google";
                return (
                  <motion.div
                    key={review.id || index}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="h-full"
                  >
                    <Card className="border border-slate-200/70 shadow-[0_4px_20px_rgba(8,69,76,0.03)] bg-white hover:shadow-[0_16px_36px_rgba(8,69,76,0.08)] hover:-translate-y-1 transition-all duration-300 rounded-[1.75rem] h-full flex flex-col overflow-hidden relative group">
                      
                      {/* Top Bar / Origin Tag */}
                      <div className="px-7 pt-6 pb-2 flex items-center justify-between border-b border-slate-50">
                        {isGoogle ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100/60 text-[#1a73e8] text-[11px] font-bold">
                            <GoogleIcon className="w-3.5 h-3.5" />
                            <span>Avaliação Google</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100/60 text-emerald-700 text-[11px] font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Depoimento Verificado</span>
                          </div>
                        )}

                        <span className="text-[11px] text-slate-400 font-medium">
                          {review.relativeTime || (review.createdAt && format(new Date(review.createdAt), "MMM 'de' yyyy", { locale: ptBR }))}
                        </span>
                      </div>

                      <CardContent className="p-7 flex flex-col justify-between flex-grow">
                        <div>
                          {/* Stars */}
                          <div className="flex items-center gap-1 mb-4">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < (review.rating || 5)
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-slate-200"
                                }`}
                              />
                            ))}
                          </div>

                          {/* Comment Body */}
                          <div className="relative mb-6">
                            <Quote className="w-6 h-6 text-[#c65f54]/15 mb-2 -ml-1" />
                            <p className="text-slate-600 text-sm font-normal leading-relaxed italic line-clamp-6">
                              "{review.comment}"
                            </p>
                          </div>
                        </div>

                        {/* Author Profile */}
                        <div className="pt-4 border-t border-slate-100 mt-auto flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {review.authorPhoto ? (
                              <img
                                src={review.authorPhoto}
                                alt={review.authorName || "Autor"}
                                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm flex-shrink-0"
                                onError={(e) => {
                                  // Fallback to initial
                                  (e.target as HTMLElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-[#08454c]/10 text-[#08454c] font-bold text-sm flex items-center justify-center flex-shrink-0 border border-[#08454c]/15">
                                {(review.authorName || "C").slice(0, 1).toUpperCase()}
                              </div>
                            )}

                            <div className="min-w-0">
                              <h4 className="font-bold text-sm text-[#163b52] truncate">
                                {review.authorName || "Cliente"}
                              </h4>
                              <p className="text-[11px] text-slate-400 truncate">
                                {review.authorTitle || (isGoogle ? "Avaliação no Google Maps" : "Cliente Monteiro")}
                              </p>
                            </div>
                          </div>

                          {isGoogle && review.googleReviewUrl && (
                            <a
                              href={review.googleReviewUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Ver avaliação no Google"
                              className="text-slate-400 hover:text-[#4285F4] transition-colors p-1.5 rounded-lg hover:bg-slate-50 flex-shrink-0"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-200/80 shadow-sm">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-700 mb-2">Nenhuma avaliação encontrada nesta categoria</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
              Seja o primeiro a compartilhar sua experiência conosco!
            </p>
            <Button onClick={handleOpenModal} className="bg-[#08454c] text-white rounded-2xl font-bold">
              Deixar Avaliação Agora
            </Button>
          </div>
        )}

        {/* Bottom CTA Banner */}
        <div className="mt-16 bg-gradient-to-r from-[#08454c] to-[#163b52] rounded-3xl p-8 md:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl text-center md:text-left">
            <span className="text-[#c65f54] bg-white/10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Sua opinião importa muito
            </span>
            <h3 className="text-2xl md:text-3xl font-display font-bold mt-3 mb-2">
              Já é nosso cliente ou parceiro?
            </h3>
            <p className="text-white/80 text-sm md:text-base font-light">
              Conte como foi o atendimento da equipe Monteiro. Sua avaliação fortalece nosso trabalho e ajuda novas famílias e empresas a se protegerem com segurança.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Button
              asChild
              className="bg-white text-[#163b52] hover:bg-slate-100 rounded-2xl font-bold px-6 h-13 shadow-md text-sm"
            >
              <a href={googleReviewUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                <GoogleIcon className="w-4 h-4" />
                <span>Avaliar no Google Meu Negócio</span>
                <ExternalLink className="w-4 h-4 ml-1" />
              </a>
            </Button>

            <Button
              onClick={handleOpenModal}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 rounded-2xl font-bold px-6 h-13 text-sm bg-transparent"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Deixar Depoimento no Site
            </Button>
          </div>
        </div>
      </div>

      {/* Review Submission Modal Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden rounded-3xl bg-white border-0 shadow-2xl">
          {modalStep === "form" ? (
            <div className="p-8">
              <DialogHeader className="mb-6">
                <div className="inline-flex items-center gap-2 text-[#c65f54] text-xs font-bold uppercase tracking-wider mb-1">
                  <Star className="w-4 h-4 fill-[#c65f54]" />
                  Compartilhe sua Experiência
                </div>
                <DialogTitle className="text-2xl font-display font-bold text-[#163b52]">
                  Avaliar Monteiro Seguros
                </DialogTitle>
                <DialogDescription className="text-slate-500 text-sm">
                  Seu feedback é fundamental para continuarmos entregando o melhor atendimento consultivo.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Star rating selector */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Sua nota para o nosso atendimento:
                  </label>
                  <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className="transition-transform active:scale-90 hover:scale-110 p-1"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                      >
                        <Star
                          className={`w-8 h-8 transition-colors duration-200 ${
                            (hoverRating || rating) >= star
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-200"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-auto text-sm font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-xl">
                      {hoverRating || rating} de 5 estrelas
                    </span>
                  </div>
                </div>

                {/* Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Seu Nome *
                    </label>
                    <Input
                      placeholder="Ex: Carlos Oliveira"
                      className="rounded-xl h-11 border-slate-200 focus:border-[#08454c] text-sm"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Empresa ou Cidade (Opcional)
                    </label>
                    <Input
                      placeholder="Ex: São Paulo - SP"
                      className="rounded-xl h-11 border-slate-200 focus:border-[#08454c] text-sm"
                      value={authorTitle}
                      onChange={(e) => setAuthorTitle(e.target.value)}
                    />
                  </div>
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Seu depoimento / avaliação *
                  </label>
                  <Textarea
                    placeholder="Conte como foi sua experiência com a Carol e a equipe Monteiro Seguros..."
                    className="resize-none min-h-[120px] rounded-xl border-slate-200 focus:border-[#08454c] text-sm p-3.5 leading-relaxed"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    required
                  />
                </div>

                <div className="pt-2 flex flex-col gap-3">
                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl bg-[#08454c] text-white hover:bg-[#08454c]/90 font-bold shadow-md transition-all"
                    disabled={createReview.isPending}
                  >
                    {createReview.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Registrando...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Enviar Depoimento
                      </>
                    )}
                  </Button>

                  <p className="text-[11px] text-center text-slate-400">
                    Após o envio, você também terá a opção de espelhar sua avaliação diretamente no Google com 1 clique.
                  </p>
                </div>
              </form>
            </div>
          ) : (
            /* Success & Google Mirroring Prompt */
            <div className="p-8 text-center space-y-6">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100 shadow-sm animate-bounce">
                <HeartHandshake className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-2xl font-display font-bold text-[#163b52] mb-2">
                  Muito obrigado, {authorName || "Cliente"}!
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed max-w-md mx-auto">
                  Sua avaliação foi registrada com sucesso em nossa plataforma.
                </p>
              </div>

              {/* Callout to Mirror on Google */}
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5 text-left">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white border border-amber-100 flex items-center justify-center flex-shrink-0 shadow-xs">
                    <GoogleIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">
                      Gostaria de publicar também no Google?
                    </h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Leva menos de 10 segundos! Clique abaixo para copiar o texto do seu depoimento e abrir o formulário oficial do Google Maps.
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-amber-200/50 flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={handleCopyAndOpenGoogle}
                    className="flex-1 bg-[#4285F4] hover:bg-[#3367d6] text-white font-bold h-11 rounded-xl shadow-sm text-xs gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-200" />
                        Texto Copiado! Abrindo Google...
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copiar Texto e Avaliar no Google
                        <ExternalLink className="w-3.5 h-3.5" />
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="ghost"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl text-slate-500 hover:text-slate-800 text-xs font-semibold"
                >
                  Concluir e fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
