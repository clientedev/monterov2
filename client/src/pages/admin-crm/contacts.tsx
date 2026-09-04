import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Contact, InsertContact, insertContactSchema, Lead, Product } from "@shared/schema";

// Calculate age from "DD/MM/AAAA" string
function calcAge(dateStr: string | null | undefined): number | null {
    if (!dateStr) return null;
    const parts = dateStr.split("/");
    if (parts.length !== 3) return null;
    const [day, month, year] = parts.map(Number);
    if (!year || year < 1900 || year > new Date().getFullYear()) return null;
    const today = new Date();
    let age = today.getFullYear() - year;
    if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) age--;
    return age >= 0 ? age : null;
}
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
    DialogDescription,
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
import { Loader2, Plus, Users, Building, User, UserPlus, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ContactProfile } from "@/components/ContactProfile";
import * as XLSX from "xlsx";
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
import { Edit2, FileDown, FileSpreadsheet, Trash2, Sparkles } from "lucide-react";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ProductSelector, STANDARD_PRODUCTS } from "@/components/ProductSelector";

export default function ContactsPage() {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [selectedContactId, setSelectedContactId] = useState<number | null>(null);
    const [profileOpen, setProfileOpen] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [importData, setImportData] = useState<any[]>([]);
    const [isImporting, setIsImporting] = useState(false);
    const [isEditing, setIsEditing] = useState<number | null>(null);
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

    // ── Filters ────────────────────────────────────────────────────────────────
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [filterProduct, setFilterProduct] = useState<string>("all");

    // ── "Adicionar responsável" mini-dialog state ────────────────────────────
    const [addResponsibleOpen, setAddResponsibleOpen] = useState(false);
    const [newResponsibleName, setNewResponsibleName] = useState("");
    const [newResponsiblePhone, setNewResponsiblePhone] = useState("");
    const [newResponsibleEmail, setNewResponsibleEmail] = useState("");
    const [isSavingResponsible, setIsSavingResponsible] = useState(false);

    const { data: contacts, isLoading } = useQuery<Contact[]>({
        queryKey: ["/api/contacts"],
    });

    const { data: allLeads } = useQuery<Lead[]>({
        queryKey: ["/api/leads"],
    });

    // Map contactId → unique product names from their leads
    const productsByContact = useMemo(() => {
        const map = new Map<number, string[]>();
        if (!allLeads) return map;
        for (const lead of allLeads) {
            if (!lead.product) continue;
            const existing = map.get(lead.contactId) ?? [];
            if (!existing.includes(lead.product)) {
                existing.push(lead.product);
                map.set(lead.contactId, existing);
            }
        }
        return map;
    }, [allLeads]);

    const updateMutation = useMutation({
        mutationFn: async (data: Partial<InsertContact>) => {
            const res = await apiRequest("PATCH", `/api/contacts/${isEditing}`, data);
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
            toast({ title: "Contato atualizado" });
            setOpen(false);
            setIsEditing(null);
            form.reset();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/contacts/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
            toast({ title: "Contato removido" });
            setDeleteTargetId(null);
        },
    });

    const deduplicateMutation = useMutation({
        mutationFn: async () => {
            const res = await apiRequest("POST", "/api/contacts/deduplicate");
            return await res.json();
        },
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
            toast({
                title: "Higienização de Duplicatas Concluída",
                description: `${data.mergedCount || 0} contatos duplicados foram unificados.`,
            });
        },
    });

    const downloadTemplate = () => {
        const template = [
            { tipo: "individual", nome: "João Silva", email: "joao@exemplo.com", telefone: "(11) 99999-9999", documento: "123.456.789-00", endereco: "Rua Exemplo, 123" },
            { tipo: "company", nome: "Monteiro Seguros", email: "contato@monteiro.com", telefone: "(11) 4444-4444", documento: "12.345.678/0001-99", endereco: "Av. Paulista, 1000" }
        ];
        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Contatos");
        XLSX.writeFile(wb, "modelo_contatos_monteiro.xlsx");
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: "binary" });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);
            setImportData(data);
        };
        reader.readAsBinaryString(file);
    };

    const runImport = async () => {
        setIsImporting(true);
        try {
            const res = await apiRequest("POST", "/api/contacts/import", importData);
            const data = await res.json();
            queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
            toast({
                title: "Importação concluída com sucesso",
                description: `${data.created || 0} novos contatos criados, ${data.updated || 0} contatos atualizados (sem duplicatas), ${data.errors || 0} falhas.`,
            });
        } catch (err: any) {
            toast({
                title: "Falha na importação",
                description: err.message || "Erro ao importar dados",
                variant: "destructive",
            });
        } finally {
            setIsImporting(false);
            setImportData([]);
            setShowImport(false);
        }
    };

    const form = useForm<InsertContact>({
        resolver: zodResolver(insertContactSchema),
        defaultValues: {
            type: "individual",
            name: "",
            email: "",
            phone: "",
            document: "",
            address: "",
            responsibleName: "",
            responsibleId: undefined,
            anniversaryDate: "",
            maritalStatus: "",
            productType: "",
            status: "Ativo",
        },
    });

    const watchedAnniversary = form.watch("anniversaryDate");

    const createMutation = useMutation({
        mutationFn: async (data: InsertContact) => {
            const res = await apiRequest("POST", "/api/contacts", data);
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
            toast({ title: "Contato criado com sucesso" });
            setOpen(false);
            form.reset();
        },
        onError: (error: Error) => {
            toast({
                title: "Falha ao criar contato",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const [isSearchingCnpj, setIsSearchingCnpj] = useState(false);

    const lookupCnpj = async (rawCnpj: string) => {
        const cnpj = rawCnpj.replace(/\D/g, "");
        if (!cnpj || cnpj.length < 14) {
            toast({ title: "Digite um CNPJ com 14 dígitos", description: `Você digitou ${cnpj.length} dígitos`, variant: "destructive" });
            return;
        }

        setIsSearchingCnpj(true);
        try {
            const res = await fetch(`/api/proxy/cnpj/${cnpj}`);
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || "Erro ao consultar CNPJ");
            }

            const data = await res.json();
            form.setValue("name", data.name || "");
            if (data.email) form.setValue("email", data.email);
            if (data.phone) form.setValue("phone", data.phone);
            if (data.address) form.setValue("address", data.address);

            toast({ title: "✅ Dados recuperados com sucesso!" });
        } catch (error: any) {
            toast({
                title: "Falha na busca",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsSearchingCnpj(false);
        }
    };

    const onSubmit = (data: InsertContact) => {
        if (isEditing) {
            updateMutation.mutate(data);
        } else {
            createMutation.mutate(data);
        }
    };

    // ── "Adicionar responsável" quick-create handler ──────────────────────────
    const handleAddResponsible = async () => {
        if (!newResponsibleName.trim()) {
            toast({ title: "Nome é obrigatório", variant: "destructive" });
            return;
        }
        setIsSavingResponsible(true);
        try {
            const res = await apiRequest("POST", "/api/contacts", {
                type: "individual",
                name: newResponsibleName.trim(),
                phone: newResponsiblePhone.trim() || null,
                email: newResponsibleEmail.trim() || null,
            });
            if (!res.ok) throw new Error((await res.json()).message || "Erro");
            const newContact: Contact = await res.json();

            await queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });

            // Auto-select the newly created responsible
            form.setValue("responsibleId", newContact.id);
            form.setValue("responsibleName", newContact.name);

            toast({ title: `✅ Responsável "${newContact.name}" adicionado e selecionado!` });
            setAddResponsibleOpen(false);
            setNewResponsibleName("");
            setNewResponsiblePhone("");
            setNewResponsibleEmail("");
        } catch (error: any) {
            toast({ title: "Erro ao criar responsável", description: error.message, variant: "destructive" });
        } finally {
            setIsSavingResponsible(false);
        }
    };

    const clientType = form.watch("type");

    // ── Filtered contacts ──────────────────────────────────────────────────────
    const filteredContacts = useMemo(() => {
        const q = search.toLowerCase().trim();
        return (contacts ?? []).filter(c => {
            const matchType = filterType === "all" || c.type === filterType;
            const matchStatus = filterStatus === "all" || (c.status || "Ativo") === filterStatus;
            
            const contactProds = (c.productType || "")
                .split(",")
                .map(p => p.trim())
                .concat(productsByContact.get(c.id) ?? []);

            const matchProduct = filterProduct === "all" || contactProds.some(p => {
                if (filterProduct === "Outro") {
                    return p.toLowerCase().includes("outro") || (p && !STANDARD_PRODUCTS.includes(p as any));
                }
                return p.toLowerCase().includes(filterProduct.toLowerCase());
            });

            const matchSearch = !q ||
                c.name.toLowerCase().includes(q) ||
                (c.email || "").toLowerCase().includes(q) ||
                (c.phone || "").includes(q) ||
                (c.document || "").includes(q) ||
                (c.responsibleName || "").toLowerCase().includes(q) ||
                (c.productType || "").toLowerCase().includes(q);

            return matchType && matchStatus && matchProduct && matchSearch;
        });
    }, [contacts, search, filterType, filterStatus, filterProduct, productsByContact]);

    // Build options for SearchableSelect (individual contacts only, for responsável)
    const individualContactOptions = useMemo(() => {
        return (contacts ?? [])
            .filter((c) => c.type === "individual")
            .map((c) => ({
                value: String(c.id),
                label: c.name,
                sublabel: c.phone ?? undefined,
            }));
    }, [contacts]);

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
                    <h2 className="text-3xl font-display font-bold text-gray-900 tracking-tight">Base de Contatos</h2>
                    <p className="text-muted-foreground mt-1">Gerencie pessoas físicas e jurídicas em um único lugar.</p>
                </div>

                <div className="flex items-center gap-3">
                    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setIsEditing(null); form.reset(); } }}>
                        <DialogTrigger asChild>
                            <Button className="bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 h-11 px-6 font-bold">
                                <Plus className="mr-2 h-4 w-4" />
                                Adicionar Contato
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[650px] w-full max-w-[95vw] rounded-3xl border-none shadow-2xl overflow-hidden p-0 max-h-[90vh] flex flex-col bg-white">
                            <DialogHeader className="p-6 pb-4 bg-slate-50 border-b shrink-0">
                                <DialogTitle className="text-2xl font-display font-bold text-gray-900">{isEditing ? "Editar Contato" : "Novo Contato"}</DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground mt-1">
                                    {isEditing ? "Altere as informações do contato abaixo e salve as alterações." : "Preencha os dados abaixo para cadastrar um novo contato."}
                                </DialogDescription>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-5">
                                    {/* ── Section 1: Dados do Cliente ────────────────── */}
                                    <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-4">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">1. Dados do Cliente</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="type"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-gray-600 font-bold">Tipo de Cliente</FormLabel>
                                                        <Select
                                                            onValueChange={field.onChange}
                                                            value={field.value || "individual"}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger className="rounded-xl h-11 bg-white">
                                                                    <SelectValue placeholder="Selecione o tipo" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="individual">Pessoa Física (PF)</SelectItem>
                                                                <SelectItem value="company">Pessoa Jurídica (PJ)</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {clientType === "company" ? (
                                                <div className="flex gap-2 items-end">
                                                    <FormField
                                                        control={form.control}
                                                        name="document"
                                                        render={({ field }) => (
                                                            <FormItem className="flex-1">
                                                                <FormLabel className="text-gray-600 font-bold">CNPJ</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder="00.000.000/0000-00"
                                                                        className="rounded-xl h-11 bg-white"
                                                                        {...field}
                                                                        value={field.value || ""}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="h-11 rounded-xl px-4 font-bold border-primary text-primary hover:bg-primary/5 mb-[2px] bg-white"
                                                        onClick={() => lookupCnpj(form.getValues("document") || "")}
                                                        disabled={isSearchingCnpj}
                                                    >
                                                        {isSearchingCnpj ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            "Buscar"
                                                        )}
                                                    </Button>
                                                </div>
                                            ) : (
                                                <FormField
                                                    control={form.control}
                                                    name="document"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-gray-600 font-bold">CPF</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="000.000.000-00"
                                                                    className="rounded-xl h-11 bg-white"
                                                                    {...field}
                                                                    value={field.value || ""}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            )}
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-gray-600 font-bold">Nome Completo / Razão Social *</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Ex: João Silva ou Monteiro Seguros LTDA" className="rounded-xl h-11 bg-white" {...field} value={field.value || ""} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="anniversaryDate"
                                                render={({ field }) => {
                                                    const age = calcAge(watchedAnniversary);
                                                    return (
                                                        <FormItem>
                                                            <FormLabel className="text-gray-600 font-bold">Data Comemorativa (DD/MM/AAAA)</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="Ex: 15/08/1990" className="rounded-xl h-11 bg-white" {...field} value={field.value || ""} />
                                                            </FormControl>
                                                            {age !== null && (
                                                                <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                                                                    🎂 {age} anos
                                                                </span>
                                                            )}
                                                            <FormMessage />
                                                        </FormItem>
                                                    );
                                                }}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="maritalStatus"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-gray-600 font-bold">Estado Civil</FormLabel>
                                                        <Select
                                                            onValueChange={field.onChange}
                                                            value={field.value || ""}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger className="rounded-xl h-11 bg-white">
                                                                    <SelectValue placeholder="Selecione" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                                                                <SelectItem value="casado">Casado(a)</SelectItem>
                                                                <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                                                                <SelectItem value="viuvo">Viúvo(a)</SelectItem>
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
                                                        <FormLabel className="text-gray-600 font-bold">Status do Cliente</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value || "Ativo"}>
                                                            <FormControl>
                                                                <SelectTrigger className="rounded-xl h-11 bg-white">
                                                                    <SelectValue placeholder="Selecione o status" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="Ativo">Ativo</SelectItem>
                                                                <SelectItem value="Prospects">Prospects</SelectItem>
                                                                <SelectItem value="Cancelado">Cancelado</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    {/* ── Section 2: Responsável (PJ) ────────────────── */}
                                    {clientType === "company" && (
                                        <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-3">
                                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">2. Pessoa Responsável</h4>
                                            <FormField
                                                control={form.control}
                                                name="responsibleId"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <div className="flex items-center justify-between">
                                                            <FormLabel className="text-gray-600 font-bold">
                                                                Pessoa Responsável *
                                                            </FormLabel>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-7 px-2 text-primary hover:bg-primary/5 text-xs font-bold gap-1"
                                                                onClick={() => setAddResponsibleOpen(true)}
                                                            >
                                                                <UserPlus className="h-3.5 w-3.5" />
                                                                Adicionar responsável
                                                            </Button>
                                                        </div>
                                                        <FormControl>
                                                            <SearchableSelect
                                                                options={individualContactOptions}
                                                                value={field.value?.toString() ?? ""}
                                                                onValueChange={(val) => {
                                                                    if (!val) return;
                                                                    const id = parseInt(val);
                                                                    field.onChange(id);
                                                                    const selected = contacts?.find(c => c.id === id);
                                                                    if (selected) form.setValue("responsibleName", selected.name);
                                                                }}
                                                                placeholder="Selecione ou pesquise um contato..."
                                                                searchPlaceholder="Pesquisar pelo nome ou telefone..."
                                                                triggerClassName="border-primary/20 bg-white"
                                                                clearable
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="responsibleName"
                                                render={({ field }) => (
                                                    <input type="hidden" {...field} value={field.value || ""} />
                                                )}
                                            />
                                        </div>
                                    )}

                                    {/* ── Section 3: Produtos ───────────────────────── */}
                                    <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-3">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            {clientType === "company" ? "3. Produtos de Interesse" : "2. Produtos de Interesse"}
                                        </h4>
                                        <FormField
                                            control={form.control}
                                            name="productType"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <ProductSelector value={field.value || ""} onChange={field.onChange} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* ── Section 4: Contato ────────────────────────── */}
                                    <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-4">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            {clientType === "company" ? "4. Meios de Contato" : "3. Meios de Contato"}
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="email"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-gray-600 font-bold">Email</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="email"
                                                                placeholder="contato@exemplo.com"
                                                                className="rounded-xl h-11 bg-white"
                                                                {...field}
                                                                value={field.value || ""}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="phone"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-gray-600 font-bold">Telefone / WhatsApp</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="(11) 99999-9999"
                                                                className="rounded-xl h-11 bg-white"
                                                                {...field}
                                                                value={field.value || ""}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full h-12 rounded-xl text-lg font-bold shadow-lg shadow-primary/20"
                                        disabled={createMutation.isPending || updateMutation.isPending}
                                    >
                                        {(createMutation.isPending || updateMutation.isPending) && (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        {isEditing ? "Salvar Alterações" : "Salvar Contato"}
                                    </Button>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>

                    <Button
                        variant="outline"
                        onClick={() => deduplicateMutation.mutate()}
                        disabled={deduplicateMutation.isPending}
                        className="h-11 px-4 font-bold rounded-xl border-dashed border-2 hover:bg-amber-50 transition-all border-amber-300 text-amber-700 gap-2"
                        title="Varrer a base e unir cadastros idênticos"
                    >
                        {deduplicateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-amber-500" />}
                        Higienizar Duplicatas
                    </Button>

                    <Button
                        variant="outline"
                        onClick={() => setShowImport(true)}
                        className="h-11 px-6 font-bold rounded-xl border-dashed border-2 hover:bg-slate-50 transition-all border-slate-300 text-slate-600"
                    >
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        Importar Excel
                    </Button>
                </div>
            </div>

            {/* ── Filter Bar ─────────────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        className="w-full pl-9 pr-9 h-10 rounded-lg border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        placeholder="Buscar por nome, e-mail, telefone ou documento..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    {search && (
                        <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-full sm:w-40 h-10 text-sm">
                        <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os tipos</SelectItem>
                        <SelectItem value="individual">Pessoa Física</SelectItem>
                        <SelectItem value="company">Pessoa Jurídica</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full sm:w-36 h-10 text-sm">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os Status</SelectItem>
                        <SelectItem value="Ativo">Ativo</SelectItem>
                        <SelectItem value="Prospects">Prospects</SelectItem>
                        <SelectItem value="Cancelado">Cancelado</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={filterProduct} onValueChange={setFilterProduct}>
                    <SelectTrigger className="w-full sm:w-44 h-10 text-sm">
                        <SelectValue placeholder="Produto" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os Produtos</SelectItem>
                        {STANDARD_PRODUCTS.map((prod) => (
                            <SelectItem key={prod} value={prod}>{prod}</SelectItem>
                        ))}
                        <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {filteredContacts.length} de {contacts?.length ?? 0}
                </span>
            </div>

            {/* ── Contacts Table ──────────────────────────────────────────────── */}
            <div className="rounded-2xl border bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50/80">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="py-4 font-bold text-gray-600">Identificação</TableHead>
                            <TableHead className="py-4 font-bold text-gray-600">Status</TableHead>
                            <TableHead className="py-4 font-bold text-gray-600">Produto</TableHead>
                            <TableHead className="py-4 font-bold text-gray-600">Responsável</TableHead>
                            <TableHead className="py-4 font-bold text-gray-600">Email</TableHead>
                            <TableHead className="py-4 font-bold text-gray-600">Telefone</TableHead>
                            <TableHead className="py-4 text-right font-bold text-gray-600">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredContacts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-32 text-muted-foreground">
                                    <div className="flex flex-col items-center gap-2">
                                        <Users className="h-8 w-8 opacity-20" />
                                        <p>{contacts?.length === 0 ? "Nenhum contato cadastrado ainda." : "Nenhum contato encontrado com os filtros aplicados."}</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredContacts.map((contact) => {
                                const products = productsByContact.get(contact.id) ?? [];
                                return (
                                    <TableRow key={contact.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <TableCell className="font-bold text-gray-900 py-4">
                                            <div
                                                className="flex items-center gap-3 cursor-pointer group/name text-gray-900 hover:text-primary transition-colors w-fit"
                                                onClick={() => {
                                                    setSelectedContactId(contact.id);
                                                    setProfileOpen(true);
                                                }}
                                                title="Clique para ver o perfil do contato"
                                            >
                                                <div className={`h-9 w-9 rounded-full flex items-center justify-center text-white font-bold transition-transform group-hover/name:scale-105 shrink-0
                                                    ${contact.type === 'individual' ? 'bg-primary/80' : 'bg-secondary/80'}
                                                `}>
                                                    {contact.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="group-hover/name:underline">{contact.name}</span>
                                            </div>
                                        </TableCell>

                                        {/* ── Status Column ──────────────────────────────────────── */}
                                        <TableCell className="py-4">
                                            <Badge
                                                variant="outline"
                                                className={`rounded-full py-0.5 px-3 font-bold text-[11px] uppercase tracking-wider border ${
                                                    contact.status === "Ativo" || !contact.status
                                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                        : contact.status === "Prospects"
                                                        ? "bg-blue-50 text-blue-700 border-blue-200"
                                                        : "bg-rose-50 text-rose-700 border-rose-200"
                                                }`}
                                            >
                                                {contact.status || "Ativo"}
                                            </Badge>
                                        </TableCell>

                                        {/* ── Products / type column ─────────────────────────────── */}
                                        <TableCell className="py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {products.length > 0 ? (
                                                    <>
                                                        {products.slice(0, 3).map((prod) => (
                                                            <Badge key={prod} variant="outline"
                                                                className="rounded-lg py-0.5 px-2.5 border-none bg-primary/10 text-primary font-bold text-[10px] uppercase tracking-wider">
                                                                {prod}
                                                            </Badge>
                                                        ))}
                                                        {products.length > 3 && (
                                                            <Badge variant="outline" className="rounded-lg py-0.5 px-2 border border-dashed text-[10px] text-gray-400">
                                                                +{products.length - 3}
                                                            </Badge>
                                                        )}
                                                    </>
                                                ) : contact.productType ? (
                                                    contact.productType.split(",").map(pt => pt.trim()).filter(Boolean).map(pt => (
                                                        <Badge key={pt} variant="outline"
                                                            className="rounded-lg py-0.5 px-2.5 border-none bg-amber-50 text-amber-700 font-bold text-[10px] uppercase tracking-wider">
                                                            {pt}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <Badge variant="outline"
                                                        className={`rounded-lg py-1 px-3 border-none flex items-center w-fit gap-1.5 font-bold text-[10px] uppercase tracking-wider
                                                            ${contact.type === 'individual' ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                                        {contact.type === 'individual' ? <User className="h-3 w-3" /> : <Building className="h-3 w-3" />}
                                                        {contact.type === 'individual' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                                                    </Badge>
                                                )}
                                                {/* Age badge */}
                                                {(() => { const age = calcAge(contact.anniversaryDate); return age !== null ? (
                                                    <Badge variant="outline"
                                                        className="rounded-lg py-0.5 px-2 border-none bg-rose-50 text-rose-600 font-bold text-[10px]">
                                                        🎂 {age} anos
                                                    </Badge>
                                                ) : null; })()}
                                            </div>
                                        </TableCell>

                                        <TableCell className="text-gray-600 font-medium py-4">
                                            {contact.type === 'company' ? (
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-1.5">
                                                        {contact.responsibleId ? (
                                                            <button
                                                                type="button"
                                                                className="font-bold text-slate-800 hover:text-primary hover:underline transition-colors text-left cursor-pointer"
                                                                onClick={() => {
                                                                    setSelectedContactId(contact.responsibleId!);
                                                                    setProfileOpen(true);
                                                                }}
                                                                title="Clique para ver o perfil do responsável"
                                                            >
                                                                {contact.responsibleName || "Não inf."}
                                                            </button>
                                                        ) : (
                                                            <span className="font-bold text-slate-800">{contact.responsibleName || "Não inf."}</span>
                                                        )}
                                                        {contact.responsibleId && (
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200">
                                                                Vinculado
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] text-slate-400 uppercase tracking-tighter">Doc: {contact.document || "—"}</span>
                                                </div>
                                            ) : (
                                                contact.document || "—"
                                            )}
                                        </TableCell>
                                        <TableCell className="text-gray-500 py-4">{contact.email || "—"}</TableCell>
                                        <TableCell className="text-gray-500 py-4">{contact.phone || "—"}</TableCell>
                                        <TableCell className="text-right py-4">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg p-2"
                                                    onClick={() => {
                                                        form.reset({
                                                            type: contact.type || "individual",
                                                            name: contact.name || "",
                                                            email: contact.email || "",
                                                            phone: contact.phone || "",
                                                            document: contact.document || "",
                                                            address: contact.address || "",
                                                            responsibleName: contact.responsibleName || "",
                                                            responsibleId: contact.responsibleId ?? undefined,
                                                            anniversaryDate: contact.anniversaryDate || "",
                                                            maritalStatus: contact.maritalStatus || "",
                                                            productType: contact.productType || "",
                                                            status: (contact.status as any) || "Ativo",
                                                        });
                                                        setIsEditing(contact.id);
                                                        setOpen(true);
                                                    }}
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="font-bold text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg p-2"
                                                    onClick={() => setDeleteTargetId(contact.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="font-bold text-primary hover:bg-primary/5 rounded-lg"
                                                    onClick={() => {
                                                        setSelectedContactId(contact.id);
                                                        setProfileOpen(true);
                                                    }}
                                                >
                                                    Ver Perfil
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            <ContactProfile
                contactId={selectedContactId}
                open={profileOpen}
                onOpenChange={setProfileOpen}
            />

            {/* ── "Adicionar responsável" mini-dialog ────────────────────────── */}
            <Dialog open={addResponsibleOpen} onOpenChange={setAddResponsibleOpen}>
                <DialogContent className="sm:max-w-[380px] rounded-2xl border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-display font-bold flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-primary" />
                            Novo Responsável
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 pt-2">
                        <p className="text-sm text-muted-foreground">
                            Cadastre rapidamente o responsável. Ele será adicionado à base de contatos e selecionado automaticamente.
                        </p>
                        <div className="space-y-1">
                            <label className="text-sm font-bold text-gray-700">Nome *</label>
                            <Input
                                placeholder="Nome completo"
                                className="rounded-xl h-11"
                                value={newResponsibleName}
                                onChange={(e) => setNewResponsibleName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-bold text-gray-700">Telefone</label>
                            <Input
                                placeholder="(11) 99999-9999"
                                className="rounded-xl h-11"
                                value={newResponsiblePhone}
                                onChange={(e) => setNewResponsiblePhone(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-bold text-gray-700">Email</label>
                            <Input
                                type="email"
                                placeholder="email@exemplo.com"
                                className="rounded-xl h-11"
                                value={newResponsibleEmail}
                                onChange={(e) => setNewResponsibleEmail(e.target.value)}
                            />
                        </div>
                        <Button
                            className="w-full h-11 rounded-xl font-bold mt-2 shadow-lg shadow-primary/20"
                            onClick={handleAddResponsible}
                            disabled={isSavingResponsible}
                        >
                            {isSavingResponsible ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                            Salvar e Selecionar
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── Import Dialog ───────────────────────────────────────────────── */}
            <Dialog open={showImport} onOpenChange={setShowImport}>
                <DialogContent className="sm:max-w-[600px] rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-display font-bold">Importar da Planilha</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="bg-slate-50 p-5 rounded-2xl border border-dashed border-slate-200 text-center">
                            <h4 className="font-bold text-slate-700 mb-1">Passo 1: Prepare seus dados</h4>
                            <p className="text-sm text-slate-500 mb-4">Use nosso modelo para garantir que os campos estejam corretos.</p>
                            <Button variant="outline" onClick={downloadTemplate} className="gap-2 rounded-xl font-bold border-slate-300">
                                <FileDown className="h-4 w-4" />
                                Baixar Modelo Excel
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-bold text-slate-700">Passo 2: Envie o arquivo</h4>
                            <Input
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={handleFileUpload}
                                className="h-12 pt-2 rounded-xl cursor-pointer"
                            />
                        </div>

                        {importData.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-slate-700">Preview ({importData.length} linhas)</h4>
                                    <Button
                                        onClick={runImport}
                                        disabled={isImporting}
                                        className="gap-2 rounded-xl font-black px-6 shadow-lg shadow-primary/20"
                                    >
                                        {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                        Confirmar Importação
                                    </Button>
                                </div>
                                <div className="max-h-[200px] overflow-y-auto border rounded-xl bg-slate-50/50">
                                    <Table>
                                        <TableHeader className="sticky top-0 bg-white">
                                            <TableRow>
                                                <TableHead className="text-[10px] font-black uppercase">Nome</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase">Tipo</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase">Doc</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {importData.slice(0, 5).map((row, i) => (
                                                <TableRow key={i}>
                                                    <TableCell className="text-xs font-medium">{row.nome}</TableCell>
                                                    <TableCell className="text-xs capitalize">{row.tipo}</TableCell>
                                                    <TableCell className="text-xs text-slate-500">{row.documento}</TableCell>
                                                </TableRow>
                                            ))}
                                            {importData.length > 5 && (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="text-center text-[10px] text-slate-400 font-bold py-2">
                                                        + {importData.length - 5} linhas ocultas no preview
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── Delete Confirmation ─────────────────────────────────────────── */}
            <AlertDialog open={deleteTargetId !== null} onOpenChange={() => setDeleteTargetId(null)}>
                <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold">Excluir Contato?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação removerá permanentemente o contato e todos os dados associados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl font-bold">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold"
                            onClick={() => deleteTargetId && deleteMutation.mutate(deleteTargetId)}
                        >
                            Excluir Definitivamente
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
