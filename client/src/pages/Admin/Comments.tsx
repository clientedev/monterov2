import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Check, Trash2, Loader2, X } from "lucide-react";
import { format } from "date-fns";

export default function AdminComments() {
    const [comments, setComments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        fetchComments();
    }, []);

    const fetchComments = async () => {
        setLoading(true);
        try {
            const res = await api.get("/admin/comments");
            setComments(res.data);
        } catch (error) {
            toast({ variant: "destructive", title: "Erro", description: "Falha ao carregar comentários." });
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: number, approved: boolean) => {
        try {
            await api.put(`/admin/comments/${id}`, { approved });
            toast({ title: approved ? "Comentário Aprovado" : "Comentário Reprovado" });
            fetchComments();
        } catch (error) {
            toast({ variant: "destructive", title: "Erro", description: "Falha ao moderar." });
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Excluir comentário?")) return;
        try {
            await api.delete(`/admin/comments/${id}`);
            toast({ title: "Excluído" });
            fetchComments();
        } catch (error) {
            toast({ variant: "destructive", title: "Erro", description: "Falha ao excluir." });
        }
    };

    return (
        <AdminLayout title="Moderar Comentários">
            <div className="bg-white rounded-md shadow overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Autor</TableHead>
                            <TableHead>Post</TableHead>
                            <TableHead>Conteúdo</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={6} className="text-center h-24"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                        ) : comments.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="text-center h-24 text-gray-500">Nenhum comentário.</TableCell></TableRow>
                        ) : (
                            comments.map((c) => (
                                <TableRow key={c.id}>
                                    <TableCell className="font-medium">{c.author.username}</TableCell>
                                    <TableCell className="text-xs text-gray-500 max-w-[150px] truncate" title={c.post.title}>{c.post.title}</TableCell>
                                    <TableCell className="max-w-[300px] truncate" title={c.content}>{c.content}</TableCell>
                                    <TableCell className="text-xs whitespace-nowrap">{format(new Date(c.createdAt), 'dd/MM/yyyy HH:mm')}</TableCell>
                                    <TableCell>
                                        {c.approved ?
                                            <span className="text-green-600 bg-green-100 px-2 py-1 rounded text-xs">Aprovado</span> :
                                            <span className="text-orange-600 bg-orange-100 px-2 py-1 rounded text-xs">Pendente</span>
                                        }
                                    </TableCell>
                                    <TableCell className="text-right space-x-1 whitespace-nowrap">
                                        {!c.approved && (
                                            <Button variant="outline" size="icon" className="h-8 w-8 text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleApprove(c.id, true)}>
                                                <Check className="w-4 h-4" />
                                            </Button>
                                        )}
                                        {c.approved && (
                                            <Button variant="outline" size="icon" className="h-8 w-8 text-orange-600 border-orange-200 hover:bg-orange-50" onClick={() => handleApprove(c.id, false)}>
                                                <X className="w-4 h-4" />
                                            </Button>
                                        )}
                                        <Button variant="outline" size="icon" className="h-8 w-8 text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleDelete(c.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </AdminLayout>
    );
}
