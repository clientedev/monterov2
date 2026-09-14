import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Contact, InsertContact, insertContactSchema, Lead, Product, User as UserType } from "@shared/schema";

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
import {
    Loader2,
    Plus,
    Users,
    Building,
    User,
    UserPlus,
    Search,
    X,
    KeyRound,
    Eye,
    CalendarDays,
    SlidersHorizontal,
    ArrowUp,
    ArrowDown,
    GripVertical,
    RotateCcw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ContactProfile } from "@/components/ContactProfile";
import { ContactFormModal } from "@/components/ContactFormModal";
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

export interface ColumnConfig {
    id: string;
    label: string;
    minWidth?: string;
    align?: "left" | "right";
}

export const ALL_CONTACT_COLUMNS: ColumnConfig[] = [
    { id: "name", label: "Contato / Nome", minWidth: "250px" },
    { id: "type", label: "Tipo de Cliente", minWidth: "150px" },
    { id: "document", label: "CPF / CNPJ", minWidth: "140px" },
    { id: "responsible", label: "Representante", minWidth: "170px" },
    { id: "internalResponsible", label: "ResponsÃ¡vel interno", minWidth: "170px" },
    { id: "contact", label: "E-mail / Telefone", minWidth: "190px" },
    { id: "anniversary", label: "Idade / Data Comem.", minWidth: "150px" },
    { id: "products", label: "Produtos", minWidth: "180px" },
    { id: "insurers", label: "Seguradoras", minWidth: "170px" },
    { id: "origin", label: "Origem", minWidth: "130px" },
    { id: "referral", label: "IndicaÃ§Ã£o", minWidth: "110px" },
    { id: "notes", label: "ObservaÃ§Ãµes", minWidth: "200px" },
    { id: "status", label: "Status", minWidth: "120px" },
    { id: "actions", label: "AÃ§Ãµes", minWidth: "150px", align: "right" },
];

const COLUMNS_STORAGE_KEY = "crm_contacts_column_order_v2";
const HIDDEN_COLUMNS_STORAGE_KEY = "crm_contacts_hidden_columns_v2";

function loadSavedColumnOrder(): string[] {
    try {
        const raw = localStorage.getItem(COLUMNS_STORAGE_KEY);
        if (!raw) return ALL_CONTACT_COLUMNS.map(c => c.id);
        const parsed: string[] = JSON.parse(raw);
        const valid = parsed.filter(id => ALL_CONTACT_COLUMNS.some(c => c.id === id));
        ALL_CONTACT_COLUMNS.forEach(c => {
            if (!valid.includes(c.id)) valid.push(c.id);
        });
        return valid;
    } catch {
        return ALL_CONTACT_COLUMNS.map(c => c.id);
    }
}

