import type { ErroApi } from "../utils/errorUtils";
import React, { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import "../style/GerirUser.css";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import ConfirmModal from "../components/ui/ConfirmModal";
import { formatarTelefoneInput, normalizarTelefoneParaEnvio } from "../utils/telefoneUtils";
import Toast from "../components/ui/Toast";
import perfil from "../assets/perfil-preto.png";
import { ASSETS_BASE } from "../config/api";
import { showAllUsers, showUserById, createUser, updateUser } from "../services/usuario";
import {
  showAllNiveis,
  createNivel,
  updateNivel,
  deleteNivel,
  excluirNivel,
  reativarNivel,
  reordenarNiveis,
} from "../services/nivel";
import ministerioService from "../services/ministerioService";
import SortableNivelRow from "../components/gerirUser/SortableNivelRow";
import ModalUsuario from "../components/gerirUser/ModalUsuario";
import ModalNivel from "../components/gerirUser/ModalNivel";
import ModalMinisterio from "../components/gerirUser/ModalMinisterio";
import type { Nivel, Usuario, UsuarioModal, NivelModal, MinisterioModal } from "../components/gerirUser/tipos";


export default function GerenciarUsuarios() {
  const [abaAtiva, setAbaAtiva] = useState<"usuarios" | "niveis" | "ministerios">("usuarios");
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [niveis, setNiveis] = useState<Nivel[]>([]);
  const [filtro, setFiltro] = useState("");
  const [filtroNivel, setFiltroNivel] = useState<string>("");
  const [modalAberto, setModalAberto] = useState(false);
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);
  const [usuarioModal, setUsuarioModal] = useState<UsuarioModal>({
    nome: "",
    email: "",
    telefone: "",
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
  const [showConfirmExcluirNivel, setShowConfirmExcluirNivel] = useState(false);
  const [nivelToExcluir, setNivelToExcluir] = useState<number | null>(null);
  const [ministerios, setMinisterios] = useState<import("../services/ministerioService").Ministerio[]>([]);
  const [modalMinisterioAberto, setModalMinisterioAberto] = useState(false);
  const [ministerioModal, setMinisterioModal] = useState<MinisterioModal>({
    nome: "",
    descricao: "",
    ordem: 0,
    ativo: true,
    id_lideres: [],
    id_paralelismos: [],
  });
  const [showParalelismoInfo, setShowParalelismoInfo] = useState(false);
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

  useEffect(() => {
    if (modalAberto || modalNivelAberto || modalInativarAberto || modalMinisterioAberto) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalAberto, modalNivelAberto, modalInativarAberto, modalMinisterioAberto]);

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
      let data = await showAllNiveis(incluirInativos);
      if (!Array.isArray(data)) return;

      // Corrige ordens duplicadas automaticamente (1..N)
      const ordens = data.map((n: Nivel) => Number(n.ordem));
      const temDuplicado = new Set(ordens).size !== ordens.length;
      if (temDuplicado && incluirInativos) {
        try {
          data = await reordenarNiveis(data.map((n: Nivel) => n.id_nivel));
        } catch (err) {
          console.error("Erro ao normalizar ordem dos níveis:", err);
        }
      }

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

  const sensoresNiveis = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEndNivel = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = niveis.findIndex((n) => n.id_nivel === active.id);
    const newIndex = niveis.findIndex((n) => n.id_nivel === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordenados = arrayMove(niveis, oldIndex, newIndex).map((n, i) => ({
      ...n,
      ordem: i + 1,
    }));
    setNiveis(reordenados);

    try {
      const atualizados = await reordenarNiveis(reordenados.map((n) => n.id_nivel));
      if (Array.isArray(atualizados)) {
        setNiveis(atualizados);
      }
    } catch (erro) {
      const err = erro as ErroApi;
      console.error("Erro ao reordenar níveis:", err);
      showToast(err?.response?.data?.error || "Erro ao reordenar níveis", "error");
      await fetchNiveis(true);
    }
  };

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
      telefone: "",
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
        telefone: formatarTelefoneInput((usuarioAtual as Usuario).telefone ?? ""),
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
    setShowSenha(false);
    setShowConfirmarSenha(false);
    setUsuarioModal({
      nome: "",
      email: "",
      telefone: "",
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

    // Valida formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(usuarioModal.email.trim())) {
      showToast("Informe um email válido");
      return;
    }

    // Telefone: normaliza (apenas dígitos) e valida
    const telefoneNorm = normalizarTelefoneParaEnvio(usuarioModal.telefone);
    if (usuarioModal.telefone?.trim() && !telefoneNorm) {
      showToast("Telefone inválido. Use apenas números com DDD (ex: 11999999999)");
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

    const userData: Record<string, unknown> = {
      nome: usuarioModal.nome,
      email: usuarioModal.email,
      telefone: telefoneNorm,
      tipo: usuarioModal.tipo,
      id_nivel: usuarioModal.id_nivel,
    };

    // Só define ativo na criação; na edição não sobrescreve o status
    if (!usuarioModal.id_usuario) {
      userData.ativo = true;
    }

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
    } catch (erro) {
      const err = erro as ErroApi;
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
    setNivelModal({
      id_nivel: undefined,
      nome: "",
      descricao: "",
      ordem: 0,
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

    // Ordem não é editável no modal — definida por arrastar na lista
    const nivelData: Record<string, unknown> = {
      nome: nivelModal.nome.trim(),
      descricao: nivelModal.descricao?.trim() ?? "",
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
    } catch (erro) {
      const err = erro as ErroApi;
      console.error("Erro ao salvar nível:", err);
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.errors?.[0] ||
        "Erro ao salvar nível";
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
    } catch (erro) {
      const err = erro as ErroApi;
      console.error("Erro ao inativar nível:", err);
      const msg = err?.response?.data?.error || "Erro ao inativar nível";
      showToast(msg, "error");
    }
  };

  const handleExcluirNivelClick = (id: number) => {
    setNivelToExcluir(id);
    setShowConfirmExcluirNivel(true);
  };

  const excluirNivelPermanenteConfirm = async () => {
    if (nivelToExcluir === null) return;
    const id = nivelToExcluir;
    setShowConfirmExcluirNivel(false);
    setNivelToExcluir(null);
    try {
      const res = await excluirNivel(id);
      if (Array.isArray(res?.niveis)) {
        setNiveis(res.niveis);
      } else {
        await fetchNiveis(true);
      }
      showToast("Nível excluído e ordem atualizada!", "success");
    } catch (erro) {
      const err = erro as ErroApi;
      console.error("Erro ao excluir nível:", err);
      const msg = err?.response?.data?.error || "Erro ao excluir nível";
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
    } catch (erro) {
      const err = erro as ErroApi;
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
      const payload = {
        nome: ministerioModal.nome.trim(),
        descricao: ministerioModal.descricao?.trim() || "",
        ordem: ministerioModal.ordem,
        ativo: !!ministerioModal.ativo,
        id_lideres: ministerioModal.id_lideres || [],
        id_paralelismos: ministerioModal.id_paralelismos || [],
      };
      if (ministerioModal.id_ministerio) {
        await ministerioService.update(ministerioModal.id_ministerio, payload);
        showToast("Ministério atualizado!", "success");
      } else {
        await ministerioService.create(payload);
        showToast("Ministério criado!", "success");
      }
      await fetchMinisterios(abaAtiva === "ministerios");
      setModalMinisterioAberto(false);
    } catch (erro) {
      const err = erro as ErroApi;
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
    } catch (erro) {
      const err = erro as ErroApi;
      const msg = err?.response?.data?.error || "Erro ao excluir ministério";
      showToast(msg, "error");
    }
    setShowConfirmExcluirMinisterio(false);
    setMinisterioToExcluir(null);
  };

  return (
    <div className="gerir-container page-with-fixed-header">
      <Header />

      <main id="main-content" className="gerir-main" tabIndex={-1}>
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
                    usuario.nivel_nome ??
                    usuario.nivel_escola_nome ??
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
              <p className="niveis-dnd-hint">Arraste as linhas pelo ícone ⋮⋮ para reordenar. A ordem atualiza automaticamente.</p>
              <DndContext
                sensors={sensoresNiveis}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEndNivel}
              >
                <table className="niveis-table">
                  <thead>
                    <tr>
                      <th>Ordem</th>
                      <th>Nome</th>
                      <th>Descrição</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <SortableContext
                    items={niveis.map((n) => n.id_nivel)}
                    strategy={verticalListSortingStrategy}
                  >
                    <tbody>
                      {niveis.map((nivel) => (
                        <SortableNivelRow
                          key={nivel.id_nivel}
                          nivel={nivel}
                          onEditar={abrirModalNivelEdicao}
                          onInativar={handleInativarNivelClick}
                          onReativar={handleReativarNivelClick}
                          onExcluir={handleExcluirNivelClick}
                        />
                      ))}
                    </tbody>
                  </SortableContext>
                </table>
              </DndContext>
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
                    id_paralelismos: [],
                  });
                  setShowParalelismoInfo(false);
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
                                id_paralelismos: m.id_paralelismos || [],
                              });
                              setShowParalelismoInfo(false);
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

      {/* Modal de Cadastro/Edição de Usuário - renderizado no body para não herdar estilos do container */}
      {modalAberto && (
        <ModalUsuario
          usuarioModal={usuarioModal}
          handleChange={handleChange}
          niveisAtivos={niveisAtivos}
          ministerios={ministerios}
          showSenha={showSenha}
          setShowSenha={setShowSenha}
          showConfirmarSenha={showConfirmarSenha}
          setShowConfirmarSenha={setShowConfirmarSenha}
          onFechar={fecharModal}
          onSalvar={salvarUsuario}
        />
      )}

      <ConfirmModal
        open={modalInativarAberto && !!usuarioInativar}
        title={usuarioInativar?.ativo ? "Inativar usuário" : "Reativar usuário"}
        message={
          usuarioInativar
            ? `Tem certeza que deseja ${usuarioInativar.ativo ? "inativar" : "reativar"} ${usuarioInativar.nome}?`
            : ""
        }
        confirmLabel={usuarioInativar?.ativo ? "Inativar" : "Reativar"}
        cancelLabel="Cancelar"
        variant={usuarioInativar?.ativo ? "danger" : "default"}
        onConfirm={confirmarInativar}
        onCancel={() => {
          setModalInativarAberto(false);
          setUsuarioInativar(null);
        }}
      />

      {/* Modal de Cadastro/Edição de Nível */}
      {modalNivelAberto && (
        <ModalNivel
          nivelModal={nivelModal}
          setNivelModal={setNivelModal}
          onFechar={fecharModalNivel}
          onSalvar={salvarNivel}
        />
      )}

      <ConfirmModal
        open={showConfirmInativarNivel}
        title="Tem certeza?"
        message="Deseja realmente inativar este nível? Ele poderá ser reativado depois."
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
        open={showConfirmExcluirNivel}
        title="Excluir nível"
        message="Esta ação remove o nível permanentemente. Usuários e módulos vinculados ficarão sem este nível. A ordem dos demais será atualizada automaticamente."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={excluirNivelPermanenteConfirm}
        onCancel={() => {
          setShowConfirmExcluirNivel(false);
          setNivelToExcluir(null);
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
        <ModalMinisterio
          ministerioModal={ministerioModal}
          setMinisterioModal={setMinisterioModal}
          lideresParaSelect={lideresParaSelect}
          ministerios={ministerios}
          showParalelismoInfo={showParalelismoInfo}
          setShowParalelismoInfo={setShowParalelismoInfo}
          onFechar={() => setModalMinisterioAberto(false)}
          onSalvar={salvarMinisterio}
        />
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
