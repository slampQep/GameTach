(function () {
  function formatRub(n) {
    return Number(n || 0).toLocaleString("ru-RU") + " ₽";
  }

  function esc(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  window.loadUsersFromDb = function () {
    var root = document.getElementById("adminContent");
    if (!root) return;
    root.innerHTML = '<div class="admin-card"><p>Загрузка пользователей из MySQL…</p></div>';

    fetch("api/users_with_orders.php")
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        if (!data || !data.ok) throw new Error("fail");
        var rows = (data.users || [])
          .map(function (u, i) {
            return (
              "<tr><td>" +
              (i + 1) +
              "</td><td>" +
              esc(u.name) +
              "</td><td>" +
              esc(u.email) +
              "</td><td>" +
              esc(u.role || "user") +
              "</td><td>" +
              (u.ordersCount || 0) +
              "</td><td>" +
              formatRub(u.totalSpent) +
              "</td><td>" +
              (u.registeredAt ? new Date(u.registeredAt).toLocaleString("ru-RU") : "—") +
              "</td></tr>"
            );
          })
          .join("");
        if (!rows) rows = '<tr><td colspan="7">Нет пользователей в БД</td></tr>';
        root.innerHTML =
          '<div class="admin-card"><h2>👥 Пользователи и покупки</h2>' +
          '<p style="color:#b0b0b0;">Данные из таблиц users и orders.</p>' +
          '<table style="width:100%;margin-top:12px;border-collapse:collapse;font-size:14px;">' +
          "<thead><tr><th>#</th><th>Имя</th><th>Email</th><th>Роль</th><th>Заказов</th><th>Потрачено</th><th>Регистрация</th></tr></thead>" +
          "<tbody>" +
          rows +
          "</tbody></table></div>";
      })
      .catch(function () {
        root.innerHTML =
          '<div class="admin-card"><p>Не удалось загрузить БД. Откройте <a href="api/install_users_orders.php">install_users_orders.php</a></p></div>';
      });
  };

  window.loadUsersPurchases = function () {
    var root = document.getElementById("adminContent");
    if (!root) return;
    root.innerHTML = '<div class="admin-card"><p>Загрузка…</p></div>';

    fetch("api/users_with_orders.php")
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        if (!data || !data.ok) throw new Error("fail");
        var html = '<div class="admin-card"><h2>🛒 Покупки по клиентам</h2>';
        (data.users || []).forEach(function (u) {
          html +=
            '<div style="border:1px solid #333;border-radius:8px;padding:14px;margin:12px 0;">' +
            "<strong>" +
            esc(u.name) +
            "</strong> &lt;" +
            esc(u.email) +
            "&gt;" +
            "<p>Заказов: " +
            (u.ordersCount || 0) +
            " · Потрачено: " +
            formatRub(u.totalSpent) +
            '</p><button type="button" class="admin-btn" data-email="' +
            esc(u.email) +
            '">Показать заказы</button><div class="detail" style="margin-top:10px;font-size:13px;"></div></div>';
        });
        html += "</div>";
        root.innerHTML = html;
        root.querySelectorAll("button[data-email]").forEach(function (btn) {
          btn.addEventListener("click", function () {
            var email = btn.getAttribute("data-email");
            var box = btn.parentElement.querySelector(".detail");
            box.textContent = "Загрузка…";
            fetch("api/user_profile.php?email=" + encodeURIComponent(email))
              .then(function (r) {
                return r.json();
              })
              .then(function (prof) {
                if (!prof || !prof.ok || !prof.orders || !prof.orders.length) {
                  box.innerHTML = "<p style='color:#888;'>Покупок нет.</p>";
                  return;
                }
                var s = "<ul>";
                prof.orders.forEach(function (o) {
                  s += "<li><strong>" + formatRub(o.total) + "</strong> — " + new Date(o.createdAt).toLocaleString("ru-RU") + "<ul>";
                  (o.items || []).forEach(function (it) {
                    s += "<li>" + esc(it.title) + " × " + it.qty + "</li>";
                  });
                  s += "</ul></li>";
                });
                box.innerHTML = s + "</ul>";
              });
          });
        });
      })
      .catch(function () {
        root.innerHTML = '<div class="admin-card"><p>Ошибка загрузки.</p></div>';
      });
  };
  window.loadSupportRequests = function () {
    var root = document.getElementById("adminContent");
    if (!root) return;
    root.innerHTML = '<div class="admin-card"><p>Загрузка заявок…</p></div>';
    fetch("api/support_requests.php?all=1")
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        if (!data || !data.ok) throw new Error("fail");
        var statusRu = { new: "Новая", in_progress: "В работе", done: "Готово", cancelled: "Отмена" };
        var rows = (data.requests || [])
          .map(function (req) {
            return (
              "<tr><td>" +
              req.id +
              "</td><td>" +
              esc(req.name) +
              "<br><small>" +
              esc(req.email) +
              "</small></td><td>" +
              esc(req.category) +
              "</td><td>" +
              esc(req.description).substring(0, 80) +
              "…</td><td>" +
              (statusRu[req.status] || req.status) +
              '</td><td><select data-id="' +
              req.id +
              '" class="support-status-sel"><option value="new">Новая</option><option value="in_progress">В работе</option><option value="done">Готово</option><option value="cancelled">Отмена</option></select></td></tr>'
            );
          })
          .join("");
        root.innerHTML =
          '<div class="admin-card"><h2>Заявки в поддержку</h2><table style="width:100%;font-size:13px;border-collapse:collapse;"><thead><tr><th>№</th><th>Клиент</th><th>Тип</th><th>Текст</th><th>Статус</th><th>Изменить</th></tr></thead><tbody>' +
          (rows || "<tr><td colspan='6'>Нет заявок</td></tr>") +
          "</tbody></table></div>";
        root.querySelectorAll(".support-status-sel").forEach(function (sel) {
          var id = sel.getAttribute("data-id");
          var row = (data.requests || []).find(function (r) {
            return String(r.id) === String(id);
          });
          if (row) sel.value = row.status;
          sel.addEventListener("change", function () {
            fetch("api/support_request_status.php", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: Number(id), status: sel.value })
            });
          });
        });
      })
      .catch(function () {
        root.innerHTML =
          '<div class="admin-card"><p>Таблица support_requests не найдена. Выполните database/support_requests.sql</p></div>';
      });
  };
})();
