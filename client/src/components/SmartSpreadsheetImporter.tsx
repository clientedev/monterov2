import React, { useState, useEffect, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    FileSpreadsheet,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Copy,
    ArrowRight,
    ArrowLeft,
    Search,
    Filter,
    Settings2,
    ShieldAlert,
    UserCheck,
    UserPlus,
    FileText,
    Loader2,
    Eye,
    EyeOff,
    Trash2,
    Sparkles,
    RefreshCw,
    Check,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Target fields in system
export const SYSTEM_FIELDS: Array<{
    key: string;
    label: string;
    group: "cliente" | "apolice" | "gestao";
    required?: boolean;
    aliases: string[];
}> = [
    // Identificação do Cliente
    { key: "nome", label: "Nome do Cliente / Razão Social", group: "cliente", required: true, aliases: ["nome", "nome do cliente", "cliente", "razao social", "razão social", "segurado", "titular", "name", "customer", "full name"] },
    { key: "cpfCnpj", label: "CPF / CNPJ", group: "cliente", aliases: ["cpf", "cnpj", "cpf_cnpj", "cpf/cnpj", "cpf do cliente", "cnpj do cliente", "documento", "doc", "document", "cpf_cnpj_formatado"] },
    { key: "dataNascimento", label: "Data de Nascimento", group: "cliente", aliases: ["data de nascimento", "data_nascimento", "nascimento", "data nasc", "dt nasc", "birth", "birthday"] },
    { key: "telefone", label: "Telefone / Celular", group: "cliente", aliases: ["telefone", "telefone do cliente", "celular", "tel", "fone", "phone", "mobile", "contato"] },
    { key: "whatsapp", label: "WhatsApp", group: "cliente", aliases: ["whatsapp", "whats", "zap", "wa"] },
    { key: "email", label: "E-mail", group: "cliente", aliases: ["email", "e-mail", "correio", "mail"] },
    { key: "endereco", label: "Endereço", group: "cliente", aliases: ["endereco", "endereço", "rua", "logradouro", "address"] },
    { key: "cidade", label: "Cidade", group: "cliente", aliases: ["cidade", "municipio", "município", "city"] },
    { key: "estado", label: "Estado / UF", group: "cliente", aliases: ["estado", "uf", "state"] },

    // Dados da Apólice & Seguro
    { key: "seguradora", label: "Seguradora", group: "apolice", aliases: ["seguradora", "segurador", "companhia", "cia", "operadora", "insurer"] },
    { key: "numeroApolice", label: "Número da Apólice", group: "apolice", aliases: ["numero da apolice", "número da apólice", "numero apolice", "nº apolice", "nº da apólice", "policy number", "apolice"] },
    { key: "idApolice", label: "ID da Apólice", group: "apolice", aliases: ["id da apolice", "id da apólice", "id apolice", "id apol"] },
    { key: "idProposta", label: "ID da Proposta", group: "apolice", aliases: ["id da proposta", "id da prop", "id proposta", "id prop"] },
    { key: "numeroProposta", label: "Nº da Proposta / Endosso", group: "apolice", aliases: ["nº da proposta de endosso", "nº da proposta", "numero da proposta", "proposta", "endosso"] },
    { key: "cobertura", label: "Coberturas / Plano", group: "apolice", aliases: ["coberturas", "cobertura", "plano", "ramo", "produto", "coverage"] },
    { key: "premio", label: "Prêmio / Valor Mensal", group: "apolice", aliases: ["premio", "prêmio", "valor", "valor premio", "valor do premio", "mensalidade", "premium", "cost", "custo"] },
    { key: "dataEmissao", label: "Data de Emissão", group: "apolice", aliases: ["data de emissão da apólice", "data de emissao da apolice", "data de emissão", "data de emissao", "emissão", "emissao", "issue date"] },
    { key: "inicioVigencia", label: "Início da Vigência", group: "apolice", aliases: ["data início da vigência da apólice", "data inicio da vigencia da apolice", "data início", "data inicio", "inicio vigencia", "vigencia inicio", "início da vigência", "start date"] },
    { key: "fimVigencia", label: "Fim da Vigência / Vencimento", group: "apolice", aliases: ["data de vencimento da fatura", "data de vencimento da apólice", "data de vencimento", "vencimento", "fim vigencia", "data fim vigencia", "due date", "expiration"] },
    { key: "statusApolice", label: "Status da Apólice", group: "apolice", aliases: ["status da apólice (ativo, cancelado, em atraso)", "status da apolice (ativo, cancelado, em atraso)", "status da apólice", "status da apolice", "status", "situacao", "situação"] },
    { key: "linkFatura", label: "Link da Fatura / Boleto", group: "apolice", aliases: ["link da fatura", "link fatura", "fatura", "link", "link boleto"] },
    { key: "formaPagamento", label: "Forma de Pagamento", group: "apolice", aliases: ["forma de pagamento", "pagamento", "meio de pagamento", "payment method"] },
    { key: "mesAtraso", label: "Mês em Aberto", group: "apolice", aliases: ["mês em aberto", "mes em aberto", "mês em atraso", "mes em atraso", "atraso", "mes aberto"] },
    { key: "faturasAberto", label: "Nº de Faturas em Aberto", group: "apolice", aliases: ["número de faturas em aberto", "numero de faturas em aberto", "faturas em aberto", "faturas aberto", "abertas", "faturas"] },

    // Gestão & Representante
    { key: "nomeRepresentante", label: "Nome do Responsável / Corretor", group: "gestao", aliases: ["nome do responsável", "nome do responsavel", "nome do representante", "representante", "responsável", "responsavel", "corretor", "produtor"] },
    { key: "telefoneRepresentante", label: "Telefone do Responsável", group: "gestao", aliases: ["telefone do responsável", "telefone do responsavel", "telefone do representante"] },
    { key: "emailRepresentante", label: "E-mail do Responsável", group: "gestao", aliases: ["email do responsável", "email do responsavel", "email do representante"] },
    { key: "observacoes", label: "Observações / Notas", group: "gestao", aliases: ["observacoes", "observações", "obs", "notas", "notes", "comentarios"] },
    { key: "tags", label: "Tags / Categorias", group: "gestao", aliases: ["tags", "categoria", "marcadores", "tag"] },
];

function normStr(str: string) {
    return (str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export interface ColumnMappingItem {
    originalHeader: string;
    sampleValues: string[];
    targetKey: string; // system field key or "ignore"
    included: boolean;
}

export interface SmartSpreadsheetImporterProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    file: File | null;
    onImportSuccess?: () => void;
}

export function SmartSpreadsheetImporter({
    open,
    onOpenChange,
    file,
    onImportSuccess,
}: SmartSpreadsheetImporterProps) {
    const { toast } = useToast();

    // Wizard step: 1 = Colunas & Mapeamento, 2 = Diagnóstico & Duplicados, 3 = Revisão & Execução
    const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

    // Workbook state
    const [sheetNames, setSheetNames] = useState<string[]>([]);
    const [selectedSheet, setSelectedSheet] = useState<string>("");
    const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
    const [columnMappings, setColumnMappings] = useState<ColumnMappingItem[]>([]);

    // Matching criteria options
    const [matchCriteria, setMatchCriteria] = useState({
        matchDoc: true,
        matchEmail: true,
        matchPhone: true,
        matchName: false,
        matchPolicy: true,
    });

    // Duplicate strategy: "merge" | "skip_existing" | "overwrite"
    const [duplicateStrategy, setDuplicateStrategy] = useState<"merge" | "skip_existing" | "overwrite">("merge");

    // Analysis results from server
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<{
        summary: {
            total: number;
            newClients: number;
            existingClients: number;
            existingPolicies: number;
            duplicateInFile: number;
            invalidRows: number;
        };
        analyzedRows: Array<{
            index: number;
            status: "new" | "existing_client" | "existing_policy" | "duplicate_in_file" | "invalid";
            badge: string;
            reason: string;
            matchedCliente: any;
            matchedApolice: any;
            data: Record<string, any>;
        }>;
    } | null>(null);

    // Selection of rows to import
    const [selectedRowIndices, setSelectedRowIndices] = useState<Set<number>>(new Set());
    const [filterCategory, setFilterCategory] = useState<"all" | "new" | "existing" | "warning">("all");
    const [searchQuery, setSearchQuery] = useState("");

    // Import execution state
    const [isImporting, setIsImporting] = useState(false);
    const [importProgress, setImportProgress] = useState(0);

    // Reset when modal opens/closes or file changes
    useEffect(() => {
        if (!open || !file) {
            setCurrentStep(1);
            setRawRows([]);
            setColumnMappings([]);
            setAnalysisResult(null);
            setSelectedRowIndices(new Set());
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const bstr = e.target?.result;
                const wb = XLSX.read(bstr, { type: "binary", cellDates: true });
                setSheetNames(wb.SheetNames);
                const firstSheet = wb.SheetNames[0];
                setSelectedSheet(firstSheet);
                parseSheet(wb, firstSheet);
            } catch (err: any) {
                toast({
                    title: "Erro ao ler arquivo",
                    description: err.message || "Formato de arquivo incompatível.",
                    variant: "destructive",
                });
            }
        };
        reader.readAsBinaryString(file);
    }, [open, file]);

    // Parse sheet rows and detect column mappings
    const parseSheet = (wb: XLSX.WorkBook, sheetName: string) => {
        const ws = wb.Sheets[sheetName];
        if (!ws) return;

        const data = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: "" });
        if (data.length === 0) {
            toast({
                title: "Planilha vazia",
                description: "A aba selecionada não contém linhas de dados.",
                variant: "destructive",
            });
            return;
        }

        setRawRows(data);

        // Get all unique keys in rows
        const headersSet = new Set<string>();
        data.forEach((row) => Object.keys(row).forEach((k) => headersSet.add(k)));
        const headers = Array.from(headersSet).filter((h) => !h.startsWith("__EMPTY"));

        // Build column mappings with intelligent aliases
        const mappings: ColumnMappingItem[] = headers.map((header) => {
            const normHeader = normStr(header);

            // Collect up to 4 non-empty sample values
            const samples: string[] = [];
            for (const r of data) {
                const val = String(r[header] ?? "").trim();
                if (val && !samples.includes(val)) {
                    samples.push(val);
                    if (samples.length >= 3) break;
                }
            }

            // Find best matching system field
            let matchedKey = "ignore";
            for (const field of SYSTEM_FIELDS) {
                const foundExact = field.aliases.some((alias) => normStr(alias) === normHeader);
                if (foundExact) {
                    matchedKey = field.key;
                    break;
                }
            }

            // Fallback: partial match
            if (matchedKey === "ignore") {
                for (const field of SYSTEM_FIELDS) {
                    const foundPartial = field.aliases.some(
                        (alias) => normHeader.includes(normStr(alias)) || normStr(alias).includes(normHeader)
                    );
                    if (foundPartial) {
                        matchedKey = field.key;
                        break;
                    }
                }
            }

            return {
                originalHeader: header,
                sampleValues: samples,
                targetKey: matchedKey,
                included: matchedKey !== "ignore",
            };
        });

        setColumnMappings(mappings);
    };

    // Handle Sheet switch
    const handleSheetChange = (newSheet: string) => {
        setSelectedSheet(newSheet);
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const bstr = e.target?.result;
                const wb = XLSX.read(bstr, { type: "binary", cellDates: true });
                parseSheet(wb, newSheet);
            } catch (err: any) {
                toast({ title: "Erro ao trocar aba", description: err.message, variant: "destructive" });
            }
        };
        reader.readAsBinaryString(file);
    };

    // Toggle column included/excluded
    const toggleColumnIncluded = (index: number) => {
        setColumnMappings((prev) =>
            prev.map((col, i) => {
                if (i !== index) return col;
                const nextInc = !col.included;
                return {
                    ...col,
                    included: nextInc,
                    targetKey: nextInc && col.targetKey === "ignore" ? "nome" : !nextInc ? "ignore" : col.targetKey,
                };
            })
        );
    };

    // Change target key for column
    const updateColumnTarget = (index: number, newTarget: string) => {
        setColumnMappings((prev) =>
            prev.map((col, i) => {
                if (i !== index) return col;
                return {
                    ...col,
                    targetKey: newTarget,
                    included: newTarget !== "ignore",
                };
            })
        );
    };

    // Map raw row into parsed system object based on current mappings
    const getMappedRows = () => {
        const activeMappings = columnMappings.filter((m) => m.included && m.targetKey !== "ignore");

        return rawRows.map((row) => {
            const mapped: Record<string, any> = {};
            for (const col of activeMappings) {
                let val = row[col.originalHeader];
                if (val !== undefined && val !== null) {
                    // Normalize date serials or objects if string
                    if (val instanceof Date) {
                        val = val.toLocaleDateString("pt-BR");
                    }
                    mapped[col.targetKey] = String(val).trim();
                }
            }
            return mapped;
        });
    };

    // Step 1 -> Step 2: Trigger Deduplication Analysis
    const handleRunAnalysis = async () => {
        // Validate if Nome is mapped
        const nomeMapped = columnMappings.some((m) => m.included && m.targetKey === "nome");
        if (!nomeMapped) {
            toast({
                title: "Coluna de Nome Obrigatória",
                description: "Por favor, mapeie pelo menos uma coluna para o campo 'Nome do Cliente / Razão Social'.",
                variant: "destructive",
            });
            return;
        }

        setIsAnalyzing(true);
        try {
            const mappedRows = getMappedRows();

            const res = await apiRequest("POST", "/api/clientes/analyze-import", {
                rows: mappedRows,
                matchCriteria,
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || "Erro na análise de duplicados");
            }

            const data = await res.json();
            setAnalysisResult(data);

            // Default selection: select all rows that are not invalid
            const validIndices = new Set<number>();
            data.analyzedRows.forEach((row: any) => {
                if (row.status !== "invalid") {
                    validIndices.add(row.index);
                }
            });
            setSelectedRowIndices(validIndices);

            setCurrentStep(2);
        } catch (err: any) {
            toast({
                title: "Falha na análise",
                description: err.message || "Não foi possível analisar os dados da planilha.",
                variant: "destructive",
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Filter analyzed rows for table preview
    const filteredAnalyzedRows = useMemo(() => {
        if (!analysisResult) return [];

        return analysisResult.analyzedRows.filter((r) => {
            // Category filter
            if (filterCategory === "new" && r.status !== "new") return false;
            if (filterCategory === "existing" && r.status !== "existing_client") return false;
            if (filterCategory === "warning" && r.status !== "existing_policy" && r.status !== "duplicate_in_file" && r.status !== "invalid") {
                return false;
            }

            // Text search
            if (searchQuery.trim()) {
                const q = normStr(searchQuery);
                const nome = normStr(r.data.nome || "");
                const doc = normStr(r.data.cpfCnpj || "");
                const apol = normStr(r.data.numeroApolice || r.data.idProposta || "");
                const tel = normStr(r.data.telefone || "");
                return nome.includes(q) || doc.includes(q) || apol.includes(q) || tel.includes(q);
            }

            return true;
        });
    }, [analysisResult, filterCategory, searchQuery]);

    // Toggle single row selection
    const toggleRowSelect = (index: number) => {
        setSelectedRowIndices((prev) => {
            const next = new Set(prev);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
    };

    // Bulk selection helpers
    const selectAllFiltered = () => {
        setSelectedRowIndices((prev) => {
            const next = new Set(prev);
            filteredAnalyzedRows.forEach((r) => next.add(r.index));
            return next;
        });
    };

    const deselectAllFiltered = () => {
        setSelectedRowIndices((prev) => {
            const next = new Set(prev);
            filteredAnalyzedRows.forEach((r) => next.delete(r.index));
            return next;
        });
    };

    const selectOnlyNew = () => {
        if (!analysisResult) return;
        const newSet = new Set<number>();
        analysisResult.analyzedRows.forEach((r) => {
            if (r.status === "new") newSet.add(r.index);
        });
        setSelectedRowIndices(newSet);
    };

    // Execute Import with Batch Endpoint
    const handleExecuteImport = async () => {
        if (!analysisResult || selectedRowIndices.size === 0) {
            toast({
                title: "Nenhuma linha selecionada",
                description: "Selecione pelo menos uma linha para importar.",
                variant: "destructive",
            });
            return;
        }

        setIsImporting(true);
        setImportProgress(10);

        try {
            // Pick selected rows
            const selectedRowsData = analysisResult.analyzedRows
                .filter((r) => selectedRowIndices.has(r.index))
                .map((r) => r.data);

            setImportProgress(35);

            const res = await apiRequest("POST", "/api/clientes/batch-import", {
                rows: selectedRowsData,
                duplicateStrategy,
            });

            setImportProgress(85);

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || "Erro durante a importação em lote");
            }

            const result = await res.json();
            setImportProgress(100);

            toast({
                title: "Importação Concluída com Sucesso! 🎉",
                description: `${result.createdClients || 0} novos clientes criados, ${result.updatedClients || 0} clientes atualizados, ${result.createdApolices || 0} novas apólices cadastradas.`,
            });

            if (onImportSuccess) onImportSuccess();
            onOpenChange(false);
        } catch (err: any) {
            toast({
                title: "Erro na importação",
                description: err.message || "Ocorreu um erro ao gravar os registros no banco.",
                variant: "destructive",
            });
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-white shadow-2xl border-0">
                {/* Header with Title and Stepper */}
                <div className="bg-gradient-to-r from-[#0B4850] via-[#0F6570] to-[#147986] text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center shrink-0">
                            <Sparkles className="w-5 h-5 text-emerald-300" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                                Tratamento Inteligente de Planilha
                                <Badge className="bg-emerald-500/20 text-emerald-200 border-emerald-400/30 text-xs">
                                    Universal
                                </Badge>
                            </DialogTitle>
                            <p className="text-xs text-white/80">
                                {file ? `${file.name} • ${(file.size / 1024).toFixed(1)} KB` : "Nenhum arquivo carregado"}
                            </p>
                        </div>
                    </div>

                    {/* Stepper Pills */}
                    <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur p-1 rounded-xl text-xs">
                        <button
                            type="button"
                            onClick={() => setCurrentStep(1)}
                            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                                currentStep === 1
                                    ? "bg-white text-[#0F6570] shadow-sm"
                                    : "text-white/70 hover:text-white"
                            }`}
                        >
                            <span className="w-4 h-4 rounded-full bg-[#0F6570] text-white flex items-center justify-center text-[10px]">1</span>
                            Colunas ({columnMappings.filter((c) => c.included).length})
                        </button>
                        <span className="text-white/30">›</span>
                        <button
                            type="button"
                            onClick={() => {
                                if (analysisResult) setCurrentStep(2);
                            }}
                            disabled={!analysisResult}
                            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                                currentStep === 2
                                    ? "bg-white text-[#0F6570] shadow-sm"
                                    : "text-white/70 hover:text-white disabled:opacity-40"
                            }`}
                        >
                            <span className="w-4 h-4 rounded-full bg-[#0F6570] text-white flex items-center justify-center text-[10px]">2</span>
                            Diagnóstico
                        </button>
                        <span className="text-white/30">›</span>
                        <button
                            type="button"
                            onClick={() => {
                                if (analysisResult) setCurrentStep(3);
                            }}
                            disabled={!analysisResult}
                            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                                currentStep === 3
                                    ? "bg-white text-[#0F6570] shadow-sm"
                                    : "text-white/70 hover:text-white disabled:opacity-40"
                            }`}
                        >
                            <span className="w-4 h-4 rounded-full bg-[#0F6570] text-white flex items-center justify-center text-[10px]">3</span>
                            Revisão & Importação
                        </button>
                    </div>
                </div>

                {/* Body Content by Step */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                    {/* STEP 1: Colunas, Amostras & Critérios */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            {/* Sheet Selection & Summary Bar */}
                            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <FileSpreadsheet className="w-6 h-6 text-[#0F6570]" />
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-sm">
                                            {rawRows.length} linhas e {columnMappings.length} colunas encontradas
                                        </h4>
                                        <p className="text-xs text-muted-foreground">
                                            Revise quais colunas deseja importar ou excluir, e confirme o campo de destino correspondente.
                                        </p>
                                    </div>
                                </div>

                                {sheetNames.length > 1 && (
                                    <div className="flex items-center gap-2">
                                        <Label className="text-xs font-semibold text-slate-600">Aba da Planilha:</Label>
                                        <Select value={selectedSheet} onValueChange={handleSheetChange}>
                                            <SelectTrigger className="w-48 h-8 text-xs font-medium">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {sheetNames.map((s) => (
                                                    <SelectItem key={s} value={s}>
                                                        {s}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>

                            {/* Intelligent Deduplication Matching Settings */}
                            <div className="bg-gradient-to-br from-emerald-50/70 to-teal-50/40 border border-emerald-200/70 rounded-2xl p-4 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <ShieldAlert className="w-4 h-4 text-emerald-700" />
                                    <h4 className="text-sm font-bold text-emerald-950">
                                        Critérios de Cruzamento Inteligente (Deduplicação)
                                    </h4>
                                </div>
                                <p className="text-xs text-emerald-800/90 mb-3">
                                    O sistema comparará cada linha com os clientes já cadastrados no seu CRM para identificar se o cliente já existe. Escolha quais dados levar em conta:
                                </p>

                                <div className="flex flex-wrap gap-3">
                                    <label className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-emerald-200 text-xs font-medium text-slate-700 cursor-pointer hover:bg-emerald-50/50 transition-colors shadow-2xs">
                                        <Checkbox
                                            checked={matchCriteria.matchDoc}
                                            onCheckedChange={(c) =>
                                                setMatchCriteria((prev) => ({ ...prev, matchDoc: Boolean(c) }))
                                            }
                                        />
                                        <span>CPF / CNPJ (Recomendado)</span>
                                    </label>

                                    <label className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-emerald-200 text-xs font-medium text-slate-700 cursor-pointer hover:bg-emerald-50/50 transition-colors shadow-2xs">
                                        <Checkbox
                                            checked={matchCriteria.matchEmail}
                                            onCheckedChange={(c) =>
                                                setMatchCriteria((prev) => ({ ...prev, matchEmail: Boolean(c) }))
                                            }
                                        />
                                        <span>E-mail</span>
                                    </label>

                                    <label className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-emerald-200 text-xs font-medium text-slate-700 cursor-pointer hover:bg-emerald-50/50 transition-colors shadow-2xs">
                                        <Checkbox
                                            checked={matchCriteria.matchPhone}
                                            onCheckedChange={(c) =>
                                                setMatchCriteria((prev) => ({ ...prev, matchPhone: Boolean(c) }))
                                            }
                                        />
                                        <span>Telefone / WhatsApp</span>
                                    </label>

                                    <label className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-emerald-200 text-xs font-medium text-slate-700 cursor-pointer hover:bg-emerald-50/50 transition-colors shadow-2xs">
                                        <Checkbox
                                            checked={matchCriteria.matchPolicy}
                                            onCheckedChange={(c) =>
                                                setMatchCriteria((prev) => ({ ...prev, matchPolicy: Boolean(c) }))
                                            }
                                        />
                                        <span>Nº Apólice / ID Proposta</span>
                                    </label>

                                    <label className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-emerald-200 text-xs font-medium text-slate-700 cursor-pointer hover:bg-emerald-50/50 transition-colors shadow-2xs">
                                        <Checkbox
                                            checked={matchCriteria.matchName}
                                            onCheckedChange={(c) =>
                                                setMatchCriteria((prev) => ({ ...prev, matchName: Boolean(c) }))
                                            }
                                        />
                                        <span>Nome Exato (opcional)</span>
                                    </label>
                                </div>
                            </div>

                            {/* Column Configuration Table */}
                            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                                <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                                    <div className="flex items-center gap-2">
                                        <Settings2 className="w-4 h-4 text-slate-500" />
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                            Mapeamento e Exclusão de Colunas ({columnMappings.length})
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="text-xs text-[#0F6570] hover:bg-[#0F6570]/10 h-7"
                                            onClick={() =>
                                                setColumnMappings((prev) => prev.map((c) => ({ ...c, included: true })))
                                            }
                                        >
                                            Incluir Todas
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="text-xs text-rose-600 hover:bg-rose-50 h-7"
                                            onClick={() =>
                                                setColumnMappings((prev) =>
                                                    prev.map((c) => (c.targetKey === "ignore" ? { ...c, included: false } : c))
                                                )
                                            }
                                        >
                                            Excluir Não Mapeadas
                                        </Button>
                                    </div>
                                </div>

                                <div className="overflow-x-auto max-h-[380px]">
                                    <Table>
                                        <TableHeader className="bg-slate-50 sticky top-0 z-10">
                                            <TableRow className="border-b border-slate-200">
                                                <TableHead className="w-16 text-center text-xs font-bold text-slate-600">
                                                    Status
                                                </TableHead>
                                                <TableHead className="text-xs font-bold text-slate-600 w-1/4">
                                                    Coluna na Planilha
                                                </TableHead>
                                                <TableHead className="text-xs font-bold text-slate-600 w-1/3">
                                                    Exemplos de Valores
                                                </TableHead>
                                                <TableHead className="text-xs font-bold text-slate-600 w-1/3">
                                                    Campo do Sistema (Destino)
                                                </TableHead>
                                                <TableHead className="w-16 text-center text-xs font-bold text-slate-600">
                                                    Ação
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {columnMappings.map((col, idx) => {
                                                const isExcluded = !col.included;
                                                const isNome = col.targetKey === "nome";

                                                return (
                                                    <TableRow
                                                        key={col.originalHeader}
                                                        className={`transition-colors ${
                                                            isExcluded
                                                                ? "bg-slate-50/60 opacity-60"
                                                                : isNome
                                                                ? "bg-emerald-50/20"
                                                                : "hover:bg-slate-50/80"
                                                        }`}
                                                    >
                                                        {/* Status toggle */}
                                                        <TableCell className="text-center py-2.5">
                                                            <Switch
                                                                checked={col.included}
                                                                onCheckedChange={() => toggleColumnIncluded(idx)}
                                                                className="data-[state=checked]:bg-[#0F6570]"
                                                            />
                                                        </TableCell>

                                                        {/* Original Header */}
                                                        <TableCell className="py-2.5">
                                                            <div className="flex items-center gap-2">
                                                                <span
                                                                    className={`font-semibold text-xs ${
                                                                        isExcluded
                                                                            ? "line-through text-slate-400"
                                                                            : "text-slate-800"
                                                                    }`}
                                                                >
                                                                    {col.originalHeader}
                                                                </span>
                                                                {isNome && (
                                                                    <Badge className="bg-emerald-100 text-emerald-800 text-[10px] border-emerald-200">
                                                                        Principal
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </TableCell>

                                                        {/* Sample Values */}
                                                        <TableCell className="py-2.5">
                                                            <div className="flex flex-wrap gap-1 max-w-[320px]">
                                                                {col.sampleValues.length > 0 ? (
                                                                    col.sampleValues.map((sample, sIdx) => (
                                                                        <span
                                                                            key={sIdx}
                                                                            className="inline-block text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded max-w-[140px] truncate"
                                                                            title={sample}
                                                                        >
                                                                            {sample}
                                                                        </span>
                                                                    ))
                                                                ) : (
                                                                    <span className="text-[11px] text-slate-400 italic">
                                                                        (coluna vazia)
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </TableCell>

                                                        {/* Target System Field */}
                                                        <TableCell className="py-2.5">
                                                            <Select
                                                                value={col.included ? col.targetKey : "ignore"}
                                                                onValueChange={(val) => updateColumnTarget(idx, val)}
                                                                disabled={isExcluded}
                                                            >
                                                                <SelectTrigger className="h-8 text-xs font-medium w-full">
                                                                    <SelectValue placeholder="Selecione o campo..." />
                                                                </SelectTrigger>
                                                                <SelectContent className="max-h-[300px]">
                                                                    <SelectItem value="ignore" className="text-rose-600 font-semibold">
                                                                        ✖ Excluir / Ignorar Coluna
                                                                    </SelectItem>

                                                                    <SelectGroup>
                                                                        <SelectLabel className="text-[11px] font-bold text-[#0F6570] uppercase">
                                                                            Identificação do Cliente
                                                                        </SelectLabel>
                                                                        {SYSTEM_FIELDS.filter((f) => f.group === "cliente").map((f) => (
                                                                            <SelectItem key={f.key} value={f.key}>
                                                                                {f.label} {f.required ? "*" : ""}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectGroup>

                                                                    <SelectGroup>
                                                                        <SelectLabel className="text-[11px] font-bold text-amber-700 uppercase">
                                                                            Apólice & Seguro
                                                                        </SelectLabel>
                                                                        {SYSTEM_FIELDS.filter((f) => f.group === "apolice").map((f) => (
                                                                            <SelectItem key={f.key} value={f.key}>
                                                                                {f.label}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectGroup>

                                                                    <SelectGroup>
                                                                        <SelectLabel className="text-[11px] font-bold text-indigo-700 uppercase">
                                                                            Gestão & Representante
                                                                        </SelectLabel>
                                                                        {SYSTEM_FIELDS.filter((f) => f.group === "gestao").map((f) => (
                                                                            <SelectItem key={f.key} value={f.key}>
                                                                                {f.label}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectGroup>
                                                                </SelectContent>
                                                            </Select>
                                                        </TableCell>

                                                        {/* Action / Trash */}
                                                        <TableCell className="text-center py-2.5">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className={`h-7 w-7 rounded-lg ${
                                                                    isExcluded
                                                                        ? "text-slate-400 hover:text-emerald-700"
                                                                        : "text-slate-400 hover:text-rose-600"
                                                                }`}
                                                                onClick={() => toggleColumnIncluded(idx)}
                                                                title={isExcluded ? "Reativar coluna" : "Excluir coluna da importação"}
                                                            >
                                                                {isExcluded ? (
                                                                    <RefreshCw className="w-3.5 h-3.5" />
                                                                ) : (
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                )}
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Diagnóstico & Deduplicação */}
                    {currentStep === 2 && analysisResult && (
                        <div className="space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
                                        <span>Total na Planilha</span>
                                        <FileSpreadsheet className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <div className="text-2xl font-bold text-slate-900">
                                        {analysisResult.summary.total}
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-1">linhas analisadas</p>
                                </div>

                                <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 shadow-sm">
                                    <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 mb-1">
                                        <span>Clientes Novos</span>
                                        <UserPlus className="w-4 h-4 text-emerald-600" />
                                    </div>
                                    <div className="text-2xl font-bold text-emerald-900">
                                        {analysisResult.summary.newClients}
                                    </div>
                                    <p className="text-[11px] text-emerald-700 mt-1">sem cadastro prévio</p>
                                </div>

                                <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 shadow-sm">
                                    <div className="flex items-center justify-between text-xs font-semibold text-amber-800 mb-1">
                                        <span>Já Existem no Banco</span>
                                        <UserCheck className="w-4 h-4 text-amber-600" />
                                    </div>
                                    <div className="text-2xl font-bold text-amber-900">
                                        {analysisResult.summary.existingClients}
                                    </div>
                                    <p className="text-[11px] text-amber-700 mt-1">mesmo CPF, tel ou e-mail</p>
                                </div>

                                <div className="bg-sky-50/60 border border-sky-200 rounded-2xl p-4 shadow-sm">
                                    <div className="flex items-center justify-between text-xs font-semibold text-sky-800 mb-1">
                                        <span>Apólices no Sistema</span>
                                        <FileText className="w-4 h-4 text-sky-600" />
                                    </div>
                                    <div className="text-2xl font-bold text-sky-900">
                                        {analysisResult.summary.existingPolicies}
                                    </div>
                                    <p className="text-[11px] text-sky-700 mt-1">apólice/proposta já gravada</p>
                                </div>
                            </div>

                            {/* Deduplication Strategy Selector */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                        <ShieldAlert className="w-4 h-4 text-[#0F6570]" />
                                        Como tratar os clientes e apólices já cadastrados?
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Selecione a política de importação para os {analysisResult.summary.existingClients} cliente(s) encontrados com dados coincidentes:
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => setDuplicateStrategy("merge")}
                                        className={`p-3.5 rounded-xl border text-left transition-all relative ${
                                            duplicateStrategy === "merge"
                                                ? "border-[#0F6570] bg-[#0F6570]/5 shadow-sm ring-1 ring-[#0F6570]"
                                                : "border-slate-200 hover:border-slate-300 bg-white"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-bold text-xs text-slate-900">Mesclar & Vincular</span>
                                            <Badge className="bg-emerald-100 text-emerald-800 text-[9px] border-emerald-200">
                                                Recomendado
                                            </Badge>
                                        </div>
                                        <p className="text-[11px] text-slate-600">
                                            Preenche dados cadastrais faltantes no cliente e adiciona a nova apólice ao histórico dele.
                                        </p>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setDuplicateStrategy("skip_existing")}
                                        className={`p-3.5 rounded-xl border text-left transition-all relative ${
                                            duplicateStrategy === "skip_existing"
                                                ? "border-[#0F6570] bg-[#0F6570]/5 shadow-sm ring-1 ring-[#0F6570]"
                                                : "border-slate-200 hover:border-slate-300 bg-white"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-bold text-xs text-slate-900">Pular Existentes</span>
                                        </div>
                                        <p className="text-[11px] text-slate-600">
                                            Ignora qualquer cliente que já exista na base e cadastra exclusivamente clientes 100% novos.
                                        </p>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setDuplicateStrategy("overwrite")}
                                        className={`p-3.5 rounded-xl border text-left transition-all relative ${
                                            duplicateStrategy === "overwrite"
                                                ? "border-[#0F6570] bg-[#0F6570]/5 shadow-sm ring-1 ring-[#0F6570]"
                                                : "border-slate-200 hover:border-slate-300 bg-white"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-bold text-xs text-slate-900">Sobrescrever Tudo</span>
                                        </div>
                                        <p className="text-[11px] text-slate-600">
                                            Atualiza os dados cadastrais do cliente com as informações desta planilha.
                                        </p>
                                    </button>
                                </div>
                            </div>

                            {/* Fast Highlights & Warnings */}
                            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 shadow-sm text-xs text-amber-900 space-y-2">
                                <div className="font-bold flex items-center gap-1.5 text-amber-950">
                                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                                    Resumo da Análise de Conflitos:
                                </div>
                                <ul className="list-disc list-inside space-y-1 text-amber-800">
                                    <li>
                                        <strong>{analysisResult.summary.newClients}</strong> clientes serão criados do zero no CRM e módulo de seguros.
                                    </li>
                                    {analysisResult.summary.existingClients > 0 && (
                                        <li>
                                            <strong>{analysisResult.summary.existingClients}</strong> clientes já foram identificados pelo CPF/CNPJ, E-mail ou Telefone.
                                        </li>
                                    )}
                                    {analysisResult.summary.existingPolicies > 0 && (
                                        <li>
                                            <strong>{analysisResult.summary.existingPolicies}</strong> apólices já foram localizadas no banco de dados e serão atualizadas.
                                        </li>
                                    )}
                                    {analysisResult.summary.duplicateInFile > 0 && (
                                        <li>
                                            <strong>{analysisResult.summary.duplicateInFile}</strong> linha(s) são repetições do mesmo cliente dentro deste arquivo.
                                        </li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Revisão Linha a Linha */}
                    {currentStep === 3 && analysisResult && (
                        <div className="space-y-4">
                            {/* Controls: Search, Filter Tabs & Bulk Actions */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                                {/* Search input */}
                                <div className="relative flex-1 max-w-sm">
                                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Buscar por nome, CPF ou apólice..."
                                        className="h-8 pl-8 text-xs rounded-xl"
                                    />
                                </div>

                                {/* Filter Pills */}
                                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                                    <button
                                        type="button"
                                        onClick={() => setFilterCategory("all")}
                                        className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                                            filterCategory === "all"
                                                ? "bg-white text-slate-800 shadow-xs"
                                                : "text-slate-600 hover:text-slate-900"
                                        }`}
                                    >
                                        Todos ({analysisResult.analyzedRows.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFilterCategory("new")}
                                        className={`px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                                            filterCategory === "new"
                                                ? "bg-emerald-600 text-white shadow-xs"
                                                : "text-emerald-700 hover:text-emerald-900"
                                        }`}
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                        Novos ({analysisResult.summary.newClients})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFilterCategory("existing")}
                                        className={`px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                                            filterCategory === "existing"
                                                ? "bg-amber-600 text-white shadow-xs"
                                                : "text-amber-700 hover:text-amber-900"
                                        }`}
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                        Existentes ({analysisResult.summary.existingClients})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFilterCategory("warning")}
                                        className={`px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                                            filterCategory === "warning"
                                                ? "bg-rose-600 text-white shadow-xs"
                                                : "text-rose-700 hover:text-rose-900"
                                        }`}
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                                        Avisos ({analysisResult.summary.existingPolicies + analysisResult.summary.duplicateInFile})
                                    </button>
                                </div>

                                {/* Quick selection */}
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-8 text-xs font-semibold"
                                        onClick={selectOnlyNew}
                                    >
                                        Apenas Novos
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-8 text-xs font-semibold"
                                        onClick={selectAllFiltered}
                                    >
                                        Marcar Todos
                                    </Button>
                                </div>
                            </div>

                            {/* Table of Rows */}
                            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                                <div className="overflow-x-auto max-h-[380px]">
                                    <Table>
                                        <TableHeader className="bg-slate-50 sticky top-0 z-10">
                                            <TableRow className="border-b border-slate-200">
                                                <TableHead className="w-10 text-center">
                                                    <Checkbox
                                                        checked={
                                                            filteredAnalyzedRows.length > 0 &&
                                                            filteredAnalyzedRows.every((r) => selectedRowIndices.has(r.index))
                                                        }
                                                        onCheckedChange={(checked) => {
                                                            if (checked) selectAllFiltered();
                                                            else deselectAllFiltered();
                                                        }}
                                                    />
                                                </TableHead>
                                                <TableHead className="text-xs font-bold text-slate-600 w-12">#</TableHead>
                                                <TableHead className="text-xs font-bold text-slate-600">Diagnóstico</TableHead>
                                                <TableHead className="text-xs font-bold text-slate-600">Cliente (Planilha)</TableHead>
                                                <TableHead className="text-xs font-bold text-slate-600">CPF / CNPJ</TableHead>
                                                <TableHead className="text-xs font-bold text-slate-600">Seguradora</TableHead>
                                                <TableHead className="text-xs font-bold text-slate-600">Apólice / Proposta</TableHead>
                                                <TableHead className="text-xs font-bold text-slate-600">Prêmio</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredAnalyzedRows.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={8} className="text-center py-8 text-slate-400 text-xs">
                                                        Nenhuma linha encontrada com os filtros atuais.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                filteredAnalyzedRows.map((row) => {
                                                    const isSelected = selectedRowIndices.has(row.index);
                                                    const isExisting = row.status === "existing_client";
                                                    const isPolicy = row.status === "existing_policy";
                                                    const isDup = row.status === "duplicate_in_file";
                                                    const isInvalid = row.status === "invalid";

                                                    return (
                                                        <TableRow
                                                            key={row.index}
                                                            className={`transition-colors ${
                                                                !isSelected
                                                                    ? "opacity-50 bg-slate-50/40"
                                                                    : isExisting
                                                                    ? "bg-amber-50/20"
                                                                    : isPolicy
                                                                    ? "bg-sky-50/20"
                                                                    : isDup
                                                                    ? "bg-rose-50/20"
                                                                    : "hover:bg-slate-50/80"
                                                            }`}
                                                        >
                                                            <TableCell className="text-center py-2.5">
                                                                <Checkbox
                                                                    checked={isSelected}
                                                                    onCheckedChange={() => toggleRowSelect(row.index)}
                                                                />
                                                            </TableCell>
                                                            <TableCell className="font-mono text-xs text-slate-400 py-2.5">
                                                                {row.index + 1}
                                                            </TableCell>
                                                            <TableCell className="py-2.5">
                                                                <div className="flex flex-col gap-0.5">
                                                                    <Badge
                                                                        className={`text-[10px] w-fit font-bold ${
                                                                            row.status === "new"
                                                                                ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                                                                : row.status === "existing_client"
                                                                                ? "bg-amber-100 text-amber-800 border-amber-200"
                                                                                : row.status === "existing_policy"
                                                                                ? "bg-sky-100 text-sky-800 border-sky-200"
                                                                                : row.status === "duplicate_in_file"
                                                                                ? "bg-orange-100 text-orange-800 border-orange-200"
                                                                                : "bg-rose-100 text-rose-800 border-rose-200"
                                                                        }`}
                                                                    >
                                                                        {row.badge}
                                                                    </Badge>
                                                                    {row.reason && (
                                                                        <span className="text-[10px] text-slate-500 max-w-[200px] truncate" title={row.reason}>
                                                                            {row.reason}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="py-2.5">
                                                                <span className="font-semibold text-xs text-slate-800">
                                                                    {row.data.nome || "—"}
                                                                </span>
                                                                {row.data.telefone && (
                                                                    <p className="text-[11px] text-slate-400">{row.data.telefone}</p>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="py-2.5 font-mono text-xs text-slate-600">
                                                                {row.data.cpfCnpj || "—"}
                                                            </TableCell>
                                                            <TableCell className="py-2.5 text-xs text-emerald-800 font-semibold">
                                                                {row.data.seguradora || "—"}
                                                            </TableCell>
                                                            <TableCell className="py-2.5 font-mono text-xs text-slate-700">
                                                                {row.data.numeroApolice || row.data.idProposta || "—"}
                                                            </TableCell>
                                                            <TableCell className="py-2.5 font-semibold text-xs text-slate-800">
                                                                {row.data.premio ? `R$ ${row.data.premio}` : "—"}
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Progress Bar during Import */}
                {isImporting && (
                    <div className="bg-slate-100 px-6 py-2 border-t border-slate-200">
                        <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                            <span>Processando e gravando registros no banco de dados...</span>
                            <span>{importProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-[#0F6570] h-2 transition-all duration-300 rounded-full"
                                style={{ width: `${importProgress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Footer Navigation */}
                <DialogFooter className="px-6 py-3.5 bg-white border-t border-slate-200 flex flex-row items-center justify-between gap-3">
                    <div>
                        {currentStep > 1 && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setCurrentStep((prev) => (prev === 3 ? 2 : 1))}
                                disabled={isImporting || isAnalyzing}
                                className="gap-2 font-semibold text-xs"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" /> Voltar
                            </Button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            disabled={isImporting}
                            className="text-xs"
                        >
                            Cancelar
                        </Button>

                        {currentStep === 1 && (
                            <Button
                                type="button"
                                onClick={handleRunAnalysis}
                                disabled={isAnalyzing || rawRows.length === 0}
                                className="bg-[#0F6570] hover:bg-[#0D5660] text-white gap-2 font-semibold text-xs px-5 shadow-sm"
                            >
                                {isAnalyzing ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        Analisando Duplicidades...
                                    </>
                                ) : (
                                    <>
                                        Analisar Duplicidades & Conflitos
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </>
                                )}
                            </Button>
                        )}

                        {currentStep === 2 && (
                            <Button
                                type="button"
                                onClick={() => setCurrentStep(3)}
                                className="bg-[#0F6570] hover:bg-[#0D5660] text-white gap-2 font-semibold text-xs px-5 shadow-sm"
                            >
                                Revisar Linha a Linha ({selectedRowIndices.size})
                                <ArrowRight className="w-3.5 h-3.5" />
                            </Button>
                        )}

                        {currentStep === 3 && (
                            <Button
                                type="button"
                                onClick={handleExecuteImport}
                                disabled={isImporting || selectedRowIndices.size === 0}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-semibold text-xs px-6 shadow-sm"
                            >
                                {isImporting ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        Importando...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4" />
                                        Confirmar & Importar {selectedRowIndices.size} Registro(s)
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
