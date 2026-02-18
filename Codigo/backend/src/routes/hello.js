//Testando a conexão do back com front
const express = require("express");
const router = express.Router();

router.get("/hello", (req, res) => {
  res.json({ message: "Hello World do backend!" });
});

module.exports = router;
