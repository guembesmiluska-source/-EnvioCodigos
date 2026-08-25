const fs = require('fs');
const { execSync } = require('child_process');

const archivoCSV = 'estudiantes.csv';
const archivoNuevos = 'nuevos_estudiantes.csv';

const commitAnterior = process.env.GIT_PREVIOUS_SUCCESSFUL_COMMIT;

if (!commitAnterior) {
  console.error('No se encontro el commit anterior de Jenkins.');
  console.error('Se cancela el proceso para evitar envios duplicados.');
  process.exit(1);
}

try {
  const diff = execSync(
    `git diff --unified=0 ${commitAnterior} HEAD -- ${archivoCSV}`,
    { encoding: 'utf-8' }
  );

  const lineasNuevas = diff
    .split(/\r?\n/)
    .filter(linea => linea.startsWith('+') && !linea.startsWith('+++'))
    .map(linea => linea.substring(1).trim())
    .filter(linea => linea.length > 0);

  if (lineasNuevas.length === 0) {
    console.log('No se encontraron estudiantes nuevos.');
    process.exit(0);
  }

  const contenido = fs.readFileSync(archivoCSV, 'utf-8').trim();
  const encabezado = contenido.split(/\r?\n/)[0];

  const contenidoNuevos = [encabezado, ...lineasNuevas].join('\n');

  fs.writeFileSync(archivoNuevos, contenidoNuevos, 'utf-8');

  console.log(`Se identificaron ${lineasNuevas.length} estudiantes nuevos.`);
  console.log('Archivo creado: nuevos_estudiantes.csv');

  lineasNuevas.forEach(linea => {
    console.log(`Nuevo estudiante: ${linea}`);
  });

} catch (error) {
  console.error('Error al detectar estudiantes nuevos.');
  console.error(error.message);
  process.exit(1);
}