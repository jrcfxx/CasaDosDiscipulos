import React, { useEffect, useState } from "react";
import "../style/GerirUser.css";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import ConfirmModal from "../components/ui/ConfirmModal";
import Toast from "../components/ui/Toast";
import perfil from "../assets/perfil-preto.png";
import { ASSETS_BASE } from "../config/api";
import { showAllUsers, showUserById, createUser, updateUser } from "../services/usuario";
import {
  showAllNiveis,
  createNivel,
  updateNivel,
  deleteNivel,
  reativarNivel,
} from "../services/nivel";
import ministerioService from "../services/ministerioService";

interface Nivel {
  id_nivel: number;
  nome: string;
  descricao?: string;
  ordem: number;
  ativo: boolean;
}

interface Usuario {
  id_usuario?: number;
  nome: string;
  email: string;
  senha?: string;
  foto?: string;
  tipo: "lider" | "administrador" | "membro";
  id_nivel?: number | null;
  nivel_nome?: string | null;
  nivel_escola?: number | null;
  nivel_escola_nome?: string | null;
  nivel_exibir?: string | null;
  ativo?: boolean;
  lider_celula?: boolean;
  lider_ministerio?: boolean;
}

interface UsuarioModal {
  id_usuario?: number;
  nome: string;
  email: string;
  senha: string;
  foto?: File | string | null;
  confirmarSenha?: string;
  tipo: "lider" | "administrador" | "membro" | "";
  id_nivel?: number | null;
  lider_celula?: boolean;
  lider_ministerio?: boolean;
  id_ministerios_lider?: number[];
  id_ministerios_participa?: number[];
}

interface NivelModal {
  id_nivel?: number;
  nome: string;
  descricao: string;
  ordem: number;
}

interface MinisterioModal {
  id_ministerio?: number;
  nome: string;
  descricao: string;
  ordem: number;
  ativo: boolean;
  id_lideres: number[];
}

