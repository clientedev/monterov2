import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
    Flame,
    Thermometer,
    Snowflake,
    Sun,
    Search,
    MapPin,
    Phone,
    Globe,
    Building2,
    Plus,
    Loader2,
    Sparkles,
    CheckCircle2,
    Info,
    Mail,
    Map as MapIcon,
    Compass,
    PhoneCall,
    TrendingUp,
    FileText,
    ExternalLink,
    Building,
    UserCheck,
    Calendar,
    ArrowRight,
    Send,
    Users,
    CheckSquare,
    Square,
    MessageSquare,
    Share2,
    Layers,
    ChevronLeft,
    ChevronRight,
    Copy,
    Check,
    FolderPlus,
    Clock,
    ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ThermometerLead {
    placeId: string;
    name: string;
    corporateName?: string;
    document?: string;
    address: string;
    phone?: string;
    email?: string;
    website?: string;
    location: {
        lat: number;
        lng: number;
    };
    rating?: number;
    userRatingsTotal?: number;
    businessStatus?: string;
    score: number;
    temperature: "frio" | "morno" | "quente";
    reason: string;
    productType: string;
    cnae?: string;
}

export default function LeadsThermometer() {
    const { toast } = useToast();
    const [, setLocation] = useLocation();
    
    const [locationInput, setLocationInput] = useState("São Paulo, SP");
    const [radiusKm, setRadiusKm] = useState("10");
    const [productType, setProductType] = useState("Plano de Saúde");
    const [customQuery, setCustomQuery] = useState("");
    
    // Inicializa como null para NÃO disparar busca automática sem ação explícita do usuário
    const [searchPayload, setSearchPayload] = useState<any>(null);
    
    const [savedLeadsMap, setSavedLeadsMap] = useState<Record<string, number>>({});
    const [enrichedLeadsMap, setEnrichedLeadsMap] = useState<Record<string, any>>({});

    // CNPJ Details Modal State
    const [cnpjModalOpen, setCnpjModalOpen] = useState(false);
    const [selectedLeadForCnpj, setSelectedLeadForCnpj] = useState<ThermometerLead | null>(null);
    const [cnpjModalData, setCnpjModalData] = useState<any | null>(null);
    const [isLoadingCnpjModal, setIsLoadingCnpjModal] = useState(false);

    // Quick Prospecting Modal State
    const [prospectingModalOpen, setProspectingModalOpen] = useState(false);
    const [activeProspectingContact, setActiveProspectingContact] = useState<{ id: number; name: string; phone?: string; email?: string } | null>(null);
    const [callOutcome, setCallOutcome] = useState("connected");
    const [interestLevel, setInterestLevel] = useState("high");
    const [prospectingNotes, setProspectingNotes] = useState("");
    const [sendToPipeline, setSendToPipeline] = useState(false); // Sempre falso por padrão para NUNCA enviar sozinho

    // Seleção & Gavetinha de Disparos
    const [selectedLeads, setSelectedLeads] = useState<Record<string, ThermometerLead>>({});
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [activeDrawerTab, setActiveDrawerTab] = useState("email");

    // Paginação
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(9);

    // Formulário de Disparo de E-mail
    const [emailSubject, setEmailSubject] = useState("Oportunidade em Gestão de Benefícios Corporativos - {empresa}");
    const [emailBody, setEmailBody] = useState(
      "Olá {nome},\n\nIdentificamos a {empresa} como uma empresa de destaque na nossa região e gostaríamos de apresentar condições diferenciadas para a implantação e otimização de Benefícios Corporativos (Vale Alimentação, Vale Refeição e Seguro de Vida Empresarial).\n\nNossas soluções reduzem encargos tributários através do PAT e ampliam a satisfação da sua equipe sem custos operacionais adicionais.\n\nPodemos agendar uma rápida conversa de 10 minutos esta semana?\n\nAtenciosamente,\nEquipe Monteiro Seguros & Benefícios Corporativos\n(11) 4004-0000"
    );
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [emailDispatchResult, setEmailDispatchResult] = useState<any>(null);

    // Formulário de Disparo de WhatsApp
    const [whatsappTemplate, setWhatsappTemplate] = useState(
      "Olá {nome}! Tudo bem? Sou consultor corporativo da Monteiro Seguros. Localizei o perfil da {empresa} e gostaria de compartilhar uma proposta especial de Benefícios (Vale Alimentação e Refeição) com isenção fiscal pelo PAT e economia direta. Teriam 5 minutinhos hoje para conversarmos?"
    );
    const [isSendingWhatsapp, setIsSendingWhatsapp] = useState(false);
    const [whatsappDispatchResult, setWhatsappDispatchResult] = useState<any>(null);

    // Formulário de Criação de Grupos de Disparo
    const [groupName, setGroupName] = useState("");
    const [groupDescription, setGroupDescription] = useState("");
    const [groupChannel, setGroupChannel] = useState("omnichannel");
    const [isSavingGroup, setIsSavingGroup] = useState(false);

    // Query de Grupos de Disparo Salvos
    const { data: dispatchGroups = [], refetch: refetchDispatchGroups } = useQuery<any[]>({
        queryKey: ["/api/leads-thermometer/dispatch-groups"],
        queryFn: async () => {
            const res = await apiRequest("GET", "/api/leads-thermometer/dispatch-groups");
            return res.json();
        }
    });

    const mapRef = useRef<HTMLDivElement>(null);
    const leafletMapRef = useRef<any>(null);

    // Query for Thermometer Search
    const { data: searchData, isLoading } = useQuery<{
        success: boolean;
        isGooglePlacesActive: boolean;
        noticeMessage?: string;
        results: ThermometerLead[];
    }>({
        queryKey: ["/api/leads-thermometer/search", searchPayload],
        queryFn: async () => {
            const res = await apiRequest("POST", "/api/leads-thermometer/search", searchPayload);
            return res.json();
        },
        enabled: !!searchPayload,
    });

    const results = searchData?.results || [];

    // Lazily initialize Leaflet Map
    useEffect(() => {
        if (!mapRef.current || leafletMapRef.current) return;

        import('leaflet').then((L) => {
            // @ts-ignore
            delete L.default.Icon.Default.prototype._getIconUrl;
            L.default.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            });

            if (!mapRef.current) return;
            const map = L.default.map(mapRef.current).setView([-23.5505, -46.6333], 11);
            L.default.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap'
            }).addTo(map);

            leafletMapRef.current = { map, L: L.default };
        }).catch(console.error);
    }, []);

    // Update map pins according to lead temperature
    useEffect(() => {
        if (!leafletMapRef.current || !results || results.length === 0) return;
        const { map, L } = leafletMapRef.current;

        // Clear existing markers
        map.eachLayer((layer: any) => {
            if (layer instanceof L.Marker) map.removeLayer(layer);
        });

        const firstLead = results[0];
        const centerLat = firstLead.location?.lat || -23.5505;
        const centerLng = firstLead.location?.lng || -46.6333;
        map.flyTo([centerLat, centerLng], 12, { duration: 1.5 });

        results.forEach((lead) => {
            const lat = lead.location?.lat || centerLat;
            const lng = lead.location?.lng || centerLng;

            let markerBg = "#3b82f6"; // Blue (Frio)
            if (lead.temperature === "quente") markerBg = "#ef4444"; // Red (Quente)
            else if (lead.temperature === "morno") markerBg = "#f59e0b"; // Yellow/Amber (Morno)

            const customHtmlIcon = L.divIcon({
                className: 'custom-thermometer-pin',
                html: `<div style="background-color: ${markerBg}; width: 26px; height: 26px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 10px;">
                    ${lead.temperature === "quente" ? "🔥" : lead.temperature === "morno" ? "☀️" : "❄️"}
                </div>`,
                iconSize: [26, 26],
                iconAnchor: [13, 13]
            });

            const marker = L.marker([lat, lng], { icon: customHtmlIcon }).addTo(map);

            const popupContent = L.DomUtil.create('div', 'p-2 min-w-[200px]');
            popupContent.innerHTML = `
                <div class="space-y-1.5">
                    <div class="flex items-center gap-1.5">
                        <span class="font-black text-xs uppercase text-slate-900">${lead.name}</span>
                    </div>
                    <p class="text-[10px] text-slate-500 line-clamp-2">${lead.address}</p>
                    <div class="pt-1 flex items-center justify-between border-t border-slate-100">
                        <span class="text-[10px] font-bold ${lead.temperature === 'quente' ? 'text-red-600' : lead.temperature === 'morno' ? 'text-amber-600' : 'text-blue-600'}">
                            ${lead.score}/100 - ${lead.temperature.toUpperCase()}
                        </span>
                    </div>
                </div>
            `;
            marker.bindPopup(popupContent);
        });
    }, [results]);

    const handleSearch = () => {
        if (!locationInput.trim()) {
            toast({ title: "Localização Obrigatória", description: "Informe uma cidade, bairro ou região.", variant: "destructive" });
            return;
        }
        setCurrentPage(1);
        setSelectedLeads({});
        setSearchPayload({
            location: locationInput.trim(),
            radiusKm: parseInt(radiusKm),
            productType,
            customQuery: customQuery.trim(),
        });
    };

    // Puxar CNPJ Handler & Modal Trigger
    const handleFetchCnpjModal = async (lead: ThermometerLead) => {
        setSelectedLeadForCnpj(lead);
        setCnpjModalData(null);
        setCnpjModalOpen(true);
        setIsLoadingCnpjModal(true);

        const cleanDoc = lead.document ? lead.document.replace(/\D/g, "") : "";
        try {
            const city = locationInput.includes(",") ? locationInput.split(",")[0].trim() : locationInput;
            const state = locationInput.includes(",") ? locationInput.split(",")[1].trim() : "SP";

            const params = new URLSearchParams({
                q: lead.name,
                city,
                state,
                address: lead.address || "",
            });
            if (cleanDoc && cleanDoc.length === 14) {
                params.set("document", cleanDoc);
            }

            const res = await apiRequest("GET", `/api/proxy/companies/discover?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setCnpjModalData(data);

                if (data.cnpj && data.cnpj.replace(/\D/g, "").length === 14) {
                    const foundDoc = data.cnpj;
                    lead.document = foundDoc;
                    setEnrichedLeadsMap(prev => ({
                        ...prev,
                        [lead.placeId]: {
                            ...(prev[lead.placeId] || {}),
                            document: foundDoc,
                            name: data.razao_social || data.nome_fantasia || lead.name,
                            address: [data.logradouro, data.numero, data.bairro, data.municipio, data.uf].filter(Boolean).join(", ") || lead.address,
                            phone: data.ddd_telefone_1 || lead.phone || null,
                            email: data.email || lead.email || null,
                        }
                    }));
                }
            }
        } catch (err) {
            console.error("Error discovering CNPJ data:", err);
            toast({
                title: "Erro ao consultar dados",
                description: "Não foi possível carregar os dados automaticamente.",
                variant: "destructive",
            });
        } finally {
            setIsLoadingCnpjModal(false);
        }
    };

    // Save & Start Prospecting Mutation (Cria apenas contato comercial, NUNCA adiciona ao pipeline sozinho)
    const startProspectingMutation = useMutation({
        mutationFn: async (lead: ThermometerLead) => {
            const enriched = enrichedLeadsMap[lead.placeId] || {};
            const res = await apiRequest("POST", "/api/leads-thermometer/save-crm", {
                leadName: enriched.name || lead.name,
                phone: enriched.phone || lead.phone || null,
                email: enriched.email || lead.email || null,
                document: enriched.document || lead.document || null,
                address: enriched.address || lead.address || null,
                website: lead.website || null,
                productType: lead.productType || productType,
                score: lead.score,
                temperature: lead.temperature,
                reason: lead.reason,
                location: locationInput,
                radiusKm: parseInt(radiusKm),
                createPipelineLead: false, // NUNCA envia automaticamente para o pipeline de vendas
            });
            return res.json();
        },
        onSuccess: (data: any, lead: ThermometerLead) => {
            const contactId = data.contact?.id;
            if (contactId) {
                setSavedLeadsMap(prev => ({ ...prev, [lead.placeId]: contactId }));
                setActiveProspectingContact({
                    id: contactId,
                    name: data.contact?.name || lead.name,
                    phone: data.contact?.phone || lead.phone,
                    email: data.contact?.email || lead.email,
                });
                setSendToPipeline(false);
                setProspectingModalOpen(true);
                queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
                toast({
                    title: "Contato Pronto para Prospecção",
                    description: `${lead.name} pronto para ligação (não inserido no pipeline automaticamente).`,
                });
            }
        },
    });

    // Save Call Log Mutation
    const saveProspectingLogMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await apiRequest("POST", "/api/prospecting", data);
            return res.json();
        },
        onSuccess: (_data: any, variables: any) => {
            queryClient.invalidateQueries({ queryKey: ["/api/prospecting"] });
            queryClient.invalidateQueries({ queryKey: ["/api/interactions"] });
            if (variables?.createPipelineLead) {
                queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
                toast({ title: "Prospecção Registrada", description: "Resultado salvo e oportunidade adicionada ao pipeline com sucesso!" });
            } else {
                toast({ title: "Prospecção Registrada", description: "Resultado da ligação salvo com sucesso!" });
            }
            setProspectingModalOpen(false);
            setSendToPipeline(false);
        }
    });

        // Handlers de Seleção de Leads
    const toggleLeadSelection = (lead: ThermometerLead, isSelected: boolean) => {
        setSelectedLeads(prev => {
            const next = { ...prev };
            if (isSelected) {
                next[lead.placeId] = lead;
            } else {
                delete next[lead.placeId];
            }
            return next;
        });
    };

    const handleSelectAllOnPage = (pageLeads: ThermometerLead[]) => {
        setSelectedLeads(prev => {
            const next = { ...prev };
            pageLeads.forEach(lead => {
                next[lead.placeId] = lead;
            });
            return next;
        });
    };

    const handleSelectAllResults = (allLeads: ThermometerLead[]) => {
        setSelectedLeads(prev => {
            const next = { ...prev };
            allLeads.forEach(lead => {
                next[lead.placeId] = lead;
            });
            return next;
        });
    };

    const handleClearSelection = () => {
        setSelectedLeads({});
    };

    // Cálculos de Seleção
    const selectedLeadsList = Object.values(selectedLeads);
    const countSelected = selectedLeadsList.length;
    const countWithEmail = selectedLeadsList.filter(l => l.email && l.email.includes("@")).length;
    const countWithPhone = selectedLeadsList.filter(l => l.phone && l.phone.replace(/\D/g, "").length >= 8).length;

    // Paginação
    const totalPages = Math.max(1, Math.ceil(results.length / pageSize));
    const paginatedResults = results.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    // Handlers de Disparo
    const handleSendEmailDispatch = async () => {
        if (countWithEmail === 0) {
            toast({
                title: "Nenhum e-mail disponível",
                description: "Selecione leads que possuam e-mail corporativo preenchido.",
                variant: "destructive"
            });
            return;
        }

        setIsSendingEmail(true);
        setEmailDispatchResult(null);
        try {
            const res = await apiRequest("POST", "/api/leads-thermometer/dispatch-email", {
                leads: selectedLeadsList,
                subject: emailSubject,
                bodyTemplate: emailBody,
                productType: productType
            });
            const data = await res.json();
            setEmailDispatchResult(data);
            if (data.success) {
                toast({
                    title: "Disparo de E-mails Concluído",
                    description: `${data.sent} e-mails enviados com sucesso!`
                });
            } else {
                toast({
                    title: "Aviso no Disparo de E-mails",
                    description: data.message || "Verifique o relatório de envio.",
                    variant: "destructive"
                });
            }
        } catch (err: any) {
            toast({
                title: "Falha no Envio de E-mail",
                description: err.message || "Erro de conexão com o servidor.",
                variant: "destructive"
            });
        } finally {
            setIsSendingEmail(false);
        }
    };

    const handleSendWhatsappDispatch = async () => {
        if (countWithPhone === 0) {
            toast({
                title: "Nenhum telefone disponível",
                description: "Selecione leads que possuam número de telefone ou WhatsApp.",
                variant: "destructive"
            });
            return;
        }

        setIsSendingWhatsapp(true);
        setWhatsappDispatchResult(null);
        try {
            const res = await apiRequest("POST", "/api/leads-thermometer/dispatch-whatsapp", {
                leads: selectedLeadsList,
                messageTemplate: whatsappTemplate,
                productType: productType
            });
            const data = await res.json();
            setWhatsappDispatchResult(data);
            if (data.success) {
                toast({
                    title: "Disparo WhatsApp Concluído",
                    description: data.message || "Mensagens encaminhadas com sucesso!"
                });
            } else {
                toast({
                    title: "Aviso no Disparo de WhatsApp",
                    description: data.message || data.warning || "Consulte o resultado.",
                    variant: "destructive"
                });
            }
        } catch (err: any) {
            toast({
                title: "Erro no Disparo WhatsApp",
                description: err.message || "Falha na comunicação com o Monteiro Conecta.",
                variant: "destructive"
            });
        } finally {
            setIsSendingWhatsapp(false);
        }
    };

    const handleSaveDispatchGroup = async () => {
        if (!groupName.trim()) {
            toast({
                title: "Nome obrigatório",
                description: "Dê um nome identificável para este grupo de disparo.",
                variant: "destructive"
            });
            return;
        }

        if (countSelected === 0) {
            toast({
                title: "Nenhum lead selecionado",
                description: "Selecione pelo menos um lead para compor o grupo.",
                variant: "destructive"
            });
            return;
        }

        setIsSavingGroup(true);
        try {
            const res = await apiRequest("POST", "/api/leads-thermometer/dispatch-groups", {
                name: groupName.trim(),
                description: groupDescription.trim() || undefined,
                channel: groupChannel,
                productType: productType,
                leads: selectedLeadsList
            });
            const data = await res.json();
            if (data.success) {
                toast({
                    title: "Grupo Criado com Sucesso",
                    description: `Grupo "${groupName}" salvo com ${countSelected} leads.`
                });
                setGroupName("");
                setGroupDescription("");
                refetchDispatchGroups();
                setActiveDrawerTab("saved_groups");
            }
        } catch (err: any) {
            toast({
                title: "Erro ao Salvar Grupo",
                description: err.message || "Não foi possível salvar o grupo de disparo.",
                variant: "destructive"
            });
        } finally {
            setIsSavingGroup(false);
        }
    };

    const handleLoadDispatchGroup = (group: any) => {
        if (Array.isArray(group.leads)) {
            const newSelected: Record<string, ThermometerLead> = {};
            group.leads.forEach((l: any, idx: number) => {
                const key = l.placeId || `group_${group.id}_${idx}`;
                newSelected[key] = {
                    placeId: key,
                    name: l.name || l.corporateName || "Lead do Grupo",
                    document: l.document || "",
                    address: l.address || "",
                    phone: l.phone || "",
                    email: l.email || "",
                    website: l.website || "",
                    score: l.score || 70,
                    temperature: l.temperature || "quente",
                    reason: l.reason || "Lead de grupo salvo",
                    productType: l.productType || group.productType || productType,
                    location: l.location || { lat: -23.5505, lng: -46.6333 },
                    corporateName: l.corporateName || l.name,
                };
            });
            setSelectedLeads(newSelected);
            toast({
                title: "Grupo Carregado",
                description: `${group.leads.length} leads do grupo "${group.name}" selecionados!`
            });
        }
    };

    const handleSaveProspectingLog = () => {
        if (!activeProspectingContact) return;
        saveProspectingLogMutation.mutate({
            contactId: activeProspectingContact.id,
            callOutcome,
            interestLevel,
            notes: prospectingNotes || `Prospecção iniciada via Termômetro de Leads (${productType}).`,
            productType,
            createPipelineLead: sendToPipeline,
        });
    };

    const renderTemperatureBadge = (temperature: string, score: number) => {
        if (temperature === "quente") {
            return (
                <Badge className="bg-gradient-to-r from-red-500 to-rose-600 text-white font-black text-[10px] px-2.5 py-1 flex items-center gap-1 shadow-sm">
                    <Flame className="w-3.5 h-3.5 animate-pulse" />
                    🔥 QUENTE · {score} pts
                </Badge>
            );
        } else if (temperature === "morno") {
            return (
                <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white font-black text-[10px] px-2.5 py-1 flex items-center gap-1 shadow-sm">
                    <Sun className="w-3.5 h-3.5" />
                    ☀️ MORNO · {score} pts
                </Badge>
            );
        } else {
            return (
                <Badge className="bg-gradient-to-r from-slate-500 to-blue-600 text-white font-black text-[10px] px-2.5 py-1 flex items-center gap-1 shadow-sm">
                    <Snowflake className="w-3.5 h-3.5" />
                    ❄️ FRIO · {score} pts
                </Badge>
            );
        }
    };

    return (
        <div className="space-y-8">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-2xl font-display font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <Thermometer className="h-7 w-7 text-red-500" />
                        Termômetro de Leads
                    </h3>
                    <p className="text-slate-500 mt-1 font-medium text-sm">
                        Identifique potenciais clientes na sua região, consulte dados de CNPJ e inicie prospecções diretas.
                    </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-red-500 via-amber-500 to-orange-400 shadow-lg shadow-orange-500/20 flex items-center justify-center">
                    <Flame className="h-6 w-6 text-white" />
                </div>
            </div>

            {/* Notice Banner if Google Places API Key is not set */}
            {searchData?.noticeMessage && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3 shadow-sm">
                    <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <h4 className="text-sm font-bold text-amber-900">Modo de Busca Regional Público Ativo</h4>
                        <p className="text-xs text-amber-800 leading-relaxed">
                            {searchData.noticeMessage}
                        </p>
                    </div>
                </div>
            )}

            {/* Main Form + Map Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Search Filters */}
                <div className="lg:col-span-1">
                    <Card className="premium-card border-none shadow-xl overflow-hidden">
                        <div className="h-2 w-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500" />
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-2">
                                <Compass className="h-4 w-4 text-amber-500" />
                                <CardTitle className="text-base text-slate-900">Filtros do Termômetro</CardTitle>
                            </div>
                            <CardDescription className="text-xs">Defina a região e o produto comercializado</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Região / Cidade */}
                            <div className="space-y-1.5">
                                <Label className="text-slate-700 font-bold text-xs uppercase tracking-wider">Região / Cidade / Bairro</Label>
                                <Input
                                    placeholder="Ex: Pinheiros, São Paulo, SP"
                                    value={locationInput}
                                    onChange={(e) => setLocationInput(e.target.value)}
                                    className="bg-white border-slate-200"
                                />
                            </div>

                            {/* Raio de Busca */}
                            <div className="space-y-1.5">
                                <Label className="text-slate-700 font-bold text-xs uppercase tracking-wider">Raio de Busca (km)</Label>
                                <Select value={radiusKm} onValueChange={setRadiusKm}>
                                    <SelectTrigger className="bg-white">
                                        <SelectValue placeholder="Selecione o raio" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="5">5 km (Bairro / Proximidades)</SelectItem>
                                        <SelectItem value="10">10 km (Cidade / Raio Médio)</SelectItem>
                                        <SelectItem value="25">25 km (Região Metropolitana)</SelectItem>
                                        <SelectItem value="50">50 km (Grande Região)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Tipo de Seguro / Produto */}
                            <div className="space-y-1.5">
                                <Label className="text-slate-700 font-bold text-xs uppercase tracking-wider">Produto / Nicho de Seguro</Label>
                                <Select value={productType} onValueChange={setProductType}>
                                    <SelectTrigger className="bg-white">
                                        <SelectValue placeholder="Selecione o produto" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Benefícios (Alimentação, Refeição, etc.)">Benefícios (Alimentação, Refeição, etc.)</SelectItem>
                                        <SelectItem value="Plano de Saúde">Plano de Saúde (Empresarial / PME)</SelectItem>
                                        <SelectItem value="Seguro de Vida">Seguro de Vida (Individual / Grupo)</SelectItem>
                                        <SelectItem value="Seguro Auto / Frota">Seguro Auto / Frota Corporativa</SelectItem>
                                        <SelectItem value="Seguro Empresarial">Seguro Empresarial / Patrimonial</SelectItem>
                                        <SelectItem value="Responsabilidade Civil">Responsabilidade Civil / RC Profissional</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Filtro Específico / Nicho de Atuação */}
                            <div className="space-y-2">
                                <Label className="text-slate-700 font-bold text-xs uppercase tracking-wider flex items-center justify-between">
                                    <span>Nicho de Atuação / Palavra-Chave</span>
                                    <span className="text-[10px] text-slate-400 font-normal lowercase">Seleção ou Digitação</span>
                                </Label>

                                {/* Dropdown de Nichos Pré-definidos */}
                                <Select
                                    onValueChange={(val) => {
                                        if (val === "custom") {
                                            setCustomQuery("");
                                        } else {
                                            setCustomQuery(val);
                                        }
                                    }}
                                >
                                    <SelectTrigger className="bg-white border-slate-200 text-xs">
                                        <SelectValue placeholder="Selecione um Nicho Recomendado..." />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-60">
                                        <SelectItem value="custom" className="font-semibold text-amber-600">
                                            ✏️ Digitar filtro personalizado...
                                        </SelectItem>
                                        <SelectItem value="Advocacia">🏢 Advocacia & Escritórios Jurídicos</SelectItem>
                                        <SelectItem value="Contabilidade">📊 Contabilidade & Consultorias</SelectItem>
                                        <SelectItem value="Tecnologia">💻 TI, Software & Startups</SelectItem>
                                        <SelectItem value="Marketing">📢 Agências de Marketing & Mídia</SelectItem>
                                        <SelectItem value="Indústria">🏭 Indústrias & Fábricas</SelectItem>
                                        <SelectItem value="Transportadora">🚛 Transportadoras & Frotas</SelectItem>
                                        <SelectItem value="Logística">📦 Logística & Depósitos</SelectItem>
                                        <SelectItem value="Construtora">🏗️ Construtoras & Engenharia</SelectItem>
                                        <SelectItem value="Clínica Médica">🏥 Clínicas Médicas & Hospitais</SelectItem>
                                        <SelectItem value="Dentista">🦷 Odontologia & Dentistas</SelectItem>
                                        <SelectItem value="Academia">💪 Academias & Fitness</SelectItem>
                                        <SelectItem value="Restaurante">🍽️ Restaurantes & Gastronomia</SelectItem>
                                        <SelectItem value="Padaria">🥐 Padarias & Confeitarias</SelectItem>
                                        <SelectItem value="Bar">🍸 Bares & Pubs</SelectItem>
                                        <SelectItem value="Supermercado">🛒 Supermercados & Mercados</SelectItem>
                                        <SelectItem value="Loja de Roupas">👗 Vestuário & Moda</SelectItem>
                                        <SelectItem value="Farmácia">💊 Farmácias & Manipulação</SelectItem>
                                        <SelectItem value="Pet Shop">🐶 Pet Shops & Veterinárias</SelectItem>
                                        <SelectItem value="Oficina Mecânica">🚗 Oficinas Mecânicas & Auto</SelectItem>
                                        <SelectItem value="Hotel">🏨 Hotéis & Pousadas</SelectItem>
                                        <SelectItem value="Salão de Beleza">✂️ Salões de Beleza & Estética</SelectItem>
                                        <SelectItem value="Escola">🎓 Escolas & Cursos</SelectItem>
                                        <SelectItem value="Imobiliária">🏠 Imobiliárias & Corretores</SelectItem>
                                    </SelectContent>
                                </Select>

                                {/* Campo para Escrever Livremente */}
                                <Input
                                    placeholder="Ou digite livremente ex: Hamburgueria, Drogaria..."
                                    value={customQuery}
                                    onChange={(e) => setCustomQuery(e.target.value)}
                                    className="bg-white border-slate-200 text-xs"
                                />
                            </div>

                            <Button
                                onClick={handleSearch}
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 hover:opacity-90 text-white font-bold h-11 shadow-md shadow-amber-500/20 rounded-xl transition-all"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Flame className="w-4 h-4 mr-2" />}
                                Medir Termômetro de Leads
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Interactive Map */}
                <div className="lg:col-span-2">
                    <Card className="premium-card border-none shadow-xl overflow-hidden" style={{ minHeight: 460 }}>
                        <div className="relative h-full" style={{ minHeight: 460 }}>
                            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
                            <div ref={mapRef} style={{ height: 460, width: '100%', borderRadius: '0.75rem', overflow: 'hidden' }} />
                            <div className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg shadow-lg border border-slate-100 flex items-center gap-2">
                                <MapIcon className="h-3.5 w-3.5 text-red-500" />
                                <span className="text-[10px] font-black uppercase text-slate-700">
                                    {results.length > 0 ? `${results.length} Leads no Termômetro` : 'Mapa de Leads'}
                                </span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Informational banner when search has not yet been executed */}
            {!searchPayload && !isLoading && (
                <div className="p-8 text-center bg-slate-50/80 rounded-2xl border border-dashed border-slate-200 space-y-2">
                    <Flame className="w-8 h-8 text-amber-500 mx-auto opacity-70" />
                    <h4 className="text-sm font-bold text-slate-800">Termômetro Pronto para Busca Manual</h4>
                    <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
                        Configure a região e o nicho desejado e clique no botão <b>"Medir Termômetro de Leads"</b> para visualizar empresas no mapa.
                        Nenhum lead é salvo ou enviado para o seu pipeline de forma automática.
                    </p>
                </div>
            )}

            {/* Results Grid & Selection Controls */}
            {(results.length > 0 || isLoading) && (
                <div className="space-y-4 pt-4">
                    {/* Header with Selection Toolbar */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                        <div>
                            <h4 className="text-lg font-display font-bold text-slate-900 flex items-center gap-2">
                                Oportunidades Identificadas ({results.length})
                            </h4>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                                CNPJ, e-mails e contatos já enriquecidos na busca. Selecione os que deseja para disparar ou agrupar.
                            </p>
                        </div>

                        {/* Quick Selection Actions */}
                        {!isLoading && results.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSelectAllOnPage(paginatedResults)}
                                    className="text-xs font-semibold h-8 border-slate-200"
                                >
                                    <CheckSquare className="w-3.5 h-3.5 mr-1 text-slate-600" />
                                    Página ({paginatedResults.length})
                                </Button>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSelectAllResults(results)}
                                    className="text-xs font-semibold h-8 border-slate-200"
                                >
                                    Todos ({results.length})
                                </Button>

                                {countSelected > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleClearSelection}
                                        className="text-xs font-semibold h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                    >
                                        Limpar ({countSelected})
                                    </Button>
                                )}

                                {/* Open Drawer Trigger Button */}
                                <Button
                                    size="sm"
                                    onClick={() => setIsDrawerOpen(true)}
                                    className={cn(
                                        "h-8 text-xs font-bold shadow-md transition-all rounded-lg flex items-center gap-1.5",
                                        countSelected > 0
                                            ? "bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 hover:opacity-95 text-white shadow-rose-500/25 animate-pulse"
                                            : "bg-slate-900 hover:bg-slate-800 text-white"
                                    )}
                                >
                                    <Layers className="w-3.5 h-3.5" />
                                    Gaveta de Disparos
                                    {countSelected > 0 && (
                                        <Badge className="bg-white text-rose-700 text-[10px] font-black h-4 px-1.5 ml-1">
                                            {countSelected}
                                        </Badge>
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Active Selection Summary Bar */}
                    {countSelected > 0 && (
                        <div className="p-3 bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 border border-rose-200/60 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-3">
                                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-rose-600" />
                                    {countSelected} {countSelected === 1 ? "lead selecionado" : "leads selecionados"}
                                </span>
                                <span className="text-slate-400">|</span>
                                <span className="text-slate-700 font-medium flex items-center gap-1">
                                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                                    <b>{countWithEmail}</b> com e-mail
                                </span>
                                <span className="text-slate-400">|</span>
                                <span className="text-slate-700 font-medium flex items-center gap-1">
                                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                                    <b>{countWithPhone}</b> com WhatsApp
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        setActiveDrawerTab("email");
                                        setIsDrawerOpen(true);
                                    }}
                                    className="h-7 text-[11px] font-bold bg-white text-blue-700 hover:bg-blue-50 border-blue-200"
                                >
                                    <Mail className="w-3 h-3 mr-1" /> Disparar E-mail
                                </Button>

                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        setActiveDrawerTab("whatsapp");
                                        setIsDrawerOpen(true);
                                    }}
                                    className="h-7 text-[11px] font-bold bg-white text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                                >
                                    <MessageSquare className="w-3 h-3 mr-1" /> Disparar WhatsApp
                                </Button>

                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        setActiveDrawerTab("create_group");
                                        setIsDrawerOpen(true);
                                    }}
                                    className="h-7 text-[11px] font-bold bg-white text-slate-700 hover:bg-slate-50 border-slate-200"
                                >
                                    <FolderPlus className="w-3 h-3 mr-1" /> Salvar Grupo
                                </Button>
                            </div>
                        </div>
                    )}

                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-16">
                            <Loader2 className="h-10 w-10 text-red-500 animate-spin mb-3" />
                            <p className="text-slate-500 font-medium text-sm">Analisando empresas, buscando CNPJs e calculando pontuações...</p>
                        </div>
                    )}

                    {!isLoading && results.length > 0 && (
                        <>
                            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                                {paginatedResults.map((lead, idx) => {
                                    const enriched = enrichedLeadsMap[lead.placeId];
                                    const savedContactId = savedLeadsMap[lead.placeId];
                                    const isSelected = !!selectedLeads[lead.placeId];

                                    return (
                                        <Card
                                            key={lead.placeId || idx}
                                            className={cn(
                                                "premium-card hover:-translate-y-1 transition-all duration-300 border shadow-lg group relative overflow-hidden flex flex-col justify-between",
                                                isSelected
                                                    ? "border-rose-400 ring-2 ring-rose-500/20 bg-rose-50/10"
                                                    : "border-slate-100"
                                            )}
                                        >
                                            {/* Top Thermometer Color Strip */}
                                            <div className={cn(
                                                "h-2 w-full",
                                                lead.temperature === "quente" && "bg-gradient-to-r from-red-500 via-rose-500 to-orange-500",
                                                lead.temperature === "morno" && "bg-gradient-to-r from-amber-400 via-amber-500 to-orange-400",
                                                lead.temperature === "frio" && "bg-gradient-to-r from-slate-400 via-blue-500 to-indigo-500"
                                            )} />

                                            <CardHeader className="pb-3">
                                                <div className="flex justify-between items-start gap-2">
                                                    <div className="flex items-center gap-2.5">
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onCheckedChange={(checked) => toggleLeadSelection(lead, !!checked)}
                                                            className="h-5 w-5 rounded border-slate-300 data-[state=checked]:bg-rose-600 data-[state=checked]:border-rose-600 cursor-pointer"
                                                        />
                                                        <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                                                            <Building2 className="h-4 w-4 text-slate-700" />
                                                        </div>
                                                    </div>
                                                    {renderTemperatureBadge(lead.temperature, lead.score)}
                                                </div>

                                                <CardTitle className="text-sm font-bold mt-3 leading-tight uppercase text-slate-900 line-clamp-2 min-h-[2.5rem]">
                                                    {lead.corporateName || enriched?.name || lead.name}
                                                </CardTitle>

                                                {lead.document && (
                                                    <CardDescription className="font-mono text-[10px] font-bold text-slate-600 flex items-center gap-1">
                                                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                                        CNPJ: {lead.document}
                                                    </CardDescription>
                                                )}
                                            </CardHeader>

                                            <CardContent className="space-y-3 pb-4 flex-1">
                                                {/* Address */}
                                                <div className="flex items-start gap-1.5 text-[11px] text-slate-600">
                                                    <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                                                    <span className="line-clamp-2">{enriched?.address || lead.address}</span>
                                                </div>

                                                {/* Phone & Email */}
                                                <div className="flex flex-col gap-1.5 pt-1">
                                                    {(enriched?.phone || lead.phone) ? (
                                                        <div className="flex items-center gap-1.5 text-[11px] text-slate-700 font-semibold">
                                                            <Phone className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                                            <span className="truncate">{enriched?.phone || lead.phone}</span>
                                                        </div>
                                                    ) : (
                                                        <div className="text-[10px] text-slate-400 italic">Telefone público não detectado</div>
                                                    )}

                                                    {(enriched?.email || lead.email) ? (
                                                        <div className="flex items-center gap-1.5 text-[11px] text-slate-700 font-medium truncate">
                                                            <Mail className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                                                            <span className="truncate font-mono">{enriched?.email || lead.email}</span>
                                                        </div>
                                                    ) : (
                                                        <div className="text-[10px] text-slate-400 italic">E-mail corporativo não detectado</div>
                                                    )}

                                                    {lead.website && (
                                                        <div className="flex items-center gap-1.5 text-[11px] text-blue-600 font-medium truncate">
                                                            <Globe className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                                            <a href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`} target="_blank" rel="noreferrer" className="hover:underline truncate">
                                                                {lead.website.replace(/^https?:\/\//, '')}
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Thermometer Reason / Interest */}
                                                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                                                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                                                        <Sparkles className="w-3 h-3 text-amber-500" />
                                                        Por que chegou a essa pontuação?
                                                    </div>
                                                    <p className="text-[10px] text-slate-600 leading-relaxed font-medium">
                                                        {lead.reason}
                                                    </p>
                                                </div>

                                                {/* Action Buttons: Puxar CNPJ + Iniciar Prospecção */}
                                                <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleFetchCnpjModal(lead)}
                                                        className="w-full text-xs font-bold text-slate-700 hover:bg-amber-50 border-slate-200 h-9"
                                                    >
                                                        <FileText className="w-3.5 h-3.5 mr-1 text-amber-500" />
                                                        Puxar CNPJ
                                                    </Button>

                                                    <Button
                                                        size="sm"
                                                        onClick={() => {
                                                            if (savedContactId) {
                                                                setActiveProspectingContact({
                                                                    id: savedContactId,
                                                                    name: lead.name,
                                                                    phone: lead.phone,
                                                                    email: lead.email,
                                                                });
                                                                setProspectingModalOpen(true);
                                                            } else {
                                                                startProspectingMutation.mutate(lead);
                                                            }
                                                        }}
                                                        disabled={startProspectingMutation.isPending}
                                                        className="w-full h-9 font-bold text-xs bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 hover:opacity-90 text-white shadow-sm rounded-lg"
                                                    >
                                                        {startProspectingMutation.isPending ? (
                                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <PhoneCall className="w-3.5 h-3.5 mr-1" />
                                                                Prospecção
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 pb-2 border-t border-slate-200">
                                    <div className="text-xs text-slate-500 font-medium">
                                        Exibindo <b>{(currentPage - 1) * pageSize + 1}</b> a <b>{Math.min(currentPage * pageSize, results.length)}</b> de <b>{results.length}</b> oportunidades
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="h-8 px-2.5 text-xs font-semibold"
                                        >
                                            <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
                                        </Button>

                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                                .map((pageNum, idx, arr) => {
                                                    const prev = arr[idx - 1];
                                                    return (
                                                        <div key={pageNum} className="flex items-center">
                                                            {prev && pageNum - prev > 1 && (
                                                                <span className="px-1 text-slate-400 text-xs">...</span>
                                                            )}
                                                            <Button
                                                                variant={currentPage === pageNum ? "default" : "outline"}
                                                                size="sm"
                                                                onClick={() => setCurrentPage(pageNum)}
                                                                className={cn(
                                                                    "h-8 w-8 p-0 text-xs font-bold",
                                                                    currentPage === pageNum && "bg-rose-600 hover:bg-rose-700 text-white"
                                                                )}
                                                            >
                                                                {pageNum}
                                                            </Button>
                                                        </div>
                                                    );
                                                })}
                                        </div>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="h-8 px-2.5 text-xs font-semibold"
                                        >
                                            Próxima <ChevronRight className="w-4 h-4 ml-1" />
                                        </Button>

                                        {/* Page Size Selector */}
                                        <Select
                                            value={String(pageSize)}
                                            onValueChange={(val) => {
                                                setPageSize(Number(val));
                                                setCurrentPage(1);
                                            }}
                                        >
                                            <SelectTrigger className="h-8 w-20 text-xs bg-white border-slate-200 ml-2">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="6">6 / pág</SelectItem>
                                                <SelectItem value="9">9 / pág</SelectItem>
                                                <SelectItem value="15">15 / pág</SelectItem>
                                                <SelectItem value="30">30 / pág</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Sticky Floating Bottom Bar for Fast Action */}
            {countSelected > 0 && !isDrawerOpen && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="bg-slate-900/95 backdrop-blur text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-4">
                        <div className="flex items-center gap-2 text-xs">
                            <span className="font-black text-rose-400 flex items-center gap-1">
                                <CheckSquare className="w-4 h-4" />
                                {countSelected}
                            </span>
                            <span className="text-slate-300">selecionados</span>
                            <span className="text-slate-600">|</span>
                            <span className="text-slate-300 flex items-center gap-1">
                                <Mail className="w-3.5 h-3.5 text-blue-400" /> {countWithEmail}
                            </span>
                            <span className="text-slate-600">|</span>
                            <span className="text-slate-300 flex items-center gap-1">
                                <Phone className="w-3.5 h-3.5 text-emerald-400" /> {countWithPhone}
                            </span>
                        </div>

                        <Button
                            size="sm"
                            onClick={() => setIsDrawerOpen(true)}
                            className="h-8 bg-gradient-to-r from-rose-600 to-amber-600 hover:opacity-90 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/30"
                        >
                            <Layers className="w-3.5 h-3.5 mr-1" />
                            Abrir Gaveta de Disparos
                        </Button>
                    </div>
                </div>
            )}

            {/* Gavetinha de Disparos & Grupos de Leads (Sheet Drawer) */}
            <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                <SheetContent side="right" className="w-full sm:max-w-xl md:max-w-2xl overflow-y-auto p-6 bg-slate-50/50">
                    <SheetHeader className="pb-4 border-b border-slate-200">
                        <div className="flex items-center gap-2">
                            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-rose-600 to-amber-600 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
                                <Layers className="w-5 h-5" />
                            </div>
                            <div>
                                <SheetTitle className="text-lg font-bold text-slate-900">
                                    Gaveta de Disparos & Grupos de Leads
                                </SheetTitle>
                                <SheetDescription className="text-xs text-slate-500">
                                    Envie e-mails, acione WhatsApp ou crie grupos separados do funil de vendas.
                                </SheetDescription>
                            </div>
                        </div>

                        {/* Status Badges */}
                        <div className="flex flex-wrap items-center gap-2 pt-3">
                            <Badge variant="secondary" className="text-[11px] font-semibold bg-white border border-slate-200 text-slate-700">
                                Total Selecionados: <b className="ml-1 text-slate-900">{countSelected}</b>
                            </Badge>
                            <Badge variant="secondary" className="text-[11px] font-semibold bg-blue-50 border border-blue-200 text-blue-800">
                                <Mail className="w-3 h-3 mr-1 text-blue-600" />
                                Com E-mail: <b className="ml-1">{countWithEmail}</b>
                            </Badge>
                            <Badge variant="secondary" className="text-[11px] font-semibold bg-emerald-50 border border-emerald-200 text-emerald-800">
                                <Phone className="w-3 h-3 mr-1 text-emerald-600" />
                                Com WhatsApp: <b className="ml-1">{countWithPhone}</b>
                            </Badge>
                        </div>
                    </SheetHeader>

                    {/* Drawer Content Tabs */}
                    <div className="py-5">
                        <Tabs value={activeDrawerTab} onValueChange={setActiveDrawerTab} className="w-full">
                            <TabsList className="grid grid-cols-4 w-full bg-slate-200/70 p-1 rounded-xl mb-4">
                                <TabsTrigger value="email" className="text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                    <Mail className="w-3.5 h-3.5 mr-1 text-blue-600" /> E-mail
                                </TabsTrigger>
                                <TabsTrigger value="whatsapp" className="text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                    <MessageSquare className="w-3.5 h-3.5 mr-1 text-emerald-600" /> WhatsApp
                                </TabsTrigger>
                                <TabsTrigger value="create_group" className="text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                    <FolderPlus className="w-3.5 h-3.5 mr-1 text-amber-600" /> Criar Grupo
                                </TabsTrigger>
                                <TabsTrigger value="saved_groups" className="text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                    <Clock className="w-3.5 h-3.5 mr-1 text-slate-600" /> Salvos ({dispatchGroups.length})
                                </TabsTrigger>
                            </TabsList>

                            {/* TAB 1: DISPARO DE E-MAIL */}
                            <TabsContent value="email" className="space-y-4">
                                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 space-y-1.5">
                                    <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1">
                                        <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Tags Dinâmicas Disponíveis
                                    </span>
                                    <p className="text-xs text-blue-700 leading-relaxed">
                                        Clique para copiar: <code className="bg-white px-1.5 py-0.5 rounded border border-blue-200 font-mono text-[10px]">{"{empresa}"}</code>, <code className="bg-white px-1.5 py-0.5 rounded border border-blue-200 font-mono text-[10px]">{"{nome}"}</code>, <code className="bg-white px-1.5 py-0.5 rounded border border-blue-200 font-mono text-[10px]">{"{produto}"}</code>, <code className="bg-white px-1.5 py-0.5 rounded border border-blue-200 font-mono text-[10px]">{"{cnpj}"}</code>.
                                    </p>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-slate-700">Assunto do E-mail</Label>
                                    <Input
                                        value={emailSubject}
                                        onChange={(e) => setEmailSubject(e.target.value)}
                                        className="bg-white border-slate-200 text-xs font-medium"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-slate-700">Corpo do E-mail (HTML / Texto)</Label>
                                    <Textarea
                                        rows={8}
                                        value={emailBody}
                                        onChange={(e) => setEmailBody(e.target.value)}
                                        className="bg-white border-slate-200 text-xs font-mono leading-relaxed"
                                    />
                                </div>

                                {/* Preview of First Lead */}
                                {selectedLeadsList.length > 0 && (
                                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1 text-xs">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Prévia do 1º Destinatário</span>
                                        <div className="font-semibold text-slate-800">
                                            Para: {selectedLeadsList[0]?.email || "Sem e-mail cadastrado"} ({selectedLeadsList[0]?.corporateName || selectedLeadsList[0]?.name})
                                        </div>
                                        <div className="text-[11px] text-slate-600 truncate">
                                            Assunto: {emailSubject.replace(/\{empresa\}/gi, selectedLeadsList[0]?.corporateName || selectedLeadsList[0]?.name)}
                                        </div>
                                    </div>
                                )}

                                <Button
                                    onClick={handleSendEmailDispatch}
                                    disabled={isSendingEmail || countWithEmail === 0}
                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white font-bold h-11 rounded-xl shadow-md"
                                >
                                    {isSendingEmail ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando e-mails para {countWithEmail} destinatários...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4 mr-2" /> Disparar E-mail para {countWithEmail} {countWithEmail === 1 ? "lead" : "leads"}
                                        </>
                                    )}
                                </Button>

                                {/* Email Result Report */}
                                {emailDispatchResult && (
                                    <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2 text-xs">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-slate-900">Relatório do Disparo</span>
                                            <Badge className={emailDispatchResult.sent > 0 ? "bg-emerald-600" : "bg-rose-600"}>
                                                {emailDispatchResult.sent} enviados · {emailDispatchResult.failed} falhas
                                            </Badge>
                                        </div>
                                        <p className="text-slate-600">{emailDispatchResult.message}</p>
                                    </div>
                                )}
                            </TabsContent>

                            {/* TAB 2: DISPARO DE WHATSAPP */}
                            <TabsContent value="whatsapp" className="space-y-4">
                                <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100 space-y-1.5">
                                    <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1">
                                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> Integração Monteiro Conecta (WhatsApp Central)
                                    </span>
                                    <p className="text-xs text-emerald-700 leading-relaxed">
                                        O disparo em lote envia mensagens para a fila do WhatsApp conectado. Você também pode disparar individualmente via WhatsApp Web.
                                    </p>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-slate-700">Mensagem para Disparo WhatsApp</Label>
                                    <Textarea
                                        rows={6}
                                        value={whatsappTemplate}
                                        onChange={(e) => setWhatsappTemplate(e.target.value)}
                                        className="bg-white border-slate-200 text-xs leading-relaxed"
                                    />
                                </div>

                                <Button
                                    onClick={handleSendWhatsappDispatch}
                                    disabled={isSendingWhatsapp || countWithPhone === 0}
                                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white font-bold h-11 rounded-xl shadow-md"
                                >
                                    {isSendingWhatsapp ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Conectando ao Monteiro Conecta...
                                        </>
                                    ) : (
                                        <>
                                            <Share2 className="w-4 h-4 mr-2" /> Disparar em Massa via WhatsApp ({countWithPhone} contatos)
                                        </>
                                    )}
                                </Button>

                                {/* WhatsApp Results / Direct Links */}
                                {whatsappDispatchResult && (
                                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2 text-xs">
                                        <span className="font-bold text-slate-900">Resultado do WhatsApp</span>
                                        <p className="text-slate-600">{whatsappDispatchResult.message || whatsappDispatchResult.warning}</p>
                                    </div>
                                )}

                                {/* Individual WhatsApp Quick-Send List */}
                                <div className="pt-2 space-y-2">
                                    <Label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                                        <span>Envio Rápido 1 a 1 no WhatsApp Web</span>
                                        <span className="text-[10px] text-slate-400 font-normal">Abre direto a conversa</span>
                                    </Label>

                                    <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                                        {selectedLeadsList.filter(l => l.phone).map((lead, idx) => {
                                            const cleanPhone = String(lead.phone).replace(/\D/g, "");
                                            const formattedPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
                                            const personalizedMsg = encodeURIComponent(
                                                whatsappTemplate
                                                    .replace(/\{empresa\}/gi, lead.corporateName || lead.name)
                                                    .replace(/\{nome\}/gi, lead.name)
                                                    .replace(/\{produto\}/gi, productType)
                                            );
                                            const waUrl = `https://wa.me/${formattedPhone}?text=${personalizedMsg}`;

                                            return (
                                                <div key={lead.placeId || idx} className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between gap-2 text-xs">
                                                    <div className="truncate">
                                                        <div className="font-bold text-slate-800 truncate">{lead.corporateName || lead.name}</div>
                                                        <div className="text-[11px] text-slate-500 font-mono">{lead.phone}</div>
                                                    </div>
                                                    <a
                                                        href={waUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md font-bold text-[11px] transition-colors shrink-0"
                                                    >
                                                        Abrir Web <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </TabsContent>

                            {/* TAB 3: CRIAR GRUPO DE DISPARO */}
                            <TabsContent value="create_group" className="space-y-4">
                                <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-100 text-xs text-amber-900 leading-relaxed">
                                    Crie grupos temáticos (ex: "Leads Benefícios Campinas", "Restaurantes VR") para disparos futuros sem poluir o pipeline de vendas.
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-slate-700">Nome do Grupo</Label>
                                    <Input
                                        placeholder="Ex: PMEs Benefícios Pinheiros 22/09"
                                        value={groupName}
                                        onChange={(e) => setGroupName(e.target.value)}
                                        className="bg-white border-slate-200 text-xs"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-slate-700">Canal Principal de Disparo</Label>
                                    <Select value={groupChannel} onValueChange={setGroupChannel}>
                                        <SelectTrigger className="bg-white text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="omnichannel">Omnichannel (E-mail + WhatsApp)</SelectItem>
                                            <SelectItem value="email">Apenas E-mail</SelectItem>
                                            <SelectItem value="whatsapp">Apenas WhatsApp</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-slate-700">Descrição / Anotações (Opcional)</Label>
                                    <Textarea
                                        placeholder="Notas de contexto para este grupo de prospecção..."
                                        rows={3}
                                        value={groupDescription}
                                        onChange={(e) => setGroupDescription(e.target.value)}
                                        className="bg-white border-slate-200 text-xs"
                                    />
                                </div>

                                <Button
                                    onClick={handleSaveDispatchGroup}
                                    disabled={isSavingGroup || countSelected === 0}
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-11 rounded-xl shadow-md"
                                >
                                    {isSavingGroup ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : (
                                        <FolderPlus className="w-4 h-4 mr-2" />
                                    )}
                                    Salvar Grupo com {countSelected} {countSelected === 1 ? "lead" : "leads"}
                                </Button>
                            </TabsContent>

                            {/* TAB 4: GRUPOS SALVOS */}
                            <TabsContent value="saved_groups" className="space-y-3">
                                {dispatchGroups.length === 0 ? (
                                    <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-200 text-xs text-slate-500 space-y-1">
                                        <FolderPlus className="w-8 h-8 text-slate-300 mx-auto" />
                                        <div className="font-bold text-slate-700">Nenhum grupo de disparo salvo ainda</div>
                                        <div>Selecione leads no termômetro e salve o primeiro grupo na aba ao lado.</div>
                                    </div>
                                ) : (
                                    <div className="space-y-2.5">
                                        {dispatchGroups.map((grp: any) => {
                                            const totalInGrp = Array.isArray(grp.leads) ? grp.leads.length : 0;
                                            return (
                                                <div key={grp.id} className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors shadow-sm space-y-2">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            <div className="font-bold text-slate-900 text-xs">{grp.name}</div>
                                                            {grp.description && (
                                                                <p className="text-[11px] text-slate-500 line-clamp-1">{grp.description}</p>
                                                            )}
                                                        </div>
                                                        <Badge variant="outline" className="text-[10px] uppercase font-bold shrink-0">
                                                            {grp.channel}
                                                        </Badge>
                                                    </div>

                                                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                                                        <span><b>{totalInGrp}</b> leads no grupo</span>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleLoadDispatchGroup(grp)}
                                                            className="h-7 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                                                        >
                                                            Carregar Leads <ArrowRight className="w-3 h-3 ml-1" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Modal: Puxar CNPJ & Dados da Empresa */}
            <Dialog open={cnpjModalOpen} onOpenChange={setCnpjModalOpen}>
                <DialogContent className="max-w-2xl bg-white p-6 rounded-2xl shadow-2xl border-none">
                    <DialogHeader>
                        <div className="flex items-center gap-2">
                            <Building className="h-5 w-5 text-amber-500" />
                            <DialogTitle className="text-lg font-bold text-slate-900">
                                Dados da Receita Federal / CNPJ
                            </DialogTitle>
                        </div>
                        <DialogDescription className="text-xs text-slate-500">
                            Consulta completa de situação cadastral e detalhes corporativos.
                        </DialogDescription>
                    </DialogHeader>

                    {isLoadingCnpjModal ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 text-amber-500 animate-spin mb-2" />
                            <p className="text-xs text-slate-500 font-medium">Consultando base da Receita Federal e Descoberta de CNPJ...</p>
                        </div>
                    ) : cnpjModalData?.cnpj ? (
                        <div className="space-y-4 text-xs">
                            {/* Status Header */}
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                                <div>
                                    <h4 className="font-bold text-sm uppercase text-slate-900">{cnpjModalData.razao_social || cnpjModalData.nome_fantasia}</h4>
                                    <p className="text-[11px] text-slate-500">CNPJ: <span className="font-mono font-bold text-slate-700">{cnpjModalData.cnpj}</span></p>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {cnpjModalData.discoveredAuto && (
                                        <Badge className="bg-amber-500 text-white font-bold text-[10px]">
                                            ✨ AUTO-DESCOBERTO
                                        </Badge>
                                    )}
                                    <Badge className="bg-emerald-500 text-white font-bold text-[10px]">
                                        SITUAÇÃO ATIVA
                                    </Badge>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-3 p-3 bg-white rounded-xl border border-slate-100">
                                <div>
                                    <span className="text-[10px] font-bold uppercase text-slate-400 block">CNAE Principal</span>
                                    <span className="font-semibold text-slate-800">{cnpjModalData.cnae_principal_descricao || "Não informado"}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Município / UF</span>
                                    <span className="font-semibold text-slate-800">{cnpjModalData.municipio} / {cnpjModalData.uf}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Telefone Principal</span>
                                    <span className="font-semibold text-slate-800">{cnpjModalData.ddd_telefone_1 || selectedLeadForCnpj?.phone || "Não informado"}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold uppercase text-slate-400 block">E-mail Institucional</span>
                                    <span className="font-semibold text-slate-800">{cnpjModalData.email || selectedLeadForCnpj?.email || "Não informado"}</span>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Logradouro / Endereço</span>
                                    <span className="font-semibold text-slate-800">{[cnpjModalData.logradouro, cnpjModalData.numero, cnpjModalData.bairro, cnpjModalData.cep].filter(Boolean).join(", ") || selectedLeadForCnpj?.address || "Não informado"}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-6 text-center bg-slate-50 rounded-xl space-y-4">
                            <div className="flex items-center justify-center gap-2 text-slate-800 font-bold text-sm">
                                <Building2 className="h-5 w-5 text-amber-500" />
                                {selectedLeadForCnpj?.name}
                            </div>
                            <p className="text-xs text-slate-600 font-medium max-w-md mx-auto">
                                CNPJ não foi localizado automaticamente para esta empresa na região ({locationInput}). Insira o CNPJ manualmente para consultar a Receita Federal:
                            </p>
                            <div className="flex gap-2 max-w-sm mx-auto">
                                <Input
                                    placeholder="00.000.000/0000-00"
                                    onChange={async (e) => {
                                        const clean = e.target.value.replace(/\D/g, "");
                                        if (clean.length === 14) {
                                            setIsLoadingCnpjModal(true);
                                            try {
                                                const res = await apiRequest("GET", `/api/proxy/companies/${clean}`);
                                                if (res.ok) {
                                                    const arr = await res.json();
                                                    const data = Array.isArray(arr) ? arr[0] : arr;
                                                    if (data && data.cnpj) {
                                                        setCnpjModalData(data);
                                                        if (selectedLeadForCnpj) {
                                                            selectedLeadForCnpj.document = data.cnpj;
                                                            setEnrichedLeadsMap(prev => ({
                                                                ...prev,
                                                                [selectedLeadForCnpj.placeId]: {
                                                                    ...(prev[selectedLeadForCnpj.placeId] || {}),
                                                                    document: data.cnpj,
                                                                    name: data.razao_social || data.nome_fantasia || selectedLeadForCnpj.name,
                                                                    address: [data.logradouro, data.numero, data.bairro, data.municipio, data.uf].filter(Boolean).join(", ") || selectedLeadForCnpj.address,
                                                                    phone: data.ddd_telefone_1 || selectedLeadForCnpj.phone || null,
                                                                    email: data.email || selectedLeadForCnpj.email || null,
                                                                }
                                                            }));
                                                        }
                                                    }
                                                }
                                            } catch (err) {
                                                // ignore
                                            } finally {
                                                setIsLoadingCnpjModal(false);
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0">
                        {selectedLeadForCnpj && (
                            <Button
                                onClick={() => {
                                    setCnpjModalOpen(false);
                                    startProspectingMutation.mutate(selectedLeadForCnpj);
                                }}
                                className="bg-gradient-to-r from-red-600 to-amber-600 text-white font-bold text-xs"
                            >
                                <PhoneCall className="w-3.5 h-3.5 mr-1" />
                                Iniciar Prospecção com Este Lead
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal: Célula de Prospecção Rápida */}
            <Dialog open={prospectingModalOpen} onOpenChange={setProspectingModalOpen}>
                <DialogContent className="max-w-lg bg-white p-6 rounded-2xl shadow-2xl border-none">
                    <DialogHeader>
                        <div className="flex items-center gap-2">
                            <PhoneCall className="h-5 w-5 text-red-500" />
                            <DialogTitle className="text-lg font-bold text-slate-900">
                                Prospecção Ativa: {activeProspectingContact?.name}
                            </DialogTitle>
                        </div>
                        <DialogDescription className="text-xs text-slate-500">
                            Registre o resultado da chamada e defina o próximo passo comercial.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 text-xs pt-2">
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 space-y-1">
                            <div className="font-bold text-amber-900">{activeProspectingContact?.name}</div>
                            {activeProspectingContact?.phone && (
                                <div className="font-semibold text-slate-700 flex items-center gap-1">
                                    <Phone className="w-3 h-3 text-emerald-600" /> {activeProspectingContact.phone}
                                </div>
                            )}
                        </div>

                        {/* Resultado da Chamada */}
                        <div className="space-y-1.5">
                            <Label className="text-slate-700 font-bold text-xs">Resultado da Chamada</Label>
                            <Select value={callOutcome} onValueChange={setCallOutcome}>
                                <SelectTrigger className="bg-white">
                                    <SelectValue placeholder="Selecione o resultado" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="connected">Conectado (Falou com decisor)</SelectItem>
                                    <SelectItem value="no_answer">Sem Atendimento</SelectItem>
                                    <SelectItem value="busy">Ocupado</SelectItem>
                                    <SelectItem value="wrong_number">Número Errado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Nível de Interesse */}
                        <div className="space-y-1.5">
                            <Label className="text-slate-700 font-bold text-xs">Nível de Interesse</Label>
                            <Select value={interestLevel} onValueChange={setInterestLevel}>
                                <SelectTrigger className="bg-white">
                                    <SelectValue placeholder="Selecione o interesse" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="high">🔥 Alto (Agendar Proposta)</SelectItem>
                                    <SelectItem value="medium">☀️ Médio (Acompanhamento)</SelectItem>
                                    <SelectItem value="low">❄️ Baixo (Sem interesse imediato)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Notas da Conversa */}
                        <div className="space-y-1.5">
                            <Label className="text-slate-700 font-bold text-xs">Observações da Prospecção</Label>
                            <Textarea
                                placeholder="Descreva os detalhes da conversa, horários sugeridos ou necessidades do cliente..."
                                value={prospectingNotes}
                                onChange={(e) => setProspectingNotes(e.target.value)}
                                className="bg-white min-h-[80px]"
                            />
                        </div>

                        {/* Envio Opcional ao Pipeline */}
                        <div className="flex items-start space-x-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50">
                            <Checkbox
                                id="sendToPipeline"
                                checked={sendToPipeline}
                                onCheckedChange={(checked) => setSendToPipeline(!!checked)}
                                className="mt-0.5"
                            />
                            <div className="grid gap-1 leading-none">
                                <label
                                    htmlFor="sendToPipeline"
                                    className="text-xs font-bold text-slate-800 cursor-pointer select-none"
                                >
                                    Enviar esta oportunidade para o Pipeline (Funil de Vendas)
                                </label>
                                <p className="text-[11px] text-slate-500 leading-relaxed">
                                    Desmarcado por padrão. Ative somente se o cliente tiver interesse real para não lotar seu pipeline automaticamente.
                                </p>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0 pt-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setProspectingModalOpen(false);
                                if (activeProspectingContact?.id) {
                                    setLocation(`/admin/prospecting?contactId=${activeProspectingContact.id}`);
                                }
                            }}
                            className="text-xs font-semibold text-slate-700"
                        >
                            Abrir Célula Completa <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>

                        <Button
                            onClick={handleSaveProspectingLog}
                            disabled={saveProspectingLogMutation.isPending}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                        >
                            {saveProspectingLogMutation.isPending ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                            ) : (
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            )}
                            Salvar Prospecção
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
