import { useSiteSettings } from "@/hooks/use-site-settings";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSiteSettingsSchema, insertHeroSlideSchema, type InsertSiteSettings, type InsertHeroSlide, type HeroSlide, type SiteSettings } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
    Loader2,
    Plus,
    Trash2,
    Save,
    MoveUp,
    MoveDown,
    Globe,
    Palette,
    Layout,
    Info,
    PhoneCall,
    Mail,
    Image as ImageIcon,
    LayoutTemplate,
    Eye,
    Smartphone,
    Maximize,
    Minimize,
    Key,
    Copy,
    Check,
    Code,
    Zap,
    Play,
    RefreshCw,
    Search
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { ImageUpload } from "@/components/ImageUpload";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

const CURATED_FONTS_SANS = [
    { name: "Inter", value: "Inter", desc: "Moderna e altamente legível" },
    { name: "Montserrat", value: "Montserrat", desc: "Versátil e urbana" },
    { name: "Roboto", value: "Roboto", desc: "Funcional e amigável" },
    { name: "Open Sans", value: "Open Sans", desc: "Clean e profissional" },
];

const CURATED_FONTS_DISPLAY = [
    { name: "Outfit", value: "Outfit", desc: "Elegante e geométrica" },
    { name: "Playfair Display", value: "Playfair Display", desc: "Clássica e sofisticada" },
    { name: "Lora", value: "Lora", desc: "Serifada e contemporânea" },
    { name: "Cinzel", value: "Cinzel", desc: "Inspirada em inscrições romanas" },
];

const SAMPLE_PRESETS = [
    {
        name: "Prédio Corporativo",
        image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop",
        title: "Proteção Corporativa de Alto Nível",
        subtitle: "Garantindo a continuidade do seu negócio com excelência."
    },
    {
        name: "Segurança Familiar",
        image: "https://images.unsplash.com/photo-1509059852496-f3822ae057bf?q=80&w=800&auto=format&fit=crop",
        title: "O que Você mais Ama, Protegido",
        subtitle: "Seguros de vida e residenciais sob medida para sua família."
    },
    {
        name: "Confiança & Parceria",
        image: "https://images.unsplash.com/photo-1521791136064-7986c29535a7?q=80&w=800&auto=format&fit=crop",
        title: "Seu Parceiro de Todas as Horas",
        subtitle: "Consultoria especializada para todas as etapas da sua vida."
    }
];

