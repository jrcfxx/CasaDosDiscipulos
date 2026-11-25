import api from "./apiClient";

/** Aparelho conectado (a "referencia" encerra a sessão; o id real nunca chega à tela) */
export interface SessaoAberta {
  referencia: string;
  ip: string | null;
  dispositivo: string | null;
  criada_em: string;
  ultimo_uso: string;
  atual: boolean;
  /** só no painel do admin */
  id_usuario?: number;
  nome?: string;
  email?: string;
  tipo?: string;
}

export interface EventoSeguranca {
  id_log: number;
  evento: string;
  resultado: "sucesso" | "falha" | "bloqueado";
  ip: string | null;
  dispositivo: string;
  criado_em: string;
  detalhes: Record<string, unknown> | null;
  email?: string | null;
  id_usuario?: number | null;
  usuario_nome?: string | null;
  usuario_email?: string | null;
  ator_nome?: string | null;
}

export interface StatusDoisFatores {
  ativo: boolean;
  codigos_restantes: number;
}

export interface ConfiguracaoDoisFatores {
  segredo: string;
  uri: string;
  qrcode: string;
}

export interface ResumoSeguranca {
  ultimas_24h: { logins: number; falhas: number; bloqueios: number; acessos_negados: number };
  sessoes_ativas: number;
  contas_bloqueadas: Array<{ id_usuario: number; nome: string; email: string; tentativas_falhas: number; bloqueado_ate: string }>;
  admins_sem_2fa: Array<{ id_usuario: number; nome: string; email: string }>;
  ips_suspeitos: Array<{ ip: string; falhas: number; contas: number; ultima: string }>;
  logins_por_dia: Array<{ dia: string; sucesso: number; falha: number }>;
}

export interface FiltrosEventos {
  evento?: string;
  resultado?: string;
  busca?: string;
  de?: string;
  ate?: string;
  pagina?: number;
  porPagina?: number;
  id_usuario?: number;
}

export interface PaginaEventos {
  total: number;
  pagina: number;
  porPagina: number;
  eventos: EventoSeguranca[];
}

export interface SituacaoUsuario {
  id_usuario: number;
  totp_ativo: boolean;
  bloqueado: boolean;
  bloqueado_ate: string | null;
  tentativas_falhas: number;
  sessoes_ativas: number;
  ultimo_login: string | null;
}

const segurancaService = {
  // ---------- Própria conta ----------
  minhasSessoes: () => api.get<SessaoAberta[]>("/auth/sessoes").then((r) => r.data),
  encerrarMinhaSessao: (referencia: string) => api.delete(`/auth/sessoes/${encodeURIComponent(referencia)}`).then((r) => r.data),
  encerrarOutrasSessoes: () =>
    api.post<{ message: string; encerradas: number }>("/auth/sessoes/encerrar-outras").then((r) => r.data),
  meusAcessos: () => api.get<EventoSeguranca[]>("/auth/acessos").then((r) => r.data),

  statusDoisFatores: () => api.get<StatusDoisFatores>("/auth/2fa").then((r) => r.data),
  iniciarDoisFatores: () => api.post<ConfiguracaoDoisFatores>("/auth/2fa/iniciar").then((r) => r.data),
  ativarDoisFatores: (codigo: string) =>
    api.post<{ codigos_recuperacao: string[] }>("/auth/2fa/ativar", { codigo }).then((r) => r.data),
  desativarDoisFatores: (senha: string, codigo: string) => api.post("/auth/2fa/desativar", { senha, codigo }).then((r) => r.data),
  novosCodigosRecuperacao: (codigo: string) =>
    api.post<{ codigos_recuperacao: string[] }>("/auth/2fa/codigos", { codigo }).then((r) => r.data),

  // ---------- Painel do admin ----------
  resumo: () => api.get<ResumoSeguranca>("/seguranca/resumo").then((r) => r.data),
  eventos: (filtros: FiltrosEventos) => {
    const params = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v !== "" && v != null));
    return api.get<PaginaEventos>("/seguranca/eventos", { params }).then((r) => r.data);
  },
  todasSessoes: () => api.get<SessaoAberta[]>("/seguranca/sessoes").then((r) => r.data),
  encerrarSessao: (referencia: string) => api.delete(`/seguranca/sessoes/${encodeURIComponent(referencia)}`).then((r) => r.data),
  situacaoUsuario: (id: number) => api.get<SituacaoUsuario>(`/seguranca/usuarios/${id}`).then((r) => r.data),
  encerrarSessoesDoUsuario: (id: number) =>
    api.post<{ message: string; encerradas: number }>(`/seguranca/usuarios/${id}/encerrar-sessoes`).then((r) => r.data),
  desbloquear: (id: number) => api.post(`/seguranca/usuarios/${id}/desbloquear`).then((r) => r.data),
  removerDoisFatores: (id: number) => api.delete(`/seguranca/usuarios/${id}/2fa`).then((r) => r.data),
};

export default segurancaService;
