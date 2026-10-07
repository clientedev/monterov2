import { useEffect } from "react";
import { useSiteSettings } from "@/hooks/use-site-settings";

export function ThemeInjector() {
    const { settings } = useSiteSettings();

    useEffect(() => {
        if (!settings) return;

        const root = document.documentElement;
        const isPinkOctober = Boolean(settings.themeOutubroRosa || settings.activeTheme === "outubro_rosa");

        if (isPinkOctober) {
            root.setAttribute("data-theme", "outubro-rosa");
            root.classList.add("theme-outubro-rosa");
            root.style.setProperty("--primary-hex", "#d94676");
            root.style.setProperty("--secondary-hex", "#ea7297");
            root.style.setProperty("--navbar-bg", "rgba(69, 28, 43, 0.95)");
        } else {
            root.removeAttribute("data-theme");
            root.classList.remove("theme-outubro-rosa");
            root.style.removeProperty("--navbar-bg");

            if (settings.primaryColor) {
                root.style.setProperty("--primary-hex", settings.primaryColor);
            } else {
                root.style.removeProperty("--primary-hex");
            }

            if (settings.secondaryColor) {
                root.style.setProperty("--secondary-hex", settings.secondaryColor);
            } else {
                root.style.removeProperty("--secondary-hex");
            }
        }

        if (settings.fontSans) {
            root.style.setProperty("--font-sans", settings.fontSans + ", sans-serif");
        }

        if (settings.fontDisplay) {
            root.style.setProperty("--font-display", settings.fontDisplay + ", sans-serif");
        }
    }, [settings]);

    return null;
}
