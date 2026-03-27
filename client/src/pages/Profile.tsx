import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, User } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ImageUpload } from "@/components/ImageUpload";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Loader2, User as UserIcon, Camera, Save, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function ProfilePage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [, setLocation] = useLocation();
    const [avatar, setAvatar] = useState<string | null>(user?.avatar || null);

    const updateProfileMutation = useMutation({
        mutationFn: async (data: { name: string; avatar: string | null }) => {
            const res = await apiRequest("PATCH", "/api/user/profile", data);
            return await res.json();
        },
        onSuccess: (updatedUser: User) => {
            queryClient.setQueryData(["/api/user"], updatedUser);
            toast({
                title: "Perfil atualizado!",
                description: "Suas alterações foram salvas com sucesso.",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Erro ao atualizar",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const [name, setName] = useState(user?.name || "");

    const handleSave = () => {
        if (!name.trim()) {
            toast({
                title: "Campo obrigatório",
                description: "O nome não pode ficar vazio.",
                variant: "destructive",
            });
            return;
        }
        updateProfileMutation.mutate({ name, avatar });
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col pt-24">
            <Navbar />

            <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto">
                    <Button 
                        variant="ghost" 
                        onClick={() => window.history.back()}
                        className="mb-8 text-slate-500 hover:text-slate-900 transition-colors gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" /> Voltar
                    </Button>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Sidebar: Profile Summary */}
                        <div className="lg:col-span-1">
                            <Card className="rounded-3xl border-none shadow-xl shadow-slate-200/50 overflow-hidden sticky top-32">
                                <div className="h-24 bg-primary" />
                                <CardContent className="pt-0 relative">
                                    <div className="flex justify-center">
                                        <div className="-mt-12 relative">
                                            <div className="h-24 w-24 rounded-full border-4 border-white bg-slate-100 overflow-hidden shadow-lg flex items-center justify-center">
                                                {avatar ? (
                                                    <img src={avatar} alt={user.name} className="h-full w-full object-cover" />
                                                ) : (
                                                    <UserIcon className="h-12 w-12 text-slate-400" />
                                                )}
                                            </div>
                                            <div className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full shadow-md border border-slate-100 text-primary">
                                                <Camera className="h-3.5 w-3.5" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-center mt-4">
                                        <h3 className="text-xl font-black text-slate-900">{user.name}</h3>
                                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mt-1">
                                            {user.role === 'admin' ? 'Administrador' : user.role === 'employee' ? 'Funcionário' : 'Cliente'}
                                        </p>
                                    </div>
                                    <div className="mt-8 space-y-3">
                                        <div className="p-3 rounded-xl bg-slate-50 text-xs font-semibold text-slate-600 flex items-center justify-between">
                                            <span>Usuário</span>
                                            <span className="text-slate-900 font-bold">{user.username}</span>
                                        </div>
                                        <div className="p-3 rounded-xl bg-slate-50 text-xs font-semibold text-slate-600 flex items-center justify-between">
                                            <span>Desde</span>
                                            <span className="text-slate-900 font-bold">
                                                {user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : '-'}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Main Content: Edit Form */}
                        <div className="lg:col-span-2">
                            <Card className="rounded-3xl border-none shadow-xl shadow-slate-200/50 overflow-hidden">
                                <CardHeader className="bg-white border-b border-slate-100 py-6">
                                    <CardTitle className="text-2xl font-black text-slate-900 flex items-center gap-2">
                                        Editar Perfil
                                    </CardTitle>
                                    <CardDescription className="text-slate-500 font-medium">
                                        Mantenha suas informações pessoais e foto de perfil atualizadas.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-8 space-y-8">
                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <Label className="text-sm font-black text-slate-700 uppercase tracking-wider">
                                                Foto de Perfil
                                            </Label>
                                            <ImageUpload 
                                                value={avatar} 
                                                onChange={setAvatar} 
                                                description="Escolha uma imagem de até 2MB. Recomenda-se o formato quadrado."
                                            />
                                        </div>

                                        <div className="space-y-4 pt-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="name" className="text-sm font-black text-slate-700 uppercase tracking-wider">
                                                    Nome Completo
                                                </Label>
                                                <Input 
                                                    id="name"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    className="h-12 rounded-xl border-slate-200 focus:ring-primary focus:border-primary font-bold text-slate-900"
                                                    placeholder="Seu nome completo"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-slate-100 flex justify-end">
                                        <Button 
                                            onClick={handleSave}
                                            disabled={updateProfileMutation.isPending}
                                            className="bg-primary hover:bg-primary/90 text-white font-black px-10 h-12 rounded-xl shadow-lg shadow-primary/20 gap-2"
                                        >
                                            {updateProfileMutation.isPending ? (
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                            ) : (
                                                <>
                                                    <Save className="h-5 w-5" /> Salvar Alterações
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
