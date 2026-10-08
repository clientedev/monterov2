import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, CheckCircle2, Star, Loader2, MessageSquare, ShieldCheck,
  Zap, Heart, Sparkles, Instagram, ExternalLink, Play, FileText,
  Volume2, VolumeX, Film
} from "lucide-react";
import { Link } from "wouter";
import { useServices, usePosts } from "@/hooks/use-content";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { ServiceCard } from "@/components/ServiceCard";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { ReviewsSection } from "@/components/ReviewsSection";
import { cn } from "@/lib/utils";
import { extractInstagramInfo } from "@/components/InstagramEmbed";
import { InstagramCachedVideo } from "@/components/InstagramCachedVideo";
import { getVideoEmbedInfo } from "@/lib/videoUtils";

function WhatsAppIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export default function Home() {
  const { data: services, isLoading: loadingServices } = useServices();
  const { data: posts, isLoading: loadingPosts } = usePosts();
  const { settings, slides, isLoadingSettings: loadingSettings } = useSiteSettings();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [homePostsTab, setHomePostsTab] = useState<"all" | "instagram" | "articles">("all");
  const [isHeroMuted, setIsHeroMuted] = useState(true);

  const fallbackPosts = [
    {
      id: 1,
      title: "Como Escolher o Melhor Plano de Saúde Corporativo",
      slug: "como-escolher-o-melhor-plano-de-saude-corporativo",
      summary: "Descubra critérios fundamentais para selecionar a melhor operadora e rede credenciada para sua equipe.",
      coverImage: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&q=80&w=800",
      isFeatured: false,
      publishedAt: new Date().toISOString(),
    },
    {
      id: 2,
      title: "Engenharia de Benefícios: Reduzindo Custos com Inteligência",
      slug: "engenharia-de-beneficios-reduzindo-custos",
      summary: "Estratégias de coparticipação e gestão ativa de sinistralidade para manter custos sustentáveis.",
      coverImage: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=800",
      isFeatured: false,
      publishedAt: new Date().toISOString(),
    },
    {
      id: 3,
      title: "Seguro de Vida e Sucessão Patrimonial",
      slug: "seguro-de-vida-e-sucessao-patrimonial",
      summary: "Como o seguro de vida garante liquidez imediata e proteção patrimonial para empresas familiares.",
      coverImage: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=800",
      isFeatured: false,
      publishedAt: new Date().toISOString(),
    },
  ];

  // Filter only published posts (publishedAt <= now)
  const now = new Date();
  const sourcePosts = (posts && posts.length > 0) ? posts : fallbackPosts;
  const validPosts = sourcePosts.filter((p: any) => {
    if (!p.publishedAt) return true;
    const d = new Date(p.publishedAt);
    return !isNaN(d.getTime()) && d <= now;
  });

  // Sempre os 3 últimos posts postados/publicados (ordenação decrescente por data)
  const displayRecentPosts = [...validPosts]
    .sort((a: any, b: any) => {
      const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 3);

  const defaultSlides = [
    {
      id: 1,
      title: "Planos de Saúde Individuais & Familiares",
      subtitle: "A proteção mais completa para quem você ama. Acesso aos melhores hospitais do país com condições diferenciadas e atendimento personalizado.",
      mediaType: "image",
      imageBase64: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&q=80&w=2000",
      videoUrl: null,
      videoFit: "cover",
      buttonText: "Cotação Individual",
      buttonLink: "/contact",
      order: 0,
      isActive: true,
    },
    {
      id: 2,
      title: "Benefícios Corporativos Sob Medida",
      subtitle: "Reduza a sinistralidade e valorize sua equipe. Planos de saúde empresariais customizados para pequenas, médias e grandes empresas.",
      mediaType: "image",
      imageBase64: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=2000",
      videoUrl: null,
      videoFit: "cover",
      buttonText: "Cotação Corporativa",
      buttonLink: "/contact",
      order: 1,
      isActive: true,
    },
    {
      id: 3,
      title: "Planos de Saúde Premium & Reembolso",
      subtitle: "Reembolsos diferenciados, telemedicina de ponta e assistência nacional e internacional. O padrão de saúde que sua família e executivos merecem.",
      mediaType: "image",
      imageBase64: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=2000",
      videoUrl: null,
      videoFit: "cover",
      buttonText: "Planos Premium",
      buttonLink: "/contact",
      order: 2,
      isActive: true,
    }
  ];

  const dbActiveSlides = (slides?.filter(s => s.isActive) || []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const displaySlides = dbActiveSlides.length > 0 ? dbActiveSlides : defaultSlides;

  // Auto-play dinâmico respeitando o tempo selecionado de cada slide/vídeo
  useEffect(() => {
    if (displaySlides.length <= 1) return;
    const currentSlide = displaySlides[currentSlideIndex];
    const durationSeconds = (currentSlide as any)?.slideDuration || 7;
    const timer = setTimeout(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % displaySlides.length);
    }, Math.max(3, durationSeconds) * 1000);
    return () => clearTimeout(timer);
  }, [displaySlides, currentSlideIndex]);

  // Sanitize phone for dynamic WhatsApp links
  const whatsappNumber = settings?.contactPhone 
    ? settings.contactPhone.replace(/\D/g, '') 
    : "5511999999999";

  return (
    <div className="min-h-screen font-sans bg-[#eae4da] text-[#163b52] selection:bg-[#c65f54]/20 overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-[95vh] lg:min-h-screen flex items-center pt-24 pb-16 overflow-hidden bg-[#08454c] text-white">
        {/* Dynamic Blurry Glow Orbs */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#c65f54]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#809ba6]/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/soft-wallpaper.png')] opacity-[0.02] mix-blend-overlay pointer-events-none" />

        {loadingSettings ? (
          <div className="w-full h-full flex items-center justify-center min-h-[500px]">
            <Loader2 className="w-10 h-10 animate-spin text-white/40" />
          </div>
        ) : (
          <div className="w-full h-full relative z-10 min-h-[85vh] lg:min-h-[90vh] flex items-center">
            <AnimatePresence mode="wait">
              {displaySlides.map((slide, idx) => {
                if (idx !== currentSlideIndex) return null;
                const isVideo = Boolean(slide.mediaType === "video" || slide.videoUrl);
                const embed = isVideo ? getVideoEmbedInfo(slide.videoUrl, isHeroMuted) : { type: null };
                const isContain = slide.videoFit === "contain";

                return (
                  <motion.div
                    key={slide.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.2, ease: "easeInOut" }}
                    className="absolute inset-0 w-full h-full flex items-center"
                  >
                    {/* Background Media: Vídeo HD ou Imagem de Alto Impacto */}
                    <div className="absolute inset-0 z-0 overflow-hidden bg-[#08454c]">
                      {isVideo && slide.videoUrl ? (
                        embed.type === "youtube" || embed.type === "vimeo" ? (
                          <div className="relative w-full h-full overflow-hidden">
                            {isContain && (
                              <iframe
                                src={embed.embedUrl}
                                title="Background Ambient Blur"
                                className="hidden md:block absolute inset-0 w-full h-full border-0 blur-2xl opacity-40 scale-125 pointer-events-none"
                                allow="autoplay; encrypted-media"
                              />
                            )}
                            <div className="w-full h-full relative z-0 flex items-center justify-center">
                              <iframe
                                src={embed.embedUrl}
                                title={slide.title}
                                className={cn(
                                  "w-full h-full border-0 pointer-events-none",
                                  isContain ? "object-contain max-h-[95vh] aspect-video" : "object-cover scale-105"
                                )}
                                allow="autoplay; encrypted-media"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="relative w-full h-full overflow-hidden">
                            {/* Efeito Cinema Ambient Backdrop: Desktop-only para máxima performance mobile */}
                            {isContain && (
                              <video
                                src={slide.videoUrl}
                                autoPlay
                                loop
                                muted
                                playsInline
                                aria-hidden="true"
                                className="hidden md:block absolute inset-0 w-full h-full object-cover blur-3xl opacity-40 scale-110 pointer-events-none transform-gpu"
                              />
                            )}
                            {/* Vídeo Principal */}
                            <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                              <video
                                src={slide.videoUrl}
                                autoPlay
                                loop
                                muted
                                playsInline
                                preload="metadata"
                                poster={slide.imageBase64 || undefined}
                                className={cn(
                                  "w-full h-full relative z-0 transition-all duration-700",
                                  isContain ? "object-contain" : "object-cover opacity-85"
                                )}
                              />
                            </div>
                          </div>
                        )
                      ) : (
                        /* Imagem Estática de Alta Resolução */
                        <img
                          src={slide.imageBase64 || "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&q=80&w=2000"}
                          alt={slide.title}
                          onError={(e) => {
                            e.currentTarget.src = "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&q=80&w=2000";
                          }}
                          className="w-full h-full object-cover opacity-60"
                        />
                      )}

                      {/* Gradientes Suaves: Legibilidade de Texto Impecável sem Escurecer o Vídeo */}
                      <div className="absolute inset-0 bg-gradient-to-r from-[#08454c]/95 via-[#08454c]/70 sm:via-[#08454c]/40 to-transparent pointer-events-none z-10" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#08454c]/85 via-transparent to-transparent pointer-events-none z-10" />
                    </div>

                    <div className="container px-4 md:px-6 mx-auto relative z-10 py-12">
                      <div className="max-w-3xl space-y-8 text-left">
                        <motion.div
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.8 }}
                          className="space-y-6"
                        >
                          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold text-white leading-[1.1] tracking-tight drop-shadow-sm">
                            {slide.title}
                          </h1>
                          {slide.subtitle && (
                            <p className="text-base sm:text-lg md:text-xl text-slate-200 font-light max-w-xl leading-relaxed drop-shadow-sm">
                              {slide.subtitle}
                            </p>
                          )}
                          <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <Link href={slide.buttonLink || "/contact"}>
                              <button className="px-8 py-4 rounded-full bg-[#c65f54] text-white font-bold text-lg hover:bg-[#c65f54]/95 transition-all hover:shadow-lg hover:shadow-[#c65f54]/25 hover:-translate-y-0.5 flex items-center justify-center gap-3 group">
                                {slide.buttonText || "Consultoria Premium"}
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                              </button>
                            </Link>
                            <a 
                              href={`https://wa.me/${whatsappNumber}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-8 py-4 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm text-white font-bold text-lg hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-3 group/wa"
                            >
                              <WhatsAppIcon className="w-5 h-5 text-[#25D366] transition-transform group-hover/wa:scale-110" />
                              <span>WhatsApp</span>
                            </a>
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>


            {/* Dots indicators for slide control */}
            {displaySlides.length > 1 && (
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex gap-3">
                {displaySlides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlideIndex(idx)}
                    className={cn(
                      "w-3 h-3 rounded-full transition-all duration-300",
                      idx === currentSlideIndex 
                        ? "bg-[#c65f54] w-8" 
                        : "bg-white/30 hover:bg-white/50"
                    )}
                    aria-label={`Ir para slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Diferencial Monteiro - Logo abaixo do banner */}
      <section className="py-28 bg-[#eae4da] relative overflow-hidden">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/3 h-[700px] bg-[#c65f54]/5 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute left-[-10%] top-[10%] w-[350px] h-[350px] bg-[#08454c]/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="container px-4 md:px-6 mx-auto relative z-10">
          <div className="grid lg:grid-cols-12 gap-16 items-center">
            {/* Left Image Area */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-6 relative"
            >
              <div className="relative rounded-[3rem] shadow-2xl overflow-hidden border-8 border-white/60">
                <img
                  src="/equipe.jpg"
                  alt="Equipe Monteiro Seguros"
                  className="w-full h-full object-cover scale-102 hover:scale-100 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-[#08454c]/10 mix-blend-overlay" />
              </div>
              
              <div className="absolute -bottom-8 -right-8 bg-white border border-slate-100 p-6 rounded-3xl shadow-2xl z-20 hidden md:block">
                <div className="flex items-center gap-4">
                  <div className="bg-emerald-50 p-3.5 rounded-2xl text-emerald-600">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Satisfação do Cliente</p>
                    <p className="text-2xl font-bold text-[#163b52]">98.7%</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Copy Area */}
            <div className="lg:col-span-6 space-y-8">
              <div>
                <span className="text-[#c65f54] font-bold tracking-wider text-sm uppercase">Diferencial Monteiro</span>
                <h2 className="text-3xl md:text-5xl font-display font-bold mt-4 mb-6 text-[#163b52] leading-tight">
                  Cuidar de pessoas é uma decisão de legado
                </h2>
                <p className="text-slate-600 text-lg font-light leading-relaxed">
                  Trabalhamos no modelo boutique: proximidade total com o cliente, acompanhamento inabalável em caso de sinistro e total transparência. Esqueça centrais de atendimento eletrônico e robôs.
                </p>
              </div>

              <ul className="space-y-4">
                {[
                  { title: "Arquitetura de Riscos Personalizada", desc: "Análise técnica minuciosa para garantir cobertura exata, evitando desperdícios.", icon: ShieldCheck },
                  { title: "Agilidade Total sem Burocracias", desc: "Processo otimizado e canais de contato diretos para maior tranquilidade.", icon: Zap },
                  { title: "Consultoria Boutique Exclusiva", desc: "Um consultor dedicado que entende sua vida ou negócio de ponta a ponta.", icon: Heart }
                ].map((item, i) => (
                  <motion.li 
                    key={i} 
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-start gap-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(8,69,76,0.015)] hover:shadow-lg transition-all duration-300"
                  >
                    <div className="bg-[#08454c]/5 p-3 rounded-2xl text-[#08454c] shrink-0 mt-0.5">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-[#163b52] mb-1">{item.title}</h4>
                      <p className="text-slate-500 text-sm font-light leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.li>
                ))}
              </ul>

              <div className="pt-4">
                <Link href="/sobre">
                  <button className="text-[#163b52] bg-white border border-[#809ba6]/30 px-8 py-3.5 rounded-full font-bold hover:bg-slate-50 hover:border-[#809ba6]/50 transition-all duration-300 flex items-center gap-3 group shadow-sm">
                    Conheça Nossa Essência
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Últimas Publicações (Logo após Diferencial Monteiro) */}
      <section className="py-20 bg-[#163b52] text-white relative overflow-hidden border-b border-white/10">
        {/* Soft background glow */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#c65f54]/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-[400px] h-[400px] bg-[#08454c]/20 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="container px-4 md:px-6 mx-auto relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#c65f54]/15 border border-[#c65f54]/30 text-[#c65f54] text-xs font-bold uppercase tracking-wider mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                Últimas Publicações
              </div>
              <h2 className="text-3xl md:text-5xl font-display font-bold text-white leading-tight">
                {settings?.blogTitle || "Conteúdos Recentes para Você"}
              </h2>
              <p className="text-white/70 text-sm md:text-base mt-2 max-w-xl font-light">
                {settings?.blogSubtitle || "Acompanhe nossas publicações mais recentes no Instagram, dicas práticas de saúde e seguros, e novidades do blog."}
              </p>
            </div>
            <Link href="/blog">
              <button className="hidden md:flex items-center gap-2 px-6 py-3 rounded-full text-white bg-white/10 hover:bg-white/20 border border-white/15 transition-all duration-300 shadow-sm font-bold text-sm">
                Acessar Blog Completo
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {loadingPosts ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-96 bg-white/5 rounded-[2rem] animate-pulse border border-white/10" />
              ))
            ) : (
              displayRecentPosts.map((post, index) => {
                const isInstagram = !!post.instagramUrl || post.postType === "instagram";

                return (
                  <Link key={post.id} href={`/blog/${post.slug}`}>
                    <motion.div
                      initial={{ opacity: 0, y: 25 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                      className="group cursor-pointer bg-white text-[#163b52] rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 h-full flex flex-col justify-between border border-white/20 relative"
                    >
                      {/* Media Preview: se for Instagram, usa o vídeo do post perfeitamente enquadrado */}
                      {isInstagram ? (
                        <div className="overflow-hidden aspect-[16/10] w-full bg-slate-950 flex items-center justify-center relative">
                          <InstagramCachedVideo
                            videoUrl={post.videoUrl}
                            instagramUrl={post.instagramUrl}
                            fallbackImage={post.coverImage}
                            title={post.title}
                            aspectRatio="video"
                            className="w-full h-full"
                          />
                        </div>
                      ) : (
                        <div className="overflow-hidden aspect-[16/10] w-full bg-slate-900 flex items-center justify-center relative p-1">
                          <img
                            src={post.coverImage || "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&q=80&w=800"}
                            alt={post.title}
                            onError={(e) => {
                              e.currentTarget.src = "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&q=80&w=800";
                            }}
                            className="w-full h-full object-contain"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-30 transition-opacity pointer-events-none" />
                        </div>
                      )}

                      <div className="p-7 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mb-3 font-semibold uppercase tracking-wider">
                            <span>{post.publishedAt ? format(new Date(post.publishedAt), 'dd/MM/yyyy') : 'Novidade'}</span>
                            <span>•</span>
                            <span className="text-[#c65f54]">
                              {isInstagram ? "@monteirosegurosebeneficios" : "Monteiro Blog"}
                            </span>
                          </div>
                          <h3 className="text-xl font-bold font-display text-[#163b52] mb-3 group-hover:text-[#08454c] transition-colors duration-300 line-clamp-2">
                            {post.title && post.title.trim()
                              ? (post.title.startsWith("Publicação do Instagram - Reel #")
                                  ? `Reel Oficial • ${post.title.replace("Publicação do Instagram - Reel #", "Vídeo #")}`
                                  : post.title)
                              : "Publicação Monteiro Seguros"}
                          </h3>
                          <p className="text-slate-600 text-sm font-light leading-relaxed line-clamp-3">
                            {post.summary && post.summary.trim() 
                              ? post.summary 
                              : (post.content && post.content.trim() 
                                  ? post.content.replace(/<[^>]*>?/gm, '').slice(0, 140) + "..."
                                  : "Confira as melhores orientações sobre planos de saúde e seguros com nossa equipe especializada.")}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-bold text-[#c65f54] uppercase tracking-wider pt-6 mt-auto">
                          <span>{isInstagram ? "Ver Detalhes do Post" : "Ler Artigo Completo"}</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform" />
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                );
              })
            )}
          </div>

          <div className="mt-8 text-center md:hidden">
            <Link href="/blog">
              <button className="px-6 py-3.5 rounded-2xl text-white bg-white/10 border border-white/20 transition-all w-full font-bold">
                Ver Todas as Postagens
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-28 bg-[#f5f2eb] relative border-t border-slate-100">
        <div className="container px-4 md:px-6 mx-auto relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <span className="text-[#c65f54] font-bold tracking-wider text-sm uppercase">Nossas Soluções</span>
            <h2 className="text-3xl md:text-5xl font-display font-bold mt-4 mb-6 text-[#163b52] leading-tight">
              {settings?.servicesTitle || "Seguros Estruturados & Benefícios Inteligentes"}
            </h2>
            <p className="text-slate-500 text-lg font-light leading-relaxed">
              {settings?.servicesSubtitle || "Modelos boutique de apólices elaboradas para resguardar sua vida corporativa, saúde familiar e legado patrimonial de forma sustentável."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loadingServices ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white h-72 rounded-[2.5rem] animate-pulse border border-slate-100" />
              ))
            ) : (
              services?.map((service, index) => (
                <ServiceCard key={service.id} service={service} index={index} />
              ))
            )}

            {!loadingServices && (!services || services.length === 0) && (
              <div className="col-span-full text-center text-slate-400 py-16 bg-white rounded-[2.5rem] border border-slate-100">
                Nossos serviços estão sendo atualizados no momento. Retorne em breve.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Seção A: Qualidade de Vida e Prevenção Ativa */}
      <section className="py-28 bg-white relative overflow-hidden">
        {/* Soft decorative glow */}
        <div className="absolute left-0 top-0 w-[400px] h-[400px] bg-[#809ba6]/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="container px-4 md:px-6 mx-auto relative z-10">
          <div className="grid lg:grid-cols-12 gap-16 items-center">
            {/* Left Column: Copywriting */}
            <div className="lg:col-span-6 space-y-8">
              <div>
                <span className="text-[#c65f54] font-bold tracking-wider text-sm uppercase">Bem-Estar & Prevenção</span>
                <h2 className="text-3xl md:text-5xl font-display font-bold mt-4 mb-6 text-[#163b52] leading-tight">
                  Sua saúde e vitalidade integradas em um só lugar
                </h2>
                <p className="text-slate-600 text-lg font-light leading-relaxed">
                  Acreditamos que um plano de saúde moderno não deve apenas tratar a doença, mas sim ser a base estrutural para a sua qualidade de vida diária. Promovemos acesso a redes assistenciais preventivas, telemedicina especializada e concierges dedicados para a sua máxima tranquilidade.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="bg-[#f5f2eb]/50 p-6 rounded-3xl border border-slate-100/50">
                  <div className="w-10 h-10 rounded-2xl bg-[#c65f54]/10 flex items-center justify-center text-[#c65f54] mb-4">
                    <Heart className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-[#163b52] text-lg mb-2">Medicina Preventiva</h4>
                  <p className="text-slate-500 text-sm font-light leading-relaxed">Foco em check-ups proativos e monitoramento contínuo da sua saúde geral.</p>
                </div>

                <div className="bg-[#f5f2eb]/50 p-6 rounded-3xl border border-slate-100/50">
                  <div className="w-10 h-10 rounded-2xl bg-[#08454c]/10 flex items-center justify-center text-[#08454c] mb-4">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-[#163b52] text-lg mb-2">Qualidade de Vida</h4>
                  <p className="text-slate-500 text-sm font-light leading-relaxed">Incentivo a rotinas equilibradas, saúde mental qualificada e longevidade.</p>
                </div>
              </div>

              <div className="pt-2">
                <Link href="/contact">
                  <button className="px-8 py-4 rounded-full bg-[#08454c] text-white font-bold hover:bg-[#08454c]/95 transition-all hover:shadow-lg hover:shadow-[#08454c]/20 flex items-center gap-3 group">
                    Planejar Minha Saúde
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
              </div>
            </div>

            {/* Right Column: High Quality Image */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-6 relative"
            >
              <div className="relative rounded-[3rem] overflow-hidden shadow-2xl aspect-[4/3] md:aspect-[16/10] border-8 border-slate-50">
                <img
                  src="https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&q=80&w=1200"
                  alt="Estilo de vida ativo e saudável ao ar livre"
                  className="w-full h-full object-cover scale-102 hover:scale-100 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#163b52]/30 via-transparent to-transparent pointer-events-none" />
              </div>
              {/* Trust Badge */}
              <div className="absolute -bottom-6 -left-6 bg-white border border-slate-100 p-5 rounded-3xl shadow-xl z-20 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Acreditação Técnica</p>
                  <p className="text-base font-bold text-[#163b52]">ANS Nível A</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Seção B: Nossos Pilares de Cuidado */}
      <section className="py-28 bg-[#f5f2eb]/70 relative overflow-hidden border-t border-slate-100/50">
        <div className="absolute right-[-10%] bottom-0 w-[500px] h-[500px] bg-[#c65f54]/3 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="container px-4 md:px-6 mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="text-[#c65f54] font-bold tracking-wider text-sm uppercase">Pilares de Cuidado</span>
            <h2 className="text-3xl md:text-5xl font-display font-bold mt-4 mb-6 text-[#163b52] leading-tight">
              Soluções integradas para cada momento da sua vida
            </h2>
            <p className="text-slate-500 text-lg font-light leading-relaxed">
              Trabalhamos em estreita parceria com as principais operadoras de saúde do país para oferecer coberturas sob medida que unem excelência clínica, reembolso ágil e conforto executivo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Proteção Familiar Completa",
                desc: "Garanta atendimento hospitalar premium e pronto-socorro nos centros de referência médica nacionais para as pessoas mais importantes da sua vida.",
                img: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&q=80&w=800",
                badge: "Familiar"
              },
              {
                title: "Benefícios Corporativos & PME",
                desc: "Planos empresariais estratégicos com coparticipação inteligente, reduzindo a sinistralidade e agregando valor para atrair e reter talentos chave.",
                img: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800",
                badge: "Corporativo"
              },
              {
                title: "Planos de Saúde Premium",
                desc: "Acesso direto a hospitais renomados (Albert Einstein, Sírio-Libanês), reembolso diferenciado de consultas particulares e serviços de concierge.",
                img: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&q=80&w=800",
                badge: "Premium"
              }
            ].map((pillar, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="group bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col justify-between"
              >
                <div className="relative h-64 overflow-hidden bg-slate-100">
                  <img
                    src={pillar.img}
                    alt={pillar.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute top-6 left-6 px-4 py-1.5 rounded-full bg-white/95 backdrop-blur-sm text-[#08454c] text-xs font-bold uppercase tracking-wider shadow-sm">
                    {pillar.badge}
                  </div>
                </div>
                <div className="p-8 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold font-display text-[#163b52] group-hover:text-[#08454c] transition-colors">
                      {pillar.title}
                    </h3>
                    <p className="text-slate-500 text-sm font-light leading-relaxed">
                      {pillar.desc}
                    </p>
                  </div>
                  <div className="pt-6 mt-6 border-t border-slate-50">
                    <Link href="/contact">
                      <a className="inline-flex items-center gap-2 text-sm font-bold text-[#c65f54] hover:text-[#c65f54]/85 transition-colors uppercase tracking-wider">
                        Solicitar Cotação
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </a>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners / Logos Section */}
      <section className="py-20 bg-white border-y border-slate-100 overflow-hidden">
        <div className="container px-4 mx-auto mb-10 text-center">
          <span className="text-[#c65f54] font-bold tracking-wider text-xs uppercase">Conexões Globais</span>
          <h3 className="text-2xl md:text-3xl font-display font-bold text-[#163b52] mt-2">
            Seguradoras e Beneficiadoras Parceiras
          </h3>
        </div>

        <div className="relative flex overflow-x-hidden">
          <motion.div
            animate={{
              x: ["0%", "-50%"],
            }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: 40,
                ease: "linear",
              },
            }}
            className="flex w-max whitespace-nowrap items-center py-4"
          >
            {[
              { name: "Azos", logo: "/partners/azos.jpg", link: "https://www.azos.com.br" },
              { name: "Omint", logo: "/partners/omint.jpg", link: "https://www.omint.com.br" },
              { name: "Porto Seguro", logo: "/partners/porto.jpg", link: "https://www.portoseguro.com.br" },
              { name: "SulAmérica", logo: "/partners/sulamerica.jpg", link: "https://www.sulamerica.com.br" },
              { name: "Bradesco Seguros", logo: "/partners/bradescoseguros.jpg", link: "https://www.bradescoseguros.com.br" },
              { name: "Icatu", logo: "/partners/icatu.jpg", link: "https://www.icatuseguros.com.br" },
              { name: "Petlove", logo: "/partners/pet.jpg", link: "https://www.petlove.com.br" },
              { name: "HDI", logo: "/partners/hdi.png", link: "https://www.hdi.com.br" },
              { name: "Tokio Marine", logo: "/partners/tokio.jpg", link: "https://www.tokiomarine.com.br" },
              { name: "Allianz", logo: "/partners/alianz.png", link: "https://www.allianz.com.br" },
              { name: "Suhai", logo: "/partners/suhai.jpg", link: "https://suhaiseguradora.com" },
              { name: "Ituran", logo: "/partners/ituran.jpg", link: "https://www.ituran.com.br" },
              // Duplicate for seamless loop
              { name: "Azos", logo: "/partners/azos.jpg", link: "https://www.azos.com.br" },
              { name: "Omint", logo: "/partners/omint.jpg", link: "https://www.omint.com.br" },
              { name: "Porto Seguro", logo: "/partners/porto.jpg", link: "https://www.portoseguro.com.br" },
              { name: "SulAmérica", logo: "/partners/sulamerica.jpg", link: "https://www.sulamerica.com.br" },
              { name: "Bradesco Seguros", logo: "/partners/bradescoseguros.jpg", link: "https://www.bradescoseguros.com.br" },
              { name: "Icatu", logo: "/partners/icatu.jpg", link: "https://www.icatuseguros.com.br" },
              { name: "Petlove", logo: "/partners/pet.jpg", link: "https://www.petlove.com.br" },
              { name: "HDI", logo: "/partners/hdi.png", link: "https://www.hdi.com.br" },
              { name: "Tokio Marine", logo: "/partners/tokio.jpg", link: "https://www.tokiomarine.com.br" },
              { name: "Allianz", logo: "/partners/alianz.png", link: "https://www.allianz.com.br" },
              { name: "Suhai", logo: "/partners/suhai.jpg", link: "https://suhaiseguradora.com" },
              { name: "Ituran", logo: "/partners/ituran.jpg", link: "https://www.ituran.com.br" },
            ].map((p, i) => (
              <a
                key={i}
                href={p.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mx-12 flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100 mix-blend-multiply"
              >
                <img
                  src={p.logo}
                  alt={p.name}
                  className="h-12 md:h-16 w-auto object-contain max-w-[130px]"
                />
              </a>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Nossos Posts Section (Instagram & Blog) */}
      <section id="posts" className="py-28 bg-[#f5f2eb] border-t border-slate-100 relative overflow-hidden">
        <div className="container px-4 md:px-6 mx-auto relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-amber-500/10 border border-pink-300/40 text-pink-700 text-xs font-bold uppercase tracking-wider mb-3">
                <Instagram className="w-3.5 h-3.5 text-pink-600" />
                <span>Nossos Posts &amp; Redes Sociais</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-display font-bold text-[#163b52] leading-tight">
                {settings?.blogTitle || "Nossos Posts"}
              </h2>
              <p className="text-slate-500 text-sm md:text-base mt-2 max-w-xl font-light">
                {settings?.blogSubtitle || "Acompanhe nossas publicações mais recentes no Instagram, dicas práticas de saúde e seguros, e novidades do blog."}
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <a
                href="https://www.instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-white font-bold text-sm shadow-md hover:opacity-95 transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)" }}
              >
                <Instagram className="w-4 h-4" />
                <span>Seguir no Instagram</span>
              </a>

              <Link href="/blog?tab=posts">
                <button className="hidden sm:inline-flex items-center gap-2 px-5 py-3 rounded-full text-[#163b52] bg-white border border-[#809ba6]/30 hover:bg-slate-50 transition-all font-bold text-sm shadow-sm">
                  <span>Ver Todos no Blog</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </div>

          {/* Interactive Category Filter */}
          <div className="flex items-center gap-2 mb-10 p-1.5 bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/80 w-fit">
            <button
              onClick={() => setHomePostsTab("all")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all",
                homePostsTab === "all"
                  ? "bg-[#08454c] text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              )}
            >
              Todos ({validPosts.length})
            </button>
            <button
              onClick={() => setHomePostsTab("instagram")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-1.5",
                homePostsTab === "instagram"
                  ? "bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] text-white shadow-md"
                  : "text-slate-600 hover:text-pink-600 hover:bg-pink-50/50"
              )}
            >
              <Instagram className="w-3.5 h-3.5" />
              <span>Posts do Instagram</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10">
                {validPosts.filter(p => !!p.instagramUrl || p.postType === "instagram").length}
              </span>
            </button>
            <button
              onClick={() => setHomePostsTab("articles")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-1.5",
                homePostsTab === "articles"
                  ? "bg-[#163b52] text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              )}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Artigos</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10">
                {validPosts.filter(p => !p.instagramUrl && p.postType !== "instagram").length}
              </span>
            </button>
          </div>

          {/* Posts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {loadingPosts ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-96 bg-white rounded-2xl animate-pulse border border-slate-100 shadow-sm" />
              ))
            ) : (() => {
              const filtered = validPosts.filter((p) => {
                const isInsta = !!p.instagramUrl || p.postType === "instagram";
                if (homePostsTab === "instagram") return isInsta;
                if (homePostsTab === "articles") return !isInsta;
                return true;
              });

              if (filtered.length === 0) {
                return (
                  <div className="col-span-full bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-pink-50 border border-pink-100 flex items-center justify-center mx-auto text-pink-600">
                      <Instagram className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Nenhum post nesta categoria</h3>
                    <p className="text-sm text-slate-400 max-w-md mx-auto">
                      Cadastre novos posts ou integre publicações do Instagram através do painel de administração.
                    </p>
                  </div>
                );
              }

              return filtered.slice(0, 6).map((post, index) => {
                const isInstagram = !!post.instagramUrl || post.postType === "instagram";

                return (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className="group bg-white rounded-3xl overflow-hidden border border-slate-200/80 hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-500 h-full flex flex-col justify-between shadow-sm relative"
                  >
                    {/* Badge de Categoria */}
                    <div className="absolute top-3.5 left-3.5 z-20">
                      {isInstagram ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold text-white shadow-md bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888]">
                          <Instagram className="w-3.5 h-3.5" />
                          Instagram
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold text-slate-700 bg-white/95 backdrop-blur-sm shadow-sm border border-slate-200">
                          <FileText className="w-3 h-3 text-[#08454c]" />
                          Artigo
                        </span>
                      )}
                    </div>

                    {/* Media Preview: trecho do vídeo do Instagram rodando em cache sem gastar egress */}
                    {isInstagram ? (
                      <InstagramCachedVideo
                        videoUrl={post.videoUrl}
                        instagramUrl={post.instagramUrl}
                        fallbackImage={post.coverImage}
                        title={post.title}
                        aspectRatio="video"
                      />
                    ) : (
                      <div className="overflow-hidden aspect-[16/10] w-full bg-slate-900 flex items-center justify-center relative group">
                        <img
                          src={post.coverImage || "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&q=80&w=800"}
                          alt={post.title}
                          onError={(e) => {
                            e.currentTarget.src = "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&q=80&w=800";
                          }}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity pointer-events-none" />
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mb-2 font-semibold">
                          <span>{post.publishedAt ? format(new Date(post.publishedAt), 'dd/MM/yyyy') : 'Novidade'}</span>
                          <span>•</span>
                          <span className="text-[#c65f54] font-medium">
                            {isInstagram ? "@monteirosegurosebeneficios" : "Blog Monteiro"}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold font-display text-[#163b52] mb-2 group-hover:text-[#08454c] transition-colors line-clamp-2">
                          {post.title && post.title.trim()
                            ? (post.title.startsWith("Publicação do Instagram - Reel #")
                                ? `Reel Oficial • ${post.title.replace("Publicação do Instagram - Reel #", "Vídeo #")}`
                                : post.title)
                            : "Publicação Monteiro Seguros"}
                        </h3>
                        <p className="text-slate-500 text-sm font-light leading-relaxed line-clamp-3">
                          {post.summary && post.summary.trim()
                            ? post.summary
                            : (post.content && post.content.trim()
                                ? post.content.replace(/<[^>]*>?/gm, '').slice(0, 140) + "..."
                                : "Confira as melhores orientações sobre planos de saúde e seguros com nossa equipe especializada.")}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
                        {isInstagram && post.instagramUrl ? (
                          <>
                            <a
                              href={post.instagramUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-pink-600 hover:text-pink-700 transition-colors"
                            >
                              <Instagram className="w-3.5 h-3.5" />
                              <span>Abrir no Insta</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                            <Link href={`/blog/${post.slug}`}>
                              <span className="text-xs font-semibold text-slate-500 hover:text-[#08454c] cursor-pointer">
                                Detalhes
                              </span>
                            </Link>
                          </>
                        ) : (
                          <Link href={`/blog/${post.slug}`}>
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#c65f54] hover:text-[#a0443a] transition-colors uppercase tracking-wider cursor-pointer">
                              <span>Ler Artigo Completo</span>
                              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                            </span>
                          </Link>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              });
            })()}
          </div>

          <div className="mt-12 text-center">
            <Link href="/blog?tab=posts">
              <button className="px-8 py-4 rounded-full text-white bg-[#08454c] hover:bg-[#06373d] transition-all font-bold text-sm shadow-md hover:shadow-lg">
                Ver Todos os Posts &amp; Artigos
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Premium CTA Section */}
      <section className="py-28 bg-[#08454c] relative overflow-hidden border-t border-[#809ba6]/10 text-white">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-[#c65f54]/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/soft-wallpaper.png')] opacity-[0.03] mix-blend-overlay pointer-events-none" />
        
        <div className="container px-4 md:px-6 mx-auto relative z-10 text-center max-w-4xl">
          <span className="text-[#c65f54] font-bold tracking-wider text-sm uppercase mb-4 block">Proteção Imediata</span>
          <h2 className="text-4xl md:text-6xl font-display font-bold text-white mb-8 leading-tight tracking-tight">
            Pronto para blindar seu legado?
          </h2>
          <p className="text-slate-200 text-lg md:text-xl max-w-2xl mx-auto mb-14 font-light leading-relaxed">
            Fale diretamente com nossa fundadora ou nossa equipe de especialistas premium. Garantimos consultoria humana e sem enrolações.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link href="/contact">
              <button className="px-10 py-5 bg-white text-[#08454c] rounded-full font-bold text-lg hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-0.5 inline-flex items-center gap-3">
                Falar com Especialista
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
            
            {/* Highlighted WhatsApp CTA Button */}
            <a 
              href={`https://wa.me/${whatsappNumber}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="relative group inline-flex items-center gap-3 px-10 py-5 bg-[#25D366] text-white rounded-full font-bold text-lg hover:bg-[#20ba5a] transition-all duration-300 shadow-xl hover:shadow-[#25d366]/25 hover:-translate-y-0.5"
            >
              <MessageSquare className="w-5 h-5 fill-white" />
              <span>Fale Conosco pelo WhatsApp</span>
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#c65f54] rounded-full animate-ping" />
            </a>
          </div>
        </div>
      </section>

      <ReviewsSection />
      <Footer />
    </div>
  );
}
