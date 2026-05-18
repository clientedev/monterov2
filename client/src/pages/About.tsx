import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { Award, Zap, Heart, ShieldCheck, Sparkles, MessageSquare, ArrowRight } from "lucide-react";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { Link } from "wouter";

export default function About() {
  const { settings } = useSiteSettings();
  const heroImageUrl = "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2400";

  // Sanitize phone for dynamic WhatsApp links
  const whatsappNumber = settings?.contactPhone 
    ? settings.contactPhone.replace(/\D/g, '') 
    : "5511999999999";

  return (
    <div className="min-h-screen bg-[#eae4da] font-sans text-[#163b52] selection:bg-[#c65f54]/20 overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      <div className="relative pt-36 pb-28 md:pt-48 md:pb-40 overflow-hidden bg-gradient-to-br from-[#08454c] via-[#08454c] to-[#163b52] text-white">
        {/* Dynamic Background Accents */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#c65f54]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-15%] left-[-5%] w-[450px] h-[450px] bg-[#809ba6]/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/soft-wallpaper.png')] opacity-[0.02] mix-blend-overlay pointer-events-none" />

        <div className="absolute inset-0">
          <img 
            src={settings?.aboutImageBase64 || heroImageUrl} 
            alt="Monteiro Corporate" 
            className="w-full h-full object-cover opacity-15 mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#08454c] via-[#08454c]/85 to-transparent" />
        </div>
        
        <div className="container px-4 md:px-6 mx-auto relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-[#c65f54]" />
              <span>Nossa Trajetória</span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold leading-[1.1] text-white tracking-tight">
              {settings?.aboutTitle || "Sobre a Monteiro"}
            </h1>
            <p className="text-lg md:text-xl text-slate-200 max-w-2xl font-light leading-relaxed">
              Aliamos a credibilidade do atendimento boutique corporativo à proximidade humana necessária para resguardar o que mais importa.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content Area - Overlapping */}
      <div className="container px-4 md:px-6 mx-auto relative z-20 -mt-16 mb-28">
        <div className="bg-white rounded-[2.5rem] md:rounded-[3rem] shadow-[0_24px_60px_rgba(8,69,76,0.04)] p-8 md:p-16 lg:p-24 border border-slate-100/50">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Story Column */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <span className="text-[#c65f54] font-bold tracking-wider text-xs uppercase">Boutique de Proteção</span>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-[#163b52] leading-tight">
                Construindo relações sólidas de <span className="text-[#08454c]">confiança corporativa</span> e cuidado humano
              </h2>
              <div className="space-y-6 text-slate-600 text-base md:text-lg font-light leading-relaxed">
                <p>
                  A Monteiro Seguros e Benefícios é especializada em oferecer consultoria técnica de ponta em proteção patrimonial e engenharia de benefícios para empresas, além de apólices personalizadas de seguros de vida e saúde familiar.
                </p>
                <p className="p-8 bg-[#f5f2eb] border-l-4 border-[#c65f54] rounded-r-3xl italic text-[#163b52] font-semibold leading-relaxed">
                  "Nosso compromisso é desburocratizar a contratação de apólices e dar suporte técnico integral nos momentos mais delicados de sinistros."
                </p>
                <p>
                  Com anos de experiência e conexões diretas com as seguradoras líderes mundiais, desenhamos planos sob medida que otimizam custos corporativos, ao mesmo tempo em que fortalecem o bem-estar e a atração de talentos de sua empresa.
                </p>
              </div>
            </motion.div>

            {/* Core Values Column */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8 lg:mt-6">
              {[
                { icon: Zap, title: "Agilidade Boutique", desc: "Suporte resolutivo, respostas imediatas e canais sem robôs ou esperas." },
                { icon: Heart, title: "Cuidado Humano", desc: "Acolhimento autêntico e assessoria próxima durante toda a vigência da apólice." },
                { icon: ShieldCheck, title: "Proteção Blindada", desc: "Desenho exato de coberturas sem brechas técnicas, ajustado à sua realidade." },
                { icon: Award, title: "Qualificação Executiva", desc: "Consultoria com visão estratégica de negócios e gestão de riscos avançada." }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="bg-[#f5f2eb]/40 p-8 rounded-[2rem] border border-slate-100/50 hover:shadow-xl hover:bg-white hover:-translate-y-1 transition-all duration-500 group"
                >
                  <div className="w-14 h-14 bg-[#08454c]/5 border border-[#08454c]/10 rounded-2xl flex items-center justify-center text-[#08454c] mb-6 group-hover:bg-[#08454c] group-hover:text-white transition-all duration-500">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg mb-3 text-[#163b52] group-hover:text-[#08454c] transition-colors">{item.title}</h3>
                  <p className="text-slate-500 text-sm font-light leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Carolina Monteiro Biography - Boutique Editorial Style */}
      <div className="py-28 bg-[#f5f2eb] border-y border-slate-200/30">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid lg:grid-cols-12 gap-16 items-center">
            {/* Biography Image Frame */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="lg:col-span-5 relative"
            >
              <div className="aspect-[3/4] rounded-[3.5rem] overflow-hidden shadow-2xl relative z-10 border-8 border-white">
                <img 
                  src="/carol10.jpg" 
                  alt="Carolina Monteiro — Fundadora" 
                  className="w-full h-full object-cover scale-102 hover:scale-100 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-[#08454c]/5 mix-blend-overlay" />
              </div>
              {/* Decorative design elements */}
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-[#c65f54]/10 rounded-full blur-2xl z-0" />
              <div className="absolute -top-6 -right-6 w-40 h-40 bg-[#08454c]/5 rounded-full blur-3xl z-0" />
            </motion.div>
            
            {/* Biography Copy */}
            <div className="lg:col-span-7 space-y-8">
              <div className="space-y-2">
                <span className="text-[#c65f54] font-bold tracking-wider text-xs uppercase tracking-widest">Fundação Monteiro</span>
                <h2 className="text-4xl md:text-5xl font-display font-bold text-[#163b52] leading-tight">Carolina Monteiro</h2>
                <p className="text-sm font-semibold uppercase text-slate-400 tracking-wider">Diretora Executiva & Consultora Estratégica</p>
              </div>
              
              <div className="space-y-6 text-slate-600 text-base md:text-lg font-light leading-relaxed">
                <p className="font-semibold text-[#163b52] leading-relaxed">
                  Carolina Monteiro estruturou a Monteiro Seguros e Benefícios trazendo como fundação sua bagagem de mais de 10 anos em gestão estratégica de riscos.
                </p>
                <p>
                  Sua trajetória executiva consolidou-se na liderança técnica e comercial em multinacionais de grande porte, o que lhe proporcionou uma visão aguçada de governança corporativa, otimização orçamentária e sustentabilidade financeira. Essa expertise é o motor que desenha as soluções corporativas boutique da Monteiro hoje.
                </p>
                <p>
                  Com atuação destacada tanto no mercado corporativo (B2B) quanto no atendimento a patrimônios familiares (B2C), Carolina preza por uma assessoria sem atalhos, inteiramente personalizada, onde cada cliente recebe soluções de excelência moldadas à sua realidade e com proximidade executiva irrestrita.
                </p>
              </div>

              <div className="pt-6 border-t border-[#809ba6]/25">
                 <p className="text-[#08454c] font-display font-bold text-xl md:text-2xl italic leading-relaxed">
                   "A proteção boutique representa entender a fundo o negócio ou a vida de quem nos procura para construir coberturas robustas e sem surpresas."
                 </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Boutique Call To Action */}
      <div className="py-28 bg-[#08454c] text-white relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#c65f54]/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/soft-wallpaper.png')] opacity-[0.03] pointer-events-none" />

        <div className="container px-4 md:px-6 mx-auto text-center max-w-4xl relative z-10 space-y-8">
          <span className="text-[#c65f54] font-bold tracking-wider text-sm uppercase">Parceria Estratégica</span>
          <h2 className="text-3xl md:text-5xl font-display font-bold leading-tight">O verdadeiro trabalho começa após a assinatura da apólice</h2>
          <p className="text-slate-200 text-lg md:text-xl font-light max-w-2xl mx-auto leading-relaxed">
            Estamos prontos para oferecer uma consultoria de risco personalizada para sua empresa ou sua vida. Fale agora com nossa equipe ou acesse nosso WhatsApp.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-6">
            <Link href="/contact">
              <button className="px-10 py-5 bg-white text-[#08454c] rounded-full font-bold text-lg hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-0.5 flex items-center gap-3">
                Falar com Consultor
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
              <span>WhatsApp Direto</span>
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#c65f54] rounded-full animate-ping" />
            </a>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
