import { useApp } from '../context/useApp';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { LockKeyhole } from 'lucide-react';
import { SectionTitle } from '../components/SectionTitle';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export const Reports = () => {
    const { role, reservations, language } = useApp();

    // Restricción de acceso para ROL: CLIENTE
    if (role !== 'ADMIN') {
        return (
            <div style={{ maxWidth: '800px', margin: '60px auto', padding: '40px 24px', textAlign: 'center' }}>
                <div style={{ background: '#121212', border: '1px solid #262626', borderRadius: '12px', padding: '48px 24px' }}>
                    <div style={{ marginBottom: '16px', color: '#dc2626' }}>
                        <LockKeyhole size={42} aria-hidden="true" />
                    </div>
                    <h2 style={{ color: '#ffffff', fontSize: '1.8rem', fontWeight: 'bold', margin: '0 0 12px 0' }}>
                        Acceso Restringido
                    </h2>
                    <p style={{ color: '#a3a3a3', fontSize: '1rem', lineHeight: '1.6', maxWidth: '500px', margin: '0 auto 24px auto' }}>
                        El módulo de reportes financieros y estadísticas de rendimiento solo está disponible para usuarios con perfil de <strong>Administrador</strong>.
                    </p>
                    <span style={{
                        background: '#2563eb',
                        color: '#ffffff',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        display: 'inline-block'
                    }}>
            Tu rol actual: CLIENTE
          </span>
                </div>
            </div>
        );
    }

    const months = language === 'en'
        ? ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
        : ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    // Agrupar reservas e ingresos de forma segura sin NaN
    const monthlyData = months.map((monthName, index) => {
        const monthReservations = reservations.filter((r) => {
            const dateObj = new Date(r.date || r.fechaInicio);
            return !isNaN(dateObj.getTime()) && dateObj.getMonth() === index;
        });

        const count = monthReservations.length;

        const income = monthReservations.reduce((acc, curr) => {
            const val = parseFloat(curr.total ?? curr.monto ?? 0);
            return acc + (isNaN(val) ? 0 : val);
        }, 0);

        return { month: monthName, count, income };
    });

    const chartData = {
        labels: months,
        datasets: [
            {
                label: language === 'en' ? 'Monthly revenue ($)' : 'Ingresos Mensuales ($)',
                data: monthlyData.map((m) => m.income),
                backgroundColor: '#dc2626',
                borderRadius: 4
            },
            {
                label: language === 'en' ? 'Number of reservations' : 'Número de Reservas',
                data: monthlyData.map((m) => m.count),
                backgroundColor: '#2563eb',
                borderRadius: 4
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'top', labels: { color: '#ffffff' } },
            title: {
                display: true,
                text: language === 'en' ? 'Monthly fleet performance (2026)' : 'Rendimiento Mensual de Flota (2026)',
                color: '#ffffff',
                font: { size: 16 }
            }
        },
        scales: {
            x: { ticks: { color: '#a3a3a3' }, grid: { color: '#222' } },
            y: { ticks: { color: '#a3a3a3' }, grid: { color: '#222' } }
        }
    };

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px', fontFamily: 'system-ui, sans-serif' }}>
            <SectionTitle as="h1" style={{ fontSize: '2rem', color: '#ffffff', marginBottom: '8px' }}>
                Módulo de Reportes Analíticos por Mes
            </SectionTitle>
            <p style={{ color: '#a3a3a3', marginBottom: '24px' }}>
                Desglose dinámico de facturación, volumen de reservas y comportamiento de flota por cada mes del año.
            </p>

            {/* Gráfico Mensual */}
            <div style={{ background: '#121212', border: '1px solid #262626', borderRadius: '8px', padding: '24px', marginBottom: '32px' }}>
                <Bar data={chartData} options={chartOptions} />
            </div>

            {/* Tabla Desglosada por Mes */}
            <div style={{ background: '#121212', border: '1px solid #262626', borderRadius: '8px', padding: '20px' }}>
                <h3 style={{ margin: '0 0 16px 0', color: '#ffffff' }}>Desglose Detallado por Mes</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                    <tr style={{ borderBottom: '1px solid #333', color: '#a3a3a3', textAlign: 'left' }}>
                        <th style={{ padding: '12px' }}>Mes</th>
                        <th style={{ padding: '12px' }}>Reservas Concretadas</th>
                        <th style={{ padding: '12px' }}>Ingresos Totales ($)</th>
                        <th style={{ padding: '12px' }}>Promedio por Reserva</th>
                    </tr>
                    </thead>
                    <tbody>
                    {monthlyData.map((m, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #1a1a1a' }}>
                            <td style={{ padding: '12px', fontWeight: 'bold', color: '#ffffff' }}>{m.month}</td>
                            <td style={{ padding: '12px' }}>{m.count} reservas</td>
                            <td style={{ padding: '12px', color: '#4ade80', fontWeight: 'bold' }}>
                                ${m.income.toFixed(2)}
                            </td>
                            <td style={{ padding: '12px', color: '#a3a3a3' }}>
                                ${m.count > 0 ? (m.income / m.count).toFixed(2) : '0.00'}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
