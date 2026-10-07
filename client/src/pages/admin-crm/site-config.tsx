import { useSiteSettings } from "@/hooks/use-site-settings";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSiteSettingsSchema, insertHeroSlideSchema, type InsertSiteSettings, type InsertHeroSlide, type HeroSlide, type SiteSettings } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";
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
    Search,
    Edit3,
    Clock,
    Sparkles,
    Heart,
    ShieldCheck,
    Video,
    Film,
    Volume2,
    VolumeX,
    UploadCloud,
    CheckCircle2
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

import { getVideoEmbedInfo } from "@/lib/videoUtils";

const SAMPLE_PRESETS = [
    {
        name: "Saúde Familiar",
        image: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&q=80&w=2000",
        title: "Planos de Saúde Individuais & Familiares",
        subtitle: "A proteção mais completa para quem você ama. Acesso aos melhores hospitais do país com condições diferenciadas e atendimento personalizado.",
        buttonText: "Cotação Individual",
        buttonLink: "/contact"
    },
    {
        name: "Corporativo",
        image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=2000",
        title: "Benefícios Corporativos Sob Medida",
        subtitle: "Reduza a sinistralidade e valorize sua equipe. Planos de saúde empresariais customizados para pequenas, médias e grandes empresas.",
        buttonText: "Cotação Corporativa",
        buttonLink: "/contact"
    },
    {
        name: "Planos Premium",
        image: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=2000",
        title: "Planos de Saúde Premium & Reembolso",
        subtitle: "Reembolsos diferenciados, telemedicina de ponta e assistência nacional e internacional. O padrão de saúde que sua família e executivos merecem.",
        buttonText: "Planos Premium",
        buttonLink: "/contact"
    },
    {
        name: "Vida & Sucessão",
        image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=2000",
        title: "Seguro de Vida e Sucessão Patrimonial",
        subtitle: "Garantia de liquidez imediata, segurança sucessória e proteção irrestrita para sua família e patrimônio construído.",
        buttonText: "Consultoria Especializada",
        buttonLink: "/contact"
    }
];

