import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Interaction, InsertInteraction, insertInteractionSchema, Contact, Lead } from "@shared/schema";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus } from "lucide-react";
import { format } from "date-fns";

export default function InteractionsPage() {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);

    const { data: interactions, isLoading: interactionsLoading } = useQuery<Interaction[]>({
        queryKey: ["/api/interactions"],
    });

    const { data: contacts } = useQuery<Contact[]>({
        queryKey: ["/api/contacts"],
    });

    const { data: leads } = useQuery<Lead[]>({
        queryKey: ["/api/leads"],
    });

    const form = useForm<InsertInteraction>({
        resolver: zodResolver(insertInteractionSchema),
        defaultValues: {
            type: "call",
            description: "",
            date: new Date(),
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data: InsertInteraction) => {
            const res = await apiRequest("POST", "/api/interactions", data);
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/interactions"] });
            toast({ title: "Interação registrada com sucesso" });
            setOpen(false);
            form.reset();
        },
        onError: (error: Error) => {
            toast({
                title: "Falha ao registrar interação",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const onSubmit = (data: InsertInteraction) => {
        createMutation.mutate(data);
    };

    if (interactionsLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const getContactName = (id: number) => contacts?.find(c => c.id === id)?.name || "Desconhecido";

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Interações</h2>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Registrar Interação
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Registrar Nova Interação</DialogTitle>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="contactId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Contato</FormLabel>
                                            <Select
                                                onValueChange={(val) => field.onChange(parseInt(val))}
                                                defaultValue={field.value?.toString()}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione um contato" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {contacts?.map((c) => (
                                                        <SelectItem key={c.id} value={c.id.toString()}>
                                                            {c.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Optional Lead Association */}
                                <FormField
                                    control={form.control}
                                    name="leadId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Lead Associado (Opcional)</FormLabel>
                                            <Select
                                                onValueChange={(val) => field.onChange(parseInt(val))}
                                                defaultValue={field.value?.toString()}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione um lead" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {leads?.map((l) => {
                                                        const contactName = getContactName(l.contactId);
                                                        return (
                                                            <SelectItem key={l.id} value={l.id.toString()}>
                                                                Lead #{l.id} - {contactName} ({l.status})
                                                            </SelectItem>
                                                        );
                                                    })}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tipo</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione o tipo" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="call">Ligação</SelectItem>
                                                    <SelectItem value="email">Email</SelectItem>
                                                    <SelectItem value="meeting">Reunião</SelectItem>
                                                    <SelectItem value="note">Nota</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
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
                                                <Textarea
                                                    placeholder="Detalhes sobre a interação..."
                                                    className="resize-none"
                                                    {...field}
                                                />
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
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Contato</TableHead>
                            <TableHead>Descrição</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {interactions?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                    Nenhuma interação encontrada.
                                </TableCell>
                            </TableRow>
                        ) : (
                            interactions?.map((interaction) => (
                                <TableRow key={interaction.id}>
                                    <TableCell>
                                        {interaction.date ? format(new Date(interaction.date), "PPP p") : "-"}
                                    </TableCell>
                                    <TableCell className="capitalize">{interaction.type}</TableCell>
                                    <TableCell>{getContactName(interaction.contactId)}</TableCell>
                                    <TableCell className="max-w-md truncate" title={interaction.description}>
                                        {interaction.description}
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
