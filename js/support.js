(function () {
  function getUser() {
    try {
      return JSON.parse(localStorage.getItem("currentUser") || "null");
    } catch (e) {
      return null;
    }
  }

  function renderList(requests) {
    var root = document.getElementById("supportList");
    if (!root) return;
    if (!requests || !requests.length) {
      root.innerHTML = '<p class="orders-empty" style="padding:20px;">Заявок пока нет.</p>';
      return;
    }
    var statusRu = { new: "Новая", in_progress: "В работе", done: "Выполнена", cancelled: "Отменена" };
    var catRu = { order: "Заказ", build: "Сборка", payment: "Оплата", warranty: "Гарантия", other: "Другое" };
    var html = "";
    requests.forEach(function (r) {
      html += '<div class="order-card" style="margin-bottom:12px;">';
      html += "<strong>" + (catRu[r.category] || r.category) + "</strong> — ";
      html += statusRu[r.status] || r.status;
      html += "<p style='color:var(--text-secondary);margin:8px 0;'>" + (r.description || "") + "</p>";
      html += "<small>" + new Date(r.createdAt).toLocaleString("ru-RU") + "</small></div>";
    });
    root.innerHTML = html;
  }

  function loadList() {
    var u = getUser();
    var root = document.getElementById("supportList");
    if (!root) return;
    if (!u || !u.email) {
      root.innerHTML = '<p class="orders-empty">Войдите в аккаунт. <a href="login.html">Вход</a></p>';
      return;
    }
    fetch("api/support_requests.php?email=" + encodeURIComponent(u.email))
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        if (data && data.ok) renderList(data.requests);
      });
  }

  function errorMessage(data, status) {
    if (!data || !data.error) {
      if (status === 503) return "Не удалось подключиться к MySQL. Запустите Open Server.";
      return "Ошибка сервера (код " + status + ").";
    }
    var map = {
      validation_failed: "Заполните описание не короче 10 символов.",
      invalid_json: "Некорректные данные формы.",
      database_unavailable: "База данных недоступна. Проверьте MySQL в Open Server.",
      prepare_failed: "Ошибка SQL. Убедитесь, что таблица support_requests создана.",
      insert_failed: "Не удалось сохранить заявку. Проверьте таблицу support_requests в phpMyAdmin."
    };
    return map[data.error] || "Ошибка: " + data.error;
  }

  document.addEventListener("DOMContentLoaded", function () {
    var u = getUser();
    if (!u || !u.loggedIn) {
      window.location.href = "login.html";
      return;
    }

    var form = document.getElementById("supportForm");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var msg = document.getElementById("supportMsg");
        var desc = document.getElementById("supportDesc").value.trim();
        if (desc.length < 10) {
          alert("Опишите проблему подробнее — минимум 10 символов (сейчас " + desc.length + ").");
          return;
        }
        fetch("api/support_requests.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: u.email,
            name: u.name || u.email,
            phone: document.getElementById("supportPhone").value.trim(),
            category: document.getElementById("supportCategory").value,
            description: desc
          })
        })
          .then(function (r) {
            return r.json().then(function (data) {
              return { data: data, status: r.status };
            });
          })
          .then(function (res) {
            var data = res.data;
            if (data && data.ok) {
              if (msg) {
                msg.style.display = "block";
                msg.textContent = "Заявка отправлена. Номер: " + data.id;
              }
              document.getElementById("supportDesc").value = "";
              loadList();
            } else {
              alert(errorMessage(data, res.status));
            }
          })
          .catch(function () {
            alert("Нет ответа от api/support_requests.php. Откройте сайт через http://gametach/");
          });
      });
    }

    loadList();
  });
})();
