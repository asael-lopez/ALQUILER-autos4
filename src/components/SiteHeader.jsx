import { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/useApp';
import { CarCard } from './CarCard';

const DEFAULT_ADMIN_EMAIL = 'admin@santalucia.com';

function getProfileStorageKey(email) {
    return `user_data_${btoa(unescape(encodeURIComponent(email || ''))).replace(/=/g, '')}`;
}

function loadProfile() {
    const email = localStorage.getItem('usuario')
        || sessionStorage.getItem('usuario')
        || DEFAULT_ADMIN_EMAIL;
    const profileKey = getProfileStorageKey(email);

    try {
        const users = JSON.parse(localStorage.getItem('usuarios_registrados') || '[]');
        const registeredUser = users.find((user) => user.email?.toLowerCase() === email.toLowerCase()) || {};
        const savedProfile = JSON.parse(localStorage.getItem(profileKey) || '{}');
        const mergedProfile = { ...registeredUser, ...savedProfile, email };
        const emailName = email.split('@')[0];

        return {
            ...mergedProfile,
            name: mergedProfile.name || (email === DEFAULT_ADMIN_EMAIL
                ? 'Admin'
                : emailName.charAt(0).toUpperCase() + emailName.slice(1)),
            phone: mergedProfile.phone || '',
            avatar: mergedProfile.avatar || '',
            role: mergedProfile.role || 'admin'
        };
    } catch {
        return { email, name: 'Admin', phone: '', avatar: '', role: 'admin' };
    }
}

function ProfileAvatar({ avatar, large = false }) {
    return (
        <span className={`site-profile-avatar${large ? ' is-large' : ''}`}>
            {avatar
                ? <img src={avatar} alt="" />
                : <i className="fas fa-user default-avatar-icon" aria-hidden="true" />}
        </span>
    );
}

export function SiteHeader({ activeTab, onTabChange }) {
    const {
        cars,
        reservations,
        currentUser,
        favorites,
        toggleFavorite,
        updateCurrentUser,
        logout: closeSession,
        language,
        setLanguage
    } = useApp();
    const profile = currentUser || loadProfile();
    const [profileOpen, setProfileOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const [profilePanel, setProfilePanel] = useState('');
    const [profileDraft, setProfileDraft] = useState({ name: '', email: '', phone: '' });
    const [avatarDraft, setAvatarDraft] = useState('');
    const [formError, setFormError] = useState('');
    const profileRef = useRef(null);

    useEffect(() => {
        const closeMenus = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setProfileOpen(false);
            }
        };
        const closeOnEscape = (event) => {
            if (event.key === 'Escape') {
                setProfileOpen(false);
                setMobileOpen(false);
                setProfileModalOpen(false);
                setProfilePanel('');
            }
        };

        document.addEventListener('pointerdown', closeMenus);
        document.addEventListener('keydown', closeOnEscape);
        return () => {
            document.removeEventListener('pointerdown', closeMenus);
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, []);

    const changeTab = (event, tab) => {
        event.preventDefault();
        onTabChange(tab);
        setMobileOpen(false);
        setProfileOpen(false);
    };

    const openProfileEditor = () => {
        setProfileDraft({
            name: profile.name,
            email: profile.email,
            phone: profile.phone
        });
        setAvatarDraft(profile.avatar);
        setFormError('');
        setProfileOpen(false);
        setProfileModalOpen(true);
    };

    const handleAvatarChange = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setFormError('Selecciona un archivo de imagen válido.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setFormError('La imagen debe pesar menos de 5 MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setAvatarDraft(String(reader.result || ''));
            setFormError('');
        };
        reader.onerror = () => setFormError('No se pudo cargar la imagen.');
        reader.readAsDataURL(file);
    };

    const saveProfile = (event) => {
        event.preventDefault();
        const name = profileDraft.name.trim();
        const phone = profileDraft.phone.trim();
        const letters = name.replace(/[^\p{L}]/gu, '').length;
        const phoneDigits = phone.replace(/\D/g, '');

        if (name.length < 3 || name.length > 80 || letters < 3) {
            setFormError('Escribe un nombre de entre 3 y 80 caracteres.');
            return;
        }
        if (phone && (
            phone.length > 25
            || !/^\+?[0-9().\s-]+$/.test(phone)
            || phoneDigits.length < 8
            || phoneDigits.length > 15
        )) {
            setFormError('Escribe un teléfono válido con entre 8 y 15 dígitos.');
            return;
        }

        const updatedProfile = { ...profile, name, phone, avatar: avatarDraft };
        try {
            localStorage.setItem(
                getProfileStorageKey(profile.email),
                JSON.stringify(updatedProfile)
            );

            const users = JSON.parse(localStorage.getItem('usuarios_registrados') || '[]');
            const userIndex = users.findIndex(
                (user) => user.email?.toLowerCase() === profile.email.toLowerCase()
            );
            if (userIndex !== -1) {
                users[userIndex] = { ...users[userIndex], name, phone, avatar: avatarDraft };
                localStorage.setItem('usuarios_registrados', JSON.stringify(users));
            }

            updateCurrentUser(updatedProfile);
            setProfileModalOpen(false);
            setFormError('');
        } catch {
            setFormError('No se pudieron guardar los cambios. Prueba con una foto más pequeña.');
        }
    };

    const logout = () => {
        closeSession();
        window.location.href = '/login-registro.html';
    };

    const toggleSavedVehicle = toggleFavorite;

    const profileName = profile.name === 'Admin'
        ? 'Admin...'
        : profile.name.length > 10
            ? `${profile.name.slice(0, 9)}...`
            : profile.name;

    const isAdmin = profile.role?.toLowerCase() === 'admin';
    const visibleReservations = isAdmin
        ? reservations
        : reservations.filter((item) => item.usuario?.toLowerCase() === profile.email.toLowerCase());
    const savedVehicles = favorites
        .map((id) => cars.find((car) => String(car.id) === id))
        .filter(Boolean);

    return (
        <>
            <header className="site-header">
                <nav className="site-navbar" aria-label="Navegación principal">
                    <a
                        href="/?tab=home"
                        className="site-brand"
                        aria-label="Santa Lucía Alquiler, inicio"
                        onClick={(event) => changeTab(event, 'home')}
                    >
                        <span className="site-brand-top">SANTA</span>
                        <span className="site-brand-main">LUCÍA</span>
                        <span className="site-brand-sub">ALQUILER</span>
                    </a>

                    <div className={`site-header-right${mobileOpen ? ' is-open' : ''}`}>
                        <div className="site-nav-links">
                            <a
                                href="/?tab=home"
                                className="site-nav-link"
                                aria-current={activeTab === 'home' ? 'page' : undefined}
                                onClick={(event) => changeTab(event, 'home')}
                            >
                                Inicio
                            </a>
                            <a
                                href="/?tab=fleet"
                                className="site-nav-link"
                                aria-current={activeTab === 'fleet' ? 'page' : undefined}
                                onClick={(event) => changeTab(event, 'fleet')}
                            >
                                Nuestra Flota
                            </a>
                            <a
                                href="/?tab=dashboard"
                                className="site-nav-link"
                                aria-current={activeTab === 'dashboard' ? 'page' : undefined}
                                onClick={(event) => changeTab(event, 'dashboard')}
                            >
                                Panel de control
                            </a>
                            <a
                                href="/?tab=reports"
                                className="site-nav-link"
                                aria-current={activeTab === 'reports' ? 'page' : undefined}
                                onClick={(event) => changeTab(event, 'reports')}
                            >
                                Reportes
                            </a>
                            <a
                                href="/?tab=location"
                                className="site-nav-link"
                                aria-current={activeTab === 'location' ? 'page' : undefined}
                                onClick={(event) => changeTab(event, 'location')}
                            >
                                Ubicación
                            </a>
                        </div>

                        <div className="site-profile-container" ref={profileRef}>
                            <button
                                type="button"
                                className="site-profile-toggle"
                                aria-haspopup="menu"
                                aria-expanded={profileOpen}
                                onClick={() => setProfileOpen((open) => !open)}
                            >
                                <ProfileAvatar avatar={profile.avatar} />
                                <span className="site-profile-name">{profileName}</span>
                            </button>

                            {profileOpen && (
                                <div className="site-profile-dropdown" role="menu">
                                    <div className="site-profile-summary">
                                        <ProfileAvatar avatar={profile.avatar} large />
                                        <div className="site-profile-summary-info">
                                            <strong>{profile.name}</strong>
                                            <span>{profile.email}</span>
                                            <button type="button" onClick={openProfileEditor}>Editar perfil</button>
                                        </div>
                                    </div>
                                    <div className="site-profile-menu">
                                        <button type="button" role="menuitem" onClick={openProfileEditor}>
                                            <i className="fas fa-user" aria-hidden="true" />
                                            Mi perfil
                                        </button>
                                        <button type="button" role="menuitem" onClick={() => { setProfilePanel('notifications'); setProfileOpen(false); }}>
                                            <i className="fas fa-bell" aria-hidden="true" />
                                            Notificaciones
                                        </button>
                                        <button type="button" role="menuitem" onClick={() => { setProfilePanel('saved'); setProfileOpen(false); }}>
                                            <i className="fas fa-bookmark" aria-hidden="true" />
                                            Guardado
                                        </button>
                                        <button type="button" role="menuitem" onClick={() => { setProfilePanel('history'); setProfileOpen(false); }}>
                                            <i className="fas fa-history" aria-hidden="true" />
                                            Historial
                                        </button>
                                    </div>
                                    <div className="site-language-selector" aria-label="Idioma">
                                        <span className="site-language-label">
                                            <i className="fas fa-globe" aria-hidden="true" />
                                            Idioma
                                        </span>
                                        <div className="site-language-options">
                                            <button
                                                type="button"
                                                aria-pressed={language === 'es'}
                                                onClick={() => setLanguage('es')}
                                            >
                                                Español
                                            </button>
                                            <button
                                                type="button"
                                                aria-pressed={language === 'en'}
                                                onClick={() => setLanguage('en')}
                                            >
                                                English
                                            </button>
                                        </div>
                                    </div>
                                    <button type="button" className="site-profile-logout" role="menuitem" onClick={logout}>
                                        Salir
                                    </button>
                                </div>
                            )}
                        </div>

                        <button
                            type="button"
                            className="site-mobile-toggle"
                            aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
                            aria-expanded={mobileOpen}
                            onClick={() => setMobileOpen((open) => !open)}
                        >
                            <i className={`fas ${mobileOpen ? 'fa-times' : 'fa-bars'}`} aria-hidden="true" />
                        </button>
                    </div>
                </nav>
            </header>

            {profileModalOpen && (
                <div className="site-modal-overlay" onMouseDown={(event) => {
                    if (event.target === event.currentTarget) setProfileModalOpen(false);
                }}>
                    <section className="site-profile-modal" role="dialog" aria-modal="true" aria-labelledby="site-profile-modal-title">
                        <button
                            type="button"
                            className="site-modal-close"
                            aria-label="Cerrar"
                            onClick={() => setProfileModalOpen(false)}
                        >
                            <i className="fas fa-times" aria-hidden="true" />
                        </button>
                        <h2 id="site-profile-modal-title">Editar perfil</h2>
                        <div className="site-avatar-editor">
                            <ProfileAvatar avatar={avatarDraft} large />
                            <label className="site-upload-button" htmlFor="site-avatar-input">
                                <i className="fas fa-camera" aria-hidden="true" />
                                Cambiar foto
                            </label>
                            <input
                                id="site-avatar-input"
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                            />
                        </div>
                        <form className="site-profile-form" onSubmit={saveProfile}>
                            <label>
                                Nombre completo
                                <input
                                    type="text"
                                    value={profileDraft.name}
                                    onChange={(event) => setProfileDraft({ ...profileDraft, name: event.target.value })}
                                    autoComplete="name"
                                />
                            </label>
                            <label>
                                Correo electrónico
                                <input type="email" value={profileDraft.email} readOnly />
                            </label>
                            <label>
                                Teléfono
                                <input
                                    type="tel"
                                    value={profileDraft.phone}
                                    onChange={(event) => setProfileDraft({ ...profileDraft, phone: event.target.value })}
                                    autoComplete="tel"
                                />
                            </label>
                            {formError && <p className="site-profile-error" role="alert">{formError}</p>}
                            <button type="submit" className="site-profile-save">Guardar cambios</button>
                        </form>
                    </section>
                </div>
            )}

            {profilePanel && (
                <div className="site-modal-overlay" onMouseDown={(event) => {
                    if (event.target === event.currentTarget) setProfilePanel('');
                }}>
                    <section className="site-profile-panel" role="dialog" aria-modal="true">
                        <button
                            type="button"
                            className="site-modal-close"
                            aria-label="Cerrar"
                            onClick={() => setProfilePanel('')}
                        >
                            <i className="fas fa-times" aria-hidden="true" />
                        </button>
                        <h2>
                            {profilePanel === 'notifications' ? 'Notificaciones'
                                : profilePanel === 'saved' ? 'Vehículos guardados'
                                    : 'Historial de reservas'}
                        </h2>
                        {profilePanel === 'saved' ? (
                            savedVehicles.length
                                ? savedVehicles.map((car) => (
                                    <CarCard
                                        key={car.id}
                                        car={car}
                                        variant="saved"
                                        isFavorite
                                        onToggleFavorite={toggleSavedVehicle}
                                    />
                                ))
                                : <p className="site-panel-empty">Aún no has guardado vehículos.</p>
                        ) : (
                            visibleReservations.length
                                ? visibleReservations.map((item) => (
                                    <article className="site-panel-item site-panel-reservation" key={item.id}>
                                        <strong>
                                            {profilePanel === 'notifications' ? `Reserva #${item.id} · ` : ''}
                                            {item.autoNombre || 'Vehículo'}
                                        </strong>
                                        <span>
                                            {item.fechaInicio || 'Fecha pendiente'}
                                            {item.fechaFin ? ` al ${item.fechaFin}` : ''}
                                            {item.estado ? ` · ${item.estado}` : ''}
                                        </span>
                                    </article>
                                ))
                                : <p className="site-panel-empty">No hay reservas para mostrar.</p>
                        )}
                    </section>
                </div>
            )}
        </>
    );
}
