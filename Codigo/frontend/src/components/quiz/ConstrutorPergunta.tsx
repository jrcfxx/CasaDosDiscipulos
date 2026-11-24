import React from "react";
import Icone from "../ui/Icone";
import { parseAlternativas, parseSelect, type ValorCampo } from "../../types/campoConteudo";

/**
 * Montagem de uma pergunta de quiz pelo admin (múltipla escolha, várias respostas, lista,
 * verdadeiro ou falso, resposta escrita). Guarda no mesmo formato de antes:
 *  - múltipla escolha / várias respostas: {"alternativas":[{texto, correta}]}
 *  - lista: {"opcoes":[...], "correta": "texto da certa"}
 *  - verdadeiro ou falso: "true" | "false"
 *  - resposta escrita: "" (não tem resposta certa)
 */
export const TIPOS_CONSTRUIDOS = ["multipla_escolha", "checkbox", "select", "verdadeiro_falso", "discursiva"];

const MAX_ALTERNATIVAS = 8;
const letra = (i: number) => String.fromCharCode(65 + i);

interface Props {
  tipo: string;
  valor: ValorCampo;
  onChange: (valor: string) => void;
  /** id único da pergunta (para os nomes dos campos) */
  id: string | number;
}

/** Linhas de alternativas: começa com 2 em branco para o admin só preencher */
function comMinimo<T>(lista: T[], vazio: () => T, minimo = 2): T[] {
  const r = [...lista];
  while (r.length < minimo) r.push(vazio());
  return r;
}

function Alternativas({ tipo, valor, onChange, id }: Props) {
  const variasCertas = tipo === "checkbox";
  const alternativas = comMinimo(parseAlternativas(valor).alternativas, () => ({ texto: "", correta: false }));
  const salvar = (lista: typeof alternativas) => onChange(JSON.stringify({ alternativas: lista }));
  const certas = alternativas.map((a, i) => (a.correta ? letra(i) : null)).filter(Boolean) as string[];

  return (
    <div className="cp">
      <p className="cp__instrucao">
        {variasCertas
          ? "Escreva as alternativas e marque TODAS as certas. O aluno só ganha os pontos se marcar exatamente as certas."
          : "Escreva as alternativas e marque a ÚNICA certa. O aluno escolhe uma."}
      </p>
      <ol className="cp__lista">
        {alternativas.map((alt, i) => (
          <li key={i} className={`cp__alt${alt.correta ? " cp__alt--certa" : ""}`}>
            <span className="cp__letra" aria-hidden>
              {letra(i)}
            </span>
            <input
              className="cp__input"
              value={alt.texto}
              maxLength={300}
              placeholder={`Alternativa ${letra(i)}`}
              aria-label={`Texto da alternativa ${letra(i)}`}
              onChange={(e) => salvar(alternativas.map((a, j) => (j === i ? { ...a, texto: e.target.value } : a)))}
            />
            <button
              type="button"
              className={`cp__certa${alt.correta ? " cp__certa--sim" : ""}`}
              aria-pressed={alt.correta}
              aria-label={`Alternativa ${letra(i)} ${alt.correta ? "é" : "não é"} certa`}
              onClick={() =>
                salvar(
                  alternativas.map((a, j) =>
                    variasCertas ? (j === i ? { ...a, correta: !a.correta } : a) : { ...a, correta: j === i }
                  )
                )
              }
              name={`certa-${id}`}
            >
              <Icone nome={alt.correta ? "concluido" : "check"} tamanho={15} />
              {alt.correta ? "Certa" : "Marcar certa"}
            </button>
            <button
              type="button"
              className="cp__remover"
              onClick={() => salvar(alternativas.filter((_, j) => j !== i))}
              disabled={alternativas.length <= 2}
              aria-label={`Remover alternativa ${letra(i)}`}
              title={alternativas.length <= 2 ? "A pergunta precisa de pelo menos 2 alternativas" : "Remover"}
            >
              <Icone nome="fechar" tamanho={15} />
            </button>
          </li>
        ))}
      </ol>
      <div className="cp__rodape">
        {alternativas.length < MAX_ALTERNATIVAS && (
          <button
            type="button"
            className="cp__adicionar"
            onClick={() => salvar([...alternativas, { texto: "", correta: false }])}
          >
            + Adicionar alternativa
          </button>
        )}
        <span className={`cp__status${certas.length ? " cp__status--ok" : ""}`} role="status">
          <Icone nome={certas.length ? "concluido" : "alerta"} tamanho={14} />
          {certas.length
            ? `Resposta${certas.length > 1 ? "s" : ""} certa${certas.length > 1 ? "s" : ""}: ${certas.join(", ")}`
            : "Marque qual é a certa"}
        </span>
      </div>
    </div>
  );
}

