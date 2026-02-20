import logo from "@assets/image_1770228718109.png";
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
    <footer className="bg-slate-900 text-slate-200 pt-20 pb-10">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              {settings?.logoBase64 ? (
                <img
                  src={settings.logoBase64}
                  alt={settings.siteName}
                  className="h-10 w-auto bg-white rounded p-1"
                />
              ) : (
                <img
                  src={logo}
                  alt="Monteiro Corretora"
                  className="h-10 w-auto bg-white rounded p-1"
                />
              )}
              <span className="font-display text-xl font-bold text-white">{settings?.siteName || "Monteiro"}</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-sm">
              {settings?.footerText || "Oferecemos soluções premium em seguros personalizadas para seu estilo de vida e necessidades de negócios. Confiança, integridade e excelência."}
            </p>
            <div className="flex gap-4">
              {socialLinks.length > 0 ? (
                socialLinks.map(({ Icon, url, label }) => (
                  <a
                    key={label}
                    href={url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-300"
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
                    className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-300"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-lg font-semibold text-white mb-6">Empresa</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li><Link href="/about" className="hover:text-primary transition-colors">Sobre Nós</Link></li>
              <li><Link href="/#services" className="hover:text-primary transition-colors">Nossos Serviços</Link></li>
              <li><Link href="/blog" className="hover:text-primary transition-colors">Notícias</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contato</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-display text-lg font-semibold text-white mb-6">Seguros</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li className="hover:text-primary transition-colors cursor-pointer">Seguro Auto</li>
              <li className="hover:text-primary transition-colors cursor-pointer">Seguro Residencial</li>
              <li className="hover:text-primary transition-colors cursor-pointer">Seguro de Vida</li>
              <li className="hover:text-primary transition-colors cursor-pointer">Soluções Corporativas</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-lg font-semibold text-white mb-6">Fale Conosco</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary shrink-0" />
                <span>{settings?.address || "Rua do Comércio, 123\nSão Paulo, SP"}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary shrink-0" />
                <span>{settings?.contactPhone || "+55 (11) 9999-9999"}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary shrink-0" />
                <span>{settings?.contactEmail || "contato@monteiro.com"}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} {settings?.siteName || "Monteiro Corretora"}. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <span className="cursor-pointer hover:text-white transition-colors">Política de Privacidade</span>
            <span className="cursor-pointer hover:text-white transition-colors">Termos de Serviço</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
