// ESLint do frontend (roda no CI: `npm run lint`).
// Erros = bugs reais (regras dos hooks, acessibilidade crítica); avisos = melhorias graduais.
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import globals from "globals";

export default tseslint.config(
  { ignores: ["build/**", "dist/**", "node_modules/**", "coverage/**", "public/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  jsxA11y.flatConfigs.recommended,
  {
    files: ["src/**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { "react-hooks": reactHooks },
    rules: {
      // Hooks fora de ordem quebram o React: erro
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      // Variáveis não usadas: aviso (prefixo _ = intencional)
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrors: "none" }],
      "no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      // Acessibilidade: o projeto já trata teclado/leitor de tela; mantidos como aviso para correção gradual
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/no-static-element-interactions": "warn",
      "jsx-a11y/no-noninteractive-element-interactions": "warn",
      "jsx-a11y/no-autofocus": "off", // foco automático usado de propósito em modais e na tela de senha
      "jsx-a11y/label-has-associated-control": "warn",
      "jsx-a11y/media-has-caption": "warn",
      "jsx-a11y/no-noninteractive-tabindex": "warn",
    },
  },
  {
    // Testes rodam no Node com globais do Vitest
    files: ["src/**/*.test.{ts,tsx}", "src/setupTests.ts"],
    languageOptions: { globals: { ...globals.node } },
  }
);
