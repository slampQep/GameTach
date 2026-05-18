# GameTech: GitHub + публичный хостинг и облачная MySQL

## Важно: что может и не может GitHub

| Сервис | HTML/CSS/JS | PHP (api/*.php) | MySQL |
|--------|---------------|-----------------|-------|
| **GitHub** (репозиторий) | хранит код | хранит код | только файлы `.sql` |
| **GitHub Pages** | да | **нет** | **нет** |
| **PHP-хостинг** (InfinityFree, Beget, Timeweb…) | да | **да** | да (часто в той же панели) |

**Вывод:** код кладёте на **GitHub**, а **работающий сайт** с заказами в БД — на **хостинг с PHP + MySQL**.  
«Публичная база» = **облачный MySQL** (на том же хостинге или отдельно: db4free.net, Aiven и т.д.), к которому подключается ваш `api/bootstrap.php`.

---

## Рекомендуемая схема (проще всего)

```
GitHub (исходники)  →  копируете на хостинг (FTP / панель)
                              ↓
                    PHP на хостинге (api/*.php)
                              ↓
                    MySQL в панели хостинга (не localhost дома)
```

Один провайдер (например **InfinityFree** + поддомен `ваш-сайт.epizy.com`) даёт и PHP, и MySQL — не нужно настраивать CORS.

---

## Шаг 1. Репозиторий на GitHub

1. Установите [Git](https://git-scm.com/), создайте аккаунт на [github.com](https://github.com).
2. В папке проекта:

```bash
cd D:\OSPanel\domains\GameTach
git init
git add .
git commit -m "GameTech: initial"
git branch -M main
git remote add origin https://github.com/ВАШ_ЛОГИН/gametech.git
git push -u origin main
```

Пароли БД в Git **не попадут** — в `.gitignore` указан `api/config.local.php`.

---

## Шаг 2. Хостинг с PHP (бесплатный вариант)

**InfinityFree** (пример): [infinityfree.net](https://www.infinityfree.net/)

1. Регистрация → создать сайт (поддомен `.epizy.com` или свой домен).
2. В панели: **MySQL Databases** — создать БД, записать:
   - MySQL Host (например `sql123.infinityfree.com`)
   - Database name, Username, Password
3. **phpMyAdmin** в панели → импорт файла  
   `database/phpmyadmin_import.sql`  
   (при необходимости перед этим — `database/schema.sql`).
4. Загрузить файлы проекта в `htdocs` через **File Manager** или **FTP** (FileZilla): всё содержимое `GameTach`, чтобы в корне были `index.html`, папки `api`, `js`, `css`.

---

## Шаг 3. Подключение к облачной MySQL

1. Скопировать `api/config.local.php.example` → `api/config.local.php`.
2. Вписать данные из панели хостинга:

```php
<?php
return [
    'host' => 'sql123.infinityfree.com',
    'user' => 'if0_xxxxx',
    'pass' => 'ваш_пароль',
    'name' => 'if0_xxxxx_gametech',
    'port' => 3306,
];
```

3. Проверка в браузере:  
   `https://ваш-сайт.epizy.com/api/health.php`  
   Должно быть: `"database": "connected"`.

4. Каталог комплектующих: один раз открыть (если таблица `components` пустая):  
   `https://ваш-сайт.epizy.com/api/import_components.php`  
   (только с вашего ПК, потом закрыть доступ или удалить с публичного хостинга).

---

## Шаг 4. Отдельная «публичная» MySQL (если PHP на другом сервере)

Подойдут: **db4free.net**, **Aiven** (free trial), MySQL у платного хостинга.

1. Создать БД, разрешить **удалённые подключения** (Remote MySQL) с IP вашего PHP-хостинга.
2. Импорт `database/schema.sql` + `phpmyadmin_import.sql` через их phpMyAdmin.
3. Те же поля в `api/config.local.php` (host — внешний, не `127.0.0.1`).

Если фронт на одном домене, а API на другом — понадобятся заголовки CORS (для GameTech проще держать всё на одном домене).

---

## Локальная разработка vs продакшен

| Где | config.local.php |
|-----|------------------|
| Open Server дома | не нужен (по умолчанию root / gametech / 127.0.0.1) |
| Хостинг | **обязателен** с данными облачной БД |

Переменные окружения `GAMETECH_DB_*` по-прежнему поддерживаются (если хостинг их умеет).

---

## Ограничения текущего проекта на хостинге

- **Вход пользователя** — в основном **localStorage** в браузере; в MySQL уходят регистрация, заказы, поддержка. На новом устройстве нужно снова войти на сайте.
- Бесплатный хостинг может **засыпать** сайт, ограничивать трафик и внешние MySQL-запросы — для диплома обычно достаточно.
- **admin@gametech.ru** — вход через `admin-login.html`, как локально.

---

## Альтернатива: только GitHub Pages

Возможен **урезанный** вариант без PHP: статические страницы, корзина в localStorage, **без** сохранения заказов в общую БД. Для диплома с MySQL это **не подходит** — нужен PHP-хостинг.

---

## Чеклист после выкладки

- [ ] `api/health.php` → `connected`
- [ ] Регистрация → запись в `users` (phpMyAdmin на хостинге)
- [ ] Заказ из корзины → `orders`, `order_items`
- [ ] Заявка в поддержку → `support_requests`
- [ ] `config.local.php` не залит в GitHub
