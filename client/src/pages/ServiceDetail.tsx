import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { useServices } from "@/hooks/use-content";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { useRoute, Link } from "wouter";
import { EmbeddedChat } from "@/components/EmbeddedChat";
import { Loader2, ArrowLeft, Shield, Car, Heart, Briefcase, Home, Activity, CheckCircle2 } from "lucide-react";

const iconMap: Record<string, any> = {
  Shield, Car, Heart, Briefcase, Home, Activity
};

export default function ServiceDetail() {
    const [, params] = useRoute("/services/:id");
    const serviceId = params?.id ? parseInt(params.id) : 0;
    const { data: services, isLoading } = useServices();
    const { settings } = useSiteSettings();

    const service = services?.find(s => s.id === serviceId);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!service) {
        return (
            <div className="min-h-screen bg-slate-50 font-sans flex flex-col items-center justify-center p-4">
                <Navbar />
                <div className="text-center bg-white p-12 rounded-3xl shadow-xl max-w-lg mt-32">
                    <Shield className="w-16 h-16 text-slate-300 mx-auto mb-6" />
                    <h1 className="text-3xl font-display font-bold text-slate-900 mb-4">Serviço não encontrado</h1>
                    <p className="text-slate-500 mb-8">Desculpe, não conseguimos encontrar os detalhes deste serviço.</p>
                    <Link href="/services">
                        <button className="px-8 py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors">
                            Ver Todos os Serviços
                        </button>
                    </Link>
                </div>
                <div className="mt-auto w-full"><Footer /></div>
            </div>
        );
    }

    const Icon = iconMap[service.icon] || Shield;

    // Creating some mocked benefits based on the generic service info for visual richness
    const benefits = [
        "Cobertura adaptada ao seu perfil",
        "Assistência especializada 24 horas",
        "Processo simplificado e digital",
        "Especialistas dedicados ao seu atendimento"
    ];

    return (
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-primary/20">
            <Navbar />

            {/* Premium Header */}
            <section className="pt-24 pb-20 bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-primary/20 mix-blend-overlay z-10" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent z-10" />
                </div>
                
                <div className="container px-4 mx-auto relative z-20">
                    <Link href="/services">
                        <button className="flex items-center gap-2 text-primary-200 hover:text-white transition-colors mb-10 text-sm font-bold uppercase tracking-wider group">
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Voltar para Soluções
                        </button>
                    </Link>

                    <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center text-white shrink-0 shadow-2xl"
                        >
                            <Icon className="w-12 h-12" />
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-tight mb-4 text-white">
                                {service.title}
                            </h1>
                            <p className="text-xl text-slate-300 font-light max-w-2xl">
                                Proteção especializada desenvolvida para trazer a tranquilidade que você merece.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Content & Chat Area */}
            <section className="py-20 relative z-30 -mt-8">
                <div className="container px-4 mx-auto max-w-6xl">
                    <div className="grid lg:grid-cols-2 gap-12 items-start">
                        
                        {/* Left Column: Details */}
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="space-y-12"
                        >
                            <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-slate-100">
                                <h2 className="text-3xl font-display font-bold text-slate-900 mb-6">Sobre a Solução</h2>
                                <p className="text-slate-600 text-lg leading-relaxed mb-10 whitespace-pre-wrap">
                                    {service.description}
                                </p>
                                
                                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                       <CheckCircle2 className="w-5 h-5" />
                                    </span>
                                    Vantagens Exclusivas
                                </h3>
                                <ul className="space-y-4">
                                    {benefits.map((benefit, idx) => (
                                        <li key={idx} className="flex items-start gap-4">
                                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                                               <div className="w-2 h-2 rounded-full bg-primary" />
                                            </div>
                                            <span className="text-slate-600 font-medium">{benefit}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white overflow-hidden relative">
                                <Icon className="absolute -right-8 -bottom-8 w-48 h-48 text-white/5" />
                                <h2 className="text-2xl font-display font-bold mb-4 relative z-10">Agende uma Consultoria</h2>
                                <p className="text-slate-300 mb-8 max-w-md relative z-10">
                                    Converse com um de nossos corretores especialistas para uma cotação exata sobre {service.title.toLowerCase()}.
                                </p>
                                <Link href="/contact">
                                    <button className="px-8 py-4 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-50 transition-colors relative z-10 w-full md:w-auto text-center">
                                        Solicitar Orçamento
                                    </button>
                                </Link>
                            </div>
                        </motion.div>

                        {/* Right Column: AI Chat */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="lg:sticky lg:top-32"
                        >
                            <div className="mb-6">
                                <h2 className="text-2xl font-display font-bold text-slate-900 mb-2">Tire suas dúvidas agora</h2>
                                <p className="text-slate-500 text-sm">Nossa IA Especialista foi treinada com tudo sobre {service.title.toLowerCase()} para te ajudar imediatamente.</p>
                            </div>
                            
                            {/* The customized embedded chat */}
                            <div className="shadow-2xl rounded-3xl overflow-hidden border border-slate-200 bg-white">
                               <EmbeddedChat initialMessage={`Olá! Sou a Assistente Especialista da Monteiro. Vi que você está interessado em ${service.title}. O que você gostaria de saber sobre esta proteção?`} />
                            </div>
                        </motion.div>

                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