const SAMPLE_VIDEO_PRESETS = [
    {
        name: "Saúde & Cuidado Familiar HD",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-family-walking-in-a-park-together-41364-large.mp4",
        poster: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&q=80&w=2000",
        title: "Planos de Saúde Individuais & Familiares",
        subtitle: "A proteção mais completa para quem você ama. Acesso aos melhores hospitais do país com condições diferenciadas.",
        buttonText: "Cotação Familiar",
        buttonLink: "/contact"
    },
    {
        name: "Corporativo & Estratégia HD",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-hands-of-businesspeople-at-a-meeting-in-an-office-42028-large.mp4",
        poster: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=2000",
        title: "Benefícios Corporativos Sob Medida",
        subtitle: "Gestão inteligente de sinistralidade e valorização dos seus colaboradores com economia sustentável.",
        buttonText: "Cotação Corporativa",
        buttonLink: "/contact"
    },
    {
        name: "Vida & Futuro Tranquilo HD",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-mother-and-daughter-smiling-outdoors-42095-large.mp4",
        poster: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=2000",
        title: "Seguro de Vida e Sucessão Patrimonial",
        subtitle: "Garantia de liquidez imediata e proteção irrestrita para o patrimônio da sua família.",
        buttonText: "Consultoria Especializada",
        buttonLink: "/contact"
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
    const [isVideoUploading, setIsVideoUploading] = useState(false);
    const { toast } = useToast();

    const form = useForm<InsertHeroSlide>({
        resolver: zodResolver(insertHeroSlideSchema),
        defaultValues: {
            title: slide?.title || "",
            subtitle: slide?.subtitle || "",
            mediaType: (slide?.mediaType === "video" || Boolean(slide?.videoUrl) ? "video" : "image") as "image" | "video",
            imageBase64: slide?.imageBase64 || "",
            videoUrl: slide?.videoUrl || "",
            videoFit: (slide?.videoFit === "contain" ? "contain" : "cover") as "cover" | "contain",
            slideDuration: slide?.slideDuration ?? 7,
            buttonText: slide?.buttonText || "Cotação Gratuita",
            buttonLink: slide?.buttonLink || "/contact",
            order: slide?.order ?? 0,
            isActive: slide?.isActive ?? true
        }
    });

    const currentMediaType = form.watch("mediaType") || "image";
    const currentVideoUrl = form.watch("videoUrl") || "";
    const currentVideoFit = form.watch("videoFit") || "cover";
    const currentImage = form.watch("imageBase64") || "";
    const currentDuration = form.watch("slideDuration") ?? 7;

    useEffect(() => {
        if (open) {
            form.reset({
                title: slide?.title || "",
                subtitle: slide?.subtitle || "",
                mediaType: (slide?.mediaType === "video" || Boolean(slide?.videoUrl) ? "video" : "image") as "image" | "video",
                imageBase64: slide?.imageBase64 || "",
                videoUrl: slide?.videoUrl || "",
                videoFit: (slide?.videoFit === "contain" ? "contain" : "cover") as "cover" | "contain",
                slideDuration: slide?.slideDuration ?? 7,
                buttonText: slide?.buttonText || "Cotação Gratuita",
                buttonLink: slide?.buttonLink || "/contact",
                order: slide?.order ?? 0,
                isActive: slide?.isActive ?? true
            });
        }
    }, [open, slide, form]);

    const handleSave = (data: InsertHeroSlide) => {
        // Garantir que se for vídeo e não tiver poster, salvar sem travar
        const payload: InsertHeroSlide = {
            ...data,
            mediaType: data.mediaType || "image",
            videoFit: data.videoFit || "cover",
            videoUrl: data.videoUrl?.trim() || null,
            imageBase64: data.imageBase64?.trim() || null,
            slideDuration: Number(data.slideDuration) || 7,
        };

        if (payload.mediaType === "video" && !payload.videoUrl) {
            toast({
                title: "URL do vídeo ausente",
                description: "Insira uma URL de vídeo ou selecione um modelo HD.",
                variant: "destructive"
            });
            return;
        }

        if (payload.mediaType === "image" && !payload.imageBase64) {
            toast({
                title: "Imagem ausente",
                description: "Selecione uma imagem para o banner.",
                variant: "destructive"
            });
            return;
        }

        onSave(payload);
        setOpen(false);
    };

    const handleVideoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Limite de 45MB para Data URL local direta
        const maxBytes = 45 * 1024 * 1024;
        if (file.size > maxBytes) {
            toast({
                title: "Arquivo muito pesado",
                description: "Para vídeos acima de 45MB, recomendamos inserir um link direto (MP4 em CDN, YouTube ou Vimeo) para garantir carregamento instantâneo.",
                variant: "destructive"
            });
            return;
        }

        setIsVideoUploading(true);
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            form.setValue("videoUrl", result);
            form.setValue("mediaType", "video");
            setIsVideoUploading(false);
            toast({
                title: "Vídeo carregado com sucesso!",
                description: `${file.name} pronto para ser exibido.`
            });
        };
        reader.onerror = () => {
            setIsVideoUploading(false);
            toast({
                title: "Erro ao ler arquivo",
                description: "Não foi possível carregar o vídeo local.",
                variant: "destructive"
            });
        };
        reader.readAsDataURL(file);
    };

    const embedInfo = getVideoEmbedInfo(currentVideoUrl);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl border-none shadow-2xl p-0">
                <DialogHeader className="p-8 bg-slate-50 border-b border-slate-100">
                    <DialogTitle className="text-2xl font-display font-bold text-slate-900 flex items-center gap-3">
                        {slide && 'id' in slide ? <Edit3 className="h-6 w-6 text-primary" /> : <Plus className="h-6 w-6 text-emerald-600" />}
                        {slide && 'id' in slide ? "Editar Slide do Banner" : "Novo Slide de Impacto"}
                    </DialogTitle>
                    <DialogDescription>
                        Crie uma experiência visual cinematográfica para seus clientes na entrada do site.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-8 space-y-8">
                    {/* Segmented Control de Tipo de Mídia */}
                    <div className="flex rounded-2xl bg-slate-100 p-1.5 border border-slate-200">
                        <button
                            type="button"
                            onClick={() => form.setValue("mediaType", "image")}
                            className={cn(
                                "flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2",
                                currentMediaType === "image"
                                    ? "bg-white text-primary shadow-sm"
                                    : "text-slate-600 hover:text-slate-900"
                            )}
                        >
                            <ImageIcon className="h-4 w-4" />
                            Banner com Imagem
                        </button>
                        <button
                            type="button"
                            onClick={() => form.setValue("mediaType", "video")}
                            className={cn(
                                "flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2",
                                currentMediaType === "video"
                                    ? "bg-primary text-white shadow-sm"
                                    : "text-slate-600 hover:text-slate-900"
                            )}
                        >
                            <Film className="h-4 w-4 text-amber-300" />
                            Banner com Vídeo HD
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Coluna da Esquerda: Mídia (Imagem ou Vídeo) */}
                        <div className="space-y-6">
                            {currentMediaType === "image" ? (
                                <>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Imagem do Slide</Label>
                                        <ImageUpload
                                            value={currentImage}
                                            onChange={(val) => form.setValue("imageBase64", val)}
                                            label="Foto de Fundo em Alta Resolução"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ou escolha um modelo HD Monteiro</Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {SAMPLE_PRESETS.map((preset, i) => (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    onClick={() => {
                                                        form.setValue("imageBase64", preset.image);
                                                        form.setValue("title", preset.title);
                                                        form.setValue("subtitle", preset.subtitle);
                                                        form.setValue("buttonText", preset.buttonText);
                                                        form.setValue("buttonLink", preset.buttonLink);
                                                    }}
                                                    className="group relative h-20 rounded-xl overflow-hidden border-2 border-transparent hover:border-primary transition-all text-left"
                                                >
                                                    <img src={preset.image} className="w-full h-full object-cover grayscale group-hover:grayscale-0" alt={preset.name} />
                                                    <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 flex items-center justify-center p-2 text-center transition-colors">
                                                        <span className="text-[10px] text-white font-bold uppercase tracking-tight">{preset.name}</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Configuração de Vídeo */}
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                                <Film className="h-4 w-4 text-primary" />
                                                URL do Vídeo (MP4, WebM, YouTube ou Vimeo)
                                            </Label>
                                            <Input
                                                {...form.register("videoUrl")}
                                                placeholder="https://exemplo.com/video.mp4 ou link YouTube"
                                                className="h-11 rounded-xl text-sm font-mono border-slate-200"
                                            />
                                            <p className="text-[11px] text-slate-500">
                                                Aceita link direto MP4/WebM de CDN, ou links do YouTube (ex: youtube.com/watch?v=...) e Vimeo.
                                            </p>
                                        </div>

                                        {/* Botão de Upload Local */}
                                        <div className="pt-1">
                                            <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 hover:border-primary rounded-2xl p-4 cursor-pointer hover:bg-slate-50 transition-all text-sm font-medium text-slate-600">
                                                <UploadCloud className="h-5 w-5 text-primary" />
                                                <span>{isVideoUploading ? "Processando vídeo..." : "Fazer Upload de Vídeo Local (.mp4, .webm)"}</span>
                                                <input
                                                    type="file"
                                                    accept="video/mp4,video/webm,video/quicktime,video/*"
                                                    className="hidden"
                                                    onChange={handleVideoFileSelect}
                                                    disabled={isVideoUploading}
                                                />
                                            </label>
                                        </div>

                                        {/* Modo de Enquadramento (Sem cortes vs Preenchimento) */}
                                        <div className="space-y-2 pt-2">
                                            <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                                                <span>Modo de Enquadramento</span>
                                                <span className="text-[11px] text-emerald-600 font-bold lowercase">Qualidade Máxima</span>
                                            </Label>
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => form.setValue("videoFit", "contain")}
                                                    className={cn(
                                                        "p-3 rounded-xl border text-left transition-all",
                                                        currentVideoFit === "contain"
                                                            ? "border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20"
                                                            : "border-slate-200 hover:border-slate-300 bg-white"
                                                    )}
                                                >
                                                    <p className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                                                        <CheckCircle2 className={cn("h-3.5 w-3.5", currentVideoFit === "contain" ? "text-emerald-600" : "text-slate-300")} />
                                                        Sem Cortes (100%)
                                                    </p>
                                                    <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                                                        Visão completa: preserva todos os detalhes do vídeo sem cortar nenhuma borda, com fundo ambiental.
                                                    </p>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => form.setValue("videoFit", "cover")}
                                                    className={cn(
                                                        "p-3 rounded-xl border text-left transition-all",
                                                        currentVideoFit === "cover"
                                                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                                            : "border-slate-200 hover:border-slate-300 bg-white"
                                                    )}
                                                >
                                                    <p className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                                                        <CheckCircle2 className={cn("h-3.5 w-3.5", currentVideoFit === "cover" ? "text-primary" : "text-slate-300")} />
                                                        Preenchimento Total
                                                    </p>
                                                    <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                                                        Cobre 100% da tela do banner estilo cinema em tela cheia.
                                                    </p>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Poster / Imagem de Capa Opcional */}
                                        <div className="space-y-2 pt-2">
                                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Imagem de Capa (Poster / Fallback)</Label>
                                            <Input
                                                value={currentImage}
                                                onChange={(e) => form.setValue("imageBase64", e.target.value)}
                                                placeholder="https://exemplo.com/poster.jpg (opcional)"
                                                className="h-10 rounded-xl text-xs"
                                            />
                                        </div>

                                        {/* Presets de Vídeo HD */}
                                        <div className="space-y-2 pt-2">
                                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Modelos de Vídeo HD Pré-configurados</Label>
                                            <div className="space-y-1.5">
                                                {SAMPLE_VIDEO_PRESETS.map((preset, i) => (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        onClick={() => {
                                                            form.setValue("videoUrl", preset.videoUrl);
                                                            form.setValue("imageBase64", preset.poster);
                                                            form.setValue("title", preset.title);
                                                            form.setValue("subtitle", preset.subtitle);
                                                            form.setValue("buttonText", preset.buttonText);
                                                            form.setValue("buttonLink", preset.buttonLink);
                                                        }}
                                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 hover:border-primary hover:bg-slate-50 text-left flex items-center justify-between transition-all"
                                                    >
                                                        <span className="font-bold text-slate-800">{preset.name}</span>
                                                        <span className="text-[10px] text-primary font-semibold">Usar este vídeo →</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Coluna da Direita: Textos, Botões & Preview */}
                        <div className="space-y-5">
                            {/* Player de Preview em Tempo Real */}
                            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-inner">
                                <div className="px-3 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-300">
                                    <span className="font-mono flex items-center gap-1.5">
                                        <Play className="h-3 w-3 text-emerald-400" />
                                        Preview em Tempo Real
                                    </span>
                                    <span className="font-semibold text-amber-400">
                                        {currentMediaType === "video" ? (currentVideoFit === "contain" ? "Sem Cortes (100%)" : "Cover Total") : "Imagem HD"}
                                    </span>
                                </div>
                                <div className="relative h-44 w-full bg-slate-950 flex items-center justify-center overflow-hidden">
                                    {currentMediaType === "video" && currentVideoUrl ? (
                                        embedInfo.type === "youtube" || embedInfo.type === "vimeo" ? (
                                            <iframe
                                                src={embedInfo.embedUrl}
                                                className="w-full h-full border-0 pointer-events-none"
                                                allow="autoplay"
                                            />
                                        ) : (
                                            <div className="relative w-full h-full flex items-center justify-center">
                                                {currentVideoFit === "contain" && (
                                                    <video
                                                        src={currentVideoUrl}
                                                        autoPlay
                                                        loop
                                                        muted
                                                        playsInline
                                                        className="absolute inset-0 w-full h-full object-cover blur-xl opacity-30 pointer-events-none scale-110"
                                                    />
                                                )}
                                                <video
                                                    src={currentVideoUrl}
                                                    autoPlay
                                                    loop
                                                    muted
                                                    playsInline
                                                    poster={currentImage || undefined}
                                                    className={cn(
                                                        "w-full h-full relative z-10",
                                                        currentVideoFit === "contain" ? "object-contain" : "object-cover"
                                                    )}
                                                />
                                            </div>
                                        )
                                    ) : currentImage ? (
                                        <img src={currentImage} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center p-6 text-slate-500">
                                            <ImageIcon className="h-8 w-8 mx-auto mb-2 text-slate-600" />
                                            <p className="text-xs">Insira uma imagem ou vídeo para visualizar o preview.</p>
                                        </div>
                                    )}

                                    {/* Overlay de texto simulado */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent z-20 pointer-events-none flex flex-col justify-end p-4">
                                        <p className="text-white font-bold text-sm line-clamp-1">{form.watch("title") || "Título do Slide"}</p>
                                        <p className="text-slate-300 text-[11px] line-clamp-1">{form.watch("subtitle") || "Subtítulo de destaque..."}</p>
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
                                    <Textarea {...form.register("subtitle")} className="min-h-[75px] rounded-xl resize-none" placeholder="Uma breve frase impactante..." />
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

                                {/* Seletor de Duração do Slide / Vídeo */}
                                <div className="space-y-2.5 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                            <Clock className="h-3.5 w-3.5 text-primary" />
                                            Tempo de Exibição / Duração
                                        </Label>
                                        <span className="text-xs font-black text-primary font-mono bg-white px-2.5 py-0.5 rounded-full border border-slate-200 shadow-xs">
                                            {form.watch("slideDuration") || 7} segundos
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            min={3}
                                            max={180}
                                            {...form.register("slideDuration", { valueAsNumber: true })}
                                            className="h-10 rounded-xl font-mono text-sm w-24 bg-white"
                                        />
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            {[5, 7, 10, 15, 20, 30].map((sec) => (
                                                <button
                                                    key={sec}
                                                    type="button"
                                                    onClick={() => form.setValue("slideDuration", sec)}
                                                    className={cn(
                                                        "px-2.5 py-1 rounded-lg text-xs font-bold transition-all",
                                                        form.watch("slideDuration") === sec
                                                            ? "bg-primary text-white shadow-sm"
                                                            : "bg-white hover:bg-slate-200 text-slate-700 border border-slate-200"
                                                    )}
                                                >
                                                    {sec}s
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-slate-500">
                                        Tempo que este slide/vídeo permanece na tela antes de passar para o próximo.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-8 bg-slate-50 border-t border-slate-100 flex gap-3">
                    <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-xl h-12">Cancelar</Button>
                    <Button onClick={form.handleSubmit((values: any) => handleSave(values))} className="rounded-xl h-12 px-8 bg-primary hover:bg-primary/90 text-white font-bold">
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
    const [isEditingKey, setIsEditingKey] = useState(false);
    const [customKeyInput, setCustomKeyInput] = useState("");

    const fetchExternalSettings = async () => {
        try {
            setLoadingExternalApi(true);
            const res = await apiRequest("GET", "/api/v1/external/settings");
            const data = await res.json();
            setExternalApiData(data);
            setCustomKeyInput(data?.apiKey || "");
        } catch (_) {} finally {
            setLoadingExternalApi(false);
        }
    };

    const handleSaveCustomKey = async () => {
        const cleanKey = customKeyInput.trim();
        if (!cleanKey || cleanKey.length < 6) {
            toast({ title: "Chave inválida", description: "A chave deve ter pelo menos 6 caracteres.", variant: "destructive" });
            return;
        }
        try {
            setLoadingExternalApi(true);
            const res = await apiRequest("POST", "/api/v1/external/set-key", { apiKey: cleanKey });
            const data = await res.json();
            setExternalApiData(prev => ({
                apiKey: data.apiKey,
                endpointUrl: prev?.endpointUrl || (window.location.origin + "/api/v1/external/contacts/lookup")
            }));
            setIsEditingKey(false);
            toast({ title: "🔑 Chave de API Atualizada!", description: data.message });
        } catch (err: any) {
            toast({ title: "Erro ao salvar chave", description: err.message, variant: "destructive" });
        } finally {
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
            siteName: "Monteiro Seguros e Benefícios",
            primaryColor: "#08454c",
            secondaryColor: "#c65f54",
            fontSans: "Inter",
            fontDisplay: "Outfit",
            heroTitle: "Proteção que Transforma,\nBenefícios que Cuidam",
            heroSubtitle: "A Monteiro Seguros e Benefícios é especializada em consultoria estratégica em proteção e benefícios para empresas e famílias.",
            aboutTitle: "Sobre a Monteiro Seguros e Benefícios",
            aboutContent: "A Monteiro Seguros e Benefícios é especializada em oferecer consultoria estratégica em proteção e benefícios para empresas e famílias.\n\nMais do que comercializar seguros, atuamos como parceiros na construção de soluções que equilibram cuidado com pessoas, controle de custos e segurança financeira, tanto no ambiente corporativo quanto na vida pessoal.",
            servicesTitle: "Seguros Estruturados & Benefícios Inteligentes",
            servicesSubtitle: "Modelos boutique de apólices elaboradas para resguardar sua vida corporativa, saúde familiar e legado patrimonial de forma sustentável.",
            blogTitle: "Nossos Posts & Publicações",
            blogSubtitle: "Fique por dentro das novidades, orientações e publicações da Monteiro Seguros e Benefícios.",
            contactEmail: "carolina@monteirocorretora.com.br",
            contactPhone: "+55 (11) 94454-7444",
            address: "Av. Santa Marina, 2569 - São Paulo, SP",
            footerText: "Oferecemos uma verdadeira consultoria em seguros e benefícios para você e sua empresa.",
            instagramUrl: "https://www.instagram.com/monteirosegurosebeneficios/",
            facebookUrl: "",
            linkedinUrl: "",
            twitterUrl: "",
            logoScale: 160,
            logoScaleMobile: 140,
            smtpHost: "",
            smtpPort: 587,
            smtpUser: "",
            smtpPass: "",
            smtpFrom: "",
            resendApiKey: "",
            activeTheme: "default",
            themeOutubroRosa: false,
            themeOutubroRosaBadge: true,
        },
    });

    useEffect(() => {
        if (settings) {
            siteForm.reset({
                ...settings,
                siteName: settings.siteName || "Monteiro Seguros e Benefícios",
                instagramUrl: settings.instagramUrl || "https://www.instagram.com/monteirosegurosebeneficios/",
                contactPhone: settings.contactPhone || "+55 (11) 94454-7444",
                contactEmail: settings.contactEmail || "carolina@monteirocorretora.com.br",
                address: settings.address || "Av. Santa Marina, 2569 - São Paulo, SP",
                servicesTitle: settings.servicesTitle || "Seguros Estruturados & Benefícios Inteligentes",
                servicesSubtitle: settings.servicesSubtitle || "Modelos boutique de apólices elaboradas para resguardar sua vida corporativa, saúde familiar e legado patrimonial de forma sustentável.",
                blogTitle: settings.blogTitle || "Nossos Posts & Publicações",
                blogSubtitle: settings.blogSubtitle || "Fique por dentro das novidades, orientações e publicações da Monteiro Seguros e Benefícios.",
                footerText: settings.footerText || "Oferecemos uma verdadeira consultoria em seguros e benefícios para você e sua empresa.",
                aboutTitle: settings.aboutTitle || "Sobre a Monteiro Seguros e Benefícios",
                facebookUrl: settings.facebookUrl || "",
                linkedinUrl: settings.linkedinUrl || "",
                twitterUrl: settings.twitterUrl || "",
                smtpHost: settings.smtpHost || "",
                smtpPort: settings.smtpPort || 587,
                smtpUser: settings.smtpUser || "",
                smtpPass: settings.smtpPass || "",
                smtpFrom: settings.smtpFrom || "",
                resendApiKey: settings.resendApiKey || "",
                activeTheme: settings.activeTheme || "default",
                themeOutubroRosa: Boolean(settings.themeOutubroRosa || settings.activeTheme === "outubro_rosa"),
                themeOutubroRosaBadge: settings.themeOutubroRosaBadge ?? true,
            });
        }
    }, [settings, siteForm]);

    const onSaveSettings = async (data: InsertSiteSettings) => {
        try {
            await updateSettings(data);
        } catch (err: any) {
            console.error("Erro ao salvar configurações:", err);
        }
    };

    const onFormError = (errors: any) => {
        console.error("Erros de validação em site-config:", errors);
        const fields = Object.keys(errors);
        toast({
            title: "Atenção ao salvar",
            description: `Revise os campos: ${fields.join(", ")}`,
            variant: "destructive"
        });
    };

    const handleMoveSlide = async (currentIndex: number, direction: "up" | "down") => {
        if (!slides || slides.length < 2) return;
        const sorted = [...slides].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
        if (targetIndex < 0 || targetIndex >= sorted.length) return;

        const currentSlide = sorted[currentIndex];
        const targetSlide = sorted[targetIndex];

        const currentOrder = currentSlide.order ?? currentIndex;
        const targetOrder = targetSlide.order ?? targetIndex;

        try {
            await updateSlide({ id: currentSlide.id, slide: { order: targetOrder } });
            await updateSlide({ id: targetSlide.id, slide: { order: currentOrder } });
            toast({ title: "Ordem dos slides atualizada com sucesso!" });
        } catch (err: any) {
            toast({ title: "Erro ao reordenar slides", description: err.message, variant: "destructive" });
        }
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
                    onClick={siteForm.handleSubmit(onSaveSettings, onFormError)}
                    disabled={isUpdatingSettings}
                    className="h-12 px-8 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 rounded-xl gap-2 active:scale-95 transition-all"
                >
                    {isUpdatingSettings ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    Publicar Alterações
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-slate-200/50 p-1.5 rounded-2xl grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5 h-auto mb-8 border border-white/40 shadow-sm">
                    <TabsTrigger value="identity" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm py-2.5 gap-2">
                        <Globe className="h-4 w-4" /> Identidade
                    </TabsTrigger>
                    <TabsTrigger value="styling" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm py-2.5 gap-2">
                        <Palette className="h-4 w-4" /> Estilo
                    </TabsTrigger>
                    <TabsTrigger value="themes" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm py-2.5 gap-2">
                        <Sparkles className="h-4 w-4 text-pink-500" /> Temas
                    </TabsTrigger>
                    <TabsTrigger value="home" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm py-2.5 gap-2 font-bold text-slate-800">
                        <Film className="h-4 w-4 text-primary" /> Banners & Vídeos
                    </TabsTrigger>
                    <TabsTrigger value="pages" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm py-2.5 gap-2">
                        <Info className="h-4 w-4" /> Páginas
                    </TabsTrigger>
                    <TabsTrigger value="contact" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm py-2.5 gap-2">
                        <PhoneCall className="h-4 w-4" /> Contato
                    </TabsTrigger>
                    <TabsTrigger value="email" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm py-2.5 gap-2">
                        <Mail className="h-4 w-4" /> E-mail
                    </TabsTrigger>
                    {activeTab === "api" && (
                        <TabsTrigger value="api" className="rounded-xl data-[state=active]:bg-slate-900 data-[state=active]:text-amber-400 py-2.5 gap-2 col-span-2 md:col-span-7 bg-slate-900 text-amber-400 font-bold border border-slate-800">
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
                                <CardFooter className="bg-slate-50 border-t border-slate-100 p-6 flex justify-end">
                                    <Button
                                        type="button"
                                        onClick={siteForm.handleSubmit(onSaveSettings, onFormError)}
                                        disabled={isUpdatingSettings}
                                        className="h-11 px-6 bg-primary hover:bg-primary/90 text-white rounded-xl gap-2 font-bold shadow-md shadow-primary/20 active:scale-95 transition-all"
                                    >
                                        {isUpdatingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                        Salvar Identidade
                                    </Button>
                                </CardFooter>
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
                                <CardFooter className="bg-slate-50 border-t border-slate-100 p-6 flex justify-end">
                                    <Button
                                        type="button"
                                        onClick={siteForm.handleSubmit(onSaveSettings, onFormError)}
                                        disabled={isUpdatingSettings}
                                        className="h-11 px-6 bg-primary hover:bg-primary/90 text-white rounded-xl gap-2 font-bold shadow-md shadow-primary/20 active:scale-95 transition-all"
                                    >
                                        {isUpdatingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                        Salvar Estilo & Fontes
                                    </Button>
                                </CardFooter>
                            </Card>
                        </TabsContent>

                        {/* Themes TAB */}
                        <TabsContent value="themes" className="mt-0 focus-visible:outline-none space-y-8">
                            {/* Live Status Banner */}
                            <div className={cn(
                                "rounded-3xl p-6 md:p-8 border transition-all duration-500 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm",
                                siteForm.watch("themeOutubroRosa")
                                    ? "bg-gradient-to-r from-[#fbf6f7] via-[#f7edf1] to-[#f3e4e9] border-[#e8b4c0]/50"
                                    : "bg-slate-50 border-slate-200"
                            )}>
                                <div className="flex items-start gap-4">
                                    <div className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-sm transition-transform duration-300",
                                        siteForm.watch("themeOutubroRosa")
                                            ? "bg-[#be5f77] text-white shadow-[#be5f77]/30 scale-105"
                                            : "bg-primary text-white"
                                    )}>
                                        {siteForm.watch("themeOutubroRosa") ? "🎗️" : "🏛️"}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="text-xl font-bold font-display text-slate-900">
                                                {siteForm.watch("themeOutubroRosa")
                                                    ? "Tema Outubro Rosa Suave Ativado"
                                                    : "Tema Padrão Monteiro Ativado"}
                                            </h3>
                                            <Badge className={cn(
                                                "font-bold uppercase tracking-wider text-[10px] px-2.5 py-0.5",
                                                siteForm.watch("themeOutubroRosa")
                                                    ? "bg-[#be5f77] text-white hover:bg-[#be5f77]"
                                                    : "bg-slate-200 text-slate-700 hover:bg-slate-200"
                                            )}>
                                                {siteForm.watch("themeOutubroRosa") ? "Campanha Ao Vivo" : "Identidade Original"}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                                            {siteForm.watch("themeOutubroRosa")
                                                ? "O site público está exibindo a paleta delicada e suave Outubro Rosa (Rose Quartz & Blush aveludado), com tipografia limpa, modal educativo discreto e contraste premium."
                                                : "O site está utilizando as cores padrões da marca definidas na aba Estilo (Verde Profundo e Terracota Vital)."}
                                        </p>
                                    </div>
                                </div>

                                <Button
                                    type="button"
                                    onClick={siteForm.handleSubmit(onSaveSettings)}
                                    disabled={isUpdatingSettings}
                                    className={cn(
                                        "rounded-xl h-11 px-6 font-bold text-white shadow-md transition-all shrink-0 active:scale-95",
                                        siteForm.watch("themeOutubroRosa")
                                            ? "bg-[#be5f77] hover:bg-[#b0536b] shadow-[#be5f77]/25"
                                            : "bg-primary hover:bg-primary/90"
                                    )}
                                >
                                    {isUpdatingSettings ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                    Salvar Alterações
                                </Button>
                            </div>

                            {/* Main Theme Card */}
                            <Card className="premium-card border-none shadow-sm overflow-hidden">
                                <CardHeader className="bg-gradient-to-r from-[#be5f77]/10 via-[#d68a9f]/5 to-transparent border-b border-[#e8b4c0]/40 p-8">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#be5f77] to-[#99475c] text-white flex items-center justify-center shadow-lg shadow-[#be5f77]/25">
                                                <Heart className="h-5 w-5 fill-white" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-2xl font-display font-bold text-slate-900 flex items-center gap-2">
                                                    Outubro Rosa Suave
                                                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#fbf6f7] text-[#be5f77] border border-[#e8b4c0]/50">
                                                        Edição Delicada
                                                    </span>
                                                </CardTitle>
                                                <CardDescription className="text-slate-500">
                                                    Transformação visual delicada e acolhedora em apoio à conscientização e cuidado com a saúde da mulher.
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-8 space-y-8">
                                    {/* Toggle Main Switch */}
                                    <div className="rounded-2xl border border-slate-200/80 p-6 bg-white hover:border-[#d68a9f]/60 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-base font-bold text-slate-900">Ativar Tema Outubro Rosa</span>
                                                {siteForm.watch("themeOutubroRosa") && (
                                                    <span className="relative flex h-2.5 w-2.5">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d68a9f] opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#be5f77]"></span>
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-500 max-w-xl">
                                                Aplica ao site uma paleta suave, delicada e harmoniosa (Rose Quartz e tons aveludados sem saturação agressiva). Quando desativado, o site volta 100% à sua identidade original.
                                            </p>
                                        </div>

                                        <FormField
                                            name="themeOutubroRosa"
                                            render={({ field }) => (
                                                <FormItem className="flex items-center space-y-0">
                                                    <FormControl>
                                                        <Switch
                                                            checked={Boolean(field.value)}
                                                            onCheckedChange={(checked) => {
                                                                field.onChange(checked);
                                                                siteForm.setValue("activeTheme", checked ? "outubro_rosa" : "default");
                                                            }}
                                                            className="data-[state=checked]:bg-[#be5f77] h-7 w-12"
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* Badge Switch */}
                                    <div className="rounded-2xl border border-slate-200/80 p-6 bg-white hover:border-[#d68a9f]/60 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="space-y-1">
                                            <span className="text-base font-bold text-slate-900">Exibir Selo Flutuante de Apoio à Causa</span>
                                            <p className="text-sm text-slate-500 max-w-xl">
                                                Exibe uma pílula minimalista e elegante ("🎗️ Outubro Rosa") no canto inferior da tela pública que abre um modal clean e acolhedor de conscientização.
                                            </p>
                                        </div>

                                        <FormField
                                            name="themeOutubroRosaBadge"
                                            render={({ field }) => (
                                                <FormItem className="flex items-center space-y-0">
                                                    <FormControl>
                                                        <Switch
                                                            checked={field.value !== false}
                                                            onCheckedChange={field.onChange}
                                                            disabled={!siteForm.watch("themeOutubroRosa")}
                                                            className="data-[state=checked]:bg-[#be5f77] h-7 w-12"
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* Harmonious Color Palette Presentation */}
                                    <div className="space-y-4">
                                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                                            Paleta Delicada e Suave do Tema
                                        </Label>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                                            <div className="rounded-2xl border border-slate-200 p-3.5 bg-slate-50/50 space-y-2">
                                                <div className="h-14 rounded-xl shadow-inner flex items-center justify-center text-white text-xs font-bold font-mono" style={{ backgroundColor: "#be5f77" }}>
                                                    #be5f77
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-800">Rose Quartz</p>
                                                    <p className="text-[11px] text-slate-500">Botões e Primário Suave</p>
                                                </div>
                                            </div>

                                            <div className="rounded-2xl border border-slate-200 p-3.5 bg-slate-50/50 space-y-2">
                                                <div className="h-14 rounded-xl shadow-inner flex items-center justify-center text-white text-xs font-bold font-mono" style={{ backgroundColor: "#d68a9f" }}>
                                                    #d68a9f
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-800">Blush Suave</p>
                                                    <p className="text-[11px] text-slate-500">Secundário e Detalhes</p>
                                                </div>
                                            </div>

                                            <div className="rounded-2xl border border-slate-200 p-3.5 bg-slate-50/50 space-y-2">
                                                <div className="h-14 rounded-xl shadow-inner flex items-center justify-center text-white text-xs font-bold font-mono" style={{ backgroundColor: "#38222c" }}>
                                                    #38222c
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-800">Malva Aveludado</p>
                                                    <p className="text-[11px] text-slate-500">Hero, Header e Rodapé</p>
                                                </div>
                                            </div>

                                            <div className="rounded-2xl border border-slate-200 p-3.5 bg-slate-50/50 space-y-2">
                                                <div className="h-14 rounded-xl shadow-inner flex items-center justify-center text-white text-xs font-bold font-mono" style={{ backgroundColor: "#e8b4c0" }}>
                                                    #e8b4c0
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-800">Pétala Suave</p>
                                                    <p className="text-[11px] text-slate-500">Badges e Bordas Leves</p>
                                                </div>
                                            </div>

                                            <div className="rounded-2xl border border-slate-200 p-3.5 bg-slate-50/50 space-y-2">
                                                <div className="h-14 rounded-xl shadow-inner border border-[#e8b4c0]/50 flex items-center justify-center text-[#99475c] text-xs font-bold font-mono" style={{ backgroundColor: "#fbf6f7" }}>
                                                    #fbf6f7
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-800">Nude Soft</p>
                                                    <p className="text-[11px] text-slate-500">Superfícies e Cartões</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Live Interactive Preview Box */}
                                    <div className="space-y-4">
                                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                                            Demonstração Visual em Tempo Real
                                        </Label>
                                        <div className={cn(
                                            "rounded-3xl p-6 md:p-8 transition-all duration-500 border overflow-hidden",
                                            siteForm.watch("themeOutubroRosa")
                                                ? "bg-gradient-to-br from-[#38222c] via-[#482836] to-[#27161f] text-white border-[#e8b4c0]/25 shadow-xl shadow-[#38222c]/20"
                                                : "bg-[#08454c] text-white border-slate-700"
                                        )}>
                                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                                <div className="space-y-2 max-w-xl">
                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-white/10 backdrop-blur-sm border border-white/20">
                                                        <span>{siteForm.watch("themeOutubroRosa") ? "🎗️ Conscientização & Cuidado" : "🏛️ Monteiro Seguros"}</span>
                                                    </div>
                                                    <h4 className="text-2xl font-bold font-display leading-tight">
                                                        {siteForm.watch("themeOutubroRosa")
                                                            ? "Cuidar de você e da sua saúde é o gesto mais bonito de proteção."
                                                            : "Protegendo seu Futuro, Garantindo seu Legado."}
                                                    </h4>
                                                    <p className="text-sm text-white/80">
                                                        Exemplo de como títulos, botões e cartões aparecerão para os visitantes do seu site com cores aveludadas e acolhedoras.
                                                    </p>
                                                </div>

                                                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                                                    <button
                                                        type="button"
                                                        className={cn(
                                                            "px-6 py-3 rounded-full font-bold text-sm shadow-lg transition-all",
                                                            siteForm.watch("themeOutubroRosa")
                                                                ? "bg-white text-[#38222c] hover:bg-white/90"
                                                                : "bg-white text-[#08454c] hover:bg-white/90"
                                                        )}
                                                    >
                                                        Solicitar Cotação
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={cn(
                                                            "px-6 py-3 rounded-full font-bold text-sm transition-all border",
                                                            siteForm.watch("themeOutubroRosa")
                                                                ? "bg-[#be5f77] text-white border-[#d68a9f]/30 hover:bg-[#b0536b]"
                                                                : "bg-[#c65f54] text-white border-transparent hover:bg-[#c65f54]/90"
                                                        )}
                                                    >
                                                        Conhecer Planos
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 100% Reversibility Guarantee Card */}
                                    <div className="rounded-2xl bg-emerald-50/80 border border-emerald-200/80 p-5 flex items-start gap-4 text-emerald-950">
                                        <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                                            <ShieldCheck className="h-4 w-4" />
                                        </div>
                                        <div className="space-y-1 text-sm">
                                            <p className="font-bold">Garantia de Reversibilidade 100%</p>
                                            <p className="text-emerald-800 leading-relaxed">
                                                Suas cores oficiais configuradas na aba <strong>Estilo</strong> (Cor Primária e Cor Secundária) ficam intactas no banco de dados. Ao desativar o interruptor acima, o site volta instantaneamente ao visual padrão.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-slate-50 border-t border-slate-100 p-6 flex justify-end">
                                    <Button
                                        type="button"
                                        onClick={siteForm.handleSubmit(onSaveSettings, onFormError)}
                                        disabled={isUpdatingSettings}
                                        className="h-11 px-6 bg-[#be5f77] hover:bg-[#b0536b] text-white rounded-xl gap-2 font-bold shadow-md shadow-[#be5f77]/20 active:scale-95 transition-all"
                                    >
                                        {isUpdatingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                        Salvar Configuração do Tema
                                    </Button>
                                </CardFooter>
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
                                            {([...(slides || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))).map((slide, index, sortedArr) => (
                                                <TableRow key={slide.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                    <TableCell className="pl-8">
                                                        <div className="flex flex-col items-center gap-1">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-slate-400 hover:text-primary"
                                                                onClick={() => handleMoveSlide(index, "up")}
                                                                disabled={index === 0}
                                                                title="Subir posição"
                                                            >
                                                                <MoveUp className="h-4 w-4" />
                                                            </Button>
                                                            <span className="text-sm font-black text-slate-600 font-mono">{slide.order ?? index}</span>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-slate-400 hover:text-primary"
                                                                onClick={() => handleMoveSlide(index, "down")}
                                                                disabled={index === sortedArr.length - 1}
                                                                title="Descer posição"
                                                            >
                                                                <MoveDown className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="h-16 w-28 rounded-xl overflow-hidden shadow-inner bg-slate-900 flex items-center justify-center border border-slate-200 relative group">
                                                            {slide.mediaType === "video" || slide.videoUrl ? (
                                                                <>
                                                                    {slide.videoUrl && !slide.videoUrl.includes("youtube") && !slide.videoUrl.includes("vimeo") ? (
                                                                        <video
                                                                            src={slide.videoUrl}
                                                                            muted
                                                                            loop
                                                                            autoPlay
                                                                            playsInline
                                                                            poster={slide.imageBase64 || undefined}
                                                                            className={cn(
                                                                                "w-full h-full",
                                                                                slide.videoFit === "contain" ? "object-contain bg-black" : "object-cover"
                                                                            )}
                                                                        />
                                                                    ) : slide.imageBase64 ? (
                                                                        <img src={slide.imageBase64} alt={slide.title} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <Film className="h-6 w-6 text-amber-400" />
                                                                    )}
                                                                    <div className="absolute top-1 left-1 bg-black/80 backdrop-blur-sm px-1.5 py-0.5 rounded text-[8px] font-black tracking-wider text-amber-300 flex items-center gap-1 shadow-sm">
                                                                        <Film className="h-2.5 w-2.5" /> VÍDEO
                                                                    </div>
                                                                </>
                                                            ) : slide.imageBase64 ? (
                                                                <img src={slide.imageBase64} alt={slide.title} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <ImageIcon className="h-6 w-6 text-slate-300" />
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <p className="font-bold text-slate-900 line-clamp-1">{slide.title}</p>
                                                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-semibold border text-slate-700 bg-slate-50 border-slate-300 flex items-center gap-1">
                                                                    <Clock className="w-2.5 h-2.5 text-slate-500" />
                                                                    {slide.slideDuration || 7}s
                                                                </Badge>
                                                                {(slide.mediaType === "video" || slide.videoUrl) && (
                                                                    <Badge variant="outline" className={cn(
                                                                        "text-[10px] px-1.5 py-0 font-semibold border",
                                                                        slide.videoFit === "contain" 
                                                                            ? "text-emerald-700 bg-emerald-50 border-emerald-300" 
                                                                            : "text-blue-700 bg-blue-50 border-blue-300"
                                                                    )}>
                                                                        {slide.videoFit === "contain" ? "Sem Cortes" : "Cover"}
                                                                    </Badge>
                                                                )}
                                                            </div>
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
                                                                <Button type="button" variant="ghost" size="icon" className="text-slate-500 hover:text-primary hover:bg-slate-100 rounded-lg" title="Editar Slide">
                                                                    <Edit3 className="h-4 w-4" />
                                                                </Button>
                                                            }
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl"
                                                            title="Excluir Slide"
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
                                <CardFooter className="bg-slate-50 border-t border-slate-100 p-6 flex justify-end">
                                    <Button
                                        type="button"
                                        onClick={siteForm.handleSubmit(onSaveSettings, onFormError)}
                                        disabled={isUpdatingSettings}
                                        className="h-11 px-6 bg-primary hover:bg-primary/90 text-white rounded-xl gap-2 font-bold shadow-md shadow-primary/20 active:scale-95 transition-all"
                                    >
                                        {isUpdatingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                        Salvar Títulos da Home
                                    </Button>
                                </CardFooter>
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
                                <CardFooter className="bg-slate-50 border-t border-slate-100 p-6 flex justify-end">
                                    <Button
                                        type="button"
                                        onClick={siteForm.handleSubmit(onSaveSettings, onFormError)}
                                        disabled={isUpdatingSettings}
                                        className="h-11 px-6 bg-primary hover:bg-primary/90 text-white rounded-xl gap-2 font-bold shadow-md shadow-primary/20 active:scale-95 transition-all"
                                    >
                                        {isUpdatingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                        Salvar Conteúdo Institucional
                                    </Button>
                                </CardFooter>
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
                                                            <Input {...field} value={field.value || ""} placeholder="https://instagram.com/monteirosegurosebeneficios/" className="h-12 rounded-xl border-slate-200" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={siteForm.control}
                                                name="linkedinUrl"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs font-bold text-slate-500">LinkedIn URL</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} value={field.value || ""} placeholder="https://linkedin.com/company/monteiroseguros" className="h-12 rounded-xl border-slate-200" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={siteForm.control}
                                                name="facebookUrl"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs font-bold text-slate-500">Facebook URL</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} value={field.value || ""} placeholder="https://facebook.com/monteiroseguros" className="h-12 rounded-xl border-slate-200" />
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
                                <CardFooter className="bg-slate-50 border-t border-slate-100 p-6 flex justify-end">
                                    <Button
                                        type="button"
                                        onClick={siteForm.handleSubmit(onSaveSettings, onFormError)}
                                        disabled={isUpdatingSettings}
                                        className="h-11 px-6 bg-primary hover:bg-primary/90 text-white rounded-xl gap-2 font-bold shadow-md shadow-primary/20 active:scale-95 transition-all"
                                    >
                                        {isUpdatingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                        Salvar Contatos & Redes
                                    </Button>
                                </CardFooter>
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
                                <CardFooter className="bg-slate-50 border-t border-slate-100 p-6 flex justify-end">
                                    <Button
                                        type="button"
                                        onClick={siteForm.handleSubmit(onSaveSettings, onFormError)}
                                        disabled={isUpdatingSettings}
                                        className="h-11 px-6 bg-primary hover:bg-primary/90 text-white rounded-xl gap-2 font-bold shadow-md shadow-primary/20 active:scale-95 transition-all"
                                    >
                                        {isUpdatingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                        Salvar Servidor de E-mail
                                    </Button>
                                </CardFooter>
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
                                        {isEditingKey ? (
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="text"
                                                    value={customKeyInput}
                                                    onChange={(e) => setCustomKeyInput(e.target.value)}
                                                    placeholder="Cole ou digite sua chave personalizada (ex: CRM_API_KEY do seu .env)"
                                                    className="h-12 font-mono text-sm rounded-xl bg-white border-primary focus-visible:ring-primary flex-1"
                                                />
                                                <Button
                                                    type="button"
                                                    onClick={handleSaveCustomKey}
                                                    disabled={loadingExternalApi}
                                                    className="h-12 px-5 font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm shrink-0"
                                                >
                                                    <Save className="h-4 w-4" />
                                                    Salvar Chave
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setIsEditingKey(false);
                                                        setCustomKeyInput(externalApiData?.apiKey || "");
                                                    }}
                                                    className="h-12 px-4 font-bold rounded-xl border-slate-200 text-slate-700 shrink-0"
                                                >
                                                    Cancelar
                                                </Button>
                                            </div>
                                        ) : (
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
                                                    onClick={() => {
                                                        setCustomKeyInput(externalApiData?.apiKey || "");
                                                        setIsEditingKey(true);
                                                    }}
                                                    className="h-12 px-4 font-bold rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700 gap-2 shrink-0"
                                                    title="Editar ou colar uma chave personalizada pré-existente"
                                                >
                                                    <Edit3 className="h-4 w-4" />
                                                    Editar Chave
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={handleRegenerateKey}
                                                    disabled={loadingExternalApi}
                                                    className="h-12 px-4 font-bold rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700 gap-2 shrink-0"
                                                    title="Gerar uma nova chave de API aleatória"
                                                >
                                                    <RefreshCw className={`h-4 w-4 ${loadingExternalApi ? "animate-spin" : ""}`} />
                                                    Gerar Nova
                                                </Button>
                                            </div>
                                        )}
                                        <p className="text-xs text-slate-500 font-medium">
                                            ⚠️ Mantenha esta chave em segredo. Ela concede permissão para seu sistema de WhatsApp consultar dados cadastrais, seguros e enviar negociações diretamente para o funil LEADS & Pipeline.
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

