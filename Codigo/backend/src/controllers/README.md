# 📁 Controllers

Controllers recebem requisições HTTP, chamam serviços e retornam respostas.

## Responsabilidades

- Receber e validar entrada HTTP
- Chamar services apropriados
- Formatar respostas HTTP
- Tratar erros com `next(error)`

## Padrão de Implementação

```javascript
const EntityController = {
  async index(req, res, next) {
    try {
      const data = await EntityService.getAll();
      res.status(HTTP_STATUS.OK).json(data);
    } catch (error) {
      next(error);
    }
  },

  async show(req, res, next) {
    try {
      const data = await EntityService.getById(req.params.id);
      res.status(HTTP_STATUS.OK).json(data);
    } catch (error) {
      next(error);
    }
  },

  async store(req, res, next) {
    try {
      const data = await EntityService.create(req.body);
      res.status(HTTP_STATUS.CREATED).json(data);
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const data = await EntityService.update(req.params.id, req.body);
      res.status(HTTP_STATUS.OK).json(data);
    } catch (error) {
      next(error);
    }
  },

  async destroy(req, res, next) {
    try {
      await EntityService.delete(req.params.id);
      res.status(HTTP_STATUS.NO_CONTENT).send();
    } catch (error) {
      next(error);
    }
  },
};
```

## Controllers Implementados

- **authController.js** - Autenticação (login, registro)
- **UsuarioController.js** - CRUD de usuários
- **ModuloController.js** - CRUD de módulos
- **QuizController.js** - CRUD de quizzes e respostas
- **QuizRespostaController.js** - Administração de respostas
- **LicaoController.js** - CRUD de lições
- **FormularioController.js** - CRUD de formulários
- **FormularioRespostaController.js** - Submissão e consulta de respostas
- **CampoController.js** - CRUD de campos personalizados
- **CelulaController.js** - CRUD de células

## Boas Práticas

✅ **Sempre use try-catch e next(error)**
✅ **Use HTTP_STATUS constants**
✅ **Não coloque lógica de negócio nos controllers**
✅ **Valide entrada com middlewares (validate)**
✅ **Mantenha métodos curtos e focados**

❌ **Nunca acesse Models diretamente**
❌ **Não faça queries no controller**
❌ **Evite lógica complexa**
