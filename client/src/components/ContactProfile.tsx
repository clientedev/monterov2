import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Contact, Interaction, Lead, Task, InsertContact } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    Loader2,
    Edit2,
    Save,
    X,
    Calendar,
    Heart
} from "lucide-react";

interface ContactProfileProps {
    contactId: number | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ContactProfile({ contactId, open, onOpenChange }: ContactProfileProps) {
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);

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

    // Form edit state
    const [formData, setFormData] = useState({
        name: "",
        type: "individual",
        email: "",
        phone: "",
        document: "",
        address: "",
        anniversaryDate: "",
        maritalStatus: "",
        productType: "",
    });

    useEffect(() => {
        if (contact) {
            setFormData({
                name: contact.name || "",
                type: contact.type || "individual",
                email: contact.email || "",
                phone: contact.phone || "",
                document: contact.document || "",
                address: contact.address || "",
                anniversaryDate: contact.anniversaryDate || "",
                maritalStatus: contact.maritalStatus || "",
                productType: contact.productType || "",
            });
        }
    }, [contact]);

    const updateMutation = useMutation({
        mutationFn: async (data: Partial<InsertContact>) => {
            const res = await apiRequest("PATCH", `/api/contacts/${contactId}`, data);
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
            queryClient.invalidateQueries({ queryKey: [`/api/contacts/${contactId}`] });
            queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
            queryClient.invalidateQueries({ queryKey: ["/api/clientes"] });
            queryClient.invalidateQueries({ queryKey: ["/api/interactions"] });
            queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
            queryClient.invalidateQueries({ queryKey: ["/api/prospecting"] });
            toast({ title: "✅ Dados do contato atualizados e sincronizados com o sistema!" });
            setIsEditing(false);
        },
        onError: (err: any) => {
            toast({
                title: "Erro ao atualizar contato",
                description: err.message,
                variant: "destructive",
            });
        },
    });

    const handleSave = () => {
        if (!formData.name.trim()) {
            toast({ title: "Nome é obrigatório", variant: "destructive" });
            return;
        }
        updateMutation.mutate(formData as any);
    };

    if (!contactId) return null;

    const isLoading = contactLoading || interactionsLoading || leadsLoading || tasksLoading;

