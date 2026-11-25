// ========================================================
// weatherService.js — API externa: pronóstico del clima (Open-Meteo)
// --------------------------------------------------------
// Muestra el clima esperado en la sucursal para las fechas de la
// reserva, así el cliente decide mejor (por ejemplo, si lleva GPS,
// seguro o planea viaje en época de lluvia).
// Docs: https://open-meteo.com/en/docs  (sin API key, con CORS habilitado)
// El pronóstico cubre como máximo ~16 días hacia adelante.
// ========================================================

import { MAIN_BRANCH } from '../data/branches';

const API_URL = 'https://api.open-meteo.com/v1/forecast';
const TIMEOUT_MS = 10000;
const MAX_FORECAST_DAYS = 15;
const DAY_MS = 24 * 60 * 60 * 1000;
const cache = new Map();

// Códigos WMO que devuelve Open-Meteo → texto en español.
const WEATHER_CODES = [
    { max: 0, label: 'Despejado', icon: '☀️' },
    { max: 2, label: 'Parcialmente nublado', icon: '⛅' },
    { max: 3, label: 'Nublado', icon: '☁️' },
    { max: 48, label: 'Neblina', icon: '🌫️' },
    { max: 57, label: 'Llovizna', icon: '🌦️' },
    { max: 67, label: 'Lluvia', icon: '🌧️' },
    { max: 77, label: 'Nieve', icon: '❄️' },
    { max: 82, label: 'Chubascos', icon: '🌧️' },
    { max: 99, label: 'Tormenta eléctrica', icon: '⛈️' }
];

export function describeWeatherCode(code) {
    const value = Number(code);
    return WEATHER_CODES.find((item) => value <= item.max) || { label: 'Sin datos', icon: '' };
}

function toLocalISODate(date) {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
}

// Pronóstico diario entre dos fechas (YYYY-MM-DD) para una sucursal.
// Devuelve { days: [...], summary } o lanza Error con mensaje legible.
export async function fetchWeatherForRange(startDate, endDate, branch = MAIN_BRANCH) {
    if (!startDate || !endDate) throw new Error('Selecciona las fechas para ver el clima.');
    if (endDate <= startDate) throw new Error('La devolución debe ser posterior a la recogida.');

    const today = toLocalISODate(new Date());
    const limit = toLocalISODate(new Date(Date.now() + MAX_FORECAST_DAYS * DAY_MS));
    const from = startDate < today ? today : startDate;
    const to = endDate > limit ? limit : endDate;

    if (from > limit) {
        throw new Error('El pronóstico estará disponible 15 días antes de la recogida.');
    }
    if (to < today || to < from) {
        throw new Error('Las fechas elegidas ya pasaron.');
    }

    const cacheKey = `${branch.id}|${from}|${to}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);

    const params = new URLSearchParams({
        latitude: String(branch.latitude),
        longitude: String(branch.longitude),
        daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
        timezone: 'America/El_Salvador',
        start_date: from,
        end_date: to
    });
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const response = await fetch(`${API_URL}?${params.toString()}`, { signal: controller.signal });
        if (!response.ok) {
            throw new Error(`El servicio de clima respondió con estado ${response.status}.`);
        }

        const data = await response.json();
        const daily = data?.daily;
        if (!daily || !Array.isArray(daily.time) || daily.time.length === 0) {
            throw new Error('El servicio de clima no devolvió datos para esas fechas.');
        }

        const days = daily.time.map((date, index) => ({
            date,
            code: daily.weather_code?.[index],
            tempMax: Math.round(daily.temperature_2m_max?.[index]),
            tempMin: Math.round(daily.temperature_2m_min?.[index]),
            rainChance: Math.round(daily.precipitation_probability_max?.[index] ?? 0)
        }));

        const worst = days.reduce((a, b) => (b.code > a.code ? b : a), days[0]);
        const result = {
            days,
            partial: to !== endDate || from !== startDate,
            summary: {
                label: describeWeatherCode(worst.code).label,
                icon: describeWeatherCode(worst.code).icon,
                tempMin: Math.min(...days.map((day) => day.tempMin)),
                tempMax: Math.max(...days.map((day) => day.tempMax)),
                rainChance: Math.max(...days.map((day) => day.rainChance))
            }
        };
        cache.set(cacheKey, result);
        return result;
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error('El clima tardó demasiado en responder.', { cause: error });
        }
        if (error instanceof TypeError) {
            throw new Error('No se pudo conectar con el servicio de clima.', { cause: error });
        }
        throw error;
    } finally {
        window.clearTimeout(timeoutId);
    }
}

// Texto corto para guardar en la reserva / mostrar en PDF y WhatsApp.
export function formatWeatherSummary(weather) {
    if (!weather?.summary) return '';
    const { label, tempMin, tempMax, rainChance } = weather.summary;
    return `${label}, ${tempMin}-${tempMax} °C, lluvia hasta ${rainChance}%`;
}
