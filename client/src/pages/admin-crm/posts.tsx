import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Post, InsertPost, insertPostSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
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
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Trash2, Pencil, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { ImageUpload } from "@/components/ImageUpload";
import { VideoUpload } from "@/components/VideoUpload";

export default function PostsPage() {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [editingPost, setEditingPost] = useState<Post | null>(null);

    const { data: posts, isLoading } = useQuery<Post[]>({
        queryKey: ["/api/posts"],
    });

    const createMutation = useMutation({
        mutationFn: async (data: InsertPost) => {
            const res = await apiRequest("POST", "/api/posts", data);
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
            toast({ title: "Post criado com sucesso" });
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
            toast({ title: "Post atualizado com sucesso" });
            setOpen(false);
            setEditingPost(null);
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
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Blog Posts</h2>
                <Button onClick={() => {
                    setEditingPost(null);
                    setOpen(true);
                }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Post
                </Button>
            </div>

            <Dialog open={open} onOpenChange={(val) => {
                setOpen(val);
                if (!val) setEditingPost(null);
            }}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingPost ? "Editar Post" : "Novo Post"}</DialogTitle>
                    </DialogHeader>
                    <PostForm
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

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Título</TableHead>
                            <TableHead>Slug</TableHead>
                            <TableHead>Data Publicação</TableHead>
                            <TableHead>Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {posts?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                    Nenhum post encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            posts?.map((post) => (
                                <TableRow key={post.id}>
                                    <TableCell className="font-medium">{post.title}</TableCell>
                                    <TableCell>{post.slug}</TableCell>
                                    <TableCell>
                                        {post.publishedAt ? format(new Date(post.publishedAt), "PPP") : "-"}
                                    </TableCell>
                                    <TableCell className="space-x-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                setEditingPost(post);
                                                setOpen(true);
                                            }}
                                        >
                                            <Pencil className="h-4 w-4 text-slate-500" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                if (confirm("Tem certeza que deseja excluir este post?")) {
                                                    deleteMutation.mutate(post.id);
                                                }
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
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

function PostForm({ initialData, onSubmit, isSubmitting }: any) {
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
        },
    });

    useEffect(() => {
        if (initialData) {
            form.reset({
                ...initialData,
                videoUrl: initialData.videoUrl || "",
                youtubeUrl: initialData.youtubeUrl || "",
            });
        } else {
            form.reset({
                title: "",
                slug: "",
                content: "",
                summary: "",
                coverImage: "",
                videoUrl: "",
                youtubeUrl: "",
            });
        }
    }, [initialData, form]);


    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Título</FormLabel>
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
                                <FormLabel>Slug (URL)</FormLabel>
                                <FormControl>
                                    <Input placeholder="titulo-do-post" {...field} />
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
                            <FormLabel>Resumo</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Breve resumo..." {...field} />
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
                            <FormLabel>Conteúdo</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Conteúdo do post..."
                                    className="min-h-[200px]"
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
                                    description="Será exibida como imagem principal do post."
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
                                <FormLabel>Vídeo (Upload)</FormLabel>
                                <FormControl>
                                    <VideoUpload
                                        value={field.value}
                                        onChange={field.onChange}
                                        description="Anexe um vídeo curto (Max. 5MB)."
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
                <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                >
                    {isSubmitting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {initialData ? "Atualizar Post" : "Publicar"}
                </Button>
            </form>
        </Form>
    );
}

