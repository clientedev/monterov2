import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { Eye, EyeOff, ArrowLeft, Lock, User, UserPlus } from "lucide-react";
import { useSiteSettings } from "@/hooks/use-site-settings";
import logo from "@assets/logo_monteiro.png";

export default function Register() {
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [passwordError, setPasswordError] = useState("");
    const [, setLocation] = useLocation();
    const { registerMutation, user } = useAuth();
    const { settings } = useSiteSettings();

    useEffect(() => {
        if (user) setLocation("/admin");
    }, [user, setLocation]);

    if (user) return null;

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError("");

        if (password !== confirmPassword) {
            setPasswordError("As senhas não coincidem.");
            return;
        }
        if (password.length < 6) {
            setPasswordError("A senha deve ter ao menos 6 caracteres.");
            return;
        }

        registerMutation.mutate(
            { username, password, name, role: "employee" },
            { onSuccess: () => setLocation("/admin") }
        );
    };

    return (
        <div className="min-h-screen flex">
            {/* Left: Branding Panel */}
            <div
                className="hidden lg:flex lg:w-1/2 flex-col justify-between p-16 relative overflow-hidden"
                style={{
                    background: "linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #0F172A 100%)",
                }}
            >
                {/* Gold accent lines */}
                <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-yellow-600/40 to-transparent" />
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-yellow-600/30 to-transparent" />

                {/* Subtle radial glow */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: "radial-gradient(circle at 30% 70%, rgba(212,175,55,0.08) 0%, transparent 60%)",
                    }}
                />

                {/* Logo / Brand */}
                <div className="relative z-10">
                    <div className="flex items-center mb-2">
                        <div className="relative overflow-hidden">
                            {settings?.logoBase64 ? (
                                <img src={settings.logoBase64} alt={settings.siteName} className="h-24 w-auto object-contain" />
                            ) : (
                                <img src={logo} alt="Monteiro Seguros & Benefícios" className="h-24 w-auto object-contain" />
                            )}
                        </div>
                    </div>
                </div>

                {/* Center content */}
                <div className="relative z-10 space-y-8">
                    <div>
                        <h1 className="text-5xl font-black text-white leading-tight tracking-tight">
                            Faça parte<br />do nosso<br />
                            <span className="font-black" style={{ color: "#D4AF37" }}>
                                time.
                            </span>
                        </h1>
                        <p className="text-slate-400 mt-6 text-lg leading-relaxed">
                            Crie sua conta para acessar o painel de gestão e começar a trabalhar.
                        </p>
                    </div>

                    {/* Features */}
                    <div className="space-y-3">
                        {[
                            "Gestão completa de clientes e leads",
                            "Prospecção inteligente de empresas",
                            "Tarefas e agenda integradas",
                        ].map((feat) => (
                            <div key={feat} className="flex items-center gap-3">
                                <div
                                    className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                                    style={{ background: "#D4AF37" }}
                                />
                                <p className="text-slate-400 text-sm">{feat}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom */}
                <div className="relative z-10">
                    <p className="text-slate-600 text-xs font-medium">
                        © {new Date().getFullYear()} {settings?.siteName || "Monteiro Corretora"} · Todos os direitos reservados.
                    </p>
                </div>
            </div>

            {/* Right: Register Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
                <div className="w-full max-w-[420px]">
                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center mb-10">
                        <div className="relative overflow-hidden">
                            {settings?.logoBase64 ? (
                                <img src={settings.logoBase64} alt={settings.siteName} className="h-20 w-auto object-contain" />
                            ) : (
                                <img src={logo} alt="Monteiro Seguros & Benefícios" className="h-20 w-auto object-contain" />
                            )}
                        </div>
                    </div>

                    <div className="mb-10">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Criar conta</h2>
                        <p className="text-slate-500 mt-2">Preencha os dados para criar seu acesso ao painel.</p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-4">
                        {/* Full Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-slate-700 font-bold text-sm">Nome completo</Label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Seu nome"
                                    required
                                    className="h-12 pl-11 bg-white border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:border-yellow-500 focus:ring-yellow-500/20"
                                />
                            </div>
                        </div>

                        {/* Username */}
                        <div className="space-y-2">
                            <Label htmlFor="username" className="text-slate-700 font-bold text-sm">Usuário</Label>
                            <div className="relative">
                                <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    id="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Escolha um nome de usuário"
                                    required
                                    className="h-12 pl-11 bg-white border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:border-yellow-500 focus:ring-yellow-500/20"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-slate-700 font-bold text-sm">Senha</Label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Mínimo 6 caracteres"
                                    required
                                    className="h-12 pl-11 pr-12 bg-white border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:border-yellow-500 focus:ring-yellow-500/20"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-slate-700 font-bold text-sm">Confirmar senha</Label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    id="confirmPassword"
                                    type={showConfirm ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Repita a senha"
                                    required
                                    className="h-12 pl-11 pr-12 bg-white border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:border-yellow-500 focus:ring-yellow-500/20"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Errors */}
                        {passwordError && (
                            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 font-medium">
                                {passwordError}
                            </div>
                        )}
                        {registerMutation.isError && (
                            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 font-medium">
                                {(registerMutation.error as Error)?.message?.includes("already")
                                    ? "Este nome de usuário já está em uso."
                                    : "Erro ao criar conta. Tente novamente."}
                            </div>
                        )}

                        {/* Submit */}
                        <Button
                            type="submit"
                            className="w-full h-12 font-bold text-base rounded-xl shadow-lg transition-all active:scale-[0.98]"
                            style={{
                                background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
                                boxShadow: "0 4px 20px rgba(15,23,42,0.25)",
                            }}
                            disabled={registerMutation.isPending}
                        >
                            {registerMutation.isPending ? (
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Criando conta...</span>
                                </div>
                            ) : (
                                "Criar Conta"
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-slate-200 space-y-3">
                        <Link href="/login">
                            <Button
                                variant="ghost"
                                className="w-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold rounded-xl gap-2 h-11"
                            >
                                Já tem conta? Fazer login
                            </Button>
                        </Link>
                        <Link href="/">
                            <Button
                                variant="ghost"
                                className="w-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 font-semibold rounded-xl gap-2 h-11"
                            >
                                <ArrowLeft size={15} />
                                Voltar para o site
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
