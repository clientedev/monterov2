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
    ArrowRight,
    ArrowLeft,
    Search,
    ShieldAlert,
    UserCheck,
    UserPlus,
    FileText,
    Loader2,
    Trash2,
    Sparkles,
    RefreshCw,
    Pencil,
    PlusCircle,
    Eye,
    EyeOff,
    Settings,
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

function getColumnLetter(colIndex: number): string {
    let temp = colIndex;
    let letter = "";
    while (temp >= 0) {
        letter = String.fromCharCode((temp % 26) + 65) + letter;
        temp = Math.floor(temp / 26) - 1;
    }
    return letter;
}

export interface SpreadsheetColumnItem {
    columnIndex: number;
    letter: string;
    originalHeader: string;
    customName: string; // Editable by user
    targetKey: string; // System field key, or "custom_field", or "ignore"
    isCustomField: boolean;
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

    // Wizard step: 1 = Formato Planilha Original & Mapeamento, 2 = Diagnóstico & Duplicados, 3 = Revisão & Execução
    const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

    // Workbook state
    const [sheetNames, setSheetNames] = useState<string[]>([]);
    const [selectedSheet, setSelectedSheet] = useState<string>("");
    const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
    const [columns, setColumns] = useState<SpreadsheetColumnItem[]>([]);

    // Deduplication matching criteria
    const [matchCriteria, setMatchCriteria] = useState({
        matchDoc: true,
        matchEmail: true,
        matchPhone: true,
        matchName: false,
        matchPolicy: true,
    });

    // Duplicate strategy
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

    // Selected rows for import
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
            setColumns([]);
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

    // Parse sheet rows into authentic spreadsheet grid format
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

        // Get headers in order of appearance
        const headerSet = new Set<string>();
        data.forEach((row) => Object.keys(row).forEach((k) => headerSet.add(k)));
        const headers = Array.from(headerSet).filter((h) => !h.startsWith("__EMPTY"));

        const initialCols: SpreadsheetColumnItem[] = headers.map((header, idx) => {
            const normH = normStr(header);

            // Match known system field
            let matchedKey = "ignore";
            for (const field of SYSTEM_FIELDS) {
                if (field.aliases.some((a) => normStr(a) === normH)) {
                    matchedKey = field.key;
                    break;
                }
            }
            if (matchedKey === "ignore") {
                for (const field of SYSTEM_FIELDS) {
                    if (field.aliases.some((a) => normH.includes(normStr(a)) || normStr(a).includes(normH))) {
                        matchedKey = field.key;
                        break;
                    }
                }
            }

            const isKnown = matchedKey !== "ignore";
            return {
                columnIndex: idx,
                letter: getColumnLetter(idx),
                originalHeader: header,
                customName: header, // Initially matches the spreadsheet header
                targetKey: isKnown ? matchedKey : "custom_field",
                isCustomField: !isKnown,
                included: true,
            };
        });

