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
    Calendar, Clock, Instagram, FileText, CheckCircle2, Sparkles, ExternalLink, Check
} from "lucide-react";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ImageUpload";
import { VideoUpload } from "@/components/VideoUpload";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { InstagramEmbed, extractInstagramInfo } from "@/components/InstagramEmbed";
import { extractInstagramId, getInstagramPermalink, getInstagramThumbnailUrl } from "@/utils/instagramUtils";
import { clearPostsCache } from "@/hooks/use-content";

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
            clearPostsCache();
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
            clearPostsCache();
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
            clearPostsCache();
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
                <DialogContent className="max-w-4xl w-[96vw] max-h-[92vh] p-0 overflow-hidden flex flex-col rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 bg-white">
                    <DialogHeader className="px-5 sm:px-8 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-slate-50/70 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-[#08454c]/10 text-[#08454c] border border-[#08454c]/20 shrink-0">
                                <Sparkles className="w-5 h-5 text-[#08454c]" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl sm:text-2xl font-bold text-[#163b52] tracking-tight">
                                    {editingPost ? "Editar Publicação" : "Nova Publicação"}
                                </DialogTitle>
                                <DialogDescription className="text-xs sm:text-sm text-slate-500 mt-0.5">
                                    Publique um artigo completo ou incorpore um post do Instagram oficial.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="overflow-y-auto px-5 sm:px-8 py-6 flex-1 bg-white">
                        <PostForm
                            initialData={editingPost}
                            existingPosts={posts || []}
                            onCancel={() => {
                                setOpen(false);
                                setEditingPost(null);
                            }}
                            onSubmit={(data: InsertPost) => {
                                // Trata postagens do Instagram automaticamente
                                if (data.instagramUrl) {
                                    const id = extractInstagramId(data.instagramUrl);
                                    if (id && (!data.coverImage || data.coverImage.includes("unsplash"))) {
                                        data.coverImage = `/api/instagram-preview/${id}`;
                                    }
                                    if (data.videoUrl && (data.videoUrl.includes("insta_reel_preview") || data.videoUrl.includes("carol_anim"))) {
                                        data.videoUrl = null;
                                    }
                                }
                                if (data.instagramUrl && !data.coverImage) {
                                    const id = extractInstagramId(data.instagramUrl);
                                    data.coverImage = id ? getInstagramThumbnailUrl(id) : "/assets/reel_thumb_DaySDnWBdW6.jpg";
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
                    </div>
                </DialogContent>
            </Dialog>

            <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/80">
                            <TableHead>Título</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Slug</TableHead>
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

function slugify(text: string): string {
    return (text || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function PostForm({
    initialData,
    existingPosts = [],
    onCancel,
    onSubmit,
    isSubmitting
}: {
    initialData?: any;
    existingPosts?: Post[];
    onCancel?: () => void;
    onSubmit: (data: InsertPost) => void;
    isSubmitting: boolean;
}) {
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

            const id = extractInstagramId(url) || info.id;
            if (id) {
                form.setValue("coverImage", `/api/instagram-preview/${id}`);
                form.setValue("videoUrl", null);
            } else {
                const curCover = form.getValues("coverImage");
                if (!curCover) {
                    form.setValue("coverImage", info?.id ? getInstagramThumbnailUrl(info.id) : "/assets/reel_thumb_DaySDnWBdW6.jpg");
                }
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

    const handleFormSubmit = (data: InsertPost) => {
        let finalSlug = (data.slug || "").trim();
        if (!finalSlug) {
            finalSlug = slugify(data.title) || `post-${Date.now()}`;
        } else {
            finalSlug = slugify(finalSlug);
        }
        clearPostsCache();
        onSubmit({
            ...data,
            isApproved: true,
            slug: finalSlug,
        });
    };

    const watchedInstaUrl = form.watch("instagramUrl") || instaLinkInput;
    const instaInfo = extractInstagramInfo(watchedInstaUrl);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit, onError)} className="space-y-6">
                {/* Seletor Visual de Tipo de Publicação (Cards de Alto Contraste) */}
                <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            Tipo de Publicação
                        </Label>
                        <span className="text-[11px] text-slate-500 font-medium">
                            Selecione o formato desejado
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {/* Opção Artigo Completo */}
                        <button
                            type="button"
                            onClick={() => {
                                setActiveTab("article");
                                form.setValue("postType", "article");
                                if (!initialData?.instagramUrl) {
                                    form.setValue("instagramUrl", "");
                                }
                            }}
                            className={`group relative p-4 rounded-2xl border-2 text-left transition-all flex items-start gap-3.5 cursor-pointer ${
                                activeTab === "article"
                                    ? "border-[#08454c] bg-teal-50/70 shadow-sm ring-2 ring-[#08454c]/15"
                                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80"
                            }`}
                        >
                            <div className={`p-2.5 rounded-xl shrink-0 transition-colors ${
                                activeTab === "article"
                                    ? "bg-[#08454c] text-white shadow-sm"
                                    : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                            }`}>
                                <FileText className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0 pr-6">
                                <div className="flex items-center gap-2">
                                    <span className={`font-bold text-sm leading-tight ${
                                        activeTab === "article" ? "text-[#08454c]" : "text-slate-900"
                                    }`}>
                                        Artigo Completo
                                    </span>
                                    {activeTab === "article" && (
                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#08454c] text-white">
                                            Selecionado
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                    Redija texto tradicional com imagens, vídeos, títulos e formatação livre.
                                </p>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                                activeTab === "article"
                                    ? "border-[#08454c] bg-[#08454c] text-white"
                                    : "border-slate-300 bg-white group-hover:border-slate-400"
                            }`}>
                                {activeTab === "article" && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                        </button>

                        {/* Opção Post do Instagram */}
                        <button
                            type="button"
                            onClick={() => {
                                setActiveTab("instagram");
                                form.setValue("postType", "instagram");
                            }}
                            className={`group relative p-4 rounded-2xl border-2 text-left transition-all flex items-start gap-3.5 cursor-pointer ${
                                activeTab === "instagram"
                                    ? "border-[#dc2743] bg-gradient-to-br from-pink-50/90 via-purple-50/40 to-amber-50/40 shadow-sm ring-2 ring-[#dc2743]/20"
                                    : "border-slate-200 bg-white hover:border-pink-300 hover:bg-pink-50/30"
                            }`}
                        >
                            <div className={`p-2.5 rounded-xl shrink-0 transition-all ${
                                activeTab === "instagram"
                                    ? "bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white shadow-sm"
                                    : "bg-pink-100 text-pink-700 group-hover:bg-pink-200"
                            }`}>
                                <Instagram className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0 pr-6">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={`font-bold text-sm leading-tight ${
                                        activeTab === "instagram" ? "text-[#b91c1c]" : "text-slate-900"
                                    }`}>
                                        Post do Instagram
                                    </span>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                        activeTab === "instagram"
                                            ? "bg-[#dc2743] text-white"
                                            : "bg-pink-100 text-pink-700 border border-pink-200"
                                    }`}>
                                        {activeTab === "instagram" ? "Selecionado" : "Novo"}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                    Cole o link de uma foto ou Reel para incorporar o card social automático no site.
                                </p>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                                activeTab === "instagram"
                                    ? "border-[#dc2743] bg-[#dc2743] text-white"
                                    : "border-slate-300 bg-white group-hover:border-pink-400"
                            }`}>
                                {activeTab === "instagram" && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                        </button>
                    </div>
                </div>

                {/* Conteúdo da Aba Instagram */}
                {activeTab === "instagram" && (
                    <div className="space-y-6 pt-2 animate-in fade-in-50 duration-200">
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
                                            <Input
                                                placeholder="Título descritivo do post"
                                                {...field}
                                                onChange={(e) => {
                                                    field.onChange(e);
                                                    const curSlug = form.getValues("slug");
                                                    const prevAuto = slugify(field.value);
                                                    if (!initialData && (!curSlug || curSlug === prevAuto)) {
                                                        form.setValue("slug", slugify(e.target.value), { shouldValidate: true });
                                                    }
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="slug"
                                render={({ field }) => {
                                    const isDuplicate = existingPosts?.some(
                                        (p: Post) => p.slug === field.value && p.id !== initialData?.id
                                    );
                                    return (
                                        <FormItem>
                                            <FormLabel className="flex items-center justify-between">
                                                <span>Slug (URL amigável)</span>
                                                {isDuplicate && (
                                                    <span className="text-[10px] text-amber-600 font-semibold">
                                                        (Já existe: sufixo automático)
                                                    </span>
                                                )}
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="ex: post-insta-saude-familiar"
                                                    {...field}
                                                    onChange={(e) => {
                                                        field.onChange(slugify(e.target.value));
                                                    }}
                                                />
                                            </FormControl>
                                            {isDuplicate && (
                                                <p className="text-[11px] text-amber-600">
                                                    Esse slug já existe. Ao salvar, um sufixo numérico será adicionado para não conflitar.
                                                </p>
                                            )}
                                            <FormMessage />
                                        </FormItem>
                                    );
                                }}
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

                        {/* Trecho de Vídeo do Reel (Rodando em Cache sem Egress) */}
                        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <FormLabel className="text-sm font-semibold flex items-center gap-1.5 text-slate-800">
                                    <Sparkles className="w-4 h-4 text-[#dc2743]" />
                                    Trecho do Vídeo / Reel em Loop (Opcional)
                                </FormLabel>
                                <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 w-fit">
                                    ⚡ Guardado em Cache (Zero Egress)
                                </span>
                            </div>
                            <FormDescription className="text-xs text-slate-500">
                                Deixe um trecho do vídeo rodando no card. Ele é guardado no cache do navegador sem consumir egress em visitas repetidas. Se não enviar, exibiremos o vídeo oficial de preview da Monteiro Seguros.
                            </FormDescription>

                            <FormField
                                control={form.control}
                                name="videoUrl"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <div className="space-y-3">
                                                <Input
                                                    placeholder="URL direta de vídeo MP4 (ex: https://.../reel.mp4 ou /insta_reel_preview.mp4)"
                                                    {...field}
                                                    value={field.value || ""}
                                                />
                                                <VideoUpload
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    description="Ou envie um clipe MP4/WEBM de até 50MB."
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Agendamento de Data e Hora */}
                        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
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
                                                className="bg-white max-w-md"
                                            />
                                        </FormControl>
                                        <FormDescription className="text-[11px]">
                                            Defina quando a publicação ficará visível no site.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                )}

                {/* Conteúdo da Aba Artigo */}
                {activeTab === "article" && (
                    <div className="space-y-5 pt-2 animate-in fade-in-50 duration-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Título</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Título do artigo"
                                                {...field}
                                                onChange={(e) => {
                                                    field.onChange(e);
                                                    const curSlug = form.getValues("slug");
                                                    const prevAuto = slugify(field.value);
                                                    if (!initialData && (!curSlug || curSlug === prevAuto)) {
                                                        form.setValue("slug", slugify(e.target.value), { shouldValidate: true });
                                                    }
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="slug"
                                render={({ field }) => {
                                    const isDuplicate = existingPosts?.some(
                                        (p: Post) => p.slug === field.value && p.id !== initialData?.id
                                    );
                                    return (
                                        <FormItem>
                                            <FormLabel className="flex items-center justify-between">
                                                <span>Slug (URL)</span>
                                                {isDuplicate && (
                                                    <span className="text-[10px] text-amber-600 font-semibold">
                                                        (Já existe: sufixo automático)
                                                    </span>
                                                )}
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="titulo-do-artigo"
                                                    {...field}
                                                    onChange={(e) => {
                                                        field.onChange(slugify(e.target.value));
                                                    }}
                                                />
                                            </FormControl>
                                            {isDuplicate && (
                                                <p className="text-[11px] text-amber-600">
                                                    Esse slug já existe em outro post. Ao salvar, um sufixo numérico será adicionado para não conflitar.
                                                </p>
                                            )}
                                            <FormMessage />
                                        </FormItem>
                                    );
                                }}
                            />
                        </div>

                        {/* Agendamento de Publicação */}
                        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
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
                                                className="bg-white max-w-md"
                                            />
                                        </FormControl>
                                        <FormDescription className="text-[11px]">
                                            Defina quando o artigo ficará visível no site.
                                        </FormDescription>
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
                    </div>
                )}

                {/* Rodapé Fixo de Ações com Alto Contraste e Responsividade */}
                <div className="sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-5 sm:px-8 py-4 -mx-5 sm:-mx-8 -mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[0_-4px_16px_rgba(0,0,0,0.05)] z-30">
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                        {onCancel && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onCancel}
                                className="text-slate-600 hover:text-slate-900 border-slate-300 font-medium"
                            >
                                Cancelar
                            </Button>
                        )}
                        <FormField
                            control={form.control}
                            name="isFeatured"
                            render={({ field }) => (
                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="isFeaturedSwitch"
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                    <Label htmlFor="isFeaturedSwitch" className="text-xs font-semibold text-slate-700 cursor-pointer flex items-center gap-1 select-none">
                                        <Star className={`w-3.5 h-3.5 ${field.value ? "text-amber-500 fill-amber-500" : "text-slate-400"}`} />
                                        Destacar na Home
                                    </Label>
                                </div>
                            )}
                        />
                    </div>

                    <Button
                        type="submit"
                        className={`w-full sm:w-auto min-w-[220px] text-white font-bold py-2.5 px-6 rounded-xl shadow-lg transition-all h-11 ${
                            activeTab === "instagram"
                                ? "bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] hover:opacity-95 shadow-pink-500/25"
                                : "bg-[#08454c] hover:bg-[#06373d] shadow-teal-900/20"
                        }`}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />
                                Salvando...
                            </>
                        ) : activeTab === "instagram" ? (
                            <span className="flex items-center justify-center gap-2 text-white font-bold">
                                <Instagram className="w-4 h-4 text-white" />
                                {initialData ? "Atualizar Post do Instagram" : "Publicar Post do Instagram"}
                            </span>
                        ) : (
                            <span className="flex items-center justify-center gap-2 text-white font-bold">
                                <FileText className="w-4 h-4 text-white" />
                                {initialData ? "Atualizar Artigo" : "Publicar Artigo Completo"}
                            </span>
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
