const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    const messages = error.details.map((detail) => detail.message);
    return res.status(400).json({
      error: messages[0] || "Dados inválidos",
      errors: messages,
    });
  }
  req.body = value;
  next();
};

export default validate;
