const { db, timestampService } = require('../firebase')

const unidadFuncionalController = {
  //RUTA PARA OBTENER TODOS LOS DATOS DE LOS PROPIETARIOS Y LAS EXPENSAS MENSUALES/EXTRAORDINARIAS
  obtenerTodo: async (req, res) => {
    try {
      const querySnapshot = await db.collection('UnidadesFuncionales').get();

      if (querySnapshot.empty) {
        console.log('No hay documentos en la colección.');
        res.status(404).send('No hay documentos en la colección.');
        return;
      }

      // Obtén todos los datos de los documentos
      const dataPromises = querySnapshot.docs.map(async (doc) => {
        const unidadFuncionalData = doc.data();

        // Obtén las subcolecciones de cada documento
        const expensasPromises = ['ExpensasExtraordinarias', 'ExpensasMensuales'].map(async (expensaNombre) => {
          const expensaRef = doc.ref.collection(expensaNombre);
          const expensaSnapshot = await expensaRef.get();
          const periodosData = expensaSnapshot.docs.map(subdoc => subdoc.data());
          return { tipo: expensaNombre, periodo: periodosData };
        });

        // Espera a que todas las subcolecciones se resuelvan
        const expensasData = await Promise.all(expensasPromises);

        // Combina los datos del documento principal con las expensas
        return { ...unidadFuncionalData, expensas: expensasData };
      });

      // Espera a que todas las promesas se resuelvan
      const allData = await Promise.all(dataPromises);

      // Envía los datos como JSON
      res.json(allData);
    } catch (error) {
      console.error('Error al obtener documentos:', error);
      res.status(500).send('Error interno del servidor.');
    }
  },
  //RUTA PARA OBTENER TODOS LOS PERIODOS PAGOS DE LOS PROPIETARIOS
  expensasPagadas: async (req, res) => {
    try {
      // Accede a la colección de UnidadesFuncionales
      const unidadesFuncionalesRef = db.collection('UnidadesFuncionales');

      // Obtiene todas las unidades funcionales
      const unidadesFuncionalesSnapshot = await unidadesFuncionalesRef.get();

      // Array para almacenar los resultados finales
      const resultados = [];

      // Itera sobre todas las unidades funcionales
      for (const unidadFuncionalDoc of unidadesFuncionalesSnapshot.docs) {
        // Obtén el nombre del propietario
        const propietarioNombre = unidadFuncionalDoc.data().propietario;
        const idUF = unidadFuncionalDoc.id

        // Obtiene las subcolecciones de cada documento
        const expensasPromises = ['ExpensasExtraordinarias', 'ExpensasMensuales'].map(async (expensaNombre) => {
          const expensaRef = unidadFuncionalDoc.ref.collection(expensaNombre);
          const expensaSnapshot = await expensaRef.where('pagado', '==', true).get();

          // Obtiene las expensas pagadas
          const expensasPagadas = expensaSnapshot.docs.map(subdoc => ({ idExpensa: subdoc.id, ...subdoc.data() }));
          if (expensaNombre = "ExpensasExtraordinaras") {
            expensaNombre = "Expensas Extraordinarias"
          } else if (expensaNombre = "ExpensasMensuales") {
            expensaNombre = "Expensas Mensuales"
          }
          return { tipo: expensaNombre, periodosPagados: expensasPagadas };
        });

        // Espera a que todas las subcolecciones se resuelvan
        const expensasData = await Promise.all(expensasPromises);

        // Construye el objeto JSON con la estructura deseada
        const unidadFuncionalResult = {
          idUF: idUF,
          propietario: propietarioNombre,
          expensas: expensasData
        };

        resultados.push(unidadFuncionalResult);
      }

      // Envía los datos como JSON
      res.json(resultados);
    } catch (error) {
      console.error('Error al obtener documentos:', error);
      res.status(500).send('Error interno del servidor.');
    }
  },
  //RUTA PARA OBTENER TODOS LOS PERIODOS IMPAGOS DE LOS PROPIETARIOS
  expensasNoPagadas: async (req, res) => {
    try {
      // Accede a la colección de UnidadesFuncionales
      const unidadesFuncionalesRef = db.collection('UnidadesFuncionales');

      // Obtiene todas las unidades funcionales
      const unidadesFuncionalesSnapshot = await unidadesFuncionalesRef.get();

      // Array para almacenar los resultados finales
      const resultados = [];

      // Itera sobre todas las unidades funcionales
      for (const unidadFuncionalDoc of unidadesFuncionalesSnapshot.docs) {
        // Obtén el nombre del propietario
        const propietarioNombre = unidadFuncionalDoc.data().propietario;

        // Obtiene las subcolecciones de cada documento
        const expensasPromises = ['ExpensasExtraordinarias', 'ExpensasMensuales'].map(async (expensaNombre) => {
          const expensaRef = unidadFuncionalDoc.ref.collection(expensaNombre);
          const expensaSnapshot = await expensaRef.where('pagado', '==', false).get();

          // Obtiene las expensas pagadas
          const expensasPagadas = expensaSnapshot.docs.map(subdoc => subdoc.data());

          return { tipo: expensaNombre, periodosPagados: expensasPagadas };
        });

        // Espera a que todas las subcolecciones se resuelvan
        const expensasData = await Promise.all(expensasPromises);

        // Construye el objeto JSON con la estructura deseada
        const unidadFuncionalResult = {
          propietario: propietarioNombre,
          expensas: expensasData
        };

        resultados.push(unidadFuncionalResult);
      }

      // Envía los datos como JSON
      res.json(resultados);
    } catch (error) {
      console.error('Error al obtener documentos:', error);
      res.status(500).send('Error interno del servidor.');
    }
  },
  //RUTA PARA OBTENER TODOS LOS PAGOS SEGUN CUOTA MES
  expensasPagadasPorMes: async (req, res) => {
    try {
      const unidadesFuncionalesRef = db.collection('UnidadesFuncionales');
      const unidadesFuncionalesSnapshot = await unidadesFuncionalesRef.get();

      const resultados = [];
      const cuotaMes = req.params.cuotaMes;

      for (const unidadFuncionalDoc of unidadesFuncionalesSnapshot.docs) {
        const propietarioNombre = unidadFuncionalDoc.data().propietario;

        const expensasPromises = ['ExpensasExtraordinarias', 'ExpensasMensuales'].map(async (expensaNombre) => {
          const expensaRef = unidadFuncionalDoc.ref.collection(expensaNombre);

          const expensaSnapshot = await expensaRef
            .where('pagado', '==', true)
            .where('cuotaMes', '==', cuotaMes)
            .get();

          const expensasPagadas = expensaSnapshot.docs.map(subdoc => subdoc.data());

          return { tipo: expensaNombre, periodosPagados: expensasPagadas };
        });

        const expensasData = await Promise.all(expensasPromises);

        const unidadFuncionalResult = {
          propietario: propietarioNombre,
          expensas: expensasData
        };

        resultados.push(unidadFuncionalResult);
      }

      res.json(resultados);
    } catch (error) {
      console.error('Error al obtener documentos:', error);
      res.status(500).send('Error interno del servidor.');
    }
  },
  //RUTA PARA OBTENER TODOS LOS PAGOS SEGUN CUOTA NRO
  expensasPagadosPorNro: async (req, res) => {
    try {
      const unidadesFuncionalesRef = db.collection('UnidadesFuncionales');
      const unidadesFuncionalesSnapshot = await unidadesFuncionalesRef.get();

      const resultados = [];
      const cuotaNro = parseInt(req.params.cuotaNro);

      for (const unidadFuncionalDoc of unidadesFuncionalesSnapshot.docs) {
        const propietarioNombre = unidadFuncionalDoc.data().propietario;

        const expensasPromises = ['ExpensasExtraordinarias', 'ExpensasMensuales'].map(async (expensaNombre) => {
          const expensaRef = unidadFuncionalDoc.ref.collection(expensaNombre);

          const expensaSnapshot = await expensaRef
            .where('pagado', '==', true)
            .where('cuotaNro', '==', cuotaNro)
            .get();

          const expensasPagadas = expensaSnapshot.docs.map(subdoc => subdoc.data());

          return { tipo: expensaNombre, periodosPagados: expensasPagadas };
        });

        const expensasData = await Promise.all(expensasPromises);

        const unidadFuncionalResult = {
          propietario: propietarioNombre,
          expensas: expensasData
        };

        resultados.push(unidadFuncionalResult);
      }

      res.json(resultados);
    } catch (error) {
      console.error('Error al obtener documentos:', error);
      res.status(500).send('Error interno del servidor.');
    }
  },
  //RUTA PARA OBTENER, SEGUN PROPIETARIO, LAS EXPENSAS MENSUALES/EXTRAORDINARIAS
  obtenerTodoSegunPropietario: async (req, res) => {
    try {
      const unidadFuncionalId = req.params.id;

      // Accede al documento principal usando el id proporcionado en la ruta
      const unidadFuncionalRef = db.collection('UnidadesFuncionales').doc(unidadFuncionalId);
      const unidadFuncionalDoc = await unidadFuncionalRef.get();

      if (!unidadFuncionalDoc.exists) {
        console.log('El documento no existe.');
        res.status(404).send('El documento no existe.');
        return;
      }

      // Obtén el nombre del propietario
      const propietarioNombre = unidadFuncionalDoc.data().propietario;

      // Obtén las subcolecciones de cada documento
      const expensasPromises = ['ExpensasExtraordinarias', 'ExpensasMensuales'].map(async (expensaNombre) => {
        const expensaRef = unidadFuncionalRef.collection(expensaNombre);
        const expensaSnapshot = await expensaRef.get();
        const periodosData = expensaSnapshot.docs.map(subdoc => subdoc.data());
        return { tipo: expensaNombre, periodo: periodosData };
      });

      // Espera a que todas las subcolecciones se resuelvan
      const expensasData = await Promise.all(expensasPromises);

      // Construye el objeto JSON con la estructura deseada
      const jsonResponse = {
        propietario: propietarioNombre,
        expensas: expensasData
      };

      console.log(jsonResponse);

      // Envía los datos como JSON
      res.json(jsonResponse);
    } catch (error) {
      console.error('Error al obtener documentos:', error);
      res.status(500).send('Error interno del servidor.');
    }
  },
  //RUTA PARA OBTENER, SEGUN PROPIETARIO, LAS EXPENSAS QUE FIGUREN COMO IMPAGAS
  impagosSegunPropietario: async (req, res) => {
    try {
      const unidadFuncionalId = req.params.id;
      const usuarioId = req.body.usuarioId;


      // Accede al documento principal usando el id proporcionado en la ruta
      const unidadFuncionalRef = db.collection('UnidadesFuncionales').doc(unidadFuncionalId);
      const unidadFuncionalDoc = await unidadFuncionalRef.get();

      if (!unidadFuncionalDoc.exists) {
        console.log('El documento no existe.');
        res.status(404).send('El documento no existe.');
        return;
      }
      const esUfAsociadaValida = await validarUfAsociada(unidadFuncionalId, usuarioId);
      // Verifica el resultado de la validación
      if (!esUfAsociadaValida) {
        console.log('La clave ufAsociada no coincide con la uf del propietario.');
        res.status(403).send('El usuario no está habilitado para visualizar este recurso.');
        return;
      }


      // Obtén el nombre del propietario
      const propietarioNombre = unidadFuncionalDoc.data().propietario;

      // Obtén las subcolecciones de cada documento
      const expensasPromises = ['ExpensasExtraordinarias', 'ExpensasMensuales'].map(async (expensaNombre) => {
        const expensaRef = unidadFuncionalRef.collection(expensaNombre);
        const expensaSnapshot = await expensaRef.get();

        // Filtrar solo las expensas pagadas
        const expensasPagadas = expensaSnapshot.docs
          .filter(subdoc => subdoc.data().pagado === false)
          .map(subdoc => ({ ...subdoc.data(), id: subdoc.id }));

        return { tipo: expensaNombre, periodosPagados: expensasPagadas };
      });

      // Espera a que todas las subcolecciones se resuelvan
      const expensasData = await Promise.all(expensasPromises);

      // Construye el objeto JSON con la estructura deseada
      const jsonResponse = {
        propietario: propietarioNombre,
        expensas: expensasData
      };

      console.log(jsonResponse);

      // Envía los datos como JSON
      res.json(jsonResponse);
    } catch (error) {
      console.error('Error al obtener documentos:', error);
      res.status(500).send('Error interno del servidor.');
    }
  },
  //RUTA PARA OBTENER, SEGUN PROPIETARIO, LAS EXPENSAS QUE FIGUREN COMO PAGAS
  pagosSegunPropietario: async (req, res) => {
    try {
      const unidadFuncionalId = req.params.id;
      const usuarioId = req.body.usuarioId;


      // Accede al documento principal usando el id proporcionado en la ruta
      const unidadFuncionalRef = db.collection('UnidadesFuncionales').doc(unidadFuncionalId);
      const unidadFuncionalDoc = await unidadFuncionalRef.get();

      if (!unidadFuncionalDoc.exists) {
        console.log('El documento no existe.');
        res.status(404).send('El documento no existe.');
        return;
      }


      const esUfAsociadaValida = await validarUfAsociada(unidadFuncionalId, usuarioId);
      // Verifica el resultado de la validación
      if (!esUfAsociadaValida) {
        console.log('La clave ufAsociada no coincide con la uf del propietario.');
        res.status(403).send('El usuario no está habilitado para visualizar este recurso.');
        return;
      }

      // Obtén el nombre del propietario
      const propietarioNombre = unidadFuncionalDoc.data().propietario;

      // Obtén las subcolecciones de cada documento
      const expensasPromises = ['ExpensasExtraordinarias', 'ExpensasMensuales'].map(async (expensaNombre) => {
        const expensaRef = unidadFuncionalRef.collection(expensaNombre);
        const expensaSnapshot = await expensaRef.get();

        // Filtrar solo las expensas pagadas
        const expensasPagadas = expensaSnapshot.docs
          .filter(subdoc => subdoc.data().pagado === true)
          .map(subdoc => subdoc.data());

        return { tipo: expensaNombre, periodosPagados: expensasPagadas };
      });

      // Espera a que todas las subcolecciones se resuelvan
      const expensasData = await Promise.all(expensasPromises);

      // Construye el objeto JSON con la estructura deseada
      const jsonResponse = {
        propietario: propietarioNombre,
        expensas: expensasData
      };

      console.log(jsonResponse);

      // Envía los datos como JSON
      res.json(jsonResponse);
    } catch (error) {
      console.error('Error al obtener documentos:', error);
      res.status(500).send('Error interno del servidor.');
    }
  },
  obtenerListado: async (req, res) => {
    try {
      const querySnapshot = await db.collection('UnidadesFuncionales').get();

      if (querySnapshot.empty) {
        console.log('No hay documentos en la colección.');
        res.status(404).send('No hay documentos en la colección.');
        return;
      }

      // Inicializar un array para almacenar los datos de las unidades funcionales con sus IDs
      const unidadFuncionalDataArray = [];

      // Iterar sobre cada documento en la colección
      querySnapshot.forEach((doc) => {
        // Obtener el ID del documento
        const unidadFuncionalId = doc.id;

        // Obtener los datos del documento
        const unidadFuncionalData = doc.data();

        // Agregar el ID del documento junto con los datos al array
        unidadFuncionalDataArray.push({ id: unidadFuncionalId, ...unidadFuncionalData });
      });

      // Enviar los datos como JSON
      res.json(unidadFuncionalDataArray);
    } catch (error) {
      console.error('Error al obtener documentos:', error);
      res.status(500).send('Error interno del servidor.');
    }
  },
  busquedaExpensaPorId: async (req, res) => {
    try {
      const idPropietario = req.body.idPropietario;
      const idExpensaHash = req.body.idExpensaHash;
      //console.log({ idExpensaHash, idPropietario })

      // Acceder a las colecciones de expensas mensuales y extraordinarias
      const expensasMensualesRef = db.collection('UnidadesFuncionales').doc(idPropietario).collection('ExpensasMensuales');
      const expensasExtraordinariasRef = db.collection('UnidadesFuncionales').doc(idPropietario).collection('ExpensasExtraordinarias');
      // Buscar en la colección de expensas mensuales
      const expensaMensualDoc = await expensasMensualesRef.doc(idExpensaHash).get();
      if (expensaMensualDoc.exists) {
        res.json(expensaMensualDoc.data());
        return;
      }

      // Buscar en la colección de expensas extraordinarias
      const expensaExtraordinariaDoc = await expensasExtraordinariasRef.doc(idExpensaHash).get();
      if (expensaExtraordinariaDoc.exists) {
        res.json(expensaExtraordinariaDoc.data());
        return;
      }
      // Si no se encuentra en ninguna de las colecciones, devolver un error
      console.log('La expensa no fue encontrada.');
      res.status(404).send('La expensa no fue encontrada.');
    } catch (error) {
      console.error('Error al buscar la expensa:', error);
      res.status(500).send('Error interno del servidor.');
    }
  },
  //Peticiones UPDATE
  //Transformar una expensa IMPAGA en PAGA
  //Ruta para marcar una expensa como pagada en una unidad funcional
  ingresarPago: async (req, res) => {
    try {
      const unidadFuncionalId = req.params.unidadFuncionalId;
      const cuota = req.params.cuota;
      const timestamp = timestampService.now();

      const { valorActualizado, verificado, comprobantePago, diasIntereses, valorIntereses } = req.body;




      // Obtiene todos los periodos impagos de la unidad funcional
      const periodosImpagos = await getPeriodosImpagos(unidadFuncionalId);

      console.log('Periodos impagos:', periodosImpagos);

      // Filtra las expensas impagas que coinciden con la cuota proporcionada
      const expensasPorCuota = periodosImpagos.filter(expensa => expensa.cuota == cuota);

      if (expensasPorCuota.length === 0) {
        // No se encontraron expensas para la cuota proporcionada
        res.status(404).send(`No se encontraron expensas impagas para la cuota ${cuota}.`);
        return;
      }

      console.log('Expensas por cuota que coinciden:', expensasPorCuota);

      // Marca como pagadas las expensas encontradas
      const updatePromises = expensasPorCuota.map(async (expensa) => {
        const expensaRef = db.collection('UnidadesFuncionales').doc(unidadFuncionalId)
          .collection(expensa.tipo).doc(expensa.id);

        // Verifica si el documento existe antes de intentar actualizarlo
        const expensaDoc = await expensaRef.get();
        console.log(expensaRef)

        if (expensaDoc.exists) {
          // Actualiza directamente el campo pagado
          await expensaRef.update({
            pagado: true,
            fechaDePago: timestamp,
            valorActualizado,
            verificado,
            comprobantePago,
            diasIntereses,
            valorIntereses
            //TENGO  QUE CARGAR TODOS LOS OTROS DATOS QUE S EMODIFICAN
          });
        } else {
          console.error(`Documento no encontrado para actualizar: ${expensa.id}`);
        }
      });

      await Promise.all(updatePromises);

      // Obtiene nuevamente los periodos impagos para responder con esa información
      const periodosImpagosActualizados = await getPeriodosImpagos(unidadFuncionalId);

      console.log('Periodos impagos actualizados:', periodosImpagosActualizados);

      res.status(200).json({
        message: `Expensas de cuota ${cuota} marcadas como pagadas correctamente.`,
        periodosImpagos: periodosImpagosActualizados
      });

    } catch (error) {
      console.error('Error al marcar las expensas como pagadas:', error);
      res.status(500).send(`Error interno del servidor: ${error.message}`);
    }
  },
  verificarPago: async (req, res) => {
    try {
      const unidadFuncionalId = req.params.unidadFuncionalId;
      const idExpensa = req.params.idExpensa;
      //const timestamp = timestampService.now();

      //const { valorActualizado, verificado, comprobantePago, diasIntereses, valorIntereses } = req.body;




      // Obtiene todos los periodos impagos de la unidad funcional
      const periodosPagos = await getPeriodosPagos(unidadFuncionalId);

      console.log('Periodos pagos (No verificados):', periodosPagos);

      // Filtra las expensas impagas que coinciden con la cuota proporcionada
      const expensasPorID = periodosPagos.filter(expensa => expensa.id == idExpensa);

      if (expensasPorID.length === 0) {
        // No se encontraron expensas para la cuota proporcionada
        res.status(404).send(`No se encontraron expensas para el ID suministrado.`);
        return;
      }

      console.log('Expensas por id que coinciden:', expensasPorID);

      // Marca como pagadas las expensas encontradas
      const updatePromises = expensasPorID.map(async (expensa) => {
        const expensaRef = db.collection('UnidadesFuncionales').doc(unidadFuncionalId)
          .collection(expensa.tipo).doc(expensa.id);

        // Verifica si el documento existe antes de intentar actualizarlo
        const expensaDoc = await expensaRef.get();
        console.log(expensaRef)

        if (expensaDoc.exists) {
          // Actualiza directamente el campo pagado
          await expensaRef.update({
            verificado: true
          });
        } else {
          console.error(`Documento no encontrado para actualizar: ${expensa.id}`);
        }
      });

      await Promise.all(updatePromises);

      // Obtiene nuevamente los periodos impagos para responder con esa información
      //const periodosImpagosActualizados = await getPeriodosImpagos(unidadFuncionalId);

      //console.log('Periodos impagos actualizados:', periodosImpagosActualizados);

      res.status(200).json({
        message: `La expensa ingresada ha sido verificada correctamente.`
        //periodosImpagos: periodosImpagosActualizados
      });

    } catch (error) {
      console.error('Error al marcar las expensas como verificada:', error);
      res.status(500).send(`Error interno del servidor: ${error.message}`);
    }
  }

};

