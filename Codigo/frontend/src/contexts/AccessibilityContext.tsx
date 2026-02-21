import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

type FontSize = "100" | "110" | "125" | "150";

interface AccessibilityContextValue {
  fontSize: FontSize;
  highContrast: boolean;
  setFontSize: (size: FontSize) => void;
  setHighContrast: (on: boolean) => void;
}

const STORAGE_KEY = "casa-discipulos-a11y";

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [fontSize, setFontSizeState] = useState<FontSize>("100");
  const [highContrast, setHighContrastState] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { fontSize: fs, highContrast: hc } = JSON.parse(saved);
        if (fs) setFontSizeState(fs);
        if (typeof hc === "boolean") setHighContrastState(hc);
      }
    } catch {
      // ignore
    }
  }, []);

  const setFontSize = useCallback((size: FontSize) => {
    setFontSizeState(size);
    document.documentElement.setAttribute("data-font-size", size);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const data = saved ? JSON.parse(saved) : {};
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, fontSize: size }));
    } catch {
      // ignore
    }
  }, []);

  const setHighContrast = useCallback((on: boolean) => {
    setHighContrastState(on);
    document.documentElement.setAttribute("data-high-contrast", on ? "true" : "false");
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const data = saved ? JSON.parse(saved) : {};
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, highContrast: on }));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-font-size", fontSize);
    document.documentElement.setAttribute("data-high-contrast", highContrast ? "true" : "false");
  }, [fontSize, highContrast]);

  return (
    <AccessibilityContext.Provider
      value={{ fontSize, highContrast, setFontSize, setHighContrast }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  return ctx;
}
