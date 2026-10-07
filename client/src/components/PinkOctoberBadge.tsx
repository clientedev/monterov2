import { useState, useEffect } from "react";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { useLocation } from "wouter";
import { X, Heart, ShieldCheck, Sparkles, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// Laço Rosa Oficial SVG — Símbolo internacional com traçado delicado
function RibbonIcon({ className = "w-5 h-5 text-[#be5f77]" }: { className?: string }) {
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

export function PinkOctoberBadge() {
  const { settings } = useSiteSettings();
  const [location] = useLocation();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const dismissed = sessionStorage.getItem("outubro_rosa_dismissed");
      if (dismissed === "true") {
        setIsDismissed(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("outubro_rosa_dismissed", "true");
    }
  };

  // Visível apenas no site público (não em rotas /admin)
  const isAdmin = location.startsWith("/admin");
  const isPinkOctober = Boolean(settings?.themeOutubroRosa || settings?.activeTheme === "outubro_rosa");
  const showBadge = settings?.themeOutubroRosaBadge !== false;

  if (isAdmin || !isPinkOctober || !showBadge || isDismissed) {
    return null;
  }

  return (
    <>
      {/* Visualização Minimizada (Pílula Flutuante Discreta) */}
      {isMinimized ? (
        <button
          onClick={() => setIsMinimized(false)}
          className="fixed bottom-6 left-6 z-40 flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/95 backdrop-blur-md text-slate-700 text-xs font-semibold shadow-lg shadow-[#be5f77]/10 border border-rose-200/60 hover:border-[#be5f77]/50 hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 group"
          title="Campanha Outubro Rosa — Clique para expandir"
        >
          <span className="w-2 h-2 rounded-full bg-[#be5f77] animate-pulse" />
          <RibbonIcon className="w-3.5 h-3.5 text-[#be5f77] group-hover:scale-110 transition-transform" />
          <span className="font-medium text-slate-800">Outubro Rosa</span>
        </button>
      ) : (
        /* Card Flutuante Clean & Delicado */
        <aside
          aria-label="Campanha de Conscientização Outubro Rosa"
          className="fixed bottom-6 left-6 z-40 max-w-[360px] rounded-[1.75rem] bg-white/95 backdrop-blur-xl p-5 shadow-[0_20px_50px_rgba(190,95,119,0.14)] border border-rose-150/70 text-slate-800 transition-all duration-300 animate-in fade-in slide-in-from-bottom-5"
          style={{ borderColor: "rgba(224, 185, 195, 0.45)" }}
        >
          {/* Cabeçalho do Card */}
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-50 via-pink-50/70 to-white border border-rose-200/50 flex items-center justify-center text-[#be5f77] shrink-0 shadow-sm mt-0.5">
              <RibbonIcon className="w-5 h-5 text-[#be5f77]" />
            </div>

            <div className="flex-1 pr-1">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[10px] font-bold text-[#b85d75] uppercase tracking-widest bg-rose-50/80 px-2.5 py-0.5 rounded-full border border-rose-100/60 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Conscientização
                </span>
                <div className="flex items-center gap-1 -mr-1">
                  <button
                    onClick={() => setIsMinimized(true)}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100/70 transition-colors"
                    title="Minimizar"
                    aria-label="Minimizar aviso"
                  >
                    <span className="text-xs font-bold block leading-none w-3 text-center">—</span>
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100/70 transition-colors"
                    title="Fechar"
                    aria-label="Fechar aviso"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h4 className="text-sm font-bold text-slate-900 leading-tight mb-1.5">
                Um toque de cuidado que salva vidas
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                O diagnóstico precoce do câncer de mama eleva as chances de cura para até 95%. Cuidar de você é o melhor plano para o futuro.
              </p>

              {/* Ações Sutis e Harmoniosas */}
              <div className="mt-4 flex items-center justify-between pt-1 border-t border-rose-100/50">
                <button
                  onClick={() => setIsInfoModalOpen(true)}
                  className="text-xs font-semibold text-[#b85d75] hover:text-[#9e445b] flex items-center gap-1 hover:underline transition-all"
                >
                  <span>Saiba como se prevenir</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleDismiss}
                  className="text-[11px] font-semibold text-[#9e445b] bg-[#be5f77]/10 hover:bg-[#be5f77]/15 px-3 py-1.5 rounded-full transition-all active:scale-95"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Modal Educativo & Delicado de Prevenção */}
      <Dialog open={isInfoModalOpen} onOpenChange={setIsInfoModalOpen}>
        <DialogContent className="max-w-lg rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
          <DialogHeader className="p-8 bg-gradient-to-b from-rose-50/80 via-pink-50/30 to-white border-b border-rose-100/40 text-left relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-rose-200/50 text-[#b85d75] text-xs font-bold uppercase tracking-wider mb-3 shadow-xs">
              <RibbonIcon className="w-3.5 h-3.5" />
              Movimento Outubro Rosa
            </div>
            <DialogTitle className="text-2xl font-display font-bold text-slate-900">
              O cuidado com a sua saúde começa hoje
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-600 leading-relaxed">
              A Monteiro Seguros e Benefícios apoia integralmente a prevenção e o acesso a cuidados médicos de excelência para todas as famílias e equipes corporativas.
            </DialogDescription>
          </DialogHeader>

          <div className="p-8 space-y-6">
            <div className="grid gap-4">
              <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-rose-50/40 border border-rose-100/60">
                <div className="w-9 h-9 rounded-xl bg-white text-[#b85d75] flex items-center justify-center shrink-0 shadow-xs border border-rose-100">
                  <Heart className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-slate-900">Autoexame & Conhecimento</h5>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Conheça o seu corpo. Ao notar qualquer alteração física ou nódulo nas mamas, procure imediatamente orientação médica.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-rose-50/40 border border-rose-100/60">
                <div className="w-9 h-9 rounded-xl bg-white text-[#b85d75] flex items-center justify-center shrink-0 shadow-xs border border-rose-100">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-slate-900">Mamografia Periódica</h5>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Recomendada para mulheres a partir dos 40-50 anos ou conforme recomendação do ginecologista, especialmente com histórico familiar.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-rose-50/40 border border-rose-100/60">
                <div className="w-9 h-9 rounded-xl bg-white text-[#b85d75] flex items-center justify-center shrink-0 shadow-xs border border-rose-100">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-slate-900">Hábitos Saudáveis</h5>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Alimentação equilibrada, atividade física regular e controle do estresse reduzem significativamente o risco de diversas doenças.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsInfoModalOpen(false)}
                className="px-6 py-2.5 rounded-full bg-[#be5f77] hover:bg-[#aa4e65] text-white text-xs font-bold transition-all shadow-md shadow-[#be5f77]/20 active:scale-95"
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
