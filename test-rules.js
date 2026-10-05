/**
 * Pruebas del motor (Node): node test-rules.js
 * Carga data.js + champions.js (globals de navegador) y rules.js.
 */
const fs = require("fs");
const path = require("path");
const assert = require("assert");

require("./data.js");
const champs = require("./champions.js");
const data = globalThis.WR_DATA;
const rules = require("./rules.js");

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log("✓", name);
}

function printRec(title, rec) {
  console.log("\n=== " + title + " ===");
  console.log("Campeón:", rec.myChampion, "| Rol:", rec.role, "| Estilo:", rec.styleLabel);
  console.log("Enemigos:", rec.enemies.map((n) => `${n} [${champs[n].dmg}${champs[n].traits.length ? ", " + champs[n].traits.join(", ") : ""}]`).join("; "));
  console.log(rec.summary);
  console.log("ORDEN DE COMPRA:");
  rec.order.forEach((e, i) => console.log(` ${i + 1}. ${e.item.name} — ${e.reason}`));
  const extra = rec.situational.filter((s) => !rec.order.includes(s));
  if (extra.length) console.log("OTRAS SITUACIONALES:", extra.map((s) => s.item.name).join(", "));
  console.log("RUNAS:");
  console.log(` Clave: ${rec.runes.keystone.rune.name} — ${rec.runes.keystone.reason}`);
  rec.runes.minors.forEach((m) => console.log(` Menor: ${m.rune.name} — ${m.reason}`));
  console.log("HECHIZOS:");
  rec.spells.forEach((s) => console.log(` ${s.spell.name} — ${s.reason}`));
}

const names = (rec) => [rec.boots, ...rec.core, ...rec.situational].map((e) => e.item.name);

// ---------- Cobertura de datos ----------
test("141 campeones en la lista y todos con datos en champions.js", () => {
  assert.strictEqual(data.champions.length, 141);
  data.champions.forEach((n) => assert.ok(champs[n], "sin datos: " + n));
  assert.strictEqual(Object.keys(champs).length, 141);
});

test("todos tienen tipo de daño AP/AD/mixto y traits válidos", () => {
  const ok = new Set(["tanque", "curación", "control", "asesino", "escudo"]);
  data.champions.forEach((n) => {
    assert.ok(["AP", "AD", "mixto"].includes(champs[n].dmg), n);
    champs[n].traits.forEach((t) => assert.ok(ok.has(t), n + ": " + t));
  });
});

test("todos los retratos e íconos referenciados existen en assets/", () => {
  data.champions.forEach((n) => assert.ok(fs.existsSync(path.join(__dirname, champs[n].img)), "falta " + champs[n].img));
  const walk = (o) => {
    if (o && o.icon) assert.ok(fs.existsSync(path.join(__dirname, o.icon)), "falta " + o.icon);
    else if (o && typeof o === "object") Object.values(o).forEach(walk);
  };
  walk(data.items);
  walk(data.runes);
  walk(data.spells);
});

const allRuneNames = new Set([
  ...Object.values(data.runes.keystones).map((r) => r.name),
  ...Object.values(data.runes.minors).map((r) => r.name)
]);
const allSpellNames = new Set(Object.values(data.spells).map((s) => s.name));

test("cada build tiene 1 clave + 3 menores + 2 hechizos distintos, nombres en data", () => {
  data.champions.forEach((me) => data.roles.forEach((r) => {
    const en = data.champions.filter((n) => n !== me).slice(0, 5);
    const rec = rules.recommend(data, champs, { role: r.id, myChampion: me, enemies: en });
    assert.ok(rec.runes && rec.runes.keystone && rec.runes.minors, "sin runas " + me);
    assert.strictEqual(rec.runes.minors.length, 3, "menores " + me + " " + r.id);
    assert.ok(allRuneNames.has(rec.runes.keystone.rune.name), "clave desconocida " + rec.runes.keystone.rune.name);
    const rn = [rec.runes.keystone.rune.name, ...rec.runes.minors.map((m) => m.rune.name)];
    assert.strictEqual(new Set(rn).size, 4, "runas repetidas " + me + " " + r.id);
    rec.runes.minors.forEach((m) => assert.ok(allRuneNames.has(m.rune.name), "menor " + m.rune.name));
    assert.strictEqual(rec.spells.length, 2, "hechizos " + me + " " + r.id);
    assert.notStrictEqual(rec.spells[0].spell.name, rec.spells[1].spell.name);
    rec.spells.forEach((s) => assert.ok(allSpellNames.has(s.spell.name), "hechizo " + s.spell.name));
  }));
});

test("jungla siempre lleva Castigo", () => {
  data.champions.forEach((me) => {
    const en = data.champions.filter((n) => n !== me).slice(0, 5);
    const rec = rules.recommend(data, champs, { role: "jungle", myChampion: me, enemies: en });
    assert.ok(rec.spells.some((s) => s.spell.name === "Castigo"), "sin Castigo: " + me);
  });
});

test("ningún enemigo cuenta como neutro", () => {
  const c = rules.countTraits(champs, ["Ornn", "Sion", "Cho'Gath", "Maokai", "K'Sante"]);
  assert.strictEqual(c.neutral, 0);
  assert.strictEqual(c.tagged, 5);
});

