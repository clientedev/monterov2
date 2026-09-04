import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Shield, KeyRound, CheckCircle2, AlertCircle, Loader2, ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function CreatePasswordPage() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const [token, setToken] = useState<string | null>(null);
    const [isValidating, setIsValidating] = useState(true);
    const [clientInfo, setClientInfo] = useState<{ name: string; email: string } | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const t = urlParams.get("token");
        setToken(t);

        if (!t) {
            setIsValidating(false);
            setErrorMsg("Link de acesso inválido ou incompleto.");
            return;
        }

        fetch(`/api/verify-first-login-token?token=${t}`)
            .then(async (res) => {
                const data = await res.json();
                if (data.valid) {
                    setClientInfo({ name: data.name, email: data.email });
                } else {
                    setErrorMsg(data.message || "Este link expirou ou já foi utilizado.");
                }
            })
            .catch(() => {
                setErrorMsg("Erro ao verificar convite de primeiro acesso.");
            })
            .finally(() => {
                setIsValidating(false);
            });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password.length < 6) {
            toast({
                title: "Senha muito curta",
                description: "A senha deve ter pelo menos 6 caracteres.",
                variant: "destructive",
            });
            return;
        }

        if (password !== confirmPassword) {
            toast({
                title: "Senhas não conferem",
                description: "Certifique-se de digitar a mesma senha nos dois campos.",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await fetch("/api/set-first-login-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Erro ao cadastrar senha.");
            }

            setIsSuccess(true);
            toast({
                title: "Senha cadastrada com sucesso!",
                description: "Sua conta está ativa. Você será redirecionado para a Área do Cliente.",
            });

            setTimeout(() => {
                window.location.href = "/dashboard";
            }, 2000);
        } catch (err: any) {
            toast({
                title: "Falha ao cadastrar senha",
                description: err.message,
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full filter blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full filter blur-[120px] pointer-events-none" />

            <Card className="w-full max-w-md bg-white/95 backdrop-blur-xl border-white/20 shadow-2xl rounded-3xl overflow-hidden relative z-10">
                <CardHeader className="bg-primary text-white p-8 text-center relative overflow-hidden">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-3 shadow-inner">
                        <KeyRound className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-display font-bold">Monteiro Seguros</CardTitle>
                    <CardDescription className="text-primary-foreground/80 text-sm mt-1">
                        Ativação de Conta e Criação de Senha
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-8">
                    {isValidating ? (
                        <div className="flex flex-col items-center justify-center py-8 space-y-4">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="text-sm font-semibold text-slate-600">Verificando convite de acesso...</p>
                        </div>
                    ) : errorMsg ? (
                        <div className="text-center py-6 space-y-4">
                            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                                <AlertCircle className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">Link Inválido ou Expirado</h3>
                            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">{errorMsg}</p>
                            <Button
                                onClick={() => setLocation("/login")}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-11 rounded-xl"
                            >
                                Ir para Login
                            </Button>
                        </div>
                    ) : isSuccess ? (
                        <div className="text-center py-6 space-y-4">
                            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                                <CheckCircle2 className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">Senha Criada com Sucesso!</h3>
                            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                                Redirecionando para a sua Área do Cliente...
                            </p>
                            <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mt-2" />
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Bem-vindo(a)</span>
                                <strong className="text-base font-bold text-slate-800 block">{clientInfo?.name}</strong>
                                <span className="text-xs text-slate-500">{clientInfo?.email}</span>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <Lock className="h-3.5 w-3.5 text-primary" /> Nova Senha
                                </Label>
                                <Input
                                    type="password"
                                    placeholder="No mínimo 6 caracteres"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="h-11 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-primary"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <Lock className="h-3.5 w-3.5 text-primary" /> Confirmar Nova Senha
                                </Label>
                                <Input
                                    type="password"
                                    placeholder="Digite a mesma senha novamente"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="h-11 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-primary"
                                    required
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full h-12 rounded-xl text-base font-bold bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 gap-2"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        Criar Senha e Acessar
                                        <ArrowRight className="h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </form>
                    )}
                </CardContent>

                <CardFooter className="bg-slate-50 p-4 border-t text-center justify-center">
                    <p className="text-[11px] text-slate-400">
                        Monteiro Seguros e Benefícios &bull; Todos os direitos reservados
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
