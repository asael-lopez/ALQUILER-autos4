// CAMBIAR POR DATOS REALES
const SUCURSAL = {
    name: 'Alquiler SantaLucía',
    latitude: 13.703628,
    longitude: -89.150161,
    address: 'Av. Principal 123, Centro, Santa Lucia, Soyapango.',
    hours: 'Lun-Sáb: 08:00 - 20:00',
    phone: '+503 7577-2971'
};

// Configuración de servicios externos y límite de uso de Nominatim.
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const SEARCH_INTERVAL_MS = 1100;
const searchCache = new Map();

// Convierte el teléfono en un enlace compatible con tel: sin modificar el dato visible.
function getPhoneLink(phone) {
    return phone.replace(/[^\d+]/g, '');
}

// Crea el contenido del popup mediante nodos para no insertar HTML sin validar.
function createBranchPopup() {
    const container = document.createElement('div');
    const name = document.createElement('strong');
    const address = document.createElement('p');
    const hours = document.createElement('p');
    const phoneRow = document.createElement('p');
    const phoneLink = document.createElement('a');

    name.className = 'location-popup-title';
    name.textContent = SUCURSAL.name;
    address.textContent = `Dirección: ${SUCURSAL.address}`;
    hours.textContent = `Horario: ${SUCURSAL.hours}`;
    phoneRow.append('Teléfono: ');
    phoneLink.href = `tel:${getPhoneLink(SUCURSAL.phone)}`;
    phoneLink.textContent = SUCURSAL.phone;
    phoneRow.append(phoneLink);
    container.append(name, address, hours, phoneRow);

    return container;
}

// Calcula la distancia de círculo máximo entre dos coordenadas.
function getDistanceKm(start, end) {
    const radians = (degrees) => (degrees * Math.PI) / 180;
    const earthRadiusKm = 6371;
    const latitudeDelta = radians(end[0] - start[0]);
    const longitudeDelta = radians(end[1] - start[1]);
    const value = Math.sin(latitudeDelta / 2) ** 2
        + Math.cos(radians(start[0]))
        * Math.cos(radians(end[0]))
        * Math.sin(longitudeDelta / 2) ** 2;

    return earthRadiusKm * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

// Muestra los estados del buscador dentro de la página, nunca con alert().
function setLocationStatus(element, message, type = '') {
    element.textContent = message;
    element.classList.toggle('is-error', type === 'error');
    element.classList.toggle('is-success', type === 'success');
}

// Geocodifica una dirección dentro de El Salvador y conserva resultados recientes en memoria.
async function searchAddress(query, lastRequest) {
    const cacheKey = query.trim().toLocaleLowerCase('es');
    if (searchCache.has(cacheKey)) {
        return searchCache.get(cacheKey);
    }

    const waitMs = Math.max(0, SEARCH_INTERVAL_MS - (Date.now() - lastRequest.value));
    if (waitMs > 0) {
        await new Promise((resolve) => window.setTimeout(resolve, waitMs));
    }

    const params = new URLSearchParams({
        format: 'json',
        q: query,
        countrycodes: 'sv',
        limit: '1'
    });
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 12000);
    lastRequest.value = Date.now();

    try {
        const response = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
            headers: { 'Accept-Language': 'es' },
            signal: controller.signal
        });

        if (!response.ok) {
            throw new Error(`Nominatim respondió con estado ${response.status}.`);
        }

        const results = await response.json();
        if (Array.isArray(results)) {
            searchCache.set(cacheKey, results);
        }
        return results;
    } finally {
        window.clearTimeout(timeoutId);
    }
}

