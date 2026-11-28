import { useWeatherForecast } from '../hooks/useWeatherForecast';
import { describeWeatherCode } from '../services/weatherService';
import { useApp } from '../context/useApp';

const formatShortDate = (isoDate, language) => {
    const [year, month, day] = isoDate.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString(language === 'en' ? 'en-US' : 'es-SV', { weekday: 'short', day: 'numeric', month: 'short' });
};

// Pronóstico del clima en la sucursal para las fechas de una reserva
// (API externa Open-Meteo). Se usa en el detalle de "Mis reservas".
export function WeatherForecast({ startDate, endDate }) {
    const { status, data, error } = useWeatherForecast(startDate, endDate);
    const { language } = useApp();

    return (
        <section className="weather-forecast" aria-label="Pronóstico del clima" style={{
            marginTop: '16px',
            padding: '12px',
            border: '1px solid #2a2a2a',
            borderRadius: '8px',
            background: '#181818'
        }}>
            <strong style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Clima en la sucursal durante tu alquiler</strong>
            {status === 'loading' && <p style={{ margin: 0, fontSize: '0.82rem', color: '#a3a3a3' }}>Consultando pronóstico...</p>}
            {status === 'error' && <p style={{ margin: 0, fontSize: '0.82rem', color: '#a3a3a3' }}>{error}</p>}
            {status === 'ready' && data && (
                <>
                    <ul style={{ display: 'flex', gap: '8px', margin: 0, padding: 0, listStyle: 'none', overflowX: 'auto' }}>
                        {data.days.map((day) => {
                            const info = describeWeatherCode(day.code);
                            return (
                                <li key={day.date} style={{ minWidth: '92px', padding: '8px', borderRadius: '6px', background: '#202020', textAlign: 'center', fontSize: '0.76rem' }}>
                                    <span style={{ display: 'block', color: '#a3a3a3' }}>{formatShortDate(day.date, language)}</span>
                                    <span style={{ display: 'block', fontSize: '1.3rem' }} aria-hidden="true">{info.icon}</span>
                                    <span style={{ display: 'block' }}>{info.label}</span>
                                    <strong>{day.tempMin}°–{day.tempMax}°C</strong>
                                    <span style={{ display: 'block', color: '#60a5fa' }}>Lluvia {day.rainChance}%</span>
                                </li>
                            );
                        })}
                    </ul>
                    {data.partial && (
                        <p style={{ margin: '8px 0 0', fontSize: '0.74rem', color: '#a3a3a3' }}>
                            Solo se muestran los días con pronóstico disponible (hasta 15 días adelante).
                        </p>
                    )}
                </>
            )}
        </section>
    );
}
