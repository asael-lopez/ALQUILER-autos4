import { useMemo, useRef, useState } from 'react';
import { useApp } from '../context/useApp';
import { translateText } from '../i18n.js';
import {
    Car,
    CalendarCheck,
    ClipboardCheck,
    Wrench,
    Plus,
    Pencil,
    Trash2,
    Check,
    X,
    Search,
    AlertTriangle,
    CheckCircle2,
    Info,
    History,
    Eye
} from 'lucide-react';
import { StatusBadge } from './Dashboard';
import { ImageUploader } from '../components/ImageUploader';
import { getMovementMeta, getRecentMovements, MOVEMENT_ACTIONS } from '../utils/history';

// ========================================================
// AdminGestion.jsx — PÁGINA 2 del panel admin
// --------------------------------------------------------
// "Gestión y aprobaciones". Reúne en pestañas:
//   · Flota          → CRUD de vehículos (modal + validaciones + imagen)
//   · Reservas       → listado con filtros y búsqueda
//   · Aprobaciones   → solicitudes de reserva y de vehículos pendientes
//   · Mantenimiento  → registros de mantenimiento
//   · Actividad      → historial de movimientos de la flota (3 meses)
// Todos los datos viven en el AppContext (localStorage) y se
// comparten con el modo usuario/cliente.
// ========================================================

// Estado inicial del formulario de vehículo (modo crear)
const EMPTY_CAR = {
    nombre: '',
    marca: '',
    modelo: '',
    anio: '',
    categoria: 'Sedán',
    categoriaLabel: '',
    transmision: 'Automática',
    combustible: 'Gasolina',
    pasajeros: 5,
    maletas: 2,
    kilometraje: '',
    precioDia: '',
    descripcion: '',
    imagen: '',
    status: 'Disponible'
};

const CATEGORIAS = ['Sedán', 'SUV', 'Lujo', 'Vans', 'Pickup'];
const TRANSMISIONES = ['Automática', 'Manual'];
const COMBUSTIBLES = ['Gasolina', 'Diésel', 'Híbrido', 'Eléctrico'];
const ESTADOS_VEHICULO = ['Disponible', 'Alquilado', 'En Mantenimiento'];
const ESTADOS_RESERVA = ['Pendiente', 'Aprobada', 'Rechazada', 'Activa', 'Completada', 'Cancelada'];

// Deduce la marca si el administrador no la escribe.
const inferMarca = (nombre = '') => {
    const first = String(nombre).trim().split(/\s+/)[0];
    return first ? first.charAt(0).toUpperCase() + first.slice(1) : 'Sin marca';
};

