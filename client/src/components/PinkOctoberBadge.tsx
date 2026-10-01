import { useState } from "react";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { useLocation } from "wouter";
import { Heart, X, Sparkles } from "lucide-react";

export function PinkOctoberBadge() {
    const { settings } = useSiteSettings();
    const [location] = useLocation();
    const [isDismissed, setIsDismissed] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);

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
                className="fixed bottom-6 left-6 z-40 flex items-center gap-2 px-3 py-2 rounded-full bg-gradient-to-r from-pink-600 to-rose-600 text-white text-xs font-bold shadow-lg shadow-pink-600/30 hover:scale-105 active:scale-95 transition-all duration-300 border border-pink-300/40"
                title="Outubro Rosa — Clique para expandir"
            >
                <span className="text-base leading-none">🎗️</span>
                <span className="hidden sm:inline">Outubro Rosa</span>
            </button>
        );
    }

    return (
        <aside
            aria-label="Campanha Outubro Rosa"
            className="fixed bottom-6 left-6 z-40 max-w-sm rounded-2xl bg-white/95 backdrop-blur-md p-3.5 shadow-2xl border border-pink-200 text-slate-800 transition-all duration-300 animate-in fade-in slide-in-from-bottom-5"
        >
            <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-pink-500/25">
                    <Heart className="w-4 h-4 fill-white animate-pulse" />
                </div>
                <div className="flex-1 pr-1">
                    <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-pink-100 text-pink-700">
                            🎗️ Outubro Rosa
                        </span>
                        <Sparkles className="w-3 h-3 text-pink-500" />
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-snug font-medium">
                        Apoiamos a conscientização e a prevenção ao câncer de mama. O diagnóstico precoce salva vidas!
                    </p>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setIsMinimized(true)}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
                        title="Minimizar"
                        aria-label="Minimizar mensagem"
                    >
                        <span className="text-xs font-bold block leading-none">—</span>
                    </button>
                    <button
                        onClick={() => setIsDismissed(true)}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
                        title="Fechar"
                        aria-label="Fechar mensagem"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </aside>
    );
}
