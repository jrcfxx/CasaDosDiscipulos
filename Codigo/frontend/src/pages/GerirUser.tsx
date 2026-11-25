import type { ErroApi } from "../utils/errorUtils";
import React, { useEffect, useMemo, useRef, useState } from "react";
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
import "../style/secretaria.css";
import "../style/gerenciamento.css";
import Icone, { type NomeIcone } from "../components/ui/Icone";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import ConfirmModal from "../components/ui/ConfirmModal";
import { formatarTelefoneInput, normalizarTelefoneParaEnvio } from "../utils/telefoneUtils";
import Toast from "../components/ui/Toast";
import { ASSETS_BASE } from "../config/api";
import { showAllUsers, showUserById, createUser, updateUser, redefinirSenhaUsuario } from "../services/usuario";
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
import { useAcao } from "../hooks/useAcao";
import SortableNivelRow from "../components/gerirUser/SortableNivelRow";
import ModalUsuario from "../components/gerirUser/ModalUsuario";
import BotoesExportar from "../components/ui/BotoesExportar";
import { exportarUsuarios } from "../utils/exportacoes";
import { tempoRelativo } from "../utils/eventosSeguranca";
import ModalNivel from "../components/gerirUser/ModalNivel";
import ModalMinisterio from "../components/gerirUser/ModalMinisterio";
import type { Nivel, Usuario, UsuarioModal, NivelModal, MinisterioModal } from "../components/gerirUser/tipos";


