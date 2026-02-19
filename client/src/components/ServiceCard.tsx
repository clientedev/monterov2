import { motion } from "framer-motion";
import { ArrowRight, Shield, Car, Heart, Briefcase, Home, Activity } from "lucide-react";
import type { Service } from "@/hooks/use-content";

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="group bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
    >
      <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors duration-300 text-primary">
        <Icon className="w-7 h-7" />
      </div>

      <h3 className="text-xl font-display font-bold mb-3 text-slate-900 group-hover:text-primary transition-colors">
        {service.title}
      </h3>

      <p className="text-slate-500 mb-6 leading-relaxed">
        {service.description}
      </p>

      <div className="flex items-center gap-2 text-sm font-semibold text-primary opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300">
        <span>Saiba mais</span>
        <ArrowRight className="w-4 h-4" />
      </div>
    </motion.div>
  );
}
