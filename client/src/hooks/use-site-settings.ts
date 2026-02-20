import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SiteSettings, InsertSiteSettings, HeroSlide, InsertHeroSlide } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useSiteSettings() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: settings, isLoading: isLoadingSettings } = useQuery<SiteSettings>({
        queryKey: ["/api/site-settings"],
    });

    const { data: slides, isLoading: isLoadingSlides } = useQuery<HeroSlide[]>({
        queryKey: ["/api/hero-slides"],
    });

    const updateSettingsMutation = useMutation({
        mutationFn: async (newSettings: InsertSiteSettings) => {
            const res = await apiRequest("PATCH", "/api/site-settings", newSettings);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/site-settings"] });
            toast({ title: "Configurações atualizadas com sucesso!" });
        },
        onError: (error: Error) => {
            toast({
                title: "Erro ao atualizar configurações",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const createSlideMutation = useMutation({
        mutationFn: async (newSlide: InsertHeroSlide) => {
            const res = await apiRequest("POST", "/api/hero-slides", newSlide);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/hero-slides"] });
            toast({ title: "Slide adicionado com sucesso!" });
        },
    });

    const updateSlideMutation = useMutation({
        mutationFn: async ({ id, slide }: { id: number; slide: Partial<InsertHeroSlide> }) => {
            const res = await apiRequest("PATCH", `/api/hero-slides/${id}`, slide);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/hero-slides"] });
            toast({ title: "Slide atualizado com sucesso!" });
        },
    });

    const deleteSlideMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/hero-slides/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/hero-slides"] });
            toast({ title: "Slide removido com sucesso!" });
        },
    });

    return {
        settings,
        isLoadingSettings,
        slides,
        isLoadingSlides,
        updateSettings: updateSettingsMutation.mutateAsync,
        isUpdatingSettings: updateSettingsMutation.isPending,
        createSlide: createSlideMutation.mutateAsync,
        updateSlide: updateSlideMutation.mutateAsync,
        deleteSlide: deleteSlideMutation.mutateAsync,
    };
}
