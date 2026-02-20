import { useQuery, useMutation } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
import { Loader2, Shield, User as UserIcon } from "lucide-react";
import { format } from "date-fns";

export default function UsersPage() {
    const { toast } = useToast();

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

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-display font-bold text-gray-900">Gerenciamento de Usuários</h2>
                <p className="text-muted-foreground mt-1">Controle quem tem acesso ao painel e seus níveis de permissão.</p>
            </div>

            <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50/50">
                        <TableRow>
                            <TableHead>Usuário</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>Permissão</TableHead>
                            <TableHead>Criado em</TableHead>
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
                                    </div>
                                </TableCell>
                                <TableCell>{user.name}</TableCell>
                                <TableCell>
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
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                    {user.createdAt ? format(new Date(user.createdAt), "dd/MM/yyyy") : "—"}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
