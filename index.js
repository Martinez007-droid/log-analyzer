const leerLog = require('./lector-logs');
const analizarLinea = require('./analizador-logs');

const UMBRAL_SOSPECHOSO = 5; // más de 5 intentos fallidos = alerta

function contarIntentosPorIp(lineas) {
  const conteo = {}; // { ip: { fallidos: n, exitosos: n, usuarios: Set } }

  for (const linea of lineas) {
    const info = analizarLinea(linea);
    if (!info) continue; // línea que no coincidió con ningún patrón, la ignoramos

    if (!conteo[info.ip]) {
      conteo[info.ip] = { fallidos: 0, exitosos: 0, usuarios: new Set() };
    }

    if (info.resultado === 'FAILED') {
      conteo[info.ip].fallidos += 1;
    } else {
      conteo[info.ip].exitosos += 1;
    }

    conteo[info.ip].usuarios.add(info.usuario);
  }

  return conteo;
}

function mostrarReporte(conteo) {
  console.log('=== ANÁLISIS DE INTENTOS DE AUTENTICACIÓN ===\n');

  // Convertimos el objeto a un array para poder ordenarlo
  const ips = Object.entries(conteo).sort((a, b) => {
    const totalA = a[1].fallidos + a[1].exitosos;
    const totalB = b[1].fallidos + b[1].exitosos;
    return totalB - totalA; // de mayor a menor
  });

  for (const [ip, datos] of ips) {
    const total = datos.fallidos + datos.exitosos;
    const alerta = datos.fallidos > UMBRAL_SOSPECHOSO ? ' ⚠️  SOSPECHOSO (posible fuerza bruta)' : '';

    console.log(`${ip} → ${total} intentos (${datos.fallidos} fallidos, ${datos.exitosos} exitosos)${alerta}`);
    console.log(`   Usuarios probados: ${[...datos.usuarios].join(', ')}\n`);
  }
}

function main() {
  const lineas = leerLog('./auth-real.log');
  const conteo = contarIntentosPorIp(lineas);
  mostrarReporte(conteo);
}

main();