import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Inquiry } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  Loader2, MessageSquare, History, Sparkles, ArrowRight,
  FileText, Download, ExternalLink, ShieldCheck, AlertCircle,
  FileArchive, CalendarDays, Clock
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

interface ContactFile {
  id: number;
  contactId: number;
  fileName: string;
  fileUrl: string;
  fileType: string | null;
  fileSize: string | null;
  createdAt: string | null;
}

interface MyApolice {
  id: number;
  numeroApolice: string | null;
  status: string;
  inicioVigencia: string | null;
  fimVigencia: string | null;
  premio: string | null;
  pdfApolice: string | null;
  linkFatura: string | null;
  cobertura: string | null;
  observacoes: string | null;
  produtoNome: string | null;
  seguradoraNome: string | null;
}

const statusColors: Record<string, string> = {
  ativa: "bg-emerald-100 text-emerald-800 border-emerald-200",
  vencida: "bg-slate-100 text-slate-600 border-slate-200",
  cancelada: "bg-red-100 text-red-700 border-red-200",
  pendente: "bg-amber-100 text-amber-800 border-amber-200",
  em_atraso: "bg-orange-100 text-orange-800 border-orange-200",
};

const statusLabels: Record<string, string> = {
  ativa: "Ativa",
  vencida: "Vencida",
  cancelada: "Cancelada",
  pendente: "Pendente",
  em_atraso: "Em Atraso",
};