    return (
        <Sheet open={open} onOpenChange={(v) => {
            if (!v) setIsEditing(false);
            onOpenChange(v);
        }}>
            <SheetContent className="sm:max-w-2xl w-full p-0 flex flex-col gap-0 border-none shadow-2xl">
                {isLoading ? (
                    <div className="flex h-full items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : contact ? (
                    <>
                        <div className="p-6 bg-slate-50 border-b shrink-0">
                            <SheetHeader className="space-y-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4 min-w-0 flex-1">
                                        <div className={`h-16 w-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shrink-0
                                            ${contact.type === 'individual' ? 'bg-primary' : 'bg-secondary'}
                                        `}>
                                            {(formData.name || contact.name).charAt(0).toUpperCase()}
                                        </div>
                                        <div className="space-y-1 min-w-0 flex-1">
                                            <SheetTitle className="text-2xl font-display font-bold text-gray-900 truncate">
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

                                    <Button
                                        variant={isEditing ? "ghost" : "outline"}
                                        size="sm"
                                        onClick={() => setIsEditing(!isEditing)}
                                        className={`rounded-xl font-bold transition-all shrink-0 ${isEditing ? "text-rose-600 hover:bg-rose-50 border-rose-200" : "bg-white border-slate-200 hover:bg-slate-100 text-slate-700 shadow-sm"}`}
                                    >
                                        {isEditing ? (
                                            <><X className="h-4 w-4 mr-1.5" /> Cancelar</>
                                        ) : (
                                            <><Edit2 className="h-4 w-4 mr-1.5 text-primary" /> Editar Contato</>
                                        )}
                                    </Button>
                                </div>
                            </SheetHeader>
                        </div>

                        <ScrollArea className="flex-1">
                            <div className="p-6 space-y-8">
                                {/* Informações Básicas ou Formulário de Edição */}
                                <section className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                            <FileText className="h-4 w-4" /> Informações de Contato
                                        </h3>
                                        {isEditing && (
                                            <span className="text-xs text-primary font-bold bg-primary/10 px-2.5 py-1 rounded-full animate-pulse">
                                                Modo de Edição Ativo
                                            </span>
                                        )}
                                    </div>

                                    {isEditing ? (
                                        <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="md:col-span-2 space-y-1.5">
                                                    <Label className="text-xs font-bold text-slate-700">Nome Completo / Razão Social *</Label>
                                                    <Input
                                                        value={formData.name}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                                        placeholder="Nome do cliente"
                                                        className="rounded-xl h-11 bg-white"
                                                    />
                                                </div>

                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-bold text-slate-700">Tipo</Label>
                                                    <Select
                                                        value={formData.type}
                                                        onValueChange={(val) => setFormData(prev => ({ ...prev, type: val }))}
                                                    >
                                                        <SelectTrigger className="rounded-xl h-11 bg-white">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="individual">Pessoa Física</SelectItem>
                                                            <SelectItem value="company">Pessoa Jurídica</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-bold text-slate-700">{formData.type === 'individual' ? 'CPF' : 'CNPJ'}</Label>
                                                    <Input
                                                        value={formData.document}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, document: e.target.value }))}
                                                        placeholder="000.000.000-00"
                                                        className="rounded-xl h-11 bg-white"
                                                    />
                                                </div>

                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-bold text-slate-700">E-mail</Label>
                                                    <Input
                                                        type="email"
                                                        value={formData.email}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                                        placeholder="email@exemplo.com"
                                                        className="rounded-xl h-11 bg-white"
                                                    />
                                                </div>

                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-bold text-slate-700">Telefone / WhatsApp</Label>
                                                    <Input
                                                        value={formData.phone}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                                        placeholder="(11) 99999-9999"
                                                        className="rounded-xl h-11 bg-white"
                                                    />
                                                </div>

                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-bold text-slate-700">Data Comemorativa (DD/MM/AAAA)</Label>
                                                    <Input
                                                        value={formData.anniversaryDate}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, anniversaryDate: e.target.value }))}
                                                        placeholder="15/08/1990"
                                                        className="rounded-xl h-11 bg-white"
                                                    />
                                                </div>

                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-bold text-slate-700">Estado Civil</Label>
                                                    <Select
                                                        value={formData.maritalStatus}
                                                        onValueChange={(val) => setFormData(prev => ({ ...prev, maritalStatus: val }))}
                                                    >
                                                        <SelectTrigger className="rounded-xl h-11 bg-white">
                                                            <SelectValue placeholder="Selecione" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                                                            <SelectItem value="casado">Casado(a)</SelectItem>
                                                            <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                                                            <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="md:col-span-2 space-y-1.5">
                                                    <Label className="text-xs font-bold text-slate-700">Endereço</Label>
                                                    <Input
                                                        value={formData.address}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                                        placeholder="Rua, número, bairro..."
                                                        className="rounded-xl h-11 bg-white"
                                                    />
                                                </div>

                                                <div className="md:col-span-2 space-y-1.5">
                                                    <Label className="text-xs font-bold text-slate-700">Produtos de Interesse <span className="font-normal text-muted-foreground">(separados por vírgula)</span></Label>
                                                    <Input
                                                        value={formData.productType}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, productType: e.target.value }))}
                                                        placeholder="Ex: Auto, Saúde, Vida"
                                                        className="rounded-xl h-11 bg-white"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex gap-2 pt-2 border-t border-slate-200">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setIsEditing(false)}
                                                    className="flex-1 h-11 rounded-xl font-bold"
                                                >
                                                    Cancelar
                                                </Button>
                                                <Button
                                                    onClick={handleSave}
                                                    disabled={updateMutation.isPending}
                                                    className="flex-1 h-11 rounded-xl font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 gap-2"
                                                >
                                                    {updateMutation.isPending ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Save className="h-4 w-4" />
                                                    )}
                                                    Salvar e Sincronizar
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
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
                                            {contact.anniversaryDate && (
                                                <Card className="border-none bg-slate-50/50">
                                                    <CardContent className="p-4 flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-primary">
                                                            <Calendar className="h-5 w-5" />
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Data Comemorativa</p>
                                                            <p className="text-sm font-medium text-gray-900">{contact.anniversaryDate}</p>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            )}
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
                                    )}
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
                                                                    {(interaction.type === 'call' || interaction.type === 'phone') ? '📞 Ligação' :
                                                                        interaction.type === 'email' ? '📧 E-mail' :
                                                                            interaction.type === 'meeting' ? '🤝 Reunião' : 
                                                                                interaction.type === 'Web Inquiry' ? '🌐 Site' : '📝 Nota'}
                                                                </p>
                                                                <time className="text-[10px] font-bold text-gray-400 uppercase">
                                                                    {interaction.date ? format(new Date(interaction.date), "dd 'de' MMM, yyyy 'às' HH:mm", { locale: ptBR }) : '-'}
                                                                </time>
                                                            </div>
                                                            <p className="text-sm text-gray-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-wrap">
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
                                                            <Badge variant={task.status === 'fechado' ? 'default' : 'outline'} className="rounded-full font-bold uppercase text-[9px]">
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
