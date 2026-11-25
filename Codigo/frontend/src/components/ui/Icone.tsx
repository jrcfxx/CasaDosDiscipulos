import React from "react";
import {
  Accessibility,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Church,
  CircleCheck,
  ClipboardList,
  Drum,
  Eye,
  EyeOff,
  GripVertical,
  ImagePlus,
  Pencil,
  Trash2,
  FileText,
  Flame,
  GraduationCap,
  Guitar,
  Handshake,
  House,
  Lock,
  ShieldCheck,
  Menu,
  Mic,
  Music,
  NotebookPen,
  Piano,
  Projector,
  Radio,
  Rocket,
  Search,
  SlidersHorizontal,
  Speaker,
  Sprout,
  Star,
  Sun,
  Target,
  TrendingUp,
  TriangleAlert,
  Trophy,
  UserRound,
  Users,
  X,
  DoorOpen,
  type LucideIcon,
} from "lucide-react";

/**
 * Ícones do sistema (no lugar dos emojis). Todos do mesmo conjunto de traço (Lucide), com o padrão
 * da Casa: traço fino, cantos arredondados e a cor do texto em volta (teal/petróleo nos destaques).
 * Use sempre pelo nome: <Icone nome="calendario" />.
 */
const ICONES = {
  // interface
  acessibilidade: Accessibility,
  alerta: TriangleAlert,
  arquivo: FileText,
  busca: Search,
  calendario: CalendarDays,
  casa: House,
  cadeado: Lock,
  escudo: ShieldCheck, // painel de segurança
  check: Check,
  abrir: ChevronDown,
  anterior: ChevronLeft,
  proximo: ChevronRight,
  concluido: CircleCheck,
  fechar: X,
  igreja: Church,
  livro: BookOpen,
  lista: ClipboardList,
  menu: Menu,
  notificacao: Bell,
  olho: Eye,
  olhoFechado: EyeOff,
  arrastar: GripVertical,
  imagem: ImagePlus,
  editar: Pencil,
  lixeira: Trash2,
  pessoa: UserRound,
  sol: Sun,
  formatura: GraduationCap,
  // ranking e conquistas
  trofeu: Trophy,
  alvo: Target,
  foguete: Rocket,
  broto: Sprout,
  chama: Flame,
  estrela: Star,
  subindo: TrendingUp,
  // funções da escala (o backend manda o nome em "icone")
  microfone: Mic,
  guitarra: Guitar,
  teclado: Piano,
  bateria: Drum,
  musica: Music,
  som: Speaker,
  projecao: Projector,
  transmissao: Radio,
  mesa: SlidersHorizontal,
  porta: DoorOpen,
  acolhida: Handshake,
  cadastro: NotebookPen,
  coordenacao: ClipboardList,
  equipe: Users,
} satisfies Record<string, LucideIcon>;

export type NomeIcone = keyof typeof ICONES;

export function existeIcone(nome: string | null | undefined): nome is NomeIcone {
  return !!nome && Object.prototype.hasOwnProperty.call(ICONES, nome);
}

interface Props {
  nome: NomeIcone;
  /** Tamanho em px (padrão 18) */
  tamanho?: number;
  className?: string;
  /** Texto para leitor de tela; sem ele o ícone é decorativo */
  rotulo?: string;
}

const Icone: React.FC<Props> = ({ nome, tamanho = 18, className, rotulo }) => {
  const Componente = ICONES[nome];
  return (
    <Componente
      size={tamanho}
      strokeWidth={1.75}
      absoluteStrokeWidth={tamanho < 16}
      className={`icone${className ? ` ${className}` : ""}`}
      aria-hidden={rotulo ? undefined : true}
      aria-label={rotulo}
      role={rotulo ? "img" : undefined}
      focusable="false"
    />
  );
};

export default Icone;
