import api from "./apiClient";

const URL = "/nivel";

export async function showAllNiveis(incluirInativos = false) {
  try {
    const res = await api.get(URL, {
      params: incluirInativos ? { incluir_inativos: "1" } : undefined,
    });
    return res.data;
  } catch (err) {
    console.error("Erro ao listar níveis:", err);
    throw err;
  }
}

export async function showNivelById(id) {
  try {
    const res = await api.get(`${URL}/${id}`);
    return res.data;
  } catch (err) {
    console.error("Erro ao buscar nível:", err);
    throw err;
  }
}

export async function createNivel(nivelData) {
  try {
    const res = await api.post(URL, nivelData);
    return res.data;
  } catch (err) {
    console.error("Erro ao criar nível:", err);
    throw err;
  }
}

export async function updateNivel(id, nivelData) {
  try {
    const res = await api.put(`${URL}/${id}`, nivelData);
    return res.data;
  } catch (err) {
    console.error("Erro ao atualizar nível:", err);
    throw err;
  }
}

export async function deleteNivel(id) {
  try {
    const res = await api.delete(`${URL}/${id}`);
    return res.data;
  } catch (err) {
    console.error("Erro ao inativar nível:", err);
    throw err;
  }
}

export async function reativarNivel(id) {
  try {
    const res = await api.patch(`${URL}/${id}/reativar`);
    return res.data;
  } catch (err) {
    console.error("Erro ao reativar nível:", err);
    throw err;
  }
}
