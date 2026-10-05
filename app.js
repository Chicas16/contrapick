(function () {
  const data = window.WR_DATA;
  const rules = window.WR_RULES;

  const $ = (sel) => document.querySelector(sel);
  const myChamp = $("#my-champion");
  const myRole = $("#my-role");
  const enemySelects = [1, 2, 3, 4, 5].map((i) => $(`#enemy-${i}`));
  const btn = $("#btn-build");
  const results = $("#results");
  const errBox = $("#error");

  function fillSelect(el, includeEmpty) {
    el.innerHTML = "";
    if (includeEmpty) {
      const o = document.createElement("option");
      o.value = "";
      o.textContent = "— Elegir —";
      el.appendChild(o);
    }
    data.champions.forEach((name) => {
      const o = document.createElement("option");
      o.value = name;
      o.textContent = name;
      el.appendChild(o);
    });
  }

  data.roles.forEach((r) => {
    const o = document.createElement("option");
    o.value = r.id;
    o.textContent = r.label;
    myRole.appendChild(o);
  });

  fillSelect(myChamp, true);
  enemySelects.forEach((el) => fillSelect(el, true));

  function showError(msg) {
    errBox.textContent = msg;
    errBox.hidden = !msg;
  }

  function itemCard(entry, kind) {
    return `<article class="item-card item-${kind}">
      <div class="item-name">${entry.item.name}</div>
      <div class="item-tag">${entry.item.tag || ""}</div>
      <p class="item-reason">${entry.reason}</p>
    </article>`;
  }

  function render(rec) {
    results.hidden = false;
    results.innerHTML = `
      <div class="summary">${rec.summary}</div>
      <section>
        <h2>Botas</h2>
        <div class="item-grid">${itemCard(rec.boots, "boots")}</div>
      </section>
      <section>
        <h2>Núcleo</h2>
        <div class="item-grid">${rec.core.map((c) => itemCard(c, "core")).join("")}</div>
      </section>
      <section>
        <h2>Situacionales</h2>
        <div class="item-grid">${rec.situational.map((s) => itemCard(s, "sit")).join("")}</div>
      </section>
      <p class="hint">Traits detectados (aprox.): AP ${rec.traitCounts.AP}, AD ${rec.traitCounts.AD},
        tanque ${rec.traitCounts.tanque}, curación ${rec.traitCounts.curacion},
        control ${rec.traitCounts.control}, asesino ${rec.traitCounts.asesino},
        escudo ${rec.traitCounts.escudo}. Neutros: ${rec.traitCounts.neutral}.</p>
    `;
    results.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  btn.addEventListener("click", () => {
    showError("");
    const enemies = enemySelects.map((el) => el.value);
    if (!myChamp.value || !myRole.value || enemies.some((e) => !e)) {
      showError("Elige tu campeón, rol y los 5 campeones enemigos.");
      return;
    }
    if (new Set(enemies).size !== 5) {
      showError("Los 5 enemigos deben ser campeones distintos.");
      return;
    }
    try {
      const rec = rules.recommend(data, {
        role: myRole.value,
        myChampion: myChamp.value,
        enemies
      });
      render(rec);
    } catch (e) {
      showError(e.message || "Error al generar el build.");
    }
  });
})();
