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
        className="group relative bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer overflow-hidden h-full flex flex-col"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -z-10 transition-transform duration-500 group-hover:scale-150" />
        
        <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center mb-8 group-hover:bg-primary group-hover:text-white transition-all duration-500 text-primary group-hover:scale-110 group-hover:-rotate-3">
          <Icon className="w-8 h-8" />
        </div>
        
        <h3 className="text-2xl font-display font-bold mb-4 text-slate-900 group-hover:text-primary transition-colors flex-1">
          {service.title}
        </h3>
        
        <p className="text-slate-600 mb-8 leading-relaxed line-clamp-3">
          {service.description}
        </p>
        
        <div className="flex items-center gap-2 text-sm font-bold text-primary opacity-0 group-hover:opacity-100 transform translate-x-[-20px] group-hover:translate-x-0 transition-all duration-500 uppercase tracking-widest mt-auto">
          <span>Saiba mais</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </motion.div>
    </Link>
  );
}
