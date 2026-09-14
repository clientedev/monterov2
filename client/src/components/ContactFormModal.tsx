import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Contact, InsertContact, insertContactSchema, User as UserType } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
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
import { Button } from "@/components/ui/button";
import { Loader2, CalendarDays, UserPlus } from "lucide-react";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ProductSelector } from "@/components/ProductSelector";

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

function toDateInputValue(value: string | null | undefined): string {
    if (!value) return "";
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
        const [day, month, year] = value.split("/");
        return `${year}-${month}-${day}`;
    }
    return value;
}

function fromDateInputValue(value: string): string {
    if (!value) return "";
    const [year, month, day] = value.split("-");
    return year && month && day ? `${day}/${month}/${year}` : value;
}

export const DEFAULT_CONTACT_FORM_VALUES: InsertContact = {
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
    insurers: "",
    contactOrigin: "",
    isReferral: false,
    referredByContactId: undefined,
    internalResponsibleId: undefined,
    notes: "",
    status: "Ativo",
};

export interface ContactFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    contactId?: number | null;
    initialData?: Partial<InsertContact>;
    onSuccess?: (contact: Contact) => void;
    title?: string;
    description?: string;
}

export function ContactFormModal({
    open,
    onOpenChange,
    contactId = null,
    initialData,
    onSuccess,
    title,
    description,
}: ContactFormModalProps) {
    const { toast } = useToast();
    const [isSearchingCnpj, setIsSearchingCnpj] = useState(false);

    const { data: contacts } = useQuery<Contact[]>({
        queryKey: ["/api/contacts"],
        enabled: open,
    });

    const { data: usersList } = useQuery<UserType[]>({
        queryKey: ["/api/users"],
        enabled: open,
    });

    const isEditing = Boolean(contactId);

    const form = useForm<InsertContact>({
        resolver: zodResolver(insertContactSchema),
        defaultValues: DEFAULT_CONTACT_FORM_VALUES,
    });

    const clientType = form.watch("type");
    const watchedAnniversary = form.watch("anniversaryDate");

    // Load contact data if editing or reset to initialData/default
    useEffect(() => {
        if (!open) return;

        if (contactId && contacts) {
            const found = contacts.find((c) => c.id === contactId);
            if (found) {
                form.reset({
                    type: found.type || "individual",
                    name: found.name || "",
                    email: found.email || "",
                    phone: found.phone || "",
                    document: found.document || "",
                    address: found.address || "",
                    responsibleName: found.responsibleName || "",
                    responsibleId: found.responsibleId ?? undefined,
                    anniversaryDate: found.anniversaryDate || "",
                    maritalStatus: found.maritalStatus || "",
                    productType: found.productType || "",
                    insurers: found.insurers || "",
                    contactOrigin: found.contactOrigin || "",
                    isReferral: found.isReferral || false,
                    referredByContactId: found.referredByContactId || undefined,
                    internalResponsibleId: found.internalResponsibleId || undefined,
                    notes: found.notes || "",
                    status: (found.status as any) || "Ativo",
                });
                return;
            }
        }

        if (initialData) {
            form.reset({
                ...DEFAULT_CONTACT_FORM_VALUES,
                ...initialData,
            });
        } else {
            form.reset(DEFAULT_CONTACT_FORM_VALUES);
        }
    }, [open, contactId, contacts, initialData, form]);

    const responsibleOptions = useMemo(() => {
        const opts: { value: string; label: string; sublabel?: string; id?: number; name: string }[] = [];

        if (usersList) {
            usersList
                .filter((u) => u.role === "admin" || u.role === "employee")
                .forEach((u) => {
                    opts.push({
                        value: `user_${u.id}`,
                        label: `👔 ${u.name} (Colaborador)`,
                        sublabel: u.email ?? "Equipe Monteiro",
                        name: u.name,
                    });
                });
        }

        if (contacts) {
            contacts
                .filter((c) => c.type === "individual" && (!contactId || c.id !== contactId))
                .forEach((c) => {
                    opts.push({
                        value: `contact_${c.id}`,
                        label: `👤 ${c.name} (Contato Base)`,
                        sublabel: c.phone ?? c.email ?? undefined,
                        id: c.id,
                        name: c.name,
                    });
                });
        }

        return opts;
    }, [usersList, contacts, contactId]);

    const createMutation = useMutation({
        mutationFn: async (data: InsertContact) => {
            const res = await apiRequest("POST", "/api/contacts", data);
            return await res.json();
        },
        onSuccess: (saved: Contact) => {
            queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
            queryClient.invalidateQueries({ queryKey: ["/api/clientes"] });
            toast({ title: "✅ Contato criado com sucesso!" });
            onOpenChange(false);
            form.reset(DEFAULT_CONTACT_FORM_VALUES);
            if (onSuccess) onSuccess(saved);
        },
        onError: (error: Error) => {
            toast({
                title: "Falha ao criar contato",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (data: InsertContact) => {
            const res = await apiRequest("PATCH", `/api/contacts/${contactId}`, data);
            return await res.json();
        },
        onSuccess: (saved: Contact) => {
            queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
            queryClient.invalidateQueries({ queryKey: ["/api/clientes"] });
            if (contactId) {
                queryClient.invalidateQueries({ queryKey: [`/api/contacts/${contactId}`] });
            }
            toast({ title: "✅ Contato atualizado com sucesso!" });
            onOpenChange(false);
            if (onSuccess) onSuccess(saved);
        },
        onError: (error: Error) => {
            toast({
                title: "Falha ao atualizar contato",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const lookupCnpj = async (rawCnpj: string) => {
        const cnpj = rawCnpj.replace(/\D/g, "");
        if (!cnpj || cnpj.length < 14) {
            toast({
                title: "Digite um CNPJ com 14 dígitos",
                description: `Você digitou ${cnpj.length} dígitos`,
                variant: "destructive",
            });
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

            toast({ title: "✅ Dados do CNPJ recuperados com sucesso!" });
        } catch (error: any) {
            toast({
                title: "Falha na busca do CNPJ",
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

    const isPending = createMutation.isPending || updateMutation.isPending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[650px] w-full max-w-[95vw] rounded-3xl border-none shadow-2xl overflow-hidden p-0 max-h-[90vh] flex flex-col bg-white">
                <DialogHeader className="p-6 pb-4 bg-slate-50 border-b shrink-0">
                    <DialogTitle className="text-2xl font-display font-bold text-gray-900">
                        {title || (isEditing ? "Editar Contato" : "Novo Contato")}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground mt-1">
                        {description ||
                            (isEditing
                                ? "Altere as informações do contato abaixo e salve as alterações."
                                : "Preencha os dados abaixo para cadastrar um contato com todas as opções e detalhes.")}
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
                                                <FormLabel className="text-gray-600 font-bold">Data Comemorativa / Aniversário</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary pointer-events-none" />
                                                        <Input
                                                            type="date"
                                                            className="rounded-xl h-11 bg-white pl-10"
                                                            value={toDateInputValue(field.value)}
                                                            onChange={(event) => field.onChange(fromDateInputValue(event.target.value))}
                                                        />
                                                    </div>
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

                        {/* ── Section 2: Responsável ────────────────── */}
                        <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-3">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                {clientType === "company" ? "2. Pessoa Responsável *" : "2. Pessoa Responsável (Opcional)"}
                            </h4>

                            <FormField
                                control={form.control}
                                name="responsibleId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-gray-600 font-bold">
                                            Selecione um Colaborador da Equipe ou Contato da Base
                                        </FormLabel>
                                        <FormControl>
                                            <SearchableSelect
                                                options={responsibleOptions}
                                                value={field.value ? (responsibleOptions.find(o => o.id === field.value)?.value || `contact_${field.value}`) : ""}
                                                onValueChange={(val) => {
                                                    if (!val) {
                                                        field.onChange(null);
                                                        form.setValue("responsibleName", "");
                                                        return;
                                                    }
                                                    const selected = responsibleOptions.find(o => o.value === val);
                                                    if (selected) {
                                                        field.onChange(selected.id ?? null);
                                                        form.setValue("responsibleName", selected.name);
                                                    }
                                                }}
                                                placeholder="Escolha um colaborador ou cliente da base..."
                                                searchPlaceholder="Pesquisar por nome ou e-mail..."
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
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold text-slate-500">
                                            Nome do Responsável (Personalizado / Manual)
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Ex: João Silva (Diretor) ou Carlos (Corretor)"
                                                className="rounded-xl h-10 bg-white text-xs"
                                                {...field}
                                                value={field.value || ""}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

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
                                        <ProductSelector
                                            value={field.value ?? ""}
                                            onChange={(val) => field.onChange(val)}
                                        />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* ── Section 4: Origem, seguradora e gestão ───── */}
                        <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-4">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Origem, seguradora e gestão</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="insurers"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-gray-600 font-bold">Seguradoras</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ex: Porto, SulAmérica" className="rounded-xl h-11 bg-white" {...field} value={field.value || ""} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="contactOrigin"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-gray-600 font-bold">Origem do contato</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ex: Instagram, site, evento" className="rounded-xl h-11 bg-white" {...field} value={field.value || ""} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                {clientType === "company" && (
                                    <FormField
                                        control={form.control}
                                        name="internalResponsibleId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-gray-600 font-bold">Responsável pela empresa</FormLabel>
                                                <SearchableSelect
                                                    options={(usersList || []).filter(u => u.role !== "client").map(u => ({ value: String(u.id), label: u.name }))}
                                                    value={field.value ? String(field.value) : ""}
                                                    onValueChange={(value) => field.onChange(value ? Number(value) : undefined)}
                                                    placeholder="Selecione alguém da equipe"
                                                    searchPlaceholder="Pesquisar por nome..."
                                                    clearable
                                                />
                                            </FormItem>
                                        )}
                                    />
                                )}
                                <FormField
                                    control={form.control}
                                    name="isReferral"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center gap-3 rounded-xl bg-white border border-slate-200 px-3 py-2.5 mt-6">
                                            <FormControl>
                                                <input type="checkbox" className="h-4 w-4 accent-primary" checked={!!field.value} onChange={e => field.onChange(e.target.checked)} />
                                            </FormControl>
                                            <FormLabel className="text-gray-700 font-bold cursor-pointer">Indicação</FormLabel>
                                        </FormItem>
                                    )}
                                />
                                {form.watch("isReferral") && (
                                    <FormField
                                        control={form.control}
                                        name="referredByContactId"
                                        render={({ field }) => (
                                            <FormItem className="sm:col-span-2">
                                                <FormLabel className="text-gray-600 font-bold">Quem indicou?</FormLabel>
                                                <SearchableSelect
                                                    options={(contacts || []).filter(c => c.id !== contactId).map(c => ({ value: String(c.id), label: c.name }))}
                                                    value={field.value ? String(field.value) : ""}
                                                    onValueChange={(value) => field.onChange(value ? Number(value) : undefined)}
                                                    placeholder="Pesquisar nos contatos por nome..."
                                                    searchPlaceholder="Pesquisar por nome..."
                                                    clearable
                                                />
                                            </FormItem>
                                        )}
                                    />
                                )}
                                <FormField
                                    control={form.control}
                                    name="notes"
                                    render={({ field }) => (
                                        <FormItem className="sm:col-span-2">
                                            <FormLabel className="text-gray-600 font-bold">Observações</FormLabel>
                                            <FormControl>
                                                <textarea className="w-full min-h-20 rounded-xl border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Anotações sobre este contato..." {...field} value={field.value || ""} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* ── Section 5: Contato e Endereço ────────────────────────── */}
                        <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-4">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                {clientType === "company" ? "4. Meios de Contato e Endereço" : "3. Meios de Contato e Endereço"}
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
                                <FormField
                                    control={form.control}
                                    name="address"
                                    render={({ field }) => (
                                        <FormItem className="sm:col-span-2">
                                            <FormLabel className="text-gray-600 font-bold">Endereço Completo</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Rua, número, complemento, bairro, cidade, UF, CEP"
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
                            className="w-full h-12 rounded-xl text-lg font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white"
                            disabled={isPending}
                        >
                            {isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {isEditing ? "Salvar Alterações" : "Salvar Contato"}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
