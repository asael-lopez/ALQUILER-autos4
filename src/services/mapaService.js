const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const SEARCH_INTERVAL_MS = 1100;
const searchCache = new Map();
let lastRequestAt = 0;

export async function geocodeAddress(address) {
    const query = address.trim();
    if (!query) {
        throw new Error('Escribe una dirección para iniciar la búsqueda.');
    }

    const cacheKey = query.toLocaleLowerCase('es');
    if (searchCache.has(cacheKey)) {
        return searchCache.get(cacheKey);
    }

    const waitMs = Math.max(0, SEARCH_INTERVAL_MS - (Date.now() - lastRequestAt));
    if (waitMs > 0) {
        await new Promise((resolve) => window.setTimeout(resolve, waitMs));
    }

    const params = new URLSearchParams({
        format: 'json',
        q: query,
        countrycodes: 'sv',
        limit: '1'
    });
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 12000);
    lastRequestAt = Date.now();

    try {
        const response = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
            headers: { 'Accept-Language': 'es' },
            signal: controller.signal
        });

        if (!response.ok) {
            throw new Error(`Nominatim respondió con estado ${response.status}.`);
        }

        const results = await response.json();
        if (!Array.isArray(results) || results.length === 0) {
            return null;
        }

        const latitude = Number(results[0].lat);
        const longitude = Number(results[0].lon);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            throw new Error('Nominatim devolvió coordenadas inválidas.');
        }

        const location = {
            lat: latitude,
            lon: longitude,
            displayName: results[0].display_name || query
        };
        searchCache.set(cacheKey, location);
        return location;
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error('La búsqueda tardó demasiado. Inténtalo de nuevo.', { cause: error });
        }
        if (error instanceof TypeError) {
            throw new Error('No se pudo conectar con Nominatim. Revisa tu conexión.', { cause: error });
        }
        throw error;
    } finally {
        window.clearTimeout(timeoutId);
    }
}

export function getDistanceKm(start, end) {
    const radians = (degrees) => (degrees * Math.PI) / 180;
    const earthRadiusKm = 6371;
    const latitudeDelta = radians(end[0] - start[0]);
    const longitudeDelta = radians(end[1] - start[1]);
    const value = Math.sin(latitudeDelta / 2) ** 2
        + Math.cos(radians(start[0]))
        * Math.cos(radians(end[0]))
        * Math.sin(longitudeDelta / 2) ** 2;

    return earthRadiusKm * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}
