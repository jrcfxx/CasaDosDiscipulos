/**
 * O site usava URLs com "#" (ex.: /#/portal/usuario). Links antigos — favoritos, mensagens de
 * WhatsApp já enviadas — continuam funcionando: antes de o roteador iniciar, "/#/caminho"
 * vira "/caminho" sem recarregar a página. Âncoras normais (ex.: /#campanha-nova-sede) não mudam.
 */
export function caminhoDeLinkAntigo(hash: string): string | null {
  if (!hash.startsWith("#/")) return null;
  const caminho = hash.slice(1);
  return caminho.startsWith("//") ? null : caminho; // evita "//outro-site"
}

export function migrarLinkHash(janela: Pick<Window, "location" | "history"> = window): boolean {
  const novo = caminhoDeLinkAntigo(janela.location.hash);
  if (novo) janela.history.replaceState(null, "", novo);
  return Boolean(novo);
}

/** Também converte quando um link antigo é aberto com o site já carregado (só muda o "#") */
export function ouvirLinksHash(): void {
  window.addEventListener("hashchange", () => {
    // O roteador escuta "popstate": avisa que a URL mudou
    if (migrarLinkHash()) window.dispatchEvent(new PopStateEvent("popstate"));
  });
}