function SlideDialog({
    slide,
    onSave,
    trigger
}: {
    slide?: Partial<HeroSlide>,
    onSave: (data: InsertHeroSlide) => void,
    trigger: React.ReactNode
}) {
    const [open, setOpen] = useState(false);
    const form = useForm<InsertHeroSlide>({
        resolver: zodResolver(insertHeroSlideSchema),
        defaultValues: slide || {
            title: "",
            subtitle: "",
            imageBase64: "",
            buttonText: "Cotação Gratuita",
            buttonLink: "/contact",
            order: 0,
            isActive: true
        }
    });

    const handleSave = (data: InsertHeroSlide) => {
        onSave(data);
        setOpen(false);
        form.reset();
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border-none shadow-2xl p-0">
                <DialogHeader className="p-8 bg-slate-50 border-b border-slate-100">
                    <DialogTitle className="text-2xl font-display font-bold text-slate-900">
                        {slide && 'id' in slide ? "Editar Slide" : "Novo Slide de Impacto"}
                    </DialogTitle>
                    <DialogDescription>
                        Crie uma experiência visual marcante para seus clientes.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Imagem do Slide</Label>
                                <ImageUpload
                                    value={form.watch("imageBase64")}
                                    onChange={(val) => form.setValue("imageBase64", val)}
                                    label="Foto de Fundo"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ou escolha um modelo HD</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {SAMPLE_PRESETS.map((preset, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => {
                                                form.setValue("imageBase64", preset.image);
                                                form.setValue("title", preset.title);
                                                form.setValue("subtitle", preset.subtitle);
                                            }}
                                            className="group relative h-16 rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-all"
                                        >
                                            <img src={preset.image} className="w-full h-full object-cover grayscale group-hover:grayscale-0" alt={preset.name} />
                                            <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent flex items-center justify-center">
                                                <span className="text-[8px] text-white font-bold uppercase">{preset.name}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Título Principal</Label>
                                <Input {...form.register("title")} className="h-11 rounded-xl" placeholder="Ex: Proteção para sua Família" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subtítulo / Descrição</Label>
                                <Textarea {...form.register("subtitle")} className="min-h-[80px] rounded-xl resize-none" placeholder="Uma breve frase impactante..." />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Texto do Botão</Label>
                                    <Input {...form.register("buttonText")} className="h-11 rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Link</Label>
                                    <Input {...form.register("buttonLink")} className="h-11 rounded-xl" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-8 bg-slate-50 border-t border-slate-100 flex gap-3">
                    <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-xl h-12">Cancelar</Button>
                    <Button onClick={form.handleSubmit(handleSave)} className="rounded-xl h-12 px-8 bg-primary hover:bg-primary/90 text-white font-bold">
                        Salvar Slide
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function SiteConfigPage() {
    const { toast } = useToast();
    const [location] = useLocation();
    const { settings, isLoadingSettings, slides, isLoadingSlides, updateSettings, isUpdatingSettings, createSlide, updateSlide, deleteSlide } = useSiteSettings();

    const isHiddenApiRoute = useMemo(() => {
        const isPath = location === "/admin/integracoes" || location === "/admin/api-keys";
        const isSearch = typeof window !== "undefined" && (
            window.location.search.includes("tab=api") ||
            window.location.search.includes("tab=integracoes") ||
            window.location.search.includes("api=true")
        );
        return isPath || isSearch;
    }, [location]);

    const [activeTab, setActiveTab] = useState(() => isHiddenApiRoute ? "api" : "identity");

    useEffect(() => {
        if (isHiddenApiRoute) {
            setActiveTab("api");
        }
    }, [isHiddenApiRoute]);

    // External WhatsApp API Integration State
    const [externalApiData, setExternalApiData] = useState<{ apiKey: string; endpointUrl: string } | null>(null);
    const [loadingExternalApi, setLoadingExternalApi] = useState(false);
    const [showKey, setShowKey] = useState(false);
    const [copied, setCopied] = useState(false);
    const [testPhone, setTestPhone] = useState("");
    const [testResult, setTestResult] = useState<any>(null);
    const [testingApi, setTestingApi] = useState(false);

    const fetchExternalSettings = async () => {
        try {
            setLoadingExternalApi(true);
            const res = await apiRequest("GET", "/api/v1/external/settings");
            const data = await res.json();
            setExternalApiData(data);
        } catch (_) {} finally {
            setLoadingExternalApi(false);
        }
    };

    useEffect(() => {
        fetchExternalSettings();
    }, []);

    const handleRegenerateKey = async () => {
        if (!confirm("Tem certeza que deseja gerar uma nova chave de API? As conexões antigas do WhatsApp precisarão ser atualizadas com a nova chave.")) return;
        try {
            setLoadingExternalApi(true);
            const res = await apiRequest("POST", "/api/v1/external/regenerate-key");
            const data = await res.json();
            setExternalApiData(prev => ({
                apiKey: data.apiKey,
                endpointUrl: prev?.endpointUrl || (window.location.origin + "/api/v1/external/contacts/lookup")
            }));
            toast({ title: "🔑 Nova Chave de API Gerada!", description: data.message });
        } catch (err: any) {
            toast({ title: "Erro ao gerar chave", description: err.message, variant: "destructive" });
        } finally {
            setLoadingExternalApi(false);
        }
    };

    const handleCopyKey = () => {
        if (!externalApiData?.apiKey) return;
        navigator.clipboard.writeText(externalApiData.apiKey);
        setCopied(true);
        toast({ title: "Chave de API copiada!" });
        setTimeout(() => setCopied(false), 2000);
    };

    const handleTestLookup = async () => {
        if (!testPhone.trim()) return;
        try {
            setTestingApi(true);
            setTestResult(null);
            const apiKey = externalApiData?.apiKey || "";
            const res = await fetch(`/api/v1/external/contacts/lookup?phone=${encodeURIComponent(testPhone.trim())}`, {
                headers: { "X-API-Key": apiKey }
            });
            const json = await res.json();
            setTestResult(json);
        } catch (err: any) {
            setTestResult({ error: err.message });
        } finally {
            setTestingApi(false);
        }
    };

    const siteForm = useForm<InsertSiteSettings>({
        resolver: zodResolver(insertSiteSettingsSchema),
        defaultValues: settings || {
            siteName: "Monteiro Corretora",
            primaryColor: "#0F6570",
            secondaryColor: "#C45A4A",
            fontSans: "Inter",
            fontDisplay: "Outfit",
            heroTitle: "Protegendo seu Futuro, Garantindo seu Legado",
            heroSubtitle: "Experimente a tranquilidade de uma cobertura completa. Combinamos expertise tradicional com eficiência moderna.",
            aboutTitle: "Sobre a Monteiro Corretora",
            aboutContent: "Com décadas de experiência no mercado de seguros...",
            servicesTitle: "Nossos Serviços",
            servicesSubtitle: "Soluções abrangentes para todas as suas necessidades de proteção.",
            blogTitle: "Últimas do Blog",
            blogSubtitle: "Fique por dentro das novidades e dicas do mercado de seguros.",
            contactEmail: "contato@monteiro.com",
            contactPhone: "+55 (11) 9999-9999",
            address: "Rua do Comércio, 123, São Paulo, SP",
            footerText: "Oferecemos soluções premium em seguros personalizadas...",
            logoScale: 150,
            logoScaleMobile: 130,
            smtpHost: "",
            smtpPort: 587,
            smtpUser: "",
            smtpPass: "",
            smtpFrom: "",
            resendApiKey: "",
        },
    });

    useEffect(() => {
        if (settings) {
            siteForm.reset({
                ...settings,
                smtpHost: settings.smtpHost || "",
                smtpPort: settings.smtpPort || 587,
                smtpUser: settings.smtpUser || "",
                smtpPass: settings.smtpPass || "",
                smtpFrom: settings.smtpFrom || "",
                resendApiKey: settings.resendApiKey || "",
            });
        }
    }, [settings, siteForm]);

    const onSaveSettings = async (data: InsertSiteSettings) => {
        await updateSettings(data);
    };

    if (isLoadingSettings || isLoadingSlides) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-10 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-display font-bold text-slate-900 tracking-tight">Personalização do Site</h1>
                    <p className="text-slate-500 mt-2 text-lg">Controle total sobre a identidade visual e conteúdo das suas páginas.</p>
                </div>
                <Button
                    onClick={siteForm.handleSubmit(onSaveSettings)}
                    disabled={isUpdatingSettings}
                    className="h-12 px-8 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 rounded-xl gap-2 active:scale-95 transition-all"
                >
                    {isUpdatingSettings ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    Publicar Alterações
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-slate-200/50 p-1.5 rounded-2xl grid grid-cols-2 md:grid-cols-6 gap-1 h-auto mb-8 border border-white/40 shadow-sm">
                    <TabsTrigger value="identity" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm py-2.5 gap-2">
                        <Globe className="h-4 w-4" /> Identidade
                    </TabsTrigger>
                    <TabsTrigger value="styling" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm py-2.5 gap-2">
                        <Palette className="h-4 w-4" /> Estilo
                    </TabsTrigger>
                    <TabsTrigger value="home" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm py-2.5 gap-2">
                        <LayoutTemplate className="h-4 w-4" /> Home
                    </TabsTrigger>
                    <TabsTrigger value="pages" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm py-2.5 gap-2">
                        <Info className="h-4 w-4" /> Páginas
                    </TabsTrigger>
                    <TabsTrigger value="contact" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm py-2.5 gap-2">
                        <PhoneCall className="h-4 w-4" /> Contato
                    </TabsTrigger>
                    <TabsTrigger value="email" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm py-2.5 gap-2">
                        <Mail className="h-4 w-4" /> Servidor de E-mail
                    </TabsTrigger>
                    {activeTab === "api" && (
                        <TabsTrigger value="api" className="rounded-xl data-[state=active]:bg-slate-900 data-[state=active]:text-amber-400 py-2.5 gap-2 col-span-2 md:col-span-6 bg-slate-900 text-amber-400 font-bold border border-slate-800">
                            <Key className="h-4 w-4 text-emerald-400" /> 🔒 Acesso Direto: Área de Integração WhatsApp & API Externa
                        </TabsTrigger>
                    )}
                </TabsList>

                <Form {...siteForm}>
                    <form onSubmit={siteForm.handleSubmit(onSaveSettings)} className="space-y-8">

                        {/* Identity & Logo TAB */}
                        <TabsContent value="identity" className="mt-0 focus-visible:outline-none">
                            <Card className="premium-card border-none shadow-sm overflow-hidden">
                                <CardHeader className="bg-white border-b border-slate-100 py-8">
                                    <CardTitle className="text-2xl font-display font-bold">Identidade Visual</CardTitle>
                                    <CardDescription>Defina o nome da sua corretora e o seu logo oficial.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-8 space-y-8">
                                    <FormField
                                        control={siteForm.control}
                                        name="siteName"
                                        render={({ field }) => (
                                            <FormItem className="max-w-md">
                                                <FormLabel className="text-sm font-bold text-slate-700">Nome da Empresa</FormLabel>
                                                <FormControl>
                                                    <Input {...field} value={field.value || ""} className="h-12 rounded-xl border-slate-200 focus:border-primary focus:ring-primary/20" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={siteForm.control}
                                        name="logoBase64"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-bold text-slate-700">Logo do Site</FormLabel>
                                                <FormControl>
                                                    <ImageUpload
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                        description="O logo será exibido no topo do site e no rodapé."
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                                        <FormField
                                            control={siteForm.control}
                                            name="logoScale"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <FormLabel className="text-sm font-bold text-slate-700">Tamanho da Logo (Desktop)</FormLabel>
                                                        <span className="text-xs font-mono font-bold text-primary">{field.value}%</span>
                                                    </div>
                                                    <FormControl>
                                                        <div className="flex items-center gap-4">
                                                            <Minimize className="h-4 w-4 text-slate-400" />
                                                            <Slider
                                                                min={50}
                                                                max={300}
                                                                step={5}
                                                                value={[field.value || 150]}
                                                                onValueChange={(val) => field.onChange(val[0])}
                                                                className="flex-1"
                                                            />
                                                            <Maximize className="h-4 w-4 text-slate-400" />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={siteForm.control}
                                            name="logoScaleMobile"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <FormLabel className="text-sm font-bold text-slate-700">Tamanho da Logo (Mobile)</FormLabel>
                                                        <span className="text-xs font-mono font-bold text-primary">{field.value}%</span>
                                                    </div>
                                                    <FormControl>
                                                        <div className="flex items-center gap-4">
                                                            <Smartphone className="h-4 w-4 text-slate-400" />
                                                            <Slider
                                                                min={50}
                                                                max={300}
                                                                step={5}
                                                                value={[field.value || 130]}
                                                                onValueChange={(val) => field.onChange(val[0])}
                                                                className="flex-1"
                                                            />
                                                            <Maximize className="h-4 w-4 text-slate-400" />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Styling TAB */}
                        <TabsContent value="styling" className="mt-0 focus-visible:outline-none">
                            <Card className="premium-card border-none shadow-sm">
                                <CardHeader className="bg-white border-b border-slate-100 py-8">
                                    <CardTitle className="text-2xl font-display font-bold">Cores & Fontes</CardTitle>
                                    <CardDescription>Ajuste as cores principais e tipografia que definem sua marca no site.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-8 grid gap-8 md:grid-cols-2">
                                    <div className="space-y-6">
                                        <FormField
                                            control={siteForm.control}
                                            name="primaryColor"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-bold text-slate-700">Cor Primária</FormLabel>
                                                    <div className="flex gap-4">
                                                        <FormControl>
                                                            <div className="relative group overflow-hidden h-12 w-16 rounded-xl border border-slate-200 cursor-pointer">
                                                                <Input type="color" className="absolute inset-0 h-full w-full p-0 border-none scale-[2]" {...field} />
                                                            </div>
                                                        </FormControl>
                                                        <Input {...field} className="h-12 font-mono rounded-xl border-slate-200" />
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={siteForm.control}
                                            name="secondaryColor"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-bold text-slate-700">Cor Secundária (Destaques)</FormLabel>
                                                    <div className="flex gap-4">
                                                        <FormControl>
                                                            <div className="relative group overflow-hidden h-12 w-16 rounded-xl border border-slate-200 cursor-pointer">
                                                                <Input type="color" className="absolute inset-0 h-full w-full p-0 border-none scale-[2]" {...field} />
                                                            </div>
                                                        </FormControl>
                                                        <Input {...field} className="h-12 font-mono rounded-xl border-slate-200" />
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="space-y-6">
                                        <FormField
                                            control={siteForm.control}
                                            name="fontSans"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-bold text-slate-700">Fonte do Corpo (Sans)</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value || "Inter"}>
                                                        <FormControl>
                                                            <SelectTrigger className="h-12 rounded-xl border-slate-200">
                                                                <SelectValue placeholder="Selecione uma fonte" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className="rounded-xl border-slate-200">
                                                            {CURATED_FONTS_SANS.map(font => (
                                                                <SelectItem key={font.value} value={font.value} className="py-3">
                                                                    <div className="flex flex-col">
                                                                        <span className="font-bold">{font.name}</span>
                                                                        <span className="text-xs text-slate-500">{font.desc}</span>
                                                                    </div>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={siteForm.control}
                                            name="fontDisplay"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-bold text-slate-700">Fonte de Títulos (Display)</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value || "Outfit"}>
                                                        <FormControl>
                                                            <SelectTrigger className="h-12 rounded-xl border-slate-200">
                                                                <SelectValue placeholder="Selecione uma fonte" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className="rounded-xl border-slate-200">
                                                            {CURATED_FONTS_DISPLAY.map(font => (
                                                                <SelectItem key={font.value} value={font.value} className="py-3">
                                                                    <div className="flex flex-col">
                                                                        <span className="font-bold">{font.name}</span>
                                                                        <span className="text-xs text-slate-500">{font.desc}</span>
                                                                    </div>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Home Content & Hero TAB */}
                        <TabsContent value="home" className="mt-0 focus-visible:outline-none space-y-8">
                            <Card className="premium-card border-none shadow-sm">
                                <CardHeader className="bg-white border-b border-slate-100 py-8">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-2xl font-display font-bold">Carrossel Hero</CardTitle>
                                            <CardDescription>Gerencie as imagens e textos que impactam seu cliente logo na entrada.</CardDescription>
                                        </div>
                                        <SlideDialog
                                            onSave={(data) => createSlide(data)}
                                            trigger={
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg h-10 px-4 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                                                >
                                                    <Plus className="h-4 w-4" /> Adicionar Slide
                                                </Button>
                                            }
                                        />
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader className="bg-slate-50/50">
                                            <TableRow className="border-slate-100">
                                                <TableHead className="w-24 pl-8">Ordem</TableHead>
                                                <TableHead>Preview</TableHead>
                                                <TableHead>Título & Subtítulo</TableHead>
                                                <TableHead className="w-32">Status</TableHead>
                                                <TableHead className="text-right pr-8">Ações</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {slides?.map((slide, index) => (
                                                <TableRow key={slide.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                    <TableCell className="pl-8">
                                                        <div className="flex flex-col items-center gap-1">
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-primary" onClick={() => updateSlide({ id: slide.id, slide: { order: slide.order - 1 } })} disabled={index === 0}>
                                                                <MoveUp className="h-4 w-4" />
                                                            </Button>
                                                            <span className="text-sm font-black text-slate-600 font-mono">{slide.order}</span>
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-primary" onClick={() => updateSlide({ id: slide.id, slide: { order: slide.order + 1 } })} disabled={index === slides.length - 1}>
                                                                <MoveDown className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="h-16 w-28 rounded-xl overflow-hidden shadow-inner bg-slate-100 flex items-center justify-center border border-slate-200">
                                                            {slide.imageBase64 ? (
                                                                <img src={slide.imageBase64} alt={slide.title} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <ImageIcon className="h-6 w-6 text-slate-300" />
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <p className="font-bold text-slate-900 line-clamp-1">{slide.title}</p>
                                                            <p className="text-xs text-slate-500 line-clamp-1">{slide.subtitle}</p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Switch checked={slide.isActive} onCheckedChange={(isActive) => updateSlide({ id: slide.id, slide: { isActive } })} />
                                                    </TableCell>
                                                    <TableCell className="text-right pr-8 space-x-2">
                                                        <SlideDialog
                                                            slide={slide}
                                                            onSave={(data) => updateSlide({ id: slide.id, slide: data })}
                                                            trigger={
                                                                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-primary">
                                                                    < ImageIcon className="h-4 w-4" />
                                                                </Button>
                                                            }
                                                        />
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl"
                                                            onClick={(e) => {
                                                                e.preventDefault(); e.stopPropagation();
                                                                deleteSlide(slide.id);
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {(!slides || slides.length === 0) && (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-16 text-slate-400 italic font-medium">
                                                        Nenhum slide cadastrado. O site exibirá o banner estático padrão.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>

                            <Card className="premium-card border-none shadow-sm">
                                <CardHeader className="bg-white border-b border-slate-100 py-8">
                                    <CardTitle className="text-2xl font-display font-bold">Título das Seções</CardTitle>
                                    <CardDescription>Ajuste como as seções da Home são apresentadas aos usuários.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-8 grid gap-10 md:grid-cols-2">
                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <p className="text-sm font-black text-primary uppercase tracking-widest border-l-4 border-amber-400 pl-3">Seção de Serviços</p>
                                            <FormField
                                                control={siteForm.control}
                                                name="servicesTitle"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-wider">Título Principal</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} className="h-12 rounded-xl border-slate-200" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={siteForm.control}
                                                name="servicesSubtitle"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-wider">Breve Descrição</FormLabel>
                                                        <FormControl>
                                                            <Textarea {...field} className="min-h-[100px] rounded-xl border-slate-200 resize-none" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <p className="text-sm font-black text-primary uppercase tracking-widest border-l-4 border-amber-400 pl-3">Seção do Blog</p>
                                            <FormField
                                                control={siteForm.control}
                                                name="blogTitle"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-wider">Título Principal</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} className="h-12 rounded-xl border-slate-200" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={siteForm.control}
                                                name="blogSubtitle"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-wider">Breve Descrição</FormLabel>
                                                        <FormControl>
                                                            <Textarea {...field} className="min-h-[100px] rounded-xl border-slate-200 resize-none" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Page Content TAB (About, etc) */}
                        <TabsContent value="pages" className="mt-0 focus-visible:outline-none">
                            <Card className="premium-card border-none shadow-sm h-full">
                                <CardHeader className="bg-white border-b border-slate-100 py-8">
                                    <CardTitle className="text-2xl font-display font-bold">Conteúdo Institucional</CardTitle>
                                    <CardDescription>Personalize o texto e as imagens da página "Sobre Nós".</CardDescription>
                                </CardHeader>
                                <CardContent className="p-8 grid gap-10 md:grid-cols-2">
                                    <div className="space-y-6">
                                        <FormField
                                            control={siteForm.control}
                                            name="aboutTitle"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-wider">Título da Página</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} className="h-12 rounded-xl border-slate-200" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={siteForm.control}
                                            name="aboutContent"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-wider">História / Conteúdo Principal</FormLabel>
                                                    <FormControl>
                                                        <Textarea {...field} className="min-h-[300px] rounded-xl border-slate-200 p-4 leading-relaxed" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="space-y-6">
                                        <FormField
                                            control={siteForm.control}
                                            name="aboutImageBase64"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-wider">Imagem em Destaque</FormLabel>
                                                    <FormControl>
                                                        <ImageUpload
                                                            value={field.value}
                                                            onChange={field.onChange}
                                                            label="Foto Institucional"
                                                            description="Esta imagem aparecerá ao lado da história da corretora."
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Contact & Footer TAB */}
                        <TabsContent value="contact" className="mt-0 focus-visible:outline-none">
                            <Card className="premium-card border-none shadow-sm">
                                <CardHeader className="bg-white border-b border-slate-100 py-8">
                                    <CardTitle className="text-2xl font-display font-bold">Contatos & Rodapé</CardTitle>
                                    <CardDescription>Gerencie as informações que permitem que o cliente te encontre.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-8">
                                    <div className="grid gap-10 md:grid-cols-2">
                                        <div className="space-y-6">
                                            <p className="text-sm font-black text-primary uppercase tracking-widest border-l-4 border-amber-400 pl-3">Canais Diretos</p>
                                            <FormField
                                                control={siteForm.control}
                                                name="contactEmail"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs font-bold text-slate-500">E-mail</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} className="h-12 rounded-xl border-slate-200" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={siteForm.control}
                                                name="contactPhone"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs font-bold text-slate-500">WhatsApp / Telefone</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} className="h-12 rounded-xl border-slate-200" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={siteForm.control}
                                                name="address"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs font-bold text-slate-500">Endereço Completo</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} className="h-12 rounded-xl border-slate-200" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="space-y-6">
                                            <p className="text-sm font-black text-primary uppercase tracking-widest border-l-4 border-amber-400 pl-3">Redes Sociais & Rodapé</p>
                                            <FormField
                                                control={siteForm.control}
                                                name="instagramUrl"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs font-bold text-slate-500">Instagram URL</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} value={field.value || ""} placeholder="https://instagram.com/..." className="h-12 rounded-xl border-slate-200" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={siteForm.control}
                                                name="footerText"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs font-bold text-slate-500">Texto de Boas-vindas (Rodapé)</FormLabel>
                                                        <FormControl>
                                                            <Textarea {...field} className="min-h-[100px] rounded-xl border-slate-200" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Email & SMTP TAB */}
                        <TabsContent value="email" className="mt-0 focus-visible:outline-none">
                            <Card className="premium-card border-none shadow-sm">
                                <CardHeader className="bg-white border-b border-slate-100 py-8">
                                    <CardTitle className="text-2xl font-display font-bold">Servidor de E-mail (SMTP & Resend)</CardTitle>
                                    <CardDescription>Configure como a plataforma envia e-mails automáticos aos seus clientes (criação de conta, convites, tokens de acesso, etc.).</CardDescription>
                                </CardHeader>
                                <CardContent className="p-8 space-y-8">
                                    <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-6 text-sm text-emerald-900 flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                                            <Mail className="h-5 w-5" />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-emerald-950">Informações do Envio</h4>
                                            <p className="text-emerald-800 leading-relaxed">
                                                Você pode utilizar uma chave da <strong>Resend</strong> (recomendado) ou configurar seu próprio <strong>Servidor SMTP customizado</strong> (Locaweb, Gmail Workspace, SendGrid, Hostinger, etc). Se ambos estiverem configurados, a API Resend terá preferência.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid gap-8 md:grid-cols-2">
                                        <div className="space-y-6">
                                            <p className="text-sm font-black text-primary uppercase tracking-widest border-l-4 border-emerald-500 pl-3">Provedor Resend API</p>

                                            <FormField
                                                control={siteForm.control}
                                                name="resendApiKey"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs font-bold text-slate-700">Resend API Key</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} value={field.value || ""} type="password" placeholder="re_123456789..." className="h-12 rounded-xl border-slate-200 font-mono text-sm" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={siteForm.control}
                                                name="smtpFrom"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs font-bold text-slate-700">E-mail Remetente (From)</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} value={field.value || ""} placeholder="Monteiro Seguros <contato@monteirocorretora.com.br>" className="h-12 rounded-xl border-slate-200" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="space-y-6">
                                            <p className="text-sm font-black text-primary uppercase tracking-widest border-l-4 border-amber-400 pl-3">Servidor SMTP Próprio</p>

                                            <div className="grid grid-cols-3 gap-3">
                                                <FormField
                                                    control={siteForm.control}
                                                    name="smtpHost"
                                                    render={({ field }) => (
                                                        <FormItem className="col-span-2">
                                                            <FormLabel className="text-xs font-bold text-slate-700">Host SMTP</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} value={field.value || ""} placeholder="smtp.dominio.com.br" className="h-12 rounded-xl border-slate-200" />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={siteForm.control}
                                                    name="smtpPort"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-xs font-bold text-slate-700">Porta</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} type="number" value={field.value ?? 587} onChange={(e) => field.onChange(parseInt(e.target.value) || 587)} className="h-12 rounded-xl border-slate-200" />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <FormField
                                                control={siteForm.control}
                                                name="smtpUser"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs font-bold text-slate-700">Usuário / E-mail SMTP</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} value={field.value || ""} placeholder="envio@dominio.com.br" className="h-12 rounded-xl border-slate-200" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={siteForm.control}
                                                name="smtpPass"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs font-bold text-slate-700">Senha SMTP</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} value={field.value || ""} type="password" placeholder="••••••••••••" className="h-12 rounded-xl border-slate-200" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* WhatsApp & External API TAB */}
                        <TabsContent value="api" className="mt-0 focus-visible:outline-none space-y-8">
                            <Card className="premium-card border-none shadow-sm overflow-hidden">
                                <CardHeader className="bg-slate-900 text-white p-6">
                                    <div className="flex items-center justify-between flex-wrap gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                                <Key className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-xl font-display font-bold text-white">Chave de Conexão de API Externa</CardTitle>
                                                <CardDescription className="text-slate-300 text-xs mt-1">
                                                    Utilize esta chave no seu sistema de gerenciamento de WhatsApp (Typebot, Evolution, N8N, Chatwoot, Z-API) para buscar os dados dos clientes.
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <Badge className="bg-emerald-500 text-slate-950 font-bold px-3 py-1 rounded-full text-xs">
                                            STATUS: ATIVA
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8 space-y-6">
                                    <div className="space-y-3">
                                        <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Chave de API do CRM (X-API-Key)</Label>
                                        <div className="flex items-center gap-2">
                                            <div className="relative flex-1">
                                                <Input
                                                    type={showKey ? "text" : "password"}
                                                    readOnly
                                                    value={externalApiData?.apiKey || "Carregando chave..."}
                                                    className="h-12 font-mono text-sm pr-16 rounded-xl bg-slate-50 border-slate-200"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowKey(!showKey)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 text-xs font-bold px-2 py-1 bg-slate-200/60 rounded-md"
                                                >
                                                    {showKey ? "Ocultar" : "Mostrar"}
                                                </button>
                                            </div>
                                            <Button
                                                type="button"
                                                onClick={handleCopyKey}
                                                className="h-12 px-5 font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm shrink-0"
                                            >
                                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                                {copied ? "Copiado!" : "Copiar Chave"}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={handleRegenerateKey}
                                                disabled={loadingExternalApi}
                                                className="h-12 px-4 font-bold rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700 gap-2 shrink-0"
                                                title="Gerar uma nova chave de API"
                                            >
                                                <RefreshCw className={`h-4 w-4 ${loadingExternalApi ? "animate-spin" : ""}`} />
                                                Gerar Nova
                                            </Button>
                                        </div>
                                        <p className="text-xs text-slate-500 font-medium">
                                            ⚠️ Mantenha esta chave em segredo. Ela concede permissão para seu sistema de WhatsApp consultar dados cadastrais, seguros e negócios do seu CRM.
                                        </p>
                                    </div>

                                    <div className="pt-6 border-t border-slate-100 space-y-4">
                                        <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                                            <Code className="h-5 w-5 text-blue-600" />
                                            Como Configurar no seu Sistema de WhatsApp (Webhook / Typebot / N8N)
                                        </h4>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 space-y-3 text-xs font-mono overflow-x-auto">
                                                <div className="text-amber-400 font-bold font-sans uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                                                    <Zap className="h-3.5 w-3.5" /> Requisição HTTP GET (Consulta por Telefone)
                                                </div>
                                                <p className="text-slate-300 font-sans">
                                                    Quando o contato falar no WhatsApp, seu fluxo deve fazer uma requisição GET para a URL abaixo passando o número:
                                                </p>
                                                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-emerald-400 break-all">
                                                    GET {window.location.origin}/api/v1/external/contacts/lookup?phone=11999998888
                                                </div>
                                                <div className="text-slate-300 font-sans font-bold mt-2">Headers necessários:</div>
                                                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-amber-300">
                                                    X-API-Key: {externalApiData?.apiKey || "SUA_CHAVE_API"}
                                                </div>
                                            </div>

                                            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-3 text-xs text-slate-700 font-medium">
                                                <div className="font-bold text-blue-900 text-sm flex items-center gap-2">
                                                    💡 O que o seu WhatsApp receberá de volta?
                                                </div>
                                                <ul className="space-y-2 list-disc list-inside text-slate-600">
                                                    <li><strong className="text-slate-900">found (true/false)</strong>: Se o cliente foi localizado no CRM.</li>
                                                    <li><strong className="text-slate-900">contact</strong>: Nome, CPF/CNPJ, E-mail, Aniversário, Status, Consultor Responsável.</li>
                                                    <li><strong className="text-slate-900">insurance</strong>: Lista de Apólices ativas, Seguradora, Produto e Prêmios acumulados.</li>
                                                    <li><strong className="text-slate-900">pipeline</strong>: Negociações em aberto no funil e valores em proposta.</li>
                                                </ul>
                                            </div>
                                        </div>

                                        {/* POST Criar Contato & Oportunidade */}
                                        <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 space-y-3 text-xs font-mono overflow-x-auto">
                                            <div className="text-emerald-400 font-bold font-sans uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                                                <Zap className="h-3.5 w-3.5" /> Requisição HTTP POST (Criar Contato &amp; Enviar Oportunidade para LEADS &amp; Pipeline)
                                            </div>
                                            <p className="text-slate-300 font-sans">
                                                Para registrar novos contatos ou enviar uma cotação/negociação diretamente para o funil:
                                            </p>
                                            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-emerald-400 break-all">
                                                POST {window.location.origin}/api/v1/external/contacts (ou /api/contacts/crm-deal)
                                            </div>
                                            <div className="text-slate-300 font-sans font-bold mt-2">Exemplo de Payload JSON:</div>
                                            <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-amber-300 overflow-x-auto text-[11px]">
{`{
  "name": "Nome do Cliente",
  "phone": "11999998888",
  "dealProduct": "Auto",
  "dealValue": "1500.00",
  "dealStatus": "Cotação",
  "notes": "Cliente solicitou cotação no WhatsApp",
  "createOpportunity": true
}`}
                                            </pre>
                                            <p className="text-slate-400 font-sans text-[11px]">
                                                ✨ <strong>12 Produtos Padronizados:</strong> Auto, Saúde, Vida, Residencial, Empresarial, Odonto, Consórcio, Previdência, Fiança Locaticia, Responsabilidade Civil, Viagem, Pet.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Testador em Tempo Real */}
                                    <div className="pt-6 border-t border-slate-100 space-y-4">
                                        <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                                            <Play className="h-5 w-5 text-emerald-600" />
                                            Testador de Busca de WhatsApp em Tempo Real
                                        </h4>
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <Input
                                                placeholder="Digite um número de telefone com DDD (ex: 11999998888)"
                                                value={testPhone}
                                                onChange={(e) => setTestPhone(e.target.value)}
                                                className="h-12 rounded-xl border-slate-200 max-w-md flex-1"
                                            />
                                            <Button
                                                type="button"
                                                onClick={handleTestLookup}
                                                disabled={testingApi || !testPhone.trim()}
                                                className="h-12 px-6 font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white gap-2 shadow-sm shrink-0"
                                            >
                                                {testingApi ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 text-amber-400" />}
                                                Testar Consulta Externa
                                            </Button>
                                        </div>

                                        {testResult && (
                                            <div className="p-4 rounded-2xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto border border-slate-800 shadow-inner max-h-[300px]">
                                                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 font-sans text-slate-400 text-[11px]">
                                                    <span>RESPOSTA JSON DO SERVIDOR</span>
                                                    <span className={testResult.found ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                                                        {testResult.found ? "✓ CONTATO ENCONTRADO" : "⚠ NÃO ENCONTRADO"}
                                                    </span>
                                                </div>
                                                <pre className="text-emerald-400 whitespace-pre-wrap">{JSON.stringify(testResult, null, 2)}</pre>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </form>
                </Form>
            </Tabs>
        </div>
    );
}

