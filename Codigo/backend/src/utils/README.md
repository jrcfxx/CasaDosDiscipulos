# 📁 Utils

Funções auxiliares reutilizáveis em todo o projeto.

## Arquivos

### constants.js

Constantes usadas em todo o projeto.

```javascript
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

export const USER_TYPES = {
  ADMIN: "administrador",
  LIDER: "lider",
  MEMBRO: "membro",
};

export const FIELD_TYPES = {
  TEXT: "texto",
  NUMBER: "numero",
  DATE: "data",
  SELECT: "select",
  TEXTAREA: "textarea",
  CHECKBOX: "checkbox",
};
```

### errors.js / AppError.js

Classes de erro customizadas.

```javascript
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400);
    this.errors = errors;
  }
}

class NotFoundError extends AppError {
  constructor(message = "Recurso não encontrado") {
    super(message, 404);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = "Não autorizado") {
    super(message, 401);
  }
}

class ConflictError extends AppError {
  constructor(message = "Conflito de dados") {
    super(message, 409);
  }
}

class ForbiddenError extends AppError {
  constructor(message = "Acesso negado") {
    super(message, 403);
  }
}
```

## Como Usar

### Constantes

```javascript
import { HTTP_STATUS, USER_TYPES } from "../utils/constants.js";

// Status HTTP
res.status(HTTP_STATUS.OK).json(data);
res.status(HTTP_STATUS.CREATED).json(newData);
res.status(HTTP_STATUS.NO_CONTENT).send();

// Tipos de usuário
if (user.tipo === USER_TYPES.ADMIN) {
  // Ação de admin
}
```

### Erros

```javascript
import { NotFoundError, ValidationError, UnauthorizedError } from '../utils/AppError.js';

// Lançar erros nos Services
async getById(id) {
  const item = await Model.getById(id);
  if (!item) {
    throw new NotFoundError('Item não encontrado');
  }
  return item;
}

// Validação
if (!data.nome || data.nome.length < 3) {
  throw new ValidationError('Nome inválido', [
    'Nome deve ter no mínimo 3 caracteres'
  ]);
}

// Autenticação
if (!token) {
  throw new UnauthorizedError('Token não fornecido');
}
```

## Vantagens

### Constantes

✅ **Evita magic numbers**
✅ **Centraliza valores**
✅ **Facilita manutenção**
✅ **Autocomplete no editor**
✅ **Previne typos**

```javascript
// ❌ EVITAR
res.status(200).json(data);
if (user.tipo === "administrador") {
}

// ✅ PREFERIR
res.status(HTTP_STATUS.OK).json(data);
if (user.tipo === USER_TYPES.ADMIN) {
}
```

### Erros Customizados

✅ **Mensagens padronizadas**
✅ **Status codes corretos**
✅ **Fácil de tratar no errorHandler**
✅ **Stack trace preservado**
✅ **Diferencia erros operacionais de bugs**

## Adicionar Novos Utilitários

### Nova Constante

```javascript
// utils/constants.js
export const QUIZ_STATUS = {
  PENDING: "pendente",
  COMPLETED: "completado",
  EXPIRED: "expirado",
};
```

### Nova Função Helper

```javascript
// utils/helpers.js
export function formatDate(date) {
  return new Date(date).toLocaleDateString("pt-BR");
}

export function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}
```

### Novo Tipo de Erro

```javascript
// utils/AppError.js
export class PaymentRequiredError extends AppError {
  constructor(message = "Pagamento necessário") {
    super(message, 402);
  }
}
```

## Boas Práticas

✅ **Use constantes para valores fixos**
✅ **Crie helpers para lógica reutilizada**
✅ **Documente funções complexas**
✅ **Mantenha funções puras quando possível**
✅ **Exporte apenas o necessário**

❌ **Não coloque lógica de negócio aqui**
❌ **Evite dependências de outros modules**
❌ **Não misture concerns diferentes**
