import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { useServices } from "@/hooks/use-content";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { ServiceCard } from "@/components/ServiceCard";
import { Loader2, ShieldCheck, Zap, Heart, Briefcase, ChevronRight } from "lucide-react";
import { Link } from "wouter";

export default function ServicesPage() {
    const { data: services, isLoading: loadingServices } = useServices();
    const { settings } = useSiteSettings();

    const style = {
        '--font-sans': settings?.fontSans || 'Inter',
        '--font-display': settings?.fontDisplay || 'Outfit',
        '--primary': settings?.primaryColor || '#0f172a',
    } as React.CSSProperties;

    return (
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-primary/20" style={style}>
            <Navbar />

            {/* Premium Hero Section */}
            <section className="relative pt-24 pb-24 lg:pt-32 lg:pb-32 bg-slate-900 text-white overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/90 to-transparent z-10" />
                    <img 
                      src="https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=2000" 
                      alt="Proteção" 
                      className="w-full h-full object-cover opacity-30 mix-blend-luminosity"
                    />
                </div>
                
                <div className="container px-4 mx-auto relative z-20">
                    <div className="max-w-3xl">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm font-semibold tracking-wider uppercase mb-6 text-primary-300">
                                Portfólio de Soluções
                            </span>
                            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold mb-8 leading-tight text-white">
                                {settings?.servicesTitle || "Proteção Elevada ao Máximo"}
                            </h1>
                            <p className="text-xl md:text-2xl text-slate-300 font-light leading-relaxed max-w-2xl">
                                {settings?.servicesSubtitle || "Soluções abrangentes e personalizadas para cada momento da sua vida e do seu negócio."}
                            </p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Main Services Grid */}
            <section className="py-24 relative z-30 -mt-16">
                <div className="container px-4 mx-auto">
                    {loadingServices ? (
                        <div className="flex justify-center items-center py-20 bg-white rounded-3xl shadow-xl min-h-[400px]">
                            <div className="flex flex-col items-center gap-4">
                               <Loader2 className="w-10 h-10 animate-spin text-primary" />
                               <p className="text-slate-500 font-medium">Carregando soluções...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {services?.map((service, index) => (
                                <ServiceCard key={service.id} service={service} index={index} />
                            ))}

                            {(!services || services.length === 0) && (
                                <div className="col-span-full bg-white rounded-3xl p-12 text-center text-slate-500 shadow-xl border border-slate-100">
                                    <ShieldCheck className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                                    <p className="text-xl font-medium">Nossos serviços estão sendo atualizados. Por favor, volte em breve.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* Premium Trust Badges */}
            <section className="py-24 bg-white">
                <div className="container px-4 mx-auto">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mb-4">Por que escolher a Monteiro?</h2>
                        <p className="text-slate-500 text-lg">Nosso compromisso vai muito além de uma apólice. Entregamos valor real em cada interação.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { icon: ShieldCheck, title: "Segurança Total", desc: "Sua tranquilidade é nossa prioridade absoluta em tudo que fazemos." },
                            { icon: Zap, title: "Agilidade", desc: "Processos rápidos, digitais e completamente desburocratizados." },
                            { icon: Heart, title: "Atendimento Humano", desc: "Suporte especializado focado em você, sem robôs infinitos." },
                            { icon: Briefcase, title: "Experiência Corp", desc: "Soluções corporativas desenhadas sob medida para o seu setor." }
                        ].map((badge, i) => (
                            <motion.div 
                                key={i} 
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-slate-50 rounded-3xl p-8 hover:bg-primary hover:text-white transition-colors duration-500 group text-center md:text-left flex flex-col items-center md:items-start"
                            >
                                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-primary mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
                                    <badge.icon className="w-7 h-7" />
                                </div>
                                <h3 className="font-bold text-xl mb-3 text-slate-900 group-hover:text-white transition-colors">{badge.title}</h3>
                                <p className="text-slate-500 text-sm leading-relaxed group-hover:text-white/80 transition-colors">{badge.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Bottom Premium CTA */}
            <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                <div className="container px-4 mx-auto text-center max-w-4xl relative z-10">
                    <h2 className="text-4xl md:text-5xl font-display font-bold mb-8">Não encontrou a proteção ideal?</h2>
                    <p className="text-xl text-slate-300 mb-12 font-light">
                        Nossos especialistas podem desenhar uma apólice exclusiva e perfeitamente ajustada para o seu cenário específico. Desafie-nos a encontrar a melhor solução.
                    </p>
                    <Link href="/contact">
                       <button className="px-10 py-5 bg-white text-slate-900 rounded-full font-bold text-lg hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 hover:bg-slate-50 flex items-center gap-3 mx-auto">
                           Falar com um Especialista
                           <ChevronRight className="w-5 h-5" />
                       </button>
                    </Link>
                </div>
            </section>

            <Footer />
        </div>
    );
}
