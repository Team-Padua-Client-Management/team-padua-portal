export const DARK_THEMES = ["dark", "midnight", "forest", "sunset", "slate", "purple"];

export interface ThemeMeta {
  id: string;
  name: string;
  accent: string;
  glow: string;
}

export const THEME_CONFIG: Record<string, ThemeMeta> = {
  light: { id: "light", name: "Light Slate", accent: "#F4C542", glow: "rgba(244, 197, 66, 0.25)" },
  sunlife: { id: "sunlife", name: "Sun Life Theme", accent: "#F4C542", glow: "rgba(244, 197, 66, 0.35)" },
  dark: { id: "dark", name: "Charcoal Dark", accent: "#F4C542", glow: "rgba(244, 197, 66, 0.25)" },
  midnight: { id: "midnight", name: "Midnight Blue", accent: "#3B82F6", glow: "rgba(59, 130, 246, 0.35)" },
  forest: { id: "forest", name: "Forest Green", accent: "#10B981", glow: "rgba(16, 185, 129, 0.35)" },
  sunset: { id: "sunset", name: "Sunset Warm", accent: "#F97316", glow: "rgba(249, 115, 22, 0.35)" },
  purple: { id: "purple", name: "Royal Purple", accent: "#A855F7", glow: "rgba(168, 85, 247, 0.35)" },
  slate: { id: "slate", name: "Slate Steel", accent: "#38BDF8", glow: "rgba(56, 189, 248, 0.35)" },
};

export function isDarkTheme(theme: string): boolean {
  return DARK_THEMES.includes(theme);
}

export function triggerAmbientThemeGlow(nextTheme: string, x: number, y: number) {
  if (typeof document === "undefined") return;

  const meta = THEME_CONFIG[nextTheme] || THEME_CONFIG.light;
  const glowOverlay = document.createElement("div");

  glowOverlay.style.position = "fixed";
  glowOverlay.style.top = "0";
  glowOverlay.style.left = "0";
  glowOverlay.style.width = "100vw";
  glowOverlay.style.height = "100vh";
  glowOverlay.style.pointerEvents = "none";
  glowOverlay.style.zIndex = "99999";
  glowOverlay.style.background = `radial-gradient(circle 600px at ${x}px ${y}px, ${meta.glow}, transparent 70%)`;
  glowOverlay.style.opacity = "0";
  glowOverlay.style.transition = "opacity 300ms ease-out, transform 650ms cubic-bezier(0.16, 1, 0.3, 1)";
  glowOverlay.style.transform = "scale(0.8)";

  document.body.appendChild(glowOverlay);

  requestAnimationFrame(() => {
    glowOverlay.style.opacity = "1";
    glowOverlay.style.transform = "scale(1.2)";
  });

  setTimeout(() => {
    glowOverlay.style.opacity = "0";
    setTimeout(() => {
      if (document.body.contains(glowOverlay)) {
        document.body.removeChild(glowOverlay);
      }
    }, 350);
  }, 400);
}

import { useTheme } from "next-themes";

export function useThemeTransition() {
  const { setTheme, theme, systemTheme } = useTheme();
  
  const currentTheme = theme === 'system' ? systemTheme : theme;

  const applyThemeWithTransition = (
    nextTheme: string,
    event?: React.MouseEvent | MouseEvent | { clientX: number; clientY: number }
  ) => {
    const isDark = isDarkTheme(nextTheme);
    const x = event && "clientX" in event && event.clientX > 0 ? event.clientX : window.innerWidth / 2;
    const y = event && "clientY" in event && event.clientY > 0 ? event.clientY : window.innerHeight / 2;

    triggerAmbientThemeGlow(nextTheme, x, y);

    const updateDOMTheme = () => {
      setTheme(nextTheme);
    };

    if (
      typeof document !== "undefined" &&
      "startViewTransition" in document &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      const transition = (document as any).startViewTransition(() => {
        updateDOMTheme();
      });

      transition.ready.then(() => {
        const clipPath = [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`
        ];
        document.documentElement.animate(
          {
            clipPath: clipPath,
          },
          {
            duration: 450,
            easing: "ease-in-out",
            pseudoElement: "::view-transition-new(root)",
          }
        );
      });
    } else {
      updateDOMTheme();
    }
  };

  return { applyThemeWithTransition, theme: currentTheme };
}
