const { db } = require('../firebase')

const usuariosController = {
  listarUsuarios: async (req, res) => {
    try {
      const querySnapshot = await db.collection('Usuarios').get();

      if (querySnapshot.empty) {
        console.log('No hay documentos en la colección.');
        return res.status(404).send('No hay documentos en la colección.');
      }

      // Obtén todos los datos de los documentos con ID
      const usuariosData = querySnapshot.docs.map((doc) => {
        return {
          id: doc.id,
          ...doc.data()
        };
      });

      // Envía la respuesta con todos los datos de los usuarios, incluyendo el ID
      res.json(usuariosData);
    } catch (error) {
      console.error('Error al obtener documentos:', error);
      res.status(500).send('Error interno del servidor.');
    }
  }, relacionUserUF: async (req, res) => {
    const { idUsuario, estadoNuevo } = req.body

    try {
      const querySnapshot = await db.collection('Usuarios').get()

      /*       if (querySnapshot.empty) {
              console.log('No hay documentos en la colección.');
              return res.status(404).send('No hay documentos en la colección.');
            } */
      const usuario = querySnapshot.docs.find(doc => doc.id === idUsuario)
      if (!usuario) {
        console.log(`El usuario con ID ${idUsuario} no fue encontrado.`);
        return res.status(404).send(`El usuario con ID ${idUsuario} no fue encontrado.`);
      }
      // Actualizar el estado del usuario con el nuevo valor
      await db.collection('Usuarios').doc(idUsuario).update({ ufAsociadaHabilitada: estadoNuevo });
      res.status(200).send('Usuario actualizado correctamente');
    } catch (error) {
      console.error('Error al actualizar el usuario:', error);
      res.status(500).send('Error al actualizar el usuario');
    }
  }

};


module.exports = usuariosController