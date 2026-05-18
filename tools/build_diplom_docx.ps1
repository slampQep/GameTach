# Генерация DIPLOM_GAMETECH.docx через Microsoft Word
$ErrorActionPreference = "Stop"
$outPath = "D:\OSPanel\domains\GameTach\docs\DIPLOM_GAMETECH.docx"

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Add()
$sel = $word.Selection

function Add-Title($t) {
    $sel.Style = "Heading 1"
    $sel.TypeText($t)
    $sel.TypeParagraph()
}

function Add-H2($t) {
    $sel.Style = "Heading 2"
    $sel.TypeText($t)
    $sel.TypeParagraph()
}

function Add-H3($t) {
    $sel.Style = "Heading 3"
    $sel.TypeText($t)
    $sel.TypeParagraph()
}

function Add-P($t) {
    $sel.Style = "Normal"
    $sel.TypeText($t)
    $sel.TypeParagraph()
}

function Add-Bullet($t) {
    $sel.Style = "Normal"
    $sel.Range.ListFormat.ApplyBulletDefault()
    $sel.TypeText($t)
    $sel.TypeParagraph()
    $sel.Range.ListFormat.RemoveNumbers()
}

# Титул
$sel.ParagraphFormat.Alignment = 1 # center
Add-P "Министерство науки и высшего образования Российской Федерации"
Add-P "КГБПОУ «Красноярский техникум социальных технологий»"
Add-P ""
Add-P "ДП 09.02.07 Информационные системы и программирование"
Add-P ""
$sel.Font.Size = 16
$sel.Font.Bold = $true
Add-P "ПОЯСНИТЕЛЬНАЯ ЗАПИСКА"
Add-P "к дипломному проекту"
Add-P ""
$sel.Font.Size = 14
Add-P "на тему:"
Add-P "«Разработка веб-сайта интернет-магазина GameTech»"
$sel.Font.Bold = $false
$sel.Font.Size = 11
Add-P ""
Add-P ""
Add-P "Выполнил: студент группы ИСиП-___  _________________"
Add-P "Руководитель: _________________________"
Add-P ""
Add-P "Красноярск, 2026"
$sel.TypeParagraph()
$sel.InsertBreak(7) # page break
$sel.ParagraphFormat.Alignment = 0

Add-Title "СОДЕРЖАНИЕ"
Add-P "Введение"
Add-P "1. Общая часть"
Add-P "1.1 Анализ предметной области"
Add-P "1.2 Постановка задачи"
Add-P "1.3 Выбор средств разработки"
Add-P "2. Специальная часть"
Add-P "2.1 Проектирование БД и структуры сайта"
Add-P "2.2 Разработка клиентской части"
Add-P "2.3 Разработка серверной части"
Add-P "2.4 Тестирование"
Add-P "3. Экономическая часть (кратко)"
Add-P "4. Безопасность и экологичность"
Add-P "Заключение"
Add-P "Список источников"
Add-P "Приложения"
$sel.InsertBreak(7)

Add-Title "ВВЕДЕНИЕ"
Add-P "Актуальность дипломного проекта обусловлена ростом спроса на игровые компьютеры и периферию. Покупатели нуждаются в единой площадке: каталог готовых ПК, подбор комплектующих, сравнение процессоров, корзина, оформление заказа и личный кабинет с историей покупок. Без информационной системы данные хранятся в разрозненных таблицах и мессенджерах, что снижает качество обслуживания."
Add-P "Объект дипломного проекта — процессы продажи и сопровождения клиентов интернет-магазина GameTech."
Add-P "Предмет — веб-сайт GameTech, реализованный на HTML, CSS, JavaScript, PHP и MySQL."
Add-P "Цель — повысить удобство выбора и покупки игровой техники за счёт разработки веб-сайта с каталогом, конфигуратором, корзиной, регистрацией пользователей и хранением заказов в СУБД MySQL."
Add-P "Задачи:"
Add-Bullet "провести анализ предметной области и существующих решений;"
Add-Bullet "спроектировать структуру сайта и базу данных;"
Add-Bullet "разработать клиентскую часть (витрина, личный кабинет, сравнение CPU);"
Add-Bullet "разработать серверную часть (API, регистрация, заказы, поддержка);"
Add-Bullet "провести тестирование и отладку."
Add-P "Практическая значимость — готовый программный продукт, развёрнутый на Open Server (домен gametach), пригодный для демонстрации на защите и дальнейшего развития."

Add-Title "1. ОБЩАЯ ЧАСТЬ"
Add-H2 "1.1 Анализ предметной области"
Add-P "Интернет-магазин GameTech предлагает готовые игровые ПК, комплектующие, периферию и онлайн-конфигуратор сборки. Клиент проходит путь: просмотр каталога → сравнение характеристик → добавление в корзину → регистрация → оформление заказа → просмотр истории в личном кабинете. Сотрудники обрабатывают заявки в поддержку через админ-панель."
Add-P "Недостатки работы без сайта: нет единой базы заказов, сложно отслеживать обращения клиентов, отсутствует прозрачное сравнение товаров."