export default function GerenciarUsuarios() {
  // Progresso dos salvamentos (mostra spinner e evita envio duplo)
  const acaoUsuario = useAcao();
  const acaoNivel = useAcao();
  const acaoMinisterio = useAcao();
  const [abaAtiva, setAbaAtiva] = useState<"usuarios" | "niveis" | "ministerios">("usuarios");
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [niveis, setNiveis] = useState<Nivel[]>([]);
  const [filtro, setFiltro] = useState("");
  const [filtroNivel, setFiltroNivel] = useState<string>("");
  const [modalAberto, setModalAberto] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState<"" | "membro" | "lider" | "administrador">("");
  const [filtroSituacao, setFiltroSituacao] = useState<"ativos" | "inativos" | "todos">("ativos");
  const [ordenar, setOrdenar] = useState<"nome" | "acesso">("nome");
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
  const [showConfirmExcluirMinisterio, setShowConfirmExcluirMinisterio] = useState(false);
  const [ministerioToExcluir, setMinisterioToExcluir] = useState<number | null>(null);

  const tipoLabels: Record<string, string> = {
    lider: "Líder",
    administrador: "Administrador",
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

  const termoBusca = filtro.trim().toLowerCase();
  const usuariosFiltrados = usuarios
    .filter((u) => {
      const matchTexto =
        !termoBusca || u.nome.toLowerCase().includes(termoBusca) || (u.email || "").toLowerCase().includes(termoBusca);
      const matchTipo = !filtroTipo || u.tipo === filtroTipo;
      const ativo = u.ativo !== false;
      const matchSituacao = filtroSituacao === "todos" || (filtroSituacao === "ativos" ? ativo : !ativo);

      let matchNivel = true;
      if (filtroNivel === "0") {
        matchNivel = getIdNivel(u) === null && (u.nivel_escola ?? null) === null;
      } else if (filtroNivel !== "") {
        const idFiltro = Number(filtroNivel);
        matchNivel = !Number.isNaN(idFiltro) && (getIdNivel(u) === idFiltro || (u.nivel_escola ?? null) === idFiltro);
      }
      return matchTexto && matchTipo && matchSituacao && matchNivel;
    })
    .sort((a, b) =>
      ordenar === "acesso"
        ? String(b.ultimo_login || "").localeCompare(String(a.ultimo_login || ""))
        : a.nome.localeCompare(b.nome, "pt-BR")
    );

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
    try {
      await deleteNivel(id);
      showToast("Nível inativado com sucesso!", "success");
      await fetchNiveis(true);
    } catch (erro) {
      const err = erro as ErroApi;
      console.error("Erro ao inativar nível:", err);
      const msg = err?.response?.data?.error || "Erro ao inativar nível";
      showToast(msg, "error");
    } finally {
      // fecha só depois de terminar: o modal mostra o andamento
      setShowConfirmInativarNivel(false);
      setNivelToInativar(null);
    }
  };

  const handleExcluirNivelClick = (id: number) => {
    setNivelToExcluir(id);
    setShowConfirmExcluirNivel(true);
  };

  const excluirNivelPermanenteConfirm = async () => {
    if (nivelToExcluir === null) return;
    const id = nivelToExcluir;
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
    } finally {
      // fecha só depois de terminar: o modal mostra o andamento
      setShowConfirmExcluirNivel(false);
      setNivelToExcluir(null);
    }
  };

  const handleReativarNivelClick = (id: number) => {
    setNivelToReativar(id);
    setShowConfirmReativarNivel(true);
  };

  const reativarNivelConfirm = async () => {
    if (nivelToReativar === null) return;
    const id = nivelToReativar;
    try {
      await reativarNivel(id);
      showToast("Nível reativado com sucesso!", "success");
      await fetchNiveis(true);
    } catch (erro) {
      const err = erro as ErroApi;
      console.error("Erro ao reativar nível:", err);
      const msg = err?.response?.data?.error || "Erro ao reativar nível";
      showToast(msg, "error");
    } finally {
      // fecha só depois de terminar: o modal mostra o andamento
      setShowConfirmReativarNivel(false);
      setNivelToReativar(null);
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

  const novoMinisterio = () => {
    setMinisterioModal({
      id_ministerio: undefined,
      nome: "",
      descricao: "",
      ordem: ministerios.length + 1,
      ativo: true,
      id_lideres: [],
      id_paralelismos: [],
    });
    setModalMinisterioAberto(true);
  };

  const editarMinisterio = (m: (typeof ministerios)[number]) => {
    setMinisterioModal({
      id_ministerio: m.id_ministerio,
      nome: m.nome,
      descricao: m.descricao || "",
      ordem: m.ordem,
      ativo: m.ativo,
      id_lideres: (m.lideres || []).map((l) => l.id_usuario),
      id_paralelismos: m.id_paralelismos || [],
    });
    setModalMinisterioAberto(true);
  };

  const ABAS: Array<{ id: typeof abaAtiva; nome: string; icone: NomeIcone }> = [
    { id: "usuarios", nome: "Usuários", icone: "equipe" },
    { id: "niveis", nome: "Níveis", icone: "formatura" },
    { id: "ministerios", nome: "Ministérios", icone: "igreja" },
  ];
  const abasRef = useRef<Array<HTMLButtonElement | null>>([]);
  const trocarAbaPorSeta = (e: React.KeyboardEvent, i: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const prox = (i + (e.key === "ArrowRight" ? 1 : ABAS.length - 1)) % ABAS.length;
    setAbaAtiva(ABAS[prox].id);
    abasRef.current[prox]?.focus();
  };

  const ativosLista = usuarios.filter((u) => u.ativo !== false);
  const pessoasPorNivel = useMemo(() => {
    const mapa = new Map<number, number>();
    usuarios.forEach((u) => {
      if (u.ativo === false) return;
      const n = u.nivel_escola ?? getIdNivel(u);
      if (n != null) mapa.set(Number(n), (mapa.get(Number(n)) || 0) + 1);
    });
    return mapa;
  }, [usuarios]);

  const resumo: Record<typeof abaAtiva, { descricao: string; numeros: Array<{ valor: number; rotulo: string }>; acao: { rotulo: string; onClick: () => void } }> = {
    usuarios: {
      descricao: "Quem tem acesso ao Portal, com qual papel, nível e ministérios.",
      numeros: [
        { valor: ativosLista.length, rotulo: "ativos" },
        { valor: ativosLista.filter((u) => u.tipo === "lider").length, rotulo: "líderes" },
        { valor: ativosLista.filter((u) => u.tipo === "administrador").length, rotulo: "admins" },
        { valor: usuarios.length - ativosLista.length, rotulo: "inativos" },
      ],
      acao: { rotulo: "Novo usuário", onClick: abrirModalCadastro },
    },
    niveis: {
      descricao: "As etapas da caminhada na Escola de Discípulos, na ordem em que a pessoa avança.",
      numeros: [
        { valor: niveis.filter((n) => n.ativo).length, rotulo: "níveis ativos" },
        { valor: [...pessoasPorNivel.values()].reduce((a, b) => a + b, 0), rotulo: "pessoas com nível" },
      ],
      acao: { rotulo: "Novo nível", onClick: abrirModalNivelCadastro },
    },
    ministerios: {
      descricao: "As áreas de serviço da Casa, seus líderes e quem pode servir em mais de uma no mesmo evento.",
      numeros: [
        { valor: ministerios.filter((m) => m.ativo).length, rotulo: "ministérios ativos" },
        { valor: new Set(ministerios.flatMap((m) => (m.lideres || []).map((l) => l.id_usuario))).size, rotulo: "líderes" },
      ],
      acao: { rotulo: "Novo ministério", onClick: novoMinisterio },
    },
  };
  const atual = resumo[abaAtiva];
  const filtrando = !!(filtro || filtroNivel || filtroTipo || filtroSituacao !== "ativos");

  return (
    <div className="sc-pagina gr page-with-fixed-header">
      <Header />

      <main id="main-content" tabIndex={-1}>
        <section className="sc-topo" aria-labelledby="gr-titulo">
          <div className="sc-topo__conteudo">
            <div className="sc-topo__texto">
              <p className="sc-topo__area"><Icone nome="coordenacao" tamanho={15} /> Administração</p>
              <h1 id="gr-titulo">Gerenciamento</h1>
              <p className="sc-topo__descricao">{atual.descricao}</p>
              <ul className="sc-topo__numeros" aria-label="Resumo">
                {atual.numeros.map((n) => (
                  <li key={n.rotulo}><strong>{n.valor}</strong><span>{n.rotulo}</span></li>
                ))}
              </ul>
            </div>
            <button type="button" className="sc-btn sc-btn--destaque" onClick={atual.acao.onClick}>
              <span aria-hidden>+</span> {atual.acao.rotulo}
            </button>
          </div>
          <div className="sc-abas" role="tablist" aria-label="Áreas do gerenciamento">
            {ABAS.map((a, i) => (
              <button
                key={a.id}
                ref={(el) => { abasRef.current[i] = el; }}
                type="button"
                role="tab"
                id={`gr-aba-${a.id}`}
                aria-selected={abaAtiva === a.id}
                aria-controls="gr-painel"
                tabIndex={abaAtiva === a.id ? 0 : -1}
                className={`sc-aba${abaAtiva === a.id ? " sc-aba--ativa" : ""}`}
                onClick={() => setAbaAtiva(a.id)}
                onKeyDown={(e) => trocarAbaPorSeta(e, i)}
              >
                <Icone nome={a.icone} tamanho={15} /> {a.nome}
              </button>
            ))}
          </div>
        </section>

        <div className="sc-corpo-fundo">
          <div id="gr-painel" className="gr-corpo" role="tabpanel" aria-labelledby={`gr-aba-${abaAtiva}`}>
            {/* ==================== USUÁRIOS ==================== */}
            {abaAtiva === "usuarios" && (
              <section className="gr-painel" aria-label="Usuários">
                <div className="gr-ferramentas">
                  <label className="gr-busca">
                    <span className="sr-only">Buscar por nome ou e-mail</span>
                    <Icone nome="busca" tamanho={17} />
                    <input
                      type="search"
                      placeholder="Buscar por nome ou e-mail"
                      value={filtro}
                      onChange={(e) => setFiltro(e.target.value)}
                    />
                  </label>
                  <div className="gr-segmento" role="group" aria-label="Filtrar por tipo">
                    {([["", "Todos"], ["membro", "Membros"], ["lider", "Líderes"], ["administrador", "Admins"]] as const).map(([v, r]) => (
                      <button key={v} type="button" aria-pressed={filtroTipo === v} onClick={() => setFiltroTipo(v)}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="gr-ferramentas gr-ferramentas--secundaria">
                  <label className="gr-filtro">
                    <span>Nível</span>
                    <select value={filtroNivel} onChange={(e) => setFiltroNivel(e.target.value)}>
                      <option value="">Todos</option>
                      <option value="0">Sem nível</option>
                      {niveisAtivos.map((n) => <option key={n.id_nivel} value={String(n.id_nivel)}>{n.nome}</option>)}
                    </select>
                  </label>
                  <label className="gr-filtro">
                    <span>Situação</span>
                    <select value={filtroSituacao} onChange={(e) => setFiltroSituacao(e.target.value as typeof filtroSituacao)}>
                      <option value="ativos">Ativos</option>
                      <option value="inativos">Inativos</option>
                      <option value="todos">Todos</option>
                    </select>
                  </label>
                  <label className="gr-filtro">
                    <span>Ordenar</span>
                    <select value={ordenar} onChange={(e) => setOrdenar(e.target.value as typeof ordenar)}>
                      <option value="nome">Nome (A–Z)</option>
                      <option value="acesso">Acesso mais recente</option>
                    </select>
                  </label>
                  <div className="gr-ferramentas__fim">
                    <BotoesExportar tema="claro" rotuloExcel="Exportar Excel" onExcel={() => exportarUsuarios(usuariosFiltrados, ministerios)} />
                  </div>
                </div>

                <p className="gr-contagem" role="status" aria-live="polite">
                  {loading ? "Carregando…" : `${usuariosFiltrados.length} ${usuariosFiltrados.length === 1 ? "pessoa" : "pessoas"}`}
                  {filtrando && !loading && (
                    <button
                      type="button"
                      className="gr-link"
                      onClick={() => { setFiltro(""); setFiltroNivel(""); setFiltroTipo(""); setFiltroSituacao("ativos"); }}
                    >
                      Limpar filtros
                    </button>
                  )}
                </p>

                {!loading && usuariosFiltrados.length === 0 ? (
                  <div className="gr-vazio">
                    <Icone nome="busca" tamanho={28} />
                    <p><strong>Ninguém encontrado</strong></p>
                    <p>{filtrando ? "Tente outra busca ou limpe os filtros." : "Cadastre a primeira pessoa no botão Novo usuário."}</p>
                  </div>
                ) : (
                  <ul className="gr-pessoas" aria-label="Lista de usuários">
                    {usuariosFiltrados.map((u) => {
                      const foto = u.foto ? (u.foto.startsWith("http") ? u.foto : `${ASSETS_BASE}${u.foto}`) : null;
                      const nivelNome =
                        u.nivel_nome ?? u.nivel_escola_nome ??
                        (getIdNivel(u) != null ? niveis.find((n) => Number(n.id_nivel) === Number(getIdNivel(u)))?.nome : null);
                      const iniciais = u.nome.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
                      const ativo = u.ativo !== false;
                      return (
                        <li key={u.id_usuario} className={`gr-pessoa${ativo ? "" : " gr-pessoa--inativa"}`}>
                          <span className="gr-avatar" aria-hidden>
                            {foto ? <img src={foto} alt="" /> : iniciais}
                          </span>
                          <div className="gr-pessoa__id">
                            <span className="gr-pessoa__nome">{u.nome}</span>
                            <span className="gr-pessoa__email">{u.email}</span>
                          </div>
                          <div className="gr-pessoa__papel">
                            <span className={`gr-selo gr-selo--${ativo ? u.tipo : "cinza"}`}>
                              {ativo ? tipoLabels[u.tipo] : "Inativo"}
                            </span>
                            {ativo && u.tipo === "lider" && u.lider_celula && <span className="gr-selo gr-selo--leve">Célula</span>}
                            {ativo && u.tipo === "lider" && u.lider_ministerio && <span className="gr-selo gr-selo--leve">Ministério</span>}
                          </div>
                          <span className="gr-pessoa__nivel">
                            <span className="gr-pessoa__rotulo">Nível</span>
                            {nivelNome || "—"}
                          </span>
                          <span className="gr-pessoa__acesso">
                            <span className="gr-pessoa__rotulo">Último acesso</span>
                            {u.ultimo_login ? tempoRelativo(u.ultimo_login) : "nunca entrou"}
                          </span>
                          <div className="gr-pessoa__acoes">
                            {ativo && (
                              <button type="button" className="sc-btn sc-btn--contorno" onClick={() => abrirModalEdicao(u)} aria-label={`Editar ${u.nome}`}>
                                <Icone nome="editar" tamanho={15} /> Editar
                              </button>
                            )}
                            <button
                              type="button"
                              className={`sc-btn ${ativo ? "sc-btn--perigo" : "sc-btn--contorno"}`}
                              onClick={() => abrirModalInativar(u)}
                              aria-label={`${ativo ? "Inativar" : "Reativar"} ${u.nome}`}
                            >
                              {ativo ? "Inativar" : "Reativar"}
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            )}

            {/* ==================== NÍVEIS ==================== */}
            {abaAtiva === "niveis" && (
              <section className="gr-painel" aria-label="Níveis">
                <div className="gr-painel__cabeca">
                  <div>
                    <h2>Caminhada na Escola de Discípulos</h2>
                    <p>Arraste pela alça <Icone nome="arrastar" tamanho={14} /> para mudar a ordem. No teclado: espaço para pegar, setas para mover.</p>
                  </div>
                </div>
                {niveis.length === 0 ? (
                  <div className="gr-vazio">
                    <Icone nome="formatura" tamanho={28} />
                    <p><strong>Nenhum nível ainda</strong></p>
                    <p>Crie o primeiro no botão Novo nível.</p>
                  </div>
                ) : (
                  <DndContext sensors={sensoresNiveis} collisionDetection={closestCenter} onDragEnd={handleDragEndNivel}>
                    <SortableContext items={niveis.map((n) => n.id_nivel)} strategy={verticalListSortingStrategy}>
                      <ol className="gr-niveis">
                        {niveis.map((nivel) => (
                          <SortableNivelRow
                            key={nivel.id_nivel}
                            nivel={nivel}
                            pessoas={pessoasPorNivel.get(Number(nivel.id_nivel)) || 0}
                            onEditar={abrirModalNivelEdicao}
                            onInativar={handleInativarNivelClick}
                            onReativar={handleReativarNivelClick}
                            onExcluir={handleExcluirNivelClick}
                          />
                        ))}
                      </ol>
                    </SortableContext>
                  </DndContext>
                )}
              </section>
            )}

            {/* ==================== MINISTÉRIOS ==================== */}
            {abaAtiva === "ministerios" && (
              ministerios.length === 0 ? (
                <section className="gr-painel">
                  <div className="gr-vazio">
                    <Icone nome="igreja" tamanho={28} />
                    <p><strong>Nenhum ministério ainda</strong></p>
                    <p>Crie o primeiro no botão Novo ministério.</p>
                  </div>
                </section>
              ) : (
                <ul className="gr-ministerios" aria-label="Ministérios">
                  {ministerios.map((m) => {
                    const juntos = (m.id_paralelismos || [])
                      .map((id) => ministerios.find((x) => x.id_ministerio === id)?.nome)
                      .filter(Boolean);
                    return (
                      <li key={m.id_ministerio} className={`gr-ministerio${m.ativo ? "" : " gr-ministerio--inativo"}`}>
                        <div className="gr-ministerio__topo">
                          <span className="gr-ministerio__ordem" aria-label={`Posição ${m.ordem}`}>{m.ordem}</span>
                          <h2 className="gr-ministerio__nome">{m.nome}</h2>
                          {!m.ativo && <span className="gr-selo gr-selo--cinza">Inativo</span>}
                        </div>
                        {m.descricao && <p className="gr-ministerio__desc">{m.descricao}</p>}
                        <div className="gr-ministerio__info">
                          <span className="gr-pessoa__rotulo">Líderes</span>
                          {(m.lideres || []).length ? (
                            <ul className="gr-lideres">
                              {(m.lideres || []).map((l) => (
                                <li key={l.id_usuario}>
                                  <span className="gr-avatar gr-avatar--mini" aria-hidden>
                                    {l.nome.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase()}
                                  </span>
                                  {l.nome.split(" ")[0]}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="gr-alerta-mini"><Icone nome="alerta" tamanho={14} /> Sem líder definido</span>
                          )}
                        </div>
                        {juntos.length > 0 && (
                          <p className="gr-ministerio__juntos">
                            <span className="gr-pessoa__rotulo">Pode servir junto com</span> {juntos.join(", ")}
                          </p>
                        )}
                        <div className="gr-ministerio__acoes">
                          <button type="button" className="sc-btn sc-btn--contorno" onClick={() => editarMinisterio(m)} aria-label={`Editar ${m.nome}`}>
                            <Icone nome="editar" tamanho={15} /> Editar
                          </button>
                          <button
                            type="button"
                            className="sc-btn sc-btn--perigo gr-so-icone"
                            onClick={() => { setMinisterioToExcluir(m.id_ministerio); setShowConfirmExcluirMinisterio(true); }}
                            aria-label={`Excluir ${m.nome}`}
                          >
                            <Icone nome="lixeira" tamanho={16} />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )
            )}
          </div>
        </div>
      </main>

      {/* Modal de Cadastro/Edição de Usuário - renderizado no body para não herdar estilos do container */}
      {modalAberto && (
        <ModalUsuario
          usuarioModal={usuarioModal}
          handleChange={handleChange}
          niveisAtivos={niveisAtivos}
          ministerios={ministerios}
          onFechar={fecharModal}
          onSalvar={() => acaoUsuario.executar(salvarUsuario)}
          salvando={acaoUsuario.executando}
          onRedefinirSenha={
            usuarioModal.id_usuario ? () => redefinirSenhaUsuario(usuarioModal.id_usuario) : undefined
          }
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
        textoCarregando="Aguarde…"
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
          onSalvar={() => acaoNivel.executar(salvarNivel)}
          salvando={acaoNivel.executando}
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
        textoCarregando="Inativando…"
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
        textoCarregando="Excluindo…"
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
        textoCarregando="Reativando…"
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
          onFechar={() => setModalMinisterioAberto(false)}
          onSalvar={() => acaoMinisterio.executar(salvarMinisterio)}
          salvando={acaoMinisterio.executando}
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
        textoCarregando="Excluindo…"
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
