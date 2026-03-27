import { useAdminReviews, useApproveReview, useDeleteReview } from "@/hooks/use-reviews";
import { Star, Check, Trash2, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

export default function ReviewsPage() {
    const { data: reviews, isLoading } = useAdminReviews();
    const approveMutation = useApproveReview();
    const deleteMutation = useDeleteReview();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const pendingReviews = reviews?.filter(r => !r.isApproved) || [];
    const approvedReviews = reviews?.filter(r => r.isApproved) || [];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-display font-bold text-slate-900 flex items-center gap-3">
                    <Star className="w-8 h-8 text-amber-500 fill-amber-500" />
                    Moderação de Avaliações
                </h1>
                <p className="text-slate-600 mt-2">Gerencie as avaliações dos clientes que aparecem na página inicial</p>
            </div>

            <div className="grid gap-8">
                {/* Pending Reviews */}
                <Card className="border-none shadow-sm overflow-hidden bg-white">
                    <CardHeader className="border-b border-slate-100 bg-amber-50/30">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-bold flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                    Aguardando Aprovação
                                </CardTitle>
                                <CardDescription>Avaliações que ainda não estão visíveis no site</CardDescription>
                            </div>
                            <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">
                                {pendingReviews.length} Pendentes
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="pl-6">Cliente</TableHead>
                                    <TableHead>Nota</TableHead>
                                    <TableHead className="w-1/3 text-center">Comentário</TableHead>
                                    <TableHead>Data</TableHead>
                                    <TableHead className="text-right pr-6">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingReviews.length > 0 ? (
                                    pendingReviews.map((review) => (
                                        <TableRow key={review.id}>
                                            <TableCell className="pl-6">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold">
                                                        U
                                                    </div>
                                                    <span className="font-semibold text-xs">User #{review.userId}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-0.5">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            className={`w-3 h-3 ${
                                                                i < review.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"
                                                            }`}
                                                        />
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <p className="text-sm text-slate-600 italic">"{review.comment}"</p>
                                            </TableCell>
                                            <TableCell className="text-xs text-slate-400">
                                                {review.createdAt && format(new Date(review.createdAt), "dd/MM/yyyy")}
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 px-3 rounded-lg text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 font-bold gap-2"
                                                        onClick={() => approveMutation.mutate(review.id)}
                                                        disabled={approveMutation.isPending}
                                                    >
                                                        <Check className="w-4 h-4" /> Aprovar
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600"
                                                        onClick={() => {
                                                            if (confirm("Deseja excluir esta avaliação?")) {
                                                                deleteMutation.mutate(review.id);
                                                            }
                                                        }}
                                                        disabled={deleteMutation.isPending}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-12 text-slate-400 italic">
                                            Não há avaliações pendentes.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Approved Reviews */}
                <Card className="border-none shadow-sm overflow-hidden bg-white/50">
                    <CardHeader className="border-b border-slate-100 bg-emerald-50/30">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                    Avaliações Publicadas
                                </CardTitle>
                                <CardDescription>Feedback visível para todos os visitantes do site</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="pl-6">Cliente</TableHead>
                                    <TableHead>Nota</TableHead>
                                    <TableHead className="w-1/3 text-center">Comentário</TableHead>
                                    <TableHead className="text-right pr-6">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {approvedReviews.length > 0 ? (
                                    approvedReviews.map((review) => (
                                        <TableRow key={review.id} className="opacity-75 hover:opacity-100 transition-opacity">
                                            <TableCell className="pl-6">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                                                        {review.userId}
                                                    </div>
                                                    <span className="font-medium text-xs">Cliente #{review.userId}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-0.5">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            className={`w-3 h-3 ${
                                                                i < review.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"
                                                            }`}
                                                        />
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <p className="text-sm text-slate-500 italic">"{review.comment}"</p>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500"
                                                    onClick={() => {
                                                        if (confirm("Deseja remover esta avaliação do site?")) {
                                                            deleteMutation.mutate(review.id);
                                                        }
                                                    }}
                                                    disabled={deleteMutation.isPending}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-slate-400 italic text-sm">
                                            Nenhuma avaliação aprovada ainda.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
