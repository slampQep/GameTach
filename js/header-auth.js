(function () {
  function safeUser() {
    try {
      return JSON.parse(localStorage.getItem("currentUser") || "null");
    } catch (e) {
      return null;
    }
  }

  function displayName(u) {
    if (!u) return "Пользователь";
    if (u.name) return String(u.name);
    if (u.email) return String(u.email).split("@")[0];
    return "Пользователь";
  }

  function onPath(part) {
    return (window.location.pathname || "").indexOf(part) !== -1;
  }

  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s != null ? String(s) : "";
    return d.innerHTML;
  }

  function headerLogout(ev) {
    if (ev) ev.preventDefault();
    var u = safeUser();
    try {
      if (u && typeof addLoginHistory === "function") {
        addLoginHistory(u.email, "Выход из системы");
      }
    } catch (e) {}
    localStorage.removeItem("currentUser");
    try {
      window.dispatchEvent(new CustomEvent("gametech-auth-changed"));
    } catch (e) {}
    if (onPath("account.html")) {
      window.location.href = "login.html";
    } else {
      mountHeaderAuth();
    }
  }

  function mountHeaderAuth() {
    var el = document.getElementById("headerAuthNav");
    if (!el) return;

    var u = safeUser();
    var accountActive = onPath("account.html");

    if (u && u.loggedIn) {
      if (accountActive) {
        el.className = "header-auth-slot header-auth-logged";
        el.innerHTML =
          '<a class="nav-link active" href="account.html" title="' +
          esc(u.email || "") +
          '">Личный кабинет</a>';
        return;
      }

      var name = displayName(u);
      el.className = "header-auth-slot header-auth-logged";
      el.innerHTML =
        '<a class="nav-link" href="account.html" title="Личный кабинет — ' +
        esc(u.email || "") +
        '">Кабинет</a>' +
        '<span class="nav-user-name" title="' +
        esc(u.email || "") +
        '">' +
        esc(name) +
        "</span>" +
        '<a class="nav-link header-logout-link" href="#">Выйти</a>';
      var lo = el.querySelector(".header-logout-link");
      if (lo) {
        lo.addEventListener("click", headerLogout);
      }
    } else {
      el.className = "header-auth-slot";
      var loginActive = onPath("login.html");
      var lc = loginActive ? " active" : "";
      el.innerHTML = '<a class="nav-link' + lc + '" href="login.html">Войти</a>';
    }
  }

  document.addEventListener("DOMContentLoaded", mountHeaderAuth);
  window.addEventListener("storage", function (e) {
    if (e.key === "currentUser") mountHeaderAuth();
  });
  window.addEventListener("gametech-auth-changed", mountHeaderAuth);

  window.mountHeaderAuth = mountHeaderAuth;
})();
