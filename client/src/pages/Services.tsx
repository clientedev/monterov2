import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { useServices } from "@/hooks/use-content";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { ServiceCard } from "@/components/ServiceCard";
import { Loader2, ShieldCheck, Zap, Heart, Briefcase } from "lucide-react";

export default function ServicesPage() {
    const { data: services, isLoading: loadingServices } = useServices();
    const { settings } = useSiteSettings();

    const style = {
        '--font-sans': settings?.fontSans || 'Inter',
        '--font-display': settings?.fontDisplay || 'Outfit',
        '--primary': settings?.primaryColor || '#0f172a',
    } as React.CSSProperties;

    return (
        <div className="min-h-screen bg-slate-50" style={style}>
            <Navbar />

            {/* Header */}
            <section className="pt-32 pb-20 bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/10 mix-blend-overlay"></div>
                <div className="container px-4 mx-auto relative z-10 text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-6xl font-display font-bold mb-6"
                    >
                        {settings?.servicesTitle || "Nossos Serviços"}
                    </motion.h1>
                    <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                        {settings?.servicesSubtitle || "Soluções abrangentes para todas as suas necessidades de proteção."}
                    </p>
                </div>
            </section>

            {/* Main Content */}
            <section className="py-24">
                <div className="container px-4 mx-auto">
                    {loadingServices ? (
                        <div className="flex justify-center items-center py-20">
                            <Loader2 className="w-10 h-10 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {services?.map((service, index) => (
                                <ServiceCard key={service.id} service={service} index={index} />
                            ))}

                            {(!services || services.length === 0) && (
                                <div className="col-span-full text-center text-slate-500 py-12">
                                    <p className="text-lg italic">Nossos serviços estão sendo atualizados. Por favor, volte em breve.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* Trust Badges */}
            <section className="py-20 bg-white border-y border-slate-100">
                <div className="container px-4 mx-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
                        {[
                            { icon: ShieldCheck, title: "Segurança Total", desc: "Sua tranquilidade é nossa prioridade número um." },
                            { icon: Zap, title: "Agilidade", desc: "Processos rápidos e desburocratizados." },
                            { icon: Heart, title: "Atendimento Humano", desc: "Suporte especializado focado em você." },
                            { icon: Briefcase, title: "Experiência Corp", desc: "Soluções sob medida para o seu negócio." }
                        ].map((badge, i) => (
                            <div key={i} className="text-center space-y-4">
                                <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center text-primary mx-auto">
                                    <badge.icon className="w-8 h-8" />
                                </div>
                                <h3 className="font-bold text-lg text-slate-900">{badge.title}</h3>
                                <p className="text-slate-500 text-sm leading-relaxed">{badge.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Bottom CTA */}
            <section className="py-24 bg-slate-50">
                <div className="container px-4 mx-auto text-center max-w-3xl">
                    <h2 className="text-3xl font-display font-bold text-slate-900 mb-6">Não encontrou o que procurava?</h2>
                    <p className="text-slate-500 text-lg mb-10">
                        Nós podemos criar um plano de seguro personalizado para qualquer necessidade específica que você tenha.
                    </p>
                    <button className="px-10 py-5 bg-primary text-white rounded-full font-bold text-lg hover:shadow-2xl hover:shadow-primary/30 transition-all hover:-translate-y-1">
                        Solicitar Orçamento Especial
                    </button>
                </div>
            </section>

            <Footer />
        </div>
    );
}