export default function GerenciarUsuarios() {
  const [abaAtiva, setAbaAtiva] = useState<"usuarios" | "niveis" | "ministerios">("usuarios");
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [niveis, setNiveis] = useState<Nivel[]>([]);
  const [filtro, setFiltro] = useState("");
  const [filtroNivel, setFiltroNivel] = useState<string>("");
  const [modalAberto, setModalAberto] = useState(false);
  const [usuarioModal, setUsuarioModal] = useState<UsuarioModal>({
    nome: "",
    email: "",
    senha: "",
    foto: null,
    confirmarSenha: "",
    tipo: "",
    id_nivel: null,
    lider_celula: true,
    lider_ministerio: false,
    id_ministerios_lider: [],
    id_ministerios_participa: [],
  });
  const [modalInativarAberto, setModalInativarAberto] = useState(false);
  const [usuarioInativar, setUsuarioInativar] = useState<Usuario | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<"success" | "error" | "info">("info");
  const [loading, setLoading] = useState(true);
  const [modalNivelAberto, setModalNivelAberto] = useState(false);
  const [nivelModal, setNivelModal] = useState<NivelModal>({
    nome: "",
    descricao: "",
    ordem: 0,
  });
  const [showConfirmInativarNivel, setShowConfirmInativarNivel] = useState(false);
  const [nivelToInativar, setNivelToInativar] = useState<number | null>(null);
  const [showConfirmReativarNivel, setShowConfirmReativarNivel] = useState(false);
  const [nivelToReativar, setNivelToReativar] = useState<number | null>(null);
  const [ministerios, setMinisterios] = useState<import("../services/ministerioService").Ministerio[]>([]);
  const [modalMinisterioAberto, setModalMinisterioAberto] = useState(false);
  const [ministerioModal, setMinisterioModal] = useState<MinisterioModal>({
    nome: "",
    descricao: "",
    ordem: 0,
    ativo: true,
    id_lideres: [],
  });
  const [showConfirmExcluirMinisterio, setShowConfirmExcluirMinisterio] = useState(false);
  const [ministerioToExcluir, setMinisterioToExcluir] = useState<number | null>(null);

  const tipoLabels: Record<string, string> = {
    lider: "Líder",
    administrador: "Admin",
    membro: "Membro",
  };

  useEffect(() => {
    fetchUsuarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchNiveis(abaAtiva === "niveis");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abaAtiva]);

  useEffect(() => {
    fetchMinisterios(abaAtiva === "ministerios");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abaAtiva]);

  useEffect(() => {
    if (modalAberto) fetchMinisterios(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalAberto]);

  const showToast = (msg: string, variant: "success" | "error" | "info" = "info") => {
    setToast(msg);
    setToastVariant(variant);
  };

  async function fetchUsuarios() {
    try {
      setLoading(true);
      const data = await showAllUsers();
      if (Array.isArray(data)) {
        setUsuarios(data);
      }
    } catch (err) {
      console.error("Erro ao carregar usuários:", err);
      showToast("Erro ao carregar usuários", "error");
    } finally {
      setLoading(false);
    }
  }

  async function fetchNiveis(incluirInativos = false) {
    try {
      const data = await showAllNiveis(incluirInativos);
      if (Array.isArray(data)) {
        setNiveis(data);
      }
    } catch (err) {
      console.error("Erro ao carregar níveis:", err);
      if (abaAtiva === "niveis") {
        showToast("Erro ao carregar níveis", "error");
      }
    }
  }

  async function fetchMinisterios(incluirInativos = false) {
    try {
      const data = await ministerioService.getAll(incluirInativos);
      setMinisterios(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro ao carregar ministérios:", err);
      if (abaAtiva === "ministerios") showToast("Erro ao carregar ministérios", "error");
    }
  }

  // Normaliza id_nivel para comparação (API pode retornar number, string ou estar em diferentes chaves)
  const getIdNivel = (u: Usuario | Record<string, unknown>): number | null => {
    const v = (u as Record<string, unknown>).id_nivel ?? (u as Record<string, unknown>).idNivel ?? (u as Usuario).id_nivel;
    if (v === null || v === undefined || v === "") return null;
    const n = Number(v);
    return Number.isNaN(n) || n <= 0 ? null : n;
  };

  const usuariosFiltrados = usuarios.filter((u) => {
    const matchNome = !filtro || u.nome.toLowerCase().includes(filtro.toLowerCase());

    let matchNivel = true;
    if (filtroNivel === "0") {
      const idNivel = getIdNivel(u);
      const nivelEscola = u.nivel_escola ?? null;
      matchNivel = idNivel === null && nivelEscola === null;
    } else if (filtroNivel !== "") {
      const idNivel = getIdNivel(u);
      const nivelEscola = u.nivel_escola ?? null;
      const idFiltro = Number(filtroNivel);
      matchNivel =
        !Number.isNaN(idFiltro) &&
        (idNivel === idFiltro || nivelEscola === idFiltro);
    }

    return matchNome && matchNivel;
  });

  const abrirModalCadastro = () => {
    setUsuarioModal({
      id_usuario: undefined,
      nome: "",
      email: "",
      senha: "",
      confirmarSenha: "",
      foto: null,
      tipo: "",
      id_nivel: null,
      lider_celula: true,
      lider_ministerio: false,
      id_ministerios_lider: [],
      id_ministerios_participa: [],
    });
    setModalAberto(true);
  };

  const abrirModalEdicao = async (u: Usuario) => {
    if (u.ativo === false) {
      showToast("Não é possível editar usuário inativo");
      return;
    }
    const id = u.id_usuario;
    if (!id) return;
    try {
      const usuarioAtual = await showUserById(id);
      if (!usuarioAtual) {
        showToast("Erro ao carregar dados do usuário", "error");
        return;
      }
      const idNivel = usuarioAtual.id_nivel != null
        ? (typeof usuarioAtual.id_nivel === "number"
          ? usuarioAtual.id_nivel
          : Number(usuarioAtual.id_nivel))
        : null;
      const idNivelFinal = idNivel != null && !Number.isNaN(idNivel) && idNivel > 0 ? idNivel : null;
      const idsLider = (usuarioAtual as Usuario & { id_ministerios_lider?: number[] }).id_ministerios_lider ?? [];
      const idsParticipa = (usuarioAtual as Usuario & { id_ministerios_participa?: number[] }).id_ministerios_participa ?? [];
      setUsuarioModal({
        id_usuario: usuarioAtual.id_usuario,
        nome: usuarioAtual.nome,
        email: usuarioAtual.email,
        senha: "",
        confirmarSenha: "",
        foto: usuarioAtual.foto || null,
        tipo: usuarioAtual.tipo,
        id_nivel: idNivelFinal,
        lider_celula: (usuarioAtual as Usuario).lider_celula ?? true,
        lider_ministerio: !!(usuarioAtual as Usuario).lider_ministerio,
        id_ministerios_lider: Array.isArray(idsLider) ? idsLider : [],
        id_ministerios_participa: Array.isArray(idsParticipa) ? idsParticipa : [],
      });
      setModalAberto(true);
    } catch (err) {
      console.error("Erro ao carregar usuário:", err);
      showToast("Erro ao carregar dados do usuário", "error");
    }
  };

  const handleChange = (
    campo: keyof UsuarioModal,
    valor: string | File | null | number | boolean | number[]
  ) => {
    setUsuarioModal((prev) => ({ ...prev, [campo]: valor }));
  };

  const fecharModal = () => {
    setModalAberto(false);
    setUsuarioModal({
      nome: "",
      email: "",
      senha: "",
      foto: null,
      confirmarSenha: "",
      tipo: "",
      id_nivel: null,
      lider_celula: true,
      lider_ministerio: false,
      id_ministerios_lider: [],
      id_ministerios_participa: [],
    });
  };

  const salvarUsuario = async () => {
    if (!usuarioModal.nome || !usuarioModal.email || !usuarioModal.tipo) {
      showToast("Preencha nome, email e tipo de usuário");
      return;
    }

    // Valida senha apenas para novo usuário ou se estiver preenchida
    if (!usuarioModal.id_usuario) {
      if (!usuarioModal.senha) {
        showToast("Senha é obrigatória para novo usuário");
        return;
      }
      if (usuarioModal.senha.length < 6) {
        showToast("Senha deve ter no mínimo 6 caracteres");
        return;
      }
    }

    // Se senha foi preenchida na edição, valida confirmação
    if (usuarioModal.senha || usuarioModal.confirmarSenha) {
      if (usuarioModal.senha !== usuarioModal.confirmarSenha) {
        showToast("As senhas não coincidem");
        return;
      }
      if (usuarioModal.senha && usuarioModal.senha.length < 6) {
        showToast("Senha deve ter no mínimo 6 caracteres");
        return;
      }
    }

    const userData: any = {
      nome: usuarioModal.nome,
      email: usuarioModal.email,
      tipo: usuarioModal.tipo,
      id_nivel: usuarioModal.id_nivel,
      ativo: true,
    };

    if (usuarioModal.tipo === "lider") {
      userData.lider_celula = Boolean(usuarioModal.lider_celula ?? true);
      const idsLider = usuarioModal.id_ministerios_lider ?? [];
      userData.lider_ministerio = idsLider.length > 0;
      userData.id_ministerios_lider = idsLider;
    }
    userData.id_ministerios_participa = usuarioModal.id_ministerios_participa ?? [];

    // Adiciona senha apenas se foi preenchida
    if (usuarioModal.senha) {
      userData.senha = usuarioModal.senha;
    }

    try {
      if (usuarioModal.id_usuario) {
        await updateUser(usuarioModal.id_usuario, userData);
        showToast("Usuário atualizado com sucesso!", "success");
      } else {
        await createUser(userData);
        showToast("Usuário criado com sucesso!", "success");
      }
      await fetchUsuarios();
      fecharModal();
    } catch (err: any) {
      console.error("Erro ao salvar usuário:", err);
      const msg = err?.response?.data?.error || "Erro ao salvar usuário";
      showToast(msg, "error");
    }
  };

  const abrirModalInativar = (usuario: Usuario) => {
    setUsuarioInativar(usuario);
    setModalInativarAberto(true);
  };

  const confirmarInativar = async () => {
    if (!usuarioInativar) return;
    const usuario = usuarioInativar;

    try {
      await updateUser(usuario.id_usuario!, {
        ativo: !usuario.ativo,
      });
      showToast(
        `Usuário ${usuario.ativo ? "inativado" : "reativado"} com sucesso!`,
        "success"
      );
      await fetchUsuarios();
      setModalInativarAberto(false);
      setUsuarioInativar(null);
    } catch (err) {
      console.error("Erro ao alterar status:", err);
      showToast("Erro ao alterar status do usuário", "error");
    }
  };

  // Níveis ativos (para select de usuário e filtro - exclui inativos)
  const niveisAtivos = niveis.filter((n) => Boolean(n.ativo));

  // Funções de Gerenciamento de Níveis
  const abrirModalNivelCadastro = () => {
    const proximaOrdem =
      niveis.length > 0
        ? Math.max(...niveis.map((n) => Number(n.ordem) || 0), 0) + 1
        : 1;
    setNivelModal({
      id_nivel: undefined,
      nome: "",
      descricao: "",
      ordem: proximaOrdem,
    });
    setModalNivelAberto(true);
  };

  const abrirModalNivelEdicao = (nivel: Nivel) => {
    setNivelModal({
      id_nivel: nivel.id_nivel,
      nome: nivel.nome,
      descricao: nivel.descricao || "",
      ordem: nivel.ordem,
    });
    setModalNivelAberto(true);
  };

  const fecharModalNivel = () => {
    setModalNivelAberto(false);
    setNivelModal({
      nome: "",
      descricao: "",
      ordem: 0,
    });
  };

  const salvarNivel = async () => {
    if (!nivelModal.nome) {
      showToast("Preencha o nome do nível");
      return;
    }

    const nivelData: Record<string, unknown> = {
      nome: nivelModal.nome.trim(),
      descricao: nivelModal.descricao?.trim() ?? "",
      ordem: nivelModal.ordem,
    };

    if (!nivelModal.id_nivel) {
      nivelData.ativo = true;
    }

    try {
      if (nivelModal.id_nivel) {
        await updateNivel(nivelModal.id_nivel, nivelData);
        showToast("Nível atualizado com sucesso!", "success");
      } else {
        await createNivel(nivelData);
        showToast("Nível criado com sucesso!", "success");
      }
      await fetchNiveis(abaAtiva === "niveis");
      fecharModalNivel();
    } catch (err: any) {
      console.error("Erro ao salvar nível:", err);
      const msg = err?.response?.data?.error || "Erro ao salvar nível";
      showToast(msg, "error");
    }
  };

  const handleInativarNivelClick = (id: number) => {
    setNivelToInativar(id);
    setShowConfirmInativarNivel(true);
  };

  const excluirNivelConfirm = async () => {
    if (nivelToInativar === null) return;
    const id = nivelToInativar;
    setShowConfirmInativarNivel(false);
    setNivelToInativar(null);
    try {
      await deleteNivel(id);
      showToast("Nível inativado com sucesso!", "success");
      await fetchNiveis(true);
    } catch (err: any) {
      console.error("Erro ao inativar nível:", err);
      const msg = err?.response?.data?.error || "Erro ao inativar nível";
      showToast(msg, "error");
    }
  };

  const handleReativarNivelClick = (id: number) => {
    setNivelToReativar(id);
    setShowConfirmReativarNivel(true);
  };

  const reativarNivelConfirm = async () => {
    if (nivelToReativar === null) return;
    const id = nivelToReativar;
    setShowConfirmReativarNivel(false);
    setNivelToReativar(null);
    try {
      await reativarNivel(id);
      showToast("Nível reativado com sucesso!", "success");
      await fetchNiveis(true);
    } catch (err: any) {
      console.error("Erro ao reativar nível:", err);
      const msg = err?.response?.data?.error || "Erro ao reativar nível";
      showToast(msg, "error");
    }
  };

  const lideresParaSelect = usuarios.filter((u) => u.tipo === "lider" && u.ativo);

  const salvarMinisterio = async () => {
    if (!ministerioModal.nome?.trim()) {
      showToast("Preencha o nome do ministério");
      return;
    }
    try {
      if (ministerioModal.id_ministerio) {
        await ministerioService.update(ministerioModal.id_ministerio, {
          nome: ministerioModal.nome.trim(),
          descricao: ministerioModal.descricao?.trim() || "",
          ordem: ministerioModal.ordem,
          ativo: ministerioModal.ativo,
          id_lideres: ministerioModal.id_lideres,
        });
        showToast("Ministério atualizado!", "success");
      } else {
        await ministerioService.create({
          nome: ministerioModal.nome.trim(),
          descricao: ministerioModal.descricao?.trim() || "",
          ordem: ministerioModal.ordem,
          ativo: ministerioModal.ativo,
          id_lideres: ministerioModal.id_lideres,
        });
        showToast("Ministério criado!", "success");
      }
      await fetchMinisterios(abaAtiva === "ministerios");
      setModalMinisterioAberto(false);
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Erro ao salvar ministério";
      showToast(msg, "error");
    }
  };

  const excluirMinisterioConfirm = async () => {
    if (ministerioToExcluir === null) return;
    try {
      await ministerioService.delete(ministerioToExcluir);
      showToast("Ministério excluído!", "success");
      await fetchMinisterios(true);
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Erro ao excluir ministério";
      showToast(msg, "error");
    }
    setShowConfirmExcluirMinisterio(false);
    setMinisterioToExcluir(null);
  };

  return (
    <div className="gerir-container page-with-fixed-header">
      <Header />

      <main className="gerir-main">
        <h1 className="gerir-title">Gerenciamento</h1>

        {/* Tabs de navegação */}
        <div className="tabs-container">
          <button
            className={`tab ${abaAtiva === "usuarios" ? "active" : ""}`}
            onClick={() => setAbaAtiva("usuarios")}
          >
            Usuários
          </button>
          <button
            className={`tab ${abaAtiva === "niveis" ? "active" : ""}`}
            onClick={() => setAbaAtiva("niveis")}
          >
            Níveis
          </button>
          <button
            className={`tab ${abaAtiva === "ministerios" ? "active" : ""}`}
            onClick={() => setAbaAtiva("ministerios")}
          >
            Ministérios
          </button>
        </div>

        {/* Conteúdo da aba Usuários */}
        {abaAtiva === "usuarios" && (
          <>
            <div className="busca-container">
              <input
                type="text"
                placeholder="Buscar usuário por nome..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
              />
              <select
                className="filtro-nivel"
                value={filtroNivel}
                onChange={(e) => setFiltroNivel(e.target.value)}
              >
                <option value="">Todos os níveis</option>
                <option value="0">Sem nível</option>
                {niveisAtivos.map((nivel) => (
                  <option key={nivel.id_nivel} value={String(nivel.id_nivel)}>
                    {nivel.nome}
                  </option>
                ))}
              </select>
              <button
                className="btn-add"
                onClick={abrirModalCadastro}
                title="Criar novo usuário"
              >
                +
              </button>
            </div>

            {loading ? (
              <div className="loading-message">Carregando usuários...</div>
            ) : usuariosFiltrados.length === 0 ? (
              <div className="empty-state">
                <h3>Nenhum usuário encontrado</h3>
                <p>
                  {filtro || filtroNivel
                    ? "Tente outro termo ou filtro de nível"
                    : "Clique em + para criar o primeiro usuário"}
                </p>
              </div>
            ) : (
              <div className="cards-container">
                {usuariosFiltrados.map((usuario) => {
                  const fotoUrl = usuario.foto
                    ? usuario.foto.startsWith("http")
                      ? usuario.foto
                      : `${ASSETS_BASE}${usuario.foto}`
                    : perfil;
                  const nivelNome =
                    usuario.nivel_exibir ??
                    usuario.nivel_escola_nome ??
                    usuario.nivel_nome ??
                    (getIdNivel(usuario) != null
                      ? niveis.find((n) => Number(n.id_nivel) === Number(getIdNivel(usuario)))?.nome
                      : null);
                  const tipoTexto = usuario.ativo ? tipoLabels[usuario.tipo] : "INATIVADO";
                  const nivelTexto =
                    usuario.ativo && nivelNome ? `${tipoTexto} · ${nivelNome}` : tipoTexto;

                  return (
                    <div
                      className={`user-card ${!usuario.ativo ? "inativo" : ""}`}
                      key={usuario.id_usuario}
                    >
                      <img src={fotoUrl} alt={usuario.nome} />
                      <p className="nivel">{nivelTexto}</p>
                      <h3>{usuario.nome}</h3>
                      <p className="email">{usuario.email}</p>
                      <div className="card-buttons">
                        <button
                          className="editar-btn"
                          onClick={() => abrirModalEdicao(usuario)}
                          disabled={usuario.ativo === false}
                        >
                          Editar
                        </button>
                        <button
                          className={`inativar-btn ${
                            usuario.ativo ? "" : "reativar"
                          }`}
                          onClick={() => abrirModalInativar(usuario)}
                        >
                          {usuario.ativo ? "Inativar" : "Reativar"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Conteúdo da aba Níveis */}
        {abaAtiva === "niveis" && (
          <>
            <div className="busca-container">
              <button
                className="btn-add"
                onClick={abrirModalNivelCadastro}
                title="Criar novo nível"
              >
                +
              </button>
            </div>

            {niveis.length === 0 ? (
              <div className="empty-state">
                <h3>Nenhum nível cadastrado</h3>
                <p>Clique em + para criar o primeiro nível</p>
              </div>
            ) : (
            <div className="niveis-table-container">
              <table className="niveis-table">
                <thead>
                  <tr>
                    <th>Ordem</th>
                    <th>Nome</th>
                    <th>Descrição</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {niveis.map((nivel) => {
                    const inativo = !nivel.ativo;
                    return (
                      <tr key={nivel.id_nivel} className={inativo ? "nivel-inativo" : ""}>
                        <td>{nivel.ordem}</td>
                        <td>
                          {nivel.nome}
                          {inativo && <span className="badge-inativo">Inativo</span>}
                        </td>
                        <td>{nivel.descricao || "-"}</td>
                        <td className="acoes">
                          <button
                            className="btn-edit"
                            onClick={() => abrirModalNivelEdicao(nivel)}
                          >
                            Editar
                          </button>
                          {inativo ? (
                            <button
                              className="btn-reativar"
                              onClick={() => handleReativarNivelClick(nivel.id_nivel)}
                            >
                              Reativar
                            </button>
                          ) : (
                            <button
                              className="btn-delete"
                              onClick={() => handleInativarNivelClick(nivel.id_nivel)}
                            >
                              Inativar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            )}
          </>
        )}

        {/* Conteúdo da aba Ministérios */}
        {abaAtiva === "ministerios" && (
          <>
            <div className="busca-container">
              <button
                className="btn-add"
                onClick={() => {
                  setMinisterioModal({
                    id_ministerio: undefined,
                    nome: "",
                    descricao: "",
                    ordem: ministerios.length + 1,
                    ativo: true,
                    id_lideres: [],
                  });
                  setModalMinisterioAberto(true);
                }}
                title="Criar novo ministério"
              >
                +
              </button>
            </div>

            {ministerios.length === 0 ? (
              <div className="empty-state">
                <h3>Nenhum ministério cadastrado</h3>
                <p>Clique em + para criar o primeiro ministério</p>
              </div>
            ) : (
              <div className="niveis-table-container">
                <table className="niveis-table">
                  <thead>
                    <tr>
                      <th>Ordem</th>
                      <th>Nome</th>
                      <th>Líderes</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ministerios.map((m) => (
                      <tr key={m.id_ministerio} className={!m.ativo ? "nivel-inativo" : ""}>
                        <td>{m.ordem}</td>
                        <td>
                          {m.nome}
                          {!m.ativo && <span className="badge-inativo">Inativo</span>}
                        </td>
                        <td>
                          {(m.lideres || []).map((l) => l.nome).join(", ") || "-"}
                        </td>
                        <td className="acoes">
                          <button
                            className="btn-edit"
                            onClick={() => {
                              setMinisterioModal({
                                id_ministerio: m.id_ministerio,
                                nome: m.nome,
                                descricao: m.descricao || "",
                                ordem: m.ordem,
                                ativo: m.ativo,
                                id_lideres: (m.lideres || []).map((l) => l.id_usuario),
                              });
                              setModalMinisterioAberto(true);
                            }}
                          >
                            Editar
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => {
                              setMinisterioToExcluir(m.id_ministerio);
                              setShowConfirmExcluirMinisterio(true);
                            }}
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
          </>
        )}
      </main>

      {/* Modal de Cadastro/Edição de Usuário */}
      {modalAberto && (
        <div className="modal-fundo" onClick={fecharModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>
              {usuarioModal.id_usuario ? "Editar Usuário" : "Novo Usuário"}
            </h2>

            <div className="modal-content">
              <label>Nome Completo</label>
              <input
                type="text"
                value={usuarioModal.nome || ""}
                onChange={(e) => handleChange("nome", e.target.value)}
                placeholder="Digite o nome completo"
              />

              <label>Email</label>
              <input
                type="email"
                value={usuarioModal.email || ""}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="Digite o email"
              />

              <label>Tipo de Usuário</label>
              <select
                value={usuarioModal.tipo}
                onChange={(e) => handleChange("tipo", e.target.value)}
              >
                <option value="">Selecione o tipo</option>
                <option value="membro">Membro</option>
                <option value="lider">Líder</option>
                <option value="administrador">Administrador</option>
              </select>

              {usuarioModal.tipo === "lider" && (
                <div className="lider-permissoes">
                  <p className="lider-permissoes-title">Permissões do líder</p>
                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={usuarioModal.lider_celula ?? true}
                      onChange={(e) => handleChange("lider_celula", e.target.checked)}
                    />
                    <span>Líder de célula (acesso à Secretaria das Células)</span>
                  </label>
                  <div className="ministerios-lider-box">
                    <p className="lider-permissoes-title">Ministérios que lidera (acesso à Escala)</p>
                    {ministerios.filter((m) => m.ativo).map((m) => (
                      <label key={m.id_ministerio} className="checkbox-row">
                        <input
                          type="checkbox"
                          checked={(usuarioModal.id_ministerios_lider ?? []).includes(m.id_ministerio)}
                          onChange={(e) => {
                            const prev = usuarioModal.id_ministerios_lider ?? [];
                            const next = e.target.checked
                              ? [...prev, m.id_ministerio]
                              : prev.filter((id) => id !== m.id_ministerio);
                            handleChange("id_ministerios_lider", next);
                          }}
                        />
                        <span>{m.nome}</span>
                      </label>
                    ))}
                    {ministerios.filter((m) => m.ativo).length === 0 && (
                      <p className="hint">Cadastre ministérios na aba Ministérios</p>
                    )}
                  </div>
                </div>
              )}

              <label>Ministérios em que participa</label>
              <div className="ministerios-participa-box">
                {ministerios.filter((m) => m.ativo).map((m) => (
                  <label key={m.id_ministerio} className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={(usuarioModal.id_ministerios_participa ?? []).includes(m.id_ministerio)}
                      onChange={(e) => {
                        const prev = usuarioModal.id_ministerios_participa ?? [];
                        const next = e.target.checked
                          ? [...prev, m.id_ministerio]
                          : prev.filter((id) => id !== m.id_ministerio);
                        handleChange("id_ministerios_participa", next);
                      }}
                    />
                    <span>{m.nome}</span>
                  </label>
                ))}
                {ministerios.filter((m) => m.ativo).length === 0 && (
                  <p className="hint">Nenhum ministério cadastrado</p>
                )}
              </div>

              <label>Nível</label>
              <select
                key={`nivel-${usuarioModal.id_usuario ?? "new"}-${usuarioModal.id_nivel ?? "x"}`}
                value={
                  usuarioModal.id_nivel != null && usuarioModal.id_nivel !== 0
                    ? String(usuarioModal.id_nivel)
                    : ""
                }
                onChange={(e) =>
                  handleChange(
                    "id_nivel",
                    e.target.value ? parseInt(e.target.value, 10) : null
                  )
                }
              >
                <option value="">Sem nível atribuído</option>
                {niveisAtivos.map((nivel) => (
                  <option key={nivel.id_nivel} value={String(nivel.id_nivel)}>
                    {nivel.nome}
                  </option>
                ))}
              </select>

              <label>
                Senha{" "}
                {usuarioModal.id_usuario && "(Deixar vazio para não alterar)"}
              </label>
              <input
                type="password"
                value={usuarioModal.senha || ""}
                onChange={(e) => handleChange("senha", e.target.value)}
                placeholder={
                  usuarioModal.id_usuario
                    ? "Nova senha (opcional)"
                    : "Mínimo 6 caracteres"
                }
              />

              <label>Confirmar Senha</label>
              <input
                type="password"
                value={usuarioModal.confirmarSenha || ""}
                onChange={(e) => handleChange("confirmarSenha", e.target.value)}
                placeholder="Repita a senha"
              />
            </div>

            <div className="modal-buttons">
              <button onClick={fecharModal}>Cancelar</button>
              <button onClick={salvarUsuario}>
                {usuarioModal.id_usuario
                  ? "Salvar Alterações"
                  : "Criar Usuário"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Inativar/Reativar */}
      {modalInativarAberto && usuarioInativar && (
        <div
          className="modal-fundo"
          onClick={() => setModalInativarAberto(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>
              {usuarioInativar.ativo ? "Inativar" : "Reativar"}{" "}
              Usuário
            </h2>
            <p className="modal-confirm-text">
              Tem certeza que deseja{" "}
              {usuarioInativar.ativo ? "inativar" : "reativar"}{" "}
              <strong>{usuarioInativar.nome}</strong>?
            </p>
            <div className="modal-buttons">
              <button onClick={() => setModalInativarAberto(false)}>
                Cancelar
              </button>
              <button onClick={confirmarInativar}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cadastro/Edição de Nível */}
      {modalNivelAberto && (
        <div className="modal-fundo" onClick={fecharModalNivel}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{nivelModal.id_nivel ? "Editar Nível" : "Novo Nível"}</h2>

            <div className="modal-content">
              <label>Nome do Nível</label>
              <input
                type="text"
                value={nivelModal.nome || ""}
                onChange={(e) =>
                  setNivelModal((prev) => ({ ...prev, nome: e.target.value }))
                }
                placeholder="Ex: Discípulo"
              />

              <label>Descrição</label>
              <textarea
                value={nivelModal.descricao || ""}
                onChange={(e) =>
                  setNivelModal((prev) => ({
                    ...prev,
                    descricao: e.target.value,
                  }))
                }
                placeholder="Descrição opcional do nível"
                rows={3}
              />

              <label>Ordem de Progressão</label>
              <input
                type="number"
                value={nivelModal.ordem || 0}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  setNivelModal((prev) => ({
                    ...prev,
                    ordem: isNaN(v) ? 1 : Math.max(1, v),
                  }));
                }}
                min="1"
              />
            </div>

            <div className="modal-buttons">
              <button onClick={fecharModalNivel}>Cancelar</button>
              <button onClick={salvarNivel}>
                {nivelModal.id_nivel ? "Salvar Alterações" : "Criar Nível"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={showConfirmInativarNivel}
        title="Tem certeza?"
        message="Deseja realmente inativar este nível? Usuários e módulos vinculados terão a referência removida."
        confirmLabel="Inativar"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={excluirNivelConfirm}
        onCancel={() => {
          setShowConfirmInativarNivel(false);
          setNivelToInativar(null);
        }}
      />

      <ConfirmModal
        open={showConfirmReativarNivel}
        title="Reativar nível"
        message="Deseja reativar este nível?"
        confirmLabel="Reativar"
        cancelLabel="Cancelar"
        variant="default"
        onConfirm={reativarNivelConfirm}
        onCancel={() => {
          setShowConfirmReativarNivel(false);
          setNivelToReativar(null);
        }}
      />

      {/* Modal de Cadastro/Edição de Ministério */}
      {modalMinisterioAberto && (
        <div className="modal-fundo" onClick={() => setModalMinisterioAberto(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{ministerioModal.id_ministerio ? "Editar Ministério" : "Novo Ministério"}</h2>
            <div className="modal-content">
              <label>Nome</label>
              <input
                type="text"
                value={ministerioModal.nome || ""}
                onChange={(e) => setMinisterioModal((p) => ({ ...p, nome: e.target.value }))}
                placeholder="Ex: Louvor"
              />
              <label>Descrição</label>
              <textarea
                value={ministerioModal.descricao || ""}
                onChange={(e) => setMinisterioModal((p) => ({ ...p, descricao: e.target.value }))}
                placeholder="Opcional"
                rows={2}
              />
              <label>Ordem</label>
              <input
                type="number"
                value={ministerioModal.ordem || 0}
                onChange={(e) =>
                  setMinisterioModal((p) => ({
                    ...p,
                    ordem: Math.max(0, parseInt(e.target.value, 10) || 0),
                  }))
                }
                min="0"
              />
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={ministerioModal.ativo}
                  onChange={(e) => setMinisterioModal((p) => ({ ...p, ativo: e.target.checked }))}
                />
                <span>Ativo</span>
              </label>
              <label>Líderes do ministério</label>
              <div className="ministerios-participa-box">
                {lideresParaSelect.map((u) => (
                  <label key={u.id_usuario!} className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={ministerioModal.id_lideres.includes(u.id_usuario!)}
                      onChange={(e) => {
                        const prev = ministerioModal.id_lideres;
                        const next = e.target.checked
                          ? [...prev, u.id_usuario!]
                          : prev.filter((id) => id !== u.id_usuario);
                        setMinisterioModal((p) => ({ ...p, id_lideres: next }));
                      }}
                    />
                    <span>{u.nome}</span>
                  </label>
                ))}
                {lideresParaSelect.length === 0 && (
                  <p className="hint">Nenhum líder cadastrado. Crie usuários do tipo Líder primeiro.</p>
                )}
              </div>
            </div>
            <div className="modal-buttons">
              <button onClick={() => setModalMinisterioAberto(false)}>Cancelar</button>
              <button onClick={salvarMinisterio}>
                {ministerioModal.id_ministerio ? "Salvar" : "Criar Ministério"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={showConfirmExcluirMinisterio}
        title="Excluir ministério?"
        message="Esta ação não pode ser desfeita. As vinculações com usuários e eventos serão removidas."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={excluirMinisterioConfirm}
        onCancel={() => {
          setShowConfirmExcluirMinisterio(false);
          setMinisterioToExcluir(null);
        }}
      />

      {toast && (
        <Toast
          message={toast}
          onClose={() => setToast(null)}
          variant={toastVariant}
        />
      )}

      <Footer />
    </div>
  );
}
