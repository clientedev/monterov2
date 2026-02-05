import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function AdminSettings() {
    const [primaryColor, setPrimaryColor] = useState("#0ea5e9");
    const [secondaryColor, setSecondaryColor] = useState("#64748b");
    const [heroImage, setHeroImage] = useState("");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        api.get("/config").then(res => {
            if (res.data) {
                setPrimaryColor(res.data.primaryColor || "#0ea5e9");
                setSecondaryColor(res.data.secondaryColor || "#64748b");
                setHeroImage(res.data.heroImage || "");
            }
        });
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post("/admin/config", { primaryColor, secondaryColor, heroImage });
            toast({ title: "Configurações salvas!" });
            // Ideally reload page or update context to apply new colors
        } catch {
            toast({ variant: "destructive", title: "Erro ao salvar" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout title="Configurações do Site">
            <Card className="max-w-2xl">
                <CardHeader><CardTitle>Aparência</CardTitle></CardHeader>
                <CardContent>
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Cor Primária</Label>
                                <div className="flex gap-2 items-center mt-2">
                                    <Input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-12 h-12 p-1" />
                                    <Input value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} />
                                </div>
                            </div>
                            <div>
                                <Label>Cor Secundária</Label>
                                <div className="flex gap-2 items-center mt-2">
                                    <Input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="w-12 h-12 p-1" />
                                    <Input value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} />
                                </div>
                            </div>
                        </div>
                        <div>
                            <Label>Imagem Padrão (Hero)</Label>
                            <Input value={heroImage} onChange={e => setHeroImage(e.target.value)} placeholder="URL da imagem (backup)" />
                        </div>
                        <Button type="submit" disabled={loading}>{loading ? "Salvando..." : "Salvar Alterações"}</Button>
                    </form>
                </CardContent>
            </Card>
        </AdminLayout>
    );
}
