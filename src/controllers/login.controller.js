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
            ufAsociadaHabilitada = usuario.ufAsociadaHabilitada
            res.json({ userId, ufAsociadaHabilitada });
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
  test: (req, res) => {
    res.json({
      "message": "Hola desde test"
    })
  },
  crearUsuario: async (req, res) => {
    try {
      // Extraer los datos del nuevo usuario desde el cuerpo de la solicitud
      const { email, password, ufAsociada, nombreCompleto, preguntaSeguridad, respuestaSeguridad } = req.body;
      if (validarPassword(password)) {


        // Verificar si ya existe un usuario con el mismo correo electrónico
        const usuarioExistente = await db.collection('Usuarios').where('email', '==', email).get();
        if (!usuarioExistente.empty) {
          return res.status(400).json({ error: 'Ya existe un usuario con este correo electrónico.' });
        }

        // Cifrar la contraseña antes de almacenarla en la base de datos
        const contraseñaCifrada = await bcrypt.hash(password, 10);
        const respuestaSeguridadCifrada = await bcrypt.hash(respuestaSeguridad, 10);

        // Crear un nuevo documento de usuario en la base de datos
        const nuevoUsuarioRef = await db.collection('Usuarios').add({
          email: email,
          nombreCompleto: nombreCompleto,
          password: contraseñaCifrada,
          permisosDeAdministrador: false,
          ufAsociadaHabilitada: false,
          ufAsociada: ufAsociada,
          preguntaSeguridad: preguntaSeguridad,
          respuestaSeguridad: respuestaSeguridadCifrada
          // Otros campos del usuario, como nombre, apellido, etc.
        });

        // Devolver el ID del nuevo usuario creado como respuesta
        res.json({ userId: nuevoUsuarioRef.id });
      }
      else {
        res.status(400).json({ error: "Formato de contraseña invalido. Debe contener al menos una mayuscula, una minuscula y un numero" })
      }
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
  },
  checkemail: async (req, res) => {
    try {
      const userEmail = req.body.email; // Obtener el correo electrónico del cuerpo de la solicitud

      // Verificar si existe un usuario con el correo electrónico proporcionado
      const userDoc = await db.collection('Usuarios').where('email', '==', userEmail).get();

      if (!userDoc.empty) {
        // Si ya existe un usuario con ese correo electrónico, devolver un mensaje indicándolo
        return res.json({ exists: true });
      }

      // Si no hay usuarios con ese correo electrónico, significa que está disponible
      return res.json({ exists: false });
    } catch (error) {
      console.error('Error al verificar el correo electrónico:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },
  preguntasDeSeguridad: (req, res) => {
    // Define un arreglo con las preguntas de seguridad
    const securityQuestions = [
      { id: 1, question: '¿Cuál es el nombre de tu mascota favorita?' },
      { id: 2, question: '¿En qué ciudad naciste?' },
      { id: 3, question: '¿Cuál es tu comida favorita?' }
    ];

    // Envía las preguntas de seguridad como respuesta al cliente
    res.json(securityQuestions);
  },
  resetPassword: async (req, res) => {
    try {
      const { email, newPassword, respuestaDeSeguridad, preguntaSeguridadElegida } = req.body;

      // Verificar si ya existe un usuario con el mismo correo electrónico// Verificar si ya existe un usuario con el mismo correo electrónico
      const usuarioExistente = await db.collection('Usuarios').where('email', '==', email).get();
      const usuarioId = usuarioExistente.docs[0].id
      console.log(usuarioId)
      if (usuarioExistente.empty) {
        return res.status(400).json({ error: 'No existe usuario con el email declarado.' });
      }

      const usuario = usuarioExistente.docs[0].data();
      // Aquí puedes continuar con la lógica para verificar la respuesta de seguridad
      // y actualizar la contraseña si corresponde
      const respuestaCorrecta = await bcrypt.compare(respuestaDeSeguridad, usuario.respuestaSeguridad)

      // Por ejemplo, podrías buscar el usuario por su correo electrónico y comprobar si la respuesta de seguridad es correcta
      if (!respuestaCorrecta || usuario.preguntaSeguridad !== preguntaSeguridadElegida) {
        return res.status(400).json({ error: 'La respuesta de seguridad es incorrecta.' });
      }

      // Cifra la nueva contraseña antes de actualizarla en la base de datos
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Actualiza la contraseña cifrada del usuario en la base de datos

      await db.collection('Usuarios').doc(usuarioId).update({ password: hashedPassword });

      // Envía una respuesta de éxito
      return res.status(200).json({ message: 'Contraseña restablecida correctamente.' });
    } catch (error) {
      console.error('Error al restablecer la contraseña:', error);
      return res.status(500).json({ error: 'Error interno del servidor.' });
    }



  }
}

function validarPassword(password) {
  // Al menos una letra mayúscula, una letra minúscula, un número y una longitud mínima de 10 caracteres
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return regex.test(password);
}

module.exports = loginController;
