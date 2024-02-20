const { db, firebase } = require('../firebase');
const bcrypt = require('bcrypt');

const loginController = {
  inicioSesion: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Validar la contraseña
      if (!validarPassword(password)) {
        res.status(400).json({ error: 'La contraseña no cumple con los requisitos mínimos.' });
        return;
      }

      // Buscar el usuario por su correo electrónico en la colección "Usuarios" de Firestore
      const usuariosRef = db.collection('Usuarios');
      const snapshot = await usuariosRef.where('email', '==', email).get();

      // Verificar si se encontró algún usuario con el correo electrónico proporcionado
      if (snapshot.empty) {
        // Si no se encontró ningún usuario, devolver un mensaje de error
        res.status(401).json({ error: 'No existe ningún usuario con ese correo electrónico.' });
        return;
      }

      // Si se encontró al menos un usuario, continuar con la lógica de autenticación
      let userId;
      let usuario;
      snapshot.forEach(doc => {
        // Obtener los datos del usuario
        usuario = doc.data();
        // Comparar la contraseña proporcionada con la contraseña almacenada utilizando bcrypt
        bcrypt.compare(password, usuario.password, (err, result) => {
          if (err) {
            // Si hay un error al comparar las contraseñas, devolver un error interno del servidor
            console.error('Error al comparar contraseñas:', err);
            res.status(500).json({ error: 'Error interno del servidor' });
            return;
          }
          if (result) {
            // Si la contraseña coincide, obtener el ID de usuario y devolverlo como respuesta
            userId = doc.id;
            res.json({ userId });
          } else {
            // Si la contraseña no coincide, devolver un mensaje de error
            res.status(401).json({ error: 'Credenciales incorrectas' });
          }
        });
      });
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },
  crearUsuario: async (req, res) => {
    try {
      // Extraer los datos del nuevo usuario desde el cuerpo de la solicitud
      const { email, password, ufAsociada, nombreCompleto } = req.body;

      // Verificar si ya existe un usuario con el mismo correo electrónico
      const usuarioExistente = await db.collection('Usuarios').where('email', '==', email).get();
      if (!usuarioExistente.empty) {
        return res.status(400).json({ error: 'Ya existe un usuario con este correo electrónico.' });
      }

      // Cifrar la contraseña antes de almacenarla en la base de datos
      const contraseñaCifrada = await bcrypt.hash(password, 10);

      // Crear un nuevo documento de usuario en la base de datos
      const nuevoUsuarioRef = await db.collection('Usuarios').add({
        email: email,
        nombreCompleto: nombreCompleto,
        password: contraseñaCifrada,
        permisosDeAdministrador: false,
        ufAsociada: ufAsociada,
        // Otros campos del usuario, como nombre, apellido, etc.
      });

      // Devolver el ID del nuevo usuario creado como respuesta
      res.json({ userId: nuevoUsuarioRef.id });
    } catch (error) {
      console.error('Error al crear nuevo usuario:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },
  obtenerUsuario: async (req, res) => {
    try {
      const userId = req.body.userId;

      // Obtener los datos del usuario desde Firebase Firestore
      const userDoc = await db.collection('Usuarios').doc(userId).get();

      if (!userDoc.exists) {
        // Si no se encuentra el usuario, devolver un error
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // Devolver los datos del usuario
      const userData = userDoc.data();
      return res.json(userData);
    } catch (error) {
      console.error('Error al obtener los datos del usuario:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};



function validarPassword(password) {
  // Al menos una letra mayúscula, una letra minúscula, un número y una longitud mínima de 10 caracteres
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return regex.test(password);
}
module.exports = loginController;
