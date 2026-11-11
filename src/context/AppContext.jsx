import { useEffect, useState } from 'react';
import { initialCars } from '../data/initialCars';
import { appContext as AppContext } from './contextStore';

const DEFAULT_USER_EMAIL = 'cliente@santalucia.com';
const DEFAULT_ADMIN_EMAIL = 'admin@santalucia.com';
const DEFAULT_BRANCH = {
    id: 'santa-lucia-soyapango',
    name: 'Alquiler SantaLucía',
    latitude: 13.703628,
    longitude: -89.150161,
    address: 'Av. Principal 123, Centro, Santa Lucia, Soyapango.',
    hours: 'Lun-Sáb: 08:00 - 20:00',
    phone: '+503 7577-2971'
};

function readStorage(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
    } catch {
        return fallback;
    }
}

function getProfileStorageKey(email) {
    return `user_data_${btoa(unescape(encodeURIComponent(email || ''))).replace(/=/g, '')}`;
}

function getSavedVehiclesKey(email) {
    return `santalucia_saved_vehicles_${getProfileStorageKey(email)}`;
}

function loadCurrentUser() {
    const email = localStorage.getItem('usuario')
        || sessionStorage.getItem('usuario')
        || DEFAULT_ADMIN_EMAIL;
    const registeredUsers = readStorage('usuarios_registrados', []);
    const registeredUser = (Array.isArray(registeredUsers) ? registeredUsers : []).find(
        (user) => user.email?.toLowerCase() === email.toLowerCase()
    ) || {};
    const savedProfile = readStorage(getProfileStorageKey(email), {});

    return {
        ...registeredUser,
        ...savedProfile,
        email,
        name: savedProfile.name || registeredUser.name || (email === DEFAULT_ADMIN_EMAIL ? 'Admin' : email.split('@')[0]),
        role: savedProfile.role || registeredUser.role || 'admin',
        phone: savedProfile.phone || registeredUser.phone || '',
        avatar: savedProfile.avatar || registeredUser.avatar || ''
    };
}

function loadSavedVehicles(email) {
    const ids = readStorage(getSavedVehiclesKey(email), []);
    return Array.isArray(ids) ? ids.map(String) : [];
}

function loadCars() {
    const savedCars = readStorage('santa_lucia_cars', null);
    return Array.isArray(savedCars) && savedCars.length >= 8 ? savedCars : initialCars;
}

function loadReservations() {
    const savedReservations = readStorage('santa_lucia_reservations', null);
    return Array.isArray(savedReservations) ? savedReservations : [
        {
            id: 'RES-101',
            usuario: DEFAULT_USER_EMAIL,
            clienteNombre: 'José Rauda',
            carId: 1,
            autoNombre: 'Nissan Versa',
            categoria: 'Autos (Compacto)',
            fechaInicio: '2026-11-10',
            fechaFin: '2026-11-13',
            dias: 3,
            lugar: 'San Salvador - Oficina Central (Av. Principal 123)',
            monto: 105.00,
            estado: 'Activa',
            date: new Date().toISOString()
        }
    ];
}

function updateCarRentalStatus(cars, reservations, carId) {
    const hasActiveRental = reservations.some(
        (reservation) =>
            String(reservation.carId) === String(carId)
            && !['Cancelada', 'Completada'].includes(reservation.estado)
    );

    return cars.map((car) => {
        if (String(car.id) !== String(carId)) return car;
        if (hasActiveRental) {
            return { ...car, status: 'Alquilado', disponible: false };
        }
        if (car.status === 'En Mantenimiento') return { ...car, disponible: false };
        return { ...car, status: 'Disponible', disponible: true };
    });
}

