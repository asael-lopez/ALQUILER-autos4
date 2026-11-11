// Se ejecuta cuando todo el DOM está cargado
document.addEventListener('DOMContentLoaded', function () {

    // Tiempo entre slides del carrusel (3s)
    const CAROUSEL_INTERVAL = 3000;

    // Elementos del carrusel
    const hero = document.querySelector('.hero');                     
    const slides = document.querySelectorAll('.hero-slide');          
    const dots = document.querySelectorAll('.carousel-dot');          
    const totalSlides = slides.length;                                

    // Solo arranca el carrusel si hay slides y dots
    if (totalSlides > 0 && dots.length > 0) {

        let currentSlideIndex = 0;   // slide actual
        let carouselTimer = null;    // timer del autoplay

        // Cambia a un slide concreto
        function goToSlide(newIndex) {
            slides[currentSlideIndex].classList.remove('active');
            dots[currentSlideIndex].classList.remove('active');

            currentSlideIndex = newIndex;

            slides[currentSlideIndex].classList.add('active');
            dots[currentSlideIndex].classList.add('active');
        }

        // Pasa al siguiente slide (con loop)
        function nextSlide() {
            const nextIndex = (currentSlideIndex + 1) % totalSlides;
            goToSlide(nextIndex);
        }

        // Arranca el autoplay
        function startCarousel() {
            if (carouselTimer !== null) {
                clearInterval(carouselTimer);
            }
            carouselTimer = setInterval(nextSlide, CAROUSEL_INTERVAL);
        }

        // Para el autoplay
        function stopCarousel() {
            clearInterval(carouselTimer);
            carouselTimer = null;
        }

        dots.forEach(function (dot) {
            dot.addEventListener('click', function () {
                const targetSlide = +dot.getAttribute('data-slide');

                stopCarousel();
                goToSlide(targetSlide);
                startCarousel();
            });
        });

        if (hero) {
            hero.addEventListener('mouseenter', function () {
                stopCarousel();
            });

            hero.addEventListener('mouseleave', function () {
                startCarousel();
            });
        }

        startCarousel();

    }

    // ========== Menú móvil (hamburguesa) ==========
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', function () {
            mobileMenu.classList.toggle('open');

            const icon = mobileMenuBtn.querySelector('i');
            const isOpen = mobileMenu.classList.contains('open');
            mobileMenuBtn.setAttribute('aria-expanded', String(isOpen));
            mobileMenuBtn.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');

            if (isOpen) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
}
    // ========== Dropdowns del nav (Empresa, Idiomas, etc) ==========
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');

    dropdownToggles.forEach(function (toggle) {
        toggle.addEventListener('click', function (e) {
            const dropdown = toggle.closest('.dropdown');
            const isActive = dropdown.classList.contains('active');

            document.querySelectorAll('.dropdown').forEach(function (d) {
                d.classList.remove('active');
            });

            if (!isActive) {
                e.preventDefault();
                dropdown.classList.add('active');
            }
        });
    });

    document.addEventListener('click', function (e) {
        if (!e.target.closest('.dropdown')) {
            document.querySelectorAll('.dropdown').forEach(function (d) {
                d.classList.remove('active');
            });
        }
    });

    // ========== Botones de categorías (si existen) ==========
    const categoryBtns = document.querySelectorAll('.category-btn');

    if (categoryBtns.length) {
        categoryBtns.forEach(function (btn) {
            btn.addEventListener('click', function () {
                categoryBtns.forEach(function (b) {
                    b.classList.remove('active');
                });

                btn.classList.add('active');

                const category = btn.getAttribute('data-category');
                console.log('Categoría seleccionada:', category);
            });
        });
    }

    // Selector de ordenación
    const sortSelect = document.getElementById('sortSelect');

    if (sortSelect) {
        sortSelect.addEventListener('change', function () {
            console.log('Orden seleccionado:', sortSelect.value);
        });
    }

    // ========== Detalles de la flota ==========
    const fleetDetailsOverlay = document.getElementById('fleetDetailsOverlay');
    const fleetDetailsClose = document.getElementById('fleetDetailsClose');
    const fleetDetailsImage = document.getElementById('fleetDetailsImage');
    const fleetDetailsTitle = document.getElementById('fleetDetailsTitle');
    const fleetDetailsExample = document.getElementById('fleetDetailsExample');
    const fleetDetailsSpecs = document.getElementById('fleetDetailsSpecs');
    const fleetDetailsButtons = document.querySelectorAll('.cat-card-details-btn');

    function closeFleetDetails() {
        if (!fleetDetailsOverlay) return;
        fleetDetailsOverlay.classList.remove('open');
        fleetDetailsOverlay.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('fleet-modal-open');
    }

    if (fleetDetailsOverlay && fleetDetailsButtons.length) {
        fleetDetailsButtons.forEach(function (button) {
            button.addEventListener('click', function () {
                const card = button.closest('.rent-category-card');
                const title = card.querySelector('.cat-card-title');
                const example = card.querySelector('.cat-card-example');
                const image = card.querySelector('.cat-card-image');
                const specs = card.querySelectorAll('.cat-spec-item');

                fleetDetailsTitle.textContent = title ? title.textContent.trim() : 'Vehículo';
                fleetDetailsExample.textContent = example ? example.textContent.trim() : '';
                fleetDetailsImage.src = image ? image.src : '';
                fleetDetailsImage.alt = image ? image.alt : fleetDetailsTitle.textContent;
                fleetDetailsSpecs.innerHTML = '';

                specs.forEach(function (spec) {
                    const item = document.createElement('li');
                    item.innerHTML = spec.innerHTML;
                    fleetDetailsSpecs.appendChild(item);
                });

                fleetDetailsOverlay.classList.add('open');
                fleetDetailsOverlay.setAttribute('aria-hidden', 'false');
                document.body.classList.add('fleet-modal-open');
                fleetDetailsClose.focus();
            });
        });

        fleetDetailsClose.addEventListener('click', closeFleetDetails);
        fleetDetailsOverlay.addEventListener('click', function (event) {
            if (event.target === fleetDetailsOverlay) closeFleetDetails();
        });
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') closeFleetDetails();
        });
    }

    // ========== Widget flotante (derecha) ==========
    const floatingWidget = document.getElementById('floatingWidget');
    const widgetToggle = document.getElementById('widgetToggle');

    if (floatingWidget && widgetToggle) {
        widgetToggle.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            floatingWidget.classList.toggle('open');
        });

        document.addEventListener('click', function (e) {
            if (!floatingWidget.contains(e.target)) {
                floatingWidget.classList.remove('open');
            }
        });
    }

    const widgetItems = document.querySelectorAll('.widget-item');

    widgetItems.forEach(function (item) {
        item.addEventListener('click', function (e) {
            e.preventDefault();

            const title = item.getAttribute('title');
            console.log('Widget clickeado:', title);

            if (title === 'Refrescar' || title === 'Refresh') {
                location.reload();
            } else if (title === 'Teléfono') {
                window.location.href = 'tel:+34900123456';
            } else if (title === 'WhatsApp') {
                window.open('https://wa.me/34600000000', '_blank');
            } else if (title === 'TikTok') {
                window.open('https://www.tiktok.com/@alquilersantalucia?is_from_webapp=1&sender_device=pc', '_blank', 'noopener,noreferrer');
            }
        });
    });

    // ========== Multi-idioma (ES / EN) ==========
    const translations = {
        es: {
            pageTitle: "Alquiler SantaLucía - Elige tu Vehículo",
            pageTitleAutos: "Alquiler SantaLucía - Carros de Renta",
            pageTitleLogin: "SantaLucía Alquiler - Mi Cuenta",
            logoSub: "ALQUILER",
            home: "Inicio",
            ourFleet: "Nuestra Flota",
            offices: "Oficinas",
            company: "Empresa",
            whoWeAre: "Quiénes Somos",
            ourTeam: "Nuestro Equipo",
            workWithUs: "Trabaja con Nosotros",
            languages: "Idiomas",
            myAccount: "Mi Cuenta",
            fleet: "FLOTA",
            chooseVehicle: "ELIGE TU VEHÍCULO",
            rentalCars: "CARROS DE RENTA",
            availableFleet: "NUESTRA FLOTA DISPONIBLE",
            allVehicles: "Todos los Vehículos",
            ac: "Aire Acondicionado",
            automatic: "Automático",
            manual: "Manual",
            compact: "Compacto",
            hybrid: "Híbrido",
            intermediate: "Intermedio",
            luxury: "Lujo",
            mini: "Mini / Económico",
            minivan: "Minivan",
            passenger: "Furgoneta Pasajeros",
            station: "Familiar",
            suv: "SUV",
            available: "DISPONIBLE",
            notAvailable: "NO DISPONIBLE",
            categoryCompact: "Compacto",
            categorySUV: "SUV",
            categoryLuxury: "Lujo",
            categoryMini: "Económico",
            categoryMinivan: "Minivan",
            categoryIntermediate: "Intermedio",
            categoryStation: "Familiar",
            categoryHybrid: "Híbrido",
            categoryPassenger: "Furgoneta",
            passengers4: "4 Pasajeros",
            passengers5: "5 Pasajeros",
            passengers7: "7 Pasajeros",
            passengers9: "9 Pasajeros",
            acYes: "A/C",
            automaticYes: "Automático",
            manualYes: "Manual",
            luggage1: "1 Maleta",
            luggage2: "2 Maletas",
            luggage3: "3 Maletas",
            luggage4: "4 Maletas",
            luggage5: "5 Maletas",
            luggage6: "6 Maletas",
            luggage8: "8 Maletas",
            perDay: "/día",
            whatsappBtn: "WhatsApp",
            sortBy: "Ordenar por:",
            sortFeatured: "Destacados",
            sortPriceLow: "Precio: Menor a Mayor",
            sortPriceHigh: "Precio: Mayor a Menor",
            sortNameAZ: "Nombre A-Z",
            sortNameZA: "Nombre Z-A",
            rentalOptionsTitle: "Opciones de alquiler de autos",
            makeReservation: "Realizar una reserva",
            filters: "Filtros",
            vehicleType: "Tipo de vehículo",
            cars: "Autos",
            trucks: "Camiones",
            vans: "Vans",
            suvFull: "Vehículos utilitarios deportivos (SUV)",
            passengers: "PASAJEROS",
            transmission: "Transmisión",
            priceRange: "Rango de precios",
            vehicleCategoryOptions: "94 opciones de categoría de vehículo",
            country: "PAÍS:",
            countryName: "ESPAÑA",
            carsCategory: "Autos",
            catCompact: "Compacto",
            catCompactExample: "Nissan Versa o similar",
            catConvertible: "Descapotable compacto",
            catConvertibleExample: "Mazda Miata RF o similar",
            catSpecialCompact: "Compacto especial",
            catSpecialCompactExample: "Fiat 500 o similar",
            catEconomy: "Económico",
            catEconomyExample: "Hyundai i10 o similar",
            catMidsizeSUV: "SUV Mediano",
            catMidsizeSUVExample: "Kia Sportage o similar",
            catLuxuryCategory: "Lujo",
            catLuxuryExample: "BMW Serie 3 o similar",
            viewDetails: "Ver detalles",
            imageNotAvailable: "Imagen no disponible",
            welcomeBack: "¡Bienvenido de nuevo!",
            loginSubtitle: "Accede a tu cuenta para gestionar tus reservas",
            loginTab: "Iniciar Sesión",
            registerTab: "Crear Cuenta",
            emailLabel: "Correo electrónico",
            passwordLabel: "Contraseña",
            fullNameLabel: "Nombre completo",
            phoneLabel: "Teléfono",
            rememberMe: "Recordarme",
            forgotPassword: "¿Olvidaste tu contraseña?",
            loginBtn: "Iniciar Sesión",
            orLoginWith: "O inicia sesión con",
            acceptTerms: "Acepto los términos y condiciones",
            registerBtn: "Crear Cuenta",
            footerTagline: "Alquiler de vehículos con la mejor flota y atención personalizada. Muévete con libertad, estilo y confianza.",
            footerQuickLinks: "Enlaces Rápidos",
            footerOffers: "Ofertas",
            footerServices: "Servicios",
            footerLongTerm: "Alquiler Largo Plazo",
            footerCorporate: "Corporativos",
            footerDelivery: "Entrega a Domicilio",
            footerAirport: "Recogida Aeropuerto",
            footerInsurance: "Seguros",
            footerAssistance: "Asistencia 24/7",
            footerContact: "Contacto",
            footerAddress: "Av. Principal 123, Centro, Madrid, España",
            footerSchedule: "Lun-Sáb: 08:00 - 20:00",
            footerPayWith: "Paga con:",
            footerCopy: "SantaLucía Alquiler. Todos los derechos reservados.",
            footerPrivacy: "Privacidad",
            footerTerms: "Términos y Condiciones",
            footerCookies: "Política de Cookies"
        },
        en: {
            pageTitle: "SantaLucía Rental - Choose Your Vehicle",
            pageTitleAutos: "SantaLucía Rental - Rental Cars",
            pageTitleLogin: "SantaLucía Rental - My Account",
            logoSub: "RENTAL",
            home: "Home",
            ourFleet: "Our Fleet",
            offices: "Offices",
            company: "Company",
            whoWeAre: "Who We Are",
            ourTeam: "Our Team",
            workWithUs: "Work With Us",
            languages: "Languages",
            myAccount: "My Account",
            fleet: "FLEET",
            chooseVehicle: "CHOOSE YOUR VEHICLE",
            rentalCars: "RENTAL CARS",
            availableFleet: "OUR AVAILABLE FLEET",
            allVehicles: "All Vehicles",
            ac: "Air Conditioning",
            automatic: "Automatic",
            manual: "Manual",
            compact: "Compact",
            hybrid: "Hybrid",
            intermediate: "Intermediate",
            luxury: "Luxury",
            mini: "Mini / Economy",
            minivan: "Minivan",
            passenger: "Passenger Van",
            station: "Station Wagon",
            suv: "SUV",
            available: "AVAILABLE",
            notAvailable: "NOT AVAILABLE",
            categoryCompact: "Compact",
            categorySUV: "SUV",
            categoryLuxury: "Luxury",
            categoryMini: "Economy",
            categoryMinivan: "Minivan",
            categoryIntermediate: "Intermediate",
            categoryStation: "Station Wagon",
            categoryHybrid: "Hybrid",
            categoryPassenger: "Van",
            passengers4: "4 Passengers",
            passengers5: "5 Passengers",
            passengers7: "7 Passengers",
            passengers9: "9 Passengers",
            acYes: "A/C",
            automaticYes: "Automatic",
            manualYes: "Manual",
            luggage1: "1 Bag",
            luggage2: "2 Bags",
            luggage3: "3 Bags",
            luggage4: "4 Bags",
            luggage5: "5 Bags",
            luggage6: "6 Bags",
            luggage8: "8 Bags",
            perDay: "/day",
            whatsappBtn: "WhatsApp",
            sortBy: "Sort by:",
            sortFeatured: "Featured",
            sortPriceLow: "Price: Low to High",
            sortPriceHigh: "Price: High to Low",
            sortNameAZ: "Name A-Z",
            sortNameZA: "Name Z-A",
            rentalOptionsTitle: "Car rental options",
            makeReservation: "Make a Reservation",
            filters: "Filters",
            vehicleType: "Vehicle type",
            cars: "Cars",
            trucks: "Trucks",
            vans: "Vans",
            suvFull: "Sport utility vehicles (SUV)",
            passengers: "PASSENGERS",
            transmission: "Transmission",
            priceRange: "Price range",
            vehicleCategoryOptions: "94 vehicle category options",
            country: "COUNTRY:",
            countryName: "SPAIN",
            carsCategory: "Cars",
            catCompact: "Compact",
            catCompactExample: "Nissan Versa or similar",
            catConvertible: "Compact Convertible",
            catConvertibleExample: "Mazda Miata RF or similar",
            catSpecialCompact: "Special Compact",
            catSpecialCompactExample: "Fiat 500 or similar",
            catEconomy: "Economy",
            catEconomyExample: "Hyundai i10 or similar",
            catMidsizeSUV: "Midsize SUV",
            catMidsizeSUVExample: "Kia Sportage or similar",
            catLuxuryCategory: "Luxury",
            catLuxuryExample: "BMW 3 Series or similar",
            viewDetails: "View details",
            imageNotAvailable: "Image not available",
            welcomeBack: "Welcome back!",
            loginSubtitle: "Sign in to your account to manage your reservations",
            loginTab: "Sign In",
            registerTab: "Create Account",
            emailLabel: "Email address",
            passwordLabel: "Password",
            fullNameLabel: "Full name",
            phoneLabel: "Phone",
            rememberMe: "Remember me",
            forgotPassword: "Forgot your password?",
            loginBtn: "Sign In",
            orLoginWith: "Or sign in with",
            acceptTerms: "I accept the terms and conditions",
            registerBtn: "Create Account",
            footerTagline: "Vehicle rental with the best fleet and personalized service. Move with freedom, style, and confidence.",
            footerQuickLinks: "Quick Links",
            footerOffers: "Offers",
            footerServices: "Services",
            footerLongTerm: "Long Term Rental",
            footerCorporate: "Corporate",
            footerDelivery: "Home Delivery",
            footerAirport: "Airport Pickup",
            footerInsurance: "Insurance",
            footerAssistance: "24/7 Roadside Assistance",
            footerContact: "Contact",
            footerAddress: "123 Main Street, Downtown, Madrid, Spain",
            footerSchedule: "Mon-Sat: 08:00 - 20:00",
            footerPayWith: "Pay with:",
            footerCopy: "SantaLucía Rental. All rights reserved.",
            footerPrivacy: "Privacy Policy",
            footerTerms: "Terms and Conditions",
            footerCookies: "Cookie Policy"
        }
    };

    // Aplica el idioma elegido y lo guarda en localStorage
    function applyLanguage(lang) {
        const dict = translations[lang] || translations.es;

        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(function (el) {
            const key = el.getAttribute('data-i18n');
            if (dict[key] !== undefined) {
                el.textContent = dict[key];
            }
        });

        document.documentElement.setAttribute('lang', lang);

        localStorage.setItem('preferredLang', lang);
    }

    const langLinks = document.querySelectorAll('[data-lang]');
    langLinks.forEach(function (link) {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const selectedLang = link.getAttribute('data-lang');
            applyLanguage(selectedLang);

            // Si el idioma se eligió desde el menú de perfil, cerramos el panel
            const profileContainer = document.getElementById('profileContainer');
            if (profileContainer && profileContainer.contains(link)) {
                profileContainer.classList.remove('open');
                const profileToggle = document.getElementById('profileToggle');
                if (profileToggle) profileToggle.setAttribute('aria-expanded', 'false');
            }
        });
    });

    // Año actual en el footer
    const yearEl = document.getElementById('year');
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }

    // Idioma por defecto (recordado en localStorage)
    const initialLang = localStorage.getItem('preferredLang') || 'es';
    applyLanguage(initialLang);

    // ========== Login / Perfil de usuario (Requisitos 4, 6 y 9) ==========
    (function () {
        // Usuario logueado (desde DataManager / localStorage / sessionStorage)
        var usuario = (typeof DataManager !== 'undefined' && DataManager.getCurrentUserEmail()) || null;
        if (!usuario) {
            try { usuario = localStorage.getItem('usuario') || sessionStorage.getItem('usuario') || null; } catch (e) { usuario = null; }
        }

        var accountBtn = document.getElementById('accountBtn');
        var profileContainer = document.getElementById('profileContainer');
        var profileToggle = document.getElementById('profileToggle');
        var profileDropdown = document.getElementById('profileDropdown');
        var logoutBtn = document.getElementById('logoutBtn');

        var profileAvatarHeader = document.getElementById('profileAvatarHeader');
        var profileAvatarDropdown = document.getElementById('profileAvatarDropdown');
        var profileAvatarEdit = document.getElementById('profileAvatarEdit');
        var profileUsernameBadge = document.getElementById('profileUsernameBadge');
        var profileDropdownUsername = document.getElementById('profileDropdownUsername');

        var editProfileBtn = document.getElementById('editProfileBtn');
        var profileModalOverlay = document.getElementById('profileModalOverlay');
        var profileModal = document.getElementById('profileModal');
        var closeProfileModal = document.getElementById('closeProfileModal');
        var avatarInput = document.getElementById('avatarInput');
        var editProfileForm = document.getElementById('editProfileForm');
        var editName = document.getElementById('editName');
        var editEmail = document.getElementById('editEmail');
        var editPhone = document.getElementById('editPhone');

        var profileMenuItems = document.querySelectorAll('.profile-menu-item[data-action]');
        var profileActionOverlay = document.createElement('div');
        profileActionOverlay.className = 'profile-action-overlay';
        profileActionOverlay.setAttribute('role', 'dialog');
        profileActionOverlay.setAttribute('aria-modal', 'true');
        profileActionOverlay.setAttribute('aria-hidden', 'true');
        profileActionOverlay.innerHTML = `
            <section class="profile-action-modal">
                <button type="button" class="profile-action-close" aria-label="Cerrar">
                    <i class="fas fa-times" aria-hidden="true"></i>
                </button>
                <h2 class="profile-action-title"></h2>
                <div class="profile-action-content"></div>
            </section>
        `;
        document.body.appendChild(profileActionOverlay);
        var profileActionTitle = profileActionOverlay.querySelector('.profile-action-title');
        var profileActionContent = profileActionOverlay.querySelector('.profile-action-content');
        var closeProfileActionButton = profileActionOverlay.querySelector('.profile-action-close');

        // --- Guarda / recupera datos de usuario en localStorage ---
        function getUserKey(email) {
            return 'user_data_' + btoa(unescape(encodeURIComponent(email || ''))).replace(/=/g, '');
        }

        // Carga datos del usuario desde localStorage
        function loadUserData(email) {
            if (!email) return null;
            if (typeof DataManager !== 'undefined') {
                return DataManager.getCurrentUserData();
            }
            try {
                var raw = localStorage.getItem(getUserKey(email));
                return raw ? JSON.parse(raw) : null;
            } catch (e) {
                return null;
            }
        }

        // Guarda datos del usuario en localStorage
        function saveUserData(email, data) {
            if (!email) return;
            if (typeof DataManager !== 'undefined') {
                DataManager.updateUserData(email, data);
            }
            try {
                localStorage.setItem(getUserKey(email), JSON.stringify(data));
            } catch (e) {}
        }

        // Devuelve los datos actuales (o un obj por defecto)
        function getCurrentUserData() {
            if (!usuario) return null;
            var existing = loadUserData(usuario);
            if (existing) return existing;
            var atIdx = usuario.indexOf('@');
            var displayName = atIdx > 0 ? usuario.substring(0, atIdx) : usuario;
            displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1).toLowerCase();
            return {
                email: usuario,
                name: displayName,
                phone: '',
                avatar: ''
            };
        }

        // --- Pinta el avatar (o icono por defecto) ---
        function renderAvatar(avatarData, avatarEl) {
            if (!avatarEl) return;
            avatarEl.innerHTML = '';
            if (avatarData) {
                var img = document.createElement('img');
                img.src = avatarData;
                img.alt = 'Avatar';
                avatarEl.appendChild(img);
            } else {
                var icon = document.createElement('i');
                icon.className = 'fas fa-user default-avatar-icon';
                avatarEl.appendChild(icon);
            }
        }

        // Pinta los 3 avatares a la vez (header, dropdown, modal)
        function renderAllAvatars(userData) {
            var avatar = userData ? userData.avatar : '';
            renderAvatar(avatar, profileAvatarHeader);
            renderAvatar(avatar, profileAvatarDropdown);
            renderAvatar(avatar, profileAvatarEdit);
        }

        // Saca el nombre visible del usuario (si no hay nombre, usa el email)
        function getDisplayName(userData) {
            if (!userData) return 'Usuario';
            if (userData.name && userData.name.trim()) return userData.name.trim();
            var atIdx = (userData.email || '').indexOf('@');
            var emailPart = atIdx > 0 ? userData.email.substring(0, atIdx) : (userData.email || 'Usuario');
            return emailPart.charAt(0).toUpperCase() + emailPart.slice(1).toLowerCase();
        }

        // Pinta nombre + avatares en el header
        function renderProfileInfo() {
            var userData = getCurrentUserData();
            var displayName = getDisplayName(userData);
            var badgeName = displayName.length > 10 ? displayName.substring(0, 9) + '…' : displayName;

            if (profileUsernameBadge) profileUsernameBadge.textContent = badgeName;
            if (profileDropdownUsername) profileDropdownUsername.textContent = displayName;
            renderAllAvatars(userData);
        }

        // Si no hay usuario en páginas protegidas, redirige al login
        var path = (window.location.pathname.split('/').pop() || '').toLowerCase();
        var isProtectedPage = path === 'index.html' || path === 'autos.html' || path === '';

        if (!usuario && isProtectedPage) {
            window.location.replace('login-registro.html');
            return;
        }

        // Usuario logueado: oculta "Mi Cuenta", muestra perfil
        if (usuario && profileContainer) {
            if (accountBtn) accountBtn.style.display = 'none';
            profileContainer.style.display = '';
            renderProfileInfo();
        }

        // --- Abre / cierra el dropdown del perfil ---
        function closeProfileDropdown() {
            if (profileContainer) profileContainer.classList.remove('open');
            if (profileToggle) profileToggle.setAttribute('aria-expanded', 'false');
        }

        function closeProfileActionModal() {
            profileActionOverlay.style.display = 'none';
            profileActionOverlay.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }

        function openProfileActionModal(title, renderContent) {
            profileActionTitle.textContent = title;
            profileActionContent.replaceChildren();
            renderContent(profileActionContent);
            profileActionOverlay.style.display = 'flex';
            profileActionOverlay.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
            closeProfileDropdown();
            closeProfileActionButton.focus();
        }

        closeProfileActionButton.addEventListener('click', closeProfileActionModal);
        profileActionOverlay.addEventListener('click', function (event) {
            if (event.target === profileActionOverlay) closeProfileActionModal();
        });

        function appendEmptyMessage(container, message, linkText) {
            var emptyState = document.createElement('div');
            emptyState.className = 'profile-action-empty';
            var text = document.createElement('p');
            text.textContent = message;
            emptyState.appendChild(text);

            if (linkText) {
                var link = document.createElement('a');
                link.href = 'autos.html';
                link.className = 'profile-action-link';
                link.textContent = linkText;
                emptyState.appendChild(link);
            }

            container.appendChild(emptyState);
        }

        function openNotifications() {
            openProfileActionModal('Notificaciones', function (container) {
                var userData = getCurrentUserData();
                var reservations = userData.role === 'admin'
                    ? DataManager.getReservations()
                    : DataManager.getReservationsByUser(usuario);
                reservations = reservations.slice().reverse();

                if (!reservations.length) {
                    appendEmptyMessage(container, 'No tienes notificaciones de reservas por ahora.');
                    return;
                }

                reservations.forEach(function (reservation) {
                    var item = document.createElement('article');
                    item.className = 'profile-action-item';
                    var heading = document.createElement('h3');
                    heading.textContent = 'Reserva #' + reservation.id + ' · ' + (reservation.estado || 'Pendiente');
                    var description = document.createElement('p');
                    var vehicleName = reservation.autoNombre || 'Vehículo';
                    var startDate = reservation.fechaInicio || 'Fecha pendiente';
                    var endDate = reservation.fechaFin ? ' al ' + reservation.fechaFin : '';
                    description.textContent = vehicleName + ' — ' + startDate + endDate;
                    item.append(heading, description);
                    container.appendChild(item);
                });
            });
        }

        function updateSavedVehicleButtons(vehicleId, isSaved) {
            document.querySelectorAll('.cat-card-save-btn[data-vehicle-id]').forEach(function (button) {
                if (String(button.dataset.vehicleId) !== String(vehicleId)) return;
                button.classList.toggle('is-saved', isSaved);
                button.setAttribute('aria-pressed', String(isSaved));
                button.setAttribute('aria-label', isSaved ? 'Quitar de guardados' : 'Guardar vehículo');
                button.title = isSaved ? 'Quitar de guardados' : 'Guardar vehículo';
            });
        }

        function openSavedVehicles() {
            openProfileActionModal('Vehículos guardados', function (container) {
                var savedIds = DataManager.getSavedVehicleIds(usuario);
                var fleet = DataManager.getFleet();
                var savedVehicles = savedIds
                    .map(function (id) { return fleet.find(function (vehicle) { return String(vehicle.id) === id; }); })
                    .filter(Boolean);

                if (!savedVehicles.length) {
                    appendEmptyMessage(container, 'Aún no has guardado vehículos.', 'Explorar la flota');
                    return;
                }

                savedVehicles.forEach(function (vehicle) {
                    var item = document.createElement('article');
                    item.className = 'profile-action-item profile-saved-vehicle';
                    var image = document.createElement('img');
                    image.src = vehicle.image || 'fotos/1.jpg';
                    image.alt = vehicle.name;
                    var details = document.createElement('div');
                    details.className = 'profile-saved-vehicle-details';
                    var name = document.createElement('h3');
                    name.textContent = vehicle.name;
                    var price = document.createElement('p');
                    price.textContent = (vehicle.categoryLabel || vehicle.category) + ' · $' + vehicle.price + '/día';
                    details.append(name, price);

                    var removeButton = document.createElement('button');
                    removeButton.type = 'button';
                    removeButton.className = 'profile-saved-remove';
                    removeButton.textContent = 'Quitar';
                    removeButton.addEventListener('click', function () {
                        DataManager.toggleSavedVehicle(usuario, vehicle.id);
                        updateSavedVehicleButtons(vehicle.id, false);
                        openSavedVehicles();
                    });
                    item.append(image, details, removeButton);
                    container.appendChild(item);
                });
            });
        }

        if (profileToggle) {
            profileToggle.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                var isOpen = profileContainer.classList.toggle('open');
                profileToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            });
        }

        document.addEventListener('click', function (e) {
            if (profileContainer && !profileContainer.contains(e.target)) {
                closeProfileDropdown();
            }
            if (profileDropdown && !profileDropdown.contains(e.target) && !profileToggle.contains(e.target)) {
                closeProfileDropdown();
            }
        });

        // --- Acciones de los items del menú del perfil ---
        if (profileMenuItems) {
            profileMenuItems.forEach(function (item) {
                item.addEventListener('click', function () {
                    var action = item.getAttribute('data-action');
                    closeProfileDropdown();
                    if (action === 'profile') {
                        openEditModal();
                    } else if (action === 'notifications') {
                        openNotifications();
                    } else if (action === 'saved') {
                        openSavedVehicles();
                    } else if (action === 'history') {
                        window.location.href = 'dashboard.html';
                    }
                });
            });
        }

        // --- Cerrar sesión (Requisito 4) ---
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function () {
                if (typeof DataManager !== 'undefined') {
                    DataManager.logout();
                } else {
                    try {
                        localStorage.removeItem('usuario');
                        sessionStorage.removeItem('usuario');
                    } catch (e) {}
                }
                closeProfileDropdown();
                window.location.replace('login-registro.html');
            });
        }

        // --- Modal de edición de perfil ---
        function openEditModal() {
            var userData = getCurrentUserData();
            if (editName) editName.value = userData.name || '';
            if (editEmail) editEmail.value = userData.email || '';
            if (editPhone) editPhone.value = userData.phone || '';
            renderAvatar(userData.avatar, profileAvatarEdit);
            if (profileModalOverlay) profileModalOverlay.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            closeProfileDropdown();
        }

        function closeEditModal() {
            if (profileModalOverlay) profileModalOverlay.style.display = 'none';
            document.body.style.overflow = '';
        }

        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', function (e) {
                e.preventDefault();
                openEditModal();
            });
        }

        if (closeProfileModal) {
            closeProfileModal.addEventListener('click', closeEditModal);
        }

        if (profileModalOverlay) {
            profileModalOverlay.addEventListener('click', function (e) {
                if (e.target === profileModalOverlay) closeEditModal();
            });
        }

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && profileActionOverlay.style.display === 'flex') {
                closeProfileActionModal();
            }
            if (e.key === 'Escape' && profileModalOverlay && profileModalOverlay.style.display === 'flex') {
                closeEditModal();
            }
        });

        // --- Subida de foto de perfil (preview + validación 5MB) ---
        var currentAvatarData = '';

        if (avatarInput) {
            avatarInput.addEventListener('change', function (e) {
                var file = e.target.files && e.target.files[0];
                if (!file) return;

                if (!file.type.startsWith('image/')) {
                    alert('Por favor, selecciona un archivo de imagen válido.');
                    return;
                }

                if (file.size > 5 * 1024 * 1024) {
                    alert('La imagen es demasiado grande. Máximo 5MB.');
                    return;
                }

                var reader = new FileReader();
                reader.onload = function (event) {
                    currentAvatarData = event.target.result;
                    renderAvatar(currentAvatarData, profileAvatarEdit);
                    renderAvatar(currentAvatarData, profileAvatarHeader);
                    renderAvatar(currentAvatarData, profileAvatarDropdown);
                };
                reader.onerror = function () {
                    alert('No se pudo cargar la imagen. Inténtalo de nuevo.');
                };
                reader.readAsDataURL(file);
            });
        }

        // --- Guarda la edición de perfil con VALIDACIÓN ESTRICTA (Requisito 6) ---
        if (editProfileForm) {
            editProfileForm.addEventListener('submit', function (e) {
                e.preventDefault();
                var userData = getCurrentUserData();
                var newName = editName ? editName.value.trim() : '';
                var newPhone = editPhone ? editPhone.value.trim() : '';

                // VALIDACIÓN: Nombre obligatorio con longitud razonable
                if (newName.length < 3 || newName.length > 80 ||
                    newName.replace(/[^\p{L}]/gu, '').length < 3) {
                    alert('Validación de perfil: El nombre debe tener entre 3 y 80 caracteres e incluir al menos 3 letras.');
                    if (editName) editName.focus();
                    return;
                }

                // VALIDACIÓN: Teléfono opcional; si se ingresa, debe tener formato y longitud válidos
                var phoneDigits = newPhone.replace(/[^0-9]/g, '');
                if (newPhone && (
                    newPhone.length > 25 ||
                    !/^\+?[0-9().\s-]+$/.test(newPhone) ||
                    phoneDigits.length < 8 ||
                    phoneDigits.length > 15
                )) {
                    alert('Validación de perfil: Ingresa un teléfono válido con entre 8 y 15 dígitos.');
                    if (editPhone) editPhone.focus();
                    return;
                }

                userData.name = newName;
                userData.phone = newPhone;
                if (currentAvatarData) {
                    userData.avatar = currentAvatarData;
                }

                saveUserData(usuario, userData);
                renderProfileInfo();
                closeEditModal();

                var btn = editProfileForm.querySelector('.profile-save-btn');
                if (btn) {
                    var originalText = btn.textContent;
                    btn.textContent = '¡Guardado!';
                    btn.style.background = '#16a34a';
                    setTimeout(function () {
                        btn.textContent = originalText;
                        btn.style.background = '';
                    }, 1400);
                }
            });
        }

    })();

    // ========================================================
    // Módulo de Flota Dinámica, Filtros y Buscador (Requisito 3 y 6)
    // ========================================================
    function initFleetAndFilters() {
        const grid = document.getElementById('rentalCategoriesGrid');
        if (!grid) return; // Solo se ejecuta si estamos en autos.html

        const searchInput = document.getElementById('heroSearchInput');
        const searchForm = document.getElementById('heroSearchForm');
        const priceMin = document.getElementById('priceMinInput');
        const priceMax = document.getElementById('priceMaxInput');
        const priceError = document.getElementById('priceFilterError');
        const optionsCount = document.getElementById('rentalOptionsCount');
        const categoryGroupCount = document.getElementById('categoryGroupCount');

        function getActiveFilters() {
            // Categorías seleccionadas
            const categoryCheckboxes = document.querySelectorAll('.rental-sidebar input[type="checkbox"][value="autos"], .rental-sidebar input[type="checkbox"][value="camiones"], .rental-sidebar input[type="checkbox"][value="vans"], .rental-sidebar input[type="checkbox"][value="suv"]');
            const selectedCategories = [];
            categoryCheckboxes.forEach(cb => {
                if (cb.checked) selectedCategories.push(cb.value);
            });

            // Pasajeros seleccionados
            const passengerCheckboxes = document.querySelectorAll('.rental-sidebar input[type="checkbox"][value^="p"]');
            const selectedPassengers = [];
            passengerCheckboxes.forEach(cb => {
                if (cb.checked) {
                    const minP = parseInt(cb.value.replace('p', ''), 10);
                    selectedPassengers.push(minP);
                }
            });

            // Transmisión
            const transCheckboxes = document.querySelectorAll('.rental-sidebar input[type="checkbox"][value="automatica"], .rental-sidebar input[type="checkbox"][value="manual"]');
            const selectedTrans = [];
            transCheckboxes.forEach(cb => {
                if (cb.checked) selectedTrans.push(cb.value);
            });

            // Precios
            let minVal = priceMin ? parseFloat(priceMin.value) : 0;
            let maxVal = priceMax ? parseFloat(priceMax.value) : 1000;
            if (isNaN(minVal) || minVal < 0) minVal = 0;
            if (isNaN(maxVal) || maxVal < 0) maxVal = 1000;

            // VALIDACIÓN: Filtros de precio Min < Max (Requisito 6)
            let priceValid = true;
            if (minVal > maxVal) {
                priceValid = false;
                if (priceError) priceError.style.display = 'block';
                if (priceMin) priceMin.style.borderColor = '#ef4444';
                if (priceMax) priceMax.style.borderColor = '#ef4444';
            } else {
                if (priceError) priceError.style.display = 'none';
                if (priceMin) priceMin.style.borderColor = '';
                if (priceMax) priceMax.style.borderColor = '';
            }

            // Buscador de texto
            const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

            return {
                categories: selectedCategories,
                passengers: selectedPassengers,
                transmissions: selectedTrans,
                minPrice: minVal,
                maxPrice: maxVal,
                priceValid: priceValid,
                query: query
            };
        }

        function filterVehicles() {
            const filters = getActiveFilters();
            if (!filters.priceValid) return; // No filtrar con rango inválido

            const fleet = typeof DataManager !== 'undefined' ? DataManager.getFleet() : [];

            const filtered = fleet.filter(v => {
                // Filtro de categoría
                if (filters.categories.length > 0 && !filters.categories.includes(v.category)) {
                    return false;
                }

                // Filtro de pasajeros
                if (filters.passengers.length > 0) {
                    const satisfiesPassenger = filters.passengers.some(minP => v.passengers >= minP);
                    if (!satisfiesPassenger) return false;
                }

                // Filtro de transmisión
                if (filters.transmissions.length > 0 && !filters.transmissions.includes(v.transmission)) {
                    return false;
                }

                // Filtro de rango de precio
                if (v.price < filters.minPrice || v.price > filters.maxPrice) {
                    return false;
                }

                // Filtro de búsqueda por texto
                if (filters.query) {
                    const text = `${v.name} ${v.categoryLabel} ${v.example || ''}`.toLowerCase();
                    if (!text.includes(filters.query)) return false;
                }

                return true;
            });

            renderFleetCards(filtered);
        }

        function renderFleetCards(vehicles) {
            grid.innerHTML = '';
            const savedVehicleIds = new Set(
                DataManager.getSavedVehicleIds(DataManager.getCurrentUserEmail())
            );

            const countText = `${vehicles.length} opción${vehicles.length === 1 ? '' : 'es'} de categoría de vehículo disponible${vehicles.length === 1 ? '' : 's'}`;
            if (optionsCount) optionsCount.textContent = countText;
            if (categoryGroupCount) categoryGroupCount.textContent = `(${vehicles.length})`;

            if (vehicles.length === 0) {
                grid.innerHTML = `
                    <div style="grid-column: 1 / -1; padding: 50px 20px; text-align: center; background: #18181b; border: 1px dashed #3f3f46; border-radius: 12px;">
                        <i class="fas fa-car-tunnel" style="font-size: 2.5rem; color: #71717a; margin-bottom: 12px; display: block;"></i>
                        <h3 style="font-size: 1.3rem; font-weight: 700; color: #fff; margin-bottom: 8px;">No se encontraron vehículos</h3>
                        <p style="color: #a1a1aa; font-size: 0.95rem; margin-bottom: 18px;">Ningún auto coincide con los filtros y rango de precios seleccionados.</p>
                        <button type="button" id="resetFiltersBtn" style="background: var(--lime-green); color: #fff; border: none; padding: 10px 22px; border-radius: 8px; font-weight: 700; cursor: pointer;">
                            <i class="fas fa-rotate-left"></i> Restablecer Filtros
                        </button>
                    </div>
                `;
                const resetBtn = document.getElementById('resetFiltersBtn');
                if (resetBtn) {
                    resetBtn.addEventListener('click', resetAllFilters);
                }
                return;
            }

            vehicles.forEach(v => {
                const statusBadgeClass = v.status === 'Disponible' ? 'cat-badge-disponible' :
                                        v.status === 'Alquilado' ? 'cat-badge-alquilado' : 'cat-badge-mantenimiento';

                const card = document.createElement('article');
                card.className = 'rent-category-card';
                card.style.position = 'relative';

                card.innerHTML = `
                    <span class="cat-badge ${statusBadgeClass}">${v.status}</span>
                    <button type="button" class="cat-card-save-btn${savedVehicleIds.has(String(v.id)) ? ' is-saved' : ''}"
                            data-vehicle-id="${v.id}" aria-pressed="${savedVehicleIds.has(String(v.id))}"
                            aria-label="${savedVehicleIds.has(String(v.id)) ? 'Quitar de guardados' : 'Guardar vehículo'}"
                            title="${savedVehicleIds.has(String(v.id)) ? 'Quitar de guardados' : 'Guardar vehículo'}">
                        <i class="fas fa-bookmark" aria-hidden="true"></i>
                    </button>
                    <h3 class="cat-card-title">${v.categoryLabel || v.name}</h3>
                    <p class="cat-card-example">${v.example || v.name}</p>

                    <div class="cat-card-specs">
                        <div class="cat-spec-item">
                            <i class="fas fa-cog cat-spec-icon"></i>
                            <span class="cat-spec-text" style="text-transform: capitalize;">${v.transmission}</span>
                        </div>
                        <div class="cat-spec-item">
                            <i class="fas fa-users cat-spec-icon"></i>
                            <span class="cat-spec-text">${v.passengers}</span>
                        </div>
                        <div class="cat-spec-item">
                            <i class="fas fa-suitcase cat-spec-icon"></i>
                            <span class="cat-spec-text">${v.luggage}</span>
                        </div>
                        ${v.ac ? `
                        <div class="cat-spec-item">
                            <i class="fas fa-snowflake cat-spec-icon"></i>
                            <span class="cat-spec-text">A/C</span>
                        </div>` : ''}
                    </div>

                    <div class="cat-card-image-wrap">
                        <img src="${v.image || 'fotos/1.jpg'}" alt="${v.name}" class="cat-card-image" loading="lazy" onerror="this.src='fotos/1.jpg'">
                    </div>

                    <div class="cat-card-footer">
                        <div class="cat-card-price-wrap">
                            <span class="cat-card-price-value">$${v.price}</span>
                            <span class="cat-card-price-period">/ día</span>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button type="button" class="cat-card-details-btn" data-vehicle-id="${v.id}" title="Ver detalles técnicos">
                                Detalles <i class="fas fa-chevron-right"></i>
                            </button>
                            <button type="button" class="cat-card-reserve-btn" data-vehicle-id="${v.id}">
                                <i class="fas fa-calendar-check"></i> Reservar
                            </button>
                        </div>
                    </div>
                `;

                // Botón Detalles
                const detailsBtn = card.querySelector('.cat-card-details-btn');
                detailsBtn.addEventListener('click', function () {
                    openFleetDetailsFor(v);
                });

                const saveBtn = card.querySelector('.cat-card-save-btn');
                saveBtn.addEventListener('click', function (event) {
                    event.stopPropagation();
                    const email = DataManager.getCurrentUserEmail();
                    if (!email) {
                        window.location.href = 'login-registro.html';
                        return;
                    }

                    const result = DataManager.toggleSavedVehicle(email, v.id);
                    saveBtn.classList.toggle('is-saved', result.saved);
                    saveBtn.setAttribute('aria-pressed', String(result.saved));
                    saveBtn.setAttribute('aria-label', result.saved ? 'Quitar de guardados' : 'Guardar vehículo');
                    saveBtn.title = result.saved ? 'Quitar de guardados' : 'Guardar vehículo';
                });

                // Botón Reservar
                const reserveBtn = card.querySelector('.cat-card-reserve-btn');
                reserveBtn.addEventListener('click', function () {
                    if (typeof window.openReservationModal === 'function') {
                        window.openReservationModal(v.id);
                    }
                });

                grid.appendChild(card);
            });
        }

        function resetAllFilters() {
            document.querySelectorAll('.rental-sidebar input[type="checkbox"]').forEach(cb => {
                if (cb.value === 'autos') cb.checked = true;
                else cb.checked = false;
            });
            if (priceMin) priceMin.value = 0;
            if (priceMax) priceMax.value = 500;
            if (searchInput) searchInput.value = '';
            if (priceError) priceError.style.display = 'none';
            filterVehicles();
        }

        // Abrir modal de detalles para un vehículo
        function openFleetDetailsFor(v) {
            const overlay = document.getElementById('fleetDetailsOverlay');
            const title = document.getElementById('fleetDetailsTitle');
            const example = document.getElementById('fleetDetailsExample');
            const image = document.getElementById('fleetDetailsImage');
            const specs = document.getElementById('fleetDetailsSpecs');
            const detailsReserveBtn = document.getElementById('fleetDetailsReserveBtn');

            if (!overlay) return;

            title.textContent = v.name;
            example.textContent = v.example || `${v.categoryLabel} — Tarifa: $${v.price}/día`;
            image.src = v.image || 'fotos/1.jpg';
            image.alt = v.name;
            specs.innerHTML = `
                <li><i class="fas fa-cog"></i> <b>Transmisión:</b> ${v.transmission}</li>
                <li><i class="fas fa-users"></i> <b>Capacidad:</b> ${v.passengers} Pasajeros</li>
                <li><i class="fas fa-suitcase"></i> <b>Maletas:</b> ${v.luggage} Grandes</li>
                <li><i class="fas fa-snowflake"></i> <b>Climatización:</b> ${v.ac ? 'Aire Acondicionado' : 'Estándar'}</li>
                <li><i class="fas fa-circle-check"></i> <b>Disponibilidad:</b> ${v.status}</li>
                <li><i class="fas fa-tag"></i> <b>Precio:</b> $${v.price} / día</li>
            `;

            if (detailsReserveBtn) {
                detailsReserveBtn.onclick = function () {
                    overlay.classList.remove('open');
                    document.body.classList.remove('fleet-modal-open');
                    if (typeof window.openReservationModal === 'function') {
                        window.openReservationModal(v.id);
                    }
                };
            }

            overlay.classList.add('open');
            document.body.classList.add('fleet-modal-open');
        }

        // Listeners para filtros
        document.querySelectorAll('.rental-sidebar input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', filterVehicles);
        });

        if (priceMin) {
            priceMin.addEventListener('input', filterVehicles);
        }
        if (priceMax) {
            priceMax.addEventListener('input', filterVehicles);
        }

        if (searchInput) {
            searchInput.addEventListener('input', filterVehicles);
        }
        if (searchForm) {
            searchForm.addEventListener('submit', function (e) {
                e.preventDefault();
                filterVehicles();
            });
        }

        // Renderizado inicial de la flota
        filterVehicles();
    }

    // ========================================================
    // Módulo de Realizar Reserva y Cálculo de Precios (Requisito 3)
    // ========================================================
    function initReservationModal() {
        const modal = document.getElementById('reservationModalOverlay');
        const form = document.getElementById('publicReservationForm');
        const select = document.getElementById('resVehicleSelect');
        const startDate = document.getElementById('resStartDate');
        const endDate = document.getElementById('resEndDate');
        const mainReserveBtn = document.getElementById('mainReserveBtn');
        const cancelBtn = document.getElementById('cancelReservationModalBtn');
        const closeBtn = document.getElementById('closeReservationModal');

        const summaryDays = document.getElementById('summaryDays');
        const summaryRate = document.getElementById('summaryRate');
        const summaryExtras = document.getElementById('summaryExtras');
        const summaryTotal = document.getElementById('summaryTotal');

        if (!modal || !form) return;

        // Configuración inicial de fechas
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const todayStr = `${yyyy}-${mm}-${dd}`;

        const after3 = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
        const yyyy3 = after3.getFullYear();
        const mm3 = String(after3.getMonth() + 1).padStart(2, '0');
        const dd3 = String(after3.getDate()).padStart(2, '0');
        const after3Str = `${yyyy3}-${mm3}-${dd3}`;

        if (startDate) {
            startDate.min = todayStr;
            startDate.value = todayStr;
        }
        if (endDate) {
            endDate.min = todayStr;
            endDate.value = after3Str;
        }

        // Recalcular precios en tiempo real
        function calculateReservationPricing() {
            if (!select || !startDate || !endDate) return { days: 1, total: 40 };

            const fleet = typeof DataManager !== 'undefined' ? DataManager.getFleet() : [];
            const vehicle = fleet.find(v => String(v.id) === String(select.value)) || fleet[0];
            const dailyRate = vehicle ? vehicle.price : 35;

            const start = new Date(startDate.value);
            const end = new Date(endDate.value);
            let diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
            if (diffDays <= 0) diffDays = 1;

            let extrasPerDay = 0;
            const extraIns = document.getElementById('extraInsurance');
            const extraGps = document.getElementById('extraGps');
            const extraSeat = document.getElementById('extraChildSeat');

            if (extraIns && extraIns.checked) extrasPerDay += parseFloat(extraIns.value);
            if (extraGps && extraGps.checked) extrasPerDay += parseFloat(extraGps.value);
            if (extraSeat && extraSeat.checked) extrasPerDay += parseFloat(extraSeat.value);

            const baseTotal = diffDays * dailyRate;
            const extrasTotal = diffDays * extrasPerDay;
            const grandTotal = baseTotal + extrasTotal;

            if (summaryDays) summaryDays.textContent = `${diffDays} día${diffDays === 1 ? '' : 's'}`;
            if (summaryRate) summaryRate.textContent = `$${dailyRate.toFixed(2)} / día`;
            if (summaryExtras) summaryExtras.textContent = `$${extrasTotal.toFixed(2)} ($${extrasPerDay}/día)`;
            if (summaryTotal) summaryTotal.textContent = `$${grandTotal.toFixed(2)}`;

            return {
                vehicle: vehicle,
                days: diffDays,
                dailyRate: dailyRate,
                extrasTotal: extrasTotal,
                grandTotal: grandTotal
            };
        }

        window.openReservationModal = function (preferredVehicleId = null) {
            if (!select) return;
            const fleet = typeof DataManager !== 'undefined' ? DataManager.getFleet() : [];

            select.innerHTML = '';
            fleet.forEach(v => {
                const opt = document.createElement('option');
                opt.value = v.id;
                opt.textContent = `${v.name} (${v.categoryLabel}) — $${v.price}/día [${v.status}]`;
                opt.disabled = v.status === 'En Mantenimiento';
                if (!opt.disabled && preferredVehicleId && String(v.id) === String(preferredVehicleId)) {
                    opt.selected = true;
                }
                select.appendChild(opt);
            });

            if (preferredVehicleId) {
                select.value = preferredVehicleId;
            }

            calculateReservationPricing();
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        };

        window.closeReservationModal = function () {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        };

        if (mainReserveBtn) {
            mainReserveBtn.addEventListener('click', function () {
                window.openReservationModal();
            });
        }

        if (cancelBtn) cancelBtn.addEventListener('click', window.closeReservationModal);
        if (closeBtn) closeBtn.addEventListener('click', window.closeReservationModal);

        modal.addEventListener('click', function (e) {
            if (e.target === modal) window.closeReservationModal();
        });

        // Eventos para recalcular precios automáticamente
        select.addEventListener('change', calculateReservationPricing);
        startDate.addEventListener('change', function () {
            if (endDate.value < startDate.value) {
                endDate.value = startDate.value;
            }
            endDate.min = startDate.value;
            calculateReservationPricing();
        });
        endDate.addEventListener('change', calculateReservationPricing);

        document.querySelectorAll('.res-extra-check').forEach(cb => {
            cb.addEventListener('change', calculateReservationPricing);
        });

        // Enviar Reserva
        form.addEventListener('submit', function (e) {
            e.preventDefault();

            // --- Validación de campos vacíos (alerta de advertencia) ---
            const camposFaltantes = [];
            if (!select || !select.value) camposFaltantes.push('Vehículo');
            if (!startDate || !startDate.value) camposFaltantes.push('Fecha de recogida');
            if (!endDate || !endDate.value) camposFaltantes.push('Fecha de devolución');

            if (camposFaltantes.length > 0) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Campos incompletos',
                    html: `Por favor completa los siguientes campos:<br><strong>${camposFaltantes.join(' · ')}</strong>`,
                    confirmButtonText: 'Entendido',
                    confirmButtonColor: '#DC2626',
                    background: '#1a1a1a',
                    color: '#ffffff'
                });
                return;
            }

            if (new Date(endDate.value) < new Date(startDate.value)) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Fechas no válidas',
                    text: 'La fecha de devolución no puede ser anterior a la fecha de recogida.',
                    confirmButtonText: 'Corregir',
                    confirmButtonColor: '#DC2626',
                    background: '#1a1a1a',
                    color: '#ffffff'
                });
                return;
            }

            const pricing = calculateReservationPricing();
            const location = document.getElementById('resLocation') ? document.getElementById('resLocation').value : 'Madrid Centro';

            const userEmail = (typeof DataManager !== 'undefined' && DataManager.getCurrentUserEmail()) || 'cliente@santalucia.com';
            const userData = (typeof DataManager !== 'undefined' && DataManager.getCurrentUserData()) || {};

            const extrasList = [];
            if (document.getElementById('extraInsurance')?.checked) extrasList.push('Seguro Todo Riesgo');
            if (document.getElementById('extraGps')?.checked) extrasList.push('GPS');
            if (document.getElementById('extraChildSeat')?.checked) extrasList.push('Silla Bebé');

            const resResult = typeof DataManager !== 'undefined' ? DataManager.createReservation({
                usuario: userEmail,
                clienteNombre: userData.name || userEmail.split('@')[0],
                autoId: pricing.vehicle ? pricing.vehicle.id : '',
                autoNombre: pricing.vehicle ? pricing.vehicle.name : 'Vehículo',
                categoria: pricing.vehicle ? pricing.vehicle.categoryLabel : 'General',
                fechaInicio: startDate.value,
                fechaFin: endDate.value,
                dias: pricing.days,
                precioDia: pricing.dailyRate,
                extras: extrasList.length ? extrasList.join(', ') : 'Ninguno',
                monto: pricing.grandTotal,
                lugar: location,
                estado: 'Activa'
            }) : null;

            if (!resResult) {
                Swal.fire({
                    icon: 'error',
                    title: 'Vehículo no disponible',
                    text: 'No se puede reservar un vehículo que está en mantenimiento. Selecciona otro vehículo.',
                    confirmButtonText: 'Entendido',
                    confirmButtonColor: '#DC2626',
                    background: '#1a1a1a',
                    color: '#ffffff'
                });
                return;
            }

            window.closeReservationModal();

            // Mensaje de éxito
            const pointsEarned = Math.round(pricing.grandTotal / 2);
            const resId = resResult ? resResult.id : '#RES-EXITO';

            // Alerta de éxito de la pre-reserva (SweetAlert2)
            Swal.fire({
                icon: 'success',
                title: '¡Reserva confirmada!',
                html:
                    `<div class="res-swal-resumen">` +
                    `<p><strong>Código:</strong> ${resId}</p>` +
                    `<p><strong>Vehículo:</strong> ${pricing.vehicle ? pricing.vehicle.name : ''}</p>` +
                    `<p><strong>Fechas:</strong> ${startDate.value} → ${endDate.value} (${pricing.days} días)</p>` +
                    `<p><strong>Lugar:</strong> ${location}</p>` +
                    `<p><strong>Total:</strong> $${pricing.grandTotal.toFixed(2)}</p>` +
                    `<p><strong>Puntos ganados:</strong> +${pointsEarned} pts</p>` +
                    `</div>`,
                showCancelButton: true,
                confirmButtonText: 'Ver mi reserva',
                cancelButtonText: 'Seguir explorando',
                confirmButtonColor: '#DC2626',
                cancelButtonColor: '#3f3f46',
                reverseButtons: true,
                background: '#1a1a1a',
                color: '#ffffff'
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = 'dashboard.html';
                } else {
                    initFleetAndFilters();
                }
            });
        });
    }

    // ========================================================
    // Enlaces de Información Funcionales (Oficinas, Quiénes Somos, etc.)
    // ========================================================
    function initInfoModalsAndNavigation() {
        const infoOverlay = document.getElementById('infoModalOverlay');
        const infoTitle = document.getElementById('infoModalTitle');
        const infoContent = document.getElementById('infoModalContent');
        const closeInfoBtn = document.getElementById('closeInfoModal');
        const closeInfoBtn2 = document.getElementById('closeInfoModalBtn');

        function showInfo(title, htmlContent) {
            if (infoOverlay && infoTitle && infoContent) {
                infoTitle.textContent = title;
                infoContent.innerHTML = htmlContent;
                infoOverlay.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            } else {
                alert(`${title}\n\n${htmlContent.replace(/<[^>]*>/g, '')}`);
            }
        }

        function hideInfo() {
            if (infoOverlay) {
                infoOverlay.style.display = 'none';
                document.body.style.overflow = '';
            }
        }

        if (closeInfoBtn) closeInfoBtn.addEventListener('click', hideInfo);
        if (closeInfoBtn2) closeInfoBtn2.addEventListener('click', hideInfo);
        if (infoOverlay) {
            infoOverlay.addEventListener('click', function (e) {
                if (e.target === infoOverlay) hideInfo();
            });
        }

        const infoData = {
            'oficinas': {
                title: 'Nuestras Oficinas en España',
                html: '<p><b>Madrid Central:</b> Av. Principal 123, Centro. Lun-Sáb 08:00 - 20:00. Tel: +34 900 123 456</p><p><b>Aeropuerto Adolfo Suárez Madrid-Barajas:</b> Terminal T4, Módulo Llegadas. 24 Horas.</p><p><b>Barcelona Sants:</b> Estación Central de Trenes. Lun-Dom 07:00 - 22:00.</p><p><b>Sevilla Santa Justa:</b> Av. Kansas City s/n. Lun-Vie 08:00 - 20:00.</p>'
            },
            'quienes-somos': {
                title: 'Quiénes Somos — Santa Lucía Alquiler',
                html: '<p>Fundada con el objetivo de liderar el mercado de movilidad y renta de vehículos en España, Santa Lucía Alquiler ofrece una flota moderna, precios transparentes sin costos ocultos y atención personalizada 24/7.</p><p>Todos nuestros vehículos cuentan con seguro integral, inspección técnica certificada y kilometraje flexible para tu viaje de ocio o negocios.</p>'
            },
            'nuestro-equipo': {
                title: 'Nuestro Equipo',
                html: '<p><b>Dirección y Desarrollo:</b> Asael López</p><p><b>Logística y Operaciones:</b> Steven Aparicio</p><p><b>Sistemas y Soporte:</b> Arnulfo Henríquez</p><p>Un equipo dedicado a ofrecerte la mejor experiencia sobre cuatro ruedas.</p>'
            },
            'trabaja-con-nosotros': {
                title: 'Trabaja con Nosotros',
                html: '<p>¿Te apasiona el mundo del motor y la atención de excelencia? Buscamos constantemente conductores, gestores de flota y especialistas de servicio al cliente.</p><p>Envíanos tu currículum a <b>rrhh@santalucia.com</b> indicando tu ciudad de residencia.</p>'
            },
            'ofertas': {
                title: 'Ofertas y Promociones Especiales',
                html: '<p><b>Promo Fin de Semana:</b> 20% de descuento en categoría Compactos y Económicos reservando de viernes a domingo.</p><p><b>Viaje Familiar:</b> Silla de bebé de cortesía en reservas de SUV y Minivans de más de 5 días.</p><p><b>Puntos Santa Lucía:</b> Acumula 1 punto por cada $2 de gasto y canjéalos en alquileres futuros.</p>'
            },
            'servicios': {
                title: 'Nuestros Servicios',
                html: '<p>• <b>Alquiler a Corto y Largo Plazo</b> con tarifas corporativas.</p><p>• <b>Recogida y Entrega en Aeropuertos</b> las 24 horas.</p><p>• <b>Seguros Todo Riesgo</b> con asistencia en carretera incluida.</p><p>• <b>Vehículos Híbridos y Cero Emisiones</b> para libre circulación urbana.</p>'
            }
        };

        // Asignar a todos los enlaces de cabecera y pie con texto correspondiente
        document.querySelectorAll('a').forEach(link => {
            const text = (link.textContent || '').trim().toLowerCase();
            const href = link.getAttribute('href');

            if (href === '#' || href === '' || href === 'javascript:void(0)') {
                if (text.includes('oficina')) {
                    link.addEventListener('click', (e) => { e.preventDefault(); showInfo(infoData['oficinas'].title, infoData['oficinas'].html); });
                } else if (text.includes('quiénes somos') || text.includes('quienes somos') || text.includes('who we are')) {
                    link.addEventListener('click', (e) => { e.preventDefault(); showInfo(infoData['quienes-somos'].title, infoData['quienes-somos'].html); });
                } else if (text.includes('nuestro equipo') || text.includes('our team')) {
                    link.addEventListener('click', (e) => { e.preventDefault(); showInfo(infoData['nuestro-equipo'].title, infoData['nuestro-equipo'].html); });
                } else if (text.includes('trabaja') || text.includes('work with us')) {
                    link.addEventListener('click', (e) => { e.preventDefault(); showInfo(infoData['trabaja-con-nosotros'].title, infoData['trabaja-con-nosotros'].html); });
                } else if (text.includes('oferta') || text.includes('offers')) {
                    link.addEventListener('click', (e) => { e.preventDefault(); showInfo(infoData['ofertas'].title, infoData['ofertas'].html); });
                } else if (text.includes('servicio') || text.includes('services') || text.includes('alquiler largo') || text.includes('corporativo') || text.includes('seguro')) {
                    link.addEventListener('click', (e) => { e.preventDefault(); showInfo(infoData['servicios'].title, infoData['servicios'].html); });
                }
            }
        });
    }

    // Inicializar módulos de negocio y navegación
    initFleetAndFilters();
    initReservationModal();
    initInfoModalsAndNavigation();

});