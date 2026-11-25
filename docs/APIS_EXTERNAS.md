# APIs externas integradas

Todas son gratuitas, **sin API key** y con CORS habilitado, por lo que funcionan igual en GitHub Pages, Netlify o Vercel.

| API | Para qué se usa | Dónde entra al flujo |
|---|---|---|
| **Frankfurter** (`api.frankfurter.dev`, tasas del BCE) | Equivalente de las tarifas en EUR, GBP, MXN y CAD para clientes extranjeros. El cobro sigue siendo en USD. | Catálogo (`Fleet` / `CarCard`), modal de reserva, PDF, mensaje de WhatsApp y detalle en "Mis reservas". |
| **Open-Meteo** (`api.open-meteo.com`) | Pronóstico del clima en la sucursal para las fechas de la reserva (hasta 15 días adelante). | Modal de reserva (se actualiza al cambiar fechas), PDF, WhatsApp y detalle en "Mis reservas". |
| **Nominatim / OpenStreetMap** (ya existente) | Geocodifica la dirección del cliente y calcula la distancia a la sucursal. | Mapa de sucursales → la distancia se guarda en la reserva. |

## Arquitectura

- `src/services/exchangeService.js` y `src/services/weatherService.js`: llamadas a la API, caché (6 h para tipo de cambio), timeout, validación y errores legibles.
- `src/context/CurrencyContext.jsx` (+ `useCurrency.js`): carga las tasas una vez y las comparte con toda la app; guarda la moneda elegida.
- `src/hooks/useWeatherForecast.js` y `src/components/WeatherForecast.jsx`: pronóstico en "Mis reservas".
- `src/components/CurrencySelector.jsx`: selector de moneda en el catálogo.
- `src/data/branches.js`: coordenadas de la sucursal, compartidas por el mapa, la distancia y el clima.

## Datos que ahora guarda cada reserva

`monedaReferencia`, `tasaCambio`, `totalReferencia`, `fechaTasaCambio`, `climaEstimado`, `distanciaSucursalKm`.
Estos campos pueden usarse en el módulo de reportes.

## Manejo de fallos

Si una API no responde, la reserva sigue funcionando en USD: se usa la última tasa guardada (marcada como "sin conexión") o simplemente no se muestra el equivalente/clima.
