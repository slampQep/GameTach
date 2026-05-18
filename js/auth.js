// auth.js - Авторизация и регистрация (ИСПРАВЛЕННАЯ ВЕРСИЯ)

document.addEventListener('DOMContentLoaded', function() {
    // Инициализация базы данных
    initUserDatabase();
    
    // Если пользователь уже авторизован, перенаправляем в ЛК
    if (isLoggedIn() && window.location.pathname.includes('login.html')) {
        window.location.href = 'account.html';
    }
    hideAllErrors();
});

function initUserDatabase() {
    /** Пользователи по умолчанию (совпадают с сидом MySQL в database/seed_users_orders.sql). Пароль везде: Test123! */
    const seeds = [
        {
            name: 'Тестовый Пользователь',
            email: 'test@test.com',
            passwordHash: CryptoJS.SHA256('Test123!' + 'testsalt').toString(),
            salt: 'testsalt',
            registered: new Date().toISOString(),
            role: 'user'
        },
        {
            name: 'Анна Клиент',
            email: 'anna@gametech.local',
            passwordHash: CryptoJS.SHA256('Test123!' + 'anna2026').toString(),
            salt: 'anna2026',
            registered: new Date().toISOString(),
            role: 'user'
        },
        {
            name: 'Максим Игровой',
            email: 'max@gametech.local',
            passwordHash: CryptoJS.SHA256('Test123!' + 'max2026').toString(),
            salt: 'max2026',
            registered: new Date().toISOString(),
            role: 'user'
        }
    ];

    let users = {};
    try {
        users = JSON.parse(localStorage.getItem('users') || '{}');
    } catch (e) {
        users = {};
    }

    let added = false;
    seeds.forEach(function (u) {
        const key = String(u.email).trim().toLowerCase();
        if (!users[key]) {
            users[key] = u;
            added = true;
        }
    });

    if (added) {
        localStorage.setItem('users', JSON.stringify(users));
        console.log('Добавлены учётные записи для входа (при отсутствии): test@test.com, anna@gametech.local, max@gametech.local — пароль Test123!');
    }
}

function switchAuthTab(tabName) {
    // Убираем event.target - используем параметр
    document.querySelectorAll('.auth-tab').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
    
    // Активируем нужную вкладку
    document.querySelectorAll('.auth-tab').forEach(btn => {
        if (btn.textContent.includes(tabName === 'login' ? 'Вход' : 'Регистрация')) {
            btn.classList.add('active');
        }
    });
    
    document.getElementById(tabName + 'Form').classList.add('active');
    hideAllErrors();
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = event.target;
    
    if (input.type === 'password') {
        input.type = 'text';
        button.textContent = '🙈';
    } else {
        input.type = 'password';
        button.textContent = '👁️';
    }
}

function checkRegisterPassword() {
    const password = document.getElementById('registerPassword').value;
    const errorElement = document.getElementById('registerPasswordError');
    
    if (password.length === 0) {
        errorElement.style.display = 'none';
        return;
    }
    
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*]/.test(password);
    
    if (!hasMinLength || !hasUpperCase || !hasNumber || !hasSpecialChar) {
        errorElement.style.display = 'block';
    } else {
        errorElement.style.display = 'none';
    }
}

// Генерация "соли" для пароля
function generateSalt() {
    return CryptoJS.lib.WordArray.random(16).toString();
}

// Хеширование пароля с солью
function hashPassword(password, salt = '') {
    if (!salt) salt = generateSalt();
    return {
        hash: CryptoJS.SHA256(password + salt).toString(),
        salt: salt
    };
}

