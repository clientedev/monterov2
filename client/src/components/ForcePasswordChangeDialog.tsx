import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, ShieldAlert, KeyRound } from "lucide-react";

const schema = z.object({
    currentPassword: z.string().min(1, "Senha atual é obrigatória"),
    newPassword: z.string().min(6, "A nova senha deve ter pelo menos 6 caracteres"),
    confirmPassword: z.string().min(1, "Confirmação é obrigatória"),
}).refine((d) => d.newPassword === d.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
}).refine((d) => d.newPassword !== d.currentPassword, {
    message: "A nova senha deve ser diferente da senha atual",
    path: ["newPassword"],
});

type FormData = z.infer<typeof schema>;

export function ForcePasswordChangeDialog({ open }: { open: boolean }) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
    });

    const onSubmit = async (data: FormData) => {
        setIsLoading(true);
        try {
            await apiRequest("POST", "/api/user/change-password", {
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
            });
            toast({ title: "✅ Senha alterada com sucesso!", description: "Bem-vindo ao sistema." });
            // Refresh user data so mustChangePassword becomes false
            await queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        } catch (error: any) {
            const message = await error.json().then((j: any) => j.message).catch(() => "Erro ao alterar senha");
            toast({ title: "Erro", description: message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={() => { /* cannot close — intentional */ }}>
            <DialogContent
                className="sm:max-w-[440px] [&>button]:hidden"
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2.5 bg-red-100 rounded-xl">
                            <ShieldAlert className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-slate-900 text-base">Troca de Senha Obrigatória</DialogTitle>
                        </div>
                    </div>
                    <DialogDescription className="text-sm text-slate-600 mt-2">
                        Por segurança, você precisa <strong>alterar sua senha agora</strong> antes de acessar o sistema. Escolha uma senha forte e pessoal.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
                        <FormField
                            control={form.control}
                            name="currentPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-700">Senha Atual (enviada pelo administrador)</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="Digite a senha recebida" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="newPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-700">Nova Senha</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="Mínimo 6 caracteres" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-700">Confirmar Nova Senha</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="Repita a nova senha" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary hover:bg-primary/90 text-white font-bold rounded-xl mt-2"
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <KeyRound className="mr-2 h-4 w-4" />
                            Definir Nova Senha e Acessar
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
