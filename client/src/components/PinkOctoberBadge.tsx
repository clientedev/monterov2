import { useState, useEffect } from "react";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { useLocation } from "wouter";
import { X, Heart, ShieldCheck, Sparkles, ChevronRight, Phone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// Laço Rosa Oficial SVG — Símbolo internacional de conscientização
function RibbonIcon({ className = "w-5 h-5 text-[#d94676]" }: { className?: string }) {
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
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);

  // Visível apenas no site público (não em rotas /admin)
  const isAdmin = location.startsWith("/admin");
  const isPinkOctober = Boolean(settings?.themeOutubroRosa || settings?.activeTheme === "outubro_rosa");
  const showBadge = settings?.themeOutubroRosaBadge !== false;

  // Pop-up abre automaticamente uma única vez por sessão após 2s ao entrar no site
  useEffect(() => {
    if (!isAdmin && isPinkOctober && showBadge && !hasAutoOpened) {
      const alreadySeen = typeof window !== "undefined" && sessionStorage.getItem("seen_outubro_rosa_popup");
      if (alreadySeen) return;

      const timer = setTimeout(() => {
        setIsInfoModalOpen(true);
        setHasAutoOpened(true);
        try {
          sessionStorage.setItem("seen_outubro_rosa_popup", "true");
        } catch {}
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isAdmin, isPinkOctober, showBadge, hasAutoOpened]);

  if (isAdmin || !isPinkOctober || !showBadge) {
    return null;
  }

  return (
    <>
      {/* Selo Flutuante Discreto e Elegante (Sempre visível no canto inferior para abrir o pop-up) */}
      <button
        type="button"
        onClick={() => setIsInfoModalOpen(true)}
        className="fixed bottom-6 left-6 z-40 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white/95 backdrop-blur-md text-slate-800 text-xs font-semibold shadow-xl shadow-[#d94676]/15 border border-[#ea7297]/40 hover:border-[#d94676] hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 group cursor-pointer"
        title="Outubro Rosa — Clique para ver mensagem de conscientização"
      >
        <span className="w-2 h-2 rounded-full bg-[#d94676] animate-ping" />
        <RibbonIcon className="w-4 h-4 text-[#d94676] group-hover:scale-110 transition-transform" />
        <span className="font-bold text-slate-800 tracking-tight">Outubro Rosa</span>
        <span className="hidden sm:inline text-[11px] text-[#d94676] font-medium bg-[#fdf2f4] px-2 py-0.5 rounded-full">
          Cuidado & Prevenção
        </span>
      </button>

      {/* Pop-up / Modal Clean, Delicado & Acolhedor */}
      <Dialog open={isInfoModalOpen} onOpenChange={setIsInfoModalOpen}>
        <DialogContent className="max-w-lg rounded-[2.2rem] border-none shadow-[0_25px_60px_rgba(217,70,118,0.22)] p-0 overflow-hidden bg-white">
          <DialogHeader className="p-8 pb-6 bg-gradient-to-b from-[#fdf2f4] via-[#fff5f7] to-white border-b border-[#ea7297]/20 text-left relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#ea7297]/40 text-[#d94676] text-xs font-bold uppercase tracking-wider mb-3 shadow-xs">
              <RibbonIcon className="w-3.5 h-3.5" />
              <span>Campanha Outubro Rosa</span>
            </div>
            <DialogTitle className="text-2xl font-display font-bold text-slate-900 leading-tight">
              O cuidado com a sua saúde salva vidas
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-600 mt-2 leading-relaxed font-normal">
              A Monteiro Seguros apoia a prevenção e o diagnóstico precoce do câncer de mama. Quando detectado no início, as chances de cura ultrapassam 95%.
            </DialogDescription>
          </DialogHeader>

          <div className="p-8 pt-4 space-y-4">
            <div className="grid gap-3">
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#fff9fa] border border-[#ea7297]/25 hover:border-[#d94676]/40 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-white text-[#d94676] flex items-center justify-center shrink-0 shadow-xs border border-[#ea7297]/30">
                  <Heart className="w-4 h-4 fill-[#d94676]/20" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900">Autocuidado & Conexão</h5>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Conheça seu corpo e seus sinais. Faça o autoexame mensal e consulte seu ginecologista anualmente.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#fff9fa] border border-[#ea7297]/25 hover:border-[#d94676]/40 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-white text-[#d94676] flex items-center justify-center shrink-0 shadow-xs border border-[#ea7297]/30">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900">Mamografia Preventiva</h5>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Exame padrão-ouro indicado a partir dos 40 anos ou conforme orientação médica personalizada.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#fff9fa] border border-[#ea7297]/25 hover:border-[#d94676]/40 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-white text-[#d94676] flex items-center justify-center shrink-0 shadow-xs border border-[#ea7297]/30">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900">Proteção para Você e Sua Família</h5>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Planos de saúde completos com ampla rede de clínicas, laboratórios e especialistas para cuidar de você em cada etapa.
                  </p>
                </div>
              </div>
            </div>

            {/* Rodapé com botão delicado e contato */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                <Phone className="w-3 h-3 text-[#d94676]" /> Disque Saúde: 136
              </span>
              <button
                type="button"
                onClick={() => setIsInfoModalOpen(false)}
                className="px-6 py-2.5 rounded-full bg-[#d94676] hover:bg-[#c43a65] text-white text-xs font-bold transition-all shadow-md shadow-[#d94676]/25 active:scale-95 cursor-pointer"
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
