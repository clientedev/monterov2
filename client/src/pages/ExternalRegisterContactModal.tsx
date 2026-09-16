import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, UserPlus, ShieldCheck, Sparkles } from "lucide-react";

export default function ExternalRegisterContactModal() {
  const searchParams = new URLSearchParams(window.location.search);
  const apiKey = searchParams.get("apiKey") || searchParams.get("api_key") || "";
  const initialPhone = searchParams.get("phone") || "";
  const initialName = searchParams.get("name") || "";
  const initialEmail = searchParams.get("email") || "";
  const initialDocument = searchParams.get("document") || "";
  const initialType = searchParams.get("type") === "company" ? "company" : "individual";

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
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
    productType: "",
    insurers: "",
    contactOrigin: "WhatsApp Integrado",
    notes: "",
    status: "Ativo",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name.trim()) {
      setErrorMsg("O campo Nome Completo / Razão Social é obrigatório.");
      return;
    }
    if (!apiKey) {
      setErrorMsg("Chave de API (apiKey) não fornecida na URL.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/v1/external/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
        body: JSON.stringify(formState),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || "Erro ao cadastrar contato no CRM.");
      }

      setSuccessMsg(data.message || "Contato cadastrado com sucesso!");

      // Broadcast to parent or opener window if opened via popup/iframe
      if (window.opener) {
        window.opener.postMessage({ type: "CRM_CONTACT_CREATED", contact: data.contact }, "*");
        setTimeout(() => {
          window.close();
        }, 2200);
      } else if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: "CRM_CONTACT_CREATED", contact: data.contact }, "*");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Erro de conexão ao cadastrar contato.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-3 font-sans">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col my-auto max-h-[95vh]">
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold leading-relaxed">
              ⚠️ {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Tipo PF / PJ */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setFormState(p => ({ ...p, type: "individual" }))}
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
              onClick={() => setFormState(p => ({ ...p, type: "company" }))}
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

          {/* Endereço Completo */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Endereço Completo</label>
            <Input
              name="address"
              placeholder="Rua, Número, Bairro, Cidade, UF, CEP"
              value={formState.address}
              onChange={handleChange}
              className="rounded-xl h-10 text-xs"
            />
          </div>

          {/* Documento (CPF/CNPJ) & Aniversário */}
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
              <label className="text-xs font-bold text-slate-700">Data de Aniversário</label>
              <Input
                name="anniversaryDate"
                type="date"
                value={formState.anniversaryDate}
                onChange={handleChange}
                className="rounded-xl h-10 text-xs"
              />
            </div>
          </div>

          {/* Responsável PJ se for Empresa */}
          {formState.type === "company" && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Nome do Responsável / Sócio</label>
              <Input
                name="responsibleName"
                placeholder="Ex: Carlos (Diretor)"
                value={formState.responsibleName}
                onChange={handleChange}
                className="rounded-xl h-10 text-xs"
              />
            </div>
          )}

          {/* Origem e Produtos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Origem do Contato</label>
              <Input
                name="contactOrigin"
                placeholder="Ex: WhatsApp Atendimento"
                value={formState.contactOrigin}
                onChange={handleChange}
                className="rounded-xl h-10 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Produtos de Interesse</label>
              <Input
                name="productType"
                placeholder="Ex: Seguro Auto, Saúde"
                value={formState.productType}
                onChange={handleChange}
                className="rounded-xl h-10 text-xs"
              />
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Observações / Notas</label>
            <textarea
              name="notes"
              rows={2}
              placeholder="Notas adicionais sobre o cliente..."
              value={formState.notes}
              onChange={handleChange}
              className="w-full rounded-xl border border-input bg-white p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#08454c]/30"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-[#08454c] hover:bg-[#06373d] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cadastrando no CRM...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#c65f54]" />
                  Cadastrar no CRM
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
