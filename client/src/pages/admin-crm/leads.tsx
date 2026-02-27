import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Lead, Contact, InsertLead, insertLeadSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, ArrowRight, Target, TrendingUp, Filter, Search } from "lucide-react";
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
import { Edit2, Trash2 } from "lucide-react";

const STATUSES = [
    { id: "new", label: "Novo Lead", color: "bg-blue-500", light: "bg-blue-50" },
    { id: "qualified", label: "Qualificado", color: "bg-purple-500", light: "bg-purple-50" },
    { id: "proposal", label: "Proposta", color: "bg-yellow-500", light: "bg-yellow-50" },
    { id: "negotiation", label: "Negociação", color: "bg-orange-500", light: "bg-orange-50" },
    { id: "closed", label: "Fechado", color: "bg-green-500", light: "bg-green-50" },
    { id: "lost", label: "Perdido", color: "bg-red-500", light: "bg-red-50" }
];

export default function LeadsPage() {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [editingLeadId, setEditingLeadId] = useState<number | null>(null);
    const [deleteLeadId, setDeleteLeadId] = useState<number | null>(null);

    const { data: leads, isLoading: leadsLoading } = useQuery<Lead[]>({
        queryKey: ["/api/leads"],
    });

    const { data: contacts } = useQuery<Contact[]>({
        queryKey: ["/api/contacts"],
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: number; status: string }) => {
            const res = await apiRequest("PATCH", `/api/leads/${id}/status`, { status });
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data: InsertLead) => {
            const res = await apiRequest("POST", "/api/leads", data);
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
            toast({ title: "Lead criado com sucesso" });
            setOpen(false);
        },
    });

    const updateLeadMutation = useMutation({
        mutationFn: async (data: Partial<InsertLead>) => {
            const res = await apiRequest("PATCH", `/api/leads/${editingLeadId}`, data);
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
            toast({ title: "Lead atualizado" });
            setOpen(false);
            setEditingLeadId(null);
        },
    });

    const deleteLeadMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/leads/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
            toast({ title: "Lead removido" });
            setDeleteLeadId(null);
        },
    });

    if (leadsLoading) {
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
                    <h2 className="text-3xl font-display font-bold text-gray-900">Funil de Vendas</h2>
                    <p className="text-muted-foreground mt-1">Gerencie seus negócios e acompanhe a conversão de leads.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Buscar lead..."
                            className="pl-9 h-10 w-64 rounded-xl border-gray-200"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button
                                onClick={() => {
                                    setEditingLeadId(null);
                                    setOpen(true);
                                }}
                                className="bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 h-10 px-6 font-bold"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Novo Negócio
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[450px] rounded-2xl border-none shadow-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-display font-bold tracking-tight">
                                    {editingLeadId ? "Editar Negócio" : "Iniciar Novo Negócio"}
                                </DialogTitle>
                            </DialogHeader>
                            <LeadForm
                                contacts={contacts || []}
                                initialData={editingLeadId ? leads?.find(l => l.id === editingLeadId) : undefined}
                                onSubmit={(data: InsertLead) => {
                                    if (editingLeadId) {
                                        updateLeadMutation.mutate(data);
                                    } else {
                                        createMutation.mutate(data);
                                    }
                                }}
                                isPending={createMutation.isPending || updateLeadMutation.isPending}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-elegant">
                {STATUSES.map((status) => (
                    <div key={status.id} className="flex-shrink-0 w-80 flex flex-col h-[calc(100vh-280px)]">
                        <div className="flex items-center justify-between mb-4 px-2">
                            <div className="flex items-center gap-2">
                                <div className={`h-2.5 w-2.5 rounded-full ${status.color}`} />
                                <h3 className="font-display font-bold text-gray-800 tracking-tight">{status.label}</h3>
                            </div>
                            <Badge variant="secondary" className="bg-gray-200 text-gray-600 border-none font-bold">
                                {leads?.filter(l => l.status === status.id).length || 0}
                            </Badge>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin">
                            {leads?.filter(l => l.status === status.id && (
                                search === "" ||
                                contacts?.find(c => c.id === l.contactId)?.name.toLowerCase().includes(search.toLowerCase())
                            )).map(lead => (
                                <LeadCard
                                    key={lead.id}
                                    lead={lead}
                                    contact={contacts?.find(c => c.id === lead.contactId)}
                                    onMove={(newStatus) => updateStatusMutation.mutate({ id: lead.id, status: newStatus })}
                                    onEdit={() => {
                                        setEditingLeadId(lead.id);
                                        setOpen(true);
                                    }}
                                    onDelete={() => setDeleteLeadId(lead.id)}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function LeadCard({
    lead,
    contact,
    onMove,
    onEdit,
    onDelete
}: {
    lead: Lead,
    contact?: Contact,
    onMove: (s: string) => void,
    onEdit: () => void,
    onDelete: () => void
}) {
    const nextStatus = STATUSES[STATUSES.findIndex(s => s.id === lead.status) + 1]?.id;
    const prevStatus = STATUSES[STATUSES.findIndex(s => s.id === lead.status) - 1]?.id;

    return (
        <div className="group bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all duration-300 hover:shadow-[0_4px_20px_rgb(0,0,0,0.08)] hover:-translate-y-1 relative">
            <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                    onClick={onEdit}
                >
                    <Edit2 className="h-3 w-3" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 rounded-lg text-red-300 hover:text-red-600 hover:bg-red-50"
                    onClick={onDelete}
                >
                    <Trash2 className="h-3 w-3" />
                </Button>
            </div>

            <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                    <h4 className="font-bold text-gray-900 line-clamp-1 pr-14">{contact?.name || "Desconhecido"}</h4>
                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{lead.source || "Direto"}</span>
                </div>
                <div className="text-secondary font-display font-black text-xs pt-1">
                    {lead.value ? `R$ ${lead.value}` : "Sob consulta"}
                </div>
            </div>

            <p className="text-xs text-gray-500 mb-5 line-clamp-2 leading-relaxed italic">
                "{lead.notes || "Sem observações adicionais..."}"
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <div className="flex gap-1.5 overflow-hidden">
                    {prevStatus && (
                        <button
                            onClick={() => onMove(prevStatus)}
                            className="h-7 w-7 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors"
                        >
                            <ArrowRight className="h-3 w-3 text-gray-400 rotate-180" />
                        </button>
                    )}
                </div>

                <div className="flex gap-2">
                    {nextStatus && (
                        <Button
                            variant="secondary"
                            size="sm"
                            className="h-7 px-3 text-[10px] font-bold bg-primary/5 hover:bg-primary/10 text-primary border-none"
                            onClick={() => onMove(nextStatus)}
                        >
                            Avançar
                            <ArrowRight className="ml-1.5 h-3 w-3" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

function LeadForm({ contacts, onSubmit, isPending, initialData }: any) {
    const form = useForm<InsertLead>({
        resolver: zodResolver(insertLeadSchema),
        defaultValues: initialData ? {
            ...initialData,
            value: initialData.value || "",
            source: initialData.source || "",
            notes: initialData.notes || "",
        } : {
            contactId: 0,
            status: "new",
            source: "",
            value: "",
            notes: "",
        },
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField
                    control={form.control}
                    name="contactId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-gray-600 font-bold">Contato / Cliente</FormLabel>
                            <Select
                                onValueChange={(val) => field.onChange(parseInt(val))}
                                defaultValue={field.value.toString()}
                                disabled={!!initialData}
                            >
                                <FormControl>
                                    <SelectTrigger className="rounded-xl h-11">
                                        <SelectValue placeholder="Selecione um contato" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {contacts.map((c: any) => (
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

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="source"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-gray-600 font-bold">Origem</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ex: Ads, Indicação" className="rounded-xl h-11" {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="value"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-gray-600 font-bold">Valor (R$)</FormLabel>
                                <FormControl>
                                    <Input placeholder="0,00" className="rounded-xl h-11" {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-gray-600 font-bold">Observações</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Detalhes do negócio..." className="rounded-xl min-h-[100px]" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button
                    type="submit"
                    className="w-full h-12 rounded-xl text-lg font-bold shadow-lg shadow-primary/20"
                    disabled={isPending}
                >
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {initialData ? "Salvar Alterações" : "Criar Negócio"}
                </Button>
            </form>
        </Form>
    );
}
