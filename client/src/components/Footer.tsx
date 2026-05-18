import logo from "@assets/logo_monteiro_v2.png";
import { Facebook, Instagram, Linkedin, Twitter, MapPin, Phone, Mail } from "lucide-react";
import { Link } from "wouter";
import { useSiteSettings } from "@/hooks/use-site-settings";

export function Footer() {
  const { settings } = useSiteSettings();

  const socialLinks = [
    { Icon: Facebook, url: settings?.facebookUrl, label: "Facebook" },
    { Icon: Instagram, url: settings?.instagramUrl, label: "Instagram" },
    { Icon: Twitter, url: settings?.twitterUrl, label: "Twitter" },
    { Icon: Linkedin, url: settings?.linkedinUrl, label: "LinkedIn" },
  ].filter(link => link.url);

  return (
    <footer className="bg-[#08454c] text-white pt-24 pb-12 relative overflow-hidden border-t border-[#809ba6]/15">
      {/* Decorative Brand Glow */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-[#c65f54]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-[300px] h-[300px] bg-[#163b52]/30 rounded-full blur-[80px] pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          {/* Brand Column */}
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              {settings?.logoBase64 ? (
                <img
                  src={settings.logoBase64}
                  alt={settings.siteName}
                  className="h-16 w-auto brightness-0 invert opacity-95 transition-opacity hover:opacity-100"
                />
              ) : (
                <img
                  src={logo}
                  alt="Monteiro Seguros e Benefícios"
                  className="h-16 w-auto brightness-0 invert opacity-95 transition-opacity hover:opacity-100"
                />
              )}
            </div>
            <p className="text-slate-300 leading-relaxed text-sm font-light">
              {settings?.footerText || "Oferecemos soluções premium em seguros personalizadas para seu estilo de vida e necessidades de negócios. Confiança, integridade e excelência."}
            </p>
            <div className="flex gap-3">
              {socialLinks.length > 0 ? (
                socialLinks.map(({ Icon, url, label }) => (
                  <a
                    key={label}
                    href={url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#c65f54] hover:border-[#c65f54] hover:text-white hover:-translate-y-1 transition-all duration-300"
                    title={label}
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))
              ) : (
                [Facebook, Instagram, Twitter, Linkedin].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#c65f54] hover:border-[#c65f54] hover:text-white hover:-translate-y-1 transition-all duration-300"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-lg font-bold text-white mb-8 tracking-wide relative after:content-[''] after:absolute after:bottom-[-8px] after:left-0 after:w-8 after:h-0.5 after:bg-[#c65f54]">
              Empresa
            </h4>
            <ul className="space-y-4 text-sm text-slate-300">
              <li><Link href="/about" className="hover:text-[#c65f54] hover:translate-x-1 transition-all duration-300 inline-block">Sobre Nós</Link></li>
              <li><Link href="/#services" className="hover:text-[#c65f54] hover:translate-x-1 transition-all duration-300 inline-block">Nossos Serviços</Link></li>
              <li><Link href="/blog" className="hover:text-[#c65f54] hover:translate-x-1 transition-all duration-300 inline-block">Notícias</Link></li>
              <li><Link href="/contact" className="hover:text-[#c65f54] hover:translate-x-1 transition-all duration-300 inline-block">Contato</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-display text-lg font-bold text-white mb-8 tracking-wide relative after:content-[''] after:absolute after:bottom-[-8px] after:left-0 after:w-8 after:h-0.5 after:bg-[#c65f54]">
              Seguros
            </h4>
            <ul className="space-y-4 text-sm text-slate-300">
              <li className="hover:text-[#c65f54] hover:translate-x-1 transition-all duration-300 cursor-pointer inline-block">Seguro de Vida Individual</li>
              <li className="hover:text-[#c65f54] hover:translate-x-1 transition-all duration-300 cursor-pointer inline-block">Planos de Saúde Corporativos</li>
              <li className="hover:text-[#c65f54] hover:translate-x-1 transition-all duration-300 cursor-pointer inline-block">Seguro Patrimonial Pessoal</li>
              <li className="hover:text-[#c65f54] hover:translate-x-1 transition-all duration-300 cursor-pointer inline-block">Proteção de Frotas e Logística</li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-display text-lg font-bold text-white mb-8 tracking-wide relative after:content-[''] after:absolute after:bottom-[-8px] after:left-0 after:w-8 after:h-0.5 after:bg-[#c65f54]">
              Fale Conosco
            </h4>
            <ul className="space-y-5 text-sm text-slate-300">
              <li className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#c65f54] shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <span className="font-light leading-relaxed">{settings?.address || "Rua do Comércio, 123\nSão Paulo, SP"}</span>
              </li>
              <li className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#c65f54] shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <span className="font-light">{settings?.contactPhone || "+55 (11) 9999-9999"}</span>
              </li>
              <li className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#c65f54] shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <span className="font-light break-all">{settings?.contactEmail || "contato@monteiro.com"}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-slate-400 font-light">
          <p>© {new Date().getFullYear()} {settings?.siteName || "Monteiro Seguros e Benefícios"}. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <span className="cursor-pointer hover:text-white transition-colors duration-300">Política de Privacidade</span>
            <span className="cursor-pointer hover:text-white transition-colors duration-300">Termos de Serviço</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
