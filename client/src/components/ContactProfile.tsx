import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Contact, Interaction, Lead, Task, InsertContact, ContactFile } from "@shared/schema";
import { ProductSelector } from "@/components/ProductSelector";
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
    Heart,
    Shield,
    FileDown,
    Printer,
    Briefcase,
    Paperclip,
    Upload,
    Trash2,
    KeyRound,
    Download
} from "lucide-react";

function calcAge(dateStr: string | null | undefined): number | null {
    if (!dateStr) return null;
    const parts = dateStr.split("/");
    if (parts.length !== 3) return null;
    const [day, month, year] = parts.map(Number);
    if (!year || year < 1900 || year > new Date().getFullYear()) return null;
    const today = new Date();
    let age = today.getFullYear() - year;
    if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) age--;
    return age >= 0 ? age : null;
}

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

    // Cross-reference matching insurance client (clientes) to fetch insurance policies (apólices)
    const { data: clientes } = useQuery<any[]>({
        queryKey: ["/api/clientes"],
        enabled: !!contact,
    });

    const matchedCliente = useMemo(() => {
        if (!contact || !clientes) return null;
        return clientes.find(c => 
            (c.cpfCnpj && contact.document && c.cpfCnpj.replace(/\D/g, "") === contact.document.replace(/\D/g, "")) ||
            (c.nome && contact.name && c.nome.toLowerCase().trim() === contact.name.toLowerCase().trim())
        );
    }, [contact, clientes]);

    const { data: apolices, isLoading: apolicesLoading } = useQuery<any[]>({
        queryKey: [`/api/clientes/${matchedCliente?.id}/apolices`],
        enabled: !!matchedCliente?.id,
    });

    const { data: files } = useQuery<ContactFile[]>({
        queryKey: [`/api/contacts/${contactId}/files`],
        enabled: !!contactId,
    });

    const { data: usersList } = useQuery<any[]>({
        queryKey: ["/api/users"],
    });

    const userAccount = useMemo(() => {
        if (!contact || !usersList) return null;
        return usersList.find((u: any) => 
            (u.contactId && u.contactId === contact.id) ||
            (u.email && contact.email && u.email.toLowerCase().trim() === contact.email.toLowerCase().trim())
        );
    }, [contact, usersList]);

    const [isUploading, setIsUploading] = useState(false);

    const uploadFileMutation = useMutation({
        mutationFn: async (fileData: { fileName: string; fileUrl: string; fileType?: string; fileSize?: string }) => {
            const res = await apiRequest("POST", `/api/contacts/${contactId}/files`, fileData);
            if (!res.ok) throw new Error("Erro ao anexar arquivo");
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/contacts/${contactId}/files`] });
            toast({ title: "Arquivo anexado com sucesso" });
        },
        onError: (err: Error) => {
            toast({ title: "Falha ao enviar arquivo", description: err.message, variant: "destructive" });
        },
    });

    const deleteFileMutation = useMutation({
        mutationFn: async (fileId: number) => {
            const res = await apiRequest("DELETE", `/api/contact-files/${fileId}`);
            if (!res.ok) throw new Error("Erro ao excluir arquivo");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/contacts/${contactId}/files`] });
            toast({ title: "Arquivo removido" });
        },
        onError: (err: Error) => {
            toast({ title: "Falha ao remover arquivo", description: err.message, variant: "destructive" });
        },
    });

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const reader = new FileReader();
        reader.onload = (evt) => {
            const base64 = evt.target?.result as string;
            const fileSizeFormatted = file.size > 1024 * 1024 
                ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                : `${Math.round(file.size / 1024)} KB`;

            uploadFileMutation.mutate({
                fileName: file.name,
                fileUrl: base64,
                fileType: file.type || "application/octet-stream",
                fileSize: fileSizeFormatted,
            }, {
                onSettled: () => setIsUploading(false)
            });
        };
        reader.readAsDataURL(file);
    };

    const generateAccountMutation = useMutation({
        mutationFn: async () => {
            const res = await apiRequest("POST", `/api/contacts/${contactId}/generate-account`);
            if (!res.ok) {
                const body = await res.json();
                throw new Error(body.message || "Erro ao gerar conta do cliente");
            }
            return await res.json();
        },
        onSuccess: (data: any) => {
            toast({
                title: "Conta gerada com sucesso!",
                description: data.message || "E-mail enviado ao cliente com link para cadastro de senha.",
            });
            queryClient.invalidateQueries({ queryKey: [`/api/contacts/${contactId}`] });
            queryClient.invalidateQueries({ queryKey: ["/api/users"] });
        },
        onError: (error: Error) => {
            toast({
                title: "Falha ao gerar conta",
                description: error.message,
                variant: "destructive",
            });
        },
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
        responsibleName: "",
        status: "Ativo",
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
                responsibleName: contact.responsibleName || "",
                status: contact.status || "Ativo",
            });
        }
    }, [contact]);

    const updateMutation = useMutation({
        mutationFn: async (data: Partial<InsertContact>) => {
            const res = await apiRequest("PATCH", `/api/contacts/${contactId}`, data);
            
            // Sync with clientes table if matched
            if (matchedCliente?.id) {
                await apiRequest("PATCH", `/api/clientes/${matchedCliente.id}`, {
                    nome: data.name,
                    cpfCnpj: data.document,
                    email: data.email,
                    telefone: data.phone,
                    whatsapp: data.phone,
                    endereco: data.address,
                    dataNascimento: data.anniversaryDate,
                    nomeRepresentante: data.responsibleName,
                }).catch(() => {});
            }

            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
            queryClient.invalidateQueries({ queryKey: [`/api/contacts/${contactId}`] });
            queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
            queryClient.invalidateQueries({ queryKey: ["/api/clientes"] });
            queryClient.invalidateQueries({ queryKey: [`/api/clientes/${matchedCliente?.id}/apolices`] });
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

    // PDF Export function
    const handleExportPDF = () => {
        if (!contact) return;

        const printWindow = window.open("", "_blank");
        if (!printWindow) {
            toast({ title: "Por favor, permita pop-ups no seu navegador para gerar o PDF.", variant: "destructive" });
            return;
        }

        const todayDate = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
        const age = contact.anniversaryDate ? calcAge(contact.anniversaryDate) : null;

        const htmlContent = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>Dossiê do Cliente - ${contact.name}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body {
                    font-family: 'Inter', system-ui, -apple-system, sans-serif;
                    color: #0f172a;
                    background-color: #ffffff;
                    padding: 30px;
                    font-size: 12px;
                    line-height: 1.5;
                }
                @page { size: A4; margin: 12mm; }
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 3px solid #0F6570;
                    padding-bottom: 16px;
                    margin-bottom: 24px;
                }
                .brand h1 {
                    font-size: 22px;
                    font-weight: 800;
                    color: #0F6570;
                    text-transform: uppercase;
                    letter-spacing: -0.5px;
                }
                .brand p {
                    font-size: 10px;
                    color: #64748b;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                .doc-info {
                    text-align: right;
                    font-size: 10px;
                    color: #64748b;
                }
                .doc-info strong {
                    display: block;
                    font-size: 13px;
                    color: #0f172a;
                    font-weight: 700;
                }
                .section-title {
                    font-size: 12px;
                    font-weight: 800;
                    color: #0F6570;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    border-bottom: 1.5px solid #cbd5e1;
                    padding-bottom: 4px;
                    margin-top: 22px;
                    margin-bottom: 12px;
                }
                .grid-2 {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                }
                .data-card {
                    background-color: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                    padding: 8px 12px;
                }
                .data-card label {
                    display: block;
                    font-size: 9px;
                    font-weight: 700;
                    color: #64748b;
                    text-transform: uppercase;
                    margin-bottom: 2px;
                }
                .data-card value {
                    display: block;
                    font-size: 12px;
                    font-weight: 600;
                    color: #0f172a;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 8px;
                    font-size: 11px;
                }
                th {
                    background-color: #f1f5f9;
                    color: #475569;
                    font-weight: 700;
                    text-align: left;
                    padding: 6px 10px;
                    border-bottom: 2px solid #cbd5e1;
                    text-transform: uppercase;
                    font-size: 9px;
                }
                td {
                    padding: 6px 10px;
                    border-bottom: 1px solid #e2e8f0;
                    color: #334155;
                }
                tr:nth-child(even) td { background-color: #f8fafc; }
                .badge {
                    display: inline-block;
                    padding: 2px 6px;
                    border-radius: 10px;
                    font-size: 9px;
                    font-weight: 700;
                    text-transform: uppercase;
                }
                .badge-active { background-color: #dcfce7; color: #166534; }
                .badge-pending { background-color: #fef9c3; color: #854d0e; }
                .badge-cancelled { background-color: #ffe4e6; color: #9f1239; }
                .footer {
                    margin-top: 40px;
                    padding-top: 12px;
                    border-top: 1px solid #e2e8f0;
                    text-align: center;
                    font-size: 9px;
                    color: #94a3b8;
                }
                @media print {
                    body { padding: 0; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="brand">
                    <h1>Monteiro Seguros</h1>
                    <p>Dossiê Integrado do Cliente</p>
                </div>
                <div class="doc-info">
                    <strong>RELATÓRIO DE DADOS COMPLETO</strong>
                    <span>Gerado em: ${todayDate}</span>
                </div>
            </div>

            <!-- 1. DADOS CADASTRAIS -->
            <div class="section-title">1. Informações Cadastrais</div>
            <div class="grid-2">
                <div class="data-card">
                    <label>Nome / Razão Social</label>
                    <value>${contact.name}</value>
                </div>
                <div class="data-card">
                    <label>Tipo de Cliente</label>
                    <value>${contact.type === 'individual' ? 'Pessoa Física (PF)' : 'Pessoa Jurídica (PJ)'}</value>
                </div>
                <div class="data-card">
                    <label>${contact.type === 'individual' ? 'CPF' : 'CNPJ'}</label>
                    <value>${contact.document || 'Não informado'}</value>
                </div>
                <div class="data-card">
                    <label>E-mail</label>
                    <value>${contact.email || 'Não informado'}</value>
                </div>
                <div class="data-card">
                    <label>Telefone / WhatsApp</label>
                    <value>${contact.phone || 'Não informado'}</value>
                </div>
                <div class="data-card">
                    <label>Data Comemorativa / Nascimento</label>
                    <value>${contact.anniversaryDate || 'Não informada'}${age ? ` (${age} anos)` : ''}</value>
                </div>
                <div class="data-card">
                    <label>Estado Civil</label>
                    <value>${contact.maritalStatus || 'Não informado'}</value>
                </div>
                <div class="data-card">
                    <label>Produtos de Interesse</label>
                    <value>${contact.productType || 'Não informado'}</value>
                </div>
                <div class="data-card" style="grid-column: span 2;">
                    <label>Endereço</label>
                    <value>${contact.address || 'Não informado'}</value>
                </div>
            </div>

            ${contact.responsibleName ? `
                <div class="section-title">Representante Legal / Responsável</div>
                <div class="grid-2">
                    <div class="data-card" style="grid-column: span 2;">
                        <label>Nome do Responsável</label>
                        <value>${contact.responsibleName}</value>
                    </div>
                </div>
            ` : ''}

            <!-- 2. APÓLICES DE SEGURO -->
            <div class="section-title">2. Apólices de Seguro Cadastradas</div>
            ${apolices && apolices.length > 0 ? `
                <table>
                    <thead>
                        <tr>
                            <th>Apólice / Proposta</th>
                            <th>Seguradora</th>
                            <th>Ramo / Cobertura</th>
                            <th>Vigência</th>
                            <th>Prêmio (R$)</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${apolices.map((a: any) => `
                            <tr>
                                <td><strong>${a.numeroApolice || a.numeroProposta || `#${a.id}`}</strong></td>
                                <td>${a.seguradoraNome || a.seguradora || '—'}</td>
                                <td>${a.produtoNome || a.cobertura || 'Seguro'}</td>
                                <td>${a.inicioVigencia ? format(new Date(a.inicioVigencia), "dd/MM/yyyy") : '—'} a ${a.fimVigencia ? format(new Date(a.fimVigencia), "dd/MM/yyyy") : '—'}</td>
                                <td><strong>${a.premio ? `R$ ${a.premio}` : '—'}</strong></td>
                                <td><span class="badge ${a.status === 'ativa' ? 'badge-active' : a.status === 'cancelada' ? 'badge-cancelled' : 'badge-pending'}">${a.status || 'Ativa'}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : `<p style="color: #64748b; font-style: italic; margin-top: 4px;">Nenhuma apólice cadastrada para este cliente.</p>`}

            <!-- 3. NEGÓCIOS E LEADS -->
            <div class="section-title">3. Oportunidades & Negócios (Funil de Vendas)</div>
            ${leads && leads.length > 0 ? `
                <table>
                    <thead>
                        <tr>
                            <th>Identificação</th>
                            <th>Produto</th>
                            <th>Origem</th>
                            <th>Valor Estimado</th>
                            <th>Etapa / Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${leads.map((l: any) => `
                            <tr>
                                <td><strong>Lead #${l.id}</strong></td>
                                <td>${l.product || 'Geral'}</td>
                                <td>${l.source || 'Direto'}</td>
                                <td><strong>${l.value ? `R$ ${l.value}` : 'Sob consulta'}</strong></td>
                                <td>${l.status}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : `<p style="color: #64748b; font-style: italic; margin-top: 4px;">Nenhum negócio no funil de vendas.</p>`}

            <!-- 4. TAREFAS -->
            <div class="section-title">4. Tarefas & Pendências</div>
            ${tasks && tasks.length > 0 ? `
                <table>
                    <thead>
                        <tr>
                            <th>Título da Tarefa</th>
                            <th>Data de Vencimento</th>
                            <th>Prioridade</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tasks.map((t: any) => `
                            <tr>
                                <td><strong>${t.title}</strong></td>
                                <td>${t.dueDate ? format(new Date(t.dueDate), "dd/MM/yyyy") : '—'}</td>
                                <td>${t.priority || 'Normal'}</td>
                                <td>${t.status}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : `<p style="color: #64748b; font-style: italic; margin-top: 4px;">Nenhuma tarefa pendente.</p>`}

            <!-- 5. INTERAÇÕES -->
            <div class="section-title">5. Histórico de Interações</div>
            ${interactions && interactions.length > 0 ? `
                <table>
                    <thead>
                        <tr>
                            <th>Tipo</th>
                            <th>Data / Horário</th>
                            <th>Descrição / Detalhes</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${interactions.map((i: any) => `
                            <tr>
                                <td><strong>${i.type}</strong></td>
                                <td>${i.date ? format(new Date(i.date), "dd/MM/yyyy HH:mm") : '—'}</td>
                                <td>${i.description}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : `<p style="color: #64748b; font-style: italic; margin-top: 4px;">Nenhuma interação registrada.</p>`}

            <div class="footer">
                Monteiro Seguros e Consultoria &bull; Dossiê emitido automaticamente pelo CRM.
            </div>

            <script>
                window.onload = function() {
                    window.print();
                };
            </script>
        </body>
        </html>
        `;

        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    if (!contactId) return null;

    const isLoading = contactLoading || interactionsLoading || leadsLoading || tasksLoading || apolicesLoading;
    const age = contact?.anniversaryDate ? calcAge(contact.anniversaryDate) : null;

    return (
        <Sheet open={open} onOpenChange={(v) => {
            if (!v) setIsEditing(false);
            onOpenChange(v);
        }}>
            <SheetContent className="sm:max-w-3xl w-full p-0 flex flex-col gap-0 border-none shadow-2xl">
                {isLoading ? (
                    <div className="flex h-full items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : contact ? (
                    <>
                        {/* HEADER */}
                        <div className="p-6 bg-slate-50 border-b shrink-0">
                            <SheetHeader className="space-y-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4 min-w-0 flex-1">
                                        <div className={`h-16 w-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shrink-0 overflow-hidden
                                            ${contact.type === 'individual' ? 'bg-primary' : 'bg-secondary'}
                                        `}>
                                            {userAccount?.avatar || (contact as any).avatar ? (
                                                <img src={userAccount?.avatar || (contact as any).avatar} alt={contact.name} className="w-full h-full object-cover" />
                                            ) : (
                                                (formData.name || contact.name).charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div className="space-y-1 min-w-0 flex-1">
                                            <SheetTitle className="text-2xl font-display font-bold text-gray-900 truncate">
                                                {contact.name}
                                            </SheetTitle>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Badge variant="secondary" className="rounded-full px-3 py-0.5 font-bold text-[10px] uppercase tracking-wider">
                                                    {contact.type === 'individual' ? (
                                                        <><User className="h-3 w-3 mr-1" /> Pessoa Física</>
                                                    ) : (
                                                        <><Building className="h-3 w-3 mr-1" /> Pessoa Jurídica</>
                                                    )}
                                                </Badge>
                                                {userAccount && (
                                                    <Badge variant="outline" className="rounded-full px-2.5 py-0.5 font-bold text-[10px] bg-amber-50 text-amber-800 border-amber-300 flex items-center gap-1">
                                                        <KeyRound className="h-3 w-3 text-amber-600" /> Possui Conta no Site
                                                    </Badge>
                                                )}
                                                <Badge
                                                    variant="outline"
                                                    className={`rounded-full px-3 py-0.5 font-bold text-[10px] uppercase tracking-wider border ${
                                                        (contact.status || "Ativo") === "Ativo"
                                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                            : (contact.status || "Ativo") === "Prospects"
                                                            ? "bg-blue-50 text-blue-700 border-blue-200"
                                                            : "bg-rose-50 text-rose-700 border-rose-200"
                                                    }`}
                                                >
                                                    Status: {contact.status || "Ativo"}
                                                </Badge>
                                                {age !== null && (
                                                    <Badge variant="outline" className="rounded-full px-2.5 py-0.5 font-bold text-[10px] bg-primary/10 text-primary border-none">
                                                        🎂 {age} anos
                                                    </Badge>
                                                )}
                                                {apolices && apolices.length > 0 && (
                                                    <Badge variant="outline" className="rounded-full px-2.5 py-0.5 font-bold text-[10px] bg-emerald-50 text-emerald-700 border-none">
                                                        <Shield className="h-3 w-3 mr-1" /> {apolices.length} Apólices
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons: Gerar Conta, PDF Export & Inline Edit */}
                                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => generateAccountMutation.mutate()}
                                            disabled={generateAccountMutation.isPending || !contact.email}
                                            className={`rounded-xl font-bold shadow-sm gap-1.5 border-none text-white transition-all ${
                                                userAccount ? "bg-slate-700 hover:bg-slate-800" : "bg-amber-500 hover:bg-amber-600"
                                            }`}
                                            title={contact.email ? (userAccount ? "Reenviar convite de acesso ao cliente" : "Gerar conta de cliente para acesso à Área do Cliente") : "Preencha o e-mail do contato para gerar a conta"}
                                        >
                                            {generateAccountMutation.isPending ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <KeyRound className="h-4 w-4" />
                                            )}
                                            {userAccount ? "Reenviar Convite" : "Gerar Conta"}
                                        </Button>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleExportPDF}
                                            className="rounded-xl font-bold bg-white border-slate-200 hover:bg-slate-100 text-slate-700 shadow-sm gap-1.5"
                                            title="Gerar e imprimir PDF com todos os dados do cliente"
                                        >
                                            <FileDown className="h-4 w-4 text-emerald-600" />
                                            Emitir PDF
                                        </Button>

                                        <Button
                                            variant={isEditing ? "ghost" : "outline"}
                                            size="sm"
                                            onClick={() => setIsEditing(!isEditing)}
                                            className={`rounded-xl font-bold transition-all ${isEditing ? "text-rose-600 hover:bg-rose-50 border-rose-200" : "bg-white border-slate-200 hover:bg-slate-100 text-slate-700 shadow-sm gap-1.5"}`}
                                        >
                                            {isEditing ? (
                                                <><X className="h-4 w-4 mr-1" /> Cancelar</>
                                            ) : (
                                                <><Edit2 className="h-4 w-4 text-primary" /> Editar Contato</>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </SheetHeader>

                            {/* Executive Summary Cards Bar */}
                            <div className="grid grid-cols-4 gap-3 mt-6">
                                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-center">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Apólices</span>
                                    <strong className="text-lg font-bold text-slate-800">{apolices?.length || 0}</strong>
                                </div>
                                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-center">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Negócios</span>
                                    <strong className="text-lg font-bold text-primary">{leads?.length || 0}</strong>
                                </div>
                                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-center">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Interações</span>
                                    <strong className="text-lg font-bold text-slate-800">{interactions?.length || 0}</strong>
                                </div>
                                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-center">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Tarefas</span>
                                    <strong className="text-lg font-bold text-amber-600">{tasks?.length || 0}</strong>
                                </div>
                            </div>
                        </div>

                        <ScrollArea className="flex-1">
                            <div className="p-6 space-y-6">
                                {isEditing ? (
                                    /* EDIT FORM */
                                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
                                        <div className="flex items-center justify-between border-b pb-3 mb-2">
                                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                                <Edit2 className="h-4 w-4 text-primary" /> Editar Dados do Contato
                                            </h3>
                                            <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                                                Sincronização Automática
                                            </span>
                                        </div>

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
                                                <Label className="text-xs font-bold text-slate-700">Tipo de Cliente</Label>
                                                <Select
                                                    value={formData.type}
                                                    onValueChange={(val) => setFormData(prev => ({ ...prev, type: val }))}
                                                >
                                                    <SelectTrigger className="rounded-xl h-11 bg-white">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="individual">Pessoa Física (PF)</SelectItem>
                                                        <SelectItem value="company">Pessoa Jurídica (PJ)</SelectItem>
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
                                                <Label className="text-xs font-bold text-slate-700">Endereço Completo</Label>
                                                <Input
                                                    value={formData.address}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                                    placeholder="Rua, número, bairro, cidade - UF"
                                                    className="rounded-xl h-11 bg-white"
                                                />
                                            </div>

                                             <div className="space-y-1.5">
                                                <Label className="text-xs font-bold text-slate-700">Status do Cliente</Label>
                                                <Select
                                                    value={formData.status}
                                                    onValueChange={(val) => setFormData(prev => ({ ...prev, status: val }))}
                                                >
                                                    <SelectTrigger className="rounded-xl h-11 bg-white">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Ativo">Ativo</SelectItem>
                                                        <SelectItem value="Prospects">Prospects</SelectItem>
                                                        <SelectItem value="Cancelado">Cancelado</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="md:col-span-2 space-y-1.5">
                                                <Label className="text-xs font-bold text-slate-700">Representante Legal / Responsável</Label>
                                                <Input
                                                    value={formData.responsibleName}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, responsibleName: e.target.value }))}
                                                    placeholder="Nome do representante legal (caso PJ)"
                                                    className="rounded-xl h-11 bg-white"
                                                />
                                            </div>

                                            <div className="md:col-span-2 space-y-1.5">
                                                <Label className="text-xs font-bold text-slate-700">Produtos de Interesse / Contratados</Label>
                                                <ProductSelector
                                                    value={formData.productType}
                                                    onChange={(val) => setFormData(prev => ({ ...prev, productType: val }))}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex gap-2 pt-3 border-t border-slate-200">
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
                                                Salvar e Sincronizar Tudo
                                            </Button>
                                        </div>
                                    </div>
                                ) : null}

                                {/* FULL CLIENT DATA TABS */}
                                <Tabs defaultValue="cadastral" className="w-full">
                                    <TabsList className="w-full justify-start bg-slate-100/70 p-1 h-12 rounded-xl mb-6 flex-wrap">
                                        <TabsTrigger value="cadastral" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs">
                                            <FileText className="h-3.5 w-3.5 mr-1.5" /> Dados Cadastrais
                                        </TabsTrigger>
                                        <TabsTrigger value="files" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs">
                                            <Paperclip className="h-3.5 w-3.5 mr-1.5 text-blue-600" /> Arquivos & Documentos ({files?.length || 0})
                                        </TabsTrigger>
                                        <TabsTrigger value="apolices" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs">
                                            <Shield className="h-3.5 w-3.5 mr-1.5 text-emerald-600" /> Apólices ({apolices?.length || 0})
                                        </TabsTrigger>
                                        <TabsTrigger value="leads" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs">
                                            <TrendingUp className="h-3.5 w-3.5 mr-1.5 text-primary" /> Negócios ({leads?.length || 0})
                                        </TabsTrigger>
                                        <TabsTrigger value="interactions" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs">
                                            <History className="h-3.5 w-3.5 mr-1.5 text-slate-600" /> Histórico ({interactions?.length || 0})
                                        </TabsTrigger>
                                        <TabsTrigger value="tasks" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs">
                                            <CheckSquare className="h-3.5 w-3.5 mr-1.5 text-amber-600" /> Tarefas ({tasks?.length || 0})
                                        </TabsTrigger>
                                    </TabsList>

                                    {/* TAB 1: DADOS CADASTRAIS */}
                                    <TabsContent value="cadastral" className="space-y-4">
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
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Telefone / WhatsApp</p>
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

                                            <Card className="border-none bg-slate-50/50">
                                                <CardContent className="p-4 flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-primary">
                                                        <Calendar className="h-5 w-5" />
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Data Comemorativa / Nascimento</p>
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {contact.anniversaryDate || "Não informada"} {age !== null && `(${age} anos)`}
                                                        </p>
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            {contact.maritalStatus && (
                                                <Card className="border-none bg-slate-50/50">
                                                    <CardContent className="p-4 flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-primary">
                                                            <Heart className="h-5 w-5" />
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Estado Civil</p>
                                                            <p className="text-sm font-medium text-gray-900 capitalize">{contact.maritalStatus}</p>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            )}

                                            {contact.productType && (
                                                <Card className="border-none bg-slate-50/50">
                                                    <CardContent className="p-4 flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-primary">
                                                            <Briefcase className="h-5 w-5" />
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Produtos / Interesses</p>
                                                            <p className="text-sm font-medium text-gray-900">{contact.productType}</p>
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
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Endereço Completo</p>
                                                        <p className="text-sm font-medium text-gray-900">{contact.address || "Não informado"}</p>
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            {contact.responsibleName && (
                                                <Card className="border-none bg-slate-50/50 md:col-span-2">
                                                    <CardContent className="p-4 flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-primary">
                                                            <User className="h-5 w-5" />
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Representante Legal / Responsável</p>
                                                            <p className="text-sm font-medium text-gray-900">{contact.responsibleName}</p>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            )}
                                        </div>
                                    </TabsContent>

                                    {/* TAB 2: APÓLICES DE SEGURO */}
                                    <TabsContent value="apolices" className="space-y-4">
                                        {apolices && apolices.length > 0 ? (
                                            <div className="grid gap-3">
                                                {apolices.map((a: any) => (
                                                    <Card key={a.id} className="shadow-sm border-slate-200">
                                                        <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0 bg-slate-50/50 border-b border-slate-100">
                                                            <div className="space-y-1">
                                                                <CardTitle className="text-sm font-bold text-slate-900">
                                                                    Apólice: {a.numeroApolice || a.numeroProposta || `#${a.id}`}
                                                                </CardTitle>
                                                                <p className="text-xs font-semibold text-primary">
                                                                    {a.seguradoraNome || a.seguradora || 'Seguradora não informada'} &bull; {a.produtoNome || a.cobertura || 'Seguro'}
                                                                </p>
                                                            </div>
                                                            <Badge className={`rounded-full font-bold uppercase text-[9px] ${a.status === 'ativa' ? 'bg-emerald-500' : a.status === 'cancelada' ? 'bg-rose-500' : 'bg-amber-500'}`}>
                                                                {a.status || 'Ativa'}
                                                            </Badge>
                                                        </CardHeader>
                                                        <CardContent className="p-4 grid grid-cols-2 gap-2 text-xs">
                                                            <div>
                                                                <span className="text-gray-400 font-medium block">Vigência:</span>
                                                                <span className="font-bold text-slate-700">
                                                                    {a.inicioVigencia ? format(new Date(a.inicioVigencia), "dd/MM/yyyy") : '—'} a {a.fimVigencia ? format(new Date(a.fimVigencia), "dd/MM/yyyy") : '—'}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-400 font-medium block">Prêmio (Valor):</span>
                                                                <span className="font-extrabold text-emerald-600 text-sm">
                                                                    {a.premio ? `R$ ${a.premio}` : '—'}
                                                                </span>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6">
                                                <Shield className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                                                <p className="text-sm font-bold text-slate-600">Nenhuma apólice de seguro vinculada.</p>
                                                <p className="text-xs text-slate-400 mt-1">As apólices deste cliente aparecerão aqui automaticamente.</p>
                                            </div>
                                        )}
                                    </TabsContent>

                                    {/* TAB 3: NEGÓCIOS / LEADS */}
                                    <TabsContent value="leads" className="space-y-4">
                                        {leads && leads.length > 0 ? (
                                            <div className="grid gap-3">
                                                {leads.map((lead) => (
                                                    <Card key={lead.id} className="shadow-sm border-slate-200">
                                                        <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0 bg-slate-50/50 border-b border-slate-100">
                                                            <div className="space-y-1">
                                                                <CardTitle className="text-sm font-bold text-slate-900">Lead #{lead.id} - {lead.product || 'Geral'}</CardTitle>
                                                                <p className="text-xs text-muted-foreground">Origem: {lead.source || 'Direto'}</p>
                                                            </div>
                                                            <Badge variant="outline" className="rounded-full font-bold uppercase text-[9px] bg-primary/10 text-primary border-none">
                                                                {lead.status}
                                                            </Badge>
                                                        </CardHeader>
                                                        <CardContent className="p-4 flex justify-between items-center">
                                                            <div>
                                                                <span className="text-[10px] font-bold text-gray-400 uppercase block">Valor Estimado</span>
                                                                <span className="text-base font-black text-primary">{lead.value ? `R$ ${lead.value}` : 'Sob consulta'}</span>
                                                            </div>
                                                            {lead.notes && (
                                                                <p className="text-xs italic text-slate-500 max-w-xs truncate border-l-2 border-primary/20 pl-2">
                                                                    "{lead.notes}"
                                                                </p>
                                                            )}
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6">
                                                <TrendingUp className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                                                <p className="text-sm font-bold text-slate-600">Nenhum negócio registrado no funil.</p>
                                            </div>
                                        )}
                                    </TabsContent>

                                    {/* TAB 4: HISTÓRICO DE INTERAÇÕES */}
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

                                     {/* TAB FOR FILES / ANEXOS */}
                                     <TabsContent value="files" className="space-y-4">
                                         <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
                                             <CardHeader className="bg-slate-50 border-b p-4 flex flex-row items-center justify-between">
                                                 <div>
                                                     <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                                                         <Paperclip className="h-4 w-4 text-blue-600" />
                                                         Documentos e Anexos do Contato
                                                     </CardTitle>
                                                     <p className="text-xs text-slate-500">Anexe PDFs, contratos, apólices ou fotos relacionados a este cadastro.</p>
                                                 </div>
                                                 <div>
                                                     <label className="cursor-pointer">
                                                         <Input
                                                             type="file"
                                                             className="hidden"
                                                             onChange={handleFileUpload}
                                                             disabled={isUploading || uploadFileMutation.isPending}
                                                         />
                                                         <Button
                                                             type="button"
                                                             asChild
                                                             disabled={isUploading || uploadFileMutation.isPending}
                                                             className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl h-9 text-xs gap-1.5 shadow-sm"
                                                         >
                                                             <span>
                                                                 {isUploading || uploadFileMutation.isPending ? (
                                                                     <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                 ) : (
                                                                     <Upload className="h-3.5 w-3.5" />
                                                                 )}
                                                                 Anexar Arquivo
                                                             </span>
                                                         </Button>
                                                     </label>
                                                 </div>
                                             </CardHeader>
                                             <CardContent className="p-4 space-y-3">
                                                 {!files || files.length === 0 ? (
                                                     <div className="text-center py-10 border-2 border-dashed rounded-xl border-slate-200 text-slate-400 space-y-2">
                                                         <Paperclip className="h-8 w-8 mx-auto opacity-30 text-slate-500" />
                                                         <p className="font-bold text-sm text-slate-600">Nenhum arquivo anexado a este contato.</p>
                                                         <p className="text-xs">Clique no botão acima para selecionar e anexar um documento.</p>
                                                     </div>
                                                 ) : (
                                                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                         {files.map((file) => (
                                                             <div key={file.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 hover:border-slate-300 transition-colors">
                                                                 <div className="flex items-center gap-3 min-w-0 flex-1">
                                                                     <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
                                                                         <FileText className="h-5 w-5" />
                                                                     </div>
                                                                     <div className="min-w-0 flex-1 space-y-0.5">
                                                                         <p className="text-xs font-bold text-slate-800 truncate" title={file.fileName}>
                                                                             {file.fileName}
                                                                         </p>
                                                                         <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                                                             <span>{file.fileSize || "—"}</span>
                                                                             <span>&bull;</span>
                                                                             <span>{file.createdAt ? format(new Date(file.createdAt), "dd/MM/yyyy HH:mm") : "—"}</span>
                                                                         </div>
                                                                     </div>
                                                                 </div>
                                                                 <div className="flex items-center gap-1 shrink-0">
                                                                     <a
                                                                         href={file.fileUrl}
                                                                         download={file.fileName}
                                                                         target="_blank"
                                                                         rel="noreferrer"
                                                                     >
                                                                         <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg" title="Baixar/Visualizar Arquivo">
                                                                             <Download className="h-4 w-4" />
                                                                         </Button>
                                                                     </a>
                                                                     <Button
                                                                         variant="ghost"
                                                                         size="icon"
                                                                         onClick={() => deleteFileMutation.mutate(file.id)}
                                                                         disabled={deleteFileMutation.isPending}
                                                                         className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                                                                         title="Remover Anexo"
                                                                     >
                                                                         <Trash2 className="h-4 w-4" />
                                                                     </Button>
                                                                 </div>
                                                             </div>
                                                         ))}
                                                     </div>
                                                 )}
                                             </CardContent>
                                         </Card>
                                     </TabsContent>

                                    {/* TAB 5: TAREFAS */}
                                    <TabsContent value="tasks" className="space-y-4">
                                        {tasks && tasks.length > 0 ? (
                                            <div className="grid gap-3">
                                                {tasks.map((task) => (
                                                    <Card key={task.id} className="shadow-none border-slate-200">
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
