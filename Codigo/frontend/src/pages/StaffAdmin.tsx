import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import ConfirmModal from "../components/ui/ConfirmModal";
import Toast from "../components/ui/Toast";
import StaffOrganograma from "../components/staff/StaffOrganograma";
import {
  STAFF_PROFUNDIDADE_MAXIMA,
  atualizarConfig,
  atualizarItem,
  criarItem,
  excluirItem,
  getEstrutura,
  moverItem,
  type StaffEstrutura,
  type StaffItem,
} from "../services/staffService";
import { getErrorMessage } from "../utils/errorUtils";
import "../style/Portal.css";
import "../style/Staff.css";

type Aviso = { msg: string; tipo: "success" | "error" | "info" };

const contarDescendentes = (item: StaffItem): number =>
  item.filhos.reduce((total, f) => total + 1 + contarDescendentes(f), 0);

/** Formulário curto para criar um grupo/função */
const NovoItemForm: React.FC<{
  rotulo: string;
  onSalvar: (titulo: string, pessoas: string) => Promise<void>;
  onCancelar: () => void;
}> = ({ rotulo, onSalvar, onCancelar }) => {
  const [titulo, setTitulo] = useState("");
  const [pessoas, setPessoas] = useState("");
  const [salvando, setSalvando] = useState(false);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;
    setSalvando(true);
    try {
      await onSalvar(titulo, pessoas);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <form className="staff-editor__novo" onSubmit={enviar}>
      <input
        className="staff-editor__input"
        placeholder={rotulo}
        aria-label={rotulo}
        value={titulo}
        maxLength={120}
        autoFocus
        onChange={(e) => setTitulo(e.target.value)}
      />
      <input
        className="staff-editor__input"
        placeholder="Pessoas (opcional)"
        aria-label="Pessoas"
        value={pessoas}
        maxLength={255}
        onChange={(e) => setPessoas(e.target.value)}
      />
      <div className="staff-editor__acoes">
        <button type="submit" className="staff-btn staff-btn--primario" disabled={salvando || !titulo.trim()}>
          Adicionar
        </button>
        <button type="button" className="staff-btn" onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </form>
  );
};

interface LinhaProps {
  item: StaffItem;
  nivel: number;
  primeiro: boolean;
  ultimo: boolean;
  ocupado: boolean;
  onSalvar: (item: StaffItem, titulo: string, pessoas: string) => Promise<void>;
  onMover: (item: StaffItem, direcao: "cima" | "baixo") => void;
  onExcluir: (item: StaffItem) => void;
  onCriarFilho: (pai: StaffItem, titulo: string, pessoas: string) => Promise<void>;
}

