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
  const [clienteId, setClienteId] = useState<number | undefined>(defaultClienteId);
  const [apoliceId, setApoliceId] = useState<number | undefined>(defaultApoliceId);

  const { data: projects = [] } = useQuery<any[]>({
    queryKey: ["/api/todoist/projects"],
  });

  const { data: usersList = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: contactsList = [] } = useQuery<any[]>({
    queryKey: ["/api/contacts"],
  });

  const { data: leadsList = [] } = useQuery<any[]>({
    queryKey: ["/api/leads"],
  });

  const { data: clientesList = [] } = useQuery<any[]>({
    queryKey: ["/api/clientes"],
  });

  const { data: apolicesList = [] } = useQuery<any[]>({
    queryKey: ["/api/apolices"],
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
      toast({ title: "Digite um título para a tarefa", variant: "destructive" });
      return;
    }

    createTaskMutation.mutate({
      title: title.trim(),
      description: description.trim() || null,
      priority,
      projectId: projectId === "0" ? null : parseInt(projectId),
      assignedTo: assignedTo ? parseInt(assignedTo) : user?.id,
      dueDate: dueDate ? new Date(dueDate) : null,
      dueTime: dueTime || null,
      isRecurring,
      recurrenceRule: isRecurring ? recurrenceRule : null,
      contactId: contactId || null,
      leadId: leadId || null,
      clienteId: clienteId || null,
      apoliceId: apoliceId || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#0f172a] text-slate-100 border-white/10 p-6 rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
            <Plus className="h-5 w-5 text-amber-400" />
            Nova Tarefa (TODOIST CRM)
          </DialogTitle>
        </DialogHeader>

        {/* Quick Smart Text NLP Input */}
        <div className="bg-amber-500/10 p-3.5 rounded-xl border border-amber-500/20 space-y-2">
          <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4" />
            Criação Rápida com Interpretação Inteligente
          </label>
          <div className="flex gap-2">
            <Input
              placeholder="Ex: Entrar em contato com João amanhã às 14h p1"
              value={smartInputText}
              onChange={(e) => setSmartInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleQuickParse();
                }
              }}
              className="bg-slate-900/80 border-amber-500/30 text-xs text-white placeholder:text-slate-500"
            />
            <Button
              type="button"
              onClick={handleQuickParse}
              disabled={isParsing}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs gap-1.5 shrink-0"
            >
              {isParsing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Interpretar
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-slate-300">Título da Tarefa *</label>
            <Input
              placeholder="O que precisa ser feito?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-slate-900 border-white/10 text-sm text-white font-medium focus-visible:ring-amber-500/50 mt-1"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-slate-300">Descrição / Notas</label>
            <Textarea
              placeholder="Detalhes adicionais..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-slate-900 border-white/10 text-xs text-white min-h-[70px] mt-1"
            />
          </div>

          {/* Grid: Priority, Project, Assignee */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Priority */}
            <div>
              <label className="text-xs font-semibold text-slate-300">Prioridade</label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="bg-slate-900 border-white/10 text-xs text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10 text-white">
                  <SelectItem value="P1" className="text-red-400 font-bold">P1 — Urgente</SelectItem>
                  <SelectItem value="P2" className="text-orange-400 font-bold">P2 — Alta</SelectItem>
                  <SelectItem value="P3" className="text-blue-400 font-bold">P3 — Normal</SelectItem>
                  <SelectItem value="P4" className="text-slate-400 font-bold">P4 — Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Project */}
            <div>
              <label className="text-xs font-semibold text-slate-300">Projeto</label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger className="bg-slate-900 border-white/10 text-xs text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10 text-white">
                  <SelectItem value="0">Inbox (Sem Projeto)</SelectItem>
                  {projects.map((p: any) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Assignee */}
            <div>
              <label className="text-xs font-semibold text-slate-300">Responsável</label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger className="bg-slate-900 border-white/10 text-xs text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10 text-white">
                  {usersList.map((u: any) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.name || u.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Grid: Date, Time, Recurrence */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Data de Vencimento
              </label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-slate-900 border-white/10 text-xs text-white mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Horário
              </label>
              <Input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="bg-slate-900 border-white/10 text-xs text-white mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <Repeat className="h-3.5 w-3.5 text-emerald-400" /> Recorrência
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
                <SelectTrigger className="bg-slate-900 border-white/10 text-xs text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10 text-white">
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

          {/* CRM Entity Selector Section */}
          <div className="bg-slate-900/60 p-3 rounded-xl border border-white/5 space-y-3">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Vincular a Registro do CRM</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Contact */}
              <div>
                <label className="text-[11px] text-slate-400 flex items-center gap-1">
                  <User className="h-3 w-3" /> Contato / Empresa
                </label>
                <Select
                  value={contactId ? String(contactId) : "0"}
                  onValueChange={(val) => setContactId(val === "0" ? undefined : parseInt(val))}
                >
                  <SelectTrigger className="bg-slate-800 border-white/10 text-xs text-white mt-1">
                    <SelectValue placeholder="Selecione um contato..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/10 text-white">
                    <SelectItem value="0">Nenhum</SelectItem>
                    {contactsList.map((c: any) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name} ({c.type === 'company' ? 'PJ' : 'PF'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Lead / Opportunity */}
              <div>
                <label className="text-[11px] text-slate-400 flex items-center gap-1">
                  <FileText className="h-3 w-3" /> Oportunidade / Funil
                </label>
                <Select
                  value={leadId ? String(leadId) : "0"}
                  onValueChange={(val) => setLeadId(val === "0" ? undefined : parseInt(val))}
                >
                  <SelectTrigger className="bg-slate-800 border-white/10 text-xs text-white mt-1">
                    <SelectValue placeholder="Selecione oportunidade..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/10 text-white">
                    <SelectItem value="0">Nenhuma</SelectItem>
                    {leadsList.map((l: any) => (
                      <SelectItem key={l.id} value={String(l.id)}>
                        Oportunidade #{l.id} ({l.product || l.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="bg-transparent border-white/10 text-slate-300 hover:bg-white/5 text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createTaskMutation.isPending}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs gap-1.5"
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
