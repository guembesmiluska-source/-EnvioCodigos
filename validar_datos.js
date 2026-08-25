const fs = require('fs');
const path = require('path');

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

let errores = [];
const dnisVistos = new Set();
const codigosVistos = new Set();

filas.forEach((fila, index) => {
  const numFila = index + 2; // +2 porque la fila 1 del CSV es el encabezado

  if (!fila.nombre || !fila.dni || !fila.correo || !fila.codigo) {
    errores.push(`Fila ${numFila}: faltan datos (nombre, dni, correo o codigo vacio).`);
  }
  if (fila.dni && dnisVistos.has(fila.dni)) {
    errores.push(`Fila ${numFila}: DNI duplicado (${fila.dni}).`);
  }
  if (fila.codigo && codigosVistos.has(fila.codigo)) {
    errores.push(`Fila ${numFila}: Codigo de licencia duplicado (${fila.codigo}).`);
  }
  dnisVistos.add(fila.dni);
  codigosVistos.add(fila.codigo);
});

if (errores.length > 0) {
  console.error('--- Se encontraron errores en la base de datos ---');
  errores.forEach(e => console.error(e));
  process.exit(1); // Esto hace que el stage de Jenkins falle (queda en rojo)
} else {
  console.log(`Validacion exitosa: ${filas.length} estudiantes revisados.`);
  console.log('Sin campos vacios, sin DNI duplicados, sin codigos duplicados.');
  process.exit(0); // Todo bien, el stage pasa (queda en verde)
}
