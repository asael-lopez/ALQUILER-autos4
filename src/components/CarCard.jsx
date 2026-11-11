import { Button } from './Button';

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
                <td style={{ padding: '10px', fontWeight: 'bold', color: '#fff' }}>{car.nombre}</td>
                <td style={{ padding: '10px', color: '#a3a3a3' }}>{car.categoria}</td>
                <td style={{ padding: '10px' }}>{car.transmision}</td>
                <td style={{ padding: '10px' }}>{car.pasajeros || 5} pax</td>
                <td style={{ padding: '10px', fontWeight: 'bold', color: '#dc2626' }}>${car.precioDia}/día                </td>
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

    const specs = [
        { icon: 'fas fa-cog', value: car.transmision || 'Automática' },
        { icon: 'fas fa-users', value: car.pasajeros || 4 },
        { icon: 'fas fa-suitcase', value: car.maletas || 2 }
    ];

    return (
        <article className="rent-category-card">
            <h3 className="cat-card-title">{car.categoria || 'Sedán'}</h3>
            <p className="cat-card-example">{car.nombre || 'Vehículo disponible'}</p>

            <div className="cat-card-specs">
                {specs.map((spec) => (
                    <div key={`${car.id}-${spec.icon}`} className="cat-spec-item">
                        <i className={`${spec.icon} cat-spec-icon`} aria-hidden="true"></i>
                        <span className="cat-spec-text">{spec.value}</span>
                    </div>
                ))}
            </div>

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
