import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

const POSTS_CACHE_KEY = "monteiro_posts_cache_v2";
const SERVICES_CACHE_KEY = "monteiro_services_cache_v2";

function getLocalCache<T>(key: string): T | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

function setLocalCache<T>(key: string, data: T): void {
  if (typeof window === "undefined" || !data) return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

export function usePosts() {
  return useQuery({
    queryKey: [api.posts.list.path],
    queryFn: async () => {
      const res = await fetch(api.posts.list.path);
      if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`);
      const data = await res.json();
      if (!Array.isArray(data)) return [];
      setLocalCache(POSTS_CACHE_KEY, data);
      return data as any[];
    },
    initialData: () => getLocalCache<any[]>(POSTS_CACHE_KEY),
    staleTime: 60_000,
    gcTime: 600_000,
    retry: 2,
  });
}

export function usePost(slug: string) {
  return useQuery({
    queryKey: [api.posts.get.path, slug],
    queryFn: async () => {
      const url = buildUrl(api.posts.get.path, { slug });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch post");
      return api.posts.get.responses[200].parse(await res.json());
    },
    staleTime: 120_000,
    gcTime: 600_000,
    enabled: !!slug,
  });
}

export function useServices() {
  return useQuery({
    queryKey: [api.services.list.path],
    queryFn: async () => {
      const res = await fetch(api.services.list.path);
      if (!res.ok) throw new Error("Failed to fetch services");
      const raw = await res.json();
      const data = api.services.list.responses[200].parse(raw);
      setLocalCache(SERVICES_CACHE_KEY, data);
      return data;
    },
    initialData: () => getLocalCache<any[]>(SERVICES_CACHE_KEY),
    staleTime: 60_000,
    gcTime: 600_000,
    retry: 2,
  });
}

export function useComments(postId: number) {
  return useQuery({
    queryKey: ['/api/posts', postId, 'comments'],
    queryFn: async () => {
      const res = await fetch(`/api/posts/${postId}/comments`);
      if (!res.ok) throw new Error("Failed to fetch comments");
      return await res.json();
    },
    enabled: !!postId,
  });
}
