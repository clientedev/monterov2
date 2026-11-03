import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { 
  Menu, X, LogOut, User as UserIcon, LayoutDashboard, 
  ArrowRight, Phone
} from "lucide-react";
import logo from "@assets/logo_monteiro_v2.png";
import { cn } from "@/lib/utils";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { useAuth } from "@/hooks/use-auth";
import { LoginModal } from "@/components/LoginModal";

function WhatsAppIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [location] = useLocation();
  const { settings } = useSiteSettings();
  const { user, logoutMutation } = useAuth();

  // Scroll listener otimizado para 60fps sem sobrecarga
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Trava de rolagem ao abrir o menu mobile sem travar viewport
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [isOpen]);

  const navLinks = [
    { name: "Início", href: "/" },
    { name: "Serviços", href: "/services" },
    { name: "Sobre", href: "/sobre" },
    { name: "Blog", href: "/blog" },
    { name: "Contato", href: "/contact" },
  ];

  const darkHeroPaths = ["/", "/sobre", "/services"];
  const isDarkHeroPage = darkHeroPaths.includes(location) || location.startsWith("/services/");
  const showScrolledNavbar = scrolled || !isDarkHeroPage;

  const handleLinkClick = () => setIsOpen(false);

  const whatsappNumber = settings?.contactPhone 
    ? settings.contactPhone.replace(/\D/g, '') 
    : "5511999999999";

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-40 transition-all duration-300 ease-in-out py-3 md:py-4",
          showScrolledNavbar
            ? "backdrop-blur-lg shadow-[0_4px_30px_rgba(8,69,76,0.12)] border-b border-[#809ba6]/15 py-2.5 md:py-3"
            : "bg-transparent"
        )}
        style={{
          backgroundColor: showScrolledNavbar 
            ? "var(--navbar-bg, rgba(8, 69, 76, 0.95))" 
            : "transparent"
        }}
      >
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
          {/* Logo da Marca */}
          <Link href="/" asChild>
            <a className="flex items-center group cursor-pointer z-10" onClick={() => setIsOpen(false)}>
              <div className="relative h-11 md:h-16 flex items-center overflow-visible translate-y-[2px]">
                {settings?.logoBase64 ? (
                  <img
                    src={settings.logoBase64}
                    alt={settings.siteName}
                    onError={(e) => {
                      e.currentTarget.src = logo;
                    }}
                    style={{ 
                       '--logo-scale': `${(settings.logoScale || 150) / 100}`,
                       '--logo-scale-mobile': `${(settings.logoScaleMobile || 120) / 100}`
                    } as React.CSSProperties}
                    className={cn(
                      "h-12 md:h-20 w-auto object-contain transition-all duration-300 origin-left",
                      "scale-[var(--logo-scale-mobile)] md:scale-[var(--logo-scale)]"
                    )}
                  />
                ) : (
                  <img
                    src={logo}
                    alt="Monteiro Seguros e Benefícios"
                    style={{ 
                       '--logo-scale': `${(settings?.logoScale || 150) / 100}`,
                       '--logo-scale-mobile': `${(settings?.logoScaleMobile || 120) / 100}`
                    } as React.CSSProperties}
                    className={cn(
                      "h-12 md:h-20 w-auto object-contain transition-all duration-300 origin-left",
                      "scale-[var(--logo-scale-mobile)] md:scale-[var(--logo-scale)]"
                    )}
                  />
                )}
              </div>
            </a>
          </Link>
   
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = location === link.href;
              return (
                <Link key={link.name} href={link.href} asChild>
                  <a
                    className={cn(
                      "text-sm font-semibold tracking-wide transition-all duration-300 relative py-1 cursor-pointer",
                      "after:content-[''] after:absolute after:-bottom-0.5 after:left-0 after:h-0.5 after:transition-all after:duration-300",
                      isActive 
                        ? "text-[#c65f54] after:w-full after:bg-[#c65f54]" 
                        : "text-white/85 hover:text-[#c65f54] after:w-0 hover:after:w-full after:bg-[#c65f54]"
                    )}
                  >
                    {link.name}
                  </a>
                </Link>
              );
            })}
            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-4">
                  <Link href="/profile" asChild>
                    <a className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-2xl transition-all duration-300 group/avatar border border-white/10 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white"
                    )} title="Meu Perfil">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="h-6 w-6 rounded-full object-cover group-hover/avatar:opacity-85 transition-opacity" />
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-[#c65f54]/10 flex items-center justify-center">
                          <UserIcon className="h-4 w-4 text-[#c65f54]" />
                        </div>
                      )}
                    </a>
                  </Link>
                  <Link href={user.role === "client" ? "/dashboard" : "/admin"} asChild>
                    <a className={cn(
                      "text-sm font-bold flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all duration-300 shadow-sm bg-[#c65f54] text-white hover:bg-[#c65f54]/90 cursor-pointer"
                    )}>
                      <LayoutDashboard className="h-4 w-4" />
                      <span className="hidden lg:inline">
                        {user.role === "client" ? "Área do Cliente" : "Painel Admin"}
                      </span>
                    </a>
                  </Link>
                  <button
                    onClick={() => logoutMutation.mutate()}
                    disabled={logoutMutation.isPending}
                    className={cn(
                      "p-2.5 rounded-2xl transition-all duration-300 border border-transparent text-white/60 hover:text-red-400 hover:bg-white/10 cursor-pointer"
                    )}
                    title="Sair"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <>
                  <Link href="/login" asChild>
                    <a className={cn(
                      "text-sm font-bold cursor-pointer transition-colors duration-300 text-white hover:text-[#c65f54]"
                    )}>
                      Entrar
                    </a>
                  </Link>
                  <Link href="/contact" asChild>
                    <button className={cn(
                      "px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-500 transform hover:-translate-y-0.5 shadow-md cursor-pointer",
                      showScrolledNavbar
                        ? "bg-[#c65f54] text-white hover:bg-[#c65f54]/95 hover:shadow-lg hover:shadow-[#c65f54]/25"
                        : "bg-white text-[#08454c] hover:bg-white/95 hover:shadow-lg hover:shadow-white/20"
                    )}>
                      Solicitar Cotação
                    </button>
                  </Link>
                </>
              )}
            </div>
          </nav>
   
          {/* Botão Hambúrguer Mobile */}
          <button
            type="button"
            className={cn(
              "md:hidden p-2.5 rounded-xl transition-all duration-200 border flex items-center justify-center cursor-pointer",
              showScrolledNavbar
                ? "bg-white/15 border-white/20 text-white hover:bg-white/25 active:scale-95"
                : "bg-black/30 border-white/20 text-white hover:bg-black/40 active:scale-95"
            )}
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="h-6 w-6 text-white" /> : <Menu className="h-6 w-6 text-white" />}
          </button>
        </div>
      </header>

      {/* ── PAINEL / DRAWER MOBILE (ESTÉTICA BOUTIQUE, 0% CARA DE I.A) ── */}
      {/* Backdrop */}
      <div
        className={cn(
          "md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Gaveta do Menu Mobile */}
      <div
        className={cn(
          "md:hidden fixed inset-y-0 right-0 z-50 w-[85vw] max-w-[340px] shadow-2xl flex flex-col justify-between transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        style={{
          backgroundColor: "var(--navbar-bg, #08454c)",
          color: "#ffffff"
        }}
      >
        {/* Cabeçalho Limpo */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center">
            <img 
              src={settings?.logoBase64 || logo} 
              alt="Monteiro Seguros" 
              className="h-9 w-auto object-contain brightness-0 invert" 
              onError={(e) => {
                e.currentTarget.src = logo;
              }}
            />
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all active:scale-95 cursor-pointer"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Links de Navegação Sofisticados */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 overscroll-contain flex flex-col justify-between">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => {
              const isActive = location === link.href;
              return (
                <Link key={link.name} href={link.href} asChild>
                  <a
                    onClick={handleLinkClick}
                    className={cn(
                      "py-3 px-3.5 text-lg font-display tracking-wide rounded-xl transition-all cursor-pointer flex items-center justify-between",
                      isActive
                        ? "text-[#c65f54] font-bold bg-white/5"
                        : "text-white/90 hover:text-white hover:bg-white/5 active:bg-white/10"
                    )}
                  >
                    <span>{link.name}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#c65f54]" />
                    )}
                  </a>
                </Link>
              );
            })}
          </nav>

          {/* Ações / Login */}
          <div className="space-y-3 pt-4 border-t border-white/10">
            {user ? (
              <div className="space-y-2">
                <Link href={user.role === "client" ? "/dashboard" : "/admin"} asChild>
                  <a
                    onClick={handleLinkClick}
                    className="flex items-center justify-between px-4 py-3 rounded-2xl bg-[#c65f54] text-white font-bold text-sm shadow-md cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <LayoutDashboard className="w-4 h-4" />
                      <span>{user.role === "client" ? "Área do Cliente" : "Painel Admin"}</span>
                    </div>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </Link>

                <Link href="/profile" asChild>
                  <a
                    onClick={handleLinkClick}
                    className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-white/80 hover:text-white text-sm font-semibold transition-all cursor-pointer"
                  >
                    <UserIcon className="w-4 h-4 text-slate-300" />
                    <span>Meu Perfil</span>
                  </a>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    logoutMutation.mutate();
                    handleLinkClick();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-400 hover:text-red-300 transition-colors cursor-pointer text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair da conta</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                <Link href="/contact" asChild>
                  <button
                    type="button"
                    onClick={handleLinkClick}
                    className="w-full py-3.5 px-5 rounded-full font-bold bg-[#c65f54] hover:bg-[#c65f54]/95 text-white shadow-md flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer text-sm"
                  >
                    <span>Solicitar Cotação</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setIsLoginModalOpen(true);
                  }}
                  className="w-full py-3 px-5 rounded-full font-semibold text-white hover:bg-white/10 border border-white/20 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer text-sm"
                >
                  <UserIcon className="w-4 h-4 text-white/80" />
                  <span>Login</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Rodapé Elegante com WhatsApp Direto */}
        <div className="px-6 py-4 border-t border-white/10 shrink-0 flex items-center justify-between text-xs text-white/60">
          <a
            href={`https://wa.me/${whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleLinkClick}
            className="flex items-center gap-2 text-white/80 hover:text-emerald-400 transition-colors"
          >
            <WhatsAppIcon className="w-4 h-4 text-emerald-400" />
            <span>WhatsApp</span>
          </a>
          <span>© {new Date().getFullYear()} Monteiro</span>
        </div>
      </div>

      {/* Modal de Login Global */}
      <LoginModal open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen} />
    </>
  );
}
