import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { useServices, usePosts, useHeroSlides } from "@/hooks/use-content";
import { ServiceCard } from "@/components/ServiceCard";
import { format } from "date-fns";
import { HeroCarousel } from "@/components/HeroCarousel";
import { TestimonialsSection } from "@/components/TestimonialsSection";

export default function Home() {
  const { data: services, isLoading: loadingServices } = useServices();
  const { data: posts, isLoading: loadingPosts } = usePosts();
  const { data: slides } = useHeroSlides();

  return (
    <div className="min-h-screen font-sans bg-slate-50">
      <Navbar />

      {/* Hero Section */}
      <HeroCarousel slides={slides} />

      {/* Services Section */}
      <section id="services" className="py-24 bg-white relative">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-primary font-semibold tracking-wider text-sm uppercase">Nossa Expertise</span>
            <h2 className="text-3xl md:text-4xl font-display font-bold mt-3 mb-4 text-slate-900">
              Soluções Completas em Seguros
            </h2>
            <p className="text-slate-500 text-lg">
              Planos de cobertura personalizados projetados para atender às suas necessidades específicas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loadingServices ? (
              // Skeleton loading
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-slate-50 h-64 rounded-2xl animate-pulse" />
              ))
            ) : (
              services?.map((service, index) => (
                <ServiceCard key={service.id} service={service} index={index} />
              ))
            )}

            {/* Fallback if no services loaded yet */}
            {!loadingServices && (!services || services.length === 0) && (
              <div className="col-span-full text-center text-slate-500 py-12">
                Nossos serviços estão sendo atualizados. Por favor, volte em breve.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 bg-slate-50">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-primary/10 rounded-full blur-3xl" />
              {/* Meeting / Handshake image */}
              <img
                src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=1600"
                alt="Reunião de Negócios"
                className="relative rounded-2xl shadow-2xl z-10"
              />
              <div className="absolute -bottom-8 -right-8 bg-white p-6 rounded-xl shadow-xl z-20 hidden md:block">
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 p-3 rounded-full text-green-600">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Satisfação do Cliente</p>
                    <p className="text-2xl font-bold text-slate-900">98%</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <div>
              <span className="text-primary font-semibold tracking-wider text-sm uppercase">Por que nos escolher</span>
              <h2 className="text-3xl md:text-4xl font-display font-bold mt-3 mb-6 text-slate-900">
                Um parceiro em quem você pode confiar seu futuro
              </h2>
              <p className="text-slate-500 text-lg mb-8 leading-relaxed">
                Não apenas vendemos apólices; construímos relacionamentos. Nossa equipe dedicada trabalha incansavelmente para garantir a melhor cobertura.
              </p>

              <ul className="space-y-4 mb-8">
                {[
                  "Avaliação de risco personalizada",
                  "Suporte 24/7 para sinistros",
                  "Acesso às melhores seguradoras",
                  "Atendimento exclusivo para cada cliente"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="bg-primary/10 p-1 rounded-full text-primary">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <span className="text-slate-700 font-medium">{item}</span>
                  </li>
                ))}
              </ul>

              <Link href="/about">
                <button className="text-primary font-semibold hover:text-primary/80 transition-colors flex items-center gap-2 group">
                  Mais sobre nossa história
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Teaser */}
      <section className="py-24 bg-white">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <span className="text-primary font-semibold tracking-wider text-sm uppercase">Últimas Notícias</span>
              <h2 className="text-3xl md:text-4xl font-display font-bold mt-3 text-slate-900">
                Blog e Novidades
              </h2>
            </div>
            <Link href="/blog">
              <button className="hidden md:flex items-center gap-2 px-6 py-3 rounded-full border border-slate-200 hover:border-primary hover:text-primary transition-all">
                Ver Todas as Postagens
              </button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {loadingPosts ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-96 bg-slate-50 rounded-2xl animate-pulse" />
              ))
            ) : (
              posts?.slice(0, 3).map((post, index) => (
                <Link key={post.id} href={`/blog/${post.slug}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group cursor-pointer"
                  >
                    <div className="overflow-hidden rounded-2xl mb-4 h-60 bg-slate-100">
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="flex text-sm text-slate-500 mb-3 gap-2">
                      <span>{post.publishedAt ? format(new Date(post.publishedAt), 'dd/MM/yyyy') : 'Rascunho'}</span>
                      <span>•</span>
                      <span>5 min de leitura</span>
                    </div>
                    <h3 className="text-xl font-bold font-display text-slate-900 mb-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-slate-500 line-clamp-2">
                      {post.summary}
                    </p>
                  </motion.div>
                </Link>
              ))
            )}
          </div>

          <div className="mt-8 text-center md:hidden">
            <Link href="/blog">
              <button className="px-6 py-3 rounded-full border border-slate-200 hover:border-primary hover:text-primary transition-all">
                Ver Todas as Postagens
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <TestimonialsSection />

      {/* CTA Section */}
      <section className="py-24 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        <div className="container px-4 md:px-6 mx-auto relative z-10 text-center">
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6">
            Pronto para garantir seu futuro?
          </h2>
          <p className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto mb-10">
            Vamos conversar sobre como podemos personalizar um plano que se adapte perfeitamente à sua vida.
          </p>
          <Link href="/contact">
            <button className="px-10 py-5 bg-white text-slate-900 rounded-full font-bold text-lg hover:bg-primary hover:text-white transition-all duration-300 shadow-xl shadow-white/10 hover:shadow-primary/50 hover:-translate-y-1">
              Fale Conosco Hoje
            </button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
