import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { username, password });
      login(res.data.token, res.data.user);
      setLocation(res.data.user.role === "ADMIN" ? "/admin" : "/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro no login",
        description: error.response?.data?.message || "Usuário ou senha incorretos.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex flex-col items-center gap-2 group mb-6">
            <span className="text-3xl font-display font-bold text-primary tracking-tight">Monteiro</span>
            <span className="text-sm font-medium text-slate-500 uppercase tracking-widest">Corretora</span>
          </Link>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Bem-vindo de volta
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Acesse sua conta para gerenciar suas cotações
          </p>
        </div>

        <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none dark:bg-slate-800/50 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Entrar</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Usuário</Label>
                <Input
                  id="username"
                  className="h-11"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Seu usuário"
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  className="h-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <Button type="submit" className="w-full h-11 text-base font-semibold transition-all hover:shadow-lg hover:shadow-primary/25" disabled={loading}>
                {loading ? "Processando..." : "Acessar Conta"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 border-t border-slate-100 dark:border-slate-700 pt-6">
            <div className="text-sm text-center text-slate-600 dark:text-slate-400">
              Ainda não tem uma conta?{" "}
              <Link href="/register" className="font-semibold text-primary hover:text-primary/80 transition-colors">
                Cadastre-se agora
              </Link>
            </div>
          </CardFooter>
        </Card>
        
        <p className="text-center text-xs text-slate-400 px-8">
          Ao entrar, você concorda com nossos Termos de Serviço e Política de Privacidade.
        </p>
      </div>
    </div>
  );
}
