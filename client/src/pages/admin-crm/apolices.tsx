import { useState, useRef, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Apolice, Cliente, Seguradora, ProdutoSeguro, User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Loader2, Plus, Pencil, Trash2, FileText, Search, Filter, AlertTriangle,
    CheckCircle, XCircle, Clock, Eye, FileSpreadsheet, Sparkles, Download,
    SlidersHorizontal, ChevronLeft, ChevronRight, RotateCcw, Shield,
    TrendingUp, ExternalLink, Calendar, CheckCircle2, ChevronDown
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useLocation } from "wouter";
import * as XLSX from "xlsx";
import { ApoliceDialog } from "@/components/ApoliceDialog";
import { SmartSpreadsheetImporter } from "@/components/SmartSpreadsheetImporter";

// Formatação segura de datas (NUNCA LANÇA RangeError)
function formatDateSafe(val: any, pattern = "dd/MM/yyyy"): string {
    if (!val) return "—";
    if (typeof val === "string") {
        const trimmed = val.trim();
        if (!trimmed) return "—";
        // Se já está no formato brasileiro DD/MM/AAAA ou DD/MM/AA
        if (/^\d{2}\/\d{2}\/\d{2,4}$/.test(trimmed)) return trimmed;
        // ISO YYYY-MM-DD
        const parts = trimmed.split("T")[0].split("-");
        if (parts.length === 3 && parts[0].length === 4) {
            const y = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10) - 1;
            const d = parseInt(parts[2], 10);
            const dt = new Date(y, m, d);
            if (!isNaN(dt.getTime())) {
                try {
                    return format(dt, pattern, { locale: ptBR });
                } catch {
                    return `${parts[2]}/${parts[1]}/${parts[0]}`;
                }
            }
        }
    }
    try {
        const dt = new Date(val);
        if (isNaN(dt.getTime())) return typeof val === "string" ? val : "—";
        return format(dt, pattern, { locale: ptBR });
    } catch {
        return typeof val === "string" ? val : "—";
    }
}

/** Converte qualquer formato de prêmio para número, retorna null se inválido */
function parsePremio(val: string | null | undefined): number | null {
    if (!val) return null;
    let raw = String(val).replace(/^R\$\s*/i, "").replace(/\s/g, "").trim();
    if (!raw) return null;
    // Formato brasileiro com separador de milhar: 1.234,56
    if (raw.includes(",") && raw.includes(".")) {
        raw = raw.replace(/\./g, "").replace(",", ".");
    } else if (raw.includes(",")) {
        raw = raw.replace(",", ".");
    }
    const num = parseFloat(raw);
    return isNaN(num) ? null : num;
}

