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

  const handleLinkClick = () => setIsOpen(false);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out",
        scrolled
          ? (location === "/blog" ? "bg-slate-900/95 backdrop-blur-md shadow-sm py-0 border-b border-white/10" : "bg-white/95 backdrop-blur-md shadow-sm py-0")
          : (location === "/blog" ? "bg-slate-900 py-0 border-b border-white/10" : "bg-transparent py-0")
      )}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        <Link href="/">
          <a className="flex items-center gap-10 group cursor-pointer">
            <div className="relative h-16 md:h-20 flex items-center">
              {settings?.logoBase64 ? (
                <img
                  src={settings.logoBase64}
                  alt={settings.siteName}
                  className={cn(
                    "h-16 md:h-20 w-auto object-contain transition-all duration-300 group-hover:scale-110 origin-left",
                    scrolled && "brightness-0"
                  )}
                />
              ) : (
                <img
                  src={logo}
                  alt="Monteiro Seguros e Benefícios"
                  className={cn(
                    "h-16 md:h-20 w-auto object-contain transition-all duration-300 group-hover:scale-110 origin-left",
                    scrolled && "brightness-0"
                  )}
                />
              )}
            </div>
            <div className={cn(
              "hidden sm:flex items-center gap-3 transition-colors duration-300 border-l pl-4",
              (scrolled || location !== "/") && location !== "/blog" ? "text-slate-500 border-slate-200" : "text-white/70 border-white/20"
            )}>
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase leading-tight">Seguros & Benefícios</span>
            </div>
          </a>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link key={link.name} href={link.href}>
              <a
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-primary after:transition-all after:duration-300 hover:after:w-full cursor-pointer",
                  (scrolled || location !== "/") && location !== "/blog" ? "text-slate-600" : "text-white/90 hover:text-white"
                )}
              >
                {link.name}
              </a>
            </Link>
          ))}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <Link href="/profile">
                  <a className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all group/avatar",
                    scrolled || location !== "/" 
                      ? "bg-slate-100 hover:bg-slate-200" 
                      : "bg-white/10 hover:bg-white/20 backdrop-blur-sm"
                  )} title="Meu Perfil (Editar Foto)">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="h-6 w-6 rounded-full object-cover group-hover/avatar:opacity-70 transition-opacity" />
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <UserIcon className="h-4 w-4 text-amber-600" />
                      </div>
                    )}
                  </a>
                </Link>
                <Link href={user.role === "client" ? "/dashboard" : "/admin"}>
                  <a className={cn(
                    "text-sm font-bold flex items-center gap-2 px-4 py-2 rounded-xl transition-all",
                    scrolled || location !== "/" 
                      ? "bg-slate-100 text-slate-900 hover:bg-slate-200" 
                      : "bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
                  )}>
                    <LayoutDashboard className="h-4 w-4 text-amber-500" />
                    <span className="hidden lg:inline">
                      {user.role === "client" ? "Área do Cliente" : "Painel Admin"}
                    </span>
                  </a>
                </Link>
                <button
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                  className={cn(
                    "p-2 rounded-xl transition-colors",
                    scrolled || location !== "/" ? "text-slate-400 hover:text-red-500 hover:bg-red-50" : "text-white/60 hover:text-white hover:bg-white/10"
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
                    "text-sm font-medium cursor-pointer transition-colors hover:text-primary",
                    (scrolled || location !== "/") && location !== "/blog" ? "text-slate-600" : "text-white/90 hover:text-white"
                  )}>
                    Entrar
                  </a>
                </Link>
                <Link href="/contact">
                  <button className={cn(
                    "px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg cursor-pointer",
                    (scrolled || location !== "/") && location !== "/blog"
                      ? "bg-primary text-white hover:bg-primary/90"
                      : "bg-white text-primary hover:bg-white/90"
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
          className="md:hidden p-2 rounded-full hover:bg-slate-100 transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <X className={scrolled || location !== "/" ? "text-slate-800" : "text-white"} />
          ) : (
            <Menu className={scrolled || location !== "/" ? "text-slate-800" : "text-white"} />
          )}
        </button>
      </div>

      {/* Mobile Nav Overlay */}
      <div
        className={cn(
          "md:hidden fixed inset-0 bg-white/95 backdrop-blur-lg z-40 transition-all duration-300 flex flex-col items-center justify-center gap-8",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      >
        <Link href="/blog">
          <a
            onClick={handleLinkClick}
            className="text-2xl font-display font-medium text-slate-900 hover:text-primary transition-colors cursor-pointer"
          >
            Blog
          </a>
        </Link>
        {user ? (
          <>
            <Link href={user.role === "client" ? "/dashboard" : "/admin"}>
              <a
                onClick={handleLinkClick}
                className="text-2xl font-display font-medium text-slate-900 hover:text-primary transition-colors cursor-pointer"
              >
                {user.role === "client" ? "Minha Conta" : "Painel Admin"}
              </a>
            </Link>
            <button
              onClick={() => {
                logoutMutation.mutate();
                handleLinkClick();
              }}
              className="text-2xl font-display font-medium text-red-600 hover:text-red-700 transition-colors cursor-pointer"
            >
              Sair
            </button>
          </>
        ) : (
          <Link href="/login">
            <a
              onClick={handleLinkClick}
              className="text-2xl font-display font-medium text-slate-900 hover:text-primary transition-colors cursor-pointer"
            >
              Entrar
            </a>
          </Link>
        )}
      </div>
    </header>
  );
}
