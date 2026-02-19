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
import { Loader2, Pencil, Trash2, Plus } from "lucide-react";
import { Post } from "@/hooks/use-content";

export default function AdminPosts() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false); // Sheet state
    const [editingPost, setEditingPost] = useState<Post | null>(null);
    const { toast } = useToast();

    // Form states
    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [summary, setSummary] = useState("");
    const [content, setContent] = useState("");
    const [coverImage, setCoverImage] = useState("");
    const [videoUrl, setVideoUrl] = useState("");
    const [published, setPublished] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const res = await api.get("/admin/posts");
            setPosts(res.data);
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Erro", description: "Não foi possível carregar os posts." });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setTitle("");
        setSlug("");
        setSummary("");
        setContent("");
        setCoverImage("");
        setVideoUrl("");
        setPublished(false);
        setEditingPost(null);
    };

    const handleEdit = (post: Post) => {
        setEditingPost(post);
        setTitle(post.title);
        setSlug(post.slug);
        setSummary(post.summary);
        setContent(post.content);
        setCoverImage(post.coverImage);
        setVideoUrl((post as any).videoUrl || "");
        setPublished((post as any).published || false);
        setOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Tem certeza que deseja excluir?")) return;
        try {
            await api.delete(`/admin/posts/${id}`);
            toast({ title: "Post excluído" });
            fetchPosts();
        } catch (error) {
            toast({ variant: "destructive", title: "Erro", description: "Falha ao excluir." });
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const data = { title, slug, summary, content, coverImage, videoUrl, published };

        try {
            if (editingPost) {
                await api.put(`/admin/posts/${editingPost.id}`, data);
                toast({ title: "Atualizado", description: "Post atualizado com sucesso." });
            } else {
                await api.post("/admin/posts", data);
                toast({ title: "Criado", description: "Post criado com sucesso." });
            }
            setOpen(false);
            fetchPosts();
        } catch (error) {
            toast({ variant: "destructive", title: "Erro", description: "Falha ao salvar." });
        } finally {
            setSaving(false);
        }
    };

    return (
        <AdminLayout title="Gerenciar Postagens">
            <div className="flex justify-end mb-4">
                <Sheet open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetForm(); }}>
                    <SheetTrigger asChild>
                        <Button><Plus className="w-4 h-4 mr-2" /> Novo Post</Button>
                    </SheetTrigger>
                    <SheetContent className="overflow-y-auto sm:max-w-xl">
                        <SheetHeader>
                            <SheetTitle>{editingPost ? "Editar Post" : "Novo Post"}</SheetTitle>
                        </SheetHeader>
                        <form onSubmit={handleSave} className="space-y-4 mt-4">
                            <div>
                                <Label>Título</Label>
                                <Input value={title} onChange={e => {
                                    setTitle(e.target.value);
                                    if (!editingPost) setSlug(e.target.value.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''));
                                }} required />
                            </div>
                            <div>
                                <Label>Slug</Label>
                                <Input value={slug} onChange={e => setSlug(e.target.value)} required />
                            </div>
                            <div>
                                <Label>Imagem de Capa (URL)</Label>
                                <Input value={coverImage} onChange={e => setCoverImage(e.target.value)} required placeholder="https://..." />
                            </div>
                            <div>
                                <Label>Resumo</Label>
                                <Textarea value={summary} onChange={e => setSummary(e.target.value)} required rows={3} />
                            </div>
                            <div>
                                <Label>Conteúdo (HTML/Texto)</Label>
                                <Textarea value={content} onChange={e => setContent(e.target.value)} required rows={10} />
                            </div>
                            <div>
                                <Label>Vídeo (URL Opcional)</Label>
                                <Input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://..." />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch id="published" checked={published} onCheckedChange={setPublished} />
                                <Label htmlFor="published">Publicado</Label>
                            </div>
                            <Button type="submit" disabled={saving} className="w-full">
                                {saving ? "Salvando..." : "Salvar"}
                            </Button>
                        </form>
                    </SheetContent>
                </Sheet>
            </div>

            <div className="bg-white rounded-md shadow">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Título</TableHead>
                            <TableHead>Slug</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24"><Loader2 className="animate-spin mx-auto" /></TableCell>
                            </TableRow>
                        ) : posts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-gray-500">Nenhum post encontrado.</TableCell>
                            </TableRow>
                        ) : (
                            posts.map((post) => (
                                <TableRow key={post.id}>
                                    <TableCell>{post.id}</TableCell>
                                    <TableCell className="font-medium">{post.title}</TableCell>
                                    <TableCell>{post.slug}</TableCell>
                                    <TableCell>
                                        {(post as any).published ?
                                            <span className="text-green-600 bg-green-100 px-2 py-1 rounded text-xs">Publicado</span> :
                                            <span className="text-yellow-600 bg-yellow-100 px-2 py-1 rounded text-xs">Rascunho</span>
                                        }
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(post)}>
                                            <Pencil className="w-4 h-4 text-blue-500" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(post.id)}>
                                            <Trash2 className="w-4 h-4 text-red-500" />
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
