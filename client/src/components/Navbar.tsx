import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Menu, X, LogOut, User as UserIcon, LayoutDashboard, Camera } from "lucide-react";
import logo from "@assets/logo_monteiro_v2.png";
import { cn } from "@/lib/utils";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { useAuth } from "@/hooks/use-auth";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [location, setLocation] = useLocation();
  const { settings } = useSiteSettings();
  const { user, logoutMutation } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Início", href: "/" },
    { name: "Serviços", href: "/services" },
    { name: "Sobre", href: "/about" },
    { name: "Blog", href: "/blog" },
    { name: "Contato", href: "/contact" },
  ];
  const darkHeroPaths = ["/", "/about", "/services", "/blog"];
  const isDarkHeroPage = darkHeroPaths.includes(location) || location.startsWith("/blog/") || location.startsWith("/services/");
  const showScrolledNavbar = scrolled || !isDarkHeroPage;

  const handleLinkClick = () => setIsOpen(false);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out py-3 md:py-4",
        showScrolledNavbar
          ? "bg-[#163b52]/95 backdrop-blur-lg shadow-[0_4px_30px_rgba(8,69,76,0.1)] border-b border-[#809ba6]/15 py-2 md:py-3"
          : "bg-transparent"
      )}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        <Link href="/">
          <a className="flex items-center group cursor-pointer">
            <div className="relative h-12 md:h-16 flex items-center overflow-visible translate-y-[2px] md:translate-y-[3px]">
              {settings?.logoBase64 ? (
                <img
                  src={settings.logoBase64}
                  alt={settings.siteName}
                  style={{ 
                     '--logo-scale': `${(settings.logoScale || 150) / 100}`,
                     '--logo-scale-mobile': `${(settings.logoScaleMobile || 130) / 100}`
                  } as React.CSSProperties}
                  className={cn(
                    "h-16 md:h-20 w-auto object-contain transition-all duration-500 origin-left",
                    "scale-[var(--logo-scale-mobile)] md:scale-[var(--logo-scale)] group-hover:scale-[calc(var(--logo-scale-mobile)*1.03)] md:group-hover:scale-[calc(var(--logo-scale)*1.03)]"
                  )}
                />
              ) : (
                <img
                  src={logo}
                  alt="Monteiro Seguros e Benefícios"
                  style={{ 
                     '--logo-scale': `${(settings?.logoScale || 150) / 100}`,
                     '--logo-scale-mobile': `${(settings?.logoScaleMobile || 130) / 100}`
                  } as React.CSSProperties}
                  className={cn(
                    "h-16 md:h-20 w-auto object-contain transition-all duration-500 origin-left",
                    "scale-[var(--logo-scale-mobile)] md:scale-[var(--logo-scale)] group-hover:scale-[calc(var(--logo-scale-mobile)*1.03)] md:group-hover:scale-[calc(var(--logo-scale)*1.03)]"
                  )}
                />
              )}
            </div>
            
            {/* Terracota brand subtitle */}
            <span className="text-[#c65f54]/40 font-light text-sm sm:text-base md:text-xl select-none -ml-0.5 sm:-ml-1 md:-ml-2 mr-1 sm:mr-1.5">
              |
            </span>
            <span className="text-[#c65f54] font-display font-semibold tracking-wider text-[10px] sm:text-xs md:text-sm lg:text-base whitespace-nowrap select-none uppercase">
              Seguros e Benefícios
            </span>
          </a>
        </Link>
 
        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = location === link.href;
            return (
              <Link key={link.name} href={link.href}>
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
                <Link href="/profile">
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
                <Link href={user.role === "client" ? "/dashboard" : "/admin"}>
                  <a className={cn(
                    "text-sm font-bold flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all duration-300 shadow-sm bg-[#c65f54] text-white hover:bg-[#c65f54]/90"
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
                    "p-2.5 rounded-2xl transition-all duration-300 border border-transparent text-white/60 hover:text-red-400 hover:bg-white/10"
                  )}
                  title="Sair"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <>
                <Link href="/login">
                  <a className={cn(
                    "text-sm font-bold cursor-pointer transition-colors duration-300 text-white hover:text-[#c65f54]"
                  )}>
                    Entrar
                  </a>
                </Link>
                <Link href="/contact">
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
 
        {/* Mobile Menu Button */}
        <button
          className={cn(
            "md:hidden p-2.5 rounded-2xl transition-colors duration-300 border bg-white/10 border-white/10 text-white hover:bg-white/20"
          )}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Nav Overlay */}
      <div
        className={cn(
          "md:hidden fixed inset-0 bg-[#eae4da] z-40 transition-all duration-500 flex flex-col items-center justify-center gap-6",
          isOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-8 pointer-events-none"
        )}
      >
        <div className="absolute top-6 left-6">
          <img src={logo} alt="Logo" className="h-10 w-auto brightness-0" />
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-6 right-6 p-2.5 rounded-2xl bg-white/50 border border-[#809ba6]/20 text-[#163b52]"
        >
          <X className="h-5 w-5" />
        </button>

        {navLinks.map((link) => (
          <Link key={link.name} href={link.href}>
            <a
              onClick={handleLinkClick}
              className={cn(
                "text-2xl font-display font-bold transition-all duration-300 cursor-pointer",
                location === link.href ? "text-[#c65f54]" : "text-[#163b52]"
              )}
            >
              {link.name}
            </a>
          </Link>
        ))}

        {user ? (
          <>
            <Link href={user.role === "client" ? "/dashboard" : "/admin"}>
              <a
                onClick={handleLinkClick}
                className="text-2xl font-display font-bold text-[#08454c] hover:text-[#c65f54] transition-colors cursor-pointer"
              >
                {user.role === "client" ? "Minha Conta" : "Painel Admin"}
              </a>
            </Link>
            <button
              onClick={() => {
                logoutMutation.mutate();
                handleLinkClick();
              }}
              className="text-2xl font-display font-bold text-red-600 hover:text-red-700 transition-colors cursor-pointer mt-4"
            >
              Sair
            </button>
          </>
        ) : (
          <div className="flex flex-col gap-4 w-full px-12 mt-6">
            <Link href="/login">
              <a
                onClick={handleLinkClick}
                className="text-center py-3.5 rounded-2xl font-bold border border-[#809ba6]/30 text-[#163b52] bg-white hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Entrar
              </a>
            </Link>
            <Link href="/contact">
              <button
                onClick={handleLinkClick}
                className="text-center py-4 rounded-2xl font-bold bg-[#c65f54] text-white hover:bg-[#c65f54]/95 transition-all shadow-md shadow-[#c65f54]/10 cursor-pointer"
              >
                Solicitar Cotação
              </button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