// ==================== РЕГИСТРАЦИЯ ====================
function register(event) {
    event.preventDefault();

    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim().toLowerCase();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirm').value;
    const submitBtn = document.querySelector('#registerForm button[type="submit"]');

    let isValid = true;

    if (!validateName(name)) {
        showError('registerNameError', 'Имя должно содержать только буквы (2-30 символов)');
        isValid = false;
    } else hideError('registerNameError');

    if (!validateEmail(email)) {
        showError('registerEmailError', 'Введите корректный email адрес');
        isValid = false;
    } else hideError('registerEmailError');

    if (!validatePassword(password)) {
        showError('registerPasswordError', 'Пароль должен содержать: 8+ символов, заглавную букву, цифру и спецсимвол');
        isValid = false;
    } else hideError('registerPasswordError');

    if (password !== confirmPassword) {
        showError('registerConfirmError', 'Пароли не совпадают');
        isValid = false;
    } else hideError('registerConfirmError');

    const users = JSON.parse(localStorage.getItem('users') || '{}');
    if (users[email]) {
        showError('registerEmailError', 'Пользователь с таким email уже существует');
        isValid = false;
    }

    if (!isValid) return;

    const hashedPassword = hashPassword(password);

    if (submitBtn) {
        submitBtn.disabled = true;
    }

    fetch('api/register_user.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: email,
            name: name,
            passwordHash: hashedPassword.hash,
            salt: hashedPassword.salt
        })
    })
        .then(function (response) {
            return response.json().then(function (data) {
                return { response: response, data: data };
            });
        })
        .catch(function () {
            return { response: null, data: { ok: false, error: 'network_error' } };
        })
        .then(function (result) {
            const response = result.response;
            const data = result.data || {};

            if (response && response.status === 409 && data.error === 'email_exists') {
                showError('registerEmailError', 'Пользователь с таким email уже есть в базе данных');
                return;
            }

            if (!response || !response.ok || !data.ok) {
                if (data.error === 'database_unavailable') {
                    showError('registerEmailError', 'База данных недоступна. Запустите MySQL в Open Server.');
                } else {
                    showError('registerEmailError', 'Не удалось сохранить аккаунт в базе. Попробуйте позже.');
                }
                return;
            }

            users[email] = {
                name: name,
                email: email,
                passwordHash: hashedPassword.hash,
                salt: hashedPassword.salt,
                registered: new Date().toISOString(),
                role: 'user',
                dbId: data.id || null
            };

            localStorage.setItem('users', JSON.stringify(users));
            document.getElementById('registerSuccess').style.display = 'block';
            document.getElementById('registerForm').reset();

            setTimeout(function () {
                switchAuthTab('login');
                document.getElementById('registerSuccess').style.display = 'none';
            }, 2000);
        })
        .finally(function () {
            if (submitBtn) {
                submitBtn.disabled = false;
            }
        });
}

// ==================== ВХОД ====================
function login(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;
    
    let isValid = true;
    
    if (!validateEmail(email)) {
        showError('loginEmailError', 'Введите корректный email');
        isValid = false;
    } else hideError('loginEmailError');
    
    if (password.length === 0) {
        showError('loginPasswordError', 'Введите пароль');
        isValid = false;
    } else hideError('loginPasswordError');
    
    if (!isValid) return;
    
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    const user = users[email];
    
    if (!user) {
        showError('loginError', 'Пользователь не найден');
        return;
    }
    
    const hashedInput = CryptoJS.SHA256(password + user.salt).toString();
    
    if (hashedInput !== user.passwordHash) {
        showError('loginError', 'Неверный пароль');
        return;
    }
    
    const session = {
        email: email,
        name: user.name,
        loggedIn: true,
        loginTime: new Date().toISOString(),
        sessionId: 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    };
    
    localStorage.setItem('currentUser', JSON.stringify(session));
    try {
        window.dispatchEvent(new CustomEvent('gametech-auth-changed'));
    } catch (e) {}
    mergeGuestCartToUser(email);
    mergeGuestOrderHistoryToUser(email);
    addLoginHistory(email, 'Вход в систему');
    document.getElementById('loginSuccess').style.display = 'block';
    document.getElementById('loginError').style.display = 'none';
    
    setTimeout(() => window.location.href = 'account.html', 1000);
}

