import { useMemo, useState } from 'react';
import { useApp } from '../context/useApp';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { LockKeyhole } from 'lucide-react';
import { SectionTitle } from '../components/SectionTitle';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const parseSafeDate = (rawDate) => {
    if (!rawDate) return null;
    if (typeof rawDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawDate.trim())) {
        const [y, m, d] = rawDate.trim().split('-').map(Number);
        const localDate = new Date(y, m - 1, d);
        return isNaN(localDate.getTime()) ? null : localDate;
    }
    const parsed = new Date(rawDate);
    return isNaN(parsed.getTime()) ? null : parsed;
};

export const Reports = () => {
    const { role, reservations, language } = useApp();
    const isEn = language === 'en';
    const currentYear = new Date().getFullYear();

    const availableYears = useMemo(() => {
        const years = new Set([currentYear]);
        (reservations || []).forEach((r) => {
            const dt = parseSafeDate(r?.date || r?.fechaInicio || r?.createdAt);
            if (dt) years.add(dt.getFullYear());
        });
        return Array.from(years).sort((a, b) => b - a);
    }, [reservations, currentYear]);

    const [selectedYear, setSelectedYear] = useState(currentYear);

    const months = useMemo(
        () =>
            isEn
                ? ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
                : ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
        [isEn]
    );

    const monthlyData = useMemo(() => {
        return months.map((monthName, monthIndex) => {
            const monthReservations = (reservations || []).filter((r) => {
                const dateObj = parseSafeDate(r?.date || r?.fechaInicio || r?.createdAt);
                return (
                    dateObj &&
                    dateObj.getFullYear() === Number(selectedYear) &&
                    dateObj.getMonth() === monthIndex
                );
            });

            const count = monthReservations.length;
            const income = monthReservations.reduce((acc, curr) => {
                const rawVal = curr?.total ?? curr?.monto ?? curr?.price ?? 0;
                const val = Number(rawVal);
                return acc + (Number.isFinite(val) ? val : 0);
            }, 0);

            return { month: monthName, count, income };
        });
    }, [months, reservations, selectedYear]);

    const totals = useMemo(() => {
        const totalReservations = monthlyData.reduce((acc, m) => acc + m.count, 0);
        const totalIncome = monthlyData.reduce((acc, m) => acc + m.income, 0);
        const avgTicket = totalReservations > 0 ? totalIncome / totalReservations : 0;
        return { totalReservations, totalIncome, avgTicket };
    }, [monthlyData]);

    if (role !== 'ADMIN') {
        return (
            <div style={{ maxWidth: '800px', margin: '60px auto', padding: '40px 24px', textAlign: 'center' }}>
                <div style={{ background: '#121212', border: '1px solid #262626', borderRadius: '12px', padding: '48px 24px' }}>
                    <div style={{ marginBottom: '16px', color: '#dc2626', display: 'flex', justifyContent: 'center' }}>
                        <LockKeyhole size={42} aria-hidden="true" />
                    </div>
                    <h2 style={{ color: '#ffffff', fontSize: '1.8rem', fontWeight: 'bold', margin: '0 0 12px 0' }}>
                        {isEn ? 'Restricted Access' : 'Acceso Restringido'}
                    </h2>
                    <p style={{ color: '#a3a3a3', fontSize: '1rem', lineHeight: '1.6', maxWidth: '500px', margin: '0 auto 24px auto' }}>
                        {isEn
                            ? 'Financial reports and fleet performance analytics are only available to Administrator accounts.'
                            : 'El módulo de reportes financieros y estadísticas de rendimiento solo está disponible para usuarios con perfil de Administrador.'}
                    </p>
                    <span
                        style={{
                            background: '#2563eb',
                            color: '#ffffff',
                            padding: '6px 14px',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                            display: 'inline-block'
                        }}
                    >
                        {isEn ? 'Current role: CLIENT' : 'Tu rol actual: CLIENTE'}
                    </span>
                </div>
            </div>
        );
    }

    const chartData = {
        labels: months,
        datasets: [
            {
                label: isEn ? 'Monthly revenue ($)' : 'Ingresos Mensuales ($)',
                data: monthlyData.map((m) => m.income),
                backgroundColor: '#dc2626',
                borderRadius: 4
            },
            {
                label: isEn ? 'Number of reservations' : 'Número de Reservas',
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
                text: isEn
                    ? `Monthly fleet performance (${selectedYear})`
                    : `Rendimiento Mensual de Flota (${selectedYear})`,
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
            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '16px',
                    marginBottom: '24px'
                }}
            >
                <div>
                    <SectionTitle as="h1" style={{ fontSize: '2rem', color: '#ffffff', marginBottom: '6px' }}>
                        {isEn ? 'Monthly Analytical Reports Module' : 'Módulo de Reportes Analíticos por Mes'}
                    </SectionTitle>
                    <p style={{ color: '#a3a3a3', margin: 0 }}>
                        {isEn
                            ? 'Dynamic breakdown of revenue, reservation volume, and fleet behavior by month.'
                            : 'Desglose dinámico de facturación, volumen de reservas y comportamiento de flota por cada mes del año.'}
                    </p>
                </div>

                <label style={{ color: '#d4d4d4', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{isEn ? 'Year:' : 'Año:'}</span>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        style={{
                            background: '#121212',
                            color: '#ffffff',
                            border: '1px solid #333',
                            borderRadius: '6px',
                            padding: '8px 12px'
                        }}
                    >
                        {availableYears.map((yr) => (
                            <option key={yr} value={yr}>
                                {yr}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            {/* Resumen KPI */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '16px',
                    marginBottom: '24px'
                }}
            >
                <div style={{ background: '#121212', border: '1px solid #262626', borderRadius: '8px', padding: '18px' }}>
                    <div style={{ color: '#a3a3a3', fontSize: '0.85rem' }}>
                        {isEn ? 'Total Revenue' : 'Ingresos Totales'} ({selectedYear})
                    </div>
                    <div style={{ color: '#4ade80', fontSize: '1.6rem', fontWeight: 'bold', marginTop: '6px' }}>
                        ${totals.totalIncome.toFixed(2)}
                    </div>
                </div>
                <div style={{ background: '#121212', border: '1px solid #262626', borderRadius: '8px', padding: '18px' }}>
                    <div style={{ color: '#a3a3a3', fontSize: '0.85rem' }}>
                        {isEn ? 'Total Reservations' : 'Total de Reservas'} ({selectedYear})
                    </div>
                    <div style={{ color: '#ffffff', fontSize: '1.6rem', fontWeight: 'bold', marginTop: '6px' }}>
                        {totals.totalReservations}
                    </div>
                </div>
                <div style={{ background: '#121212', border: '1px solid #262626', borderRadius: '8px', padding: '18px' }}>
                    <div style={{ color: '#a3a3a3', fontSize: '0.85rem' }}>
                        {isEn ? 'Average per Reservation' : 'Promedio por Reserva'}
                    </div>
                    <div style={{ color: '#60a5fa', fontSize: '1.6rem', fontWeight: 'bold', marginTop: '6px' }}>
                        ${totals.avgTicket.toFixed(2)}
                    </div>
                </div>
            </div>

            {/* Gráfico Mensual */}
            <div style={{ background: '#121212', border: '1px solid #262626', borderRadius: '8px', padding: '24px', marginBottom: '32px' }}>
                <Bar data={chartData} options={chartOptions} />
            </div>

            {/* Tabla Desglosada por Mes */}
            <div style={{ background: '#121212', border: '1px solid #262626', borderRadius: '8px', padding: '20px', overflowX: 'auto' }}>
                <h3 style={{ margin: '0 0 16px 0', color: '#ffffff' }}>
                    {isEn ? 'Detailed Monthly Breakdown' : 'Desglose Detallado por Mes'}
                </h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #333', color: '#a3a3a3', textAlign: 'left' }}>
                            <th style={{ padding: '12px' }}>{isEn ? 'Month' : 'Mes'}</th>
                            <th style={{ padding: '12px' }}>{isEn ? 'Reservations' : 'Reservas Concretadas'}</th>
                            <th style={{ padding: '12px' }}>{isEn ? 'Total Revenue ($)' : 'Ingresos Totales ($)'}</th>
                            <th style={{ padding: '12px' }}>{isEn ? 'Average per Reservation' : 'Promedio por Reserva'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {monthlyData.map((m, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #1a1a1a' }}>
                                <td style={{ padding: '12px', fontWeight: 'bold', color: '#ffffff' }}>{m.month}</td>
                                <td style={{ padding: '12px' }}>
                                    {m.count} {isEn ? 'reservations' : 'reservas'}
                                </td>
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