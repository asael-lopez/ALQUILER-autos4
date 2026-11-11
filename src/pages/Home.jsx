import { MapaSucursales } from '../components/MapaSucursales';
import './Home.css';

const featuredVehicles = [1, 2, 3, 4].map((number) => ({
    src: `/fotos/${number}.jpg`,
    alt: `Vehículo destacado ${number}`
}));

export function Home({ onTabChange }) {
    return (
        <div className="home-page">
            <section className="home-hero">
                <video
                    className="home-hero-video"
                    autoPlay
                    muted
                    loop
                    playsInline
                    poster="/fotos/KIA2.jpg"
                    aria-hidden="true"
                >
                    <source src="/kia.mp4" type="video/mp4" />
                </video>
                <div className="home-hero-overlay" />
                <div className="home-hero-content">
                    <span>Santa Lucía Alquiler</span>
                    <h1>Elige tu vehículo</h1>
                    <button type="button" onClick={() => onTabChange('fleet')}>
                        Ver nuestra flota
                    </button>
                </div>
            </section>

            <section className="home-vehicles" aria-labelledby="home-vehicles-title">
                <div className="home-section-heading">
                    <span>Nuestra selección</span>
                    <h2 id="home-vehicles-title">Encuentra tu próximo vehículo</h2>
                </div>
                <div className="home-vehicles-grid">
                    {featuredVehicles.map((vehicle) => (
                        <button
                            className="home-vehicle-card"
                            key={vehicle.src}
                            type="button"
                            onClick={() => onTabChange('fleet')}
                            aria-label={`${vehicle.alt}. Ver nuestra flota`}
                        >
                            <img src={vehicle.src} alt={vehicle.alt} />
                        </button>
                    ))}
                </div>
                <button
                    className="home-fleet-link"
                    type="button"
                    onClick={() => onTabChange('fleet')}
                >
                    Explorar todos los autos
                </button>
            </section>

            <section className="home-location" aria-labelledby="home-location-title">
                <div className="home-section-heading">
                    <span>Nuestra ubicación</span>
                    <h2 id="home-location-title">Dónde encontrarnos</h2>
                    <p>Encuentra nuestra sucursal y calcula la distancia desde tu dirección.</p>
                </div>
                <MapaSucursales />
            </section>
        </div>
    );
}
