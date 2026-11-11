let currentRole = 'cliente';
let currentUser = null;
let activeAdminTab = 'fleet';

document.addEventListener('DOMContentLoaded', function() {
    // Verificar sesión con DataManager (localStorage / sessionStorage)
    const sessionEmail = DataManager.getCurrentUserEmail();
    if (!sessionEmail) {
        window.location.replace('login-registro.html');
        return;
    }

    currentUser = DataManager.getCurrentUserData();
    currentRole = currentUser.role || (currentUser.email.includes('admin') ? 'admin' : 'cliente');

    // Mostrar rol en la cabecera. El script compartido gestiona los datos del perfil.
    updateRoleBadge();

    // Renderizar dashboard según rol inicial
    renderDashboard();
    setupDashboardActions();

    // Botón para alternar rol dinámicamente (facilita la evaluación docente)
    document.getElementById('toggleRoleBtn').addEventListener('click', function() {
        currentRole = currentRole === 'admin' ? 'cliente' : 'admin';
        currentUser.role = currentRole;
        DataManager.updateUserData(currentUser.email, { role: currentRole });
        updateRoleBadge();
        renderDashboard();
    });

    // Handlers para formularios CRUD
    setupVehicleCrudForm();
    setupReservationCrudForm();
    setupMaintenanceCrudForm();
});

function updateRoleBadge() {
    const badgeText = document.getElementById('roleText');
    badgeText.textContent = 'Rol: ' + currentRole.toUpperCase();
    const badge = document.getElementById('userRoleBadge');
    if (currentRole === 'admin') {
        badge.style.backgroundColor = '#dc2626';
    } else {
        badge.style.backgroundColor = '#16a34a';
    }
}

function switchAdminTab(tab) {
    if (!['fleet', 'reservations', 'maintenance'].includes(tab)) return;

    activeAdminTab = tab;
    const tabs = {
        fleet: ['tabFleetBtn', 'adminFleetCard'],
        reservations: ['tabReservationsBtn', 'adminReservationsCard'],
        maintenance: ['tabMaintenanceBtn', 'adminMaintenanceCard']
    };

    Object.keys(tabs).forEach(key => {
        document.getElementById(tabs[key][0]).classList.toggle('active', key === tab);
        document.getElementById(tabs[key][1]).hidden = key !== tab;
    });

    if (tab === 'fleet') renderAdminFleetTable();
    if (tab === 'reservations') renderAdminReservationsTable();
    if (tab === 'maintenance') renderAdminMaintenancesTable();
}

function renderDashboard() {
    const adminTabs = document.getElementById('adminTabsContainer');
    const clientCard = document.getElementById('clientReservationsCard');
    const adminFleetCard = document.getElementById('adminFleetCard');
    const adminResCard = document.getElementById('adminReservationsCard');
    const adminMaintenanceCard = document.getElementById('adminMaintenanceCard');

    if (currentRole === 'admin') {
        adminTabs.hidden = false;
        clientCard.hidden = true;
        switchAdminTab(activeAdminTab);
        renderAdminMetrics();
    } else {
        adminTabs.hidden = true;
        adminFleetCard.hidden = true;
        adminResCard.hidden = true;
        adminMaintenanceCard.hidden = true;
        clientCard.hidden = false;
        renderClientDashboard();
    }
}

function setupDashboardActions() {
    document.addEventListener('click', function(event) {
        const button = event.target.closest('[data-dashboard-action]');
        if (!button) return;

        const id = button.dataset.id;
        switch (button.dataset.dashboardAction) {
            case 'switch-admin-tab':
                switchAdminTab(button.dataset.tab);
                break;
            case 'open-vehicle-modal':
                openVehicleModal();
                break;
            case 'open-reservation-modal':
                openReservationModalAdmin();
                break;
            case 'open-maintenance-modal':
                openMaintenanceModal();
                break;
            case 'close-vehicle-modal':
                closeVehicleModal();
                break;
            case 'close-reservation-modal':
                closeReservationModal();
                break;
            case 'close-maintenance-modal':
                closeMaintenanceModal();
                break;
            case 'close-info-modal':
                closeInfoModal();
                break;
            case 'cancel-client-reservation':
                cancelClientReservation(id);
                break;
            case 'edit-vehicle':
                editVehicle(id);
                break;
            case 'delete-vehicle':
                deleteVehicle(id);
                break;
            case 'delete-reservation':
                deleteReservationAdmin(id);
                break;
            case 'edit-reservation':
                editReservationAdmin(id);
                break;
            case 'complete-maintenance':
                completeMaintenance(id);
                break;
        }
    });

    document.addEventListener('change', function(event) {
        const select = event.target.closest('[data-dashboard-action="change-reservation-status"]');
        if (select) changeReservationStatus(select.dataset.id, select.value);
    });
}

