import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { ShieldCheck, Eye, EyeOff, ArrowLeft, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [, setLocation] = useLocation();
  const { loginMutation, user } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      setLocation("/admin");
    }
  }, [user, setLocation]);

  if (user) {
    return null;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(
      { username, password },
      {
        onSuccess: () => setLocation("/admin"),
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0a0c10]">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] opacity-50" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px] opacity-30" />

      {/* Animated subtle grid overlay */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />

      <div className="w-full max-w-[450px] px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/10 border border-white/5 mb-6 shadow-2xl">
            <ShieldCheck className="h-10 w-10 text-gold shadow-sm" />
          </div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight mb-2">
            Monteiro <span className="text-gold">Seguros</span>
          </h1>
          <p className="text-gray-400 font-medium">
            Área do Cliente
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="border-white/5 bg-white/5 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-[2rem] overflow-hidden">
            <CardContent className="p-8">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-gray-300 font-semibold ml-1">Usuário</Label>
                  <div className="relative group">
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Identificação do usuário"
                      required
                      className="h-12 bg-white/5 border-white/10 rounded-xl px-4 text-white placeholder:text-gray-600 focus:border-primary/50 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <Label htmlFor="password" university-font className="text-gray-300 font-semibold">Senha</Label>
                    <button type="button" className="text-xs text-primary hover:text-primary/80 font-bold transition-colors">
                      Esqueceu a senha?
                    </button>
                  </div>
                  <div className="relative group">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Sua chave de acesso"
                      required
                      className="h-12 bg-white/5 border-white/10 rounded-xl px-4 pr-12 text-white placeholder:text-gray-600 focus:border-primary/50 focus:ring-primary/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold text-lg rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] mt-4"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Entrando...</span>
                    </div>
                  ) : "Entrar na Conta"}
                </Button>
              </form>

              <div className="mt-8 pt-6 border-t border-white/5 flex flex-col gap-4">
                <Link href="/">
                  <Button variant="ghost" className="w-full text-gray-400 hover:text-white hover:bg-white/5 font-semibold rounded-xl gap-2 h-11">
                    <ArrowLeft size={16} />
                    Voltar para o site principal
                  </Button>
                </Link>
                <div className="flex items-center justify-center gap-2 text-xs text-gray-600 font-medium">
                  <MessageSquare size={12} />
                  <span>Precisa de ajuda? Fale conosco</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <p className="text-center mt-10 text-gray-600 text-sm font-medium">
          &copy; {new Date().getFullYear()} Monteiro Seguros. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