        setColumns(initialCols);
    };

    // Switch active Sheet
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

    // Rename a column
    const handleRenameColumn = (colIndex: number, newName: string) => {
        setColumns((prev) =>
            prev.map((c) => {
                if (c.columnIndex !== colIndex) return c;

                const normNew = normStr(newName);
                let matchedKey = "custom_field";
                let isCustom = true;

                for (const field of SYSTEM_FIELDS) {
                    if (field.aliases.some((a) => normStr(a) === normNew) || normStr(field.label) === normNew) {
                        matchedKey = field.key;
                        isCustom = false;
                        break;
                    }
                }

                return {
                    ...c,
                    customName: newName,
                    targetKey: matchedKey,
                    isCustomField: isCustom,
                    included: true,
                };
            })
        );
    };

    // Change target field mapping for column
    const handleTargetChange = (colIndex: number, newTarget: string) => {
        setColumns((prev) =>
            prev.map((c) => {
                if (c.columnIndex !== colIndex) return c;
                if (newTarget === "ignore") {
                    return { ...c, targetKey: "ignore", included: false };
                }
                const isCustom = newTarget === "custom_field";
                return {
                    ...c,
                    targetKey: newTarget,
                    isCustomField: isCustom,
                    included: true,
                };
            })
        );
    };

    // Toggle column included/excluded
    const toggleColumnInclude = (colIndex: number) => {
        setColumns((prev) =>
            prev.map((c) => {
                if (c.columnIndex !== colIndex) return c;
                const nextInc = !c.included;
                return {
                    ...c,
                    included: nextInc,
                    targetKey: !nextInc ? "ignore" : c.targetKey === "ignore" ? "custom_field" : c.targetKey,
                };
            })
        );
    };

    // Exclude all columns except Nome and required
    const resetAllColumns = (includedState: boolean) => {
        setColumns((prev) => prev.map((c) => ({ ...c, included: includedState })));
    };

    // Prepare mapped rows for analysis & import
    const getMappedRows = () => {
        const activeCols = columns.filter((c) => c.included && c.targetKey !== "ignore");

        return rawRows.map((rawRow) => {
            const mapped: Record<string, any> = {};
            const customFields: Record<string, any> = {};

            for (const col of activeCols) {
                let cellVal = rawRow[col.originalHeader];
                if (cellVal !== undefined && cellVal !== null) {
                    if (cellVal instanceof Date) {
                        cellVal = cellVal.toLocaleDateString("pt-BR");
                    }
                    const strVal = String(cellVal).trim();

                    if (col.isCustomField || col.targetKey === "custom_field") {
                        // Store under custom column name
                        const fieldName = col.customName.trim() || col.originalHeader.trim();
                        customFields[fieldName] = strVal;
                        mapped[fieldName] = strVal;
                    } else {
                        // Standard field
                        mapped[col.targetKey] = strVal;
                    }
                }
            }

            if (Object.keys(customFields).length > 0) {
                mapped.dadosAdicionais = customFields;
            }

            return mapped;
        });
    };

    // Run Deduplication Analysis
    const handleRunAnalysis = async () => {
        const hasNome = columns.some((c) => c.included && (c.targetKey === "nome" || normStr(c.customName) === "nome"));
        if (!hasNome) {
            toast({
                title: "Coluna de Nome Obrigatória",
                description: "Por favor, mapeie ou renomeie uma das colunas para 'Nome' (Identificação do Cliente).",
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
                throw new Error(errData.message || "Erro na análise da planilha.");
            }

            const data = await res.json();
            setAnalysisResult(data);

            const validIndices = new Set<number>();
            data.analyzedRows.forEach((r: any) => {
                if (r.status !== "invalid") validIndices.add(r.index);
            });
            setSelectedRowIndices(validIndices);

            setCurrentStep(2);
        } catch (err: any) {
            toast({
                title: "Erro na análise",
                description: err.message || "Falha ao processar os dados da planilha.",
                variant: "destructive",
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Filter rows for Step 3
    const filteredAnalyzedRows = useMemo(() => {
        if (!analysisResult) return [];

        return analysisResult.analyzedRows.filter((r) => {
            if (filterCategory === "new" && r.status !== "new") return false;
            if (filterCategory === "existing" && r.status !== "existing_client") return false;
            if (filterCategory === "warning" && r.status !== "existing_policy" && r.status !== "duplicate_in_file" && r.status !== "invalid") {
                return false;
            }

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

    // Custom fields summary
    const detectedCustomFields = useMemo(() => {
        return columns.filter((c) => c.included && c.isCustomField);
    }, [columns]);

    // Selection helpers
    const toggleRowSelect = (index: number) => {
        setSelectedRowIndices((prev) => {
            const next = new Set(prev);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
    };

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

    // Execute Import
    const handleExecuteImport = async () => {
        if (!analysisResult || selectedRowIndices.size === 0) {
            toast({
                title: "Nenhum cliente selecionado",
                description: "Selecione ao menos um registro para importar.",
                variant: "destructive",
            });
            return;
        }

        setIsImporting(true);
        setImportProgress(15);

        try {
            const selectedRowsData = analysisResult.analyzedRows
                .filter((r) => selectedRowIndices.has(r.index))
                .map((r) => r.data);

            setImportProgress(40);

            const res = await apiRequest("POST", "/api/clientes/batch-import", {
                rows: selectedRowsData,
                duplicateStrategy,
            });

            setImportProgress(85);

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || "Erro na gravação em lote.");
            }

            const result = await res.json();
            setImportProgress(100);

            toast({
                title: "Importação Concluída com Sucesso! 🎉",
                description: `${result.createdClients || 0} novos clientes criados, ${result.updatedClients || 0} clientes atualizados, ${result.createdApolices || 0} novas apólices vinculadas.`,
            });

            if (onImportSuccess) onImportSuccess();
            onOpenChange(false);
        } catch (err: any) {
            toast({
                title: "Erro ao importar",
                description: err.message || "Ocorreu uma falha durante a gravação dos dados.",
                variant: "destructive",
            });
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[96vw] w-[1400px] max-h-[94vh] flex flex-col p-0 gap-0 overflow-hidden bg-white shadow-2xl border-0">
                {/* Header */}
                <div className="bg-[#0F6570] text-white px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center shrink-0">
                            <FileSpreadsheet className="w-5 h-5 text-emerald-300" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                                Planilha Aberta para Tratamento
                                <Badge className="bg-emerald-400/20 text-emerald-200 border-emerald-300/30 text-[10px]">
                                    Visualizador Excel
                                </Badge>
                            </DialogTitle>
                            <p className="text-xs text-white/80">
                                {file ? `${file.name} • ${rawRows.length} linhas • ${columns.length} colunas` : ""}
                            </p>
                        </div>
                    </div>

                    {/* Stepper Navigation */}
                    <div className="flex items-center gap-1 bg-black/20 backdrop-blur p-1 rounded-xl text-xs">
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
                            Planilha Original & Colunas
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
                            Diagnóstico de Duplicados
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
                            Revisão & Salvar
                        </button>
                    </div>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-hidden flex flex-col p-4 bg-slate-100/60">
                    {/* STEP 1: Authentic Spreadsheet View with Editable Column Headers & Real Rows */}
                    {currentStep === 1 && (
                        <div className="flex-1 flex flex-col overflow-hidden gap-3">
                            {/* Toolbar: Sheets, Quick Filters & Duplicate Criteria */}
                            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    {sheetNames.length > 1 ? (
                                        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
                                            <span className="text-[11px] font-bold text-slate-500 uppercase px-2">Aba:</span>
                                            {sheetNames.map((s) => (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    onClick={() => handleSheetChange(s)}
                                                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                                                        selectedSheet === s
                                                            ? "bg-white text-[#0F6570] shadow-xs"
                                                            : "text-slate-600 hover:text-slate-900"
                                                    }`}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-xs text-slate-700 font-semibold">
                                            <Badge variant="outline" className="bg-slate-50 text-slate-700">
                                                {selectedSheet || "Planilha Principal"}
                                            </Badge>
                                            <span>•</span>
                                            <span className="text-slate-500">{rawRows.length} linhas de dados</span>
                                        </div>
                                    )}

                                    <div className="h-4 w-px bg-slate-200 hidden sm:block" />

                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs font-medium">
                                            {columns.filter((c) => c.included).length} colunas incluídas
                                        </Badge>
                                        {columns.some((c) => !c.included) && (
                                            <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-xs font-medium">
                                                {columns.filter((c) => !c.included).length} excluídas
                                            </Badge>
                                        )}
                                        {detectedCustomFields.length > 0 && (
                                            <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs font-medium flex items-center gap-1">
                                                <Sparkles className="w-3 h-3" />
                                                {detectedCustomFields.length} novos campos dinâmicos
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => resetAllColumns(true)}
                                        className="h-7 text-xs font-semibold text-[#0F6570] border-slate-300"
                                    >
                                        Reativar Todas as Colunas
                                    </Button>
                                </div>
                            </div>

                            {/* Spreadsheet Grid Container (Formato da Planilha Original) */}
                            <div className="flex-1 bg-white border border-slate-300 rounded-xl shadow-xs overflow-auto relative">
                                <table className="w-full border-collapse text-xs select-text">
                                    {/* Spreadsheet Sticky Headers */}
                                    <thead className="sticky top-0 z-20 bg-slate-100 shadow-xs">
                                        {/* Row 1: Column Letters (A, B, C...) + Exclude Button */}
                                        <tr className="border-b border-slate-300">
                                            <th className="w-12 min-w-[48px] bg-slate-200/90 border-r border-slate-300 text-center font-mono text-[11px] text-slate-500 py-1 sticky left-0 z-30">
                                                #
                                            </th>
                                            {columns.map((col) => {
                                                const isExcluded = !col.included;
                                                return (
                                                    <th
                                                        key={`letter-${col.columnIndex}`}
                                                        className={`border-r border-slate-300 px-3 py-1 font-mono text-[11px] font-bold text-center transition-colors min-w-[210px] ${
                                                            isExcluded
                                                                ? "bg-slate-200/60 text-slate-400"
                                                                : "bg-slate-100 text-slate-700"
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <span>Coluna {col.letter}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleColumnInclude(col.columnIndex)}
                                                                className={`p-1 rounded transition-colors text-[10px] flex items-center gap-1 ${
                                                                    isExcluded
                                                                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                                                        : "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                                                }`}
                                                                title={isExcluded ? "Reativar coluna na importação" : "Excluir esta coluna"}
                                                            >
                                                                {isExcluded ? (
                                                                    <>
                                                                        <RefreshCw className="w-2.5 h-2.5" /> Reativar
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Trash2 className="w-3 h-3 text-rose-500" />
                                                                        <span className="text-[10px] text-rose-600">Excluir</span>
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    </th>
                                                );
                                            })}
                                        </tr>

                                        {/* Row 2: Editable Column Header Name (Permite Renomear na hora) */}
                                        <tr className="border-b border-slate-300 bg-white">
                                            <th className="bg-slate-200/90 border-r border-slate-300 text-center font-bold text-[10px] text-slate-600 py-2 sticky left-0 z-30">
                                                Nome
                                            </th>
                                            {columns.map((col) => {
                                                const isExcluded = !col.included;
                                                return (
                                                    <th
                                                        key={`name-${col.columnIndex}`}
                                                        className={`border-r border-slate-300 p-2 text-left font-normal align-top transition-colors ${
                                                            isExcluded ? "bg-slate-100/70" : "bg-white"
                                                        }`}
                                                    >
                                                        <div className="space-y-1.5">
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="relative flex-1">
                                                                    <Input
                                                                        value={col.customName}
                                                                        onChange={(e) =>
                                                                            handleRenameColumn(col.columnIndex, e.target.value)
                                                                        }
                                                                        disabled={isExcluded}
                                                                        placeholder="Renomear coluna..."
                                                                        className={`h-7 text-xs font-bold px-2 rounded border-slate-300 focus:border-[#0F6570] focus:ring-1 focus:ring-[#0F6570] ${
                                                                            isExcluded
                                                                                ? "line-through text-slate-400 bg-slate-200/40"
                                                                                : "text-slate-900 bg-white"
                                                                        }`}
                                                                    />
                                                                    <Pencil className="w-2.5 h-2.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                                                </div>
                                                            </div>

                                                            {/* Dropdown Mapeamento / Criação de Novo Campo */}
                                                            <Select
                                                                value={col.included ? col.targetKey : "ignore"}
                                                                onValueChange={(val) => handleTargetChange(col.columnIndex, val)}
                                                                disabled={isExcluded}
                                                            >
                                                                <SelectTrigger className="h-6 text-[11px] font-medium border-slate-200 bg-slate-50">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent className="max-h-[300px]">
                                                                    <SelectItem value="ignore" className="text-rose-600 font-semibold">
                                                                        ✖ Excluir / Ignorar Coluna
                                                                    </SelectItem>

                                                                    <SelectItem value="custom_field" className="text-amber-700 font-bold bg-amber-50/50">
                                                                        ✨ Criar como Novo Campo Dinâmico
                                                                    </SelectItem>

                                                                    <SelectGroup>
                                                                        <SelectLabel className="text-[10px] font-bold text-[#0F6570] uppercase">
                                                                            Identificação do Cliente
                                                                        </SelectLabel>
                                                                        {SYSTEM_FIELDS.filter((f) => f.group === "cliente").map((f) => (
                                                                            <SelectItem key={f.key} value={f.key}>
                                                                                {f.label} {f.required ? "*" : ""}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectGroup>

                                                                    <SelectGroup>
                                                                        <SelectLabel className="text-[10px] font-bold text-amber-700 uppercase">
                                                                            Apólice & Seguro
                                                                        </SelectLabel>
                                                                        {SYSTEM_FIELDS.filter((f) => f.group === "apolice").map((f) => (
                                                                            <SelectItem key={f.key} value={f.key}>
                                                                                {f.label}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectGroup>

                                                                    <SelectGroup>
                                                                        <SelectLabel className="text-[10px] font-bold text-indigo-700 uppercase">
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

                                                            {/* Status Pill */}
                                                            <div className="flex items-center justify-between text-[10px]">
                                                                {isExcluded ? (
                                                                    <span className="text-rose-600 font-semibold">
                                                                        Coluna Excluída
                                                                    </span>
                                                                ) : col.isCustomField ? (
                                                                    <span className="text-amber-700 font-bold flex items-center gap-0.5">
                                                                        <Sparkles className="w-2.5 h-2.5" /> Criará campo novo
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-[#0F6570] font-semibold truncate max-w-[180px]">
                                                                        Campo: {SYSTEM_FIELDS.find((f) => f.key === col.targetKey)?.label || col.targetKey}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </th>
                                                );
                                            })}
                                        </tr>
                                    </thead>

                                    {/* Data Rows — Authentic Spreadsheet Cells */}
                                    <tbody>
                                        {rawRows.slice(0, 40).map((row, rIdx) => (
                                            <tr
                                                key={`row-${rIdx}`}
                                                className="border-b border-slate-200 hover:bg-sky-50/40 transition-colors"
                                            >
                                                {/* Sticky Row Index */}
                                                <td className="bg-slate-100 border-r border-slate-300 text-center font-mono text-[11px] text-slate-500 py-1.5 px-2 sticky left-0 z-10 select-none">
                                                    {rIdx + 1}
                                                </td>

                                                {/* Column Cells */}
                                                {columns.map((col) => {
                                                    const cellVal = row[col.originalHeader];
                                                    const formattedVal =
                                                        cellVal instanceof Date
                                                            ? cellVal.toLocaleDateString("pt-BR")
                                                            : cellVal !== undefined && cellVal !== null
                                                            ? String(cellVal)
                                                            : "";
                                                    const isExcluded = !col.included;

                                                    return (
                                                        <td
                                                            key={`cell-${rIdx}-${col.columnIndex}`}
                                                            className={`border-r border-slate-200 px-3 py-1.5 truncate max-w-[260px] text-slate-700 ${
                                                                isExcluded
                                                                    ? "bg-slate-100/50 text-slate-400 line-through select-none"
                                                                    : ""
                                                            }`}
                                                            title={formattedVal}
                                                        >
                                                            {formattedVal || <span className="text-slate-300 italic">—</span>}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Deduplication Matching Criteria Bar */}
                            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                                        <ShieldAlert className="w-4 h-4 text-[#0F6570]" />
                                        Critérios para acusar cliente com os mesmos dados (Deduplicação):
                                    </div>
                                    <p className="text-[11px] text-slate-500">
                                        Selecione quais colunas o sistema deve comparar para identificar se o cliente já está cadastrado:
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <label className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 cursor-pointer hover:bg-slate-100">
                                        <Checkbox
                                            checked={matchCriteria.matchDoc}
                                            onCheckedChange={(c) =>
                                                setMatchCriteria((prev) => ({ ...prev, matchDoc: Boolean(c) }))
                                            }
                                        />
                                        <span>CPF / CNPJ</span>
                                    </label>

                                    <label className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 cursor-pointer hover:bg-slate-100">
                                        <Checkbox
                                            checked={matchCriteria.matchEmail}
                                            onCheckedChange={(c) =>
                                                setMatchCriteria((prev) => ({ ...prev, matchEmail: Boolean(c) }))
                                            }
                                        />
                                        <span>E-mail</span>
                                    </label>

                                    <label className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 cursor-pointer hover:bg-slate-100">
                                        <Checkbox
                                            checked={matchCriteria.matchPhone}
                                            onCheckedChange={(c) =>
                                                setMatchCriteria((prev) => ({ ...prev, matchPhone: Boolean(c) }))
                                            }
                                        />
                                        <span>Telefone</span>
                                    </label>

                                    <label className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 cursor-pointer hover:bg-slate-100">
                                        <Checkbox
                                            checked={matchCriteria.matchPolicy}
                                            onCheckedChange={(c) =>
                                                setMatchCriteria((prev) => ({ ...prev, matchPolicy: Boolean(c) }))
                                            }
                                        />
                                        <span>Nº Apólice / Proposta</span>
                                    </label>

                                    <label className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 cursor-pointer hover:bg-slate-100">
                                        <Checkbox
                                            checked={matchCriteria.matchName}
                                            onCheckedChange={(c) =>
                                                setMatchCriteria((prev) => ({ ...prev, matchName: Boolean(c) }))
                                            }
                                        />
                                        <span>Nome Exato</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Diagnóstico & Deduplicação */}
                    {currentStep === 2 && analysisResult && (
                        <div className="space-y-6 overflow-y-auto pr-1">
                            {/* Scorecard Counters */}
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
                                    <p className="text-[11px] text-sky-700 mt-1">apólice/proposta já cadastrada</p>
                                </div>
                            </div>

                            {/* Custom Dynamic Fields Notice */}
                            {detectedCustomFields.length > 0 && (
                                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm space-y-2">
                                    <div className="flex items-center gap-2 text-sm font-bold text-amber-950">
                                        <Sparkles className="w-4 h-4 text-amber-600" />
                                        Campos Dinâmicos que serão criados automaticamente:
                                    </div>
                                    <p className="text-xs text-amber-800">
                                        As seguintes colunas personalizadas que você renomeou ou manteve serão criadas como dados adicionais no cadastro de cada cliente:
                                    </p>
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {detectedCustomFields.map((col) => (
                                            <Badge
                                                key={col.columnIndex}
                                                className="bg-white border-amber-300 text-amber-900 text-xs px-2.5 py-1 font-semibold shadow-2xs"
                                            >
                                                ✨ {col.customName}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Deduplication Strategy Selector */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                        <ShieldAlert className="w-4 h-4 text-[#0F6570]" />
                                        Como tratar os clientes já cadastrados?
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Selecione a ação para os {analysisResult.summary.existingClients} cliente(s) encontrados com dados coincidentes:
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
                        </div>
                    )}

                    {/* STEP 3: Line-by-Line Table Preview & Save */}
                    {currentStep === 3 && analysisResult && (
                        <div className="flex-1 flex flex-col overflow-hidden gap-3">
                            {/* Controls */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                                <div className="relative flex-1 max-w-sm">
                                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Buscar por nome, CPF ou apólice..."
                                        className="h-8 pl-8 text-xs rounded-lg"
                                    />
                                </div>

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
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-8 text-xs font-semibold"
                                        onClick={selectAllFiltered}
                                    >
                                        Marcar Todos
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-8 text-xs font-semibold"
                                        onClick={deselectAllFiltered}
                                    >
                                        Desmarcar
                                    </Button>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-xs overflow-auto">
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
                                                    Nenhuma linha encontrada.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredAnalyzedRows.map((row) => {
                                                const isSelected = selectedRowIndices.has(row.index);
                                                const isExisting = row.status === "existing_client";
                                                const isPolicy = row.status === "existing_policy";
                                                const isDup = row.status === "duplicate_in_file";

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
                                                        <TableCell className="text-center py-2">
                                                            <Checkbox
                                                                checked={isSelected}
                                                                onCheckedChange={() => toggleRowSelect(row.index)}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="font-mono text-xs text-slate-400 py-2">
                                                            {row.index + 1}
                                                        </TableCell>
                                                        <TableCell className="py-2">
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
                                                                    <span className="text-[10px] text-slate-500 max-w-[220px] truncate" title={row.reason}>
                                                                        {row.reason}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-2">
                                                            <span className="font-semibold text-xs text-slate-800">
                                                                {row.data.nome || "—"}
                                                            </span>
                                                            {row.data.telefone && (
                                                                <p className="text-[11px] text-slate-400">{row.data.telefone}</p>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="py-2 font-mono text-xs text-slate-600">
                                                            {row.data.cpfCnpj || "—"}
                                                        </TableCell>
                                                        <TableCell className="py-2 text-xs text-emerald-800 font-semibold">
                                                            {row.data.seguradora || "—"}
                                                        </TableCell>
                                                        <TableCell className="py-2 font-mono text-xs text-slate-700">
                                                            {row.data.numeroApolice || row.data.idProposta || "—"}
                                                        </TableCell>
                                                        <TableCell className="py-2 font-semibold text-xs text-slate-800">
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
                    )}
                </div>

                {/* Progress bar */}
                {isImporting && (
                    <div className="bg-slate-100 px-6 py-2 border-t border-slate-200">
                        <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                            <span>Processando importação e criando campos...</span>
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

                {/* Footer */}
                <DialogFooter className="px-6 py-3 bg-white border-t border-slate-200 flex flex-row items-center justify-between gap-3">
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
                                        Analisando Duplicados...
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
                                        Salvar e Importar {selectedRowIndices.size} Registro(s)
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