/** Uma linha editável do organograma (e, recursivamente, os itens dentro dela) */
const LinhaEditor: React.FC<LinhaProps> = (props) => {
  const { item, nivel, primeiro, ultimo, ocupado, onSalvar, onMover, onExcluir, onCriarFilho } = props;
  const [titulo, setTitulo] = useState(item.titulo);
  const [pessoas, setPessoas] = useState(item.pessoas ?? "");
  const [adicionando, setAdicionando] = useState(false);

  // Recarregou do servidor: alinha os campos
  useEffect(() => {
    setTitulo(item.titulo);
    setPessoas(item.pessoas ?? "");
  }, [item.titulo, item.pessoas]);

  const alterado = titulo.trim() !== item.titulo || pessoas.trim() !== (item.pessoas ?? "");
  const podeTerFilhos = nivel < STAFF_PROFUNDIDADE_MAXIMA;

  const salvar = async () => {
    if (!alterado || !titulo.trim()) return;
    await onSalvar(item, titulo, pessoas);
  };

  const aoTeclar = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      salvar();
    }
    if (e.key === "Escape") {
      setTitulo(item.titulo);
      setPessoas(item.pessoas ?? "");
    }
  };

  return (
    <li className={`staff-editor__item staff-editor__item--nivel${nivel}`}>
      <div className={`staff-editor__linha${alterado ? " staff-editor__linha--alterada" : ""}`}>
        <input
          className="staff-editor__input staff-editor__input--titulo"
          aria-label={nivel === 1 ? "Nome do grupo" : "Função"}
          value={titulo}
          maxLength={120}
          onChange={(e) => setTitulo(e.target.value)}
          onKeyDown={aoTeclar}
        />
        <input
          className="staff-editor__input"
          aria-label={`Pessoas em ${item.titulo}`}
          placeholder="A definir"
          value={pessoas}
          maxLength={255}
          onChange={(e) => setPessoas(e.target.value)}
          onKeyDown={aoTeclar}
        />
        <div className="staff-editor__acoes">
          {alterado && (
            <button
              type="button"
              className="staff-btn staff-btn--primario"
              onClick={salvar}
              disabled={ocupado || !titulo.trim()}
            >
              Salvar
            </button>
          )}
          <button
            type="button"
            className="staff-btn staff-btn--icone"
            onClick={() => onMover(item, "cima")}
            disabled={ocupado || primeiro}
            aria-label={`Subir ${item.titulo}`}
            title="Subir"
          >
            ↑
          </button>
          <button
            type="button"
            className="staff-btn staff-btn--icone"
            onClick={() => onMover(item, "baixo")}
            disabled={ocupado || ultimo}
            aria-label={`Descer ${item.titulo}`}
            title="Descer"
          >
            ↓
          </button>
          {podeTerFilhos && (
            <button
              type="button"
              className="staff-btn"
              onClick={() => setAdicionando(true)}
              disabled={ocupado}
              aria-label={`Adicionar função dentro de ${item.titulo}`}
            >
              + Dentro
            </button>
          )}
          <button
            type="button"
            className="staff-btn staff-btn--perigo"
            onClick={() => onExcluir(item)}
            disabled={ocupado}
            aria-label={`Excluir ${item.titulo}`}
          >
            Excluir
          </button>
        </div>
      </div>

      {(item.filhos.length > 0 || adicionando) && (
        <ul className="staff-editor__lista">
          {item.filhos.map((f, i) => (
            <LinhaEditor
              key={f.id_staff_item}
              {...props}
              item={f}
              nivel={nivel + 1}
              primeiro={i === 0}
              ultimo={i === item.filhos.length - 1}
            />
          ))}
          {adicionando && (
            <li className="staff-editor__item">
              <NovoItemForm
                rotulo={`Nova função em ${item.titulo}`}
                onCancelar={() => setAdicionando(false)}
                onSalvar={async (t, p) => {
                  await onCriarFilho(item, t, p);
                  setAdicionando(false);
                }}
              />
            </li>
          )}
        </ul>
      )}
    </li>
  );
};

