import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Apolice, Cliente, Seguradora, ProdutoSeguro, User } from "@shared/schema";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Badge } from "@/components/ui/badge";
import {
  FileUp, Sparkles, CheckCircle2, FileText, Loader2, AlertCircle,
  Trash2, ExternalLink, Shield, Building, User as UserIcon, RefreshCw
} from "lucide-react";
import { format } from "date-fns";

const STATUS_OPTIONS = [
  { value: "ativa", label: "Ativa" },
  { value: "pendente", label: "Pendente" },
  { value: "em_atraso", label: "Em Atraso" },
  { value: "vencida", label: "Vencida" },
  { value: "cancelada", label: "Cancelada" },
];

function dateToISO(val: string): string | null {
  if (!val) return null;
  const d = new Date(val + "T12:00:00Z");
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function safeDateInput(val: any): string {
  if (!val) return "";
  if (typeof val === "string") {
    val = val.trim();
    if (!val) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    if (/^\d{4}-\d{2}-\d{2}T/.test(val)) return val.split("T")[0];
    const m = val.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  }
  try {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return format(d, "yyyy-MM-dd");
    }
  } catch {}
  return "";
}

interface ApoliceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultClienteId?: number | null;
  editApolice?: Apolice | null;
  onSuccess?: () => void;
}

