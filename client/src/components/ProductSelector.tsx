import { useState, useEffect } from "react";
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
    const [selectedStandard, setSelectedStandard] = useState<string[]>([]);
    const [isOutroSelected, setIsOutroSelected] = useState<boolean>(false);
    const [outroText, setOutroText] = useState<string>("");

    // Synchronize component internal state with prop `value`
    useEffect(() => {
        if (!value) {
            setSelectedStandard([]);
            setIsOutroSelected(false);
            setOutroText("");
            return;
        }

        const items = value.split(",").map((s) => s.trim()).filter(Boolean);
        const standard: string[] = [];
        let hasOutro = false;
        let customVal = "";

        for (const item of items) {
            if (STANDARD_PRODUCTS.includes(item as any)) {
                standard.push(item);
            } else {
                hasOutro = true;
                const clean = item.replace(/^Outro:\s*/i, "");
                customVal = clean;
            }
        }

        setSelectedStandard(standard);
        setIsOutroSelected(hasOutro);
        setOutroText(customVal);
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
        setSelectedStandard(updated);
        emitChange(updated, isOutroSelected, outroText);
    };

    const handleOutroToggle = (checked: boolean) => {
        setIsOutroSelected(checked);
        emitChange(selectedStandard, checked, outroText);
    };

    const handleOutroTextChange = (text: string) => {
        setOutroText(text);
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
                            className={`flex items-center space-x-2 p-2 rounded-lg transition-colors cursor-pointer border ${
                                isChecked
                                    ? "bg-primary/10 border-primary/30 text-primary font-bold"
                                    : "bg-white border-slate-200 hover:bg-slate-100 text-slate-700 font-medium"
                            }`}
                            onClick={() => handleStandardToggle(prod, !isChecked)}
                        >
                            <Checkbox
                                id={`prod-${prod}`}
                                checked={isChecked}
                                onCheckedChange={(c) => handleStandardToggle(prod, !!c)}
                                onClick={(e) => e.stopPropagation()}
                            />
                            <Label
                                htmlFor={`prod-${prod}`}
                                className="text-xs cursor-pointer select-none truncate"
                            >
                                {prod}
                            </Label>
                        </div>
                    );
                })}

                {/* Outro Checkbox */}
                <div
                    className={`flex items-center space-x-2 p-2 rounded-lg transition-colors cursor-pointer border ${
                        isOutroSelected
                            ? "bg-amber-50 border-amber-300 text-amber-900 font-bold"
                            : "bg-white border-slate-200 hover:bg-slate-100 text-slate-700 font-medium"
                    }`}
                    onClick={() => handleOutroToggle(!isOutroSelected)}
                >
                    <Checkbox
                        id="prod-outro"
                        checked={isOutroSelected}
                        onCheckedChange={(c) => handleOutroToggle(!!c)}
                        onClick={(e) => e.stopPropagation()}
                    />
                    <Label htmlFor="prod-outro" className="text-xs cursor-pointer select-none">
                        Outro...
                    </Label>
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
