import { useState } from "react";
import { 
  useAdminReviews, 
  useApproveReview, 
  useDeleteReview, 
  useToggleFeatureReview, 
  useSyncGoogleReviews, 
  useAdminCreateReview 
} from "@/hooks/use-reviews";
import { 
  Star, 
  Check, 
  Trash2, 
  Loader2, 
  MessageSquare, 
  RefreshCw, 
  ExternalLink, 
  Plus, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  Search,
  Filter,
  Eye,
  SlidersHorizontal,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function GoogleIcon({ className = "w-4 h-4" }: { className?: string }) {
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

export default function ReviewsPage() {
  const { data: adminData, isLoading } = useAdminReviews();
  const approveMutation = useApproveReview();
  const deleteMutation = useDeleteReview();
  const toggleFeatureMutation = useToggleFeatureReview();
  const syncGoogleMutation = useSyncGoogleReviews();
  const createReviewMutation = useAdminCreateReview();

  const reviews = adminData?.reviews || [];
  const settings = adminData?.settings || {
    googleReviewUrl: "https://g.page/r/CfNsrw-dt3q3EAE/review",
    googleRating: "5.0",
    googleTotalReviews: 12,
    googlePlaceId: "ChIJq6oGRjhfzpQR82yvD523erc",
    autoApproveReviews: false,
  };

  const [activeTab, setActiveTab] = useState<"all" | "pending" | "approved" | "google">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedReviewText, setSelectedReviewText] = useState<{ author: string; text: string } | null>(null);

  // New review form state
  const [newName, setNewName] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [newSource, setNewSource] = useState<"site" | "google" | "whatsapp">("google");

  const pendingReviews = reviews.filter((r) => !r.isApproved);
  const approvedReviews = reviews.filter((r) => r.isApproved);
  const googleReviews = reviews.filter((r) => r.source === "google");

  const filteredReviews = reviews.filter((r) => {
    if (activeTab === "pending" && r.isApproved) return false;
    if (activeTab === "approved" && !r.isApproved) return false;
    if (activeTab === "google" && r.source !== "google") return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = r.authorName?.toLowerCase().includes(q) || false;
      const matchComment = r.comment.toLowerCase().includes(q);
      const matchTitle = r.authorTitle?.toLowerCase().includes(q) || false;
      return matchName || matchComment || matchTitle;
    }
    return true;
  });

  const handleSyncGoogle = () => {
    syncGoogleMutation.mutate(settings.googlePlaceId);
  };

  const handleCreateReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !newName.trim()) return;

    createReviewMutation.mutate(
      {
        authorName: newName.trim(),
        authorTitle: newTitle.trim() || (newSource === "google" ? "Avaliação no Google" : "Cliente Verificado"),
        rating: newRating,
        comment: newComment.trim(),
        source: newSource,
        isApproved: true,
        isFeatured: newRating >= 5,
        relativeTime: "Recente",
        googleReviewUrl: settings.googleReviewUrl,
      },
      {
        onSuccess: () => {
          setIsAddModalOpen(false);
          setNewName("");
          setNewTitle("");
          setNewRating(5);
          setNewComment("");
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#08454c]" />
        <p className="text-slate-500 font-medium text-sm">Carregando painel de avaliações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 flex items-center gap-3">
            <Star className="w-8 h-8 text-amber-500 fill-amber-500" />
            Controle de Avaliações & Google Reviews
          </h1>
          <p className="text-slate-600 mt-1">
            Gerencie, modere e espelhe as avaliações do Google Meu Negócio e do site em tempo real
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleSyncGoogle}
            disabled={syncGoogleMutation.isPending}
            className="bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-xl font-bold shadow-sm flex items-center gap-2"
          >
            {syncGoogleMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span>Sincronizar com Google</span>
          </Button>

          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#08454c] hover:bg-[#08454c]/90 text-white rounded-xl font-bold flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Avaliação</span>
          </Button>
        </div>
      </div>

      {/* Google Integration Banner Card */}
      <Card className="border border-blue-100 bg-gradient-to-r from-blue-50/50 via-white to-amber-50/30 shadow-xs rounded-2xl overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center flex-shrink-0">
                <GoogleIcon className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-lg">Perfil do Google Meu Negócio Integrado</h3>
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs">
                    Ativo & Conectado
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Place ID: <span className="font-mono text-slate-700">{settings.googlePlaceId}</span> • Nota Média:{" "}
                  <strong className="text-amber-600">{settings.googleRating} ★</strong> ({settings.googleTotalReviews}{" "}
                  avaliações)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full lg:w-auto">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold gap-2"
                asChild
              >
                <a href={settings.googleReviewUrl} target="_blank" rel="noopener noreferrer">
                  <span>Abrir Link de Avaliação</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </Button>

              <Button
                variant="secondary"
                size="sm"
                className="rounded-xl bg-blue-100/70 hover:bg-blue-100 text-blue-800 font-bold gap-1.5"
                onClick={handleSyncGoogle}
                disabled={syncGoogleMutation.isPending}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncGoogleMutation.isPending ? "animate-spin" : ""}`} />
                Atualizar Dados
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-100 shadow-xs rounded-2xl bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Geral</span>
            <MessageSquare className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{reviews.length}</div>
          <p className="text-[11px] text-slate-400 mt-1">Todas as avaliações no banco</p>
        </Card>

        <Card className="border-slate-100 shadow-xs rounded-2xl bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Google Reviews</span>
            <GoogleIcon className="w-4 h-4" />
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-600">{googleReviews.length}</div>
          <p className="text-[11px] text-slate-400 mt-1">Sincronizadas do Google Maps</p>
        </Card>

        <Card className="border-slate-100 shadow-xs rounded-2xl bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Aprovadas no Site</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">{approvedReviews.length}</div>
          <p className="text-[11px] text-slate-400 mt-1">Visíveis publicamente</p>
        </Card>

        <Card className="border-slate-100 shadow-xs rounded-2xl bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Aguardando Moderação</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600">{pendingReviews.length}</div>
          <p className="text-[11px] text-slate-400 mt-1">Pendentes de aprovação</p>
        </Card>
      </div>

      {/* Main Reviews Management Table */}
      <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden bg-white">
        <CardHeader className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold text-slate-900">Moderação de Avaliações</CardTitle>
            <CardDescription>
              Aprove, oculte, destaque no topo ou remova avaliações de clientes
            </CardDescription>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Buscar cliente ou texto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 rounded-xl text-xs border-slate-200"
              />
            </div>

            {/* Tab Filter Chips */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Todas ({reviews.length})
              </button>
              <button
                onClick={() => setActiveTab("pending")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "pending" ? "bg-white text-amber-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Pendentes ({pendingReviews.length})
              </button>
              <button
                onClick={() => setActiveTab("approved")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "approved" ? "bg-white text-emerald-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Aprovadas ({approvedReviews.length})
              </button>
              <button
                onClick={() => setActiveTab("google")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  activeTab === "google" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <GoogleIcon className="w-3 h-3" />
                Google ({googleReviews.length})
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/70">
                <TableHead className="pl-6 w-1/4">Autor & Origem</TableHead>
                <TableHead className="w-28">Nota</TableHead>
                <TableHead className="w-2/5">Depoimento</TableHead>
                <TableHead className="w-28 text-center">Status</TableHead>
                <TableHead className="w-24 text-center">Destaque</TableHead>
                <TableHead className="text-right pr-6">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReviews.length > 0 ? (
                filteredReviews.map((review) => {
                  const isGoogle = review.source === "google";
                  return (
                    <TableRow key={review.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Author & Origin */}
                      <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-3">
                          {review.authorPhoto ? (
                            <img
                              src={review.authorPhoto}
                              alt={review.authorName || "Cliente"}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200 flex-shrink-0"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-[#08454c]/10 text-[#08454c] font-bold text-xs flex items-center justify-center flex-shrink-0 border border-[#08454c]/15">
                              {(review.authorName || "C").slice(0, 1).toUpperCase()}
                            </div>
                          )}

                          <div className="min-w-0">
                            <p className="font-bold text-xs text-slate-900 truncate">
                              {review.authorName || "Cliente Anônimo"}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {isGoogle ? (
                                <Badge variant="outline" className="text-[10px] font-semibold text-blue-700 bg-blue-50 border-blue-200 px-1.5 py-0 flex items-center gap-1">
                                  <GoogleIcon className="w-2.5 h-2.5" /> Google
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] font-semibold text-slate-600 bg-slate-50 border-slate-200 px-1.5 py-0">
                                  Site
                                </Badge>
                              )}
                              <span className="text-[10px] text-slate-400">
                                {review.relativeTime || (review.createdAt && format(new Date(review.createdAt), "dd/MM/yyyy"))}
                              </span>
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Rating */}
                      <TableCell>
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < (review.rating || 5)
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-slate-200"
                              }`}
                            />
                          ))}
                        </div>
                      </TableCell>

                      {/* Comment */}
                      <TableCell>
                        <p
                          onClick={() => setSelectedReviewText({ author: review.authorName || "Cliente", text: review.comment })}
                          className="text-xs text-slate-600 line-clamp-2 italic cursor-pointer hover:text-slate-900"
                          title="Clique para ler completo"
                        >
                          "{review.comment}"
                        </p>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="text-center">
                        {review.isApproved ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
                            Publicado
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-bold animate-pulse">
                            Pendente
                          </Badge>
                        )}
                      </TableCell>

                      {/* Featured Toggle */}
                      <TableCell className="text-center">
                        <button
                          type="button"
                          onClick={() => toggleFeatureMutation.mutate(review.id)}
                          disabled={toggleFeatureMutation.isPending}
                          title={review.isFeatured ? "Remover destaque" : "Marcar como destaque no topo"}
                          className={`p-1.5 rounded-lg transition-transform active:scale-95 ${
                            review.isFeatured
                              ? "text-amber-500 bg-amber-50 hover:bg-amber-100"
                              : "text-slate-300 hover:text-amber-400 hover:bg-slate-50"
                          }`}
                        >
                          <Star className={`w-4 h-4 ${review.isFeatured ? "fill-amber-400" : ""}`} />
                        </button>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-1.5">
                          {isGoogle && review.googleReviewUrl && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                              asChild
                              title="Ver avaliação original no Google"
                            >
                              <a href={review.googleReviewUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="ghost"
                            className={`h-8 px-2.5 rounded-lg text-xs font-bold gap-1.5 ${
                              review.isApproved
                                ? "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                                : "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                            }`}
                            onClick={() => approveMutation.mutate({ id: review.id, isApproved: !review.isApproved })}
                            disabled={approveMutation.isPending}
                          >
                            <Check className="w-3.5 h-3.5" />
                            {review.isApproved ? "Ocultar" : "Aprovar"}
                          </Button>

                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600"
                            onClick={() => {
                              if (confirm("Tem certeza que deseja excluir esta avaliação?")) {
                                deleteMutation.mutate(review.id);
                              }
                            }}
                            disabled={deleteMutation.isPending}
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16 text-slate-400 italic text-sm">
                    Nenhuma avaliação encontrada com os filtros selecionados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal: Full Review Text Viewer */}
      <Dialog open={!!selectedReviewText} onOpenChange={() => setSelectedReviewText(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Depoimento de {selectedReviewText?.author}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm leading-relaxed text-slate-700 italic">
            "{selectedReviewText?.text}"
          </div>
          <DialogFooter className="mt-4">
            <Button onClick={() => setSelectedReviewText(null)} className="rounded-xl font-bold bg-[#08454c] text-white">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Add Manual Review */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl p-6 bg-white border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-display font-bold text-slate-900">
              Cadastrar Nova Avaliação
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Insira uma avaliação recebida via Google, WhatsApp ou indicação direta para exibir no site.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateReview} className="space-y-4 mt-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Origem da Avaliação
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setNewSource("google")}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    newSource === "google"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <GoogleIcon className="w-3.5 h-3.5" />
                  Google Review
                </button>
                <button
                  type="button"
                  onClick={() => setNewSource("site")}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    newSource === "site"
                      ? "border-[#08454c] bg-[#08454c]/10 text-[#08454c]"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Site Monteiro
                </button>
                <button
                  type="button"
                  onClick={() => setNewSource("whatsapp")}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    newSource === "whatsapp"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  WhatsApp / Direto
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Nome do Cliente *
                </label>
                <Input
                  placeholder="Ex: Carlos Silva"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="rounded-xl h-10 text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Cargo / Empresa (Opcional)
                </label>
                <Input
                  placeholder="Ex: Cliente Seguro Saúde"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="rounded-xl h-10 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Nota em Estrelas
              </label>
              <div className="flex items-center gap-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        newRating >= star ? "fill-amber-400 text-amber-400" : "text-slate-200"
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-auto text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">
                  {newRating} de 5 estrelas
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Depoimento do Cliente *
              </label>
              <Textarea
                placeholder="Insira o texto completo do depoimento ou avaliação..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="rounded-xl text-xs min-h-[100px] resize-none"
                required
              />
            </div>

            <DialogFooter className="mt-4 gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-xl text-xs font-bold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createReviewMutation.isPending}
                className="bg-[#08454c] text-white hover:bg-[#08454c]/90 rounded-xl text-xs font-bold px-5"
              >
                {createReviewMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                    Salvando...
                  </>
                ) : (
                  "Publicar Avaliação"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
