import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Post, InsertPost, insertPostSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ImageUpload";
import { VideoUpload } from "@/components/VideoUpload";
import { Loader2, Plus, Trash2, Pencil, Image as ImageIcon, CheckCircle, Clock, Eye, Heart } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/** Gera slug a partir de um título */
function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .substring(0, 80);
}

export default function PostsPage() {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [editingPost, setEditingPost] = useState<Post | null>(null);

    const { data: posts, isLoading } = useQuery<Post[]>({
        queryKey: ["/api/posts"],
        queryFn: async () => {
            const res = await apiRequest("GET", "/api/posts?all=true");
            return res.json();
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data: InsertPost) => {
            const res = await apiRequest("POST", "/api/posts", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
            toast({ title: "Post criado com sucesso!" });
            setOpen(false);
        },
        onError: (error: Error) => {
            toast({ title: "Erro ao criar post", description: error.message, variant: "destructive" });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number; data: InsertPost }) => {
            const res = await apiRequest("PATCH", `/api/posts/${id}`, data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
            toast({ title: "Post atualizado com sucesso!" });
            setOpen(false);
            setEditingPost(null);
        },
        onError: (error: Error) => {
            toast({ title: "Erro ao atualizar post", description: error.message, variant: "destructive" });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/posts/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
            toast({ title: "Post excluído" });
        },
        onError: (error: Error) => {
            toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
        },
    });

    const approveMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await apiRequest("PATCH", `/api/admin/posts/${id}/approve`);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
            toast({ title: "Post aprovado e publicado!" });
        },
        onError: (error: Error) => {
            toast({ title: "Erro ao aprovar", description: error.message, variant: "destructive" });
        },
    });

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const pending = posts?.filter(p => !p.isApproved) ?? [];
    const approved = posts?.filter(p => p.isApproved) ?? [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Blog Posts</h2>
                    <p className="text-sm text-slate-500 mt-1">
                        {approved.length} publicados · {pending.length} aguardando aprovação
                    </p>
                </div>
                <Button onClick={() => { setEditingPost(null); setOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> Novo Post
                </Button>
            </div>

            {/* Pending posts alert */}
            {pending.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                    <Clock className="h-5 w-5 text-amber-600 shrink-0" />
                    <div className="flex-1">
                        <p className="font-semibold text-amber-800">
                            {pending.length} post(s) aguardando aprovação
                        </p>
                        <p className="text-sm text-amber-600">Posts enviados por usuários precisam de aprovação antes de aparecerem no blog público.</p>
                    </div>
                </div>
            )}

            <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) setEditingPost(null); }}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingPost ? "Editar Post" : "Novo Post"}</DialogTitle>
                        <DialogDescription>
                            {editingPost ? "Altere as informações do post selecionado." : "Preencha os campos abaixo para publicar um novo post no blog."}
                        </DialogDescription>
                    </DialogHeader>
                    <PostForm
                        key={editingPost?.id ?? "new"}
                        initialData={editingPost}
                        onSubmit={(data: InsertPost) => {
                            if (editingPost) {
                                updateMutation.mutate({ id: editingPost.id, data });
                            } else {
                                createMutation.mutate(data);
                            }
                        }}
                        isSubmitting={createMutation.isPending || updateMutation.isPending}
                    />
                </DialogContent>
            </Dialog>

            <div className="rounded-xl border bg-white shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-10" />
                            <TableHead>Título</TableHead>
                            <TableHead>Slug</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Stats</TableHead>
                            <TableHead>Data Publicação</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!posts || posts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                    Nenhum post encontrado. Clique em "Novo Post" para criar.
                                </TableCell>
                            </TableRow>
                        ) : (
                            posts.map((post) => (
                                <TableRow key={post.id} className={!post.isApproved ? "bg-amber-50/40" : ""}>
                                    <TableCell>
                                        {post.coverImage && (
                                            <img
                                                src={post.coverImage}
                                                alt=""
                                                className="w-10 h-10 rounded-lg object-cover border border-slate-100"
                                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell className="font-medium max-w-[200px] truncate">
                                        {post.title}
                                    </TableCell>
                                    <TableCell className="font-mono text-xs text-slate-500 max-w-[140px] truncate">
                                        {post.slug}
                                    </TableCell>
                                    <TableCell>
                                        {post.isApproved ? (
                                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
                                                <CheckCircle className="h-3 w-3" /> Publicado
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1">
                                                <Clock className="h-3 w-3" /> Pendente
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3 text-xs text-slate-500">
                                            <span className="flex items-center gap-1"><Heart className="h-3 w-3 text-red-400" />{post.likes}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm text-slate-500">
                                        {post.publishedAt ? format(new Date(post.publishedAt), "dd/MM/yyyy", { locale: ptBR }) : "—"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            {!post.isApproved && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 text-xs gap-1"
                                                    onClick={() => approveMutation.mutate(post.id)}
                                                    disabled={approveMutation.isPending}
                                                >
                                                    <CheckCircle className="h-3.5 w-3.5" /> Aprovar
                                                </Button>
                                            )}
                                            <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
                                                <Button variant="ghost" size="icon" title="Ver no blog">
                                                    <Eye className="h-4 w-4 text-slate-400" />
                                                </Button>
                                            </a>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => { setEditingPost(post); setOpen(true); }}
                                            >
                                                <Pencil className="h-4 w-4 text-slate-500" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    if (confirm(`Excluir "${post.title}"?`)) {
                                                        deleteMutation.mutate(post.id);
                                                    }
                                                }}
                                                disabled={deleteMutation.isPending}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-400" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

function PostForm({ initialData, onSubmit, isSubmitting }: {
    initialData: Post | null;
    onSubmit: (data: InsertPost) => void;
    isSubmitting: boolean;
}) {
    const { toast } = useToast();
    const [slugLocked, setSlugLocked] = useState(!!initialData);

    const form = useForm<InsertPost>({
        resolver: zodResolver(insertPostSchema),
        defaultValues: {
            title: initialData?.title ?? "",
            slug: initialData?.slug ?? "",
            content: initialData?.content ?? "",
            summary: initialData?.summary ?? "",
            coverImage: initialData?.coverImage ?? "",
            videoUrl: initialData?.videoUrl ?? "",
            youtubeUrl: initialData?.youtubeUrl ?? "",
            publishedAt: initialData?.publishedAt ? new Date(initialData.publishedAt) : new Date(),
        },
    });

    // Auto-generate slug from title (only when not locked / editing)
    const titleValue = form.watch("title");
    useEffect(() => {
        if (!slugLocked && titleValue) {
            form.setValue("slug", slugify(titleValue), { shouldValidate: true });
        }
    }, [titleValue, slugLocked, form]);

    const onError = (errors: any) => {
        const firstError = Object.values(errors)[0] as any;
        toast({
            title: "Erro de validação",
            description: firstError?.message ?? "Verifique os campos obrigatórios.",
            variant: "destructive",
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Título *</FormLabel>
                            <FormControl>
                                <Input placeholder="Título do post" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                        <FormItem>
                            <div className="flex items-center justify-between">
                                <FormLabel>Slug (URL) *</FormLabel>
                                <button
                                    type="button"
                                    className="text-[10px] text-primary underline"
                                    onClick={() => setSlugLocked(prev => !prev)}
                                >
                                    {slugLocked ? "🔒 Editar manualmente" : "🔓 Auto-gerar"}
                                </button>
                            </div>
                            <FormControl>
                                <Input
                                    placeholder="titulo-do-post"
                                    readOnly={!slugLocked}
                                    className={!slugLocked ? "bg-slate-50 text-slate-500 cursor-not-allowed" : ""}
                                    {...field}
                                    onChange={(e) => {
                                        if (slugLocked) {
                                            field.onChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                                        }
                                    }}
                                />
                            </FormControl>
                            <p className="text-[11px] text-slate-400">
                                URL pública: /blog/<strong>{field.value || "slug-do-post"}</strong>
                            </p>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="summary"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Resumo *</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Breve resumo exibido na listagem do blog..." rows={2} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                        <FormItem>
                            <div className="flex items-center justify-between">
                                <FormLabel>Conteúdo *</FormLabel>
                                <Label className="cursor-pointer text-[10px] bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded border border-slate-200 flex items-center gap-1 text-slate-600 transition-colors">
                                    <ImageIcon className="w-3 h-3" />
                                    Inserir Imagem no Texto
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                const base64 = reader.result as string;
                                                const current = form.getValues("content") || "";
                                                form.setValue("content", current + `\n![imagem](${base64})\n`);
                                            };
                                            reader.readAsDataURL(file);
                                        }}
                                    />
                                </Label>
                            </div>
                            <FormControl>
                                <Textarea
                                    placeholder="Conteúdo do post... Use ![descrição](link) para inserir imagens inline."
                                    className="min-h-[180px] font-sans text-sm"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="coverImage"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Imagem de Capa *</FormLabel>
                            <FormControl>
                                <ImageUpload
                                    value={field.value}
                                    onChange={field.onChange}
                                    description="Imagem principal exibida no feed e no topo do post."
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                    <FormField
                        control={form.control}
                        name="videoUrl"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Vídeo (Upload)</FormLabel>
                                <FormControl>
                                    <VideoUpload
                                        value={field.value}
                                        onChange={field.onChange}
                                        description="Vídeo direto (max. 50MB)."
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="youtubeUrl"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Link do YouTube</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="https://www.youtube.com/watch?v=..."
                                        {...field}
                                        value={field.value ?? ""}
                                    />
                                </FormControl>
                                <p className="text-[10px] text-slate-400 italic">
                                    Cole a URL completa do vídeo do YouTube.
                                </p>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {initialData ? "Salvar Alterações" : "Publicar Post"}
                </Button>
            </form>
        </Form>
    );
}
