const express = require("express");
const router = express.Router();
const usuariosController = require("../controllers/usuarios.controller");

router.get("/", usuariosController.listarUsuarios)
router.patch("/relacion-USER-UF", usuariosController.relacionUserUF)

module.exports = router