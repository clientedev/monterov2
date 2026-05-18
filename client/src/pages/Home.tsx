import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Star, Loader2, MessageSquare, ShieldCheck, Zap, Heart, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { useServices, usePosts } from "@/hooks/use-content";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { ServiceCard } from "@/components/ServiceCard";
import { format } from "date-fns";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useRef } from "react";
import { ReviewsSection } from "@/components/ReviewsSection";

export default function Home() {
  const { data: services, isLoading: loadingServices } = useServices();
  const { data: posts, isLoading: loadingPosts } = usePosts();
  const { settings, slides, isLoadingSettings: loadingSettings } = useSiteSettings();
  const plugin = useRef(Autoplay({ delay: 5500, stopOnInteraction: true }));

  const activeSlides = slides?.filter(s => s.isActive) || [];

  // Brand color guidelines
  // Terracota Vital — #c65f54
  // Verde Profundo — #08454c
  // Azul Segurança — #163b52
  // Sereno — #809ba6
  // Areia Suave — #eae4da

  const heroTitle = settings?.heroTitle || "Protegendo seu Futuro,\nGarantindo seu Legado";
  const heroSubtitle = settings?.heroSubtitle || "Experimente a tranquilidade de uma cobertura premium. Combinamos atendimento boutique e proximidade com as seguradoras líderes do mundo.";
  const heroImageUrl = "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=2000";

  const showCarousel = !loadingSettings && activeSlides.length > 0;

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
        ) : showCarousel ? (
          <Carousel
            plugins={[plugin.current]}
            className="w-full h-full relative z-10"
            opts={{ loop: true }}
          >
            <CarouselContent className="h-full">
              {activeSlides.map((slide) => (
                <CarouselItem key={slide.id} className="relative min-h-[85vh] lg:min-h-[90vh] flex items-center">
                  {/* Full-bleed absolute background image */}
                  <div className="absolute inset-0 z-0">
                    <img
                      src={slide.imageBase64}
                      alt={slide.title}
                      className="w-full h-full object-cover opacity-25 mix-blend-luminosity"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#08454c] via-[#08454c]/85 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#08454c]/90 via-transparent to-transparent" />
                  </div>

                  <div className="container px-4 md:px-6 mx-auto relative z-10 py-12">
                    <div className="max-w-3xl space-y-8 text-left">
                      <motion.div
                        key={slide.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="space-y-6"
                      >
                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold text-white leading-[1.1] tracking-tight">
                          {slide.title}
                        </h1>
                        {slide.subtitle && (
                          <p className="text-base sm:text-lg md:text-xl text-slate-200 font-light max-w-xl leading-relaxed">
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
                            className="px-8 py-4 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm text-white font-bold text-lg hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-3"
                          >
                            <MessageSquare className="w-5 h-5 text-[#25D366] fill-[#25D366]" />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        ) : (
          <div className="w-full relative z-10 min-h-[85vh] lg:min-h-[90vh] flex items-center">
            {/* Full-bleed absolute background image for fallback */}
            <div className="absolute inset-0 z-0">
              <img
                src={heroImageUrl}
                alt="Corporate Meeting Room"
                className="w-full h-full object-cover opacity-25 mix-blend-luminosity"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#08454c] via-[#08454c]/85 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#08454c]/90 via-transparent to-transparent" />
            </div>

            <div className="container px-4 md:px-6 mx-auto relative z-10 py-12">
              <div className="max-w-3xl space-y-8 text-left">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="space-y-6"
                >
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white text-xs font-semibold uppercase tracking-wider">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span>Atendimento Boutique em São Paulo</span>
                  </div>
                  <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold text-white leading-[1.1] tracking-tight whitespace-pre-line">
                    {heroTitle}
                  </h1>
                  <p className="text-base sm:text-lg md:text-xl text-slate-200 font-light max-w-xl leading-relaxed">
                    {heroSubtitle}
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Link href="/contact">
                      <button className="px-8 py-4 rounded-full bg-[#c65f54] text-white font-bold text-lg hover:bg-[#c65f54]/95 transition-all hover:shadow-lg hover:shadow-[#c65f54]/25 hover:-translate-y-0.5 flex items-center justify-center gap-3 group">
                        Consultoria Exclusiva
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </Link>
                    <a 
                      href={`https://wa.me/${whatsappNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-8 py-4 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm text-white font-bold text-lg hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-3"
                    >
                      <MessageSquare className="w-5 h-5 text-[#25D366] fill-[#25D366]" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        )}
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

      {/* Why Choose Us */}
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
                <Link href="/about">
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

      {/* Blog Teaser */}
      <section className="py-28 bg-[#f5f2eb] border-t border-slate-100">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
            <div>
              <span className="text-[#c65f54] font-bold tracking-wider text-sm uppercase">Conteúdo Educativo</span>
              <h2 className="text-3xl md:text-5xl font-display font-bold mt-3 text-[#163b52]">
                {settings?.blogTitle || "Artigos & Dicas"}
              </h2>
            </div>
            <Link href="/blog">
              <button className="hidden md:flex items-center gap-2 px-6 py-3 rounded-full text-[#163b52] border border-[#809ba6]/30 hover:bg-[#eae4da]/50 transition-all duration-300 shadow-sm font-bold">
                Ver Todas as Postagens
              </button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {loadingPosts ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-96 bg-white rounded-3xl animate-pulse border border-slate-100" />
              ))
            ) : (
              posts?.slice(0, 3).map((post, index) => (
                <Link key={post.id} href={`/blog/${post.slug}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className="group cursor-pointer bg-white rounded-[2rem] overflow-hidden border border-slate-100 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-500 h-full flex flex-col justify-between"
                  >
                    <div className="overflow-hidden h-56 bg-slate-100 relative">
                      <div className="absolute inset-0 bg-slate-900/5 group-hover:bg-transparent transition-colors z-10" />
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-103"
                      />
                    </div>
                    <div className="p-7 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex gap-2 text-xs text-slate-400 mb-3 font-semibold uppercase tracking-wider">
                            <span>{post.publishedAt ? format(new Date(post.publishedAt), 'dd/MM/yyyy') : 'Novidade'}</span>
                            <span>•</span>
                            <span className="text-[#c65f54]">Monteiro Blog</span>
                          </div>
                          <h3 className="text-xl font-bold font-display text-[#163b52] mb-3 group-hover:text-[#08454c] transition-colors duration-300">
                            {post.title}
                          </h3>
                          <p className="text-slate-500 text-sm font-light leading-relaxed line-clamp-2">
                            {post.summary}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-[#c65f54] uppercase tracking-wider pt-6 mt-auto">
                          <span>Ler Artigo</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                  </motion.div>
                </Link>
              ))
            )}
          </div>

          <div className="mt-10 text-center md:hidden">
            <Link href="/blog">
              <button className="px-6 py-3.5 rounded-2xl text-[#163b52] border border-[#809ba6]/30 bg-white hover:bg-slate-50 transition-all w-full shadow-sm font-bold">
                Ver Todas as Postagens
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