// Inicializa el mapa, sus controles y el buscador cuando los elementos ya existen.
function initializeLocationMap() {
    const mapElement = document.getElementById('locationMap');
    const searchForm = document.getElementById('locationSearchForm');
    const searchInput = document.getElementById('locationSearchInput');
    const searchButton = document.getElementById('locationSearchButton');
    const statusElement = document.getElementById('locationStatus');
    const distanceElement = document.getElementById('locationDistance');
    const directionsLink = document.getElementById('locationDirections');

    if (!mapElement || !searchForm || !searchInput || !searchButton || !statusElement || !distanceElement || !directionsLink) {
        return;
    }

    const branchCoordinates = [SUCURSAL.latitude, SUCURSAL.longitude];
    const directionsUrl = new URL('https://www.openstreetmap.org/directions');
    directionsUrl.searchParams.set('to', `${SUCURSAL.latitude},${SUCURSAL.longitude}`);
    directionsLink.href = directionsUrl.toString();

    if (!window.L) {
        mapElement.innerHTML = '<p class="location-map-error">No se pudo cargar Leaflet. Revisa tu conexión e inténtalo de nuevo.</p>';
        setLocationStatus(statusElement, 'El mapa no está disponible en este momento.', 'error');
        searchButton.disabled = true;
        return;
    }

    const map = L.map(mapElement, { scrollWheelZoom: false }).setView(branchCoordinates, 15);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
        maxZoom: 19
    }).addTo(map);

    const branchIcon = L.divIcon({
        className: 'location-custom-div-icon',
        html: '<span class="location-marker-pin" aria-hidden="true"><i class="fas fa-map-marker-alt"></i></span>',
        iconSize: [34, 40],
        iconAnchor: [17, 38],
        popupAnchor: [0, -34]
    });
    const searchIcon = L.divIcon({
        className: 'location-custom-div-icon',
        html: '<span class="location-marker-pin is-search-result" aria-hidden="true"><i class="fas fa-location-dot"></i></span>',
        iconSize: [34, 40],
        iconAnchor: [17, 38],
        popupAnchor: [0, -34]
    });

    L.marker(branchCoordinates, {
        icon: branchIcon,
        title: SUCURSAL.name,
        alt: SUCURSAL.name
    }).addTo(map).bindPopup(createBranchPopup()).openPopup();

    let searchedMarker = null;
    const lastRequest = { value: 0 };

    searchForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const query = searchInput.value.trim();

        if (!query) {
            setLocationStatus(statusElement, 'Escribe una dirección para iniciar la búsqueda.', 'error');
            searchInput.focus();
            return;
        }

        if (searchedMarker) {
            map.removeLayer(searchedMarker);
            searchedMarker = null;
        }
        distanceElement.hidden = true;
        setLocationStatus(statusElement, 'Buscando dirección...', '');
        searchButton.disabled = true;
        searchButton.textContent = 'Buscando...';

        try {
            const results = await searchAddress(query, lastRequest);
            if (!Array.isArray(results) || results.length === 0) {
                setLocationStatus(statusElement, 'No encontramos esa dirección en El Salvador. Prueba con otra referencia.', 'error');
                return;
            }

            const resultLatitude = Number(results[0].lat);
            const resultLongitude = Number(results[0].lon);
            if (!Number.isFinite(resultLatitude) || !Number.isFinite(resultLongitude)) {
                throw new Error('Nominatim devolvió coordenadas inválidas.');
            }

            const resultCoordinates = [resultLatitude, resultLongitude];
            const resultPopup = document.createElement('p');
            resultPopup.textContent = results[0].display_name || query;
            searchedMarker = L.marker(resultCoordinates, {
                icon: searchIcon,
                title: 'Dirección buscada',
                alt: 'Dirección buscada'
            }).addTo(map).bindPopup(resultPopup).openPopup();

            const distance = getDistanceKm(branchCoordinates, resultCoordinates);
            distanceElement.textContent = `Distancia aproximada a la sucursal: ${distance.toFixed(2)} km.`;
            distanceElement.hidden = false;
            setLocationStatus(statusElement, 'Dirección encontrada.', 'success');
            map.fitBounds(L.latLngBounds(branchCoordinates, resultCoordinates).pad(0.2), { maxZoom: 15 });
        } catch (error) {
            const message = error.name === 'AbortError'
                ? 'La búsqueda tardó demasiado. Inténtalo de nuevo.'
                : 'No se pudo buscar la dirección. Revisa tu conexión e inténtalo de nuevo.';
            setLocationStatus(statusElement, message, 'error');
        } finally {
            searchButton.disabled = false;
            searchButton.textContent = 'Buscar';
        }
    });

    window.requestAnimationFrame(() => map.invalidateSize());
}

initializeLocationMap();
