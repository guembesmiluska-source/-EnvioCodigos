const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

// Lee el archivo CSV con los datos de los estudiantes
const csvPath = path.join(__dirname, 'estudiantes.csv');
const contenido = fs.readFileSync(csvPath, 'utf-8').trim();
const lineas = contenido.split(/\r?\n/);
const encabezado = lineas[0].split(',').map(h => h.trim().toLowerCase());

const filas = lineas.slice(1).map(linea => {
  const valores = linea.split(',').map(v => v.trim());
  const fila = {};
  encabezado.forEach((campo, i) => fila[campo] = valores[i]);
  return fila;
});

// Estas variables las llena Jenkins automaticamente si usas
// "credentials('gmail-smtp-cred')" en el Jenkinsfile (ver instrucciones).
// Si quieres probarlo primero desde tu propia PC (fuera de Jenkins),
// puedes reemplazar estas dos lineas directamente por tu correo y tu
// contrasena de aplicacion entre comillas, SOLO para la prueba local.
const usuarioGmail = process.env.GMAIL_CRED_USR;
const claveAppGmail = process.env.GMAIL_CRED_PSW;

const transportador = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: usuarioGmail,
    pass: claveAppGmail,
  },
});

function armarCuerpo(fila) {
  return `Hola ${fila.nombre},

Gracias por culminar el curso de Microsoft Excel en nuestro programa de educacion continua.

Tu codigo personal para rendir la evaluacion de certificacion Microsoft es:

${fila.codigo}

Este codigo es personal e intransferible. No lo compartas con otros estudiantes.

Saludos,
Area de Certificaciones`;
}

async function enviarTodos() {
  let enviados = 0;
  for (const fila of filas) {
    try {
      await transportador.sendMail({
        from: usuarioGmail,
        to: fila.correo,
        subject: 'Tu codigo de certificacion Microsoft Excel',
        text: armarCuerpo(fila),
      });
      console.log(`Correo enviado a ${fila.nombre} (${fila.correo})`);
      enviados++;
    } catch (error) {
      console.error(`Error enviando a ${fila.correo}: ${error.message}`);
      process.exit(1); // Detiene el proceso si un envio falla
    }
  }
  console.log(`Proceso completado: ${enviados} de ${filas.length} correos enviados.`);
}

enviarTodos();
