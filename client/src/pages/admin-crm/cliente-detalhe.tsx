import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useRoute, useLocation } from "wouter";
import { Cliente, Apolice, Seguradora, ProdutoSeguro, User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Loader2, Plus, Pencil, Trash2, ArrowLeft, Phone, Mail, MapPin,
    FileText, Calendar, AlertTriangle, CheckCircle, XCircle, Clock, DollarSign, Building2, User as UserIcon,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ApoliceDialog } from "@/components/ApoliceDialog";

/** Converte qualquer formato de valor monetário para número, retorna null se inválido */
function parsePremio(val: string | null | undefined): number | null {
    if (!val) return null;
    let raw = val.replace(/^R\$\s*/i, "").replace(/\s/g, "").trim();
    if (!raw) return null;
    if (raw.includes(",") && raw.includes(".")) {
        raw = raw.replace(/\./g, "").replace(",", ".");
    } else if (raw.includes(",")) {
        raw = raw.replace(",", ".");
    }
    const num = parseFloat(raw);
    return isNaN(num) ? null : num;
}

function fmtPremio(val: string | null | undefined): string {
    const num = parsePremio(val);
    if (num === null) return "—";
    return `R$ ${num.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

/** Converte string "yyyy-MM-dd" para ISO sem shift de fuso horário */
function dateToISO(val: string): string {
    // Adiciona meio-dia para garantir que a data não mude por diferença de fuso (UTC-3)
    return new Date(`${val}T12:00:00`).toISOString();
}

function getAlertInfo(apolice: Apolice) {
    // Statuses explícitos do banco têm precedência — nunca sobrescrever com lógica de data
    if (apolice.status === "cancelada") {
        return { label: "Cancelada", color: "bg-gray-100 text-gray-600 border-gray-200", icon: XCircle, urgency: 0 };
    }
    if (apolice.status === "em_atraso") {
        return { label: "Em Atraso", color: "bg-red-100 text-red-700 border-red-200", icon: AlertTriangle, urgency: 3 };
    }
    if (apolice.status === "pendente") {
        return { label: "Pendente", color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Clock, urgency: 1 };
    }
    if (apolice.status === "vencida") {
        return { label: "Vencida", color: "bg-gray-100 text-gray-600 border-gray-200", icon: XCircle, urgency: 2 };
    }

    // Status "ativa": usa a data só para alertas de proximidade, nunca para sobrescrever
    if (!apolice.fimVigencia) {
        return { label: "Ativa", color: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: CheckCircle, urgency: 0 };
    }
    const fim = new Date(apolice.fimVigencia);
    fim.setHours(23, 59, 59, 999);
    const dias = differenceInDays(fim, new Date());

    if (dias < 0)  return { label: "Ativa", color: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: CheckCircle, urgency: 0 };
    if (dias <= 15) return { label: `Vence em ${dias}d`, color: "bg-red-100 text-red-800 border-red-200", icon: AlertTriangle, urgency: 3 };
    if (dias <= 30) return { label: `Vence em ${dias}d`, color: "bg-orange-100 text-orange-800 border-orange-200", icon: AlertTriangle, urgency: 2 };
    if (dias <= 60) return { label: `Vence em ${dias}d`, color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: AlertTriangle, urgency: 1 };
    return { label: "Ativa", color: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: CheckCircle, urgency: 0 };
}

const STATUS_OPTIONS = [
    { value: "ativa", label: "Ativa" },
    { value: "em_atraso", label: "Em Atraso" },
    { value: "vencida", label: "Vencida" },
    { value: "cancelada", label: "Cancelada" },
    { value: "pendente", label: "Pendente" },
];

export default function ClienteDetalhePage() {
    const { toast } = useToast();
    const { user } = useAuth();
    const [, setLocation] = useLocation();
    const [, params] = useRoute("/admin/clientes/:id");
    const clienteId = params ? parseInt(params.id) : 0;
    const isAdmin = user?.role === "admin";

    const [showApoliceForm, setShowApoliceForm] = useState(false);
    const [editApolice, setEditApolice] = useState<Apolice | null>(null);
    const [deleteApolice, setDeleteApolice] = useState<Apolice | null>(null);
    const [selectedApolice, setSelectedApolice] = useState<Apolice | null>(null);

    const [apoliceForm, setApoliceForm] = useState({
        numeroApolice: "", produtoId: "", seguradoraId: "", status: "ativa",
        inicioVigencia: "", fimVigencia: "", premio: "", valorSegurado: "",
        comissao: "", corretorId: "", observacoes: "",
        idProposta: "", idApolice: "", pdfApolice: "", cobertura: "", dataEmissao: "",
        numeroProposta: "", linkFatura: "", formaPagamento: "", mesAtraso: "", faturasAberto: ""
    });

    const { data: cliente, isLoading: loadingCliente } = useQuery<Cliente>({
        queryKey: [`/api/clientes/${clienteId}`],
        enabled: !!clienteId,
    });

    const { data: apolices, isLoading: loadingApolices } = useQuery<Apolice[]>({
        queryKey: [`/api/clientes/${clienteId}/apolices`],
        enabled: !!clienteId,
    });

    const { data: seguradoras } = useQuery<Seguradora[]>({ queryKey: ["/api/seguradoras"] });
    const { data: produtos } = useQuery<ProdutoSeguro[]>({ queryKey: ["/api/produtos-seguro"] });
    const { data: users } = useQuery<User[]>({ queryKey: ["/api/users"] });

    const openCreateApolice = () => {
        setEditApolice(null);
        setShowApoliceForm(true);
    };

    const openEditApolice = (a: any) => {
        setEditApolice(a);
        setShowApoliceForm(true);
    };

    const saveApoliceMutation = useMutation({
        mutationFn: async () => {
            const body = {
                clienteId,
                numeroApolice: apoliceForm.numeroApolice || null,
                produtoId: apoliceForm.produtoId ? parseInt(apoliceForm.produtoId) : null,
                seguradoraId: apoliceForm.seguradoraId ? parseInt(apoliceForm.seguradoraId) : null,
                status: apoliceForm.status,
                inicioVigencia: apoliceForm.inicioVigencia ? dateToISO(apoliceForm.inicioVigencia) : null,
                fimVigencia: apoliceForm.fimVigencia ? dateToISO(apoliceForm.fimVigencia) : null,
                premio: apoliceForm.premio || null,
                valorSegurado: apoliceForm.valorSegurado || null,
                comissao: apoliceForm.comissao || null,
                corretorId: apoliceForm.corretorId ? parseInt(apoliceForm.corretorId) : null,
                observacoes: apoliceForm.observacoes || null,
                idProposta: apoliceForm.idProposta || null,
                idApolice: apoliceForm.idApolice || null,
                pdfApolice: apoliceForm.pdfApolice || null,
                cobertura: apoliceForm.cobertura || null,
                dataEmissao: apoliceForm.dataEmissao ? dateToISO(apoliceForm.dataEmissao) : null,
                numeroProposta: apoliceForm.numeroProposta || null,
                linkFatura: apoliceForm.linkFatura || null,
                formaPagamento: apoliceForm.formaPagamento || null,
                mesAtraso: apoliceForm.mesAtraso || null,
                faturasAberto: apoliceForm.faturasAberto || null,
            };
            if (editApolice) {
                const res = await apiRequest("PATCH", `/api/apolices/${editApolice.id}`, body);
                if (!res.ok) throw new Error((await res.json()).message);
                return res.json();
            } else {
                const res = await apiRequest("POST", "/api/apolices", body);
                if (!res.ok) throw new Error((await res.json()).message);
                return res.json();
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/clientes/${clienteId}/apolices`] });
            queryClient.invalidateQueries({ queryKey: ["/api/apolices"] });
            queryClient.invalidateQueries({ queryKey: ["/api/seguros/dashboard"] });
            toast({ title: editApolice ? "Apólice atualizada" : "Apólice criada" });
            setShowApoliceForm(false);
        },
        onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
    });

    const deleteApoliceMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/apolices/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/clientes/${clienteId}/apolices`] });
            queryClient.invalidateQueries({ queryKey: ["/api/apolices"] });
            queryClient.invalidateQueries({ queryKey: ["/api/seguros/dashboard"] });
            toast({ title: "Apólice removida" });
            setDeleteApolice(null);
        },
        onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
    });

    const setField = (key: string, val: string) => setApoliceForm(prev => ({ ...prev, [key]: val }));

    const getProdutoNome = (id: number | null) => produtos?.find(p => p.id === id)?.nome || "—";
    const getSeguradoraNome = (id: number | null) => seguradoras?.find(s => s.id === id)?.nome || "—";
    const getCorretorNome = (id: number | null) => users?.find(u => u.id === id)?.name || "—";

    if (loadingCliente) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    if (!cliente) {
        return (
            <div className="text-center py-20">
                <p className="text-lg text-muted-foreground">Cliente não encontrado.</p>
                <Button className="mt-4" onClick={() => setLocation("/admin/clientes")}>Voltar</Button>
            </div>
        );
    }

    const sortedApolices = [...(apolices || [])].sort((a, b) => {
        const ai = getAlertInfo(a)?.urgency || 0;
        const bi = getAlertInfo(b)?.urgency || 0;
        return bi - ai;
    });

    return (
        <div className="space-y-8">
            {/* Back button */}
            <Button variant="ghost" className="gap-2 text-muted-foreground" onClick={() => setLocation("/admin/clientes")}>
                <ArrowLeft className="h-4 w-4" /> Voltar para Clientes
            </Button>

            {/* Client Header Card */}
            <div className="bg-gradient-to-r from-[#0F6570] to-[#08454c] rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center text-white font-black text-2xl">
                            {cliente.nome.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-2xl font-display font-bold">{cliente.nome}</h1>
                            {cliente.cpfCnpj && <p className="text-white/70 font-mono text-sm mt-0.5">{cliente.cpfCnpj}</p>}
                            {cliente.tags && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {cliente.tags.split(",").map((tag, i) => (
                                        <span key={i} className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-semibold">{tag.trim()}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                        onClick={() => setLocation(`/admin/clientes`)}>
                        <Pencil className="h-3.5 w-3.5" />
                    </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    {cliente.telefone && (
                        <div className="flex items-center gap-2 text-sm text-white/80">
                            <Phone className="h-4 w-4 shrink-0" />
                            <span>{cliente.telefone}</span>
                        </div>
                    )}
                    {cliente.email && (
                        <div className="flex items-center gap-2 text-sm text-white/80">
                            <Mail className="h-4 w-4 shrink-0" />
                            <span className="truncate">{cliente.email}</span>
                        </div>
                    )}
                    {(cliente.cidade || cliente.estado) && (
                        <div className="flex items-center gap-2 text-sm text-white/80">
                            <MapPin className="h-4 w-4 shrink-0" />
                            <span>{[cliente.cidade, cliente.estado].filter(Boolean).join(", ")}</span>
                        </div>
                    )}
                    {cliente.dataNascimento && (
                        <div className="flex items-center gap-2 text-sm text-white/80">
                            <Calendar className="h-4 w-4 shrink-0" />
                            <span>{cliente.dataNascimento}</span>
                        </div>
                    )}
                    {(cliente as any).nomeRepresentante && (
                        <div className="flex items-center gap-2 text-sm text-white/80">
                            <UserIcon className="h-4 w-4 shrink-0" />
                            <span>Rep: {(cliente as any).nomeRepresentante}</span>
                        </div>
                    )}
                    {(cliente as any).telefoneRepresentante && (
                        <div className="flex items-center gap-2 text-sm text-white/80">
                            <Phone className="h-4 w-4 shrink-0" />
                            <span>Tel Rep: {(cliente as any).telefoneRepresentante}</span>
                        </div>
                    )}
                    {(cliente as any).emailRepresentante && (
                        <div className="flex items-center gap-2 text-sm text-white/80 col-span-2">
                            <Mail className="h-4 w-4 shrink-0" />
                            <span className="truncate">Email Rep: {(cliente as any).emailRepresentante}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Apolices Section */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-display font-bold text-gray-900">Apólices</h2>
                        <p className="text-sm text-muted-foreground">{apolices?.length || 0} apólice(s) vinculada(s)</p>
                    </div>
                    <Button onClick={openCreateApolice} className="gap-2">
                        <Plus className="h-4 w-4" /> Nova Apólice
                    </Button>
                </div>

                {loadingApolices ? (
                    <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                ) : sortedApolices.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl border border-dashed">
                        <FileText className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                        <p className="text-muted-foreground">Nenhuma apólice cadastrada para este cliente.</p>
                        <Button className="mt-4 gap-2" onClick={openCreateApolice}>
                            <Plus className="h-4 w-4" /> Adicionar Apólice
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {sortedApolices.map(a => {
                            const alertInfo = getAlertInfo(a);
                            const AlertIcon = alertInfo?.icon || CheckCircle;
                            return (
                                <div key={a.id}
                                    className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer"
                                    onClick={() => setSelectedApolice(a)}>
                                    <div className="flex items-center justify-between p-4 border-b bg-gray-50/50">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-lg bg-[#0F6570]/10 flex items-center justify-center">
                                                <FileText className="h-5 w-5 text-[#0F6570]" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">{getProdutoNome(a.produtoId)}</p>
                                                {a.numeroApolice && <p className="text-xs font-mono text-gray-500">#{a.numeroApolice}</p>}
                                            </div>
                                        </div>
                                        {alertInfo && (
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${alertInfo.color}`}>
                                                <AlertIcon className="h-3 w-3" />
                                                {alertInfo.label}
                                            </span>
                                        )}
                                    </div>
                                    <div className="p-4 grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-xs text-gray-400 font-medium uppercase">Seguradora</p>
                                            <p className="font-semibold text-gray-700">{getSeguradoraNome(a.seguradoraId)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 font-medium uppercase">Prêmio</p>
                                            <p className="font-semibold text-gray-700">
                                                {fmtPremio(a.premio)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 font-medium uppercase">Vigência</p>
                                            <p className="font-semibold text-gray-700 text-xs">
                                                {a.inicioVigencia ? format(new Date(a.inicioVigencia), "dd/MM/yy") : "—"}
                                                {" → "}
                                                {a.fimVigencia ? format(new Date(a.fimVigencia), "dd/MM/yy") : "—"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 font-medium uppercase">Corretor</p>
                                            <p className="font-semibold text-gray-700">{getCorretorNome(a.corretorId)}</p>
                                        </div>
                                    </div>
                                    <div className="px-4 pb-4 flex gap-2" onClick={e => e.stopPropagation()}>
                                        <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => openEditApolice(a)}>
                                            <Pencil className="h-3 w-3" /> Editar
                                        </Button>
                                        {isAdmin && (
                                            <Button size="sm" variant="outline" className="gap-1.5 text-xs text-red-500 hover:text-red-600" onClick={() => setDeleteApolice(a)}>
                                                <Trash2 className="h-3 w-3" /> Remover
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Observations */}
            {cliente.observacoes && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                    <h3 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Observações
                    </h3>
                    <p className="text-amber-800 text-sm whitespace-pre-wrap">{cliente.observacoes}</p>
                </div>
            )}

            {/* Apolice Detail Modal */}
            <Dialog open={!!selectedApolice} onOpenChange={() => setSelectedApolice(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-[#0F6570]" />
                            Detalhes da Apólice
                        </DialogTitle>
                    </DialogHeader>
                    {selectedApolice && (() => {
                        const alertInfo = getAlertInfo(selectedApolice);
                        const AlertIcon = alertInfo?.icon || CheckCircle;
                        return (
                            <div className="space-y-4">
                                {alertInfo && (
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border ${alertInfo.color}`}>
                                        <AlertIcon className="h-4 w-4" />
                                        {alertInfo.label}
                                    </span>
                                )}
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div><p className="text-xs text-gray-400 uppercase font-medium">Nº Apólice</p><p className="font-mono font-semibold">{selectedApolice.numeroApolice || "—"}</p></div>
                                    <div><p className="text-xs text-gray-400 uppercase font-medium">Produto</p><p className="font-semibold">{getProdutoNome(selectedApolice.produtoId)}</p></div>
                                    <div><p className="text-xs text-gray-400 uppercase font-medium">Seguradora</p><p className="font-semibold">{getSeguradoraNome(selectedApolice.seguradoraId)}</p></div>
                                    <div><p className="text-xs text-gray-400 uppercase font-medium">Corretor</p><p className="font-semibold">{getCorretorNome(selectedApolice.corretorId)}</p></div>
                                    <div><p className="text-xs text-gray-400 uppercase font-medium">Início Vigência</p><p className="font-semibold">{selectedApolice.inicioVigencia ? format(new Date(selectedApolice.inicioVigencia), "dd/MM/yyyy") : "—"}</p></div>
                                    <div><p className="text-xs text-gray-400 uppercase font-medium">Fim Vigência</p><p className="font-semibold">{selectedApolice.fimVigencia ? format(new Date(selectedApolice.fimVigencia), "dd/MM/yyyy") : "—"}</p></div>
                                    <div><p className="text-xs text-gray-400 uppercase font-medium">Prêmio</p><p className="font-semibold">{fmtPremio(selectedApolice.premio)}</p></div>
                                    <div><p className="text-xs text-gray-400 uppercase font-medium">Valor Segurado</p><p className="font-semibold">{fmtPremio(selectedApolice.valorSegurado)}</p></div>
                                    <div><p className="text-xs text-gray-400 uppercase font-medium">Comissão</p><p className="font-semibold">{selectedApolice.comissao ? `${selectedApolice.comissao}%` : "—"}</p></div>
                                    <div><p className="text-xs text-gray-400 uppercase font-medium">ID Proposta / Nº Proposta</p><p className="font-semibold">{(selectedApolice as any).idProposta || (selectedApolice as any).numeroProposta || "—"}</p></div>
                                    <div><p className="text-xs text-gray-400 uppercase font-medium">ID Apólice</p><p className="font-semibold">{(selectedApolice as any).idApolice || "—"}</p></div>
                                    <div><p className="text-xs text-gray-400 uppercase font-medium">Cobertura</p><p className="font-semibold">{(selectedApolice as any).cobertura || "—"}</p></div>
                                    <div><p className="text-xs text-gray-400 uppercase font-medium">Forma de Pagamento</p><p className="font-semibold">{(selectedApolice as any).formaPagamento || "—"}</p></div>
                                    <div><p className="text-xs text-gray-400 uppercase font-medium">Faturas em Aberto / Mês Atraso</p><p className="font-semibold">{(selectedApolice as any).faturasAberto ? `${(selectedApolice as any).faturasAberto} fatura(s)` : ""} {(selectedApolice as any).mesAtraso ? `(Mês: ${(selectedApolice as any).mesAtraso})` : "—"}</p></div>
                                    <div><p className="text-xs text-gray-400 uppercase font-medium">Data Emissão</p><p className="font-semibold">{(selectedApolice as any).dataEmissao ? format(new Date((selectedApolice as any).dataEmissao), "dd/MM/yyyy") : "—"}</p></div>
                                    {((selectedApolice as any).pdfApolice || (selectedApolice as any).linkFatura) && (
                                        <div className="col-span-2 flex gap-4 mt-2">
                                            {(selectedApolice as any).pdfApolice && (
                                                <a href={(selectedApolice as any).pdfApolice} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-[#0F6570] hover:underline font-bold border border-[#0F6570]/30 rounded-lg px-3 py-1.5 bg-[#0F6570]/5">
                                                    <FileText className="h-3.5 w-3.5" /> PDF da Apólice
                                                </a>
                                            )}
                                            {(selectedApolice as any).linkFatura && (
                                                <a href={(selectedApolice as any).linkFatura} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-[#0F6570] hover:underline font-bold border border-[#0F6570]/30 rounded-lg px-3 py-1.5 bg-[#0F6570]/5">
                                                    <DollarSign className="h-3.5 w-3.5" /> Link da Fatura
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {selectedApolice.observacoes && (
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <p className="text-xs text-gray-400 uppercase font-medium mb-1">Observações</p>
                                        <p className="text-sm text-gray-700">{selectedApolice.observacoes}</p>
                                    </div>
                                )}
                                <div className="flex gap-2 pt-2">
                                    <Button className="flex-1 gap-1.5" onClick={() => { setSelectedApolice(null); openEditApolice(selectedApolice); }}>
                                        <Pencil className="h-4 w-4" /> Editar
                                    </Button>
                                    <Button variant="outline" onClick={() => setSelectedApolice(null)}>Fechar</Button>
                                </div>
                            </div>
                        );
                    })()}
                </DialogContent>
            </Dialog>

            {/* Apolice Create/Edit Dialog with PDF Smart Reader */}
            <ApoliceDialog
                open={showApoliceForm}
                onOpenChange={setShowApoliceForm}
                defaultClienteId={clienteId}
                editApolice={editApolice}
            />

            {/* Delete Apolice Confirm */}
            <AlertDialog open={!!deleteApolice} onOpenChange={() => setDeleteApolice(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remover Apólice?</AlertDialogTitle>
                        <AlertDialogDescription>
                            A apólice <strong>{deleteApolice?.numeroApolice || getProdutoNome(deleteApolice?.produtoId || null)}</strong> será removida permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600 hover:bg-red-700"
                            onClick={() => deleteApolice && deleteApoliceMutation.mutate(deleteApolice.id)}>
                            Remover
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
