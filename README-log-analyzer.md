# Log Analyzer

Herramienta de línea de comandos escrita en Node.js que analiza archivos de logs de autenticación SSH (formato `auth.log` / `journalctl -u ssh`) y detecta patrones sospechosos, como posibles ataques de fuerza bruta o de diccionario.

## ¿Qué hace?

- Lee un archivo de log línea por línea
- Extrae, con expresiones regulares, la IP de origen, el usuario y el resultado (éxito o fallo) de cada intento de autenticación
- Agrupa los intentos por IP y cuenta cuántos fueron fallidos y cuántos exitosos
- Marca como **sospechosas** las IPs que superan un umbral configurable de intentos fallidos
- Muestra un reporte ordenado (de más a menos intentos) en la consola
- Exporta el reporte completo a un archivo `reporte.json`

## Ejemplo de uso

```bash
node index.js
```

Salida en consola:

```
=== ANÁLISIS DE INTENTOS DE AUTENTICACIÓN ===

192.168.1.35 → 11 intentos (11 fallidos, 0 exitosos) ⚠️  SOSPECHOSO (posible fuerza bruta)
   Usuarios probados: admin, test, oracle, postgres

192.168.1.20 → 10 intentos (10 fallidos, 0 exitosos) ⚠️  SOSPECHOSO (posible fuerza bruta)
   Usuarios probados: root

192.168.1.40 → 3 intentos (0 fallidos, 3 exitosos)
   Usuarios probados: luis

Reporte exportado a: ./reporte.json
```

El archivo `reporte.json` generado tiene esta forma:

```json
{
  "fechaAnalisis": "2026-09-27T18:32:10.123Z",
  "umbralSospechoso": 5,
  "totalIps": 4,
  "ipsSospechosas": 2,
  "detalle": [
    {
      "ip": "192.168.1.35",
      "total": 11,
      "fallidos": 11,
      "exitosos": 0,
      "sospechoso": true,
      "usuariosProbados": ["admin", "test", "oracle", "postgres"]
    }
  ]
}
```

## Archivos de prueba incluidos

- `auth-ejemplo.log`: log sintético que simula un ataque de fuerza bruta (mismo usuario, muchos intentos) y uno de diccionario (varios usuarios distintos desde la misma IP).
- `auth-real.log`: extracto real de `journalctl -u ssh` generado intencionalmente en una máquina virtual de Kali Linux, provocando intentos fallidos de login para validar que el analizador funciona contra el formato real de logs de Linux, no solo contra datos de ejemplo.

Para cambiar qué archivo se analiza, edita la ruta en la función `main()` dentro de `index.js`.

## Cómo funciona internamente

- **Lectura del archivo** (`lector-logs.js`): usa `fs.readFileSync` para leer el log completo y separarlo en líneas, descartando las vacías.
- **Parseo con regex** (`analizador-logs.js`): dos expresiones regulares cubren los intentos fallidos (`Failed password...`) y exitosos (`Accepted password...`), incluyendo el caso de `invalid user`. La IP se captura con `(\S+)` en lugar de un patrón estricto de IPv4, porque los logs reales de Linux también registran conexiones locales en formato IPv6 (`::1`), y un patrón demasiado específico las habría ignorado silenciosamente.
- **Conteo y agregación** (`index.js`): se usa un objeto como diccionario `{ ip: datos }` y un `Set` para llevar registro de los usuarios distintos probados por cada IP sin duplicados — esto ayuda a distinguir un ataque de fuerza bruta (mismo usuario, muchos intentos) de uno de diccionario (muchos usuarios distintos).
- **Exportación** (`index.js`): el reporte se serializa con `JSON.stringify` incluyendo metadatos (fecha del análisis, umbral usado, totales), pensado para que el archivo resultante pueda ser consumido por otra herramienta o integrado en un pipeline de monitoreo más grande.

## Por qué lo hice así

Quería ir más allá de probar el analizador solo con datos inventados por mí. Por eso generé tráfico SSH real en una máquina Kali (intentos de login fallidos contra distintos usuarios) y usé esos logs reales para validar el parser. Esto reveló una diferencia real entre el formato "de libro" y el formato real de logs modernos de Linux (uso de `sshd-session` en vez de `sshd`, y direcciones en formato IPv6 para conexiones locales), lo cual ajustó cómo escribí las expresiones regulares para que fueran más robustas.

## Requisitos

- Node.js 14+

## Instalación

```bash
git clone <tu-url-del-repo>
cd log-analyzer
node index.js
```

## Próximas mejoras posibles

- Leer el umbral de sospecha y la ruta del archivo como argumentos de línea de comandos
- Agregar detección de intentos distribuidos en el tiempo (varias IPs, mismo patrón, ventana de tiempo corta)
- Soportar lectura en tiempo real de logs (tail -f) en vez de solo archivos estáticos
