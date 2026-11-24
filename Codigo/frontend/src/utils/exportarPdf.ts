/**
 * "Exportar PDF" das telas visuais (escala, mapa, organograma, relatórios): abre a impressão do
 * navegador com um layout limpo (sem menus, botões e elementos flutuantes — ver style/impressao.css),
 * onde a pessoa escolhe "Salvar como PDF". O título da página vira o nome sugerido do arquivo.
 */
export function exportarPdf(nomeArquivo: string, opcoes: { paisagem?: boolean } = {}): void {
  const tituloAntes = document.title;
  const limpo = nomeArquivo.replace(/[<>:"/\\|?*]+/g, " ").replace(/\s+/g, " ").trim();
  document.title = limpo || tituloAntes;
  document.body.classList.add("imprimindo");
  if (opcoes.paisagem) document.body.classList.add("imprimindo--paisagem");

  // Orientação da página: o @page não aceita classe, então entra uma regra temporária
  const estilo = document.createElement("style");
  estilo.textContent = `@page { size: A4 ${opcoes.paisagem ? "landscape" : "portrait"}; margin: 12mm; }`;
  document.head.appendChild(estilo);

  const restaurar = () => {
    document.title = tituloAntes;
    document.body.classList.remove("imprimindo", "imprimindo--paisagem");
    estilo.remove();
    window.removeEventListener("afterprint", restaurar);
  };
  window.addEventListener("afterprint", restaurar);
  // Dá um quadro para o navegador aplicar as classes antes de abrir a impressão
  requestAnimationFrame(() => {
    window.print();
    // Alguns navegadores de celular não disparam afterprint
    setTimeout(() => {
      if (document.body.classList.contains("imprimindo")) restaurar();
    }, 60_000);
  });
}
