import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { Users, Award, History, Target } from "lucide-react";
import { useSiteSettings } from "@/hooks/use-site-settings";

export default function About() {
  const { settings } = useSiteSettings();

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Navbar />

      {/* Header */}
      <div className="pt-32 pb-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/10 mix-blend-overlay"></div>
        <div className="container px-4 mx-auto relative z-10 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-display font-bold mb-6"
          >
            {settings?.aboutTitle || "Sobre a Monteiro"}
          </motion.h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            {settings?.heroSubtitle || "Décadas de confiança, excelência e compromisso com nossos clientes."}
          </p>
        </div>
      </div>

      <div className="container px-4 py-20 mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-start">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-primary font-semibold uppercase tracking-wider text-sm">Nossa História</span>
            <h2 className="text-3xl md:text-4xl font-display font-bold mt-2 mb-6 text-slate-900 leading-tight">
              Construindo Confiança e Excelência
            </h2>
            <div className="space-y-6 text-slate-600 text-lg leading-relaxed whitespace-pre-wrap">
              {settings?.aboutContent || (
                <>
                  <p>
                    Fundada por Carlos Monteiro, a Monteiro Corretora começou com uma missão simples: tornar o seguro compreensível, acessível e verdadeiramente protetor para famílias e empresas em São Paulo.
                  </p>
                  <p>
                    Nas últimas três décadas, crescemos de um pequeno escritório familiar para uma das corretoras mais respeitadas da região. Nosso crescimento não mudou nossos valores fundamentais — ainda tratamos cada cliente como parte da família.
                  </p>
                </>
              )}
            </div>
          </motion.div>

          <div className="space-y-8">
            {(settings?.aboutImageBase64 || "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=1600") && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="rounded-3xl overflow-hidden shadow-2xl border-8 border-white"
              >
                <img
                  src={settings?.aboutImageBase64 || "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=1600"}
                  alt="Sobre a Monteiro"
                  className="w-full h-auto object-cover"
                />
              </motion.div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
              {[
                { icon: Users, title: "Cliente em Primeiro Lugar", desc: "Suas necessidades ditam nossas soluções, sempre." },
                { icon: Award, title: "Excelência", desc: "Serviço e suporte premiados." },
                { icon: History, title: "Experiência", desc: "Mais de 30 anos navegando no mercado." },
                { icon: Target, title: "Precisão", desc: "Apólices personalizadas, sem enrolação." }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-slate-900">{item.title}</h3>
                  <p className="text-slate-500 text-sm">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Team Section Placeholder */}
      <div className="bg-white py-20">
        <div className="container px-4 mx-auto text-center">
          <h2 className="text-3xl font-display font-bold mb-12 text-slate-900">Liderança</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "Carlos Monteiro", role: "Fundador e CEO" },
              { name: "Ana Silva", role: "Diretora de Operações" },
              { name: "Pedro Santos", role: "Especialista em Riscos" }
            ].map((member, i) => (
              <div key={i} className="group">
                <div className="aspect-[3/4] rounded-2xl bg-slate-100 overflow-hidden mb-4 relative">
                  {/* Abstract team placeholder */}
                  <img
                    src={`https://images.unsplash.com/photo-${i === 0 ? '1560250097-0b9358e10e2e' : i === 1 ? '1573496359142-b8d87734a5a2' : '1580489944761-15a19d654956'}?auto=format&fit=crop&q=80&w=800`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    alt={member.name}
                  />
                </div>
                <h3 className="font-bold text-xl text-slate-900">{member.name}</h3>
                <p className="text-primary font-medium">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