export function ApoliceDialog({
  open,
  onOpenChange,
  defaultClienteId,
  editApolice,
  onSuccess
}: ApoliceDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [clienteId, setClienteId] = useState<string>(defaultClienteId ? String(defaultClienteId) : "");
  const [numeroApolice, setNumeroApolice] = useState("");
  const [produtoId, setProdutoId] = useState("");
  const [seguradoraId, setSeguradoraId] = useState("");
  const [status, setStatus] = useState("ativa");
  const [inicioVigencia, setInicioVigencia] = useState("");
  const [fimVigencia, setFimVigencia] = useState("");
  const [premio, setPremio] = useState("");
  const [valorSegurado, setValorSegurado] = useState("");
  const [comissao, setComissao] = useState("");
  const [corretorId, setCorretorId] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [idProposta, setIdProposta] = useState("");
  const [idApolice, setIdApolice] = useState("");
  const [numeroProposta, setNumeroProposta] = useState("");
  const [dataEmissao, setDataEmissao] = useState("");
  const [cobertura, setCobertura] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("");
  const [linkFatura, setLinkFatura] = useState("");
  const [pdfApolice, setPdfApolice] = useState("");
  const [mesAtraso, setMesAtraso] = useState("");
  const [faturasAberto, setFaturasAberto] = useState("");

  // Attached PDF & Extraction State
  const [isReadingPdf, setIsReadingPdf] = useState(false);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [pdfFileSize, setPdfFileSize] = useState<string | null>(null);
  const [extractedSummary, setExtractedSummary] = useState<string[] | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Queries
  const { data: clientes } = useQuery<Cliente[]>({ queryKey: ["/api/clientes"] });
  const { data: seguradoras } = useQuery<Seguradora[]>({ queryKey: ["/api/seguradoras"] });
  const { data: produtos } = useQuery<ProdutoSeguro[]>({ queryKey: ["/api/produtos-seguro"] });
  const { data: users } = useQuery<User[]>({ queryKey: ["/api/users"] });

  // Reset or Populate on Open / Edit
  useEffect(() => {
    if (open) {
      if (editApolice) {
        setClienteId(String(editApolice.clienteId || defaultClienteId || ""));
        setNumeroApolice(editApolice.numeroApolice || "");
        setProdutoId(editApolice.produtoId ? String(editApolice.produtoId) : "");
        setSeguradoraId(editApolice.seguradoraId ? String(editApolice.seguradoraId) : "");
        setStatus(editApolice.status || "ativa");
        setInicioVigencia(safeDateInput(editApolice.inicioVigencia));
        setFimVigencia(safeDateInput(editApolice.fimVigencia));
        setPremio(editApolice.premio || "");
        setValorSegurado(editApolice.valorSegurado || "");
        setComissao(editApolice.comissao || "");
        setCorretorId(editApolice.corretorId ? String(editApolice.corretorId) : "");
        setObservacoes(editApolice.observacoes || "");
        setIdProposta(editApolice.idProposta || "");
        setIdApolice(editApolice.idApolice || "");
        setNumeroProposta(editApolice.numeroProposta || "");
        setDataEmissao(safeDateInput(editApolice.dataEmissao));
        setCobertura(editApolice.cobertura || "");
        setFormaPagamento(editApolice.formaPagamento || "");
        setLinkFatura(editApolice.linkFatura || "");
        setPdfApolice(editApolice.pdfApolice || "");
        setMesAtraso(editApolice.mesAtraso || "");
        setFaturasAberto(editApolice.faturasAberto || "");
        setPdfFileName(editApolice.pdfApolice ? editApolice.pdfApolice.split("/").pop() || "Documento Anexo" : null);
        setExtractedSummary(null);
      } else {
        setClienteId(defaultClienteId ? String(defaultClienteId) : "");
        setNumeroApolice("");
        setProdutoId("");
        setSeguradoraId("");
        setStatus("ativa");
        setInicioVigencia("");
        setFimVigencia("");
        setPremio("");
        setValorSegurado("");
        setComissao("");
        setCorretorId("");
        setObservacoes("");
        setIdProposta("");
        setIdApolice("");
        setNumeroProposta("");
        setDataEmissao("");
        setCobertura("");
        setFormaPagamento("");
        setLinkFatura("");
        setPdfApolice("");
        setMesAtraso("");
        setFaturasAberto("");
        setPdfFileName(null);
        setPdfFileSize(null);
        setExtractedSummary(null);
      }
      setIsReadingPdf(false);
    }
  }, [open, editApolice, defaultClienteId]);

  // Handle PDF Upload & AI/Regex Extraction
  const processPdfFile = async (file: File) => {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, anexe um arquivo PDF válido da apólice.",
        variant: "destructive"
      });
      return;
    }

    setIsReadingPdf(true);
    setPdfFileName(file.name);
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    setPdfFileSize(`${sizeMb} MB`);

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const base64 = await base64Promise;

      const res = await apiRequest("POST", "/api/apolices/parse-pdf", {
        filename: file.name,
        base64: base64
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Falha ao ler o PDF");
      }

      const data = await res.json();
      const { pdfUrl, extracted } = data;

      const filledFields: string[] = [];

      // Link do PDF salvo no servidor
      if (pdfUrl) {
        setPdfApolice(pdfUrl);
        filledFields.push("Arquivo PDF salvo");
      }

      // Cliente identificado
      if (extracted.clienteId && (!clienteId || clienteId === "")) {
        setClienteId(String(extracted.clienteId));
        filledFields.push("Cliente vinculado");
      }

      // Número da Apólice
      if (extracted.numeroApolice) {
        setNumeroApolice(extracted.numeroApolice);
        filledFields.push("Nº Apólice");
      }

      // Propostas e IDs
      if (extracted.idProposta) {
        setIdProposta(extracted.idProposta);
        filledFields.push("ID Proposta");
      }
      if (extracted.numeroProposta) {
        setNumeroProposta(extracted.numeroProposta);
        filledFields.push("Nº Proposta");
      }
      if (extracted.idApolice) {
        setIdApolice(extracted.idApolice);
        filledFields.push("ID/CI Apólice");
      }

      // Seguradora
      if (extracted.seguradoraId) {
        setSeguradoraId(String(extracted.seguradoraId));
        filledFields.push(`Seguradora (${extracted.seguradoraNome || "Identificada"})`);
      }

      // Produto
      if (extracted.produtoId) {
        setProdutoId(String(extracted.produtoId));
        filledFields.push(`Produto (${extracted.produtoNome || "Identificado"})`);
      }

      // Vigência
      if (extracted.inicioVigencia) {
        setInicioVigencia(extracted.inicioVigencia);
        filledFields.push("Início de Vigência");
      }
      if (extracted.fimVigencia) {
        setFimVigencia(extracted.fimVigencia);
        filledFields.push("Fim de Vigência");
      }

      // Data de Emissão
      if (extracted.dataEmissao) {
        setDataEmissao(extracted.dataEmissao);
        filledFields.push("Data de Emissão");
      }

      // Prêmio
      if (extracted.premio) {
        setPremio(extracted.premio);
        filledFields.push(`Prêmio (R$ ${extracted.premio})`);
      }

      // Valor Segurado
      if (extracted.valorSegurado) {
        setValorSegurado(extracted.valorSegurado);
        filledFields.push(`Valor Segurado (R$ ${extracted.valorSegurado})`);
      }

      // Comissão
      if (extracted.comissao) {
        setComissao(extracted.comissao);
        filledFields.push("Comissão");
      }

      // Forma de Pagamento
      if (extracted.formaPagamento) {
        setFormaPagamento(extracted.formaPagamento);
        filledFields.push("Forma de Pagamento");
      }

      // Cobertura / Veículo
      if (extracted.cobertura) {
        setCobertura(extracted.cobertura);
        filledFields.push("Coberturas / Veículo");
      }

      // Observações
      if (extracted.observacoes) {
        setObservacoes(prev => prev ? `${prev}\n${extracted.observacoes}` : extracted.observacoes);
      }

      setExtractedSummary(filledFields);

      // Revalida listas para incluir seguradora nova se criada
      queryClient.invalidateQueries({ queryKey: ["/api/seguradoras"] });

      toast({
        title: "Apólice lida com sucesso! ✨",
        description: `${filledFields.length} campos foram preenchidos automaticamente com base no documento.`,
      });
    } catch (err: any) {
      console.error("Erro ao ler PDF:", err);
      toast({
        title: "Aviso na leitura do PDF",
        description: err.message || "Não foi possível extrair todos os dados automaticamente. Você pode preencher os campos manualmente.",
        variant: "destructive"
      });
    } finally {
      setIsReadingPdf(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processPdfFile(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processPdfFile(e.dataTransfer.files[0]);
    }
  };

  const removeAttachedPdf = () => {
    setPdfApolice("");
    setPdfFileName(null);
    setPdfFileSize(null);
    setExtractedSummary(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Submit Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!clienteId || clienteId === "") {
        throw new Error("Selecione um cliente para vincular a apólice.");
      }

      const body = {
        clienteId: parseInt(clienteId),
        numeroApolice: numeroApolice || null,
        produtoId: produtoId ? parseInt(produtoId) : null,
        seguradoraId: seguradoraId ? parseInt(seguradoraId) : null,
        status,
        inicioVigencia: inicioVigencia ? dateToISO(inicioVigencia) : null,
        fimVigencia: fimVigencia ? dateToISO(fimVigencia) : null,
        premio: premio || null,
        valorSegurado: valorSegurado || null,
        comissao: comissao || null,
        corretorId: corretorId ? parseInt(corretorId) : null,
        observacoes: observacoes || null,
        idProposta: idProposta || null,
        idApolice: idApolice || null,
        pdfApolice: pdfApolice || null,
        cobertura: cobertura || null,
        dataEmissao: dataEmissao ? dateToISO(dataEmissao) : null,
        numeroProposta: numeroProposta || null,
        linkFatura: linkFatura || null,
        formaPagamento: formaPagamento || null,
        mesAtraso: mesAtraso || null,
        faturasAberto: faturasAberto || null,
      };

      if (editApolice) {
        const res = await apiRequest("PATCH", `/api/apolices/${editApolice.id}`, body);
        if (!res.ok) throw new Error((await res.json()).message);
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/apolices", body);
        if (!res.ok) throw new Error((await res.json()).message);
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/apolices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clientes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/seguros/dashboard"] });
      if (clienteId) {
        queryClient.invalidateQueries({ queryKey: [`/api/clientes/${clienteId}/apolices`] });
      }
      toast({
        title: editApolice ? "Apólice atualizada com sucesso" : "Apólice criada com sucesso! 🎉"
      });
      onOpenChange(false);
      if (onSuccess) onSuccess();
    },
    onError: (e: Error) => {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-0 rounded-2xl shadow-2xl border-slate-200">
        <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-[#0F6570] to-[#0A454D] text-white rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-display font-bold text-white">
                  {editApolice ? "Editar Apólice de Seguro" : "Criar Nova Apólice"}
                </DialogTitle>
                <p className="text-xs text-teal-100 mt-0.5">
                  Anexe o PDF para leitura automática das primeiras páginas e preenchimento ágil.
                </p>
              </div>
            </div>
            {!editApolice && (
              <Badge className="bg-emerald-400/20 text-emerald-200 border-emerald-400/30 gap-1 text-xs px-2.5 py-1">
                <Sparkles className="h-3 w-3 text-emerald-300" /> Leitura Inteligente
              </Badge>
            )}
          </div>
        </DialogHeader>

        <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(); }} className="p-6 space-y-6">
          {/* ── TOP SECTION: ANEXAR APÓLICE (PDF) ─────────────────────────── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <FileUp className="h-4 w-4 text-[#0F6570]" />
                Anexar Apólice (PDF)
              </Label>
              {pdfApolice && (
                <a
                  href={pdfApolice}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-[#0F6570] hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" /> Ver documento anexo
                </a>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,application/pdf"
              className="hidden"
            />

            {!pdfFileName ? (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
                  dragActive
                    ? "border-[#0F6570] bg-[#0F6570]/10 scale-[0.99]"
                    : "border-slate-300 hover:border-[#0F6570] bg-slate-50/70 hover:bg-[#0F6570]/5"
                }`}
              >
                {isReadingPdf ? (
                  <div className="flex flex-col items-center justify-center py-3 space-y-3">
                    <Loader2 className="h-8 w-8 text-[#0F6570] animate-spin" />
                    <div>
                      <p className="font-bold text-sm text-slate-800">
                        Lendo as primeiras páginas do PDF...
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Extraindo número da apólice, seguradora, produto, vigência, prêmio e coberturas...
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-2 space-y-2">
                    <div className="p-3 bg-[#0F6570]/10 text-[#0F6570] rounded-full">
                      <FileUp className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-800">
                        Clique para anexar o PDF da apólice ou arraste aqui
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Lê automaticamente os dados das primeiras páginas do contrato e preenche os campos.
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="mt-1 border-[#0F6570] text-[#0F6570] hover:bg-[#0F6570]/10 font-semibold gap-1.5 rounded-lg"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                      Selecionar Arquivo PDF
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 transition-all">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl shrink-0">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 truncate">
                          {pdfFileName}
                        </span>
                        {pdfFileSize && (
                          <span className="text-[11px] text-slate-500 font-mono">
                            ({pdfFileSize})
                          </span>
                        )}
                        <Badge className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 font-bold">
                          Documento Anexado
                        </Badge>
                      </div>
                      <p className="text-xs text-emerald-700 mt-0.5 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Páginas processadas e campos preenchidos de acordo com o documento.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isReadingPdf}
                      className="text-xs h-8 gap-1 border-slate-300"
                      title="Trocar por outro arquivo PDF"
                    >
                      <RefreshCw className="h-3 w-3" /> Trocar
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeAttachedPdf}
                      disabled={isReadingPdf}
                      className="text-xs h-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                      title="Remover arquivo"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {extractedSummary && extractedSummary.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-emerald-200/60">
                    <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-1.5">
                      Campos preenchidos automaticamente ({extractedSummary.length}):
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {extractedSummary.map((field, idx) => (
                        <span
                          key={idx}
                          className="bg-white/80 border border-emerald-300 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded-md shadow-xs"
                        >
                          ✓ {field}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── CLIENTE SELECTION ───────────────────────────────────────────── */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <UserIcon className="h-3.5 w-3.5 text-[#0F6570]" />
              Cliente Vinculado *
            </Label>
            <SearchableSelect
              options={[
                { value: "", label: "Selecione o cliente..." },
                ...(clientes ?? []).map(c => ({
                  value: String(c.id),
                  label: `${c.nome}${c.cpfCnpj ? ` (${c.cpfCnpj})` : ""}`
                }))
              ]}
              value={clienteId}
              onValueChange={setClienteId}
              placeholder="Pesquisar cliente por nome ou documento..."
              searchPlaceholder="Digite para buscar cliente..."
              triggerClassName="h-10 text-sm rounded-lg bg-white border-slate-300"
            />
            {clienteId && (
              <p className="text-[11px] text-slate-500">
                Cliente selecionado: <strong className="text-slate-800">{clientes?.find(c => c.id === parseInt(clienteId))?.nome}</strong>
              </p>
            )}
          </div>

          {/* ── POLICY MAIN DETAILS ────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-slate-700">Número da Apólice</Label>
              <Input
                value={numeroApolice}
                onChange={e => setNumeroApolice(e.target.value)}
                placeholder="Ex: 01.077.531.000000"
                className="mt-1 h-10 font-mono text-sm"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">Status da Apólice *</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="mt-1 h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">Produto / Ramo</Label>
              <SearchableSelect
                options={[
                  { value: "", label: "Nenhum selecionado" },
                  ...(produtos ?? []).map(p => ({ value: String(p.id), label: p.nome }))
                ]}
                value={produtoId}
                onValueChange={setProdutoId}
                placeholder="Selecionar produto..."
                searchPlaceholder="Buscar produto de seguro..."
                triggerClassName="mt-1 h-10 text-sm rounded-lg"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">Seguradora</Label>
              <SearchableSelect
                options={[
                  { value: "", label: "Nenhuma selecionada" },
                  ...(seguradoras ?? []).map(s => ({ value: String(s.id), label: s.nome }))
                ]}
                value={seguradoraId}
                onValueChange={setSeguradoraId}
                placeholder="Selecionar seguradora..."
                searchPlaceholder="Buscar seguradora..."
                triggerClassName="mt-1 h-10 text-sm rounded-lg"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">Início da Vigência</Label>
              <Input
                type="date"
                value={inicioVigencia}
                onChange={e => setInicioVigencia(e.target.value)}
                className="mt-1 h-10 text-sm"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">Fim da Vigência</Label>
              <Input
                type="date"
                value={fimVigencia}
                onChange={e => setFimVigencia(e.target.value)}
                className="mt-1 h-10 text-sm"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">Valor do Prêmio (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={premio}
                onChange={e => setPremio(e.target.value)}
                placeholder="Ex: 1500.00"
                className="mt-1 h-10 text-sm"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">Valor Segurado / LMG (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={valorSegurado}
                onChange={e => setValorSegurado(e.target.value)}
                placeholder="Ex: 100000.00"
                className="mt-1 h-10 text-sm"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">Comissão (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={comissao}
                onChange={e => setComissao(e.target.value)}
                placeholder="Ex: 15.0"
                className="mt-1 h-10 text-sm"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">Corretor Responsável</Label>
              <SearchableSelect
                options={[
                  { value: "", label: "Nenhum corretor selecionado" },
                  ...(users ?? []).map(u => ({ value: String(u.id), label: u.name }))
                ]}
                value={corretorId}
                onValueChange={setCorretorId}
                placeholder="Selecionar corretor..."
                searchPlaceholder="Buscar corretor..."
                triggerClassName="mt-1 h-10 text-sm rounded-lg"
              />
            </div>
          </div>

          {/* ── ADDITIONAL POLICY DETAILS ───────────────────────────────────── */}
          <div className="pt-2 border-t border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F6570] mb-3">
              Detalhes de Emissão, Proposta e Coberturas
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-slate-600">ID da Proposta</Label>
                <Input
                  value={idProposta}
                  onChange={e => setIdProposta(e.target.value)}
                  placeholder="PROP-12345"
                  className="mt-1 h-9 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs text-slate-600">Nº da Proposta</Label>
                <Input
                  value={numeroProposta}
                  onChange={e => setNumeroProposta(e.target.value)}
                  placeholder="12345"
                  className="mt-1 h-9 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs text-slate-600">ID / CI da Apólice</Label>
                <Input
                  value={idApolice}
                  onChange={e => setIdApolice(e.target.value)}
                  placeholder="CI / Código"
                  className="mt-1 h-9 text-xs font-mono"
                />
              </div>

              <div>
                <Label className="text-xs text-slate-600">Data de Emissão</Label>
                <Input
                  type="date"
                  value={dataEmissao}
                  onChange={e => setDataEmissao(e.target.value)}
                  className="mt-1 h-9 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs text-slate-600">Forma de Pagamento</Label>
                <Input
                  value={formaPagamento}
                  onChange={e => setFormaPagamento(e.target.value)}
                  placeholder="Ex: Boleto 10x, Cartão"
                  className="mt-1 h-9 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs text-slate-600">Link da Fatura (URL)</Label>
                <Input
                  value={linkFatura}
                  onChange={e => setLinkFatura(e.target.value)}
                  placeholder="https://..."
                  className="mt-1 h-9 text-xs"
                />
              </div>
            </div>

            <div className="mt-3">
              <Label className="text-xs text-slate-600">Cobertura / Itens Segurados / Veículo</Label>
              <Input
                value={cobertura}
                onChange={e => setCobertura(e.target.value)}
                placeholder="Ex: Veículo: Toyota Corolla 2.0 (Placa: ABC1D23) - Compreensiva 100% FIPE, RCF R$ 100k"
                className="mt-1 h-9 text-xs"
              />
            </div>

            <div className="mt-3">
              <Label className="text-xs text-slate-600">Observações</Label>
              <Textarea
                value={observacoes}
                onChange={e => setObservacoes(e.target.value)}
                rows={2}
                placeholder="Anotações internas, canal de atendimento ou particularidades..."
                className="mt-1 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-slate-200 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saveMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saveMutation.isPending || isReadingPdf}
              className="bg-[#0F6570] hover:bg-[#0A454D] text-white font-bold px-6 shadow-md"
            >
              {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editApolice ? "Salvar Alterações" : "Criar Apólice"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
