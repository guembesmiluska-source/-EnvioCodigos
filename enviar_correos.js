const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

// Lee únicamente el archivo generado por detectar_nuevos.js
const csvPath = path.join(__dirname, 'nuevos_estudiantes.csv');

const contenido = fs.readFileSync(csvPath, 'utf-8').trim();

// Si el archivo solo contiene el encabezado,
// significa que no hay estudiantes nuevos.
const lineas = contenido ? contenido.split(/\r?\n/) : [];

if (lineas.length <= 1) {
  console.log('No hay estudiantes nuevos.');
  console.log('No se enviaran correos en esta ejecucion.');
  process.exit(0);
}

const encabezado = lineas[0]
  .split(',')
  .map(h => h.trim().toLowerCase());

const filas = lineas.slice(1).map(linea => {
  const valores = linea.split(',').map(v => v.trim());
  const fila = {};

  encabezado.forEach((campo, i) => {
    fila[campo] = valores[i];
  });

  return fila;
});

// Estas variables las llena Jenkins automaticamente
// mediante las credenciales configuradas en el Jenkinsfile.
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
  let nombreCurso;

  if (fila.curso === 'Excel') {
    nombreCurso = 'Microsoft Excel';
  } else if (fila.curso === 'PowerBI') {
    nombreCurso = 'Microsoft Power BI';
  } else {
    nombreCurso = 'Microsoft';
  }

  return `Hola ${fila.nombre},

Gracias por culminar el curso de ${nombreCurso} en nuestro programa de educación continua.

Tu código personal para rendir la evaluación de Microsoft es:

${fila.codigo}

Este código es personal e intransferible. No lo compartas con otros estudiantes.

Saludos,
Área de Certificaciones`;
}

function obtenerAsunto(fila) {
  if (fila.curso === 'Excel') {
    return 'Tu código para la evaluación de Microsoft Excel';
  }

  if (fila.curso === 'PowerBI') {
    return 'Tu código para la evaluación de Microsoft Power BI';
  }

  return 'Tu código para la evaluación de Microsoft';
}

async function enviarTodos() {
  let enviados = 0;

  for (const fila of filas) {
    try {
      await transportador.sendMail({
        from: usuarioGmail,
        to: fila.correo,
        subject: obtenerAsunto(fila),
        text: armarCuerpo(fila),
      });

      console.log(
        `Correo enviado a ${fila.nombre} (${fila.correo}) - Curso: ${fila.curso}`
      );

      enviados++;

    } catch (error) {
      console.error(
        `Error enviando a ${fila.correo}: ${error.message}`
      );

      process.exit(1);
    }
  }

  console.log(
    `Proceso completado: ${enviados} de ${filas.length} correos enviados.`
  );
}

enviarTodos();