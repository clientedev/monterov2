import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Star } from "lucide-react";
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
  const { settings, slides } = useSiteSettings();
  const plugin = useRef(Autoplay({ delay: 5000, stopOnInteraction: true }));

  const activeSlides = slides?.filter(s => s.isActive) || [];

  // Use dynamic settings or fallbacks
  const heroTitle = settings?.heroTitle || "Protegendo seu Futuro, Garantindo seu Legado";
  const heroSubtitle = settings?.heroSubtitle || "Experimente a tranquilidade de uma cobertura completa. Combinamos expertise tradicional com eficiência moderna.";
  const heroImageUrl = "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2400";

  return (
    <div className="min-h-screen font-sans bg-slate-50 text-slate-900 selection:bg-primary/20">
      <Navbar />

      {/* Hero Section (Unchanged per request) */}
      <section className="relative h-screen min-h-[600px] flex items-center overflow-hidden">
        {activeSlides.length > 0 ? (
          <Carousel
            plugins={[plugin.current]}
            className="w-full h-full"
            opts={{ loop: true }}
          >
            <CarouselContent className="h-screen min-h-[600px]">
              {activeSlides.map((slide) => (
                <CarouselItem key={slide.id} className="relative">
                  <div className="absolute inset-0 z-0">
                    <img
                      src={slide.imageBase64}
                      alt={slide.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-[#08454c]/60 mix-blend-multiply" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#08454c]/90 via-[#08454c]/40 to-transparent" />
                  </div>

                  <div className="container relative z-10 px-4 md:px-6 mx-auto h-full flex flex-col justify-center">
                    <motion.div
                      key={slide.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8 }}
                      className="max-w-3xl"
                    >
                      <h1 className="text-5xl md:text-7xl font-display font-bold text-white leading-[1.1] mb-6">
                        {slide.title}
                      </h1>
                      {slide.subtitle && (
                        <p className="text-lg md:text-xl text-slate-200 mb-10 max-w-xl leading-relaxed">
                          {slide.subtitle}
                        </p>
                      )}
                      <div className="flex flex-col sm:flex-row gap-4">
                        <Link href={slide.buttonLink}>
                          <button className="px-8 py-4 rounded-full bg-primary text-white font-semibold text-lg hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-1 flex items-center justify-center gap-2">
                            {slide.buttonText}
                            <ArrowRight className="w-5 h-5" />
                          </button>
                        </Link>
                      </div>
                    </motion.div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        ) : (
          <>
            <div className="absolute inset-0 z-0">
              <img
                src={heroImageUrl}
                alt="Modern Office"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-[#08454c]/60 mix-blend-multiply" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#08454c]/90 via-[#08454c]/40 to-transparent" />
            </div>

            <div className="container relative z-10 px-4 md:px-6 mx-auto pt-20">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="max-w-3xl"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-medium mb-6">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span>#{settings?.siteName || "Corretora de Seguros"} em São Paulo</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-display font-bold text-white leading-[1.1] mb-6 whitespace-pre-line">
                  {heroTitle}
                </h1>

                <p className="text-lg md:text-xl text-slate-200 mb-10 max-w-xl leading-relaxed">
                  {heroSubtitle}
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/contact">
                    <button className="px-8 py-4 rounded-full bg-primary text-white font-semibold text-lg hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-1 flex items-center justify-center gap-2">
                      Cotação Gratuita
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </Link>
                  <Link href="/about">
                    <button className="px-8 py-4 rounded-full bg-white/10 backdrop-blur-sm text-white border border-white/20 font-semibold text-lg hover:bg-white/20 transition-all hover:-translate-y-1">
                      Saiba Mais
                    </button>
                  </Link>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 bg-white relative border-t border-slate-100">
        <div className="container px-4 md:px-6 mx-auto relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-primary font-bold tracking-wider text-sm uppercase">Nossa Expertise</span>
            <h2 className="text-3xl md:text-5xl font-display font-bold mt-3 mb-6 text-slate-900 leading-tight">
              {settings?.servicesTitle || "Soluções Completas em Proteção e Benefícios"}
            </h2>
            <p className="text-slate-500 text-lg">
              {settings?.servicesSubtitle || "Mais do que comercializar seguros, atuamos como parceiros na construção de soluções que equilibram cuidado com pessoas, controle de custos e segurança financeira."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loadingServices ? (
              // Skeleton loading
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-slate-50 h-64 rounded-3xl animate-pulse border border-slate-100" />
              ))
            ) : (
              services?.map((service, index) => (
                <ServiceCard key={service.id} service={service} index={index} />
              ))
            )}

            {/* Fallback if no services loaded yet */}
            {!loadingServices && (!services || services.length === 0) && (
              <div className="col-span-full text-center text-slate-400 py-12">
                Nossos serviços estão sendo atualizados. Por favor, volte em breve.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 bg-slate-50 relative overflow-hidden">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/3 h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="container px-4 md:px-6 mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              {/* Meeting / Handshake image */}
              <div className="relative rounded-[2.5rem] shadow-2xl z-10 overflow-hidden border border-white">
                <div className="absolute inset-0 bg-primary/5 mix-blend-overlay z-10" />
                <img
                  src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=1600"
                  alt="Reunião de Negócios"
                  className="w-full h-full object-cover scale-105 hover:scale-100 transition-transform duration-700"
                />
              </div>
              <div className="absolute -bottom-8 -right-8 bg-white border border-slate-100 p-6 rounded-2xl shadow-xl z-20 hidden md:block">
                <div className="flex items-center gap-4">
                  <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-medium">Satisfação do Cliente</p>
                    <p className="text-2xl font-bold text-slate-900">98%</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <div>
              <span className="text-primary font-bold tracking-wider text-sm uppercase">Por que nos escolher</span>
              <h2 className="text-3xl md:text-5xl font-display font-bold mt-4 mb-6 text-slate-900 leading-tight">
                Cuidar de pessoas é uma decisão estratégica
              </h2>
              <p className="text-slate-600 text-lg mb-8 leading-relaxed">
                Mais do que comercializar seguros, atuamos como parceiros na construção de soluções que equilibram cuidado com pessoas, controle de custos e segurança financeira, tanto no ambiente corporativo quanto na vida pessoal.
              </p>

              <ul className="space-y-5 mb-10">
                {[
                  "Avaliação de risco arquitetada para o seu perfil",
                  "Suporte irrestrito 24/7 para sinistros e dúvidas",
                  "Acesso privilegiado às melhores seguradoras do mercado",
                  "Atendimento consultivo e inteiramente focado em você"
                ].map((item, i) => (
                  <motion.li 
                    key={i} 
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm"
                  >
                    <div className="bg-primary/10 p-2 rounded-lg text-primary">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <span className="text-slate-700 font-medium">{item}</span>
                  </motion.li>
                ))}
              </ul>

              <Link href="/about">
                <button className="text-slate-700 bg-white border border-slate-200 px-6 py-3 rounded-xl font-bold hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-2 group shadow-sm">
                  Mais sobre nossa história
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Partners / Logos Section */}
      <section className="py-20 bg-white border-y border-slate-100">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-12">
            <span className="text-primary font-bold tracking-wider text-xs uppercase">Nossos Parceiros</span>
            <h3 className="text-2xl font-display font-bold text-slate-800 mt-2">Trabalhamos com as melhores seguradoras</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center opacity-60 grayscale hover:grayscale-0 transition-all">
            {[
              { name: "Azos", logo: "https://brandfetch.com/azos.com.br" },
              { name: "Omint", logo: "https://www.omint.com.br/wp-content/themes/omint/assets/img/logo-omint.png" },
              { name: "Porto Seguro", logo: "https://www.portoseguro.com.br/content/dam/portoseguro/logos/logo-porto.png" },
              { name: "SulAmerica", logo: "https://www.sulamerica.com.br/img/logo-sulamerica.png" },
              { name: "Bradesco Seguros", logo: "https://www.bradescoseguros.com.br/static_files/BradescoSeguros/img/logo-bradesco-seguros.png" },
              { name: "Icatu", logo: "https://www.icatuseguros.com.br/img/logo-icatu.png" },
              { name: "Petlove", logo: "https://www.petlove.com.br/static/petlove-logo.png" },
              { name: "HDI", logo: "https://www.hdi.com.br/img/logo-hdi.png" },
              { name: "Tokio Marine", logo: "https://www.tokiomarine.com.br/img/logo-tokio.png" },
              { name: "Allianz", logo: "https://www.allianz.com.br/img/logo-allianz.png" },
              { name: "Suhai", logo: "https://suhaiseguradora.com/img/logo-suhai.png" },
              { name: "Ituran", logo: "https://www.ituran.com.br/img/logo-ituran.png" }
            ].map((p, i) => (
              <div key={i} className="flex justify-center p-4">
                <span className="font-bold text-slate-400">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Teaser */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
            <div>
              <span className="text-primary font-bold tracking-wider text-sm uppercase">Últimas Notícias</span>
              <h2 className="text-3xl md:text-5xl font-display font-bold mt-3 text-slate-900">
                {settings?.blogTitle || "Blog e Novidades"}
              </h2>
            </div>
            <Link href="/blog">
              <button className="hidden md:flex items-center gap-2 px-6 py-3 rounded-full text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm font-medium">
                Ver Todas as Postagens
              </button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {loadingPosts ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-96 bg-slate-50 rounded-3xl animate-pulse border border-slate-100" />
              ))
            ) : (
              posts?.slice(0, 3).map((post, index) => (
                <Link key={post.id} href={`/blog/${post.slug}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group cursor-pointer bg-white rounded-3xl overflow-hidden border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all h-full flex flex-col"
                  >
                    <div className="overflow-hidden h-56 bg-slate-100 relative">
                      <div className="absolute inset-0 bg-slate-900/5 group-hover:bg-transparent transition-colors z-10" />
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                        <div className="flex gap-2 text-sm text-slate-500 mb-3 font-medium">
                          <span>{post.publishedAt ? format(new Date(post.publishedAt), 'dd/MM/yyyy') : 'Rascunho'}</span>
                          <span>•</span>
                          <span className="text-primary font-bold">Ler postagem</span>
                        </div>
                        <h3 className="text-xl font-bold font-display text-slate-900 mb-3 group-hover:text-primary transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-slate-600 line-clamp-2">
                          {post.summary}
                        </p>
                    </div>
                  </motion.div>
                </Link>
              ))
            )}
          </div>

          <div className="mt-10 text-center md:hidden">
            <Link href="/blog">
              <button className="px-6 py-3 rounded-full text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all w-full shadow-sm font-medium">
                Ver Todas as Postagens
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Premium CTA Section */}
      <section className="py-24 bg-slate-900 relative overflow-hidden border-t border-slate-800">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[150px] pointer-events-none" />
        <div className="container px-4 md:px-6 mx-auto relative z-10 text-center max-w-4xl">
          <h2 className="text-4xl md:text-6xl font-display font-bold text-white mb-8 leading-tight">
            Pronto para impulsionar a sua segurança?
          </h2>
          <p className="text-slate-300 text-xl max-w-2xl mx-auto mb-12 font-light">
            Nossos especialistas estão dedicados a personalizar um plano que blinde perfeitamente a sua vida e seu patrimônio.
          </p>
          <Link href="/contact">
            <button className="px-10 py-5 bg-white text-slate-900 rounded-full font-bold text-lg hover:bg-slate-50 transition-all duration-300 shadow-xl shadow-white/5 hover:shadow-white/20 hover:-translate-y-1 inline-flex items-center gap-3">
              Fale Conosco Hoje
              <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
        </div>
      </section>

      <ReviewsSection />
      <Footer />
    </div>
  );
}
