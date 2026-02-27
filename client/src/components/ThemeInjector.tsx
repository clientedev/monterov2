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

            if (settings.logoBase64) {
                const head = document.head || document.getElementsByTagName('head')[0];

                // Remove all existing favicons to avoid conflicts
                const existingIcons = document.querySelectorAll("link[rel*='icon']");
                existingIcons.forEach(icon => head.removeChild(icon));

                // Create and add the new favicon
                const newIcon = document.createElement('link');
                newIcon.type = 'image/x-icon';
                newIcon.rel = 'shortcut icon';
                newIcon.href = settings.logoBase64;
                head.appendChild(newIcon);

                // Add a secondary standard 'icon' rel for broader compatibility
                const standardIcon = document.createElement('link');
                standardIcon.type = 'image/png';
                standardIcon.rel = 'icon';
                standardIcon.href = settings.logoBase64;
                head.appendChild(standardIcon);
            }
        }
    }, [settings]);

    return null;
}
