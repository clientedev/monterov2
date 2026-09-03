import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Plus,
  Sparkles,
  Calendar,
  Clock,
  User,
  Folder,
  Tag,
  ShieldCheck,
  Building,
  FileText,
  Repeat,
  Loader2
} from "lucide-react";
import { format } from "date-fns";

interface TodoistQuickAddModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultContactId?: number;
  defaultLeadId?: number;
  defaultClienteId?: number;
  defaultApoliceId?: number;
}

export function TodoistQuickAddModal({
  open,
  onOpenChange,
  defaultContactId,
  defaultLeadId,
  defaultClienteId,
  defaultApoliceId,
}: TodoistQuickAddModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  const [smartInputText, setSmartInputText] = useState("");
  const [isParsing, setIsParsing] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("P3");
  const [projectId, setProjectId] = useState<string>("0");
  const [assignedTo, setAssignedTo] = useState<string>(user ? String(user.id) : "");
  const [dueDate, setDueDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [dueTime, setDueTime] = useState<string>("14:00");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState<string>("weekly");

  const [contactId, setContactId] = useState<number | undefined>(defaultContactId);
  const [leadId, setLeadId] = useState<number | undefined>(defaultLeadId);

  const { data: projects = [] } = useQuery<any[]>({
    queryKey: ["/api/todoist/projects"],
  });

  const { data: usersList = [] } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  const { data: contactsList = [] } = useQuery<any[]>({
    queryKey: ["/api/contacts"],
  });

  const { data: leadsList = [] } = useQuery<any[]>({
    queryKey: ["/api/leads"],
  });

  const createTaskMutation = useMutation({
    mutationFn: async (taskPayload: any) => {
      const res = await apiRequest("POST", "/api/todoist/tasks", taskPayload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todoist/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/todoist/dashboard"] });
      toast({ title: "Tarefa criada com sucesso!" });
      onOpenChange(false);
      resetForm();
    },
    onError: (err: any) => {
      toast({ title: "Erro ao criar tarefa", description: err.message, variant: "destructive" });
    },
  });

  const handleQuickParse = async () => {
    if (!smartInputText.trim()) return;
    setIsParsing(true);
    try {
      const res = await apiRequest("POST", "/api/todoist/quick-parse", { text: smartInputText });
      const parsed = await res.json();

      setTitle(parsed.title || smartInputText);
      if (parsed.priority) setPriority(parsed.priority);
      if (parsed.dueDate) setDueDate(format(new Date(parsed.dueDate), "yyyy-MM-dd"));
      if (parsed.dueTime) setDueTime(parsed.dueTime);

      toast({ title: "Texto interpretado!", description: `Título: ${parsed.title}` });
    } catch (err: any) {
      toast({ title: "Erro ao interpretar texto", description: err.message, variant: "destructive" });
    } finally {
      setIsParsing(false);
    }
  };

  const resetForm = () => {
    setSmartInputText("");
    setTitle("");
    setDescription("");
    setPriority("P3");
    setProjectId("0");
    setDueDate(format(new Date(), "yyyy-MM-dd"));
    setDueTime("14:00");
    setIsRecurring(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({ title: "Digite o título da tarefa", variant: "destructive" });
      return;
    }

    createTaskMutation.mutate({
      title,
      description,
      priority,
      projectId: projectId === "0" ? null : parseInt(projectId),
      assignedTo: assignedTo ? parseInt(assignedTo) : user?.id,
      dueDate: dueDate ? new Date(`${dueDate}T${dueTime || "12:00"}:00`) : null,
      dueTime,
      isRecurring,
      recurrenceRule: isRecurring ? recurrenceRule : null,
      contactId: contactId || null,
      leadId: leadId || null,
      clienteId: defaultClienteId || null,
      apoliceId: defaultApoliceId || null,
    });
  };

  const contactOptions = contactsList.map((c: any) => {
    const assignedUser = usersList.find((u: any) => u.id === c.assignedTo);
    return {
      value: String(c.id),
      label: c.name,
      sublabel: `${c.type === 'company' ? 'PJ' : 'PF'}${assignedUser ? ` • Resp: ${assignedUser.name}` : ''}`
    };
  });

  const leadOptions = leadsList.map((l: any) => {
    const contact = contactsList.find((c: any) => c.id === l.contactId);
    const assignedUser = usersList.find((u: any) => u.id === l.assignedTo);
    return {
      value: String(l.id),
      label: contact?.name ? `${contact.name} (${l.product || 'Lead'})` : `Oportunidade #${l.id}`,
      sublabel: `Status: ${l.status}${assignedUser ? ` • Resp: ${assignedUser.name}` : ''}`
    };
  });

  const userOptions = usersList.map((u: any) => ({
    value: String(u.id),
    label: u.name,
    sublabel: u.role === 'admin' ? 'Administrador' : 'Equipe'
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] w-[95vw] bg-white border-slate-200 shadow-2xl rounded-2xl p-6 overflow-y-auto max-h-[90vh]">
        <DialogHeader className="border-b border-slate-100 pb-3">
          <DialogTitle className="text-xl font-bold font-display text-slate-900 flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" /> Nova Tarefa
          </DialogTitle>
        </DialogHeader>

        {/* Quick Parse IA Input */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mt-2">
          <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5 mb-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Adicionar Rápido com IA
          </label>
          <div className="flex gap-2">
            <Input
              placeholder="Ex: Ligar para João amanhã às 15h P1"
              value={smartInputText}
              onChange={(e) => setSmartInputText(e.target.value)}
              className="bg-white border-slate-200 text-xs text-slate-800"
            />
            <Button
              type="button"
              onClick={handleQuickParse}
              disabled={isParsing}
              className="bg-primary hover:bg-primary/90 text-white font-bold text-xs gap-1.5 shrink-0 rounded-lg"
            >
              {isParsing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Interpretar
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Title */}
          <div>
            <label className="text-xs font-bold text-slate-700">Título da Tarefa *</label>
            <Input
              placeholder="O que precisa ser feito?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-white border-slate-200 text-sm text-slate-900 font-medium mt-1 rounded-xl"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-slate-700">Descrição / Notas</label>
            <Textarea
              placeholder="Detalhes adicionais..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-white border-slate-200 text-xs text-slate-800 min-h-[70px] mt-1 rounded-xl"
            />
          </div>

          {/* Grid: Priority, Project, Assignee */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Priority */}
            <div>
              <label className="text-xs font-bold text-slate-700">Prioridade</label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="bg-white border-slate-200 text-xs text-slate-800 mt-1 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-800">
                  <SelectItem value="P1" className="text-red-600 font-bold">P1 — Urgente</SelectItem>
                  <SelectItem value="P2" className="text-orange-600 font-bold">P2 — Alta</SelectItem>
                  <SelectItem value="P3" className="text-blue-600 font-bold">P3 — Normal</SelectItem>
                  <SelectItem value="P4" className="text-slate-500 font-bold">P4 — Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Project */}
            <div>
              <label className="text-xs font-bold text-slate-700">Projeto</label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger className="bg-white border-slate-200 text-xs text-slate-800 mt-1 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-800">
                  <SelectItem value="0">Inbox (Sem Projeto)</SelectItem>
                  {projects.map((p: any) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Assignee — Searchable */}
            <div>
              <label className="text-xs font-bold text-slate-700">Responsável</label>
              <div className="mt-1">
                <SearchableSelect
                  options={userOptions}
                  value={assignedTo}
                  onValueChange={setAssignedTo}
                  placeholder="Selecione responsável..."
                  searchPlaceholder="Pesquisar usuário..."
                />
              </div>
            </div>
          </div>

          {/* Grid: Date, Time, Recurrence */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-primary" /> Vencimento
              </label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-white border-slate-200 text-xs text-slate-800 mt-1 rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-primary" /> Horário
              </label>
              <Input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="bg-white border-slate-200 text-xs text-slate-800 mt-1 rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Repeat className="h-3.5 w-3.5 text-emerald-600" /> Recorrência
              </label>
              <Select
                value={isRecurring ? recurrenceRule : "none"}
                onValueChange={(val) => {
                  if (val === "none") {
                    setIsRecurring(false);
                  } else {
                    setIsRecurring(true);
                    setRecurrenceRule(val);
                  }
                }}
              >
                <SelectTrigger className="bg-white border-slate-200 text-xs text-slate-800 mt-1 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-800">
                  <SelectItem value="none">Não se repete</SelectItem>
                  <SelectItem value="daily">Todos os dias</SelectItem>
                  <SelectItem value="weekdays">Dias úteis (Seg-Sex)</SelectItem>
                  <SelectItem value="weekly">Semanalmente</SelectItem>
                  <SelectItem value="monthly">Mensalmente</SelectItem>
                  <SelectItem value="yearly">Anualmente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* CRM Entity Selector Section with SearchableSelect */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Vincular a Registro do CRM</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Contact with SearchableSelect */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1 mb-1">
                  <User className="h-3 w-3 text-slate-400" /> Contato / Empresa
                </label>
                <SearchableSelect
                  options={contactOptions}
                  value={contactId ? String(contactId) : undefined}
                  onValueChange={(val) => setContactId(val ? parseInt(val) : undefined)}
                  placeholder="Pesquisar contato..."
                  searchPlaceholder="Nome do contato ou PJ..."
                  clearable
                />
              </div>

              {/* Lead / Opportunity with SearchableSelect */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1 mb-1">
                  <FileText className="h-3 w-3 text-slate-400" /> Oportunidade / Funil
                </label>
                <SearchableSelect
                  options={leadOptions}
                  value={leadId ? String(leadId) : undefined}
                  onValueChange={(val) => setLeadId(val ? parseInt(val) : undefined)}
                  placeholder="Pesquisar oportunidade..."
                  searchPlaceholder="Nome do cliente ou produto..."
                  clearable
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 text-xs rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createTaskMutation.isPending}
              className="bg-primary hover:bg-primary/90 text-white font-bold text-xs gap-1.5 rounded-xl shadow-md"
            >
              {createTaskMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Adicionar Tarefa
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
