import { useEffect } from "react";
import { useSiteSettings } from "@/hooks/use-site-settings";

export function ThemeInjector() {
    const { settings } = useSiteSettings();

    useEffect(() => {
        if (settings) {
            const root = document.documentElement;

            if (settings.primaryColor) {
                // Convert hex to HSL if possible, or just inject hex if the CSS is updated to support it
                // Since original index.css uses HSL, let's try to pass the raw hex to a new variable or override
                root.style.setProperty("--primary-hex", settings.primaryColor);
                // For simplicity, we'll use a data attribute or direct style override for some components
            }

            if (settings.secondaryColor) {
                root.style.setProperty("--secondary-hex", settings.secondaryColor);
            }

            if (settings.fontSans) {
                root.style.setProperty("--font-sans", settings.fontSans + ", sans-serif");
            }

            if (settings.fontDisplay) {
                root.style.setProperty("--font-display", settings.fontDisplay + ", sans-serif");
            }
        }
    }, [settings]);

    return null;
}