/** Admin: editar o organograma (staff e estrutura) da Casa */
const StaffAdmin: React.FC = () => {
  const [estrutura, setEstrutura] = useState<StaffEstrutura | null>(null);
  const [titulo, setTitulo] = useState("");
  const [subtitulo, setSubtitulo] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [novoGrupo, setNovoGrupo] = useState(false);
  const [aExcluir, setAExcluir] = useState<StaffItem | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);

  const carregar = useCallback(async () => {
    try {
      const e = await getEstrutura();
      setEstrutura(e);
      setTitulo(e.titulo);
      setSubtitulo(e.subtitulo);
    } catch (err) {
      setAviso({ msg: getErrorMessage(err, "Não foi possível carregar o organograma"), tipo: "error" });
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  /** Executa uma alteração, recarrega e avisa */
  const executar = async (acao: () => Promise<unknown>, sucesso?: string) => {
    setOcupado(true);
    try {
      await acao();
      await carregar();
      if (sucesso) setAviso({ msg: sucesso, tipo: "success" });
    } catch (err) {
      setAviso({ msg: getErrorMessage(err, "Não foi possível salvar"), tipo: "error" });
      throw err;
    } finally {
      setOcupado(false);
    }
  };

  const configAlterada =
    !!estrutura && (titulo.trim() !== estrutura.titulo || subtitulo.trim() !== estrutura.subtitulo);

  return (
    <div className="portal staff-admin">
      <Header />
      <main id="main-content" className="portal-wrap staff-pagina" tabIndex={-1}>
        <header className="portal-hero">
          <p className="portal-hero__label">Administração</p>
          <h1 className="portal-hero__title">Staff e Estrutura</h1>
          <p className="portal-hero__subtitle">
            Edite o organograma da Casa. Membros e líderes veem o resultado no Portal, sem poder alterar.
          </p>
        </header>

        {!estrutura ? (
          <p className="staff-pagina__carregando">Carregando…</p>
        ) : (
          <>
            <section className="staff-painel" aria-labelledby="staff-cabecalho">
              <h2 id="staff-cabecalho" className="staff-painel__titulo">Cabeçalho</h2>
              <div className="staff-editor__config">
                <label className="staff-editor__campo">
                  <span>Título</span>
                  <input
                    className="staff-editor__input"
                    value={titulo}
                    maxLength={120}
                    onChange={(e) => setTitulo(e.target.value)}
                  />
                </label>
                <label className="staff-editor__campo">
                  <span>Subtítulo (opcional)</span>
                  <input
                    className="staff-editor__input"
                    value={subtitulo}
                    maxLength={300}
                    onChange={(e) => setSubtitulo(e.target.value)}
                  />
                </label>
                <button
                  type="button"
                  className="staff-btn staff-btn--primario"
                  disabled={!configAlterada || !titulo.trim() || ocupado}
                  onClick={() =>
                    executar(() => atualizarConfig({ titulo, subtitulo }), "Cabeçalho salvo").catch(() => {})
                  }
                >
                  Salvar cabeçalho
                </button>
              </div>
            </section>

            <section className="staff-painel" aria-labelledby="staff-estrutura">
              <div className="staff-painel__topo">
                <h2 id="staff-estrutura" className="staff-painel__titulo">Estrutura</h2>
                <button
                  type="button"
                  className="staff-btn staff-btn--primario"
                  onClick={() => setNovoGrupo(true)}
                  disabled={ocupado}
                >
                  + Novo grupo
                </button>
              </div>
              <p className="staff-painel__dica">
                Edite os campos e clique em <strong>Salvar</strong> (ou tecle Enter). Deixe “Pessoas” vazio para
                aparecer “A definir”. Use <strong>+ Dentro</strong> para criar subgrupos, como Pastoral ou GD mãe.
              </p>

              {novoGrupo && (
                <NovoItemForm
                  rotulo="Nome do grupo (ex.: Ministerial)"
                  onCancelar={() => setNovoGrupo(false)}
                  onSalvar={async (t, p) => {
                    await executar(() => criarItem({ id_pai: null, titulo: t, pessoas: p }), "Grupo criado");
                    setNovoGrupo(false);
                  }}
                />
              )}

              <ul className="staff-editor__lista staff-editor__lista--raiz">
                {estrutura.itens.map((item, i) => (
                  <LinhaEditor
                    key={item.id_staff_item}
                    item={item}
                    nivel={1}
                    primeiro={i === 0}
                    ultimo={i === estrutura.itens.length - 1}
                    ocupado={ocupado}
                    onSalvar={(it, t, p) => executar(() => atualizarItem(it.id_staff_item, { titulo: t, pessoas: p }), "Salvo")}
                    onMover={(it, d) => {
                      executar(() => moverItem(it.id_staff_item, d)).catch(() => {});
                    }}
                    onExcluir={setAExcluir}
                    onCriarFilho={(pai, t, p) =>
                      executar(() => criarItem({ id_pai: pai.id_staff_item, titulo: t, pessoas: p }), "Função adicionada")
                    }
                  />
                ))}
              </ul>
              {estrutura.itens.length === 0 && (
                <p className="staff-painel__dica">Nenhum grupo ainda. Comece por “+ Novo grupo”.</p>
              )}
            </section>

            <section className="staff-painel staff-painel--previa" aria-labelledby="staff-previa">
              <h2 id="staff-previa" className="staff-painel__titulo">Como os membros veem</h2>
              <StaffOrganograma estrutura={estrutura} />
            </section>
          </>
        )}

        <p className="staff-pagina__voltar">
          <Link to="/portal/admin">← Voltar ao Portal Admin</Link>
        </p>
      </main>
      <Footer />

      <ConfirmModal
        open={!!aExcluir}
        title={`Excluir “${aExcluir?.titulo ?? ""}”?`}
        message={
          aExcluir && contarDescendentes(aExcluir) > 0
            ? `Os ${contarDescendentes(aExcluir)} item(ns) dentro dele também serão excluídos. Esta ação não pode ser desfeita.`
            : "Esta ação não pode ser desfeita."
        }
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={async () => {
          const alvo = aExcluir;
          if (alvo) await executar(() => excluirItem(alvo.id_staff_item), "Excluído").catch(() => {});
          setAExcluir(null);
        }}
        textoCarregando="Excluindo…"
        onCancel={() => setAExcluir(null)}
      />

      {aviso && <Toast message={aviso.msg} variant={aviso.tipo} onClose={() => setAviso(null)} />}
    </div>
  );
};

export default StaffAdmin;
