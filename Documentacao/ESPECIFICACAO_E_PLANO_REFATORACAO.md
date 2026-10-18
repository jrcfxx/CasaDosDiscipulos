<div align="center">

<img src="../Codigo/frontend/src/assets/logo_mark.png" alt="Casa dos Discípulos" width="64" />

# Especificação

**Módulos do produto e histórico de evolução**

[Índice](./README.md)
&nbsp;·&nbsp;
[Arquitetura](./ARQUITETURA.md)

</div>

---

## Escopo

Plataforma web da **Casa dos Discípulos** para formação (Escola), células (Secretaria), eventos, escala e gestão — com identidade visual teal `#02869b`, dourado `#f4b002` e Montserrat.

---

## Módulos

| Módulo | Propósito | Quem usa |
|--------|-----------|----------|
| Escola de Discípulos | Conteúdo + quiz + ranking | Membros e líderes |
| Lições | Material para células | Líderes de célula |
| Formulários | Relatórios semanais | Líderes preenchem · admin vê |
| Eventos | Carrossel e divulgação | Admin edita · todos veem |
| Escala | Ministérios e calendário | Admin / líderes de ministério |
| Fala Aí | Devocional | Autenticados |
| Usuários e células | Cadastro e vínculos | Admin · perfil do membro |

---

## Regras de negócio (resumo)

### Escola

- Progressão na ordem definida pelo admin  
- Quiz opcional por módulo  
- Mesmo quiz em vários módulos: 1ª vez pontuação cheia · replicação com pontuação reduzida  
- Ranking e níveis gamificados  

### Secretaria

- Lições: texto, link, vídeo, upload  
- Formulários: campos dinâmicos · líder escolhe a célula · múltiplos envios  

### Pessoas

- Tipos: `administrador` · `lider` · `membro`  
- Flags: `lider_celula` · `lider_ministerio`  
- Célula principal no perfil  

---

## Arquitetura desejada

- Separação pages / services / hooks  
- API via `apiClient` (JWT)  
- Tokens CSS e marca consistentes  
- Rotas `/admin/*` e `/usuario/*`  

---

## Histórico de entrega

| Fase | Status |
|------|--------|
| Limpeza e rotas | Concluída |
| Escola (usuário) | Concluída |
| Formulários líder/admin | Concluída |
| Modelo de dados (célula, ordem) | Concluída |
| Lições, perfil, eventos | Concluída |
| Escala, WhatsApp, acessibilidade | Concluída |
| Deploy Docker e docs de produção | Concluída |

---

## Formulários (fluxo atual)

1. Líder em `/usuario/formularios`  
2. Escolhe formulário e célula  
3. `POST /api/formulario-resposta` com campos  

Deep link opcional: `?formularioId=X`.

---

<div align="center">

[Índice](./README.md)
&nbsp;·&nbsp;
[Arquitetura](./ARQUITETURA.md)

<br />

<sub>Casa dos Discípulos · Especificação · 2026</sub>

</div>
