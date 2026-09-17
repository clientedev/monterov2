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
    ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ThermometerLead {
    placeId: string;
    name: string;
    address: string;
    phone?: string;
    email?: string;
    website?: string;
    document?: string;
    location: { lat: number; lng: number };
    rating?: number;
    userRatingsTotal?: number;
    score: number; // 0 a 100
    temperature: "frio" | "morno" | "quente";
    reason: string;
    productType: string;
    cnae?: string;
    enriched?: boolean;
}

export default function LeadsThermometer() {
    const { toast } = useToast();
    const [, setLocation] = useLocation();
    
    const [locationInput, setLocationInput] = useState("São Paulo, SP");
    const [radiusKm, setRadiusKm] = useState("10");
    const [productType, setProductType] = useState("Plano de Saúde");
    const [customQuery, setCustomQuery] = useState("");
    
    const [searchPayload, setSearchPayload] = useState<any>({
        location: "São Paulo, SP",
        radiusKm: 10,
        productType: "Plano de Saúde",
        customQuery: "",
    });
    
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

        const cleanDoc = lead.document ? lead.document.replace(/\D/g, "") : "";
        if (cleanDoc && cleanDoc.length === 14) {
            setIsLoadingCnpjModal(true);
            try {
                const res = await apiRequest("GET", `/api/proxy/companies/${cleanDoc}`);
                if (res.ok) {
                    const [data] = await res.json();
                    setCnpjModalData(data);
                }
            } catch (err) {
                console.error("Error fetching CNPJ data:", err);
            } finally {
                setIsLoadingCnpjModal(false);
            }
        }
    };

    // Save & Start Prospecting Mutation
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
                setProspectingModalOpen(true);
                queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
                queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
                toast({
                    title: "Lead Salvo & Enviado para Prospecção",
                    description: `${lead.name} pronto para prospecção ativa.`,
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
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/prospecting"] });
            queryClient.invalidateQueries({ queryKey: ["/api/interactions"] });
            setProspectingModalOpen(false);
            toast({ title: "Prospecção Registrada", description: "Resultado da ligação salvo com sucesso!" });
        }
    });

    const handleSaveProspectingLog = () => {
        if (!activeProspectingContact) return;
        saveProspectingLogMutation.mutate({
            contactId: activeProspectingContact.id,
            callOutcome,
            interestLevel,
            notes: prospectingNotes || `Prospecção iniciada via Termômetro de Leads (${productType}).`,
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
                                        <SelectItem value="Plano de Saúde">Plano de Saúde (Empresarial / PME)</SelectItem>
                                        <SelectItem value="Seguro de Vida">Seguro de Vida (Individual / Grupo)</SelectItem>
                                        <SelectItem value="Seguro Auto / Frota">Seguro Auto / Frota Corporativa</SelectItem>
                                        <SelectItem value="Seguro Empresarial">Seguro Empresarial / Patrimonial</SelectItem>
                                        <SelectItem value="Responsabilidade Civil">Responsabilidade Civil / RC Profissional</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Palavra-chave opcional */}
                            <div className="space-y-1.5">
                                <Label className="text-slate-700 font-bold text-xs uppercase tracking-wider">Filtro Específico (Opcional)</Label>
                                <Input
                                    placeholder="Ex: Indústria, Restaurante, Advocacia"
                                    value={customQuery}
                                    onChange={(e) => setCustomQuery(e.target.value)}
                                    className="bg-white border-slate-200"
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

            {/* Results Grid */}
            {(results.length > 0 || isLoading) && (
                <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-xl font-display font-bold text-slate-900 flex items-center gap-2">
                                Oportunidades Identificadas ({results.length})
                            </h4>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                                Leads ordenados por intenção de compra. Puxe o CNPJ ou inicie a prospecção direto do card.
                            </p>
                        </div>
                    </div>

                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-16">
                            <Loader2 className="h-10 w-10 text-red-500 animate-spin mb-3" />
                            <p className="text-slate-500 font-medium text-sm">Analisando empresas e calculando pontuações do termômetro...</p>
                        </div>
                    )}

                    {!isLoading && results.length > 0 && (
                        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                            {results.map((lead, idx) => {
                                const enriched = enrichedLeadsMap[lead.placeId];
                                const savedContactId = savedLeadsMap[lead.placeId];

                                return (
                                    <Card key={lead.placeId || idx} className="premium-card hover:-translate-y-1 transition-all duration-300 border-none shadow-lg group relative overflow-hidden flex flex-col justify-between">
                                        {/* Top Thermometer Color Strip */}
                                        <div className={cn(
                                            "h-2 w-full",
                                            lead.temperature === "quente" && "bg-gradient-to-r from-red-500 via-rose-500 to-orange-500",
                                            lead.temperature === "morno" && "bg-gradient-to-r from-amber-400 via-amber-500 to-orange-400",
                                            lead.temperature === "frio" && "bg-gradient-to-r from-slate-400 via-blue-500 to-indigo-500"
                                        )} />

                                        <CardHeader className="pb-3">
                                            <div className="flex justify-between items-start gap-2">
                                                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                                                    <Building2 className="h-5 w-5 text-slate-700" />
                                                </div>
                                                {renderTemperatureBadge(lead.temperature, lead.score)}
                                            </div>

                                            <CardTitle className="text-sm font-bold mt-3 leading-tight uppercase text-slate-900 line-clamp-2 min-h-[2.5rem]">
                                                {enriched?.name || lead.name}
                                            </CardTitle>

                                            {lead.document && (
                                                <CardDescription className="font-mono text-[10px] font-bold text-slate-500">
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
                                                        <Phone className="h-3.5 w-3.5 text-emerald-600" />
                                                        {enriched?.phone || lead.phone}
                                                    </div>
                                                ) : (
                                                    <div className="text-[10px] text-slate-400 italic">Telefone público não detectado</div>
                                                )}

                                                {(enriched?.email || lead.email) && (
                                                    <div className="flex items-center gap-1.5 text-[11px] text-slate-700 font-medium truncate">
                                                        <Mail className="h-3.5 w-3.5 text-blue-600" />
                                                        {enriched?.email || lead.email}
                                                    </div>
                                                )}

                                                {lead.website && (
                                                    <div className="flex items-center gap-1.5 text-[11px] text-blue-600 font-medium truncate">
                                                        <Globe className="h-3.5 w-3.5 text-blue-500" />
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
                    )}
                </div>
            )}

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
                            <p className="text-xs text-slate-500 font-medium">Consultando base da Receita Federal...</p>
                        </div>
                    ) : cnpjModalData ? (
                        <div className="space-y-4 text-xs">
                            {/* Status Header */}
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                                <div>
                                    <h4 className="font-bold text-sm uppercase text-slate-900">{cnpjModalData.razao_social || cnpjModalData.nome_fantasia}</h4>
                                    <p className="text-[11px] text-slate-500">CNPJ: <span className="font-mono font-bold text-slate-700">{cnpjModalData.cnpj}</span></p>
                                </div>
                                <Badge className="bg-emerald-500 text-white font-bold text-[10px]">
                                    SITUAÇÃO ATIVA
                                </Badge>
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
                                    <span className="font-semibold text-slate-800">{cnpjModalData.ddd_telefone_1 || "Não informado"}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold uppercase text-slate-400 block">E-mail Institucional</span>
                                    <span className="font-semibold text-slate-800">{cnpjModalData.email || "Não informado"}</span>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Logradouro / Endereço</span>
                                    <span className="font-semibold text-slate-800">{[cnpjModalData.logradouro, cnpjModalData.numero, cnpjModalData.bairro, cnpjModalData.cep].filter(Boolean).join(", ")}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-6 text-center bg-slate-50 rounded-xl space-y-3">
                            <Info className="h-8 w-8 text-amber-500 mx-auto" />
                            <p className="text-xs text-slate-600 font-medium">
                                Nenhuma consulta automática encontrada pelo CNPJ informado. Digite o CNPJ para buscar os dados diretamente:
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
                                                    const [data] = await res.json();
                                                    setCnpjModalData(data);
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
