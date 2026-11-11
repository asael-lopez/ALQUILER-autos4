import { useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { useApp } from '../context/useApp';
import { CarCard } from '../components/CarCard';
import { SearchBar } from '../components/SearchBar';

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
    const { cars, reservations, addReservation, favorites, toggleFavorite } = useApp();

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

        const today = new Date().toISOString().split('T')[0];
        const next3Days = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const carOptionsHtml = cars
            .map(
                (c) =>
                    `<option value="${c.id}" ${c.id === car.id ? 'selected' : ''} style="background-color: #1e1e1e; color: #ffffff;">
                        ${c.nombre} (${c.categoriaLabel || c.categoria}) — $${Number(c.precioDia || 0).toFixed(2)}/día [${c.status || 'Disponible'}]
                    </option>`
            )
            .join('');

        Swal.fire({
            html: `
                <div style="text-align: left; color: #ffffff; font-family: system-ui, sans-serif; padding: 4px;">
                    <div style="display: flex; align-items: center; gap: 8px; color: #dc2626; font-size: 0.85rem; font-weight: bold;">
                        <span>SANTA LUCÍA ALQUILER</span>
                    </div>
                    <h2 style="font-size: 1.5rem; margin: 6px 0 10px 0; color: #fff;">Realizar una Reserva</h2>
                    <p style="color: #9ca3af; font-size: 0.85rem; margin-bottom: 18px;">
                        Selecciona las fechas de tu viaje para verificar disponibilidad garantizada.
                    </p>

                    <form id="res-form-swal">
                        <div style="margin-bottom: 14px;">
                            <label style="display: block; font-size: 0.85rem; font-weight: bold; margin-bottom: 6px;">Vehículo seleccionado *</label>
                            <select id="swal-car-id" style="width: 100%; padding: 10px; border-radius: 6px; background: #1e1e1e; color: #ffffff; border: 1px solid #333;">
                                ${carOptionsHtml}
                            </select>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
                            <div>
                                <label style="display: block; font-size: 0.85rem; font-weight: bold; margin-bottom: 6px;">Fecha de recogida *</label>
                                <input type="date" id="swal-pickup" value="${today}" style="width: 100%; padding: 10px; border-radius: 6px; background: #1e1e1e; color: #ffffff; border: 1px solid #333;" />
                            </div>
                            <div>
                                <label style="display: block; font-size: 0.85rem; font-weight: bold; margin-bottom: 6px;">Fecha de devolución *</label>
                                <input type="date" id="swal-return" value="${next3Days}" style="width: 100%; padding: 10px; border-radius: 6px; background: #1e1e1e; color: #ffffff; border: 1px solid #333;" />
                            </div>
                        </div>

                        <div style="margin-bottom: 14px;">
                            <label style="display: block; font-size: 0.85rem; font-weight: bold; margin-bottom: 6px;">Lugar de recogida / entrega</label>
                            <select id="swal-location" style="width: 100%; padding: 10px; border-radius: 6px; background: #1e1e1e; color: #ffffff; border: 1px solid #333;">
                                <option value="San Salvador - Oficina Central (Av. Principal 123)" style="background-color: #1e1e1e; color: #ffffff;">San Salvador - Oficina Central (Av. Principal 123)</option>
                                <option value="Aeropuerto Internacional Oscar Arnulfo Romero" style="background-color: #1e1e1e; color: #ffffff;">Aeropuerto Internacional Óscar Arnulfo Romero</option>
                                <option value="Santa Tecla - Sucursal Cármenes" style="background-color: #1e1e1e; color: #ffffff;">Santa Tecla - Sucursal Cármenes</option>
                            </select>
                        </div>

                        <div style="margin-bottom: 16px; background: #181818; padding: 12px; border-radius: 8px; border: 1px solid #2a2a2a;">
                            <label style="display: block; font-size: 0.85rem; font-weight: bold; margin-bottom: 8px;">Servicios adicionales opcionales</label>
                            <div style="display: flex; flex-direction: column; gap: 8px; font-size: 0.85rem;">
                                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                    <input type="checkbox" id="extra-seguro" /> Seguro Todo Riesgo (+15$/día)
                                </label>
                                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                    <input type="checkbox" id="extra-gps" /> Navegador GPS (+5$/día)
                                </label>
                                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                    <input type="checkbox" id="extra-silla" /> Silla de Bebé (+8$/día)
                                </label>
                            </div>
                        </div>

                        <div style="background: #181818; padding: 14px; border-radius: 8px; border: 1px solid #2a2a2a; margin-bottom: 20px;">
                            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 4px; color: #9ca3af;">
                                <span>Días calculados:</span>
                                <strong id="lbl-days" style="color: #fff;">3 días</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 4px; color: #9ca3af;">
                                <span>Tarifa base por día:</span>
                                <strong id="lbl-rate" style="color: #fff;">$${Number(car.precioDia || 0).toFixed(2)} / día</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 8px; color: #9ca3af;">
                                <span>Extras seleccionados:</span>
                                <strong id="lbl-extras" style="color: #fff;">$0.00 ($0/día)</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #333; padding-top: 10px;">
                                <span style="font-size: 0.95rem; font-weight: bold;">TOTAL ESTIMADO:</span>
                                <span id="lbl-total" style="font-size: 1.35rem; font-weight: bold; color: #dc2626;">$${(Number(car.precioDia || 0) * 3).toFixed(2)}</span>
                            </div>
                        </div>
                    </form>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Confirmar Reserva',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#374151',
            background: '#121212',
            width: '520px',
            didOpen: () => {
                const updateCalculations = () => {
                    const selectedId = parseInt(document.getElementById('swal-car-id').value, 10);
                    const currentCar = cars.find((c) => c.id === selectedId) || car;
                    const pDate = new Date(document.getElementById('swal-pickup').value + 'T00:00:00');
                    const rDate = new Date(document.getElementById('swal-return').value + 'T00:00:00');

                    const diff = rDate - pDate;
                    const days = diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 1;

                    const seguro = document.getElementById('extra-seguro').checked ? 15 : 0;
                    const gps = document.getElementById('extra-gps').checked ? 5 : 0;
                    const silla = document.getElementById('extra-silla').checked ? 8 : 0;
                    const extrasPerDay = seguro + gps + silla;
                    const total = (Number(currentCar.precioDia || 0) + extrasPerDay) * days;

                    document.getElementById('lbl-days').innerText = `${days} días`;
                    document.getElementById('lbl-rate').innerText = `$${Number(currentCar.precioDia || 0).toFixed(2)} / día`;
                    document.getElementById('lbl-extras').innerText = `$${(extrasPerDay * days).toFixed(2)} ($${extrasPerDay}/día)`;
                    document.getElementById('lbl-total').innerText = `$${total.toFixed(2)}`;
                };

                ['swal-car-id', 'swal-pickup', 'swal-return', 'extra-seguro', 'extra-gps', 'extra-silla'].forEach((id) => {
                    const el = document.getElementById(id);
                    if (el) {
                        el.addEventListener('change', updateCalculations);
                        el.addEventListener('input', updateCalculations);
                    }
                });
            },
            preConfirm: () => {
                const selectedId = parseInt(document.getElementById('swal-car-id').value, 10);
                const currentCar = cars.find((c) => c.id === selectedId) || car;

                if (currentCar.status === 'En Mantenimiento') {
                    Swal.showValidationMessage('El vehículo seleccionado está en revisión técnica por mantenimiento.');
                    return false;
                }

                const pickupDate = document.getElementById('swal-pickup').value;
                const returnDate = document.getElementById('swal-return').value;
                const location = document.getElementById('swal-location').value;

                const pDate = new Date(pickupDate + 'T00:00:00');
                const rDate = new Date(returnDate + 'T00:00:00');

                if (rDate <= pDate) {
                    Swal.showValidationMessage('La fecha de devolución debe ser posterior a la de recogida.');
                    return false;
                }

                const isOverlapping = (reservations || []).some((res) => {
                    if (res.carId !== currentCar.id && parseInt(res.carId, 10) !== currentCar.id) return false;
                    if (res.estado === 'Cancelada' || res.estado === 'Completada') return false;

                    const existingStart = new Date(res.fechaInicio + 'T00:00:00');
                    const existingEnd = new Date(res.fechaFin + 'T00:00:00');
                    return pDate < existingEnd && rDate > existingStart;
                });

                if (isOverlapping) {
                    Swal.showValidationMessage('El vehículo ya tiene una reserva activa en esas fechas. Elige un rango distinto.');
                    return false;
                }

                const days = Math.ceil((rDate - pDate) / (1000 * 60 * 60 * 24));
                const seguro = document.getElementById('extra-seguro').checked ? 15 : 0;
                const gps = document.getElementById('extra-gps').checked ? 5 : 0;
                const silla = document.getElementById('extra-silla').checked ? 8 : 0;
                const extrasPerDay = seguro + gps + silla;

                return {
                    carId: currentCar.id,
                    autoNombre: currentCar.nombre,
                    categoria: currentCar.categoriaLabel || currentCar.categoria,
                    fechaInicio: pickupDate,
                    fechaFin: returnDate,
                    dias: days,
                    lugar: location,
                    monto: (Number(currentCar.precioDia || 0) + extrasPerDay) * days,
                    estado: 'Activa'
                };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                addReservation(result.value);
                Swal.fire({
                    icon: 'success',
                    title: '¡Reserva Confirmada!',
                    html: `Se ha reservado el <strong>${result.value.autoNombre}</strong> del ${result.value.fechaInicio} al ${result.value.fechaFin}.<br/><br/>Total: <strong style="color:#dc2626; font-size:1.2rem;">$${Number(result.value.monto || 0).toFixed(2)}</strong>`,
                    confirmButtonColor: '#dc2626',
                    background: '#121212',
                    color: '#ffffff'
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
        return cars.filter((car) => {
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
            const searchMatch = `${car?.nombre || ''} ${car?.categoria || ''} ${car?.categoriaLabel || ''}`
                .toLowerCase()
                .includes(search.trim().toLowerCase());

            return typeMatch && passengerMatch && transmissionMatch && priceMatch && searchMatch;
        });
    }, [cars, selectedVehicleTypes, passengerFilters, transmissionFilters, priceMin, priceMax, search]);

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

    const openCarDetails = (car) => setSelectedCar(car);
    const closeCarDetails = () => setSelectedCar(null);

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
                                {selectedCar.categoriaLabel || selectedCar.categoria || 'Vehículo disponible'}
                            </p>

                            <ul className="fleet-details-specs">
                                <li>
                                    <i className="fas fa-cog cat-spec-icon"></i>
                                    <span>{selectedCar.transmision || 'Automática'}</span>
                                </li>
                                <li>
                                    <i className="fas fa-users cat-spec-icon"></i>
                                    <span>{selectedCar.pasajeros || 4} pasajeros</span>
                                </li>
                                <li>
                                    <i className="fas fa-suitcase cat-spec-icon"></i>
                                    <span>{selectedCar.maletas || 2} maletas</span>
                                </li>
                                <li>
                                    <i className="fas fa-dollar-sign cat-spec-icon"></i>
                                    <span>${Number(selectedCar.precioDia || 0).toFixed(2)}/día</span>
                                </li>
                            </ul>

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