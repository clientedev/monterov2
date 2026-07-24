import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShieldCheck, Users, AlertTriangle, XCircle, Calendar, DollarSign, RefreshCw, Building2, Package } from "lucide-react";
import {
    BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { useLocation } from "wouter";

interface DashboardStats {
    totalAtivas: number;
    totalClientes: number;
    totalVencidas: number;
    vencendo30: number;
    vencendo60: number;
    valorTotal: string;
    renovacaoMes: number;
    porSeguradora: { nome: string; total: number }[];
    porProduto: { nome: string; total: number }[];
}

const COLORS = ["#0F6570", "#08454c", "#c65f54", "#f59e0b", "#10b981", "#6366f1", "#ec4899", "#8b5cf6"];

export default function DashboardSegurosPage() {
    const [, setLocation] = useLocation();

    const { data: stats, isLoading } = useQuery<DashboardStats>({
        queryKey: ["/api/seguros/dashboard"],
    });

    if (isLoading) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    const valorFormatado = parseFloat(stats?.valorTotal || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2 });

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-display font-bold text-gray-900">Dashboard de Carteira de Seguros</h2>
                    <p className="text-muted-foreground mt-1">Visão geral dos indicadores de apólices, vigências e renovações.</p>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-none shadow-md bg-gradient-to-br from-emerald-500 to-teal-700 text-white cursor-pointer hover:scale-[1.02] transition-transform"
                    onClick={() => setLocation("/admin/apolices")}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-emerald-100">Apólices Ativas</CardTitle>
                        <ShieldCheck className="h-6 w-6 text-emerald-100" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black">{stats?.totalAtivas || 0}</div>
                        <p className="text-xs text-emerald-100 mt-1">Em vigência regular</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-gradient-to-br from-[#0F6570] to-[#08454c] text-white cursor-pointer hover:scale-[1.02] transition-transform"
                    onClick={() => setLocation("/admin/clientes")}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-teal-100">Total de Clientes</CardTitle>
                        <Users className="h-6 w-6 text-teal-100" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black">{stats?.totalClientes || 0}</div>
                        <p className="text-xs text-teal-100 mt-1">Base de segurados cadastrada</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-gradient-to-br from-amber-500 to-orange-600 text-white cursor-pointer hover:scale-[1.02] transition-transform"
                    onClick={() => setLocation("/admin/apolices")}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-amber-100">Valor em Carteira</CardTitle>
                        <DollarSign className="h-6 w-6 text-amber-100" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black">R$ {valorFormatado}</div>
                        <p className="text-xs text-amber-100 mt-1">Soma dos prêmios ativos</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-gradient-to-br from-indigo-600 to-purple-700 text-white cursor-pointer hover:scale-[1.02] transition-transform"
                    onClick={() => setLocation("/admin/apolices")}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-indigo-100">Renovação Prevista (Mês)</CardTitle>
                        <RefreshCw className="h-6 w-6 text-indigo-100" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black">{stats?.renovacaoMes || 0}</div>
                        <p className="text-xs text-indigo-100 mt-1">Vencimentos este mês</p>
                    </CardContent>
                </Card>
            </div>

            {/* Alerts Bar */}
            <div className="grid gap-5 md:grid-cols-3">
                <Card className="border-l-4 border-l-red-500 shadow-sm bg-white cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setLocation("/admin/apolices")}>
                    <CardContent className="pt-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-muted-foreground uppercase font-bold">Já Vencidas</p>
                            <p className="text-2xl font-bold text-red-600 mt-1">{stats?.totalVencidas || 0}</p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                            <XCircle className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500 shadow-sm bg-white cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setLocation("/admin/apolices")}>
                    <CardContent className="pt-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-muted-foreground uppercase font-bold">Vencendo em 30 Dias</p>
                            <p className="text-2xl font-bold text-orange-600 mt-1">{stats?.vencendo30 || 0}</p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-yellow-500 shadow-sm bg-white cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setLocation("/admin/apolices")}>
                    <CardContent className="pt-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-muted-foreground uppercase font-bold">Vencendo em 60 Dias</p>
                            <p className="text-2xl font-bold text-yellow-600 mt-1">{stats?.vencendo60 || 0}</p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                            <Calendar className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Seguradoras Chart */}
                <Card className="shadow-md border-none bg-white">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-[#0F6570]" /> Apólices por Seguradora
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {stats?.porSeguradora.length === 0 ? (
                            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">Sem dados cadastrados.</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <ReBarChart data={stats?.porSeguradora}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="nome" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={11} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                                    <Bar dataKey="total" fill="#0F6570" radius={[4, 4, 0, 0]} name="Apólices" />
                                </ReBarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Produtos Chart */}
                <Card className="shadow-md border-none bg-white">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                            <Package className="h-4 w-4 text-emerald-600" /> Apólices por Produto
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center">
                        {stats?.porProduto.length === 0 ? (
                            <div className="text-muted-foreground text-sm">Sem dados cadastrados.</div>
                        ) : (
                            <div className="w-full h-full flex items-center">
                                <ResponsiveContainer width="60%" height="100%">
                                    <PieChart>
                                        <Pie data={stats?.porProduto} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="total">
                                            {stats?.porProduto.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: "8px", border: "none" }} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="flex flex-col gap-2 ml-4">
                                    {stats?.porProduto.map((p, i) => (
                                        <div key={i} className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                                            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                            <span>{p.nome}: {p.total}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
