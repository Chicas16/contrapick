#!/usr/bin/env python3
"""
Genera champions.js (traits de los 141 campeones) a partir de:
  - WR Wiki: Module:ChampionDataWR/data (?action=raw) -> clase, subclase, tipo adaptativo,
    ratings (daño/dureza/utilidad), posiciones.
  - wildriftmeta.com/champions/<slug>/ -> builds finales por rol (se cuentan ítems con
    Poder de Habilidad vs Daño de Ataque vs solo defensa) para confirmar AP/AD/tanque.
  - Tablas curadas a mano (control / curación / escudo) más abajo.
Uso: python3 tools/build_champions.py tools/sources/wiki_champion_data.json tools/sources/wildriftmeta_builds.json tools/sources/asset_map.json
Los archivos de entrada se generan con los scrapers descritos en DATA_SOURCES.md.
"""
import json, re, sys

cdwr = json.load(open(sys.argv[1]))
wrm = json.load(open(sys.argv[2]))
assets = json.load(open(sys.argv[3]))["champ"]

CHAMPS = list(assets.keys())

def wrm_slug(n):
    n = n.lower().replace("&", "and")
    n = re.sub(r"['.]", "", n)
    return re.sub(r"[^a-z0-9]+", "-", n).strip("-")

# --- Correcciones de datos del módulo de la wiki (errores tipográficos / campos vacíos) ---
FIX = {
    "Aurelion Sol": {"herotype": ["Mage"], "role": ["Battlemage"], "adaptive": "Magic", "range": "Ranged",
                      "damage": "3", "toughness": "1", "utility": "1", "position": ["Mid"]},
    "Aurora": {"herotype": ["Mage", "Assassin"]},
    "Bard": {"herotype": ["Support", "Mage"]},
    "Rumble": {"herotype": ["Fighter", "Mage"]},
    "Viktor": {"herotype": ["Mage"]},
    "Skarner": {"herotype": ["Tank", "Fighter"], "role": ["Vanguard", "Juggernaut"]},
    "Gragas": {"herotype": ["Fighter", "Mage"]},
    "Yunara": {"range": "Ranged", "adaptive": "Physical"},
    "Nocturne": {"herotype": ["Assassin", "Fighter"]},  # el módulo dice Tank/Mage (error evidente)
}

# --- Tipo de daño: excepciones documentadas ---
# mixto: builds AP y AD viables según wildriftmeta / kit híbrido.
# AP: tanques cuyo tipo adaptativo en la wiki es "Physical" pero cuyas habilidades hacen daño mágico.
DMG_OVERRIDE = {
    "Kai'Sa": "mixto", "Kayle": "mixto",
    "Leona": "AP", "Thresh": "AP", "Nunu & Willump": "AP", "Rammus": "AP",
}

# --- Traits curados (criterio en DATA_SOURCES.md) ---
CONTROL = {
    "Ahri", "Alistar", "Amumu", "Annie", "Ashe", "Bard", "Blitzcrank", "Brand", "Braum", "Cho'Gath",
    "Fiddlesticks", "Galio", "Gnar", "Gragas", "Hecarim", "Janna", "Jarvan IV", "K'Sante", "Kennen",
    "Lee Sin", "Leona", "Lillia", "Lissandra", "Lulu", "Lux", "Malphite", "Maokai", "Morgana", "Nami",
    "Nautilus", "Nunu & Willump", "Orianna", "Ornn", "Pantheon", "Poppy", "Pyke", "Rakan", "Rammus",
    "Rell", "Seraphine", "Shen", "Sion", "Skarner", "Sona", "Swain", "Syndra", "Taliyah", "Thresh",
    "Twisted Fate", "Urgot", "Veigar", "Vex", "Vi", "Warwick", "Wukong", "Zilean", "Zoe", "Zyra",
}
CURACION = {
    "Aatrox", "Bard", "Cho'Gath", "Darius", "Dr. Mundo", "Fiddlesticks", "Fiora", "Gwen", "Kayn",
    "Master Yi", "Milio", "Nami", "Nasus", "Nunu & Willump", "Olaf", "Renekton", "Senna", "Seraphine",
    "Sona", "Soraka", "Swain", "Vladimir", "Volibear", "Warwick", "Yuumi",
}
ESCUDO = {
    "Braum", "Janna", "Karma", "Lulu", "Lux", "Milio", "Mordekaiser", "Morgana", "Orianna", "Rakan",
    "Rumble", "Seraphine", "Sett", "Shen", "Sion", "Sona", "Yuumi",
}
ASESINO_EXTRA = {"Kayn"}  # subclase Skirmisher en la wiki, pero juega como asesino (forma Sombra)

