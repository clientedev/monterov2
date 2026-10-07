import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Post, InsertPost, insertPostSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Loader2, Plus, Trash2, Pencil, Image as ImageIcon, Star,
    Calendar, Clock, Instagram, FileText, CheckCircle2, Sparkles, ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ImageUpload";
import { VideoUpload } from "@/components/VideoUpload";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { InstagramEmbed, extractInstagramInfo } from "@/components/InstagramEmbed";

function toDatetimeLocalString(dateInput?: Date | string | null): string {
    if (!dateInput) {
        const d = new Date();
        const tzOffset = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
    }
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) {
        const now = new Date();
        const tzOffset = now.getTimezoneOffset() * 60000;
        return new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
    }
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
}

export default function PostsPage() {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [editingPost, setEditingPost] = useState<Post | null>(null);

    const { data: posts, isLoading } = useQuery<Post[]>({
        queryKey: ["/api/posts", { all: true }],
        queryFn: async () => {
            const res = await apiRequest("GET", "/api/posts?all=true");
            return await res.json();
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data: InsertPost) => {
            const res = await apiRequest("POST", "/api/posts", data);
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
            toast({ title: "Post criado com sucesso!" });
            setOpen(false);
        },
        onError: (error: Error) => {
            toast({
                title: "Erro ao criar post",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number, data: InsertPost }) => {
            const res = await apiRequest("PATCH", `/api/posts/${id}`, data);
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
            toast({ title: "Post atualizado com sucesso!" });
            setOpen(false);
            setEditingPost(null);
        },
        onError: (error: Error) => {
            toast({
                title: "Erro ao atualizar post",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/posts/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
            toast({ title: "Post excluído com sucesso" });
        },
        onError: (error: Error) => {
            toast({
                title: "Erro ao excluir",
                description: error.message,
                variant: "destructive",
            });
        }
    });

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-[#08454c]" />
            </div>
        );
    }

    const now = new Date();

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-[#163b52]">Blog &amp; Posts Sociais</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Gerencie artigos completos, publicações do Instagram e destaques da página inicial.
                    </p>
                </div>
                <Button
                    onClick={() => {
                        setEditingPost(null);
                        setOpen(true);
                    }}
                    className="bg-[#08454c] hover:bg-[#06373d] text-white shadow-md"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Artigo / Post
                </Button>
            </div>

            <Dialog open={open} onOpenChange={(val) => {
                setOpen(val);
                if (!val) setEditingPost(null);
            }}>
                <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-[#163b52]">
                            {editingPost ? "Editar Publicação" : "Criar Nova Publicação"}
                        </DialogTitle>
                        <DialogDescription>
                            Escolha se deseja publicar um Artigo completo ou incorporar um Post diretamente do Instagram.
                        </DialogDescription>
                    </DialogHeader>
                    <PostForm
                        initialData={editingPost}
                        onSubmit={(data: InsertPost) => {
                            // Ensure fallback for Instagram posts if cover image not provided
                            if (data.instagramUrl && !data.coverImage) {
                                data.coverImage = "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=800";
                            }
                            if (!data.coverImage) {
                                toast({
                                    title: "Imagem necessária",
                                    description: "Por favor, selecione uma imagem de capa para o post.",
                                    variant: "destructive"
                                });
                                return;
                            }
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

            <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/80">
                            <TableHead>Título</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Slug</TableHead>
                            <TableHead>Destaque</TableHead>
                            <TableHead>Data/Hora Publicação</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!posts || posts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-32 text-muted-foreground">
                                    Nenhuma publicação encontrada. Crie seu primeiro post ou artigo!
                                </TableCell>
                            </TableRow>
                        ) : (
                            posts.map((post) => {
                                const pubDate = post.publishedAt ? new Date(post.publishedAt) : null;
                                const isScheduled = pubDate ? pubDate > now : false;
                                const isInstagram = !!post.instagramUrl || post.postType === "instagram";

                                return (
                                    <TableRow key={post.id} className="hover:bg-slate-50/60 transition-colors">
                                        <TableCell className="font-semibold text-slate-900 max-w-[240px] truncate">
                                            {post.title}
                                        </TableCell>
                                        <TableCell>
                                            {isInstagram ? (
                                                <div className="flex items-center gap-1.5">
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold text-white bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] shadow-sm">
                                                        <Instagram className="w-3 h-3" />
                                                        Instagram
                                                    </span>
                                                    {post.instagramUrl && (
                                                        <a
                                                            href={post.instagramUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-slate-400 hover:text-pink-600 transition-colors"
                                                            title="Abrir no Instagram"
                                                        >
                                                            <ExternalLink className="w-3.5 h-3.5" />
                                                        </a>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200">
                                                    <FileText className="w-3 h-3 text-slate-500" />
                                                    Artigo
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-slate-500 text-xs max-w-[140px] truncate font-mono">
                                            {post.slug}
                                        </TableCell>
                                        <TableCell>
                                            {post.isFeatured ? (
                                                <Badge className="bg-amber-500 hover:bg-amber-600 text-white gap-1 font-semibold text-[11px]">
                                                    <Star className="w-3 h-3 fill-white" /> Destacado
                                                </Badge>
                                            ) : (
                                                <span className="text-slate-300 text-xs">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            {pubDate ? (
                                                <div className="flex items-center gap-1.5 text-slate-600">
                                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                    <span>{format(pubDate, "dd/MM/yyyy HH:mm")}</span>
                                                </div>
                                            ) : "-"}
                                        </TableCell>
                                        <TableCell>
                                            {isScheduled ? (
                                                <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 font-medium text-[11px]">
                                                    <Clock className="w-3 h-3 mr-1 text-blue-500 animate-pulse" /> Agendado
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50 font-medium text-[11px]">
                                                    Publicado
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right space-x-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title="Editar"
                                                onClick={async () => {
                                                    try {
                                                        const res = await fetch(`/api/posts/${post.slug}`);
                                                        if (res.ok) {
                                                            const full = await res.json();
                                                            setEditingPost(full);
                                                        } else {
                                                            setEditingPost(post);
                                                        }
                                                    } catch {
                                                        setEditingPost(post);
                                                    }
                                                    setOpen(true);
                                                }}
                                            >
                                                <Pencil className="h-4 w-4 text-slate-500 hover:text-[#08454c]" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title="Excluir"
                                                onClick={() => {
                                                    if (confirm(`Tem certeza que deseja excluir "${post.title}"?`)) {
                                                        deleteMutation.mutate(post.id);
                                                    }
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

function PostForm({ initialData, onSubmit, isSubmitting }: any) {
    const { toast } = useToast();
    const initialIsInsta = !!(initialData?.instagramUrl || initialData?.postType === "instagram");
    const [activeTab, setActiveTab] = useState<"article" | "instagram">(initialIsInsta ? "instagram" : "article");
    const [instaLinkInput, setInstaLinkInput] = useState(initialData?.instagramUrl || "");

    const form = useForm<InsertPost>({
        resolver: zodResolver(insertPostSchema),
        defaultValues: initialData || {
            title: "",
            slug: "",
            content: "",
            summary: "",
            coverImage: "",
            videoUrl: "",
            youtubeUrl: "",
            instagramUrl: "",
            postType: "article",
            isFeatured: false,
            publishedAt: new Date(),
        },
    });

    useEffect(() => {
        if (initialData) {
            const isInsta = !!(initialData.instagramUrl || initialData.postType === "instagram");
            setActiveTab(isInsta ? "instagram" : "article");
            setInstaLinkInput(initialData.instagramUrl || "");
            form.reset({
                ...initialData,
                videoUrl: initialData.videoUrl || "",
                youtubeUrl: initialData.youtubeUrl || "",
                instagramUrl: initialData.instagramUrl || "",
                postType: initialData.postType || (isInsta ? "instagram" : "article"),
                isFeatured: initialData.isFeatured ?? false,
                publishedAt: initialData.publishedAt ? new Date(initialData.publishedAt) : new Date(),
            });
        } else {
            setActiveTab("article");
            setInstaLinkInput("");
            form.reset({
                title: "",
                slug: "",
                content: "",
                summary: "",
                coverImage: "",
                videoUrl: "",
                youtubeUrl: "",
                instagramUrl: "",
                postType: "article",
                isFeatured: false,
                publishedAt: new Date(),
            });
        }
    }, [initialData, form]);

    // Intelligent handler when an Instagram URL is provided
    const handleInstagramUrlChange = (url: string) => {
        setInstaLinkInput(url);
        form.setValue("instagramUrl", url);
        form.setValue("postType", "instagram");

        const info = extractInstagramInfo(url);
        if (info) {
            const curTitle = form.getValues("title");
            if (!curTitle || curTitle.startsWith("Publicação do Instagram") || curTitle === "") {
                const label = info.type === "reel" ? "Reel" : "Post";
                form.setValue("title", `Publicação do Instagram - ${label} #${info.id}`);
            }

            const curSlug = form.getValues("slug");
            if (!curSlug || curSlug.startsWith("insta-") || curSlug === "") {
                form.setValue("slug", `insta-${info.id.toLowerCase()}`);
            }

            const curCover = form.getValues("coverImage");
            if (!curCover) {
                form.setValue("coverImage", "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=800");
            }

            const curContent = form.getValues("content");
            if (!curContent) {
                form.setValue("content", `Confira esta publicação exclusiva no nosso Instagram oficial @monteirosegurosebeneficios.\n\nLink original: ${info.cleanUrl}`);
            }

            const curSummary = form.getValues("summary");
            if (!curSummary) {
                form.setValue("summary", "Publicação oficial do Instagram da Monteiro Seguros.");
            }
        }
    };

    const onError = (errors: any) => {
        console.error("Form Validation Errors:", errors);
        const errorMessages = Object.entries(errors)
            .map(([field, err]: [string, any]) => `${field}: ${err.message}`)
            .join(", ");

        toast({
            title: "Erro de validação",
            description: `Por favor, verifique os campos: ${errorMessages}`,
            variant: "destructive"
        });
    };

    const watchedInstaUrl = form.watch("instagramUrl") || instaLinkInput;
    const instaInfo = extractInstagramInfo(watchedInstaUrl);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6">
                {/* Visual Mode Selector (Tabs) */}
                <Tabs
                    value={activeTab}
                    onValueChange={(val: any) => {
                        setActiveTab(val);
                        form.setValue("postType", val);
                        if (val === "article" && !initialData?.instagramUrl) {
                            form.setValue("instagramUrl", "");
                        }
                    }}
                    className="w-full"
                >
                    <TabsList className="grid w-full grid-cols-2 p-1 bg-slate-100 rounded-xl h-12">
                        <TabsTrigger
                            value="article"
                            className="flex items-center justify-center gap-2 rounded-lg font-bold text-sm data-[state=active]:bg-white data-[state=active]:text-[#08454c] data-[state=active]:shadow-sm transition-all"
                        >
                            <FileText className="w-4 h-4" />
                            <span>Artigo Completo</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="instagram"
                            className="flex items-center justify-center gap-2 rounded-lg font-bold text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#f09433] data-[state=active]:via-[#dc2743] data-[state=active]:to-[#bc1888] data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
                        >
                            <Instagram className="w-4 h-4" />
                            <span>Post do Instagram</span>
                            <span className="text-[10px] uppercase tracking-wider py-0.5 px-1.5 rounded-full bg-white/20 ml-1">
                                Novo
                            </span>
                        </TabsTrigger>
                    </TabsList>

                    {/* ========================================================= */}
                    {/* ABA INSTAGRAM: Cole o link e entra perfeitamente no site */}
                    {/* ========================================================= */}
                    <TabsContent value="instagram" className="mt-5 space-y-6">
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-50 via-purple-50 to-amber-50 border border-pink-200/70 space-y-3">
                            <div className="flex items-center gap-2 text-pink-700 font-bold text-sm">
                                <Sparkles className="w-4 h-4" />
                                <span>Incorporação Criativa do Instagram</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Cole o link de qualquer post ou reel público do Instagram. O sistema criará o card idêntico ao Instagram com avatar oficial, selo verificado, ações sociais e visualizador responsivo!
                            </p>

                            <FormField
                                control={form.control}
                                name="instagramUrl"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                            Link da Postagem ou Reel do Instagram
                                        </FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                                    <Instagram className="h-5 w-5 text-pink-600" />
                                                </div>
                                                <Input
                                                    placeholder="https://www.instagram.com/p/C... ou https://www.instagram.com/reel/..."
                                                    value={field.value || instaLinkInput}
                                                    onChange={(e) => handleInstagramUrlChange(e.target.value)}
                                                    className="pl-11 bg-white border-pink-200 focus:border-pink-500 font-medium text-slate-800"
                                                />
                                            </div>
                                        </FormControl>
                                        <FormDescription className="text-[11px] text-slate-500">
                                            Exemplo: <code className="text-pink-600 font-mono">https://www.instagram.com/p/DFxyz123/</code> ou formato Reels.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {instaInfo && (
                                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span>
                                        Link válido reconhecido como {instaInfo.type === "reel" ? "Reel" : "Post"} (ID: {instaInfo.id})!
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Live Preview do Instagram */}
                        {instaInfo && (
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                    <Instagram className="w-3.5 h-3.5 text-pink-600" />
                                    Prévia em Tempo Real (Como vai aparecer no site)
                                </Label>
                                <div className="pt-2">
                                    <InstagramEmbed
                                        url={instaInfo.cleanUrl}
                                        title={form.watch("title")}
                                        summary={form.watch("summary")}
                                        coverImage={form.watch("coverImage")}
                                        compact
                                    />
                                </div>
                            </div>
                        )}

                        {/* Campos editáveis para o Post do Instagram */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Título de Exibição</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Título descritivo do post" {...field} />
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
                                        <FormLabel>Slug (URL amigável)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="ex: post-insta-saude-familiar" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="summary"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Legenda / Descrição do Post</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Cole a legenda ou resumo da postagem do Instagram..."
                                            className="min-h-[80px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Capa personalizada opcional */}
                        <FormField
                            control={form.control}
                            name="coverImage"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Imagem de Capa (Opcional para Modo Card e Miniatura)</FormLabel>
                                    <FormControl>
                                        <ImageUpload
                                            value={field.value}
                                            onChange={field.onChange}
                                            description="Se não enviar, usaremos uma foto de alta resolução com estilo do Instagram."
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Agendamento e Destaque */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                            <FormField
                                control={form.control}
                                name="publishedAt"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-1.5 text-slate-700">
                                            <Clock className="w-4 h-4 text-slate-500" />
                                            Data e Hora de Publicação
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="datetime-local"
                                                value={toDatetimeLocalString(field.value)}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    field.onChange(val ? new Date(val) : new Date());
                                                }}
                                                className="bg-white"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="isFeatured"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg bg-white p-3 border border-slate-200 shadow-sm mt-auto">
                                        <div className="space-y-0.5 pr-2">
                                            <FormLabel className="text-sm font-semibold flex items-center gap-1.5 text-slate-800 cursor-pointer">
                                                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                                Destacar na Home
                                            </FormLabel>
                                            <FormDescription className="text-[11px] leading-tight">
                                                Exibir na seção de Nossos Posts da página inicial.
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value || false}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>
                    </TabsContent>

                    {/* ========================================================= */}
                    {/* ABA ARTIGO: Formulário tradicional de artigo longo */}
                    {/* ========================================================= */}
                    <TabsContent value="article" className="mt-5 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Título</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Título do artigo" {...field} />
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
                                        <FormLabel>Slug (URL)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="titulo-do-artigo" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Agendamento e Destaque */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                            <FormField
                                control={form.control}
                                name="publishedAt"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-1.5 text-slate-700">
                                            <Clock className="w-4 h-4 text-slate-500" />
                                            Agendar Data e Hora de Publicação
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="datetime-local"
                                                value={toDatetimeLocalString(field.value)}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    field.onChange(val ? new Date(val) : new Date());
                                                }}
                                                className="bg-white"
                                            />
                                        </FormControl>
                                        <FormDescription className="text-[11px]">
                                            Defina quando o artigo ficará visível no site.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="isFeatured"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg bg-white p-3 border border-slate-200 shadow-sm mt-auto">
                                        <div className="space-y-0.5 pr-2">
                                            <FormLabel className="text-sm font-semibold flex items-center gap-1.5 text-slate-800 cursor-pointer">
                                                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                                Destacar na Home
                                            </FormLabel>
                                            <FormDescription className="text-[11px] leading-tight">
                                                Exibir este artigo nos destaques da página inicial.
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value || false}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="summary"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Resumo</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Breve resumo introdutório..." {...field} />
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
                                        <FormLabel>Conteúdo do Artigo</FormLabel>
                                        <div className="flex items-center gap-2">
                                            <Label className="cursor-pointer text-[10px] bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded border border-slate-200 flex items-center gap-1 text-slate-600 transition-colors">
                                                <ImageIcon className="w-3 h-3" />
                                                Inserir Imagem
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (!file) return;
                                                        const reader = new FileReader();
                                                        reader.onload = (event) => {
                                                            const img = new Image();
                                                            img.onload = () => {
                                                                const canvas = document.createElement("canvas");
                                                                let width = img.width;
                                                                let height = img.height;
                                                                const maxWidth = 1200;
                                                                if (width > maxWidth) {
                                                                    height = Math.round((height * maxWidth) / width);
                                                                    width = maxWidth;
                                                                }
                                                                canvas.width = width;
                                                                canvas.height = height;
                                                                const ctx = canvas.getContext("2d");
                                                                const base64 = ctx ? canvas.toDataURL("image/jpeg", 0.82) : (event.target?.result as string);
                                                                const currentContent = form.getValues("content") || "";
                                                                form.setValue("content", currentContent + `\n![imagem](${base64})\n`);
                                                            };
                                                            img.src = event.target?.result as string;
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }}
                                                />
                                            </Label>
                                        </div>
                                    </div>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Conteúdo completo do artigo... Suporta markdown e imagens."
                                            className="min-h-[200px] font-sans"
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
                                    <FormLabel>Imagem de Capa</FormLabel>
                                    <FormControl>
                                        <ImageUpload
                                            value={field.value}
                                            onChange={field.onChange}
                                            description="Será exibida como imagem principal do artigo."
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                            <FormField
                                control={form.control}
                                name="videoUrl"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Vídeo (Upload direto)</FormLabel>
                                        <FormControl>
                                            <VideoUpload
                                                value={field.value}
                                                onChange={field.onChange}
                                                description="Anexe um vídeo curto (Max. 50MB)."
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
                                            <div className="space-y-2">
                                                <Input
                                                    placeholder="https://www.youtube.com/watch?v=..."
                                                    {...field}
                                                    value={field.value || ""}
                                                />
                                                <p className="text-[10px] text-muted-foreground italic">
                                                    Cole a URL completa do vídeo do YouTube.
                                                </p>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Botão de Envio adaptativo */}
                <Button
                    type="submit"
                    className={`w-full text-white font-bold py-6 text-base shadow-lg transition-all ${
                        activeTab === "instagram"
                            ? "bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] hover:opacity-95"
                            : "bg-[#08454c] hover:bg-[#06373d]"
                    }`}
                    disabled={isSubmitting}
                >
                    {isSubmitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                    {activeTab === "instagram" ? (
                        <span className="flex items-center gap-2">
                            <Instagram className="w-5 h-5" />
                            {initialData ? "Atualizar Post do Instagram" : "Publicar Post do Instagram"}
                        </span>
                    ) : (
                        <span>{initialData ? "Atualizar Artigo" : "Publicar Artigo"}</span>
                    )}
                </Button>
            </form>
        </Form>
    );
}
