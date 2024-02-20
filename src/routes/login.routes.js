const express = require("express");
const router = express.Router();
const loginController = require("../controllers/login.controller");

router.post("/", loginController.inicioSesion)
router.post("/crearUsuario", loginController.crearUsuario)
router.post("/obtenerUsuario", loginController.obtenerUsuario)

module.exports = router