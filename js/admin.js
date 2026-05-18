// admin.js - Управление админскими функциями

document.addEventListener('DOMContentLoaded', function() {
    // Инициализация админской базы данных
    if (typeof initAdminDatabase === 'function') {
        initAdminDatabase();
    }
    
    // Проверка админского доступа
    checkAdminAccess();
    
    // Обновляем каждую минуту
    setInterval(checkAdminAccess, 60000);
});

function checkAdminAccess() {
    const adminSession = JSON.parse(localStorage.getItem('admin_session') || 'null');
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    
    const isAdminActive = adminSession && adminSession.expires > Date.now();
    const isLoggedIn = currentUser && currentUser.loggedIn === true;
    
    // Если пользователь вошел как админ, но нет админ-сессии - создаем
    if (isLoggedIn && !isAdminActive) {
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        const user = users[currentUser.email];
        
        if (user && (user.role === 'admin' || user.role === 'superadmin')) {
            const adminSession = {
                id: Date.now(),
                username: user.name || user.email.split('@')[0],
                email: user.email,
                role: user.role,
                loginTime: new Date().toISOString(),
                expires: Date.now() + 8 * 60 * 60 * 1000
            };
            
            localStorage.setItem('admin_session', JSON.stringify(adminSession));
            isAdminActive = true;
        }
    }
    
    // Обновляем отображение ссылок
    updateAdminLinks(isAdminActive);
    
    return isAdminActive;
}

function updateAdminLinks(isAdmin) {
    // Находим все админ-ссылки на странице
    const adminElements = document.querySelectorAll('[data-admin-only]');
    const adminLinks = document.querySelectorAll('.admin-link, .admin-footer-link, #adminLink, #adminSection');
    
    if (isAdmin) {
        adminElements.forEach(el => el.style.display = 'block');
        adminLinks.forEach(el => {
            if (el) el.style.display = 'block';
        });
        
        // Добавляем информацию об админе
        const adminSession = JSON.parse(localStorage.getItem('admin_session') || 'null');
        if (adminSession) {
            showAdminInfo(adminSession);
        }
    } else {
        adminElements.forEach(el => el.style.display = 'none');
        adminLinks.forEach(el => {
            if (el) el.style.display = 'none';
        });
        
        // Удаляем информацию об админе
        removeAdminInfo();
    }
}

function showAdminInfo(adminSession) {
    // Удаляем старую информацию
    removeAdminInfo();
    
    // Добавляем новую информацию
    const adminInfo = document.createElement('div');
    adminInfo.className = 'admin-info';
    adminInfo.style.cssText = `
        color: var(--accent-admin);
        font-size: 12px;
        padding: 8px 12px;
        background: rgba(255, 107, 0, 0.1);
        border-radius: 8px;
        border-left: 3px solid var(--accent-admin);
        margin: 10px 0;
    `;
    adminInfo.innerHTML = `
        <strong>👑 Администратор:</strong> ${adminSession.username}
        <br><small>Роль: ${adminSession.role === 'superadmin' ? 'Супер-админ' : 'Админ'}</small>
    `;
    
    // Добавляем в футер или другое место
    const footer = document.querySelector('footer .container');
    if (footer) {
        footer.prepend(adminInfo);
    }
}

function removeAdminInfo() {
    document.querySelectorAll('.admin-info').forEach(el => el.remove());
}

function quickAdminLogin() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    
    if (!currentUser) {
        alert('Сначала войдите в систему!');
        window.location.href = 'login.html';
        return;
    }
    
    // Используем стандартную функцию из auth.js
    if (typeof loginAsAdmin === 'function') {
        const email = prompt('Введите email администратора:', 'admin@gametech.ru');
        const password = prompt('Введите пароль администратора:', 'Q1w2e3r4t5y6!');
        
        if (email && password) {
            const result = loginAsAdmin(email, password);
            if (result.success) {
                alert('✅ Успешный вход в админ-панель!');
                location.reload();
            } else {
                alert('❌ Ошибка: ' + result.message);
            }
        }
    } else {
        alert('Админские функции не загружены');
    }
}

function logoutAdmin() {
    if (confirm('Выйти из админ-панели?')) {
        localStorage.removeItem('admin_session');
        alert('👋 Админ-сессия завершена');
        checkAdminAccess();
    }
}

// Делаем функции глобальными
window.checkAdminAccess = checkAdminAccess;
window.quickAdminLogin = quickAdminLogin;
window.logoutAdmin = logoutAdmin;