// ==========================================
// VISTA CLIENTE
// ==========================================
function renderClientDashboard() {
    const metrics = DataManager.getClientMetrics(currentUser.email);

    document.getElementById('metric1Label').textContent = 'Vehículos Alquilados';
    document.getElementById('metric1Value').textContent = metrics.rentedCarsCount;

    document.getElementById('metric2Label').textContent = 'Reservas Activas';
    document.getElementById('metric2Value').textContent = metrics.activeReservationsCount;

    document.getElementById('metric3Label').textContent = 'Gasto Acumulado';
    document.getElementById('metric3Value').textContent = '$' + metrics.totalSpent;

    document.getElementById('metric4Label').textContent = 'Puntos Fidelidad';
    document.getElementById('metric4Value').textContent = metrics.points + ' pts';

    const tbody = document.getElementById('clientTableBody');
    tbody.innerHTML = '';

    if (metrics.reservations.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-6 text-gray-400">
                    No tienes reservas registradas actualmente.
                    <a href="autos.html" class="text-red-400 underline font-semibold ml-1">Explora nuestra flota aquí</a>.
                </td>
            </tr>
        `;
    } else {
        metrics.reservations.forEach(res => {
            const statusClass = res.estado === 'Activa' ? 'status-active' :
                               res.estado === 'Pendiente' ? 'status-pending' :
                               res.estado === 'Completada' ? 'status-completed' : 'status-cancelada';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="font-bold text-white">${res.id}</td>
                <td>${res.autoNombre} <span class="text-xs text-gray-500">(${res.categoria || 'Auto'})</span></td>
                <td>${res.fechaInicio} &rarr; ${res.fechaFin} (${res.dias} días)</td>
                <td>${res.lugar || 'Madrid Centro'}</td>
                <td class="font-semibold text-white">$${parseFloat(res.monto).toFixed(2)}</td>
                <td><span class="status-tag ${statusClass}">${res.estado}</span></td>
                <td class="text-right">
                    ${res.estado === 'Activa' || res.estado === 'Pendiente' ? `
                        <button type="button" class="btn-action-sm btn-delete" data-dashboard-action="cancel-client-reservation" data-id="${res.id}">
                            <i class="fas fa-ban"></i> Cancelar
                        </button>
                    ` : `
                        <span class="text-xs text-gray-500">Finalizada</span>
                    `}
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    // Notificaciones dinámicas para cliente
    const notifList = document.getElementById('notificationsList');
    notifList.innerHTML = '';
    if (metrics.reservations.length > 0) {
        const latest = metrics.reservations[0];
        notifList.innerHTML += `
            <li class="p-3 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-gray-300">
                <strong class="text-white block mb-1"><i class="fas fa-circle-check text-green-500"></i> Reserva Confirmada:</strong>
                Tu reserva <b>#${latest.id}</b> (${latest.autoNombre}) está lista para el ${latest.fechaInicio}.
            </li>
        `;
        notifList.innerHTML += `
            <li class="p-3 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-gray-300">
                <strong class="text-white block mb-1"><i class="fas fa-star text-yellow-500"></i> Puntos Acumulados:</strong>
                Tienes un total de <b>${metrics.points} puntos</b> para canjear en tus próximos viajes.
            </li>
        `;
    } else {
        notifList.innerHTML = `
            <li class="p-3 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-gray-400">
                No hay notificaciones pendientes. Realiza tu primera reserva para comenzar a sumar puntos.
            </li>
        `;
    }
}

function cancelClientReservation(id) {
    // Confirmación antes de cancelar (SweetAlert2)
    Swal.fire({
        icon: 'warning',
        title: '¿Cancelar esta reserva?',
        html: `La reserva <strong>${id}</strong> pasará a estado <strong>Cancelada</strong>.<br>Esta acción no se puede deshacer.`,
        showCancelButton: true,
        confirmButtonText: 'Sí, cancelar reserva',
        cancelButtonText: 'Volver',
        confirmButtonColor: '#DC2626',
        cancelButtonColor: '#3f3f46',
        reverseButtons: true,
        background: '#1a1a1a',
        color: '#ffffff',
        backdrop: 'rgba(0, 0, 0, 0.75)'
    }).then((result) => {
        if (result.isConfirmed) {
            DataManager.updateReservation(id, { estado: 'Cancelada' });
            renderClientDashboard();
        }
    });
}

// ==========================================
// VISTA ADMINISTRADOR (CRUD FLOTA Y RESERVAS)
// ==========================================
function renderAdminMetrics() {
    const metrics = DataManager.getAdminMetrics();

    document.getElementById('metric1Label').textContent = 'Flota Total';
    document.getElementById('metric1Value').textContent = metrics.totalFleetCount;

    document.getElementById('metric2Label').textContent = 'Reservas Totales';
    document.getElementById('metric2Value').textContent = metrics.totalReservationsCount;

    document.getElementById('metric3Label').textContent = 'Ingresos del Mes';
    document.getElementById('metric3Value').textContent = '$' + metrics.totalIncome;

    document.getElementById('metric4Label').textContent = 'Eficiencia de Flota';
    document.getElementById('metric4Value').textContent = metrics.efficiency;

    // Notificaciones para administrador
    const notifList = document.getElementById('notificationsList');
    notifList.innerHTML = `
        <li class="p-3 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-gray-300">
            <strong class="text-white block mb-1"><i class="fas fa-chart-line text-blue-500"></i> Ocupación de Flota:</strong>
            ${metrics.activeReservationsCount} de ${metrics.totalFleetCount} vehículos alquilados (${metrics.efficiency}).
        </li>
        <li class="p-3 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-gray-300">
            <strong class="text-white block mb-1"><i class="fas fa-screwdriver-wrench text-yellow-500"></i> Estado Flota:</strong>
            CRUD de vehículos y reservas sincronizado en tiempo real con localStorage.
        </li>
    `;
}

function renderAdminFleetTable() {
    const fleet = DataManager.getFleet();
    const tbody = document.getElementById('fleetTableBody');
    tbody.innerHTML = '';

    fleet.forEach(v => {
        const statusClass = v.status === 'Disponible' ? 'status-disponible' :
                           v.status === 'Alquilado' ? 'status-alquilado' : 'status-mantenimiento';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <img src="${v.image || 'fotos/1.jpg'}" alt="${v.name}" class="car-thumb">
            </td>
            <td>
                <div class="font-bold text-white">${v.name}</div>
                <div class="text-xs text-gray-500">${v.example || ''}</div>
            </td>
            <td><span class="capitalize">${v.category}</span> (${v.categoryLabel})</td>
            <td><span class="capitalize">${v.transmission}</span></td>
            <td>${v.passengers} pax / ${v.luggage} mal.</td>
            <td class="font-bold text-white">$${v.price}/día</td>
            <td><span class="status-tag ${statusClass}">${v.status}</span></td>
            <td class="text-right whitespace-nowrap">
                <button type="button" class="btn-action-sm btn-edit mr-1" data-dashboard-action="edit-vehicle" data-id="${v.id}">
                    <i class="fas fa-pen"></i> Editar
                </button>
                <button type="button" class="btn-action-sm btn-delete" data-dashboard-action="delete-vehicle" data-id="${v.id}">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </td>
        `;
        tbody.appendChild(row);
        row.querySelector('.car-thumb').addEventListener('error', function() {
            this.src = 'fotos/1.jpg';
        }, { once: true });
    });
}