Add-H2 "1.2 Постановка задачи"
Add-P "Функциональные требования:"
Add-Bullet "регистрация и авторизация (email, пароль, роли user/admin);"
Add-Bullet "каталог товаров и комплектующих из MySQL;"
Add-Bullet "сравнение 2–3 процессоров в таблице;"
Add-Bullet "корзина и оформление заказа с записью в orders и order_items;"
Add-Bullet "личный кабинет: профиль, сумма покупок, список заказов;"
Add-Bullet "заявки в поддержку (аналог заявок на ремонт в дипломе общежития);"
Add-Bullet "страницы «Контакты» и «Доставка и гарантия»;"
Add-Bullet "админ-панель: пользователи, покупки, заявки."
Add-P "Нефункциональные требования: адаптивная вёрстка, защита от SQL-инъекций (prepared statements), хеширование паролей, валидация форм."

Add-H2 "1.3 Выбор средств разработки"
Add-P "Клиент: HTML5, CSS3 (переменные, Grid/Flexbox), JavaScript ES6."
Add-P "Сервер: PHP 7.4+, mysqli, JSON REST API."
Add-P "СУБД: MySQL (MariaDB), управление через phpMyAdmin."
Add-P "Среда: Open Server Panel (Apache, PHP, MySQL). Редактор: Visual Studio Code / Cursor."

Add-Title "2. СПЕЦИАЛЬНАЯ ЧАСТЬ"
Add-H2 "2.1 Проектирование БД и структуры сайта"
Add-P "База данных gametech содержит таблицы:"
Add-Bullet "components — каталог комплектующих (поле data, JSON);"
Add-Bullet "users — учётные записи;"
Add-Bullet "orders, order_items — заказы и позиции;"
Add-Bullet "support_requests — заявки в поддержку."
Add-P "Публичные страницы: index.html, pcs.html, components.html, configurator.html, compare-cpus.html, contacts.html, delivery.html, login.html."
Add-P "Для авторизованных: account.html, cart.html, support.html. Администрирование: admin.html."

Add-H2 "2.2 Разработка клиентской части"
Add-P "Единый файл стилей css/styles.css. Главная страница — hero-блок, категории товаров, быстрые ссылки. Страница components.html загружает данные через js/db.js и api/components.php, реализовано сравнение CPU. Личный кабинет account.html запрашивает api/user_profile.php и отображает сумму потраченных средств и состав заказов."

Add-H2 "2.3 Разработка серверной части"
Add-P "api/bootstrap.php — подключение к MySQL. api/register_user.php — регистрация. api/place_order.php — сохранение заказа. api/user_profile.php — профиль и история. api/support_requests.php — заявки поддержки. api/users_with_orders.php — сводка для админки. Установка демо-данных: api/install_users_orders.php."

Add-H2 "2.4 Тестирование"
Add-P "Проверены сценарии: регистрация (запись в users); оформление заказа (orders); сравнение процессоров; отправка заявки в support_requests; отображение данных в личном кабинете и админ-панели."

Add-Title "3. ЭКОНОМИЧЕСКАЯ ЧАСТЬ"
Add-P "Разработка собственного сайта на PHP и MySQL экономически оправдана по сравнению с платными CMS и лицензиями: отсутствуют ежегодные платежи за плагины, хостинг на Open Server бесплатен для учебного проекта. Трудозатраты студента учтены в рамках учебного плана."

Add-Title "4. БЕЗОПАСНОСТЬ И ЭКОЛОГИЧНОСТЬ"
Add-P "При работе за ПК соблюдаются режим труда, освещение, эргономика. Эксплуатация ПК не сопровождается вредными выбросами; основной ресурс — электроэнергия. Оргтехника утилизируется через специализированные службы."

Add-Title "ЗАКЛЮЧЕНИЕ"
Add-P "В дипломном проекте разработан веб-сайт интернет-магазина GameTech. Реализованы регистрация, каталог на MySQL, сравнение процессоров, корзина, оформление заказов, личный кабинет, модуль поддержки и админ-панель. Поставленные задачи выполнены, продукт готов к демонстрации на защите."

Add-Title "СПИСОК ИСПОЛЬЗУЕМЫХ ИСТОЧНИКОВ"
Add-P "1. ГОСТ 7.32-2017. Отчёт о научно-исследовательской работе."
Add-P "2. PHP: документация https://www.php.net/"
Add-P "3. MySQL Reference Manual."
Add-P "4. MDN Web Docs — HTML, CSS, JavaScript."
Add-P "5. Open Server Panel — документация."

Add-Title "ПРИЛОЖЕНИЕ А"
Add-P "Структура файлов проекта GameTech (папка GameTach на сервере Open Server)."

Add-Title "ПРИЛОЖЕНИЕ Б"
Add-P "Скриншоты: главная страница, каталог, сравнение CPU, личный кабинет, phpMyAdmin (таблицы users, orders), админ-панель."

if (Test-Path $outPath) { Remove-Item $outPath -Force }
$doc.SaveAs2($outPath)
$doc.Close($false)
$word.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
Write-Host "Saved: $outPath"
