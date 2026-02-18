# 📁 Middlewares

Funções que interceptam requisições para autenticação, validação, logging, etc.

## Middlewares Implementados

### authMiddleware.js

Verifica e valida tokens JWT.

```javascript
import verificarToken from "../middlewares/authMiddleware.js";

// Proteger rotas
router.get("/protected", verificarToken, Controller.method);
```

**Funcionalidades:**

- Extrai token do header `Authorization: Bearer <token>`
- Valida token com JWT_SECRET
- Adiciona `req.usuario` com `{ id_usuario, tipo }`
- Retorna 401 se token inválido/expirado

### errorHandler.js

Middleware centralizado para tratamento de erros.

**Trata:**

- Erros operacionais (AppError)
- Erros de validação (Joi)
- Erros de banco de dados (MySQL/Knex)
- Erros inesperados (bugs)

**Erros MySQL:**

- `ER_DUP_ENTRY` → 409 "Registro duplicado"
- `ER_NO_REFERENCED_ROW_2` → 400 "Referência inválida"
- `ER_ROW_IS_REFERENCED_2` → 409 "Não é possível remover"

### validate.js

Middleware para validação de entrada com Joi.

```javascript
import validate from "../middlewares/validate.js";
import { createSchema } from "../validations/entityValidation.js";

router.post("/", validate(createSchema), Controller.store);
```

**Funcionalidades:**

- Valida `req.body` contra schema Joi
- Retorna 400 com lista de erros se inválido
- Permite requisição prosseguir se válido

## Como Usar

### Proteger Rota

```javascript
import verificarToken from "../middlewares/authMiddleware.js";

router.get("/private", verificarToken, Controller.method);
```

### Validar Entrada

```javascript
import validate from "../middlewares/validate.js";
import { createUserSchema } from "../validations/usuarioValidation.js";

router.post("/usuarios", validate(createUserSchema), UsuarioController.store);
```

### Ordem dos Middlewares

```javascript
// 1. Autenticação
// 2. Validação
// 3. Controller

router.post(
  "/quiz",
  verificarToken, // 1º
  validate(createSchema), // 2º
  QuizController.store // 3º
);
```

## Tratamento de Erros

Sempre use `next(error)` nos controllers:

```javascript
async method(req, res, next) {
  try {
    // código
  } catch (error) {
    next(error); // errorHandler vai processar
  }
}
```

## Classes de Erro Customizadas

````javascript
```javascript
import {
  ValidationError,
  NotFoundError,
  UnauthorizedError,
} from "../utils/AppError.js";

// Usar nos services
throw new NotFoundError("Recurso não encontrado");
throw new ValidationError("Dados inválidos");
throw new UnauthorizedError("Sem permissão");
````
