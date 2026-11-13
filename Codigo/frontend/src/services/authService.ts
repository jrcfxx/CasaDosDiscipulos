import axios, { AxiosError } from "axios";

const API_URL = import.meta.env.REACT_APP_API_URL || "http://localhost:3001/api";

/**
 * A sessão fica num cookie HttpOnly gravado pelo servidor: o JavaScript da página não lê o token.
 * withCredentials envia o cookie; X-Requested-With é exigido pelo servidor (proteção CSRF).
 */
export const OPCOES_SESSAO = {
  withCredentials: true,
  headers: { "X-Requested-With": "XMLHttpRequest" },
} as const;

/** Chave do token antigo (antes do cookie): só lida para converter a sessão e apagar */
const TOKEN_ANTIGO_KEY = "token";

export interface LoginCredentials {
  email: string;
  senha: string;
}

export type UserType = "administrador" | "lider" | "membro";

export interface Usuario {
  id_usuario: number;
  nome: string;
  email: string;
  tipo: UserType;
  ativo: boolean;
  data_cadastro?: string;
  lider_celula?: boolean;
  lider_ministerio?: boolean;
  /** true enquanto a pessoa usa senha provisória (telefone ou definida pelo admin) */
  trocar_senha?: boolean;
}

export interface LoginResponse {
  message: string;
  usuario: Usuario;
}

const AVISO_KEY = "auth_aviso";
const RETORNO_KEY = "auth_retorno";

export interface AuthError {
  error?: string;
  message?: string;
  errors?: Record<string, string> | string[];
  details?: Array<{ field?: string; message?: string }>;
}

/**
 * Serviço de Autenticação
 * Login, troca de senha e logout. O token fica só no cookie HttpOnly (servidor);
 * aqui guardamos apenas os dados de exibição do usuário.
 */
class AuthService {
  private readonly USER_KEY = "usuario";
  /** Senha digitada no login quando é provisória (só em memória, nunca em armazenamento) */
  private senhaDoLogin: string | null = null;

  /** Senha provisória digitada no login (apagada ao trocar a senha ou sair) */
  obterSenhaDoLogin(): string {
    return this.senhaDoLogin ?? "";
  }

