import { useState, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageIcon, X, UploadCloud, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
    value?: string | null;
    onChange: (value: string) => void;
    label?: string;
    description?: string;
}

export function ImageUpload({ value, onChange, label, description }: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(value || null);

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            alert("A imagem deve ter no máximo 2MB");
            return;
        }

        setIsUploading(true);
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            setPreview(base64String);
            onChange(base64String);
            setIsUploading(false);
        };
        reader.readAsDataURL(file);
    };

    const removeImage = () => {
        setPreview(null);
        onChange("");
    };

    return (
        <div className="space-y-4">
            {label && <Label className="text-sm font-semibold text-gray-700">{label}</Label>}
            {description && <p className="text-xs text-muted-foreground">{description}</p>}

            <div className={cn(
                "relative group flex flex-col items-center justify-center w-full min-h-[160px] p-6 border-2 border-dashed rounded-xl transition-all duration-300",
                preview
                    ? "border-primary/20 bg-primary/5"
                    : "border-gray-200 bg-gray-50 hover:border-primary/30 hover:bg-primary/5"
            )}>
                {preview ? (
                    <div className="relative w-full h-full flex flex-col items-center">
                        <img
                            src={preview}
                            alt="Preview"
                            className="max-h-[200px] rounded-lg object-contain shadow-sm mb-4"
                        />
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-primary flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Imagem selecionada
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={removeImage}
                                className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                                <X className="h-4 w-4 mr-1" /> Remover
                            </Button>
                        </div>
                    </div>
                ) : (
                    <Label className="cursor-pointer flex flex-col items-center gap-3">
                        <div className="p-3 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform duration-300">
                            <UploadCloud className="h-6 w-6 text-primary" />
                        </div>
                        <div className="text-center">
                            <span className="text-sm font-semibold text-primary">Clique para enviar</span>
                            <p className="text-xs text-muted-foreground mt-1">PNG, JPG ou WEBP (Max. 2MB)</p>
                        </div>
                        <Input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                            disabled={isUploading}
                        />
                    </Label>
                )}
            </div>
        </div>
    );
}
