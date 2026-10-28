import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Review, InsertReview } from "@shared/schema";
import { useToast } from "./use-toast";

export interface ReviewsResponse {
  reviews: Review[];
  googleReviewUrl: string;
  googleRating: string;
  googleTotalReviews: number;
  googlePlaceId: string;
}

export interface AdminReviewsResponse {
  reviews: Review[];
  settings: {
    googleReviewUrl: string;
    googleRating: string;
    googleTotalReviews: number;
    googlePlaceId: string;
    autoApproveReviews: boolean;
  };
}

export function useApprovedReviews() {
  return useQuery<ReviewsResponse>({
    queryKey: ["/api/reviews"],
    select: (data: any) => {
      if (Array.isArray(data)) {
        return {
          reviews: data,
          googleReviewUrl: "https://g.page/r/CfNsrw-dt3q3EAE/review",
          googleRating: "5.0",
          googleTotalReviews: 12,
          googlePlaceId: "ChIJq6oGRjhfzpQR82yvD523erc"
        };
      }
      return data;
    }
  });
}

export function useAdminReviews() {
  return useQuery<AdminReviewsResponse>({
    queryKey: ["/api/admin/reviews"],
    select: (data: any) => {
      if (Array.isArray(data)) {
        return {
          reviews: data,
          settings: {
            googleReviewUrl: "https://g.page/r/CfNsrw-dt3q3EAE/review",
            googleRating: "5.0",
            googleTotalReviews: 12,
            googlePlaceId: "ChIJq6oGRjhfzpQR82yvD523erc",
            autoApproveReviews: false
          }
        };
      }
      return data;
    }
  });
}

export function useCreateReview() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (review: Partial<InsertReview>) => {
      const res = await apiRequest("POST", "/api/reviews", review);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Avaliação enviada com sucesso!",
        description: "Muito obrigado por compartilhar sua opinião conosco.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao enviar",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useApproveReview() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, isApproved = true }: { id: number; isApproved?: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/reviews/${id}`, { isApproved });
      return res.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.isApproved ? "Avaliação aprovada!" : "Avaliação ocultada!",
        description: variables.isApproved 
          ? "A avaliação agora está visível no site." 
          : "A avaliação não aparecerá publicamente no site.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews"] });
    },
  });
}

export function useToggleFeatureReview() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PATCH", `/api/admin/reviews/${id}/feature`);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: data.isFeatured ? "Marcada como Destaque!" : "Removida dos destaques",
        description: data.isFeatured 
          ? "Esta avaliação aparecerá com prioridade no topo da seção."
          : "Ordem padrão restabelecida.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews"] });
    },
  });
}

export function useSyncGoogleReviews() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (placeId?: string) => {
      const res = await apiRequest("POST", "/api/admin/reviews/sync-google", { placeId });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Sincronização com o Google concluída!",
        description: `${data.synced ?? 0} avaliações atualizadas diretamente do perfil oficial do Google Meu Negócio.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na sincronização",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useAdminCreateReview() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (review: Partial<InsertReview> & { isApproved?: boolean }) => {
      const res = await apiRequest("POST", "/api/admin/reviews", review);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Avaliação adicionada!",
        description: "A avaliação foi cadastrada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao adicionar avaliação",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteReview() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/reviews/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Avaliação removida",
        description: "A avaliação foi excluída com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews"] });
    },
  });
}
