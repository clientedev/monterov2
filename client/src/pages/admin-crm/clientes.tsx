import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Cliente, User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Plus, Pencil, Trash2, Users, Search, Eye, Phone, Mail, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useLocation } from "wouter";

const ESTADOS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

export default function ClientesPage() {
    const { toast } = useToast();
    const { user } = useAuth();
    const [, setLocation] = useLocation();
    const isAdmin = user?.role === "admin";

    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editTarget, setEditTarget] = useState<Cliente | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Cliente | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        nome: "", cpfCnpj: "", dataNascimento: "", telefone: "", whatsapp: "",
        email: "", endereco: "", cidade: "", estado: "", observacoes: "", tags: "",
        responsavelComercialId: "" as string,
    });

    const { data: clientes, isLoading } = useQuery<Cliente[]>({
        queryKey: ["/api/clientes"],
    });

    const { data: users } = useQuery<User[]>({
        queryKey: ["/api/users"],
    });

    const openCreate = () => {
        setEditTarget(null);
        setFormData({ nome: "", cpfCnpj: "", dataNascimento: "", telefone: "", whatsapp: "", email: "", endereco: "", cidade: "", estado: "", observacoes: "", tags: "", responsavelComercialId: "" });
        setShowForm(true);
    };

    const openEdit = (c: Cliente) => {
        setEditTarget(c);
        setFormData({
            nome: c.nome || "",
            cpfCnpj: c.cpfCnpj || "",
            dataNascimento: c.dataNascimento || "",
            telefone: c.telefone || "",
            whatsapp: c.whatsapp || "",
            email: c.email || "",
            endereco: c.endereco || "",
            cidade: c.cidade || "",
            estado: c.estado || "",
            observacoes: c.observacoes || "",
            tags: c.tags || "",
            responsavelComercialId: c.responsavelComercialId ? String(c.responsavelComercialId) : "",
        });
        setShowForm(true);
    };

    const saveMutation = useMutation({
        mutationFn: async () => {
            const body = {
                ...formData,
                responsavelComercialId: formData.responsavelComercialId ? parseInt(formData.responsavelComercialId) : null,
            };
            if (editTarget) {
                const res = await apiRequest("PATCH", `/api/clientes/${editTarget.id}`, body);
                if (!res.ok) throw new Error((await res.json()).message);
                return res.json();
            } else {
                const res = await apiRequest("POST", "/api/clientes", body);
                if (!res.ok) throw new Error((await res.json()).message);
                return res.json();
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/clientes"] });
            toast({ title: editTarget ? "Cliente atualizado" : "Cliente criado com sucesso" });
            setShowForm(false);
        },
        onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/clientes/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/clientes"] });
            toast({ title: "Cliente removido" });
            setDeleteTarget(null);
        },
        onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
    });

    const filtered = clientes?.filter(c => {
        const q = search.toLowerCase();
        return !q || c.nome.toLowerCase().includes(q) || (c.cpfCnpj || "").includes(q) || (c.email || "").toLowerCase().includes(q);
    }) || [];

    if (isLoading) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    const setField = (key: string, val: string) => setFormData(prev => ({ ...prev, [key]: val }));

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-display font-bold text-gray-900">Clientes</h2>
                    <p className="text-muted-foreground mt-1">Base de clientes de seguros — {clientes?.length || 0} cadastrado(s).</p>
                </div>
                <Button onClick={openCreate} className="gap-2 font-semibold">
                    <Plus className="h-4 w-4" /> Novo Cliente
                </Button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Buscar por nome, CPF/CNPJ ou email..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {/* Cards Grid */}
            {filtered.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">Nenhum cliente encontrado.</p>
                    <p className="text-sm mt-1">Clique em "Novo Cliente" para começar.</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filtered.map(c => (
                        <div key={c.id}
                            className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group">
                            {/* Card Header */}
                            <div className="bg-gradient-to-r from-[#0F6570] to-[#08454c] p-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-11 w-11 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                                        {c.nome.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-white truncate">{c.nome}</h3>
                                        {c.cpfCnpj && <p className="text-xs text-white/70 font-mono">{c.cpfCnpj}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-4 space-y-2">
                                {c.telefone && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                        <span>{c.telefone}</span>
                                    </div>
                                )}
                                {c.email && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                        <span className="truncate">{c.email}</span>
                                    </div>
                                )}
                                {c.cidade && (
                                    <div className="text-xs text-gray-400">{c.cidade}{c.estado ? `, ${c.estado}` : ""}</div>
                                )}
                                {c.tags && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {c.tags.split(",").map((tag, i) => (
                                            <span key={i} className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-semibold">
                                                {tag.trim()}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Card Footer */}
                            <div className="px-4 pb-4 flex gap-2">
                                <Button size="sm" className="flex-1 gap-1.5 bg-[#0F6570] hover:bg-[#08454c] text-white"
                                    onClick={() => setLocation(`/admin/clientes/${c.id}`)}>
                                    <Eye className="h-3.5 w-3.5" /> Ver Apólices
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
                                    <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                {isAdmin && (
                                    <Button size="sm" variant="outline" className="text-red-500 hover:text-red-600 hover:border-red-200"
                                        onClick={() => setDeleteTarget(c)}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create / Edit Dialog */}
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editTarget ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(); }}>
                        <div className="grid grid-cols-2 gap-4 py-2">
                            <div className="col-span-2">
                                <Label>Nome *</Label>
                                <Input value={formData.nome} onChange={e => setField("nome", e.target.value)} placeholder="Nome completo" required />
                            </div>
                            <div>
                                <Label>CPF / CNPJ</Label>
                                <Input value={formData.cpfCnpj} onChange={e => setField("cpfCnpj", e.target.value)} placeholder="000.000.000-00" />
                            </div>
                            <div>
                                <Label>Data de Nascimento</Label>
                                <Input type="date" value={formData.dataNascimento} onChange={e => setField("dataNascimento", e.target.value)} />
                            </div>
                            <div>
                                <Label>Telefone</Label>
                                <Input value={formData.telefone} onChange={e => setField("telefone", e.target.value)} placeholder="(11) 99999-9999" />
                            </div>
                            <div>
                                <Label>WhatsApp</Label>
                                <Input value={formData.whatsapp} onChange={e => setField("whatsapp", e.target.value)} placeholder="(11) 99999-9999" />
                            </div>
                            <div className="col-span-2">
                                <Label>Email</Label>
                                <Input type="email" value={formData.email} onChange={e => setField("email", e.target.value)} placeholder="email@exemplo.com" />
                            </div>
                            <div className="col-span-2">
                                <Label>Endereço</Label>
                                <Input value={formData.endereco} onChange={e => setField("endereco", e.target.value)} placeholder="Rua, número, bairro" />
                            </div>
                            <div>
                                <Label>Cidade</Label>
                                <Input value={formData.cidade} onChange={e => setField("cidade", e.target.value)} placeholder="São Paulo" />
                            </div>
                            <div>
                                <Label>Estado</Label>
                                <Select value={formData.estado} onValueChange={v => setField("estado", v)}>
                                    <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                                    <SelectContent>
                                        {ESTADOS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="col-span-2">
                                <Label>Tags <span className="text-xs text-muted-foreground">(separadas por vírgula)</span></Label>
                                <Input value={formData.tags} onChange={e => setField("tags", e.target.value)} placeholder="VIP, Renovação, Empresarial" />
                            </div>
                            <div className="col-span-2">
                                <Label>Responsável Comercial</Label>
                                <Select value={formData.responsavelComercialId} onValueChange={v => setField("responsavelComercialId", v)}>
                                    <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                                    <SelectContent>
                                        {users?.map(u => <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="col-span-2">
                                <Label>Observações</Label>
                                <Textarea value={formData.observacoes} onChange={e => setField("observacoes", e.target.value)} placeholder="Anotações sobre o cliente..." rows={3} />
                            </div>
                        </div>
                        <DialogFooter className="mt-4">
                            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                            <Button type="submit" disabled={saveMutation.isPending}>
                                {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                {editTarget ? "Salvar" : "Criar Cliente"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm */}
            <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remover Cliente?</AlertDialogTitle>
                        <AlertDialogDescription>
                            O cliente <strong>{deleteTarget?.nome}</strong> e todas as suas apólices serão removidos permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600 hover:bg-red-700"
                            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}>
                            Remover
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
