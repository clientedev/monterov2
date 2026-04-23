import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Product, InsertProduct, insertProductSchema } from "@shared/schema";
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
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Package, Edit2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ProductsPage() {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [deleteProductId, setDeleteProductId] = useState<number | null>(null);

    const { data: products, isLoading } = useQuery<Product[]>({
        queryKey: ["/api/products"],
    });

    const form = useForm<InsertProduct>({
        resolver: zodResolver(insertProductSchema),
        defaultValues: {
            name: "",
            description: "",
            isActive: true,
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data: InsertProduct) => {
            const res = await apiRequest("POST", "/api/products", data);
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/products"] });
            toast({ title: "Produto criado com sucesso" });
            setOpen(false);
            form.reset();
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (data: Partial<InsertProduct>) => {
            const res = await apiRequest("PATCH", `/api/products/${editingProduct?.id}`, data);
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/products"] });
            toast({ title: "Produto atualizado" });
            setOpen(false);
            setEditingProduct(null);
            form.reset();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/products/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/products"] });
            toast({ title: "Produto removido" });
            setDeleteProductId(null);
        },
    });

    const onSubmit = (data: InsertProduct) => {
        if (editingProduct) {
            updateMutation.mutate(data);
        } else {
            createMutation.mutate(data);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-display font-bold text-gray-900 tracking-tight">Catálogo de Produtos</h2>
                    <p className="text-muted-foreground mt-1">Gerencie os seguros e benefícios disponíveis para venda.</p>
                </div>

                <Dialog open={open} onOpenChange={(val) => {
                    setOpen(val);
                    if (!val) {
                        setEditingProduct(null);
                        form.reset();
                    }
                }}>
                    <DialogTrigger asChild>
                        <Button className="bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 h-11 px-6 font-bold">
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Produto
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[450px] rounded-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-display font-bold">
                                {editingProduct ? "Editar Produto" : "Novo Produto"}
                            </DialogTitle>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold text-slate-700">Nome do Produto</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ex: Plano de Saúde Empresarial" className="rounded-xl h-11" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold text-slate-700">Descrição</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Breve descrição do produto..." className="rounded-xl min-h-[100px]" {...field} value={field.value || ""} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="isActive"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-xl border p-4 bg-slate-50/50">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base font-bold text-slate-700">Ativo</FormLabel>
                                                <p className="text-xs text-slate-500">Disponível para seleção no funil.</p>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <Button
                                    type="submit"
                                    className="w-full h-12 rounded-xl text-lg font-bold shadow-lg shadow-primary/20"
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                >
                                    {(createMutation.isPending || updateMutation.isPending) && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    {editingProduct ? "Salvar Alterações" : "Criar Produto"}
                                </Button>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-2xl border bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50/80">
                        <TableRow>
                            <TableHead className="py-4 font-bold text-gray-600">Produto</TableHead>
                            <TableHead className="py-4 font-bold text-gray-600">Descrição</TableHead>
                            <TableHead className="py-4 font-bold text-gray-600">Status</TableHead>
                            <TableHead className="py-4 text-right font-bold text-gray-600">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-32 text-muted-foreground">
                                    <div className="flex flex-col items-center gap-2">
                                        <Package className="h-8 w-8 opacity-20" />
                                        <p>Nenhum produto cadastrado.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            products?.map((product) => (
                                <TableRow key={product.id} className="group">
                                    <TableCell className="font-bold text-slate-900 py-4">{product.name}</TableCell>
                                    <TableCell className="text-slate-500 py-4 max-w-md truncate">{product.description || "—"}</TableCell>
                                    <TableCell className="py-4">
                                        <Badge variant={product.isActive ? "default" : "secondary"} className={product.isActive ? "bg-emerald-50 text-emerald-600 border-none" : "bg-slate-100 text-slate-400 border-none"}>
                                            {product.isActive ? "Ativo" : "Inativo"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right py-4">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-slate-400 hover:text-slate-900"
                                                onClick={() => {
                                                    setEditingProduct(product);
                                                    form.reset(product);
                                                    setOpen(true);
                                                }}
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-400 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => setDeleteProductId(product.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog open={deleteProductId !== null} onOpenChange={() => setDeleteProductId(null)}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Produto?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Isso removerá o produto do catálogo. Leads associados a este produto manterão o nome do produto salvo, mas ele não aparecerá mais para novas seleções.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
                            onClick={() => deleteProductId && deleteMutation.mutate(deleteProductId)}
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
