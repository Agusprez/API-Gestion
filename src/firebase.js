require('dotenv').config()

const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore')


initializeApp({
  credential: applicationDefault()
});

const db = getFirestore();
const admin = require('firebase-admin');
const timestampService = admin.firestore.Timestamp; // Obtenemos el servicio de Timestamp


module.exports = {
  db,
  timestampService
}