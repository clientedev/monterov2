import { HeartPulse } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type LifeInsuranceFieldKey =
  | "lifeHeight"
  | "lifeWeight"
  | "lifeProfession"
  | "lifeIncome";

export interface LifeInsuranceValues {
  lifeHeight?: string | null;
  lifeWeight?: string | null;
  lifeProfession?: string | null;
  lifeIncome?: string | null;
}

const LIFE_FIELD_CONFIGS: Array<{
  key: LifeInsuranceFieldKey;
  label: string;
  placeholder: string;
}> = [
  { key: "lifeHeight", label: "Altura", placeholder: "Ex: 1,75 m" },
  { key: "lifeWeight", label: "Peso", placeholder: "Ex: 72 kg" },
  { key: "lifeProfession", label: "Profissão", placeholder: "Ex: Engenheiro, Empresário..." },
  { key: "lifeIncome", label: "Renda", placeholder: "Ex: R$ 8.000,00" },
];

interface LifeInsuranceFieldsSectionProps {
  values: LifeInsuranceValues;
  onChange: (field: LifeInsuranceFieldKey, value: string) => void;
  compact?: boolean;
}

/**
 * Optional life insurance underwriting fields rendered dynamically whenever
 * "Vida" / "Seguro de Vida" is selected in CRM forms.
 */
export function LifeInsuranceFieldsSection({
  values,
  onChange,
  compact = false,
}: LifeInsuranceFieldsSectionProps) {
  return (
    <div className="rounded-2xl border border-rose-200/80 bg-rose-50/40 p-4 space-y-3 animate-in fade-in duration-200">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <HeartPulse className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-rose-900">
            Dados para Seguro de Vida
          </span>
        </div>
        <span className="text-[10px] font-semibold text-rose-600 bg-white/80 border border-rose-200 px-2 py-0.5 rounded-full">
          Campos Opcionais
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {LIFE_FIELD_CONFIGS.map((cfg) => (
          <div key={cfg.key} className="space-y-1">
            <Label className="text-xs font-semibold text-slate-700">
              {cfg.label}
            </Label>
            <Input
              value={values[cfg.key] || ""}
              onChange={(e) => onChange(cfg.key, e.target.value)}
              placeholder={cfg.placeholder}
              className={`bg-white border-rose-200/70 focus:border-rose-400 rounded-xl ${
                compact ? "h-9 text-xs" : "h-10 text-sm"
              }`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Compact summary display for cards and detail modals when any life field is filled. */
export function LifeInsuranceSummary({
  values,
  variant = "card",
}: {
  values: LifeInsuranceValues;
  variant?: "card" | "detail";
}) {
  const filled = LIFE_FIELD_CONFIGS.filter((cfg) => Boolean(values[cfg.key]?.trim()));
  if (filled.length === 0) return null;

  if (variant === "card") {
    return (
      <div className="flex flex-wrap gap-1.5 bg-rose-50/70 border border-rose-100 rounded-lg px-2.5 py-1.5 mb-3 text-[11px] text-rose-900">
        {filled.map((cfg) => (
          <span key={cfg.key} className="inline-flex items-center gap-1 bg-white/80 px-1.5 py-0.5 rounded border border-rose-200/60">
            <strong className="text-rose-700">{cfg.label}:</strong> {values[cfg.key]}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-rose-200/80 bg-rose-50/40 p-3.5 space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-bold text-rose-900 uppercase tracking-wider">
        <HeartPulse className="h-3.5 w-3.5 text-rose-600" />
        Dados para Seguro de Vida
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        {filled.map((cfg) => (
          <div key={cfg.key}>
            <p className="text-[11px] text-rose-700/80 uppercase font-semibold">{cfg.label}</p>
            <p className="font-semibold text-slate-800">{values[cfg.key]}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
