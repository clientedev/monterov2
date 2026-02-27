import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Contact, Lead, Interaction, Task, User } from "@shared/schema";
import { Users, TrendingUp, DollarSign, ArrowUpRight, BarChart, CheckSquare, MessageSquare, Target, PieChart as PieChartIcon, Activity } from "lucide-react";
import {
    BarChart as ReBarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area
} from 'recharts';

export default function AdminDashboard() {
    const { data: contacts } = useQuery<Contact[]>({ queryKey: ["/api/contacts"] });
    const { data: leads } = useQuery<Lead[]>({ queryKey: ["/api/leads"] });
    const { data: interactionHistory } = useQuery<Interaction[]>({ queryKey: ["/api/interactions"] });
    const { data: tasks } = useQuery<Task[]>({ queryKey: ["/api/tasks"] });
    const { data: prospectingHistory } = useQuery<any[]>({ queryKey: ["/api/prospecting"] });
    const { data: users } = useQuery<User[]>({ queryKey: ["/api/users"] });

    const totalContacts = contacts?.length || 0;
    const activeLeads = leads?.filter(l => l.status !== "closed" && l.status !== "lost").length || 0;
    const totalValue = leads?.reduce((acc, curr) => acc + Number(curr.value || 0), 0) || 0;
    const pendingTasks = tasks?.filter(t => t.status !== "done").length || 0;

    const conversionRate = totalContacts > 0 ? ((totalContacts / (totalContacts + activeLeads)) * 100).toFixed(1) : 0;

    const currentMonth = new Date().getMonth();
    const monthlyInteractions = interactionHistory?.filter(i => {
        if (!i.date) return false;
        return new Date(i.date).getMonth() === currentMonth;
    }).length || 0;

    // Chart Data 1: Prospecting by User
    const prospectingByUser = users?.map(u => ({
        name: u.name.split(' ')[0],
        count: prospectingHistory?.filter(p => p.userId === u.id).length || 0
    })).filter(d => d.count > 0) || [];

    // Chart Data 2: Lead Flow (Last 15 days)
    const last15Days = Array.from({ length: 15 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (14 - i));
        return d.toISOString().split('T')[0];
    });

    const leadFlowData = last15Days.map(date => ({
        date: date.split('-').slice(1).join('/'),
        count: leads?.filter(l => l.createdAt && new Date(l.createdAt).toISOString().split('T')[0] === date).length || 0
    }));

    // Chart Data 3: Interaction Types
    const typeDistribution = [
        { name: 'Chamadas', value: interactionHistory?.filter(i => i.type === 'call').length || 0, color: '#3b82f6' },
        { name: 'Emails', value: interactionHistory?.filter(i => i.type === 'email').length || 0, color: '#10b981' },
        { name: 'Reuniões', value: interactionHistory?.filter(i => i.type === 'meeting').length || 0, color: '#f59e0b' },
        { name: 'Notas', value: interactionHistory?.filter(i => i.type === 'note').length || 0, color: '#6366f1' },
    ].filter(d => d.value > 0);

    return (
        <div className="space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-4xl font-display font-bold text-slate-900 tracking-tight">Bem-vindo, Monteiro</h2>
                    <p className="text-slate-500 mt-2 text-lg font-medium">Aqui está um resumo do que aconteceu hoje em sua corretora.</p>
                </div>
                <div className="flex gap-2">
                    <div className="h-12 w-12 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors">
                        <BarChart className="h-5 w-5" />
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Contacts Card */}
                <Card className="premium-card border-none overflow-hidden group">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total de Contatos</CardTitle>
                        <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                            <Users className="h-5 w-5" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <div className="text-4xl font-display font-bold text-slate-900">{totalContacts}</div>
                            <span className="text-xs font-bold text-emerald-500 flex items-center">
                                <ArrowUpRight className="h-3 w-3 mr-0.5" /> +12%
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Crescimento constante este mês</p>
                    </CardContent>
                </Card>

                {/* Active Leads Card */}
                <Card className="premium-card border-none overflow-hidden group">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Leads no Funil</CardTitle>
                        <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors duration-300">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <div className="text-4xl font-display font-bold text-slate-900">{activeLeads}</div>
                            <span className="text-xs font-bold text-amber-500 flex items-center">
                                Em progresso
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Negociações em aberto no Pipeline</p>
                    </CardContent>
                </Card>

                {/* Pipeline Value Card */}
                <Card className="premium-card border-none overflow-hidden group">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Valor em Negociação</CardTitle>
                        <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                            <DollarSign className="h-5 w-5" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <div className="text-4xl font-display font-bold text-slate-900">R$ {totalValue.toLocaleString('pt-BR')}</div>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Potencial de conversão imediato</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="premium-card border-none overflow-hidden group">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Tarefas Pendentes</CardTitle>
                        <div className="h-10 w-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors duration-300">
                            <CheckSquare className="h-5 w-5" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-display font-bold text-slate-900">{pendingTasks}</div>
                        <p className="text-xs text-slate-400 mt-1">Acões necessárias no CRM</p>
                    </CardContent>
                </Card>

                <Card className="premium-card border-none overflow-hidden group">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Taxa de Conversão</CardTitle>
                        <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                            <Target className="h-5 w-5" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-display font-bold text-slate-900">{conversionRate}%</div>
                        <p className="text-xs text-slate-400 mt-1">Leads qualificados vs convertidos</p>
                    </CardContent>
                </Card>

                <Card className="premium-card border-none overflow-hidden group">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Interações (Mês)</CardTitle>
                        <div className="h-10 w-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
                            <MessageSquare className="h-5 w-5" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-display font-bold text-slate-900">{monthlyInteractions}</div>
                        <p className="text-xs text-slate-400 mt-1">Pontos de contato registrados</p>
                    </CardContent>
                </Card>
            </div>

            <div className="pt-6 border-t border-slate-200">
                <div className="flex items-center gap-2 mb-8">
                    <Activity className="h-6 w-6 text-amber-500" />
                    <h3 className="text-2xl font-display font-bold text-slate-900 tracking-tight text-white px-3 py-1 bg-slate-900 rounded-lg">Métricas de Performance</h3>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card className="premium-card border-none shadow-xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Users className="h-4 w-4 text-blue-500" />
                                Prospecção por Consultor
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <ReBarChart data={prospectingByUser}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Prospecções" />
                                </ReBarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="premium-card border-none shadow-xl lg:col-span-1">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-amber-500" />
                                Fluxo de Novos Leads (15d)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={leadFlowData}>
                                    <defs>
                                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                    <Area type="monotone" dataKey="count" stroke="#fbbf24" fillOpacity={1} fill="url(#colorCount)" name="Novos Leads" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="premium-card border-none shadow-xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <PieChartIcon className="h-4 w-4 text-purple-500" />
                                Mix de Atividades
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px] flex items-center justify-center">
                            <div className="w-full h-full flex items-center">
                                <ResponsiveContainer width="60%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={typeDistribution}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {typeDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="flex flex-col gap-2 ml-4">
                                    {typeDistribution.map((t, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: t.color }} />
                                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">{t.name}: {t.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
