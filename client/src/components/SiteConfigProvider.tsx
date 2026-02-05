import { useEffect } from "react";
import { api } from "@/lib/api";

function hexToHSL(hex: string) {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return null;
    let r = parseInt(result[1], 16);
    let g = parseInt(result[2], 16);
    let b = parseInt(result[3], 16);
    r /= 255; g /= 255; b /= 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max == min) {
        h = s = 0; // achromatic
    } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h = h! * 60;
    }
    s = s * 100;
    l = l * 100;
    return `${h.toFixed(1)} ${s.toFixed(1)}% ${l.toFixed(1)}%`;
}

export function SiteConfigProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        api.get("/config")
            .then(res => {
                const { primaryColor, secondaryColor } = res.data;

                if (primaryColor) {
                    const hsl = hexToHSL(primaryColor);
                    if (hsl) document.documentElement.style.setProperty("--primary", hsl);
                }

                if (secondaryColor) {
                    const hsl = hexToHSL(secondaryColor);
                    if (hsl) document.documentElement.style.setProperty("--secondary", hsl);
                }
            })
            .catch(console.error);
    }, []);

    return <>{children}</>;
}
