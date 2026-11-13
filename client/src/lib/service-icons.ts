import { Shield, Car, Heart, Briefcase, Home, Activity, Users, Smile, HeartHandshake } from "lucide-react";

const iconMap: Record<string, any> = {
  Shield, Car, Heart, Briefcase, Home, Activity, Users, Smile, HeartHandshake,
};

// Ícone de cada serviço: pelo tipo de plano (título) e, se não reconhecer, pelo nome salvo no cadastro.
export function getServiceIcon(service: { title?: string | null; icon?: string | null }) {
  const title = (service.title || "").toLowerCase();
  if (title.includes("odonto")) return Smile;
  if (title.includes("familiar") || title.includes("individual")) return Users;
  if (title.includes("empresarial") || title.includes("empresa") || title.includes("pme")) return Briefcase;
  if (title.includes("vida")) return Heart;
  return iconMap[service.icon || ""] || Shield;
}
