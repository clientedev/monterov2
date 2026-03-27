import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Review, InsertReview } from "@shared/schema";
import { useToast } from "./use-toast";

export function useApprovedReviews() {
  return useQuery<Review[]>({
    queryKey: ["/api/reviews"],
  });
}

export function useAdminReviews() {
  return useQuery<Review[]>({
    queryKey: ["/api/admin/reviews"],
  });
}

export function useCreateReview() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (review: InsertReview) => {
      const res = await apiRequest("POST", "/api/reviews", review);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Avaliação enviada!",
        description: "Sua avaliação foi recebida e aparecerá no site após a aprovação do administrador.",
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
    mutationFn: async (id: number) => {
      const res = await apiRequest("PATCH", `/api/admin/reviews/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Avaliação aprovada!",
        description: "A avaliação agora está visível no site.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews"] });
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
