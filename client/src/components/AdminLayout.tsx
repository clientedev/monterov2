import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import {
    LayoutDashboard,
    FileText,
    MessageSquare,
    Image as ImageIcon,
    Settings,
    LogOut,
    Users
} from "lucide-react";
import { Button } from "./ui/button";

interface AdminLayoutProps {
    children: React.ReactNode;
    title: string;
}

export function AdminLayout({ children, title }: AdminLayoutProps) {
    const [location] = useLocation();
    const { logout } = useAuth();

    const navItems = [
        { href: "/", icon: ImageIcon, label: "Voltar para o Site", special: true },
        { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
        { href: "/admin/posts", icon: FileText, label: "Posts" },
        { href: "/admin/comments", icon: MessageSquare, label: "Comentários" },
        { href: "/admin/hero", icon: ImageIcon, label: "Hero Slider" },
        { href: "/admin/chat", icon: MessageSquare, label: "Chat" },
        { href: "/admin/testimonials", icon: Users, label: "Depoimentos" },
        { href: "/admin/settings", icon: Settings, label: "Configurações" },
    ];

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-md flex flex-col">
                <div className="p-6 border-b">
                    <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location === item.href;
                        return (
                            <Link key={item.href} href={item.href}>
                                <a className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${item.special 
                                        ? "bg-primary/10 text-primary hover:bg-primary/20 mb-4"
                                        : isActive
                                            ? "bg-blue-50 text-blue-600"
                                            : "text-gray-600 hover:bg-gray-50"
                                    }`}>
                                    <Icon className="w-5 h-5" />
                                    <span>{item.label}</span>
                                </a>
                            </Link>
                        );
                    })}
                </nav>
                <div className="p-4 border-t">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={logout}
                    >
                        <LogOut className="w-5 h-5 mr-3" />
                        Sair
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <header className="bg-white shadow-sm p-6 mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
                </header>
                <div className="px-6 pb-6">
                    {children}
                </div>
            </main>
        </div>
    );
}
