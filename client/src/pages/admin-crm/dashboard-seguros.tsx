import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShieldCheck, Users, AlertTriangle, XCircle, Calendar, DollarSign, RefreshCw, Building2, Package, Clock, Ban } from "lucide-react";
import {
    BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { useLocation } from "wouter";

interface DashboardStats {
    totalAtivas: number;
    totalClientes: number;
    totalVencidas: number;
    totalEmAtraso: number;
    totalCanceladas: number;
    vencendo30: number;
    vencendo60: number;
    valorTotal: string;
    renovacaoMes: number;
    porSeguradora: { nome: string; total: number }[];
    porProduto: { nome: string; total: number }[];
    porStatus: { status: string; total: number }[];
}

const STATUS_COLORS: Record<string, string> = {
    ativa: "#10b981",
    em_atraso: "#ef4444",
    vencida: "#6b7280",
    cancelada: "#9ca3af",
    pendente: "#f59e0b",
};

const STATUS_LABELS: Record<string, string> = {
    ativa: "Ativa",
    em_atraso: "Em Atraso",
    vencida: "Vencida",
    cancelada: "Cancelada",
    pendente: "Pendente",
};

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

    const totalApolices = (stats?.totalAtivas || 0) + (stats?.totalEmAtraso || 0) + (stats?.totalVencidas || 0) + (stats?.totalCanceladas || 0);

    const porStatusData = (stats?.porStatus || []).map(s => ({
        name: STATUS_LABELS[s.status] || s.status,
        value: s.total,
        color: STATUS_COLORS[s.status] || "#6b7280",
    }));

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-display font-bold text-gray-900">Dashboard de Carteira de Seguros</h2>
                    <p className="text-muted-foreground mt-1">
                        Visão geral dos indicadores — {totalApolices} apólice(s) no total.
                    </p>
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

            {/* Status Alert Bar */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <Card className="border-l-4 border-l-red-500 shadow-sm bg-white cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setLocation("/admin/apolices?status=em_atraso")}>
                    <CardContent className="pt-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-muted-foreground uppercase font-bold">Em Atraso</p>
                            <p className="text-2xl font-bold text-red-600 mt-1">{stats?.totalEmAtraso || 0}</p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                            <Clock className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-gray-400 shadow-sm bg-white cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setLocation("/admin/apolices?status=vencida")}>
                    <CardContent className="pt-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-muted-foreground uppercase font-bold">Vencidas</p>
                            <p className="text-2xl font-bold text-gray-600 mt-1">{stats?.totalVencidas || 0}</p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                            <XCircle className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-slate-400 shadow-sm bg-white cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setLocation("/admin/apolices?status=cancelada")}>
                    <CardContent className="pt-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-muted-foreground uppercase font-bold">Canceladas</p>
                            <p className="text-2xl font-bold text-slate-600 mt-1">{stats?.totalCanceladas || 0}</p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                            <Ban className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500 shadow-sm bg-white cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setLocation("/admin/apolices")}>
                    <CardContent className="pt-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-muted-foreground uppercase font-bold">Vencendo em 30d</p>
                            <p className="text-2xl font-bold text-orange-600 mt-1">{stats?.vencendo30 || 0}</p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-yellow-500 shadow-sm bg-white cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setLocation("/admin/apolices")}>
                    <CardContent className="pt-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-muted-foreground uppercase font-bold">Vencendo em 60d</p>
                            <p className="text-2xl font-bold text-yellow-600 mt-1">{stats?.vencendo60 || 0}</p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                            <Calendar className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Seguradoras Bar Chart */}
                <Card className="shadow-md border-none bg-white lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-[#0F6570]" /> Apólices por Seguradora
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {(stats?.porSeguradora.length || 0) === 0 ? (
                            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">Sem dados cadastrados.</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <ReBarChart data={stats?.porSeguradora} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                    <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis type="category" dataKey="nome" fontSize={11} tickLine={false} axisLine={false} width={90} />
                                    <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                                    <Bar dataKey="total" fill="#0F6570" radius={[0, 4, 4, 0]} name="Apólices" />
                                </ReBarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Status Pie Chart */}
                <Card className="shadow-md border-none bg-white">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-emerald-600" /> Apólices por Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] flex flex-col items-center justify-center">
                        {porStatusData.length === 0 ? (
                            <div className="text-muted-foreground text-sm">Sem dados cadastrados.</div>
                        ) : (
                            <>
                                <ResponsiveContainer width="100%" height={180}>
                                    <PieChart>
                                        <Pie data={porStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                                            {porStatusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: "8px", border: "none" }} formatter={(val: any, name: any) => [val, name]} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="flex flex-col gap-1.5 w-full mt-1">
                                    {porStatusData.map((p, i) => (
                                        <div key={i} className="flex items-center justify-between text-xs font-semibold text-gray-700">
                                            <div className="flex items-center gap-2">
                                                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                                                <span>{p.name}</span>
                                            </div>
                                            <span>{p.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Produtos Chart */}
            {(stats?.porProduto.length || 0) > 0 && (
                <Card className="shadow-md border-none bg-white">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                            <Package className="h-4 w-4 text-emerald-600" /> Apólices por Produto
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ReBarChart data={stats?.porProduto}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="nome" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis fontSize={11} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                                <Bar dataKey="total" radius={[4, 4, 0, 0]} name="Apólices">
                                    {stats?.porProduto.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </ReBarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
