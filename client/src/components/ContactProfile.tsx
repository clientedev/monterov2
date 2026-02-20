import { useQuery } from "@tanstack/react-query";
import { Contact, Interaction, Lead, Task } from "@shared/schema";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    User,
    Building,
    Mail,
    Phone,
    MapPin,
    FileText,
    History,
    CheckSquare,
    TrendingUp,
    Loader2
} from "lucide-react";

interface ContactProfileProps {
    contactId: number | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ContactProfile({ contactId, open, onOpenChange }: ContactProfileProps) {
    const { data: contact, isLoading: contactLoading } = useQuery<Contact>({
        queryKey: [`/api/contacts/${contactId}`],
        enabled: !!contactId,
    });

    const { data: interactions, isLoading: interactionsLoading } = useQuery<Interaction[]>({
        queryKey: [`/api/interactions?contactId=${contactId}`],
        enabled: !!contactId,
    });

    const { data: leads, isLoading: leadsLoading } = useQuery<Lead[]>({
        queryKey: [`/api/leads?contactId=${contactId}`],
        enabled: !!contactId,
    });

    const { data: tasks, isLoading: tasksLoading } = useQuery<Task[]>({
        queryKey: [`/api/tasks?contactId=${contactId}`],
        enabled: !!contactId,
    });

    if (!contactId) return null;

    const isLoading = contactLoading || interactionsLoading || leadsLoading || tasksLoading;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-2xl w-full p-0 flex flex-col gap-0 border-none">
                {isLoading ? (
                    <div className="flex h-full items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : contact ? (
                    <>
                        <div className="p-6 bg-slate-50 border-b">
                            <SheetHeader className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className={`h-16 w-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg
                                        ${contact.type === 'individual' ? 'bg-primary' : 'bg-secondary'}
                                    `}>
                                        {contact.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="space-y-1">
                                        <SheetTitle className="text-2xl font-display font-bold text-gray-900">
                                            {contact.name}
                                        </SheetTitle>
                                        <Badge variant="secondary" className="rounded-full px-3 py-0.5 font-bold text-[10px] uppercase tracking-wider">
                                            {contact.type === 'individual' ? (
                                                <><User className="h-3 w-3 mr-1" /> Pessoa Física</>
                                            ) : (
                                                <><Building className="h-3 w-3 mr-1" /> Pessoa Jurídica</>
                                            )}
                                        </Badge>
                                    </div>
                                </div>
                            </SheetHeader>
                        </div>

                        <ScrollArea className="flex-1">
                            <div className="p-6 space-y-8">
                                {/* Informações Básicas */}
                                <section className="space-y-4">
                                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                        <FileText className="h-4 w-4" /> Informações de Contato
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Card className="border-none bg-slate-50/50">
                                            <CardContent className="p-4 flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-primary">
                                                    <Mail className="h-5 w-5" />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase">E-mail</p>
                                                    <p className="text-sm font-medium text-gray-900">{contact.email || "Não informado"}</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                        <Card className="border-none bg-slate-50/50">
                                            <CardContent className="p-4 flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-primary">
                                                    <Phone className="h-5 w-5" />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Telefone</p>
                                                    <p className="text-sm font-medium text-gray-900">{contact.phone || "Não informado"}</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                        <Card className="border-none bg-slate-50/50">
                                            <CardContent className="p-4 flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-primary">
                                                    <FileText className="h-5 w-5" />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase">{contact.type === 'individual' ? 'CPF' : 'CNPJ'}</p>
                                                    <p className="text-sm font-medium text-gray-900">{contact.document || "Não informado"}</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                        <Card className="border-none bg-slate-50/50 md:col-span-2">
                                            <CardContent className="p-4 flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-primary">
                                                    <MapPin className="h-5 w-5" />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Endereço</p>
                                                    <p className="text-sm font-medium text-gray-900">{contact.address || "Não informado"}</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </section>

                                {/* Tabs para Histórico */}
                                <Tabs defaultValue="interactions" className="w-full">
                                    <TabsList className="w-full justify-start bg-slate-100/50 p-1 h-12 rounded-xl mb-6">
                                        <TabsTrigger value="interactions" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                            <History className="h-4 w-4 mr-2" /> Histórico
                                        </TabsTrigger>
                                        <TabsTrigger value="leads" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                            <TrendingUp className="h-4 w-4 mr-2" /> Negócios (Leads)
                                        </TabsTrigger>
                                        <TabsTrigger value="tasks" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                            <CheckSquare className="h-4 w-4 mr-2" /> Tarefas
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="interactions" className="space-y-4">
                                        {interactions && interactions.length > 0 ? (
                                            <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                                                {interactions.map((interaction) => (
                                                    <div key={interaction.id} className="relative">
                                                        <div className="absolute -left-[19px] top-1.5 h-4 w-4 rounded-full border-2 border-white bg-primary shadow-sm" />
                                                        <div className="space-y-1">
                                                            <div className="flex items-center justify-between">
                                                                <p className="text-sm font-bold text-gray-900 capitalize italic">
                                                                    {interaction.type === 'call' ? '📞 Ligação' :
                                                                        interaction.type === 'email' ? '📧 E-mail' :
                                                                            interaction.type === 'meeting' ? '🤝 Reunião' : '📝 Nota'}
                                                                </p>
                                                                <time className="text-[10px] font-bold text-gray-400 uppercase">
                                                                    {interaction.date ? format(new Date(interaction.date), "dd 'de' MMM, yyyy 'às' HH:mm", { locale: ptBR }) : '-'}
                                                                </time>
                                                            </div>
                                                            <p className="text-sm text-gray-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                                {interaction.description}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-center py-8 text-sm text-muted-foreground italic">
                                                Nenhuma interação registrada.
                                            </p>
                                        )}
                                    </TabsContent>

                                    <TabsContent value="leads" className="space-y-4">
                                        {leads && leads.length > 0 ? (
                                            <div className="grid gap-3">
                                                {leads.map((lead) => (
                                                    <Card key={lead.id} className="shadow-none border-slate-100 hover:border-primary/20 transition-colors">
                                                        <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
                                                            <div className="space-y-1">
                                                                <CardTitle className="text-sm font-bold">Lead #{lead.id}</CardTitle>
                                                                <p className="text-xs text-muted-foreground">Fonte: {lead.source || 'Não informada'}</p>
                                                            </div>
                                                            <Badge className="rounded-full font-bold uppercase text-[9px]">
                                                                {lead.status}
                                                            </Badge>
                                                        </CardHeader>
                                                        <CardContent className="px-4 pb-4">
                                                            <p className="text-sm font-bold text-primary">{lead.value || '—'}</p>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-center py-8 text-sm text-muted-foreground italic">
                                                Nenhum lead associado.
                                            </p>
                                        )}
                                    </TabsContent>

                                    <TabsContent value="tasks" className="space-y-4">
                                        {tasks && tasks.length > 0 ? (
                                            <div className="grid gap-3">
                                                {tasks.map((task) => (
                                                    <Card key={task.id} className="shadow-none border-slate-100">
                                                        <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
                                                            <div className="space-y-1">
                                                                <CardTitle className="text-sm font-bold">{task.title}</CardTitle>
                                                                {task.dueDate && (
                                                                    <p className="text-xs text-muted-foreground">
                                                                        Vencimento: {format(new Date(task.dueDate), "dd/MM/yyyy")}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <Badge variant={task.status === 'done' ? 'default' : 'outline'} className="rounded-full font-bold uppercase text-[9px]">
                                                                {task.status}
                                                            </Badge>
                                                        </CardHeader>
                                                    </Card>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-center py-8 text-sm text-muted-foreground italic">
                                                Nenhuma tarefa pendente.
                                            </p>
                                        )}
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </ScrollArea>
                    </>
                ) : (
                    <div className="flex h-full items-center justify-center p-6 text-center">
                        <p className="text-muted-foreground">Não foi possível carregar os dados do contato.</p>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
