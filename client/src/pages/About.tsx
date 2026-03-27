import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { Users, Award, History, Target, ArrowRight, Zap, Heart, ShieldCheck } from "lucide-react";
import { useSiteSettings } from "@/hooks/use-site-settings";

export default function About() {
  const { settings } = useSiteSettings();

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-primary/20">
      <Navbar />

      {/* Hero Section */}
      <div className="relative pt-32 pb-24 md:pt-40 md:pb-32 overflow-hidden bg-slate-900 text-white">
        <div className="absolute inset-0">
          <img 
            src={settings?.aboutImageBase64 || "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=2000"} 
            alt="Hero Background" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent" />
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
              {settings?.aboutTitle || "Proteção que Evolui com Você"}
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
                {settings?.aboutContent || (
                  <>
                    <p>
                      Com anos de experiência no mercado, trabalhando com seguradoras e corretoras líderes no mercado mundial, a Monteiro Corretora é especialista em soluções de proteção e planejamento financeiro.
                    </p>
                    <p className="p-6 bg-slate-50 border-l-4 border-primary rounded-r-2xl italic text-slate-700 font-medium">
                      "Nosso objetivo é oferecer sempre o seguro mais adequado ao seu perfil – pessoal ou empresarial – e às suas expectativas, com um atendimento personalizado, humano e qualificado."
                    </p>
                    <p>
                      Nos preocupamos em oferecer aos segurados acompanhamento durante todas as etapas do processo, ou seja, durante a contratação e também no pós-venda, garantindo tranquilidade e segurança para você e sua família.
                    </p>
                  </>
                )}
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

      {/* Team Section */}
      <div className="py-24 bg-slate-900 text-white">
        <div className="container px-4 mx-auto text-center max-w-5xl">
          <div className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm font-semibold tracking-wider uppercase mb-6 text-primary-300">
            Nosso Time
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-16">Pessoas Construindo um Futuro Seguro</h2>
          
          <div className="grid md:grid-cols-3 gap-10">
            {[
              { img: "/assets/team/team-1.png" },
              { img: "/assets/team/team-2.jpg" },
              { img: "/assets/team/team-3.jpg" }
            ].map((member, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className="group relative"
              >
                <div className="aspect-[4/5] rounded-3xl bg-slate-800 overflow-hidden mb-6 relative shadow-2xl border border-white/5">
                  <div className="absolute inset-0 bg-primary/10 mix-blend-overlay group-hover:opacity-0 transition-opacity z-10 duration-500" />
                  <img
                    src={member.img}
                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
                    alt={`Team Member ${i + 1}`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent z-20" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

