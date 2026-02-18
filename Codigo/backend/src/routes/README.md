# 📁 Routes

Define os endpoints da API e associa rotas aos controllers.

## Responsabilidades

- Definir endpoints RESTful
- Aplicar middlewares (autenticação, validação)
- Conectar rotas aos controllers
- Documentar rotas através do código

## Padrão de Implementação

```javascript
import { Router } from "express";
import EntityController from "../controllers/EntityController.js";
import validate from "../middlewares/validate.js";
import verificarToken from "../middlewares/authMiddleware.js";
import { createSchema, updateSchema } from "../validations/entityValidation.js";

const router = Router();

// Rotas públicas
router.post("/login", EntityController.login);

// Rotas protegidas
router.use(verificarToken); // Aplica auth em todas abaixo

// CRUD básico
router.get("/", EntityController.index);
router.get("/:id", EntityController.show);
router.post("/", validate(createSchema), EntityController.store);
router.put("/:id", validate(updateSchema), EntityController.update);
router.delete("/:id", EntityController.destroy);

// Rotas especiais
router.get("/active", EntityController.getActive);
router.get("/user/:userId", EntityController.getByUser);

export default router;
```

## Rotas Implementadas

### Autenticação

- **authRoutes.js** - `/api/auth`
  - `POST /register` - Cadastro
  - `POST /login` - Login

### Escola de Discípulos

- **ModuloRoutes.js** - `/api/modulo`
  - CRUD completo
  - `GET /ativos` - Módulos ativos
- **QuizRoutes.js** - `/api/quiz`

  - CRUD completo
  - `GET /:id/questoes` - Questões do quiz
  - `POST /:id/responder` - Submeter respostas
  - `GET /:id/respostas` - Ver respostas (admin)
  - `GET /:id/respostas/usuario` - Respostas do usuário

- **quizRespostaRoutes.js** - `/api/quiz-resposta`
  - `GET /` - Listar todas (admin)
  - `GET /:id` - Ver resposta específica
  - `DELETE /:id` - Deletar resposta (admin)

### Secretaria das Células

- **licaoRoutes.js** - `/api/licao`

  - CRUD completo
  - `GET /ativas` - Lições ativas

- **FormularioRoutes.js** - `/api/formulario`

  - CRUD completo
  - `GET /ativos` - Formulários ativos
  - `GET /:id/respostas` - Respostas do formulário

- **formularioRespostaRoutes.js** - `/api/formulario-resposta`

  - `GET /` - Listar todas
  - `GET /:id` - Ver resposta
  - `POST /` - Submeter resposta
  - `GET /formulario/:idFormulario` - Por formulário
  - `GET /celula/:idCelula` - Por célula

- **celulaRoutes.js** - `/api/celula`
  - CRUD completo
  - `GET /ativas` - Células ativas
  - `GET /lider/:idLider` - Células de um líder

### Administração

- **usuarioRoutes.js** - `/api/usuarios`

  - CRUD completo (admin)
  - `PATCH /:id/toggle` - Ativar/desativar
  - `GET /ranking` - Ranking de pontuação

- **CampoPersonalizadoRoutes.js** - `/api/campo`
  - CRUD completo

## Padrões REST

### CRUD Básico

| Método | Rota | Ação               |
| ------ | ---- | ------------------ |
| GET    | /    | Listar todos       |
| GET    | /:id | Ver um específico  |
| POST   | /    | Criar novo         |
| PUT    | /:id | Atualizar completo |
| PATCH  | /:id | Atualizar parcial  |
| DELETE | /:id | Deletar            |

### Rotas Especiais (antes de /:id)

```javascript
// ✅ CORRETO - rotas específicas ANTES de /:id
router.get("/ativas", Controller.getActive);
router.get("/lider/:idLider", Controller.getByLider);
router.get("/:id", Controller.show);

// ❌ ERRADO - /:id vai capturar tudo
router.get("/:id", Controller.show);
router.get("/ativas", Controller.getActive); // Nunca será chamado
```

## Middlewares

### Ordem de Aplicação

```javascript
// 1. Autenticação (se necessário)
router.use(verificarToken);

// 2. Validação (por rota)
router.post("/", validate(schema), Controller.store);

// 3. Controller
```

### Aplicar em Todas as Rotas

```javascript
// Protege todas as rotas abaixo
router.use(verificarToken);

router.get("/", Controller.index);
router.post("/", Controller.store);
// Todas requerem autenticação
```

### Aplicar em Rota Específica

```javascript
// Apenas esta rota protegida
router.post("/", verificarToken, Controller.store);

// Esta é pública
router.get("/", Controller.index);
```

## Boas Práticas

✅ **Use verbos HTTP corretos**
✅ **Rotas especiais antes de /:id**
✅ **Sempre valide entrada (validate)**
✅ **Documente rotas especiais**
✅ **Use nomes de rotas descritivos**

❌ **Não misture padrões RESTful**
❌ **Evite verbos nas rotas (use HTTP methods)**
❌ **Não exponha detalhes de implementação**
