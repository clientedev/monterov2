import { Link, useLocation } from "wouter";
import { useState } from "react";
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
    KeyRound
} from "lucide-react";
import { useSiteSettings } from "@/hooks/use-site-settings";
import logo from "@assets/image_1770228718109.png";
import { Separator } from "@/components/ui/separator";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, logoutMutation } = useAuth();
    const [location] = useLocation();
    const { settings } = useSiteSettings();
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

    if (!user) return null;

    const isAdmin = user.role === "admin";

    const NavLink = ({ href, icon: Icon, label }: { href: string; icon: any; label: string }) => {
        const isActive = location === href;
        return (
            <Link href={href}>
                <Button
                    variant="ghost"
                    className={`w-full justify-start gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300
                        ${isActive
                            ? "bg-primary text-white shadow-md active:scale-95 translate-x-1"
                            : "text-slate-400 hover:text-white hover:bg-white/5 active:scale-95"
                        }
                    `}
                >
                    <Icon className={`h-5 w-5 ${isActive ? "text-amber-400" : "text-slate-400"}`} />
                    {label}
                </Button>
            </Link>
        );
    };

    return (
        <div className="flex h-screen bg-[#0a0c10] overflow-hidden font-sans selection:bg-amber-500/30">
            {/* Professional Sidebar */}
            <aside className="w-80 bg-[#0f172a] border-r border-white/5 flex flex-col shadow-2xl z-30">
                {/* Logo & Brand */}
                <div className="p-6 pb-2">
                    <Link href="/admin">
                        <div className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative overflow-hidden rounded-lg group-hover:rotate-3 transition-transform duration-300">
                                {settings?.logoBase64 ? (
                                    <img
                                        src={settings.logoBase64}
                                        alt={settings.siteName}
                                        className="h-10 w-auto object-contain"
                                    />
                                ) : (
                                    <img
                                        src={logo}
                                        alt="Monteiro Corretora"
                                        className="h-10 w-auto object-contain"
                                    />
                                )}
                            </div>
                            <div className="flex flex-col font-display leading-tight">
                                <span className="text-lg font-bold tracking-tight text-white">
                                    {settings?.siteName?.split(' ')[0] || "Monteiro"}
                                </span>
                                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-[0.2em] leading-none mt-1">
                                    {settings?.siteName?.split(' ').slice(1).join(' ') || "Corretora Premium"}
                                </span>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Navigation Scrollable Area */}
                <div className="flex-1 overflow-y-auto px-5 space-y-7 custom-scrollbar pb-10">

                    {/* CRM Section */}
                    <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                        <p className="text-[11px] uppercase text-slate-500 font-bold mb-4 px-2 tracking-[0.15em]">Gestão de Clientes</p>
                        <nav className="space-y-1">
                            <NavLink href="/admin" icon={LayoutDashboard} label="Visão Geral" />
                            <NavLink href="/admin/contacts" icon={Users} label="Base de Contatos" />
                            <NavLink href="/admin/leads" icon={UserPlus} label="Leads & Pipeline" />
                            <NavLink href="/admin/interactions" icon={Megaphone} label="Régua de Contato" />
                            <NavLink href="/admin/prospecting" icon={PhoneCall} label="Prospecção" />
                            <NavLink href="/admin/company-search" icon={Search} label="Busca de Empresas" />
                        </nav>
                    </div>

                    {/* Operational Section */}
                    <div className="animate-in fade-in slide-in-from-left-4 duration-1000">
                        <p className="text-[11px] uppercase text-slate-500 font-bold mb-4 px-2 tracking-[0.15em]">Operacional</p>
                        <nav className="space-y-1">
                            <NavLink href="/admin/tasks" icon={CheckSquare} label="Fluxo de Trabalho" />
                            {isAdmin && <NavLink href="/admin/users" icon={Users2} label="Controle de Acesso" />}
                        </nav>
                    </div>

                    {/* Site & Content Section */}
                    <div className="animate-in fade-in slide-in-from-left-4 duration-700">
                        <p className="text-[11px] uppercase text-slate-500 font-bold mb-4 px-2 tracking-[0.15em]">Conteúdo Presencial</p>
                        <nav className="space-y-1">
                            <NavLink href="/admin/posts" icon={FileText} label="Blog Central" />
                            <NavLink href="/admin/services" icon={Briefcase} label="Portfólio de Serviços" />
                        </nav>
                    </div>

                    {/* Bottom Settings Section */}
                    <div className="animate-in fade-in slide-in-from-left-4 duration-1000 mt-auto pt-6">
                        <p className="text-[11px] uppercase text-slate-500 font-bold mb-4 px-2 tracking-[0.15em]">Sistema</p>
                        <nav className="space-y-1">
                            {isAdmin && <NavLink href="/admin/site-config" icon={Settings} label="Configurações Web" />}
                        </nav>
                    </div>
                </div>

                {/* Footer User Info */}
                <div className="mt-auto p-5 bg-black/30 border-t border-white/5">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="relative">
                            <div className="h-12 w-12 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-lg text-white shadow-inner">
                                {user.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-[#161b22] shadow-sm"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-white truncate">{user.name || user.username}</h4>
                            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-0.5">
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

                <ChangePasswordDialog
                    open={passwordDialogOpen}
                    onOpenChange={setPasswordDialogOpen}
                />
            </aside>

            {/* Main Workspace */}
            <main className="flex-1 overflow-auto bg-[#f1f5f9] relative">
                {/* Decorative header gradient */}
                <div className="h-40 w-full bg-[#0a0c10] absolute top-0 left-0 -z-10" />

                <div className="p-10 min-h-full">
                    <div className="max-w-[1400px] mx-auto animate-in fade-in zoom-in-95 duration-500">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
