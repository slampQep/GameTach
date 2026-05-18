(function () {
  const BASE_STORAGE_KEY = "cart_items_v1";
  const LEGACY_KEY = "cart_items_v1";
  const MIGRATION_MARK_KEY = "cart_migrated_v2";
  const ORDER_HISTORY_PREFIX = "order_history_v1";

  function getOrderHistoryKey() {
    const email = getCurrentUserEmail();
    return email ? ORDER_HISTORY_PREFIX + "__" + email : ORDER_HISTORY_PREFIX + "__guest";
  }

  function mapItemsToOrderLines(items) {
    return items.map(function (it) {
      const price = Number(it.price || 0);
      const qty = Number(it.qty || 1);
      return {
        title: it.title || "Товар",
        subtitle: it.subtitle || "",
        type: it.type || "item",
        price: price,
        qty: qty,
        lineTotal: price * qty,
        source: it.source || ""
      };
    });
  }

  function appendOrderSnapshot(items, serverOrder) {
    if (!Array.isArray(items) || items.length === 0) return;
    const total = serverOrder && serverOrder.total != null ? Number(serverOrder.total) : getCartTotal(items);
    const order = {
      id: (serverOrder && serverOrder.id) || "ord_" + Date.now(),
      createdAt: (serverOrder && serverOrder.createdAt) || new Date().toISOString(),
      total: total,
      items: (serverOrder && serverOrder.items) || mapItemsToOrderLines(items)
    };
    const key = getOrderHistoryKey();
    const raw = localStorage.getItem(key);
    var list = safeParse(raw || "[]", []);
    if (!Array.isArray(list)) {
      list = [];
    }
    list.unshift(order);
    while (list.length > 100) list.pop();
    try {
      localStorage.setItem(key, JSON.stringify(list));
    } catch (e) {
      throw e;
    }
    try {
      window.dispatchEvent(new CustomEvent("gametech-cart-changed", { detail: { area: "orders" } }));
    } catch (err) {}
  }

  function saveOrderToDatabase(items) {
    const email = getCurrentUserEmail();
    if (!email || !items.length) {
      return Promise.resolve(null);
    }
    return fetch("api/place_order.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email,
        items: mapItemsToOrderLines(items)
      })
    })
      .then(function (r) {
        return r.json().then(function (data) {
          return { ok: r.ok, data: data };
        });
      })
      .catch(function () {
        return { ok: false, data: null };
      });
  }

  function finalizeCheckoutFromCartPage() {
    const checkoutBtn = document.getElementById("checkoutBtn");
    const snapshot = readItems();
    if (!snapshot.length) {
      alert("Корзина пуста.");
      return;
    }
    if (checkoutBtn) checkoutBtn.disabled = true;

    saveOrderToDatabase(snapshot).then(function (result) {
      var serverOrder = result && result.ok && result.data && result.data.order ? result.data.order : null;
      try {
        appendOrderSnapshot(snapshot, serverOrder);
      } catch (err) {
        console.error(err);
        alert(
          "Не удалось сохранить заказ. Откройте сайт по http://gametach/ (не file://), войдите в аккаунт и попробуйте снова."
        );
        if (checkoutBtn) checkoutBtn.disabled = false;
        return;
      }
      try {
        clear();
      } catch (e2) {
        console.error(e2);
      }
      try {
        sessionStorage.setItem("gametech_order_saved", "1");
      } catch (e3) {}
      window.location.href = "account.html";
    });
  }

  function safeParse(json, fallback) {
    try {
      return JSON.parse(json);
    } catch (error) {
      return fallback;
    }
  }

  function getCurrentUserEmail() {
    const currentUser = safeParse(localStorage.getItem("currentUser") || "null", null);
    const email = currentUser && currentUser.email ? String(currentUser.email).trim().toLowerCase() : "";
    return email;
  }

  function getScopedStorageKey() {
    const email = getCurrentUserEmail();
    if (!email) return BASE_STORAGE_KEY + "__guest";
    return BASE_STORAGE_KEY + "__" + email;
  }

  function ensureLegacyMigration() {
    const markValue = localStorage.getItem(MIGRATION_MARK_KEY);
    if (markValue === "1") return;

    const legacyItems = safeParse(localStorage.getItem(LEGACY_KEY) || "[]", []);
    if (Array.isArray(legacyItems) && legacyItems.length > 0) {
      const scopedKey = getScopedStorageKey();
      const scopedItems = safeParse(localStorage.getItem(scopedKey) || "[]", []);
      if (!Array.isArray(scopedItems) || scopedItems.length === 0) {
        localStorage.setItem(scopedKey, JSON.stringify(legacyItems));
      }
    }
    localStorage.setItem(MIGRATION_MARK_KEY, "1");
  }

  function readItems() {
    const raw = localStorage.getItem(getScopedStorageKey());
    const parsed = safeParse(raw || "[]", []);
    return Array.isArray(parsed) ? parsed : [];
  }

  function writeItems(items) {
    localStorage.setItem(getScopedStorageKey(), JSON.stringify(items));
    try {
      window.dispatchEvent(
        new CustomEvent("gametech-cart-changed", { detail: { key: getScopedStorageKey() } })
      );
    } catch (err) {}
  }

  function formatPrice(value) {
    return Number(value || 0).toLocaleString("ru-RU") + " ₽";
  }

  function getCartCount(items) {
    return items.reduce((sum, item) => sum + Number(item.qty || 1), 0);
  }

  function getCartTotal(items) {
    return items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 1), 0);
  }

  function notify(message) {
    const notification = document.getElementById("notification");
    if (!notification) {
      return;
    }
    notification.textContent = message;
    notification.style.display = "block";
    notification.style.animation = "slideIn 0.3s ease-out";
    setTimeout(function () {
      notification.style.animation = "slideOut 0.3s ease-out";
      setTimeout(function () {
        notification.style.display = "none";
      }, 260);
    }, 1500);
  }

  function findExisting(items, incoming) {
    return items.findIndex(
      (item) => item.type === incoming.type && item.title === incoming.title && item.price === incoming.price
    );
  }

  function addItem(payload) {
    const items = readItems();
    const entry = {
      id: payload.id || Date.now(),
      type: payload.type || "item",
      title: payload.title || "Товар",
      subtitle: payload.subtitle || "",
      price: Number(payload.price || 0),
      qty: Number(payload.qty || 1),
      source: payload.source || window.location.pathname.split("/").pop(),
      createdAt: new Date().toISOString()
    };

    const index = findExisting(items, entry);
    if (index >= 0) {
      items[index].qty = Number(items[index].qty || 1) + entry.qty;
    } else {
      items.push(entry);
    }
    writeItems(items);
    updateHeaderCart();
    notify("Добавлено в корзину");
    openDrawer();
  }

  function removeItemById(id) {
    const items = readItems().filter((item) => String(item.id) !== String(id));
    writeItems(items);
    updateHeaderCart();
  }

  function clear() {
    writeItems([]);
    updateHeaderCart();
  }

  function updateQty(id, qty) {
    const items = readItems();
    const idx = items.findIndex((item) => String(item.id) === String(id));
    if (idx < 0) return;
    const normalized = Math.max(1, Number(qty || 1));
    items[idx].qty = normalized;
    writeItems(items);
    updateHeaderCart();
  }

  function updateHeaderCart() {
    const items = readItems();
    const total = getCartTotal(items);
    const count = getCartCount(items);
    const headerButtons = document.querySelectorAll(".btn-cart");
    const labelText = "🛒 Корзина " + formatPrice(total) + " ";

    headerButtons.forEach((btn) => {
      const badge = btn.querySelector(".cart-badge");
      let textNode = null;
      for (let i = 0; i < btn.childNodes.length; i++) {
        if (btn.childNodes[i].nodeType === Node.TEXT_NODE) {
          textNode = btn.childNodes[i];
          break;
        }
      }
      if (textNode) {
        textNode.textContent = labelText;
      } else if (badge) {
        btn.insertBefore(document.createTextNode(labelText), badge);
      } else {
        btn.textContent = labelText;
      }
      if (badge) badge.textContent = String(count);
    });
    renderCartDrawer();
  }

  function priceFromText(text) {
    const value = String(text || "").replace(/[^\d]/g, "");
    return Number(value || 0);
  }

  function extractBuildPayload(button) {
    const card = button.closest(".build-card");
    if (!card) return null;
    const title = card.querySelector(".build-title")?.textContent?.trim() || "Игровой ПК";
    const subtitle = card.querySelector(".build-subtitle")?.textContent?.trim() || "";
    const priceText = card.querySelector(".current-price")?.textContent || "0";
    return {
      type: "pc",
      title: title,
      subtitle: subtitle,
      price: priceFromText(priceText),
      qty: 1
    };
  }

  function bindAddToCartButtons() {
    const buttons = Array.from(document.querySelectorAll("button"))
      .filter((button) => button.textContent && button.textContent.trim() === "В корзину");

    buttons.forEach((button, index) => {
      if (button.dataset.cartBound === "1") return;
      button.dataset.cartBound = "1";
      button.dataset.cartBtnIndex = String(index);
      button.addEventListener("click", function () {
        const payload = extractBuildPayload(button);
        if (payload) {
          addItem(payload);
        }
      });
    });
  }

  function ensureDrawer() {
    if (document.getElementById("cartDrawerOverlay")) return;
    const drawer = document.createElement("div");
    drawer.innerHTML = `
      <div id="cartDrawerOverlay" class="cart-drawer-overlay"></div>
      <aside id="cartDrawer" class="cart-drawer">
        <div class="cart-drawer-head">
          <h3>Корзина</h3>
          <button id="closeCartDrawerBtn" class="btn btn-secondary">Закрыть</button>
        </div>
        <div id="cartDrawerItems" class="cart-drawer-items"></div>
        <div class="cart-drawer-footer">
          <div class="summary-item">
            <span>Итого</span>
            <strong id="cartDrawerTotal">0 ₽</strong>
          </div>
          <div class="build-actions">
            <button id="goCartPageBtn" class="btn btn-primary" style="flex:2;">Открыть корзину</button>
            <button id="clearDrawerCartBtn" class="btn btn-secondary" style="flex:1;">Очистить</button>
          </div>
        </div>
      </aside>
    `;
    document.body.appendChild(drawer);

    const overlay = document.getElementById("cartDrawerOverlay");
    const closeBtn = document.getElementById("closeCartDrawerBtn");
    const openPageBtn = document.getElementById("goCartPageBtn");
    const clearBtn = document.getElementById("clearDrawerCartBtn");

    overlay.addEventListener("click", closeDrawer);
    closeBtn.addEventListener("click", closeDrawer);
    openPageBtn.addEventListener("click", function () {
      window.location.href = "cart.html";
    });
    clearBtn.addEventListener("click", function () {
      clear();
      renderCartDrawer();
    });
  }

  function openDrawer() {
    const overlay = document.getElementById("cartDrawerOverlay");
    const drawer = document.getElementById("cartDrawer");
    if (!overlay || !drawer) return;
    overlay.classList.add("open");
    drawer.classList.add("open");
    renderCartDrawer();
  }

  function closeDrawer() {
    const overlay = document.getElementById("cartDrawerOverlay");
    const drawer = document.getElementById("cartDrawer");
    if (!overlay || !drawer) return;
    overlay.classList.remove("open");
    drawer.classList.remove("open");
  }

  function renderCartDrawer() {
    const root = document.getElementById("cartDrawerItems");
    const totalEl = document.getElementById("cartDrawerTotal");
    if (!root || !totalEl) return;

    const items = readItems();
    totalEl.textContent = formatPrice(getCartTotal(items));
    root.innerHTML = "";

    if (!items.length) {
      root.innerHTML = `<p style="color: var(--text-secondary);">Корзина пуста.</p>`;
      return;
    }

    items.forEach((item) => {
      const row = document.createElement("div");
      row.className = "cart-drawer-row";
      row.innerHTML = `
        <div>
          <strong>${item.title}</strong>
          <small>${item.qty} × ${formatPrice(item.price)}</small>
        </div>
        <button class="btn config-remove-btn" data-drawer-remove="${item.id}">✕</button>
      `;
      root.appendChild(row);
    });

    root.querySelectorAll("[data-drawer-remove]").forEach((btn) => {
      btn.addEventListener("click", function () {
        removeItemById(btn.dataset.drawerRemove);
        renderCartDrawer();
      });
    });
  }

  function bindHeaderNavigation() {
    document.querySelectorAll(".btn-cart").forEach((btn) => {
      if (btn.dataset.cartNavBound === "1") return;
      btn.dataset.cartNavBound = "1";
      btn.addEventListener("click", openDrawer);
    });
  }

  function renderCartPage() {
    const cartRoot = document.getElementById("cartItems");
    if (!cartRoot) return;

    const items = readItems();
    const totalEl = document.getElementById("cartGrandTotal");
    const countEl = document.getElementById("cartItemsCount");
    const emptyEl = document.getElementById("cartEmpty");

    cartRoot.innerHTML = "";
    countEl.textContent = String(getCartCount(items));
    totalEl.textContent = formatPrice(getCartTotal(items));
    emptyEl.style.display = items.length ? "none" : "block";

    items.forEach((item) => {
      const row = document.createElement("article");
      row.className = "cart-item";
      row.innerHTML = `
        <div class="cart-item-main">
          <h3>${item.title}</h3>
          <p>${item.subtitle || "Без дополнительного описания"}</p>
          <small>Тип: ${item.type}</small>
        </div>
        <div class="cart-item-controls">
          <label>Кол-во</label>
          <input type="number" min="1" value="${item.qty}" data-cart-qty="${item.id}" />
        </div>
        <div class="cart-item-price">${formatPrice(Number(item.price || 0) * Number(item.qty || 1))}</div>
        <button class="btn config-remove-btn" data-cart-remove="${item.id}">Удалить</button>
      `;
      cartRoot.appendChild(row);
    });

    cartRoot.querySelectorAll("[data-cart-remove]").forEach((btn) => {
      btn.addEventListener("click", function () {
        removeItemById(btn.dataset.cartRemove);
        renderCartPage();
      });
    });

    cartRoot.querySelectorAll("[data-cart-qty]").forEach((input) => {
      input.addEventListener("change", function () {
        updateQty(input.dataset.cartQty, input.value);
        renderCartPage();
      });
    });

    const clearBtn = document.getElementById("clearCartBtn");
    const checkoutBtn = document.getElementById("checkoutBtn");
    if (clearBtn) {
      clearBtn.onclick = function () {
        clear();
        renderCartPage();
      };
    }
    if (checkoutBtn) {
      checkoutBtn.onclick = function () {
        finalizeCheckoutFromCartPage();
      };
    }
  }

  function addBuild(buildPayload) {
    addItem({
      type: "build",
      title: "Сборка ПК",
      subtitle: "Конфигуратор: " + Object.keys(buildPayload.items || {}).length + " позиций",
      price: Number(buildPayload.totalPrice || 0),
      qty: 1
    });
  }

  window.GameTechCart = {
    addItem: addItem,
    addBuild: addBuild,
    readItems: readItems,
    clear: clear,
    updateHeaderCart: updateHeaderCart,
    finalizeCheckout: finalizeCheckoutFromCartPage,
    getCartTotal: function () {
      return getCartTotal(readItems());
    },
    getCartCount: function () {
      return getCartCount(readItems());
    }
  };

  document.addEventListener("DOMContentLoaded", function () {
    ensureLegacyMigration();
    ensureDrawer();
    bindHeaderNavigation();
    bindAddToCartButtons();
    updateHeaderCart();
    renderCartPage();
  });
})();
