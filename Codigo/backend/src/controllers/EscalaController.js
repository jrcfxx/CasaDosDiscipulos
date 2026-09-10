import EscalaService from "../services/EscalaService.js";

/**
 * Controller para operações da Escala
 */
class EscalaController {
  async getEventos(req, res, next) {
    try {
      const { ano, mes, ativo, status } = req.query;
      const filters = {};
      if (ano) filters.ano = ano;
      if (mes) filters.mes = mes;
      if (ativo !== undefined) filters.ativo = ativo === "true" || ativo === "1";
      if (status) filters.status = status;
      const eventos = await EscalaService.getEventos(
        filters,
        req.usuario?.id_usuario,
        req.usuario?.tipo
      );
      res.json(eventos);
    } catch (err) {
      next(err);
    }
  }

  async getEventoById(req, res, next) {
    try {
      res.json(await EscalaService.getEventoById(req.params.id));
    } catch (err) {
      next(err);
    }
  }

  async getEventoCompleto(req, res, next) {
    try {
      res.json(
        await EscalaService.getEventoCompleto(
          req.params.id,
          req.usuario?.id_usuario,
          req.usuario?.tipo
        )
      );
    } catch (err) {
      next(err);
    }
  }

  async createEvento(req, res, next) {
    try {
      const evento = await EscalaService.createEvento(
        req.body,
        req.usuario?.id_usuario,
        req.usuario?.tipo
      );
      res.status(201).json(evento);
    } catch (err) {
      next(err);
    }
  }

  async updateEvento(req, res, next) {
    try {
      const evento = await EscalaService.updateEvento(
        req.params.id,
        req.body,
        req.usuario?.tipo,
        req.usuario?.id_usuario
      );
      res.json(evento);
    } catch (err) {
      next(err);
    }
  }

