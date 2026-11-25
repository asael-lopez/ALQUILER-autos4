import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { useApp } from '../context/useApp';
import { CarCard } from '../components/CarCard';
import { SearchBar } from '../components/SearchBar';
import { CurrencySelector } from '../components/CurrencySelector';
import { useCurrency } from '../context/useCurrency';
import { formatUSD, getPublicRateSummary, getRentalQuote } from '../utils/rentalPricing';
import { formatMoney } from '../services/exchangeService';
import { fetchWeatherForRange, formatWeatherSummary } from '../services/weatherService';
import { getDistanceKm } from '../services/mapaService';
import { MAIN_BRANCH } from '../data/branches';

const WHATSAPP_PHONE = '50361535807';

function isReservationBlocking(reservation) {
    return !['Pendiente', 'Cancelada', 'Completada'].includes(reservation.estado);
}

function hasCurrentOrFutureApprovedReservation(reservation, today) {
    return reservation.estado === 'Activa'
        && reservation.fechaFin >= today;
}

const VEHICLE_FILTERS = {
    autos: 'Autos',
    camiones: 'Camiones',
    vans: 'Vans',
    suv: 'SUV'
};

const getVehicleType = (car) => {
    const categoria = (car?.categoria || '').toLowerCase();
    const label = (car?.categoriaLabel || '').toLowerCase();

    if (categoria.includes('suv') || label.includes('suv')) return 'suv';
    if (categoria.includes('pickup') || label.includes('pickup')) return 'camiones';
    if (categoria.includes('van') || label.includes('van')) return 'vans';

    return 'autos';
};

