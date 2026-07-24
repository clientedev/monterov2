import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Seguradora } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2, Plus, Pencil, Trash2, Building2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function SeguradorasPage() {
    const { toast } = useToast();
    const { user } = useAuth();
    const isAdmin = user?.role === "admin";

    const [showForm, setShowForm] = useState(false);
    const [editTarget, setEditTarget] = useState<Seguradora | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Seguradora | null>(null);
    const [nome, setNome] = useState("");

    const { data: seguradoras, isLoading } = useQuery<Seguradora[]>({
        queryKey: ["/api/seguradoras"],
    });

    const openCreate = () => {
        setEditTarget(null);
        setNome("");
        setShowForm(true);
    };

    const openEdit = (seg: Seguradora) => {
        setEditTarget(seg);
        setNome(seg.nome);
        setShowForm(true);
    };

    const saveMutation = useMutation({
        mutationFn: async () => {
            if (editTarget) {
                const res = await apiRequest("PATCH", `/api/seguradoras/${editTarget.id}`, { nome });
                if (!res.ok) throw new Error((await res.json()).message);
                return res.json();
            } else {
                const res = await apiRequest("POST", "/api/seguradoras", { nome });
                if (!res.ok) throw new Error((await res.json()).message);
                return res.json();
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/seguradoras"] });
            toast({ title: editTarget ? "Seguradora atualizada" : "Seguradora criada" });
            setShowForm(false);
        },
        onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/seguradoras/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/seguradoras"] });
            toast({ title: "Seguradora removida" });
            setDeleteTarget(null);
        },
        onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
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
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-3xl font-display font-bold text-gray-900">Seguradoras</h2>
                    <p className="text-muted-foreground mt-1">Gerencie as seguradoras parceiras.</p>
                </div>
                {isAdmin && (
                    <Button onClick={openCreate} className="gap-2 font-semibold">
                        <Plus className="h-4 w-4" /> Nova Seguradora
                    </Button>
                )}
            </div>

            <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50/50">
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Cadastrada em</TableHead>
                            {isAdmin && <TableHead className="text-right">Ações</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {seguradoras?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-16 text-muted-foreground">
                                    <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                    Nenhuma seguradora cadastrada.
                                </TableCell>
                            </TableRow>
                        )}
                        {seguradoras?.map(seg => (
                            <TableRow key={seg.id} className="hover:bg-gray-50/50 transition-colors">
                                <TableCell className="font-semibold">{seg.nome}</TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                    {seg.createdAt ? format(new Date(seg.createdAt), "dd/MM/yyyy", { locale: ptBR }) : "—"}
                                </TableCell>
                                {isAdmin && (
                                    <TableCell className="text-right">
                                        <div className="flex gap-2 justify-end">
                                            <Button size="sm" variant="ghost" onClick={() => openEdit(seg)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600"
                                                onClick={() => setDeleteTarget(seg)}>
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

            {/* Create / Edit Dialog */}
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editTarget ? "Editar Seguradora" : "Nova Seguradora"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(); }}>
                        <div className="space-y-4 py-2">
                            <div>
                                <Label htmlFor="seg-nome">Nome *</Label>
                                <Input id="seg-nome" value={nome} onChange={e => setNome(e.target.value)}
                                    placeholder="Ex: Porto Seguro" required />
                            </div>
                        </div>
                        <DialogFooter className="mt-4">
                            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                            <Button type="submit" disabled={saveMutation.isPending}>
                                {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                {editTarget ? "Salvar" : "Criar"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm */}
            <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remover Seguradora?</AlertDialogTitle>
                        <AlertDialogDescription>
                            A seguradora <strong>{deleteTarget?.nome}</strong> será removida permanentemente.
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
