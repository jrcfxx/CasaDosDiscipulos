import api from "./apiClient";

const URL = "/usuarios";

export async function showAllUsers() {
  try {
    const res = await api.get(URL);
    return res.data;
  } catch (err) {
    console.error("Erro ao listar usuários:", err);
    throw err;
  }
}

export async function showUserById(id) {
  try {
    const res = await api.get(`${URL}/${id}`);
    return res.data;
  } catch (err) {
    console.error("Erro ao buscar usuário:", err);
    throw err;
  }
}

export async function createUser(userData) {
  try {
    const res = await api.post(URL, userData);
    return res.data;
  } catch (err) {
    console.error("Erro ao criar usuário:", err);
    throw err;
  }
}

export async function updateUser(id, userData) {
  try {
    const res = await api.put(`${URL}/${id}`, userData);
    return res.data;
  } catch (err) {
    console.error("Erro ao atualizar usuário:", err);
    throw err;
  }
}

export async function deleteUser(id) {
  try {
    const res = await api.delete(`${URL}/${id}`);
    return res.data;
  } catch (err) {
    console.error("Erro ao excluir usuário:", err);
    throw err;
  }
}

export async function getUserProfile() {
  try {
    const res = await api.get(`${URL}/perfil`);
    return res.data;
  } catch (err) {
    console.error("Erro ao carregar perfil:", err);
    throw err;
  }
}

export async function updateUserProfile(userData) {
  try {
    const res = await api.put(`${URL}/perfil`, userData);
    return res.data;
  } catch (err) {
    console.error("Erro ao atualizar perfil:", err);
    throw err;
  }
}

export async function uploadUserPhoto(file) {
  const formData = new FormData();
  formData.append("foto", file);

  try {
    const res = await api.post(`${URL}/perfil/foto`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  } catch (err) {
    console.error("Erro ao enviar foto:", err);
    throw err;
  }
}
