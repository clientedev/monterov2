import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
    Loader2, 
    Shield, 
    User as UserIcon, 
    UserPlus, 
    Trash2, 
    Eye, 
    EyeOff, 
    KeyRound, 
    Mail, 
    Edit2, 
    Calendar,
    ChevronDown,
    ChevronUp,
    Search,
    Cake,
    Users,
    UserCheck,
    Lock
} from "lucide-react";
import { format } from "date-fns";

export default function UsersPage() {
    const { toast } = useToast();
    const { user: currentUser } = useAuth();

    // New user modal state
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState("");
    const [newUsername, setNewUsername] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newRole, setNewRole] = useState<"admin" | "employee" | "client">("employee");
    const [showNewPassword, setShowNewPassword] = useState(false);

    // Edit email state
    const [editTargetUser, setEditTargetUser] = useState<User | null>(null);
    const [editEmail, setEditEmail] = useState("");

    // Edit anniversary state
    const [editAnniversaryUser, setEditAnniversaryUser] = useState<User | null>(null);
    const [editAnniversaryDate, setEditAnniversaryDate] = useState("");

    // Reset password state
    const [resetTargetUser, setResetTargetUser] = useState<User | null>(null);
    const [resetPassword, setResetPassword] = useState("");
    const [showResetPassword, setShowResetPassword] = useState(false);

    // Delete confirm state
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

    // Client drawer & search state
    const [clientsDrawerOpen, setClientsDrawerOpen] = useState(true);
    const [clientSearch, setClientSearch] = useState("");

    const { data: users, isLoading } = useQuery<User[]>({
        queryKey: ["/api/users"],
    });

    const employees = useMemo(() => {
        return (users ?? []).filter((u) => u.role === "admin" || u.role === "employee");
    }, [users]);

    const clients = useMemo(() => {
        return (users ?? []).filter((u) => u.role === "client");
    }, [users]);

    const filteredClients = useMemo(() => {
        if (!clientSearch) return clients;
        const q = clientSearch.toLowerCase();
        return clients.filter(
            (c) =>
                c.name.toLowerCase().includes(q) ||
                c.username.toLowerCase().includes(q) ||
                (c.email || "").toLowerCase().includes(q)
        );
    }, [clients, clientSearch]);

    const updateRoleMutation = useMutation({
        mutationFn: async ({ id, role }: { id: number; role: string }) => {
            const res = await apiRequest("PATCH", `/api/users/${id}/role`, { role });
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/users"] });
            toast({ title: "Cargo atualizado com sucesso" });
        },
        onError: (error: Error) => {
            toast({
                title: "Erro ao atualizar cargo",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const updateEmailMutation = useMutation({
        mutationFn: async ({ id, email }: { id: number; email: string }) => {
            const res = await apiRequest("PATCH", `/api/admin/users/${id}/email`, { email });
            if (!res.ok) {
                const body = await res.json();
                throw new Error(body.message || "Erro ao atualizar e-mail");
            }
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/users"] });
            toast({ title: "E-mail atualizado com sucesso" });
            setEditTargetUser(null);
            setEditEmail("");
        },
        onError: (error: Error) => {
            toast({
                title: "Erro ao atualizar e-mail",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const updateAnniversaryMutation = useMutation({
        mutationFn: async ({ id, anniversaryDate }: { id: number; anniversaryDate: string }) => {
            const res = await apiRequest("PATCH", `/api/admin/users/${id}/anniversary`, { anniversaryDate });
            if (!res.ok) {
                const body = await res.json();
                throw new Error(body.message || "Erro ao atualizar aniversário");
            }
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/users"] });
            toast({ title: "Data de aniversário atualizada" });
            setEditAnniversaryUser(null);
            setEditAnniversaryDate("");
        },
        onError: (error: Error) => {
            toast({
                title: "Erro ao atualizar aniversário",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const createUserMutation = useMutation({
        mutationFn: async () => {
            const res = await apiRequest("POST", "/api/admin/users", {
                name: newName,
                username: newUsername,
                email: newEmail,
                password: newPassword,
                role: newRole,
            });
            if (!res.ok) {
                const body = await res.json();
                throw new Error(body.message || "Erro ao criar usuário");
            }
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/users"] });
            toast({ title: "Usuário criado com sucesso" });
            setShowCreate(false);
            setNewName("");
            setNewUsername("");
            setNewEmail("");
            setNewPassword("");
            setNewRole("employee");
        },
        onError: (error: Error) => {
            toast({
                title: "Erro ao criar usuário",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const deleteUserMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await apiRequest("DELETE", `/api/users/${id}`);
            if (!res.ok) {
                const body = await res.json();
                throw new Error(body.message || "Erro ao deletar usuário");
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/users"] });
            toast({ title: "Usuário removido com sucesso" });
            setDeleteTargetId(null);
        },
        onError: (error: Error) => {
            toast({
                title: "Erro ao remover usuário",
                description: error.message,
                variant: "destructive",
            });
            setDeleteTargetId(null);
        },
    });

    const resetPasswordMutation = useMutation({
        mutationFn: async ({ id, newPassword }: { id: number; newPassword: string }) => {
            const res = await apiRequest("PATCH", `/api/admin/users/${id}/password`, { newPassword });
            if (!res.ok) {
                const body = await res.json();
                throw new Error(body.message || "Erro ao alterar senha");
            }
        },
        onSuccess: () => {
            toast({ title: "Senha alterada com sucesso" });
            setResetTargetUser(null);
            setResetPassword("");
        },
        onError: (error: Error) => {
            toast({
                title: "Erro ao alterar senha",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createUserMutation.mutate();
    };

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const isAdmin = currentUser?.role === "admin";

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-display font-bold text-gray-900 tracking-tight">Controle de Acesso</h2>
                    <p className="text-muted-foreground mt-1">Gerencie funcionários da equipe e permissões da plataforma.</p>
                </div>
                {isAdmin && (
                    <Button
                        onClick={() => setShowCreate(true)}
                        className="gap-2 font-bold shadow-lg bg-primary hover:bg-primary/90 text-white rounded-xl h-11 px-5"
                    >
                        <UserPlus className="h-4 w-4" />
                        Novo Funcionário / Usuário
                    </Button>
                )}
            </div>

            {/* ── SECTION 1: EQUIPE DE FUNCIONÁRIOS E ADMINISTRADORES ────────────────── */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Equipe Interna & Funcionários
                        <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-xs font-bold bg-primary/10 text-primary">
                            {employees.length}
                        </Badge>
                    </h3>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="font-bold text-slate-700">Usuário</TableHead>
                                <TableHead className="font-bold text-slate-700">Nome</TableHead>
                                <TableHead className="font-bold text-slate-700">E-mail</TableHead>
                                <TableHead className="font-bold text-slate-700">Data de Aniversário 🎂</TableHead>
                                <TableHead className="font-bold text-slate-700">Cargo / Permissão</TableHead>
                                <TableHead className="font-bold text-slate-700">Criado em</TableHead>
                                {isAdmin && <TableHead className="w-24 text-right pr-4 font-bold text-slate-700">Ações</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {employees.map((u) => (
                                <TableRow key={u.id} className="hover:bg-slate-50/70 transition-colors">
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shadow-sm">
                                                {u.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-800">{u.username}</span>
                                                {u.id === currentUser?.id && (
                                                    <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded-full w-fit">
                                                        Você
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-semibold text-slate-800">{u.name}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5 text-sm text-slate-700">
                                            <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                            {u.email ? (
                                                <span>{u.email}</span>
                                            ) : (
                                                <span className="text-slate-400 italic text-xs">Sem e-mail</span>
                                            )}
                                            {isAdmin && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 ml-1 text-slate-400 hover:text-primary rounded-lg"
                                                    onClick={() => {
                                                        setEditTargetUser(u);
                                                        setEditEmail(u.email || "");
                                                    }}
                                                    title="Editar E-mail"
                                                >
                                                    <Edit2 className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>

                                    {/* Birthday Column */}
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {u.anniversaryDate ? (
                                                <Badge variant="outline" className="rounded-lg py-1 px-2.5 font-bold text-xs bg-rose-50 text-rose-700 border-rose-200 gap-1">
                                                    <Cake className="h-3.5 w-3.5 text-rose-500" />
                                                    {u.anniversaryDate}
                                                </Badge>
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">Não informada</span>
                                            )}
                                            {isAdmin && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-slate-400 hover:text-rose-600 rounded-lg"
                                                    onClick={() => {
                                                        setEditAnniversaryUser(u);
                                                        setEditAnniversaryDate(u.anniversaryDate || "");
                                                    }}
                                                    title="Definir Data de Aniversário"
                                                >
                                                    <Calendar className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>

                                    <TableCell>
                                        {isAdmin ? (
                                            <Select
                                                defaultValue={u.role}
                                                onValueChange={(value) =>
                                                    updateRoleMutation.mutate({ id: u.id, role: value })
                                                }
                                                disabled={updateRoleMutation.isPending}
                                            >
                                                <SelectTrigger className="w-[145px] h-9 text-xs rounded-xl font-bold">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="admin">
                                                        <div className="flex items-center gap-2 font-bold text-amber-700">
                                                            <Shield className="h-3.5 w-3.5 text-amber-600" />
                                                            Administrador
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="employee">
                                                        <div className="flex items-center gap-2 font-bold text-slate-700">
                                                            <UserIcon className="h-3.5 w-3.5 text-slate-500" />
                                                            Funcionário
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="client">
                                                        <div className="flex items-center gap-2 font-bold text-blue-700">
                                                            <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                                                            Mudar p/ Cliente
                                                        </div>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <span className="flex items-center gap-1.5 text-sm font-bold">
                                                {u.role === "admin" ? (
                                                    <><Shield className="h-4 w-4 text-amber-600" /> Administrador</>
                                                ) : (
                                                    <><UserIcon className="h-4 w-4 text-slate-500" /> Funcionário</>
                                                )}
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-slate-500 text-sm">
                                        {u.createdAt ? format(new Date(u.createdAt), "dd/MM/yyyy") : "—"}
                                    </TableCell>
                                    {isAdmin && (
                                        <TableCell className="text-right pr-4">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                                                    onClick={() => setResetTargetUser(u)}
                                                    title="Redefinir Senha"
                                                >
                                                    <KeyRound className="h-4 w-4" />
                                                </Button>
                                                {u.id !== currentUser?.id && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                                                        onClick={() => setDeleteTargetId(u.id)}
                                                        title="Excluir Usuário"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* ── SECTION 2: GAVETA DE CLIENTES CADASTRADOS NO SITE ────────────────── */}
            <div className="mt-8">
                <Card className="border-slate-200 shadow-md rounded-2xl overflow-hidden bg-slate-50/50">
                    <div 
                        className="p-5 bg-white border-b border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 transition-colors"
                        onClick={() => setClientsDrawerOpen(!clientsDrawerOpen)}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                <UserCheck className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-bold text-slate-800">Clientes Cadastrados no Site</h3>
                                    <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-xs font-bold bg-blue-50 text-blue-700 border-blue-200">
                                        {clients.length} clientes
                                    </Badge>
                                </div>
                                <p className="text-xs text-slate-500">Contas de acesso de clientes à Área do Cliente.</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="sm" className="font-bold text-slate-600 gap-1">
                                {clientsDrawerOpen ? (
                                    <><ChevronUp className="h-4 w-4" /> Recolher Gaveta</>
                                ) : (
                                    <><ChevronDown className="h-4 w-4" /> Expandir Gaveta</>
                                )}
                            </Button>
                        </div>
                    </div>

                    {clientsDrawerOpen && (
                        <CardContent className="p-6 space-y-4 bg-white">
                            {/* Search bar inside drawer */}
                            <div className="relative max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Buscar cliente por nome, usuário ou e-mail..."
                                    className="pl-9 h-10 rounded-xl bg-slate-50 border-slate-200 text-sm"
                                    value={clientSearch}
                                    onChange={(e) => setClientSearch(e.target.value)}
                                />
                            </div>

                            {filteredClients.length === 0 ? (
                                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed text-slate-400 text-sm">
                                    Nenhum cliente cadastrado no site encontrado.
                                </div>
                            ) : (
                                <div className="rounded-xl border border-slate-200 overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-slate-50">
                                            <TableRow>
                                                <TableHead className="font-bold text-slate-700">Cliente</TableHead>
                                                <TableHead className="font-bold text-slate-700">E-mail</TableHead>
                                                <TableHead className="font-bold text-slate-700">Status do 1º Acesso</TableHead>
                                                <TableHead className="font-bold text-slate-700">Data de Cadastro</TableHead>
                                                {isAdmin && <TableHead className="w-24 text-right pr-4 font-bold text-slate-700">Ações</TableHead>}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredClients.map((c) => (
                                                <TableRow key={c.id} className="hover:bg-slate-50/70">
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                                                                {c.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <span className="font-bold text-slate-800 block">{c.name}</span>
                                                                <span className="text-[11px] text-slate-400">@{c.username}</span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-slate-700 text-sm">{c.email || "—"}</TableCell>
                                                    <TableCell>
                                                        {c.isFirstLogin ? (
                                                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-bold text-[10px] uppercase">
                                                                Aguardando 1º Acesso
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold text-[10px] uppercase">
                                                                Conta Ativa
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-slate-500 text-sm">
                                                        {c.createdAt ? format(new Date(c.createdAt), "dd/MM/yyyy") : "—"}
                                                    </TableCell>
                                                    {isAdmin && (
                                                        <TableCell className="text-right pr-4">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                                                                    onClick={() => setResetTargetUser(c)}
                                                                    title="Redefinir Senha"
                                                                >
                                                                    <KeyRound className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                                                                    onClick={() => setDeleteTargetId(c.id)}
                                                                    title="Excluir Conta do Cliente"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    )}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    )}
                </Card>
            </div>

            {/* ── DIALOGS ───────────────────────────────────────────────────────────── */}

            {/* Edit Anniversary Dialog */}
            <Dialog open={editAnniversaryUser !== null} onOpenChange={(open) => !open && setEditAnniversaryUser(null)}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Cake className="h-5 w-5 text-rose-500" />
                            Data de Aniversário do Funcionário
                        </DialogTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                            Preencha a data comemorativa de <span className="font-bold text-foreground">{editAnniversaryUser?.name}</span> para incluí-lo no "Parabéns!" do sistema.
                        </p>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label className="font-bold text-xs uppercase text-slate-600">Data de Aniversário (DD/MM/AAAA) *</Label>
                            <Input
                                type="text"
                                value={editAnniversaryDate}
                                onChange={(e) => setEditAnniversaryDate(e.target.value)}
                                placeholder="Ex: 15/08/1990"
                                className="h-11 rounded-xl bg-slate-50 border-slate-200"
                                required
                            />
                        </div>
                        <DialogFooter className="pt-2">
                            <Button variant="outline" onClick={() => setEditAnniversaryUser(null)} className="rounded-xl">
                                Cancelar
                            </Button>
                            <Button
                                onClick={() => editAnniversaryUser && updateAnniversaryMutation.mutate({ id: editAnniversaryUser.id, anniversaryDate: editAnniversaryDate })}
                                disabled={updateAnniversaryMutation.isPending || !editAnniversaryDate.trim()}
                                className="gap-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold"
                            >
                                {updateAnniversaryMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                                Salvar Aniversário
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Email Dialog */}
            <Dialog open={editTargetUser !== null} onOpenChange={(open) => !open && setEditTargetUser(null)}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Editar E-mail do Usuário</DialogTitle>
                        <p className="text-sm text-muted-foreground">
                            Atualizando o e-mail de <span className="font-bold text-foreground">{editTargetUser?.name}</span>
                        </p>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label className="font-semibold text-sm">Endereço de E-mail *</Label>
                            <Input
                                type="email"
                                value={editEmail}
                                onChange={(e) => setEditEmail(e.target.value)}
                                placeholder="exemplo@monteiroseguros.com.br"
                                required
                                className="h-11 rounded-xl bg-slate-50 border-slate-200"
                            />
                        </div>
                        <DialogFooter className="pt-2">
                            <Button variant="outline" onClick={() => setEditTargetUser(null)} className="rounded-xl">
                                Cancelar
                            </Button>
                            <Button
                                onClick={() => editTargetUser && updateEmailMutation.mutate({ id: editTargetUser.id, email: editEmail })}
                                disabled={updateEmailMutation.isPending || !editEmail.trim()}
                                className="gap-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold"
                            >
                                {updateEmailMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                                Salvar E-mail
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Create User Dialog */}
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogContent className="sm:max-w-[420px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Criar Novo Usuário / Funcionário</DialogTitle>
                        <p className="text-xs text-muted-foreground mt-1">Cadastre um funcionário para ter acesso ao painel CRM.</p>
                    </DialogHeader>
                    <form onSubmit={handleCreate} className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <Label className="font-bold text-xs text-slate-700">Nome Completo *</Label>
                            <Input
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="Ex: Ana Souza"
                                required
                                className="h-11 rounded-xl bg-slate-50 border-slate-200"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold text-xs text-slate-700">Nome de Usuário (Login) *</Label>
                            <Input
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value)}
                                placeholder="Ex: anasouza"
                                required
                                className="h-11 rounded-xl bg-slate-50 border-slate-200"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold text-xs text-slate-700">E-mail Corporativo</Label>
                            <Input
                                type="email"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                placeholder="ana@monteiroseguros.com.br"
                                className="h-11 rounded-xl bg-slate-50 border-slate-200"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold text-xs text-slate-700">Senha Provisória *</Label>
                            <div className="relative">
                                <Input
                                    type={showNewPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Digite a senha provisória"
                                    required
                                    className="h-11 rounded-xl bg-slate-50 border-slate-200 pr-10"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-1 h-9 w-9 text-slate-400"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                >
                                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold text-xs text-slate-700">Cargo / Permissão *</Label>
                            <Select value={newRole} onValueChange={(v: any) => setNewRole(v)}>
                                <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-200">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="employee">Funcionário</SelectItem>
                                    <SelectItem value="admin">Administrador</SelectItem>
                                    <SelectItem value="client">Cliente</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setShowCreate(false)} className="rounded-xl">
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={createUserMutation.isPending || !newName || !newUsername || !newPassword}
                                className="gap-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold"
                            >
                                {createUserMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                                Criar Usuário
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Reset Password Dialog */}
            <Dialog open={resetTargetUser !== null} onOpenChange={(open) => !open && setResetTargetUser(null)}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <KeyRound className="h-5 w-5 text-amber-500" />
                            Redefinir Senha
                        </DialogTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                            Defina uma nova senha para <span className="font-bold text-foreground">{resetTargetUser?.name}</span> (@{resetTargetUser?.username})
                        </p>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <Label className="font-bold text-xs text-slate-700">Nova Senha *</Label>
                            <div className="relative">
                                <Input
                                    type={showResetPassword ? "text" : "password"}
                                    value={resetPassword}
                                    onChange={(e) => setResetPassword(e.target.value)}
                                    placeholder="No mínimo 6 caracteres"
                                    className="h-11 rounded-xl bg-slate-50 border-slate-200 pr-10"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-1 h-9 w-9 text-slate-400"
                                    onClick={() => setShowResetPassword(!showResetPassword)}
                                >
                                    {showResetPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                        <DialogFooter className="pt-2">
                            <Button variant="outline" onClick={() => setResetTargetUser(null)} className="rounded-xl">
                                Cancelar
                            </Button>
                            <Button
                                onClick={() =>
                                    resetTargetUser &&
                                    resetPasswordMutation.mutate({ id: resetTargetUser.id, newPassword: resetPassword })
                                }
                                disabled={resetPasswordMutation.isPending || resetPassword.length < 6}
                                className="gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold"
                            >
                                {resetPasswordMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                                Salvar Nova Senha
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm Alert */}
            <AlertDialog open={deleteTargetId !== null} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold">Excluir Usuário?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação é irreversível. O usuário perderá o acesso ao painel imediatamente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteTargetId && deleteUserMutation.mutate(deleteTargetId)}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl"
                        >
                            {deleteUserMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                            Sim, Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
