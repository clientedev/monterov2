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
    Image as ImageIcon,
    LayoutTemplate,
    Eye,
    Monitor,
    Smartphone
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { ImageUpload } from "@/components/ImageUpload";
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

function LivePreview({ settings, slide }: { settings: InsertSiteSettings, slide?: Partial<HeroSlide> }) {
    const style = {
        '--primary': settings.primaryColor || '#0f172a',
        '--secondary': settings.secondaryColor || '#fbbf24',
        '--font-sans': settings.fontSans || 'Inter',
        '--font-display': settings.fontDisplay || 'Outfit',
    } as React.CSSProperties;

    return (
        <div style={style} className="w-full h-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col font-sans scale-[0.8] origin-top">
            {/* Header Mini */}
            <div className="h-12 border-b border-slate-100 flex items-center justify-between px-6 bg-white shrink-0">
                <div className="flex items-center gap-2">
                    {settings.logoBase64 ? <img src={settings.logoBase64} className="h-6 w-auto" /> : <div className="h-4 w-4 rounded-full bg-primary" />}
                    <span className="font-bold text-[10px] uppercase tracking-tighter" style={{ color: 'var(--primary)' }}>{settings.siteName}</span>
                </div>
                <div className="flex gap-3">
                    <div className="h-1 w-6 bg-slate-200 rounded-full" />
                    <div className="h-1 w-6 bg-slate-200 rounded-full" />
                    <div className="h-1 w-6 bg-slate-200 rounded-full" />
                </div>
            </div>

            {/* Hero Section Mini */}
            <div className="relative h-64 overflow-hidden shrink-0 flex items-center justify-center text-center p-8">
                <div className="absolute inset-0 bg-slate-900">
                    {slide?.imageBase64 && <img src={slide.imageBase64} className="absolute inset-0 w-full h-full object-cover opacity-60" />}
                    {!slide?.imageBase64 && <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800" />}
                </div>
                <div className="relative z-10 space-y-3">
                    <h2 className="text-2xl font-display font-bold text-white leading-tight">
                        {slide?.title || settings.heroTitle}
                    </h2>
                    <p className="text-[10px] text-slate-300 max-w-[200px] mx-auto">
                        {slide?.subtitle || settings.heroSubtitle}
                    </p>
                    <div className="pt-2">
                        <button className="px-5 py-2 rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: 'var(--secondary)', color: '#000' }}>
                            {slide?.buttonText || "Cotação Gratuita"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Mini */}
            <div className="p-8 space-y-6 flex-1 bg-white overflow-hidden">
                <div className="space-y-2">
                    <h3 className="text-sm font-bold border-l-4 border-amber-400 pl-3" style={{ color: 'var(--primary)', fontFamily: 'var(--font-display)' }}>
                        {settings.servicesTitle || "Nossos Serviços"}
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="h-16 bg-slate-50 rounded-xl border border-slate-100" />
                        <div className="h-16 bg-slate-50 rounded-xl border border-slate-100" />
                    </div>
                </div>

                <div className="pt-4 space-y-4">
                    <div className="flex gap-4">
                        <div className="w-1/2 h-32 bg-slate-200 rounded-xl overflow-hidden">
                            {settings.aboutImageBase64 && <img src={settings.aboutImageBase64} className="w-full h-full object-cover" />}
                        </div>
                        <div className="w-1/2 space-y-2">
                            <h4 className="text-xs font-bold leading-none">{settings.aboutTitle}</h4>
                            <div className="h-1 w-full bg-slate-100 rounded" />
                            <div className="h-1 w-full bg-slate-100 rounded" />
                            <div className="h-1 w-2/3 bg-slate-100 rounded" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="h-8 bg-slate-900 flex items-center px-6 shrink-0">
                <div className="h-1 w-20 bg-slate-700 rounded-full" />
            </div>
        </div>
    );
}

export default function SiteConfigPage() {
    const { settings, isLoadingSettings, slides, isLoadingSlides, updateSettings, isUpdatingSettings, createSlide, updateSlide, deleteSlide } = useSiteSettings();
    const [activeTab, setActiveTab] = useState("identity");

    const siteForm = useForm<InsertSiteSettings>({
        resolver: zodResolver(insertSiteSettingsSchema),
        defaultValues: settings || {
            siteName: "Monteiro Corretora",
            primaryColor: "#0f172a",
            secondaryColor: "#fbbf24",
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
        },
    });

    useEffect(() => {
        if (settings) {
            siteForm.reset(settings);
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
                <TabsList className="bg-slate-200/50 p-1.5 rounded-2xl grid grid-cols-2 md:grid-cols-5 gap-1 h-auto mb-8 border border-white/40 shadow-sm">
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

                        {/* Live Preview Panel (Always visible on Desktop if tab != identity?) */}
                        <TabsContent value="identity" className="hidden" />

                        <div className="mt-12 pt-12 border-t border-slate-100">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
                                    <Eye className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-display font-bold">Pré-visualização Instantânea</h3>
                                    <p className="text-slate-500">Veja como as mudanças afetam o visual do seu site antes de publicar.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-slate-100/50 p-12 rounded-[40px] border border-white shadow-inner">
                                <div className="space-y-6">
                                    <div className="flex gap-2 p-1 bg-slate-200 w-fit rounded-lg">
                                        <Button size="sm" variant="ghost" className="rounded-md bg-white shadow-sm h-8 px-3 gap-2">
                                            <Monitor className="h-3.5 w-3.5" /> Desktop
                                        </Button>
                                        <Button size="sm" variant="ghost" className="rounded-md h-8 px-3 gap-2 text-slate-500">
                                            <Smartphone className="h-3.5 w-3.5" /> Mobile
                                        </Button>
                                    </div>
                                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4">
                                        <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                                        <p className="text-sm text-amber-800 leading-relaxed font-medium">
                                            Esta é uma versão reduzida focada em layout e cores.
                                            Use-a para validar a legibilidade e harmonia dos elementos.
                                        </p>
                                    </div>
                                </div>
                                <div className="h-[600px] overflow-hidden flex items-start justify-center">
                                    <LivePreview
                                        settings={siteForm.watch()}
                                        slide={slides && slides.length > 0 ? slides[0] : undefined}
                                    />
                                </div>
                            </div>
                        </div>

                    </form>
                </Form>
            </Tabs>
        </div>
    );
}
