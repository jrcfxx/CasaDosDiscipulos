import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import axe from "@axe-core/react";
import "./index.css";
import "./style/accessibility.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { AuthProvider } from "./contexts/AuthContext";
import { AccessibilityProvider } from "./contexts/AccessibilityContext";
import SkipLink from "./components/accessibility/SkipLink";
import AccessibilityBar from "./components/accessibility/AccessibilityBar";

const container = document.getElementById("root") as HTMLElement;
const root = ReactDOM.createRoot(container);

if (process.env.NODE_ENV === "development") {
  axe(React, ReactDOM, 1000);
}

root.render(
  <React.StrictMode>
    <HashRouter>
      <AuthProvider>
        <AccessibilityProvider>
          <SkipLink />
          <App />
          <AccessibilityBar />
        </AccessibilityProvider>
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>
);

reportWebVitals();
