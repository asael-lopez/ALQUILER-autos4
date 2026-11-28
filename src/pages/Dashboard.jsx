import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/useApp';
import { translateText } from '../i18n.js';
import { WeatherForecast } from '../components/WeatherForecast';
import { formatMoney } from '../services/exchangeService';
import {
    AlertCircle,
    CalendarCheck,
    CalendarDays,
    CarFront,
    CheckCircle2,
    ClipboardList,
    Clock,
    Eye,
    MapPin,
    Wallet,
    X,
    XCircle
} from 'lucide-react';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function getLocalDate(dateString) {
    if (!dateString) return null;
    const date = new Date(`${dateString}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(dateString, language) {
    const date = getLocalDate(dateString);
    return date
        ? date.toLocaleDateString(language === 'en' ? 'en-US' : 'es-SV', { day: 'numeric', month: 'long', year: 'numeric' })
        : 'Fecha no disponible';
}

function getProgressStep(reservation, now) {
    if (reservation.estado === 'Pendiente') return 0;
    if (!['Aprobada', 'Activa'].includes(reservation.estado)) return -1;

    const pickupDate = getLocalDate(reservation.fechaInicio);
    return pickupDate && pickupDate.getTime() > now ? 1 : 2;
}

function getCountdown(reservation, now) {
    const pickupDate = getLocalDate(reservation.fechaInicio);
    if (!pickupDate) return null;

    const remaining = pickupDate.getTime() - now;
    if (remaining <= 0) return null;

    const days = Math.floor(remaining / DAY_IN_MS);
    const hours = Math.floor((remaining % DAY_IN_MS) / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((remaining % (60 * 1000)) / 1000);
    return { days, hours, minutes, seconds };
}

export const Dashboard = () => {
    const { userEmail, reservations, cars, language } = useApp();
    const [now, setNow] = useState(() => Date.now());
    const [selectedReservation, setSelectedReservation] = useState(null);

    useEffect(() => {
        const interval = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!selectedReservation) return undefined;
        const closeOnEscape = (event) => {
            if (event.key === 'Escape') setSelectedReservation(null);
        };
        window.addEventListener('keydown', closeOnEscape);
        return () => window.removeEventListener('keydown', closeOnEscape);
    }, [selectedReservation]);

    const misReservas = useMemo(
        () => reservations
            .filter((r) => (r.usuario || '').toLowerCase() === (userEmail || '').toLowerCase())
            .sort((a, b) => String(b.id).localeCompare(String(a.id))),
        [reservations, userEmail]
    );

    const activas = misReservas.filter((r) => r.estado === 'Activa' || r.estado === 'Aprobada').length;
    const pendientes = misReservas.filter((r) => r.estado === 'Pendiente').length;
    const gasto = misReservas.reduce((acc, r) => acc + (parseFloat(r.monto) || 0), 0);

    const getCarImage = (reservation) => (
        reservation.autoImagen
        || cars.find((car) => String(car.id) === String(reservation.carId))?.imagen
        || '/fotos/1.jpg'
    );

    return (
        <div className="admin-page reservation-dashboard">
            <header className="admin-page-head">
                <div>
                    <h1 className="admin-page-title">Mis reservas</h1>
                    <p className="admin-page-subtitle">
                        Revisa el vehículo, el avance de tu solicitud y cuánto falta para la fecha de recogida.
                    </p>
                </div>
            </header>

            <section className="admin-metrics">
                <MetricCard icon={<CalendarCheck size={20} />} label="ACTIVAS / APROBADAS" value={activas} tone="is-green" />
                <MetricCard icon={<Clock size={20} />} label="PENDIENTES" value={pendientes} tone="is-amber" />
                <MetricCard icon={<ClipboardList size={20} />} label="RESERVAS TOTALES" value={misReservas.length} tone="is-blue" />
                <MetricCard icon={<Wallet size={20} />} label="GASTO ACUMULADO" value={`$${gasto.toFixed(2)}`} tone="is-red" />
            </section>

            {pendientes > 0 && (
                <div className="admin-user-notice is-warning">
                    <Clock size={20} />
                    <div>
                        <strong>
                            {translateText(`Tienes ${pendientes} reserva(s) pendientes de aprobación.`, language)}
                        </strong>
                        <p>El equipo de Santa Lucía revisará tu solicitud. Aquí podrás seguir su avance.</p>
                    </div>
                </div>
            )}

            <section className="admin-card">
                <h2 className="admin-card-title">Historial de reservas</h2>
                {misReservas.length === 0 ? (
                    <p className="reservation-list-empty">
                        Aún no tienes reservas registradas. Explora nuestra flota y realiza tu primera reserva.
                    </p>
                ) : (
                    <div className="reservation-list">
                        {misReservas.map((reservation) => (
                            <ReservationCard
                                key={reservation.id}
                                reservation={reservation}
                                image={getCarImage(reservation)}
                                now={now}
                                language={language}
                                onInspect={() => setSelectedReservation(reservation)}
                            />
                        ))}
                    </div>
                )}
            </section>

            <section className="admin-card">
                <h2 className="admin-card-title">¿Cómo funciona el proceso?</h2>
                <div className="admin-user-steps">
                    <div className="admin-user-step">
                        <span className="admin-user-step-icon is-amber"><Clock size={18} /></span>
                        <div>
                            <strong>1. Solicitud enviada</strong>
                            <p>Recibimos tu solicitud y revisamos la disponibilidad del vehículo.</p>
                        </div>
                    </div>
                    <div className="admin-user-step">
                        <span className="admin-user-step-icon is-blue"><ClipboardList size={18} /></span>
                        <div>
                            <strong>2. En proceso</strong>
                            <p>Te avisaremos cuando la reserva quede aprobada.</p>
                        </div>
                    </div>
                    <div className="admin-user-step">
                        <span className="admin-user-step-icon is-green"><CheckCircle2 size={18} /></span>
                        <div>
                            <strong>3. Listo para retirar</strong>
                            <p>Revisa la fecha y el lugar de recogida en los detalles de tu reserva.</p>
                        </div>
                    </div>
                </div>
            </section>

            {selectedReservation && (
                <ReservationDetails
                    reservation={selectedReservation}
                    image={getCarImage(selectedReservation)}
                    language={language}
                    onClose={() => setSelectedReservation(null)}
                />
            )}
        </div>
    );
};

const PROCESS_STEPS = ['Solicitud enviada', 'En proceso', 'Listo para retirar'];

function ReservationCard({ reservation, image, now, language, onInspect }) {
    const step = getProgressStep(reservation, now);
    const countdown = getCountdown(reservation, now);
    const terminal = step < 0;
    const pickupDate = getLocalDate(reservation.fechaInicio);
    const returnDate = getLocalDate(reservation.fechaFin);
    const isRentalOngoing = reservation.estado === 'Activa'
        && pickupDate
        && pickupDate.getTime() <= now
        && returnDate
        && returnDate.getTime() + DAY_IN_MS > now;
    const isRentalFinished = reservation.estado === 'Activa'
        && returnDate
        && returnDate.getTime() + DAY_IN_MS <= now;
    const processLabel = isRentalOngoing
        ? 'Alquiler en curso'
        : isRentalFinished
            ? 'Alquiler finalizado'
            : PROCESS_STEPS[step];

    return (
        <article className="reservation-item">
            <div className="reservation-item-main">
                <img
                    className="reservation-car-image"
                    src={image}
                    alt={`Foto de ${reservation.autoNombre || 'vehículo reservado'}`}
                    onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = '/fotos/1.jpg';
                    }}
                />
                <div className="reservation-car-info">
                    <span className="reservation-id">{reservation.id}</span>
                    <h3>{reservation.autoNombre || 'Vehículo'}</h3>
                    <span className="reservation-category">{reservation.categoria || 'Vehículo reservado'}</span>
                </div>
                <div className="reservation-status">
                    <EstadoAprobacion estado={reservation.estado} />
                    <button className="reservation-inspect-button" type="button" onClick={onInspect}>
                        <Eye size={16} />
                        Inspeccionar
                    </button>
                </div>
            </div>

            {terminal ? (
                <div className={`reservation-terminal ${getBadgeClass(reservation.estado)}`}>
                    {reservation.estado === 'Rechazada' || reservation.estado === 'Cancelada'
                        ? <AlertCircle size={17} />
                        : <CheckCircle2 size={17} />}
                    <span>
                        {reservation.estado === 'Rechazada'
                            ? 'Esta solicitud no fue aprobada.'
                            : reservation.estado === 'Cancelada'
                                ? 'Esta solicitud fue cancelada.'
                                : 'Este alquiler ya fue completado.'}
                    </span>
                </div>
            ) : (
                <>
                    <ol className="reservation-progress" aria-label="Avance de la reserva">
                        {PROCESS_STEPS.map((label, index) => (
                            <li
                                className={[
                                    index < step ? 'is-complete' : '',
                                    index === step ? 'is-current' : ''
                                ].filter(Boolean).join(' ')}
                                key={label}
                            >
                                <span className="reservation-progress-dot">
                                    {index < step ? <CheckCircle2 size={15} /> : index + 1}
                                </span>
                                <span>{index === 2 && isRentalFinished ? 'Alquiler finalizado' : label}</span>
                            </li>
                        ))}
                    </ol>
                    <div className="reservation-item-footer">
                        <div className="reservation-date-summary">
                            <CalendarDays size={16} />
                            <span>{formatDate(reservation.fechaInicio, language)} <span aria-hidden="true">→</span> {formatDate(reservation.fechaFin, language)}</span>
                        </div>
                        {countdown ? (
                            <div className="reservation-countdown" aria-live="off">
                                <Clock size={16} />
                                <span>Falta para recoger:</span>
                                <strong>{countdown.days}d {countdown.hours}h {countdown.minutes}m {countdown.seconds}s</strong>
                            </div>
                        ) : (
                            <div className="reservation-countdown is-started">
                                <Clock size={16} />
                                <span>{processLabel}</span>
                            </div>
                        )}
                    </div>
                </>
            )}
        </article>
    );
}

function ReservationDetails({ reservation, image, language, onClose }) {
    return (
        <div className="reservation-modal-backdrop" onMouseDown={onClose}>
            <section
                className="reservation-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="reservation-modal-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <button className="reservation-modal-close" type="button" onClick={onClose} aria-label="Cerrar detalles">
                    <X size={20} />
                </button>
                <img
                    className="reservation-modal-image"
                    src={image}
                    alt={`Foto de ${reservation.autoNombre || 'vehículo reservado'}`}
                    onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = '/fotos/1.jpg';
                    }}
                />
                <div className="reservation-modal-content">
                    <span className="reservation-id">{reservation.id}</span>
                    <h2 id="reservation-modal-title">{reservation.autoNombre || 'Vehículo reservado'}</h2>
                    <p className="reservation-modal-category">{reservation.categoria || 'Vehículo'}</p>
                    <EstadoAprobacion estado={reservation.estado} />
                    <dl className="reservation-details-list">
                        <div>
                            <dt><CalendarDays size={16} /> Recogida</dt>
                            <dd>{formatDate(reservation.fechaInicio, language)}</dd>
                        </div>
                        <div>
                            <dt><CalendarDays size={16} /> Devolución</dt>
                            <dd>{formatDate(reservation.fechaFin, language)}</dd>
                        </div>
                        <div>
                            <dt><MapPin size={16} /> Lugar de recogida</dt>
                            <dd>{reservation.lugar || 'No especificado'}</dd>
                        </div>
                        <div>
                            <dt><CarFront size={16} /> Duración y total</dt>
                            <dd>
                                {reservation.dias || '—'} día(s) · ${(parseFloat(reservation.monto) || 0).toFixed(2)}
                                {reservation.totalReferencia != null && (
                                    <small style={{ display: 'block', color: '#a3a3a3' }}>
                                        ≈ {formatMoney(reservation.totalReferencia, reservation.monedaReferencia, language === 'en' ? 'en-US' : 'es-SV')} (tasa del {reservation.fechaTasaCambio || 'día de la solicitud'})
                                    </small>
                                )}
                            </dd>
                        </div>
                        {reservation.distanciaSucursalKm != null && (
                            <div>
                                <dt><MapPin size={16} /> Distancia a la sucursal</dt>
                                <dd>{reservation.distanciaSucursalKm} km</dd>
                            </div>
                        )}
                    </dl>
                    {!['Rechazada', 'Cancelada', 'Completada'].includes(reservation.estado)
                        && reservation.fechaInicio && reservation.fechaFin && (
                        <WeatherForecast startDate={reservation.fechaInicio} endDate={reservation.fechaFin} />
                    )}
                    <button className="reservation-modal-done" type="button" onClick={onClose}>Entendido</button>
                </div>
            </section>
        </div>
    );
}

const MetricCard = ({ icon, label, value, tone = '' }) => (
    <article className={`admin-metric-card ${tone}`}>
        <span className="admin-metric-icon">{icon}</span>
        <div>
            <span className="admin-metric-label">{label}</span>
            <strong className="admin-metric-value">{value}</strong>
        </div>
    </article>
);

const EstadoAprobacion = ({ estado }) => {
    const icono = {
        Aprobada: <CheckCircle2 size={14} />,
        Activa: <CheckCircle2 size={14} />,
        Pendiente: <Clock size={14} />,
        Rechazada: <XCircle size={14} />,
        Cancelada: <XCircle size={14} />,
        Completada: <CheckCircle2 size={14} />
    }[estado] || <CheckCircle2 size={14} />;

    return (
        <span className={`status-badge ${getBadgeClass(estado)}`}>
            {icono}
            {estado || '—'}
        </span>
    );
};

function getBadgeClass(estado) {
    return {
        Aprobada: 'is-ok',
        Activa: 'is-ok',
        Completada: 'is-neutral',
        Pendiente: 'is-warning',
        Rechazada: 'is-danger',
        Cancelada: 'is-danger'
    }[estado] || 'is-neutral';
}

export const StatusBadge = ({ estado }) => {
    const clase = {
        Activa: 'is-ok',
        Pendiente: 'is-warning',
        Aprobada: 'is-ok',
        Completada: 'is-neutral',
        Cancelada: 'is-danger',
        Rechazada: 'is-danger',
        Disponible: 'is-ok',
        Alquilado: 'is-info',
        'En Mantenimiento': 'is-warning',
        'En curso': 'is-warning',
        Finalizado: 'is-neutral'
    }[estado] || 'is-neutral';
    return <span className={`status-badge ${clase}`}>{estado || '—'}</span>;
};