function fileIcon(fileType: string | null) {
  if (!fileType) return <FileText className="h-5 w-5 text-slate-400" />;
  if (fileType.includes("pdf")) return <FileText className="h-5 w-5 text-red-500" />;
  if (fileType.includes("image")) return <FileText className="h-5 w-5 text-blue-500" />;
  if (fileType.includes("zip") || fileType.includes("rar")) return <FileArchive className="h-5 w-5 text-purple-500" />;
  return <FileText className="h-5 w-5 text-slate-400" />;
}

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteMessage, setQuoteMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: inquiries, isLoading: loadingInquiries } = useQuery<Inquiry[]>({
    queryKey: ["/api/my-inquiries"],
  });

  const { data: myFiles, isLoading: loadingFiles } = useQuery<ContactFile[]>({
    queryKey: ["/api/my-files"],
  });

  const { data: myApolices, isLoading: loadingApolices } = useQuery<MyApolice[]>({
    queryKey: ["/api/my-apolices"],
  });

  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteMessage.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const form = e.currentTarget as HTMLFormElement;
      const phone = (form.elements.namedItem("phone") as HTMLInputElement)?.value || "";

      await apiRequest("POST", "/api/inquiries", {
        name: user?.name || user?.username || "Cliente Logado",
        email: user?.username || "",
        phone: phone,
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
                Bem-vindo à sua área exclusiva. Aqui você pode acompanhar suas apólices,
                documentos, histórico de cotações e muito mais.
              </p>
            </div>
          </div>

          {/* Top Row: Quick Actions + Apólices */}
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
                    Precisa de ajuda rápida? Nossa IA "Carolzinha" está pronta para responder suas dúvidas sobre seguros e nossos serviços agora mesmo.
                  </p>
                  <Button
                    className="w-full justify-between font-bold h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-xl"
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('open-carol-chat'));
                    }}
                  >
                    Falar com a Carolzinha
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

            {/* Apólices */}
            <div className="md:col-span-2">
              <Card className="border-slate-200 shadow-sm min-h-[300px]">
                <CardHeader className="border-b border-slate-100 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-emerald-600" />
                        Minhas Apólices
                      </CardTitle>
                      <CardDescription>Suas apólices de seguro ativas e anteriores</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {loadingApolices ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                    </div>
                  ) : !myApolices || myApolices.length === 0 ? (
                    <div className="text-center py-10">
                      <div className="h-14 w-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <ShieldCheck className="h-7 w-7 text-slate-400" />
                      </div>
                      <h3 className="text-base font-bold text-slate-700">Nenhuma apólice encontrada</h3>
                      <p className="text-slate-500 text-sm mt-1">
                        Suas apólices aparecerão aqui quando forem cadastradas pela nossa equipe.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {myApolices.map((ap) => (
                        <div
                          key={ap.id}
                          className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:shadow-sm transition-all group"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-bold text-slate-900 text-sm">
                                  {ap.produtoNome || "Apólice"} {ap.numeroApolice ? `· Nº ${ap.numeroApolice}` : ""}
                                </p>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${statusColors[ap.status] || "bg-slate-100 text-slate-600"}`}>
                                  {statusLabels[ap.status] || ap.status}
                                </span>
                              </div>
                              {ap.seguradoraNome && (
                                <p className="text-xs text-slate-500 mt-0.5">{ap.seguradoraNome}</p>
                              )}
                              {(ap.inicioVigencia || ap.fimVigencia) && (
                                <div className="flex items-center gap-1 mt-1.5 text-xs text-slate-500">
                                  <CalendarDays className="h-3.5 w-3.5" />
                                  <span>
                                    {ap.inicioVigencia ? format(new Date(ap.inicioVigencia), "dd/MM/yyyy") : "?"}
                                    {" → "}
                                    {ap.fimVigencia ? format(new Date(ap.fimVigencia), "dd/MM/yyyy") : "?"}
                                  </span>
                                </div>
                              )}
                              {ap.premio && (
                                <p className="text-xs text-slate-600 mt-1 font-medium">Prêmio: {ap.premio}</p>
                              )}
                            </div>
                            <div className="flex gap-2 shrink-0">
                              {ap.pdfApolice && (
                                <a
                                  href={ap.pdfApolice}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-bold hover:bg-red-100 transition-colors border border-red-200"
                                >
                                  <Download className="h-3.5 w-3.5" /> PDF
                                </a>
                              )}
                              {ap.linkFatura && (
                                <a
                                  href={ap.linkFatura}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold hover:bg-amber-100 transition-colors border border-amber-200"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" /> Fatura
                                </a>
                              )}
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

          {/* Documentos e Cotações Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Documentos */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="text-xl flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Documentos e Anexos
                </CardTitle>
                <CardDescription>Arquivos enviados pela nossa equipe para você</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {loadingFiles ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : !myFiles || myFiles.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="h-14 w-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <FileText className="h-7 w-7 text-slate-400" />
                    </div>
                    <h3 className="text-base font-bold text-slate-700">Nenhum documento disponível</h3>
                    <p className="text-slate-500 text-sm mt-1">
                      Documentos enviados pela equipe aparecerão aqui.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {myFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:shadow-sm transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-9 w-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                            {fileIcon(file.fileType)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate max-w-[200px]">
                              {file.fileName}
                            </p>
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                              {file.fileSize && <span>{file.fileSize}</span>}
                              {file.fileSize && file.createdAt && <span>·</span>}
                              {file.createdAt && (
                                <span className="flex items-center gap-0.5">
                                  <Clock className="h-3 w-3" />
                                  {format(new Date(file.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <a
                          href={file.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 transition-colors border border-blue-200 shrink-0"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Baixar
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Histórico de Cotações */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="text-xl flex items-center gap-2">
                  <History className="h-5 w-5 text-amber-600" />
                  Histórico de Cotações
                </CardTitle>
                <CardDescription>Acompanhe suas últimas solicitações</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {loadingInquiries ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
                  </div>
                ) : !inquiries || inquiries.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="h-14 w-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <History className="h-7 w-7 text-slate-400" />
                    </div>
                    <h3 className="text-base font-bold text-slate-700">Nenhuma cotação encontrada</h3>
                    <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">
                      Você ainda não realizou nenhuma solicitação de cotação pelo site.
                    </p>
                    <Button
                      className="mt-5 font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl"
                      onClick={() => setShowQuoteModal(true)}
                    >
                      Fazer minha primeira cotação
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
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
                        <div className="mt-2 sm:mt-0">
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
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-bold text-slate-700">Seu Telefone / WhatsApp</Label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="(11) 99999-9999"
                  className="rounded-xl border-slate-200 focus:ring-amber-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message" className="text-sm font-bold text-slate-700">Detalhes da solicitação</Label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="Ex: Gostaria de uma cotação para seguro de vida individual e plano de saúde empresarial para 5 vidas..."
                  className="min-h-[120px] rounded-xl border-slate-200 focus:ring-amber-500"
                  value={quoteMessage}
                  onChange={(e) => setQuoteMessage(e.target.value)}
                  required
                />
              </div>
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
