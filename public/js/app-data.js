// ========================================================
// Santa Lucía Alquiler — Gestor Central de Datos (LocalStorage)
// ========================================================

const DataManager = (function () {
    const STORAGE_KEY_FLEET = 'santalucia_flota';
    const STORAGE_KEY_USERS = 'usuarios_registrados';
    const STORAGE_KEY_RESERVATIONS = 'santalucia_reservas';
    const STORAGE_KEY_MAINTENANCE = 'santalucia_mantenimientos';
    const STORAGE_KEY_SESSION = 'usuario';

    // Flota inicial por defecto
    const DEFAULT_FLEET = [
        {
            id: 'auto-1',
            name: 'Nissan Versa',
            category: 'autos',
            categoryLabel: 'Compacto',
            example: 'Nissan Versa o similar',
            transmission: 'automatica',
            passengers: 5,
            luggage: 2,
            doors: '2-4',
            ac: true,
            price: 35,
            status: 'Disponible',
            image: 'fotos/1.jpg'
        },
        {
            id: 'auto-2',
            name: 'Mazda Miata RF',
            category: 'autos',
            categoryLabel: 'Descapotable compacto',
            example: 'Mazda Miata RF o similar',
            transmission: 'automatica',
            passengers: 2,
            luggage: 1,
            doors: '2',
            ac: true,
            price: 75,
            status: 'Disponible',
            image: 'fotos/2.jpg'
        },
        {
            id: 'auto-3',
            name: 'Fiat 500',
            category: 'autos',
            categoryLabel: 'Compacto especial',
            example: 'Fiat 500 o similar',
            transmission: 'automatica',
            passengers: 4,
            luggage: 2,
            doors: '3',
            ac: true,
            price: 40,
            status: 'Disponible',
            image: 'fotos/3.jpg'
        },
        {
            id: 'auto-4',
            name: 'Hyundai i10',
            category: 'autos',
            categoryLabel: 'Económico',
            example: 'Hyundai i10 o similar',
            transmission: 'manual',
            passengers: 4,
            luggage: 1,
            doors: '5',
            ac: true,
            price: 28,
            status: 'Disponible',
            image: 'fotos/4.jpg'
        },
        {
            id: 'auto-5',
            name: 'Kia Sportage',
            category: 'suv',
            categoryLabel: 'SUV Mediano',
            example: 'Kia Sportage o similar',
            transmission: 'automatica',
            passengers: 5,
            luggage: 4,
            doors: '5',
            ac: true,
            price: 65,
            status: 'Disponible',
            image: 'fotos/KIA1.jpg'
        },
        {
            id: 'auto-6',
            name: 'BMW Serie 3',
            category: 'autos',
            categoryLabel: 'Lujo',
            example: 'BMW Serie 3 o similar',
            transmission: 'automatica',
            passengers: 5,
            luggage: 3,
            doors: '4',
            ac: true,
            price: 110,
            status: 'Disponible',
            image: 'fotos/KIA2.jpg'
        },
        {
            id: 'auto-7',
            name: 'Ford Transit',
            category: 'vans',
            categoryLabel: 'Van de Pasajeros',
            example: 'Ford Transit o similar',
            transmission: 'manual',
            passengers: 7,
            luggage: 5,
            doors: '4',
            ac: true,
            price: 95,
            status: 'Disponible',
            image: 'fotos/carro1.jpg'
        },
        {
            id: 'auto-8',
            name: 'Toyota Hilux 4x4',
            category: 'camiones',
            categoryLabel: 'Camioneta / Pickup',
            example: 'Toyota Hilux o similar',
            transmission: 'manual',
            passengers: 5,
            luggage: 4,
            doors: '4',
            ac: true,
            price: 85,
            status: 'Disponible',
            image: 'fotos/carro2.jpg'
        }
    ];

    // Usuarios iniciales por defecto (incluye admin y cliente)
    const DEFAULT_USERS = [
        {
            email: 'admin@santalucia.com',
            password: 'admin123',
            name: 'Administrador Santa Lucía',
            phone: '+34 900 123 456',
            role: 'admin',
            avatar: ''
        },
        {
            email: 'cliente@santalucia.com',
            password: 'cliente123',
            name: 'Carlos Mendoza',
            phone: '+34 612 345 678',
            role: 'cliente',
            avatar: ''
        },
        {
            email: 'asael@santalucia.com',
            password: 'asael123',
            name: 'Asael López',
            phone: '+34 655 432 100',
            role: 'admin',
            avatar: ''
        },
        {
            email: 'steven@santalucia.com',
            password: 'steven123',
            name: 'Steven Aparicio',
            phone: '+34 622 111 222',
            role: 'cliente',
            avatar: ''
        },
        {
            email: 'arnulfo@santalucia.com',
            password: 'arnulfo123',
            name: 'Arnulfo Henríquez',
            phone: '+34 633 444 555',
            role: 'cliente',
            avatar: ''
        }
    ];

    // Reservas iniciales por defecto
    const DEFAULT_RESERVATIONS = [
        {
            id: 'RES-9021',
            usuario: 'cliente@santalucia.com',
            clienteNombre: 'Carlos Mendoza',
            autoId: 'auto-1',
            autoNombre: 'Nissan Versa',
            categoria: 'Compacto',
            fechaInicio: '2026-10-18',
            fechaFin: '2026-10-21',
            dias: 3,
            precioDia: 35,
            extras: 'Seguro Cobertura Total',
            monto: 120,
            estado: 'Activa',
            creadaEn: '2026-10-15'
        },
        {
            id: 'RES-8812',
            usuario: 'cliente@santalucia.com',
            clienteNombre: 'Carlos Mendoza',
            autoId: 'auto-5',
            autoNombre: 'Kia Sportage',
            categoria: 'SUV Mediano',
            fechaInicio: '2026-09-10',
            fechaFin: '2026-09-13',
            dias: 3,
            precioDia: 65,
            extras: 'GPS Incluido',
            monto: 210,
            estado: 'Completada',
            creadaEn: '2026-09-08'
        },
        {
            id: 'RES-9022',
            usuario: 'arnulfo@santalucia.com',
            clienteNombre: 'Arnulfo Henríquez',
            autoId: 'auto-6',
            autoNombre: 'BMW Serie 3',
            categoria: 'Lujo',
            fechaInicio: '2026-10-20',
            fechaFin: '2026-10-23',
            dias: 3,
            precioDia: 110,
            extras: 'Seguro + Asistencia VIP',
            monto: 350,
            estado: 'Pendiente',
            creadaEn: '2026-10-14'
        }
    ];

    // Clave para perfil individual compatible con versiones previas
    function getUserProfileKey(email) {
        return 'user_data_' + btoa(unescape(encodeURIComponent(email || ''))).replace(/=/g, '');
    }

    // Inicialización del almacenamiento
    function init() {
        try {
            if (!localStorage.getItem(STORAGE_KEY_FLEET)) {
                localStorage.setItem(STORAGE_KEY_FLEET, JSON.stringify(DEFAULT_FLEET));
            }
            if (!localStorage.getItem(STORAGE_KEY_USERS)) {
                localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(DEFAULT_USERS));
                // Asegurar perfiles individuales
                DEFAULT_USERS.forEach(u => {
                    const key = getUserProfileKey(u.email);
                    if (!localStorage.getItem(key)) {
                        localStorage.setItem(key, JSON.stringify(u));
                    }
                });
            } else {
                // Autocorrección: si la lista ya existía de una versión previa y
                // faltan cuentas por defecto (ej. cliente@santalucia.com), se agregan
                // para que los botones de "Cuentas de prueba" siempre funcionen.
                const stored = JSON.parse(localStorage.getItem(STORAGE_KEY_USERS)) || [];
                let changed = false;
                DEFAULT_USERS.forEach(u => {
                    const exists = stored.some(x => (x.email || '').toLowerCase().trim() === u.email.toLowerCase());
                    if (!exists) {
                        stored.push(u);
                        changed = true;
                        const key = getUserProfileKey(u.email);
                        if (!localStorage.getItem(key)) {
                            localStorage.setItem(key, JSON.stringify(u));
                        }
                    }
                });
                if (changed) {
                    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(stored));
                }
            }
            if (!localStorage.getItem(STORAGE_KEY_RESERVATIONS)) {
                localStorage.setItem(STORAGE_KEY_RESERVATIONS, JSON.stringify(DEFAULT_RESERVATIONS));
            }
        } catch (e) {
            console.error('Error al inicializar DataManager:', e);
        }
    }

    // Ejecutar inicialización inmediata
    init();

    // ------------------------------------------------------------------------
    // FLOTA (CRUD)
    // ------------------------------------------------------------------------
    function getFleet() {
        try {
            const data = localStorage.getItem(STORAGE_KEY_FLEET);
            return data ? JSON.parse(data) : DEFAULT_FLEET;
        } catch (e) {
            return DEFAULT_FLEET;
        }
    }

    function saveFleet(fleet) {
        try {
            localStorage.setItem(STORAGE_KEY_FLEET, JSON.stringify(fleet));
            return true;
        } catch (e) {
            console.error('Error guardando flota:', e);
            return false;
        }
    }

    function getVehicleById(id) {
        const fleet = getFleet();
        return fleet.find(v => String(v.id) === String(id)) || null;
    }

    function createVehicle(vehicleData) {
        const fleet = getFleet();
        const newVehicle = {
            id: 'auto-' + Date.now(),
            name: vehicleData.name || 'Nuevo Vehículo',
            category: vehicleData.category || 'autos',
            categoryLabel: vehicleData.categoryLabel || 'Compacto',
            example: vehicleData.example || `${vehicleData.name} o similar`,
            transmission: vehicleData.transmission || 'automatica',
            passengers: parseInt(vehicleData.passengers, 10) || 5,
            luggage: parseInt(vehicleData.luggage, 10) || 2,
            doors: vehicleData.doors || '4',
            ac: vehicleData.ac !== undefined ? Boolean(vehicleData.ac) : true,
            price: parseFloat(vehicleData.price) || 45,
            status: vehicleData.status || 'Disponible',
            image: vehicleData.image || 'fotos/1.jpg'
        };
        fleet.unshift(newVehicle);
        saveFleet(fleet);
        return newVehicle;
    }

    function updateVehicle(id, updatedFields) {
        const fleet = getFleet();
        const index = fleet.findIndex(v => String(v.id) === String(id));
        if (index === -1) return false;

        fleet[index] = {
            ...fleet[index],
            ...updatedFields,
            passengers: updatedFields.passengers !== undefined ? parseInt(updatedFields.passengers, 10) : fleet[index].passengers,
            luggage: updatedFields.luggage !== undefined ? parseInt(updatedFields.luggage, 10) : fleet[index].luggage,
            price: updatedFields.price !== undefined ? parseFloat(updatedFields.price) : fleet[index].price
        };
        saveFleet(fleet);
        return fleet[index];
    }

    function deleteVehicle(id) {
        let fleet = getFleet();
        const prevLength = fleet.length;
        fleet = fleet.filter(v => String(v.id) !== String(id));
        if (fleet.length !== prevLength) {
            saveFleet(fleet);
            return true;
        }
        return false;
    }

    // ------------------------------------------------------------------------
    // MANTENIMIENTOS
    // ------------------------------------------------------------------------
    function getMaintenances() {
        const data = localStorage.getItem(STORAGE_KEY_MAINTENANCE);
        if (!data) return [];

        const maintenances = JSON.parse(data);
        if (!Array.isArray(maintenances)) {
            throw new Error('El historial de mantenimientos tiene un formato inválido.');
        }
        return maintenances;
    }

    function saveMaintenances(maintenances) {
        try {
            localStorage.setItem(STORAGE_KEY_MAINTENANCE, JSON.stringify(maintenances));
            return true;
        } catch (e) {
            console.error('Error guardando mantenimientos:', e);
            return false;
        }
    }

    function createMaintenance(maintenanceData) {
        if (!maintenanceData || typeof maintenanceData !== 'object') {
            return { ok: false, message: 'Los datos del mantenimiento no son válidos.' };
        }

        const vehicle = getVehicleById(maintenanceData.vehicleId);
        if (!vehicle) {
            return { ok: false, message: 'Selecciona un vehículo existente.' };
        }
        if (vehicle.status === 'Alquilado') {
            return { ok: false, message: 'No se puede iniciar mantenimiento mientras el vehículo está alquilado.' };
        }

        const maintenanceDate = String(maintenanceData.fecha || '');
        const dateParts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(maintenanceDate);
        const parsedDate = dateParts
            ? new Date(Number(dateParts[1]), Number(dateParts[2]) - 1, Number(dateParts[3]))
            : null;
        if (!parsedDate || Number.isNaN(parsedDate.getTime()) ||
            parsedDate.getFullYear() !== Number(dateParts[1]) ||
            parsedDate.getMonth() !== Number(dateParts[2]) - 1 ||
            parsedDate.getDate() !== Number(dateParts[3])) {
            return { ok: false, message: 'Ingresa una fecha de mantenimiento válida.' };
        }
        const today = new Date();
        const todayDate = [
            today.getFullYear(),
            String(today.getMonth() + 1).padStart(2, '0'),
            String(today.getDate()).padStart(2, '0')
        ].join('-');
        if (maintenanceDate > todayDate) {
            return { ok: false, message: 'La fecha del mantenimiento no puede ser futura.' };
        }

        const hasConflictingReservation = getReservations().some(reservation =>
            String(reservation.autoId) === String(vehicle.id) &&
            ['Activa', 'Pendiente'].includes(reservation.estado) &&
            (!reservation.fechaFin || reservation.fechaFin >= maintenanceDate)
        );
        if (hasConflictingReservation) {
            return { ok: false, message: 'El vehículo tiene una reserva activa o pendiente que podría coincidir con el mantenimiento.' };
        }

        const mileageInput = maintenanceData.kilometraje;
        const costInput = maintenanceData.costo;
        if (mileageInput === '' || mileageInput === null || mileageInput === undefined ||
            costInput === '' || costInput === null || costInput === undefined) {
            return { ok: false, message: 'El kilometraje y el costo son obligatorios.' };
        }

        const mileage = Number(mileageInput);
        const cost = Number(costInput);
        const type = String(maintenanceData.tipo || '').trim();
        if (!Number.isInteger(mileage) || mileage < 0) {
            return { ok: false, message: 'El kilometraje debe ser un número entero igual o mayor que cero.' };
        }
        if (!Number.isFinite(cost) || cost < 0) {
            return { ok: false, message: 'El costo debe ser un número igual o mayor que cero.' };
        }
        if (!type) {
            return { ok: false, message: 'Selecciona el tipo de mantenimiento.' };
        }

        const maintenances = getMaintenances();
        if (maintenances.some(item =>
            String(item.vehicleId) === String(vehicle.id) && item.estado === 'En curso'
        )) {
            return { ok: false, message: 'Este vehículo ya tiene un mantenimiento en curso.' };
        }

        let maintenanceId = 'MNT-' + Date.now();
        let idSequence = 1;
        while (maintenances.some(item => String(item.id) === maintenanceId)) {
            maintenanceId = 'MNT-' + Date.now() + '-' + idSequence++;
        }

        const maintenance = {
            id: maintenanceId,
            vehicleId: vehicle.id,
            vehicleName: vehicle.name,
            fecha: maintenanceDate,
            kilometraje: mileage,
            costo: cost,
            tipo: type,
            observaciones: String(maintenanceData.observaciones || '').trim(),
            estado: 'En curso'
        };
        maintenances.unshift(maintenance);
        if (!saveMaintenances(maintenances)) {
            return { ok: false, message: 'No se pudo guardar el mantenimiento. Intenta de nuevo.' };
        }

        updateVehicle(vehicle.id, { status: 'En Mantenimiento' });
        if (getVehicleById(vehicle.id)?.status !== 'En Mantenimiento') {
            if (!saveMaintenances(maintenances.filter(item => item.id !== maintenance.id))) {
                console.error('No se pudo revertir un mantenimiento tras fallar la actualización del vehículo.');
            }
            return { ok: false, message: 'No se pudo actualizar el estado del vehículo.' };
        }

        return { ok: true, maintenance: maintenance };
    }

    function completeMaintenance(id) {
        const maintenances = getMaintenances();
        const index = maintenances.findIndex(item => String(item.id) === String(id));
        if (index === -1) {
            return { ok: false, message: 'No se encontró el mantenimiento seleccionado.' };
        }
        if (maintenances[index].estado !== 'En curso') {
            return { ok: false, message: 'Este mantenimiento ya fue finalizado.' };
        }

        const previousMaintenance = maintenances[index];
        maintenances[index] = {
            ...previousMaintenance,
            estado: 'Finalizado',
            fechaFinalizacion: new Date().toISOString().slice(0, 10)
        };
        if (!saveMaintenances(maintenances)) {
            return { ok: false, message: 'No se pudo finalizar el mantenimiento. Intenta de nuevo.' };
        }

        const vehicle = getVehicleById(previousMaintenance.vehicleId);
        if (vehicle && vehicle.status === 'En Mantenimiento') {
            updateVehicle(vehicle.id, { status: 'Disponible' });
            if (getVehicleById(vehicle.id)?.status !== 'Disponible') {
                maintenances[index] = previousMaintenance;
                if (!saveMaintenances(maintenances)) {
                    console.error('No se pudo revertir el cierre de mantenimiento tras fallar la actualización del vehículo.');
                }
                return { ok: false, message: 'No se pudo actualizar el vehículo a Disponible.' };
            }
        }

        return { ok: true, maintenance: maintenances[index] };
    }

    // ------------------------------------------------------------------------
    // RESERVAS (CRUD)
    // ------------------------------------------------------------------------
    function getReservations() {
        try {
            const data = localStorage.getItem(STORAGE_KEY_RESERVATIONS);
            return data ? JSON.parse(data) : DEFAULT_RESERVATIONS;
        } catch (e) {
            return DEFAULT_RESERVATIONS;
        }
    }

    function saveReservations(reservas) {
        try {
            localStorage.setItem(STORAGE_KEY_RESERVATIONS, JSON.stringify(reservas));
            return true;
        } catch (e) {
            console.error('Error guardando reservas:', e);
            return false;
        }
    }

    function getReservationsByUser(email) {
        if (!email) return [];
        const normEmail = email.toLowerCase().trim();
        return getReservations().filter(r => (r.usuario || '').toLowerCase().trim() === normEmail);
    }

    function createReservation(resData) {
        const reservedVehicle = resData.autoId ? getVehicleById(resData.autoId) : null;
        if (reservedVehicle && reservedVehicle.status === 'En Mantenimiento') {
            return null;
        }

        const reservas = getReservations();
        const codeNum = Math.floor(1000 + Math.random() * 9000);
        const newReservation = {
            id: 'RES-' + codeNum,
            usuario: resData.usuario || getCurrentUserEmail() || 'invitado@santalucia.com',
            clienteNombre: resData.clienteNombre || 'Cliente',
            autoId: resData.autoId || '',
            autoNombre: resData.autoNombre || 'Vehículo',
            categoria: resData.categoria || 'Compacto',
            fechaInicio: resData.fechaInicio || new Date().toISOString().split('T')[0],
            fechaFin: resData.fechaFin || new Date().toISOString().split('T')[0],
            dias: parseInt(resData.dias, 10) || 1,
            precioDia: parseFloat(resData.precioDia) || 40,
            extras: resData.extras || 'Ninguno',
            monto: parseFloat(resData.monto) || 40,
            estado: resData.estado || 'Activa',
            lugar: resData.lugar || 'Madrid Centro',
            creadaEn: new Date().toISOString().split('T')[0]
        };

        reservas.unshift(newReservation);
        saveReservations(reservas);

        // Si el estado es Activa, podemos marcar el auto como Alquilado
        if (newReservation.estado === 'Activa' && newReservation.autoId) {
            updateVehicle(newReservation.autoId, { status: 'Alquilado' });
        }

        return newReservation;
    }

    function updateReservation(id, updatedFields) {
        const reservas = getReservations();
        const index = reservas.findIndex(r => String(r.id) === String(id));
        if (index === -1) return false;

        const prevStatus = reservas[index].estado;
        const updatedReservation = {
            ...reservas[index],
            ...updatedFields
        };
        const updatedVehicle = updatedReservation.autoId
            ? getVehicleById(updatedReservation.autoId)
            : null;
        if (updatedReservation.estado === 'Activa' &&
            updatedVehicle && updatedVehicle.status === 'En Mantenimiento') {
            return false;
        }
        reservas[index] = updatedReservation;
        saveReservations(reservas);

        // Si se cancela o completa la reserva, devolver el auto a 'Disponible'
        if (reservas[index].autoId && (updatedFields.estado === 'Cancelada' || updatedFields.estado === 'Completada')) {
            const vehicle = getVehicleById(reservas[index].autoId);
            if (vehicle && vehicle.status === 'Alquilado') {
                updateVehicle(reservas[index].autoId, { status: 'Disponible' });
            }
        } else if (reservas[index].autoId && updatedFields.estado === 'Activa' && prevStatus !== 'Activa') {
            updateVehicle(reservas[index].autoId, { status: 'Alquilado' });
        }

        return reservas[index];
    }

    function deleteReservation(id) {
        let reservas = getReservations();
        const res = reservas.find(r => String(r.id) === String(id));
        const prevLength = reservas.length;
        reservas = reservas.filter(r => String(r.id) !== String(id));
        if (reservas.length !== prevLength) {
            saveReservations(reservas);
            if (res && res.autoId && res.estado === 'Activa') {
                const vehicle = getVehicleById(res.autoId);
                if (vehicle && vehicle.status === 'Alquilado') {
                    updateVehicle(res.autoId, { status: 'Disponible' });
                }
            }
            return true;
        }
        return false;
    }

    // ------------------------------------------------------------------------
    // USUARIOS Y AUTENTICACIÓN (LOGIN, REGISTRO, ROLES, SESIÓN)
    // ------------------------------------------------------------------------
    function getUsers() {
        try {
            const data = localStorage.getItem(STORAGE_KEY_USERS);
            return data ? JSON.parse(data) : DEFAULT_USERS;
        } catch (e) {
            return DEFAULT_USERS;
        }
    }

    function saveUsers(users) {
        try {
            localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
            return true;
        } catch (e) {
            return false;
        }
    }

    function findUserByEmail(email) {
        if (!email) return null;
        const norm = email.toLowerCase().trim();
        const users = getUsers();
        return users.find(u => (u.email || '').toLowerCase().trim() === norm) || null;
    }

    function registerUser(userData) {
        if (!userData || typeof userData !== 'object') {
            return { ok: false, message: 'Los datos de registro no son válidos.' };
        }

        const emailNorm = String(userData.email || '').toLowerCase().trim();
        const name = String(userData.name || '').trim();
        const phone = String(userData.phone || '').trim();
        const password = String(userData.password || '');
        const role = userData.role || (emailNorm.includes('admin') ? 'admin' : 'cliente');

        if (!emailNorm || emailNorm.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) {
            return { ok: false, message: 'Ingresa un correo electrónico válido.' };
        }
        if (name.length < 3 || name.length > 80 || name.replace(/[^\p{L}]/gu, '').length < 3) {
            return { ok: false, message: 'El nombre debe tener entre 3 y 80 caracteres e incluir al menos 3 letras.' };
        }
        const phoneDigits = phone.replace(/[^0-9]/g, '');
        if (phone.length > 25 || !/^\+?[0-9().\s-]+$/.test(phone) ||
            phoneDigits.length < 8 || phoneDigits.length > 15) {
            return { ok: false, message: 'Ingresa un teléfono válido con entre 8 y 15 dígitos.' };
        }
        if (!password.trim() || password.length < 6 || password.length > 128) {
            return { ok: false, message: 'La contraseña debe tener entre 6 y 128 caracteres.' };
        }
        if (!['cliente', 'admin'].includes(role)) {
            return { ok: false, message: 'Selecciona un tipo de cuenta válido.' };
        }

        const existing = findUserByEmail(emailNorm);
        if (existing) {
            return { ok: false, message: 'Este correo ya se encuentra registrado. Inicia sesión.' };
        }

        const users = getUsers();
        const newUser = {
            email: emailNorm,
            password: password,
            name: name,
            phone: phone,
            role: role,
            avatar: userData.avatar || ''
        };

        users.push(newUser);
        saveUsers(users);

        // Guardar también en formato user_data_ para compatibilidad completa
        localStorage.setItem(getUserProfileKey(emailNorm), JSON.stringify(newUser));

        return { ok: true, user: newUser };
    }

    function authenticateUser(email, password) {
        const emailNorm = (email || '').toLowerCase().trim();
        if (!emailNorm) {
            return { ok: false, message: 'Ingresa tu correo electrónico.' };
        }

        const user = findUserByEmail(emailNorm);
        if (!user) {
            return { ok: false, message: 'Este correo electrónico no está registrado en el sistema. Por favor crea una cuenta.' };
        }

        if (user.password !== password) {
            return { ok: false, message: 'Contraseña incorrecta. Por favor verifica tus credenciales.' };
        }

        // Login exitoso: Guardar sesión en localStorage y sessionStorage
        setSession(user.email);
        return { ok: true, user: user };
    }

    function setSession(email) {
        const emailNorm = (email || '').toLowerCase().trim();
        try {
            localStorage.setItem(STORAGE_KEY_SESSION, emailNorm);
            sessionStorage.setItem(STORAGE_KEY_SESSION, emailNorm);
        } catch (e) {}
    }

    function getCurrentUserEmail() {
        try {
            return localStorage.getItem(STORAGE_KEY_SESSION) || sessionStorage.getItem(STORAGE_KEY_SESSION) || null;
        } catch (e) {
            return null;
        }
    }

    function getCurrentUserData() {
        const email = getCurrentUserEmail();
        if (!email) return null;

        // Intentar sacar de usuarios registrados
        const registered = findUserByEmail(email);
        if (registered) return registered;

        // Intentar de clave de perfil directo
        try {
            const raw = localStorage.getItem(getUserProfileKey(email));
            if (raw) return JSON.parse(raw);
        } catch (e) {}

        const atIdx = email.indexOf('@');
        const displayName = atIdx > 0 ? email.substring(0, atIdx) : email;
        return {
            email: email,
            name: displayName.charAt(0).toUpperCase() + displayName.slice(1),
            phone: '',
            role: email.includes('admin') ? 'admin' : 'cliente',
            avatar: ''
        };
    }

    function updateUserData(email, updatedData) {
        const emailNorm = (email || '').toLowerCase().trim();
        const users = getUsers();
        const index = users.findIndex(u => (u.email || '').toLowerCase().trim() === emailNorm);

        if (index !== -1) {
            users[index] = { ...users[index], ...updatedData };
            saveUsers(users);
        }

        // Actualizar user_data_
        const key = getUserProfileKey(emailNorm);
        try {
            const existing = JSON.parse(localStorage.getItem(key) || '{}');
            localStorage.setItem(key, JSON.stringify({ ...existing, ...updatedData }));
        } catch (e) {}

        return true;
    }

    function getSavedVehicleIds(email) {
        const emailNorm = (email || '').toLowerCase().trim();
        if (!emailNorm) return [];

        const key = 'santalucia_saved_vehicles_' + getUserProfileKey(emailNorm);
        const raw = localStorage.getItem(key);
        if (!raw) return [];

        const savedIds = JSON.parse(raw);
        if (!Array.isArray(savedIds)) {
            throw new Error('La lista de vehículos guardados tiene un formato inválido.');
        }

        return savedIds.map(String);
    }

    function toggleSavedVehicle(email, vehicleId) {
        const emailNorm = (email || '').toLowerCase().trim();
        if (!emailNorm || !vehicleId) {
            throw new Error('Se requiere un usuario y un vehículo para actualizar guardados.');
        }

        const savedIds = getSavedVehicleIds(emailNorm);
        const id = String(vehicleId);
        const existingIndex = savedIds.indexOf(id);
        const saved = existingIndex === -1;

        if (saved) {
            savedIds.push(id);
        } else {
            savedIds.splice(existingIndex, 1);
        }

        const key = 'santalucia_saved_vehicles_' + getUserProfileKey(emailNorm);
        localStorage.setItem(key, JSON.stringify(savedIds));
        return { saved: saved, ids: savedIds };
    }

    function logout() {
        try {
            localStorage.removeItem(STORAGE_KEY_SESSION);
            sessionStorage.removeItem(STORAGE_KEY_SESSION);
        } catch (e) {}
    }

    // ------------------------------------------------------------------------
    // MÉTRICAS CALCULADAS
    // ------------------------------------------------------------------------
    function getClientMetrics(email) {
        const userRes = getReservationsByUser(email);
        const activeRes = userRes.filter(r => r.estado === 'Activa');
        const totalSpent = userRes.reduce((acc, r) => acc + (parseFloat(r.monto) || 0), 0);
        const points = Math.round(totalSpent / 2);

        return {
            rentedCarsCount: activeRes.length,
            activeReservationsCount: activeRes.length,
            totalReservationsCount: userRes.length,
            totalSpent: totalSpent.toFixed(2),
            points: points,
            reservations: userRes
        };
    }

    function getAdminMetrics() {
        const fleet = getFleet();
        const allRes = getReservations();
        const activeRes = allRes.filter(r => r.estado === 'Activa');
        const totalIncome = allRes.reduce((acc, r) => acc + (parseFloat(r.monto) || 0), 0);
        const efficiency = fleet.length > 0 ? Math.round((activeRes.length / fleet.length) * 100) : 0;

        return {
            totalFleetCount: fleet.length,
            totalReservationsCount: allRes.length,
            activeReservationsCount: activeRes.length,
            totalIncome: totalIncome.toFixed(2),
            efficiency: efficiency + '%',
            fleet: fleet,
            reservations: allRes
        };
    }

    return {
        // Flota
        getFleet,
        saveFleet,
        getVehicleById,
        createVehicle,
        updateVehicle,
        deleteVehicle,

        // Mantenimientos
        getMaintenances,
        createMaintenance,
        completeMaintenance,

        // Reservas
        getReservations,
        saveReservations,
        getReservationsByUser,
        createReservation,
        updateReservation,
        deleteReservation,

        // Usuarios y Auth
        getUsers,
        findUserByEmail,
        registerUser,
        authenticateUser,
        getCurrentUserEmail,
        getCurrentUserData,
        updateUserData,
        getSavedVehicleIds,
        toggleSavedVehicle,
        setSession,
        logout,
        getUserProfileKey,

        // Métricas
        getClientMetrics,
        getAdminMetrics
    };
})();
