import React from "react";
import PortalInicio, { type GrupoPortal } from "../components/portal/PortalInicio";
import imgEscala from "../assets/DSC00436.jpg";
import imgMapa from "../assets/DSC00309.jpg";
import imgFalaAi from "../assets/oracao-cabeca-baixa.jpg";
import imgCelulas from "../assets/DSC00719.jpg";
import imgLicoes from "../assets/IMG_5684.jpg";
import imgFormularios from "../assets/DSC00438.jpg";
import imgModulos from "../assets/IMG_6568.jpg";
import imgQuiz from "../assets/IMG_6936.jpg";
import imgEventos from "../assets/casal.jpg";
import imgStaff from "../assets/tres_mulheres.jpeg";
import imgUsuarios from "../assets/equipe_casa.jpg";
import imgSeguranca from "../assets/casal_leitura.jpeg";

const GRUPOS: GrupoPortal[] = [
  {
    titulo: "Na Casa",
    atalhos: [
      { to: "/usuario/escala", titulo: "Escala", descricao: "Calendário e ministérios", foto: imgEscala },
      { to: "/usuario/escala/mapa", titulo: "Mapa da Escala", descricao: "Visão geral dos eventos", foto: imgMapa },
      { to: "/usuario/fala-ai", titulo: "Fala Aí, Discípulo", descricao: "Devocional e palavra do dia", foto: imgFalaAi },
      { to: "/admin/staff", titulo: "Staff e Estrutura", descricao: "Editar o organograma da Casa", foto: imgStaff },
    ],
  },
  {
    titulo: "Secretaria das Células",
    atalhos: [
      { to: "/admin/celulas", titulo: "Células", descricao: "Grupos, lideranças e endereços", foto: imgCelulas },
      { to: "/admin/licoes", titulo: "Lições", descricao: "Conteúdo para as células", foto: imgLicoes },
      { to: "/admin/formularios", titulo: "Formulários", descricao: "Relatórios e acompanhamento", foto: imgFormularios },
    ],
  },
  {
    titulo: "Escola de Discípulos",
    atalhos: [
      { to: "/admin/modulos", titulo: "Módulos", descricao: "Formação e conteúdo", foto: imgModulos },
      { to: "/admin/quizzes", titulo: "Quizzes", descricao: "Perguntas dos módulos", foto: imgQuiz },
    ],
  },
  {
    titulo: "Administração",
    atalhos: [
      { to: "/admin/eventos", titulo: "Eventos", descricao: "Agenda e carrossel do site", foto: imgEventos },
      { to: "/admin/usuarios", titulo: "Usuários", descricao: "Contas, permissões e senhas", foto: imgUsuarios },
      { to: "/admin/seguranca", titulo: "Segurança", descricao: "Acessos, aparelhos e bloqueios", foto: imgSeguranca },
    ],
  },
];

const PortalDoDiscipuloAdmin: React.FC = () => (
  <PortalInicio
    area="Área administrativa"
    descricao="Espaço de formação, comunhão e crescimento. Daqui você cuida de tudo o que a Casa publica e organiza."
    grupos={GRUPOS}
  />
);

export default PortalDoDiscipuloAdmin;
