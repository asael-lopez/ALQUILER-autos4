import { useState } from 'react';
import { useApp } from '../context/useApp.js';
import { translateText } from '../i18n.js';
import { authenticateUser, registerUser } from '../services/userStore.js';

const isValidEmail = (value) => (
    value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
);

const isValidPhone = (value) => {
    const digits = value.replace(/[^0-9]/g, '');
    return value.length <= 25 &&
        /^\+?[0-9().\s-]+$/.test(value) &&
        digits.length >= 8 &&
        digits.length <= 15;
};

export function Login({ onNavigate }) {
    const { language, setLanguage, login } = useApp();
    const [activeForm, setActiveForm] = useState('login');
    const [loginData, setLoginData] = useState({ email: '', password: '', rememberMe: false });
    const [registerData, setRegisterData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        passwordConfirmation: '',
        acceptTerms: false
    });
    const [showPasswords, setShowPasswords] = useState({});
    const [errors, setErrors] = useState({});
    const [generalError, setGeneralError] = useState('');
    const [success, setSuccess] = useState(null);

    const t = (text) => translateText(text, language);

    const changeForm = (form) => {
        setActiveForm(form);
        setErrors({});
        setGeneralError('');
        setSuccess(null);
    };

    const finishAuthentication = (user, registered = false) => {
        login(user);
        setSuccess({ name: user.name, role: user.role, registered });
        window.setTimeout(() => {
            onNavigate(user.role === 'admin' ? 'admin-dashboard' : 'home');
        }, registered ? 1100 : 900);
    };

    const submitLogin = (credentials) => {
        const email = credentials.email.trim();
        const nextErrors = {};
        if (!isValidEmail(email)) {
            nextErrors.email = 'Ingresa un correo electrónico con formato válido.';
        }
        if (credentials.password.trim().length < 6 || credentials.password.length > 128) {
            nextErrors.password = 'La contraseña debe tener entre 6 y 128 caracteres.';
        }
        setErrors(nextErrors);
        setGeneralError('');
        setSuccess(null);
        if (Object.keys(nextErrors).length) return;

        try {
            const result = authenticateUser(email, credentials.password);
            if (!result.ok) {
                setGeneralError(result.message);
                return;
            }
            finishAuthentication(result.user);
        } catch {
            setGeneralError('No se pudo completar el inicio de sesión. Inténtalo de nuevo.');
        }
    };

    const handleLoginSubmit = (event) => {
        event.preventDefault();
        submitLogin(loginData);
    };

    const handleRegisterSubmit = (event) => {
        event.preventDefault();
        const name = registerData.name.trim();
        const email = registerData.email.trim();
        const phone = registerData.phone.trim();
        const password = registerData.password;
        const confirmation = registerData.passwordConfirmation;
        const nextErrors = {};

        if (name.length < 3 || name.length > 80 || name.replace(/[^\p{L}]/gu, '').length < 3) {
            nextErrors.name = 'Ingresa tu nombre completo (3 a 80 caracteres y al menos 3 letras).';
        }
        if (!isValidEmail(email)) {
            nextErrors.email = 'Ingresa un correo válido (ej: usuario@dominio.com).';
        }
        if (!isValidPhone(phone)) {
            nextErrors.phone = 'Ingresa un teléfono válido (8 a 15 dígitos).';
        }
        if (!password.trim() || password.length < 6 || password.length > 128) {
            nextErrors.password = 'La contraseña debe tener entre 6 y 128 caracteres.';
        }
        if (confirmation !== password || !confirmation || confirmation.length > 128) {
            nextErrors.passwordConfirmation = 'Las contraseñas no coinciden.';
        }
        if (!registerData.acceptTerms) {
            nextErrors.acceptTerms = 'Debes aceptar los términos y condiciones.';
        }

        setErrors(nextErrors);
        setGeneralError('');
        setSuccess(null);
        if (Object.keys(nextErrors).length) return;

        try {
            const result = registerUser({ name, email, phone, password });
            if (!result.ok) {
                setGeneralError(result.message);
                return;
            }
            finishAuthentication(result.user, true);
        } catch {
            setGeneralError('No se pudieron guardar los datos. Inténtalo de nuevo.');
        }
    };

    const togglePassword = (field) => {
        setShowPasswords((previous) => ({ ...previous, [field]: !previous[field] }));
    };

    const renderFieldError = (field) => errors[field] && (
        <div className="field-error" role="alert">{t(errors[field])}</div>
    );

    return (
        <main className="auth-page wrap">
            <aside className="stage" aria-label={t('Galería e identidad Santa Lucía')}>
                <div className="carousel">
                    <div className="carousel-track">
                        {[1, 2, 3, 4, 5].map((slide) => (
                            <div
                                key={slide}
                                className={`carousel-slide carousel-slide-${slide}${slide === 1 ? ' active' : ''}`}
                            />
                        ))}
                    </div>
                    <div className="carousel-overlay" />
                </div>
                <header className="stage-content">
                    <div className="brand-mark">
                        <span className="top">SANTA</span>
                        <span className="bottom">LUCÍA</span>
                        <span className="tag">{t('ALQUILER')}</span>
                    </div>
                    <div className="stage-copy">
                        <div className="eyebrow">{t('NUESTRA SUCURSAL')}</div>
                        <h1>{t('Tu próximo viaje empieza con las llaves en la mano.')}</h1>
                        <p>{t('Reserva compactos, SUV, híbridos y furgonetas en minutos. Gestiona tus reservas y tu historial desde una sola cuenta.')}</p>
                        <div className="stat-row">
                            <div><strong>100%</strong><span>{t('Garantía Flota')}</span></div>
                            <div><strong>24/7</strong><span>{t('Asistencia Vial')}</span></div>
                            <div>
                                <strong>4.9 <i className="fas fa-star" aria-hidden="true" /></strong>
                                <span>{t('Clientes Satisfechos')}</span>
                            </div>
                        </div>
                    </div>
                </header>
            </aside>

            <section className="panel-side" aria-label={t('Formulario de inicio de sesión y registro')}>
                <div className="card-auth">
                    <nav className="back-home-bar" aria-label={t('Navegación de retorno')}>
                        <a
                            href="/?tab=home"
                            className="back-home-link"
                            title={t('Regresar a la página principal')}
                            onClick={(event) => {
                                event.preventDefault();
                                onNavigate('home');
                            }}
                        >
                            <i className="fas fa-arrow-left" aria-hidden="true" />
                            <span>{t('Volver al inicio')}</span>
                        </a>
                        <div className="auth-language-toggle" aria-label={t('Idioma')}>
                            <button
                                type="button"
                                aria-pressed={language === 'es'}
                                onClick={() => setLanguage('es')}
                            >
                                {t('Español')}
                            </button>
                            <button
                                type="button"
                                aria-pressed={language === 'en'}
                                onClick={() => setLanguage('en')}
                            >
                                {t('English')}
                            </button>
                        </div>
                    </nav>

                    <div className="brand-mark brand-mobile">
                        <span className="top">SANTA</span>
                        <span className="bottom">LUCÍA</span>
                        <span className="tag">{t('ALQUILER')}</span>
                    </div>

                    <div className="tabs" role="tablist" aria-label={t('Acceso a la cuenta')}>
                        <button
                            type="button"
                            id="tabLogin"
                            className={activeForm === 'login' ? 'active' : ''}
                            role="tab"
                            aria-selected={activeForm === 'login'}
                            aria-controls="loginForm"
                            onClick={() => changeForm('login')}
                        >
                            {t('Iniciar sesión')}
                        </button>
                        <button
                            type="button"
                            id="tabRegister"
                            className={activeForm === 'register' ? 'active' : ''}
                            role="tab"
                            aria-selected={activeForm === 'register'}
                            aria-controls="registerForm"
                            onClick={() => changeForm('register')}
                        >
                            {t('Crear cuenta')}
                        </button>
                    </div>

                    {generalError && <div className="global-auth-error is-visible" role="alert">{t(generalError)}</div>}

                    {success ? (
                        <div className="success-box is-visible" role="status" aria-live="polite">
                            <div className="icon"><i className="fas fa-check" aria-hidden="true" /></div>
                            <h3>
                                {success.registered
                                    ? t('¡Cuenta creada con éxito!')
                                    : <>{t('¡Hola,')} {success.name}!</>}
                            </h3>
                            <p>
                                {success.registered
                                    ? <>{t('Bienvenido a Santa Lucía,')} {success.name}. {t('Tu cuenta de usuario está lista. Redirigiendo...')}</>
                                    : <>{t('Has iniciado sesión correctamente con rol:')} {t(success.role.toUpperCase())}. {t('Redirigiendo...')}</>}
                            </p>
                        </div>
                    ) : (
                        <>
                            <form
                                id="loginForm"
                                className={activeForm === 'login' ? '' : 'hidden'}
                                noValidate
                                onSubmit={handleLoginSubmit}
                            >
                                <h2 className="form-title">{t('Iniciar sesión')}</h2>
                                <p className="form-sub">{t('Accede para gestionar tus reservas y tu flota.')}</p>

                                <div className="mb-3">
                                    <label className="form-label" htmlFor="loginEmail">{t('Correo electrónico')}</label>
                                    <input
                                        type="email"
                                        className={`form-control${errors.email ? ' is-invalid' : ''}`}
                                        id="loginEmail"
                                        autoComplete="email"
                                        placeholder={t('tucorreo@ejemplo.com')}
                                        maxLength={254}
                                        required
                                        value={loginData.email}
                                        aria-invalid={Boolean(errors.email)}
                                        onChange={(event) => setLoginData({ ...loginData, email: event.target.value })}
                                    />
                                    {renderFieldError('email')}
                                </div>

                                <div className="mb-2">
                                    <label className="form-label" htmlFor="loginPass">{t('Contraseña')}</label>
                                    <div className={`pass-wrap${errors.password ? ' is-invalid' : ''}`}>
                                        <input
                                            type={showPasswords.login ? 'text' : 'password'}
                                            className="form-control"
                                            id="loginPass"
                                            autoComplete="current-password"
                                            placeholder={t('••••••••')}
                                            minLength={6}
                                            maxLength={128}
                                            required
                                            value={loginData.password}
                                            aria-invalid={Boolean(errors.password)}
                                            onChange={(event) => setLoginData({ ...loginData, password: event.target.value })}
                                        />
                                        <button type="button" className="pass-toggle" onClick={() => togglePassword('login')}>
                                            {t(showPasswords.login ? 'Ocultar' : 'Mostrar')}
                                        </button>
                                        {renderFieldError('password')}
                                    </div>
                                </div>

                                <div className="row-between">
                                    <label className="form-check">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            checked={loginData.rememberMe}
                                            onChange={(event) => setLoginData({ ...loginData, rememberMe: event.target.checked })}
                                        />
                                        <span className="form-check-label">{t('Recordarme')}</span>
                                    </label>
                                    <button
                                        type="button"
                                        className="forgot-password-link"
                                        onClick={() => window.alert(t('Para recuperar tu acceso, contacta a soporte@santalucia.com o utiliza las cuentas de prueba.'))}
                                    >
                                        {t('¿Olvidaste tu contraseña?')}
                                    </button>
                                </div>

                                <button type="submit" className="btn-brand">{t('Iniciar sesión')}</button>
                                <p className="switch-line">
                                    {t('¿No tienes cuenta?')}{' '}
                                    <button type="button" onClick={() => changeForm('register')}>{t('Regístrate')}</button>
                                </p>

                                <div className="demo-accounts">
                                    <div className="demo-accounts-title">
                                        <i className="fas fa-key text-danger" aria-hidden="true" />
                                        {t('Acceso de prueba (un clic para iniciar sesión):')}
                                    </div>
                                    <div className="demo-chips">
                                        <button
                                            type="button"
                                            className="demo-chip"
                                            onClick={() => {
                                                const credentials = { email: 'admin@santalucia.com', password: 'admin123' };
                                                setLoginData({ ...credentials, rememberMe: loginData.rememberMe });
                                                submitLogin(credentials);
                                            }}
                                        >
                                            {t('Admin (admin@santalucia.com)')}
                                        </button>
                                        <button
                                            type="button"
                                            className="demo-chip"
                                            onClick={() => {
                                                const credentials = { email: 'usuario@santalucia.com', password: 'user123' };
                                                setLoginData({ ...credentials, rememberMe: loginData.rememberMe });
                                                submitLogin(credentials);
                                            }}
                                        >
                                            {t('Usuario (usuario@santalucia.com)')}
                                        </button>
                                    </div>
                                </div>
                            </form>

                            <form
                                id="registerForm"
                                className={activeForm === 'register' ? '' : 'hidden'}
                                noValidate
                                onSubmit={handleRegisterSubmit}
                            >
                                <h2 className="form-title">{t('Crear cuenta')}</h2>
                                <p className="form-sub">{t('Regístrate para reservar vehículos o gestionar el sistema.')}</p>

                                <div className="mb-3">
                                    <label className="form-label" htmlFor="regName">{t('Nombre completo')}</label>
                                    <input
                                        type="text"
                                        className={`form-control${errors.name ? ' is-invalid' : ''}`}
                                        id="regName"
                                        autoComplete="name"
                                        placeholder={t('Tu Nombre y Apellido')}
                                        minLength={3}
                                        maxLength={80}
                                        required
                                        value={registerData.name}
                                        aria-invalid={Boolean(errors.name)}
                                        onChange={(event) => setRegisterData({ ...registerData, name: event.target.value })}
                                    />
                                    {renderFieldError('name')}
                                </div>

                                <div className="mb-3">
                                    <label className="form-label" htmlFor="regEmail">{t('Correo electrónico')}</label>
                                    <input
                                        type="email"
                                        className={`form-control${errors.email ? ' is-invalid' : ''}`}
                                        id="regEmail"
                                        autoComplete="email"
                                        placeholder={t('tucorreo@ejemplo.com')}
                                        maxLength={254}
                                        required
                                        value={registerData.email}
                                        aria-invalid={Boolean(errors.email)}
                                        onChange={(event) => setRegisterData({ ...registerData, email: event.target.value })}
                                    />
                                    {renderFieldError('email')}
                                </div>

                                <div className="mb-3">
                                    <label className="form-label" htmlFor="regPhone">{t('Teléfono')}</label>
                                    <input
                                        type="tel"
                                        className={`form-control${errors.phone ? ' is-invalid' : ''}`}
                                        id="regPhone"
                                        autoComplete="tel"
                                        placeholder={t('00000000 o +34 600...')}
                                        maxLength={25}
                                        required
                                        value={registerData.phone}
                                        aria-invalid={Boolean(errors.phone)}
                                        onChange={(event) => setRegisterData({ ...registerData, phone: event.target.value })}
                                    />
                                    {renderFieldError('phone')}
                                </div>

                                <div className="mb-2">
                                    <label className="form-label" htmlFor="regPass">{t('Contraseña')}</label>
                                    <div className={`pass-wrap${errors.password ? ' is-invalid' : ''}`}>
                                        <input
                                            type={showPasswords.register ? 'text' : 'password'}
                                            className="form-control"
                                            id="regPass"
                                            autoComplete="new-password"
                                            placeholder={t('6 a 128 caracteres')}
                                            minLength={6}
                                            maxLength={128}
                                            required
                                            value={registerData.password}
                                            aria-invalid={Boolean(errors.password)}
                                            onChange={(event) => setRegisterData({ ...registerData, password: event.target.value })}
                                        />
                                        <button type="button" className="pass-toggle" onClick={() => togglePassword('register')}>
                                            {t(showPasswords.register ? 'Ocultar' : 'Mostrar')}
                                        </button>
                                        {renderFieldError('password')}
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label" htmlFor="regPass2">{t('Confirmar contraseña')}</label>
                                    <div className={`pass-wrap${errors.passwordConfirmation ? ' is-invalid' : ''}`}>
                                        <input
                                            type={showPasswords.confirmation ? 'text' : 'password'}
                                            className="form-control"
                                            id="regPass2"
                                            autoComplete="new-password"
                                            placeholder={t('Repite tu contraseña')}
                                            maxLength={128}
                                            required
                                            value={registerData.passwordConfirmation}
                                            aria-invalid={Boolean(errors.passwordConfirmation)}
                                            onChange={(event) => setRegisterData({ ...registerData, passwordConfirmation: event.target.value })}
                                        />
                                        <button type="button" className="pass-toggle" onClick={() => togglePassword('confirmation')}>
                                            {t(showPasswords.confirmation ? 'Ocultar' : 'Mostrar')}
                                        </button>
                                        {renderFieldError('passwordConfirmation')}
                                    </div>
                                </div>

                                <div className="form-check mb-3">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="acceptTerms"
                                        required
                                        checked={registerData.acceptTerms}
                                        aria-invalid={Boolean(errors.acceptTerms)}
                                        onChange={(event) => setRegisterData({ ...registerData, acceptTerms: event.target.checked })}
                                    />
                                    <label className="form-check-label" htmlFor="acceptTerms">
                                        {t('Acepto los términos y la política de privacidad')}
                                    </label>
                                    {errors.acceptTerms && <div className="terms-error is-visible" role="alert">{t(errors.acceptTerms)}</div>}
                                </div>

                                <button type="submit" className="btn-brand">{t('Crear cuenta')}</button>
                                <p className="switch-line">
                                    {t('¿Ya tienes cuenta?')}{' '}
                                    <button type="button" onClick={() => changeForm('login')}>{t('Inicia sesión')}</button>
                                </p>
                            </form>
                        </>
                    )}
                </div>
            </section>
        </main>
    );
}
