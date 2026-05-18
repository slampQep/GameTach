// components.js - каталог комплектующих и выбор процессоров для сравнения
document.addEventListener("DOMContentLoaded", async function () {
  const STORAGE_KEY = "gametech_cpu_compare_ids";

  const componentsCatalog = document.getElementById("componentsCatalog");
  const compareBtn = document.getElementById("compareBtn");
  const clearCompareBtn = document.getElementById("clearCompareBtn");
  const compareCount = document.getElementById("compareCount");

  const categories = [
    { key: "cpu", title: "Процессоры" },
    { key: "gpu", title: "Видеокарты" },
    { key: "motherboard", title: "Материнские платы" },
    { key: "storage", title: "SSD накопители" },
    { key: "case", title: "Корпуса" },
    { key: "ram", title: "Плашки памяти" }
  ];

  const selectedIds = new Set();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        arr.forEach((id) => {
          const n = Number(id);
          if (Number.isFinite(n)) selectedIds.add(n);
        });
      }
    }
  } catch (e) {
    console.warn(e);
  }

  function persistCompareSelection() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(selectedIds)));
  }

  function formatPrice(price) {
    return Number(price || 0).toLocaleString("ru-RU") + " ₽";
  }

  function normalizeComponentId(item) {
    const id = Number(item && item.id);
    return Number.isFinite(id) && id > 0 ? id : null;
  }

  function isCpuItem(item) {
    if (!item) return false;
    const cat = String(item.category || "").toLowerCase();
    if (cat === "cpu") return true;
    return typeof item.cores === "number" && typeof item.socket === "string";
  }

  function updateCompareState() {
    if (compareCount) compareCount.textContent = "Выбрано процессоров: " + selectedIds.size;
    if (compareBtn) compareBtn.disabled = selectedIds.size < 2;
    persistCompareSelection();
  }

  function getComponentMeta(item) {
    if (item.category === "cpu") return `${item.socket} • ${item.cores}/${item.threads} • до ${item.boostClock} ГГц`;
    if (item.category === "gpu") return `${item.vram || "-"} • ${item.powerDraw || "-"} Вт`;
    if (item.category === "motherboard") return `${item.socket || "-"} • ${item.chipset || "-"} • ${item.memoryType || "-"}`;
    if (item.category === "storage") return `${item.storageType || "-"} • ${item.capacity || "-"} GB • до ${item.speedRead || "-"} МБ/с`;
    if (item.category === "case") return `${item.formFactor || "-"} • вентиляторов: ${item.fansIncluded || "-"}`;
    if (item.category === "ram") return `${item.memoryType || "-"} • ${item.capacity || "-"} GB • ${item.speed || "-"} МГц`;
    return "";
  }

  function getComponentDetails(item) {
    if (item.category === "cpu") {
      return `
        <div><span>Базовая частота</span><strong>${item.baseClock} ГГц</strong></div>
        <div><span>TDP</span><strong>${item.tdp} Вт</strong></div>
        <div><span>Встроенная графика</span><strong>${item.integratedGraphics}</strong></div>
      `;
    }
    if (item.category === "gpu") {
      return `
        <div><span>Видеопамять</span><strong>${item.vram || "-"}</strong></div>
        <div><span>Потребление</span><strong>${item.powerDraw || "-"} Вт</strong></div>
        <div><span>Баллы</span><strong>${item.score || "-"}</strong></div>
      `;
    }
    if (item.category === "motherboard") {
      return `
        <div><span>Сокет</span><strong>${item.socket || "-"}</strong></div>
        <div><span>Чипсет</span><strong>${item.chipset || "-"}</strong></div>
        <div><span>Память</span><strong>${item.memoryType || "-"}</strong></div>
      `;
    }
    if (item.category === "storage") {
      return `
        <div><span>Тип</span><strong>${item.storageType || "-"}</strong></div>
        <div><span>Объем</span><strong>${item.capacity || "-"} GB</strong></div>
        <div><span>Скорость чтения</span><strong>${item.speedRead || "-"} МБ/с</strong></div>
      `;
    }
    if (item.category === "case") {
      return `
        <div><span>Форм-фактор</span><strong>${item.formFactor || "-"}</strong></div>
        <div><span>Вентиляторов</span><strong>${item.fansIncluded || "-"}</strong></div>
        <div><span>Рейтинг</span><strong>${item.rating || "-"}</strong></div>
      `;
    }
    if (item.category === "ram") {
      return `
        <div><span>Тип</span><strong>${item.memoryType || "-"}</strong></div>
        <div><span>Объем</span><strong>${item.capacity || "-"} GB</strong></div>
        <div><span>Частота</span><strong>${item.speed || "-"} МГц</strong></div>
      `;
    }
    return "";
  }

  function createComponentCard(item) {
    const componentId = normalizeComponentId(item);
    const isCpu = isCpuItem(item);
    const scoreValue = item.score || item.rating || "-";
    const scoreLabel = item.score ? "баллов" : "рейтинг";
    const card = document.createElement("article");
    card.className = "component-db-card";
    card.innerHTML = `
      <div class="component-score">${scoreValue}<span>${scoreLabel}</span></div>
      <h3>${item.brand} ${item.model}</h3>
      <p class="component-meta">${getComponentMeta(item)}</p>
      <div class="component-details">
        ${getComponentDetails(item)}
      </div>
      <div class="component-bottom">
        <strong class="component-price">${formatPrice(item.price)}</strong>
        ${
          isCpu && componentId
            ? `<button type="button" class="btn btn-secondary compare-toggle-btn" data-id="${componentId}">Сравнить</button>`
            : `<a class="btn btn-secondary" href="configurator.html">В конфигуратор</a>`
        }
      </div>
    `;

    if (isCpu && componentId) {
      const compareToggleBtn = card.querySelector(".compare-toggle-btn");
      if (!compareToggleBtn) return card;
      const id = componentId;
      if (selectedIds.has(id)) {
        compareToggleBtn.textContent = "Выбрано";
        compareToggleBtn.classList.add("btn-primary");
      }
      compareToggleBtn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        const btnId = Number(this.dataset.id);

        if (selectedIds.has(btnId)) {
          selectedIds.delete(btnId);
          this.textContent = "Сравнить";
          this.classList.remove("btn-primary");
        } else {
          if (selectedIds.size >= 3) {
            alert("Можно сравнивать максимум 3 процессора.");
            return;
          }
          selectedIds.add(btnId);
          this.textContent = "Выбрано";
          this.classList.add("btn-primary");
        }

        updateCompareState();
      });
    }

    return card;
  }

  if (!window.gametechDB) {
    if (componentsCatalog) {
      componentsCatalog.innerHTML = "<p>Модуль базы комплектующих не загружен (db.js).</p>";
    }
    return;
  }

  try {
    await window.gametechDB.seedIfEmpty();
    if (componentsCatalog) componentsCatalog.innerHTML = "";

    for (const category of categories) {
      const items = await window.gametechDB.getComponentsByCategory(category.key);
      const section = document.createElement("section");
      section.className = "components-category-section";
      section.innerHTML = `
        <h2 class="components-category-title">${category.title}</h2>
        <div class="components-db-grid"></div>
      `;
      const grid = section.querySelector(".components-db-grid");
      items.forEach((item) => {
        grid.appendChild(createComponentCard(item));
      });
      if (componentsCatalog) componentsCatalog.appendChild(section);
    }
  } catch (error) {
    if (componentsCatalog) {
      componentsCatalog.innerHTML = "<p>Ошибка загрузки базы данных комплектующих.</p>";
    }
    console.error(error);
  }

  if (compareBtn) {
    compareBtn.addEventListener("click", function (e) {
      e.preventDefault();
      if (selectedIds.size < 2) {
        alert("Выберите минимум два процессора для сравнения (кнопка «Сравнить» на карточках CPU).");
        return;
      }
      persistCompareSelection();
      const idList = Array.from(selectedIds).join(",");
      window.location.href = "compare-cpus.html?ids=" + encodeURIComponent(idList);
    });
  }

  if (clearCompareBtn) {
    clearCompareBtn.addEventListener("click", function () {
      selectedIds.clear();
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {
        console.warn(e);
      }
      document.querySelectorAll(".compare-toggle-btn").forEach((btn) => {
        btn.textContent = "Сравнить";
        btn.classList.remove("btn-primary");
      });
      updateCompareState();
    });
  }

  updateCompareState();
});
