// compare-cpus.js — сравнение процессоров на отдельной странице
(function () {
  const STORAGE_KEY = "gametech_cpu_compare_ids";

  function parseIdsFromUrl() {
    const raw = new URLSearchParams(window.location.search).get("ids");
    if (!raw) return null;
    const ids = raw
      .split(",")
      .map((s) => Number(String(s).trim()))
      .filter((n) => Number.isFinite(n) && n > 0);
    return ids.length >= 2 ? ids : null;
  }

  function readIdsFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return null;
      const ids = arr.map((x) => Number(x)).filter((n) => Number.isFinite(n) && n > 0);
      return ids.length >= 2 ? ids : null;
    } catch {
      return null;
    }
  }

  function createRow(label, values) {
    const tr = document.createElement("tr");
    const title = document.createElement("td");
    title.textContent = label;
    tr.appendChild(title);
    values.forEach((value) => {
      const td = document.createElement("td");
      td.textContent = String(value);
      tr.appendChild(td);
    });
    return tr;
  }

  function createScoredRow(label, items, valueGetter, options) {
    const tr = document.createElement("tr");
    const title = document.createElement("td");
    title.textContent = label;
    tr.appendChild(title);

    const values = items.map((item) => valueGetter(item));
    const numericValues = values.map((v) => Number(v));
    const isNumeric = numericValues.every((v) => Number.isFinite(v));

    let best = null;
    let worst = null;
    if (isNumeric && numericValues.length > 0) {
      if (options.preferHigher) {
        best = Math.max(...numericValues);
        worst = Math.min(...numericValues);
      } else {
        best = Math.min(...numericValues);
        worst = Math.max(...numericValues);
      }
    }

    values.forEach((rawValue, index) => {
      const td = document.createElement("td");
      td.textContent = String(rawValue) + (options.suffix || "");

      if (isNumeric && best !== null && worst !== null) {
        const value = numericValues[index];
        if (value === best && best !== worst) {
          td.classList.add("value-better");
        } else if (value === worst && best !== worst) {
          td.classList.add("value-worse");
        } else {
          td.classList.add("value-neutral");
        }
      }

      tr.appendChild(td);
    });

    return tr;
  }

  function orderItemsByIds(ids, items) {
    const map = new Map(
      items.map(function (item) {
        return [Number(item.id), item];
      })
    );
    return ids.map(function (id) {
      return map.get(Number(id));
    }).filter(Boolean);
  }

  function renderTable(compareHeadRow, compareBody, items) {
    compareHeadRow.innerHTML = "<th>Критерий</th>";
    compareBody.innerHTML = "";

    items.forEach((item) => {
      const th = document.createElement("th");
      th.textContent = item.brand + " " + item.model;
      compareHeadRow.appendChild(th);
    });

    compareBody.appendChild(createRow("Сокет", items.map((i) => i.socket)));
    compareBody.appendChild(createScoredRow("Ядра", items, (i) => i.cores, { preferHigher: true }));
    compareBody.appendChild(createScoredRow("Потоки", items, (i) => i.threads, { preferHigher: true }));
    compareBody.appendChild(createScoredRow("Базовая частота", items, (i) => i.baseClock, { preferHigher: true, suffix: " ГГц" }));
    compareBody.appendChild(createScoredRow("Boost частота", items, (i) => i.boostClock, { preferHigher: true, suffix: " ГГц" }));
    compareBody.appendChild(createScoredRow("TDP", items, (i) => i.tdp, { preferHigher: false, suffix: " Вт" }));
    compareBody.appendChild(createRow("Встроенная графика", items.map((i) => i.integratedGraphics)));
    compareBody.appendChild(createScoredRow("Баллы производительности", items, (i) => i.score, { preferHigher: true }));
    compareBody.appendChild(createScoredRow("Рейтинг", items, (i) => i.rating, { preferHigher: true }));
    compareBody.appendChild(createScoredRow("Отзывы", items, (i) => i.reviews, { preferHigher: true }));
    compareBody.appendChild(createScoredRow("Цена", items, (i) => i.price, { preferHigher: false, suffix: " ₽" }));
  }

  document.addEventListener("DOMContentLoaded", async function () {
    const compareHeadRow = document.getElementById("compareHeadRow");
    const compareBody = document.getElementById("compareBody");
    const compareEmpty = document.getElementById("compareEmpty");
    const compareTableWrapper = document.getElementById("compareTableWrapper");

    if (!compareHeadRow || !compareBody || !compareEmpty || !compareTableWrapper) return;

    let ids = parseIdsFromUrl();
    if (!ids) ids = readIdsFromStorage();
    else {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
      } catch (e) {
        console.warn(e);
      }
    }

    if (!ids || ids.length < 2) {
      compareEmpty.textContent =
        "Недостаточно процессоров для сравнения. Выберите минимум два варианта на странице «Комплектующие» и нажмите «Сравнить», либо откройте ссылку с параметром ids.";
      compareEmpty.style.display = "block";
      compareTableWrapper.style.display = "none";
      return;
    }

    if (!window.gametechDB) {
      compareEmpty.textContent = "Не загружен модуль db.js.";
      compareEmpty.style.display = "block";
      return;
    }

    try {
      await window.gametechDB.seedIfEmpty();
      const items = await window.gametechDB.getComponentsByIds(ids);
      const cpus = items.filter(function (i) {
        if (!i) return false;
        if (i.category === "cpu") return true;
        return typeof i.cores === "number" && typeof i.socket === "string";
      });
      const ordered = orderItemsByIds(ids, cpus);

      if (ordered.length < 2) {
        compareEmpty.textContent =
          "Не удалось загрузить минимум два процессора. Вернитесь в каталог и выберите позиции заново.";
        compareEmpty.style.display = "block";
        compareTableWrapper.style.display = "none";
        return;
      }

      compareEmpty.style.display = "none";
      compareTableWrapper.style.display = "block";
      renderTable(compareHeadRow, compareBody, ordered);
    } catch (err) {
      console.error(err);
      compareEmpty.textContent = "Ошибка при загрузке данных. Попробуйте обновить страницу.";
      compareEmpty.style.display = "block";
      compareTableWrapper.style.display = "none";
    }
  });
})();
