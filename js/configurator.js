document.addEventListener("DOMContentLoaded", async function () {
  const categories = [
    { key: "cpu", title: "Процессор", required: true },
    { key: "motherboard", title: "Материнская плата", required: true },
    { key: "gpu", title: "Видеокарта", required: true },
    { key: "ram", title: "Оперативная память", required: true },
    { key: "storage", title: "Накопитель", required: true },
    { key: "psu", title: "Блок питания", required: true },
    { key: "case", title: "Корпус", required: false },
    { key: "cooler", title: "Охлаждение процессора", required: false }
  ];

  const state = {
    selected: JSON.parse(localStorage.getItem("pc_build_v1") || "{}"),
    itemsByCategory: {}
  };

  const listContainer = document.getElementById("configuratorList");
  const totalPriceEl = document.getElementById("buildTotalPrice");
  const cartTotalPriceEl = document.getElementById("cartTotalPrice");
  const selectedCountEl = document.getElementById("selectedCount");
  const requiredCountEl = document.getElementById("requiredCount");
  const completionEl = document.getElementById("buildCompletion");
  const compatibilityListEl = document.getElementById("compatibilityList");
  const resetBtn = document.getElementById("resetBuildBtn");
  const goToCartBtn = document.getElementById("goToCartBtn");
  const headerCartBtn = document.querySelector(".btn-cart");

  const modal = document.getElementById("pickerModal");
  const modalTitle = document.getElementById("pickerTitle");
  const modalList = document.getElementById("pickerList");
  const closeModalBtn = document.getElementById("closePickerBtn");

  function saveState() {
    localStorage.setItem("pc_build_v1", JSON.stringify(state.selected));
  }

  function formatPrice(price) {
    return Number(price || 0).toLocaleString("ru-RU") + " ₽";
  }

  function getItemLabel(item) {
    return item.brand + " " + item.model;
  }

  function getItemMeta(item) {
    if (item.category === "cpu") return item.socket + " • " + item.cores + "/" + item.threads;
    if (item.category === "gpu") return (item.vram || "-") + " • " + (item.powerDraw || "-") + " Вт";
    if (item.category === "ram") return (item.capacity || "-") + " GB • " + (item.speed || "-") + " МГц";
    if (item.category === "storage") return (item.storageType || "-") + " • " + (item.capacity || "-") + " GB";
    if (item.category === "motherboard") return (item.socket || "-") + " • " + (item.memoryType || "-");
    if (item.category === "psu") return (item.wattage || "-") + " W • " + (item.efficiency || "-");
    if (item.category === "case") return (item.formFactor || "-") + " • вентиляторов: " + (item.fansIncluded || "-");
    if (item.category === "cooler") return (item.coolerType || "-") + " • TDP: " + (item.tdpSupport || "-");
    return "";
  }

  function calculateTotal() {
    let total = 0;
    categories.forEach((category) => {
      const item = state.selected[category.key];
      if (item) total += Number(item.price || 0);
    });
    return total;
  }

  function updateHeaderCart(totalPrice) {
    if (!headerCartBtn) return;
    const badge = headerCartBtn.querySelector(".cart-badge");
    headerCartBtn.childNodes[0].textContent = "🛒 Корзина " + formatPrice(totalPrice) + " ";
    if (badge) {
      const count = Object.keys(state.selected).length;
      badge.textContent = String(count);
    }
  }

  function calculateSummary() {
    let total = 0;
    let selectedCount = 0;
    let selectedRequired = 0;
    const requiredTotal = categories.filter((c) => c.required).length;

    categories.forEach((category) => {
      const item = state.selected[category.key];
      if (item) {
        selectedCount += 1;
        total += Number(item.price || 0);
        if (category.required) selectedRequired += 1;
      }
    });

    totalPriceEl.textContent = formatPrice(total);
    cartTotalPriceEl.textContent = formatPrice(total);
    selectedCountEl.textContent = String(selectedCount);
    requiredCountEl.textContent = String(selectedRequired) + "/" + String(requiredTotal);

    const completion = Math.round((selectedRequired / requiredTotal) * 100);
    completionEl.style.width = completion + "%";
    updateHeaderCart(total);
    renderCompatibility();
  }

  function addCompatibilityItem(items, type, text) {
    items.push({ type, text });
  }

  function renderCompatibility() {
    if (!compatibilityListEl) return;

    const messages = [];
    const cpu = state.selected.cpu;
    const motherboard = state.selected.motherboard;
    const gpu = state.selected.gpu;
    const psu = state.selected.psu;
    const ram = state.selected.ram;

    if (!cpu && !motherboard && !gpu && !psu && !ram) {
      addCompatibilityItem(messages, "ok", "Добавьте комплектующие для проверки совместимости.");
    }

    if (cpu && motherboard) {
      if (cpu.socket !== motherboard.socket) {
        addCompatibilityItem(
          messages,
          "error",
          "Сокет не совпадает: CPU " + cpu.socket + " и плата " + motherboard.socket + "."
        );
      } else {
        addCompatibilityItem(messages, "ok", "Сокет CPU и материнской платы совместим.");
      }
    } else {
      addCompatibilityItem(messages, "warn", "Для проверки сокета выберите CPU и материнскую плату.");
    }

    if (motherboard && ram) {
      if ((motherboard.memoryType || "") !== (ram.memoryType || "")) {
        addCompatibilityItem(
          messages,
          "error",
          "Тип памяти не совпадает: плата " +
            (motherboard.memoryType || "-") +
            ", RAM " +
            (ram.memoryType || "-") +
            "."
        );
      } else {
        addCompatibilityItem(messages, "ok", "ОЗУ подходит по типу памяти для выбранной платы.");
      }
    } else {
      addCompatibilityItem(messages, "warn", "Для проверки RAM выберите материнскую плату и память.");
    }

    if (psu && (cpu || gpu)) {
      const cpuPower = Number(cpu?.tdp || 0);
      const gpuPower = Number(gpu?.powerDraw || 0);
      const estimatedNeed = Math.round((cpuPower + gpuPower + 120) * 1.2);
      const psuWattage = Number(psu.wattage || 0);

      if (psuWattage < estimatedNeed) {
        addCompatibilityItem(
          messages,
          "error",
          "БП может быть слабым: нужно примерно " + estimatedNeed + "W, выбран " + psuWattage + "W."
        );
      } else if (psuWattage < estimatedNeed + 100) {
        addCompatibilityItem(
          messages,
          "warn",
          "БП подходит впритык: расчет " + estimatedNeed + "W, выбран " + psuWattage + "W."
        );
      } else {
        addCompatibilityItem(
          messages,
          "ok",
          "Мощности БП достаточно: расчет " + estimatedNeed + "W, выбран " + psuWattage + "W."
        );
      }
    } else {
      addCompatibilityItem(messages, "warn", "Для проверки БП выберите CPU, GPU и блок питания.");
    }

    compatibilityListEl.innerHTML = messages
      .map((item) => `<li class="compatibility-item ${item.type}">${item.text}</li>`)
      .join("");
  }

  function renderList() {
    listContainer.innerHTML = "";

    categories.forEach((category) => {
      const selected = state.selected[category.key];
      const row = document.createElement("article");
      row.className = "config-row";
      row.innerHTML = `
        <div class="config-row-left">
          <h3>${category.title}</h3>
          <p class="config-row-status">${category.required ? "Обязательно" : "Опционально"}</p>
        </div>
        <div class="config-row-center">
          ${
            selected
              ? `<div class="config-selected">
                  <strong>${getItemLabel(selected)}</strong>
                  <small>${getItemMeta(selected)}</small>
                </div>`
              : `<span class="config-empty">Не выбрано</span>`
          }
        </div>
        <div class="config-row-right">
          <button class="btn btn-secondary config-pick-btn" data-category="${category.key}">
            ${selected ? "Изменить" : "Добавить"}
          </button>
          ${
            selected
              ? `<button class="btn config-remove-btn" data-category="${category.key}">Удалить</button>`
              : ""
          }
        </div>
      `;
      listContainer.appendChild(row);
    });

    listContainer.querySelectorAll(".config-pick-btn").forEach((btn) => {
      btn.addEventListener("click", () => openPicker(btn.dataset.category));
    });

    listContainer.querySelectorAll(".config-remove-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        delete state.selected[btn.dataset.category];
        saveState();
        renderList();
        calculateSummary();
      });
    });
  }

  function openPicker(categoryKey) {
    const category = categories.find((c) => c.key === categoryKey);
    const items = state.itemsByCategory[categoryKey] || [];

    modalTitle.textContent = "Выбор: " + category.title;
    modalList.innerHTML = "";

    items.forEach((item) => {
      const card = document.createElement("div");
      card.className = "picker-item";
      card.innerHTML = `
        <div>
          <strong>${getItemLabel(item)}</strong>
          <p>${getItemMeta(item)}</p>
          <small>Рейтинг: ${item.rating || "-"} • Отзывов: ${item.reviews || "-"}</small>
        </div>
        <div class="picker-item-right">
          <strong>${formatPrice(item.price)}</strong>
          <button class="btn btn-primary" data-item-id="${item.id}">Выбрать</button>
        </div>
      `;
      modalList.appendChild(card);
    });

    modalList.querySelectorAll("button[data-item-id]").forEach((button) => {
      button.addEventListener("click", () => {
        const id = Number(button.dataset.itemId);
        const item = items.find((x) => x.id === id);
        state.selected[categoryKey] = item;
        saveState();
        renderList();
        calculateSummary();
        modal.style.display = "none";
      });
    });

    modal.style.display = "flex";
  }

  closeModalBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  modal.addEventListener("click", (event) => {
    if (event.target === modal) modal.style.display = "none";
  });

  resetBtn.addEventListener("click", () => {
    state.selected = {};
    saveState();
    renderList();
    calculateSummary();
  });

  goToCartBtn.addEventListener("click", () => {
    const total = calculateTotal();
    const payload = {
      type: "pc_build",
      createdAt: new Date().toISOString(),
      items: state.selected,
      totalPrice: total
    };
    if (window.GameTechCart && typeof window.GameTechCart.addBuild === "function") {
      window.GameTechCart.addBuild(payload);
      window.location.href = "cart.html";
      return;
    }
    localStorage.setItem("cart_build", JSON.stringify(payload));
    alert("Сборка добавлена в корзину. Сумма: " + formatPrice(total));
  });

  await window.gametechDB.seedIfEmpty();
  for (const category of categories) {
    state.itemsByCategory[category.key] = await window.gametechDB.getComponentsByCategory(category.key);
  }

  renderList();
  calculateSummary();
});
