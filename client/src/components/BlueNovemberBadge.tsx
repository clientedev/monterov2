import { useState, useEffect } from "react";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { useLocation } from "wouter";
import { Activity, ShieldCheck, Sparkles, Phone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// Laço Azul Oficial SVG — Símbolo internacional de conscientização e saúde masculina
function BlueRibbonIcon({ className = "w-5 h-5 text-[#2563eb]" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2C9.5 2 7.8 3.8 7.2 5.9c-.8 2.8.2 5.6 1.8 7.8L5.5 19.5c-.4.6-.2 1.4.4 1.8.6.4 1.4.2 1.8-.4l3.7-5.8c.4.1.8.2 1.2.2.3 0 .7 0 1-.1l3.5 5.7c.4.6 1.2.8 1.8.4.6-.4.8-1.2.4-1.8l-3.3-5.5c1.7-2.2 2.7-5.1 1.9-8-.7-2.3-2.5-4-5.2-3.9zm-.1 3.5c1.4 0 2.2 1.1 2.5 2.4.4 1.7-.3 3.4-1.4 4.8-.4.5-.9 1-1.3 1.4-.4-.4-.8-.9-1.2-1.4-1.1-1.4-1.7-3.1-1.3-4.8.3-1.3 1.2-2.4 2.7-2.4z" />
    </svg>
  );
}

export function BlueNovemberBadge() {
  const { settings } = useSiteSettings();
  const [location] = useLocation();
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);

  // Visível apenas no site público (não em rotas /admin)
  const isAdmin = location.startsWith("/admin");
  const isBlueNovember = Boolean(settings?.themeNovembroAzul || settings?.activeTheme === "novembro_azul");
  const showBadge = settings?.themeNovembroAzulBadge !== false;

  // Pop-up abre automaticamente uma única vez por sessão após 2s ao entrar no site (apenas no desktop para não travar mobile)
  useEffect(() => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    if (isMobile) return;

    if (!isAdmin && isBlueNovember && showBadge && !hasAutoOpened) {
      const alreadySeen = typeof window !== "undefined" && sessionStorage.getItem("seen_novembro_azul_popup");
      if (alreadySeen) return;

      const timer = setTimeout(() => {
        setIsInfoModalOpen(true);
        setHasAutoOpened(true);
        try {
          sessionStorage.setItem("seen_novembro_azul_popup", "true");
        } catch {}
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isAdmin, isBlueNovember, showBadge, hasAutoOpened]);

  if (isAdmin || !isBlueNovember || !showBadge) {
    return null;
  }

  return (
    <>
      {/* Selo Flutuante Discreto e Elegante (Sempre visível no canto inferior para abrir o pop-up) */}
      <button
        type="button"
        onClick={() => setIsInfoModalOpen(true)}
        className="fixed bottom-6 left-6 z-40 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white/95 backdrop-blur-md text-slate-800 text-xs font-semibold shadow-xl shadow-[#2563eb]/15 border border-[#60a5fa]/40 hover:border-[#2563eb] hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 group cursor-pointer"
        title="Novembro Azul — Clique para ver mensagem de conscientização"
      >
        <span className="w-2 h-2 rounded-full bg-[#2563eb] animate-ping" />
        <BlueRibbonIcon className="w-4 h-4 text-[#2563eb] group-hover:scale-110 transition-transform" />
        <span className="font-bold text-slate-800 tracking-tight">Novembro Azul</span>
        <span className="hidden sm:inline text-[11px] text-[#2563eb] font-medium bg-[#eff6ff] px-2 py-0.5 rounded-full">
          Saúde & Prevenção
        </span>
      </button>

      {/* Pop-up / Modal Clean, Confiável & Acolhedor */}
      <Dialog open={isInfoModalOpen} onOpenChange={setIsInfoModalOpen}>
        <DialogContent className="max-w-lg rounded-[2.2rem] border-none shadow-[0_25px_60px_rgba(37,99,235,0.22)] p-0 overflow-hidden bg-white">
          <DialogHeader className="p-8 pb-6 bg-gradient-to-b from-[#eff6ff] via-[#f8fafc] to-white border-b border-[#93c5fd]/30 text-left relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#93c5fd]/50 text-[#2563eb] text-xs font-bold uppercase tracking-wider mb-3 shadow-xs">
              <BlueRibbonIcon className="w-3.5 h-3.5" />
              <span>Campanha Novembro Azul</span>
            </div>
            <DialogTitle className="text-2xl font-display font-bold text-slate-900 leading-tight">
              Novembro Azul: cuidar da saúde também é coisa de homem
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-600 mt-2 leading-relaxed font-normal">
              A Monteiro Seguros apoia a conscientização sobre a saúde do homem e o diagnóstico precoce do câncer de próstata. Informação, prevenção e cuidado salvam vidas.
            </DialogDescription>
          </DialogHeader>

          <div className="p-8 pt-4 space-y-4">
            <div className="grid gap-3">
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#f0f7ff] border border-[#93c5fd]/35 hover:border-[#2563eb]/40 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-white text-[#2563eb] flex items-center justify-center shrink-0 shadow-xs border border-[#93c5fd]/40">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900">Quebrar o preconceito é o primeiro passo</h5>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Consultas periódicas com o urologista e exames preventivos (PSA e toque) são procedimentos rápidos e indispensáveis a partir dos 45-50 anos. Prevenção é um ato de cuidado.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#f0f7ff] border border-[#93c5fd]/35 hover:border-[#2563eb]/40 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-white text-[#2563eb] flex items-center justify-center shrink-0 shadow-xs border border-[#93c5fd]/40">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900">Sua saúde merece atenção diária</h5>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Alimentação equilibrada, rotina de exercícios físicos e acompanhamento médico regular reduzem riscos e preservam seu bem-estar. Cuidar de você é proteger quem você ama.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#f0f7ff] border border-[#93c5fd]/35 hover:border-[#2563eb]/40 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-white text-[#2563eb] flex items-center justify-center shrink-0 shadow-xs border border-[#93c5fd]/40">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900">Proteção para Você e Sua Família</h5>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Planos de saúde completos e seguros de vida com coberturas dedicadas para diagnóstico precoce, telemedicina e hospitais de referência para resguardar seu futuro.
                  </p>
                </div>
              </div>
            </div>

            {/* Rodapé com botão elegante e contato */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                <Phone className="w-3 h-3 text-[#2563eb]" /> Disque Saúde: 136
              </span>
              <button
                type="button"
                onClick={() => setIsInfoModalOpen(false)}
                className="px-6 py-2.5 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold transition-all shadow-md shadow-[#2563eb]/25 active:scale-95 cursor-pointer"
              >
                Compreendido
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

