import React, { useEffect, useState } from "react";
import "../style/editorCasa.css";
import "../style/secretariaUsuario.css";

import PaginaSecretaria, {
  ListaSecretaria,
  ItemSecretaria,
  DetalheSecretaria,
  DetalheVazio,
  abasDoUsuario,
  filtrarItens,
} from "../components/secretaria/PaginaSecretaria";
import licaoService, { type Licao } from "../services/licaoService";
import { formatarConteudoCampo } from "../utils/moduloConteudoUtils";
import Icone from "../components/ui/Icone";

const NOME_TIPO: Record<string, string> = {
  video: "Vídeo",
  textarea: "Texto",
  texto: "Texto curto",
  upload: "Arquivo",
  link: "Link",
  data: "Data",
  numero: "Número",
};

/** Lições da célula: o líder escolhe a da semana e vê o material para conduzir o encontro */
const LicaoSecretariaCelulaUser: React.FC = () => {
  const [licoes, setLicoes] = useState<Licao[]>([]);
  const [selecionada, setSelecionada] = useState<Licao | null>(null);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const lista = await licaoService.getAll();
        setLicoes(lista);
        setSelecionada(lista[0] ?? null);
      } catch {
        setLicoes([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const visiveis = filtrarItens(licoes, busca, "todos", (l) => l.titulo, () => true);
  const campos = selecionada?.campos ?? [];

  return (
    <PaginaSecretaria
      area="Secretaria das Células"
      titulo="Lições"
      icone="livro"
      descricao="O material de cada encontro da célula. Escolha a lição na lista para ver o ensino, os vídeos e os arquivos para baixar."
      abas={abasDoUsuario(true)}
      rotuloAbas="Minhas áreas"
      numeros={[{ valor: licoes.length, rotulo: licoes.length === 1 ? "lição disponível" : "lições disponíveis" }]}
    >
      <div className="sc-corpo">
        <ListaSecretaria
          titulo="Lições"
          total={licoes.length}
          busca={busca}
          onBusca={setBusca}
          placeholderBusca="Buscar lição pelo nome"
          vazio={loading ? "Carregando…" : licoes.length ? "Nenhuma lição com esse nome." : "Ainda não há lições publicadas."}
          quantidadeVisivel={visiveis.length}
        >
          {visiveis.map((l) => {
            const n = l.campos?.length || 0;
            return (
              <ItemSecretaria
                key={l.id_licao}
                titulo={l.titulo}
                meta={`${n} ${n === 1 ? "conteúdo" : "conteúdos"}`}
                ativo
                selecionado={selecionada?.id_licao === l.id_licao}
                icone="livro"
                onSelecionar={() => setSelecionada(l)}
              />
            );
          })}
        </ListaSecretaria>

        {selecionada ? (
          <DetalheSecretaria
            titulo={selecionada.titulo}
            ativo
            status={`${campos.length} ${campos.length === 1 ? "conteúdo" : "conteúdos"}`}
            acoes={null}
          >
            {selecionada.descricao && (
              <p className="sc-descricao">
                <strong>Sobre esta lição</strong>
                {selecionada.descricao}
              </p>
            )}

            <h3 className="sc-subtitulo">
              <Icone nome="livro" tamanho={17} /> Material do encontro
            </h3>
            {campos.length > 0 ? (
              <ol className="ec-previa">
                {campos.map((campo, i) => (
                  <li key={i} className="campo-card campo-card--pergunta">
                    <span className="ec-selo ec-selo--pergunta">
                      {i + 1}. {NOME_TIPO[String(campo.tipo_campo)] || "Conteúdo"}
                    </span>
                    <div className="campo-label">{campo.label || "Sem título"}</div>
                    <div className="campo-conteudo">{formatarConteudoCampo(campo.conteudo)}</div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="sc-vazio-conteudo">Esta lição ainda não tem material.</p>
            )}
          </DetalheSecretaria>
        ) : (
          <DetalheVazio icone="livro" texto={loading ? "Carregando lições…" : "Escolha uma lição na lista."} />
        )}
      </div>
    </PaginaSecretaria>
  );
};

export default LicaoSecretariaCelulaUser;