  /**
   * Realiza login do usuário
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await axios.post<LoginResponse>(`${API_URL}/auth/login`, credentials, OPCOES_SESSAO);

      this.setUser(response.data.usuario);
      // Senha provisória: guarda só em memória para a tela "Crie sua senha" não pedir de novo
      this.senhaDoLogin = response.data.usuario.trocar_senha ? credentials.senha : null;
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Troca a própria senha (primeiro acesso ou Perfil).
   * O servidor encerra as outras sessões e grava a sessão nova no cookie.
   */
  async trocarSenha(senhaAtual: string, novaSenha: string): Promise<Usuario> {
    try {
      const response = await axios.post<LoginResponse>(
        `${API_URL}/auth/senha`,
        { senhaAtual, novaSenha },
        OPCOES_SESSAO
      );
      this.setUser(response.data.usuario);
      this.senhaDoLogin = null;
      return response.data.usuario;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Transição: quem entrou antes do cookie tem o token no localStorage. Troca por cookie
   * (sem novo login) e apaga o token do navegador. Sem token antigo, não faz nada.
   */
  async migrarSessaoAntiga(): Promise<void> {
    let antigo: string | null = null;
    try {
      antigo = localStorage.getItem(TOKEN_ANTIGO_KEY);
    } catch {
      return;
    }
    if (!antigo) return;
    try {
      await axios.post(`${API_URL}/auth/sessao`, null, {
        ...OPCOES_SESSAO,
        headers: { ...OPCOES_SESSAO.headers, Authorization: `Bearer ${antigo}` },
      });
    } catch {
      // Token antigo inválido: a pessoa só precisa entrar de novo
      localStorage.removeItem(this.USER_KEY);
    } finally {
      localStorage.removeItem(TOKEN_ANTIGO_KEY);
    }
  }

  /** Mensagem para mostrar na tela de login (ex.: sessão expirada). Lida uma única vez. */
  definirAviso(mensagem: string): void {
    try {
      sessionStorage.setItem(AVISO_KEY, mensagem);
    } catch {
      /* armazenamento indisponível: segue sem aviso */
    }
  }

  consumirAviso(): string | null {
    try {
      const msg = sessionStorage.getItem(AVISO_KEY);
      sessionStorage.removeItem(AVISO_KEY);
      return msg;
    } catch {
      return null;
    }
  }

  /** Página para onde voltar depois do login */
  definirRetorno(caminho: string): void {
    if (!caminho || caminho.startsWith("/login") || caminho.startsWith("/criar-senha")) return;
    try {
      sessionStorage.setItem(RETORNO_KEY, caminho);
    } catch {
      /* ignore */
    }
  }

  /** Página guardada para depois do login (sem apagar; use limparRetorno ao usar) */
  obterRetorno(): string | null {
    try {
      const caminho = sessionStorage.getItem(RETORNO_KEY);
      // Só caminhos internos do próprio site
      return caminho && caminho.startsWith("/") && !caminho.startsWith("//") ? caminho : null;
    } catch {
      return null;
    }
  }

  limparRetorno(): void {
    try {
      sessionStorage.removeItem(RETORNO_KEY);
    } catch {
      /* ignore */
    }
  }

  consumirRetorno(): string | null {
    const caminho = this.obterRetorno();
    this.limparRetorno();
    return caminho;
  }

  /**
   * Realiza logout do usuário
   */
  logout(): void {
    this.senhaDoLogin = null;
    this.limparDadosLocais();
    // Apaga o cookie no servidor (o JavaScript não consegue apagar um cookie HttpOnly)
    axios.post(`${API_URL}/auth/logout`, null, OPCOES_SESSAO).catch(() => {});
  }

  /** Remove os dados locais (sem chamar o servidor), ex.: quando a sessão já expirou */
  limparDadosLocais(): void {
    try {
      localStorage.removeItem(this.USER_KEY);
      localStorage.removeItem(TOKEN_ANTIGO_KEY);
    } catch {
      /* ignore */
    }
  }

  /**
   * Há uma sessão neste navegador (os dados do usuário estão guardados).
   * A validade real é conferida pelo servidor a cada requisição.
   */
  isAuthenticated(): boolean {
    return !!this.getUser();
  }

  /**
   * Obtém os dados do usuário armazenados
   */
  getUser(): Usuario | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  /**
   * Armazena os dados do usuário
   */
  private setUser(usuario: Usuario): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(usuario));
  }

  /**
   * Atualiza o usuário em memória/localStorage (ex.: refresh de perfil)
   */
  updateStoredUser(usuario: Usuario): void {
    this.setUser(usuario);
  }

  /**
   * Verifica se o usuário é admin
   */
  isAdmin(): boolean {
    const user = this.getUser();
    return user?.tipo === "administrador";
  }

  /**
   * Obtém o tipo do usuário
   */
  getUserType(): UserType | null {
    const user = this.getUser();
    return user?.tipo || null;
  }

  /**
   * Verifica se o usuário é líder
   */
  isLider(): boolean {
    const user = this.getUser();
    return user?.tipo === "lider";
  }

  /**
   * Verifica se o usuário é membro
   */
  isMembro(): boolean {
    const user = this.getUser();
    return user?.tipo === "membro";
  }

  /**
   * Trata erros de requisição
   */
  private handleError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<AuthError>;

      if (axiosError.response?.data) {
        const { error: apiError, message, errors, details } = axiosError.response.data;

        if (Array.isArray(errors) && errors.length) {
          return new Error(errors.join("\n"));
        }
        if (errors && typeof errors === "object") {
          return new Error(Object.values(errors).join("\n"));
        }
        if (Array.isArray(details) && details.length) {
          return new Error(
            details.map((d) => d.message).filter(Boolean).join("\n") ||
              apiError ||
              message ||
              "Erro ao processar requisição"
          );
        }

        // Backend padroniza em `error`; alguns endpoints usam `message`
        return new Error(apiError || message || "Erro ao processar requisição");
      }

      if (axiosError.request) {
        return new Error(
          "Servidor não está respondendo. Tente novamente mais tarde."
        );
      }
    }

    return new Error("Erro inesperado. Tente novamente.");
  }
}

const authService = new AuthService();
export default authService;
