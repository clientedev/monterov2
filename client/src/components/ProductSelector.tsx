import { useMemo, useRef } from "react";
import { Input } from "@/components/ui/input";

export const STANDARD_PRODUCTS = [
    "Plano de Saúde",
    "Vida",
    "Odonto",
    "Auto",
    "Pet",
    "Viagem",
    "Residência",
    "Benefícios",
    "Previdência",
] as const;

type StandardProduct = typeof STANDARD_PRODUCTS[number];

interface ProductSelectorProps {
    value?: string | null;
    onChange: (value: string) => void;
    className?: string;
}

/**
 * ProductSelector — fully controlled, zero-state component.
 * Uses plain <button> elements to avoid Radix Checkbox's internal state
 * conflicting with parent onClick, which causes React Error #185
 * (too many re-renders) when nested inside react-hook-form's FormControl.
 */
export function ProductSelector({ value = "", onChange, className = "" }: ProductSelectorProps) {
    // Derive state purely from the controlled `value` prop — no useState/useEffect
    const { selectedStandard, isOutroSelected, outroText } = useMemo(() => {
        const raw = (value || "").trim();
        if (!raw) return { selectedStandard: [] as string[], isOutroSelected: false, outroText: "" };

        const items = raw.split(",").map((s) => s.trim()).filter(Boolean);
        const standard: string[] = [];
        let hasOutro = false;
        let customVal = "";

        for (const item of items) {
            if ((STANDARD_PRODUCTS as readonly string[]).includes(item)) {
                standard.push(item);
            } else {
                hasOutro = true;
                customVal = item.replace(/^Outro:\s*/i, "");
            }
        }

        return { selectedStandard: standard, isOutroSelected: hasOutro, outroText: customVal };
    }, [value]);

    // Build and emit the new comma-separated string
    const emit = (standards: string[], outroActive: boolean, customText: string) => {
        const parts: string[] = [...standards];
        if (outroActive) {
            parts.push(customText.trim() ? `Outro: ${customText.trim()}` : "Outro");
        }
        onChange(parts.join(", "));
    };

    const toggleStandard = (prod: string) => {
        const isChecked = selectedStandard.includes(prod);
        const updated = isChecked
            ? selectedStandard.filter((p) => p !== prod)
            : [...selectedStandard, prod];
        emit(updated, isOutroSelected, outroText);
    };

    const toggleOutro = () => {
        emit(selectedStandard, !isOutroSelected, outroText);
    };

    const handleOutroText = (e: React.ChangeEvent<HTMLInputElement>) => {
        emit(selectedStandard, isOutroSelected, e.target.value);
    };

    return (
        <div className={`space-y-3 ${className}`}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50/70 p-3 rounded-xl border border-slate-200">
                {STANDARD_PRODUCTS.map((prod) => {
                    const checked = selectedStandard.includes(prod);
                    return (
                        <button
                            key={prod}
                            type="button"
                            onClick={() => toggleStandard(prod)}
                            className={`flex items-center gap-2 p-2.5 rounded-xl text-left text-xs font-medium select-none transition-all border ${
                                checked
                                    ? "bg-primary/10 border-primary/40 text-primary font-bold shadow-sm"
                                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                        >
                            {/* Custom checkbox indicator */}
                            <span
                                className={`h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                                    checked
                                        ? "bg-primary border-primary"
                                        : "bg-white border-slate-300"
                                }`}
                            >
                                {checked && (
                                    <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 12 12" fill="none">
                                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                )}
                            </span>
                            <span className="truncate">{prod}</span>
                        </button>
                    );
                })}

                {/* Outro button */}
                <button
                    type="button"
                    onClick={toggleOutro}
                    className={`flex items-center gap-2 p-2.5 rounded-xl text-left text-xs font-medium select-none transition-all border ${
                        isOutroSelected
                            ? "bg-amber-50 border-amber-300 text-amber-900 font-bold shadow-sm"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                >
                    <span
                        className={`h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                            isOutroSelected
                                ? "bg-amber-500 border-amber-500"
                                : "bg-white border-slate-300"
                        }`}
                    >
                        {isOutroSelected && (
                            <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 12 12" fill="none">
                                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        )}
                    </span>
                    <span className="truncate">Outro...</span>
                </button>
            </div>

            {/* Custom text input when "Outro" is selected */}
            {isOutroSelected && (
                <div className="pl-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    <label className="text-xs font-bold text-amber-800 mb-1 block">
                        Especifique o produto "Outro":
                    </label>
                    <Input
                        type="text"
                        placeholder="Ex: Seguro Carga, RC Profissional..."
                        value={outroText}
                        onChange={handleOutroText}
                        className="rounded-xl h-10 border-amber-300 focus-visible:ring-amber-500 text-sm bg-white"
                    />
                </div>
            )}
        </div>
    );
}
