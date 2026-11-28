import { useCurrency } from '../context/useCurrency';
import { useApp } from '../context/useApp';
import { translateText } from '../i18n';

// Selector de moneda de referencia + estado de la API de tipo de cambio.
export function CurrencySelector() {
    const { currency, setCurrency, currencies, status, error, ratesDate, ratesStale, reload } = useCurrency();
    const { language } = useApp();

    let note = '';
    if (currency === 'USD') {
        note = 'Precios en USD (moneda oficial de El Salvador).';
    } else if (status === 'loading' && !ratesDate) {
        note = 'Consultando tipo de cambio...';
    } else if (ratesDate) {
        note = `Equivalencia referencial · tasas del ${ratesDate}${ratesStale ? ' (sin conexión, última guardada)' : ''}. Se cobra en USD.`;
    } else if (status === 'error') {
        note = error;
    }

    return (
        <div className="currency-selector" style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '16px',
            padding: '10px 12px',
            border: '1px solid #333',
            borderRadius: '8px',
            background: '#161616'
        }}>
            <label htmlFor="currency-select" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
                Ver precios en
            </label>
            <select
                id="currency-select"
                value={currency}
                onChange={(event) => setCurrency(event.target.value)}
                style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: '#1e1e1e',
                    color: '#ffffff',
                    border: '1px solid #333',
                    font: 'inherit'
                }}
            >
                {currencies.map((item) => (
                    <option key={item.code} value={item.code}>
                        {item.code} · {translateText(item.name, language)}
                    </option>
                ))}
            </select>
            <span role="status" aria-live="polite" style={{ fontSize: '0.78rem', color: status === 'error' && !ratesDate ? '#f87171' : '#a3a3a3' }}>
                {note}
            </span>
            {status === 'error' && (
                <button type="button" onClick={reload} style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid #444',
                    background: '#262626',
                    color: '#fff',
                    cursor: 'pointer',
                    font: 'inherit',
                    fontSize: '0.78rem'
                }}>
                    Reintentar
                </button>
            )}
        </div>
    );
}
