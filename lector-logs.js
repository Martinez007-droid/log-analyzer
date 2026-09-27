const fs = require('fs');

function leerLog(rutaArchivo) {
  const contenido = fs.readFileSync(rutaArchivo, 'utf-8');
  const lineas = contenido.split('\n').filter(linea => linea.trim() !== '');
  return lineas;
}

module.exports = leerLog;