const { db } = require('../firebase')

const usuariosController = {
    listarUsuarios: async (req, res) => {
        try {
          const querySnapshot = await db.collection('Usuarios').get();
      
          if (querySnapshot.empty) {
            console.log('No hay documentos en la colección.');
            return res.status(404).send('No hay documentos en la colección.');
          }
      
          // Obtén todos los datos de los documentos
          const dataPromises = querySnapshot.docs.map(async (doc) => {
            return doc.data(); // Devuelve los datos del usuario
          });
      
          // Espera a que se resuelvan todas las promesas
          const usuariosData = await Promise.all(dataPromises);
      
          // Envía la respuesta con todos los datos de los usuarios
          res.json(usuariosData);
        } catch (error) {
          console.error('Error al obtener documentos:', error);
          res.status(500).send('Error interno del servidor.');
        }
      }
      
}

module.exports = usuariosController