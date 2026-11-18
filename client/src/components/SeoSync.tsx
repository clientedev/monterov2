import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

// O servidor já entrega título, descrição e canônica corretos na primeira carga.
// Ao navegar dentro do site (sem recarregar), atualiza essas tags com os mesmos
// valores que o servidor geraria para a nova página.

function setMeta(attr: "name" | "property", key: string, value?: string | null) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!value) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
}

function setLink(rel: string, href?: string | null) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!href) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

export function SeoSync() {
  const [location] = useLocation();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const ctrl = new AbortController();
    fetch(`/api/seo?path=${encodeURIComponent(location)}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((seo) => {
        if (!seo) return;
        document.title = seo.title;
        setMeta("name", "description", seo.description);
        setMeta("name", "robots", seo.robots);
        setLink("canonical", seo.canonical);
        setMeta("property", "og:title", seo.title);
        setMeta("property", "og:description", seo.description);
        setMeta("property", "og:url", seo.canonical);
        setMeta("property", "og:type", seo.ogType);
        setMeta("property", "og:image", seo.image);
        setMeta("name", "twitter:title", seo.title);
        setMeta("name", "twitter:description", seo.description);
        setMeta("name", "twitter:image", seo.image);
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [location]);

  return null;
}
