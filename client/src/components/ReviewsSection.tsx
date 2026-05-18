import { useState } from "react";
import { Star, MessageSquare, Quote, Send, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useApprovedReviews, useCreateReview } from "@/hooks/use-reviews";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function ReviewsSection() {
  const { user } = useAuth();
  const { data: reviews, isLoading: isLoadingReviews } = useApprovedReviews();
  const createReview = useCreateReview();
  
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [hoverRating, setHoverRating] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    
    createReview.mutate({ rating, comment }, {
      onSuccess: () => {
        setComment("");
        setRating(5);
      }
    });
  };

  return (
    <section className="py-24 bg-[#eae4da] overflow-hidden border-t border-[#809ba6]/10">
      <div className="container px-4 mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            <span className="text-[#c65f54] font-bold tracking-wider text-sm uppercase">Depoimentos</span>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-[#163b52] mt-2 mb-4 leading-tight">
              O que nossos clientes dizem
            </h2>
            <p className="text-slate-600 text-lg font-light leading-relaxed">
              Sua tranquilidade é nossa maior prioridade. Veja as experiências reais de quem já conta com a nossa consultoria boutique.
            </p>
          </div>
          
          {!user && (
            <Button variant="outline" className="rounded-full border-[#809ba6]/30 text-[#163b52] hover:bg-[#f5f2eb]/50 bg-white" asChild>
              <a href="/login" className="font-bold">Deixe sua Avaliação</a>
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Reviews List */}
          <div className="lg:col-span-2 space-y-6">
            {isLoadingReviews ? (
              <div className="flex justify-center py-20 bg-white rounded-[2rem] border border-slate-100">
                <Loader2 className="w-8 h-8 animate-spin text-[#08454c]" />
              </div>
            ) : reviews && reviews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence>
                  {reviews.map((review, index) => (
                    <motion.div
                      key={review.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.08 }}
                      className="h-full"
                    >
                      <Card className="border border-slate-100/50 shadow-[0_8px_30px_rgba(8,69,76,0.025)] bg-white hover:shadow-[0_20px_50px_rgba(8,69,76,0.065)] hover:-translate-y-1 transition-all duration-500 rounded-[2rem] h-full overflow-hidden">
                        <CardContent className="p-8 flex flex-col justify-between h-full">
                          <div>
                            <div className="flex gap-1 mb-6">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4.5 h-4.5 ${
                                    i < review.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"
                                  }`}
                                />
                              ))}
                            </div>
                            
                            <Quote className="w-8 h-8 text-[#c65f54]/10 mb-4" />
                            <p className="text-slate-600 italic font-light leading-relaxed flex-grow mb-8 text-sm">
                              "{review.comment}"
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-3 pt-6 border-t border-slate-50 mt-auto">
                            <div className="w-10 h-10 rounded-2xl bg-[#08454c]/5 border border-[#08454c]/10 flex items-center justify-center text-[#08454c] font-bold text-sm">
                              {review.userId ? String(review.userId).slice(0, 1).toUpperCase() : "C"}
                            </div>
                            <div className="text-xs">
                              <p className="font-bold text-[#163b52]">Cliente Verificado</p>
                              <p className="text-slate-400">
                                {review.createdAt && format(new Date(review.createdAt), "MMMM 'de' yyyy", { locale: ptBR })}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="bg-white rounded-[2rem] p-16 text-center border border-slate-100 shadow-[0_8px_30px_rgba(8,69,76,0.02)]">
                <MessageSquare className="w-12 h-12 text-[#809ba6]/30 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">Nenhuma avaliação publicada até o momento. Seja o primeiro a avaliar!</p>
              </div>
            )}
          </div>

          {/* Submission Form */}
          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-[0_12px_40px_rgba(8,69,76,0.035)] sticky top-28">
              {user ? (
                <>
                  <h3 className="text-xl font-display font-bold text-[#163b52] mb-6 flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                    Deixe sua avaliação
                  </h3>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                        Sua nota
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            className="transition-transform active:scale-90"
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
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                        Seu comentário
                      </label>
                      <Textarea
                        placeholder="Conte-nos como foi sua experiência com nossos serviços..."
                        className="resize-none min-h-[130px] bg-slate-50/50 border border-slate-100 focus:border-[#08454c] focus:ring-[#08454c] rounded-2xl p-4 text-sm leading-relaxed"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        required
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full h-13 rounded-2xl bg-[#c65f54] text-white hover:bg-[#c65f54]/95 hover:shadow-lg hover:shadow-[#c65f54]/25 transition-all duration-300 font-bold"
                      disabled={createReview.isPending}
                    >
                      {createReview.isPending ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Enviar Avaliação
                        </>
                      )}
                    </Button>
                    
                    <p className="text-[11px] text-center text-slate-400 italic">
                      Sua avaliação passará por moderação antes de ser veiculada publicamente.
                    </p>
                  </form>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-[#08454c]/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Star className="w-8 h-8 text-[#08454c]/40" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-[#163b52] mb-3">Compartilhe sua opinião</h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-8 font-light">
                    Faça login na sua conta para avaliar nossos serviços e contribuir para a nossa comunidade.
                  </p>
                  <Button className="w-full h-13 rounded-2xl bg-[#08454c] text-white hover:bg-[#08454c]/95 font-bold shadow-md shadow-[#08454c]/10" asChild>
                    <a href="/login">Acessar Minha Conta</a>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
