const app = require('./app');
const PORT = process.env.PORT || 3000
const express = require("express")
const unidadFuncionalRoutes = require("./routes/unidadFuncional.routes")


app.use("/UF", unidadFuncionalRoutes);

//Transformar una expensa que figura PAGA, pero por error, y debe figurar IMPAGA
//transformar el valor de una expensa que figura mal cargada



//Peticiones POST
//Subir valores de expensas, segun ID de propietario
//Subir valores de expensas por lote


require('./firebase')
app.listen(PORT, () => console.log(`Escuchando en puerto ${PORT}`))




