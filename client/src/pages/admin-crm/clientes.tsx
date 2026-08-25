import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Cliente, User, Contact, Seguradora } from "@shared/schema";
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
import { Loader2, Plus, Pencil, Trash2, Users, Search, Eye, Phone, Mail, Download, Upload, FileSpreadsheet, CheckCircle2, User as UserIcon, X, Filter } from "lucide-react";
import { useLocation } from "wouter";
import * as XLSX from "xlsx";

const ESTADOS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    ativa: { label: "Ativa", color: "bg-emerald-100 text-emerald-800" },
    em_atraso: { label: "Em Atraso", color: "bg-red-100 text-red-700" },
    vencida: { label: "Vencida", color: "bg-gray-100 text-gray-600" },
    cancelada: { label: "Cancelada", color: "bg-gray-100 text-gray-500" },
    pendente: { label: "Pendente", color: "bg-yellow-100 text-yellow-700" },
};

interface ParsedClient {
    nome: string;
    cpfCnpj?: string;
    dataNascimento?: string;
    telefone?: string;
    whatsapp?: string;
    email?: string;
    endereco?: string;
    cidade?: string;
    estado?: string;
    observacoes?: string;
    tags?: string;
    nomeRepresentante?: string;
    telefoneRepresentante?: string;
    emailRepresentante?: string;
    idProposta?: string;
    idApolice?: string;
    numeroApolice?: string;
    pdfApolice?: string;
    cobertura?: string;
    premio?: string;
    dataEmissao?: string;
    inicioVigencia?: string;
    statusApolice?: string;
    numeroProposta?: string;
    seguradora?: string;
    fimVigencia?: string;
    linkFatura?: string;
    formaPagamento?: string;
    mesAtraso?: string;
    faturasAberto?: string;
}

