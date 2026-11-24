import { describe, expect, it } from "vitest";
import { ehUrl, erroDoModulo } from "./validarModulo";

const ok = { titulo: "Fundamentos da fé", conteudos: [{ tipo: "texto", label: "Intro", conteudo: "Olá" }] };

describe("erroDoModulo", () => {
  it("módulo completo passa", () => {
    expect(erroDoModulo(ok)).toBeNull();
  });

  it("título curto (sem contar espaços)", () => {
    expect(erroDoModulo({ ...ok, titulo: "  ab  " })).toMatch(/3 letras/);
  });

  it("conteúdo sem nome, nome repetido e conteúdo vazio", () => {
    expect(erroDoModulo({ ...ok, conteudos: [{ tipo: "texto", label: " ", conteudo: "x" }] })).toMatch(/sem nome/);
    expect(
      erroDoModulo({
        ...ok,
        conteudos: [
          { tipo: "texto", label: "Aula", conteudo: "a" },
          { tipo: "texto", label: " aula ", conteudo: "b" },
        ],
      })
    ).toMatch(/dois conteúdos chamados "aula"/);
    expect(erroDoModulo({ ...ok, conteudos: [{ tipo: "texto", label: "Intro", conteudo: "   " }] })).toMatch(
      /Preencha o conteúdo de "Intro"/
    );
  });

  it("link e vídeo precisam ser endereços completos", () => {
    expect(erroDoModulo({ ...ok, conteudos: [{ tipo: "video", label: "Aula", conteudo: "youtube" }] })).toMatch(
      /link completo/
    );
    expect(
      erroDoModulo({ ...ok, conteudos: [{ tipo: "video", label: "Aula", conteudo: "https://youtu.be/abc" }] })
    ).toBeNull();
  });

  it("arquivo escolhido conta como preenchido", () => {
    const arquivo = new File(["x"], "a.pdf");
    expect(erroDoModulo({ ...ok, conteudos: [{ tipo: "upload", label: "PDF", conteudo: arquivo }] })).toBeNull();
  });

  it("bloco de quiz sem quiz escolhido", () => {
    expect(erroDoModulo({ ...ok, temBlocoQuiz: true, quizEscolhido: null })).toMatch(/Escolha o quiz/);
    expect(erroDoModulo({ ...ok, temBlocoQuiz: true, quizEscolhido: 3 })).toBeNull();
  });
});

describe("ehUrl", () => {
  it("aceita http(s) com domínio e recusa o resto", () => {
    expect(ehUrl("https://casadosdiscipulos.com.br")).toBe(true);
    expect(ehUrl("www.site.com")).toBe(false);
    expect(ehUrl("javascript:alert(1)")).toBe(false);
  });
});
