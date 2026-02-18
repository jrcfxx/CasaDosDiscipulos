# 📁 Services

Services contêm a lógica de negócio, processamento de dados e validações.

## Responsabilidades

- Implementar regras de negócio
- Validar dados antes de salvar
- Orquestrar operações com múltiplos Models
- Lançar exceções customizadas
- Processar e transformar dados

## Padrão de Implementação

```javascript
import EntityModel from "../models/EntityModel.js";
import { ValidationError, NotFoundError } from "../utils/AppError.js";

const EntityService = {
  async getAll() {
    return EntityModel.getAll();
  },

  async getById(id) {
    const entity = await EntityModel.getById(id);
    if (!entity) {
      throw new NotFoundError("Entidade não encontrada");
    }
    return entity;
  },

  async create(data) {
    // Validações de negócio
    if (!data.nome || data.nome.trim().length < 3) {
      throw new ValidationError("Nome deve ter no mínimo 3 caracteres");
    }

    // Sanitização
    const sanitizedData = {
      ...data,
      nome: data.nome.trim(),
    };

    return EntityModel.create(sanitizedData);
  },

  async update(id, data) {
    const exists = await EntityModel.getById(id);
    if (!exists) {
      throw new NotFoundError("Entidade não encontrada");
    }

    // Validações
    if (data.nome && data.nome.trim().length < 3) {
      throw new ValidationError("Nome deve ter no mínimo 3 caracteres");
    }

    // Sanitização
    const updateData = {};
    if (data.nome) updateData.nome = data.nome.trim();
    if (data.ativo !== undefined) updateData.ativo = data.ativo;

    const updated = await EntityModel.update(id, updateData);
    return updated;
  },

  async delete(id) {
    const exists = await EntityModel.getById(id);
    if (!exists) {
      throw new NotFoundError("Entidade não encontrada");
    }

    await EntityModel.delete(id);
  },
};

export default EntityService;
```

## Services Implementados

- **UsuarioService.js** - Gestão de usuários, hash de senhas
- **CelulaService.js** - Gestão de células
- **ModuloService.js** - Gestão de módulos educacionais
- **QuizService.js** - Gestão de quizzes, questões e correção
- **QuizRespostaService.js** - Processamento de respostas
- **LicaoService.js** - Gestão de lições
- **FormularioService.js** - Gestão de formulários
- **FormularioRespostaService.js** - Processamento de respostas
- **FormularioSecretariaService.js** - Formulários da secretaria

## Validações

### Tipos de Validação

1. **Validação de Entrada** (Joi - middleware)

   - Tipos de dados
   - Formatos
   - Campos obrigatórios

2. **Validação de Negócio** (Service)
   - Regras específicas
   - Verificação de existência
   - Lógica condicional

```javascript
// ✅ No Service
async create(data) {
  // Validação de negócio
  if (data.data_inicio > data.data_fim) {
    throw new ValidationError('Data início deve ser anterior à data fim');
  }

  // Verificar duplicados
  const exists = await EntityModel.getByNome(data.nome);
  if (exists) {
    throw new ConflictError('Nome já existe');
  }

  return EntityModel.create(data);
}
```

## Sanitização de Dados

Sempre limpe dados antes de salvar:

```javascript
const sanitizedData = {
  nome: data.nome.trim(),
  email: data.email.toLowerCase().trim(),
  descricao: data.descricao?.trim() || null,
};
```

## Tratamento de Erros

Use classes de erro customizadas:

```javascript
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
} from "../utils/AppError.js";

// Não encontrado
throw new NotFoundError("Recurso não encontrado");

// Validação falhou
throw new ValidationError("Dados inválidos");

// Conflito (duplicado)
throw new ConflictError("Registro já existe");

// Sem permissão
throw new UnauthorizedError("Sem permissão");
```

## Operações Complexas

### Múltiplos Models

```javascript
async createQuizWithQuestoes(quizData, questoes) {
  // 1. Criar quiz
  const quiz = await QuizModel.create(quizData);

  // 2. Criar questões
  for (const questao of questoes) {
    await QuizQuestaoModel.create({
      ...questao,
      id_quiz: quiz.id_quiz
    });
  }

  // 3. Retornar quiz completo
  return this.getById(quiz.id_quiz);
}
```

### Processamento de Dados

```javascript
async corrigirQuiz(id_quiz, respostas) {
  // 1. Buscar questões corretas
  const questoes = await QuizModel.getQuestoes(id_quiz);

  // 2. Calcular pontuação
  let pontuacao = 0;
  for (const resposta of respostas) {
    const questao = questoes.find(q => q.id === resposta.id_questao);
    if (questao && questao.resposta_correta === resposta.resposta) {
      pontuacao += questao.pontos;
    }
  }

  // 3. Salvar resultado
  return QuizRespostaModel.create({
    id_quiz,
    id_usuario: userId,
    pontuacao,
    respostas
  });
}
```

## Transações

Para operações que precisam ser atômicas:

```javascript
import knex from '../database/index.js';

async complexOperation(data) {
  return knex.transaction(async (trx) => {
    const entity1 = await EntityModel1.create(data, trx);
    const entity2 = await EntityModel2.create({ ...data, entity1_id: entity1.id }, trx);

    // Se qualquer operação falhar, tudo é revertido
    return { entity1, entity2 };
  });
}
```

## Boas Práticas

✅ **Sempre validar antes de chamar Model**
✅ **Lançar exceções descritivas**
✅ **Sanitizar dados de entrada**
✅ **Verificar existência antes de update/delete**
✅ **Retornar dados completos após operações**
✅ **Usar transações para operações múltiplas**

❌ **Não retorne dados sensíveis (senhas)**
❌ **Não exponha detalhes de implementação**
❌ **Evite lógica nos Controllers**
❌ **Não faça queries HTTP no Service**
