import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Pencil, Trash2, Plus, ArrowUp, ArrowDown } from "lucide-react";
import { HeroSlide } from "@/hooks/use-content";

export default function AdminHero() {
    const [slides, setSlides] = useState<HeroSlide[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
    const { toast } = useToast();

    const [image, setImage] = useState("");
    const [title, setTitle] = useState("");
    const [text, setText] = useState("");
    const [buttonText, setButtonText] = useState("");
    const [buttonLink, setButtonLink] = useState("");
    const [order, setOrder] = useState(0);
    const [active, setActive] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchSlides(); }, []);

    const fetchSlides = async () => {
        setLoading(true);
        try {
            const res = await api.get("/admin/hero");
            setSlides(res.data);
        } catch { toast({ variant: "destructive", title: "Erro ao carregar" }); }
        finally { setLoading(false); }
    };

    const resetForm = () => {
        setImage(""); setTitle(""); setText(""); setButtonText(""); setButtonLink(""); setOrder(slides.length); setActive(true); setEditingSlide(null);
    };

    const handleEdit = (slide: HeroSlide) => {
        setEditingSlide(slide);
        setImage(slide.image);
        setTitle(slide.title);
        setText(slide.text);
        setButtonText(slide.buttonText);
        setButtonLink(slide.buttonLink);
        setOrder((slide as any).order);
        setActive((slide as any).active);
        setOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const data = { image, title, text, buttonText, buttonLink, order: Number(order), active };
        try {
            if (editingSlide) await api.put(`/admin/hero/${editingSlide.id}`, data);
            else await api.post("/admin/hero", data);
            toast({ title: "Salvo com sucesso" });
            setOpen(false);
            fetchSlides();
        } catch { toast({ variant: "destructive", title: "Erro ao salvar" }); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Excluir slide?")) return;
        try {
            await api.delete(`/admin/hero/${id}`);
            toast({ title: "Excluído" });
            fetchSlides();
        } catch { toast({ variant: "destructive", title: "Erro ao excluir" }); }
    };

    return (
        <AdminLayout title="Gerenciar Hero Carousel">
            <div className="flex justify-end mb-4">
                <Sheet open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetForm(); }}>
                    <SheetTrigger asChild>
                        <Button><Plus className="w-4 h-4 mr-2" /> Novo Slide</Button>
                    </SheetTrigger>
                    <SheetContent className="overflow-y-auto">
                        <SheetHeader><SheetTitle>{editingSlide ? "Editar Slide" : "Novo Slide"}</SheetTitle></SheetHeader>
                        <form onSubmit={handleSave} className="space-y-4 mt-4">
                            <div><Label>Imagem (URL)</Label><Input value={image} onChange={e => setImage(e.target.value)} required /></div>
                            <div><Label>Título</Label><Input value={title} onChange={e => setTitle(e.target.value)} required /></div>
                            <div><Label>Texto</Label><Textarea value={text} onChange={e => setText(e.target.value)} required /></div>
                            <div className="grid grid-cols-2 gap-2">
                                <div><Label>Texto Botão</Label><Input value={buttonText} onChange={e => setButtonText(e.target.value)} /></div>
                                <div><Label>Link Botão</Label><Input value={buttonLink} onChange={e => setButtonLink(e.target.value)} /></div>
                            </div>
                            <div><Label>Ordem</Label><Input type="number" value={order} onChange={e => setOrder(Number(e.target.value))} /></div>
                            <div className="flex items-center space-x-2">
                                <Switch checked={active} onCheckedChange={setActive} />
                                <Label>Ativo</Label>
                            </div>
                            <Button type="submit" disabled={saving} className="w-full">{saving ? "Salvando..." : "Salvar"}</Button>
                        </form>
                    </SheetContent>
                </Sheet>
            </div>
            <div className="bg-white rounded shadow">
                <Table>
                    <TableHeader><TableRow><TableHead>Ordem</TableHead><TableHead>Imagem</TableHead><TableHead>Título</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {loading ? <TableRow><TableCell colSpan={5} className="text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                            : slides.map((s) => (
                                <TableRow key={s.id}>
                                    <TableCell>{(s as any).order}</TableCell>
                                    <TableCell><img src={s.image} className="w-16 h-10 object-cover rounded" /></TableCell>
                                    <TableCell className="max-w-[200px] truncate">{s.title}</TableCell>
                                    <TableCell>{(s as any).active ? "Ativo" : "Inativo"}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(s)}><Pencil className="w-4 h-4 text-blue-500" /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
            </div>
        </AdminLayout>
    );
}
