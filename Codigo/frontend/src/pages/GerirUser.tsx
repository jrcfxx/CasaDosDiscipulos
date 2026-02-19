import React, { useEffect, useState } from "react";
import "../style/GerirUser.css";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import ConfirmModal from "../components/ui/ConfirmModal";
import perfil from "../assets/perfil-preto.png";
import { showAllUsers, createUser, updateUser } from "../services/usuario";
import {
  showAllNiveis,
  createNivel,
  updateNivel,
  deleteNivel,
} from "../services/nivel";

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
  ativo?: boolean;
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
}

interface NivelModal {
  id_nivel?: number;
  nome: string;
  descricao: string;
  ordem: number;
}

export default function GerenciarUsuarios() {
  const [abaAtiva, setAbaAtiva] = useState<"usuarios" | "niveis">("usuarios");
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [niveis, setNiveis] = useState<Nivel[]>([]);
  const [filtro, setFiltro] = useState("");
  const [filtroNivel, setFiltroNivel] = useState<number | "">("");
  const [modalAberto, setModalAberto] = useState(false);
  const [usuarioModal, setUsuarioModal] = useState<UsuarioModal>({
    nome: "",
    email: "",
    senha: "",
    foto: null,
    confirmarSenha: "",
    tipo: "",
    id_nivel: null,
  });
  const [modalInativarAberto, setModalInativarAberto] = useState(false);
  const [usuarioInativarIndex, setUsuarioInativarIndex] = useState<
    number | null
  >(null);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalNivelAberto, setModalNivelAberto] = useState(false);
  const [nivelModal, setNivelModal] = useState<NivelModal>({
    nome: "",
    descricao: "",
    ordem: 0,
  });
  const [showConfirmInativarNivel, setShowConfirmInativarNivel] = useState(false);
  const [nivelToInativar, setNivelToInativar] = useState<number | null>(null);

  const tipoLabels: Record<string, string> = {
    lider: "Líder",
    administrador: "Admin",
    membro: "Membro",
  };

  useEffect(() => {
    fetchUsuarios();
    fetchNiveis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
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
      showToast("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  }

  async function fetchNiveis() {
    try {
      const data = await showAllNiveis();
      if (Array.isArray(data)) {
        setNiveis(data);
      }
    } catch (err) {
      console.error("Erro ao carregar níveis:", err);
    }
  }

  const usuariosFiltrados = usuarios.filter((u) => {
    const matchNome = u.nome.toLowerCase().includes(filtro.toLowerCase());

    let matchNivel = true;
    if (filtroNivel === 0) {
      // Filtrar usuários sem nível
      matchNivel = u.id_nivel === null || u.id_nivel === undefined;
    } else if (filtroNivel !== "") {
      // Filtrar por nível específico
      matchNivel = u.id_nivel === filtroNivel;
    }
    // Se filtroNivel === "", mostra todos

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
    });
    setModalAberto(true);
  };

  const abrirModalEdicao = (index: number) => {
    const u = usuarios[index];
    if (u.ativo === false) {
      showToast("Não é possível editar usuário inativo");
      return;
    }
    setUsuarioModal({
      id_usuario: u.id_usuario,
      nome: u.nome,
      email: u.email,
      senha: "",
      confirmarSenha: "",
      foto: u.foto || perfil,
      tipo: u.tipo,
      id_nivel: u.id_nivel || null,
    });
    setModalAberto(true);
  };

  const handleChange = (
    campo: keyof UsuarioModal,
    valor: string | File | null | number
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

    // Se senha foi preenchida, valida confirmação
    if (usuarioModal.senha || usuarioModal.confirmarSenha) {
      if (usuarioModal.senha !== usuarioModal.confirmarSenha) {
        showToast("As senhas não coincidem");
        return;
      }
      if (usuarioModal.senha.length < 6) {
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

    // Adiciona senha apenas se foi preenchida
    if (usuarioModal.senha) {
      userData.senha = usuarioModal.senha;
    }

    try {
      if (usuarioModal.id_usuario) {
        await updateUser(usuarioModal.id_usuario, userData);
        showToast("Usuário atualizado com sucesso!");
      } else {
        await createUser(userData);
        showToast("Usuário criado com sucesso!");
      }
      await fetchUsuarios();
      fecharModal();
    } catch (err: any) {
      console.error("Erro ao salvar usuário:", err);
      const msg = err?.response?.data?.error || "Erro ao salvar usuário";
      showToast(msg);
    }
  };

  const abrirModalInativar = (index: number) => {
    setUsuarioInativarIndex(index);
    setModalInativarAberto(true);
  };

  const confirmarInativar = async () => {
    if (usuarioInativarIndex === null) return;
    const usuario = usuarios[usuarioInativarIndex];

    try {
      await updateUser(usuario.id_usuario!, {
        ativo: !usuario.ativo,
      });
      showToast(
        `Usuário ${usuario.ativo ? "inativado" : "reativado"} com sucesso!`
      );
      await fetchUsuarios();
      setModalInativarAberto(false);
      setUsuarioInativarIndex(null);
    } catch (err) {
      console.error("Erro ao alterar status:", err);
      showToast("Erro ao alterar status do usuário");
    }
  };

  // Funções de Gerenciamento de Níveis
  const abrirModalNivelCadastro = () => {
    setNivelModal({
      id_nivel: undefined,
      nome: "",
      descricao: "",
      ordem: niveis.length + 1,
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

    const nivelData = {
      nome: nivelModal.nome,
      descricao: nivelModal.descricao,
      ordem: nivelModal.ordem,
      ativo: true,
    };

    try {
      if (nivelModal.id_nivel) {
        await updateNivel(nivelModal.id_nivel, nivelData);
        showToast("Nível atualizado com sucesso!");
      } else {
        await createNivel(nivelData);
        showToast("Nível criado com sucesso!");
      }
      await fetchNiveis();
      fecharModalNivel();
    } catch (err: any) {
      console.error("Erro ao salvar nível:", err);
      const msg = err?.response?.data?.error || "Erro ao salvar nível";
      showToast(msg);
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
      showToast("Nível inativado com sucesso!");
      await fetchNiveis();
    } catch (err: any) {
      console.error("Erro ao inativar nível:", err);
      showToast("Erro ao inativar nível");
    }
  };

  return (
    <div className="gerir-container page-with-fixed-header">
      <Header />

      <main className="gerir-main">
        <h1>GERENCIAMENTO</h1>

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
                onChange={(e) =>
                  setFiltroNivel(e.target.value ? parseInt(e.target.value) : "")
                }
              >
                <option value="">Todos os níveis</option>
                <option value="0">Sem nível</option>
                {niveis.map((nivel) => (
                  <option key={nivel.id_nivel} value={nivel.id_nivel}>
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
                  {filtro
                    ? "Tente buscar por outro termo"
                    : "Clique em + para criar o primeiro usuário"}
                </p>
              </div>
            ) : (
              <div className="cards-container">
                {usuariosFiltrados.map((usuario, index) => {
                  // Construir URL da foto
                  const fotoUrl = usuario.foto
                    ? usuario.foto.startsWith("http")
                      ? usuario.foto
                      : `http://localhost:3001${usuario.foto}`
                    : perfil;

                  return (
                    <div
                      className={`user-card ${!usuario.ativo ? "inativo" : ""}`}
                      key={usuario.id_usuario}
                    >
                      <img src={fotoUrl} alt={usuario.nome} />
                      <p className="nivel">
                        {usuario.ativo ? tipoLabels[usuario.tipo] : "INATIVADO"}
                      </p>
                      {usuario.id_nivel && (
                        <p className="badge-nivel">
                          {
                            niveis.find((n) => n.id_nivel === usuario.id_nivel)
                              ?.nome
                          }
                        </p>
                      )}
                      <h3>{usuario.nome}</h3>
                      <p className="email">{usuario.email}</p>
                      <div className="card-buttons">
                        <button
                          className="editar-btn"
                          onClick={() => abrirModalEdicao(index)}
                          disabled={usuario.ativo === false}
                        >
                          Editar
                        </button>
                        <button
                          className={`inativar-btn ${
                            usuario.ativo ? "" : "reativar"
                          }`}
                          onClick={() => abrirModalInativar(index)}
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
                  {niveis.map((nivel) => (
                    <tr key={nivel.id_nivel}>
                      <td>{nivel.ordem}</td>
                      <td>{nivel.nome}</td>
                      <td>{nivel.descricao || "-"}</td>
                      <td className="acoes">
                        <button
                          className="btn-edit"
                          onClick={() => abrirModalNivelEdicao(nivel)}
                        >
                          Editar
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => handleInativarNivelClick(nivel.id_nivel)}
                        >
                          Inativar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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

              <label>Nível</label>
              <select
                value={usuarioModal.id_nivel || ""}
                onChange={(e) =>
                  handleChange(
                    "id_nivel",
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
              >
                <option value="">Sem nível atribuído</option>
                {niveis.map((nivel) => (
                  <option key={nivel.id_nivel} value={nivel.id_nivel}>
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
      {modalInativarAberto && usuarioInativarIndex !== null && (
        <div
          className="modal-fundo"
          onClick={() => setModalInativarAberto(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>
              {usuarios[usuarioInativarIndex].ativo ? "Inativar" : "Reativar"}{" "}
              Usuário
            </h2>
            <p
              style={{
                textAlign: "center",
                marginBottom: "1.5rem",
                color: "#64748b",
              }}
            >
              Tem certeza que deseja{" "}
              {usuarios[usuarioInativarIndex].ativo ? "inativar" : "reativar"}{" "}
              <strong>{usuarios[usuarioInativarIndex].nome}</strong>?
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
                onChange={(e) =>
                  setNivelModal((prev) => ({
                    ...prev,
                    ordem: parseInt(e.target.value),
                  }))
                }
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
        message="Deseja realmente inativar este nível?"
        confirmLabel="Inativar"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={excluirNivelConfirm}
        onCancel={() => {
          setShowConfirmInativarNivel(false);
          setNivelToInativar(null);
        }}
      />

      {toast && <div className="toast">{toast}</div>}

      <Footer />
    </div>
  );
}
