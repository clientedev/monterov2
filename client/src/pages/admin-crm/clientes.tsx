import { useState, useRef, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Cliente, User, Contact, Seguradora, Apolice } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Loader2, Plus, Pencil, Trash2, Users, Search, Eye, Phone, Mail, Download,
    Sparkles, User as UserIcon, Building, X, Filter, SlidersHorizontal, ArrowUp,
    ArrowDown, RotateCcw, ChevronLeft, ChevronRight, CheckCircle2, Shield,
    FileSpreadsheet, MessageCircle
} from "lucide-react";
import { useLocation } from "wouter";
import * as XLSX from "xlsx";
import { ProductSelector, STANDARD_PRODUCTS } from "@/components/ProductSelector";
import { SmartSpreadsheetImporter } from "@/components/SmartSpreadsheetImporter";
import { ApoliceDialog } from "@/components/ApoliceDialog";

const ESTADOS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

export interface ColumnConfig {
    id: string;
    label: string;
    minWidth?: string;
    align?: "left" | "right";
}

export const ALL_CLIENTE_COLUMNS: ColumnConfig[] = [
    { id: "name", label: "Cliente / Razão Social", minWidth: "240px" },
    { id: "status", label: "Status (Ativo/Não Ativo)", minWidth: "160px" },
    { id: "type", label: "Tipo", minWidth: "130px" },
    { id: "document", label: "CPF / CNPJ", minWidth: "150px" },
    { id: "contact", label: "Contato (Tel / E-mail)", minWidth: "200px" },
    { id: "apolices", label: "Apólices", minWidth: "140px" },
    { id: "products", label: "Produtos", minWidth: "160px" },
    { id: "insurers", label: "Seguradoras", minWidth: "160px" },
    { id: "responsible", label: "Representante (PJ)", minWidth: "160px" },
    { id: "internalResponsible", label: "Responsável Interno", minWidth: "160px" },
    { id: "location", label: "Cidade / UF", minWidth: "140px" },
    { id: "origin", label: "Origem / Indicação", minWidth: "140px" },
    { id: "actions", label: "Ações", minWidth: "170px", align: "right" },
];

const COLUMNS_STORAGE_KEY = "crm_clientes_column_order_v3";
const HIDDEN_COLUMNS_STORAGE_KEY = "crm_clientes_hidden_columns_v3";

