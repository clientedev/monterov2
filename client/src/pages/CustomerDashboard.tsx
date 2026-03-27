import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Inquiry } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Loader2, MessageSquare, History, Sparkles, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteMessage, setQuoteMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: inquiries, isLoading } = useQuery<Inquiry[]>({
    queryKey: ["/api/my-inquiries"],
  });

  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteMessage.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/inquiries", {
        name: user?.name || "Cliente Logado",
        email: user?.username || "", // Using username as fallback email
        phone: "", // Will use existing info if available
        message: quoteMessage,
      });

      toast({
        title: "Solicitação enviada!",
        description: "Nossa equipe entrará em contato em breve.",
      });
      setShowQuoteModal(false);
      setQuoteMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/my-inquiries"] });
    } catch (error: any) {
      toast({
        title: "Erro ao enviar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pt-24">
      <Navbar />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Welcome Header */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5">
                <Sparkles className="h-24 w-24 text-amber-600" />
             </div>
             <div className="relative z-10">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                  Olá, <span className="text-amber-600">{user?.name}</span>!
                </h1>
                <p className="text-slate-500 mt-2 max-w-2xl">
                  Bem-vindo à sua área exclusiva. Aqui você pode acompanhar suas solicitações, 
                  tirar dúvidas com nossa assistente virtual e gerenciar seu perfil.
                </p>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <div className="md:col-span-1 space-y-6">
              <Card className="border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-900 text-white border-b-0">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    Assistente Virtual
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                    Precisa de ajuda rápida? Nossa IA "Carol" está pronta para responder suas dúvidas sobre seguros e nossos serviços agora mesmo.
                  </p>
                  <Button 
                    className="w-full justify-between font-bold h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-xl"
                    onClick={() => {
                        window.dispatchEvent(new CustomEvent('open-carol-chat'));
                    }}
                  >
                    Falar com a Carol
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm">
                 <CardContent className="pt-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center">
                            <MessageSquare className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-900">Blog e Dicas</p>
                            <p className="text-xs text-slate-500">Leia as últimas novidades</p>
                        </div>
                    </div>
                    <Link href="/blog">
                        <Button variant="outline" className="w-full font-bold border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl">
                            Ver o Blog
                        </Button>
                    </Link>
                 </CardContent>
              </Card>
            </div>

            {/* Inquiries History */}
            <div className="md:col-span-2">
              <Card className="border-slate-200 shadow-sm min-h-[400px]">
                <CardHeader className="border-b border-slate-100 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <History className="h-5 w-5 text-amber-600" />
                            Histórico de Cotações
                        </CardTitle>
                        <CardDescription>Acompanhe suas últimas solicitações de serviço</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
                    </div>
                  ) : !inquiries || inquiries.length === 0 ? (
                    <div className="text-center py-12">
                       <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <History className="h-8 w-8 text-slate-400" />
                       </div>
                       <h3 className="text-lg font-bold text-slate-900">Nenhuma cotação encontrada</h3>
                       <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">
                         Você ainda não realizou nenhuma solicitação de cotação pelo site.
                       </p>
                       <Link href="/services">
                       <Button 
                        className="mt-6 font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl"
                        onClick={() => setShowQuoteModal(true)}
                       >
                         Fazer minha primeira cotação
                       </Button>
                       </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {inquiries.map((inquiry) => (
                        <div 
                          key={inquiry.id} 
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white transition-colors group"
                        >
                          <div className="space-y-1">
                            <p className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                              Solicitação #{inquiry.id}
                            </p>
                            <p className="text-xs text-slate-500">
                              {inquiry.createdAt ? format(new Date(inquiry.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : '-'}
                            </p>
                          </div>
                          <div className="mt-2 sm:mt-0 text-right">
                             <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                Em análise
                             </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Quick Quote Modal */}
      <Dialog open={showQuoteModal} onOpenChange={setShowQuoteModal}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-900">O que você precisa?</DialogTitle>
            <DialogDescription className="text-slate-500">
              Descreva brevemente o seguro ou plano de saúde que você busca. Nossa equipe entrará em contato para apresentar as melhores opções.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleQuoteSubmit} className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label htmlFor="message" className="text-sm font-bold text-slate-700">Detalhes da solicitação</Label>
              <Textarea
                id="message"
                placeholder="Ex: Gostaria de uma cotação para seguro de vida individual e plano de saúde empresarial para 5 vidas..."
                className="min-h-[150px] rounded-xl border-slate-200 focus:ring-amber-500"
                value={quoteMessage}
                onChange={(e) => setQuoteMessage(e.target.value)}
                required
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setShowQuoteModal(false)}
                className="font-bold text-slate-500 rounded-xl"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-8 rounded-xl"
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Enviar Solicitação"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
