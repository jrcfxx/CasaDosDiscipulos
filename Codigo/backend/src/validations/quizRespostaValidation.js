export const validateCreateResposta = (data) => {
  const errors = [];

  if (!data.id_quiz) errors.push("id_quiz é obrigatório");
  if (!data.id_usuario) errors.push("id_usuario é obrigatório");

  if (!data.resposta || data.resposta.trim() === "") {
    errors.push("A resposta não pode estar vazia");
  }

  return errors;
};

export const validateUpdateResposta = (data) => {
  const errors = [];

  if (data.resposta !== undefined && data.resposta.trim() === "") {
    errors.push("A resposta não pode ser vazia");
  }

  return errors;
};
