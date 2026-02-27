import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
    Building2,
    MapPin,
    Search,
    Filter,
    Plus,
    ChevronRight,
    Loader2,
    Target,
    Map as MapIcon,
    AlertCircle,
    Check,
    ChevronsUpDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export default function CompanySearchPage() {
    const { toast } = useToast();
    const [stateId, setStateId] = useState<string>("");
    const [stateName, setStateName] = useState<string>("");
    const [cityId, setCityId] = useState<string>("");
    const [cityName, setCityName] = useState<string>("");
    const [neighborhood, setNeighborhood] = useState("");
    const [cnae, setCnae] = useState("");
    const [query, setQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;
    const [searchUrl, setSearchUrl] = useState<string | null>(null);
    const mapRef = useRef<HTMLDivElement>(null);
    const leafletMapRef = useRef<any>(null);

    // IBGE API - States
    const { data: states } = useQuery<any[]>({
        queryKey: ["ibge-states"],
        queryFn: () => fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome").then(r => r.json()),
        staleTime: Infinity,
    });

    // IBGE API - Cities
    const { data: cities, isLoading: isLoadingCities } = useQuery<any[]>({
        queryKey: ["ibge-cities", stateId],
        queryFn: () => fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${stateId}/municipios`).then(r => r.json()),
        enabled: !!stateId,
        staleTime: Infinity,
    });

    // IBGE API - Districts (Bairros equivalent)
    const { data: districts, isLoading: isLoadingDistricts } = useQuery<any[]>({
        queryKey: ["ibge-districts", cityId],
        queryFn: () => fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/municipios/${cityId}/distritos`).then(r => r.json()),
        enabled: !!cityId,
        staleTime: Infinity,
    });

    // Search Results
    const { data: results, isLoading, error } = useQuery<any[]>({
        queryKey: [searchUrl],
        queryFn: () => apiRequest("GET", searchUrl!).then(r => r.json()),
        enabled: !!searchUrl,
    });

    // Lazily load Leaflet to avoid SSR/module resolution issues
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

            // Add a custom button to the map for recentering
            const RecenterControl = L.default.Control.extend({
                onAdd: function () {
                    const btn = L.default.DomUtil.create('button', 'leaflet-bar leaflet-control leaflet-control-custom');
                    btn.innerHTML = '🏠';
                    btn.style.backgroundColor = 'white';
                    btn.style.width = '30px';
                    btn.style.height = '30px';
                    btn.style.cursor = 'pointer';
                    btn.title = 'Recentrar Mapa';
                    btn.onclick = function () {
                        map.flyTo([-23.5505, -46.6333], 11);
                    };
                    return btn;
                }
            });
            new RecenterControl({ position: 'topleft' }).addTo(map);

            leafletMapRef.current = { map, L: L.default };
        }).catch(console.error);
    }, []);

    // Update map when results come in
    useEffect(() => {
        if (!leafletMapRef.current || !results) return;
        const { map, L } = leafletMapRef.current;

        // Clear existing markers
        map.eachLayer((layer: any) => {
            if (layer instanceof L.Marker) map.removeLayer(layer);
        });

        // Geocode the searched location and add markers
        const loc = neighborhood ? `${neighborhood}, ${cityName}, ${stateName}, Brasil` : `${cityName}, ${stateName}, Brasil`;
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(loc)}&limit=1`)
            .then(r => r.json())
            .then(geoData => {
                if (geoData?.[0]) {
                    const lat = parseFloat(geoData[0].lat);
                    const lng = parseFloat(geoData[0].lon);
                    map.flyTo([lat, lng], neighborhood ? 14 : 12, { duration: 1.5 });

                    results.forEach((company, idx) => {
                        // Spread markers around center point for demo
                        const offset = (idx - results.length / 2) * 0.003;
                        const latPos = lat + offset + (Math.random() - 0.5) * 0.002;
                        const lngPos = lng + offset * 0.8 + (Math.random() - 0.5) * 0.002;

                        // Store these coordinates on the object for handleFocusMarker
                        company.lat = latPos;
                        company.lng = lngPos;

                        const marker = L.marker([latPos, lngPos])
                            .addTo(map);

                        const popupContent = L.DomUtil.create('div', 'p-2');
                        popupContent.innerHTML = `
                            <div class="space-y-2">
                                <h4 class="font-bold text-slate-900 leading-tight uppercase text-xs">${company.razao_social}</h4>
                                <p class="text-[10px] text-slate-500">${company.logradouro || ''}, ${company.numero || ''}</p>
                                <div class="pt-2 border-t border-slate-100 flex gap-2">
                                    <button class="import-btn px-2 py-1 bg-amber-500 text-white text-[10px] font-bold rounded hover:bg-amber-600 transition-colors">Importar</button>
                                </div>
                            </div>
                        `;

                        popupContent.querySelector('.import-btn')?.addEventListener('click', () => {
                            importContactMutation.mutate(company);
                        });

                        marker.bindPopup(popupContent);
                    });
                }
            }).catch(console.error);
    }, [results]);

    const importContactMutation = useMutation({
        mutationFn: async (company: any) => {
            const res = await apiRequest("POST", "/api/contacts", {
                name: company.razao_social || company.nome_fantasia || "Empresa Importada",
                type: "company",
                document: company.cnpj,
                address: company.logradouro
                    ? `${company.logradouro}, ${company.numero}${company.bairro ? ` - ${company.bairro}` : ''}`
                    : null,
                phone: company.ddd_telefone_1 || null,
                email: company.email || null,
            });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
            toast({ title: "Sucesso", description: "Empresa importada como contato." });
        },
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!stateName) {
            toast({ title: "Campo Obrigatório", description: "Informe pelo menos o Estado.", variant: "destructive" });
            return;
        }
        const url = `/api/proxy/companies/search?state=${encodeURIComponent(stateName)}&city=${encodeURIComponent(cityName)}&neighborhood=${encodeURIComponent(neighborhood)}&cnae=${encodeURIComponent(cnae)}&q=${encodeURIComponent(query)}`;
        setSearchUrl(url);
        setCurrentPage(1); // Reset to first page
    };

    const handleFocusMarker = (company: any) => {
        if (!leafletMapRef.current || !company.lat) return;
        const { map } = leafletMapRef.current;
        map.flyTo([company.lat, company.lng], 16, { duration: 1.5 });

        // Find and open popup
        map.eachLayer((layer: any) => {
            if (layer instanceof leafletMapRef.current.L.Marker) {
                const pos = layer.getLatLng();
                if (Math.abs(pos.lat - company.lat) < 0.0001 && Math.abs(pos.lng - company.lng) < 0.0001) {
                    layer.openPopup();
                }
            }
        });
    };

    const totalPages = results ? Math.ceil(results.length / itemsPerPage) : 0;
    const paginatedResults = results?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-display font-bold text-slate-900 tracking-tight">
                        Prospecção Inteligente
                    </h2>
                    <p className="text-slate-500 mt-2 font-medium">
                        Varredura de empresas ativas por bairro e setor de atividade.
                    </p>
                </div>
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 shadow-lg shadow-amber-500/20 flex items-center justify-center">
                    <Target className="h-7 w-7 text-white" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Filtros */}
                <div className="lg:col-span-1">
                    <Card className="premium-card border-none shadow-xl overflow-hidden">
                        <div className="h-2 w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600" />
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-amber-500" />
                                <CardTitle className="text-base text-slate-900">Filtros</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSearch} className="space-y-4">
                                {/* Estado */}
                                <div className="space-y-1.5">
                                    <Label className="text-slate-700 font-semibold text-xs uppercase tracking-wider">Estado *</Label>
                                    <Select
                                        value={stateId}
                                        onValueChange={(val) => {
                                            const s = states?.find(x => x.id.toString() === val);
                                            setStateId(val);
                                            setStateName(s?.sigla || "");
                                            setCityId("");
                                            setCityName("");
                                            setNeighborhood("");
                                        }}
                                    >
                                        <SelectTrigger className="bg-slate-50 border-slate-200 h-10">
                                            <SelectValue placeholder="Selecione o Estado" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {states?.map(s => (
                                                <SelectItem key={s.id} value={s.id.toString()}>{s.nome} ({s.sigla})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Cidade - Autocomplete */}
                                <div className="space-y-1.5">
                                    <Label className="text-slate-700 font-semibold text-xs uppercase tracking-wider">Cidade</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className={cn("w-full justify-between bg-slate-50 border-slate-200 h-10", !cityName && "text-muted-foreground")}
                                                disabled={!stateId || isLoadingCities}
                                            >
                                                {cityName || (isLoadingCities ? "Carregando..." : "Selecione a cidade")}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[300px] p-0 shadow-2xl border-slate-200">
                                            <Command>
                                                <CommandInput placeholder="Buscar cidade..." />
                                                <CommandList>
                                                    <CommandEmpty>Nenhuma cidade encontrada.</CommandEmpty>
                                                    <CommandGroup>
                                                        {cities?.map((city) => (
                                                            <CommandItem
                                                                key={city.id}
                                                                value={city.nome}
                                                                onSelect={() => {
                                                                    setCityId(city.id.toString());
                                                                    setCityName(city.nome);
                                                                    setNeighborhood("");
                                                                }}
                                                            >
                                                                <Check className={cn("mr-2 h-4 w-4", cityName === city.nome ? "opacity-100" : "opacity-0")} />
                                                                {city.nome}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                {/* Bairro - Autocomplete */}
                                <div className="space-y-1.5">
                                    <Label className="text-slate-700 font-semibold text-xs uppercase tracking-wider">Bairro</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className={cn("w-full justify-between bg-slate-50 border-slate-200 h-10 ring-2 ring-amber-100", !neighborhood && "text-muted-foreground")}
                                                disabled={!cityId || isLoadingDistricts}
                                            >
                                                {neighborhood || (isLoadingDistricts ? "Carregando..." : "Selecione o bairro")}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[300px] p-0 shadow-2xl border-slate-200">
                                            <Command>
                                                <CommandInput placeholder="Buscar bairro..." />
                                                <CommandList>
                                                    <CommandEmpty>Nenhum bairro encontrado.</CommandEmpty>
                                                    <CommandGroup>
                                                        {districts?.map((d) => (
                                                            <CommandItem
                                                                key={d.id}
                                                                value={d.nome}
                                                                onSelect={() => {
                                                                    setNeighborhood(d.nome);
                                                                }}
                                                            >
                                                                <Check className={cn("mr-2 h-4 w-4", neighborhood === d.nome ? "opacity-100" : "opacity-0")} />
                                                                {d.nome}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-slate-700 font-semibold text-xs uppercase tracking-wider">CNAE (Setor)</Label>
                                    <Input
                                        placeholder="Ex: 6512, 4511, 4530..."
                                        className="bg-slate-50 border-slate-200 h-10"
                                        value={cnae}
                                        onChange={(e) => setCnae(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-slate-700 font-semibold text-xs uppercase tracking-wider">Palavra-chave</Label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                        <Input
                                            placeholder="Nome da empresa..."
                                            className="pl-9 bg-slate-50 border-slate-200 h-10"
                                            value={query}
                                            onChange={(e) => setQuery(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-11 font-bold tracking-wide bg-slate-900 hover:bg-slate-800 text-white shadow-lg"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Varrendo...</>
                                    ) : (
                                        <><Search className="mr-2 h-4 w-4" /> Iniciar Varredura</>
                                    )}
                                </Button>

                                {error && (
                                    <div className="flex items-center gap-2 text-red-500 text-xs font-medium bg-red-50 p-2 rounded-lg">
                                        <AlertCircle className="h-4 w-4 shrink-0" />
                                        Falha ao buscar. Verifique o servidor.
                                    </div>
                                )}
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Mapa */}
                <div className="lg:col-span-2">
                    <Card className="premium-card border-none shadow-xl overflow-hidden" style={{ minHeight: 460 }}>
                        <div className="relative h-full" style={{ minHeight: 460 }}>
                            {/* Leaflet CSS inline via link to avoid import issues */}
                            <link
                                rel="stylesheet"
                                href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
                            />
                            <div
                                ref={mapRef}
                                style={{ height: 460, width: '100%', borderRadius: '0.75rem', overflow: 'hidden' }}
                            />
                            <div className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg shadow-lg border border-slate-100 flex items-center gap-2">
                                <MapIcon className="h-3.5 w-3.5 text-amber-500" />
                                <span className="text-[10px] font-black uppercase text-slate-600">
                                    {results ? `${results.length} emprs. no mapa` : 'Mapa Interativo'}
                                </span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Resultados */}
            {(results || isLoading) && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <h3 className="text-xl font-display font-bold text-slate-800">
                                {results ? `${results.length} empresas encontradas` : 'Buscando...'}
                            </h3>
                            {results && (
                                <p className="text-xs text-slate-500 font-medium">
                                    Exibindo {Math.min(results.length, itemsPerPage)} resultados por página
                                </p>
                            )}
                        </div>
                        <Badge variant="outline" className="text-slate-500 font-bold border-slate-200 text-[10px]">
                            RECEITA FEDERAL · MINHA RECEITA
                        </Badge>
                    </div>

                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-16">
                            <Loader2 className="h-10 w-10 text-amber-500 animate-spin mb-3" />
                            <p className="text-slate-400 font-medium">Consultando base da Receita Federal...</p>
                        </div>
                    )}

                    {paginatedResults && paginatedResults.length > 0 && (
                        <>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {paginatedResults.map((company, idx) => (
                                    <Card key={idx} className="premium-card hover:-translate-y-1 transition-all duration-300 border-none shadow-lg group relative overflow-hidden">
                                        <CardHeader className="pb-2">
                                            <div className="flex justify-between items-start">
                                                <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                                                    <Building2 className="h-5 w-5 text-amber-500" />
                                                </div>
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-blue-500 hover:bg-blue-50"
                                                        onClick={() => handleFocusMarker(company)}
                                                        title="Ver no Mapa"
                                                    >
                                                        <MapIcon className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-amber-500 hover:bg-amber-50"
                                                        onClick={() => importContactMutation.mutate(company)}
                                                        disabled={importContactMutation.isPending}
                                                        title="Importar como contato"
                                                    >
                                                        <Plus className="h-5 w-5" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <CardTitle className="text-sm font-bold mt-2 leading-tight uppercase text-slate-900 line-clamp-2 min-h-[2.5rem]">
                                                {company.razao_social || company.nome_fantasia}
                                            </CardTitle>
                                            <CardDescription className="font-mono text-[9px] font-bold text-slate-400">
                                                CNPJ: {company.cnpj}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-3 pb-4">
                                            <div className="flex items-start gap-1.5 text-[11px] text-slate-500">
                                                <MapPin className="h-3 w-3 text-slate-300 mt-0.5 shrink-0" />
                                                <span className="line-clamp-2 h-[2rem]">
                                                    {[company.logradouro, company.numero, company.bairro, company.municipio]
                                                        .filter(Boolean).join(', ')}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {company.cnae_principal_descricao && (
                                                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none text-[8px] font-black uppercase truncate max-w-[150px]">
                                                        {company.cnae_principal_descricao}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
                                                <span className="text-[9px] text-emerald-600 font-black uppercase tracking-wider">● Ativa</span>
                                                <span className="text-[9px] text-slate-400 font-medium">{company.uf}</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2 mt-8 pb-10">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={currentPage === 1}
                                        onClick={() => {
                                            setCurrentPage(p => Math.max(1, p - 1));
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        className="rounded-lg h-9"
                                    >
                                        Anterior
                                    </Button>
                                    <div className="flex items-center gap-1 mx-4">
                                        <span className="text-sm font-bold text-slate-900">{currentPage}</span>
                                        <span className="text-sm text-slate-400">de</span>
                                        <span className="text-sm font-bold text-slate-900">{totalPages}</span>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={currentPage === totalPages}
                                        onClick={() => {
                                            setCurrentPage(p => Math.min(totalPages, p + 1));
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        className="rounded-lg h-9"
                                    >
                                        Próxima
                                    </Button>
                                </div>
                            )}
                        </>
                    )}

                    {results && results.length === 0 && (
                        <Card className="p-12 text-center border-dashed bg-slate-50/50">
                            <Search className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                            <h4 className="font-bold text-slate-700 uppercase text-sm">Nenhuma empresa encontrada</h4>
                            <p className="text-slate-400 text-xs mt-1">Tente remover o bairro ou ampliar o estado de busca.</p>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}
