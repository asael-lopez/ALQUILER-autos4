import { useEffect, useState } from 'react';
import { fetchWeatherForRange } from '../services/weatherService';

// Consulta el clima de la sucursal para un rango de fechas.
// Devuelve { status: 'idle'|'loading'|'ready'|'error', data, error }.
export function useWeatherForecast(startDate, endDate) {
    const [state, setState] = useState({ key: '', status: 'idle', data: null, error: '' });
    const key = startDate && endDate ? `${startDate}|${endDate}` : '';

    useEffect(() => {
        if (!key) return undefined;
        let cancelled = false;
        fetchWeatherForRange(startDate, endDate)
            .then((data) => {
                if (!cancelled) setState({ key, status: 'ready', data, error: '' });
            })
            .catch((error) => {
                if (!cancelled) setState({ key, status: 'error', data: null, error: error.message });
            });
        return () => {
            cancelled = true;
        };
    }, [key, startDate, endDate]);

    // Si las fechas cambiaron y la respuesta aún no llega, se considera "cargando".
    if (!key) return { status: 'idle', data: null, error: '' };
    if (state.key !== key) return { status: 'loading', data: null, error: '' };
    return state;
}
