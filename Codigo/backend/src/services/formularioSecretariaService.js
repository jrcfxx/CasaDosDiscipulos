import knex from "../database/index.js";
import LicoesRepository from "../repository/LicoesRepository.js";
import FormularioRepository from "../repository/FormularioRepository.js";
import CampoPersonalizadoRepository from "../repository/CampoPersonalizadoRepository.js";

class formularioSecretariaService {
  
  async updateLicao(idLicao, data, file) {
    const { titulo, descricao, addCaixaTexto, addCheckbox, ativo } = data;
    const boolCaixaTexto = addCaixaTexto === "true";
    const boolCheckbox = addCheckbox === "true";
    const boolAtivo = ativo === "false" || ativo === 0 ? 0 : 1;

    const dadosLicaoUpdate = {
      titulo,
      descricao,
      ativo: boolAtivo,
    };
    if (file) {
      dadosLicaoUpdate.material = file.path;
    }

    return knex.transaction(async (trx) => {
      // 1. Atualiza a Lição
      const affectedRows = await LicoesRepository.update(
        idLicao,
        dadosLicaoUpdate,
        trx
      );
      if (affectedRows === 0) {
        throw new Error("Lição não encontrada");
      }

      // 2. Sincroniza o Formulário
      let formulario = await FormularioRepository.findByLicao(idLicao, trx);
      let idFormulario = formulario ? formulario.id_formulario : null;

      if (!idFormulario && (boolCaixaTexto || boolCheckbox)) {
        [idFormulario] = await FormularioRepository.create(
          {
            id_licao: idLicao,
            titulo: `Atividade: ${titulo}`,
            ativo: 1,
          },
          trx
        );
      }

      if (idFormulario) {
        // Sincroniza Texto
        const campoTexto =
          await CampoPersonalizadoRepository.findByFormularioAndTipo(
            idFormulario,
            "TEXTO",
            trx
          );
        if (boolCaixaTexto && !campoTexto) {
          await CampoPersonalizadoRepository.create(
            {
              origem: "formulario",
              id_origem: idFormulario,
              label: "Sua Resposta",
              tipo_campo: "TEXTO",
            },
            trx
          );
        } else if (!boolCaixaTexto && campoTexto) {
          await CampoPersonalizadoRepository.deleteById(
            campoTexto.id_campo,
            trx
          );
        }

        // Sincroniza Checkbox
        const campoCheckbox =
          await CampoPersonalizadoRepository.findByFormularioAndTipo(
            idFormulario,
            "CHECKBOX",
            trx
          );
        if (boolCheckbox && !campoCheckbox) {
          await CampoPersonalizadoRepository.create(
            {
              origem: "formulario",
              id_origem: idFormulario,
              label: "Marque as opções",
              tipo_campo: "CHECKBOX",
            },
            trx
          );
        } else if (!boolCheckbox && campoCheckbox) {
          await CampoPersonalizadoRepository.deleteById(
            campoCheckbox.id_campo,
            trx
          );
        }
      }
      return affectedRows;
    });
  }
}

export default new FormularioSecretariaService();
