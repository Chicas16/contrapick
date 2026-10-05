(function () {
  const data = window.WR_DATA;
  const champs = window.WR_CHAMPS || {};
  const rules = window.WR_RULES;

  const $ = (sel) => document.querySelector(sel);
  const grid = $("#grid");
  const gridEmpty = $("#grid-empty");
  const search = $("#search");
  const filters = $("#filters");
  const rolesBox = $("#roles");
  const pickerTarget = $("#picker-target");
  const btnClearSlot = $("#btn-clear-slot");
  const results = $("#results");
  const errBox = $("#error");
  const slotEls = Array.from(document.querySelectorAll(".slot"));

  const state = { me: "", role: "", enemies: ["", "", "", "", ""], active: "me", filter: "" };

  const esc = (s) => String(s).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  const SMALL = new Set(["de", "del", "la", "las", "el", "los", "y", "of", "the"]);
  const initials = (name) => name.replace(/[^A-Za-zÀ-ÿ ]/g, "").split(/\s+/)
    .filter((w) => w && !SMALL.has(w.toLowerCase())).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
  const ROLE_NAME = Object.fromEntries(data.roles.map((r) => [r.id, r.label]));

  /** Imagen con respaldo de iniciales si falta o falla la carga. */
  function imgHTML(src, name, cls, size) {
    const fb = `<span class="fallback ${cls}" aria-hidden="true">${esc(initials(name))}</span>`;
    if (!src) return fb;
    return `<img class="${cls}" src="${esc(src)}" alt="" width="${size}" height="${size}" loading="lazy" decoding="async" data-fb="${esc(initials(name))}" />`;
  }
  // Reemplaza imágenes rotas por iniciales (captura en fase de captura: los eventos error no burbujean)
  document.addEventListener("error", (ev) => {
    const el = ev.target;
    if (el.tagName === "IMG" && el.dataset.fb !== undefined) {
      const span = document.createElement("span");
      span.className = "fallback " + el.className;
      span.setAttribute("aria-hidden", "true");
      span.textContent = el.dataset.fb;
      el.replaceWith(span);
    }
  }, true);

  const champImg = (name, cls, size) => imgHTML(champs[name] && champs[name].img, name, cls, size);
  const itemImg = (item, cls, size) => imgHTML(item.icon, item.name, cls, size);

  /* ---------- Rol ---------- */
  data.roles.forEach((r) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "role-btn";
    b.dataset.role = r.id;
    b.setAttribute("role", "radio");
    b.textContent = r.label;
    b.addEventListener("click", () => { state.role = r.id; renderRoles(); syncHash(); });
    rolesBox.appendChild(b);
  });
  function renderRoles() {
    const suggested = (champs[state.me] && champs[state.me].roles) || [];
    rolesBox.querySelectorAll(".role-btn").forEach((b) => {
      const on = b.dataset.role === state.role;
      b.classList.toggle("on", on);
      b.setAttribute("aria-checked", on ? "true" : "false");
      b.classList.toggle("suggested", suggested.includes(b.dataset.role));
    });
  }

  /* ---------- Filtros por clase (WR Wiki) ---------- */
  const CLASSES = ["", "Tanque", "Luchador", "Asesino", "Mago", "Tirador", "Soporte"];
  CLASSES.forEach((c) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip";
    b.dataset.c = c;
    b.textContent = c || "Todos";
    b.addEventListener("click", () => { state.filter = c; renderGrid(); });
    filters.appendChild(b);
  });

  /* ---------- Rejilla de campeones ---------- */
  const norm = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/gi, "").toLowerCase();
  grid.innerHTML = data.champions.map((name) =>
    `<button type="button" class="pick" role="option" data-name="${esc(name)}" data-q="${esc(norm(name))}" title="${esc(name)}">
      ${champImg(name, "pick-img", 56)}<span class="pick-name">${esc(name)}</span>
    </button>`).join("");
  const pickEls = Array.from(grid.querySelectorAll(".pick"));

  function renderGrid() {
    const q = norm(search.value || "");
    let shown = 0;
    const taken = new Set(state.active === "me" ? [] : state.enemies.filter((e, i) => e && String(i) !== String(state.active)));
    const current = state.active === "me" ? state.me : state.enemies[state.active];
    pickEls.forEach((el) => {
      const name = el.dataset.name;
      const c = champs[name];
      const okQ = !q || el.dataset.q.includes(q);
      const okC = !state.filter || (c && c.clase.includes(state.filter));
      const vis = okQ && okC;
      el.hidden = !vis;
      if (vis) shown += 1;
      el.disabled = taken.has(name);
      el.classList.toggle("selected", name === current);
      el.setAttribute("aria-selected", name === current ? "true" : "false");
    });
    gridEmpty.hidden = shown > 0;
    filters.querySelectorAll(".chip").forEach((b) => b.classList.toggle("on", b.dataset.c === state.filter));
  }

  /* ---------- Slots ---------- */
  function slotValue(key) { return key === "me" ? state.me : state.enemies[Number(key)]; }

  function renderSlots() {
    slotEls.forEach((el) => {
      const key = el.dataset.slot;
      const name = slotValue(key);
      const isMe = key === "me";
      el.classList.toggle("active", String(state.active) === key);
      el.classList.toggle("filled", !!name);
      if (name) {
        const c = champs[name];
        el.innerHTML = `${champImg(name, "slot-img", isMe ? 80 : 56)}
          <span class="slot-name">${esc(name)}</span>
          ${c ? `<span class="dmg dmg-${esc(c.dmg)}">${esc(c.dmg)}</span>` : ""}`;
      } else {
        el.innerHTML = `<span class="slot-empty">+</span><span class="slot-name muted">${isMe ? "Tu campeón" : "Rival " + (Number(key) + 1)}</span>`;
      }
    });
    const label = state.active === "me" ? "Elige tu campeón" : `Elige al enemigo ${Number(state.active) + 1}`;
    pickerTarget.textContent = label;
    btnClearSlot.hidden = !slotValue(String(state.active));
  }

  function setActive(key) {
    state.active = key;
    renderSlots();
    renderGrid();
  }

  function nextEmpty() {
    if (!state.me) return "me";
    const i = state.enemies.findIndex((e) => !e);
    return i === -1 ? null : String(i);
  }

  slotEls.forEach((el) => el.addEventListener("click", () => {
    setActive(el.dataset.slot);
    search.focus({ preventScroll: true });
  }));

  btnClearSlot.addEventListener("click", () => {
    if (state.active === "me") state.me = "";
    else state.enemies[Number(state.active)] = "";
    renderSlots(); renderGrid(); renderRoles(); syncHash();
  });

  grid.addEventListener("click", (ev) => {
    const el = ev.target.closest(".pick");
    if (!el || el.disabled) return;
    const name = el.dataset.name;
    if (state.active === "me") {
      state.me = name;
      const c = champs[name];
      // Sugerir rol según la WR Wiki si aún no hay rol o el actual no es típico
      if (c && c.roles.length && (!state.role || !c.roles.includes(state.role))) state.role = c.roles[0];
    } else {
      state.enemies[Number(state.active)] = name;
    }
    search.value = "";
    const nxt = nextEmpty();
    if (nxt !== null) state.active = nxt;
    renderSlots(); renderGrid(); renderRoles(); syncHash();
    showError("");
  });

  search.addEventListener("input", renderGrid);
  search.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") {
      const first = pickEls.find((el) => !el.hidden && !el.disabled);
      if (first) first.click();
    }
  });

  /* ---------- URL compartible (#c=…&r=…&e=…) ---------- */
  function syncHash() {
    const p = new URLSearchParams();
    if (state.me) p.set("c", state.me);
    if (state.role) p.set("r", state.role);
    if (state.enemies.some(Boolean)) p.set("e", state.enemies.join(","));
    const h = p.toString();
    history.replaceState(null, "", h ? "#" + h : location.pathname + location.search);
  }
  function loadHash() {
    const p = new URLSearchParams(location.hash.slice(1));
    const ok = (n) => data.champions.includes(n);
    if (ok(p.get("c"))) state.me = p.get("c");
    if (ROLE_NAME[p.get("r")]) state.role = p.get("r");
    (p.get("e") || "").split(",").slice(0, 5).forEach((n, i) => { if (ok(n) && !state.enemies.includes(n)) state.enemies[i] = n; });
    const nxt = nextEmpty();
    state.active = nxt === null ? "me" : nxt;
  }

  function showError(msg) {
    errBox.textContent = msg;
    errBox.hidden = !msg;
  }

  /* ---------- Resultado ---------- */
  function traitBadges(name) {
    const c = champs[name];
    if (!c) return `<span class="tbadge">sin datos</span>`;
    return [`<span class="dmg dmg-${esc(c.dmg)}">${esc(c.dmg)}</span>`]
      .concat(c.traits.map((t) => `<span class="tbadge">${esc(t)}</span>`)).join("");
  }

  function itemRow(entry, kind, n) {
    const kindLabel = { boots: "Botas", core: "Núcleo", sit: "Situacional" }[kind];
    return `<li class="item-row item-${kind}">
      <div class="item-icon-wrap">${itemImg(entry.item, "item-img", 52)}${n ? `<span class="order">${n}</span>` : ""}</div>
      <div class="item-body">
        <div class="item-head"><span class="item-name">${esc(entry.item.name)}</span><span class="kind kind-${kind}">${kindLabel}</span></div>
        <div class="item-tag">${esc(entry.item.tag || "")}</div>
        <p class="item-reason">${esc(entry.reason)}</p>
      </div>
    </li>`;
  }

  function render(rec) {
    const kindOf = (e) => (e === rec.boots ? "boots" : rec.core.includes(e) ? "core" : "sit");
    const orderSet = new Set(rec.order);
    const extras = rec.situational.filter((s) => !orderSet.has(s));
    results.hidden = false;
    results.innerHTML = `
      <div class="res-head">
        ${champImg(rec.myChampion, "res-champ", 64)}
        <div>
          <div class="res-title">${esc(rec.myChampion)} · ${esc(ROLE_NAME[rec.role] || rec.role)}</div>
          <div class="res-sub">Build de ${esc(rec.styleLabel)}</div>
        </div>
      </div>

      <div class="buildbar" aria-label="Build en orden de compra">
        ${rec.order.map((e, i) => `<div class="bb-slot bb-${kindOf(e)}" title="${esc(e.item.name)}">
            ${itemImg(e.item, "bb-img", 48)}<span class="order">${i + 1}</span></div>`).join("")}
      </div>

      <div class="summary">${esc(rec.summary)}</div>
      <div class="enemy-read">
        ${rec.enemies.map((n) => `<div class="er">${champImg(n, "er-img", 36)}<div><div class="er-name">${esc(n)}</div><div class="er-tags">${traitBadges(n)}</div></div></div>`).join("")}
      </div>

      <h2 class="sec">Orden de compra</h2>
      <ol class="item-list">${rec.order.map((e, i) => itemRow(e, kindOf(e), i + 1)).join("")}</ol>

      ${extras.length ? `<h2 class="sec">Otras opciones situacionales</h2>
      <ul class="item-list">${extras.map((e) => itemRow(e, "sit", 0)).join("")}</ul>` : ""}

      <p class="hint">Conteo aproximado del enemigo: AP ${rules.fmt(rec.traitCounts.AP)}, AD ${rules.fmt(rec.traitCounts.AD)},
        tanque ${rec.traitCounts.tanque}, curación ${rec.traitCounts.curacion}, control ${rec.traitCounts.control},
        asesino ${rec.traitCounts.asesino}, escudo ${rec.traitCounts.escudo}. Los campeones mixtos cuentan 0,5 AP + 0,5 AD.</p>
    `;
    results.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  $("#btn-build").addEventListener("click", () => {
    showError("");
    if (!state.me || !state.role || state.enemies.some((e) => !e)) {
      showError("Elige tu campeón, tu rol y los 5 campeones enemigos.");
      const nxt = nextEmpty();
      if (nxt !== null) setActive(nxt);
      return;
    }
    try {
      render(rules.recommend(data, champs, { role: state.role, myChampion: state.me, enemies: state.enemies.slice() }));
    } catch (e) {
      showError(e.message || "Error al generar el build.");
    }
  });

  $("#btn-reset").addEventListener("click", () => {
    state.me = ""; state.role = ""; state.enemies = ["", "", "", "", ""]; state.active = "me"; state.filter = "";
    search.value = ""; results.hidden = true; showError("");
    renderSlots(); renderGrid(); renderRoles(); syncHash();
  });

  loadHash();
  renderSlots(); renderGrid(); renderRoles();
  if (state.me && state.role && state.enemies.every(Boolean)) $("#btn-build").click();
})();
