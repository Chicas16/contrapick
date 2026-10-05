/**
 * Pruebas del motor (Node). Carga data.js (browser global) + rules.js.
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const dataCode = fs.readFileSync(path.join(__dirname, "data.js"), "utf8");
const ctx = { window: {}, console };
vm.createContext(ctx);
vm.runInContext(dataCode, ctx);
const data = ctx.window.WR_DATA;
const rules = require("./rules.js");

function printRec(title, rec) {
  console.log("\n=== " + title + " ===");
  console.log("Campeón:", rec.myChampion, "| Rol:", rec.role);
  console.log("Enemigos:", rec.enemies.join(", "));
  console.log(rec.summary);
  console.log("BOTAS:", rec.boots.item.name, "—", rec.boots.reason);
  console.log("NÚCLEO:");
  rec.core.forEach((c) => console.log(" -", c.item.name, "—", c.reason));
  console.log("SITUACIONALES:");
  rec.situational.forEach((s) => console.log(" -", s.item.name, "—", s.reason));
}

// Ejemplo 1: muchos healers + AP (Soraka, Yuumi, Vladimir, Lux, Amumu) vs ADC Jinx
const ex1 = rules.recommend(data, {
  role: "adc",
  myChampion: "Jinx",
  enemies: ["Soraka", "Yuumi", "Vladimir", "Lux", "Amumu"]
});
printRec("Ejemplo 1 — ADC Jinx vs curación/AP", ex1);

// Ejemplo 2: muchos tanques AD (Malphite, Ornn→neutro, Sion→neutro, Leona, Dr. Mundo) 
// Usar solo tagged: Malphite, Leona, Dr. Mundo, Braum, Alistar
const ex2 = rules.recommend(data, {
  role: "mid",
  myChampion: "Ahri",
  enemies: ["Malphite", "Leona", "Dr. Mundo", "Braum", "Alistar"]
});
printRec("Ejemplo 2 — Mid Ahri vs tanques/CC", ex2);

// Ejemplo 3: asesinos AD + AD heavy (Zed, Kha'Zix, Talon→neutro, Pyke, Jhin) 
const ex3 = rules.recommend(data, {
  role: "baron",
  myChampion: "Garen",
  enemies: ["Zed", "Kha'Zix", "Pyke", "Jhin", "Draven"]
});
printRec("Ejemplo 3 — Barón Garen vs asesinos/AD", ex3);

console.log("\nOK — campeones:", data.champions.length, "| con traits:", Object.keys(data.traits).length);
