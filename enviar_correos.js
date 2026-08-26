const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

// Lee el archivo CSV con los datos de los nuevos estudiantes
const csvPath = path.join(__dirname, 'nuevos_estudiantes.csv');
const contenido = fs.readFileSync(csvPath, 'utf-8').trim();

if (!contenido) {
  console.log('No hay estudiantes para enviar.');
  process.exit(0);
}

const lineas = contenido.split(/\r?\n/);
const encabezado = lineas[0].split(',').map(h => h.trim().toLowerCase());

const filas = lineas.slice(1).map(linea => {
  const valores = linea.split(',').map(v => v.trim());
  const fila = {};

  encabezado.forEach((campo, i) => {
    fila[campo] = valores[i];
  });

  return fila;
});

// Archivo donde se registran los envíos realizados
const registroPath = path.join(__dirname, 'registro_envios.csv');

// Estas variables las llena Jenkins automáticamente
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

// Verifica si el estudiante ya recibió su correo anteriormente
function yaFueEnviado(fila) {
  if (!fs.existsSync(registroPath)) {
    return false;
  }

  const contenidoRegistro = fs.readFileSync(registroPath, 'utf-8').trim();

  if (!contenidoRegistro) {
    return false;
  }

  const lineasRegistro = contenidoRegistro.split(/\r?\n/);

  return lineasRegistro.slice(1).some(linea => {
    const valores = linea.split(',').map(v => v.trim());

    const correo = valores[1];
    const estado = valores[5];

    return correo === fila.correo && estado === 'ENVIADO';
  });
}

// Registra automáticamente un envío exitoso
function registrarEnvio(fila) {
  const fecha = new Date().toISOString();

  const registro = [
    fila.nombre,
    fila.correo,
    fila.codigo,
    fila.curso,
    fecha,
    'ENVIADO'
  ].join(',');

  fs.appendFileSync(
    registroPath,
    registro + '\n',
    'utf-8'
  );
}

async function enviarTodos() {
  let enviados = 0;

 for (const fila of filas) {
  if (yaFueEnviado(fila)) {
    console.log(
      `Correo omitido para ${fila.nombre} (${fila.correo}) - Ya fue enviado anteriormente.`
    );
    continue;
  }

  try {
      await transportador.sendMail({
        from: usuarioGmail,
        to: fila.correo,
        subject: obtenerAsunto(fila),
        text: armarCuerpo(fila),
      });

      // Solo se registra después de confirmar el envío.
      registrarEnvio(fila);

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