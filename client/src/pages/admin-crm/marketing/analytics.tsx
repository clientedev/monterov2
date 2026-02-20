import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Users,
    TrendingUp,
    MousePointerClick,
    BadgeDollarSign,
    ArrowUpRight,
    ArrowDownRight
} from "lucide-react";

export default function AnalyticsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-display font-bold text-gray-900">Resultados de Marketing</h2>
                <p className="text-muted-foreground mt-1">Visão geral do desempenho das suas campanhas.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KPICard
                    title="Total de Leads"
                    value="127"
                    trend="+12%"
                    trendUp={true}
                    icon={Users}
                    description="Novos leads este mês"
                />
                <KPICard
                    title="Taxa de Conversão"
                    value="3.2%"
                    trend="+0.4%"
                    trendUp={true}
                    icon={TrendingUp}
                    description="Média geral"
                />
                <KPICard
                    title="Custo por Lead"
                    value="R$ 45,20"
                    trend="-R$ 2,50"
                    trendUp={true}
                    icon={BadgeDollarSign}
                    description="Otimização de custos"
                />
                <KPICard
                    title="Cliques Totais"
                    value="1,429"
                    trend="-5%"
                    trendUp={false}
                    icon={MousePointerClick}
                    description="Tráfego de anúncios"
                />
            </div>

            {/* Placeholder for Charts */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 premium-card border-none shadow-md">
                    <CardHeader>
                        <CardTitle>Crescimento de Leads</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[200px] flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg bg-gray-50/50">
                            Gráfico de Crescimento (Em breve)
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3 premium-card border-none shadow-md">
                    <CardHeader>
                        <CardTitle>Leads por Origem</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px] flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg bg-gray-50/50">
                            Gráfico de Pizza (Em breve)
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function KPICard({ title, value, trend, trendUp, icon: Icon, description }: any) {
    return (
        <Card className="premium-card border-none shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${trendUp ? 'bg-green-100/50' : 'bg-red-100/50'}`}>
                    <Icon className={`h-4 w-4 ${trendUp ? 'text-green-600' : 'text-red-600'}`} />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-gray-900">{value}</div>
                <div className="flex items-center gap-1 mt-1">
                    {trendUp ? (
                        <ArrowUpRight className="h-3 w-3 text-green-600" />
                    ) : (
                        <ArrowDownRight className="h-3 w-3 text-red-600" />
                    )}
                    <span className={`text-xs font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
                        {trend}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                        {description}
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}
