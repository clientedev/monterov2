import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface InsertInquiry {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

export function useCreateInquiry() {
  return useMutation({
    mutationFn: async (data: InsertInquiry) => {
      const res = await api.post("/inquiries", data);
      return res.data;
    },
  });
}
