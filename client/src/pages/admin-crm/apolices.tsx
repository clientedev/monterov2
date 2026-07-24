import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Apolice, Cliente, Seguradora, ProdutoSeguro, User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Loader2, Plus, Pencil, Trash2, FileText, Search, Filter, AlertTriangle, CheckCircle, XCircle, Clock, Eye,
} from "lucide-react";
import { format, differenceInDays, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useLocation } from "wouter";

function getAlertInfo(apolice: Apolice) {
    if (!apolice.fimVigencia) return null;
    const fim = new Date(apolice.fimVigencia);
    const hoje = new Date();
    const dias = differenceInDays(fim, hoje);

    if (apolice.status === "vencida" || (apolice.status === "ativa" && isPast(fim))) {
        return { label: "Vencida", color: "bg-red-100 text-red-800 border-red-200", icon: XCircle };
    }
    if (apolice.status === "cancelada") {
        return { label: "Cancelada", color: "bg-gray-100 text-gray-600 border-gray-200", icon: XCircle };
    }
    if (apolice.status === "pendente") {
        return { label: "Pendente", color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Clock };
    }
    if (dias <= 15) return { label: `Vence em ${dias}d`, color: "bg-red-100 text-red-800 border-red-200", icon: AlertTriangle };
    if (dias <= 30) return { label: `Vence em ${dias}d`, color: "bg-orange-100 text-orange-800 border-orange-200", icon: AlertTriangle };
    if (dias <= 60) return { label: `Vence em ${dias}d`, color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: AlertTriangle };
    return { label: "Ativa", color: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: CheckCircle };
}

