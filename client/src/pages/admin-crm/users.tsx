import { useState } from "react";
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
import { Loader2, Shield, User as UserIcon, UserPlus, Trash2, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";

export default function UsersPage() {
    const { toast } = useToast();
    const { user: currentUser } = useAuth();

    // New user modal state
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState("");
    const [newUsername, setNewUsername] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newRole, setNewRole] = useState<"admin" | "employee">("employee");
    const [showNewPassword, setShowNewPassword] = useState(false);

    // Delete confirm state
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

    const { data: users, isLoading } = useQuery<User[]>({
        queryKey: ["/api/users"],
    });

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

    const createUserMutation = useMutation({
        mutationFn: async () => {
            const res = await apiRequest("POST", "/api/admin/users", {
                name: newName,
                username: newUsername,
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
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-3xl font-display font-bold text-gray-900">Gerenciamento de Usuários</h2>
                    <p className="text-muted-foreground mt-1">Controle quem tem acesso ao painel e seus níveis de permissão.</p>
                </div>
                {isAdmin && (
                    <Button
                        onClick={() => setShowCreate(true)}
                        className="gap-2 font-semibold"
                    >
                        <UserPlus className="h-4 w-4" />
                        Novo Usuário
                    </Button>
                )}
            </div>

            <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50/50">
                        <TableRow>
                            <TableHead>Usuário</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>Permissão</TableHead>
                            <TableHead>Criado em</TableHead>
                            {isAdmin && <TableHead className="w-12" />}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users?.map((user) => (
                            <TableRow key={user.id} className="hover:bg-gray-50/50">
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                            {user.username.charAt(0).toUpperCase()}
                                        </div>
                                        {user.username}
                                        {user.id === currentUser?.id && (
                                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">Você</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>{user.name}</TableCell>
                                <TableCell>
                                    {isAdmin ? (
                                        <Select
                                            defaultValue={user.role}
                                            onValueChange={(value) =>
                                                updateRoleMutation.mutate({ id: user.id, role: value })
                                            }
                                            disabled={updateRoleMutation.isPending}
                                        >
                                            <SelectTrigger className="w-[140px] h-8 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="admin">
                                                    <div className="flex items-center gap-2">
                                                        <Shield className="h-3 w-3 text-yellow-600" />
                                                        Administrador
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="employee">
                                                    <div className="flex items-center gap-2">
                                                        <UserIcon className="h-3 w-3 text-gray-500" />
                                                        Funcionário
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <span className="flex items-center gap-1.5 text-sm">
                                            {user.role === "admin" ? (
                                                <><Shield className="h-3.5 w-3.5 text-yellow-600" /> Administrador</>
                                            ) : (
                                                <><UserIcon className="h-3.5 w-3.5 text-gray-400" /> Funcionário</>
                                            )}
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                    {user.createdAt ? format(new Date(user.createdAt), "dd/MM/yyyy") : "—"}
                                </TableCell>
                                {isAdmin && (
                                    <TableCell>
                                        {user.id !== currentUser?.id && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => setDeleteTargetId(user.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Create User Dialog */}
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogContent className="sm:max-w-[420px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Criar Novo Usuário</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreate} className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <Label htmlFor="new-name" className="font-semibold text-sm">Nome completo</Label>
                            <Input
                                id="new-name"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="Ex: João Silva"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-username" className="font-semibold text-sm">Usuário (login)</Label>
                            <Input
                                id="new-username"
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value)}
                                placeholder="Ex: joao.silva"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-password" className="font-semibold text-sm">Senha</Label>
                            <div className="relative">
                                <Input
                                    id="new-password"
                                    type={showNewPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Mínimo 6 caracteres"
                                    required
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="font-semibold text-sm">Cargo</Label>
                            <Select value={newRole} onValueChange={(v) => setNewRole(v as "admin" | "employee")}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="employee">
                                        <div className="flex items-center gap-2">
                                            <UserIcon className="h-3.5 w-3.5 text-gray-500" />
                                            Funcionário
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="admin">
                                        <div className="flex items-center gap-2">
                                            <Shield className="h-3.5 w-3.5 text-yellow-600" />
                                            Administrador
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={createUserMutation.isPending} className="gap-2">
                                {createUserMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                                Criar Usuário
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteTargetId !== null} onOpenChange={() => setDeleteTargetId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remover usuário?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação é irreversível. O usuário será permanentemente removido do sistema.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => deleteTargetId !== null && deleteUserMutation.mutate(deleteTargetId)}
                        >
                            {deleteUserMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                "Remover"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
