import React, { useEffect, useState } from "react";
import "../style/GerirCelulas.css";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import ConfirmModal from "../components/ui/ConfirmModal";
import Toast from "../components/ui/Toast";

import celulaService, { Celula, CelulaCreateUpdate } from "../services/celulaService";
import { showAllUsers } from "../services/usuario";

interface CelulaModal extends CelulaCreateUpdate {
  id_celula?: number;
}

const DIAS_SEMANA = [
  { value: "", label: "Selecione" },
  { value: "segunda", label: "Segunda" },
  { value: "terça", label: "Terça" },
  { value: "quarta", label: "Quarta" },
  { value: "quinta", label: "Quinta" },
  { value: "sexta", label: "Sexta" },
  { value: "sábado", label: "Sábado" },
  { value: "domingo", label: "Domingo" },
];

export default function GerirCelulas() {
  const [celulas, setCelulas] = useState<Celula[]>([]);
  const [lideres, setLideres] = useState<Array<{ id_usuario: number; nome: string }>>([]);
  const [filtro, setFiltro] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [celulaModal, setCelulaModal] = useState<CelulaModal>({
    nome: "",
    endereco: "",
    id_lideres: [],
    dia_reuniao: "",
    horario_reuniao: "",
    ativa: true,
  });
  const [showConfirmExcluir, setShowConfirmExcluir] = useState(false);
  const [celulaToExcluir, setCelulaToExcluir] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<"success" | "error" | "info">("info");
  const [buscaLider, setBuscaLider] = useState("");

  useEffect(() => {
    fetchCelulas();
    fetchLideres();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = (msg: string, variant: "success" | "error" | "info" = "info") => {
    setToast(msg);
    setToastVariant(variant);
  };

  async function fetchCelulas() {
    try {
      setLoading(true);
      const data = await celulaService.getAll();
      setCelulas(data ?? []);
    } catch (err) {
      console.error("Erro ao carregar células:", err);
      showToast("Erro ao carregar células", "error");
    } finally {
      setLoading(false);
    }
  }

  async function fetchLideres() {
    try {
      const data = await showAllUsers();
      const users = Array.isArray(data) ? data : [];
      const l = users
        .filter((u: { tipo?: string }) => u.tipo === "lider")
        .map((u: { id_usuario: number; nome: string }) => ({
          id_usuario: u.id_usuario,
          nome: u.nome,
        }));
      setLideres(l);
    } catch (err) {
      console.error("Erro ao carregar líderes:", err);
    }
  }

  const celulasFiltradas = celulas.filter((c) =>
    !filtro || c.nome.toLowerCase().includes(filtro.toLowerCase())
  );

  const formatarHorario = (h: string | undefined) => {
    if (!h) return "-";
    const s = String(h);
    if (s.length >= 5) return s.substring(0, 5);
    return s;
  };

  const abrirModalCadastro = () => {
    setCelulaModal({
      id_celula: undefined,
      nome: "",
      endereco: "",
      id_lideres: lideres[0] ? [lideres[0].id_usuario] : [],
      dia_reuniao: "",
      horario_reuniao: "",
      ativa: true,
    });
    setModalAberto(true);
  };

  const abrirModalEdicao = (c: Celula) => {
    setCelulaModal({
      id_celula: c.id_celula,
      nome: c.nome,
      endereco: c.endereco ?? "",
      id_lideres: c.id_lideres ?? (c.id_lider ? [c.id_lider] : []),
      dia_reuniao: c.dia_reuniao ?? "",
      horario_reuniao: formatarHorario(c.horario_reuniao),
      ativa: Boolean(c.ativa),
    });
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setBuscaLider("");
  };

  const handleChange = (campo: keyof CelulaModal, valor: string | number | boolean | number[]) => {
    setCelulaModal((prev) => ({ ...prev, [campo]: valor }));
  };

  const toggleLider = (idUsuario: number) => {
    setCelulaModal((prev) => {
      const ids = prev.id_lideres ?? [];
      const idx = ids.indexOf(idUsuario);
      if (idx >= 0) {
        const next = ids.filter((x) => x !== idUsuario);
        return { ...prev, id_lideres: next };
      }
      return { ...prev, id_lideres: [...ids, idUsuario] };
    });
  };

  const salvarCelula = async () => {
    if (!celulaModal.nome?.trim()) {
      showToast("Nome da célula é obrigatório", "error");
      return;
    }
    const idsLideres = celulaModal.id_lideres ?? [];
    if (idsLideres.length === 0) {
      showToast("Selecione pelo menos um líder", "error");
      return;
    }

    const payload: CelulaCreateUpdate = {
      nome: celulaModal.nome.trim(),
      endereco: celulaModal.endereco?.trim() || null,
      id_lideres: idsLideres,
      dia_reuniao: celulaModal.dia_reuniao || null,
      horario_reuniao: celulaModal.horario_reuniao || null,
      ativa: celulaModal.ativa ?? true,
    };

    try {
      if (celulaModal.id_celula) {
        await celulaService.update(celulaModal.id_celula, payload);
        showToast("Célula atualizada com sucesso!", "success");
      } else {
        await celulaService.create(payload);
        showToast("Célula criada com sucesso!", "success");
      }
      await fetchCelulas();
      fecharModal();
    } catch (err: unknown) {
      console.error("Erro ao salvar célula:", err);
      const e = err as { response?: { data?: { error?: string } } };
      showToast(e?.response?.data?.error || "Erro ao salvar célula", "error");
    }
  };

  const handleExcluirClick = (id: number) => {
    setCelulaToExcluir(id);
    setShowConfirmExcluir(true);
  };

  const confirmarExcluir = async () => {
    if (celulaToExcluir === null) return;
    const id = celulaToExcluir;
    setShowConfirmExcluir(false);
    setCelulaToExcluir(null);
    try {
      await celulaService.delete(id);
      showToast("Célula removida com sucesso!", "success");
      await fetchCelulas();
    } catch (err) {
      console.error("Erro ao excluir célula:", err);
      showToast("Erro ao excluir célula", "error");
    }
  };

  const handleToggleAtiva = async (c: Celula) => {
    try {
      const horario = c.horario_reuniao?.includes(":")
        ? c.horario_reuniao.substring(0, 5)
        : c.horario_reuniao ?? null;
      const idsLideres = c.id_lideres ?? (c.id_lider ? [c.id_lider] : []);
      const payload: CelulaCreateUpdate = {
        nome: c.nome,
        endereco: c.endereco ?? null,
        id_lideres: idsLideres,
        dia_reuniao: c.dia_reuniao ?? null,
        horario_reuniao: horario,
        ativa: !c.ativa,
      };
      await celulaService.update(c.id_celula, payload);
      showToast(`Célula ${c.ativa ? "inativada" : "ativada"} com sucesso!`, "success");
      await fetchCelulas();
    } catch (err) {
      console.error("Erro ao alterar status:", err);
      showToast("Erro ao alterar status", "error");
    }
  };

  return (
    <div className="gerir-celulas-container page-with-fixed-header">
      <Header />

      <main className="gerir-main">
        <h1 className="gerir-title">Células</h1>

        <div className="busca-container">
          <input
            type="text"
            placeholder="Buscar célula por nome..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
          <button className="btn-add" onClick={abrirModalCadastro} title="Criar nova célula">
            +
          </button>
        </div>

        {loading ? (
          <div className="loading-message">Carregando células...</div>
        ) : celulasFiltradas.length === 0 ? (
          <div className="empty-state">
            <h3>Nenhuma célula encontrada</h3>
            <p>
              {filtro
                ? "Tente outro termo de busca"
                : "Clique em + para criar a primeira célula"}
            </p>
          </div>
        ) : (
          <div className="celulas-table-container">
            <table className="celulas-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Líder</th>
                  <th>Dia</th>
                  <th>Horário</th>
                  <th>Endereço</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {celulasFiltradas.map((celula) => (
                  <tr key={celula.id_celula} className={!celula.ativa ? "celula-inativa" : ""}>
                    <td>{celula.nome}</td>
                    <td>{celula.nome_lider || "-"}</td>
                    <td>
                      {celula.dia_reuniao
                        ? DIAS_SEMANA.find((d) => d.value === celula.dia_reuniao)?.label ??
                          celula.dia_reuniao
                        : "-"}
                    </td>
                    <td>{formatarHorario(celula.horario_reuniao)}</td>
                    <td>{celula.endereco || "-"}</td>
                    <td>
                      <span className={`badge badge-${celula.ativa ? "ativo" : "inativo"}`}>
                        {celula.ativa ? "Ativa" : "Inativa"}
                      </span>
                    </td>
                    <td className="acoes">
                      <button
                        className="btn-edit"
                        onClick={() => abrirModalEdicao(celula)}
                      >
                        Editar
                      </button>
                      <button
                        className="btn-toggle"
                        onClick={() => handleToggleAtiva(celula)}
                      >
                        {celula.ativa ? "Inativar" : "Reativar"}
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleExcluirClick(celula.id_celula)}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Modal Cadastro/Edição */}
      {modalAberto && (
        <div className="modal-fundo">
          <div className="modal">
            <h2>{celulaModal.id_celula ? "Editar Célula" : "Nova Célula"}</h2>

            <div className="modal-content">
              <label>Nome da célula *</label>
              <input
                type="text"
                value={celulaModal.nome || ""}
                onChange={(e) => handleChange("nome", e.target.value)}
                placeholder="Ex: Célula Esperança"
              />

              <label>Líderes *</label>
              <div className="lideres-select-wrapper">
                <div className="lideres-search">
                  <span className="lideres-search-icon" aria-hidden>🔍</span>
                  <input
                    type="text"
                    placeholder="Buscar líder pelo nome..."
                    value={buscaLider}
                    onChange={(e) => setBuscaLider(e.target.value)}
                    className="lideres-search-input"
                  />
                </div>
                <div className="lideres-selected-count">
                  {(celulaModal.id_lideres ?? []).length} selecionado(s)
                </div>
                <div className="lideres-list">
                  {lideres
                    .filter((l) =>
                      !buscaLider.trim()
                        ? true
                        : l.nome.toLowerCase().includes(buscaLider.toLowerCase())
                    )
                    .map((l) => (
                      <label key={l.id_usuario} className={`lider-item ${(celulaModal.id_lideres ?? []).includes(l.id_usuario) ? "selected" : ""}`}>
                        <input
                          type="checkbox"
                          checked={(celulaModal.id_lideres ?? []).includes(l.id_usuario)}
                          onChange={() => toggleLider(l.id_usuario)}
                        />
                        <span className="lider-item-nome">{l.nome}</span>
                      </label>
                    ))}
                  {lideres.filter((l) =>
                    !buscaLider.trim()
                      ? true
                      : l.nome.toLowerCase().includes(buscaLider.toLowerCase())
                  ).length === 0 && (
                    <div className="lideres-empty">
                      {buscaLider.trim()
                        ? `Nenhum líder encontrado para "${buscaLider}"`
                        : "Nenhum líder cadastrado"}
                    </div>
                  )}
                </div>
              </div>

              <label>Dia da reunião</label>
              <select
                value={celulaModal.dia_reuniao || ""}
                onChange={(e) => handleChange("dia_reuniao", e.target.value)}
              >
                {DIAS_SEMANA.map((d) => (
                  <option key={d.value || "vazio"} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>

              <label>Horário (HH:MM)</label>
              <input
                type="time"
                value={celulaModal.horario_reuniao || ""}
                onChange={(e) => handleChange("horario_reuniao", e.target.value)}
              />

              <label>Endereço / Local</label>
              <input
                type="text"
                value={celulaModal.endereco || ""}
                onChange={(e) => handleChange("endereco", e.target.value)}
                placeholder="Ex: Rua das Flores, 123"
              />

              <label>
                <input
                  type="checkbox"
                  checked={celulaModal.ativa ?? true}
                  onChange={(e) => handleChange("ativa", e.target.checked)}
                />{" "}
                Ativa
              </label>
            </div>

            <div className="modal-buttons">
              <button onClick={fecharModal}>Cancelar</button>
              <button onClick={salvarCelula}>
                {celulaModal.id_celula ? "Salvar Alterações" : "Criar Célula"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={showConfirmExcluir}
        title="Excluir célula"
        message="Tem certeza que deseja excluir esta célula? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={confirmarExcluir}
        onCancel={() => {
          setShowConfirmExcluir(false);
          setCelulaToExcluir(null);
        }}
      />

      {toast && (
        <Toast message={toast} onClose={() => setToast(null)} variant={toastVariant} />
      )}

      <Footer />
    </div>
  );
}
