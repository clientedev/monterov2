import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Contact, Lead } from "@shared/schema";
import { Users, TrendingUp, DollarSign, ArrowUpRight, BarChart } from "lucide-react";

export default function AdminDashboard() {
    const { data: contacts } = useQuery<Contact[]>({ queryKey: ["/api/contacts"] });
    const { data: leads } = useQuery<Lead[]>({ queryKey: ["/api/leads"] });

    const totalContacts = contacts?.length || 0;
    const activeLeads = leads?.filter(l => l.status !== "closed" && l.status !== "lost").length || 0;
    const totalValue = 0; // leads?.reduce((acc, curr) => acc + Number(curr.value || 0), 0) || 0;

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
                            <div className="text-4xl font-display font-bold text-slate-900">R$ {totalValue}</div>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Potencial de conversão imediato</p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions or Secondary Info */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* This could be filled with more specific data later */}
            </div>
        </div>
    );
}
