# GameTech — дипломный проект

Полное описание для пояснительной записки: **[docs/DIPLOM_GAMETECH.md](docs/DIPLOM_GAMETECH.md)**  
(адаптация диплома «Веб-сайт общежития» под магазин GameTech).

## Быстрый старт
1. Open Server: MySQL + Apache, домен `http://gametach/`
2. phpMyAdmin → БД `gametech` → импорт `database/phpmyadmin_import.sql`
3. Браузер: `http://gametach/api/install_users_orders.php` (создаст users, orders, support_requests)
4. Вход: `test@test.com` / `Test123!`

## Реализованные модули
- Каталог и **сравнение CPU** (`components.html`, `compare-cpus.html`)
- **Корзина и заказы** в MySQL (`cart.html`, `api/place_order.php`)
- **Личный кабинет** с суммой покупок (`account.html`)
- **Регистрация** в БД (`api/register_user.php`)
- **Поддержка** — заявки (`support.html`, таблица `support_requests`)
- **Контакты и доставка** (`contacts.html`, `delivery.html`)
- **Админка**: пользователи, покупки, заявки (`admin.html`)

## База данных
Таблицы: `components`, `users`, `orders`, `order_items`, `support_requests`
