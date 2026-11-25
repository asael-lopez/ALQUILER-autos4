import { useContext } from 'react';
import { CurrencyContext } from './currencyStore';

export function useCurrency() {
    const context = useContext(CurrencyContext);
    if (!context) {
        throw new Error('useCurrency debe usarse dentro de <CurrencyProvider>.');
    }
    return context;
}
