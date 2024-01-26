const app = require('./app');
const PORT = process.env.PORT || 3000
const { db } = require('./firebase')

app.get('/all', async (req, res) => {
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


app.get('/:id', async (req, res) => {
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

require('./firebase')
app.listen(PORT, () => console.log(`Escuchando en puerto ${PORT}`))


const obt = [
  { propietario: 'nombre propietario' },
  { expMens: 'valor' },
  { expExt: 'valor' }
]