async function getPeriodosImpagos(unidadFuncionalId) {
  try {
    const unidadFuncionalRef = db.collection('UnidadesFuncionales').doc(unidadFuncionalId);

    const expensasMensualesSnapshot = await unidadFuncionalRef.collection('ExpensasMensuales')
      .where('pagado', '==', false)
      .get();

    const expensasExtraordinariasSnapshot = await unidadFuncionalRef.collection('ExpensasExtraordinarias')
      .where('pagado', '==', false)
      .get();

    const expensasSnapshot = [...expensasMensualesSnapshot.docs, ...expensasExtraordinariasSnapshot.docs];

    console.log('Expensas impagas encontradas:', expensasSnapshot.map(doc => doc.id));

    return expensasSnapshot.map(expensaDoc => {
      const expensaData = expensaDoc.data();
      return {
        id: expensaDoc.id,
        cuota: expensaData.cuotaMes || expensaData.cuotaNro,
        tipo: expensaData.cuotaMes ? 'ExpensasMensuales' : 'ExpensasExtraordinarias'
      };
    });
  } catch (error) {
    console.error('Error al obtener periodos impagos:', error);
    throw error;
  }
}
async function getPeriodosPagos(unidadFuncionalId) {
  try {
    const unidadFuncionalRef = db.collection('UnidadesFuncionales').doc(unidadFuncionalId);

    const expensasMensualesSnapshot = await unidadFuncionalRef.collection('ExpensasMensuales')
      .where('pagado', '==', true)
      .where('verificado', '==', false)
      .get();

    const expensasExtraordinariasSnapshot = await unidadFuncionalRef.collection('ExpensasExtraordinarias')
      .where('pagado', '==', true)
      .where('verificado', '==', false)
      .get();

    const expensasSnapshot = [...expensasMensualesSnapshot.docs, ...expensasExtraordinariasSnapshot.docs];

    console.log('Expensas pagas (No verificadas) encontradas:', expensasSnapshot.map(doc => doc.id));

    return expensasSnapshot.map(expensaDoc => {
      const expensaData = expensaDoc.data();
      return {
        id: expensaDoc.id,
        cuota: expensaData.cuotaMes || expensaData.cuotaNro,
        tipo: expensaData.cuotaMes ? 'ExpensasMensuales' : 'ExpensasExtraordinarias'
      };
    });
  } catch (error) {
    console.error('Error al obtener periodos impagos:', error);
    throw error;
  }
}


// Función para validar la ufAsociada
const validarUfAsociada = async (unidadFuncionalId, usuarioId) => {
  //const unidadFuncionalDoc = await unidadFuncionalRef.get();

  // Obtén el documento del usuario
  const usuarioRef = db.collection('Usuarios').doc(usuarioId);
  const usuarioDoc = await usuarioRef.get();

  // Verifica si el usuario existe
  if (!usuarioDoc.exists) {
    console.log('El usuario no existe.');
    res.status(404).send('El usuario no existe.');
    return;
  }

  // Obtén el valor de la propiedad ufAsociada del usuario
  const ufAsociadaUsuario = usuarioDoc.data().ufAsociada;
  console.log(ufAsociadaUsuario)

  // Agrega logs para depuración
  console.log('ufAsociada proporcionada:', ufAsociadaUsuario);
  console.log('ufAsociada en el documento principal:', unidadFuncionalId);

  // Verifica si la clave ufAsociada coincide con la uf del propietario en el documento principal
  return ufAsociadaUsuario === unidadFuncionalId;
};


module.exports = unidadFuncionalController
