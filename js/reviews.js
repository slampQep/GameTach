(function () {
  var STORAGE_KEY = "gametech_reviews_v1";

  function safeParse(json, fallback) {
    try {
      return JSON.parse(json);
    } catch (e) {
      return fallback;
    }
  }

  function readAll() {
    var raw = localStorage.getItem(STORAGE_KEY);
    var list = safeParse(raw || "[]", []);
    return Array.isArray(list) ? list : [];
  }

  function writeAll(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function genId() {
    return "rev_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);
  }

  function getCurrentUser() {
    return safeParse(localStorage.getItem("currentUser") || "null", null);
  }

  function findByUserProduct(list, email, productType, productId) {
    var e = String(email || "").toLowerCase();
    for (var i = 0; i < list.length; i++) {
      var r = list[i];
      if (
        String(r.authorEmail || "").toLowerCase() === e &&
        r.productType === productType &&
        r.productId === productId
      ) {
        return i;
      }
    }
    return -1;
  }

  function listForAdmin() {
    return readAll().slice().sort(function (a, b) {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  }

  function setStatus(id, status) {
    var list = readAll();
    for (var i = 0; i < list.length; i++) {
      if (String(list[i].id) === String(id)) {
        list[i].status = status;
        list[i].updatedAt = new Date().toISOString();
        writeAll(list);
        return true;
      }
    }
    return false;
  }

  function removeReview(id) {
    var list = readAll().filter(function (r) {
      return String(r.id) !== String(id);
    });
    writeAll(list);
  }

  function averageApproved(productType, productId) {
    var list = readAll();
    var sum = 0;
    var n = 0;
    for (var i = 0; i < list.length; i++) {
      var r = list[i];
      if (
        r.productType === productType &&
        r.productId === productId &&
        r.status === "approved"
      ) {
        sum += Number(r.rating || 0);
        n++;
      }
    }
    if (!n) return { avg: 0, count: 0 };
    return { avg: Math.round((sum / n) * 10) / 10, count: n };
  }

  function listVisibleForProduct(productType, productId) {
    var user = getCurrentUser();
    var email = user && user.email ? String(user.email).toLowerCase() : "";
    return readAll().filter(function (r) {
      if (r.productType !== productType || r.productId !== productId) return false;
      if (r.status === "approved") return true;
      if (r.status === "pending" && email && String(r.authorEmail || "").toLowerCase() === email)
        return true;
      return false;
    });
  }

  function submitReview(productType, productId, productTitle, rating, text) {
    var user = getCurrentUser();
    if (!user || !user.loggedIn || !user.email) {
      return { ok: false, message: "Войдите в аккаунт, чтобы оставить отзыв." };
    }
    var r = Math.max(1, Math.min(5, Number(rating || 0)));
    if (!r) return { ok: false, message: "Выберите оценку от 1 до 5." };
    var t = String(text || "").trim();
    if (t.length < 10) return { ok: false, message: "Текст отзыва — минимум 10 символов." };
    if (t.length > 2000) return { ok: false, message: "Максимум 2000 символов." };

    var list = readAll();
    var email = String(user.email).toLowerCase();
    var idx = findByUserProduct(list, email, productType, productId);
    var now = new Date().toISOString();
    var entry = {
      id: genId(),
      productType: productType,
      productId: productId,
      productTitle: productTitle || productId,
      authorEmail: email,
      authorName: user.name || email.split("@")[0],
      rating: r,
      text: t,
      status: "pending",
      createdAt: now,
      updatedAt: now
    };

    if (idx >= 0) {
      entry.id = list[idx].id;
      entry.createdAt = list[idx].createdAt || now;
      entry.status = "pending";
      list[idx] = entry;
    } else {
      list.push(entry);
    }
    writeAll(list);
    return { ok: true, message: "Отзыв отправлен на модерацию." };
  }

  function renderBlock(root) {
    if (!root) return;
    var productType = root.getAttribute("data-product-type") || "pc_build";
    var productId = root.getAttribute("data-product-id");
    var productTitle = root.getAttribute("data-product-title") || productId;
    if (!productId) return;

    var summaryEl = root.querySelector(".reviews-summary");
    var listEl = root.querySelector(".reviews-list");
    var formEl = root.querySelector(".review-form");
    var msgEl = root.querySelector(".review-form-message");
    var user = getCurrentUser();

    var stats = averageApproved(productType, productId);
    if (summaryEl) {
      summaryEl.innerHTML =
        stats.count > 0
          ? "★ " + stats.avg + " из 5 · " + stats.count + " " + (stats.count === 1 ? "отзыв" : "отзывов")
          : "Пока нет одобренных отзывов — будьте первым.";
    }

    if (listEl) {
      var visible = listVisibleForProduct(productType, productId);
      visible.sort(function (a, b) {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });
      listEl.innerHTML = "";
      if (!visible.length) {
        listEl.innerHTML =
          '<li class="review-item review-item-empty">Отзывов пока нет.</li>';
      } else {
        visible.forEach(function (r) {
          var li = document.createElement("li");
          li.className = "review-item";
          var badge =
            r.status === "pending"
              ? '<span class="review-badge review-badge-pending">на модерации</span>'
              : "";
          li.innerHTML =
            '<div class="review-item-head">' +
            "<strong>" +
            escapeHtml(r.authorName || r.authorEmail) +
            "</strong> " +
            starsHtml(r.rating) +
            " " +
            badge +
            "</div>" +
            '<div class="review-item-meta">' +
            new Date(r.createdAt || Date.now()).toLocaleString("ru-RU") +
            "</div>" +
            '<p class="review-item-text">' +
            escapeHtml(r.text) +
            "</p>";
          listEl.appendChild(li);
        });
      }
    }

    if (formEl) {
      if (!user || !user.loggedIn) {
        formEl.innerHTML =
          '<p class="review-login-hint"><a href="login.html">Войдите</a>, чтобы оставить отзыв.</p>';
      } else {
        formEl.innerHTML =
          '<div class="review-rating-row">' +
          '<span>Оценка:</span>' +
          '<label><input type="radio" name="rating-' +
          productId +
          '" value="5" checked> 5</label>' +
          '<label><input type="radio" name="rating-' +
          productId +
          '" value="4"> 4</label>' +
          '<label><input type="radio" name="rating-' +
          productId +
          '" value="3"> 3</label>' +
          '<label><input type="radio" name="rating-' +
          productId +
          '" value="2"> 2</label>' +
          '<label><input type="radio" name="rating-' +
          productId +
          '" value="1"> 1</label>' +
          "</div>" +
          '<textarea class="review-textarea" rows="3" maxlength="2000" placeholder="Расскажите о сборке (от 10 символов)"></textarea>' +
          '<button type="button" class="btn btn-primary review-submit-btn">Отправить отзыв</button>';
        var btn = formEl.querySelector(".review-submit-btn");
        var ta = formEl.querySelector(".review-textarea");
        btn.addEventListener("click", function () {
          var sel = formEl.querySelector('input[name="rating-' + productId + '"]:checked');
          var rating = sel ? sel.value : 5;
          var res = submitReview(productType, productId, productTitle, rating, ta.value);
          if (msgEl) {
            msgEl.textContent = res.message || "";
            msgEl.style.color = res.ok ? "#9cffcb" : "#ff9a9a";
          }
          if (res.ok) {
            ta.value = "";
            renderBlock(root);
          }
        });
      }
    }
  }

  function starsHtml(n) {
    var s = "";
    for (var i = 1; i <= 5; i++) {
      s += i <= n ? "★" : "☆";
    }
    return '<span class="review-stars">' + s + "</span>";
  }

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function initAll() {
    document.querySelectorAll(".reviews-block").forEach(function (root) {
      renderBlock(root);
    });
  }

  window.GameTechReviews = {
    readAll: readAll,
    listForAdmin: listForAdmin,
    setStatus: setStatus,
    removeReview: removeReview,
    averageApproved: averageApproved,
    renderBlock: renderBlock,
    initAll: initAll
  };

  document.addEventListener("DOMContentLoaded", initAll);
})();
