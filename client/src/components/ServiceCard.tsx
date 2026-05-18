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
        transition={{ duration: 0.6, delay: index * 0.08 }}
        viewport={{ once: true, margin: "-50px" }}
        className="group relative bg-white rounded-[2.5rem] p-8 border border-slate-100 hover:shadow-[0_24px_50px_rgba(8,69,76,0.06)] hover:-translate-y-2 transition-all duration-500 cursor-pointer overflow-hidden h-full flex flex-col justify-between"
      >
        {/* Glow effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-[#08454c]/[0.01] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        <div className="relative z-10 flex-grow flex flex-col">
          {/* Icon Container */}
          <div className="w-14 h-14 rounded-2xl bg-[#08454c]/5 border border-[#08454c]/10 flex items-center justify-center mb-6 group-hover:bg-[#08454c] group-hover:border-[#08454c] group-hover:text-white transition-all duration-500 text-[#08454c]">
            <Icon className="w-6 h-6" />
          </div>

          {/* Service Title */}
          <h3 className="text-2xl font-display font-bold text-[#163b52] mb-4 leading-tight group-hover:text-[#08454c] transition-colors duration-300">
            {service.title}
          </h3>

          {/* Service Description */}
          <p className="text-slate-600 mb-8 leading-relaxed text-sm font-light line-clamp-3">
            {service.description}
          </p>
        </div>

        {/* Explore Button */}
        <div className="relative z-10 flex items-center gap-2 text-xs font-bold text-[#c65f54] group-hover:gap-3 transition-all duration-300 uppercase tracking-widest mt-auto">
          <span>Explorar Solução</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </div>
      </motion.div>
    </Link>
  );
}
