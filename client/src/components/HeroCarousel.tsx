import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { HeroSlide } from "@/hooks/use-content";
import { Link } from "wouter";
import { ArrowRight, Star } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";

interface HeroCarouselProps {
    slides: HeroSlide[] | undefined;
}

export function HeroCarousel({ slides }: HeroCarouselProps) {
    const [emblaRef] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5000 })]);

    const defaultSlide = {
        image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2400",
        title: "Protegendo seu Futuro,\nGarantindo seu Legado",
        text: "Experimente a tranquilidade de uma cobertura completa. Combinamos expertise tradicional com eficiência moderna.",
        buttonText: "Cotação Gratuita",
        buttonLink: "/contact"
    };

    const displaySlides = slides && slides.length > 0 ? slides : [{ ...defaultSlide, id: 0 }];

    return (
        <div className="relative h-screen min-h-[600px] overflow-hidden bg-slate-900" ref={emblaRef}>
            <div className="flex h-full">
                {displaySlides.map((slide, index) => (
                    <div className="flex-[0_0_100%] min-w-0 relative h-full" key={slide.id || index}>
                        {/* Background */}
                        <div className="absolute inset-0 z-0">
                            <img
                                src={slide.image}
                                alt={slide.title}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-slate-900/60 mix-blend-multiply" />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
                        </div>

                        {/* Content */}
                        <div className="container relative z-10 px-4 md:px-6 mx-auto pt-20 h-full flex items-center">
                            <div className="max-w-3xl">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-medium mb-6">
                                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                    <span>Corretora de Seguros #1 em São Paulo</span>
                                </div>

                                <h1 className="text-5xl md:text-7xl font-display font-bold text-white leading-[1.1] mb-6 whitespace-pre-line">
                                    {slide.title}
                                </h1>

                                <p className="text-lg md:text-xl text-slate-200 mb-10 max-w-xl leading-relaxed">
                                    {slide.text}
                                </p>

                                <div className="flex flex-col sm:flex-row gap-4">
                                    {slide.buttonLink && (
                                        <Link href={slide.buttonLink}>
                                            <button className="px-8 py-4 rounded-full bg-primary text-white font-semibold text-lg hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-1 flex items-center justify-center gap-2">
                                                {slide.buttonText || "Saiba Mais"}
                                                <ArrowRight className="w-5 h-5" />
                                            </button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
