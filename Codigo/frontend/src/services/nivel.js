import api from "./apiClient";

const URL = "/nivel";

export async function showAllNiveis() {
  const response = await api
    .get(URL)
    .then((res) => res.data)
    .catch((err) => {
      console.log(err);
    });
  return response;
}

export async function showNivelById(id) {
  const response = await api
    .get(`${URL}/${id}`)
    .then((res) => res.data)
    .catch((err) => {
      console.log(err);
    });
  return response;
}

export async function createNivel(nivelData) {
  const response = await api
    .post(URL, nivelData)
    .then((res) => res.data)
    .catch((err) => {
      console.log(err);
    });
  return response;
}

export async function updateNivel(id, nivelData) {
  const response = await api
    .put(`${URL}/${id}`, nivelData)
    .then((res) => res.data)
    .catch((err) => {
      console.log(err);
    });
  return response;
}

export async function deleteNivel(id) {
  const response = await api
    .delete(`${URL}/${id}`)
    .then((res) => res.data)
    .catch((err) => {
      console.log(err);
    });
  return response;
}
