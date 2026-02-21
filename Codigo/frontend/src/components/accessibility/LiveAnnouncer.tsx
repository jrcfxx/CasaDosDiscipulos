import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

/**
 * Anuncia mensagens para leitores de tela (NVDA, JAWS, VoiceOver).
 * Usado para notificar ações dinâmicas: salvou, erro, etc.
 */
interface LiveAnnouncerContextValue {
  announce: (message: string, politeness?: "polite" | "assertive") => void;
}

const LiveAnnouncerContext = createContext<LiveAnnouncerContextValue | null>(null);

export function LiveAnnouncerProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState("");
  const [politeness, setPoliteness] = useState<"polite" | "assertive">("polite");

  const announce = useCallback((msg: string, pol: "polite" | "assertive" = "polite") => {
    setMessage("");
    setPoliteness(pol);
    requestAnimationFrame(() => {
      setMessage(msg);
      // Limpa após anunciar para permitir re-anúncio da mesma mensagem
      setTimeout(() => setMessage(""), 1000);
    });
  }, []);

  return (
    <LiveAnnouncerContext.Provider value={{ announce }}>
      {children}
      <div
        role="status"
        aria-live={politeness}
        aria-atomic="true"
        className="sr-only"
        style={{
          position: "absolute",
          width: "1px",
          height: "1px",
          padding: 0,
          margin: "-1px",
          overflow: "hidden",
          clip: "rect(0,0,0,0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        {message}
      </div>
    </LiveAnnouncerContext.Provider>
  );
}

export function useLiveAnnouncer() {
  return useContext(LiveAnnouncerContext);
}
