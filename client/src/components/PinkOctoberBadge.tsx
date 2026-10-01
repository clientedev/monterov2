import { useState, useEffect } from "react";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { useLocation } from "wouter";
import { X } from "lucide-react";

// Laço Rosa Oficial SVG — Símbolo internacional da conscientização
function RibbonIcon({ className = "w-5 h-5 text-pink-600" }: { className?: string }) {
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

  // Only display on public site (not in /admin routes)
  const isAdmin = location.startsWith("/admin");
  const isPinkOctober = Boolean(settings?.themeOutubroRosa || settings?.activeTheme === "outubro_rosa");
  const showBadge = settings?.themeOutubroRosaBadge !== false;

  if (isAdmin || !isPinkOctober || !showBadge || isDismissed) {
    return null;
  }

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 left-6 z-40 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white text-slate-800 text-xs font-semibold shadow-xl border border-pink-200 hover:border-pink-300 hover:shadow-2xl transition-all duration-300"
        title="Campanha Outubro Rosa — Clique para expandir"
      >
        <RibbonIcon className="w-4 h-4 text-pink-600 shrink-0" />
        <span className="text-slate-700 font-medium">Outubro Rosa · Conscientização</span>
      </button>
    );
  }

  return (
    <aside
      aria-label="Campanha de Conscientização Outubro Rosa"
      className="fixed bottom-6 left-6 z-40 max-w-sm rounded-2xl bg-white/98 backdrop-blur-md p-4 shadow-2xl border border-pink-100/90 text-slate-800 transition-all duration-300 animate-in fade-in slide-in-from-bottom-5"
    >
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-pink-50 border border-pink-100 flex items-center justify-center text-pink-600 shrink-0 mt-0.5">
          <RibbonIcon className="w-5 h-5 text-pink-600" />
        </div>
        <div className="flex-1 pr-1">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[11px] font-semibold text-pink-700 uppercase tracking-wider">
              Apoio Institucional
            </span>
            <div className="flex items-center gap-1 -mr-1">
              <button
                onClick={() => setIsMinimized(true)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
                title="Minimizar"
                aria-label="Minimizar aviso"
              >
                <span className="text-xs font-bold block leading-none w-3 text-center">—</span>
              </button>
              <button
                onClick={handleDismiss}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
                title="Fechar"
                aria-label="Fechar aviso"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <h4 className="text-sm font-bold text-slate-900 leading-tight mb-1">
            Outubro Rosa: Cuidado e Prevenção
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed font-normal">
            A Monteiro Seguros apoia a campanha de conscientização sobre o câncer de mama e do colo do útero. O diagnóstico precoce e a realização periódica de exames salvam vidas.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={handleDismiss}
              className="text-[11px] font-semibold text-pink-700 bg-pink-50 hover:bg-pink-100 px-3 py-1.5 rounded-lg border border-pink-200/60 transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