export const Fleet = () => {
    const {
        cars,
        reservations,
        addReservation,
        currentUser,
        userEmail,
        favorites,
        toggleFavorite,
        registerCarView,
        userLocation
    } = useApp();
    const { currency, rates: fxRates, ratesDate, convert } = useCurrency();

    const handleOpenReservation = (car) => {
        if (!car) return;

        const isMaintenance = car.status === 'En Mantenimiento';

        if (isMaintenance) {
            Swal.fire({
                icon: 'warning',
                title: 'Vehículo en Mantenimiento',
                text: 'Este vehículo se encuentra actualmente en revisión técnica por mantenimiento y no puede reservarse.',
                background: '#121212',
                color: '#ffffff',
                confirmButtonColor: '#dc2626'
            });
            return;
        }

        const formatDate = (date) => {
            const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
            return localDate.toISOString().slice(0, 10);
        };
        const today = formatDate(new Date());
        const next3Days = formatDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000));
        const rates = getPublicRateSummary(car);
        const defaultQuote = getRentalQuote(car, 3);

        // --- Datos de APIs externas que entran al flujo de reserva ---
        // 1) Tipo de cambio (Frankfurter): equivalente del total en otra moneda.
        const fxLabel = (amountUSD) => {
            if (currency === 'USD') return '';
            const converted = convert(amountUSD, currency);
            return converted === null ? '' : `≈ ${formatMoney(converted, currency)} (referencial, se cobra en USD)`;
        };
        // 2) Geocodificación (Nominatim): distancia de la dirección buscada en el mapa.
        const distanceKm = userLocation
            ? getDistanceKm(
                [MAIN_BRANCH.latitude, MAIN_BRANCH.longitude],
                [userLocation.lat, userLocation.lon]
            )
            : null;
        // 3) Clima (Open-Meteo): se actualiza al cambiar las fechas.
        let weatherText = '';
        let weatherRequestId = 0;

        Swal.fire({
            html: `
                <div style="text-align: left; color: #ffffff; font-family: system-ui, sans-serif; padding: 4px;">
                    <p style="color: #dc2626; font-size: 0.8rem; font-weight: 700; margin: 0 0 4px;">SANTA LUCÍA ALQUILER</p>
                    <h2 style="font-size: 1.35rem; margin: 0 0 6px; color: #fff;">Solicitar este vehículo</h2>
                    <p style="color: #9ca3af; font-size: 0.85rem; margin: 0 0 14px;">
                        Elige las fechas y revisa el total. El equipo confirmará la disponibilidad de tu solicitud.
                    </p>
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 11px 12px; margin-bottom: 14px; border: 1px solid #303030; border-radius: 8px; background: #191919;">
                        <div>
                            <strong style="display: block; color: #fff;">${car.nombre}</strong>
                            <span style="font-size: 0.8rem; color: #a3a3a3;">${car.categoriaLabel || car.categoria || 'Vehículo'} · ${car.transmision || 'Transmisión por confirmar'}</span>
                        </div>
                        <div style="text-align: right;">
                            <strong style="display: block; white-space: nowrap; color: #fff;">${formatUSD(rates.dailyRate)} / día</strong>
                            <span style="font-size: 0.72rem; color: #a3a3a3;">≈ ${formatUSD(rates.hourlyReference)}/h estimado</span>
                        </div>
                    </div>

                    <form id="res-form-swal">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
                            <div>
                                <label for="swal-pickup" style="display: block; font-size: 0.82rem; font-weight: 600; margin-bottom: 5px;">Recogida *</label>
                                <input type="date" id="swal-pickup" value="${today}" style="width: 100%; padding: 10px; border-radius: 6px; background: #1e1e1e; color: #ffffff; border: 1px solid #333;" />
                            </div>
                            <div>
                                <label for="swal-return" style="display: block; font-size: 0.82rem; font-weight: 600; margin-bottom: 5px;">Devolución *</label>
                                <input type="date" id="swal-return" value="${next3Days}" style="width: 100%; padding: 10px; border-radius: 6px; background: #1e1e1e; color: #ffffff; border: 1px solid #333;" />
                            </div>
                        </div>

                        <div style="margin-bottom: 12px;">
                            <label for="swal-location" style="display: block; font-size: 0.82rem; font-weight: 600; margin-bottom: 5px;">Lugar de recogida</label>
                            <select id="swal-location" style="width: 100%; padding: 10px; border-radius: 6px; background: #1e1e1e; color: #ffffff; border: 1px solid #333;">
                                <option value="San Salvador - Oficina Central (Av. Principal 123)" style="background-color: #1e1e1e; color: #ffffff;">San Salvador - Oficina Central (Av. Principal 123)</option>
                                <option value="Aeropuerto Internacional Oscar Arnulfo Romero" style="background-color: #1e1e1e; color: #ffffff;">Aeropuerto Internacional Óscar Arnulfo Romero</option>
                                <option value="Santa Tecla - Sucursal Cármenes" style="background-color: #1e1e1e; color: #ffffff;">Santa Tecla - Sucursal Cármenes</option>
                            </select>
                        </div>

                        <details style="margin-bottom: 12px; padding: 10px 12px; background: #181818; border: 1px solid #2a2a2a; border-radius: 8px;">
                            <summary style="cursor: pointer; font-size: 0.84rem; font-weight: 600;">Servicios opcionales</summary>
                            <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px; font-size: 0.84rem;">
                                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                    <input type="checkbox" id="extra-seguro" /> Seguro Todo Riesgo (+$15/día)
                                </label>
                                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                    <input type="checkbox" id="extra-gps" /> Navegador GPS (+$5/día)
                                </label>
                                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                    <input type="checkbox" id="extra-silla" /> Silla de Bebé (+$8/día)
                                </label>
                            </div>
                        </details>

                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-radius: 8px; background: #181818; border: 1px solid #2a2a2a;">
                            <span style="font-size: 0.82rem; color: #a3a3a3;"><span id="lbl-days">3 días</span> · Total estimado</span>
                            <strong id="lbl-total" style="font-size: 1.25rem; color: #dc2626;">${formatUSD(defaultQuote.total)}</strong>
                        </div>
                        <p id="lbl-total-fx" style="font-size: 0.78rem; color: #a3a3a3; margin: 6px 0 0; text-align: right;">${fxLabel(defaultQuote.total)}</p>
                        ${distanceKm !== null ? `
                        <p style="font-size: 0.78rem; color: #a3a3a3; margin: 8px 0 0;">
                            📍 La dirección que buscaste en el mapa está a ${distanceKm.toFixed(1)} km de la sucursal.
                        </p>` : ''}
                        <p id="lbl-weather" style="font-size: 0.78rem; color: #a3a3a3; margin: 8px 0 0;">Clima en la sucursal: consultando pronóstico...</p>
                        <p id="lbl-rate-summary" style="font-size: 0.74rem; color: #a3a3a3; margin: 8px 0 0;">
                            Tarifa aplicada: ${formatUSD(defaultQuote.dailyRate)}/día
                            ${defaultQuote.discountRate ? ` · ${Math.round(defaultQuote.discountRate * 100)}% menos por duración` : ''}
                        </p>
                        <p style="font-size: 0.76rem; color: #9ca3af; margin: 10px 0 0;">
                            No se cobra ahora. Continúa por WhatsApp para completar tu solicitud.
                            El precio por hora es solo una referencia y no representa un alquiler por hora.
                        </p>
                    </form>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Enviar solicitud',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#374151',
            background: '#121212',
            width: '480px',
            didOpen: () => {
                const updateCalculations = () => {
                    const pDate = new Date(document.getElementById('swal-pickup').value + 'T00:00:00');
                    const rDate = new Date(document.getElementById('swal-return').value + 'T00:00:00');
                    const diff = rDate - pDate;
                    const days = diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 1;
                    const seguro = document.getElementById('extra-seguro').checked ? 15 : 0;
                    const gps = document.getElementById('extra-gps').checked ? 5 : 0;
                    const silla = document.getElementById('extra-silla').checked ? 8 : 0;
                    const extrasPerDay = seguro + gps + silla;
                    const quote = getRentalQuote(car, days, extrasPerDay);
                    document.getElementById('lbl-days').innerText = `${days} días`;
                    document.getElementById('lbl-total').innerText = formatUSD(quote.total);
                    document.getElementById('lbl-total-fx').innerText = fxLabel(quote.total);
                    document.getElementById('lbl-rate-summary').innerText = [
                        `Tarifa aplicada: ${formatUSD(quote.dailyRate)}/día`,
                        quote.discountRate ? `${Math.round(quote.discountRate * 100)}% menos por duración` : '',
                        extrasPerDay ? `Extras: ${formatUSD(extrasPerDay)}/día` : ''
                    ].filter(Boolean).join(' · ');
                };

                const refreshWeather = () => {
                    const label = document.getElementById('lbl-weather');
                    if (!label) return;
                    const requestId = ++weatherRequestId;
                    weatherText = '';
                    label.innerText = 'Clima en la sucursal: consultando pronóstico...';
                    fetchWeatherForRange(
                        document.getElementById('swal-pickup').value,
                        document.getElementById('swal-return').value
                    )
                        .then((weather) => {
                            if (requestId !== weatherRequestId) return;
                            weatherText = formatWeatherSummary(weather);
                            label.innerText = `Clima en la sucursal: ${weather.summary.icon} ${weatherText}`;
                        })
                        .catch((error) => {
                            if (requestId !== weatherRequestId) return;
                            weatherText = '';
                            label.innerText = `Clima en la sucursal: ${error.message}`;
                        });
                };
                let weatherTimer = null;
                ['swal-pickup', 'swal-return'].forEach((id) => {
                    document.getElementById(id)?.addEventListener('change', () => {
                        window.clearTimeout(weatherTimer);
                        weatherTimer = window.setTimeout(refreshWeather, 350);
                    });
                });
                refreshWeather();

                ['swal-pickup', 'swal-return', 'extra-seguro', 'extra-gps', 'extra-silla'].forEach((id) => {
                    const el = document.getElementById(id);
                    if (el) {
                        el.addEventListener('change', updateCalculations);
                        el.addEventListener('input', updateCalculations);
                    }
                });
            },
            preConfirm: () => {
                const pickupDate = document.getElementById('swal-pickup').value;
                const returnDate = document.getElementById('swal-return').value;
                const location = document.getElementById('swal-location').value;
                const pDate = new Date(pickupDate + 'T00:00:00');
                const rDate = new Date(returnDate + 'T00:00:00');

                if (!pickupDate || !returnDate) {
                    Swal.showValidationMessage('Selecciona las fechas de recogida y devolución.');
                    return false;
                }

                if (rDate <= pDate) {
                    Swal.showValidationMessage('La fecha de devolución debe ser posterior a la de recogida.');
                    return false;
                }

                const isOverlapping = (reservations || []).some((res) => {
                    if (String(res.carId) !== String(car.id) || !isReservationBlocking(res)) return false;

                    const existingStart = new Date(res.fechaInicio + 'T00:00:00');
                    const existingEnd = new Date(res.fechaFin + 'T00:00:00');
                    return pDate < existingEnd && rDate > existingStart;
                });

                if (isOverlapping) {
                    Swal.showValidationMessage('El vehículo ya tiene una reserva activa en esas fechas. Elige un rango distinto.');
                    return false;
                }

                const days = Math.ceil((rDate - pDate) / (1000 * 60 * 60 * 24));
                const extras = [];
                if (document.getElementById('extra-seguro').checked) extras.push('Seguro Todo Riesgo');
                if (document.getElementById('extra-gps').checked) extras.push('Navegador GPS');
                if (document.getElementById('extra-silla').checked) extras.push('Silla de Bebé');
                const extrasPerDay = extras.reduce((total, extra) => (
                    total + (extra === 'Seguro Todo Riesgo' ? 15 : extra === 'Navegador GPS' ? 5 : 8)
                ), 0);
                const quote = getRentalQuote(car, days, extrasPerDay);

                return {
                    carId: car.id,
                    autoNombre: car.nombre,
                    autoImagen: car.imagen || '/fotos/1.jpg',
                    marca: car.marca || '',
                    modelo: car.modelo || '',
                    anio: car.anio ?? null,
                    categoria: car.categoriaLabel || car.categoria,
                    transmision: car.transmision || null,
                    combustible: car.combustible || null,
                    aireAcondicionado: car.aireAcondicionado ?? null,
                    pasajeros: car.pasajeros ?? null,
                    maletas: car.maletas ?? null,
                    maletasEstimado: Boolean(car.maletasEstimado),
                    precioDia: Number(car.precioDia || 0),
                    precioDiaAplicado: quote.dailyRate,
                    descuentoDuracion: quote.discountRate,
                    descuentoMonto: quote.discountAmount,
                    fechaInicio: pickupDate,
                    fechaFin: returnDate,
                    dias: days,
                    lugar: location,
                    extras,
                    monto: quote.total,
                    // Datos provenientes de APIs externas
                    monedaReferencia: currency,
                    tasaCambio: currency === 'USD' ? 1 : (fxRates[currency] ?? null),
                    totalReferencia: currency === 'USD' ? null : convert(quote.total, currency),
                    fechaTasaCambio: currency === 'USD' ? null : ratesDate,
                    climaEstimado: weatherText || null,
                    distanciaSucursalKm: distanceKm === null ? null : Number(distanceKm.toFixed(2)),
                    estado: 'Pendiente',
                    clienteNombre: currentUser?.name || 'Cliente',
                    usuario: currentUser?.email || userEmail,
                    telefono: currentUser?.phone || ''
                };
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                const reservation = addReservation(result.value);
                const { createReservationPdf } = await import('../utils/reservationPdf');
                const pdfUrl = URL.createObjectURL(createReservationPdf(reservation));

                const message = [
                    'Hola, quiero solicitar la reserva de este vehículo.',
                    `Solicitud: ${reservation.id}`,
                    `Cliente: ${reservation.clienteNombre}`,
                    `Correo: ${reservation.usuario}`,
                    `Vehículo: ${reservation.autoNombre}`,
                    `Fechas: ${reservation.fechaInicio} al ${reservation.fechaFin}`,
                    `Tarifa diaria base: ${formatUSD(reservation.precioDia)}`,
                    `Descuento por duración: ${Math.round((reservation.descuentoDuracion || 0) * 100)}%`,
                    `Total estimado: ${formatUSD(reservation.monto)}`,
                    reservation.totalReferencia != null
                        ? `Equivalente referencial: ${formatMoney(reservation.totalReferencia, reservation.monedaReferencia)}`
                        : '',
                    reservation.distanciaSucursalKm != null
                        ? `Distancia a la sucursal: ${reservation.distanciaSucursalKm} km`
                        : '',
                    reservation.climaEstimado ? `Clima estimado: ${reservation.climaEstimado}` : ''
                ].filter(Boolean).join('\n');
                const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;

                Swal.fire({
                    icon: 'info',
                    title: 'Solicitud guardada',
                    html: `
                        <p style="margin: 0 0 8px;">${reservation.autoNombre} · ${reservation.fechaInicio} al ${reservation.fechaFin}</p>
                        <p style="margin: 0 0 14px;">Total estimado: <strong>${formatUSD(reservation.monto)}</strong>
                            ${reservation.totalReferencia != null ? `<br><span style="font-size: 0.85rem; color: #a3a3a3;">≈ ${formatMoney(reservation.totalReferencia, reservation.monedaReferencia)} (referencial)</span>` : ''}
                        </p>
                        <p style="font-size: 0.88rem; color: #a3a3a3; margin: 0 0 14px;">
                            El PDF con los datos del vehículo y tu perfil está listo. La solicitud ya aparece en tus reservas.
                        </p>
                        <div style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: center;">
                            <a href="${pdfUrl}" download="reserva-${reservation.id}.pdf"
                                style="display: inline-block; padding: 11px 14px; border-radius: 7px; background: #374151; color: #fff; font-weight: 700; text-decoration: none;">
                                Descargar PDF
                            </a>
                            <a id="reservation-whatsapp-link" href="${whatsappUrl}" target="_blank" rel="noopener noreferrer"
                                style="display: inline-block; padding: 11px 14px; border-radius: 7px; background: #16a34a; color: #fff; font-weight: 700; text-decoration: none;">
                                Escribir por WhatsApp
                            </a>
                        </div>
                        <p style="font-size: 0.76rem; color: #9ca3af; margin: 12px 0 0;">
                            Continúa por WhatsApp para enviar tu solicitud al equipo de Santa Lucía.
                        </p>
                    `,
                    showConfirmButton: false,
                    showCancelButton: true,
                    cancelButtonText: 'Cerrar',
                    cancelButtonColor: '#374151',
                    background: '#121212',
                    color: '#ffffff',
                    willClose: () => URL.revokeObjectURL(pdfUrl)
                });
            }
        });
    };

    const [selectedVehicleTypes, setSelectedVehicleTypes] = useState({
        autos: true,
        camiones: true,
        vans: true,
        suv: true
    });

    const [passengerFilters, setPassengerFilters] = useState({
        p2: false,
        p3: false,
        p4: false,
        p5: false,
        p7: false
    });

    const [transmissionFilters, setTransmissionFilters] = useState({
        automatica: false,
        manual: false
    });

    const [priceMin, setPriceMin] = useState(0);
    const [priceMax, setPriceMax] = useState(500);
    const [search, setSearch] = useState('');
    const [selectedCar, setSelectedCar] = useState(null);

    const hasCustomPriceError = Number(priceMin || 0) > Number(priceMax || 0);

    const filteredCars = useMemo(() => {
        const now = new Date();
        const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

        return cars.filter((car) => {
            // El catálogo público solo muestra vehículos publicados por el
            // administrador. Las solicitudes de clientes (pendientes) o las
            // publicaciones rechazadas quedan fuera hasta su aprobación.
            if (car.publicado === false || car.estadoPublicacion === 'Rechazado') return false;

            const unavailable = reservations.some(
                (reservation) => String(reservation.carId) === String(car.id)
                    && hasCurrentOrFutureApprovedReservation(reservation, today)
            );
            if (unavailable) return false;

            const vehicleType = getVehicleType(car);
            const typeMatch = selectedVehicleTypes[vehicleType] ?? true;

            const selectedPassengerValues = Object.entries(passengerFilters)
                .filter(([, enabled]) => enabled)
                .map(([key]) => key);

            const passengerMatch =
                selectedPassengerValues.length === 0 ||
                selectedPassengerValues.some((value) => {
                    const requiredPassengers = Number(value.replace('p', ''));
                    return Number(car?.pasajeros || 0) >= requiredPassengers;
                });

            const selectedTransmissionValues = Object.entries(transmissionFilters)
                .filter(([, enabled]) => enabled)
                .map(([key]) => key);

            const transmissionMatch =
                selectedTransmissionValues.length === 0 ||
                selectedTransmissionValues.some((value) => {
                    const normalized = (car?.transmision || '').toLowerCase();

                    if (value === 'automatica') {
                        return normalized.includes('automática') || normalized.includes('automatic');
                    }

                    if (value === 'manual') {
                        return normalized.includes('manual');
                    }

                    return true;
                });

            const min = Number(priceMin || 0);
            const max = Number(priceMax || Number.MAX_SAFE_INTEGER);
            const priceMatch = Number(car?.precioDia ?? 0) >= min && Number(car?.precioDia ?? 0) <= max;
            const searchMatch = `${car?.nombre || ''} ${car?.marca || ''} ${car?.modelo || ''} ${car?.categoria || ''} ${car?.categoriaLabel || ''}`
                .toLowerCase()
                .includes(search.trim().toLowerCase());

            return typeMatch && passengerMatch && transmissionMatch && priceMatch && searchMatch;
        });
    }, [cars, reservations, selectedVehicleTypes, passengerFilters, transmissionFilters, priceMin, priceMax, search]);

    const toggleVehicleType = (key) => {
        setSelectedVehicleTypes((prev) => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const togglePassenger = (key) => {
        setPassengerFilters((prev) => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const toggleTransmission = (key) => {
        setTransmissionFilters((prev) => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const openCarDetails = (car) => {
        setSelectedCar(car);
        // Registramos la consulta para la métrica de "más consultados".
        if (car?.id) registerCarView?.(car.id);
    };
    const closeCarDetails = () => setSelectedCar(null);

    // Mientras la ventana de detalles está abierta, se bloquea el scroll de la
    // página de fondo para que la rueda del mouse desplace solo la ventana.
    useEffect(() => {
        if (!selectedCar) return undefined;
        const previousBody = document.body.style.overflow;
        const previousHtml = document.documentElement.style.overflow;
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousBody;
            document.documentElement.style.overflow = previousHtml;
        };
    }, [selectedCar]);
    const selectedCarRates = selectedCar ? getPublicRateSummary(selectedCar) : null;

    return (
        <section className="rental-layout-section w-full max-w-[1500px] mx-auto px-5 lg:px-10">
            <div className="rental-layout-container grid grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-9">
                <aside className="rental-sidebar">
                    <div className="sidebar-inner">
                        <div className="sidebar-header">
                            <h2 className="sidebar-title">
                                <span className="sidebar-title-icon">
                                    <i className="fas fa-sliders-h"></i>
                                </span>
                                <span>Filtros</span>
                            </h2>
                        </div>

                        <div className="sidebar-divider"></div>

                        <div className="filter-group">
                            <h3 className="filter-group-title">
                                <i className="fas fa-car-side filter-group-icon"></i>
                                <span>Tipo de vehículo</span>
                            </h3>

                            <div className="filter-options">
                                {Object.entries(VEHICLE_FILTERS).map(([key, label]) => (
                                    <label key={key} className="filter-option">
                                        <input
                                            type="checkbox"
                                            className="filter-checkbox"
                                            value={key}
                                            checked={selectedVehicleTypes[key]}
                                            onChange={() => toggleVehicleType(key)}
                                        />
                                        <span className="filter-checkmark"></span>
                                        <span className="filter-label">{label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="filter-group">
                            <h3 className="filter-group-title">
                                <i className="fas fa-users filter-group-icon"></i>
                                <span>Pasajeros</span>
                            </h3>

                            <div className="filter-options filter-options-chips">
                                {['p2', 'p3', 'p4', 'p5', 'p7'].map((value) => (
                                    <label key={value} className="filter-option filter-chip">
                                        <input
                                            type="checkbox"
                                            className="filter-checkbox"
                                            value={value}
                                            checked={passengerFilters[value]}
                                            onChange={() => togglePassenger(value)}
                                        />
                                        <span className="filter-checkmark"></span>
                                        <span className="filter-label">{value.replace('p', '')}+</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="filter-group">
                            <h3 className="filter-group-title">
                                <i className="fas fa-cog filter-group-icon"></i>
                                <span>Transmisión</span>
                            </h3>

                            <div className="filter-options filter-options-segment">
                                {[
                                    { key: 'automatica', label: 'Automática' },
                                    { key: 'manual', label: 'Manual' }
                                ].map((item) => (
                                    <label key={item.key} className="filter-option filter-segment">
                                        <input
                                            type="checkbox"
                                            className="filter-checkbox"
                                            value={item.key}
                                            checked={transmissionFilters[item.key]}
                                            onChange={() => toggleTransmission(item.key)}
                                        />
                                        <span className="filter-checkmark"></span>
                                        <span className="filter-label">{item.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="filter-group">
                            <h3 className="filter-group-title">
                                <i className="fas fa-dollar-sign filter-group-icon"></i>
                                <span>Rango de precios</span>
                            </h3>

                            <div className="price-inputs">
                                <div className="price-input-wrap">
                                    <span className="price-currency">$</span>
                                    <input
                                        type="number"
                                        className="price-input"
                                        placeholder="Min"
                                        min="0"
                                        value={priceMin}
                                        onChange={(e) => setPriceMin(e.target.value)}
                                    />
                                </div>

                                <span className="price-separator">—</span>

                                <div className="price-input-wrap">
                                    <span className="price-currency">$</span>
                                    <input
                                        type="number"
                                        className="price-input"
                                        placeholder="Max"
                                        min="0"
                                        value={priceMax}
                                        onChange={(e) => setPriceMax(e.target.value)}
                                    />
                                </div>
                            </div>

                            {hasCustomPriceError && (
                                <div className="price-filter-error">
                                    El precio mínimo no puede ser mayor que el máximo.
                                </div>
                            )}
                        </div>
                    </div>
                </aside>

                <div className="rental-main-content">
                    <CurrencySelector />
                    <SearchBar value={search} onChange={setSearch} />
                    <div className="rental-top-bar">
                        <div className="rental-options-count">
                            <h2 className="rental-options-title">
                                {filteredCars.length} opciones de categoría de vehículo disponibles
                            </h2>
                        </div>
                    </div>

                    <div className="rental-divider"></div>

                    <div className="rental-category-group">
                        <button type="button" className="rental-category-toggle">
                            <span className="category-toggle-name">Nuestra Flota</span>
                            <span className="category-toggle-count">({filteredCars.length})</span>
                            <i className="fas fa-chevron-down category-toggle-arrow"></i>
                        </button>

                        <div className="rental-categories-grid grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 lg:gap-6" id="rentalCategoriesGrid">
                            {filteredCars.map((car) => (
                                <CarCard
                                    key={car.id}
                                    car={car}
                                    isFavorite={favorites.includes(String(car.id))}
                                    onToggleFavorite={toggleFavorite}
                                    onDetails={openCarDetails}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {selectedCar && (
                <div className="fleet-details-overlay open" aria-hidden="false" onClick={closeCarDetails}>
                    <article
                        className="fleet-details-modal"
                        role="dialog"
                        aria-modal="true"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            className="fleet-details-close"
                            aria-label="Cerrar detalles"
                            onClick={closeCarDetails}
                        >
                            <i className="fas fa-times"></i>
                        </button>

                        <div className="fleet-details-image-wrap">
                            <img
                                className="fleet-details-image"
                                src={selectedCar.imagen || '/fotos/1.jpg'}
                                alt={selectedCar.nombre}
                            />
                        </div>

                        <div className="fleet-details-content">
                            <span className="fleet-details-eyebrow">Detalles del vehículo</span>
                            <h2 className="fleet-details-title">{selectedCar.nombre}</h2>
                            <p className="fleet-details-example">
                                {selectedCar.marca} · {selectedCar.anio ? `Año ${selectedCar.anio}` : 'Año por confirmar'}
                                {` · ${selectedCar.categoriaLabel || selectedCar.categoria || 'Vehículo disponible'}`}
                            </p>

                            {selectedCar.descripcion && (
                                <p className="fleet-details-description">{selectedCar.descripcion}</p>
                            )}

                            {selectedCar.revisionPendiente && (
                                <p className="fleet-details-review">
                                    <strong>Ficha pendiente de revisión.</strong>{' '}
                                    {selectedCar.revisionMotivo || 'Confirma los datos del vehículo antes de publicarlos como definitivos.'}
                                </p>
                            )}

                            <ul className="fleet-details-specs">
                                <li>
                                    <i className="fas fa-cog cat-spec-icon"></i>
                                    <span>Transmisión: {selectedCar.transmision || 'Por confirmar'}</span>
                                </li>
                                <li>
                                    <i className="fas fa-gas-pump cat-spec-icon"></i>
                                    <span>Combustible: {selectedCar.combustible || 'Por confirmar'}</span>
                                </li>
                                <li>
                                    <i className="fas fa-snowflake cat-spec-icon"></i>
                                    <span>
                                        Aire acondicionado: {selectedCar.aireAcondicionado === true
                                            ? 'Sí'
                                            : selectedCar.aireAcondicionado === false
                                                ? 'No'
                                                : 'Por confirmar'}
                                    </span>
                                </li>
                                <li>
                                    <i className="fas fa-users cat-spec-icon"></i>
                                    <span>
                                        Pasajeros: {selectedCar.pasajeros == null
                                            ? 'Por confirmar'
                                            : `${selectedCar.pasajeros}${selectedCar.pasajerosVerificados ? '' : ' (referencia por confirmar)'}`}
                                    </span>
                                </li>
                                <li>
                                    <i className="fas fa-suitcase cat-spec-icon"></i>
                                    <span>
                                        Equipaje: {selectedCar.maletas == null
                                            ? 'Por confirmar'
                                            : `aprox. ${selectedCar.maletas} maletas`}
                                    </span>
                                </li>
                            </ul>

                            <section className="fleet-details-pricing" aria-label="Tarifas de alquiler">
                                <h3>Tarifas de referencia (USD)</h3>
                                <div className="fleet-details-price-main">
                                    <span>Tarifa diaria real</span>
                                    <strong>{formatUSD(selectedCarRates.dailyRate)} / día</strong>
                                </div>
                                <p className="fleet-details-hourly">
                                    Equivalencia estimada: {formatUSD(selectedCarRates.hourlyReference)} / hora
                                    <small>Solo referencia matemática; no se ofrece alquiler por hora.</small>
                                </p>
                                <div className="fleet-details-price-grid">
                                    <div className="fleet-details-price-period">
                                        <span>Semana · 7 días</span>
                                        <strong>{formatUSD(selectedCarRates.weekly.total)}</strong>
                                        <small>{Math.round(selectedCarRates.weekly.discountRate * 100)}% de descuento por duración</small>
                                    </div>
                                    <div className="fleet-details-price-period">
                                        <span>Mes · 30 días</span>
                                        <strong>{formatUSD(selectedCarRates.monthly.total)}</strong>
                                        <small>{Math.round(selectedCarRates.monthly.discountRate * 100)}% de descuento por duración</small>
                                    </div>
                                </div>
                                <p className="fleet-details-tier-note">
                                    Descuentos configurables: 1–2 días sin descuento; 3–7 días 5%; 8–29 días 10%; 30 días o más 15%.
                                </p>
                            </section>

                            <button type="button" className="fleet-details-action" onClick={() => {
                                closeCarDetails();
                                handleOpenReservation(selectedCar);
                            }}>
                                <i className="fas fa-calendar-check"></i>
                                Realizar una reserva
                            </button>
                        </div>
                    </article>
                </div>
            )}
        </section>
    );
};