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
import { Loader2, Plus, ArrowRight, Target, TrendingUp, Filter, Search, Maximize2, Minimize2 } from "lucide-react";
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
    const [isExpanded, setIsExpanded] = useState(false);

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
        <div className={`space-y-6 ${isExpanded ? "fixed inset-0 z-50 bg-[#f1f5f9] p-8 overflow-hidden flex flex-col transition-all duration-300" : ""}`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-display font-bold text-gray-900">Funil de Vendas</h2>
                    <p className="text-muted-foreground mt-1">Gerencie seus negócios e acompanhe a conversão de leads.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Button 
                        variant="outline" 
                        onClick={() => setIsExpanded(!isExpanded)} 
                        className="bg-white hover:bg-gray-50 border-gray-200 text-gray-700 h-10 px-4 rounded-xl shadow-sm"
                    >
                        {isExpanded ? <Minimize2 className="mr-2 h-4 w-4" /> : <Maximize2 className="mr-2 h-4 w-4" />}
                        {isExpanded ? "Reduzir Tela" : "Expandir Quadro"}
                    </Button>

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

            <div className={`flex gap-6 overflow-x-auto pb-6 scrollbar-elegant ${isExpanded ? "flex-1" : ""}`}>
                {STATUSES.map((status) => (
                    <div key={status.id} className={`flex-shrink-0 w-80 flex flex-col ${isExpanded ? "h-[calc(100vh-160px)]" : "h-[calc(100vh-280px)]"}`}>
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

            <AlertDialog open={!!deleteLeadId} onOpenChange={(open) => !open && setDeleteLeadId(null)}>
                <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza que deseja excluir?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O negócio e todo o seu histórico no funil serão removidos permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl border-gray-200">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteLeadId && deleteLeadMutation.mutate(deleteLeadId)}
                            className="bg-red-500 hover:bg-red-600 text-white rounded-xl border-none shadow-lg shadow-red-200"
                        >
                            {deleteLeadMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                "Confirmar Exclusão"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
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
        <div className="group bg-white p-5 rounded-xl border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-[#1A3A4F] opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm rounded-lg p-1 shadow-sm border border-gray-100">
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-100" onClick={onEdit}>
                    <Edit2 className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50" onClick={onDelete}>
                    <Trash2 className="h-3 w-3" />
                </Button>
            </div>

            <div className="flex justify-between items-start mb-4">
                <div className="flex-1 pr-12">
                    <h4 className="font-bold text-gray-900 line-clamp-1">{contact?.name || "Desconhecido"}</h4>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-gray-100 text-gray-600 mt-1">
                        {lead.source || "Direto"}
                    </span>
                </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-3 mb-4">
                <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Valor Estimado:</span>
                    <strong className="text-secondary font-display font-black text-sm text-right leading-none">
                        {lead.value ? `R$ ${lead.value}` : "Sob consulta"}
                    </strong>
                </div>
            </div>

            {lead.notes ? (
                <p className="text-xs text-gray-500 mb-4 line-clamp-2 leading-relaxed italic border-l-2 border-primary/20 pl-2">
                    "{lead.notes}"
                </p>
            ) : (
                <div className="h-4"></div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex gap-2">
                    {prevStatus && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 px-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                            onClick={() => onMove(prevStatus)}
                        >
                            <ArrowRight className="h-4 w-4 rotate-180" />
                        </Button>
                    )}
                </div>

                <div className="flex gap-2">
                    {nextStatus && (
                        <Button
                            variant="default"
                            size="sm"
                            className="h-8 px-4 text-[11px] font-bold bg-primary hover:bg-[#1A3A4F] text-white shadow-md shadow-primary/20 transition-all group-hover:shadow-lg"
                            onClick={() => onMove(nextStatus)}
                        >
                            Avançar
                            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
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