test("mixto suma 0.5 AP + 0.5 AD", () => {
  const c = rules.countTraits(champs, ["Kai'Sa", "Kayle", "Ahri", "Zed", "Garen"]);
  assert.strictEqual(c.AP, 2);
  assert.strictEqual(c.AD, 3);
});

// ---------- Ejemplos (incluyen campeones que antes eran neutros) ----------
const ex1 = rules.recommend(data, champs, {
  role: "mid", myChampion: "Ahri",
  enemies: ["Ornn", "Sion", "Cho'Gath", "Maokai", "K'Sante"] // antes: 5 neutros
});
test("Mid Ahri vs 5 tanques (antes neutros) → pen. mágica / Liandry + Mercurio", () => {
  assert.ok(ex1.traitCounts.tanque >= 4);
  assert.strictEqual(ex1.boots.item.name, "Botas de Mercurio");
  assert.ok(names(ex1).includes("Báculo del Vacío"));
  assert.ok(names(ex1).includes("Tormento de Liandry"));
});

const ex2 = rules.recommend(data, champs, {
  role: "adc", myChampion: "Jinx",
  enemies: ["Fiddlesticks", "Swain", "Volibear", "Olaf", "Milio"] // antes: 5 neutros
});
test("ADC Jinx vs sustain (Fiddlesticks/Swain/Volibear/Olaf/Milio) → anti-curación", () => {
  assert.ok(ex2.traitCounts.curacion >= 4);
  assert.ok(names(ex2).includes("Recordatorio Mortal"));
  assert.strictEqual(ex2.style, "crit");
});

const ex3 = rules.recommend(data, champs, {
  role: "baron", myChampion: "Malphite",
  enemies: ["Talon", "Rengar", "Nocturne", "Kindred", "Kalista"] // 4 de 5 antes neutros
});
test("Barón Malphite (tanque) vs AD/asesinos → Punteras + Randuin, sin pen.", () => {
  assert.strictEqual(ex3.style, "tanque");
  assert.strictEqual(ex3.boots.item.name, "Punteras de Acero");
  assert.ok(names(ex3).includes("Presagio de Randuin"));
  assert.ok(!names(ex3).includes("Recuerdos de Lord Dominik"));
});

const ex4 = rules.recommend(data, champs, {
  role: "jungle", myChampion: "Evelynn",
  enemies: ["Kennen", "Taliyah", "Vex", "Lillia", "Karma"] // antes: 5 neutros
});
test("Jungla Evelynn (AP) vs magos → núcleo AP, botas por AP", () => {
  assert.strictEqual(ex4.style, "AP");
  assert.ok(ex4.traitCounts.AP >= 4);
  assert.strictEqual(ex4.core[0].item.name, "Maldición del Liche");
  assert.strictEqual(ex4.boots.item.name, "Botas de Mercurio");
});

const ex5 = rules.recommend(data, champs, {
  role: "support", myChampion: "Lulu",
  enemies: ["Zed", "Kha'Zix", "Pyke", "Jhin", "Draven"]
});
test("Soporte Lulu (encantadora) vs asesinos AD → núcleo encantador", () => {
  assert.strictEqual(ex5.style, "encantador");
  assert.strictEqual(ex5.core[0].item.name, "Eco armónico");
  assert.strictEqual(ex5.boots.item.name, "Punteras de Acero");
});

test("validaciones: 5 enemigos distintos", () => {
  assert.throws(() => rules.recommend(data, champs, { role: "mid", myChampion: "Ahri", enemies: ["Zed", "Zed", "Ahri", "Lux", "Jinx"] }));
  assert.throws(() => rules.recommend(data, champs, { role: "mid", myChampion: "Ahri", enemies: ["Zed"] }));
});

test("cualquier campeón en cualquier rol da build de 6 ítems sin repetir", () => {
  data.champions.forEach((me) => data.roles.forEach((r) => {
    const en = data.champions.filter((n) => n !== me).slice(0, 5);
    const rec = rules.recommend(data, champs, { role: r.id, myChampion: me, enemies: en });
    assert.strictEqual(rec.order.length, 6, me + " " + r.id);
    assert.strictEqual(new Set(names(rec)).size, names(rec).length, "repetido " + me + " " + r.id);
  }));
});

printRec("Ejemplo 1 — Mid Ahri vs tanques (antes neutros)", ex1);
printRec("Ejemplo 2 — ADC Jinx vs curación (antes neutros)", ex2);
printRec("Ejemplo 3 — Barón Malphite vs asesinos AD", ex3);
printRec("Ejemplo 4 — Jungla Evelynn vs magos", ex4);
printRec("Ejemplo 5 — Soporte Lulu vs asesinos AD", ex5);

const imgs = data.champions.filter((n) => fs.existsSync(path.join(__dirname, champs[n].img))).length;
console.log(`\nOK — ${passed} pruebas | campeones: ${data.champions.length} | con traits/tipo de daño: ${Object.keys(champs).length} | con retrato: ${imgs}`);
