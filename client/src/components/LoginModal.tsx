import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { Lock, User as UserIcon, Eye, EyeOff, Loader2, ArrowRight, ShieldCheck, AlertCircle, X } from "lucide-react";
import logo from "@assets/logo_monteiro_v2.png";
import { User } from "@shared/schema";

interface LoginModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = (val: boolean) => {
    if (isControlled && onOpenChange) {
      onOpenChange(val);
    } else {
      setInternalOpen(val);
    }
  };

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordMsg, setForgotPasswordMsg] = useState(false);
  const [, setLocation] = useLocation();
  const { loginMutation, user } = useAuth();
  const { settings } = useSiteSettings();

  // Escuta evento global para abrir o modal de login de qualquer lugar do site
  useEffect(() => {
    const handleOpenEvent = () => setIsOpen(true);
    window.addEventListener("open-login-modal", handleOpenEvent);
    return () => window.removeEventListener("open-login-modal", handleOpenEvent);
  }, []);

  // Fecha o modal se o usuário já estiver logado
  useEffect(() => {
    if (user && isOpen) {
      setIsOpen(false);
    }
  }, [user, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(
      { username, password },
      {
        onSuccess: (loggedUser: User) => {
          setIsOpen(false);
          setUsername("");
          setPassword("");
          setLocation(loggedUser.role === "client" ? "/dashboard" : "/admin");
        },
      }
    );
  };

  const whatsappNumber = settings?.contactPhone 
    ? settings.contactPhone.replace(/\D/g, '') 
    : "5511999999999";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent 
        className="w-[92vw] max-w-[420px] sm:max-w-[440px] p-0 overflow-hidden rounded-3xl bg-white border-0 shadow-2xl z-[99999] pointer-events-auto"
      >
        {/* Cabeçalho Premium Monteiro */}
        <div className="bg-[#08454c] text-white p-6 sm:p-7 relative overflow-hidden">
          {/* Botão de Fechar Nítido */}
          <DialogClose className="absolute right-4 top-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer z-30">
            <X className="h-4 w-4 text-white" />
            <span className="sr-only">Fechar</span>
          </DialogClose>

          {/* Luzes decorativas sutis */}
          <div className="absolute top-0 right-0 w-44 h-44 bg-[#c65f54]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#809ba6]/15 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="h-12 flex items-center justify-center mb-3">
              <img
                src={settings?.logoBase64 || logo}
                alt="Monteiro Seguros"
                className="h-10 w-auto object-contain brightness-0 invert"
                onError={(e) => {
                  e.currentTarget.src = logo;
                }}
              />
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-display font-bold text-white tracking-tight">
              Área do Cliente
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-slate-200/80 mt-1 max-w-[280px]">
              Acesse suas apólices, histórico e documentos com total segurança
            </DialogDescription>
          </div>
        </div>

        {/* Formulário de Login */}
        <div className="p-6 sm:p-7 bg-[#fcfbfa]">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo Usuário */}
            <div className="space-y-1.5 text-left">
              <Label htmlFor="modal-username" className="text-xs font-bold uppercase tracking-wider text-[#163b52]">
                Usuário ou E-mail
              </Label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#809ba6]" />
                <Input
                  id="modal-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Seu usuário cadastrado"
                  required
                  autoComplete="username"
                  className="h-11 pl-10 bg-white border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:border-[#08454c] focus:ring-[#08454c]/10 text-sm transition-all"
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <Label htmlFor="modal-password" className="text-xs font-bold uppercase tracking-wider text-[#163b52]">
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
                  id="modal-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha secreta"
                  required
                  autoComplete="current-password"
                  className="h-11 pl-10 pr-10 bg-white border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:border-[#08454c] focus:ring-[#08454c]/10 text-sm transition-all"
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

            {/* Ajuda caso tenha esquecido a senha */}
            {forgotPasswordMsg && (
              <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2 text-left animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p>Para recuperar ou redefinir sua senha, solicite o suporte imediato pelo WhatsApp.</p>
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
                <span>Credenciais inválidas. Verifique seu usuário e senha.</span>
              </div>
            )}

            {/* Botão de Envio */}
            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full h-11 rounded-xl bg-[#08454c] hover:bg-[#0c5963] text-white font-bold text-sm shadow-md transition-all active:scale-[0.99] cursor-pointer mt-2"
            >
              {loginMutation.isPending ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Acessando...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>Acessar Conta</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </Button>
          </form>

          {/* Rodapé do Modal */}
          <div className="mt-5 pt-4 border-t border-slate-200/70 text-center">
            <p className="text-xs text-slate-500 mb-2">
              Ainda não tem acesso ao painel?
            </p>
            <a
              href={`https://wa.me/${whatsappNumber}?text=Ol%C3%A1!%20Gostaria%20de%20solicitar%20meu%20acesso%20ao%20portal%20da%20Monteiro%20Seguros.`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#c65f54] hover:underline cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Solicitar acesso ou cotação</span>
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
