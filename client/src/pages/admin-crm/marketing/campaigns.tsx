import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Campaign, InsertCampaign, insertCampaignSchema } from "@shared/schema";
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
import { Loader2, Plus, Trash2, TrendingUp } from "lucide-react";
import { format } from "date-fns";

export default function CampaignsPage() {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);

    const { data: campaigns, isLoading } = useQuery<Campaign[]>({
        queryKey: ["/api/campaigns"],
    });

    const createMutation = useMutation({
        mutationFn: async (data: InsertCampaign) => {
            const res = await apiRequest("POST", "/api/campaigns", data);
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
            toast({ title: "Campanha criada com sucesso" });
            setOpen(false);
        },
        onError: (error: Error) => {
            toast({
                title: "Erro ao criar campanha",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/campaigns/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
            toast({ title: "Campanha excluída" });
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
                <div>
                    <h2 className="text-3xl font-display font-bold text-gray-900">Gerenciador de Campanhas</h2>
                    <p className="text-muted-foreground mt-1">Monitore suas campanhas de marketing em tempo real.</p>
                </div>
                <CreateCampaignDialog open={open} setOpen={setOpen} createMutation={createMutation} />
            </div>

            <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50/50">
                        <TableRow>
                            <TableHead>Status</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>Plataforma</TableHead>
                            <TableHead>Orçamento</TableHead>
                            <TableHead>Data Início</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {campaigns?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-32 text-muted-foreground">
                                    Nenhuma campanha ativa. <br />
                                    <span className="text-xs">Clique em "Nova Campanha" para começar.</span>
                                </TableCell>
                            </TableRow>
                        ) : (
                            campaigns?.map((campaign) => (
                                <TableRow key={campaign.id} className="hover:bg-gray-50/50">
                                    <TableCell>
                                        <Badge status={campaign.status} />
                                    </TableCell>
                                    <TableCell className="font-medium text-gray-900">
                                        {campaign.name}
                                    </TableCell>
                                    <TableCell>
                                        <PlatformIcon platform={campaign.platform} />
                                    </TableCell>
                                    <TableCell>
                                        {campaign.budget ? `R$ ${campaign.budget}` : "-"}
                                    </TableCell>
                                    <TableCell>
                                        {campaign.startDate ? format(new Date(campaign.startDate), "dd/MM/yyyy") : "-"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                if (confirm("Excluir esta campanha?")) {
                                                    deleteMutation.mutate(campaign.id);
                                                }
                                            }}
                                            className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-4 w-4" />
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

const Badge = ({ status }: { status: string }) => {
    const styles = {
        active: "bg-green-100 text-green-700 border-green-200",
        paused: "bg-yellow-100 text-yellow-700 border-yellow-200",
        completed: "bg-gray-100 text-gray-700 border-gray-200",
    };
    const labels = {
        active: "Ativo",
        paused: "Pausado",
        completed: "Concluído"
    };

    // Default to active if status is unknown
    const style = styles[status as keyof typeof styles] || styles.active;
    const label = labels[status as keyof typeof labels] || status;

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}>
            {label}
        </span>
    );
};

const PlatformIcon = ({ platform }: { platform: string }) => {
    const icons = {
        google: "🔵 Google Ads",
        facebook: "🔵 Facebook",
        instagram: "🟣 Instagram",
        email: "📧 Email",
        linkedin: "🔵 LinkedIn",
    };
    return <span className="text-sm">{(icons as any)[platform] || platform}</span>;
}

function CreateCampaignDialog({ open, setOpen, createMutation }: any) {
    const form = useForm<InsertCampaign>({
        resolver: zodResolver(insertCampaignSchema),
        defaultValues: {
            name: "",
            platform: "google",
            status: "active",
            budget: "",
        },
    });

    const onSubmit = (data: InsertCampaign) => {
        createMutation.mutate(data);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Campanha
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Criar Nova Campanha</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome da Campanha</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Promoção Seguro Auto" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="platform"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Plataforma</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="google">Google Ads</SelectItem>
                                                <SelectItem value="facebook">Facebook</SelectItem>
                                                <SelectItem value="instagram">Instagram</SelectItem>
                                                <SelectItem value="linkedin">LinkedIn</SelectItem>
                                                <SelectItem value="email">Email Marketing</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Status</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="active">Ativo</SelectItem>
                                                <SelectItem value="paused">Pausado</SelectItem>
                                                <SelectItem value="completed">Concluído</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="budget"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Orçamento (Opcional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="R$ 1000,00" {...field} value={field.value || ""} />
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
                            Criar Campanha
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
