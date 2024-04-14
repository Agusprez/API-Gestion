const express = require("express");
const router = express.Router();
const loginController = require("../controllers/login.controller");

router.post("/", loginController.inicioSesion)
router.get("/test", loginController.test)
router.post("/crearUsuario", loginController.crearUsuario)
router.post("/obtenerUsuario", loginController.obtenerUsuario)
router.post("/checkemail", loginController.checkemail)
router.get("/preguntasSeguridad", loginController.preguntasDeSeguridad)
router.post("/reset-password", loginController.resetPassword)

module.exports = router