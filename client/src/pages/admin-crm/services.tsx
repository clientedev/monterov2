import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Service, InsertService, insertServiceSchema } from "@shared/schema";
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
import { Loader2, Plus, Trash2 } from "lucide-react";
import * as Icons from "lucide-react";

export default function ServicesPage() {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);

    const { data: services, isLoading } = useQuery<Service[]>({
        queryKey: ["/api/services"],
    });

    const createMutation = useMutation({
        mutationFn: async (data: InsertService) => {
            const res = await apiRequest("POST", "/api/services", data);
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/services"] });
            toast({ title: "Serviço criado com sucesso" });
            setOpen(false);
        },
        onError: (error: Error) => {
            toast({
                title: "Erro ao criar serviço",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/services/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/services"] });
            toast({ title: "Serviço excluído" });
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
                <h2 className="text-3xl font-bold tracking-tight">Serviços</h2>
                <CreateServiceDialog open={open} setOpen={setOpen} createMutation={createMutation} />
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Ícone</TableHead>
                            <TableHead>Título</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {services?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                    Nenhum serviço encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            services?.map((service) => {
                                // Dynamic icon rendering
                                const IconComponent = (Icons as any)[service.icon] || Icons.HelpCircle;
                                return (
                                    <TableRow key={service.id}>
                                        <TableCell>
                                            <div className="p-2 bg-primary/10 rounded-md w-fit">
                                                <IconComponent className="h-5 w-5 text-primary" />
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">{service.title}</TableCell>
                                        <TableCell className="max-w-md truncate" title={service.description}>
                                            {service.description}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    if (confirm("Tem certeza que deseja excluir este serviço?")) {
                                                        deleteMutation.mutate(service.id);
                                                    }
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
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

function CreateServiceDialog({ open, setOpen, createMutation }: any) {
    const form = useForm<InsertService>({
        resolver: zodResolver(insertServiceSchema),
        defaultValues: {
            title: "",
            description: "",
            icon: "Shield",
        },
    });

    const onSubmit = (data: InsertService) => {
        createMutation.mutate(data);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Serviço
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Novo Serviço</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Título</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Seguro Auto" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="icon"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome do Ícone (Lucide)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Shield, Car, Home..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    <p className="text-xs text-muted-foreground">
                                        Use nomes de ícones da biblioteca Lucide React (ex: Shield, Car, Home)
                                    </p>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descrição</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Breve descrição do serviço..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={createMutation.isPending}
                        >
                            {createMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Salvar
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
