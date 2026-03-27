import { useEffect } from "react";
import { useLocation } from "wouter";

export function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo(0, 0);
      const scrollContainers = document.querySelectorAll('main, .overflow-auto, .overflow-y-auto');
      scrollContainers.forEach(container => {
        container.scrollTo(0, 0);
      });
    };

    // Use requestAnimationFrame to ensure it happens after the DOM update
    requestAnimationFrame(() => {
      scrollToTop();
      // Second attempt to catch any late rendering
      setTimeout(scrollToTop, 100);
    });
  }, [location]);

  return null;
}
