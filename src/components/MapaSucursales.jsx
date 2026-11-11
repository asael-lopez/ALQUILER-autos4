import { useEffect, useState } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';
import './MapaSucursales.css';
import { useApp } from '../context/useApp';
import { getDistanceKm, geocodeAddress } from '../services/mapaService';

L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow
});

const BRANCHES = [
    {
        id: 'santa-lucia-soyapango',
        name: 'Alquiler SantaLucía',
        latitude: 13.703628,
        longitude: -89.150161,
        address: 'Av. Principal 123, Centro, Santa Lucia, Soyapango.',
        hours: 'Lun-Sáb: 08:00 - 20:00',
        phone: '+503 7577-2971'
    }
];

const branchIcon = L.divIcon({
    className: 'location-custom-div-icon',
    html: '<span class="location-marker-pin" aria-hidden="true"><i class="fas fa-map-marker-alt"></i></span>',
    iconSize: [34, 40],
    iconAnchor: [17, 38],
    popupAnchor: [0, -34]
});

const userLocationIcon = L.divIcon({
    className: 'location-custom-div-icon',
    html: '<span class="location-marker-pin is-search-result" aria-hidden="true"><i class="fas fa-location-dot"></i></span>',
    iconSize: [34, 40],
    iconAnchor: [17, 38],
    popupAnchor: [0, -34]
});

function MapViewport({ branch, userLocation }) {
    const map = useMap();

    useEffect(() => {
        if (!userLocation) return;
        map.fitBounds(
            [
                [branch.latitude, branch.longitude],
                [userLocation.lat, userLocation.lon]
            ],
            { padding: [24, 24], maxZoom: 15 }
        );
    }, [branch, map, userLocation]);

    return null;
}

export function MapaSucursales() {
    const { selectedBranch, setSelectedBranch, userLocation, setUserLocation } = useApp();
    const [address, setAddress] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [status, setStatus] = useState({
        message: 'El resultado de tu búsqueda aparecerá aquí.',
        type: ''
    });

    const branch = BRANCHES.find((item) => item.id === selectedBranch) || BRANCHES[0];
    const branchCoordinates = [branch.latitude, branch.longitude];
    const distance = userLocation
        ? getDistanceKm(branchCoordinates, [userLocation.lat, userLocation.lon])
        : null;
    const directionsUrl = new URL('https://www.openstreetmap.org/directions');
    directionsUrl.searchParams.set('to', `${branch.latitude},${branch.longitude}`);

    const handleSearch = async (event) => {
        event.preventDefault();
        const query = address.trim();

        if (!query) {
            setStatus({ message: 'Escribe una dirección para iniciar la búsqueda.', type: 'error' });
            return;
        }

        setIsSearching(true);
        setUserLocation(null);
        setStatus({ message: 'Buscando dirección...', type: '' });

        try {
            const result = await geocodeAddress(query);
            if (!result) {
                setStatus({ message: 'No se encontró la dirección en El Salvador. Prueba con otra referencia.', type: 'error' });
                return;
            }

            setUserLocation(result);
            setStatus({ message: 'Dirección encontrada.', type: 'success' });
        } catch (error) {
            setStatus({ message: error.message || 'No se pudo buscar la dirección. Inténtalo de nuevo.', type: 'error' });
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="location-layout">
            <div className="location-map-column">
                <MapContainer
                    id="locationMap"
                    className="location-map"
                    center={branchCoordinates}
                    zoom={15}
                    scrollWheelZoom={false}
                    aria-label="Mapa de Alquiler SantaLucía"
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
                        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                        maxZoom={19}
                    />
                    <MapViewport branch={branch} userLocation={userLocation} />
                    {BRANCHES.map((item) => (
                        <Marker
                            key={item.id}
                            position={[item.latitude, item.longitude]}
                            icon={branchIcon}
                            title={item.name}
                            alt={item.name}
                            eventHandlers={{ click: () => setSelectedBranch(item.id) }}
                        >
                            <Popup>
                                <strong className="location-popup-title">{item.name}</strong>
                                <p>Dirección: {item.address}</p>
                                <p>Horario: {item.hours}</p>
                                <p>
                                    Teléfono: <a href={`tel:${item.phone.replace(/[^\d+]/g, '')}`}>{item.phone}</a>
                                </p>
                            </Popup>
                        </Marker>
                    ))}
                    {userLocation && (
                        <Marker
                            position={[userLocation.lat, userLocation.lon]}
                            icon={userLocationIcon}
                            title="Tu ubicación"
                            alt="Tu ubicación"
                        >
                            <Popup>
                                <p>{userLocation.displayName}</p>
                            </Popup>
                        </Marker>
                    )}
                </MapContainer>
                <p className="location-sample-note">
                    Ubicación aproximada de ejemplo: centro de Soyapango. Se actualizará con las coordenadas reales de la sucursal.
                </p>
            </div>

            <div className="location-search-panel">
                <h3>Calcula tu distancia</h3>
                <p>Busca una dirección en El Salvador para ver qué tan lejos estás de la sucursal.</p>
                <form className="location-search-form" onSubmit={handleSearch}>
                    <label htmlFor="locationSearchInput">Escribe tu dirección</label>
                    <div className="location-search-field">
                        <input
                            id="locationSearchInput"
                            name="address"
                            type="search"
                            placeholder="Ej. Plaza Mundo, Soyapango"
                            autoComplete="street-address"
                            value={address}
                            onChange={(event) => setAddress(event.target.value)}
                        />
                        <button type="submit" disabled={isSearching}>
                            {isSearching ? 'Buscando...' : 'Buscar'}
                        </button>
                    </div>
                </form>
                <p className={`location-status${status.type ? ` is-${status.type}` : ''}`} role="status" aria-live="polite">
                    {status.message}
                </p>
                {distance !== null && (
                    <p className="location-distance" aria-live="polite">
                        Distancia aproximada a la sucursal: {distance.toFixed(2)} km.
                    </p>
                )}
                <a className="location-directions" href={directionsUrl.toString()} target="_blank" rel="noopener noreferrer">
                    <i className="fas fa-route" aria-hidden="true"></i>
                    Cómo llegar
                </a>
            </div>
        </div>
    );
}
