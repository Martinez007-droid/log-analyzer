// Regex para intentos FALLIDOS. Cubre dos formatos:
// "Failed password for root from 192.168.1.20 port 51234 ssh2"
// "Failed password for invalid user admin from 192.168.1.35 port 51235 ssh2"
const REGEX_FALLIDO = /Failed password for (invalid user )?(\S+) from (\S+) port (\d+)/;

// Regex para intentos EXITOSOS:
// "Accepted password for luis from 192.168.1.40 port 51240 ssh2"
const REGEX_EXITOSO = /Accepted password for (\S+) from (\S+) port (\d+)/;
function analizarLinea(linea) {
  const matchFallido = linea.match(REGEX_FALLIDO);
  if (matchFallido) {
    return {
      resultado: 'FAILED',
      usuario: matchFallido[2],
      ip: matchFallido[3],
      puerto: matchFallido[4],
    };
  }

  const matchExitoso = linea.match(REGEX_EXITOSO);
  if (matchExitoso) {
    return {
      resultado: 'SUCCESS',
      usuario: matchExitoso[1],
      ip: matchExitoso[2],
      puerto: matchExitoso[3],
    };
  }

  // La línea no coincide con ningún patrón conocido (ruido, otro tipo de evento, etc.)
  return null;
}

module.exports = analizarLinea;
