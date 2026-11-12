/** Tipos da tela Gerenciar Usuários (usuários, níveis e ministérios) */

export interface Nivel {
  id_nivel: number;
  nome: string;
  descricao?: string;
  ordem: number;
  ativo: boolean;
}

export interface Usuario {
  id_usuario?: number;
  nome: string;
  email: string;
  telefone?: string;
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

export interface UsuarioModal {
  id_usuario?: number;
  nome: string;
  email: string;
  telefone: string;
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

export interface NivelModal {
  id_nivel?: number;
  nome: string;
  descricao: string;
  ordem: number;
}

export interface MinisterioModal {
  id_ministerio?: number;
  nome: string;
  descricao: string;
  ordem: number;
  ativo: boolean;
  id_lideres: number[];
  id_paralelismos: number[];
}