export function AppProvider({ children }) {
    const [language, setLanguage] = useState(() => (
        localStorage.getItem('preferredLang') === 'en' ? 'en' : 'es'
    ));
    const [currentUser, setCurrentUser] = useState(loadCurrentUser);
    const [userEmail, setUserEmail] = useState(
        () => localStorage.getItem('usuario') || sessionStorage.getItem('usuario') || DEFAULT_USER_EMAIL
    );
    const [role, setRole] = useState(() => localStorage.getItem('santa_lucia_role') || 'ADMIN');
    const [clients, setClients] = useState(() => {
        const savedClients = readStorage('usuarios_registrados', []);
        return Array.isArray(savedClients) ? savedClients : [];
    });
    const [cars, setCars] = useState(loadCars);
    const [rentals, setRentals] = useState(loadReservations);
    const [favorites, setFavorites] = useState(() => loadSavedVehicles(currentUser?.email));
    const [selectedBranch, setSelectedBranch] = useState(DEFAULT_BRANCH.id);
    const [userLocation, setUserLocation] = useState(null);
    const [maintenances, setMaintenances] = useState(() => {
        const savedMaintenance = readStorage('santa_lucia_maintenance', []);
        return Array.isArray(savedMaintenance) ? savedMaintenance : [];
    });

    useEffect(() => {
        localStorage.setItem('santa_lucia_role', role);
    }, [role]);

    useEffect(() => {
        localStorage.setItem('preferredLang', language);
    }, [language]);

    useEffect(() => {
        localStorage.setItem('santa_lucia_cars', JSON.stringify(cars));
    }, [cars]);

    useEffect(() => {
        localStorage.setItem('santa_lucia_reservations', JSON.stringify(rentals));
    }, [rentals]);

    useEffect(() => {
        localStorage.setItem('santa_lucia_maintenance', JSON.stringify(maintenances));
    }, [maintenances]);

    useEffect(() => {
        localStorage.setItem('usuarios_registrados', JSON.stringify(clients));
    }, [clients]);

    useEffect(() => {
        if (!currentUser?.email) return;
        localStorage.setItem(getProfileStorageKey(currentUser.email), JSON.stringify(currentUser));
    }, [currentUser]);

    useEffect(() => {
        if (!currentUser?.email) return;
        localStorage.setItem(getSavedVehiclesKey(currentUser.email), JSON.stringify(favorites));
    }, [favorites, currentUser?.email]);

    const toggleRole = () => setRole((previousRole) => (previousRole === 'ADMIN' ? 'CLIENTE' : 'ADMIN'));

    const addCar = (newCar) => {
        setCars((previousCars) => [
            ...previousCars,
            { ...newCar, id: newCar.id ?? Date.now(), status: newCar.status || 'Disponible', disponible: newCar.disponible ?? true }
        ]);
    };

    const updateCar = (id, updatedData) => {
        setCars((previousCars) => previousCars.map(
            (car) => (String(car.id) === String(id) ? { ...car, ...updatedData } : car)
        ));
    };

    const deleteCar = (id) => {
        setCars((previousCars) => previousCars.filter((car) => String(car.id) !== String(id)));
        setFavorites((previousFavorites) => previousFavorites.filter((favoriteId) => favoriteId !== String(id)));
    };

    const toggleFavorite = (id) => {
        const favoriteId = String(id);
        setFavorites((previousFavorites) => (
            previousFavorites.includes(favoriteId)
                ? previousFavorites.filter((savedId) => savedId !== favoriteId)
                : [...previousFavorites, favoriteId]
        ));
    };

    const updateReservationStatus = (id, newStatus) => {
        const updatedRentals = rentals.map(
            (rental) => (rental.id === id ? { ...rental, estado: newStatus } : rental)
        );
        const changedRental = rentals.find((rental) => rental.id === id);
        setRentals(updatedRentals);
        if (changedRental) {
            setCars((previousCars) => updateCarRentalStatus(previousCars, updatedRentals, changedRental.carId));
        }
    };

    const rentCar = (newRental) => {
        const rental = {
            ...newRental,
            id: newRental.id || `RES-${Math.floor(1000 + Math.random() * 9000)}`,
            usuario: newRental.usuario || userEmail || DEFAULT_USER_EMAIL,
            estado: newRental.estado || 'Activa',
            date: new Date().toISOString()
        };
        setRentals((previousRentals) => [...previousRentals, rental]);
        setCars((previousCars) => updateCarRentalStatus(previousCars, [...rentals, rental], rental.carId));
        return rental;
    };

    const returnCar = (rentalId) => {
        const updatedRentals = rentals.map(
            (rental) => (rental.id === rentalId ? { ...rental, estado: 'Completada' } : rental)
        );
        const returnedRental = rentals.find((rental) => rental.id === rentalId);
        setRentals(updatedRentals);
        if (returnedRental) {
            setCars((previousCars) => updateCarRentalStatus(previousCars, updatedRentals, returnedRental.carId));
        }
    };

    const deleteReservation = (id) => {
        const remainingRentals = rentals.filter((rental) => rental.id !== id);
        const deletedRental = rentals.find((rental) => rental.id === id);
        setRentals(remainingRentals);
        if (deletedRental) {
            setCars((previousCars) => updateCarRentalStatus(previousCars, remainingRentals, deletedRental.carId));
        }
    };

    const login = (user) => {
        if (!user?.email) return;
        const nextUser = { ...user, email: user.email };
        setCurrentUser(nextUser);
        setUserEmail(nextUser.email);
        setFavorites(loadSavedVehicles(nextUser.email));
        setRole(nextUser.role?.toLowerCase() === 'cliente' ? 'CLIENTE' : 'ADMIN');
        setClients((previousClients) => {
            const existingIndex = previousClients.findIndex(
                (client) => client.email?.toLowerCase() === nextUser.email.toLowerCase()
            );
            if (existingIndex < 0) return [...previousClients, nextUser];
            return previousClients.map((client, index) => (index === existingIndex ? { ...client, ...nextUser } : client));
        });
        localStorage.setItem('usuario', nextUser.email);
    };

    const logout = () => {
        localStorage.removeItem('usuario');
        sessionStorage.removeItem('usuario');
        setCurrentUser(null);
        setUserEmail('');
        setFavorites([]);
        setRole('ADMIN');
    };

    const updateCurrentUser = (updatedData) => {
        if (!currentUser) return;
        const updatedUser = { ...currentUser, ...updatedData };
        setCurrentUser(updatedUser);
        setClients((previousClients) => previousClients.map(
            (client) => (client.email?.toLowerCase() === currentUser.email.toLowerCase()
                ? { ...client, ...updatedData }
                : client)
        ));
    };

    const createMaintenance = (maintenanceData) => {
        const newMaintenance = {
            ...maintenanceData,
            id: `MNT-${Date.now()}`,
            estado: 'En curso'
        };
        setMaintenances((previousMaintenances) => [...previousMaintenances, newMaintenance]);
        setCars((previousCars) => previousCars.map((car) => (
            String(car.id) === String(maintenanceData.vehicleId)
                ? { ...car, status: 'En Mantenimiento', disponible: false }
                : car
        )));
    };

    const completeMaintenance = (maintenanceId) => {
        const maintenance = maintenances.find((item) => item.id === maintenanceId);
        if (maintenance) {
            setCars((previousCars) => previousCars.map((car) => (
                String(car.id) === String(maintenance.vehicleId)
                    ? { ...car, status: 'Disponible', disponible: true }
                    : car
            )));
        }
        setMaintenances((previousMaintenances) => previousMaintenances.map((item) => (
            item.id === maintenanceId
                ? { ...item, estado: 'Finalizado', fechaFinalizacion: new Date().toLocaleDateString() }
                : item
        )));
    };

    const value = {
        language,
        setLanguage,
        role,
        toggleRole,
        userEmail,
        currentUser,
        clients,
        login,
        logout,
        updateCurrentUser,
        cars,
        addCar,
        updateCar,
        deleteCar,
        favorites,
        toggleFavorite,
        selectedBranch,
        setSelectedBranch,
        userLocation,
        setUserLocation,
        rentals,
        reservations: rentals,
        rentCar,
        returnCar,
        addReservation: rentCar,
        updateReservationStatus,
        deleteReservation,
        maintenances,
        createMaintenance,
        completeMaintenance
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
