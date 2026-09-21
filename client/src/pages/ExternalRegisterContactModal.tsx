import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  CheckCircle2,
  UserPlus,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  ArrowRight,
  ExternalLink,
  PlusCircle,
  DollarSign,
  Tag,
} from "lucide-react";
import { STANDARD_PRODUCTS, normalizeProductName } from "@/components/ProductSelector";

export default function ExternalRegisterContactModal() {
  const searchParams = new URLSearchParams(window.location.search);
  const apiKey = searchParams.get("apiKey") || searchParams.get("api_key") || "";
  const initialPhone = searchParams.get("phone") || searchParams.get("telefone") || searchParams.get("whatsapp") || "";
  const initialName = searchParams.get("name") || searchParams.get("nome") || "";
  const initialEmail = searchParams.get("email") || "";
  const initialDocument = searchParams.get("document") || searchParams.get("cpf") || searchParams.get("cnpj") || searchParams.get("cpfCnpj") || "";
  const initialType = searchParams.get("type") === "company" ? "company" : "individual";
  const initialProductRaw = searchParams.get("dealProduct") || searchParams.get("product") || searchParams.get("produto") || searchParams.get("produtos") || searchParams.get("productType") || "";
  const initialProduct = initialProductRaw ? normalizeProductName(initialProductRaw) : "";
  const initialDealValue = searchParams.get("dealValue") || searchParams.get("value") || searchParams.get("valor") || "";
  const initialDealStatus = searchParams.get("dealStatus") || searchParams.get("status") || "new";
  const initialNotes = searchParams.get("notes") || searchParams.get("observacoes") || "";

  const [loading, setLoading] = useState(false);
  const [createdResult, setCreatedResult] = useState<{
    contact: any;
    lead: any;
    message: string;
    pipelineUrl: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formState, setFormState] = useState({
    name: initialName,
    phone: initialPhone,
    email: initialEmail,
    document: initialDocument,
    address: "",
    type: initialType,
    responsibleName: "",
    anniversaryDate: "",
    maritalStatus: "",
    contactOrigin: "WhatsApp Integrado",
    notes: initialNotes,
    status: "Ativo",
  });

  // Selected products state
  const [selectedProducts, setSelectedProducts] = useState<string[]>(() => {
    if (!initialProduct) return [];
    return [initialProduct];
  });
  const [customProduct, setCustomProduct] = useState("");
  const [showCustomProduct, setShowCustomProduct] = useState(false);

  // Opportunity state
  const [createOpportunity, setCreateOpportunity] = useState(true);
  const [dealValue, setDealValue] = useState(initialDealValue);
  const [dealStatus, setDealStatus] = useState(initialDealStatus);
  const [dealNotes, setDealNotes] = useState("");

  const toggleProduct = (prod: string) => {
    setSelectedProducts((prev) =>
      prev.includes(prod) ? prev.filter((p) => p !== prod) : [...prev, prod]
    );
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent, forceOpp?: boolean) => {
    e.preventDefault();
    if (!formState.name.trim() && !formState.phone.trim()) {
      setErrorMsg("Informe ao menos o Nome ou o Telefone do contato.");
      return;
    }
    if (!apiKey) {
      setErrorMsg("Chave de API (apiKey) não fornecida na URL.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const allSelected = [...selectedProducts];
      if (showCustomProduct && customProduct.trim()) {
        allSelected.push(customProduct.trim());
      }
      const productTypeString = allSelected.join(", ");

      const shouldCreateOpp = forceOpp !== undefined ? forceOpp : createOpportunity;

      const payload = {
        ...formState,
        productType: productTypeString,
        dealProduct: allSelected[0] || productTypeString || "Oportunidade Comercial",
        createOpportunity: shouldCreateOpp,
        dealValue: dealValue ? dealValue.replace(/[R$\s]/g, "") : undefined,
        dealStatus: dealStatus,
        dealNotes: dealNotes || formState.notes,
      };

      const res = await fetch("/api/v1/external/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || "Erro ao cadastrar contato no CRM.");
      }

      const resultPayload = {
        contact: data.contact,
        lead: data.lead || data.opportunity || null,
        message: data.message || "Contato cadastrado com sucesso!",
        pipelineUrl: data.pipelineUrl || "/admin/leads",
      };

      setCreatedResult(resultPayload);

      // Broadcast to parent or opener window if opened via popup/iframe
      const msgData = {
        type: "CRM_CONTACT_CREATED",
        contact: data.contact,
        lead: data.lead,
        pipelineUrl: "/admin/leads",
      };
      if (window.opener) {
        window.opener.postMessage(msgData, "*");
      }
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(msgData, "*");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Erro de conexão ao cadastrar contato.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCreatedResult(null);
    setFormState({
      name: "",
      phone: "",
      email: "",
      document: "",
      address: "",
      type: "individual",
      responsibleName: "",
      anniversaryDate: "",
      maritalStatus: "",
      contactOrigin: "WhatsApp Integrado",
      notes: "",
      status: "Ativo",
    });
    setSelectedProducts([]);
    setCustomProduct("");
    setShowCustomProduct(false);
    setDealValue("");
    setDealNotes("");
  };

  return (
    <div className="min-h-screen bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-3 font-sans">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col my-auto max-h-[95vh]">
        {/* Header */}
        <div className="bg-[#08454c] p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <UserPlus className="w-5 h-5 text-[#c65f54]" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg leading-tight">Cadastrar Contato no CRM</h2>
              <p className="text-white/60 text-xs">Monteiro Seguros &amp; Benefícios</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] bg-white/10 px-2.5 py-1 rounded-full text-white/80 font-semibold border border-white/15">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> API Conectada
          </div>
        </div>

        {/* Success View */}
        {createdResult ? (
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10 border border-emerald-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-display font-bold text-slate-900">{createdResult.message}</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                O contato <strong>{createdResult.contact?.name}</strong> foi registrado na Base de Contatos com sucesso!
              </p>
            </div>

            {/* Created Opportunity Summary Card */}
            {createdResult.lead ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Oportunidade Criada no Funil
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400">#{createdResult.lead.id}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Produto / Ramo:</span>
                    <strong className="text-slate-800 font-semibold">{createdResult.lead.product || "Oportunidade"}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Valor Estimado:</span>
                    <strong className="text-emerald-600 font-bold">
                      {createdResult.lead.value ? `R$ ${createdResult.lead.value}` : "Sob consulta"}
                    </strong>
                  </div>
                </div>
              </div>
            ) : null}

            {/* CTA Buttons */}
            <div className="space-y-3 pt-2">
              <a
                href={createdResult.pipelineUrl || "/admin/leads"}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-sm shadow-xl shadow-primary/25 transition-all flex items-center justify-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                Ir para o LEADS &amp; Pipeline
                <ArrowRight className="w-4 h-4" />
              </a>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="flex-1 h-10 rounded-xl font-bold text-xs border-slate-200 text-slate-700"
                >
                  <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                  Cadastrar Outro
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => window.close()}
                  className="h-10 rounded-xl font-bold text-xs text-slate-500 hover:text-slate-800"
                >
                  Fechar Janela
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Form Body */
          <form onSubmit={(e) => handleSubmit(e)} className="p-5 overflow-y-auto space-y-4 flex-1">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold leading-relaxed">
                ⚠️ {errorMsg}
              </div>
            )}

            {/* Tipo PF / PJ */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setFormState((p) => ({ ...p, type: "individual" }))}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  formState.type === "individual"
                    ? "bg-white text-[#08454c] shadow-sm border border-slate-200"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                👤 Pessoa Física (PF)
              </button>
              <button
                type="button"
                onClick={() => setFormState((p) => ({ ...p, type: "company" }))}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  formState.type === "company"
                    ? "bg-white text-[#08454c] shadow-sm border border-slate-200"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                🏢 Pessoa Jurídica (PJ)
              </button>
            </div>

            {/* Nome Completo */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Nome Completo / Razão Social <span className="text-red-500">*</span>
              </label>
              <Input
                name="name"
                placeholder="Ex: João Silva ou Monteiro Seguros LTDA"
                value={formState.name}
                onChange={handleChange}
                className="rounded-xl h-10 text-xs"
                required
              />
            </div>

            {/* Telefone & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Telefone / WhatsApp</label>
                <Input
                  name="phone"
                  placeholder="(11) 99999-9999"
                  value={formState.phone}
                  onChange={handleChange}
                  className="rounded-xl h-10 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">E-mail</label>
                <Input
                  name="email"
                  type="email"
                  placeholder="contato@exemplo.com"
                  value={formState.email}
                  onChange={handleChange}
                  className="rounded-xl h-10 text-xs"
                />
              </div>
            </div>

            {/* Documento (CPF/CNPJ) & Origem */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  {formState.type === "company" ? "CNPJ" : "CPF"}
                </label>
                <Input
                  name="document"
                  placeholder={formState.type === "company" ? "00.000.000/0000-00" : "000.000.000-00"}
                  value={formState.document}
                  onChange={handleChange}
                  className="rounded-xl h-10 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Origem do Contato</label>
                <Input
                  name="contactOrigin"
                  placeholder="Ex: WhatsApp Integrado"
                  value={formState.contactOrigin}
                  onChange={handleChange}
                  className="rounded-xl h-10 text-xs"
                />
              </div>
            </div>

            {/* ── 12 Produtos Oficiais ────────────────────────────────────────── */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#08454c]" />
                  Produtos de Interesse (Coluna Produtos no CRM)
                </label>
                <span className="text-[10px] text-slate-400 font-medium">Selecione 1 ou mais</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                {STANDARD_PRODUCTS.map((prod) => {
                  const selected = selectedProducts.includes(prod);
                  return (
                    <button
                      key={prod}
                      type="button"
                      onClick={() => toggleProduct(prod)}
                      className={`py-1.5 px-2 rounded-xl text-[11px] font-bold text-left transition-all truncate border ${
                        selected
                          ? "bg-[#08454c] border-[#08454c] text-white shadow-sm"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                      title={prod}
                    >
                      {prod}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setShowCustomProduct(!showCustomProduct)}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-bold text-left transition-all border ${
                    showCustomProduct
                      ? "bg-amber-500 border-amber-500 text-white shadow-sm"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Outro...
                </button>
              </div>

              {showCustomProduct && (
                <div className="pt-1">
                  <Input
                    placeholder="Especifique outro produto..."
                    value={customProduct}
                    onChange={(e) => setCustomProduct(e.target.value)}
                    className="rounded-xl h-9 text-xs border-amber-300"
                  />
                </div>
              )}
            </div>

            {/* ── Seção Oportunidade no Funil (LEADS & Pipeline) ───────────────── */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={createOpportunity}
                    onChange={(e) => setCreateOpportunity(e.target.checked)}
                    className="h-4 w-4 rounded text-emerald-600 accent-emerald-600 cursor-pointer"
                  />
                  <span className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    Criar Oportunidade no Funil (LEADS &amp; Pipeline)
                  </span>
                </label>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Recomendado
                </span>
              </div>

              {createOpportunity && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Etapa do Funil</label>
                    <select
                      value={dealStatus}
                      onChange={(e) => setDealStatus(e.target.value)}
                      className="w-full rounded-xl border border-input bg-white h-9 px-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    >
                      <option value="new">Cotação / Novo Lead</option>
                      <option value="qualified">Qualificado / Em Negociação</option>
                      <option value="proposal">Proposta Enviada</option>
                      <option value="implemented">Fechado / Ganho</option>
                      <option value="cancelled">Cancelado / Perdido</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Valor Estimado (R$)</label>
                    <div className="relative">
                      <DollarSign className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        placeholder="Ex: 1.200,00"
                        value={dealValue}
                        onChange={(e) => setDealValue(e.target.value)}
                        className="rounded-xl h-9 pl-8 text-xs bg-white"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Notas sobre a Oportunidade / Cotação</label>
                    <Input
                      placeholder="Detalhes da cotação solicitada no WhatsApp..."
                      value={dealNotes}
                      onChange={(e) => setDealNotes(e.target.value)}
                      className="rounded-xl h-9 text-xs bg-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Observações Gerais do Contato */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Observações Gerais</label>
              <textarea
                name="notes"
                rows={2}
                placeholder="Anotações gerais sobre o cliente..."
                value={formState.notes}
                onChange={handleChange}
                className="w-full rounded-xl border border-input bg-white p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#08454c]/30"
              />
            </div>

            {/* Submit Buttons */}
            <div className="pt-2 space-y-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-xl shadow-emerald-700/20 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando para o CRM...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    {createOpportunity
                      ? "Cadastrar & Criar Oportunidade no Pipeline"
                      : "Cadastrar Contato no CRM"}
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
