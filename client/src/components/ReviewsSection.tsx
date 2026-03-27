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
    <section className="py-24 bg-slate-50 overflow-hidden">
      <div className="container px-4 mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mb-4">
              O que nossos clientes dizem
            </h2>
            <p className="text-slate-600 text-lg">
              Sua tranquilidade é nossa maior prioridade. Veja as experiências de quem já conta com a Monteiro Corretora.
            </p>
          </div>
          
          {!user && (
            <Button variant="outline" className="rounded-full border-slate-200" asChild>
              <a href="/login">Entre para avaliar</a>
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Reviews List */}
          <div className="lg:col-span-2 space-y-6">
            {isLoadingReviews ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow h-full">
                        <CardContent className="p-8 flex flex-col h-full">
                          <div className="flex gap-1 mb-4">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"
                                }`}
                              />
                            ))}
                          </div>
                          
                          <Quote className="w-8 h-8 text-primary/10 mb-2" />
                          <p className="text-slate-700 italic flex-grow mb-6">
                            "{review.comment}"
                          </p>
                          
                          <div className="flex items-center gap-3 pt-6 border-t border-slate-50">
                            <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary font-bold">
                              {/* If we had the user's name in the review response, we'd use it here */}
                              U
                            </div>
                            <div className="text-sm">
                              <p className="font-semibold text-slate-900">Cliente Verificado</p>
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
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
                <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-500">Ainda não há avaliações. Seja o primeiro a avaliar!</p>
              </div>
            )}
          </div>

          {/* Submission Form */}
          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 sticky top-24">
              {user ? (
                <>
                  <h3 className="text-xl font-display font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                    Deixe sua avaliação
                  </h3>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-3">
                        Sua nota
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            className="transition-transform active:scale-95"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                          >
                            <Star
                              className={`w-8 h-8 transition-colors ${
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
                      <label className="block text-sm font-medium text-slate-700 mb-3">
                        Seu comentário
                      </label>
                      <Textarea
                        placeholder="Conte-nos como foi sua experiência..."
                        className="resize-none min-h-[120px] bg-slate-50 border-slate-100 focus:border-primary focus:ring-primary rounded-xl"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        required
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full h-12 rounded-xl text-lg font-medium transition-all hover:shadow-lg"
                      disabled={createReview.isPending}
                    >
                      {createReview.isPending ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          Enviar Avaliação
                        </>
                      )}
                    </Button>
                    
                    <p className="text-xs text-center text-slate-400 italic">
                      Sua avaliação será enviada para moderação antes de ser publicada.
                    </p>
                  </form>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Star className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-slate-900 mb-2">Compartilhe sua opinião</h3>
                  <p className="text-slate-500 mb-8">
                    Faça login para poder avaliar nossos serviços e ajudar outras pessoas.
                  </p>
                  <Button className="w-full rounded-xl" asChild>
                    <a href="/login">Fazer Login</a>
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