function mergeGuestCartToUser(email) {
    const normalizeEmail = String(email || '').trim().toLowerCase();
    if (!normalizeEmail) return;

    const guestKey = 'cart_items_v1__guest';
    const userKey = 'cart_items_v1__' + normalizeEmail;

    let guestItems = [];
    let userItems = [];

    try {
        guestItems = JSON.parse(localStorage.getItem(guestKey) || '[]');
        userItems = JSON.parse(localStorage.getItem(userKey) || '[]');
    } catch (e) {
        guestItems = [];
        userItems = [];
    }

    if (!Array.isArray(guestItems) || guestItems.length === 0) {
        return;
    }
    if (!Array.isArray(userItems)) userItems = [];

    guestItems.forEach((guestItem) => {
        const index = userItems.findIndex((userItem) =>
            userItem.type === guestItem.type &&
            userItem.title === guestItem.title &&
            Number(userItem.price || 0) === Number(guestItem.price || 0)
        );

        if (index >= 0) {
            userItems[index].qty = Number(userItems[index].qty || 1) + Number(guestItem.qty || 1);
        } else {
            userItems.push(guestItem);
        }
    });

    localStorage.setItem(userKey, JSON.stringify(userItems));
    localStorage.removeItem(guestKey);
}

function mergeGuestOrderHistoryToUser(email) {
    const normalizeEmail = String(email || '').trim().toLowerCase();
    if (!normalizeEmail) return;

    const guestKey = 'order_history_v1__guest';
    const userKey = 'order_history_v1__' + normalizeEmail;

    let guestOrders = [];
    try {
        guestOrders = JSON.parse(localStorage.getItem(guestKey) || '[]');
    } catch (e) {
        guestOrders = [];
    }
    if (!Array.isArray(guestOrders) || guestOrders.length === 0) {
        return;
    }

    let userOrders = [];
    try {
        userOrders = JSON.parse(localStorage.getItem(userKey) || '[]');
    } catch (e) {
        userOrders = [];
    }
    if (!Array.isArray(userOrders)) userOrders = [];

    const merged = guestOrders.concat(userOrders);
    localStorage.setItem(userKey, JSON.stringify(merged));
    localStorage.removeItem(guestKey);
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
function validateName(name) {
    const nameRegex = /^[А-ЯЁа-яёA-Za-z\s]{2,30}$/;
    return nameRegex.test(name);
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePassword(password) {
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    return passwordRegex.test(password);
}

function isLoggedIn() {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    return user && user.loggedIn === true;
}

function getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser') || 'null');
}

function logout() {
    const user = getCurrentUser();
    if (user) addLoginHistory(user.email, 'Выход из системы');
    localStorage.removeItem('currentUser');
    try {
        window.dispatchEvent(new CustomEvent('gametech-auth-changed'));
    } catch (e) {}
    window.location.href = 'login.html';
}

function addLoginHistory(email, action) {
    const history = JSON.parse(localStorage.getItem('loginHistory') || '[]');
    history.unshift({
        email: email,
        action: action,
        timestamp: new Date().toISOString(),
        ip: '127.0.0.1'
    });
    if (history.length > 50) history.pop();
    localStorage.setItem('loginHistory', JSON.stringify(history));
}

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.style.display = 'block';
    }
}

function hideError(elementId) {
    const element = document.getElementById(elementId);
    if (element) element.style.display = 'none';
}

function hideAllErrors() {
    document.querySelectorAll('.error-message').forEach(el => {
        if (el) el.style.display = 'none';
    });
    document.querySelectorAll('.success-message').forEach(el => {
        if (el) el.style.display = 'none';
    });
}

// ==================== АДМИН ФУНКЦИИ (ОТДЕЛЬНО) ====================