  async deleteEvento(req, res, next) {
    try {
      await EscalaService.deleteEvento(
        req.params.id,
        req.usuario?.tipo,
        req.usuario?.id_usuario
      );
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  async addAtribuicao(req, res, next) {
    try {
      const { id_escala_area, id_usuario, detalhes } = req.body;
      const atrib = await EscalaService.addAtribuicao(
        id_escala_area,
        id_usuario,
        req.usuario?.id_usuario,
        req.usuario?.tipo,
        detalhes
      );
      res.status(201).json(atrib);
    } catch (err) {
      next(err);
    }
  }

  async updateAtribuicao(req, res, next) {
    try {
      const atrib = await EscalaService.updateAtribuicao(
        req.params.id,
        req.body.detalhes,
        req.usuario?.id_usuario,
        req.usuario?.tipo
      );
      res.json(atrib);
    } catch (err) {
      next(err);
    }
  }

  async removeAtribuicao(req, res, next) {
    try {
      await EscalaService.removeAtribuicao(
        req.params.id,
        req.usuario?.id_usuario,
        req.usuario?.tipo
      );
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  async getUsuariosParaEscalar(req, res, next) {
    try {
      const usuarios = await EscalaService.getUsuariosParaEscalar(
        req.params.id,
        req.usuario?.id_usuario,
        req.usuario?.tipo,
        req.query.area || null
      );
      res.json(usuarios);
    } catch (err) {
      next(err);
    }
  }

  // --- Visões ---
  async getVisaoDia(req, res, next) {
    try {
      res.json(await EscalaService.getVisaoDia(req.params.data));
    } catch (err) {
      next(err);
    }
  }

  async getVisaoSemana(req, res, next) {
    try {
      res.json(await EscalaService.getVisaoSemana(req.params.dataInicio));
    } catch (err) {
      next(err);
    }
  }

  async getVisaoMes(req, res, next) {
    try {
      res.json(await EscalaService.getVisaoMes(req.params.ano, req.params.mes));
    } catch (err) {
      next(err);
    }
  }

  async getVisaoAno(req, res, next) {
    try {
      res.json(await EscalaService.getVisaoAno(req.params.ano));
    } catch (err) {
      next(err);
    }
  }

  async getVisualizacaoDia(req, res, next) {
    try {
      res.json(
        await EscalaService.getVisualizacaoDia(
          req.params.data,
          req.usuario?.id_usuario,
          req.usuario?.tipo
        )
      );
    } catch (err) {
      next(err);
    }
  }

  async getVisualizacaoSemana(req, res, next) {
    try {
      res.json(
        await EscalaService.getVisualizacaoSemana(
          req.params.dataInicio,
          req.usuario?.id_usuario,
          req.usuario?.tipo
        )
      );
    } catch (err) {
      next(err);
    }
  }

  async getVisualizacaoAno(req, res, next) {
    try {
      res.json(await EscalaService.getVisualizacaoAno(req.params.ano));
    } catch (err) {
      next(err);
    }
  }

  async getVisualizacaoMes(req, res, next) {
    try {
      res.json(
        await EscalaService.getVisualizacaoMes(
          req.params.ano,
          req.params.mes,
          req.query.modo || "compacto",
          req.usuario?.id_usuario,
          req.usuario?.tipo
        )
      );
    } catch (err) {
      next(err);
    }
  }

  async validarMoverMembro(req, res, next) {
    try {
      res.json(await EscalaService.validarMoverMembro(req.body));
    } catch (err) {
      next(err);
    }
  }

  async moverMembroUnificado(req, res, next) {
    try {
      res.json(
        await EscalaService.moverMembroUnificado(
          req.body,
          req.usuario?.id_usuario,
          req.usuario?.tipo
        )
      );
    } catch (err) {
      next(err);
    }
  }

  async getEscalasDaPessoa(req, res, next) {
    try {
      res.json(
        await EscalaService.getEscalasDaPessoa(
          req.params.usuarioId,
          req.query.dataInicio,
          req.query.dataFim
        )
      );
    } catch (err) {
      next(err);
    }
  }

  async copiarDia(req, res, next) {
    try {
      res.status(201).json(
        await EscalaService.copiarDia(
          req.body.data_origem,
          req.body.data_destino,
          req.usuario?.id_usuario,
          req.usuario?.tipo
        )
      );
    } catch (err) {
      next(err);
    }
  }

  async validarAtribuicao(req, res, next) {
    try {
      res.json(await EscalaService.validarAtribuicao(req.params.id, req.body));
    } catch (err) {
      next(err);
    }
  }

  async moverAtribuicao(req, res, next) {
    try {
      const atrib = await EscalaService.moverAtribuicao(
        req.params.id,
        req.body.id_escala_area,
        req.body.detalhes,
        req.usuario?.id_usuario,
        req.usuario?.tipo,
        { forcarMovimento: !!req.body.forcarMovimento }
      );
      res.json(atrib);
    } catch (err) {
      next(err);
    }
  }

  async publicarEvento(req, res, next) {
    try {
      res.json(
        await EscalaService.publicarEvento(
          req.params.id,
          req.usuario?.id_usuario,
          req.usuario?.tipo
        )
      );
    } catch (err) {
      next(err);
    }
  }

  async getHistorico(req, res, next) {
    try {
      res.json(await EscalaService.getHistorico(req.params.id));
    } catch (err) {
      next(err);
    }
  }

  async copiarEvento(req, res, next) {
    try {
      res.status(201).json(
        await EscalaService.copiarEvento(
          req.params.id,
          req.body,
          req.usuario?.id_usuario,
          req.usuario?.tipo
        )
      );
    } catch (err) {
      next(err);
    }
  }

  async copiarSemana(req, res, next) {
    try {
      res.status(201).json(
        await EscalaService.copiarSemana(
          req.body,
          req.usuario?.id_usuario,
          req.usuario?.tipo
        )
      );
    } catch (err) {
      next(err);
    }
  }

  async listarTemplates(req, res, next) {
    try {
      res.json(await EscalaService.listarTemplates());
    } catch (err) {
      next(err);
    }
  }

  async criarTemplate(req, res, next) {
    try {
      res.status(201).json(
        await EscalaService.criarTemplate(
          req.body,
          req.usuario?.id_usuario,
          req.usuario?.tipo
        )
      );
    } catch (err) {
      next(err);
    }
  }

  async aplicarTemplate(req, res, next) {
    try {
      res.status(201).json(
        await EscalaService.aplicarTemplate(
          req.params.id,
          req.body,
          req.usuario?.id_usuario,
          req.usuario?.tipo
        )
      );
    } catch (err) {
      next(err);
    }
  }

  async excluirTemplate(req, res, next) {
    try {
      await EscalaService.excluirTemplate(req.params.id, req.usuario?.tipo);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  async desfazer(req, res, next) {
    try {
      res.json(
        await EscalaService.desfazerUltimaAlteracao(
          req.params.id,
          req.usuario?.id_usuario,
          req.usuario?.tipo
        )
      );
    } catch (err) {
      next(err);
    }
  }
}

export default new EscalaController();
