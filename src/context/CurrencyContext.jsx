import { useCallback, useEffect, useMemo, useState } from 'react';
import { CurrencyContext } from './currencyStore';
import {
    BASE_CURRENCY,
    SUPPORTED_CURRENCIES,
    convertFromUSD,
    fetchRates,
    formatMoney,
    readCachedRates
} from '../services/exchangeService';

const CURRENCY_KEY = 'santa_lucia_currency';

function loadPreferredCurrency() {
    const saved = localStorage.getItem(CURRENCY_KEY);
    return SUPPORTED_CURRENCIES.some((currency) => currency.code === saved) ? saved : BASE_CURRENCY;
}

// Proveedor global del tipo de cambio (API externa Frankfurter).
// Carga las tasas una vez al iniciar y las comparte con Fleet, CarCard,
// reservas y el resto de módulos que necesiten mostrar otra moneda.
export function CurrencyProvider({ children }) {
    const [currency, setCurrencyState] = useState(loadPreferredCurrency);
    const [ratesData, setRatesData] = useState(() => {
        const cached = readCachedRates();
        return cached ? { ...cached, stale: true } : null;
    });
    const [status, setStatus] = useState('loading'); // loading | ready | error
    const [error, setError] = useState('');

    const loadRates = useCallback(async (force = false) => {
        try {
            const data = await fetchRates({ force });
            setRatesData(data);
            setError('');
            setStatus('ready');
        } catch (requestError) {
            setError(requestError.message);
            setStatus('error');
        }
    }, []);

    // Carga inicial: el estado se actualiza dentro de los callbacks de la promesa,
    // no de forma síncrona en el efecto.
    useEffect(() => {
        let cancelled = false;
        fetchRates()
            .then((data) => {
                if (cancelled) return;
                setRatesData(data);
                setError('');
                setStatus('ready');
            })
            .catch((requestError) => {
                if (cancelled) return;
                setError(requestError.message);
                setStatus('error');
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const setCurrency = useCallback((code) => {
        if (!SUPPORTED_CURRENCIES.some((item) => item.code === code)) return;
        setCurrencyState(code);
        localStorage.setItem(CURRENCY_KEY, code);
    }, []);

    const value = useMemo(() => {
        const rates = ratesData?.rates || { [BASE_CURRENCY]: 1 };
        return {
            currency,
            setCurrency,
            currencies: SUPPORTED_CURRENCIES,
            rates,
            ratesDate: ratesData?.date || null,
            ratesStale: Boolean(ratesData?.stale),
            status,
            error,
            reload: () => {
                setStatus('loading');
                return loadRates(true);
            },
            // Convierte USD → moneda elegida (o la indicada). null si no hay tasa.
            convert: (amountUSD, target = currency) => convertFromUSD(amountUSD, target, rates),
            // Texto "≈ 35.12 EUR" o '' cuando la moneda es USD / aún no hay tasa.
            formatEquivalent: (amountUSD, target = currency) => {
                if (target === BASE_CURRENCY) return '';
                const converted = convertFromUSD(amountUSD, target, rates);
                return converted === null ? '' : `≈ ${formatMoney(converted, target)}`;
            }
        };
    }, [currency, setCurrency, ratesData, status, error, loadRates]);

    return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}