export default function ClientesPage() {
    const { toast } = useToast();
    const { user } = useAuth();
    const [, setLocation] = useLocation();
    const isAdmin = user?.role === "admin";
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [search, setSearch] = useState("");
    const [filterSeguradora, setFilterSeguradora] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const [showForm, setShowForm] = useState(false);
    const [editTarget, setEditTarget] = useState<Cliente | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Cliente | null>(null);
    const [selectedContactImport, setSelectedContactImport] = useState("");
    const [showImportModal, setShowImportModal] = useState(false);
    const [previewClients, setPreviewClients] = useState<ParsedClient[]>([]);
    const [importing, setImporting] = useState(false);
    const [importProgress, setImportProgress] = useState(0);

    const [formData, setFormData] = useState({
        nome: "", cpfCnpj: "", dataNascimento: "", telefone: "", whatsapp: "",
        email: "", endereco: "", cidade: "", estado: "", observacoes: "", tags: "",
        responsavelComercialId: "" as string,
        nomeRepresentante: "", telefoneRepresentante: "", emailRepresentante: "",
    });

    // Build query params for server-side filtering (skip sentinel "all")
    const queryParams = new URLSearchParams();
    if (filterSeguradora !== "all") queryParams.set("seguradora", filterSeguradora);
    if (filterStatus !== "all") queryParams.set("status", filterStatus);
    const clientesUrl = `/api/clientes${queryParams.toString() ? "?" + queryParams.toString() : ""}`;

    const { data: clientes, isLoading } = useQuery<Cliente[]>({
        queryKey: ["/api/clientes", filterSeguradora, filterStatus],
        queryFn: async () => {
            const res = await fetch(clientesUrl, { credentials: "include" });
            if (!res.ok) throw new Error("Erro ao carregar clientes");
            return res.json();
        },
    });

    const { data: users } = useQuery<User[]>({ queryKey: ["/api/users"] });
    const { data: contacts } = useQuery<Contact[]>({ queryKey: ["/api/contacts"] });
    const { data: seguradoras } = useQuery<Seguradora[]>({ queryKey: ["/api/seguradoras"] });

    const openCreate = () => {
        setEditTarget(null);
        setFormData({ nome: "", cpfCnpj: "", dataNascimento: "", telefone: "", whatsapp: "", email: "", endereco: "", cidade: "", estado: "", observacoes: "", tags: "", responsavelComercialId: "", nomeRepresentante: "", telefoneRepresentante: "", emailRepresentante: "" });
        setShowForm(true);
        setSelectedContactImport("");
    };

    const openEdit = (c: any) => {
        setEditTarget(c);
        setFormData({
            nome: c.nome || "",
            cpfCnpj: c.cpfCnpj || "",
            dataNascimento: c.dataNascimento || "",
            telefone: c.telefone || "",
            whatsapp: c.whatsapp || "",
            email: c.email || "",
            endereco: c.endereco || "",
            cidade: c.cidade || "",
            estado: c.estado || "",
            observacoes: c.observacoes || "",
            tags: c.tags || "",
            responsavelComercialId: c.responsavelComercialId ? String(c.responsavelComercialId) : "",
            nomeRepresentante: c.nomeRepresentante || "",
            telefoneRepresentante: c.telefoneRepresentante || "",
            emailRepresentante: c.emailRepresentante || "",
        });
        setShowForm(true);
    };

    const saveMutation = useMutation({
        mutationFn: async () => {
            const body = {
                ...formData,
                responsavelComercialId: formData.responsavelComercialId ? parseInt(formData.responsavelComercialId) : null,
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
            toast({ title: "Cliente removido" });
            setDeleteTarget(null);
        },
        onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
    });

    // Excel Download Template — matches Azos report format exactly
    const handleDownloadTemplate = () => {
        const templateData = [
            {
                "Nome do cliente": "Leandro Antonio Russo Perez",
                "CPF do cliente": "30629219869",
                "Telefone do cliente": "+5511972818059",
                "Nome do responsável": "MONTEIROS CORRETORA DE SEGUROS LTDA",
                "Telefone do responsável": "+5511944547444",
                "Email do responsável": "carolina@monteirocorretora.com.br",
                "ID da proposta": "6a637ea3830b5ae03b5c3996",
                "ID da apólice": "6a6b8e34c1ef83bff7d03134",
                "Número da apólice": "056902026000213910033195000000",
                "PDF da apólice": "https://api.azos.com.br/pdf/6a637ea3830b5ae03b5c3996/insurance_policy",
                "Coberturas": "Morte, IPT, DG30, Cirurgias 2.0, DIH, Family-funeral-assistance",
                "Premio": "R$ 356.16",
                "Data de emissão da apólice": "24/07/2026",
                "Data Início da vigência da apólice": "29/07/2026",
                "Status da apólice (ativo, cancelado, em atraso)": "ativo",
                "Nº da Proposta de Endosso": "10022042191500000001",
                "Seguradora": "Excelsior",
                "Data de vencimento da fatura": "26/07/2026",
                "link da fatura": "https://checkout.iugu.com/invoices/exemplo",
                "Forma de pagamento": "pix",
                "Mês em aberto": "julho",
                "Número de faturas em aberto": "0",
            }
        ];

        const worksheet = XLSX.utils.json_to_sheet(templateData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Modelo Importacao");

        worksheet["!cols"] = [
            { wch: 30 }, { wch: 18 }, { wch: 20 }, { wch: 35 },
            { wch: 22 }, { wch: 35 }, { wch: 28 }, { wch: 28 },
            { wch: 35 }, { wch: 60 }, { wch: 50 }, { wch: 14 },
            { wch: 24 }, { wch: 32 }, { wch: 38 }, { wch: 28 },
            { wch: 16 }, { wch: 26 }, { wch: 60 }, { wch: 18 },
            { wch: 16 }, { wch: 28 }
        ];

        XLSX.writeFile(workbook, "modelo_importacao_azos.xlsx");
        toast({ title: "Modelo baixado!", description: "Use este modelo no formato Azos para importar apólices." });
    };

    // Normalize string for comparison (remove accents, lowercase)
    const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

    // Excel File Upload & Parse — reads Azos format + fallback generic
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: "binary" });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(ws);

                if (rawData.length === 0) {
                    toast({ title: "Arquivo vazio", description: "A planilha selecionada não contém linhas.", variant: "destructive" });
                    return;
                }

                // Flexible field finder: tries multiple aliases, normalized
                const findVal = (row: Record<string, any>, ...keys: string[]) => {
                    const normalizedRow: Record<string, string> = {};
                    for (const k of Object.keys(row)) {
                        normalizedRow[norm(k)] = String(row[k] ?? "").trim();
                    }
                    for (const k of keys) {
                        const val = normalizedRow[norm(k)];
                        if (val !== undefined && val !== "" && val !== "undefined") return val;
                    }
                    // Partial match fallback
                    for (const k of keys) {
                        const normK = norm(k);
                        for (const rowKey of Object.keys(normalizedRow)) {
                            if (rowKey.includes(normK) || normK.includes(rowKey)) {
                                const val = normalizedRow[rowKey];
                                if (val && val !== "undefined") return val;
                            }
                        }
                    }
                    return "";
                };

                const stripPremio = (val: string) => {
                    const raw = val.replace(/^R\$\s*/i, "").trim();
                    // Brazilian: 1.234,56 → remove dot thousands sep, comma→dot
                    if (raw.includes(",") && raw.includes(".")) return raw.replace(/\./g, "").replace(",", ".");
                    // Brazilian: 1234,56 → comma as decimal
                    if (raw.includes(",")) return raw.replace(",", ".");
                    // ISO/US: 356.16 already valid
                    return raw;
                };

                const parsed: ParsedClient[] = rawData.map((row) => {
                    const premio = findVal(row,
                        "Premio", "Prêmio", "premio", "prêmio", "valor premio", "valor do premio"
                    );
                    return {
                        nome: findVal(row,
                            "Nome do cliente", "nome completo", "nome", "cliente", "razao social", "razão social"
                        ),
                        cpfCnpj: findVal(row,
                            "CPF do cliente", "cpf_cnpj", "cpf/cnpj", "cpf", "cnpj", "documento"
                        ),
                        dataNascimento: findVal(row,
                            "data_nascimento", "data de nascimento", "nascimento", "data nasc"
                        ),
                        telefone: findVal(row,
                            "Telefone do cliente", "telefone", "tel", "celular", "fone"
                        ),
                        whatsapp: findVal(row, "whatsapp", "whats", "zap"),
                        email: findVal(row, "email", "e-mail", "correio"),
                        endereco: findVal(row, "endereco", "endereço", "logradouro", "rua"),
                        cidade: findVal(row, "cidade", "municipio"),
                        estado: findVal(row, "estado", "uf"),
                        observacoes: findVal(row, "observacoes", "observações", "obs", "notas"),
                        tags: findVal(row, "tags", "categoria", "tag"),
                        nomeRepresentante: findVal(row,
                            "Nome do responsável", "Nome do representante", "representante",
                            "nome do responsavel", "nome responsavel", "nome representante"
                        ),
                        telefoneRepresentante: findVal(row,
                            "Telefone do responsável", "Telefone do representante",
                            "telefone do responsavel", "telefone responsavel", "telefone representante"
                        ),
                        emailRepresentante: findVal(row,
                            "Email do responsável", "Email do representante",
                            "email do responsavel", "email responsavel", "email representante"
                        ),
                        idProposta: findVal(row,
                            "ID da proposta", "id da prop", "id proposta"
                        ),
                        idApolice: findVal(row,
                            "ID da apólice", "ID da apolice", "id da apol", "id apolice", "id apol"
                        ),
                        numeroApolice: findVal(row,
                            "Número da apólice", "Numero da apolice", "numero da apolice",
                            "número da apólice", "nº apolice", "nº da apólice", "numero apolice"
                        ),
                        pdfApolice: findVal(row,
                            "PDF da apólice", "PDF da apolice", "pdf da apolice",
                            "pdf apolice", "link pdf", "pdf"
                        ),
                        cobertura: findVal(row,
                            "Coberturas", "Cobertura", "coberturas", "cobertura"
                        ),
                        premio: premio ? stripPremio(premio) : "",
                        dataEmissao: findVal(row,
                            "Data de emissão da apólice", "Data de emissao da apolice",
                            "data de emissão", "data de emissao", "data emissao", "data de em"
                        ),
                        inicioVigencia: findVal(row,
                            "Data Início da vigência da apólice", "Data Inicio da vigencia da apolice",
                            "data início", "data inicio", "data inicio vigencia", "data de inicio",
                            "inicio vigencia", "inicio da vigencia"
                        ),
                        statusApolice: findVal(row,
                            "Status da apólice (ativo, cancelado, em atraso)",
                            "Status da apolice (ativo, cancelado, em atraso)",
                            "status da apólice", "status da apolice", "status"
                        ),
                        numeroProposta: findVal(row,
                            "Nº da Proposta de Endosso", "Nº da proposta de endosso",
                            "nº da proposta", "numero da proposta", "num proposta", "proposta"
                        ),
                        seguradora: findVal(row, "Seguradora", "seguradora", "segurador"),
                        fimVigencia: findVal(row,
                            "Data de vencimento da fatura", "Data de vencimento da apólice",
                            "data de vencimento", "vencimento", "fim vigencia", "fim da vigencia"
                        ),
                        linkFatura: findVal(row,
                            "link da fatura", "Link da fatura", "link fatura", "fatura", "link"
                        ),
                        formaPagamento: findVal(row,
                            "Forma de pagamento", "forma de pagamento", "forma de p", "pagamento"
                        ),
                        mesAtraso: findVal(row,
                            "Mês em aberto", "Mes em aberto", "mês em atraso", "mes em atraso",
                            "mes em at", "atraso", "mes aberto"
                        ),
                        faturasAberto: findVal(row,
                            "Número de faturas em aberto", "Numero de faturas em aberto",
                            "faturas em aberto", "faturas aberto", "abertas", "faturas"
                        ),
                    };
                }).filter(c => c.nome.length > 0);

                if (parsed.length === 0) {
                    toast({ title: "Coluna 'Nome do cliente' não encontrada", description: "Certifique-se de que a planilha possui a coluna 'Nome do cliente' ou similar.", variant: "destructive" });
                    return;
                }

                setPreviewClients(parsed);
                setShowImportModal(true);
            } catch (err: any) {
                toast({ title: "Erro ao ler arquivo", description: err.message, variant: "destructive" });
            }
        };
        reader.readAsBinaryString(file);
        e.target.value = "";
    };

    // Execute Import
    const runImport = async () => {
        setImporting(true);
        setImportProgress(0);
        let successCount = 0;

        for (let i = 0; i < previewClients.length; i++) {
            const c = previewClients[i];
            try {
                await apiRequest("POST", "/api/clientes", c);
                successCount++;
            } catch (e) {
                console.error(`Erro ao importar ${c.nome}:`, e);
            }
            setImportProgress(Math.round(((i + 1) / previewClients.length) * 100));
        }

        queryClient.invalidateQueries({ queryKey: ["/api/clientes"] });
        queryClient.invalidateQueries({ queryKey: ["/api/seguros/dashboard"] });
        setImporting(false);
        setShowImportModal(false);
        setPreviewClients([]);

        toast({
            title: "Importação concluída!",
            description: `${successCount} de ${previewClients.length} clientes/apólices foram cadastrados com sucesso.`,
        });
    };

    // Client-side search filter (applied on top of server-side filters)
    const filtered = (clientes || []).filter(c => {
        if (!search) return true;
        const q = search.toLowerCase();
        return c.nome.toLowerCase().includes(q) ||
            (c.cpfCnpj || "").includes(q) ||
            (c.email || "").toLowerCase().includes(q) ||
            (c.telefone || "").includes(q);
    });

    const hasFilters = filterSeguradora !== "all" || filterStatus !== "all";

    const setField = (key: string, val: string) => setFormData(prev => ({ ...prev, [key]: val }));

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-display font-bold text-gray-900">Clientes</h2>
                    <p className="text-muted-foreground mt-1">
                        Base de clientes de seguros — {clientes?.length || 0} cadastrado(s)
                        {hasFilters ? " (filtrado)" : ""}.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" className="gap-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50" onClick={handleDownloadTemplate}>
                        <Download className="h-4 w-4" /> Baixar Modelo Excel
                    </Button>
                    <Button variant="outline" className="gap-2 border-[#0F6570] text-[#0F6570] hover:bg-[#0F6570]/10" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="h-4 w-4" /> Subir Excel
                    </Button>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileChange} />
                    <Button onClick={openCreate} className="gap-2 font-semibold">
                        <Plus className="h-4 w-4" /> Novo Cliente
                    </Button>
                </div>
            </div>

            {/* Search + Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-9" placeholder="Buscar por nome, CPF/CNPJ, telefone ou email..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>

                <div className="flex gap-2 flex-wrap">
                    {/* Filter by Seguradora */}
                    <Select value={filterSeguradora} onValueChange={setFilterSeguradora}>
                        <SelectTrigger className="w-44 gap-1">
                            <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <SelectValue placeholder="Seguradora" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas as seguradoras</SelectItem>
                            {(seguradoras || []).map(s => (
                                <SelectItem key={s.id} value={s.nome}>{s.nome}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Filter by Status Apólice */}
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-40 gap-1">
                            <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os status</SelectItem>
                            {Object.entries(STATUS_LABELS).map(([val, { label }]) => (
                                <SelectItem key={val} value={val}>{label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Clear filters */}
                    {hasFilters && (
                        <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" onClick={() => { setFilterSeguradora("all"); setFilterStatus("all"); }}>
                            <X className="h-3.5 w-3.5" /> Limpar
                        </Button>
                    )}
                </div>
            </div>

            {/* Cards Grid */}
            {isLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground bg-white rounded-xl border border-dashed">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">Nenhum cliente encontrado.</p>
                    <p className="text-sm mt-1">
                        {hasFilters ? "Tente outros filtros ou" : "Clique em"} "Novo Cliente" ou "Subir Excel" para cadastrar clientes.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filtered.map(c => (
                        <div key={c.id}
                            className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group">
                            {/* Card Header */}
                            <div
                                className="bg-gradient-to-r from-[#0F6570] to-[#08454c] p-4 cursor-pointer group/header hover:from-[#0b5059] hover:to-[#06353b] transition-all"
                                onClick={() => setLocation(`/admin/clientes/${c.id}`)}
                                title="Clique para ver o perfil do cliente"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="h-11 w-11 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg group-hover/header:scale-105 group-hover/header:bg-white/30 transition-all shrink-0">
                                        {c.nome.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-white truncate group-hover/header:underline flex items-center gap-1.5 text-base">
                                            {c.nome}
                                        </h3>
                                        {c.cpfCnpj && <p className="text-xs text-white/70 font-mono">{c.cpfCnpj}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-4 space-y-2">
                                {(c as any).nomeRepresentante && (
                                    <div className="flex items-center gap-2 text-sm text-[#0F6570] font-semibold">
                                        <UserIcon className="h-3.5 w-3.5 shrink-0" />
                                        <span className="truncate">Rep: {(c as any).nomeRepresentante}</span>
                                    </div>
                                )}
                                {c.telefone && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                        <span>{c.telefone}</span>
                                    </div>
                                )}
                                {c.email && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                        <span className="truncate">{c.email}</span>
                                    </div>
                                )}
                                {c.cidade && (
                                    <div className="text-xs text-gray-400">{c.cidade}{c.estado ? `, ${c.estado}` : ""}</div>
                                )}
                                {c.tags && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {c.tags.split(",").map((tag, i) => (
                                            <span key={i} className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-semibold">
                                                {tag.trim()}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Card Footer */}
                            <div className="px-4 pb-4 flex gap-2">
                                <Button size="sm" className="flex-1 gap-1.5 bg-[#0F6570] hover:bg-[#08454c] text-white"
                                    onClick={() => setLocation(`/admin/clientes/${c.id}`)}>
                                    <Eye className="h-3.5 w-3.5" /> Ver Apólices
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
                                    <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                {isAdmin && (
                                    <Button size="sm" variant="outline" className="text-red-500 hover:text-red-600 hover:border-red-200"
                                        onClick={() => setDeleteTarget(c)}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Excel Import Preview Dialog */}
            <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-emerald-700">
                            <FileSpreadsheet className="h-5 w-5" /> Importar via Excel — {previewClients.length} linha(s) encontrada(s)
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <p className="text-sm text-muted-foreground">
                            Confira os dados extraídos antes de confirmar. Clientes duplicados serão atualizados; apólices novas serão criadas.
                        </p>

                        <div className="max-h-72 overflow-y-auto rounded-lg border">
                            <Table>
                                <TableHeader className="bg-gray-50 sticky top-0">
                                    <TableRow>
                                        <TableHead className="text-xs">Nome</TableHead>
                                        <TableHead className="text-xs">CPF/CNPJ</TableHead>
                                        <TableHead className="text-xs">Telefone</TableHead>
                                        <TableHead className="text-xs">Seguradora</TableHead>
                                        <TableHead className="text-xs">Nº Apólice</TableHead>
                                        <TableHead className="text-xs">Prêmio</TableHead>
                                        <TableHead className="text-xs">Status</TableHead>
                                        <TableHead className="text-xs">Cobertura</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {previewClients.map((c, i) => {
                                        const status = STATUS_LABELS[c.statusApolice?.toLowerCase() === "em atraso" ? "em_atraso" : c.statusApolice?.toLowerCase() === "cancelado" ? "cancelada" : c.statusApolice?.toLowerCase() === "ativo" ? "ativa" : c.statusApolice || ""] || null;
                                        return (
                                            <TableRow key={i}>
                                                <TableCell className="font-semibold text-xs">{c.nome}</TableCell>
                                                <TableCell className="font-mono text-xs">{c.cpfCnpj || "—"}</TableCell>
                                                <TableCell className="text-xs">{c.telefone || "—"}</TableCell>
                                                <TableCell className="text-xs text-emerald-800 font-semibold">{c.seguradora || "—"}</TableCell>
                                                <TableCell className="text-xs font-mono">{c.numeroApolice || c.idProposta || "—"}</TableCell>
                                                <TableCell className="text-xs font-semibold">
                                                    {(() => {
                                                        if (!c.premio) return "—";
                                                        let raw = c.premio.replace(/^R\$\s*/i, "").replace(/\s/g, "");
                                                        if (raw.includes(",") && raw.includes(".")) raw = raw.replace(/\./g, "").replace(",", ".");
                                                        else if (raw.includes(",")) raw = raw.replace(",", ".");
                                                        const num = parseFloat(raw);
                                                        return isNaN(num) ? c.premio : `R$ ${num.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
                                                    })()}
                                                </TableCell>
                                                <TableCell>
                                                    {status ? (
                                                        <Badge className={`text-[10px] ${status.color}`}>{status.label}</Badge>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">{c.statusApolice || "—"}</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-xs max-w-[160px] truncate">{c.cobertura || "—"}</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>

                        {importing && (
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-semibold text-gray-700">
                                    <span>Cadastrando clientes e apólices...</span>
                                    <span>{importProgress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                    <div className="bg-[#0F6570] h-2 transition-all duration-300" style={{ width: `${importProgress}%` }} />
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowImportModal(false)} disabled={importing}>Cancelar</Button>
                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2" onClick={runImport} disabled={importing}>
                            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                            Importar {previewClients.length} Registro(s)
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create / Edit Dialog */}
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editTarget ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(); }}>
                        <div className="grid grid-cols-2 gap-4 py-2">
                            {!editTarget && (
                                <div className="col-span-2 bg-slate-50 rounded-xl p-3 border border-dashed border-slate-200">
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Puxar da Base de Contatos (opcional)</Label>
                                    <SearchableSelect
                                        options={(contacts ?? []).map(c => ({
                                            value: String(c.id),
                                            label: c.name,
                                            sublabel: [c.phone, c.email].filter(Boolean).join(" · ") || undefined,
                                        }))}
                                        value={selectedContactImport}
                                        onValueChange={(val) => {
                                            setSelectedContactImport(val);
                                            if (!val) return;
                                            const c = contacts?.find(x => String(x.id) === val);
                                            if (!c) return;
                                            setFormData(prev => ({
                                                ...prev,
                                                nome: c.name || prev.nome,
                                                cpfCnpj: c.document || prev.cpfCnpj,
                                                telefone: c.phone || prev.telefone,
                                                whatsapp: c.phone || prev.whatsapp,
                                                email: c.email || prev.email,
                                                endereco: c.address || prev.endereco,
                                            }));
                                        }}
                                        placeholder="Buscar contato para pré-preencher..."
                                        searchPlaceholder="Pesquisar por nome ou telefone..."
                                        clearable
                                    />
                                </div>
                            )}
                            <div className="col-span-2">
                                <Label>Nome *</Label>
                                <Input value={formData.nome} onChange={e => setField("nome", e.target.value)} placeholder="Nome completo" required />
                            </div>
                            <div>
                                <Label>CPF / CNPJ</Label>
                                <Input value={formData.cpfCnpj} onChange={e => setField("cpfCnpj", e.target.value)} placeholder="000.000.000-00" />
                            </div>
                            <div>
                                <Label>Data de Nascimento</Label>
                                <Input type="date" value={formData.dataNascimento} onChange={e => setField("dataNascimento", e.target.value)} />
                            </div>
                            <div>
                                <Label>Telefone</Label>
                                <Input value={formData.telefone} onChange={e => setField("telefone", e.target.value)} placeholder="(11) 99999-9999" />
                            </div>
                            <div>
                                <Label>WhatsApp</Label>
                                <Input value={formData.whatsapp} onChange={e => setField("whatsapp", e.target.value)} placeholder="(11) 99999-9999" />
                            </div>
                            <div className="col-span-2">
                                <Label>Email</Label>
                                <Input type="email" value={formData.email} onChange={e => setField("email", e.target.value)} placeholder="email@exemplo.com" />
                            </div>
                            <div className="col-span-2">
                                <Label>Endereço</Label>
                                <Input value={formData.endereco} onChange={e => setField("endereco", e.target.value)} placeholder="Rua, número, bairro" />
                            </div>
                            <div>
                                <Label>Cidade</Label>
                                <Input value={formData.cidade} onChange={e => setField("cidade", e.target.value)} placeholder="São Paulo" />
                            </div>
                            <div>
                                <Label>Estado</Label>
                                <Select value={formData.estado} onValueChange={v => setField("estado", v)}>
                                    <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                                    <SelectContent>
                                        {ESTADOS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="col-span-2">
                                <Label>Tags <span className="text-xs text-muted-foreground">(separadas por vírgula)</span></Label>
                                <Input value={formData.tags} onChange={e => setField("tags", e.target.value)} placeholder="VIP, Renovação, Empresarial" />
                            </div>
                            <div className="col-span-2">
                                <Label>Responsável Comercial</Label>
                                <SearchableSelect
                                    options={(users ?? []).map(u => ({ value: String(u.id), label: u.name }))}
                                    value={formData.responsavelComercialId}
                                    onValueChange={v => setField("responsavelComercialId", v)}
                                    placeholder="Selecionar responsável..."
                                    searchPlaceholder="Pesquisar por nome..."
                                    clearable
                                />
                            </div>
                            <div className="col-span-2 border-t pt-4 mt-2 font-semibold text-sm text-[#0F6570]">
                                Representante Legal / Contato Adicional
                            </div>
                            <div>
                                <Label>Nome do Representante</Label>
                                <Input value={formData.nomeRepresentante} onChange={e => setField("nomeRepresentante", e.target.value)} placeholder="Nome completo" />
                            </div>
                            <div>
                                <Label>Telefone do Representante</Label>
                                <Input value={formData.telefoneRepresentante} onChange={e => setField("telefoneRepresentante", e.target.value)} placeholder="(11) 99999-9999" />
                            </div>
                            <div className="col-span-2">
                                <Label>Email do Representante</Label>
                                <Input type="email" value={formData.emailRepresentante} onChange={e => setField("emailRepresentante", e.target.value)} placeholder="email@exemplo.com" />
                            </div>
                            <div className="col-span-2">
                                <Label>Observações</Label>
                                <Textarea value={formData.observacoes} onChange={e => setField("observacoes", e.target.value)} placeholder="Anotações sobre o cliente..." rows={3} />
                            </div>
                        </div>
                        <DialogFooter className="mt-4">
                            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                            <Button type="submit" disabled={saveMutation.isPending}>
                                {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                {editTarget ? "Salvar" : "Criar Cliente"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm */}
            <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remover Cliente?</AlertDialogTitle>
                        <AlertDialogDescription>
                            O cliente <strong>{deleteTarget?.nome}</strong> e todas as suas apólices serão removidos permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600 hover:bg-red-700"
                            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}>
                            Remover
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
