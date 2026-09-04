import { useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

interface ProductSelectorProps {
    value?: string | null;
    onChange: (value: string) => void;
    className?: string;
}

export function ProductSelector({ value = "", onChange, className = "" }: ProductSelectorProps) {
    // Derive selection state directly from controlled `value` prop
    const { selectedStandard, isOutroSelected, outroText } = useMemo(() => {
        const raw = value || "";
        if (!raw) {
            return { selectedStandard: [], isOutroSelected: false, outroText: "" };
        }

        const items = raw.split(",").map((s) => s.trim()).filter(Boolean);
        const standard: string[] = [];
        let hasOutro = false;
        let customVal = "";

        for (const item of items) {
            if (STANDARD_PRODUCTS.includes(item as any)) {
                standard.push(item);
            } else {
                hasOutro = true;
                customVal = item.replace(/^Outro:\s*/i, "");
            }
        }

        return { selectedStandard: standard, isOutroSelected: hasOutro, outroText: customVal };
    }, [value]);

    const emitChange = (standards: string[], outroActive: boolean, customText: string) => {
        const result: string[] = [...standards];
        if (outroActive) {
            const formattedOutro = customText.trim() ? `Outro: ${customText.trim()}` : "Outro";
            result.push(formattedOutro);
        }
        onChange(result.join(", "));
    };

    const handleStandardToggle = (prod: string, checked: boolean) => {
        let updated: string[];
        if (checked) {
            updated = [...selectedStandard, prod];
        } else {
            updated = selectedStandard.filter((p) => p !== prod);
        }
        emitChange(updated, isOutroSelected, outroText);
    };

    const handleOutroToggle = (checked: boolean) => {
        emitChange(selectedStandard, checked, outroText);
    };

    const handleOutroTextChange = (text: string) => {
        emitChange(selectedStandard, isOutroSelected, text);
    };

    return (
        <div className={`space-y-3 ${className}`}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-slate-50/70 p-3 rounded-xl border border-slate-200">
                {STANDARD_PRODUCTS.map((prod) => {
                    const isChecked = selectedStandard.includes(prod);
                    return (
                        <div
                            key={prod}
                            className={`flex items-center space-x-2 p-2.5 rounded-xl transition-all cursor-pointer border select-none ${
                                isChecked
                                    ? "bg-primary/10 border-primary/30 text-primary font-bold shadow-sm"
                                    : "bg-white border-slate-200 hover:bg-slate-100/80 text-slate-700 font-medium"
                            }`}
                            onClick={() => handleStandardToggle(prod, !isChecked)}
                        >
                            <Checkbox
                                checked={isChecked}
                                tabIndex={-1}
                                className="pointer-events-none shrink-0"
                            />
                            <span className="text-xs select-none truncate">
                                {prod}
                            </span>
                        </div>
                    );
                })}

                {/* Outro Checkbox */}
                <div
                    className={`flex items-center space-x-2 p-2.5 rounded-xl transition-all cursor-pointer border select-none ${
                        isOutroSelected
                            ? "bg-amber-50 border-amber-300 text-amber-900 font-bold shadow-sm"
                            : "bg-white border-slate-200 hover:bg-slate-100/80 text-slate-700 font-medium"
                    }`}
                    onClick={() => handleOutroToggle(!isOutroSelected)}
                >
                    <Checkbox
                        checked={isOutroSelected}
                        tabIndex={-1}
                        className="pointer-events-none shrink-0"
                    />
                    <span className="text-xs select-none truncate">
                        Outro...
                    </span>
                </div>
            </div>

            {/* Custom text input when "Outro" is checked */}
            {isOutroSelected && (
                <div className="pl-1 pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    <Label className="text-xs font-bold text-amber-800 mb-1 block">
                        Especifique o produto "Outro":
                    </Label>
                    <Input
                        placeholder="Digite o nome do produto (ex: Seguro Carga, RC Profissional...)"
                        value={outroText}
                        onChange={(e) => handleOutroTextChange(e.target.value)}
                        className="rounded-xl h-10 border-amber-300 focus-visible:ring-amber-500 text-sm bg-white"
                    />
                </div>
            )}
        </div>
    );
}

