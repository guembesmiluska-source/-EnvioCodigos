const fs = require('fs');
const { execSync } = require('child_process');

const archivoCSV = 'estudiantes.csv';
const archivoNuevos = 'nuevos_estudiantes.csv';

const commitAnterior = process.env.GIT_PREVIOUS_SUCCESSFUL_COMMIT;

// PRIMERA EJECUCIÓN DE JENKINS
// Se consideran nuevos TODOS los estudiantes que existen actualmente.
if (!commitAnterior) {
  console.log('Primera ejecucion de Jenkins.');
  console.log('Se enviaran correos a todos los estudiantes actuales.');

  const contenidoActual = fs.readFileSync(archivoCSV, 'utf-8');

  fs.writeFileSync(
    archivoNuevos,
    contenidoActual,
    'utf-8'
  );

  const lineas = contenidoActual
    .split(/\r?\n/)
    .filter(linea => linea.trim().length > 0);

  const cantidadEstudiantes = Math.max(lineas.length - 1, 0);

  console.log(
    `Se detectaron ${cantidadEstudiantes} estudiantes para el envio inicial.`
  );

  console.log(`Archivo generado: ${archivoNuevos}`);

  process.exit(0);
}

try {
  // Compara el estudiantes.csv actual con la versión de la ejecución anterior.
  const diff = execSync(
    `git diff --unified=0 ${commitAnterior} HEAD -- ${archivoCSV}`,
    { encoding: 'utf-8' }
  );

  // Obtiene únicamente las líneas nuevas del CSV.
  const lineasNuevas = diff
    .split(/\r?\n/)
    .filter(linea => linea.startsWith('+') && !linea.startsWith('+++'))
    .map(linea => linea.substring(1).trim())
    .filter(linea => linea.length > 0);

  // Si no hay estudiantes nuevos, genera un archivo
  // que contiene únicamente el encabezado.
  if (lineasNuevas.length === 0) {
    console.log('No se encontraron estudiantes nuevos.');

    const contenidoActual = fs.readFileSync(archivoCSV, 'utf-8');
    const encabezado = contenidoActual.split(/\r?\n/)[0];

    fs.writeFileSync(
      archivoNuevos,
      encabezado + '\n',
      'utf-8'
    );

    process.exit(0);
  }

  // Obtiene el encabezado del CSV actual.
  const contenidoActual = fs.readFileSync(archivoCSV, 'utf-8');
  const encabezado = contenidoActual.split(/\r?\n/)[0];

  // Crea nuevos_estudiantes.csv con únicamente los estudiantes nuevos.
  fs.writeFileSync(
    archivoNuevos,
    encabezado + '\n' + lineasNuevas.join('\n') + '\n',
    'utf-8'
  );

  console.log(
    `Se detectaron ${lineasNuevas.length} estudiantes nuevos.`
  );

  console.log(
    `Archivo generado: ${archivoNuevos}`
  );

} catch (error) {
  console.error('Error al detectar estudiantes nuevos.');
  console.error(error.message);
  process.exit(1);
}