import { useMemo, useState } from 'react';
import { useApp } from '../context/useApp';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar, Doughnut, Pie, Line } from 'react-chartjs-2';
import {
    Car,
    CalendarCheck,
    DollarSign,
    Activity,
    KeyRound,
    Wrench,
    Users,
    TrendingUp,
    Eye,
    Info,
    Filter
} from 'lucide-react';
import { StatusBadge } from './Dashboard';

// Registramos los módulos de Chart.js que vamos a usar en las gráficas
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

// ========================================================
// AdminDashboard.jsx — PÁGINA 1 del panel admin
// --------------------------------------------------------
// "Resumen y estadísticas". TODOS los números se calculan en
// tiempo real a partir de los datos del contexto (vehículos,
// reservas, clientes e historial). No hay cifras estáticas.
//
// Regla de honestidad: los registros marcados como DEMO se
// separan de los OFICIALES. Las estadísticas oficiales usan
// solo registros reales; si no alcanza la información se
// muestra cero / "sin datos" en lugar de inventar valores.
// ========================================================

// Paleta reutilizada por varias gráficas
const CHART_COLORS = {
    red: '#dc2626',
    redSoft: 'rgba(220, 38, 38, 0.55)',
    blue: '#2563eb',
    green: '#4ade80',
    amber: '#f59e0b',
    purple: '#a855f7',
    gray: '#64748b'
};
const PIE_PALETTE = ['#dc2626', '#2563eb', '#4ade80', '#f59e0b', '#a855f7', '#64748b', '#0891b2', '#e11d48'];

// Opciones base compartidas: texto claro y rejilla tenue para el tema oscuro
const baseChartOptions = (extra = {}) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { labels: { color: '#e5e5e5', font: { size: 12 } } },
        ...(extra.plugins || {})
    },
    scales: extra.scales
});

// ---- Utilidades de fecha ----
const toISODate = (date) => {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
};

const daysAgoISO = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return toISODate(date);
};

