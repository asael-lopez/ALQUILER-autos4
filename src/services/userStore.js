import {
    authenticate,
    findUserByEmail,
    getRegisteredUsers,
    setSession,
    USERS_KEY
} from './auth.js';

function getUserProfileKey(email) {
    return `user_data_${btoa(unescape(encodeURIComponent(email || ''))).replace(/=/g, '')}`;
}

export function registerUser(userData) {
    if (!userData || typeof userData !== 'object') {
        return { ok: false, message: 'Los datos de registro no son válidos.' };
    }

    const email = String(userData.email || '').toLowerCase().trim();
    const name = String(userData.name || '').trim();
    const phone = String(userData.phone || '').trim();
    const password = String(userData.password || '');

    if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
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
    if (findUserByEmail(email)) {
        return { ok: false, message: 'Este correo ya se encuentra registrado. Inicia sesión.' };
    }

    const user = {
        email,
        password,
        name,
        phone,
        role: 'usuario',
        avatar: userData.avatar || ''
    };
    const users = getRegisteredUsers();
    users.push(user);

    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    localStorage.setItem(getUserProfileKey(email), JSON.stringify(user));
    setSession(user);

    return { ok: true, user };
}

export function authenticateUser(email, password) {
    return authenticate(email, password);
}
