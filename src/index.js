const app = require('./app');
const PORT = process.env.PORT || 3000
const { db } = require('./firebase')


//RUTA PARA OBTENER TODOS LOS DATOS DE LOS PROPIETARIOS Y LAS EXPENSAS MENSUALES/EXTRAORDINARIAS
app.get('/UF/all', async (req, res) => {
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
});

//RUTA PARA OBTENER TODOS LOS PAGOS DE LOS PROPIETARIOS
app.get('/expensasPagadas', async (req, res) => {
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
        const expensaSnapshot = await expensaRef.where('pagado', '==', true).get();

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
});
//RUTA PARA OBTENER TODOS LOS PAGOS SEGUN CUOTA MES
app.get('/expensasPagadasPorMes/:cuotaMes', async (req, res) => {
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
});
//RUTA PARA OBTENER TODOS LOS PAGOS SEGUN CUOTA NRO
app.get('/expensasPagadasPorNro/:cuotaNro', async (req, res) => {
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
});
//RUTA PARA OBTENER, SEGUN PROPIETARIO, LAS EXPENSAS MENSUALES/EXTRAORDINARIAS
app.get('/UF/:id', async (req, res) => {
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
});
//RUTA PARA OBTENER, SEGUN PROPIETARIO, LAS EXPENSAS QUE FIGUREN COMO PAGAS
app.get('/UF/pagos/:id', async (req, res) => {
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
});

//RUTA PARA OBTENER, SEGUN PROPIETARIO, LAS EXPENSAS QUE FIGUREN COMO IMPAGAS
app.get('/UF/impagos/:id', async (req, res) => {
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

      // Filtrar solo las expensas pagadas
      const expensasPagadas = expensaSnapshot.docs
        .filter(subdoc => subdoc.data().pagado === false)
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
});



require('./firebase')
app.listen(PORT, () => console.log(`Escuchando en puerto ${PORT}`))