function initAdminDatabase() {
    // Создаем супер-админа в отдельной базе (если еще нет)
    if (!localStorage.getItem('admin_users')) {
        const adminUsers = [{
            id: 1,
            username: 'admin',
            email: 'admin@gametech.ru',
            password: 'Q1w2e3r4t5y6!', // В реальном приложении это должно быть хешировано
            role: 'superadmin',
            status: 'active',
            createdAt: new Date().toISOString(),
            lastLogin: null,
            permissions: {
                view_dashboard: true,
                manage_users: true,
                manage_products: true,
                manage_orders: true,
                view_logs: true,
                system_settings: true
            }
        }];
        
        localStorage.setItem('admin_users', JSON.stringify(adminUsers));
    }

    // ГАРАНТИРУЕМ, что все админы есть и в основной базе users
    try {
        const adminUsers = JSON.parse(localStorage.getItem('admin_users') || '[]');
        const users = JSON.parse(localStorage.getItem('users') || '{}');

        adminUsers.forEach(admin => {
            if (!users[admin.email]) {
                const plainPassword = admin.password || 'Q1w2e3r4t5y6!';
                const hashedPassword = hashPassword(plainPassword);
                
                users[admin.email] = {
                    name: admin.username || 'Администратор',
                    email: admin.email,
                    passwordHash: hashedPassword.hash,
                    salt: hashedPassword.salt,
                    registered: admin.createdAt || new Date().toISOString(),
                    role: admin.role || 'admin'
                };
            }
        });

        localStorage.setItem('users', JSON.stringify(users));
    } catch (e) {
        console.error('Ошибка инициализации админ-пользователей', e);
    }
    
    // Инициализация других таблиц админки
    if (!localStorage.getItem('admin_settings')) {
        localStorage.setItem('admin_settings', JSON.stringify({
            siteName: 'GameTech',
            currency: '₽',
            maintenance: false,
            registrationEnabled: true,
            maxFileSize: 10,
            storageLimit: 100
        }));
    }
    
    if (!localStorage.getItem('admin_logs')) {
        localStorage.setItem('admin_logs', JSON.stringify([]));
    }
    
    if (!localStorage.getItem('admin_products')) {
        localStorage.setItem('admin_products', JSON.stringify([]));
    }
    
    // Синхронизация файлов
    syncFileDatabase();
}

function syncFileDatabase() {
    // Переносим старые файлы в новую базу если нужно
    const userFiles = JSON.parse(localStorage.getItem('userFiles') || '[]');
    const dbFiles = JSON.parse(localStorage.getItem('db_files') || '[]');
    
    if (userFiles.length > 0 && dbFiles.length === 0) {
        const convertedFiles = userFiles.map(file => ({
            id: file.id || ('file_' + Date.now() + Math.random().toString(36).substr(2, 9)),
            userId: file.userId || 'local_user',
            name: file.name,
            type: file.type,
            size: file.size,
            data: file.data,
            encrypted: file.encrypted || false,
            visibility: file.visibility || 'private',
            description: file.description || '',
            tags: file.tags || [],
            uploadDate: file.uploadedAt || new Date().toISOString(),
            downloads: file.downloads || 0,
            views: file.views || 0
        }));
        
        localStorage.setItem('db_files', JSON.stringify(convertedFiles));
        console.log(`✅ Перенесено ${convertedFiles.length} файлов`);
    }
}

function isCurrentUserAdmin() {
    const currentUser = getCurrentUser();
    if (!currentUser) return false;
    
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    const user = users[currentUser.email];
    
    return user && (user.role === 'admin' || user.role === 'superadmin');
}

function loginAsAdmin(loginEmail, password) {
    // Используем стандартную функцию входа
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    const user = users[loginEmail];
    
    if (!user) return { success: false, message: 'Пользователь не найден' };
    
    const hashedInput = CryptoJS.SHA256(password + user.salt).toString();
    
    if (hashedInput !== user.passwordHash) {
        return { success: false, message: 'Неверный пароль' };
    }
    
    // Проверяем роль
    if (user.role !== 'admin' && user.role !== 'superadmin') {
        return { success: false, message: 'Недостаточно прав' };
    }
    
    // Создаем стандартную сессию
    const session = {
        email: loginEmail,
        name: user.name,
        loggedIn: true,
        loginTime: new Date().toISOString(),
        sessionId: 'admin_session_' + Date.now()
    };
    
    localStorage.setItem('currentUser', JSON.stringify(session));
    try {
        window.dispatchEvent(new CustomEvent('gametech-auth-changed'));
    } catch (e) {}
    
    // Создаем админ-сессию
    const adminSession = {
        id: Date.now(),
        username: user.name || user.email.split('@')[0],
        email: user.email,
        role: user.role,
        loginTime: new Date().toISOString(),
        expires: Date.now() + 8 * 60 * 60 * 1000
    };
    
    localStorage.setItem('admin_session', JSON.stringify(adminSession));
    
    return { success: true, user: user };
}