CRIT_ITEMS = {"Infinity Edge", "Phantom Dancer", "Navori Quickblades", "Runaan's Hurricane",
              "Yun Tal Wildarrows"}
WRM_ROLE = {"Baron": "baron", "Jungle": "jungle", "Mid": "mid", "Dragon": "adc", "Support": "support"}

POS = {"baron lane": "baron", "jungle": "jungle", "mid": "mid", "dragon lane": "adc", "support": "support"}
CLASE_ES = {"Fighter": "Luchador", "Tank": "Tanque", "Mage": "Mago", "Assassin": "Asesino",
            "Marksman": "Tirador", "Support": "Soporte"}

out = {}
report = []
for name in CHAMPS:
    w = dict(cdwr.get(name) or {})
    w.update(FIX.get(name, {}))
    builds = wrm.get(wrm_slug(name), [])
    ap = sum(b[1][0] for b in builds); ad = sum(b[1][1] for b in builds); tk = sum(b[1][2] for b in builds)
    adaptive = (w.get("adaptive") or "").lower()
    wiki_dmg = "AP" if adaptive.startswith("magic") else "AD"
    if ap or ad:
        build_dmg = "AP" if ap > ad else "AD"
    else:
        build_dmg = None
    dmg = DMG_OVERRIDE.get(name) or build_dmg or wiki_dmg
    src = "override" if name in DMG_OVERRIDE else ("wildriftmeta" if build_dmg else "wiki")
    if build_dmg and build_dmg != wiki_dmg and name not in DMG_OVERRIDE:
        report.append(f"{name}: wiki={wiki_dmg} builds={build_dmg} (AP{ap}/AD{ad}) -> {dmg}")
    herotype = w.get("herotype", []); role = w.get("role", [])
    tough = int(w.get("toughness") or 0)
    tags = []
    if (tough >= 3 and "Marksman" not in herotype) or (tk > ap + ad and tk > 0):
        tags.append("tanque")
    if name in CURACION: tags.append("curación")
    if name in CONTROL: tags.append("control")
    if "Assassin" in role or (herotype[:1] == ["Assassin"]) or name in ASESINO_EXTRA:
        tags.append("asesino")
    if name in ESCUDO: tags.append("escudo")
    positions = []
    for p in w.get("position", []):
        r = POS.get(p.lower())
        if r and r not in positions: positions.append(r)
    # Tipo de build por rol según wildriftmeta: AP / AD / tanque
    build = {}
    crit = False
    for wrole, (bap, bad, btk), items in builds:
        r = WRM_ROLE.get(wrole)
        if not r:
            continue
        build[r] = "tanque" if btk > bap + bad else ("AP" if bap > bad else "AD")
        if any(i in CRIT_ITEMS for i in items):
            crit = True
    estilo = []
    if crit: estilo.append("crit")
    if "Enchanter" in role: estilo.append("encantador")
    out[name] = {
        "dmg": dmg,
        "traits": tags,
        "clase": [CLASE_ES.get(h, h) for h in herotype],
        "roles": positions,
        "build": build,
        "estilo": estilo,
        "img": assets[name]["file"],
        "_src": src,
    }

lines = ["/* Campeones Wild Rift: tipo de daño + traits para los 141 campeones.",
         " * GENERADO por tools/build_champions.py — ver DATA_SOURCES.md (aproximado).",
         " * dmg: AP | AD | mixto. traits: tanque, curación, control, asesino, escudo.",
         " * clase/roles: WR Wiki (Module:ChampionDataWR). img: retrato WR Wiki (arte © Riot Games). */",
         "(typeof window !== 'undefined' ? window : globalThis).WR_CHAMPS = {"]
items = list(out.items())
for i, (n, v) in enumerate(items):
    v = {k: val for k, val in v.items() if not k.startswith("_")}
    lines.append(f"  {json.dumps(n, ensure_ascii=False)}: {json.dumps(v, ensure_ascii=False)}" + ("," if i < len(items) - 1 else ""))
lines.append("};")
lines.append("if (typeof module !== 'undefined' && module.exports) module.exports = (typeof window !== 'undefined' ? window : globalThis).WR_CHAMPS;")
open("champions.js", "w").write("\n".join(lines) + "\n")
print(len(out), "campeones")
print("\n".join(report))
