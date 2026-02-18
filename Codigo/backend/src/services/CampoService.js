import CampoModel from "../models/CampoModel.js";
import AppError from "../utils/AppError.js";

const CampoService = {
  async getAll() {
    return await CampoModel.getAll();
  },

  async getByModalidade(modalidade) {
    const validModalidades = ["modulo", "quiz", "licao", "formulario"];
    if (!validModalidades.includes(modalidade)) {
      throw new AppError("Modalidade inválida", 400);
    }
    return await CampoModel.getByModalidade(modalidade);
  },

  async getByOption(option, id) {
    const result = await CampoModel.getByOption(option, id);
    if (!result || result.length === 0)
      throw new AppError("Não encontrado", 404);
    return result;
  },

  async createByOption(option, id, id_campo, label) {
    if (!option || !id || !id_campo || !conteudo || !label) {
      throw new AppError("Parâmetros incompletos", 400);
    }

    const result = await CampoModel.createByOption(
      option,
      id,
      id_campo,
      conteudo,
      label
    );
    if (!result) throw new AppError("Falha ao criar campo", 400);

    return result;
  },

  async getById(id) {
    const result = await CampoModel.getById(id);
    if (!result) throw new AppError("Campo não encontrado", 404);
    return result;
  },

  async create(data) {
    return await CampoModel.create(data);
  },

  async update(id, data) {
    if (isNaN(id)) throw new AppError("ID inválido", 400);
    const updated = await CampoModel.update(id, data);
    if (!updated) throw new AppError("Campo não encontrado", 404);
    return updated;
  },

  async remove(id) {
    if (isNaN(id)) throw new AppError("ID inválido", 400);
    const deleted = await CampoModel.remove(id);
    if (!deleted) throw new AppError("Campo não encontrado", 404);
    return deleted;
  },
};

export default CampoService;