export const AdminGestion = () => {
    const {
        cars,
        reservations,
        maintenances,
        vehicleMovements,
        addCar,
        updateCar,
        deleteCar,
        setCarPublicationStatus,
        updateReservationStatus,
        deleteReservation,
        createMaintenance,
        completeMaintenance,
        language
    } = useApp();

    // Pestaña activa dentro de la gestión
    const [activeTab, setActiveTab] = useState('flota');

    // Filtros y búsqueda
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Todos');

    // Estado del modal de vehículo: { open, mode, data }
    const [carModal, setCarModal] = useState({ open: false, mode: 'create', data: EMPTY_CAR });
    const [formError, setFormError] = useState('');

    // Estado del modal de mantenimiento
    const [maintModal, setMaintModal] = useState({ open: false, data: { vehicleId: '', tipo: '', costo: '' } });

    // Diálogo de confirmación estilizado (reemplaza confirm() nativo)
    const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null });

    // Filtros del historial de actividad
    const [historyScope, setHistoryScope] = useState('official'); // official | demo | all
    const [historyAction, setHistoryAction] = useState('Todas');

    // Sistema de notificaciones toast
    const [toasts, setToasts] = useState([]);
    const toastIdRef = useRef(0);

    // ---- Utilidades de feedback ----
    const showToast = (message, type = 'success') => {
        const id = (toastIdRef.current += 1);
        setToasts((prev) => [...prev, { id, message, type }]);
        window.setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3200);
    };

    const askConfirm = (message, onConfirm) => {
        setConfirmState({ open: true, message, onConfirm });
    };

    // ---- Flota: abrir modales ----
    const openCreateCar = () => {
        setFormError('');
        setCarModal({ open: true, mode: 'create', data: EMPTY_CAR });
    };

    const openEditCar = (car) => {
        setFormError('');
        setCarModal({ open: true, mode: 'edit', data: { ...car } });
    };

    const closeCarModal = () => setCarModal({ open: false, mode: 'create', data: EMPTY_CAR });

    // ---- Flota: guardar (crear o editar) con validaciones ----
    const saveCar = (event) => {
        event.preventDefault();
        const data = carModal.data;
        const precio = parseFloat(data.precioDia);
        const pasajeros = parseInt(data.pasajeros, 10);
        const maletas = parseInt(data.maletas, 10);
        const anio = parseInt(data.anio, 10);
        const kilometraje = parseInt(data.kilometraje, 10);

        if (!data.nombre || data.nombre.trim().length < 3) {
            setFormError('El nombre del vehículo debe tener al menos 3 caracteres.');
            return;
        }
        if (isNaN(precio) || precio <= 0) {
            setFormError('El precio por día debe ser un número mayor que 0.');
            return;
        }
        if (isNaN(pasajeros) || pasajeros < 1) {
            setFormError('Indica al menos 1 pasajero.');
            return;
        }
        if (data.anio && (isNaN(anio) || anio < 1990 || anio > 2100)) {
            setFormError('El año debe ser un número válido (1990 - 2100).');
            return;
        }

        const payload = {
            ...data,
            nombre: data.nombre.trim(),
            marca: data.marca.trim() || inferMarca(data.nombre),
            modelo: data.modelo.trim(),
            anio: isNaN(anio) ? null : anio,
            combustible: data.combustible || 'Gasolina',
            kilometraje: isNaN(kilometraje) ? 0 : kilometraje,
            descripcion: data.descripcion.trim(),
            categoriaLabel: data.categoriaLabel.trim() || data.categoria,
            precioDia: precio,
            pasajeros,
            maletas: isNaN(maletas) ? 0 : maletas,
            imagen: data.imagen || '/fotos/1.jpg',
            disponible: data.status === 'Disponible'
        };

        if (carModal.mode === 'create') {
            addCar(payload);
            showToast('Vehículo creado correctamente.', 'success');
        } else {
            updateCar(data.id, payload);
            showToast('Vehículo actualizado correctamente.', 'success');
        }
        closeCarModal();
    };

    // ---- Flota: eliminar con confirmación ----
    const requestDeleteCar = (car) => {
        askConfirm(`¿Eliminar el vehículo "${car.nombre}"? Esta acción no se puede deshacer.`, () => {
            deleteCar(car.id);
            showToast('Vehículo eliminado.', 'info');
        });
    };

    // ---- Publicaciones de vehículos enviados por clientes ----
    const approveCar = (car) => {
        setCarPublicationStatus(car.id, 'Publicado');
        showToast(`"${car.nombre}" publicado en el catálogo.`, 'success');
    };

    const rejectCar = (car) => {
        askConfirm(`¿Rechazar la publicación de "${car.nombre}"? No aparecerá en el catálogo.`, () => {
            setCarPublicationStatus(car.id, 'Rechazado');
            showToast(`Publicación de "${car.nombre}" rechazada.`, 'error');
        });
    };

    // ---- Reservas: aprobar / rechazar ----
    const approveReservation = (r) => {
        updateReservationStatus(r.id, 'Aprobada');
        showToast(`Reserva ${r.id} aprobada.`, 'success');
    };

    const rejectReservation = (r) => {
        askConfirm(`¿Rechazar la reserva ${r.id}? El vehículo quedará libre.`, () => {
            updateReservationStatus(r.id, 'Rechazada');
            showToast(`Reserva ${r.id} rechazada.`, 'error');
        });
    };

    const requestDeleteReservation = (r) => {
        askConfirm(`¿Eliminar la reserva ${r.id}? Se borrará del historial.`, () => {
            deleteReservation(r.id);
            showToast('Reserva eliminada.', 'info');
        });
    };

    // ---- Mantenimiento ----
    const saveMaintenance = (event) => {
        event.preventDefault();
        if (!maintModal.data.vehicleId) {
            showToast('Selecciona un vehículo.', 'error');
            return;
        }
        createMaintenance({
            vehicleId: maintModal.data.vehicleId,
            tipo: maintModal.data.tipo || 'Mantenimiento general',
            costo: parseFloat(maintModal.data.costo) || 0
        });
        showToast('Mantenimiento registrado.', 'success');
        setMaintModal({ open: false, data: { vehicleId: '', tipo: '', costo: '' } });
    };

    const finishMaintenance = (item) => {
        completeMaintenance(item.id);
        showToast('Mantenimiento finalizado.', 'success');
    };

    // ---- Filtrado de reservas (búsqueda + estado) ----
    const filteredReservations = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        return reservations.filter((r) => {
            const matchesStatus = statusFilter === 'Todos' || r.estado === statusFilter;
            const matchesTerm = !term
                || String(r.id).toLowerCase().includes(term)
                || (r.clienteNombre || '').toLowerCase().includes(term)
                || (r.autoNombre || '').toLowerCase().includes(term);
            return matchesStatus && matchesTerm;
        });
    }, [reservations, searchTerm, statusFilter]);

    const pendingReservations = reservations.filter((r) => r.estado === 'Pendiente');
    const pendingCars = cars.filter((car) => car.estadoPublicacion === 'Pendiente');
    const pendingTotal = pendingReservations.length + pendingCars.length;

    // ---- Historial: últimos 3 meses, separando real y DEMO ----
    const historyMovements = useMemo(() => {
        const recent = getRecentMovements(vehicleMovements);
        return recent.filter((movement) => {
            if (historyScope === 'official' && movement.demo) return false;
            if (historyScope === 'demo' && !movement.demo) return false;
            if (historyAction !== 'Todas' && movement.accion !== historyAction) return false;
            return true;
        });
    }, [vehicleMovements, historyScope, historyAction]);

    const historyCounts = useMemo(() => {
        const recent = getRecentMovements(vehicleMovements);
        return {
            official: recent.filter((m) => !m.demo).length,
            demo: recent.filter((m) => m.demo).length,
            total: recent.length
        };
    }, [vehicleMovements]);

    return (
        <div className="admin-page">
            <header className="admin-page-head">
                <div>
                    <h1 className="admin-page-title">Gestión</h1>
                    <p className="admin-page-subtitle">
                        Administra la flota, revisa reservas, aprueba publicaciones y consulta la actividad reciente.
                    </p>
                </div>
            </header>

            {/* Pestañas de gestión */}
            <nav className="admin-tabs" aria-label="Secciones de gestión">
                <TabButton id="flota" active={activeTab} onClick={setActiveTab} icon={<Car size={16} />} label="Flota" />
                <TabButton id="reservas" active={activeTab} onClick={setActiveTab} icon={<CalendarCheck size={16} />} label="Reservas" />
                <TabButton
                    id="aprobaciones"
                    active={activeTab}
                    onClick={setActiveTab}
                    icon={<ClipboardCheck size={16} />}
                    label="Aprobaciones"
                    badge={pendingTotal}
                />
                <TabButton id="mantenimiento" active={activeTab} onClick={setActiveTab} icon={<Wrench size={16} />} label="Mantenimiento" />
                <TabButton id="actividad" active={activeTab} onClick={setActiveTab} icon={<History size={16} />} label="Actividad" />
            </nav>

            {/* -------------------- PESTAÑA: FLOTA -------------------- */}
            {activeTab === 'flota' && (
                <section className="admin-card">
                    <div className="admin-toolbar">
                        <h2 className="admin-card-title no-margin">Vehículos de la flota</h2>
                        <button className="admin-btn admin-btn-primary" type="button" onClick={openCreateCar}>
                            <Plus size={16} /> Nuevo vehículo
                        </button>
                    </div>
                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead>
                            <tr>
                                <th>Imagen</th>
                                <th>Vehículo</th>
                                <th>Categoría</th>
                                <th>Precio/día</th>
                                <th>Estado</th>
                                <th>Publicación</th>
                                <th className="is-right">Acciones</th>
                            </tr>
                            </thead>
                            <tbody>
                            {cars.length === 0 ? (
                                <tr><td colSpan="7" className="admin-empty">No hay vehículos registrados.</td></tr>
                            ) : (
                                cars.map((car) => (
                                    <tr key={car.id}>
                                        <td>
                                            <img
                                                className="admin-table-thumb"
                                                src={car.imagen || '/fotos/1.jpg'}
                                                alt={car.nombre}
                                                onError={(event) => {
                                                    event.currentTarget.onerror = null;
                                                    event.currentTarget.src = '/fotos/1.jpg';
                                                }}
                                            />
                                        </td>
                                        <td>
                                            <span className="admin-cell-strong">{car.nombre}</span>
                                            <span className="admin-cell-sub">{car.marca}{car.anio ? ` · ${car.anio}` : ''} · {car.transmision}</span>
                                        </td>
                                        <td>{car.categoria}</td>
                                        <td className="admin-cell-price">${(parseFloat(car.precioDia) || 0).toFixed(2)}</td>
                                        <td><StatusBadge estado={car.status} /></td>
                                        <td><PublicationBadge estado={car.estadoPublicacion} /></td>
                                        <td className="is-right">
                                            <div className="admin-actions">
                                                {/* Íconos con tooltip (data-tooltip + CSS) */}
                                                {car.estadoPublicacion === 'Pendiente' && (
                                                    <button
                                                        type="button"
                                                        className="admin-icon-btn is-approve"
                                                        data-tooltip="Aprobar publicación"
                                                        aria-label={`Aprobar publicación de ${car.nombre}`}
                                                        onClick={() => approveCar(car)}
                                                    >
                                                        <Check size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    className="admin-icon-btn"
                                                    data-tooltip="Editar"
                                                    aria-label={`Editar ${car.nombre}`}
                                                    onClick={() => openEditCar(car)}
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="admin-icon-btn is-danger"
                                                    data-tooltip="Eliminar"
                                                    aria-label={`Eliminar ${car.nombre}`}
                                                    onClick={() => requestDeleteCar(car)}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {/* -------------------- PESTAÑA: RESERVAS -------------------- */}
            {activeTab === 'reservas' && (
                <section className="admin-card">
                    <div className="admin-toolbar">
                        <h2 className="admin-card-title no-margin">Todas las reservas</h2>
                        <div className="admin-filter-group">
                            <div className="admin-search">
                                <Search size={16} aria-hidden="true" />
                                <input
                                    type="text"
                                    placeholder="Buscar por ID, cliente o vehículo"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <select
                                className="admin-filter"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                aria-label="Filtrar por estado"
                            >
                                <option value="Todos">Todos los estados</option>
                                {ESTADOS_RESERVA.map((estado) => (
                                    <option key={estado} value={estado}>{estado}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead>
                            <tr>
                                <th>ID</th>
                                <th>Cliente</th>
                                <th>Vehículo</th>
                                <th>Fechas</th>
                                <th>Monto</th>
                                <th>Estado</th>
                                <th className="is-right">Acciones</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredReservations.length === 0 ? (
                                <tr><td colSpan="7" className="admin-empty">No se encontraron reservas con esos criterios.</td></tr>
                            ) : (
                                filteredReservations.map((r) => (
                                    <tr key={r.id}>
                                        <td className="admin-cell-strong">{r.id}</td>
                                        <td>{r.clienteNombre || r.usuario || '—'}</td>
                                        <td>{r.autoNombre || 'Vehículo'}</td>
                                        <td className="admin-cell-muted">{r.fechaInicio} → {r.fechaFin}</td>
                                        <td className="admin-cell-price">${(parseFloat(r.monto) || 0).toFixed(2)}</td>
                                        <td><StatusBadge estado={r.estado} /></td>
                                        <td className="is-right">
                                            <div className="admin-actions">
                                                {r.estado === 'Pendiente' && (
                                                    <button
                                                        type="button"
                                                        className="admin-icon-btn is-approve"
                                                        data-tooltip="Aprobar"
                                                        aria-label="Aprobar reserva"
                                                        onClick={() => approveReservation(r)}
                                                    >
                                                        <Check size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    className="admin-icon-btn is-danger"
                                                    data-tooltip="Eliminar"
                                                    aria-label="Eliminar reserva"
                                                    onClick={() => requestDeleteReservation(r)}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {/* -------------------- PESTAÑA: APROBACIONES -------------------- */}
            {activeTab === 'aprobaciones' && (
                <>
                    {/* Vehículos enviados por clientes y pendientes de revisión */}
                    <section className="admin-card">
                        <div className="admin-toolbar">
                            <h2 className="admin-card-title no-margin">Vehículos pendientes de publicación</h2>
                            <span className="admin-page-chip">
                                {translateText(`${pendingCars.length} por revisar`, language)}
                            </span>
                        </div>
                        {pendingCars.length === 0 ? (
                            <p className="admin-empty">No hay vehículos pendientes de aprobación.</p>
                        ) : (
                            <ul className="admin-approval-list">
                                {pendingCars.map((car) => (
                                    <li key={car.id} className="admin-approval-item">
                                        <img
                                            className="admin-table-thumb"
                                            src={car.imagen || '/fotos/1.jpg'}
                                            alt={car.nombre}
                                            onError={(event) => {
                                                event.currentTarget.onerror = null;
                                                event.currentTarget.src = '/fotos/1.jpg';
                                            }}
                                        />
                                        <div className="admin-approval-info">
                                            <strong>{car.nombre}</strong>
                                            <span>
                                                {car.marca}{car.anio ? ` · ${car.anio}` : ''} · {car.categoria}
                                                {' · '}${(parseFloat(car.precioDia) || 0).toFixed(2)}/día
                                            </span>
                                            <span className="admin-cell-muted">Enviado por: {car.creadoPor || 'cliente'}</span>
                                        </div>
                                        <PublicationBadge estado={car.estadoPublicacion} />
                                        <div className="admin-actions">
                                            <button
                                                type="button"
                                                className="admin-btn admin-btn-approve"
                                                onClick={() => approveCar(car)}
                                            >
                                                <Check size={15} /> Publicar
                                            </button>
                                            <button
                                                type="button"
                                                className="admin-btn admin-btn-reject"
                                                onClick={() => rejectCar(car)}
                                            >
                                                <X size={15} /> Rechazar
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    {/* Solicitudes de reserva pendientes */}
                    <section className="admin-card">
                        <div className="admin-toolbar">
                            <h2 className="admin-card-title no-margin">Solicitudes de reserva pendientes</h2>
                            <span className="admin-page-chip">
                                {translateText(`${pendingReservations.length} por revisar`, language)}
                            </span>
                        </div>
                        {pendingReservations.length === 0 ? (
                            <p className="admin-empty">No hay solicitudes pendientes. Todo está al día.</p>
                        ) : (
                            <ul className="admin-approval-list">
                                {pendingReservations.map((r) => (
                                    <li key={r.id} className="admin-approval-item">
                                        <div className="admin-approval-info">
                                            <strong>{r.autoNombre || 'Vehículo'}</strong>
                                            <span>{r.clienteNombre || r.usuario} · {r.fechaInicio} → {r.fechaFin}</span>
                                        </div>
                                        <span className="admin-cell-price">${(parseFloat(r.monto) || 0).toFixed(2)}</span>
                                        <StatusBadge estado={r.estado} />
                                        <div className="admin-actions">
                                            <button
                                                type="button"
                                                className="admin-btn admin-btn-approve"
                                                onClick={() => approveReservation(r)}
                                            >
                                                <Check size={15} /> Aprobar
                                            </button>
                                            <button
                                                type="button"
                                                className="admin-btn admin-btn-reject"
                                                onClick={() => rejectReservation(r)}
                                            >
                                                <X size={15} /> Rechazar
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </>
            )}

            {/* -------------------- PESTAÑA: MANTENIMIENTO -------------------- */}
            {activeTab === 'mantenimiento' && (
                <section className="admin-card">
                    <div className="admin-toolbar">
                        <h2 className="admin-card-title no-margin">Registros de mantenimiento</h2>
                        <button
                            className="admin-btn admin-btn-primary"
                            type="button"
                            onClick={() => setMaintModal({ open: true, data: { vehicleId: '', tipo: '', costo: '' } })}
                        >
                            <Plus size={16} /> Nuevo registro
                        </button>
                    </div>
                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead>
                            <tr>
                                <th>ID</th>
                                <th>Vehículo</th>
                                <th>Tipo</th>
                                <th>Costo</th>
                                <th>Estado</th>
                                <th className="is-right">Acciones</th>
                            </tr>
                            </thead>
                            <tbody>
                            {maintenances.length === 0 ? (
                                <tr><td colSpan="6" className="admin-empty">No hay registros de mantenimiento.</td></tr>
                            ) : (
                                maintenances.map((m) => {
                                    const car = cars.find((c) => String(c.id) === String(m.vehicleId));
                                    return (
                                        <tr key={m.id}>
                                            <td className="admin-cell-strong">{m.id}</td>
                                            <td>{car ? car.nombre : 'Vehículo eliminado'}</td>
                                            <td className="admin-cell-muted">{m.tipo}</td>
                                            <td className="admin-cell-price">${(parseFloat(m.costo) || 0).toFixed(2)}</td>
                                            <td><StatusBadge estado={m.estado} /></td>
                                            <td className="is-right">
                                                {m.estado !== 'Finalizado' && (
                                                    <button
                                                        type="button"
                                                        className="admin-icon-btn is-approve"
                                                        data-tooltip="Finalizar"
                                                        aria-label="Finalizar mantenimiento"
                                                        onClick={() => finishMaintenance(m)}
                                                    >
                                                        <CheckCircle2 size={16} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {/* -------------------- PESTAÑA: ACTIVIDAD -------------------- */}
            {activeTab === 'actividad' && (
                <section className="admin-card">
                    <div className="admin-toolbar">
                        <div>
                            <h2 className="admin-card-title no-margin">Historial de actividad</h2>
                            <p className="admin-page-subtitle no-margin">
                                Movimientos de vehículos de los últimos 3 meses.
                            </p>
                        </div>
                        <div className="admin-filter-group">
                            <select
                                className="admin-filter"
                                value={historyAction}
                                onChange={(e) => setHistoryAction(e.target.value)}
                                aria-label="Filtrar por tipo de acción"
                            >
                                <option value="Todas">Todas las acciones</option>
                                {Object.entries({
                                    [MOVEMENT_ACTIONS.CREATE]: 'Registro',
                                    [MOVEMENT_ACTIONS.PUBLICATION_REQUEST]: 'Solicitud',
                                    [MOVEMENT_ACTIONS.PUBLISHED]: 'Publicación',
                                    [MOVEMENT_ACTIONS.REJECTED]: 'Rechazo',
                                    [MOVEMENT_ACTIONS.PRICE_CHANGE]: 'Precio',
                                    [MOVEMENT_ACTIONS.STATUS_CHANGE]: 'Disponibilidad',
                                    [MOVEMENT_ACTIONS.IMAGE_UPDATE]: 'Imagen',
                                    [MOVEMENT_ACTIONS.RESERVED]: 'Reserva',
                                    [MOVEMENT_ACTIONS.RENTED]: 'Alquiler',
                                    [MOVEMENT_ACTIONS.MAINTENANCE]: 'Mantenimiento',
                                    [MOVEMENT_ACTIONS.DELETE]: 'Eliminación'
                                }).map(([value, label]) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Segmentado: separa los registros oficiales de los DEMO */}
                    <div className="admin-segment" role="group" aria-label="Origen de los registros">
                        <button
                            type="button"
                            className={historyScope === 'official' ? 'is-active' : ''}
                            onClick={() => setHistoryScope('official')}
                        >
                            {translateText(`Oficiales (${historyCounts.official})`, language)}
                        </button>
                        <button
                            type="button"
                            className={historyScope === 'demo' ? 'is-active' : ''}
                            onClick={() => setHistoryScope('demo')}
                        >
                            {translateText(`DEMO (${historyCounts.demo})`, language)}
                        </button>
                        <button
                            type="button"
                            className={historyScope === 'all' ? 'is-active' : ''}
                            onClick={() => setHistoryScope('all')}
                        >
                            {translateText(`Todos (${historyCounts.total})`, language)}
                        </button>
                    </div>

                    {historyMovements.length === 0 ? (
                        <p className="admin-empty">
                            No hay movimientos para este filtro. Las operaciones nuevas se registrarán aquí automáticamente.
                        </p>
                    ) : (
                        <ul className="admin-history-list">
                            {historyMovements.map((movement) => {
                                const meta = getMovementMeta(movement.accion);
                                return (
                                    <li key={movement.id} className="admin-history-item">
                                        <img
                                            className="admin-table-thumb"
                                            src={movement.imagen || '/fotos/1.jpg'}
                                            alt={movement.vehiculoNombre || 'Vehículo'}
                                            onError={(event) => {
                                                event.currentTarget.onerror = null;
                                                event.currentTarget.src = '/fotos/1.jpg';
                                            }}
                                        />
                                        <div className="admin-history-info">
                                            <div className="admin-history-head">
                                                <strong>{movement.vehiculoNombre || 'Vehículo'}</strong>
                                                <span className={`status-badge ${meta.tone}`}>{meta.label}</span>
                                                {movement.demo && <span className="admin-demo-tag">DEMO</span>}
                                            </div>
                                            <span className="admin-history-detail">{movement.detalle}</span>
                                            <span className="admin-cell-muted">
                                                {movement.marca ? `${movement.marca} · ` : ''}
                                                {new Date(movement.fecha).toLocaleString(language === 'en' ? 'en-US' : 'es-SV', {
                                                    day: '2-digit', month: 'short', year: 'numeric',
                                                    hour: '2-digit', minute: '2-digit'
                                                })}
                                                {' · '}{movement.usuarioNombre || movement.usuario || 'Sistema'}
                                            </span>
                                        </div>
                                        {(movement.estadoAnterior || movement.estadoNuevo) && (
                                            <div className="admin-history-states">
                                                <span className="admin-cell-muted">Antes: {movement.estadoAnterior || '—'}</span>
                                                <span className="admin-cell-muted">Después: {movement.estadoNuevo || '—'}</span>
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>
            )}

            {/* -------------------- MODAL: VEHÍCULO -------------------- */}
            {carModal.open && (
                <div className="admin-modal-overlay" role="dialog" aria-modal="true">
                    <div className="admin-modal">
                        <div className="admin-modal-head">
                            <h2>{carModal.mode === 'create' ? 'Nuevo vehículo' : 'Editar vehículo'}</h2>
                            <button
                                type="button"
                                className="admin-modal-close"
                                aria-label="Cerrar"
                                onClick={closeCarModal}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <form className="admin-form" onSubmit={saveCar}>
                            <div className="admin-form-grid">
                                <label className="admin-form-field is-full">
                                    <span>Nombre del vehículo</span>
                                    <input
                                        type="text"
                                        value={carModal.data.nombre}
                                        onChange={(e) => setCarModal((s) => ({ ...s, data: { ...s.data, nombre: e.target.value } }))}
                                        placeholder="Ej. Toyota Corolla"
                                    />
                                </label>
                                <label className="admin-form-field">
                                    <span>Marca</span>
                                    <input
                                        type="text"
                                        value={carModal.data.marca}
                                        onChange={(e) => setCarModal((s) => ({ ...s, data: { ...s.data, marca: e.target.value } }))}
                                        placeholder="Ej. Toyota"
                                    />
                                </label>
                                <label className="admin-form-field">
                                    <span>Modelo</span>
                                    <input
                                        type="text"
                                        value={carModal.data.modelo}
                                        onChange={(e) => setCarModal((s) => ({ ...s, data: { ...s.data, modelo: e.target.value } }))}
                                        placeholder="Ej. Corolla"
                                    />
                                </label>
                                <label className="admin-form-field">
                                    <span>Año</span>
                                    <input
                                        type="number"
                                        min="1990"
                                        max="2100"
                                        value={carModal.data.anio}
                                        onChange={(e) => setCarModal((s) => ({ ...s, data: { ...s.data, anio: e.target.value } }))}
                                        placeholder="2023"
                                    />
                                </label>
                                <label className="admin-form-field">
                                    <span>Categoría</span>
                                    <select
                                        value={carModal.data.categoria}
                                        onChange={(e) => setCarModal((s) => ({ ...s, data: { ...s.data, categoria: e.target.value } }))}
                                    >
                                        {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </label>
                                <label className="admin-form-field">
                                    <span>Etiqueta de categoría</span>
                                    <input
                                        type="text"
                                        value={carModal.data.categoriaLabel}
                                        onChange={(e) => setCarModal((s) => ({ ...s, data: { ...s.data, categoriaLabel: e.target.value } }))}
                                        placeholder="Ej. Autos (Compacto)"
                                    />
                                </label>
                                <label className="admin-form-field">
                                    <span>Transmisión</span>
                                    <select
                                        value={carModal.data.transmision}
                                        onChange={(e) => setCarModal((s) => ({ ...s, data: { ...s.data, transmision: e.target.value } }))}
                                    >
                                        {TRANSMISIONES.map((t) => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </label>
                                <label className="admin-form-field">
                                    <span>Combustible</span>
                                    <select
                                        value={carModal.data.combustible}
                                        onChange={(e) => setCarModal((s) => ({ ...s, data: { ...s.data, combustible: e.target.value } }))}
                                    >
                                        {COMBUSTIBLES.map((c) => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </label>
                                <label className="admin-form-field">
                                    <span>Precio por día ($)</span>
                                    <input
                                        type="number"
                                        min="1"
                                        step="0.01"
                                        value={carModal.data.precioDia}
                                        onChange={(e) => setCarModal((s) => ({ ...s, data: { ...s.data, precioDia: e.target.value } }))}
                                        placeholder="0.00"
                                    />
                                </label>
                                <label className="admin-form-field">
                                    <span>Kilometraje</span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={carModal.data.kilometraje}
                                        onChange={(e) => setCarModal((s) => ({ ...s, data: { ...s.data, kilometraje: e.target.value } }))}
                                        placeholder="0"
                                    />
                                </label>
                                <label className="admin-form-field">
                                    <span>Pasajeros</span>
                                    <input
                                        type="number"
                                        min="1"
                                        value={carModal.data.pasajeros}
                                        onChange={(e) => setCarModal((s) => ({ ...s, data: { ...s.data, pasajeros: e.target.value } }))}
                                    />
                                </label>
                                <label className="admin-form-field">
                                    <span>Maletas</span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={carModal.data.maletas}
                                        onChange={(e) => setCarModal((s) => ({ ...s, data: { ...s.data, maletas: e.target.value } }))}
                                    />
                                </label>
                                <label className="admin-form-field">
                                    <span>Estado</span>
                                    <select
                                        value={carModal.data.status}
                                        onChange={(e) => setCarModal((s) => ({ ...s, data: { ...s.data, status: e.target.value } }))}
                                    >
                                        {ESTADOS_VEHICULO.map((e2) => <option key={e2} value={e2}>{e2}</option>)}
                                    </select>
                                </label>
                                <label className="admin-form-field is-full">
                                    <span>Descripción</span>
                                    <textarea
                                        rows="2"
                                        value={carModal.data.descripcion}
                                        onChange={(e) => setCarModal((s) => ({ ...s, data: { ...s.data, descripcion: e.target.value } }))}
                                        placeholder="Breve descripción del vehículo"
                                    />
                                </label>
                                <div className="admin-form-field is-full">
                                    <ImageUploader
                                        value={carModal.data.imagen}
                                        onChange={(imagen) => setCarModal((s) => ({ ...s, data: { ...s.data, imagen } }))}
                                    />
                                </div>
                            </div>
                            {formError && <p className="admin-form-error">{formError}</p>}
                            <div className="admin-modal-actions">
                                <button
                                    type="button"
                                    className="admin-btn admin-btn-ghost"
                                    onClick={closeCarModal}
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="admin-btn admin-btn-primary">
                                    {carModal.mode === 'create' ? 'Crear vehículo' : 'Guardar cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* -------------------- MODAL: MANTENIMIENTO -------------------- */}
            {maintModal.open && (
                <div className="admin-modal-overlay" role="dialog" aria-modal="true">
                    <div className="admin-modal">
                        <div className="admin-modal-head">
                            <h2>Nuevo mantenimiento</h2>
                            <button
                                type="button"
                                className="admin-modal-close"
                                aria-label="Cerrar"
                                onClick={() => setMaintModal({ open: false, data: { vehicleId: '', tipo: '', costo: '' } })}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <form className="admin-form" onSubmit={saveMaintenance}>
                            <div className="admin-form-grid">
                                <label className="admin-form-field is-full">
                                    <span>Vehículo</span>
                                    <select
                                        value={maintModal.data.vehicleId}
                                        onChange={(e) => setMaintModal((s) => ({ ...s, data: { ...s.data, vehicleId: e.target.value } }))}
                                    >
                                        <option value="">Selecciona un vehículo...</option>
                                        {cars.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                    </select>
                                </label>
                                <label className="admin-form-field">
                                    <span>Tipo de mantenimiento</span>
                                    <input
                                        type="text"
                                        value={maintModal.data.tipo}
                                        onChange={(e) => setMaintModal((s) => ({ ...s, data: { ...s.data, tipo: e.target.value } }))}
                                        placeholder="Ej. Cambio de aceite"
                                    />
                                </label>
                                <label className="admin-form-field">
                                    <span>Costo ($)</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={maintModal.data.costo}
                                        onChange={(e) => setMaintModal((s) => ({ ...s, data: { ...s.data, costo: e.target.value } }))}
                                        placeholder="0.00"
                                    />
                                </label>
                            </div>
                            <div className="admin-modal-actions">
                                <button
                                    type="button"
                                    className="admin-btn admin-btn-ghost"
                                    onClick={() => setMaintModal({ open: false, data: { vehicleId: '', tipo: '', costo: '' } })}
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="admin-btn admin-btn-primary">Registrar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* -------------------- CONFIRMACIÓN ESTILIZADA -------------------- */}
            {confirmState.open && (
                <div className="admin-modal-overlay" role="dialog" aria-modal="true">
                    <div className="admin-modal is-small">
                        <div className="admin-confirm-icon">
                            <AlertTriangle size={26} />
                        </div>
                        <h2 className="admin-confirm-title">Confirmar acción</h2>
                        <p className="admin-confirm-text">{confirmState.message}</p>
                        <div className="admin-modal-actions is-center">
                            <button
                                type="button"
                                className="admin-btn admin-btn-ghost"
                                onClick={() => setConfirmState({ open: false, message: '', onConfirm: null })}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className="admin-btn admin-btn-danger"
                                onClick={() => {
                                    if (confirmState.onConfirm) confirmState.onConfirm();
                                    setConfirmState({ open: false, message: '', onConfirm: null });
                                }}
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* -------------------- TOASTS -------------------- */}
            <div className="admin-toast-container" aria-live="polite">
                {toasts.map((t) => (
                    <div key={t.id} className={`admin-toast is-${t.type}`}>
                        <span className="admin-toast-icon">
                            {t.type === 'success' && <CheckCircle2 size={16} />}
                            {t.type === 'error' && <AlertTriangle size={16} />}
                            {t.type === 'info' && <Info size={16} />}
                        </span>
                        {t.message}
                    </div>
                ))}
            </div>
        </div>
    );
};

// Badge para el estado de publicación de un vehículo.
const PublicationBadge = ({ estado }) => {
    const clase = {
        Publicado: 'is-ok',
        Pendiente: 'is-warning',
        Rechazado: 'is-danger'
    }[estado] || 'is-neutral';
    return (
        <span className={`status-badge ${clase}`}>
            <Eye size={13} aria-hidden="true" />
            {estado || 'Publicado'}
        </span>
    );
};

// Botón de pestaña reutilizable, con contador opcional (badge)
const TabButton = ({ id, active, onClick, icon, label, badge }) => (
    <button
        type="button"
        className={`admin-tab${active === id ? ' is-active' : ''}`}
        onClick={() => onClick(id)}
    >
        {icon}
        <span>{label}</span>
        {badge > 0 && <span className="admin-tab-badge">{badge}</span>}
    </button>
);
