import { Link, useLocation } from "wouter";
import { useState, useEffect, createContext } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
    LayoutDashboard,
    Users,
    UserPlus,
    Megaphone,
    LogOut,
    FileText,
    Briefcase,
    BarChart3,
    Target,
    CheckSquare,
    Users2,
    Settings,
    PhoneCall,
    Search,
    KeyRound,
    MessageSquare,
    Camera,
    Star,
    Menu,
    Package,
    ShieldCheck,
    Building2,
    Shield,
    StickyNote,
    PanelLeftClose,
    PanelLeftOpen,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useSiteSettings } from "@/hooks/use-site-settings";
import logo from "@assets/logo_monteiro_v2.png";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";
import { ForcePasswordChangeDialog } from "@/components/ForcePasswordChangeDialog";
import { TodoistNotificationBell } from "@/components/todoist/TodoistNotificationBell";
import { useStickyNotes } from "@/hooks/useStickyNotes";
import { StickyNotesLayer, StickyNoteButton } from "@/components/StickyNoteWidget";

// ─── Sticky Notes Context ────────────────────────────────────────────────────
export const StickyNotesContext = createContext<ReturnType<typeof useStickyNotes> | null>(null);

const WhatsAppIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.6 0 001.333 4.993L2 22l5.233-1.237a9.96 9.96 0 004.779 1.221h.005c5.505 0 9.988-4.478 9.989-9.984 0-2.669-1.038-5.176-2.925-7.062A9.925 9.925 0 0012.012 2zm5.835 14.167c-.247.692-1.233 1.266-2.025 1.341-.542.052-1.25.093-3.626-.893-3.04-1.262-4.992-4.364-5.143-4.566-.151-.202-1.234-1.644-1.234-3.136 0-1.492.784-2.226 1.062-2.528.277-.302.604-.378.805-.378.201 0 .402.002.578.01.188.008.44-.071.69.531.252.604.856 2.088.931 2.24.076.151.126.327.025.529-.101.201-.151.327-.302.503-.151.176-.317.393-.453.528-.151.151-.309.315-.133.617.176.302.784 1.294 1.684 2.096 1.157 1.03 2.133 1.35 2.435 1.501.302.151.478.126.654-.076.176-.201.755-.881.956-1.183.201-.302.402-.252.679-.151.277.101 1.761.83 2.063.981.302.151.503.227.578.353.075.126.075.729-.172 1.421z" />
  </svg>
);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, logoutMutation } = useAuth();
    const [location, setLocation] = useLocation();
    const { settings } = useSiteSettings();
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
    const stickyNotes = useStickyNotes();

    // Menu lateral recolhido (só ícones) — preferência salva neste navegador, por usuário
    const collapseKey = `monteiro:sidebar-collapsed:${user?.id ?? "anon"}`;
    const readCollapsed = () => {
        try { return window.localStorage.getItem(collapseKey) === "1"; } catch { return false; }
    };
    const [collapsed, setCollapsedState] = useState<boolean>(readCollapsed);
    useEffect(() => { setCollapsedState(readCollapsed()); }, [collapseKey]);
    const toggleCollapsed = () => {
        setCollapsedState((prev) => {
            const next = !prev;
            try { window.localStorage.setItem(collapseKey, next ? "1" : "0"); } catch { /* sem armazenamento: só nesta sessão */ }
            return next;
        });
    };
    // Atalho: Ctrl+B (ou Cmd+B) recolhe/expande o menu
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "b") {
                const t = e.target as HTMLElement | null;
                if (t && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName))) return;
                e.preventDefault();
                toggleCollapsed();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [collapseKey]);

    if (!user) return null;

    const isAdmin = user.role === "admin";

    // Item com dica do nome quando o menu está recolhido
    const WithHint = ({ show, label, children }: { show: boolean; label: string; children: React.ReactElement }) =>
        show ? (
            <Tooltip delayDuration={150}>
                <TooltipTrigger asChild>{children}</TooltipTrigger>
                <TooltipContent side="right" className="text-xs font-medium">{label}</TooltipContent>
            </Tooltip>
        ) : children;

    const renderSidebar = (collapsed: boolean) => {
    const NavLink = ({ href, icon: Icon, label }: { href: string; icon: any; label: string }) => {
        const isActive = location === href;
        return (
            <Link href={href}>
                <WithHint show={collapsed} label={label}>
                <Button
                    variant="ghost"
                    aria-label={label}
                    className={`w-full rounded-xl text-sm font-medium transition-all duration-300
                        ${collapsed ? "justify-center px-0 py-3 h-11" : "justify-start gap-4 px-4 py-3"}
                        ${isActive
                            ? `bg-primary text-white shadow-md active:scale-95 ${collapsed ? "" : "translate-x-1"}`
                            : "text-slate-400 hover:text-white hover:bg-white/5 active:scale-95"
                        }
                    `}
                >
                    <Icon className={`h-5 w-5 shrink-0 ${isActive ? "text-amber-400" : "text-slate-400"}`} />
                    {!collapsed && label}
                </Button>
                </WithHint>
            </Link>
        );
    };

    const SectionTitle = ({ children, className = "mb-4" }: { children: React.ReactNode; className?: string }) =>
        collapsed ? (
            <div className="mx-auto mb-3 h-px w-8 bg-white/15" aria-hidden />
        ) : (
            <p className={`text-[11px] uppercase text-[#1A3A4F] font-bold px-2 tracking-[0.15em] ${className}`}>{children}</p>
        );

    return (
        <>
            {/* Logo & Brand */}
            <div className={`${collapsed ? "py-4" : "py-3"} flex flex-col items-center justify-center border-b border-white/10 mb-2`}>
                    <Link href="/">
                        <div className={`flex items-center justify-center cursor-pointer group w-full ${collapsed ? "px-2" : "px-4"}`}>
                            <div className="relative overflow-hidden group-hover:scale-105 transition-transform duration-300">
                                {settings?.logoBase64 ? (
                                    <img
                                        src={settings.logoBase64}
                                        alt={settings.siteName}
                                        className={`${collapsed ? "h-10 max-w-[52px]" : "h-24"} w-auto object-contain`}
                                    />
                                ) : (
                                    <img
                                        src={logo}
                                        alt="Monteiro Seguros e Benefícios"
                                        className={`${collapsed ? "h-10 max-w-[52px]" : "h-24"} w-auto object-contain`}
                                    />
                                )}
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Navigation Scrollable Area */}
                <div className={`flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pb-10 ${collapsed ? "px-3 space-y-4 pt-1" : "px-5 space-y-7"}`}>

                    {/* CRM Section */}
                    <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                        <SectionTitle>Gestão de Clientes</SectionTitle>
                        <nav className="space-y-1">
                            <NavLink href="/admin" icon={LayoutDashboard} label="Visão Geral" />
                            <NavLink href="/admin/contacts" icon={Users} label="Base de Contatos" />
                            <NavLink href="/admin/leads" icon={UserPlus} label="Leads & Pipeline" />
                            <a
                                href="https://whatsapp.monteiroseguros.com.br/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block"
                            >
                                <WithHint show={collapsed} label="Monteiro Conecta">
                                <Button
                                    variant="ghost"
                                    aria-label="Monteiro Conecta"
                                    className={`w-full rounded-xl text-sm font-bold text-emerald-400 hover:text-white hover:bg-emerald-600/30 transition-all duration-300 border border-emerald-500/30 my-1 ${collapsed ? "justify-center px-0 h-11" : "justify-start gap-4 px-4 py-3"}`}
                                >
                                    <WhatsAppIcon className="h-5 w-5 shrink-0 fill-emerald-400" />
                                    {!collapsed && "Monteiro Conecta"}
                                </Button>
                                </WithHint>
                            </a>
                            <NavLink href="/admin/interactions" icon={Megaphone} label="Régua de Contato" />
                            <NavLink href="/admin/prospecting" icon={PhoneCall} label="Prospecção" />
                            <NavLink href="/admin/company-search" icon={Search} label="Busca de Empresas" />
                        </nav>
                    </div>

                    {/* TODOIST Module Section */}
                    <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                        <SectionTitle className="mb-2">TODOIST Tarefas</SectionTitle>
                        <nav className="space-y-1">
                            <NavLink href="/admin/todoist" icon={CheckSquare} label="Tarefas & Kanban" />
                        </nav>
                    </div>

                    {/* Insurance Module Section */}
                    <div className="animate-in fade-in slide-in-from-left-4 duration-600">
                        <SectionTitle>Carteira de Seguros</SectionTitle>
                        <nav className="space-y-1">
                            <NavLink href="/admin/seguros" icon={ShieldCheck} label="Dashboard Seguros" />
                            <NavLink href="/admin/clientes" icon={Users} label="Clientes de Seguro" />
                            <NavLink href="/admin/apolices" icon={FileText} label="Apólices" />
                            <NavLink href="/admin/seguradoras" icon={Building2} label="Seguradoras" />
                        </nav>
                    </div>

                    {/* Operational Section */}
                    <div className="animate-in fade-in slide-in-from-left-4 duration-1000">
                        <SectionTitle>Operacional</SectionTitle>
                        <nav className="space-y-1">
                            <NavLink href="/admin/tasks" icon={CheckSquare} label="Fluxo de Trabalho" />
                            {isAdmin && <NavLink href="/admin/users" icon={Users2} label="Controle de Acesso" />}
                        </nav>
                    </div>

                    {/* Site & Content Section */}
                    <div className="animate-in fade-in slide-in-from-left-4 duration-700">
                        <SectionTitle>Conteúdo Presencial</SectionTitle>
                        <nav className="space-y-1">
                            <NavLink href="/admin/posts" icon={FileText} label="Blog Central" />
                            <NavLink href="/admin/comments" icon={MessageSquare} label="Moderar Comentários" />
                            <NavLink href="/admin/reviews" icon={Star} label="Avaliações & Google" />
                            <NavLink href="/admin/services" icon={Briefcase} label="Portfólio de Serviços" />
                        </nav>
                    </div>

                    {/* Bottom Settings Section */}
                    <div className="animate-in fade-in slide-in-from-left-4 duration-1000 mt-auto pt-6">
                        <SectionTitle>Sistema</SectionTitle>
                        <nav className="space-y-1">
                            {isAdmin && <NavLink href="/admin/site-config" icon={Settings} label="Configurações Web" />}
                            <NavLink href="/admin/notas" icon={StickyNote} label="Notas Adesivas" />
                        </nav>
                    </div>
                </div>

                {collapsed ? (
<>                {/* Footer User Info (recolhido) */}
                <div className="mt-auto py-4 px-3 bg-black/30 border-t border-white/5 flex flex-col items-center gap-2">
                    <WithHint show label={`${user.name || user.username} · ${user.role === 'admin' ? 'Master Admin' : 'Operador'}`}>
                        <button type="button" onClick={() => setLocation("/profile")} className="relative h-11 w-11 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-white overflow-hidden hover:border-amber-500/50 transition-colors">
                            {user.avatar ? <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" /> : user.username.charAt(0).toUpperCase()}
                            <span className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border border-[#161b22]" />
                        </button>
                    </WithHint>
                    <WithHint show label="Mudar senha">
                        <Button variant="ghost" size="icon" aria-label="Mudar senha" className="h-9 w-9 rounded-lg text-amber-400 hover:bg-white/10" onClick={() => setPasswordDialogOpen(true)}>
                            <KeyRound className="h-4 w-4" />
                        </Button>
                    </WithHint>
                    <WithHint show label="Sair">
                        <Button variant="ghost" size="icon" aria-label="Sair" className="h-9 w-9 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400" onClick={() => logoutMutation.mutate()}>
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </WithHint>
                </div>

</>
                ) : (
<>
                {/* Footer User Info */}
                <div className="mt-auto p-5 bg-black/30 border-t border-white/5">
                    <div className="flex items-center gap-4 mb-4 group cursor-pointer" onClick={() => setLocation("/profile")}>
                        <div className="relative group/avatar">
                            <div className="h-12 w-12 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-lg text-white shadow-inner overflow-hidden group-hover:border-amber-500/50 transition-colors relative">
                                {user.avatar ? (
                                    <img src={user.avatar} alt={user.name} className="h-full w-full object-cover group-hover:opacity-40 transition-opacity" />
                                ) : (
                                    user.username.charAt(0).toUpperCase()
                                )}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity bg-black/20">
                                    <Camera className="h-5 w-5 text-white" />
                                </div>
                            </div>
                            <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-[#161b22] shadow-sm z-10"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-white truncate group-hover:text-amber-400 transition-colors">{user.name || user.username}</h4>
                            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-0.5 group-hover:text-slate-300 transition-colors">
                                {user.role === 'admin' ? 'Master Admin' : 'Operador'}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <Link href="/">
                            <Button variant="outline" className="w-full bg-transparent border-white/10 text-white hover:bg-white/5 border text-xs h-9 rounded-lg">
                                Ver Site
                            </Button>
                        </Link>
                        <Button
                            variant="ghost"
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs h-9 rounded-lg transition-colors"
                            onClick={() => logoutMutation.mutate()}
                        >
                            <LogOut className="h-3.5 w-3.5 mr-2" />
                            Sair
                        </Button>
                    </div>

                    <Button
                        variant="outline"
                        className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 text-xs h-9 rounded-lg gap-2"
                        onClick={() => setPasswordDialogOpen(true)}
                    >
                        <KeyRound className="h-3.5 w-3.5 text-amber-400" />
                        Mudar Senha
                    </Button>
                </div>

</>
                )}

                <ChangePasswordDialog
                    open={passwordDialogOpen}
                    onOpenChange={setPasswordDialogOpen}
                />
        </>
    );
    };

    return (
        <StickyNotesContext.Provider value={stickyNotes}>
        <StickyNotesLayer hook={stickyNotes} />
        <div className="flex flex-col lg:flex-row h-screen bg-[#0a0c10] overflow-hidden font-sans selection:bg-amber-500/30">
            {/* Mobile Header */}
            <header className="lg:hidden flex items-center justify-between bg-[#0F6570] p-4 shadow-md z-40 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-4">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                                <Menu className="w-6 h-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-80 p-0 bg-[#0F6570] border-r-0 flex flex-col [&>button]:hidden">
                            {renderSidebar(false)}
                        </SheetContent>
                    </Sheet>
                    <Link href="/">
                        {settings?.logoBase64 ? (
                            <img src={settings.logoBase64} alt={settings.siteName} className="h-8 w-auto object-contain" />
                        ) : (
                            <span className="text-amber-400 font-bold text-sm tracking-widest uppercase">Monteiro CRM</span>
                        )}
                    </Link>
                </div>

                {/* Mobile Monteiro Conecta Button */}
                <a
                    href="https://whatsapp.monteiroseguros.com.br/"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 px-3 py-1.5 rounded-xl shadow-md"
                    >
                        <WhatsAppIcon className="h-4 w-4 fill-white" /> Conecta
                    </Button>
                </a>
            </header>

            {/* Desktop Sidebar */}
            <aside
                className={`hidden lg:flex ${collapsed ? "w-[76px]" : "w-80"} bg-[#0F6570] border-r border-white/5 flex-col shadow-2xl z-30 shrink-0 transition-[width] duration-200 ease-out`}
                aria-label="Menu principal"
            >
                {renderSidebar(collapsed)}
            </aside>

            {/* Main Workspace */}
            <main className="flex-1 overflow-auto bg-[#f1f5f9] relative flex flex-col">
                {/* Decorative header gradient */}
                <div className="h-40 w-full bg-[#0a0c10] absolute top-0 left-0 -z-10" />

                {/* Top Action Header Bar */}
                <div className="bg-[#0a0c10]/80 backdrop-blur border-b border-white/5 px-4 lg:px-8 py-3 flex items-center justify-end gap-3 z-20 shrink-0">
                    <Tooltip delayDuration={200}>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={toggleCollapsed}
                                aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
                                aria-expanded={!collapsed}
                                className="hidden lg:inline-flex mr-auto -ml-2 h-9 w-9 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
                            >
                                {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">
                            {collapsed ? "Expandir menu" : "Recolher menu"} <span className="ml-1 opacity-60">Ctrl+B</span>
                        </TooltipContent>
                    </Tooltip>
                    <a
                        href="https://whatsapp.monteiroseguros.com.br/"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-2 px-4 py-2 rounded-xl shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
                        >
                            <WhatsAppIcon className="h-4 w-4 fill-white" /> Monteiro Conecta
                        </Button>
                    </a>
                    <StickyNoteButton hook={stickyNotes} />
                    <TodoistNotificationBell />
                </div>

                <div className={`flex-1 ${collapsed ? "p-6 lg:px-8" : "p-10"}`}>
                    <div className={`${collapsed ? "max-w-[1760px]" : "max-w-[1400px]"} mx-auto animate-in fade-in zoom-in-95 duration-500`}>
                        {children}
                    </div>
                </div>

                {/* Force password change for newly created accounts */}
                <ForcePasswordChangeDialog open={!!(user as any)?.mustChangePassword} />
            </main>
        </div>
        </StickyNotesContext.Provider>
    );
}
