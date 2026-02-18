import api from "./apiClient";

const URL = "/usuarios";

export function showAllUsers() {
  const response = api
    .get(URL)
    .then((res) => res.data)
    .catch((err) => {
      console.log(err);
    });
  return response;
}

export async function showUserById(id) {
  const response = await api
    .get(`${URL}/${id}`)
    .then((res) => res.data)
    .catch((err) => {
      console.log(err);
    });
  return response;
}

export async function createUser(userData) {
  const response = await api
    .post(URL, userData)
    .then((res) => res.data)
    .catch((err) => {
      console.log(err);
    });
  return response;
}

export async function updateUser(id, userData) {
  const response = await api
    .put(`${URL}/${id}`, userData)
    .then((res) => res.data)
    .catch((err) => {
      console.log(err);
    });
  return response;
}

export async function deleteUser(id) {
  const response = await api
    .delete(`${URL}/${id}`)
    .then((res) => res.data)
    .catch((err) => {
      console.log(err);
    });
  return response;
}

export async function getUserProfile() {
  const response = await api
    .get(`${URL}/perfil`)
    .then((res) => res.data)
    .catch((err) => {
      console.log(err);
    });
  return response;
}

export async function updateUserProfile(userData) {
  const response = await api
    .put(`${URL}/perfil`, userData)
    .then((res) => res.data)
    .catch((err) => {
      console.log(err);
    });
  return response;
}

export async function uploadUserPhoto(file) {
  const formData = new FormData();
  formData.append("foto", file);

  const response = await api
    .post(`${URL}/perfil/foto`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    .then((res) => res.data)
    .catch((err) => {
      console.log(err);
      throw err;
    });
  return response;
}
