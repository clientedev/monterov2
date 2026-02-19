import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  summary: string;
  coverImage: string;
  publishedAt: string | null;
  author: { username: string };
  comments?: Comment[];
}

export interface Comment {
  id: number;
  content: string;
  createdAt: string;
  author: { username: string };
}

export interface Service {
  id: number;
  title: string;
  description: string;
  icon: string;
}

export interface HeroSlide {
  id: number;
  image: string;
  title: string;
  text: string;
  buttonText: string;
  buttonLink: string;
}

export interface Testimonial {
  id: number;
  name: string;
  text: string;
  rating: number;
}


export function usePosts() {
  return useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      const res = await api.get<Post[]>("/posts");
      return res.data;
    },
  });
}

export function usePost(slug: string) {
  return useQuery({
    queryKey: ["post", slug],
    queryFn: async () => {
      try {
        const res = await api.get<Post>(`/posts/${slug}`);
        return res.data;
      } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
      }
    },
    enabled: !!slug,
  });
}

export function useServices() {
  return useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const res = await api.get<Service[]>("/services");
      return res.data;
    },
  });
}

export function useHeroSlides() {
  return useQuery({
    queryKey: ["hero"],
    queryFn: async () => {
      const res = await api.get<HeroSlide[]>("/hero");
      return res.data;
    }
  });
}

export function useTestimonials() {
  return useQuery({
    queryKey: ["testimonials"],
    queryFn: async () => {
      const res = await api.get<Testimonial[]>("/testimonials");
      return res.data;
    }
  })
}
