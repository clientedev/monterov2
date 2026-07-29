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
import { format, differenceInDays, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";

function getAlertInfo(apolice: Apolice) {
    if (!apolice.fimVigencia) return null;
    const fim = new Date(apolice.fimVigencia);
    const hoje = new Date();
    const dias = differenceInDays(fim, hoje);

    if (apolice.status === "vencida" || (apolice.status === "ativa" && isPast(fim))) {
        return { label: "Vencida", color: "bg-red-100 text-red-800 border-red-200", icon: XCircle, urgency: 4 };
    }
    if (apolice.status === "cancelada") {
        return { label: "Cancelada", color: "bg-gray-100 text-gray-600 border-gray-200", icon: XCircle, urgency: 0 };
    }
    if (apolice.status === "pendente") {
        return { label: "Pendente", color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Clock, urgency: 1 };
    }
    if (dias <= 15) return { label: `Vence em ${dias}d`, color: "bg-red-100 text-red-800 border-red-200", icon: AlertTriangle, urgency: 3 };
    if (dias <= 30) return { label: `Vence em ${dias}d`, color: "bg-orange-100 text-orange-800 border-orange-200", icon: AlertTriangle, urgency: 2 };
    if (dias <= 60) return { label: `Vence em ${dias}d`, color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: AlertTriangle, urgency: 1 };
    return { label: "Ativa", color: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: CheckCircle, urgency: 0 };
}

const STATUS_OPTIONS = [
    { value: "ativa", label: "Ativa" },
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
        setApoliceForm({ numeroApolice: "", produtoId: "", seguradoraId: "", status: "ativa", inicioVigencia: "", fimVigencia: "", premio: "", valorSegurado: "", comissao: "", corretorId: "", observacoes: "" });
        setShowApoliceForm(true);
    };

    const openEditApolice = (a: Apolice) => {
        setEditApolice(a);
        setApoliceForm({
            numeroApolice: a.numeroApolice || "",
            produtoId: a.produtoId ? String(a.produtoId) : "",
            seguradoraId: a.seguradoraId ? String(a.seguradoraId) : "",
            status: a.status || "ativa",
            inicioVigencia: a.inicioVigencia ? format(new Date(a.inicioVigencia), "yyyy-MM-dd") : "",
            fimVigencia: a.fimVigencia ? format(new Date(a.fimVigencia), "yyyy-MM-dd") : "",
            premio: a.premio || "",
            valorSegurado: a.valorSegurado || "",
            comissao: a.comissao || "",
            corretorId: a.corretorId ? String(a.corretorId) : "",
            observacoes: a.observacoes || "",
        });
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
                inicioVigencia: apoliceForm.inicioVigencia ? new Date(apoliceForm.inicioVigencia).toISOString() : null,
                fimVigencia: apoliceForm.fimVigencia ? new Date(apoliceForm.fimVigencia).toISOString() : null,
                premio: apoliceForm.premio || null,
                valorSegurado: apoliceForm.valorSegurado || null,
                comissao: apoliceForm.comissao || null,
                corretorId: apoliceForm.corretorId ? parseInt(apoliceForm.corretorId) : null,
                observacoes: apoliceForm.observacoes || null,
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
                                                {a.premio ? `R$ ${parseFloat(a.premio).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}
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
                                    <div><p className="text-xs text-gray-400 uppercase font-medium">Prêmio</p><p className="font-semibold">{selectedApolice.premio ? `R$ ${parseFloat(selectedApolice.premio).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}</p></div>
                                    <div><p className="text-xs text-gray-400 uppercase font-medium">Valor Segurado</p><p className="font-semibold">{selectedApolice.valorSegurado ? `R$ ${parseFloat(selectedApolice.valorSegurado).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}</p></div>
                                    <div><p className="text-xs text-gray-400 uppercase font-medium">Comissão</p><p className="font-semibold">{selectedApolice.comissao ? `${selectedApolice.comissao}%` : "—"}</p></div>
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

            {/* Apolice Create/Edit Dialog */}
            <Dialog open={showApoliceForm} onOpenChange={setShowApoliceForm}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editApolice ? "Editar Apólice" : "Nova Apólice"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={e => { e.preventDefault(); saveApoliceMutation.mutate(); }}>
                        <div className="grid grid-cols-2 gap-4 py-2">
                            <div>
                                <Label>Número da Apólice</Label>
                                <Input value={apoliceForm.numeroApolice} onChange={e => setField("numeroApolice", e.target.value)} placeholder="Ex: 12345-6" />
                            </div>
                            <div>
                                <Label>Status</Label>
                                <Select value={apoliceForm.status} onValueChange={v => setField("status", v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Produto *</Label>
                                <SearchableSelect
                                    options={(produtos ?? []).map(p => ({ value: String(p.id), label: p.nome }))}
                                    value={apoliceForm.produtoId}
                                    onValueChange={v => setField("produtoId", v)}
                                    placeholder="Selecionar produto..."
                                    searchPlaceholder="Pesquisar produto..."
                                    triggerClassName="h-10 rounded-md"
                                />
                            </div>
                            <div>
                                <Label>Seguradora</Label>
                                <SearchableSelect
                                    options={(seguradoras ?? []).map(s => ({ value: String(s.id), label: s.nome }))}
                                    value={apoliceForm.seguradoraId}
                                    onValueChange={v => setField("seguradoraId", v)}
                                    placeholder="Selecionar seguradora..."
                                    searchPlaceholder="Pesquisar seguradora..."
                                    triggerClassName="h-10 rounded-md"
                                    clearable
                                />
                            </div>
                            <div>
                                <Label>Início da Vigência</Label>
                                <Input type="date" value={apoliceForm.inicioVigencia} onChange={e => setField("inicioVigencia", e.target.value)} />
                            </div>
                            <div>
                                <Label>Fim da Vigência</Label>
                                <Input type="date" value={apoliceForm.fimVigencia} onChange={e => setField("fimVigencia", e.target.value)} />
                            </div>
                            <div>
                                <Label>Valor do Prêmio (R$)</Label>
                                <Input type="number" step="0.01" value={apoliceForm.premio} onChange={e => setField("premio", e.target.value)} placeholder="1500.00" />
                            </div>
                            <div>
                                <Label>Valor Segurado (R$)</Label>
                                <Input type="number" step="0.01" value={apoliceForm.valorSegurado} onChange={e => setField("valorSegurado", e.target.value)} placeholder="100000.00" />
                            </div>
                            <div>
                                <Label>Comissão (%)</Label>
                                <Input type="number" step="0.01" value={apoliceForm.comissao} onChange={e => setField("comissao", e.target.value)} placeholder="15.5" />
                            </div>
                            <div>
                                <Label>Corretor Responsável</Label>
                                <SearchableSelect
                                    options={(users ?? []).map(u => ({ value: String(u.id), label: u.name }))}
                                    value={apoliceForm.corretorId}
                                    onValueChange={v => setField("corretorId", v)}
                                    placeholder="Selecionar corretor..."
                                    searchPlaceholder="Pesquisar corretor..."
                                    triggerClassName="h-10 rounded-md"
                                    clearable
                                />
                            </div>
                            <div className="col-span-2">
                                <Label>Observações</Label>
                                <Textarea value={apoliceForm.observacoes} onChange={e => setField("observacoes", e.target.value)} rows={3} placeholder="Notas sobre esta apólice..." />
                            </div>
                        </div>
                        <DialogFooter className="mt-4">
                            <Button type="button" variant="outline" onClick={() => setShowApoliceForm(false)}>Cancelar</Button>
                            <Button type="submit" disabled={saveApoliceMutation.isPending}>
                                {saveApoliceMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                {editApolice ? "Salvar" : "Criar Apólice"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

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
