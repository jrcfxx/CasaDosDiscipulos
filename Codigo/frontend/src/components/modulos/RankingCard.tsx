/**
 * Card de Ranking - compartilhado entre Admin e User/Leader
 * Layout idêntico: medalhas, avatar, pontos, nível
 * Para usuários/líderes: exibe posição e mensagens motivacionais
 */

import React from "react";
import { getMedalIcon } from "../../utils/moduloConteudoUtils";
import { ASSETS_BASE } from "../../config/api";

export type RankItem = {
  id_usuario: number;
  nome: string;
  pontuacao: number;
  foto?: string | null;
  nivel_escola?: number | null;
  nivel_escola_nome?: string | null;
};

export type MinhaPosicao = {
  posicao: number;
  pontuacao: number;
  nivel_escola: number | null;
  nivel_escola_nome?: string | null;
  pontuacao_primeiro: number;
  pontuacao_anterior: number | null;
};

function getMensagemMotivacional(dados: MinhaPosicao): string {
  const { posicao, pontuacao, pontuacao_primeiro, pontuacao_anterior } = dados;
  const ptsPara1 = Math.max(0, pontuacao_primeiro - pontuacao);
  const ptsParaAnterior = pontuacao_anterior != null ? pontuacao_anterior - pontuacao : null;

  if (pontuacao === 0 && posicao > 1) {
    return "Complete módulos e quizzes para ganhar pontos e subir no ranking! 🚀";
  }
  if (posicao === 1) {
    return "Você está em 1º lugar! Parabéns, continue assim! 🏆";
  }
  if (posicao === 2) {
    return `Você está em 2º lugar! Falta apenas ${ptsPara1} ponto${ptsPara1 !== 1 ? "s" : ""} para alcançar o 1º. Vamos lá! 💪`;
  }
  if (posicao === 3) {
    const parte2 = ptsParaAnterior != null && ptsParaAnterior > 0
      ? `Faltam ${ptsParaAnterior} pts para o 2º e `
      : "";
    return `Você está em 3º lugar! ${parte2}${ptsPara1} pts para o 1º. Continue! 🔥`;
  }
  if (posicao <= 5) {
    return `Você está em ${posicao}º lugar. Faltam ${ptsPara1} pontos para o top 3. Não desista! 🌟`;
  }
  if (posicao <= 10) {
    return `Você está em ${posicao}º lugar. Os primeiros lugares estão a ${ptsPara1} pontos. Continue avançando! 📈`;
  }
  return `Você está em ${posicao}º lugar. Cada módulo concluído te aproxima do top 10. Vamos! 🎯`;
}

interface RankingCardProps {
  ranking: RankItem[];
  limit?: number;
  title?: string;
  subtitle?: string;
  /** Classes CSS para tema escuro (user) ou claro (admin) */
  theme?: "light" | "dark";
  /** Posição do usuário logado - quando preenchido, exibe bloco motivacional (user/leader) */
  minhaPosicao?: MinhaPosicao | null;
}

export default function RankingCard({
  ranking,
  limit = 20,
  title = "RANKING",
  subtitle = "Top 20 Discípulos",
  theme = "light",
  minhaPosicao,
}: RankingCardProps) {
  const items = ranking.slice(0, limit);
  const mensagem = minhaPosicao ? getMensagemMotivacional(minhaPosicao) : null;

  const getIniciais = (nome: string) =>
    nome
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const getFotoUrl = (foto?: string | null) => {
    if (!foto) return null;
    const path = foto.startsWith("/") ? foto : `/${foto}`;
    return `${ASSETS_BASE}${path}`;
  };

  return (
    <div className={`ranking-card ranking-card--${theme}`}>
      <div className="ranking-header">
        <div className="ranking-header-icon">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <defs>
              <linearGradient id="headerGoldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFD700" />
                <stop offset="50%" stopColor="#FFA500" />
                <stop offset="100%" stopColor="#FFD700" />
              </linearGradient>
            </defs>
            <circle cx="20" cy="20" r="18" fill="rgba(255, 215, 0, 0.2)" />
            <path
              d="M15 15 L20 10 L25 15 L23 25 L17 25 Z"
              fill="url(#headerGoldGradient)"
              stroke="#FFA500"
              strokeWidth="2"
            />
            <circle cx="20" cy="17" r="3" fill="#FFF" opacity="0.5" />
          </svg>
        </div>
        <div>
          <h3>{title}</h3>
          <span className="ranking-subtitle">{subtitle}</span>
        </div>
      </div>
      {mensagem && (
        <div className="ranking-minha-posicao">
          {minhaPosicao && (
            <p className="ranking-posicao-numero">
              Sua posição: <strong>{minhaPosicao.posicao}º</strong>
              {minhaPosicao.pontuacao > 0 && (
                <> · {minhaPosicao.pontuacao} pts</>
              )}
              {minhaPosicao.nivel_escola_nome && (
                <> · {minhaPosicao.nivel_escola_nome}</>
              )}
            </p>
          )}
          <p className="ranking-mensagem-motivacional">{mensagem}</p>
        </div>
      )}
      <div className="ranking-list">
        {items.length > 0 ? (
          items.map((usuario, index) => {
            const position = index + 1;
            const isTopThree = position <= 3;
            const medal = getMedalIcon(position);
            const fotoUrl = getFotoUrl(usuario.foto);

            return (
              <div
                key={usuario.id_usuario}
                className={`rank-item ${isTopThree ? `top-${position}` : ""}`}
              >
                {medal ? (
                  <div className="rank-medal">{medal}</div>
                ) : (
                  <div className="rank-position">{position}º</div>
                )}
                <div className={`rank-avatar ${isTopThree ? "highlighted" : ""}`}>
                  {fotoUrl ? (
                    <img
                      src={fotoUrl}
                      alt={usuario.nome}
                      className="rank-avatar-photo"
                    />
                  ) : (
                    getIniciais(usuario.nome)
                  )}
                </div>
                <div className="rank-info">
                  <p className="rank-name">{usuario.nome}</p>
                  <p className="rank-points">
                    {usuario.pontuacao} pts
                    {usuario.nivel_escola_nome && (
                      <> · {usuario.nivel_escola_nome}</>
                    )}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="ranking-empty">
            <p>Nenhum usuário no ranking</p>
          </div>
        )}
      </div>
    </div>
  );
}
