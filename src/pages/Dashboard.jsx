import { useState } from 'react';
import { useApp } from '../context/useApp';
import Swal from 'sweetalert2';
import { ClipboardList, RefreshCw, Star, Wallet } from 'lucide-react';
import { Button } from '../components/Button';
import { CarCard } from '../components/CarCard';

export const Dashboard = () => {
    const {
        role,
        toggleRole,
        userEmail,
        cars,
        addCar,
        updateCar,
        deleteCar,
        reservations,
        updateReservationStatus,
        deleteReservation,
        returnCar,
        maintenances,
        createMaintenance,
        completeMaintenance
    } = useApp();

    const [activeAdminTab, setActiveAdminTab] = useState('fleet');

    // Cálculo de Métricas Dinámicas (ADMIN vs CLIENTE)
    const isAdmin = role === 'ADMIN';

    // Métricas Admin
    const totalFleetCount = cars.length;
    const totalReservationsCount = reservations.length;
    const totalIncome = reservations.reduce((acc, r) => acc + parseFloat(r.monto || 0), 0);
    const rentedCarsCount = cars.filter((c) => c.status === 'Alquilado' || !c.disponible).length;
    const efficiency = totalFleetCount > 0 ? Math.round((rentedCarsCount / totalFleetCount) * 100) : 0;
    const inProgressMaintenancesCount = maintenances.filter((m) => m.estado === 'En curso').length;

    // Métricas Cliente
    const clientReservations = reservations.filter((r) => r.usuario === userEmail || isAdmin);
    const clientActiveCount = clientReservations.filter((r) => r.estado === 'Activa' || r.estado === 'Pendiente').length;
    const clientTotalSpent = clientReservations.reduce((acc, r) => acc + parseFloat(r.monto || 0), 0);
    const clientPoints = Math.floor(clientTotalSpent * 10);

    // Modal para Nuevo Vehículo
    const openVehicleModal = (vehicle = null) => {
        Swal.fire({
            title: vehicle ? 'Editar Vehículo de la Flota' : 'Agregar Vehículo a la Flota',
            html: `
        <input id="swal-car-name" class="swal2-input" placeholder="Nombre / Modelo (Ej: Nissan Versa)">
        <select id="swal-car-cat" class="swal2-select" style="display:flex; width: 80%; margin: 10px auto;">
          <option value="Sedán">Sedán</option>
          <option value="SUV">SUV</option>
          <option value="Pickup">Pickup / Camiones</option>
          <option value="Lujo">Lujo</option>
        </select>
        <input id="swal-car-price" type="number" class="swal2-input" placeholder="Precio por Día ($)">
        <select id="swal-car-trans" class="swal2-select" style="display:flex; width: 80%; margin: 10px auto;">
          <option value="Automática">Automática</option>
          <option value="Manual">Manual</option>
        </select>
      `,
            showCancelButton: true,
            confirmButtonText: vehicle ? 'Guardar Cambios' : 'Guardar Vehículo',
            confirmButtonColor: '#dc2626',
            background: '#121212',
            color: '#ffffff',
            didOpen: () => {
                if (!vehicle) return;
                document.getElementById('swal-car-name').value = vehicle.nombre || '';
                document.getElementById('swal-car-cat').value = vehicle.categoria || 'Sedán';
                document.getElementById('swal-car-price').value = vehicle.precioDia ?? '';
                document.getElementById('swal-car-trans').value = vehicle.transmision || 'Automática';
            },
            preConfirm: () => {
                const nombre = document.getElementById('swal-car-name').value.trim();
                const categoria = document.getElementById('swal-car-cat').value;
                const precioDia = parseFloat(document.getElementById('swal-car-price').value);
                const transmision = document.getElementById('swal-car-trans').value;

                if (!nombre || !Number.isFinite(precioDia) || precioDia <= 0) {
                    Swal.showValidationMessage('Completa el nombre y el precio.');
                    return false;
                }
                return {
                    ...vehicle,
                    nombre,
                    categoria,
                    precioDia,
                    transmision,
                    pasajeros: vehicle?.pasajeros || 5,
                    maletas: vehicle?.maletas || 2,
                    imagen: vehicle?.imagen || '/fotos/carro1.jpg'
                };
            }
        }).then((res) => {
            if (res.isConfirmed) {
                if (vehicle) {
                    updateCar(vehicle.id, res.value);
                } else {
                    addCar(res.value);
                }
                Swal.fire({ icon: 'success', title: vehicle ? 'Vehículo Actualizado' : 'Vehículo Guardado', background: '#121212', color: '#fff', confirmButtonColor: '#dc2626' });
            }
        });
    };

    // Modal para Registrar Mantenimiento
    const openMaintenanceModal = () => {
        const optionsHtml = cars
            .map((c) => `<option value="${c.id}" style="background-color: #1e1e1e; color: #ffffff;">${c.nombre} [${c.status || 'Disponible'}]</option>`)
            .join('');

        Swal.fire({
            title: 'Registrar Mantenimiento',
            html: `
        <select id="swal-maint-car" class="swal2-select" style="display:flex; width: 80%; margin: 10px auto; background-color: #1e1e1e; color: #ffffff; border: 1px solid #333;">
          ${optionsHtml}
        </select>
        <input id="swal-maint-type" class="swal2-input" placeholder="Tipo (Ej: Cambio de Aceite, Frenos)" style="background-color: #1e1e1e; color: #ffffff; border: 1px solid #333;">
        <input id="swal-maint-cost" type="number" class="swal2-input" placeholder="Costo ($)" style="background-color: #1e1e1e; color: #ffffff; border: 1px solid #333;">
        <input id="swal-maint-km" type="number" class="swal2-input" placeholder="Kilometraje (km)" style="background-color: #1e1e1e; color: #ffffff; border: 1px solid #333;">
        <textarea id="swal-maint-obs" class="swal2-textarea" placeholder="Observaciones" style="background-color: #1e1e1e; color: #ffffff; border: 1px solid #333;"></textarea>
      `,
            showCancelButton: true,
            confirmButtonText: 'Registrar Mantenimiento',
            confirmButtonColor: '#dc2626',
            background: '#121212',
            color: '#ffffff',
            preConfirm: () => {
                const vehicleId = document.getElementById('swal-maint-car').value;
                const tipo = document.getElementById('swal-maint-type').value;
                const costo = parseFloat(document.getElementById('swal-maint-cost').value || 0);
                const kilometraje = parseInt(document.getElementById('swal-maint-km').value || 0, 10);
                const observaciones = document.getElementById('swal-maint-obs').value;
                const vehicleObj = cars.find((c) => c.id === parseInt(vehicleId, 10));

                if (!tipo) {
                    Swal.showValidationMessage('Ingresa el tipo de mantenimiento.');
                    return false;
                }

                return {
                    vehicleId,
                    vehicleName: vehicleObj ? vehicleObj.nombre : 'Vehículo',
                    tipo,
                    costo,
                    kilometraje,
                    observaciones,
                    fecha: new Date().toLocaleDateString()
                };
            }
        }).then((res) => {
            if (res.isConfirmed) {
                createMaintenance(res.value);
                Swal.fire({ icon: 'success', title: 'Mantenimiento Registrado', background: '#121212', color: '#fff', confirmButtonColor: '#dc2626' });
            }
        });
    };

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px', fontFamily: 'system-ui, sans-serif' }}>

            {/* Encabezado e Indicador de Rol */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '2.2rem', fontWeight: 'bold', margin: 0, color: '#ffffff' }}>Panel de control</h1>
                    <p style={{ color: '#a3a3a3', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
                        Gestión integral de flota, reservas y métricas calculadas en tiempo real.
                    </p>
                </div>

                {/* Botón de Rol Idéntico a la Captura */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
              background: isAdmin ? '#dc2626' : '#2563eb',
              color: '#ffffff',
              padding: '8px 18px',
              borderRadius: '6px',
              fontWeight: 'bold',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
          }}>
            ROL: {role}
          </span>
                    <button
                        onClick={toggleRole}
                        style={{
                            background: '#262626',
                            color: '#ffffff',
                            border: '1px solid #404040',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '0.85rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <RefreshCw size={16} aria-hidden="true" />
                        Cambiar Rol
                    </button>
                </div>
            </div>

            {/* Pestañas de Gestión (Solo Visibles en ROL ADMIN) */}
            {isAdmin && (
                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                    <button onClick={() => setActiveAdminTab('fleet')} style={tabBtnStyle(activeAdminTab === 'fleet')}>
                        Gestión de Flota (CRUD)
                    </button>
                    <button onClick={() => setActiveAdminTab('reservations')} style={tabBtnStyle(activeAdminTab === 'reservations')}>
                        Gestión de Reservas (CRUD)
                    </button>
                    <button onClick={() => setActiveAdminTab('maintenance')} style={tabBtnStyle(activeAdminTab === 'maintenance')}>
                        Mantenimiento ({inProgressMaintenancesCount})
                    </button>
                </div>
            )}

            {/* Métricas Dinámicas Adaptativas (ADMIN vs CLIENTE) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
                <MetricCard
                    icon=""
                    label={isAdmin ? 'FLOTA TOTAL' : 'Vehículos Alquilados'}
                    value={isAdmin ? totalFleetCount : clientActiveCount}
                />
                <MetricCard
                    icon=""
                    label={isAdmin ? 'RESERVAS TOTALES' : 'Reservas Activas'}
                    value={isAdmin ? totalReservationsCount : clientActiveCount}
                />
                <MetricCard
                    icon={<Wallet size={20} aria-hidden="true" />}
                    label={isAdmin ? 'INGRESOS DEL MES' : 'Gasto Acumulado'}
                    value={isAdmin ? `$${totalIncome.toFixed(2)}` : `$${clientTotalSpent.toFixed(2)}`}
                />
                <MetricCard
                    icon=""
                    label={isAdmin ? 'EFICIENCIA DE FLOTA' : 'Puntos Fidelidad'}
                    value={isAdmin ? `${efficiency}%` : `${clientPoints} pts`}
                />
            </div>

            {/* Grid de Contenido Principal + Notificaciones */}
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '24px' }}>

                {/* Columna Principal de Tablas */}
                <div style={{ background: '#121212', border: '1px solid #262626', borderRadius: '8px', padding: '20px' }}>

                    {/* VISTAS ADMINISTRADOR */}
                    {isAdmin ? (
                        <>
                            {/* TAB 1: CRUD FLOTA */}
                            {activeAdminTab === 'fleet' && (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                        <h2 style={{ fontSize: '1.2rem', color: '#fff', margin: 0 }}>Catálogo y Flota de Vehículos</h2>
                                        <Button onClick={() => openVehicleModal()} style={primaryActionBtnStyle}>
                                            + Nuevo Vehículo
                                        </Button>
                                    </div>
                                    <table style={tableStyle}>
                                        <thead>
                                        <tr style={tableHeaderStyle}>
                                            <th style={{ padding: '10px' }}>Foto</th>
                                            <th style={{ padding: '10px' }}>Modelo / Vehículo</th>
                                            <th style={{ padding: '10px' }}>Categoría</th>
                                            <th style={{ padding: '10px' }}>Transmisión</th>
                                            <th style={{ padding: '10px' }}>Pasajeros</th>
                                            <th style={{ padding: '10px' }}>Precio/Día</th>
                                            <th style={{ padding: '10px' }}>Estado</th>
                                            <th style={{ padding: '10px', textAlign: 'right' }}>Acciones</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {cars.map((car) => (
                                            <CarCard
                                                key={car.id}
                                                car={car}
                                                variant="table"
                                                statusStyle={badgeStatusStyle(car.status || (car.disponible ? 'Disponible' : 'Alquilado'))}
                                                editButtonStyle={secondaryBtnStyle}
                                                deleteButtonStyle={dangerBtnStyle}
                                                onEdit={openVehicleModal}
                                                onDelete={deleteCar}
                                            />
                                        ))}
                                        </tbody>
                                    </table>
                                </>
                            )}

                            {/* TAB 2: CRUD RESERVAS */}
                            {activeAdminTab === 'reservations' && (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                        <h2 style={{ fontSize: '1.2rem', color: '#fff', margin: 0 }}>Control Global de Reservas</h2>
                                    </div>
                                    <table style={tableStyle}>
                                        <thead>
                                        <tr style={tableHeaderStyle}>
                                            <th style={{ padding: '10px' }}>ID</th>
                                            <th style={{ padding: '10px' }}>Cliente</th>
                                            <th style={{ padding: '10px' }}>Vehículo</th>
                                            <th style={{ padding: '10px' }}>Fechas</th>
                                            <th style={{ padding: '10px' }}>Monto</th>
                                            <th style={{ padding: '10px' }}>Estado</th>
                                            <th style={{ padding: '10px', textAlign: 'right' }}>Acciones</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {reservations.map((r) => (
                                            <tr key={r.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                                                <td style={{ padding: '10px', fontWeight: 'bold', color: '#fff' }}>{r.id}</td>
                                                <td style={{ padding: '10px' }}>{r.clienteNombre || r.usuario}</td>
                                                <td style={{ padding: '10px', color: '#fff' }}>{r.autoNombre}</td>
                                                <td style={{ padding: '10px', fontSize: '0.8rem', color: '#a3a3a3' }}>{r.fechaInicio} &rarr; {r.fechaFin}</td>
                                                <td style={{ padding: '10px', fontWeight: 'bold', color: '#dc2626' }}>${parseFloat(r.monto).toFixed(2)}</td>
                                                <td style={{ padding: '10px' }}>
                                                    <select
                                                        value={r.estado}
                                                        onChange={(e) => updateReservationStatus(r.id, e.target.value)}
                                                        style={{ background: '#1e1e1e', color: '#fff', border: '1px solid #333', padding: '4px', borderRadius: '4px', fontSize: '0.75rem' }}
                                                    >
                                                        <option value="Activa">Activa</option>
                                                        <option value="Pendiente">Pendiente</option>
                                                        <option value="Completada">Completada</option>
                                                        <option value="Cancelada">Cancelada</option>
                                                    </select>
                                                </td>
                                                <td style={{ padding: '10px', textAlign: 'right' }}>
                                                    {(r.estado === 'Activa' || r.estado === 'Pendiente') && (
                                                        <Button onClick={() => returnCar(r.id)} style={successBtnStyle}>Devolver</Button>
                                                    )}
                                                    <Button onClick={() => deleteReservation(r.id)} style={dangerBtnStyle}>Eliminar</Button>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </>
                            )}

                            {/* TAB 3: MANTENIMIENTO */}
                            {activeAdminTab === 'maintenance' && (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                        <h2 style={{ fontSize: '1.2rem', color: '#fff', margin: 0 }}>Historial de Mantenimientos</h2>
                                        <button onClick={openMaintenanceModal} style={primaryActionBtnStyle}>
                                            + Registrar Mantenimiento
                                        </button>
                                    </div>
                                    <table style={tableStyle}>
                                        <thead>
                                        <tr style={tableHeaderStyle}>
                                            <th style={{ padding: '10px' }}>Fecha</th>
                                            <th style={{ padding: '10px' }}>Vehículo</th>
                                            <th style={{ padding: '10px' }}>Tipo</th>
                                            <th style={{ padding: '10px' }}>Kilometraje</th>
                                            <th style={{ padding: '10px' }}>Costo</th>
                                            <th style={{ padding: '10px' }}>Estado</th>
                                            <th style={{ padding: '10px', textAlign: 'right' }}>Acción</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {maintenances.map((m) => (
                                            <tr key={m.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                                                <td style={{ padding: '10px' }}>{m.fecha}</td>
                                                <td style={{ padding: '10px', fontWeight: 'bold', color: '#fff' }}>{m.vehicleName}</td>
                                                <td style={{ padding: '10px' }}>{m.tipo}</td>
                                                <td style={{ padding: '10px' }}>{m.kilometraje} km</td>
                                                <td style={{ padding: '10px', color: '#4ade80' }}>${m.costo}</td>
                                                <td style={{ padding: '10px' }}>
                                                    <span style={badgeStatusStyle(m.estado)}>{m.estado}</span>
                                                </td>
                                                <td style={{ padding: '10px', textAlign: 'right' }}>
                                                    {m.estado === 'En curso' && (
                                                        <button onClick={() => completeMaintenance(m.id)} style={successBtnStyle}>
                                                            Finalizar
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </>
                            )}
                        </>
                    ) : (
                        /* VISTA CLIENTE: MIS RESERVAS RECIENTES */
                        <>
                            <h2 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <ClipboardList size={20} aria-hidden="true" />
                                Mis Reservas Recientes
                            </h2>
                            <table style={tableStyle}>
                                <thead>
                                <tr style={tableHeaderStyle}>
                                    <th style={{ padding: '10px' }}>ID Reserva</th>
                                    <th style={{ padding: '10px' }}>Vehículo</th>
                                    <th style={{ padding: '10px' }}>Fechas (Inicio - Fin)</th>
                                    <th style={{ padding: '10px' }}>Monto</th>
                                    <th style={{ padding: '10px' }}>Estado</th>
                                    <th style={{ padding: '10px', textAlign: 'right' }}>Acción</th>
                                </tr>
                                </thead>
                                <tbody>
                                {clientReservations.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#a3a3a3' }}>
                                            No tienes reservas registradas actualmente.
                                        </td>
                                    </tr>
                                ) : (
                                    clientReservations.map((res) => (
                                        <tr key={res.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                                            <td style={{ padding: '10px', fontWeight: 'bold', color: '#fff' }}>{res.id}</td>
                                            <td style={{ padding: '10px', color: '#fff' }}>{res.autoNombre}</td>
                                            <td style={{ padding: '10px', fontSize: '0.8rem', color: '#a3a3a3' }}>{res.fechaInicio} &rarr; {res.fechaFin}</td>
                                            <td style={{ padding: '10px', fontWeight: 'bold', color: '#dc2626' }}>${parseFloat(res.monto).toFixed(2)}</td>
                                            <td style={{ padding: '10px' }}>
                                                <span style={badgeStatusStyle(res.estado)}>{res.estado}</span>
                                            </td>
                                            <td style={{ padding: '10px', textAlign: 'right' }}>
                                                {(res.estado === 'Activa' || res.estado === 'Pendiente') && (
                                                    <>
                                                        <Button onClick={() => returnCar(res.id)} style={successBtnStyle}>Devolver</Button>
                                                        <Button onClick={() => deleteReservation(res.id)} style={dangerBtnStyle}>Cancelar</Button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                                </tbody>
                            </table>
                        </>
                    )}
                </div>

                {/* Sidebar Notificaciones & Centro de Ayuda 24/7 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ background: '#121212', border: '1px solid #262626', borderRadius: '8px', padding: '16px' }}>
                        <h3 style={{ margin: '0 0 12px 0', color: '#dc2626', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            Notificaciones y Avisos
                        </h3>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.8rem', color: '#ccc', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {isAdmin ? (
                                <>
                                    <li style={{ background: '#1a1a1a', padding: '10px', borderRadius: '6px', border: '1px solid #262626' }}>
                                        <strong style={{ color: '#fff', display: 'block' }}>Ocupación de Flota:</strong>
                                        {rentedCarsCount} de {totalFleetCount} vehículos alquilados ({efficiency}%).
                                    </li>
                                    <li style={{ background: '#1a1a1a', padding: '10px', borderRadius: '6px', border: '1px solid #262626' }}>
                                        <strong style={{ color: '#fff', display: 'block' }}>Estado Flota:</strong>
                                        CRUD de vehículos y reservas sincronizado en tiempo real con localStorage.
                                    </li>
                                </>
                            ) : (
                                <>
                                    <li style={{ background: '#1a1a1a', padding: '10px', borderRadius: '6px', border: '1px solid #262626' }}>
                                        <strong style={{ color: '#4ade80', display: 'block' }}>Reserva Lista:</strong>
                                        Tus reservas activas se encuentran garantizadas.
                                    </li>
                                    <li style={{ background: '#1a1a1a', padding: '10px', borderRadius: '6px', border: '1px solid #262626' }}>
                                        <strong style={{ color: '#fde047', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Star size={14} aria-hidden="true" />
                                            Puntos Acumulados:
                                        </strong>
                                        Tienes un total de <b>{clientPoints} puntos</b> para canjear en tus próximos viajes.
                                    </li>
                                </>
                            )}
                        </ul>
                    </div>

                    <div style={{ background: '#121212', border: '1px solid #262626', borderRadius: '8px', padding: '16px' }}>
                        <h3 style={{ margin: '0 0 8px 0', color: '#dc2626', fontSize: '0.95rem' }}>Centro de Ayuda 24/7</h3>
                        <p style={{ fontSize: '0.75rem', color: '#a3a3a3', margin: '0 0 10px 0' }}>¿Tienes dudas sobre tu alquiler o asistencia en carretera?</p>
                        <div style={{ fontSize: '0.8rem', color: '#fff' }}>
                            +503 2200 1234<br />
                            soporte@santalucia.com
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Componente Tarjeta KPI
const MetricCard = ({ icon, label, value }) => (
    <div style={{ background: '#121212', border: '1px solid #262626', borderRadius: '8px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ background: '#1a1a1a', padding: '12px', borderRadius: '6px', fontSize: '1.4rem' }}>{icon}</div>
        <div>
            <span style={{ fontSize: '0.7rem', color: '#a3a3a3', fontWeight: 'bold', display: 'block' }}>{label}</span>
            <strong style={{ fontSize: '1.4rem', color: '#ffffff' }}>{value}</strong>
        </div>
    </div>
);

// Estilos Auxiliares
const tabBtnStyle = (isActive) => ({
    background: isActive ? '#dc2626' : '#1f1f1f',
    color: '#ffffff',
    border: '1px solid #333',
    padding: '8px 16px',
    borderRadius: '6px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '0.85rem'
});

const primaryActionBtnStyle = {
    background: '#dc2626',
    color: '#fff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    fontWeight: 'bold',
    cursor: 'pointer'
};

const secondaryBtnStyle = {
    background: '#262626',
    color: '#fff',
    border: '1px solid #404040',
    padding: '4px 10px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.75rem',
    marginRight: '6px'
};

const dangerBtnStyle = {
    background: '#dc2626',
    color: '#fff',
    border: 'none',
    padding: '4px 10px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.75rem'
};

const successBtnStyle = {
    background: '#16a34a',
    color: '#fff',
    border: 'none',
    padding: '4px 10px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.75rem',
    fontWeight: 'bold'
};

const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.85rem'
};

const tableHeaderStyle = {
    borderBottom: '1px solid #333',
    color: '#a3a3a3',
    textAlign: 'left'
};

const badgeStatusStyle = (status) => {
    let bg = '#14532d';
    let color = '#4ade80';

    if (status === 'Alquilado' || status === 'Activa') {
        bg = '#14532d';
        color = '#4ade80';
    } else if (status === 'En Mantenimiento' || status === 'En curso' || status === 'Pendiente') {
        bg = '#78350f';
        color = '#fde047';
    } else if (status === 'Cancelada') {
        bg = '#7f1d1d';
        color = '#fca5a5';
    }

    return {
        background: bg,
        color: color,
        padding: '3px 8px',
        borderRadius: '4px',
        fontSize: '0.75rem',
        fontWeight: 'bold'
    };
};
