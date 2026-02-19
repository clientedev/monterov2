import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Check, Trash2, Loader2, X, Star } from "lucide-react";

export default function AdminTestimonials() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get("/admin/testimonials");
            setData(res.data);
        } catch { toast({ variant: "destructive", title: "Erro ao carregar" }); }
        finally { setLoading(false); }
    };

    const handleApprove = async (id: number, approved: boolean) => {
        try {
            await api.put(`/admin/testimonials/${id}`, { approved });
            toast({ title: approved ? "Aprovado" : "Reprovado" });
            fetchData();
        } catch { toast({ variant: "destructive", title: "Erro ao moderar" }); }
    };

    return (
        <AdminLayout title="Moderar Depoimentos">
            <div className="bg-white rounded shadow">
                <Table>
                    <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Texto</TableHead><TableHead>Nota</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {loading ? <TableRow><TableCell colSpan={5} className="text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                            : data.map((t) => (
                                <TableRow key={t.id}>
                                    <TableCell className="font-medium">{t.name}</TableCell>
                                    <TableCell className="max-w-[300px] truncate">{t.text}</TableCell>
                                    <TableCell className="flex text-yellow-500">{Array.from({ length: t.rating }).map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}</TableCell>
                                    <TableCell>{t.approved ? <span className="text-green-600 bg-green-100 px-2 rounded text-xs">Aprovado</span> : <span className="text-orange-600 bg-orange-100 px-2 rounded text-xs">Pendente</span>}</TableCell>
                                    <TableCell className="text-right space-x-1">
                                        {!t.approved && <Button variant="outline" size="icon" onClick={() => handleApprove(t.id, true)}><Check className="w-4 h-4 text-green-500" /></Button>}
                                        {t.approved && <Button variant="outline" size="icon" onClick={() => handleApprove(t.id, false)}><X className="w-4 h-4 text-orange-500" /></Button>}
                                    </TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
            </div>
        </AdminLayout>
    );
}
