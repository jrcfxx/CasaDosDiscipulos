import axios, { AxiosError } from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001/api";

export interface LoginCredentials {
  email: string;
  senha: string;
}

export interface RegisterData {
  nome: string;
  email: string;
  senha: string;
  tipo: "admin" | "usuario";
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
}

export interface LoginResponse {
  message: string;
  usuario: Usuario;
  token: string;
}

export interface RegisterResponse {
  message: string;
  usuario: Usuario;
}

export interface AuthError {
  message: string;
  errors?: Record<string, string>;
}

/**
 * Serviço de Autenticação
 * Gerencia login, registro, logout e armazenamento de token
 */
class AuthService {
  private readonly TOKEN_KEY = "token";
  private readonly USER_KEY = "usuario";

  /**
   * Realiza login do usuário
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await axios.post<LoginResponse>(
        `${API_URL}/auth/login`,
        credentials
      );

      const { token, usuario } = response.data;

      // Armazena token e dados do usuário
      this.setToken(token);
      this.setUser(usuario);

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Registra novo usuário
   */
  async register(data: RegisterData): Promise<RegisterResponse> {
    try {
      const response = await axios.post<RegisterResponse>(
        `${API_URL}/auth/register`,
        data
      );

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Realiza logout do usuário
   */
  logout(): void {
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
        const { message, errors } = axiosError.response.data;

        // Se houver erros de validação, formata a mensagem
        if (errors) {
          const errorMessages = Object.values(errors).join("\n");
          return new Error(errorMessages);
        }

        return new Error(message || "Erro ao processar requisição");
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