function loadSavedHiddenColumns(): string[] {
    try {
        const raw = localStorage.getItem(HIDDEN_COLUMNS_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

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
    const [selectedRowId, setSelectedRowId] = useState<number | null>(null);

    // â”€â”€ Filters â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [filterProduct, setFilterProduct] = useState<string>("all");

    // â”€â”€ Column Customization State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const [columnOrder, setColumnOrder] = useState<string[]>(loadSavedColumnOrder);
    const [hiddenColumns, setHiddenColumns] = useState<string[]>(loadSavedHiddenColumns);
    const [draggedColId, setDraggedColId] = useState<string | null>(null);
    const [dragOverColId, setDragOverColId] = useState<string | null>(null);

    useEffect(() => {
        try {
            localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify(columnOrder));
        } catch {}
    }, [columnOrder]);

    useEffect(() => {
        try {
            localStorage.setItem(HIDDEN_COLUMNS_STORAGE_KEY, JSON.stringify(hiddenColumns));
        } catch {}
    }, [hiddenColumns]);

    const moveColumn = (fromIndex: number, toIndex: number) => {
        if (toIndex < 0 || toIndex >= columnOrder.length) return;
        setColumnOrder(prev => {
            const next = [...prev];
            const [moved] = next.splice(fromIndex, 1);
            next.splice(toIndex, 0, moved);
            return next;
        });
    };

    const toggleColumnVisibility = (colId: string) => {
        setHiddenColumns(prev =>
            prev.includes(colId) ? prev.filter(id => id !== colId) : [...prev, colId]
        );
    };

    const resetColumns = () => {
        setColumnOrder(ALL_CONTACT_COLUMNS.map(c => c.id));
        setHiddenColumns([]);
    };

    const visibleColumnIds = useMemo(() => {
        return columnOrder.filter(id => !hiddenColumns.includes(id));
    }, [columnOrder, hiddenColumns]);

    const { data: contacts, isLoading } = useQuery<Contact[]>({
        queryKey: ["/api/contacts"],
    });

    const { data: usersList } = useQuery<UserType[]>({
        queryKey: ["/api/users"],
    });

    const userAccountsByEmail = useMemo(() => {
        const map = new Map<string, UserType>();
        if (!usersList) return map;
        for (const u of usersList) {
            if (u.email) {
                map.set(u.email.toLowerCase().trim(), u);
            }
        }
        return map;
    }, [usersList]);

    const userAccountsByContactId = useMemo(() => {
        const map = new Map<number, UserType>();
        if (!usersList) return map;
        for (const u of usersList) {
            if (u.contactId) {
                map.set(u.contactId, u);
            }
        }
        return map;
    }, [usersList]);

    const { data: allLeads } = useQuery<Lead[]>({
        queryKey: ["/api/leads"],
    });

    // Map contactId â†’ unique product names from their leads
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
                title: "HigienizaÃ§Ã£o de Duplicatas ConcluÃ­da",
                description: `${data.mergedCount || 0} contatos duplicados foram unificados.`,
            });
        },
    });

    const downloadTemplate = () => {
        const template = [
            { tipo: "individual", nome: "JoÃ£o Silva", email: "joao@exemplo.com", telefone: "(11) 99999-9999", documento: "123.456.789-00", endereco: "Rua Exemplo, 123" },
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
                title: "ImportaÃ§Ã£o concluÃ­da com sucesso",
                description: `${data.created || 0} novos contatos criados, ${data.updated || 0} contatos atualizados (sem duplicatas), ${data.errors || 0} falhas.`,
            });
        } catch (err: any) {
            toast({
                title: "Falha na importaÃ§Ã£o",
                description: err.message || "Erro ao importar dados",
                variant: "destructive",
            });
        } finally {
            setIsImporting(false);
            setImportData([]);
            setShowImport(false);
        }
    };

    // â”€â”€ Filtered contacts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

    // Build options for SearchableSelect (Team Collaborators + Base Individual Contacts)
    const responsibleOptions = useMemo(() => {
        const opts: { value: string; label: string; sublabel?: string; id?: number; name: string }[] = [];

        // 1. Team Collaborators / Staff (from usersList)
        if (usersList) {
            usersList
                .filter((u) => u.role === "admin" || u.role === "employee")
                .forEach((u) => {
                    opts.push({
                        value: `user_${u.id}`,
                        label: `ðŸ‘” ${u.name} (Colaborador)`,
                        sublabel: u.email ?? "Equipe Monteiro",
                        name: u.name,
                    });
                });
        }

        // 2. Individual Contacts (from contacts base)
        if (contacts) {
            contacts
                .filter((c) => c.type === "individual")
                .forEach((c) => {
                    opts.push({
                        value: `contact_${c.id}`,
                        label: `ðŸ‘¤ ${c.name} (Contato Base)`,
                        sublabel: c.phone ?? c.email ?? undefined,
                        id: c.id,
                        name: c.name,
                    });
                });
        }

        return opts;
    }, [usersList, contacts]);

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
                    <p className="text-muted-foreground mt-1">Gerencie pessoas fÃ­sicas e jurÃ­dicas em um Ãºnico lugar.</p>
                </div>

                <div className="flex items-center gap-3">
                    <Button 
                        onClick={() => {
                            setIsEditing(null);
                            setOpen(true);
                        }}
                        className="bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 h-11 px-6 font-bold"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar Contato
                    </Button>
                    <ContactFormModal
                        open={open}
                        onOpenChange={(v) => {
                            setOpen(v);
                            if (!v) setIsEditing(null);
                        }}
                        contactId={isEditing}
                    />

                    <Button
                        variant="outline"
                        onClick={() => deduplicateMutation.mutate()}
                        disabled={deduplicateMutation.isPending}
                        className="h-11 px-4 font-bold rounded-xl border-dashed border-2 hover:bg-amber-50 transition-all border-amber-300 text-amber-700 gap-2"
                        title="Varrer a base e unir cadastros idÃªnticos"
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

            {/* â”€â”€ Filter Bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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
                        <SelectItem value="individual">Pessoa FÃ­sica</SelectItem>
                        <SelectItem value="company">Pessoa JurÃ­dica</SelectItem>
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

                {/* â”€â”€ Popover de ConfiguraÃ§Ã£o de Colunas â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className="h-10 px-3 text-sm font-semibold rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50 gap-2 shrink-0"
                            title="Personalizar e reordenar colunas da tabela"
                        >
                            <SlidersHorizontal className="h-4 w-4 text-slate-500" />
                            <span className="hidden sm:inline">Colunas</span>
                            <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-bold bg-slate-100 text-slate-700">
                                {visibleColumnIds.length}/{ALL_CONTACT_COLUMNS.length}
                            </Badge>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-84 p-4 rounded-2xl shadow-2xl border-slate-200 bg-white" align="end">
                        <div className="flex items-center justify-between pb-3 border-b mb-3">
                            <div>
                                <h4 className="font-bold text-sm text-slate-900">Editar Colunas</h4>
                                <p className="text-[11px] text-slate-500">Escolha a ordem e visibilidade</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={resetColumns}
                                className="h-7 px-2 text-xs text-slate-500 hover:text-slate-900 gap-1"
                                title="Restaurar posiÃ§Ãµes originais"
                            >
                                <RotateCcw className="h-3 w-3" />
                                PadrÃ£o
                            </Button>
                        </div>
                        <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
                            {columnOrder.map((colId, index) => {
                                const col = ALL_CONTACT_COLUMNS.find(c => c.id === colId);
                                if (!col) return null;
                                const isVisible = !hiddenColumns.includes(colId);
                                return (
                                    <div
                                        key={colId}
                                        className={`flex items-center justify-between p-2 rounded-xl text-xs transition-colors ${
                                            isVisible ? "bg-slate-50 border border-slate-100" : "bg-slate-100/50 opacity-60"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <span className="text-[10px] font-mono font-bold text-slate-400 w-4 text-center shrink-0">
                                                {index + 1}
                                            </span>
                                            <Checkbox
                                                id={`col-${colId}`}
                                                checked={isVisible}
                                                onCheckedChange={() => toggleColumnVisibility(colId)}
                                                className="h-4 w-4 rounded"
                                            />
                                            <label
                                                htmlFor={`col-${colId}`}
                                                className="font-semibold text-slate-800 cursor-pointer truncate select-none"
                                            >
                                                {col.label}
                                            </label>
                                        </div>
                                        <div className="flex items-center gap-0.5 shrink-0">
                                            <button
                                                type="button"
                                                disabled={index === 0}
                                                onClick={() => moveColumn(index, index - 1)}
                                                className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 disabled:hover:text-slate-400 rounded hover:bg-slate-200/60 transition-colors"
                                                title="Mover para cima / esquerda"
                                            >
                                                <ArrowUp className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                disabled={index === columnOrder.length - 1}
                                                onClick={() => moveColumn(index, index + 1)}
                                                className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 disabled:hover:text-slate-400 rounded hover:bg-slate-200/60 transition-colors"
                                                title="Mover para baixo / direita"
                                            >
                                                <ArrowDown className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="pt-3 mt-3 border-t text-[11px] text-slate-400 text-center">
                            Dica: vocÃª tambÃ©m pode arrastar os cabeÃ§alhos na prÃ³pria tabela!
                        </div>
                    </PopoverContent>
                </Popover>

                <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {filteredContacts.length} de {contacts?.length ?? 0}
                </span>
            </div>

            {/* â”€â”€ Contacts Table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <style>{`
                .contacts-scrollbar::-webkit-scrollbar {
                    height: 8px;
                }
                .contacts-scrollbar::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 999px;
                    margin: 0 12px;
                }
                .contacts-scrollbar::-webkit-scrollbar-thumb {
                    background: linear-gradient(90deg, #6366f1, #8b5cf6);
                    border-radius: 999px;
                    border: 2px solid #f1f5f9;
                    transition: background 0.2s;
                }
                .contacts-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(90deg, #4f46e5, #7c3aed);
                }
                .contacts-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: #6366f1 #f1f5f9;
                }
                .col-sticky {
                    position: sticky;
                    left: 0;
                    z-index: 10;
                    background: inherit;
                    box-shadow: 2px 0 6px -2px rgba(99,102,241,0.12);
                }
            `}</style>
            <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                <div className="contacts-scrollbar w-full overflow-x-auto overscroll-x-contain pb-1">
                <Table className="min-w-[1200px]">
                    <TableHeader className="bg-slate-50">
                        <TableRow className="hover:bg-transparent">
                            {visibleColumnIds.map((colId) => {
                                const col = ALL_CONTACT_COLUMNS.find(c => c.id === colId);
                                if (!col) return null;
                                const isDragging = draggedColId === colId;
                                const isDragOver = dragOverColId === colId && !isDragging;
                                return (
                                    <TableHead
                                        key={colId}
                                        draggable
                                        onDragStart={(e) => {
                                            e.dataTransfer.setData("text/plain", colId);
                                            setDraggedColId(colId);
                                        }}
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            if (dragOverColId !== colId) setDragOverColId(colId);
                                        }}
                                        onDragLeave={() => {
                                            if (dragOverColId === colId) setDragOverColId(null);
                                        }}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            const sourceId = e.dataTransfer.getData("text/plain") || draggedColId;
                                            if (sourceId && sourceId !== colId) {
                                                const fromIdx = columnOrder.indexOf(sourceId);
                                                const toIdx = columnOrder.indexOf(colId);
                                                if (fromIdx !== -1 && toIdx !== -1) {
                                                    moveColumn(fromIdx, toIdx);
                                                }
                                            }
                                            setDraggedColId(null);
                                            setDragOverColId(null);
                                        }}
                                        onDragEnd={() => {
                                            setDraggedColId(null);
                                            setDragOverColId(null);
                                        }}
                                        style={{ minWidth: col.minWidth }}
                                        className={`py-4 font-bold text-slate-700 cursor-grab active:cursor-grabbing select-none transition-all ${
                                            col.align === "right" ? "text-right" : ""
                                        } ${isDragging ? "opacity-30 bg-slate-200" : ""} ${
                                            isDragOver ? "bg-primary/10 border-l-2 border-primary shadow-inner" : ""
                                        } ${colId === "name" ? "col-sticky bg-slate-50" : ""}`}
                                        title="Arraste para reposicionar esta coluna"
                                    >
                                        <div className={`flex items-center gap-1.5 ${col.align === "right" ? "justify-end" : ""}`}>
                                            <GripVertical className="h-3.5 w-3.5 text-slate-400 opacity-40 hover:opacity-100 shrink-0" />
                                            <span>{col.label}</span>
                                        </div>
                                    </TableHead>
                                );
                            })}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredContacts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={visibleColumnIds.length || 1} className="text-center h-32 text-muted-foreground">
                                    <div className="flex flex-col items-center gap-2">
                                        <Users className="h-8 w-8 opacity-20" />
                                        <p>{contacts?.length === 0 ? "Nenhum contato cadastrado ainda." : "Nenhum contato encontrado com os filtros aplicados."}</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredContacts.map((contact) => {
                                const products = Array.from(new Set(
                                    (contact.productType || "").split(",").map(p => p.trim()).filter(Boolean)
                                        .concat(productsByContact.get(contact.id) ?? [])
                                ));
                                const internalResponsible = usersList?.find(u => u.id === contact.internalResponsibleId)?.name;
                                const matchedUser = userAccountsByContactId.get(contact.id) || (contact.email ? userAccountsByEmail.get(contact.email.toLowerCase().trim()) : null);
                                const displayAvatar = matchedUser?.avatar || (contact as any).avatar;
                                const age = calcAge(contact.anniversaryDate);

                                return (
                                    <TableRow
                                        key={contact.id}
                                        className={`transition-colors group cursor-pointer ${
                                            selectedRowId === contact.id
                                                ? "bg-primary/5 ring-1 ring-inset ring-primary/20"
                                                : "hover:bg-slate-50/70"
                                        }`}
                                        onClick={() => setSelectedRowId(prev => prev === contact.id ? null : contact.id)}
                                    >
                                        {visibleColumnIds.map((colId) => {
                                            switch (colId) {
                                                case "name":
                                                    return (
                                                        <TableCell key="name" className={`font-bold text-slate-900 py-4 col-sticky ${
                                                            selectedRowId === contact.id ? "bg-primary/5" : "bg-white"
                                                        }`}>
                                                            <div
                                                                className="flex items-center gap-3 cursor-pointer group/name text-slate-900 hover:text-primary transition-colors w-fit"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedContactId(contact.id);
                                                                    setProfileOpen(true);
                                                                }}
                                                                title="Clique para ver o perfil do contato"
                                                            >
                                                                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold transition-transform group-hover/name:scale-105 shrink-0 overflow-hidden shadow-sm
                                                                    ${contact.type === 'individual' ? 'bg-primary' : 'bg-secondary'}
                                                                `}>
                                                                    {displayAvatar ? (
                                                                        <img src={displayAvatar} alt={contact.name} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        contact.name.charAt(0).toUpperCase()
                                                                    )}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                                        <span className="group-hover/name:underline text-slate-900 font-bold text-sm">{contact.name}</span>
                                                                        {matchedUser && (
                                                                            <Badge className="bg-amber-50 text-amber-800 border-amber-200 font-bold text-[9px] px-1.5 py-0.2 gap-1 rounded-md">
                                                                                <KeyRound className="h-2.5 w-2.5 text-amber-600" /> Possui Conta
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                    );
                                                case "type":
                                                    return (
                                                        <TableCell key="type" className="py-4">
                                                            <Badge
                                                                variant="outline"
                                                                className={`rounded-lg py-1 px-2.5 border-none flex items-center w-fit gap-1.5 font-bold text-[10px] uppercase tracking-wider
                                                                    ${contact.type === 'individual' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}
                                                            >
                                                                {contact.type === 'individual' ? <User className="h-3 w-3" /> : <Building className="h-3 w-3" />}
                                                                {contact.type === 'individual' ? 'Pessoa FÃ­sica' : 'Pessoa JurÃ­dica'}
                                                            </Badge>
                                                        </TableCell>
                                                    );
                                                case "document":
                                                    return (
                                                        <TableCell key="document" className="text-slate-700 font-medium py-4">
                                                            <span className="font-bold text-slate-800 text-xs">{contact.document || "â€”"}</span>
                                                        </TableCell>
                                                    );
                                                case "responsible":
                                                    return (
                                                        <TableCell key="responsible" className="text-slate-700 font-medium py-4">
                                                            {contact.responsibleName ? (
                                                                <div className="flex items-center gap-1">
                                                                    {contact.responsibleId ? (
                                                                        <button
                                                                            type="button"
                                                                            className="text-xs font-bold text-slate-800 hover:text-primary hover:underline transition-colors text-left cursor-pointer flex items-center gap-1.5"
                                                                            onClick={() => {
                                                                                setSelectedContactId(contact.responsibleId!);
                                                                                setProfileOpen(true);
                                                                            }}
                                                                            title="Clique para ver o perfil do responsÃ¡vel"
                                                                        >
                                                                            <User className="h-3.5 w-3.5 text-primary/70" />
                                                                            {contact.responsibleName}
                                                                        </button>
                                                                    ) : (
                                                                        <span className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                                                                            <User className="h-3.5 w-3.5 text-slate-400" />
                                                                            {contact.responsibleName}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs text-slate-400 italic">â€”</span>
                                                            )}
                                                        </TableCell>
                                                    );
                                                case "internalResponsible":
                                                    return (
                                                        <TableCell key="internalResponsible" className="py-4">
                                                            <span className="text-xs font-medium text-slate-700">{internalResponsible || "â€”"}</span>
                                                        </TableCell>
                                                    );
                                                case "contact":
                                                    return (
                                                        <TableCell key="contact" className="text-slate-600 py-4 text-xs space-y-0.5">
                                                            <div className="font-medium text-slate-800">{contact.email || "â€”"}</div>
                                                            <div className="text-slate-400">{contact.phone || "â€”"}</div>
                                                        </TableCell>
                                                    );
                                                case "anniversary":
                                                    return (
                                                        <TableCell key="anniversary" className="py-4">
                                                            {contact.anniversaryDate ? (
                                                                <div className="flex flex-col space-y-0.5">
                                                                    <span className="text-xs font-semibold text-slate-700">{contact.anniversaryDate}</span>
                                                                    {age !== null && (
                                                                        <Badge variant="outline" className="w-fit py-0 px-1.5 bg-rose-50 text-rose-600 border-rose-200 font-bold text-[10px]">
                                                                            ðŸŽ‚ {age} anos
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs text-slate-400 italic">â€”</span>
                                                            )}
                                                        </TableCell>
                                                    );
                                                case "products":
                                                    return (
                                                        <TableCell key="products" className="py-4">
                                                            <div className="flex flex-wrap gap-1 max-w-[180px]">
                                                                {products.length > 0 ? (
                                                                    products.map((prod) => (
                                                                        <Badge key={prod} variant="outline" className="rounded-lg py-0.5 px-2 border-none bg-primary/10 text-primary font-bold text-[10px] uppercase">
                                                                            {prod}
                                                                        </Badge>
                                                                    ))
                                                                ) : (
                                                                    <span className="text-xs text-slate-400 italic">â€”</span>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    );
                                                case "insurers":
                                                    return (
                                                        <TableCell key="insurers" className="py-4">
                                                            <div className="flex flex-wrap gap-1 max-w-[180px]">
                                                                {(contact.insurers || "").split(",").map(s => s.trim()).filter(Boolean).map(insurer => (
                                                                    <Badge key={insurer} variant="outline" className="rounded-lg py-0.5 px-2 border-none bg-indigo-50 text-indigo-700 font-bold text-[10px]">
                                                                        {insurer}
                                                                    </Badge>
                                                                ))}
                                                                {!contact.insurers && <span className="text-xs text-slate-400 italic">â€”</span>}
                                                            </div>
                                                        </TableCell>
                                                    );
                                                case "origin":
                                                    return (
                                                        <TableCell key="origin" className="py-4 text-xs text-slate-700">
                                                            {contact.contactOrigin || "â€”"}
                                                        </TableCell>
                                                    );
                                                case "referral":
                                                    return (
                                                        <TableCell key="referral" className="py-4">
                                                            {contact.isReferral ? (
                                                                <Badge className="bg-amber-50 text-amber-800 border-amber-200 text-[10px]">IndicaÃ§Ã£o</Badge>
                                                            ) : <span className="text-xs text-slate-400">â€”</span>}
                                                        </TableCell>
                                                    );
                                                case "notes":
                                                    return (
                                                        <TableCell key="notes" className="py-4 max-w-[220px]">
                                                            <span className="block truncate text-xs text-slate-600" title={contact.notes || ""}>{contact.notes || "â€”"}</span>
                                                        </TableCell>
                                                    );
                                                case "status":
                                                    return (
                                                        <TableCell key="status" className="py-4">
                                                            <Badge
                                                                variant="outline"
                                                                className={`rounded-full py-0.5 px-2.5 font-bold text-[10px] uppercase border ${
                                                                    (contact.status || "Ativo") === "Ativo"
                                                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                                        : (contact.status || "Ativo") === "Prospects"
                                                                        ? "bg-blue-50 text-blue-700 border-blue-200"
                                                                        : "bg-rose-50 text-rose-700 border-rose-200"
                                                                }`}
                                                            >
                                                                {contact.status || "Ativo"}
                                                            </Badge>
                                                        </TableCell>
                                                    );
                                                case "actions":
                                                    return (
                                                        <TableCell key="actions" className="text-right py-4">
                                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 w-8 text-primary hover:bg-primary/10 rounded-lg p-0"
                                                                    onClick={() => {
                                                                        setSelectedContactId(contact.id);
                                                                        setProfileOpen(true);
                                                                    }}
                                                                    title="Ver Perfil Completo"
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 w-8 text-slate-600 hover:bg-slate-100 rounded-lg p-0"
                                                                    onClick={() => {
                                                                        setIsEditing(contact.id);
                                                                        setOpen(true);
                                                                    }}
                                                                    title="Editar Contato"
                                                                >
                                                                    <Edit2 className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg p-0"
                                                                    onClick={() => setDeleteTargetId(contact.id)}
                                                                    title="Excluir Contato"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    );
                                                default:
                                                    return null;
                                            }
                                        })}
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
                </div>
            </div>

            <ContactProfile
                contactId={selectedContactId}
                open={profileOpen}
                onOpenChange={setProfileOpen}
            />

            {/* â”€â”€ Import Dialog â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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
                                        Confirmar ImportaÃ§Ã£o
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

            {/* â”€â”€ Delete Confirmation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <AlertDialog open={deleteTargetId !== null} onOpenChange={() => setDeleteTargetId(null)}>
                <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold">Excluir Contato?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta aÃ§Ã£o removerÃ¡ permanentemente o contato e todos os dados associados.
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
