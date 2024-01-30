const express = require("express");
const router = express.Router();
const unidadFuncionalController = require("../controllers/unidadFuncional.controller");

router.get("/", unidadFuncionalController.obtenerTodo);
router.get("/pagos", unidadFuncionalController.expensasPagadas);
router.get("/impagos", unidadFuncionalController.expensasNoPagadas);
router.get("/pagos/:cuotaMes", unidadFuncionalController.expensasPagadasPorMes);
router.get("/pagos_ext/:cuotaNro", unidadFuncionalController.expensasPagadosPorNro);
router.get("/obtenerTodo/:id", unidadFuncionalController.obtenerTodoSegunPropietario);
router.get("/impagosSegunPropietario/:id", unidadFuncionalController.impagosSegunPropietario);
router.get("/pagosSegunPropietario/:id", unidadFuncionalController.pagosSegunPropietario);


router.patch("/ingresarPago/:unidadFuncionalId/:cuota", unidadFuncionalController.ingresarPago);




module.exports = router;