function Lista({ valor, onChange }: Props) {
  const dados = parseSelect(valor);
  const opcoes = comMinimo(dados.opcoes, () => "");
  const certaIdx = dados.correta ? opcoes.findIndex((o) => o === dados.correta) : -1;
  const salvar = (lista: string[], idxCerta: number) =>
    onChange(JSON.stringify({ opcoes: lista, correta: idxCerta >= 0 ? lista[idxCerta] ?? "" : "" }));

  return (
    <div className="cp">
      <p className="cp__instrucao">
        O aluno escolhe uma opção numa lista que abre ao clicar (bom para listas longas, como livros da Bíblia). Marque qual
        é a certa.
      </p>
      <ol className="cp__lista">
        {opcoes.map((op, i) => (
          <li key={i} className={`cp__alt${i === certaIdx ? " cp__alt--certa" : ""}`}>
            <span className="cp__letra" aria-hidden>
              {i + 1}
            </span>
            <input
              className="cp__input"
              value={op}
              maxLength={200}
              placeholder={`Opção ${i + 1}`}
              aria-label={`Texto da opção ${i + 1}`}
              // A certa é guardada pelo texto: ao editar a certa, ela continua marcada
              onChange={(e) => salvar(opcoes.map((o, j) => (j === i ? e.target.value : o)), certaIdx)}
            />
            <button
              type="button"
              className={`cp__certa${i === certaIdx ? " cp__certa--sim" : ""}`}
              aria-pressed={i === certaIdx}
              aria-label={`Opção ${i + 1} ${i === certaIdx ? "é" : "não é"} a certa`}
              onClick={() => salvar(opcoes, i)}
            >
              <Icone nome={i === certaIdx ? "concluido" : "check"} tamanho={15} />
              {i === certaIdx ? "Certa" : "Marcar certa"}
            </button>
            <button
              type="button"
              className="cp__remover"
              onClick={() => {
                const nova = opcoes.filter((_, j) => j !== i);
                salvar(nova, certaIdx === i ? -1 : certaIdx > i ? certaIdx - 1 : certaIdx);
              }}
              disabled={opcoes.length <= 2}
              aria-label={`Remover opção ${i + 1}`}
              title={opcoes.length <= 2 ? "A lista precisa de pelo menos 2 opções" : "Remover"}
            >
              <Icone nome="fechar" tamanho={15} />
            </button>
          </li>
        ))}
      </ol>
      <div className="cp__rodape">
        {opcoes.length < 20 && (
          <button type="button" className="cp__adicionar" onClick={() => salvar([...opcoes, ""], certaIdx)}>
            + Adicionar opção
          </button>
        )}
        <span className={`cp__status${certaIdx >= 0 ? " cp__status--ok" : ""}`} role="status">
          <Icone nome={certaIdx >= 0 ? "concluido" : "alerta"} tamanho={14} />
          {certaIdx >= 0 ? `Certa: opção ${certaIdx + 1}` : "Marque qual é a certa"}
        </span>
      </div>
    </div>
  );
}

function VerdadeiroFalso({ valor, onChange, id }: Props) {
  const v = String(valor ?? "").toLowerCase();
  const certa = v === "true" ? "true" : v === "false" ? "false" : "";
  return (
    <div className="cp">
      <p className="cp__instrucao">O aluno lê a afirmação acima e responde se ela é verdadeira ou falsa. Qual é a resposta certa?</p>
      <div className="cp__vf" role="radiogroup" aria-label="Resposta certa">
        {[
          { valor: "true", nome: "Verdadeiro", icone: "concluido" as const },
          { valor: "false", nome: "Falso", icone: "fechar" as const },
        ].map((op) => (
          <label key={op.valor} className={`cp__vf-opcao cp__vf-opcao--${op.valor}${certa === op.valor ? " cp__vf-opcao--marcada" : ""}`}>
            <input type="radio" name={`vf-${id}`} checked={certa === op.valor} onChange={() => onChange(op.valor)} />
            <Icone nome={op.icone} tamanho={20} />
            <span>
              <strong>{op.nome}</strong>
              <small>{certa === op.valor ? "Esta é a resposta certa" : "Marcar como certa"}</small>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

function Discursiva() {
  return (
    <div className="cp">
      <div className="cp__aviso">
        <Icone nome="editar" tamanho={18} />
        <p>
          O aluno responde <strong>escrevendo</strong> (até 1.000 caracteres). Não existe resposta certa nem correção
          automática: quem escrever qualquer resposta ganha os pontos. Use para reflexões e aplicações pessoais.
        </p>
      </div>
      <div className="cp__previa" aria-hidden>
        <span className="cp__previa-rotulo">Como o aluno vê</span>
        <div className="cp__previa-caixa">Escreva sua resposta…</div>
      </div>
    </div>
  );
}

export default function ConstrutorPergunta(props: Props) {
  switch (props.tipo) {
    case "multipla_escolha":
    case "checkbox":
      return <Alternativas {...props} />;
    case "select":
      return <Lista {...props} />;
    case "verdadeiro_falso":
      return <VerdadeiroFalso {...props} />;
    case "discursiva":
      return <Discursiva />;
    default:
      return null;
  }
}
