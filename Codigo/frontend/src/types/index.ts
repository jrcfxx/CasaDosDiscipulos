/**
 * Tipos centralizados do frontend
 * Sincronizados com o backend (utils/constants.js)
 */

// ==================== ENUMS ====================

export enum FieldType {
  // Campos gerais (para módulos, lições e formulários)
  TEXT = "texto",
  NUMBER = "numero",
  DATE = "data",
  LINK = "link",
  UPLOAD = "upload",

  // Campos específicos para questões de quiz
  MULTIPLE_CHOICE = "multipla_escolha",
  TRUE_FALSE = "verdadeiro_falso",
  ESSAY = "discursiva",
}

export enum UserType {
  ADMIN = "admin",
  ADMINISTRADOR = "administrador", // Compatibilidade com backend
  USUARIO = "usuario",
}

// ==================== AUTENTICAÇÃO ====================

export interface LoginCredentials {
  email: string;
  senha: string;
}

export interface RegisterData {
  nome: string;
  email: string;
  senha: string;
  tipo: UserType;
}

export interface Usuario {
  id_usuario: number;
  nome: string;
  email: string;
  tipo: UserType | "admin" | "usuario" | "administrador"; // Compatibilidade com backend
  ativo: boolean;
  data_cadastro: string;
}

export interface AuthResponse {
  message: string;
  usuario: Usuario;
  token: string;
}

// ==================== CAMPO ====================

export interface Campo {
  id_campo: number;
  tipo_campo: FieldType | string;
  label?: string;
  conteudo?: string | number | boolean | null;
  ordem?: number;
  obrigatorio?: boolean;
  opcoes?: string[]; // Para select/multipla_escolha

  // Campos específicos por tipo
  placeholder?: string; // texto, link, discursiva
  min_valor?: number; // numero
  max_valor?: number; // numero
  step?: number; // numero
  data_minima?: string; // data
  data_maxima?: string; // data
  tipos_aceitos?: string; // upload (accept attribute)
  tamanho_maximo?: number; // upload (em bytes)
  max_caracteres?: number; // discursiva
}

export interface CampoFormulario extends Campo {
  id?: number; // id do formulario_campo
  id_formulario?: number;
  resposta?: string | number | boolean | null;
}

// ==================== MÓDULO ====================

export interface Modulo {
  id_modulo: number;
  titulo: string;
  descricao?: string;
  ordem: number;
  ativo: boolean;
  obrigatorio?: boolean;
  id_nivel?: number | null;
  nivel_nome?: string; // Nome do nível (quando carregado pelo backend)
  pre_requisitos?: number[];
  imagem_url?: string;
  campos?: Campo[];
}

// ==================== QUIZ ====================

export interface QuizQuestao {
  id_questao?: number;
  enunciado: string;
  opcao_a: string;
  opcao_b: string;
  opcao_c: string;
  opcao_d: string;
  resposta_correta: "A" | "B" | "C" | "D";
  pontos?: number;
}

export interface Quiz {
  id_quiz: number;
  id_modulo: number;
  titulo: string;
  descricao?: string;
  ativo: boolean;
  questoes?: QuizQuestao[];
}

export interface QuizResposta {
  id_resposta?: number;
  id_quiz: number;
  id_usuario: number;
  pontuacao: number;
  data_resposta?: string;
  respostas: {
    id_questao: number;
    resposta: "A" | "B" | "C" | "D";
  }[];
}

// ==================== LIÇÃO ====================

export interface Licao {
  id_licao: number;
  titulo: string;
  descricao?: string;
  ordem: number;
  ativa: boolean;
  campos?: Campo[];
}

// ==================== FORMULÁRIO ====================

export interface Formulario {
  id_formulario: number;
  titulo: string;
  descricao?: string;
  ativo: boolean;
  campos?: CampoFormulario[];
}

export interface FormularioResposta {
  id_resposta?: number;
  id_formulario: number;
  id_celula: number;
  data_resposta?: string;
  campos: {
    id_formulario_campo: number;
    resposta: string | number | boolean | null;
  }[];
}

// ==================== CÉLULA ====================

export interface Celula {
  id_celula: number;
  nome: string;
  descricao?: string;
  id_lider: number;
  dia_reuniao?:
    | "domingo"
    | "segunda"
    | "terca"
    | "quarta"
    | "quinta"
    | "sexta"
    | "sabado";
  horario_reuniao?: string;
  local_reuniao?: string;
  ativa: boolean;
  nome_lider?: string;
}

// ==================== FORM PROPS ====================

export interface BaseFieldProps {
  id?: string;
  name: string;
  label: string;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export interface TextFieldProps extends BaseFieldProps {
  type?: "text" | "email" | "password" | "url";
  maxLength?: number;
  minLength?: number;
}

export interface NumberFieldProps extends BaseFieldProps {
  min?: number;
  max?: number;
  step?: number;
}

export interface SelectFieldProps extends BaseFieldProps {
  options: Array<{ value: string | number; label: string }>;
  multiple?: boolean;
}

export interface TextareaFieldProps extends BaseFieldProps {
  rows?: number;
  cols?: number;
  maxLength?: number;
}

export interface CheckboxFieldProps extends Omit<BaseFieldProps, "value"> {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export interface DateFieldProps extends BaseFieldProps {
  min?: string;
  max?: string;
}

// ==================== API RESPONSE ====================

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}
