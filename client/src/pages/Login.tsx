import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { Eye, EyeOff, ArrowLeft, Lock, User as UserIcon, Loader2, ShieldCheck, AlertCircle, ArrowRight } from "lucide-react";
import { User } from "@shared/schema";
import { useSiteSettings } from "@/hooks/use-site-settings";
import logo from "@assets/logo_monteiro_v2.png";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordMsg, setForgotPasswordMsg] = useState(false);
  const [, setLocation] = useLocation();
  const { loginMutation, user } = useAuth();
  const { settings } = useSiteSettings();

  useEffect(() => {
    if (user) setLocation(user.role === "client" ? "/dashboard" : "/admin");
  }, [user, setLocation]);

  if (user) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(
      { username, password },
      { onSuccess: (user: User) => setLocation(user.role === "client" ? "/dashboard" : "/admin") }
    );
  };

  const whatsappNumber = settings?.contactPhone 
    ? settings.contactPhone.replace(/\D/g, '') 
    : "5511999999999";

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#eae4da]/30">
      {/* Left: Painel Institucional Monteiro */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-16 relative overflow-hidden bg-[#08454c] text-white"
      >
        {/* Glows orbs sutis */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#c65f54]/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#809ba6]/15 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative z-10">
          <Link href="/">
            <a className="inline-flex items-center gap-3 group cursor-pointer">
              <div className="relative overflow-hidden">
                <img
                  src={settings?.logoBase64 || logo}
                  alt="Monteiro Seguros & Benefícios"
                  className="h-14 w-auto object-contain brightness-0 invert"
                  onError={(e) => {
                    e.currentTarget.src = logo;
                  }}
                />
              </div>
            </a>
          </Link>
        </div>

        {/* Conteúdo Central */}
        <div className="relative z-10 space-y-6 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-slate-200">
            <ShieldCheck className="w-3.5 h-3.5 text-[#c65f54]" />
            <span>Portal Seguro do Cliente &amp; Gestão</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-display font-bold text-white leading-[1.15] tracking-tight">
            Tranquilidade e segurança para o que mais importa.
          </h1>

          <p className="text-slate-300 text-base leading-relaxed font-light">
            Acompanhe suas apólices, sinistros, certificados e documentos em uma plataforma exclusiva e ágil.
          </p>

          <div className="pt-4 flex items-center gap-8 text-sm text-slate-200">
            <div>
              <p className="text-2xl font-bold font-display text-white">100%</p>
              <p className="text-xs text-slate-400">Atendimento Dedicado</p>
            </div>
            <div className="w-px h-8 bg-white/15" />
            <div>
              <p className="text-2xl font-bold font-display text-[#c65f54]">Digital &amp; Seguro</p>
              <p className="text-xs text-slate-400">Acesso Criptografado</p>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="relative z-10 text-xs text-slate-400 font-light flex items-center justify-between">
          <p>© {new Date().getFullYear()} {settings?.siteName || "Monteiro Seguros e Benefícios"}</p>
          <Link href="/">
            <a className="hover:text-white transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar ao site</span>
            </a>
          </Link>
        </div>
      </div>

      {/* Right: Formulário de Login */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="w-full max-w-[420px] bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-200/60">
          {/* Logo no mobile */}
          <div className="lg:hidden flex items-center justify-between mb-8">
            <Link href="/">
              <a className="flex items-center gap-3">
                <img
                  src={settings?.logoBase64 || logo}
                  alt="Monteiro Seguros"
                  className="h-10 w-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.src = logo;
                  }}
                />
              </a>
            </Link>
            <Link href="/">
              <a className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar</span>
              </a>
            </Link>
          </div>

          <div className="mb-8 text-left">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#163b52] tracking-tight">
              Login
            </h2>
            <p className="text-slate-500 mt-1.5 text-sm">
              Insira suas credenciais para acessar seu painel.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Usuário */}
            <div className="space-y-1.5 text-left">
              <Label htmlFor="login-username" className="text-xs font-bold uppercase tracking-wider text-[#163b52]">
                Usuário ou E-mail
              </Label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#809ba6]" />
                <Input
                  id="login-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Seu usuário cadastrado"
                  required
                  autoComplete="username"
                  className="h-12 pl-10 bg-slate-50/50 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:border-[#08454c] focus:ring-[#08454c]/10 text-sm transition-all"
                />
              </div>
            </div>

            {/* Senha */}
            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <Label htmlFor="login-password" className="text-xs font-bold uppercase tracking-wider text-[#163b52]">
                  Senha
                </Label>
                <button
                  type="button"
                  onClick={() => setForgotPasswordMsg(!forgotPasswordMsg)}
                  className="text-xs font-medium text-[#c65f54] hover:underline cursor-pointer"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#809ba6]" />
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha secreta"
                  required
                  autoComplete="current-password"
                  className="h-12 pl-10 pr-11 bg-slate-50/50 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:border-[#08454c] focus:ring-[#08454c]/10 text-sm transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Suporte de recuperação */}
            {forgotPasswordMsg && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2 text-left animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p>Esqueceu suas credenciais? Fale conosco via WhatsApp para redefinir seu acesso imediatamente.</p>
                  <a
                    href={`https://wa.me/${whatsappNumber}?text=Ol%C3%A1!%20Preciso%20de%20ajuda%20para%20recuperar%20minha%20senha%20de%20acesso%20na%20Monteiro.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-[#08454c] hover:underline"
                  >
                    Falar com Suporte <ArrowRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}

            {/* Mensagem de Erro */}
            {loginMutation.isError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Usuário ou senha incorretos. Tente novamente.</span>
              </div>
            )}

            {/* Botão Entrar */}
            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full h-12 rounded-xl bg-[#08454c] hover:bg-[#0c5963] text-white font-bold text-base shadow-md transition-all active:scale-[0.99] cursor-pointer mt-3"
            >
              {loginMutation.isPending ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Acessando...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>Entrar</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </Button>
          </form>

          {/* Rodapé do Form */}
          <div className="mt-8 pt-6 border-t border-slate-200/80 text-center space-y-3">
            <Link href="/contact">
              <Button
                variant="ghost"
                className="w-full text-slate-600 hover:text-[#08454c] hover:bg-slate-100 font-semibold rounded-xl text-xs h-10 cursor-pointer"
              >
                Ainda não tem acesso? Solicite uma cotação
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