export const AdminDashboard = () => {
    const { cars, reservations, clients, vehicleMovements, language } = useApp();

    const months = language === 'en'
        ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        : ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    // --------------------------------------------------------
    // Filtros: rango de fechas + origen de los datos
    // --------------------------------------------------------
    const [dateFrom, setDateFrom] = useState(() => daysAgoISO(90));
    const [dateTo, setDateTo] = useState(() => toISODate(new Date()));
    // official = solo registros reales (por defecto) · demo = solo ejemplos · all = ambos
    const [scope, setScope] = useState('official');

    const inRange = (dateStr) => {
        const time = new Date(dateStr || '').getTime();
        if (Number.isNaN(time)) return false;
        const from = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : -Infinity;
        const to = dateTo ? new Date(`${dateTo}T23:59:59`).getTime() : Infinity;
        return time >= from && time <= to;
    };

    // Filtra por origen (oficial / demo / todos)
    const scopeFilter = (item) => (scope === 'all' ? true : scope === 'demo' ? Boolean(item.demo) : !item.demo);

    const scopedReservations = useMemo(
        () => reservations.filter(scopeFilter),
        [reservations, scope]
    );
    const scopedMovements = useMemo(
        () => vehicleMovements.filter(scopeFilter),
        [vehicleMovements, scope]
    );

    // Reservas dentro del rango de fechas seleccionado
    const filteredReservations = useMemo(
        () => scopedReservations.filter((r) => inRange(r.date || r.fechaInicio)),
        [scopedReservations, dateFrom, dateTo]
    );

    const scopeCounts = useMemo(() => ({
        official: reservations.filter((r) => !r.demo).length,
        demo: reservations.filter((r) => r.demo).length,
        total: reservations.length
    }), [reservations]);

    // --------------------------------------------------------
    // KPIs de la FLOTA (estado actual — no dependen del rango)
    // --------------------------------------------------------
    const totalFleet = cars.length;
    const disponibleCount = cars.filter((car) => car.status === 'Disponible').length;
    const alquiladoCount = cars.filter((car) => car.status === 'Alquilado').length;
    const mantenimientoCount = cars.filter((car) => car.status === 'En Mantenimiento').length;
    const enRevisionCount = cars.filter((car) => car.estadoPublicacion === 'Pendiente').length;

    // --------------------------------------------------------
    // KPIs del PERÍODO (dependen de fechas + origen)
    // --------------------------------------------------------
    const nuevosVehiculos = cars.filter((car) => car.fechaRegistro && inRange(car.fechaRegistro)).length;
    const ventasCompletadas = filteredReservations.filter((r) => r.estado === 'Completada').length;
    const income = filteredReservations.reduce((acc, r) => acc + (parseFloat(r.monto) || 0), 0);

    // Actividad de los últimos 7 días (movimientos de flota)
    const last7Days = useMemo(() => {
        const limit = new Date().getTime() - 7 * 24 * 60 * 60 * 1000;
        return scopedMovements.filter((m) => new Date(m.fecha).getTime() >= limit).length;
    }, [scopedMovements]);

    // Comparación entre períodos: período actual vs. período anterior de igual duración
    const comparison = useMemo(() => {
        if (!dateFrom || !dateTo) return null;
        const fromTime = new Date(`${dateFrom}T00:00:00`).getTime();
        const toTime = new Date(`${dateTo}T23:59:59`).getTime();
        const span = toTime - fromTime;
        const prevFrom = fromTime - span - 1;
        const prevTo = fromTime - 1;

        const inPrev = scopedReservations.filter((r) => {
            const time = new Date(r.date || r.fechaInicio).getTime();
            return !Number.isNaN(time) && time >= prevFrom && time <= prevTo;
        });

        const currentCount = filteredReservations.length;
        const prevCount = inPrev.length;
        const currentIncome = income;
        const prevIncome = inPrev.reduce((acc, r) => acc + (parseFloat(r.monto) || 0), 0);
        const deltaCount = currentCount - prevCount;
        const pct = prevCount > 0 ? Math.round((deltaCount / prevCount) * 100) : (currentCount > 0 ? 100 : 0);

        return { currentCount, prevCount, deltaCount, pct, currentIncome, prevIncome };
    }, [scopedReservations, filteredReservations, income, dateFrom, dateTo]);

    // --------------------------------------------------------
    // Datos para las gráficas
    // --------------------------------------------------------
    // Ingresos por mes (año en curso)
    const now = new Date();
    const incomeByMonth = months.map((_, index) => filteredReservations.reduce((acc, r) => {
        const dateObj = new Date(r.date || r.fechaInicio);
        if (Number.isNaN(dateObj.getTime())) return acc;
        if (dateObj.getMonth() !== index || dateObj.getFullYear() !== now.getFullYear()) return acc;
        return acc + (parseFloat(r.monto) || 0);
    }, 0));

    // Evolución de registros mensuales (altas de vehículos en los últimos 12 meses)
    const registrationSeries = useMemo(() => {
        const labels = [];
        const values = [];
        for (let i = 11; i >= 0; i--) {
            const ref = new Date(now.getFullYear(), now.getMonth() - i, 1);
            labels.push(`${months[ref.getMonth()]} ${String(ref.getFullYear()).slice(2)}`);
            const count = scopedMovements.filter((m) => {
                if (!['create', 'publication_request'].includes(m.accion)) return false;
                const d = new Date(m.fecha);
                return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear();
            }).length;
            values.push(count);
        }
        return { labels, values };
    }, [scopedMovements, months]);

    // Distribución de la flota por marca
    const brandMap = cars.reduce((acc, car) => {
        const marca = car.marca || 'Sin marca';
        acc[marca] = (acc[marca] || 0) + 1;
        return acc;
    }, {});
    const brandLabels = Object.keys(brandMap);
    const brandValues = Object.values(brandMap);

    // Distribución de la flota por categoría
    const categoryMap = cars.reduce((acc, car) => {
        const cat = car.categoria || 'Otra';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
    }, {});
    const categoryLabels = Object.keys(categoryMap);
    const categoryValues = Object.values(categoryMap);

    // Vehículos más consultados (usando la métrica de vistas)
    const viewedSorted = [...cars]
        .sort((a, b) => (Number(b.vistas) || 0) - (Number(a.vistas) || 0))
        .filter((car) => (Number(car.vistas) || 0) > 0)
        .slice(0, 5);
    const viewedLabels = viewedSorted.map((car) => car.nombre);
    const viewedValues = viewedSorted.map((car) => Number(car.vistas) || 0);

    // Estado de reservas del período
    const approvedCount = filteredReservations.filter((r) => r.estado === 'Aprobada' || r.estado === 'Activa').length;
    const pendingCount = filteredReservations.filter((r) => r.estado === 'Pendiente').length;
    const rejectedCount = filteredReservations.filter((r) => r.estado === 'Rechazada' || r.estado === 'Cancelada').length;

    // Actividad reciente (tabla)
    const recentActivity = [...filteredReservations]
        .sort((a, b) => new Date(b.date || b.fechaInicio) - new Date(a.date || a.fechaInicio))
        .slice(0, 6);

    const applyPreset = (days) => {
        setDateFrom(days ? daysAgoISO(days) : '');
        setDateTo(toISODate(new Date()));
    };

    const scopeLabel = scope === 'official'
        ? 'Solo datos oficiales'
        : scope === 'demo'
            ? 'Solo datos DEMO'
            : 'Oficiales + DEMO';

    return (
        <div className="admin-page">
            <header className="admin-page-head">
                <div>
                    <h1 className="admin-page-title">Resumen general</h1>
                    <p className="admin-page-subtitle">
                        Indicadores de la operación de Alquiler Santa Lucía, calculados en tiempo real desde los datos del sistema.
                    </p>
                </div>
                <span className="admin-page-chip">
                    <Activity size={15} aria-hidden="true" /> En vivo
                </span>
            </header>

            {/* -------------------- BARRA DE FILTROS -------------------- */}
            <section className="admin-card admin-filterbar">
                <div className="admin-filterbar-row">
                    <span className="admin-filterbar-label">
                        <Filter size={15} aria-hidden="true" /> Filtros
                    </span>

                    <div className="admin-date-range">
                        <label>
                            <span>Desde</span>
                            <input
                                type="date"
                                value={dateFrom}
                                max={dateTo || undefined}
                                onChange={(e) => setDateFrom(e.target.value)}
                            />
                        </label>
                        <label>
                            <span>Hasta</span>
                            <input
                                type="date"
                                value={dateTo}
                                min={dateFrom || undefined}
                                onChange={(e) => setDateTo(e.target.value)}
                            />
                        </label>
                    </div>

                    <div className="admin-preset-group">
                        <button type="button" onClick={() => applyPreset(7)}>7 días</button>
                        <button type="button" onClick={() => applyPreset(30)}>30 días</button>
                        <button type="button" onClick={() => applyPreset(90)}>3 meses</button>
                        <button type="button" onClick={() => applyPreset(0)}>Todo</button>
                    </div>
                </div>

                {/* Segmentado: separa registros oficiales de los DEMO */}
                <div className="admin-segment" role="group" aria-label="Origen de los datos">
                    <button
                        type="button"
                        className={scope === 'official' ? 'is-active' : ''}
                        onClick={() => setScope('official')}
                    >
                        Oficiales ({scopeCounts.official})
                    </button>
                    <button
                        type="button"
                        className={scope === 'demo' ? 'is-active' : ''}
                        onClick={() => setScope('demo')}
                    >
                        DEMO ({scopeCounts.demo})
                    </button>
                    <button
                        type="button"
                        className={scope === 'all' ? 'is-active' : ''}
                        onClick={() => setScope('all')}
                    >
                        Todos ({scopeCounts.total})
                    </button>
                </div>

                <p className="admin-filterbar-note">
                    <Info size={13} aria-hidden="true" />
                    Mostrando: <strong>{scopeLabel}</strong> · período {dateFrom || 'inicio'} → {dateTo || 'hoy'}.
                </p>
            </section>

            {/* -------------------- MÉTRICAS: FLOTA -------------------- */}
            <section className="admin-metrics">
                <MetricCard icon={<Car size={20} />} label="VEHÍCULOS TOTALES" value={totalFleet} tone="is-red" />
                <MetricCard icon={<KeyRound size={20} />} label="DISPONIBLES" value={disponibleCount} tone="is-green" />
                <MetricCard icon={<CalendarCheck size={20} />} label="RESERVADOS" value={alquiladoCount} tone="is-amber" />
                <MetricCard icon={<Wrench size={20} />} label="EN MANTENIMIENTO" value={mantenimientoCount} tone="is-gray" />
            </section>

            {/* -------------------- MÉTRICAS: PERÍODO -------------------- */}
            <section className="admin-metrics">
                <MetricCard icon={<Car size={20} />} label="NUEVOS VEHÍCULOS" value={nuevosVehiculos} tone="is-blue" />
                <MetricCard icon={<DollarSign size={20} />} label="VENTAS COMPLETADAS" value={ventasCompletadas} tone="is-green" />
                <MetricCard icon={<Users size={20} />} label="CLIENTES REGISTRADOS" value={clients.length} tone="is-purple" />
                <MetricCard icon={<Activity size={20} />} label="ACTIVIDAD (7 DÍAS)" value={last7Days} tone="is-red" />
            </section>

            {/* -------------------- FILA: INGRESOS + COMPARACIÓN -------------------- */}
            <section className="admin-chart-grid">
                <article className="admin-card admin-chart-card">
                    <h2 className="admin-card-title">Ingresos por mes</h2>
                    <div className="admin-chart-body">
                        <Bar
                            data={{
                                labels: months,
                                datasets: [{
                                    label: language === 'en' ? 'Revenue ($)' : 'Ingresos ($)',
                                    data: incomeByMonth,
                                    backgroundColor: CHART_COLORS.redSoft,
                                    borderColor: CHART_COLORS.red,
                                    borderWidth: 2,
                                    borderRadius: 6
                                }]
                            }}
                            options={baseChartOptions({
                                plugins: { legend: { display: false } },
                                scales: {
                                    x: { ticks: { color: '#a3a3a3' }, grid: { color: '#222' } },
                                    y: { ticks: { color: '#a3a3a3' }, grid: { color: '#222' } }
                                }
                            })}
                        />
                    </div>
                </article>

                <article className="admin-card admin-chart-card">
                    <h2 className="admin-card-title">Evolución de registros (12 meses)</h2>
                    <div className="admin-chart-body">
                        <Line
                            data={{
                                labels: registrationSeries.labels,
                                datasets: [{
                                    label: language === 'en' ? 'Registrations' : 'Registros',
                                    data: registrationSeries.values,
                                    borderColor: CHART_COLORS.blue,
                                    backgroundColor: 'rgba(37, 99, 235, 0.25)',
                                    fill: true,
                                    tension: 0.35,
                                    pointBackgroundColor: CHART_COLORS.blue
                                }]
                            }}
                            options={baseChartOptions({
                                plugins: { legend: { display: false } },
                                scales: {
                                    x: { ticks: { color: '#a3a3a3' }, grid: { color: '#222' } },
                                    y: { ticks: { color: '#a3a3a3' }, grid: { color: '#222' }, beginAtZero: true }
                                }
                            })}
                        />
                    </div>
                </article>
            </section>

            {/* -------------------- COMPARACIÓN ENTRE PERÍODOS -------------------- */}
            <section className="admin-card">
                <h2 className="admin-card-title">
                    <TrendingUp size={18} style={{ verticalAlign: '-3px', marginRight: 8 }} />
                    Comparación entre períodos
                </h2>
                {!comparison ? (
                    <p className="admin-empty">Define un rango de fechas para comparar períodos.</p>
                ) : (
                    <div className="admin-compare-grid">
                        <CompareCard
                            label="Reservas en el período"
                            current={comparison.currentCount}
                            previous={comparison.prevCount}
                            delta={comparison.deltaCount}
                            pct={comparison.pct}
                        />
                        <CompareCard
                            label="Ingresos del período"
                            current={`$${comparison.currentIncome.toFixed(2)}`}
                            previous={`$${comparison.prevIncome.toFixed(2)}`}
                            delta={comparison.currentIncome - comparison.prevIncome}
                            pct={comparison.prevIncome > 0
                                ? Math.round(((comparison.currentIncome - comparison.prevIncome) / comparison.prevIncome) * 100)
                                : (comparison.currentIncome > 0 ? 100 : 0)}
                            money
                        />
                        <CompareCard
                            label="Vehículos reservados (actual)"
                            current={alquiladoCount}
                            previous={`${enRevisionCount} en revisión`}
                            hidePct
                        />
                    </div>
                )}
            </section>

            {/* -------------------- DISTRIBUCIONES -------------------- */}
            <section className="admin-chart-grid">
                <article className="admin-card admin-chart-card">
                    <h2 className="admin-card-title">Distribución por marca</h2>
                    <div className="admin-chart-body is-doughnut">
                        {brandLabels.length === 0 ? (
                            <p className="admin-empty">No hay vehículos registrados.</p>
                        ) : (
                            <Doughnut
                                data={{
                                    labels: brandLabels,
                                    datasets: [{
                                        data: brandValues,
                                        backgroundColor: PIE_PALETTE,
                                        borderColor: '#111',
                                        borderWidth: 2
                                    }]
                                }}
                                options={baseChartOptions({ scales: undefined })}
                            />
                        )}
                    </div>
                </article>

                <article className="admin-card admin-chart-card">
                    <h2 className="admin-card-title">Distribución por categoría</h2>
                    <div className="admin-chart-body is-doughnut">
                        {categoryLabels.length === 0 ? (
                            <p className="admin-empty">No hay vehículos en la flota.</p>
                        ) : (
                            <Doughnut
                                data={{
                                    labels: categoryLabels,
                                    datasets: [{
                                        data: categoryValues,
                                        backgroundColor: PIE_PALETTE,
                                        borderColor: '#111',
                                        borderWidth: 2
                                    }]
                                }}
                                options={baseChartOptions({ scales: undefined })}
                            />
                        )}
                    </div>
                </article>

                <article className="admin-card admin-chart-card">
                    <h2 className="admin-card-title">
                        <Eye size={16} style={{ verticalAlign: '-3px', marginRight: 6 }} />
                        Vehículos más consultados
                    </h2>
                    <div className="admin-chart-body">
                        {viewedLabels.length === 0 ? (
                            <p className="admin-empty">Aún no se registran consultas de vehículos.</p>
                        ) : (
                            <Bar
                                data={{
                                    labels: viewedLabels,
                                    datasets: [{
                                        label: language === 'en' ? 'Views' : 'Consultas',
                                        data: viewedValues,
                                        backgroundColor: CHART_COLORS.purple,
                                        borderRadius: 6
                                    }]
                                }}
                                options={baseChartOptions({
                                    indexAxis: 'y',
                                    plugins: { legend: { display: false } },
                                    scales: {
                                        x: { ticks: { color: '#a3a3a3' }, grid: { color: '#222' }, beginAtZero: true },
                                        y: { ticks: { color: '#e5e5e5' }, grid: { color: '#222' } }
                                    }
                                })}
                            />
                        )}
                    </div>
                </article>

                <article className="admin-card admin-chart-card">
                    <h2 className="admin-card-title">Estado de reservas</h2>
                    <div className="admin-chart-body is-doughnut">
                        {(approvedCount + pendingCount + rejectedCount) === 0 ? (
                            <p className="admin-empty">Sin reservas en el período seleccionado.</p>
                        ) : (
                            <Pie
                                data={{
                                    labels: language === 'en'
                                        ? ['Approved', 'Pending', 'Rejected']
                                        : ['Aprobadas', 'Pendientes', 'Rechazadas'],
                                    datasets: [{
                                        data: [approvedCount, pendingCount, rejectedCount],
                                        backgroundColor: [CHART_COLORS.green, CHART_COLORS.amber, CHART_COLORS.red],
                                        borderColor: '#111',
                                        borderWidth: 2
                                    }]
                                }}
                                options={baseChartOptions({ scales: undefined })}
                            />
                        )}
                    </div>
                </article>
            </section>

            {/* -------------------- ACTIVIDAD RECIENTE -------------------- */}
            <section className="admin-card">
                <h2 className="admin-card-title">Actividad reciente</h2>
                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead>
                        <tr>
                            <th>ID</th>
                            <th>Cliente</th>
                            <th>Vehículo</th>
                            <th>Fecha</th>
                            <th>Monto</th>
                            <th>Estado</th>
                        </tr>
                        </thead>
                        <tbody>
                        {recentActivity.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="admin-empty">
                                    Sin movimientos para el período y origen seleccionados.
                                </td>
                            </tr>
                        ) : (
                            recentActivity.map((r) => (
                                <tr key={r.id}>
                                    <td className="admin-cell-strong">
                                        {r.id}
                                        {r.demo && <span className="admin-demo-tag">DEMO</span>}
                                    </td>
                                    <td>{r.clienteNombre || r.usuario || '—'}</td>
                                    <td>{r.autoNombre || 'Vehículo'}</td>
                                    <td className="admin-cell-muted">
                                        {new Date(r.date || r.fechaInicio).toLocaleDateString('es-SV')}
                                    </td>
                                    <td className="admin-cell-price">${(parseFloat(r.monto) || 0).toFixed(2)}</td>
                                    <td><StatusBadge estado={r.estado} /></td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

// Tarjeta KPI con color de acento según el tipo de métrica
const MetricCard = ({ icon, label, value, tone = '' }) => (
    <article className={`admin-metric-card ${tone}`}>
        <span className="admin-metric-icon">{icon}</span>
        <div>
            <span className="admin-metric-label">{label}</span>
            <strong className="admin-metric-value">{value}</strong>
        </div>
    </article>
);

// Tarjeta de comparación entre el período actual y el anterior
const CompareCard = ({ label, current, previous, delta, pct, money = false, hidePct = false }) => {
    const positive = (delta ?? 0) >= 0;
    return (
        <article className="admin-compare-card">
            <span className="admin-compare-label">{label}</span>
            <strong className="admin-compare-value">
                {money ? current : current}
            </strong>
            <span className="admin-compare-meta">
                Período anterior: {previous}
                {!hidePct && (
                    <span className={`admin-compare-delta ${positive ? 'is-up' : 'is-down'}`}>
                        {positive ? '▲' : '▼'} {positive ? '+' : ''}{pct}%
                    </span>
                )}
            </span>
        </article>
    );
};
