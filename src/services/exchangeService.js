// ========================================================
// exchangeService.js — API externa: tipo de cambio (Frankfurter)
// --------------------------------------------------------
// Las tarifas del negocio están en USD (moneda oficial de El Salvador).
// Para clientes extranjeros se muestra el equivalente en otras monedas
// usando las tasas diarias publicadas por el Banco Central Europeo.
// Docs: https://frankfurter.dev  (sin API key, con CORS habilitado)
// ========================================================

const API_URL = 'https://api.frankfurter.dev/v1/latest';
const CACHE_KEY = 'santa_lucia_fx_rates';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // las tasas cambian una vez al día
const TIMEOUT_MS = 10000;

export const BASE_CURRENCY = 'USD';

export const SUPPORTED_CURRENCIES = [
    { code: 'USD', symbol: '$', name: 'Dólar estadounidense' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'Libra esterlina' },
    { code: 'MXN', symbol: 'MX$', name: 'Peso mexicano' },
    { code: 'CAD', symbol: 'CA$', name: 'Dólar canadiense' }
];

const FOREIGN_CODES = SUPPORTED_CURRENCIES
    .filter((currency) => currency.code !== BASE_CURRENCY)
    .map((currency) => currency.code);

export function getCurrencyInfo(code) {
    return SUPPORTED_CURRENCIES.find((currency) => currency.code === code)
        || SUPPORTED_CURRENCIES[0];
}

// Lee las tasas guardadas. Devuelve null si no hay o están corruptas.
export function readCachedRates() {
    try {
        const raw = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
        if (!raw || typeof raw.rates !== 'object' || !raw.fetchedAt) return null;
        return raw;
    } catch {
        return null;
    }
}

function isFresh(cached) {
    return Boolean(cached) && Date.now() - cached.fetchedAt < CACHE_TTL_MS;
}

// Pide las tasas a la API (USD → EUR, GBP, MXN, CAD).
// - Usa caché de 6 h para no repetir llamadas.
// - Si la red falla pero hay tasas viejas, las devuelve marcadas como `stale`.
// - Si no hay nada, lanza un error con mensaje legible.
export async function fetchRates({ force = false } = {}) {
    const cached = readCachedRates();
    if (!force && isFresh(cached)) return { ...cached, stale: false };

    const params = new URLSearchParams({
        base: BASE_CURRENCY,
        symbols: FOREIGN_CODES.join(',')
    });
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const response = await fetch(`${API_URL}?${params.toString()}`, {
            signal: controller.signal
        });
        if (!response.ok) {
            throw new Error(`El servicio de tipo de cambio respondió con estado ${response.status}.`);
        }

        const data = await response.json();
        const rates = { [BASE_CURRENCY]: 1 };
        FOREIGN_CODES.forEach((code) => {
            const value = Number(data?.rates?.[code]);
            if (Number.isFinite(value) && value > 0) rates[code] = value;
        });
        if (Object.keys(rates).length < 2) {
            throw new Error('El servicio de tipo de cambio devolvió datos incompletos.');
        }

        const result = {
            base: BASE_CURRENCY,
            rates,
            date: data?.date || new Date().toISOString().slice(0, 10),
            fetchedAt: Date.now()
        };
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(result));
        } catch {
            // Si el almacenamiento está lleno, la app sigue funcionando sin caché.
        }
        return { ...result, stale: false };
    } catch (error) {
        if (cached) return { ...cached, stale: true };
        if (error.name === 'AbortError') {
            throw new Error('El tipo de cambio tardó demasiado en responder.', { cause: error });
        }
        if (error instanceof TypeError) {
            throw new Error('No se pudo conectar con el servicio de tipo de cambio.', { cause: error });
        }
        throw error;
    } finally {
        window.clearTimeout(timeoutId);
    }
}

// Convierte un monto en USD a la moneda indicada. Devuelve null si no hay tasa.
export function convertFromUSD(amountUSD, currency, rates) {
    const amount = Number(amountUSD);
    if (!Number.isFinite(amount)) return null;
    if (currency === BASE_CURRENCY) return amount;
    const rate = rates?.[currency];
    return Number.isFinite(rate) ? amount * rate : null;
}

export function formatMoney(amount, currency) {
    if (amount === null || amount === undefined || !Number.isFinite(Number(amount))) return '—';
    try {
        return new Intl.NumberFormat('es-SV', {
            style: 'currency',
            currency,
            currencyDisplay: 'code',
            maximumFractionDigits: 2
        }).format(amount).replace(/\u00a0/g, ' ');
    } catch {
        return `${Number(amount).toFixed(2)} ${currency}`;
    }
}
