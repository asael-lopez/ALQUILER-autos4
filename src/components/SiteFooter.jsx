import './SiteFooter.css';

const quickLinks = [
    { label: 'Inicio', href: '/?tab=home', tab: 'home' },
    { label: 'Nuestra Flota', href: '/?tab=fleet', tab: 'fleet' },
    { label: 'Oficinas', href: '/index.html' },
    { label: 'Quiénes Somos', href: '/index.html' },
    { label: 'Nuestro Equipo', href: '/index.html' },
    { label: 'Ofertas', href: '/?tab=fleet', tab: 'fleet' }
];

const services = [
    'Alquiler Largo Plazo',
    'Corporativos',
    'Entrega a Domicilio',
    'Recogida Aeropuerto',
    'Seguros',
    'Asistencia 24/7'
];

const socialLinks = [
    { label: 'Facebook', icon: 'fab fa-facebook-f', href: '#' },
    { label: 'Instagram', icon: 'fab fa-instagram', href: '#' },
    {
        label: 'TikTok',
        icon: 'fab fa-tiktok',
        href: 'https://www.tiktok.com/@alquilersantalucia?is_from_webapp=1&sender_device=pc'
    },
    { label: 'X', icon: 'fab fa-x-twitter', href: '#' },
    { label: 'YouTube', icon: 'fab fa-youtube', href: '#' },
    { label: 'WhatsApp', icon: 'fab fa-whatsapp', href: '#' }
];

export function SiteFooter({ onTabChange }) {
    const handleQuickLink = (event, tab) => {
        if (!tab) return;
        event.preventDefault();
        onTabChange(tab);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <footer className="site-footer">
            <div className="site-footer-main">
                <section className="site-footer-column site-footer-brand">
                    <a
                        className="site-footer-logo"
                        href="/?tab=home"
                        aria-label="Santa Lucía Alquiler"
                        onClick={(event) => handleQuickLink(event, 'home')}
                    >
                        <span className="site-footer-logo-top">SANTA</span>
                        <span className="site-footer-logo-main">LUCÍA</span>
                        <span className="site-footer-logo-sub">ALQUILER</span>
                    </a>
                    <p className="site-footer-tagline">
                        Alquiler de vehículos con la mejor flota y atención personalizada.
                        Muévete con libertad, estilo y confianza.
                    </p>
                    <div className="site-footer-social">
                        {socialLinks.map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                title={link.label}
                                aria-label={link.label}
                                target={link.label === 'TikTok' ? '_blank' : undefined}
                                rel={link.label === 'TikTok' ? 'noopener noreferrer' : undefined}
                                onClick={link.href === '#' ? (event) => event.preventDefault() : undefined}
                            >
                                <i className={link.icon} aria-hidden="true" />
                            </a>
                        ))}
                    </div>
                </section>

                <section className="site-footer-column">
                    <h2 className="site-footer-title">Enlaces Rápidos</h2>
                    <ul className="site-footer-links">
                        {quickLinks.map((link) => (
                            <li key={link.label}>
                                <a
                                    href={link.href}
                                    onClick={(event) => handleQuickLink(event, link.tab)}
                                >
                                    {link.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="site-footer-column">
                    <h2 className="site-footer-title">Servicios</h2>
                    <ul className="site-footer-links">
                        {services.map((service) => (
                            <li key={service}><span>{service}</span></li>
                        ))}
                    </ul>
                </section>

                <section className="site-footer-column">
                    <h2 className="site-footer-title">Contacto</h2>
                    <ul className="site-footer-contact">
                        <li>
                            <i className="fas fa-map-marker-alt" aria-hidden="true" />
                            <span>Av. Principal 123, Centro, Santa Lucia, Soyapango.</span>
                        </li>
                        <li>
                            <i className="fas fa-phone" aria-hidden="true" />
                            <a href="tel:+50375772971">+503 7577-2971</a>
                        </li>
                        <li>
                            <i className="fas fa-envelope" aria-hidden="true" />
                            <a href="mailto:info@santalucia.com">info@santalucia.com</a>
                        </li>
                        <li>
                            <i className="far fa-clock" aria-hidden="true" />
                            <span>Lun-Sáb: 08:00 - 20:00</span>
                        </li>
                    </ul>
                </section>
            </div>

            <div className="site-footer-bottom">
                <div className="site-footer-bottom-inner">
                    <p>
                        &copy; {new Date().getFullYear()} SantaLucía Alquiler.
                        Todos los derechos reservados.
                    </p>
                    <ul>
                        <li><a href="#" onClick={(event) => event.preventDefault()}>Privacidad</a></li>
                        <li><a href="#" onClick={(event) => event.preventDefault()}>Términos y Condiciones</a></li>
                        <li><a href="#" onClick={(event) => event.preventDefault()}>Política de Cookies</a></li>
                    </ul>
                </div>
            </div>
        </footer>
    );
}
