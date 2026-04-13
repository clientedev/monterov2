import { motion } from "framer-motion";
import { ArrowRight, Shield, Car, Heart, Briefcase, Home, Activity } from "lucide-react";
import type { Service } from "@shared/schema";
import { Link } from "wouter";

const iconMap: Record<string, any> = {
  Shield, Car, Heart, Briefcase, Home, Activity
};

interface ServiceCardProps {
  service: Service;
  index: number;
}

export function ServiceCard({ service, index }: ServiceCardProps) {
  const Icon = iconMap[service.icon] || Shield;

  return (
    <Link href={`/services/${service.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: index * 0.1 }}
        viewport={{ once: true, margin: "-50px" }}
        className="group relative bg-white rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer overflow-hidden h-full flex flex-col"
      >
        {/* Dark Header Area for the White Title */}
        <div className="bg-[#08454c] p-8 pb-10 relative overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-primary/20 mix-blend-overlay z-0" />
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
          
          <div className="relative z-10 w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500 text-white">
            <Icon className="w-7 h-7" />
          </div>
          
          <h3 className="text-2xl font-display font-bold text-white leading-tight relative z-10">
            {service.title}
          </h3>
        </div>
        
        <div className="p-8 pt-6 flex-1 flex flex-col">
          <p className="text-slate-600 mb-8 leading-relaxed line-clamp-3 text-sm">
            {service.description}
          </p>
          
          <div className="flex items-center gap-2 text-sm font-bold text-primary group-hover:translate-x-1 transition-all duration-500 uppercase tracking-widest mt-auto">
            <span>Explorar Solução</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