function loadSavedColumnOrder(): string[] {
    try {
        const raw = localStorage.getItem(COLUMNS_STORAGE_KEY);
        if (!raw) return ALL_CLIENTE_COLUMNS.map(c => c.id);
        const parsed: string[] = JSON.parse(raw);
        const valid = parsed.filter(id => ALL_CLIENTE_COLUMNS.some(c => c.id === id));
        ALL_CLIENTE_COLUMNS.forEach(c => {
            if (!valid.includes(c.id)) valid.push(c.id);
        });
        return valid;
    } catch {
        return ALL_CLIENTE_COLUMNS.map(c => c.id);
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

export default function ClientesPage() {
    const { toast } = useToast();
    const { user } = useAuth();
    const [, setLocation] = useLocation();
    const isAdmin = user?.role === "admin";
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Filters
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterSeguradora, setFilterSeguradora] = useState("all");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Columns Customization
    const [columnOrder, setColumnOrder] = useState<string[]>(loadSavedColumnOrder);
    const [hiddenColumns, setHiddenColumns] = useState<string[]>(loadSavedHiddenColumns);

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
        setColumnOrder(ALL_CLIENTE_COLUMNS.map(c => c.id));
        setHiddenColumns([]);
    };

    const visibleColumnIds = useMemo(() => {
        return columnOrder.filter(id => !hiddenColumns.includes(id));
    }, [columnOrder, hiddenColumns]);

    // Modals & Selections
    const [showForm, setShowForm] = useState(false);
    const [editTarget, setEditTarget] = useState<Cliente | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Cliente | null>(null);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [showSmartImportModal, setShowSmartImportModal] = useState(false);

    // Apolice Modal with PDF attachment
    const [showApoliceModal, setShowApoliceModal] = useState(false);
    const [targetClienteForApolice, setTargetClienteForApolice] = useState<number | null>(null);

    // Form Data
    const [formData, setFormData] = useState({
        type: "individual" as "individual" | "company",
        nome: "",
        status: "ativo" as "ativo" | "inativo",
        cpfCnpj: "",
        dataNascimento: "",
        anniversaryDate: "",
        telefone: "",
        whatsapp: "",
        email: "",
        endereco: "",
        cidade: "",
        estado: "",
        observacoes: "",
        tags: "",
        productType: "",
        insurers: "",
        contactOrigin: "",
        isReferral: false,
        referredByContactId: "" as string,
        internalResponsibleId: "" as string,
        responsavelComercialId: "" as string,
        nomeRepresentante: "",
        telefoneRepresentante: "",
        emailRepresentante: "",
    });

    // Queries
    const { data: clientes, isLoading } = useQuery<Cliente[]>({
        queryKey: ["/api/clientes"],
    });

    const { data: apolices } = useQuery<Apolice[]>({
        queryKey: ["/api/apolices"],
    });

    const { data: users } = useQuery<User[]>({ queryKey: ["/api/users"] });
    const { data: seguradoras } = useQuery<Seguradora[]>({ queryKey: ["/api/seguradoras"] });

    const openCreate = () => {
        setEditTarget(null);
        setFormData({
            type: "individual",
            nome: "",
            status: "ativo",
            cpfCnpj: "",
            dataNascimento: "",
            anniversaryDate: "",
            telefone: "",
            whatsapp: "",
            email: "",
            endereco: "",
            cidade: "",
            estado: "",
            observacoes: "",
            tags: "",
            productType: "",
            insurers: "",
            contactOrigin: "",
            isReferral: false,
            referredByContactId: "",
            internalResponsibleId: "",
            responsavelComercialId: "",
            nomeRepresentante: "",
            telefoneRepresentante: "",
            emailRepresentante: ""
        });
        setShowForm(true);
    };

    const openEdit = (c: any) => {
        setEditTarget(c);
        setFormData({
            type: c.type || ((c.cpfCnpj || "").replace(/\D/g, "").length > 11 ? "company" : "individual"),
            nome: c.nome || "",
            status: c.status === "inativo" || c.status === "nao_ativo" ? "inativo" : "ativo",
            cpfCnpj: c.cpfCnpj || "",
            dataNascimento: c.dataNascimento || "",
            anniversaryDate: c.anniversaryDate || "",
            telefone: c.telefone || "",
            whatsapp: c.whatsapp || "",
            email: c.email || "",
            endereco: c.endereco || "",
            cidade: c.cidade || "",
            estado: c.estado || "",
            observacoes: c.observacoes || "",
            tags: c.tags || "",
            productType: c.productType || "",
            insurers: c.insurers || "",
            contactOrigin: c.contactOrigin || "",
            isReferral: c.isReferral || false,
            referredByContactId: c.referredByContactId ? String(c.referredByContactId) : "",
            internalResponsibleId: c.internalResponsibleId ? String(c.internalResponsibleId) : "",
            responsavelComercialId: c.responsavelComercialId ? String(c.responsavelComercialId) : "",
            nomeRepresentante: c.nomeRepresentante || "",
            telefoneRepresentante: c.telefoneRepresentante || "",
            emailRepresentante: c.emailRepresentante || "",
        });
        setShowForm(true);
    };

    const openCreateApoliceForClient = (cId: number) => {
        setTargetClienteForApolice(cId);
        setShowApoliceModal(true);
    };

    // Quick toggle status mutation
    const toggleStatusMutation = useMutation({
        mutationFn: async ({ id, newStatus }: { id: number; newStatus: "ativo" | "inativo" }) => {
            const res = await apiRequest("PATCH", `/api/clientes/${id}`, { status: newStatus });
            if (!res.ok) throw new Error((await res.json()).message);
            return res.json();
        },
        onMutate: async ({ id, newStatus }) => {
            await queryClient.cancelQueries({ queryKey: ["/api/clientes"] });
            const previous = queryClient.getQueryData<Cliente[]>(["/api/clientes"]);
            if (previous) {
                queryClient.setQueryData<Cliente[]>(
                    ["/api/clientes"],
                    previous.map(c => c.id === id ? { ...c, status: newStatus } : c)
                );
            }
            return { previous };
        },
        onError: (err: any, _vars, context) => {
            if (context?.previous) {
                queryClient.setQueryData(["/api/clientes"], context.previous);
            }
            toast({ title: "Erro ao atualizar status", description: err.message, variant: "destructive" });
        },
        onSuccess: (_data, { newStatus }) => {
            queryClient.invalidateQueries({ queryKey: ["/api/clientes"] });
            toast({
                title: newStatus === "ativo" ? "Cliente marcado como Ativo ✅" : "Cliente marcado como Não Ativo ⚪",
            });
        }
    });

    const saveMutation = useMutation({
        mutationFn: async () => {
            const body = {
                ...formData,
                responsavelComercialId: formData.responsavelComercialId ? parseInt(formData.responsavelComercialId) : null,
                internalResponsibleId: formData.internalResponsibleId ? parseInt(formData.internalResponsibleId) : null,
                referredByContactId: formData.referredByContactId ? parseInt(formData.referredByContactId) : null,
            };
            if (editTarget) {
                const res = await apiRequest("PATCH", `/api/clientes/${editTarget.id}`, body);
                if (!res.ok) throw new Error((await res.json()).message);
                return res.json();
            } else {
                const res = await apiRequest("POST", "/api/clientes", body);
                if (!res.ok) throw new Error((await res.json()).message);
                return res.json();
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/clientes"] });
            toast({ title: editTarget ? "Cliente atualizado" : "Cliente criado com sucesso" });
            setShowForm(false);
        },
        onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/clientes/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/clientes"] });
            queryClient.invalidateQueries({ queryKey: ["/api/apolices"] });
            toast({ title: "Cliente removido com sucesso" });
            setDeleteTarget(null);
        },
        onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
    });

    // Excel Download Template
    const handleDownloadTemplate = () => {
        const templateData = [
            {
                "Nome do cliente": "Leandro Antonio Russo Perez",
                "CPF do cliente": "30629219869",
                "Telefone do cliente": "+5511972818059",
                "Email do cliente": "cliente@exemplo.com",
                "Status (ativo, inativo)": "ativo",
                "Nome do responsável": "MONTEIRO CORRETORA",
                "Seguradora": "Porto Seguro",
                "Número da apólice": "056902026000213910033195000000",
                "Premio": "R$ 1500.00",
                "Data Início da vigência da apólice": "29/07/2026",
                "Data de vencimento da fatura": "29/07/2027",
            }
        ];

        const worksheet = XLSX.utils.json_to_sheet(templateData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Modelo Clientes");
        XLSX.writeFile(workbook, "modelo_clientes_monteiro.xlsx");
        toast({ title: "Modelo baixado!", description: "Preencha a planilha e suba no botão de importação." });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadedFile(file);
        setShowSmartImportModal(true);
        e.target.value = "";
    };

    // Client-side filtering
    const filtered = (clientes || []).filter(c => {
        // Search
        if (search) {
            const q = search.toLowerCase();
            const matchName = (c.nome || "").toLowerCase().includes(q);
            const matchDoc = (c.cpfCnpj || "").includes(q);
            const matchEmail = (c.email || "").toLowerCase().includes(q);
            const matchPhone = (c.telefone || "").includes(q);
            if (!matchName && !matchDoc && !matchEmail && !matchPhone) return false;
        }

        // Status: Ativo vs Não Ativo
        const isAtivo = (c.status || "ativo") === "ativo";
        if (filterStatus === "ativo" && !isAtivo) return false;
        if (filterStatus === "inativo" && isAtivo) return false;

        // Tipo: PF vs PJ
        if (filterType === "individual" && c.type === "company") return false;
        if (filterType === "company" && c.type !== "company") return false;

        // Seguradora
        if (filterSeguradora !== "all") {
            const insStr = (c.insurers || "").toLowerCase();
            if (!insStr.includes(filterSeguradora.toLowerCase())) return false;
        }

        return true;
    });

    // Pagination
    const totalPages = Math.ceil(filtered.length / pageSize) || 1;
    const paginatedClientes = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const setField = (key: string, val: unknown) => setFormData(prev => ({ ...prev, [key]: val }));

    // Counters
    const totalClientes = clientes?.length || 0;
    const ativosCount = clientes?.filter(c => (c.status || "ativo") === "ativo").length || 0;
    const inativosCount = totalClientes - ativosCount;
    const withApoliceCount = useMemo(() => {
        if (!clientes || !apolices) return 0;
        const cIdsWithApolice = new Set(apolices.map(a => a.clienteId));
        return clientes.filter(c => cIdsWithApolice.has(c.id)).length;
    }, [clientes, apolices]);

    return (
        <div className="space-y-6">
            {/* ── TOP HEADER ─────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-display font-bold text-gray-900 tracking-tight">Base de Clientes</h2>
                    <p className="text-muted-foreground mt-1">
                        Gerencie clientes, status ativo/não ativo e consulte apólices vinculadas em modo lista.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        variant="outline"
                        className="gap-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 h-10 font-semibold"
                        onClick={handleDownloadTemplate}
                    >
                        <Download className="h-4 w-4" /> Baixar Modelo
                    </Button>
                    <Button
                        variant="outline"
                        className="gap-2 border-[#0F6570] text-[#0F6570] hover:bg-[#0F6570]/10 h-10 font-semibold"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Sparkles className="h-4 w-4 text-emerald-600" />
                        Subir Planilha
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".xlsx, .xls, .csv"
                        onChange={handleFileChange}
                    />

                    <Button
                        variant="outline"
                        onClick={() => {
                            setTargetClienteForApolice(null);
                            setShowApoliceModal(true);
                        }}
                        className="gap-2 border-[#0F6570] text-[#0F6570] hover:bg-[#0F6570]/10 font-bold h-10"
                    >
                        <Shield className="h-4 w-4 text-[#0F6570]" />
                        Criar Apólice (PDF)
                    </Button>

                    <Button
                        onClick={openCreate}
                        className="gap-2 font-bold bg-[#0F6570] hover:bg-[#0A454D] text-white shadow-md shadow-[#0F6570]/20 h-10 px-5"
                    >
                        <Plus className="h-4 w-4" /> Novo Cliente
                    </Button>
                </div>
            </div>

            {/* ── TOP STATS & CLIENT COUNTERS ─────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3.5 hover:border-slate-300 transition-all">
                    <div className="p-3 bg-[#0F6570]/10 text-[#0F6570] rounded-xl shrink-0">
                        <Users className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total de Clientes</p>
                        <p className="text-2xl font-bold font-display text-slate-900">{totalClientes}</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3.5 hover:border-emerald-300 transition-all">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                        <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Clientes Ativos</p>
                        <p className="text-2xl font-bold font-display text-emerald-600">{ativosCount}</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3.5 hover:border-rose-300 transition-all">
                    <div className="p-3 bg-slate-100 text-slate-500 rounded-xl shrink-0">
                        <X className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Não Ativos</p>
                        <p className="text-2xl font-bold font-display text-slate-600">{inativosCount}</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3.5 hover:border-teal-300 transition-all">
                    <div className="p-3 bg-teal-50 text-teal-600 rounded-xl shrink-0">
                        <Shield className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Com Apólice Ativa</p>
                        <p className="text-2xl font-bold font-display text-teal-700">{withApoliceCount}</p>
                    </div>
                </div>
            </div>

            {/* ── FILTER & SEARCH BAR ─────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        className="pl-9 pr-9 h-10 rounded-lg text-sm"
                        placeholder="Buscar cliente por nome, documento, telefone ou e-mail..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                    />
                    {search && (
                        <button
                            onClick={() => setSearch("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>

                <Select value={filterStatus} onValueChange={v => { setFilterStatus(v); setCurrentPage(1); }}>
                    <SelectTrigger className="w-full sm:w-44 h-10 text-sm">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os Status</SelectItem>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="inativo">Não Ativo</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={filterType} onValueChange={v => { setFilterType(v); setCurrentPage(1); }}>
                    <SelectTrigger className="w-full sm:w-40 h-10 text-sm">
                        <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os Tipos</SelectItem>
                        <SelectItem value="individual">Pessoa Física</SelectItem>
                        <SelectItem value="company">Pessoa Jurídica</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={filterSeguradora} onValueChange={v => { setFilterSeguradora(v); setCurrentPage(1); }}>
                    <SelectTrigger className="w-full sm:w-44 h-10 text-sm">
                        <SelectValue placeholder="Seguradora" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas Seguradoras</SelectItem>
                        {(seguradoras || []).map(s => (
                            <SelectItem key={s.id} value={s.nome}>{s.nome}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* ── Popover de Configuração de Colunas ───────────────────────── */}
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
                                {visibleColumnIds.length}/{ALL_CLIENTE_COLUMNS.length}
                            </Badge>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4 rounded-2xl shadow-2xl border-slate-200 bg-white" align="end">
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
                            >
                                <RotateCcw className="h-3 w-3" /> Padrão
                            </Button>
                        </div>
                        <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
                            {columnOrder.map((colId, index) => {
                                const col = ALL_CLIENTE_COLUMNS.find(c => c.id === colId);
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
                                                id={`col-c-${colId}`}
                                                checked={isVisible}
                                                onCheckedChange={() => toggleColumnVisibility(colId)}
                                                className="h-4 w-4 rounded"
                                            />
                                            <label
                                                htmlFor={`col-c-${colId}`}
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
                                                className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 rounded"
                                            >
                                                <ArrowUp className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                disabled={index === columnOrder.length - 1}
                                                onClick={() => moveColumn(index, index + 1)}
                                                className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 rounded"
                                            >
                                                <ArrowDown className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </PopoverContent>
                </Popover>

                <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {filtered.length} clientes
                </span>
            </div>

            {/* ── CLIENTS LIST TABLE ──────────────────────────────────────────── */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50/80">
                            <TableRow>
                                {visibleColumnIds.map(colId => {
                                    const col = ALL_CLIENTE_COLUMNS.find(c => c.id === colId);
                                    if (!col) return null;
                                    return (
                                        <TableHead
                                            key={colId}
                                            style={{ minWidth: col.minWidth }}
                                            className={`font-bold text-xs uppercase tracking-wider text-slate-700 ${
                                                col.align === "right" ? "text-right" : "text-left"
                                            }`}
                                        >
                                            {col.label}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={visibleColumnIds.length} className="text-center py-20">
                                        <Loader2 className="h-8 w-8 animate-spin text-[#0F6570] mx-auto" />
                                        <p className="text-sm text-slate-500 mt-2 font-medium">Carregando base de clientes...</p>
                                    </TableCell>
                                </TableRow>
                            ) : paginatedClientes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={visibleColumnIds.length} className="text-center py-16 text-muted-foreground">
                                        <Users className="h-12 w-12 mx-auto mb-3 opacity-30 text-slate-400" />
                                        <p className="text-base font-semibold text-slate-800">Nenhum cliente encontrado.</p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Ajuste os filtros de busca ou cadastre um novo cliente.
                                        </p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedClientes.map(c => {
                                    const isAtivo = (c.status || "ativo") === "ativo";
                                    const clientApolices = (apolices || []).filter(a => a.clienteId === c.id);
                                    const isCompany = c.type === "company";

                                    return (
                                        <TableRow
                                            key={c.id}
                                            className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                                            onClick={(e) => {
                                                // Não navega se clicou em botões de ação ou links
                                                if ((e.target as HTMLElement).closest("button, a, input")) return;
                                                setLocation(`/admin/clientes/${c.id}`);
                                            }}
                                        >
                                            {visibleColumnIds.map(colId => {
                                                switch (colId) {
                                                    case "name":
                                                        return (
                                                            <TableCell key={colId} className="font-medium">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="h-9 w-9 rounded-full bg-[#0F6570]/10 text-[#0F6570] flex items-center justify-center font-bold text-sm shrink-0 border border-[#0F6570]/20">
                                                                        {c.nome.charAt(0).toUpperCase()}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setLocation(`/admin/clientes/${c.id}`)}
                                                                            className="font-bold text-slate-900 hover:text-[#0F6570] text-sm text-left truncate block max-w-[220px]"
                                                                            title={c.nome}
                                                                        >
                                                                            {c.nome}
                                                                        </button>
                                                                        {c.tags && (
                                                                            <span className="text-[10px] text-blue-600 font-semibold truncate block">
                                                                                {c.tags}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                        );

                                                    case "status":
                                                        return (
                                                            <TableCell key={colId}>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        toggleStatusMutation.mutate({
                                                                            id: c.id,
                                                                            newStatus: isAtivo ? "inativo" : "ativo"
                                                                        });
                                                                    }}
                                                                    disabled={toggleStatusMutation.isPending}
                                                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all shadow-xs border ${
                                                                        isAtivo
                                                                            ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400"
                                                                            : "bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200"
                                                                    }`}
                                                                    title="Clique para alternar entre Ativo e Não Ativo"
                                                                >
                                                                    <span className={`h-2 w-2 rounded-full ${isAtivo ? "bg-emerald-500" : "bg-slate-400"}`} />
                                                                    {isAtivo ? "Ativo" : "Não Ativo"}
                                                                </button>
                                                            </TableCell>
                                                        );

                                                    case "type":
                                                        return (
                                                            <TableCell key={colId}>
                                                                <Badge
                                                                    variant="outline"
                                                                    className={`text-xs gap-1 font-semibold ${
                                                                        isCompany
                                                                            ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                                                                            : "border-slate-200 bg-slate-50 text-slate-700"
                                                                    }`}
                                                                >
                                                                    {isCompany ? <Building className="h-3 w-3" /> : <UserIcon className="h-3 w-3" />}
                                                                    {isCompany ? "Pessoa Jurídica" : "Pessoa Física"}
                                                                </Badge>
                                                            </TableCell>
                                                        );

                                                    case "document":
                                                        return (
                                                            <TableCell key={colId} className="font-mono text-xs text-slate-600 font-semibold">
                                                                {c.cpfCnpj || "—"}
                                                            </TableCell>
                                                        );

                                                    case "contact":
                                                        return (
                                                            <TableCell key={colId} className="text-xs space-y-0.5">
                                                                {c.telefone && (
                                                                    <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                                                                        <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                                                                        <span>{c.telefone}</span>
                                                                        {c.whatsapp && (
                                                                            <a
                                                                                href={`https://wa.me/55${c.whatsapp.replace(/\D/g, "")}`}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                onClick={e => e.stopPropagation()}
                                                                                className="text-emerald-600 hover:text-emerald-700 ml-1"
                                                                                title="Conversar no WhatsApp"
                                                                            >
                                                                                <MessageCircle className="h-3.5 w-3.5 inline" />
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                )}
                                                                {c.email && (
                                                                    <div className="flex items-center gap-1.5 text-slate-500 truncate max-w-[190px]">
                                                                        <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                                                                        <span className="truncate">{c.email}</span>
                                                                    </div>
                                                                )}
                                                                {!c.telefone && !c.email && <span className="text-slate-400">—</span>}
                                                            </TableCell>
                                                        );

                                                    case "apolices":
                                                        return (
                                                            <TableCell key={colId}>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setLocation(`/admin/clientes/${c.id}`);
                                                                    }}
                                                                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#0F6570]/10 text-[#0F6570] hover:bg-[#0F6570]/20 transition-all border border-[#0F6570]/20"
                                                                    title="Ver apólices deste cliente"
                                                                >
                                                                    <Shield className="h-3 w-3" />
                                                                    {clientApolices.length} apólice(s)
                                                                </button>
                                                            </TableCell>
                                                        );

                                                    case "products":
                                                        return (
                                                            <TableCell key={colId} className="text-xs">
                                                                {c.productType ? (
                                                                    <div className="flex flex-wrap gap-1 max-w-[160px]">
                                                                        {c.productType.split(",").slice(0, 2).map((p, idx) => (
                                                                            <Badge key={idx} className="bg-primary/10 text-primary border-primary/20 text-[10px] px-1.5 py-0">
                                                                                {p.trim()}
                                                                            </Badge>
                                                                        ))}
                                                                    </div>
                                                                ) : "—"}
                                                            </TableCell>
                                                        );

                                                    case "insurers":
                                                        return (
                                                            <TableCell key={colId} className="text-xs">
                                                                {c.insurers ? (
                                                                    <div className="flex flex-wrap gap-1 max-w-[160px]">
                                                                        {c.insurers.split(",").slice(0, 2).map((ins, idx) => (
                                                                            <Badge key={idx} className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] px-1.5 py-0">
                                                                                {ins.trim()}
                                                                            </Badge>
                                                                        ))}
                                                                    </div>
                                                                ) : "—"}
                                                            </TableCell>
                                                        );

                                                    case "responsible":
                                                        return (
                                                            <TableCell key={colId} className="text-xs text-slate-700">
                                                                {c.nomeRepresentante || "—"}
                                                            </TableCell>
                                                        );

                                                    case "internalResponsible":
                                                        return (
                                                            <TableCell key={colId} className="text-xs text-slate-700">
                                                                {users?.find(u => u.id === (c.internalResponsibleId || c.responsavelComercialId))?.name || "—"}
                                                            </TableCell>
                                                        );

                                                    case "location":
                                                        return (
                                                            <TableCell key={colId} className="text-xs text-slate-600">
                                                                {c.cidade ? `${c.cidade}${c.estado ? ` - ${c.estado}` : ""}` : "—"}
                                                            </TableCell>
                                                        );

                                                    case "origin":
                                                        return (
                                                            <TableCell key={colId} className="text-xs text-slate-600">
                                                                {c.contactOrigin || (c.isReferral ? "Indicação" : "—")}
                                                            </TableCell>
                                                        );

                                                    case "actions":
                                                        return (
                                                            <TableCell key={colId} className="text-right">
                                                                <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        className="h-8 w-8 p-0 text-[#0F6570] hover:bg-[#0F6570]/10"
                                                                        onClick={() => setLocation(`/admin/clientes/${c.id}`)}
                                                                        title="Ver perfil e apólices"
                                                                    >
                                                                        <Eye className="h-4 w-4" />
                                                                    </Button>

                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        className="h-8 w-8 p-0 text-emerald-600 hover:bg-emerald-50"
                                                                        onClick={() => openCreateApoliceForClient(c.id)}
                                                                        title="Criar Apólice para este cliente (com PDF)"
                                                                    >
                                                                        <Plus className="h-4 w-4" />
                                                                    </Button>

                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        className="h-8 w-8 p-0 text-slate-600 hover:bg-slate-100"
                                                                        onClick={() => openEdit(c)}
                                                                        title="Editar dados do cliente"
                                                                    >
                                                                        <Pencil className="h-4 w-4" />
                                                                    </Button>

                                                                    {isAdmin && (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                                            onClick={() => setDeleteTarget(c)}
                                                                            title="Excluir cliente"
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    )}
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

                {/* ── PAGINATION CONTROLS ─────────────────────────────────────── */}
                <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                        <span>Exibindo</span>
                        <Select value={String(pageSize)} onValueChange={v => { setPageSize(Number(v)); setCurrentPage(1); }}>
                            <SelectTrigger className="h-8 w-16 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="25">25</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                            </SelectContent>
                        </Select>
                        <span>de <strong>{filtered.length}</strong> clientes encontrados</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage <= 1}
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            className="h-8 px-2 text-xs"
                        >
                            <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Anterior
                        </Button>
                        <span className="px-2 font-semibold">
                            Página {currentPage} de {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage >= totalPages}
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            className="h-8 px-2 text-xs"
                        >
                            Próxima <ChevronRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* ── CLIENT CREATE / EDIT MODAL ──────────────────────────────────── */}
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-bold text-xl text-slate-900">
                            {editTarget ? "Editar Cliente" : "Novo Cliente de Seguro"}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4 py-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label className="text-xs font-semibold text-slate-700">Tipo de Cliente *</Label>
                                <Select value={formData.type} onValueChange={v => setField("type", v)}>
                                    <SelectTrigger className="mt-1 h-10 text-sm"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="individual">Pessoa Física</SelectItem>
                                        <SelectItem value="company">Pessoa Jurídica</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="text-xs font-semibold text-slate-700">Status do Cliente *</Label>
                                <Select value={formData.status} onValueChange={v => setField("status", v)}>
                                    <SelectTrigger className="mt-1 h-10 text-sm"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ativo">Ativo</SelectItem>
                                        <SelectItem value="inativo">Não Ativo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="md:col-span-2">
                                <Label className="text-xs font-semibold text-slate-700">
                                    {formData.type === "company" ? "Razão Social / Nome da Empresa *" : "Nome Completo *"}
                                </Label>
                                <Input
                                    value={formData.nome}
                                    onChange={e => setField("nome", e.target.value)}
                                    placeholder={formData.type === "company" ? "Ex: Silva & Filhos LTDA" : "Ex: Maria Silva"}
                                    required
                                    className="mt-1 h-10 text-sm"
                                />
                            </div>

                            <div>
                                <Label className="text-xs font-semibold text-slate-700">
                                    {formData.type === "company" ? "CNPJ" : "CPF"}
                                </Label>
                                <Input
                                    value={formData.cpfCnpj}
                                    onChange={e => setField("cpfCnpj", e.target.value)}
                                    placeholder={formData.type === "company" ? "00.000.000/0001-00" : "000.000.000-00"}
                                    className="mt-1 h-10 font-mono text-sm"
                                />
                            </div>

                            <div>
                                <Label className="text-xs font-semibold text-slate-700">
                                    {formData.type === "company" ? "Data de Abertura" : "Data de Nascimento"}
                                </Label>
                                <Input
                                    type="date"
                                    value={formData.dataNascimento}
                                    onChange={e => setField("dataNascimento", e.target.value)}
                                    className="mt-1 h-10 text-sm"
                                />
                            </div>

                            <div>
                                <Label className="text-xs font-semibold text-slate-700">Telefone / Celular</Label>
                                <Input
                                    value={formData.telefone}
                                    onChange={e => setField("telefone", e.target.value)}
                                    placeholder="(11) 98765-4321"
                                    className="mt-1 h-10 text-sm"
                                />
                            </div>

                            <div>
                                <Label className="text-xs font-semibold text-slate-700">WhatsApp</Label>
                                <Input
                                    value={formData.whatsapp}
                                    onChange={e => setField("whatsapp", e.target.value)}
                                    placeholder="(11) 98765-4321"
                                    className="mt-1 h-10 text-sm"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <Label className="text-xs font-semibold text-slate-700">E-mail</Label>
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setField("email", e.target.value)}
                                    placeholder="cliente@exemplo.com.br"
                                    className="mt-1 h-10 text-sm"
                                />
                            </div>

                            {formData.type === "company" && (
                                <>
                                    <div className="md:col-span-2 border-t pt-3 mt-1 font-semibold text-xs text-[#0F6570] uppercase tracking-wider">
                                        Representante Legal / Contato Comercial
                                    </div>
                                    <div>
                                        <Label className="text-xs text-slate-600">Nome do Representante</Label>
                                        <Input
                                            value={formData.nomeRepresentante}
                                            onChange={e => setField("nomeRepresentante", e.target.value)}
                                            placeholder="Ex: Carlos Oliveira"
                                            className="mt-1 h-9 text-xs"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs text-slate-600">Telefone do Representante</Label>
                                        <Input
                                            value={formData.telefoneRepresentante}
                                            onChange={e => setField("telefoneRepresentante", e.target.value)}
                                            placeholder="(11) 99999-9999"
                                            className="mt-1 h-9 text-xs"
                                        />
                                    </div>
                                </>
                            )}

                            <div>
                                <Label className="text-xs font-semibold text-slate-700">Cidade</Label>
                                <Input
                                    value={formData.cidade}
                                    onChange={e => setField("cidade", e.target.value)}
                                    placeholder="São Paulo"
                                    className="mt-1 h-10 text-sm"
                                />
                            </div>

                            <div>
                                <Label className="text-xs font-semibold text-slate-700">Estado (UF)</Label>
                                <Select value={formData.estado} onValueChange={v => setField("estado", v)}>
                                    <SelectTrigger className="mt-1 h-10 text-sm"><SelectValue placeholder="Selecione o estado" /></SelectTrigger>
                                    <SelectContent>
                                        {ESTADOS.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="md:col-span-2">
                                <Label className="text-xs font-semibold text-slate-700">Endereço Completo</Label>
                                <Input
                                    value={formData.endereco}
                                    onChange={e => setField("endereco", e.target.value)}
                                    placeholder="Rua, número, complemento e bairro"
                                    className="mt-1 h-10 text-sm"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <Label className="text-xs font-semibold text-slate-700">Observações</Label>
                                <Textarea
                                    value={formData.observacoes}
                                    onChange={e => setField("observacoes", e.target.value)}
                                    rows={2}
                                    placeholder="Anotações internas sobre o cliente..."
                                    className="mt-1 text-sm"
                                />
                            </div>
                        </div>

                        <DialogFooter className="pt-3 border-t border-slate-200 gap-2">
                            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={saveMutation.isPending} className="bg-[#0F6570] hover:bg-[#0A454D] text-white font-bold px-6">
                                {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                {editTarget ? "Salvar Alterações" : "Cadastrar Cliente"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── APOLICE DIALOG (COM ANEXO PDF E AUTO-FILL) ───────────────────── */}
            <ApoliceDialog
                open={showApoliceModal}
                onOpenChange={setShowApoliceModal}
                defaultClienteId={targetClienteForApolice}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ["/api/clientes"] });
                    queryClient.invalidateQueries({ queryKey: ["/api/apolices"] });
                }}
            />

            {/* ── SMART UNIVERSAL SPREADSHEET IMPORTER ────────────────────────── */}
            <SmartSpreadsheetImporter
                open={showSmartImportModal}
                onOpenChange={setShowSmartImportModal}
                file={uploadedFile}
                onImportSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ["/api/clientes"] });
                    queryClient.invalidateQueries({ queryKey: ["/api/apolices"] });
                    queryClient.invalidateQueries({ queryKey: ["/api/seguros/dashboard"] });
                    toast({
                        title: "Importação concluída!",
                        description: "Os dados da planilha foram salvos na base de clientes com sucesso.",
                    });
                }}
            />

            {/* ── DELETE CLIENT CONFIRMATION ──────────────────────────────────── */}
            <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remover Cliente?</AlertDialogTitle>
                        <AlertDialogDescription>
                            O cliente <strong>{deleteTarget?.nome}</strong> e todas as apólices associadas serão removidos permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
                        >
                            Remover
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