function fmtPremio(val: string | null | undefined): string {
    const num = parsePremio(val);
    if (num === null) return "—";
    return `R$ ${num.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

function getAlertInfo(apolice: Apolice) {
    const status = (apolice.status || "").toLowerCase();
    if (status === "cancelada") {
        return { label: "Cancelada", color: "bg-gray-100 text-gray-700 border-gray-300", icon: XCircle };
    }
    if (status === "em_atraso") {
        return { label: "Em Atraso", color: "bg-red-100 text-red-800 border-red-300", icon: AlertTriangle };
    }
    if (status === "pendente") {
        return { label: "Pendente", color: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: Clock };
    }
    if (status === "vencida") {
        return { label: "Vencida", color: "bg-slate-200 text-slate-700 border-slate-300", icon: XCircle };
    }

    if (!apolice.fimVigencia) {
        return { label: "Ativa", color: "bg-emerald-100 text-emerald-800 border-emerald-300", icon: CheckCircle };
    }

    try {
        const fim = new Date(apolice.fimVigencia);
        if (isNaN(fim.getTime())) {
            return { label: "Ativa", color: "bg-emerald-100 text-emerald-800 border-emerald-300", icon: CheckCircle };
        }
        fim.setHours(23, 59, 59, 999);
        const hoje = new Date();
        const dias = differenceInDays(fim, hoje);

        if (dias < 0) {
            return { label: "Ativa", color: "bg-emerald-100 text-emerald-800 border-emerald-300", icon: CheckCircle };
        }
        if (dias <= 15) return { label: `Vence em ${dias}d`, color: "bg-red-100 text-red-800 border-red-300", icon: AlertTriangle };
        if (dias <= 30) return { label: `Vence em ${dias}d`, color: "bg-orange-100 text-orange-800 border-orange-300", icon: AlertTriangle };
        if (dias <= 60) return { label: `Vence em ${dias}d`, color: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: AlertTriangle };
        return { label: "Ativa", color: "bg-emerald-100 text-emerald-800 border-emerald-300", icon: CheckCircle };
    } catch {
        return { label: "Ativa", color: "bg-emerald-100 text-emerald-800 border-emerald-300", icon: CheckCircle };
    }
}

export interface ColumnConfig {
    id: string;
    label: string;
    minWidth?: string;
    align?: "left" | "right";
}

export const ALL_APOLICE_COLUMNS: ColumnConfig[] = [
    { id: "numeroProduto", label: "Nº Apólice / Produto", minWidth: "220px" },
    { id: "cliente", label: "Cliente / Razão Social", minWidth: "220px" },
    { id: "status", label: "Status (Editável)", minWidth: "160px" },
    { id: "seguradora", label: "Seguradora", minWidth: "160px" },
    { id: "vigencia", label: "Vigência", minWidth: "170px" },
    { id: "premio", label: "Prêmio Mensal / Total", minWidth: "150px" },
    { id: "valorSegurado", label: "Valor Segurado (LMG)", minWidth: "150px" },
    { id: "corretor", label: "Corretor Responsável", minWidth: "160px" },
    { id: "pdf", label: "PDF Anexo", minWidth: "110px" },
    { id: "actions", label: "Ações", minWidth: "150px", align: "right" },
];

const COLUMNS_STORAGE_KEY = "crm_apolices_columns_v2";
const HIDDEN_COLUMNS_STORAGE_KEY = "crm_apolices_hidden_v2";

function loadSavedColumnOrder(): string[] {
    try {
        const raw = localStorage.getItem(COLUMNS_STORAGE_KEY);
        if (!raw) return ALL_APOLICE_COLUMNS.map(c => c.id);
        const parsed: string[] = JSON.parse(raw);
        const valid = parsed.filter(id => ALL_APOLICE_COLUMNS.some(c => c.id === id));
        ALL_APOLICE_COLUMNS.forEach(c => {
            if (!valid.includes(c.id)) valid.push(c.id);
        });
        return valid;
    } catch {
        return ALL_APOLICE_COLUMNS.map(c => c.id);
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

export default function ApolicesPage() {
    const { toast } = useToast();
    const { user } = useAuth();
    const [, setLocation] = useLocation();
    const isAdmin = user?.role === "admin";
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initial status from URL search query (e.g., ?status=em_atraso)
    const initialStatus = typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("status") || "all"
        : "all";

    // Filters
    const [search, setSearch] = useState("");
    const [filterCliente, setFilterCliente] = useState<string>("all");
    const [filterProduto, setFilterProduto] = useState<string>("all");
    const [filterSeguradora, setFilterSeguradora] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>(initialStatus);
    const [filterCorretor, setFilterCorretor] = useState<string>("all");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Columns Customization
    const [columnOrder, setColumnOrder] = useState<string[]>(loadSavedColumnOrder);
    const [hiddenColumns, setHiddenColumns] = useState<string[]>(loadSavedHiddenColumns);

    // Modals
    const [deleteTarget, setDeleteTarget] = useState<Apolice | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingApolice, setEditingApolice] = useState<Apolice | null>(null);

    // Smart Spreadsheet Importer State
    const [smartImportFile, setSmartImportFile] = useState<File | null>(null);
    const [isSmartImportOpen, setIsSmartImportOpen] = useState(false);

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

    // Queries
    const { data: apolices, isLoading, error } = useQuery<Apolice[]>({
        queryKey: ["/api/apolices"],
    });

    const { data: clientes } = useQuery<Cliente[]>({ queryKey: ["/api/clientes"] });
    const { data: seguradoras } = useQuery<Seguradora[]>({ queryKey: ["/api/seguradoras"] });
    const { data: produtos } = useQuery<ProdutoSeguro[]>({ queryKey: ["/api/produtos-seguro"] });
    const { data: users } = useQuery<User[]>({ queryKey: ["/api/users"] });

    const getClienteNome = (id: number | null | undefined) => {
        if (!id) return "—";
        return clientes?.find(c => c.id === id)?.nome || "—";
    };
    const getProdutoNome = (id: number | null | undefined) => {
        if (!id) return "—";
        return produtos?.find(p => p.id === id)?.nome || "—";
    };
    const getSeguradoraNome = (id: number | null | undefined) => {
        if (!id) return "—";
        return seguradoras?.find(s => s.id === id)?.nome || "—";
    };
    const getCorretorNome = (id: number | null | undefined) => {
        if (!id) return "—";
        return users?.find(u => u.id === id)?.name || "—";
    };

    // 1-Click Status Update Mutation
    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: number; status: string }) => {
            const res = await apiRequest("PATCH", `/api/apolices/${id}`, { status });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || "Erro ao atualizar status");
            }
            return res.json();
        },
        onSuccess: (updated) => {
            queryClient.setQueryData<Apolice[]>(["/api/apolices"], (old) => {
                if (!old) return [];
                return old.map(a => a.id === updated.id ? { ...a, status: updated.status } : a);
            });
            queryClient.invalidateQueries({ queryKey: ["/api/seguros/dashboard"] });
            toast({
                title: "Status atualizado! ✅",
                description: `Apólice alterada para "${updated.status.toUpperCase()}".`,
            });
        },
        onError: (e: Error) => {
            toast({ title: "Erro ao atualizar status", description: e.message, variant: "destructive" });
        }
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/apolices/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/apolices"] });
            queryClient.invalidateQueries({ queryKey: ["/api/seguros/dashboard"] });
            toast({ title: "Apólice removida com sucesso" });
            setDeleteTarget(null);
        },
        onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
    });

    // Filtering
    const filtered = useMemo(() => {
        if (!apolices) return [];
        return apolices.filter(a => {
            const q = search.toLowerCase().trim();
            const clienteNome = getClienteNome(a.clienteId).toLowerCase();
            const prodNome = getProdutoNome(a.produtoId).toLowerCase();
            const segNome = getSeguradoraNome(a.seguradoraId).toLowerCase();
            const numApolice = (a.numeroApolice || "").toLowerCase();
            const numProp = (a.numeroProposta || a.idProposta || "").toLowerCase();

            const matchSearch = !q ||
                clienteNome.includes(q) ||
                prodNome.includes(q) ||
                segNome.includes(q) ||
                numApolice.includes(q) ||
                numProp.includes(q);

            const matchCliente = filterCliente === "all" || String(a.clienteId) === filterCliente;
            const matchProduto = filterProduto === "all" || String(a.produtoId) === filterProduto;
            const matchSeguradora = filterSeguradora === "all" || String(a.seguradoraId) === filterSeguradora;
            const matchStatus = filterStatus === "all" || (a.status || "ativa") === filterStatus;
            const matchCorretor = filterCorretor === "all" || String(a.corretorId) === filterCorretor;

            return matchSearch && matchCliente && matchProduto && matchSeguradora && matchStatus && matchCorretor;
        });
    }, [apolices, search, filterCliente, filterProduto, filterSeguradora, filterStatus, filterCorretor, clientes, produtos, seguradoras]);

    // Statistics Cards Calculations
    const stats = useMemo(() => {
        if (!apolices) return { total: 0, ativas: 0, pendentesAtraso: 0, totalPremio: 0 };
        let ativas = 0;
        let pendentesAtraso = 0;
        let totalPremio = 0;

        for (const a of apolices) {
            const st = (a.status || "").toLowerCase();
            if (st === "ativa") ativas++;
            if (st === "em_atraso" || st === "pendente") pendentesAtraso++;

            const num = parsePremio(a.premio);
            if (num) totalPremio += num;
        }

        return {
            total: apolices.length,
            ativas,
            pendentesAtraso,
            totalPremio
        };
    }, [apolices]);

    // Pagination
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const paginatedApolices = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, currentPage, pageSize]);

    // Handle Spreadsheet File Upload
    const handleSpreadsheetFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSmartImportFile(file);
            setIsSmartImportOpen(true);
        }
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // Export to Excel
    const handleExportExcel = () => {
        if (filtered.length === 0) {
            toast({ title: "Nenhuma apólice para exportar", variant: "destructive" });
            return;
        }

        const dataToExport = filtered.map(a => ({
            "Nº Apólice": a.numeroApolice || "",
            "Cliente": getClienteNome(a.clienteId),
            "Seguradora": getSeguradoraNome(a.seguradoraId),
            "Produto": getProdutoNome(a.produtoId),
            "Status": a.status || "ativa",
            "Início Vigência": formatDateSafe(a.inicioVigencia),
            "Fim Vigência": formatDateSafe(a.fimVigencia),
            "Prêmio": fmtPremio(a.premio),
            "Valor Segurado": a.valorSegurado ? `R$ ${a.valorSegurado}` : "",
            "Corretor": getCorretorNome(a.corretorId),
            "Nº Proposta": a.numeroProposta || a.idProposta || "",
            "Link PDF": a.pdfApolice || "",
            "Observações": a.observacoes || "",
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Apolices");
        XLSX.writeFile(wb, `Apolices_Monteiro_${format(new Date(), "yyyy-MM-dd")}.xlsx`);

        toast({
            title: "Exportação Concluída! 📊",
            description: `${filtered.length} apólices exportadas para o Excel.`,
        });
    };

    // Download Sample Template
    const handleDownloadTemplate = () => {
        const templateData = [
            {
                "Cliente": "Exemplo Silva Santos",
                "CPF/CNPJ": "123.456.789-00",
                "Número da Apólice": "01.077.531.000123",
                "Seguradora": "Porto Seguro",
                "Produto": "Auto",
                "Status": "Ativa",
                "Início da Vigência": "01/01/2026",
                "Fim da Vigência": "01/01/2027",
                "Prêmio": "1850.00",
                "Valor Segurado": "85000.00",
                "Corretor": "Gabriel Eduardo",
                "Nº Proposta": "PROP-9988",
            }
        ];
        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Modelo_Apolices");
        XLSX.writeFile(wb, "Modelo_Importacao_Apolices.xlsx");
        toast({ title: "Modelo baixado com sucesso! 📄" });
    };

    // Toggle Column Visibility
    const toggleColumnVisibility = (colId: string) => {
        setHiddenColumns(prev =>
            prev.includes(colId) ? prev.filter(id => id !== colId) : [...prev, colId]
        );
    };

    // Move column in order
    const moveColumn = (index: number, direction: "up" | "down") => {
        const newOrder = [...columnOrder];
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newOrder.length) return;
        const temp = newOrder[index];
        newOrder[index] = newOrder[targetIndex];
        newOrder[targetIndex] = temp;
        setColumnOrder(newOrder);
    };

    // Visible Columns
    const visibleColumns = useMemo(() => {
        return columnOrder
            .map(id => ALL_APOLICE_COLUMNS.find(c => c.id === id))
            .filter((c): c is ColumnConfig => !!c && !hiddenColumns.includes(c.id));
    }, [columnOrder, hiddenColumns]);

    if (isLoading) {
        return (
            <div className="flex flex-col h-[60vh] items-center justify-center space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-[#0F6570]" />
                <p className="text-sm font-semibold text-slate-600">Carregando carteira de apólices...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center space-y-4 my-8">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
                <h3 className="text-lg font-bold text-red-800">Erro ao carregar apólices</h3>
                <p className="text-sm text-red-600 max-w-md mx-auto">
                    {(error as Error)?.message || "Não foi possível carregar as informações das apólices do servidor."}
                </p>
                <Button
                    onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/apolices"] })}
                    className="bg-[#0F6570] hover:bg-[#0A454D] text-white font-bold"
                >
                    Tentar Novamente
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* ── TOP ACTION HEADER ────────────────────────────────────────────── */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-display font-bold text-gray-900 flex items-center gap-2">
                        <Shield className="h-7 w-7 text-[#0F6570]" />
                        Apólices de Seguro
                    </h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Gerenciamento completo, edição em tempo real, filtros dinâmicos e leitor inteligente de PDF e Planilhas.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Hidden input for Smart Spreadsheet File Upload */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleSpreadsheetFileSelect}
                        accept=".xlsx,.xls,.csv"
                        className="hidden"
                    />

                    {/* Import Smart Spreadsheet Button */}
                    <Button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold gap-2 shadow-md h-11 px-4 rounded-xl shrink-0"
                        title="Importar planilha com detector inteligente de colunas, clientes e apólices"
                    >
                        <FileSpreadsheet className="h-4 w-4 text-emerald-200" />
                        <span className="flex items-center gap-1">
                            Planilha Inteligente <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                        </span>
                    </Button>

                    {/* Export to Excel */}
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleExportExcel}
                        className="border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold gap-1.5 h-11 px-3.5 rounded-xl shrink-0"
                        title="Exportar dados filtrados para Excel (.xlsx)"
                    >
                        <Download className="h-4 w-4 text-[#0F6570]" />
                        Exportar
                    </Button>

                    {/* Download Template */}
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={handleDownloadTemplate}
                        className="text-xs text-slate-600 hover:text-slate-900 h-11 px-2.5 rounded-xl shrink-0"
                        title="Baixar modelo de planilha para preenchimento"
                    >
                        Modelo .xlsx
                    </Button>

                    {/* Create Policy (PDF) Button */}
                    <Button
                        onClick={() => {
                            setEditingApolice(null);
                            setShowCreateModal(true);
                        }}
                        className="bg-[#0F6570] hover:bg-[#0A454D] text-white font-bold gap-2 shadow-lg shadow-[#0F6570]/20 h-11 px-5 rounded-xl shrink-0"
                    >
                        <Plus className="h-4 w-4" /> Criar Apólice (PDF)
                    </Button>
                </div>
            </div>

            {/* ── KPI STATS CARDS ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total de Apólices</p>
                        <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">Cadastradas no sistema</p>
                    </div>
                    <div className="p-3 bg-[#0F6570]/10 text-[#0F6570] rounded-2xl">
                        <Shield className="h-6 w-6" />
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Apólices Ativas</p>
                        <h3 className="text-2xl font-bold text-emerald-700 mt-1">{stats.ativas}</h3>
                        <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
                            {stats.total > 0 ? `${Math.round((stats.ativas / stats.total) * 100)}% da carteira` : "—"}
                        </p>
                    </div>
                    <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
                        <CheckCircle2 className="h-6 w-6" />
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Atenção / A Vencer</p>
                        <h3 className="text-2xl font-bold text-amber-700 mt-1">{stats.pendentesAtraso}</h3>
                        <p className="text-[11px] text-amber-600 font-medium mt-0.5">Pendentes ou em atraso</p>
                    </div>
                    <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl">
                        <AlertTriangle className="h-6 w-6" />
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Prêmio em Carteira</p>
                        <h3 className="text-2xl font-bold text-[#0F6570] mt-1">
                            R$ {stats.totalPremio.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">Soma total de prêmios</p>
                    </div>
                    <div className="p-3 bg-teal-100 text-teal-800 rounded-2xl">
                        <TrendingUp className="h-6 w-6" />
                    </div>
                </div>
            </div>

            {/* ── FILTERS & SEARCH BAR ────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-4">
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            className="pl-10 h-10 rounded-xl bg-slate-50 border-slate-200 focus:bg-white text-sm"
                            placeholder="Buscar por cliente, produto, seguradora, nº da apólice ou proposta..."
                            value={search}
                            onChange={e => {
                                setSearch(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>

                    {/* Column Customizer Popover */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className="h-10 border-slate-200 gap-2 text-xs font-semibold rounded-xl text-slate-700 hover:bg-slate-100 shrink-0"
                            >
                                <SlidersHorizontal className="h-4 w-4 text-[#0F6570]" />
                                Personalizar Colunas ({visibleColumns.length})
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-3 shadow-xl rounded-2xl" align="end">
                            <div className="flex items-center justify-between border-b pb-2 mb-2">
                                <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                                    Colunas da Tabela
                                </h4>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setColumnOrder(ALL_APOLICE_COLUMNS.map(c => c.id));
                                        setHiddenColumns([]);
                                    }}
                                    className="h-6 text-[10px] text-muted-foreground hover:text-slate-900"
                                >
                                    <RotateCcw className="h-3 w-3 mr-1" /> Restaurar Padrão
                                </Button>
                            </div>
                            <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                                {columnOrder.map((colId, idx) => {
                                    const col = ALL_APOLICE_COLUMNS.find(c => c.id === colId);
                                    if (!col) return null;
                                    const isVisible = !hiddenColumns.includes(colId);
                                    return (
                                        <div
                                            key={colId}
                                            className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 transition-colors text-xs"
                                        >
                                            <label className="flex items-center gap-2 cursor-pointer flex-1">
                                                <Checkbox
                                                    checked={isVisible}
                                                    onCheckedChange={() => toggleColumnVisibility(colId)}
                                                />
                                                <span className={isVisible ? "font-medium text-slate-800" : "text-slate-400 line-through"}>
                                                    {col.label}
                                                </span>
                                            </label>
                                            <div className="flex items-center gap-0.5">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-5 w-5 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                                                    disabled={idx === 0}
                                                    onClick={() => moveColumn(idx, "up")}
                                                >
                                                    ▲
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-5 w-5 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                                                    disabled={idx === columnOrder.length - 1}
                                                    onClick={() => moveColumn(idx, "down")}
                                                >
                                                    ▼
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-1 border-t border-slate-100">
                    <div>
                        <Label className="text-xs text-slate-600 font-medium">Cliente</Label>
                        <SearchableSelect
                            options={[
                                { value: "all", label: "Todos os clientes" },
                                ...(clientes ?? []).map(c => ({ value: String(c.id), label: c.nome })),
                            ]}
                            value={filterCliente}
                            onValueChange={val => {
                                setFilterCliente(val);
                                setCurrentPage(1);
                            }}
                            placeholder="Todos"
                            searchPlaceholder="Pesquisar cliente..."
                            triggerClassName="h-9 text-xs rounded-xl mt-1"
                        />
                    </div>
                    <div>
                        <Label className="text-xs text-slate-600 font-medium">Produto / Ramo</Label>
                        <SearchableSelect
                            options={[
                                { value: "all", label: "Todos os produtos" },
                                ...(produtos ?? []).map(p => ({ value: String(p.id), label: p.nome })),
                            ]}
                            value={filterProduto}
                            onValueChange={val => {
                                setFilterProduto(val);
                                setCurrentPage(1);
                            }}
                            placeholder="Todos"
                            searchPlaceholder="Pesquisar produto..."
                            triggerClassName="h-9 text-xs rounded-xl mt-1"
                        />
                    </div>
                    <div>
                        <Label className="text-xs text-slate-600 font-medium">Seguradora</Label>
                        <SearchableSelect
                            options={[
                                { value: "all", label: "Todas seguradoras" },
                                ...(seguradoras ?? []).map(s => ({ value: String(s.id), label: s.nome })),
                            ]}
                            value={filterSeguradora}
                            onValueChange={val => {
                                setFilterSeguradora(val);
                                setCurrentPage(1);
                            }}
                            placeholder="Todas"
                            searchPlaceholder="Pesquisar seguradora..."
                            triggerClassName="h-9 text-xs rounded-xl mt-1"
                        />
                    </div>
                    <div>
                        <Label className="text-xs text-slate-600 font-medium">Status da Apólice</Label>
                        <Select
                            value={filterStatus}
                            onValueChange={val => {
                                setFilterStatus(val);
                                setCurrentPage(1);
                            }}
                        >
                            <SelectTrigger className="h-9 text-xs rounded-xl mt-1">
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os status</SelectItem>
                                <SelectItem value="ativa">Ativa</SelectItem>
                                <SelectItem value="em_atraso">Em Atraso</SelectItem>
                                <SelectItem value="pendente">Pendente</SelectItem>
                                <SelectItem value="vencida">Vencida</SelectItem>
                                <SelectItem value="cancelada">Cancelada</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label className="text-xs text-slate-600 font-medium">Corretor</Label>
                        <SearchableSelect
                            options={[
                                { value: "all", label: "Todos corretores" },
                                ...(users ?? []).map(u => ({ value: String(u.id), label: u.name })),
                            ]}
                            value={filterCorretor}
                            onValueChange={val => {
                                setFilterCorretor(val);
                                setCurrentPage(1);
                            }}
                            placeholder="Todos"
                            searchPlaceholder="Pesquisar corretor..."
                            triggerClassName="h-9 text-xs rounded-xl mt-1"
                        />
                    </div>
                </div>

                {(search || filterCliente !== "all" || filterProduto !== "all" || filterSeguradora !== "all" || filterStatus !== "all" || filterCorretor !== "all") && (
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <span className="text-muted-foreground">
                            Filtros ativos: exibindo <strong>{filtered.length}</strong> de {apolices?.length || 0} apólices.
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setSearch("");
                                setFilterCliente("all");
                                setFilterProduto("all");
                                setFilterSeguradora("all");
                                setFilterStatus("all");
                                setFilterCorretor("all");
                                setCurrentPage(1);
                            }}
                            className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        >
                            Limpar Filtros
                        </Button>
                    </div>
                )}
            </div>

            {/* ── APOLICES TABLE ──────────────────────────────────────────────── */}
            <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50/80 border-b border-slate-200">
                            <TableRow>
                                {visibleColumns.map(col => (
                                    <TableHead
                                        key={col.id}
                                        style={{ minWidth: col.minWidth }}
                                        className={`font-bold text-xs uppercase tracking-wider text-slate-700 py-3.5 ${
                                            col.align === "right" ? "text-right" : "text-left"
                                        }`}
                                    >
                                        {col.label}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedApolices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={visibleColumns.length} className="text-center py-20 text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <div className="p-4 bg-slate-100 rounded-full text-slate-400">
                                                <FileText className="h-10 w-10" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 text-base">Nenhuma apólice encontrada</p>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    Tente ajustar seus termos de busca ou crie uma nova apólice.
                                                </p>
                                            </div>
                                            <Button
                                                onClick={() => {
                                                    setEditingApolice(null);
                                                    setShowCreateModal(true);
                                                }}
                                                className="bg-[#0F6570] hover:bg-[#0A454D] text-white text-xs gap-1.5 rounded-xl mt-2"
                                            >
                                                <Plus className="h-3.5 w-3.5" /> Criar Primeira Apólice
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedApolices.map(a => {
                                    const alertInfo = getAlertInfo(a);
                                    const AlertIcon = alertInfo?.icon || CheckCircle;

                                    return (
                                        <TableRow key={a.id} className="hover:bg-slate-50/60 transition-colors group">
                                            {visibleColumns.map(col => {
                                                switch (col.id) {
                                                    case "numeroProduto":
                                                        return (
                                                            <TableCell key={col.id} className="py-3">
                                                                <div className="font-semibold text-slate-900 text-sm">
                                                                    {getProdutoNome(a.produtoId)}
                                                                </div>
                                                                <div className="text-xs font-mono text-slate-500 flex items-center gap-1.5 mt-0.5">
                                                                    <span>{a.numeroApolice || "Sem número"}</span>
                                                                    {a.numeroProposta && (
                                                                        <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                                                                            Prop: {a.numeroProposta}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                        );

                                                    case "cliente":
                                                        return (
                                                            <TableCell key={col.id} className="py-3">
                                                                <button
                                                                    type="button"
                                                                    className="text-[#0F6570] font-bold hover:underline text-left text-sm line-clamp-1 block"
                                                                    onClick={() => setLocation(`/admin/clientes/${a.clienteId}`)}
                                                                    title="Ver perfil completo do cliente"
                                                                >
                                                                    {getClienteNome(a.clienteId)}
                                                                </button>
                                                            </TableCell>
                                                        );

                                                    case "status":
                                                        return (
                                                            <TableCell key={col.id} className="py-3">
                                                                {/* 1-Click Status Inline Selector */}
                                                                <Select
                                                                    value={a.status || "ativa"}
                                                                    onValueChange={(newStatus) => {
                                                                        updateStatusMutation.mutate({ id: a.id, status: newStatus });
                                                                    }}
                                                                >
                                                                    <SelectTrigger
                                                                        className={`h-7 px-2.5 py-0 rounded-full text-xs font-bold border transition-all shadow-2xs gap-1.5 ${alertInfo.color}`}
                                                                    >
                                                                        <div className="flex items-center gap-1">
                                                                            <AlertIcon className="h-3 w-3 shrink-0" />
                                                                            <span>{alertInfo.label}</span>
                                                                        </div>
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="ativa" className="text-emerald-700 font-semibold">
                                                                            ✓ Ativa
                                                                        </SelectItem>
                                                                        <SelectItem value="em_atraso" className="text-red-700 font-semibold">
                                                                            ⚠ Em Atraso
                                                                        </SelectItem>
                                                                        <SelectItem value="pendente" className="text-yellow-700 font-semibold">
                                                                            ⏳ Pendente
                                                                        </SelectItem>
                                                                        <SelectItem value="vencida" className="text-slate-600 font-semibold">
                                                                            ✕ Vencida
                                                                        </SelectItem>
                                                                        <SelectItem value="cancelada" className="text-gray-500 font-semibold">
                                                                            ⊘ Cancelada
                                                                        </SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </TableCell>
                                                        );

                                                    case "seguradora":
                                                        return (
                                                            <TableCell key={col.id} className="text-slate-700 font-medium text-xs py-3">
                                                                {getSeguradoraNome(a.seguradoraId)}
                                                            </TableCell>
                                                        );

                                                    case "vigencia":
                                                        return (
                                                            <TableCell key={col.id} className="text-xs font-mono text-slate-600 py-3">
                                                                <div className="flex items-center gap-1">
                                                                    <span>{formatDateSafe(a.inicioVigencia)}</span>
                                                                    <span className="text-slate-400">→</span>
                                                                    <span className="font-semibold text-slate-800">{formatDateSafe(a.fimVigencia)}</span>
                                                                </div>
                                                            </TableCell>
                                                        );

                                                    case "premio":
                                                        return (
                                                            <TableCell key={col.id} className="font-bold text-slate-900 text-sm py-3">
                                                                {fmtPremio(a.premio)}
                                                            </TableCell>
                                                        );

                                                    case "valorSegurado":
                                                        return (
                                                            <TableCell key={col.id} className="text-xs font-semibold text-slate-700 py-3">
                                                                {a.valorSegurado ? `R$ ${a.valorSegurado}` : "—"}
                                                            </TableCell>
                                                        );

                                                    case "corretor":
                                                        return (
                                                            <TableCell key={col.id} className="text-xs text-slate-600 py-3">
                                                                {getCorretorNome(a.corretorId)}
                                                            </TableCell>
                                                        );

                                                    case "pdf":
                                                        return (
                                                            <TableCell key={col.id} className="py-3">
                                                                {a.pdfApolice ? (
                                                                    <a
                                                                        href={a.pdfApolice}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-[#0F6570] text-xs font-bold border border-teal-200 transition-colors"
                                                                        title="Abrir arquivo PDF da apólice"
                                                                    >
                                                                        <FileText className="h-3.5 w-3.5" />
                                                                        PDF
                                                                    </a>
                                                                ) : (
                                                                    <span className="text-slate-300 text-xs">—</span>
                                                                )}
                                                            </TableCell>
                                                        );

                                                    case "actions":
                                                        return (
                                                            <TableCell key={col.id} className="text-right py-3">
                                                                <div className="flex justify-end items-center gap-1">
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        title="Ver perfil completo do cliente"
                                                                        onClick={() => setLocation(`/admin/clientes/${a.clienteId}`)}
                                                                        className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900"
                                                                    >
                                                                        <Eye className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        title="Editar Apólice (Dados & PDF)"
                                                                        onClick={() => {
                                                                            setEditingApolice(a);
                                                                            setShowCreateModal(true);
                                                                        }}
                                                                        className="h-8 w-8 p-0 text-[#0F6570] hover:bg-[#0F6570]/10"
                                                                    >
                                                                        <Pencil className="h-4 w-4" />
                                                                    </Button>
                                                                    {isAdmin && (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                                                                            onClick={() => setDeleteTarget(a)}
                                                                            title="Remover apólice"
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

                {/* ── PAGINATION BAR ─────────────────────────────────────────── */}
                <div className="p-4 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <span>Linhas por página:</span>
                        <Select
                            value={String(pageSize)}
                            onValueChange={val => {
                                setPageSize(Number(val));
                                setCurrentPage(1);
                            }}
                        >
                            <SelectTrigger className="h-8 w-16 text-xs bg-white border-slate-200">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="25">25</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                            </SelectContent>
                        </Select>
                        <span>
                            Mostrando {filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} a{" "}
                            {Math.min(currentPage * pageSize, filtered.length)} de {filtered.length} apólices
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className="h-8 px-2.5 text-xs bg-white border-slate-200"
                        >
                            <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Anterior
                        </Button>
                        <span className="px-2 font-medium text-slate-800">
                            Página {currentPage} de {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage >= totalPages}
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            className="h-8 px-2.5 text-xs bg-white border-slate-200"
                        >
                            Próxima <ChevronRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* ── APOLICE DIALOG (CREATE / EDIT WITH SMART PDF READER) ────────── */}
            <ApoliceDialog
                open={showCreateModal}
                onOpenChange={setShowCreateModal}
                editApolice={editingApolice}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ["/api/apolices"] });
                    queryClient.invalidateQueries({ queryKey: ["/api/seguros/dashboard"] });
                }}
            />

            {/* ── SMART SPREADSHEET IMPORTER (EXCEL / CSV VISUALIZER) ────────── */}
            <SmartSpreadsheetImporter
                open={isSmartImportOpen}
                onOpenChange={setIsSmartImportOpen}
                file={smartImportFile}
                onImportSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ["/api/apolices"] });
                    queryClient.invalidateQueries({ queryKey: ["/api/clientes"] });
                    queryClient.invalidateQueries({ queryKey: ["/api/seguros/dashboard"] });
                }}
            />

            {/* ── DELETE CONFIRMATION DIALOG ─────────────────────────────────── */}
            <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remover Apólice?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta apólice será excluída permanentemente. Caso ela possua arquivo PDF associado, o vínculo será desfeito.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
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
