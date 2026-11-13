import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { migrarLinkHash, ouvirLinksHash } from "./utils/migrarLinkHash";
import "./index.css";
import "./style/accessibility.css";
import "./style/feedback.css";
import "./style/refino.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { AuthProvider } from "./contexts/AuthContext";
import { AccessibilityProvider } from "./contexts/AccessibilityContext";
import { LiveAnnouncerProvider } from "./components/accessibility/LiveAnnouncer";
import SkipLink from "./components/accessibility/SkipLink";
import AccessibilityBar from "./components/accessibility/AccessibilityBar";
import MiniJesus from "./components/MiniJesus";

// Links antigos "/#/caminho" → "/caminho" (antes de o roteador ler a URL)
migrarLinkHash();
ouvirLinksHash();

const container = document.getElementById("root") as HTMLElement;
const root = ReactDOM.createRoot(container);

// Auditoria de acessibilidade só em desenvolvimento (import dinâmico: fora do bundle de produção)
if (import.meta.env.DEV) {
  import("@axe-core/react").then(({ default: axe }) => axe(React, ReactDOM, 1000));
}

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AccessibilityProvider>
          <LiveAnnouncerProvider>
            <SkipLink />
            <App />
            <MiniJesus />
            <AccessibilityBar />
          </LiveAnnouncerProvider>
        </AccessibilityProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

reportWebVitals();