function renderAdminReservationsTable() {
    const reservations = DataManager.getReservations();
    const tbody = document.getElementById('allReservationsTableBody');
    tbody.innerHTML = '';

    reservations.forEach(r => {
        const statusClass = r.estado === 'Activa' ? 'status-active' :
                           r.estado === 'Pendiente' ? 'status-pending' :
                           r.estado === 'Completada' ? 'status-completed' : 'status-cancelada';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="font-bold text-white">${r.id}</td>
            <td>
                <div class="font-semibold text-white">${r.clienteNombre || 'Cliente'}</div>
                <div class="text-xs text-gray-400">${r.usuario}</div>
            </td>
            <td>${r.autoNombre}</td>
            <td>${r.fechaInicio} &rarr; ${r.fechaFin} (${r.dias || 1} d)</td>
            <td class="font-bold text-white">$${parseFloat(r.monto).toFixed(2)}</td>
            <td>
                <select class="bg-neutral-900 border border-neutral-700 text-xs rounded px-2 py-1 text-white" data-dashboard-action="change-reservation-status" data-id="${r.id}">
                    <option value="Activa" ${r.estado === 'Activa' ? 'selected' : ''}>Activa</option>
                    <option value="Pendiente" ${r.estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                    <option value="Completada" ${r.estado === 'Completada' ? 'selected' : ''}>Completada</option>
                    <option value="Cancelada" ${r.estado === 'Cancelada' ? 'selected' : ''}>Cancelada</option>
                </select>
            </td>
            <td class="text-right whitespace-nowrap">
                <button type="button" class="btn-action-sm btn-edit mr-1" data-dashboard-action="edit-reservation" data-id="${r.id}">
                    <i class="fas fa-pen"></i> Editar
                </button>
                <button type="button" class="btn-action-sm btn-delete" data-dashboard-action="delete-reservation" data-id="${r.id}">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function escapeMaintenanceHtml(value) {
    return String(value || '').replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);
}

function renderAdminMaintenancesTable() {
    const maintenances = DataManager.getMaintenances();
    const tbody = document.getElementById('maintenanceTableBody');
    tbody.innerHTML = '';

    if (maintenances.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-6 text-gray-400">Todavía no hay mantenimientos registrados.</td>
            </tr>
        `;
        return;
    }

    maintenances.forEach(maintenance => {
        const inProgress = maintenance.estado === 'En curso';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${escapeMaintenanceHtml(maintenance.fecha)}</td>
            <td class="font-semibold text-white">${escapeMaintenanceHtml(maintenance.vehicleName || 'Vehículo eliminado')}</td>
            <td>${escapeMaintenanceHtml(maintenance.tipo)}</td>
            <td>${Number(maintenance.kilometraje).toLocaleString('es-ES')} km</td>
            <td>$${Number(maintenance.costo).toFixed(2)}</td>
            <td>${escapeMaintenanceHtml(maintenance.observaciones) || '—'}</td>
            <td><span class="status-tag ${inProgress ? 'status-mantenimiento' : 'status-completed'}">${inProgress ? 'En curso' : 'Finalizado'}</span></td>
            <td class="text-right whitespace-nowrap">
                ${inProgress ? `
                    <button type="button" class="btn-action-sm btn-edit" data-dashboard-action="complete-maintenance" data-id="${escapeMaintenanceHtml(maintenance.id)}">
                        <i class="fas fa-check"></i> Finalizar
                    </button>
                ` : `<span class="text-xs text-gray-500">${escapeMaintenanceHtml(maintenance.fechaFinalizacion || '')}</span>`}
            </td>
        `;
        tbody.appendChild(row);
    });
}

function openMaintenanceModal() {
    const form = document.getElementById('maintenanceCrudForm');
    const select = document.getElementById('maintenanceVehicle');
    form.reset();
    select.innerHTML = '';
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Selecciona un vehículo';
    placeholder.disabled = true;
    placeholder.selected = true;
    select.appendChild(placeholder);

    const activeVehicleIds = new Set(
        DataManager.getMaintenances()
            .filter(maintenance => maintenance.estado === 'En curso')
            .map(maintenance => String(maintenance.vehicleId))
    );
    const reservedVehicleIds = new Set(
        DataManager.getReservations()
            .filter(reservation =>
                ['Activa', 'Pendiente'].includes(reservation.estado) &&
                (!reservation.fechaFin || reservation.fechaFin >= today)
            )
            .map(reservation => String(reservation.autoId))
    );
    DataManager.getFleet().forEach(vehicle => {
        const option = document.createElement('option');
        option.value = vehicle.id;
        const hasReservation = reservedVehicleIds.has(String(vehicle.id));
        option.textContent = `${vehicle.name} — ${vehicle.status}${hasReservation ? ' — Reserva activa' : ''}`;
        option.disabled = vehicle.status === 'Alquilado' ||
            activeVehicleIds.has(String(vehicle.id)) || hasReservation;
        select.appendChild(option);
    });

    document.getElementById('maintenanceDate').max = today;
    document.getElementById('maintenanceDate').value = today;
    document.getElementById('maintenanceModalOverlay').style.display = 'flex';
}

function closeMaintenanceModal() {
    document.getElementById('maintenanceModalOverlay').style.display = 'none';
}

function completeMaintenance(id) {
    if (!confirm('¿Finalizar este mantenimiento y devolver el vehículo a Disponible cuando corresponda?')) {
        return;
    }

    const result = DataManager.completeMaintenance(id);
    if (!result.ok) {
        alert(result.message);
        return;
    }

    renderAdminMaintenancesTable();
    renderAdminFleetTable();
}

function setupMaintenanceCrudForm() {
    document.getElementById('maintenanceCrudForm').addEventListener('submit', function(event) {
        event.preventDefault();

        const vehicleId = document.getElementById('maintenanceVehicle').value;
        const date = document.getElementById('maintenanceDate').value;
        const mileageValue = document.getElementById('maintenanceMileage').value;
        const costValue = document.getElementById('maintenanceCost').value;
        const type = document.getElementById('maintenanceType').value;

        if (!vehicleId || !date || mileageValue === '' || costValue === '' || !type) {
            alert('Completa todos los campos obligatorios.');
            return;
        }

        const mileage = Number(mileageValue);
        const cost = Number(costValue);
        if (!Number.isInteger(mileage) || mileage < 0) {
            alert('El kilometraje debe ser un número entero igual o mayor que cero.');
            return;
        }
        if (!Number.isFinite(cost) || cost < 0) {
            alert('El costo debe ser un número igual o mayor que cero.');
            return;
        }

        const result = DataManager.createMaintenance({
            vehicleId: vehicleId,
            fecha: date,
            kilometraje: mileage,
            costo: cost,
            tipo: type,
            observaciones: document.getElementById('maintenanceNotes').value
        });
        if (!result.ok) {
            alert(result.message);
            return;
        }

        closeMaintenanceModal();
        renderAdminMaintenancesTable();
        renderAdminFleetTable();
    });
}

function changeReservationStatus(id, newStatus) {
    DataManager.updateReservation(id, { estado: newStatus });
    renderAdminMetrics();
    renderAdminReservationsTable();
}

function deleteReservationAdmin(id) {
    if (confirm(`¿Eliminar definitivamente la reserva ${id}?`)) {
        DataManager.deleteReservation(id);
        renderAdminMetrics();
        renderAdminReservationsTable();
    }
}

// ==========================================
// OPERACIONES CRUD: MODAL VEHÍCULOS
// ==========================================
function openVehicleModal(vehicle = null) {
    const modal = document.getElementById('vehicleModalOverlay');
    const title = document.getElementById('vehicleModalTitle');
    const idField = document.getElementById('crudVehicleId');
    const nameField = document.getElementById('crudVehicleName');
    const catField = document.getElementById('crudVehicleCategory');
    const catLabelField = document.getElementById('crudVehicleCategoryLabel');
    const transField = document.getElementById('crudVehicleTransmission');
    const priceField = document.getElementById('crudVehiclePrice');
    const passField = document.getElementById('crudVehiclePassengers');
    const luggageField = document.getElementById('crudVehicleLuggage');
    const statusField = document.getElementById('crudVehicleStatus');
    const imgField = document.getElementById('crudVehicleImage');

    if (vehicle) {
        title.innerHTML = '<i class="fas fa-pen text-blue-500"></i> Editar Vehículo';
        idField.value = vehicle.id;
        nameField.value = vehicle.name;
        catField.value = vehicle.category;
        catLabelField.value = vehicle.categoryLabel;
        transField.value = vehicle.transmission;
        priceField.value = vehicle.price;
        passField.value = vehicle.passengers;
        luggageField.value = vehicle.luggage;
        statusField.value = vehicle.status;
        imgField.value = vehicle.image;
    } else {
        title.innerHTML = '<i class="fas fa-plus text-red-600"></i> Agregar Vehículo a la Flota';
        document.getElementById('vehicleCrudForm').reset();
        idField.value = '';
        catField.value = 'autos';
        catLabelField.value = 'Compacto';
        statusField.value = 'Disponible';
    }

    modal.style.display = 'flex';
}

function closeVehicleModal() {
    document.getElementById('vehicleModalOverlay').style.display = 'none';
}

function editVehicle(id) {
    const v = DataManager.getVehicleById(id);
    if (v) openVehicleModal(v);
}

function deleteVehicle(id) {
    const v = DataManager.getVehicleById(id);
    if (!v) return;
    if (confirm(`¿Seguro que deseas eliminar el vehículo "${v.name}" de la flota?`)) {
        DataManager.deleteVehicle(id);
        renderAdminMetrics();
        renderAdminFleetTable();
    }
}


function setupVehicleCrudForm() {
    document.getElementById('vehicleCrudForm').addEventListener('submit', function(e) {
        e.preventDefault();

        const id = document.getElementById('crudVehicleId').value;

        const vehicleData = {
            name: document.getElementById('crudVehicleName').value.trim(),
            category: document.getElementById('crudVehicleCategory').value,
            categoryLabel: document.getElementById('crudVehicleCategoryLabel').value.trim(),
            transmission: document.getElementById('crudVehicleTransmission').value,
            price: Number(document.getElementById('crudVehiclePrice').value),
            passengers: Number(document.getElementById('crudVehiclePassengers').value),
            luggage: Number(document.getElementById('crudVehicleLuggage').value),
            status: document.getElementById('crudVehicleStatus').value,
            image: document.getElementById('crudVehicleImage').value,
            doors: '4',
            ac: true
        };

        // Validar nombre y etiqueta
        if (vehicleData.name.length < 3 || vehicleData.name.length > 80) {
            alert('El nombre del vehículo debe tener entre 3 y 80 caracteres.');
            return;
        }

        if (vehicleData.categoryLabel.length < 2 || vehicleData.categoryLabel.length > 40) {
            alert('La etiqueta de tipo debe tener entre 2 y 40 caracteres.');
            return;
        }

        // Validar categoría
        const validCategories = ['autos', 'suv', 'vans', 'camiones'];

        if (!validCategories.includes(vehicleData.category)) {
            alert('Selecciona una categoría válida.');
            return;
        }

        // Validar transmisión
        const validTransmissions = ['automatica', 'manual'];

        if (!validTransmissions.includes(vehicleData.transmission)) {
            alert('Selecciona una transmisión válida.');
            return;
        }

        // Validar precio
        if (!Number.isFinite(vehicleData.price) || vehicleData.price <= 0) {
            alert('El precio por día debe ser un número mayor que cero.');
            return;
        }

        if (!Number.isFinite(vehicleData.price * 2) ||
            Math.round(vehicleData.price * 2) !== vehicleData.price * 2) {
            alert('El precio debe utilizar incrementos de $0.50.');
            return;
        }

        // Validar capacidad de pasajeros
        if (!Number.isInteger(vehicleData.passengers) ||
            vehicleData.passengers < 1 ||
            vehicleData.passengers > 15) {
            alert('La capacidad debe estar entre 1 y 15 pasajeros.');
            return;
        }

        // Validar maletas
        if (!Number.isInteger(vehicleData.luggage) ||
            vehicleData.luggage < 0 ||
            vehicleData.luggage > 10) {
            alert('La cantidad de maletas debe estar entre 0 y 10.');
            return;
        }

        // Validar estado
        const validStatuses = [
            'Disponible',
            'Alquilado',
            'En Mantenimiento'
        ];

        if (!validStatuses.includes(vehicleData.status)) {
            alert('Selecciona un estado válido para el vehículo.');
            return;
        }

        // Validar imagen seleccionada
        const validImages = [
            'fotos/1.jpg',
            'fotos/2.jpg',
            'fotos/3.jpg',
            'fotos/4.jpg',
            'fotos/KIA1.jpg',
            'fotos/KIA2.jpg',
            'fotos/carro1.jpg',
            'fotos/carro2.jpg'
        ];

        if (!validImages.includes(vehicleData.image)) {
            alert('Selecciona una imagen válida.');
            return;
        }

        // Guardar únicamente si todas las validaciones pasan
        if (id) {
            DataManager.updateVehicle(id, vehicleData);
        } else {
            DataManager.createVehicle(vehicleData);
        }

        closeVehicleModal();
        renderAdminMetrics();
        renderAdminFleetTable();
    });
}

// ==========================================
// OPERACIONES CRUD: MODAL RESERVAS ADMIN
// ==========================================
function openReservationModalAdmin(reservation = null) {
    const modal = document.getElementById('reservationModalOverlay');
    const selectVehicle = document.getElementById('crudResVehicle');
    const form = document.getElementById('reservationCrudForm');
    const reservationId = document.getElementById('crudResId');
    const modalTitle = document.getElementById('reservationModalTitle');
    form.reset();
    selectVehicle.innerHTML = '';

    const fleet = DataManager.getFleet();
    fleet.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.id;
        opt.textContent = `${v.name} ($${v.price}/día) - [${v.status}]`;
        selectVehicle.appendChild(opt);
    });

    if (reservation) {
        reservationId.value = reservation.id;
        modalTitle.innerHTML = '<i class="fas fa-pen text-blue-500"></i> Editar Reserva';
        document.getElementById('crudResClient').value = reservation.usuario;
        selectVehicle.value = reservation.autoId;
        document.getElementById('crudResStart').value = reservation.fechaInicio;
        document.getElementById('crudResEnd').value = reservation.fechaFin;
        document.getElementById('crudResAmount').value = reservation.monto;
        document.getElementById('crudResStatus').value = reservation.estado;
    } else {
        reservationId.value = '';
        modalTitle.innerHTML = '<i class="fas fa-calendar-plus text-red-600"></i> Registrar Reserva Manual';
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 3);
        const toDateInputValue = date => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };
        document.getElementById('crudResStart').value = toDateInputValue(startDate);
        document.getElementById('crudResEnd').value = toDateInputValue(endDate);
        const selectedVehicle = DataManager.getVehicleById(selectVehicle.value);
        document.getElementById('crudResAmount').value = selectedVehicle ? selectedVehicle.price * 3 : '';
        document.getElementById('crudResClient').value = 'cliente@santalucia.com';
    }

    modal.style.display = 'flex';
}

