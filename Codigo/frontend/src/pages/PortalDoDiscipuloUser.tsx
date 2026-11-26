import React from "react";
import { useAuth } from "../hooks/useAuth";
import PortalInicio, { type GrupoPortal } from "../components/portal/PortalInicio";
import InicioPersonalizado from "../components/portal/InicioPersonalizado";
import imgEscala from "../assets/DSC00436.jpg";
import imgMapa from "../assets/DSC00309.jpg";
import imgFalaAi from "../assets/oracao-cabeca-baixa.jpg";
import imgLicoes from "../assets/IMG_5684.jpg";
import imgFormularios from "../assets/DSC00438.jpg";
import imgModulos from "../assets/IMG_6568.jpg";
import imgStaff from "../assets/tres_mulheres.jpeg";

const PortalDoDiscipuloUser: React.FC = () => {
  const { isLiderCelula, isLiderMinisterio } = useAuth();

  const grupos: GrupoPortal[] = [
    {
      titulo: "Na Casa",
      atalhos: [
        { to: "/usuario/escala", titulo: "Escala", descricao: "Calendário e ministérios", foto: imgEscala },
        ...(isLiderMinisterio
          ? [{ to: "/usuario/escala/meus-ministerios", titulo: "Meus ministérios", descricao: "Cronograma dos ministérios que você lidera", foto: imgEscala }]
          : []),
        { to: "/usuario/escala/mapa", titulo: "Mapa da Escala", descricao: "Visão geral dos eventos", foto: imgMapa },
        { to: "/usuario/fala-ai", titulo: "Fala Aí, Discípulo", descricao: "Devocional e palavra do dia", foto: imgFalaAi },
        { to: "/usuario/staff", titulo: "Staff e Estrutura", descricao: "Quem serve em cada área", foto: imgStaff },
      ],
    },
    ...(isLiderCelula
      ? [
          {
            titulo: "Secretaria das Células",
            atalhos: [
              { to: "/usuario/licoes", titulo: "Lições", descricao: "Conteúdo para as células", foto: imgLicoes },
              { to: "/usuario/formularios", titulo: "Formulários", descricao: "Relatórios e acompanhamento", foto: imgFormularios },
            ],
          },
        ]
      : []),
    {
      titulo: "Escola de Discípulos",
      atalhos: [
        { to: "/usuario/modulos", titulo: "Módulos", descricao: "Formação e crescimento com quizzes", foto: imgModulos },
      ],
    },
  ];

  return (
    <PortalInicio
      area="Área do discípulo"
      descricao="Seu espaço de formação, comunhão e crescimento."
      grupos={grupos}
      antesDosGrupos={<InicioPersonalizado />}
    />
  );
};

export default PortalDoDiscipuloUser;
