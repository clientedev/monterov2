import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { useServices } from "@/hooks/use-content";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { ServiceCard } from "@/components/ServiceCard";
import { Loader2, ShieldCheck, Zap, Heart, Briefcase, MessageSquare, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "wouter";

export default function ServicesPage() {
  const { data: services, isLoading: loadingServices } = useServices();
  const { settings } = useSiteSettings();

  // Sanitize phone for dynamic WhatsApp links
  const whatsappNumber = settings?.contactPhone 
    ? settings.contactPhone.replace(/\D/g, '') 
    : "5511999999999";

  return (
    <div className="min-h-screen bg-[#eae4da] font-sans text-[#163b52] selection:bg-[#c65f54]/20 overflow-x-hidden">
      <Navbar />

      {/* Premium Hero Section */}
      <section className="relative pt-36 pb-28 lg:pt-48 lg:pb-40 bg-gradient-to-br from-[#08454c] via-[#08454c] to-[#163b52] text-white overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#c65f54]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-15%] left-[-5%] w-[450px] h-[450px] bg-[#809ba6]/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/soft-wallpaper.png')] opacity-[0.02] mix-blend-overlay pointer-events-none" />

        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=2000" 
            alt="Proteção Executiva" 
            className="w-full h-full object-cover opacity-15 mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#08454c] via-[#08454c]/85 to-transparent z-10" />
        </div>
        
        <div className="container px-4 md:px-6 mx-auto relative z-20">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-[#c65f54]" />
                <span>Portfólio Boutique</span>
              </div>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold leading-[1.1] text-white tracking-tight">
                {settings?.servicesTitle || "Seguros Estruturados & Benefícios Especiais"}
              </h1>
              <p className="text-lg md:text-xl text-slate-200 font-light leading-relaxed max-w-2xl">
                {settings?.servicesSubtitle || "Soluções completas de consultoria em risco para empresas e famílias que valorizam excelência técnica e atendimento sem atalhos."}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Main Services Grid */}
      <section className="py-24 relative z-30 -mt-16 bg-gradient-to-b from-transparent to-[#f5f2eb]">
        <div className="container px-4 md:px-6 mx-auto">
          {loadingServices ? (
            <div className="flex justify-center items-center py-20 bg-white rounded-[2.5rem] shadow-xl min-h-[400px] border border-slate-100">
              <div className="flex flex-col items-center gap-4">
                 <Loader2 className="w-10 h-10 animate-spin text-[#08454c]" />
                 <p className="text-slate-500 font-semibold text-sm">Estruturando soluções...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services?.map((service, index) => (
                <ServiceCard key={service.id} service={service} index={index} />
              ))}

              {(!services || services.length === 0) && (
                <div className="col-span-full bg-white rounded-[2.5rem] p-16 text-center text-slate-500 shadow-xl border border-slate-100">
                  <ShieldCheck className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                  <p className="text-xl font-bold text-[#163b52]">Nossos serviços estão sendo otimizados no momento. Por favor, retorne em breve.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Premium Trust Badges */}
      <section className="py-28 bg-white relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#08454c]/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="container px-4 md:px-6 mx-auto relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <span className="text-[#c65f54] font-bold tracking-wider text-sm uppercase">Excelência Monteiro</span>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-[#163b52] mt-4 mb-6 leading-tight">
              Por que confiar na Monteiro?
            </h2>
            <p className="text-slate-500 text-lg font-light leading-relaxed">
              Trabalhamos para ser a extensão técnica de seus negócios ou do cuidado com sua família.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: ShieldCheck, title: "Segurança Técnica", desc: "Cláusulas estudadas linha por linha para garantir eficácia jurídica total." },
              { icon: Zap, title: "Agilidade Resolutiva", desc: "Agenciamento acelerado de sinistros e liberação rápida sem desgastes." },
              { icon: Heart, title: "Humanidade Real", desc: "Um consultor sênior dedicado de ponta a ponta, sem robôs de triagem." },
              { icon: Briefcase, title: "Foco no Legacy", desc: "Prevenção ativa de riscos para manter sua vida e empresas blindadas." }
            ].map((badge, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-[#f5f2eb]/40 rounded-[2rem] p-8 hover:bg-[#08454c] hover:text-white transition-all duration-500 group border border-slate-100 flex flex-col justify-between"
              >
                <div>
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-[#08454c] mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
                    <badge.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg mb-3 text-[#163b52] group-hover:text-white transition-colors">{badge.title}</h3>
                  <p className="text-slate-500 text-sm font-light leading-relaxed group-hover:text-white/80 transition-colors">{badge.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom Premium CTA */}
      <section className="py-28 bg-[#08454c] text-white relative overflow-hidden border-t border-[#809ba6]/10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[850px] bg-[#c65f54]/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/soft-wallpaper.png')] opacity-[0.03] pointer-events-none" />
        
        <div className="container px-4 md:px-6 mx-auto text-center max-w-4xl relative z-10 space-y-8">
          <span className="text-[#c65f54] font-bold tracking-wider text-sm uppercase">Cotação & Consultoria</span>
          <h2 className="text-3xl md:text-5xl font-display font-bold leading-tight">
            Não encontrou a cobertura específica para seu caso?
          </h2>
          <p className="text-slate-200 text-lg md:text-xl font-light max-w-2xl mx-auto leading-relaxed">
            Nossos consultores desenham apólices exclusivas sob demanda. Permita-nos apresentar uma solução personalizada de alto padrão.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-6">
            <Link href="/contact">
              <button className="px-10 py-5 bg-white text-[#08454c] rounded-full font-bold text-lg hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-0.5 flex items-center gap-3">
                Falar com Especialista
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
            
            <a 
              href={`https://wa.me/${whatsappNumber}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="relative group inline-flex items-center gap-3 px-10 py-5 bg-[#25D366] text-white rounded-full font-bold text-lg hover:bg-[#20ba5a] transition-all duration-300 shadow-xl hover:shadow-[#25d366]/25 hover:-translate-y-0.5"
            >
              <MessageSquare className="w-5 h-5 fill-white" />
              <span>WhatsApp Exclusivo</span>
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#c65f54] rounded-full animate-ping" />
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
