import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useCreateInquiry } from "@/hooks/use-inquiries";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertInquirySchema, type InsertInquiry } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { Mail, Phone, MapPin, Loader2, Send, MessageSquare, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function Contact() {
  const { toast } = useToast();
  const mutation = useCreateInquiry();
  const { settings } = useSiteSettings();

  const form = useForm<InsertInquiry>({
    resolver: zodResolver(insertInquirySchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: ""
    }
  });

  const onSubmit = (data: InsertInquiry) => {
    mutation.mutate(data, {
      onSuccess: () => {
        toast({
          title: "Mensagem Enviada",
          description: "Agradecemos o contato. Nossa equipe boutique responderá em breve.",
        });
        form.reset();
      },
      onError: (error) => {
        toast({
          title: "Erro no envio",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  };

  // Sanitize phone for dynamic WhatsApp links
  const whatsappNumber = settings?.contactPhone 
    ? settings.contactPhone.replace(/\D/g, '') 
    : "5511999999999";

  return (
    <div className="min-h-screen bg-[#eae4da] font-sans text-[#163b52] selection:bg-[#c65f54]/20 overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      <div className="relative pt-36 pb-28 md:pt-48 md:pb-40 overflow-hidden bg-gradient-to-br from-[#08454c] via-[#08454c] to-[#163b52] text-white">
        {/* Dynamic Glowing Accents */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#c65f54]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-15%] left-[-5%] w-[450px] h-[450px] bg-[#809ba6]/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/soft-wallpaper.png')] opacity-[0.02] mix-blend-overlay pointer-events-none" />

        <div className="container px-4 md:px-6 mx-auto relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-[#c65f54]" />
              <span>Canais de Atendimento</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-white tracking-tight leading-tight">
              Fale com um Especialista
            </h1>
            <p className="text-lg md:text-xl text-slate-200 max-w-xl mx-auto font-light leading-relaxed">
              Solicite uma cotação sob medida ou tire dúvidas sobre apólices com nossa equipe boutique.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Overlapping Card Container */}
      <div className="container px-4 md:px-6 mx-auto -mt-16 pb-28 relative z-20">
        <div className="bg-white rounded-[2.5rem] md:rounded-[3rem] shadow-[0_24px_60px_rgba(8,69,76,0.04)] overflow-hidden grid md:grid-cols-5 border border-slate-100/50">
          
          {/* Contact Info Sidebar */}
          <div className="md:col-span-2 bg-[#f5f2eb] p-8 md:p-12 border-r border-slate-100 flex flex-col justify-between">
            <div className="space-y-10">
              <div className="space-y-2">
                <span className="text-[#c65f54] font-bold tracking-wider text-xs uppercase">Monteiro Desk</span>
                <h3 className="text-2xl font-bold font-display text-[#163b52]">Informações Direct</h3>
              </div>
              
              <div className="space-y-8">
                {/* Address */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#08454c]/5 border border-[#08454c]/10 flex items-center justify-center text-[#08454c] shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-[#163b52]">Sede Comercial</h4>
                    <p className="text-slate-500 text-sm mt-1.5 leading-relaxed font-light">
                      {settings?.address || "Rua do Comércio, 123\nSão Paulo, SP"}
                    </p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#08454c]/5 border border-[#08454c]/10 flex items-center justify-center text-[#08454c] shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-[#163b52]">Central Telefônica</h4>
                    <p className="text-slate-500 text-sm mt-1.5 font-light">
                      {settings?.contactPhone || "+55 (11) 9999-9999"}
                    </p>
                    <p className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider mt-1">Seg-Sex das 09h às 18h</p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#08454c]/5 border border-[#08454c]/10 flex items-center justify-center text-[#08454c] shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-[#163b52]">Correspondência</h4>
                    <p className="text-slate-500 text-sm mt-1.5 font-light break-all">
                      {settings?.contactEmail || "contato@monteiro.com"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Direct Desk WhatsApp Conversion Badge */}
            <div className="mt-12 pt-8 border-t border-[#809ba6]/25 space-y-4">
              <h4 className="text-sm font-bold text-[#163b52] uppercase tracking-wider">Atendimento Imediato</h4>
              <a 
                href={`https://wa.me/${whatsappNumber}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="relative group w-full inline-flex items-center justify-center gap-3 px-6 py-4 bg-[#25D366] text-white rounded-2xl font-bold text-base hover:bg-[#20ba5a] transition-all duration-300 shadow-md shadow-[#25d366]/10"
              >
                <MessageSquare className="w-5 h-5 fill-white" />
                <span>Chamar no WhatsApp</span>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#c65f54] rounded-full animate-ping" />
              </a>
            </div>
          </div>

          {/* Form Area */}
          <div className="md:col-span-3 p-8 md:p-12 lg:p-16">
            <h3 className="text-2xl font-bold font-display text-[#163b52] mb-8">Envie uma mensagem executiva</h3>
            
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Name */}
                <div className="space-y-2">
                  <label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-slate-400">Nome Completo</label>
                  <input 
                    {...form.register("name")}
                    id="name"
                    className="w-full px-4 py-3.5 bg-slate-50 rounded-2xl border border-slate-200 focus:outline-none focus:bg-white focus:border-[#08454c] focus:ring-4 focus:ring-[#08454c]/5 transition-all text-sm"
                    placeholder="Carolina Monteiro"
                  />
                  {form.formState.errors.name && (
                    <p className="text-red-500 text-xs mt-1 font-semibold">{form.formState.errors.name.message}</p>
                  )}
                </div>
                
                {/* Phone */}
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-xs font-semibold uppercase tracking-wider text-slate-400">Telefone (DDD)</label>
                  <input 
                    {...form.register("phone")}
                    id="phone"
                    className="w-full px-4 py-3.5 bg-slate-50 rounded-2xl border border-slate-200 focus:outline-none focus:bg-white focus:border-[#08454c] focus:ring-4 focus:ring-[#08454c]/5 transition-all text-sm"
                    placeholder="+55 (11) 99999-9999"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-slate-400">Endereço de E-mail</label>
                <input 
                  {...form.register("email")}
                  id="email"
                  type="email"
                  className="w-full px-4 py-3.5 bg-slate-50 rounded-2xl border border-slate-200 focus:outline-none focus:bg-white focus:border-[#08454c] focus:ring-4 focus:ring-[#08454c]/5 transition-all text-sm"
                  placeholder="exemplo@empresa.com"
                />
                {form.formState.errors.email && (
                  <p className="text-red-500 text-xs mt-1 font-semibold">{form.formState.errors.email.message}</p>
                )}
              </div>

              {/* Message */}
              <div className="space-y-2">
                <label htmlFor="message" className="text-xs font-semibold uppercase tracking-wider text-slate-400">Escopo da Consulta</label>
                <textarea 
                  {...form.register("message")}
                  id="message"
                  rows={5}
                  className="w-full px-4 py-3.5 bg-slate-50 rounded-2xl border border-slate-200 focus:outline-none focus:bg-white focus:border-[#08454c] focus:ring-4 focus:ring-[#08454c]/5 transition-all text-sm resize-none leading-relaxed"
                  placeholder="Descreva as soluções de seguros ou benefícios que sua empresa ou família necessita..."
                />
                {form.formState.errors.message && (
                  <p className="text-red-500 text-xs mt-1 font-semibold">{form.formState.errors.message.message}</p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={mutation.isPending}
                className="w-full bg-[#c65f54] text-white py-4 rounded-2xl font-bold text-base hover:bg-[#c65f54]/95 transition-all shadow-md shadow-[#c65f54]/10 hover:shadow-xl hover:shadow-[#c65f54]/25 disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-4"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Enviando Requisição...
                  </>
                ) : (
                  <>
                    <span>Enviar Solicitação</span>
                    <Send className="w-4.5 h-4.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