export default function ApolicesPage() {
    const { toast } = useToast();
    const { user } = useAuth();
    const [, setLocation] = useLocation();
    const isAdmin = user?.role === "admin";

    // Filters
    const [search, setSearch] = useState("");
    const [filterCliente, setFilterCliente] = useState<string>("all");
    const [filterProduto, setFilterProduto] = useState<string>("all");
    const [filterSeguradora, setFilterSeguradora] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [filterCorretor, setFilterCorretor] = useState<string>("all");

    const [deleteTarget, setDeleteTarget] = useState<Apolice | null>(null);

    const { data: apolices, isLoading } = useQuery<Apolice[]>({
        queryKey: ["/api/apolices"],
    });

    const { data: clientes } = useQuery<Cliente[]>({ queryKey: ["/api/clientes"] });
    const { data: seguradoras } = useQuery<Seguradora[]>({ queryKey: ["/api/seguradoras"] });
    const { data: produtos } = useQuery<ProdutoSeguro[]>({ queryKey: ["/api/produtos-seguro"] });
    const { data: users } = useQuery<User[]>({ queryKey: ["/api/users"] });

    const getClienteNome = (id: number) => clientes?.find(c => c.id === id)?.nome || "—";
    const getProdutoNome = (id: number | null) => produtos?.find(p => p.id === id)?.nome || "—";
    const getSeguradoraNome = (id: number | null) => seguradoras?.find(s => s.id === id)?.nome || "—";
    const getCorretorNome = (id: number | null) => users?.find(u => u.id === id)?.name || "—";

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/apolices/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/apolices"] });
            queryClient.invalidateQueries({ queryKey: ["/api/seguros/dashboard"] });
            toast({ title: "Apólice removida com sucesso" });
            setDeleteTarget(null);
        },
        onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
    });

    const filtered = apolices?.filter(a => {
        const q = search.toLowerCase();
        const clienteNome = getClienteNome(a.clienteId).toLowerCase();
        const prodNome = getProdutoNome(a.produtoId).toLowerCase();
        const numApolice = (a.numeroApolice || "").toLowerCase();

        const matchSearch = !q || clienteNome.includes(q) || prodNome.includes(q) || numApolice.includes(q);
        const matchCliente = filterCliente === "all" || String(a.clienteId) === filterCliente;
        const matchProduto = filterProduto === "all" || String(a.produtoId) === filterProduto;
        const matchSeguradora = filterSeguradora === "all" || String(a.seguradoraId) === filterSeguradora;
        const matchStatus = filterStatus === "all" || a.status === filterStatus;
        const matchCorretor = filterCorretor === "all" || String(a.corretorId) === filterCorretor;

        return matchSearch && matchCliente && matchProduto && matchSeguradora && matchStatus && matchCorretor;
    }) || [];

    if (isLoading) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-display font-bold text-gray-900">Apólices de Seguro</h2>
                    <p className="text-muted-foreground mt-1">Gerenciamento e filtros de todas as apólices — {filtered.length} registrada(s).</p>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white rounded-xl border p-4 shadow-sm space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-9" placeholder="Pesquisar por cliente, produto ou nº da apólice..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div>
                        <Label className="text-xs">Cliente</Label>
                        <Select value={filterCliente} onValueChange={setFilterCliente}>
                            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os clientes</SelectItem>
                                {clientes?.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label className="text-xs">Produto</Label>
                        <Select value={filterProduto} onValueChange={setFilterProduto}>
                            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os produtos</SelectItem>
                                {produtos?.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.nome}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label className="text-xs">Seguradora</Label>
                        <Select value={filterSeguradora} onValueChange={setFilterSeguradora}>
                            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Todas" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas seguradoras</SelectItem>
                                {seguradoras?.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.nome}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label className="text-xs">Status</Label>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os status</SelectItem>
                                <SelectItem value="ativa">Ativa</SelectItem>
                                <SelectItem value="vencida">Vencida</SelectItem>
                                <SelectItem value="cancelada">Cancelada</SelectItem>
                                <SelectItem value="pendente">Pendente</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label className="text-xs">Corretor</Label>
                        <Select value={filterCorretor} onValueChange={setFilterCorretor}>
                            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos corretores</SelectItem>
                                {users?.map(u => <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50/50">
                        <TableRow>
                            <TableHead>Nº Apólice / Produto</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Seguradora</TableHead>
                            <TableHead>Vigência</TableHead>
                            <TableHead>Prêmio</TableHead>
                            <TableHead>Alerta / Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                                    <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                    Nenhuma apólice encontrada com os filtros aplicados.
                                </TableCell>
                            </TableRow>
                        )}
                        {filtered.map(a => {
                            const alertInfo = getAlertInfo(a);
                            const AlertIcon = alertInfo?.icon || CheckCircle;
                            return (
                                <TableRow key={a.id} className="hover:bg-gray-50/50 transition-colors">
                                    <TableCell>
                                        <div className="font-semibold">{getProdutoNome(a.produtoId)}</div>
                                        <div className="text-xs font-mono text-gray-500">{a.numeroApolice || "Sem número"}</div>
                                    </TableCell>
                                    <TableCell>
                                        <button className="text-[#0F6570] font-semibold hover:underline text-left"
                                            onClick={() => setLocation(`/admin/clientes/${a.clienteId}`)}>
                                            {getClienteNome(a.clienteId)}
                                        </button>
                                    </TableCell>
                                    <TableCell className="text-gray-600">{getSeguradoraNome(a.seguradoraId)}</TableCell>
                                    <TableCell className="text-xs font-mono text-gray-600">
                                        {a.inicioVigencia ? format(new Date(a.inicioVigencia), "dd/MM/yy") : "—"}
                                        {" → "}
                                        {a.fimVigencia ? format(new Date(a.fimVigencia), "dd/MM/yy") : "—"}
                                    </TableCell>
                                    <TableCell className="font-semibold text-gray-900">
                                        {a.premio ? `R$ ${parseFloat(a.premio).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}
                                    </TableCell>
                                    <TableCell>
                                        {alertInfo && (
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${alertInfo.color}`}>
                                                <AlertIcon className="h-3 w-3" />
                                                {alertInfo.label}
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button size="sm" variant="ghost" onClick={() => setLocation(`/admin/clientes/${a.clienteId}`)}>
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            {isAdmin && (
                                                <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => setDeleteTarget(a)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remover Apólice?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta apólice será excluída permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}>
                            Remover
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
