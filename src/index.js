const app = require('./app');
const PORT = process.env.PORT || 3000
const express = require("express")
const unidadFuncionalRoutes = require("./routes/unidadFuncional.routes")
const usuariosRoutes = require("./routes/usuarios.routes")

app.use(express.json())


app.use("/UF", unidadFuncionalRoutes);
app.use("/Usuarios", usuariosRoutes);


//Transformar una expensa que figura PAGA, pero por error, y debe figurar IMPAGA
//transformar el valor de una expensa que figura mal cargada



//Peticiones POST
//Subir valores de expensas, segun ID de propietario
//Subir valores de expensas por lote


require('./firebase')
app.listen(PORT, () => console.log(`Escuchando en puerto ${PORT}`))




