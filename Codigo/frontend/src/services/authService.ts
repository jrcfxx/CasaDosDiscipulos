import axios, { AxiosError } from "axios";

const API_URL = import.meta.env.REACT_APP_API_URL || "http://localhost:3001/api";

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
  token: string;
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
 * Gerencia login, registro, logout e armazenamento de token
 */
class AuthService {
  private readonly TOKEN_KEY = "token";
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
      const response = await axios.post<LoginResponse>(
        `${API_URL}/auth/login`,
        credentials
      );

      this.setSession(response.data.token, response.data.usuario);
      // Senha provisória: guarda só em memória para a tela "Crie sua senha" não pedir de novo
      this.senhaDoLogin = response.data.usuario.trocar_senha ? credentials.senha : null;
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Troca a própria senha (primeiro acesso ou Perfil).
   * O servidor encerra as outras sessões e devolve um token novo, que passa a ser usado aqui.
   */
  async trocarSenha(senhaAtual: string, novaSenha: string): Promise<Usuario> {
    try {
      const response = await axios.post<LoginResponse>(
        `${API_URL}/auth/senha`,
        { senhaAtual, novaSenha },
        { headers: { Authorization: `Bearer ${this.getToken()}` } }
      );
      this.setSession(response.data.token, response.data.usuario);
      this.senhaDoLogin = null;
      return response.data.usuario;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /** Grava token e usuário juntos (login, troca de senha) */
  setSession(token: string, usuario: Usuario): void {
    this.setToken(token);
    this.setUser(usuario);
  }

  /** Atualiza só o token (ex.: Perfil devolve token novo após trocar a senha) */
  updateToken(token: string): void {
    this.setToken(token);
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
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  /**
   * Verifica se o usuário está autenticado
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Obtém o token armazenado
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Armazena o token
   */
  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
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
