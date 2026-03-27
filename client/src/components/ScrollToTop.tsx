import { useEffect } from "react";
import { useLocation } from "wouter";

export default function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    // Special handling for internal scroll containers often found in layouts
    const scrollContainers = document.querySelectorAll('main, .overflow-auto, .overflow-y-auto');
    scrollContainers.forEach(container => {
      container.scrollTo(0, 0);
    });
  }, [location]);

  return null;
}
