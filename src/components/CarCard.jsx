import { Button } from './Button';
import { formatUSD, getPublicRateSummary } from '../utils/rentalPricing';
import { useCurrency } from '../context/useCurrency';

export function CarCard({
    car,
    isFavorite = false,
    onToggleFavorite,
    onDetails,
    onEdit,
    onDelete,
    statusStyle,
    editButtonStyle,
    deleteButtonStyle,
    variant = 'catalog'
}) {
    const { formatEquivalent } = useCurrency();

    if (variant === 'table') {
        const statusName = car.status || (car.disponible ? 'Disponible' : 'Alquilado');
        return (
            <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
                <td style={{ padding: '10px' }}>
                    <img
                        src={car.imagen || '/fotos/1.jpg'}
                        alt={car.nombre}
                        style={{ width: '45px', height: '35px', objectFit: 'cover', borderRadius: '4px' }}
                    />
                </td>
                <td style={{ padding: '10px', fontWeight: 'bold', color: '#fff' }}>
                    <span style={{ display: 'block' }}>{car.nombre}</span>
                    <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 400, color: '#737373' }}>
                        {car.marca}{car.anio ? ` · ${car.anio}` : ''}
                    </span>
                </td>
                <td style={{ padding: '10px', color: '#a3a3a3' }}>{car.categoria}</td>
                <td style={{ padding: '10px' }}>{car.transmision || 'Por confirmar'}</td>
                <td style={{ padding: '10px' }}>
                    {car.pasajeros == null ? 'Por confirmar' : `${car.pasajeros}${car.pasajerosVerificados ? '' : ' aprox.'} pax`}
                </td>
                <td style={{ padding: '10px', fontWeight: 'bold', color: '#dc2626' }}>
                    {formatUSD(car.precioDia)}/día
                </td>
                <td style={{ padding: '10px' }}>
                    <span style={statusStyle}>{statusName}</span>
                </td>
                <td style={{ padding: '10px', textAlign: 'right' }}>
                    <Button onClick={() => onEdit?.(car)} style={editButtonStyle}>Editar</Button>
                    <Button onClick={() => onDelete?.(car.id)} style={deleteButtonStyle}>Eliminar</Button>
                </td>
            </tr>
        );
    }

    if (variant === 'saved') {
        return (
            <article className="site-panel-item">
                <img src={car.imagen || '/fotos/1.jpg'} alt={car.nombre} />
                <div>
                    <strong>{car.nombre}</strong>
                    <span>{car.categoriaLabel || car.categoria}</span>
                </div>
                <Button type="button" onClick={() => onToggleFavorite?.(car.id)}>Quitar</Button>
            </article>
        );
    }

    const rates = getPublicRateSummary(car);
    const passengerValue = car.pasajeros == null
        ? 'Por confirmar'
        : `${car.pasajeros}${car.pasajerosVerificados ? '' : ' aprox.'} pax`;
    const luggageValue = car.maletas == null
        ? 'Por confirmar'
        : `~${car.maletas} maletas`;
    const airConditioningValue = car.aireAcondicionado === true
        ? 'A/C'
        : car.aireAcondicionado === false
            ? 'Sin A/C'
            : 'A/C por confirmar';
    const specs = [
        { icon: 'fas fa-cog', label: 'Transmisión', value: car.transmision || 'Por confirmar' },
        { icon: 'fas fa-users', label: 'Pasajeros', value: passengerValue },
        { icon: 'fas fa-suitcase', label: 'Equipaje estimado', value: luggageValue },
        { icon: 'fas fa-snowflake', label: 'Aire acondicionado', value: airConditioningValue },
        { icon: 'fas fa-gas-pump', label: 'Combustible', value: car.combustible || 'Por confirmar' }
    ];

    return (
        <article className="rent-category-card">
            <h3 className="cat-card-title">{car.categoria || 'Sedán'}</h3>
            <p className="cat-card-example">
                {car.nombre || 'Vehículo disponible'}
                <span className="cat-card-meta">
                    {car.anio ? `Año ${car.anio}` : 'Año por confirmar'}
                    {car.color ? ` · ${car.color}` : ''}
                </span>
            </p>

            <div className="cat-card-specs">
                {specs.map((spec) => (
                    <div key={`${car.id}-${spec.icon}`} className="cat-spec-item" title={spec.label}>
                        <i className={`${spec.icon} cat-spec-icon`} aria-hidden="true"></i>
                        <span className="cat-spec-text">{spec.value}</span>
                    </div>
                ))}
            </div>

            <div className="cat-card-pricing">
                <div>
                    <span className="cat-card-price-label">Tarifa diaria real</span>
                    <strong>{formatUSD(rates.dailyRate)} <span>/día</span></strong>
                    {formatEquivalent(rates.dailyRate) && (
                        <small className="cat-card-price-fx" style={{ display: 'block', color: '#a3a3a3', fontSize: '0.78rem' }}>
                            {formatEquivalent(rates.dailyRate)} /día
                        </small>
                    )}
                </div>
            </div>

            {car.revisionPendiente && (
                <p className="cat-card-review">Datos del vehículo por confirmar</p>
            )}

            <div className="cat-card-image-wrap">
                <img
                    src={car.imagen || '/fotos/1.jpg'}
                    alt={car.nombre || 'Vehículo'}
                    className="cat-card-image"
                    loading="lazy"
                />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                    type="button"
                    className="cat-card-details-btn"
                    onClick={() => onDetails?.(car)}
                    style={{ flex: 1 }}
                >
                    Ver detalles <i className="fas fa-chevron-right" aria-hidden="true"></i>
                </Button>
                <Button
                    type="button"
                    aria-label={isFavorite ? `Quitar ${car.nombre} de favoritos` : `Agregar ${car.nombre} a favoritos`}
                    aria-pressed={isFavorite}
                    onClick={() => onToggleFavorite?.(car.id)}
                    style={{
                        border: '1px solid #333',
                        borderRadius: '6px',
                        padding: '0 12px',
                        background: isFavorite ? '#dc2626' : '#1e1e1e',
                        color: '#fff',
                        cursor: 'pointer'
                    }}
                >
                    <i className={isFavorite ? 'fas fa-heart' : 'far fa-heart'} aria-hidden="true"></i>
                </Button>
            </div>
        </article>
    );
}
