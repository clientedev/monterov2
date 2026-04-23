import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { Users, Award, History, Target, ArrowRight, Zap, Heart, ShieldCheck } from "lucide-react";
import { useSiteSettings } from "@/hooks/use-site-settings";

export default function About() {
  const { settings } = useSiteSettings();
  const heroTitle = settings?.heroTitle || "Proteção que Transforma,\nBenefícios que Cuidam";
  const heroSubtitle = settings?.heroSubtitle || "A Monteiro Seguros e Benefícios é especializada em oferecer consultoria estratégica em proteção e benefícios para empresas e famílias.";
  const heroImageUrl = "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2400";

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-primary/20">
      <Navbar />

      {/* Hero Section */}
      <div className="relative pt-32 pb-24 md:pt-40 md:pb-32 overflow-hidden bg-[#08454c] text-white">
        <div className="absolute inset-0">
          <img 
            src={settings?.aboutImageBase64 || heroImageUrl} 
            alt="Hero Background" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#08454c] via-[#08454c]/80 to-transparent" />
        </div>
        
        <div className="container px-4 mx-auto relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <div className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm font-semibold tracking-wider uppercase mb-6 text-primary-300">
              Nossa Essência
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold leading-tight mb-6 text-white">
              {settings?.aboutTitle || "Especialistas em Proteção e Benefícios"}
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 max-w-2xl font-light leading-relaxed">
              {settings?.heroSubtitle || "Décadas de confiança, excelência e um compromisso inabalável com o futuro dos nossos clientes."}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content Area - Overlapping */}
      <div className="container px-4 mx-auto relative z-20 -mt-16 mb-24">
        <div className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-2xl p-8 md:p-16 lg:p-24 border border-slate-100">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-8 text-slate-900 leading-tight">
                Construindo Relações de <span className="text-primary">Confiança</span>
              </h2>
              <div className="space-y-6 text-slate-600 text-lg leading-relaxed whitespace-pre-wrap">
                <p>
                  A Monteiro Seguros e Benefícios é especializada em oferecer consultoria estratégica em proteção e benefícios para empresas e famílias.
                </p>
                <p className="p-6 bg-slate-50 border-l-4 border-primary rounded-r-2xl italic text-slate-700 font-medium">
                  "Mais do que comercializar seguros, atuamos como parceiros na construção de soluções que equilibram cuidado com pessoas, controle de custos e segurança financeira, tanto no ambiente corporativo quanto na vida pessoal."
                </p>
                <p>
                  Para empresas, desenvolvemos estratégias que fortalecem a retenção de talentos e organizam os benefícios de forma inteligente. Para pessoas e famílias, criamos proteções personalizadas que garantem tranquilidade em todas as fases da vida.
                </p>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8 lg:mt-12">
              {[
                { icon: Zap, title: "Agilidade", desc: "Trabalho bem feito, com respeito às individualidades, seriedade e transparência." },
                { icon: Heart, title: "Atendimento Humanizado", desc: "Fazemos o nosso melhor para te ver satisfeito. Sempre presentes quando precisar." },
                { icon: ShieldCheck, title: "Segurança", desc: "Proteção personalizada de acordo com seu perfil e necessidade real." },
                { icon: Award, title: "Acompanhamento", desc: "Suporte completo e qualificado desde a contratação até o pós-venda." }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:shadow-xl hover:bg-white hover:-translate-y-1 transition-all duration-300 group"
                >
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                    <item.icon className="w-7 h-7" />
                  </div>
                  <h3 className="font-bold text-xl mb-3 text-slate-900 group-hover:text-primary transition-colors">{item.title}</h3>
                  <p className="text-slate-500">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bio Section */}
      <div className="py-24 bg-white">
        <div className="container px-4 mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-[3/4] rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10 border-8 border-slate-50">
                <img 
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=1200" 
                  alt="Carolina Monteiro" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-0" />
            </motion.div>
            
            <div className="space-y-8">
              <div>
                <span className="text-primary font-bold tracking-wider text-sm uppercase">Fundadora</span>
                <h2 className="text-4xl font-display font-bold text-slate-900 mt-2">Carolina Monteiro</h2>
              </div>
              
              <div className="space-y-4 text-slate-600 text-lg leading-relaxed">
                <p className="font-bold text-slate-800">
                  Carolina Monteiro é fundadora da Monteiro Seguros e Benefícios, com mais de 10 anos de experiência no mercado de seguros e benefícios.
                </p>
                <p>
                  Antes de empreender, construiu sua carreira como executiva em multinacionais, o que trouxe uma visão estratégica de negócios, gestão e tomada de decisão — hoje aplicada diretamente no atendimento a empresas e clientes.
                </p>
                <p>
                  Hoje, a Monteiro atua tanto no B2C quanto no B2B, mantendo como essência um atendimento humanizado, próximo e no modelo boutique. Mais do que intermediar seguros, Carolina posiciona a Monteiro como uma parceira estratégica.
                </p>
                <div className="pt-4">
                   <p className="text-primary font-display font-bold text-2xl italic leading-tight">
                     "Cuidar de pessoas é o que sustenta empresas e constrói segurança no longo prazo."
                   </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Section Placeholder */}
      <div className="py-24 bg-slate-900 text-white">
        <div className="container px-4 mx-auto text-center max-w-5xl">
          <div className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm font-semibold tracking-wider uppercase mb-6 text-primary-300">
            Parceria Estratégica
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-16">O trabalho não termina na venda — começa nela.</h2>
        </div>
      </div>
      <Footer />
    </div>
  );
}

