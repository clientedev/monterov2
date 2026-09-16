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

        if (file.size > 20 * 1024 * 1024) {
            alert("A imagem deve ter no máximo 20MB");
            return;
        }

        setIsUploading(true);
        try {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    let width = img.width;
                    let height = img.height;
                    const maxWidth = 1200;
                    const maxHeight = 1200;

                    if (width > maxWidth || height > maxHeight) {
                        if (width > height) {
                            height = Math.round((height * maxWidth) / width);
                            width = maxWidth;
                        } else {
                            width = Math.round((width * maxHeight) / height);
                            height = maxHeight;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext("2d");
                    if (ctx) {
                        ctx.drawImage(img, 0, 0, width, height);
                        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.82);
                        setPreview(compressedBase64);
                        onChange(compressedBase64);
                    } else {
                        const raw = event.target?.result as string;
                        setPreview(raw);
                        onChange(raw);
                    }
                    setIsUploading(false);
                };
                img.onerror = () => {
                    const raw = event.target?.result as string;
                    setPreview(raw);
                    onChange(raw);
                    setIsUploading(false);
                };
                img.src = event.target?.result as string;
            };
            reader.readAsDataURL(file);
        } catch {
            setIsUploading(false);
        }
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
                "relative group flex flex-col items-center justify-center w-full transition-all duration-300 rounded-xl",
                preview
                    ? "border border-primary/20 bg-primary/5 p-3 min-h-[110px]"
                    : "border-2 border-dashed border-gray-200 bg-gray-50 hover:border-primary/30 hover:bg-primary/5 p-6 min-h-[160px]"
            )}>
                {preview ? (
                    <div className="relative w-full h-full flex flex-col items-center">
                        <img
                            src={preview}
                            alt="Preview"
                            className="max-h-[100px] rounded-lg object-contain shadow-sm mb-2"
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