function editReservationAdmin(id) {
    const reservation = DataManager.getReservations().find(item => String(item.id) === String(id));
    if (reservation) openReservationModalAdmin(reservation);
}

function closeReservationModal() {
    document.getElementById('reservationModalOverlay').style.display = 'none';
}


function setupReservationCrudForm() {
    document.getElementById('reservationCrudForm').addEventListener('submit', function(e) {
        e.preventDefault();

        const vehicleId = document.getElementById('crudResVehicle').value;
        const vehicle = DataManager.getVehicleById(vehicleId);

        const startDate = document.getElementById('crudResStart').value;
        const endDate = document.getElementById('crudResEnd').value;
        const amount = Number(document.getElementById('crudResAmount').value);
        const clientEmail = document.getElementById('crudResClient').value.trim();
        const status = document.getElementById('crudResStatus').value;
        const reservationId = document.getElementById('crudResId').value;
        const reservations = DataManager.getReservations();

        // Validar correo electrónico
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(clientEmail)) {
            alert('Introducí un correo electrónico válido.');
            return;
        }

        // Comprobar que el cliente exista
        const users = DataManager.getUsers();
        const client = users.find(user =>
            user.email && user.email.toLowerCase() === clientEmail.toLowerCase()
        );

        if (!client) {
            alert('No existe un cliente registrado con ese correo.');
            return;
        }

        // Validar vehículo
        if (!vehicle) {
            alert('Seleccioná un vehículo válido.');
            return;
        }

        if (vehicle.status === 'En Mantenimiento') {
            alert('No se puede reservar un vehículo en mantenimiento.');
            return;
        }

        // Validar fechas
        if (!startDate || !endDate) {
            alert('Debés seleccionar las fechas de inicio y fin.');
            return;
        }

        const start = new Date(startDate + 'T00:00:00');
        const end = new Date(endDate + 'T00:00:00');

        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
            alert('Las fechas seleccionadas no son válidas.');
            return;
        }

        if (end <= start) {
            alert('La fecha de fin debe ser posterior a la fecha de inicio.');
            return;
        }

        // Calcular duración
        const days = Math.round((end - start) / 86400000);

        if (!Number.isInteger(days) || days < 1) {
            alert('La reserva debe durar al menos un día.');
            return;
        }

        if (!Number.isFinite(amount) || amount <= 0) {
            alert('El monto total debe ser mayor que cero.');
            return;
        }

        const amountCents = Math.round(amount * 100);
        if (!Number.isInteger(amount * 2)) {
            alert('El monto debe utilizar incrementos de $0.50.');
            return;
        }

        const existingReservation = reservationId
            ? reservations.find(reservation => String(reservation.id) === String(reservationId))
            : null;
        const extrasDailyRate = existingReservation
            ? (existingReservation.extras || '').split(',').reduce((total, extra) => {
                const rates = {
                    'Seguro Todo Riesgo': 15,
                    GPS: 5,
                    'Silla Bebé': 8
                };
                return total + (rates[extra.trim()] || 0);
            }, 0)
            : 0;
        const expectedAmount = (vehicle.price + extrasDailyRate) * days;
        const expectedAmountCents = Math.round(expectedAmount * 100);
        if (amountCents !== expectedAmountCents) {
            alert(
                `El monto no coincide con la tarifa del vehículo. ` +
                `El total esperado para ${days} días es $${expectedAmount.toFixed(2)}.`
            );
            return;
        }

        // Validar estado
        const validStatuses = [
            'Activa',
            'Pendiente',
            'Completada',
            'Cancelada'
        ];

        if (!validStatuses.includes(status)) {
            alert('Seleccioná un estado de reserva válido.');
            return;
        }

        // Evitar reservas superpuestas del mismo vehículo
        const overlappingReservation = reservations.some(reservation => {
            if (reservation.autoId !== vehicle.id) {
                return false;
            }

            if (reservation.estado === 'Cancelada' ||
                reservation.estado === 'Completada') {
                return false;
            }

            // Si se está editando, ignorar la propia reserva.
            if (reservationId && String(reservation.id) === String(reservationId)) {
                return false;
            }

            const existingStart = new Date(
                reservation.fechaInicio + 'T00:00:00'
            );

            const existingEnd = new Date(
                reservation.fechaFin + 'T00:00:00'
            );

            if (Number.isNaN(existingStart.getTime()) ||
                Number.isNaN(existingEnd.getTime())) {
                return false;
            }

            return start < existingEnd && end > existingStart;
        });

        if (overlappingReservation) {
            alert('El vehículo ya tiene una reserva que coincide con esas fechas.');
            return;
        }

        const pricePerDay = vehicle.price;

        const reservationData = {
            usuario: client.email,
            clienteNombre: client.name || clientEmail.split('@')[0],
            autoId: vehicle.id,
            autoNombre: vehicle.name,
            categoria: vehicle.categoryLabel,
            fechaInicio: startDate,
            fechaFin: endDate,
            dias: days,
            precioDia: pricePerDay,
            monto: amount,
            estado: status
        };

        if (reservationId) {
            const updatedReservation = DataManager.updateReservation(reservationId, reservationData);
            if (!updatedReservation) {
                alert('No se encontró la reserva que intentás editar.');
                return;
            }
        } else {
            DataManager.createReservation(reservationData);
        }

        closeReservationModal();
        renderAdminMetrics();
        renderAdminReservationsTable();
    });
}

