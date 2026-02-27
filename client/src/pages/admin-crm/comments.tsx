import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Check, X, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function CommentsPage() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data: comments, isLoading } = useQuery({
        queryKey: ["/api/admin/comments"],
        queryFn: async () => {
            const res = await fetch("/api/admin/comments");
            if (!res.ok) throw new Error("Falha ao carregar comentários");
            return await res.json();
        }
    });

    const approveMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/admin/comments/${id}/approve`, { method: "PATCH" });
            if (!res.ok) throw new Error("Erro ao aprovar");
            return await res.json();
        },
        onSuccess: () => {
            toast({ title: "Comentário aprovado com sucesso!" });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/comments"] });
        },
        onError: () => {
            toast({ title: "Erro", description: "Falha ao aprovar comentário", variant: "destructive" });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/admin/comments/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Erro ao excluir");
        },
        onSuccess: () => {
            toast({ title: "Comentário excluído com sucesso!" });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/comments"] });
        },
        onError: () => {
            toast({ title: "Erro", description: "Falha ao excluir comentário", variant: "destructive" });
        }
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const pendingComments = comments?.filter((c: any) => !c.isApproved) || [];
    const approvedComments = comments?.filter((c: any) => c.isApproved) || [];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-display font-bold text-slate-900 flex items-center gap-3">
                    <MessageSquare className="w-8 h-8 text-primary" />
                    Moderação de Comentários
                </h1>
                <p className="text-slate-600 mt-2">Aprove reprove ou exclua comentários do Blog</p>
            </div>

            <div className="space-y-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500" />
                    Aguardando Aprovação ({pendingComments.length})
                </h2>

                {pendingComments.length === 0 ? (
                    <p className="text-slate-500 italic">Nenhum comentário pendente no momento.</p>
                ) : (
                    <div className="grid gap-4">
                        {pendingComments.map((comment: any) => (
                            <div key={comment.id} className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                                <div>
                                    <div className="flex gap-2 items-center mb-1">
                                        <span className="font-bold text-slate-900">{comment.authorName}</span>
                                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                            Post ID: {comment.postId}
                                        </span>
                                        <span className="text-sm text-slate-500">
                                            {format(new Date(comment.createdAt), "dd/MM/yyyy HH:mm")}
                                        </span>
                                    </div>
                                    <p className="text-slate-700">{comment.content}</p>
                                </div>

                                <div className="flex gap-2 shrink-0">
                                    <Button
                                        onClick={() => approveMutation.mutate(comment.id)}
                                        disabled={approveMutation.isPending}
                                        className="bg-emerald-500 hover:bg-emerald-600 font-bold gap-2"
                                    >
                                        <Check className="w-4 h-4" /> Aprovar
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={() => deleteMutation.mutate(comment.id)}
                                        disabled={deleteMutation.isPending}
                                        className="gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="space-y-6 pt-8 border-t border-slate-200">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    Comentários Aprovados ({approvedComments.length})
                </h2>

                {approvedComments.length === 0 ? (
                    <p className="text-slate-500 italic">Nenhum comentário aprovado ainda.</p>
                ) : (
                    <div className="grid gap-4">
                        {approvedComments.map((comment: any) => (
                            <div key={comment.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                                <div className="opacity-80">
                                    <div className="flex gap-2 items-center mb-1">
                                        <span className="font-bold text-slate-900">{comment.authorName}</span>
                                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                            Post ID: {comment.postId}
                                        </span>
                                        <span className="text-sm text-slate-500">
                                            {format(new Date(comment.createdAt), "dd/MM/yyyy HH:mm")}
                                        </span>
                                    </div>
                                    <p className="text-slate-700">{comment.content}</p>
                                </div>

                                <div className="shrink-0">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => deleteMutation.mutate(comment.id)}
                                        disabled={deleteMutation.isPending}
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200 gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" /> Excluir
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
