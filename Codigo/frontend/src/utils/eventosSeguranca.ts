import type { EventoSeguranca } from "../services/segurancaService";

/** Nome de cada evento do registro de segurança, em linguagem simples */
export const ROTULOS_EVENTO: Record<string, string> = {
  login: "Entrada na conta",
  login_2fa_pendente: "Senha certa, aguardando código",
  logout: "Saiu da conta",
  conta_bloqueada: "Acesso pausado por tentativas erradas",
  conta_desbloqueada: "Acesso liberado pela secretaria",
  senha_alterada: "Senha alterada",
  senha_redefinida: "Senha redefinida pela secretaria",
  email_alterado: "E-mail de acesso alterado",
  sessao_encerrada: "Aparelho desconectado",
  sessoes_encerradas: "Aparelhos desconectados",
  "2fa_ativado": "Verificação em duas etapas ativada",
  "2fa_desativado": "Verificação em duas etapas desativada",
  "2fa_removido_admin": "Verificação em duas etapas removida pela secretaria",
  "2fa_codigos_gerados": "Novos códigos de recuperação",
  "2fa_codigo_recuperacao": "Entrou com código de recuperação",
  usuario_criado: "Conta criada",
  usuario_editado: "Dados da conta editados",
  permissao_alterada: "Tipo de acesso alterado",
  usuario_ativado: "Conta ativada",
  usuario_desativado: "Conta desativada",
  acesso_negado: "Tentou abrir área sem permissão",
};

/** Opções do filtro do painel (agrupadas) */
export const FILTROS_EVENTO: Array<{ valor: string; rotulo: string }> = [
  { valor: "", rotulo: "Todos os eventos" },
  { valor: "login", rotulo: "Entradas (logins)" },
  { valor: "conta_bloqueada,conta_desbloqueada", rotulo: "Bloqueios" },
  { valor: "senha_alterada,senha_redefinida,email_alterado", rotulo: "Senha e e-mail" },
  { valor: "2fa_ativado,2fa_desativado,2fa_removido_admin,2fa_codigos_gerados,2fa_codigo_recuperacao", rotulo: "Duas etapas (2FA)" },
  { valor: "usuario_criado,usuario_editado,permissao_alterada,usuario_ativado,usuario_desativado", rotulo: "Ações do admin em contas" },
  { valor: "sessao_encerrada,sessoes_encerradas,logout", rotulo: "Saídas e aparelhos" },
  { valor: "acesso_negado", rotulo: "Acessos negados" },
];

const MOTIVOS: Record<string, string> = {
  senha_incorreta: "senha incorreta",
  conta_inexistente: "e-mail sem cadastro",
  conta_desativada: "conta desativada",
  conta_bloqueada: "acesso pausado",
  codigo_2fa_incorreto: "código de 2 etapas incorreto",
  senha_atual_incorreta: "senha atual incorreta",
};

const CAMPOS: Record<string, string> = {
  nome: "nome", email: "e-mail", telefone: "telefone", tipo: "tipo", ativo: "ativo",
  lider_celula: "líder de célula", lider_ministerio: "líder de ministério", id_nivel: "nível", pontuacao: "pontuação",
};

export function rotuloEvento(e: Pick<EventoSeguranca, "evento" | "resultado">): string {
  const base = ROTULOS_EVENTO[e.evento] || e.evento;
  if (e.evento === "login" && e.resultado === "falha") return "Tentativa de entrada recusada";
  if (e.evento === "login" && e.resultado === "bloqueado") return "Tentativa durante o bloqueio";
  if (e.evento === "senha_alterada" && e.resultado === "falha") return "Tentativa de trocar a senha recusada";
  return base;
}

/** Complemento curto: motivo da falha, campos alterados etc. */
export function detalheEvento(e: EventoSeguranca): string {
  const d = e.detalhes || {};
  const partes: string[] = [];
  if (typeof d.motivo === "string") partes.push(MOTIVOS[d.motivo] || d.motivo.replace(/_/g, " "));
  if (typeof d.tentativa === "number" && d.tentativa > 1) partes.push(`${d.tentativa}ª tentativa seguida`);
  if (typeof d.minutos === "number") partes.push(`por ${d.minutos} min`);
  if (d.dois_fatores) partes.push("com código de 2 etapas");
  if (typeof d.quantidade === "number") partes.push(`${d.quantidade} aparelho(s)`);
  if (typeof d.restantes === "number") partes.push(`restam ${d.restantes} códigos`);
  if (typeof d.rota === "string") partes.push(d.rota);
  if (d.campos && typeof d.campos === "object") {
    const nomes = Object.entries(d.campos as Record<string, unknown>).map(([c, v]) => {
      const rotulo = CAMPOS[c] || c;
      if (v && typeof v === "object" && "para" in v) {
        const mud = v as { de: unknown; para: unknown };
        return c === "tipo" ? `${rotulo}: ${String(mud.de)} → ${String(mud.para)}` : rotulo;
      }
      return rotulo;
    });
    if (nomes.length) partes.push(nomes.join(", "));
  }
  if (d.senha_definida_pelo_admin) partes.push("senha provisória definida");
  return partes.join(" · ");
}

const formatoDataHora = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

export function formatarDataHora(valor: string | null | undefined): string {
  if (!valor) return "—";
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? "—" : formatoDataHora.format(d);
}

/** "agora há pouco", "há 3 horas", "há 2 dias" */
export function tempoRelativo(valor: string | null | undefined): string {
  if (!valor) return "—";
  const ms = Date.now() - new Date(valor).getTime();
  if (Number.isNaN(ms)) return "—";
  const min = Math.round(ms / 60000);
  if (min < 10) return "agora há pouco";
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} hora${h === 1 ? "" : "s"}`;
  const dias = Math.round(h / 24);
  return `há ${dias} dia${dias === 1 ? "" : "s"}`;
}