// Modales informativos para navegación
function openInfoModal(type) {
    const modal = document.getElementById('infoModalOverlay');
    const title = document.getElementById('infoModalTitle');
    const content = document.getElementById('infoModalContent');

    if (type === 'oficinas') {
        title.textContent = 'Nuestras Oficinas en España';
        content.innerHTML = `
            <p><b>Madrid Central:</b> Av. Principal 123, Centro. Lun-Sáb 08:00 - 20:00. Tel: +34 900 123 456</p>
            <p><b>Aeropuerto Madrid-Barajas T4:</b> Planta 1, Módulo de Llegadas. 24 Horas.</p>
            <p><b>Barcelona Sants:</b> Estación Central de Trenes. Lun-Dom 07:00 - 22:00.</p>
        `;
    } else if (type === 'quienes-somos') {
        title.textContent = 'Quiénes Somos — Santa Lucía Alquiler';
        content.innerHTML = `
            <p>Somos la compañía líder en alquiler y gestión de flotas premium y utilitarias en España.</p>
            <p>Fundada con el compromiso de ofrecer tarifas transparentes, vehículos garantizados con cero kilómetros de riesgo y soporte 24/7 en todas las comunidades autónomas.</p>
        `;
    } else if (type === 'equipo') {
        title.textContent = 'Nuestro Equipo Directivo';
        content.innerHTML = `
            <p><b>Dirección General:</b> Asael López — Dirección y Estrategia</p>
            <p><b>Operaciones y Flota:</b> Steven Aparicio — Gestión de Logística y Rutas</p>
            <p><b>Tecnología y Sistemas:</b> Arnulfo Henríquez — Plataforma Digital y Soporte</p>
        `;
    } else if (type === 'trabaja') {
        title.textContent = 'Trabaja con Nosotros';
        content.innerHTML = `
            <p>Buscamos conductores profesionales, asesores de atención al cliente y desarrolladores web.</p>
            <p>Envía tu CV a <b>rrhh@santalucia.com</b> con el asunto 'Vacantes Santa Lucía'.</p>
        `;
    }
    modal.style.display = 'flex';
}

function closeInfoModal() {
    document.getElementById('infoModalOverlay').style.display = 'none';
}
