import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Loader2, ShieldCheck, Users, AlertTriangle, XCircle, Calendar,
    DollarSign, RefreshCw, Building2, Package, Clock, Ban, ArrowRight,
    TrendingUp, CheckCircle2,
} from "lucide-react";
import {
    BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { useLocation } from "wouter";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Apolice, Cliente } from "@shared/schema";

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

    const { data: stats, isLoading: loadingStats } = useQuery<DashboardStats>({
        queryKey: ["/api/seguros/dashboard"],
    });

    const { data: apolices } = useQuery<Apolice[]>({
        queryKey: ["/api/apolices"],
    });

    const { data: clientes } = useQuery<Cliente[]>({
        queryKey: ["/api/clientes"],
    });

    if (loadingStats) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    const valorFormatado = parseFloat(stats?.valorTotal || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    const totalApolices = (stats?.totalAtivas || 0) + (stats?.totalEmAtraso || 0) + (stats?.totalVencidas || 0) + (stats?.totalCanceladas || 0);

    const porStatusData = (stats?.porStatus || []).map(s => ({
        name: STATUS_LABELS[s.status] || s.status,
        value: s.total,
        color: STATUS_COLORS[s.status] || "#6b7280",
    }));

    const getClienteNome = (id: number) => clientes?.find(c => c.id === id)?.nome || "—";

    const now = new Date();
    const in30 = new Date(now); in30.setDate(in30.getDate() + 30);

    // Políticas em atraso
    const emAtrasoList = (apolices || [])
        .filter(a => a.status === "em_atraso")
        .slice(0, 8);

    // Políticas ativas vencendo em até 30 dias
    const vencendo30List = (apolices || [])
        .filter(a => {
            if (a.status !== "ativa" || !a.fimVigencia) return false;
            const fim = new Date(a.fimVigencia);
            fim.setHours(23, 59, 59, 999);
            return fim >= now && fim <= in30;
        })
        .sort((a, b) => new Date(a.fimVigencia!).getTime() - new Date(b.fimVigencia!).getTime())
        .slice(0, 8);

    const totalUrgente = emAtrasoList.length + vencendo30List.length;

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

            {/* ── Principais Indicadores ── */}
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-none shadow-md bg-gradient-to-br from-emerald-500 to-teal-700 text-white cursor-pointer hover:scale-[1.02] transition-transform"
                    onClick={() => setLocation("/admin/apolices")}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-emerald-100">Apólices Ativas</CardTitle>
                        <ShieldCheck className="h-6 w-6 text-emerald-100" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black">{stats?.totalAtivas || 0}</div>
                        <p className="text-xs text-emerald-100 mt-1 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Em vigência regular
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-gradient-to-br from-[#0F6570] to-[#08454c] text-white cursor-pointer hover:scale-[1.02] transition-transform"
                    onClick={() => setLocation("/admin/clientes")}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-teal-100">Total de Clientes</CardTitle>
                        <Users className="h-6 w-6 text-teal-100" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black">{stats?.totalClientes || 0}</div>
                        <p className="text-xs text-teal-100 mt-1 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" /> Base de segurados
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-gradient-to-br from-amber-500 to-orange-600 text-white cursor-pointer hover:scale-[1.02] transition-transform"
                    onClick={() => setLocation("/admin/apolices")}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-amber-100">Valor em Carteira</CardTitle>
                        <DollarSign className="h-6 w-6 text-amber-100" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black leading-tight">R$ {valorFormatado}</div>
                        <p className="text-xs text-amber-100 mt-1 flex items-center gap-1">
                            <DollarSign className="h-3 w-3" /> Soma dos prêmios ativos
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-gradient-to-br from-indigo-600 to-purple-700 text-white cursor-pointer hover:scale-[1.02] transition-transform"
                    onClick={() => setLocation("/admin/apolices")}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-indigo-100">Renovações Este Mês</CardTitle>
                        <RefreshCw className="h-6 w-6 text-indigo-100" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black">{stats?.renovacaoMes || 0}</div>
                        <p className="text-xs text-indigo-100 mt-1 flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Vencimentos no mês atual
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* ── Barra de Alertas de Status ── */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <Card className="border-l-4 border-l-red-500 shadow-sm bg-white cursor-pointer hover:bg-red-50 transition-colors"
                    onClick={() => setLocation("/admin/apolices?status=em_atraso")}>
                    <CardContent className="pt-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-muted-foreground uppercase font-bold">Em Atraso</p>
                            <p className="text-3xl font-black text-red-600 mt-1">{stats?.totalEmAtraso || 0}</p>
                            <p className="text-xs text-red-400 mt-0.5">Ação imediata</p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                            <Clock className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-gray-400 shadow-sm bg-white cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setLocation("/admin/apolices?status=vencida")}>
                    <CardContent className="pt-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-muted-foreground uppercase font-bold">Vencidas</p>
                            <p className="text-3xl font-black text-gray-600 mt-1">{stats?.totalVencidas || 0}</p>
                            <p className="text-xs text-gray-400 mt-0.5">Renovar ou cancelar</p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                            <XCircle className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-slate-400 shadow-sm bg-white cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => setLocation("/admin/apolices?status=cancelada")}>
                    <CardContent className="pt-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-muted-foreground uppercase font-bold">Canceladas</p>
                            <p className="text-3xl font-black text-slate-600 mt-1">{stats?.totalCanceladas || 0}</p>
                            <p className="text-xs text-slate-400 mt-0.5">Encerradas</p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                            <Ban className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500 shadow-sm bg-white cursor-pointer hover:bg-orange-50 transition-colors"
                    onClick={() => setLocation("/admin/apolices")}>
                    <CardContent className="pt-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-muted-foreground uppercase font-bold">Vencendo em 30d</p>
                            <p className="text-3xl font-black text-orange-600 mt-1">{stats?.vencendo30 || 0}</p>
                            <p className="text-xs text-orange-400 mt-0.5">Entrar em contato</p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-yellow-500 shadow-sm bg-white cursor-pointer hover:bg-yellow-50 transition-colors"
                    onClick={() => setLocation("/admin/apolices")}>
                    <CardContent className="pt-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-muted-foreground uppercase font-bold">Vencendo em 60d</p>
                            <p className="text-3xl font-black text-yellow-600 mt-1">{stats?.vencendo60 || 0}</p>
                            <p className="text-xs text-yellow-500 mt-0.5">Acompanhar</p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                            <Calendar className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ── Pendências Urgentes ── */}
            {totalUrgente > 0 && (
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Em Atraso */}
                    {emAtrasoList.length > 0 && (
                        <Card className="shadow-md border-none bg-white">
                            <CardHeader className="pb-3 flex flex-row items-center justify-between">
                                <CardTitle className="text-sm font-bold text-red-700 uppercase tracking-wider flex items-center gap-2">
                                    <Clock className="h-4 w-4" /> Em Atraso ({emAtrasoList.length})
                                </CardTitle>
                                <button
                                    onClick={() => setLocation("/admin/apolices?status=em_atraso")}
                                    className="text-xs text-red-600 hover:underline flex items-center gap-1">
                                    Ver todos <ArrowRight className="h-3 w-3" />
                                </button>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-gray-100">
                                    {emAtrasoList.map(a => (
                                        <div
                                            key={a.id}
                                            className="flex items-center justify-between px-5 py-3 hover:bg-red-50 cursor-pointer transition-colors"
                                            onClick={() => setLocation(`/admin/clientes/${a.clienteId}`)}>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-sm text-gray-900 truncate">{getClienteNome(a.clienteId)}</p>
                                                <p className="text-xs text-gray-500 truncate">{a.numeroApolice || "Sem número"}</p>
                                            </div>
                                            <div className="text-right flex-shrink-0 ml-3">
                                                {a.premio && (
                                                    <p className="text-sm font-bold text-gray-800">
                                                        R$ {parseFloat(a.premio).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                                    </p>
                                                )}
                                                <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                                                    Em Atraso
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Vencendo em 30 dias */}
                    {vencendo30List.length > 0 && (
                        <Card className="shadow-md border-none bg-white">
                            <CardHeader className="pb-3 flex flex-row items-center justify-between">
                                <CardTitle className="text-sm font-bold text-orange-700 uppercase tracking-wider flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4" /> Vencendo em 30d ({vencendo30List.length})
                                </CardTitle>
                                <button
                                    onClick={() => setLocation("/admin/apolices")}
                                    className="text-xs text-orange-600 hover:underline flex items-center gap-1">
                                    Ver todos <ArrowRight className="h-3 w-3" />
                                </button>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-gray-100">
                                    {vencendo30List.map(a => {
                                        const fim = new Date(a.fimVigencia!);
                                        fim.setHours(23, 59, 59, 999);
                                        const dias = differenceInDays(fim, new Date());
                                        return (
                                            <div
                                                key={a.id}
                                                className="flex items-center justify-between px-5 py-3 hover:bg-orange-50 cursor-pointer transition-colors"
                                                onClick={() => setLocation(`/admin/clientes/${a.clienteId}`)}>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-sm text-gray-900 truncate">{getClienteNome(a.clienteId)}</p>
                                                    <p className="text-xs text-gray-500">
                                                        Vence: {format(new Date(a.fimVigencia!), "dd/MM/yyyy", { locale: ptBR })}
                                                    </p>
                                                </div>
                                                <div className="text-right flex-shrink-0 ml-3">
                                                    {a.premio && (
                                                        <p className="text-sm font-bold text-gray-800">
                                                            R$ {parseFloat(a.premio).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                                        </p>
                                                    )}
                                                    <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-xs font-bold border ${
                                                        dias <= 7
                                                            ? "bg-red-100 text-red-700 border-red-200"
                                                            : dias <= 15
                                                                ? "bg-orange-100 text-orange-700 border-orange-200"
                                                                : "bg-yellow-100 text-yellow-700 border-yellow-200"
                                                    }`}>
                                                        {dias === 0 ? "Vence hoje" : `${dias}d`}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Mensagem quando não há pendências */}
            {totalUrgente === 0 && (apolices?.length || 0) > 0 && (
                <Card className="shadow-sm border-emerald-200 bg-emerald-50">
                    <CardContent className="pt-5 flex items-center gap-3 text-emerald-700">
                        <CheckCircle2 className="h-6 w-6 text-emerald-500 flex-shrink-0" />
                        <div>
                            <p className="font-semibold text-sm">Carteira em dia!</p>
                            <p className="text-xs text-emerald-600">Nenhuma apólice em atraso ou vencendo nos próximos 30 dias.</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ── Gráficos ── */}
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
                                    <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <YAxis type="category" dataKey="nome" fontSize={11} tickLine={false} axisLine={false} width={100} />
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
                            <ShieldCheck className="h-4 w-4 text-emerald-600" /> Distribuição por Status
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
                                <div className="flex flex-col gap-2 w-full mt-2">
                                    {porStatusData.map((p, i) => (
                                        <div key={i} className="flex items-center justify-between text-xs font-semibold text-gray-700">
                                            <div className="flex items-center gap-2">
                                                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                                                <span>{p.name}</span>
                                            </div>
                                            <span className="font-black text-gray-900">{p.value}</span>
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
                                <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
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
