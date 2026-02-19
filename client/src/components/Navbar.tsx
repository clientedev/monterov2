import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Menu, X, LayoutDashboard, LogOut, User as UserIcon } from "lucide-react";
import logo from "@assets/image_1770228718109.png";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Início", href: "/" },
    { name: "Serviços", href: "/#services" },
    { name: "Sobre", href: "/about" },
    { name: "Blog", href: "/blog" },
    { name: "Contato", href: "/contact" },
  ];

  if (user) {
    navLinks.push({ name: "Meus Artigos", href: "/my-articles" });
  }

  const handleLinkClick = () => setIsOpen(false);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out",
        scrolled
          ? "bg-white/90 backdrop-blur-md shadow-sm py-4"
          : "bg-transparent py-6"
      )}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative overflow-hidden rounded-lg">
            <img 
              src={logo} 
              alt="Monteiro Corretora" 
              className={cn(
                "h-12 w-auto object-contain transition-all duration-300 group-hover:scale-105",
                scrolled || location !== "/" ? "brightness-0" : ""
              )}
            />
          </div>
          <div className={cn(
            "flex flex-col font-display leading-tight transition-colors duration-300",
             scrolled || location !== "/" ? "text-foreground" : "text-white"
          )}>
            <span className="text-xl font-bold tracking-tight">Monteiro</span>
            <span className="text-sm font-medium opacity-90">Corretora</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-primary after:transition-all after:duration-300 hover:after:w-full",
                scrolled || location !== "/" ? "text-muted-foreground" : "text-white/90 hover:text-white"
              )}
            >
              {link.name}
            </Link>
          ))}
          <div className="flex items-center gap-4">
            {isAdmin && (
              <Link href="/admin">
                <button className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300",
                  scrolled || location !== "/"
                    ? "bg-slate-100 text-slate-900 hover:bg-slate-200"
                    : "bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm"
                )}>
                  <LayoutDashboard className="w-4 h-4" />
                  Painel Admin
                </button>
              </Link>
            )}

            {user ? (
              <div className="flex items-center gap-4">
                <Link href="/profile">
                  <div className={cn(
                    "flex items-center gap-2 text-sm font-medium cursor-pointer hover:text-primary transition-colors",
                    scrolled || location !== "/" ? "text-foreground" : "text-white"
                  )}>
                    <UserIcon className="w-4 h-4" />
                    <span>{user.username}</span>
                  </div>
                </Link>
                <button 
                  onClick={logout}
                  className={cn(
                    "text-sm font-medium cursor-pointer transition-colors hover:text-red-500",
                    scrolled || location !== "/" ? "text-muted-foreground" : "text-white/90 hover:text-white"
                  )}
                >
                  Sair
                </button>
              </div>
            ) : (
              <Link href="/login">
                <span className={cn(
                  "text-sm font-medium cursor-pointer transition-colors hover:text-primary",
                  scrolled || location !== "/" ? "text-muted-foreground" : "text-white/90 hover:text-white"
                )}>
                  Entrar
                </span>
              </Link>
            )}

            {!user && (
              <Link href="/contact">
                <button className={cn(
                  "px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg",
                  scrolled || location !== "/"
                    ? "bg-primary text-white hover:bg-primary/90"
                    : "bg-white text-primary hover:bg-white/90"
                )}>
                  Solicitar Cotação
                </button>
              </Link>
            )}
          </div>
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded-full hover:bg-black/5 transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <X className={scrolled || location !== "/" ? "text-foreground" : "text-white"} />
          ) : (
            <Menu className={scrolled || location !== "/" ? "text-foreground" : "text-white"} />
          )}
        </button>
      </div>

      {/* Mobile Nav Overlay */}
      <div
        className={cn(
          "md:hidden fixed inset-0 bg-background/95 backdrop-blur-lg z-40 transition-all duration-300 flex flex-col items-center justify-center gap-8",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      >
        {navLinks.map((link) => (
          <Link
            key={link.name}
            href={link.href}
            onClick={handleLinkClick}
            className="text-2xl font-display font-medium text-foreground hover:text-primary transition-colors"
          >
            {link.name}
          </Link>
        ))}

        {isAdmin && (
          <Link
            href="/admin"
            onClick={handleLinkClick}
            className="text-2xl font-display font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-2"
          >
            <LayoutDashboard className="w-6 h-6" />
            Painel Admin
          </Link>
        )}

        {user ? (
          <div className="flex flex-col items-center gap-6">
            <div className="text-2xl font-display font-medium text-foreground flex items-center gap-2">
              <UserIcon className="w-6 h-6" />
              {user.username}
            </div>
            <button
              onClick={() => {
                logout();
                handleLinkClick();
              }}
              className="text-2xl font-display font-medium text-red-500 hover:text-red-600 transition-colors flex items-center gap-2"
            >
              <LogOut className="w-6 h-6" />
              Sair
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            onClick={handleLinkClick}
            className="text-2xl font-display font-medium text-foreground hover:text-primary transition-colors"
          >
            Entrar
          </Link>
        )}
      </div>
    </header>
  );
}
