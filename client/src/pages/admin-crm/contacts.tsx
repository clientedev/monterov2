import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Contact, InsertContact, insertContactSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Users, Building, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ContactProfile } from "@/components/ContactProfile";
import * as XLSX from "xlsx";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Edit2, FileDown, FileSpreadsheet, Trash2 } from "lucide-react";

export default function ContactsPage() {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [selectedContactId, setSelectedContactId] = useState<number | null>(null);
    const [profileOpen, setProfileOpen] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [importData, setImportData] = useState<any[]>([]);
    const [isImporting, setIsImporting] = useState(false);
    const [isEditing, setIsEditing] = useState<number | null>(null);
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

    const { data: contacts, isLoading } = useQuery<Contact[]>({
        queryKey: ["/api/contacts"],
    });

    const updateMutation = useMutation({
        mutationFn: async (data: Partial<InsertContact>) => {
            const res = await apiRequest("PATCH", `/api/contacts/${isEditing}`, data);
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
            toast({ title: "Contato atualizado" });
            setOpen(false);
            setIsEditing(null);
            form.reset();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/contacts/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
            toast({ title: "Contato removido" });
            setDeleteTargetId(null);
        },
    });

    const downloadTemplate = () => {
        const template = [
            { tipo: "individual", nome: "João Silva", email: "joao@exemplo.com", telefone: "(11) 99999-9999", documento: "123.456.789-00", endereco: "Rua Exemplo, 123" },
            { tipo: "company", nome: "Monteiro Seguros", email: "contato@monteiro.com", telefone: "(11) 4444-4444", documento: "12.345.678/0001-99", endereco: "Av. Paulista, 1000" }
        ];
        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Contatos");
        XLSX.writeFile(wb, "modelo_contatos_monteiro.xlsx");
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: "binary" });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);
            setImportData(data);
        };
        reader.readAsBinaryString(file);
    };

    const runImport = async () => {
        setIsImporting(true);
        let success = 0;
        let errors = 0;

        for (const row of importData as any[]) {
            try {
                const payload: InsertContact = {
                    type: row.tipo === "company" ? "company" : "individual",
                    name: row.nome || "Novo Contato",
                    email: row.email || null,
                    phone: row.telefone || null,
                    document: row.documento || null,
                    address: row.endereco || null,
                };
                await apiRequest("POST", "/api/contacts", payload);
                success++;
            } catch (err) {
                errors++;
            }
        }

        queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
        toast({
            title: "Processamento concluído",
            description: `${success} contatos importados, ${errors} falhas.`,
        });
        setIsImporting(false);
        setImportData([]);
        setShowImport(false);
    };

    const form = useForm<InsertContact>({
        resolver: zodResolver(insertContactSchema),
        defaultValues: {
            type: "individual",
            name: "",
            email: "",
            phone: "",
            document: "",
            address: "",
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data: InsertContact) => {
            const res = await apiRequest("POST", "/api/contacts", data);
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
            toast({ title: "Contato criado com sucesso" });
            setOpen(false);
            form.reset();
        },
        onError: (error: Error) => {
            toast({
                title: "Falha ao criar contato",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const [isSearchingCnpj, setIsSearchingCnpj] = useState(false);

    const lookupCnpj = async (rawCnpj: string) => {
        const cnpj = rawCnpj.replace(/\D/g, "");
        if (!cnpj || cnpj.length < 14) {
            toast({ title: "Digite um CNPJ com 14 dígitos", description: `Você digitou ${cnpj.length} dígitos`, variant: "destructive" });
            return;
        }

        setIsSearchingCnpj(true);
        try {
            const res = await fetch(`/api/proxy/cnpj/${cnpj}`);
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || "Erro ao consultar CNPJ");
            }

            const data = await res.json();
            form.setValue("name", data.name || "");
            if (data.email) form.setValue("email", data.email);
            if (data.phone) form.setValue("phone", data.phone);
            if (data.address) form.setValue("address", data.address);

            toast({ title: "✅ Dados recuperados com sucesso!" });
        } catch (error: any) {
            toast({
                title: "Falha na busca",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsSearchingCnpj(false);
        }
    };

    const onSubmit = (data: InsertContact) => {
        if (isEditing) {
            updateMutation.mutate(data);
        } else {
            createMutation.mutate(data);
        }
    };

    const clientType = form.watch("type");

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-display font-bold text-gray-900 tracking-tight">Base de Contatos</h2>
                    <p className="text-muted-foreground mt-1">Gerencie pessoas físicas e jurídicas em um único lugar.</p>
                </div>

                <div className="flex items-center gap-3">
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 h-11 px-6 font-bold">
                                <Plus className="mr-2 h-4 w-4" />
                                Adicionar Contato
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[450px] rounded-2xl border-none shadow-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-display font-bold">{isEditing ? "Editar Contato" : "Novo Contato"}</DialogTitle>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                                    <FormField
                                        control={form.control}
                                        name="type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-gray-600 font-bold">Tipo de Cliente</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger className="rounded-xl h-11">
                                                            <SelectValue placeholder="Selecione o tipo" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="individual">Pessoa Física</SelectItem>
                                                        <SelectItem value="company">Pessoa Jurídica</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {clientType === "company" ? (
                                        <div className="flex gap-2 items-end">
                                            <FormField
                                                control={form.control}
                                                name="document"
                                                render={({ field }) => (
                                                    <FormItem className="flex-1">
                                                        <FormLabel className="text-gray-600 font-bold">CNPJ</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="00.000.000/0000-00"
                                                                className="rounded-xl h-11"
                                                                {...field}
                                                                value={field.value || ""}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="h-11 rounded-xl px-4 font-bold border-primary text-primary hover:bg-primary/5 mb-[2px]"
                                                onClick={() => lookupCnpj(form.getValues("document") || "")}
                                                disabled={isSearchingCnpj}
                                            >
                                                {isSearchingCnpj ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    "Buscar"
                                                )}
                                            </Button>
                                        </div>
                                    ) : (
                                        <FormField
                                            control={form.control}
                                            name="document"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-gray-600 font-bold">CPF</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="000.000.000-00"
                                                            className="rounded-xl h-11"
                                                            {...field}
                                                            value={field.value || ""}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}

                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-gray-600 font-bold">Nome Completo / Razão Social</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ex: João Silva ou Monteiro Seguros LTDA" className="rounded-xl h-11" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-gray-600 font-bold">Email</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="email"
                                                            placeholder="contato@exemplo.com"
                                                            className="rounded-xl h-11"
                                                            {...field}
                                                            value={field.value || ""}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="phone"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-gray-600 font-bold">Telefone</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="(11) 99999-9999"
                                                            className="rounded-xl h-11"
                                                            {...field}
                                                            value={field.value || ""}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full h-12 rounded-xl text-lg font-bold shadow-lg shadow-primary/20"
                                        disabled={createMutation.isPending || updateMutation.isPending}
                                    >
                                        {(createMutation.isPending || updateMutation.isPending) && (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        {isEditing ? "Salvar Alterações" : "Salvar Contato"}
                                    </Button>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>

                    <Button
                        variant="outline"
                        onClick={() => setShowImport(true)}
                        className="h-11 px-6 font-bold rounded-xl border-dashed border-2 hover:bg-slate-50 transition-all border-slate-300 text-slate-600"
                    >
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        Importar Excel
                    </Button>
                </div>
            </div>

            <div className="rounded-2xl border bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50/80">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="py-4 font-bold text-gray-600">Identificação</TableHead>
                            <TableHead className="py-4 font-bold text-gray-600">Tipo</TableHead>
                            <TableHead className="py-4 font-bold text-gray-600">Documento</TableHead>
                            <TableHead className="py-4 font-bold text-gray-600">Email</TableHead>
                            <TableHead className="py-4 font-bold text-gray-600">Telefone</TableHead>
                            <TableHead className="py-4 text-right font-bold text-gray-600">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {contacts?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-32 text-muted-foreground">
                                    <div className="flex flex-col items-center gap-2">
                                        <Users className="h-8 w-8 opacity-20" />
                                        <p>Nenhum contato cadastrado ainda.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            contacts?.map((contact) => (
                                <TableRow key={contact.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <TableCell className="font-bold text-gray-900 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`h-9 w-9 rounded-full flex items-center justify-center text-white font-bold
                                                ${contact.type === 'individual' ? 'bg-primary/80' : 'bg-secondary/80'}
                                            `}>
                                                {contact.name.charAt(0).toUpperCase()}
                                            </div>
                                            {contact.name}
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <Badge variant="outline" className={`rounded-lg py-1 px-3 border-none flex items-center w-fit gap-1.5 font-bold text-[10px] uppercase tracking-wider
                                            ${contact.type === 'individual'
                                                ? 'bg-blue-50 text-blue-600'
                                                : 'bg-indigo-50 text-indigo-600'}
                                        `}>
                                            {contact.type === 'individual' ? <User className="h-3 w-3" /> : <Building className="h-3 w-3" />}
                                            {contact.type === 'individual' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-gray-600 font-medium py-4">{contact.document || "—"}</TableCell>
                                    <TableCell className="text-gray-500 py-4">{contact.email || "—"}</TableCell>
                                    <TableCell className="text-gray-500 py-4">{contact.phone || "—"}</TableCell>
                                    <TableCell className="text-right py-4">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg p-2"
                                                onClick={() => {
                                                    form.reset(contact);
                                                    setIsEditing(contact.id);
                                                    setOpen(true);
                                                }}
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="font-bold text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg p-2"
                                                onClick={() => setDeleteTargetId(contact.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="font-bold text-primary hover:bg-primary/5 rounded-lg"
                                                onClick={() => {
                                                    setSelectedContactId(contact.id);
                                                    setProfileOpen(true);
                                                }}
                                            >
                                                Ver Perfil
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            <ContactProfile
                contactId={selectedContactId}
                open={profileOpen}
                onOpenChange={setProfileOpen}
            />

            {/* Import Dialog */}
            <Dialog open={showImport} onOpenChange={setShowImport}>
                <DialogContent className="sm:max-w-[600px] rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-display font-bold">Importar da Planilha</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="bg-slate-50 p-5 rounded-2xl border border-dashed border-slate-200 text-center">
                            <h4 className="font-bold text-slate-700 mb-1">Passo 1: Prepare seus dados</h4>
                            <p className="text-sm text-slate-500 mb-4">Use nosso modelo para garantir que os campos estejam corretos.</p>
                            <Button variant="outline" onClick={downloadTemplate} className="gap-2 rounded-xl font-bold border-slate-300">
                                <FileDown className="h-4 w-4" />
                                Baixar Modelo Excel
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-bold text-slate-700">Passo 2: Envie o arquivo</h4>
                            <Input
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={handleFileUpload}
                                className="h-12 pt-2 rounded-xl cursor-pointer"
                            />
                        </div>

                        {importData.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-slate-700">Preview ({importData.length} linhas)</h4>
                                    <Button
                                        onClick={runImport}
                                        disabled={isImporting}
                                        className="gap-2 rounded-xl font-black px-6 shadow-lg shadow-primary/20"
                                    >
                                        {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                        Confirmar Importação
                                    </Button>
                                </div>
                                <div className="max-h-[200px] overflow-y-auto border rounded-xl bg-slate-50/50">
                                    <Table>
                                        <TableHeader className="sticky top-0 bg-white">
                                            <TableRow>
                                                <TableHead className="text-[10px] font-black uppercase">Nome</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase">Tipo</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase">Doc</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {importData.slice(0, 5).map((row, i) => (
                                                <TableRow key={i}>
                                                    <TableCell className="text-xs font-medium">{row.nome}</TableCell>
                                                    <TableCell className="text-xs capitalize">{row.tipo}</TableCell>
                                                    <TableCell className="text-xs text-slate-500">{row.documento}</TableCell>
                                                </TableRow>
                                            ))}
                                            {importData.length > 5 && (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="text-center text-[10px] text-slate-400 font-bold py-2">
                                                        + {importData.length - 5} linhas ocultas no preview
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={deleteTargetId !== null} onOpenChange={() => setDeleteTargetId(null)}>
                <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold">Excluir Contato?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação removerá permanentemente o contato e todos os dados associados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl font-bold">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold"
                            onClick={() => deleteTargetId && deleteMutation.mutate(deleteTargetId)}
                        >
                            Excluir Definitivamente
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
