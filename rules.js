/**
 * Motor de reglas Wild Rift MX — explicable y sin inventar ítems.
 * Funciona en Node (require) o en el navegador (window.WR_RULES).
 *
 * Entradas: data (WR_DATA), champs (WR_CHAMPS: tipo de daño + traits de los 141 campeones).
 */
(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = factory();
  } else {
    root.WR_RULES = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  const ROLE_DEFAULT_DMG = { baron: "AD", jungle: "AD", mid: "AP", adc: "AD", support: "AP" };

  function getChamp(champs, name) {
    return (champs && champs[name]) || null;
  }

  /** Cuenta tipo de daño y traits del equipo enemigo. "mixto" suma 0.5 a AP y 0.5 a AD. */
  function countTraits(champs, enemies) {
    const counts = {
      AP: 0, AD: 0, mixto: 0, tanque: 0, curacion: 0, control: 0, asesino: 0, escudo: 0, tagged: 0, neutral: 0
    };
    enemies.forEach((name) => {
      const c = getChamp(champs, name);
      if (!c) {
        counts.neutral += 1;
        return;
      }
      counts.tagged += 1;
      if (c.dmg === "AP") counts.AP += 1;
      else if (c.dmg === "AD") counts.AD += 1;
      else if (c.dmg === "mixto") { counts.mixto += 1; counts.AP += 0.5; counts.AD += 0.5; }
      (c.traits || []).forEach((tag) => {
        if (tag === "curación") counts.curacion += 1;
        else if (counts[tag] !== undefined) counts[tag] += 1;
      });
    });
    return counts;
  }

  /**
   * Estilo de build de TU campeón en ese rol:
   * tanque | AP | encantador | crit | letal | luchador
   */
  function buildStyle(champ, role) {
    if (!champ) return { style: ROLE_DEFAULT_DMG[role] === "AP" ? "AP" : (role === "adc" ? "crit" : "luchador"), dmg: ROLE_DEFAULT_DMG[role] };
    const perRole = champ.build && champ.build[role];
    let kind = perRole;
    if (!kind) {
      if (champ.dmg === "mixto") kind = ROLE_DEFAULT_DMG[role];
      else kind = champ.dmg;
      const tankRole = role === "baron" || role === "jungle" || role === "support";
      if (tankRole && (champ.traits || []).includes("tanque") && (champ.clase || [])[0] === "Tanque") kind = "tanque";
    }
    const estilo = champ.estilo || [];
    const traits = champ.traits || [];
    if (kind === "tanque") return { style: "tanque", dmg: champ.dmg === "mixto" ? ROLE_DEFAULT_DMG[role] : champ.dmg };
    if (kind === "AP") {
      if (role === "support" && estilo.includes("encantador")) return { style: "encantador", dmg: "AP" };
      return { style: "AP", dmg: "AP" };
    }
    // AD
    if (estilo.includes("crit") || role === "adc") return { style: "crit", dmg: "AD" };
    if (traits.includes("asesino")) return { style: "letal", dmg: "AD" };
    return { style: "luchador", dmg: "AD" };
  }

  const STYLE_LABEL = {
    tanque: "tanque",
    AP: "daño mágico (AP)",
    encantador: "encantador",
    crit: "crítico (AD)",
    letal: "letalidad (asesino AD)",
    luchador: "luchador AD"
  };

  function pickBoots(I, c, role, style) {
    if (c.control >= 3) {
      return { item: I.boots.mercury, reason: `Hay ${c.control} enemigos con mucho control: la tenacidad de Botas de Mercurio acorta stuns y raíces.` };
    }
    if (c.AD >= 3 && c.AP < 2) {
      return { item: I.boots.steelcaps, reason: `${fmt(c.AD)} enemigos hacen daño físico: Punteras de Acero reducen el daño de básicos.` };
    }
    if (c.AP >= 3) {
      return { item: I.boots.mercury, reason: `${fmt(c.AP)} enemigos hacen daño mágico: Botas de Mercurio dan RM y tenacidad.` };
    }
    if (style === "tanque") {
      return c.AP > c.AD
        ? { item: I.boots.mercury, reason: "Tanque contra más daño mágico que físico: Botas de Mercurio." }
        : { item: I.boots.steelcaps, reason: "Tanque contra daño físico: Punteras de Acero para aguantar en primera línea." };
    }
    if (style === "encantador") {
      return { item: I.boots.ionian, reason: "Encantador: Botas Jonias para usar escudos y curaciones más seguido." };
    }
    if (style === "AP") {
      return { item: I.boots.mana, reason: "Campeón AP: Botas de Maná aportan poder y penetración mágica." };
    }
    if (style === "crit" && role === "adc" && c.asesino === 0) {
      return { item: I.boots.berserker, reason: "Tirador sin amenaza de asesinos: Grebas del Berserker para más velocidad de ataque." };
    }
    return { item: I.boots.gluttonous, reason: "Campeón AD: Grebas Glotonas dan succión de vida para tradeos y sostener peleas (las más usadas en Wild Rift)." };
  }

  function coreSet(I, role, style) {
    const sets = I.core_sets;
    return (sets[role + ":" + style] || sets["*:" + style] || sets["*:AP"]).slice();
  }

  function pickCore(I, role, c, style, dmg) {
    const base = coreSet(I, role, style);
    const label = STYLE_LABEL[style];
    const out = base.map((item, idx) => ({
      item,
      reason: idx === 0
        ? `Primer ítem típico para un ${label} en ${roleName(role)}.`
        : idx === 1
          ? `Segundo núcleo (${(item.tag || "").toLowerCase()}): sigue escalando tu poder.`
          : `Tercer núcleo (${(item.tag || "").toLowerCase()}): completa tu pico de poder.`
    }));
    const isDamage = style !== "tanque" && style !== "encantador";
    if (isDamage && c.tanque >= 2) {
      if (dmg === "AD" && !out.some((o) => o.item.name === I.pen.black_cleaver.name)) {
        out[2] = { item: style === "crit" ? I.pen.dominik : I.pen.black_cleaver,
          reason: style === "crit"
            ? `Hay ${c.tanque} tanques: Recuerdos de Lord Dominik te deja perforar su armadura.`
            : `Hay ${c.tanque} tanques: Cuchilla Oscura reduce su armadura para todo tu equipo.` };
      }
      if (dmg === "AP" && !out.some((o) => o.item.name === I.pen.liandry.name)) {
        out[2] = { item: I.pen.liandry, reason: `Hay ${c.tanque} tanques: Tormento de Liandry quema % de vida máxima.` };
      }
    }
    return out.slice(0, 3);
  }

  function pickSituational(I, role, c, style, dmg) {
    // Cada candidato lleva un puntaje = cuántos enemigos lo justifican; se ordena de mayor a menor.
    const cand = [];
    const push = (item, reason, score) => {
      if (cand.some((s) => s.item.name === item.name)) return;
      cand.push({ item, reason, score, i: cand.length });
    };
    const isTank = style === "tanque";
    const isEnchanter = style === "encantador";

    if (c.curacion >= 2) {
      const s = c.curacion + 0.5;
      if (isTank) push(I.defensive.thornmail, `${c.curacion} enemigos con curación: Cota de Espinas aplica heridas graves al recibir golpes.`, s);
      else if (dmg === "AP") push(I.antiheal.morello, `${c.curacion} enemigos con curación: Morellonomicón aplica heridas graves.`, s);
      else if (style === "crit") push(I.antiheal.mortal, `${c.curacion} enemigos con curación: Recordatorio Mortal (heridas graves + pen.).`, s);
      else push(I.antiheal.chempunk, `${c.curacion} enemigos con curación: Espada Sierra Quimopunk aplica heridas graves.`, s);
    }
    if (c.tanque >= 2 && !isTank && !isEnchanter) {
      if (dmg === "AD") {
        push(I.pen.dominik, `${c.tanque} tanques: Recuerdos de Lord Dominik (pen. % + daño vs vida).`, c.tanque);
        push(I.pen.botk, "Espada del Rey Arruinado pega % de vida actual a tanques.", c.tanque - 1);
      } else {
        push(I.pen.void, `${c.tanque} tanques: Báculo del Vacío para pen. mágica %.`, c.tanque);
        push(I.pen.liandry, "Liandry quema tanques en peleas largas.", c.tanque - 1);
      }
    }
    if (c.AP >= 3) {
      if (isTank || isEnchanter) push(I.defensive.kaenic, `${fmt(c.AP)} enemigos AP: Rookern Kaénico absorbe su burst mágico.`, c.AP);
      else if (dmg === "AD") push(I.defensive.maw, `${fmt(c.AP)} enemigos AP: Fauces de Malmortius (salvavidas mágico).`, c.AP);
      else push(I.defensive.banshee, `${fmt(c.AP)} enemigos AP: Velo de la Banshee bloquea una habilidad.`, c.AP);
      if (isTank) push(I.defensive.fon, "Fuerza de la Naturaleza escala RM contra magos.", c.AP - 0.5);
    }
    if (c.AD >= 3) {
      if (isTank || role === "baron" || role === "jungle") push(I.defensive.randuin, `${fmt(c.AD)} enemigos AD: Presagio de Randuin mitiga críticos y básicos.`, c.AD);
      if (isTank || isEnchanter) push(I.defensive.frozen_heart, "Corazón de Hielo baja la velocidad de ataque enemiga.", c.AD - 0.5);
      else if (dmg === "AP") push(I.defensive.zhonya, `${fmt(c.AD)} enemigos AD: Zhonya te da armadura y estasis.`, c.AD - 0.5);
      else if (style === "luchador") push(I.defensive.deaths_dance, `${fmt(c.AD)} enemigos AD: Danza de la Muerte retrasa el daño recibido.`, c.AD - 0.5);
    }
    if (c.control >= 3 && !isTank) {
      if (dmg === "AD") push(I.defensive.mercurial, `${c.control} enemigos con mucho control: Cimitarra Mercurial limpia stuns y raíces.`, c.control - 0.5);
      else push(I.defensive.zhonya, `${c.control} enemigos con mucho control/burst: Reloj de Arena de Zhonya para estasis.`, c.control - 0.5);
    }
    if (c.asesino >= 2) {
      const s = c.asesino + 0.5;
      if (isTank) push(I.defensive.gargoyle, `${c.asesino} asesinos: Armadura Pétrea para absorber su burst.`, s);
      else if (dmg === "AP") push(I.defensive.zhonya, `${c.asesino} asesinos: Zhonya niega su burst.`, s);
      else {
        push(I.defensive.edge_night, `${c.asesino} asesinos: Filo de la Noche bloquea su habilidad clave.`, s);
        push(I.defensive.ga, "Ángel Guardián da una segunda vida contra el burst.", s - 1);
      }
    }
    if (c.escudo >= 2 && !isTank) {
      if (dmg === "AD") push(I.anti_shield.fang, `${c.escudo} enemigos con escudos: Colmillo de Serpiente los reduce.`, c.escudo);
      else push(I.anti_shield.oceanid, `${c.escudo} enemigos con escudos: Tridente del Oceánida los reduce.`, c.escudo);
    }

    // Relleno sensato si faltan
    if (isTank) push(c.AP > c.AD ? I.defensive.fon : I.defensive.thornmail, "Defensa extra según el daño enemigo dominante.", 0);
    else if (isEnchanter) push(I.defensive.gargoyle, "Armadura Pétrea para aguantar engage.", 0);
    else if (role === "baron" || role === "jungle") push(I.defensive.amaranth, "Protección de Amaranth: resistencias y salvavidas (muy usada en Barón/Jungla).", 0);
    push(I.defensive.ga, "Ángel Guardián como seguro en teamfights.", -1);

    return cand
      .sort((a, b) => b.score - a.score || a.i - b.i)
      .map(({ item, reason }) => ({ item, reason }));
  }

  function roleName(role) {
    return { baron: "Barón", jungle: "Jungla", mid: "Mid", adc: "Dragón", support: "Soporte" }[role] || role;
  }
  function fmt(n) {
    return Number.isInteger(n) ? String(n) : String(n).replace(".", ",");
  }


  function pickRunes(data, role, c, style, me) {
    const K = data.runes.keystones;
    const M = data.runes.minors;
    const traits = (me && me.traits) || [];
    const estilo = (me && me.estilo) || [];

    let keystone, keyReason;
    if (style === "tanque") {
      if (role === "support" && traits.includes("control")) {
        keystone = K.ice_overlord;
        keyReason = "Soporte tanque con control: Señor del Hielo castiga al inmovilizar.";
      } else {
        keystone = K.grasp;
        keyReason = "Tanque de combate: Garras del Inmortal suma vida y daño en pelea.";
      }
    } else if (style === "encantador") {
      keystone = K.aery;
      keyReason = "Encantador: Aery refuerza escudos y curaciones a aliados.";
    } else if (style === "crit") {
      keystone = K.lethal_tempo;
      keyReason = "Tirador crítico: Cadencia Letal escala velocidad de ataque en peleas largas.";
    } else if (style === "letal") {
      keystone = K.electrocute;
      keyReason = "Asesino AD: Electrocutar remata combos cortos.";
    } else if (style === "luchador") {
      keystone = K.conqueror;
      keyReason = "Luchador: Conquistador da daño adaptable y omnivampirismo en peleas extendidas.";
    } else {
      // AP
      if (role === "support" && traits.includes("control")) {
        keystone = K.electrocute;
        keyReason = "Soporte AP con poke/combo: Electrocutar castiga intercambios.";
      } else if (estilo.includes("artillería") || role === "mid") {
        keystone = K.electrocute;
        keyReason = "Mago AP: Electrocutar castiga combos de 3 hits.";
      } else {
        keystone = K.electrocute;
        keyReason = "Campeón AP: Electrocutar es la clave de ráfaga más usada.";
      }
    }

    // Base minors by style (3 slots)
    let minors = [];
    const pushM = (rune, reason) => {
      if (!rune || minors.some((x) => x.rune.name === rune.name)) return;
      minors.push({ rune, reason });
    };

    if (style === "tanque") {
      pushM(M.bone_plating, "Revestimiento de Huesos mitiga la primera ráfaga del lane.");
      pushM(M.overgrowth, "Sobrecrecimiento suma vida máxima a lo largo de la partida.");
      pushM(role === "support" ? M.font_of_life : M.demolish,
        role === "support"
          ? "Fuente de vida cura a tu carry cuando controlas enemigos."
          : "Demolición acelera derribar torres tras un trade.");
    } else if (style === "encantador") {
      pushM(M.font_of_life, "Fuente de vida amplifica tu utilidad de curación.");
      pushM(M.revitalize, "Revitalizar potencia curaciones y escudos.");
      pushM(M.manaflow, "Banda de Maná sostiene el spam de habilidades.");
    } else if (style === "crit") {
      pushM(M.brutal, "Brutal suma daño en cada básico.");
      pushM(M.cut_down, "Corte ayuda contra enemigos con más vida.");
      pushM(M.legend_alacrity, "Leyenda: Presteza escala velocidad de ataque con derribos.");
    } else if (style === "letal") {
      pushM(M.sudden_impact, "Impacto Súbito premia dashes y salidas de sigilo.");
      pushM(M.eyeball, "Colección de ojos escala fuerza adaptable con derribos.");
      pushM(M.coup_de_grace, "Golpe de gracia remata a enemigos heridos.");
    } else if (style === "luchador") {
      pushM(M.brutal, "Brutal refuerza tus ataques en duelos.");
      pushM(M.last_stand, "Última Batalla sube el daño cuando bajas de vida.");
      pushM(M.legend_bloodline, "Leyenda: Linaje da omnivampirismo que escala.");
    } else {
      // AP
      pushM(M.sudden_impact, "Impacto Súbito o daño extra tras movilidad/habilidades.");
      pushM(M.transcendence, "Trascendencia da aceleración de habilidades.");
      pushM(M.gathering_storm, "Tormenta creciente escala tu daño en late.");
    }

    // Adapt at least one minor to enemy team when it makes sense
    let adapted = false;
    if (c.tanque >= 2 && style !== "tanque" && style !== "encantador") {
      // replace a damage-finisher slot with Cut Down if not already
      if (!minors.some((x) => x.rune.name === M.cut_down.name)) {
        minors[1] = { rune: M.cut_down, reason: `Hay ${c.tanque} tanques: Corte inflige más daño a campeones con mucha vida.` };
        adapted = true;
      }
    }
    if (!adapted && c.control >= 3) {
      minors[2] = { rune: M.perseverance, reason: `Hay ${c.control} enemigos con mucho control: Perseverancia da tenacidad y resistencias bajo CC.` };
      adapted = true;
    }
    if (!adapted && c.asesino >= 2) {
      minors[0] = { rune: M.bone_plating, reason: `Hay ${c.asesino} asesinos: Revestimiento de Huesos mitiga su ráfaga inicial.` };
      adapted = true;
    }
    if (!adapted && c.AP >= 3 && style !== "AP") {
      minors[minors.length - 1] = { rune: M.nullifying_orb, reason: `${fmt(c.AP)} enemigos AP: Orbe Anulador te da un escudo a poca vida.` };
      adapted = true;
    }
    if (!adapted && c.curacion >= 2 && (style === "letal" || style === "AP")) {
      minors[minors.length - 1] = { rune: M.coup_de_grace, reason: `${c.curacion} con curación: Golpe de gracia ayuda a rematar antes de que se curen.` };
      adapted = true;
    }
    if (!adapted && c.AD >= 3 && (style === "tanque" || style === "encantador")) {
      minors[0] = { rune: M.bone_plating, reason: `${fmt(c.AD)} enemigos AD: Revestimiento de Huesos amortigua su ráfaga.` };
      adapted = true;
    }

    // Ensure exactly 3 unique minors
    const seen = new Set([keystone.name]);
    const clean = [];
    for (const row of minors) {
      if (seen.has(row.rune.name)) continue;
      seen.add(row.rune.name);
      clean.push(row);
      if (clean.length === 3) break;
    }
    const filler = [M.brutal, M.transcendence, M.bone_plating, M.gathering_storm, M.eyeball];
    for (const f of filler) {
      if (clean.length >= 3) break;
      if (seen.has(f.name)) continue;
      seen.add(f.name);
      clean.push({ rune: f, reason: "Complemento general de poder según tu estilo." });
    }

    return {
      keystone: { rune: keystone, reason: keyReason },
      minors: clean.slice(0, 3)
    };
  }

  function pickSpells(data, role, c, style) {
    const S = data.spells;
    const flash = { spell: S.flash, reason: "Destello es el hechizo estándar de movilidad y escapes." };
    let second;

    if (role === "jungle") {
      second = { spell: S.smite, reason: "Jungla: Castigo es obligatorio para monstruos y objetivos." };
    } else if (c.control >= 3) {
      second = { spell: S.cleanse, reason: `Hay ${c.control} enemigos con mucho control: Purificar limpia stuns y raíces.` };
    } else if (c.asesino >= 2 && (style === "crit" || style === "encantador" || style === "AP")) {
      second = { spell: S.exhaust, reason: `Hay ${c.asesino} asesinos: Extenuación reduce su daño y velocidad.` };
    } else if (c.curacion >= 2) {
      second = { spell: S.ignite, reason: `${c.curacion} enemigos con curación: Ignición aplica heridas graves y remata.` };
    } else if (style === "crit" || role === "adc") {
      second = { spell: S.barrier, reason: "Tirador: Barrera te salva de una ráfaga en lane o teamfight." };
    } else if (style === "encantador" || (style === "tanque" && role === "support")) {
      second = { spell: S.exhaust, reason: "Soporte: Extenuación protege a tu carry del threat principal." };
    } else if (style === "letal" || style === "AP") {
      second = { spell: S.ignite, reason: "Ráfaga: Ignición asegura asesinatos y corta curaciones." };
    } else if (style === "luchador" || style === "tanque") {
      if (c.AP >= 3) second = { spell: S.ghost, reason: "Fantasma ayuda a perseguir o escapar en peleas largas." };
      else second = { spell: S.ignite, reason: "Ignición aporta presión de kill en duelos de Barón/Jungla." };
    } else {
      second = { spell: S.ignite, reason: "Ignición es la segunda opción ofensiva más flexible." };
    }

    // Never duplicate; if somehow flash==second (shouldn't), swap
    if (second.spell.name === flash.spell.name) {
      second = { spell: S.ignite, reason: "Ignición como segundo hechizo ofensivo." };
    }
    return [flash, second];
  }

  function recommend(data, champs, opts) {
    const { role, myChampion, enemies } = opts;
    if (!role || !myChampion || !enemies || enemies.length !== 5) {
      throw new Error("Se requieren rol, tu campeón y exactamente 5 enemigos.");
    }
    if (new Set(enemies).size !== 5) throw new Error("Los 5 enemigos deben ser distintos.");

    const I = data.items;
    const c = countTraits(champs, enemies);
    const me = getChamp(champs, myChampion);
    const { style, dmg } = buildStyle(me, role);
    const boots = pickBoots(I, c, role, style);
    const core = pickCore(I, role, c, style, dmg);
    const used = new Set([boots.item.name, ...core.map((x) => x.item.name)]);
    const situational = pickSituational(I, role, c, style, dmg).filter((s) => !used.has(s.item.name)).slice(0, 4);

    const parts = [];
    if (c.AP >= 2) parts.push(`${fmt(c.AP)} con daño mágico`);
    if (c.AD >= 2) parts.push(`${fmt(c.AD)} con daño físico`);
    if (c.tanque >= 2) parts.push(`${c.tanque} tanques`);
    if (c.curacion >= 2) parts.push(`${c.curacion} con curación`);
    if (c.control >= 2) parts.push(`${c.control} con mucho control`);
    if (c.asesino >= 2) parts.push(`${c.asesino} asesinos`);
    if (c.escudo >= 2) parts.push(`${c.escudo} con escudos`);
    if (c.neutral) parts.push(`${c.neutral} sin datos`);

    // Orden de compra estilo "build del juego": núcleo 1 → botas → núcleo 2 → núcleo 3 → situacionales
    const order = [core[0], boots, core[1], core[2], ...situational.slice(0, 2)].filter(Boolean);

    const runes = pickRunes(data, role, c, style, me);
    const spells = pickSpells(data, role, c, style);

    return {
      myChampion,
      role,
      style,
      styleLabel: STYLE_LABEL[style],
      enemies: enemies.slice(),
      traitCounts: c,
      summary: parts.length
        ? "Lectura del enemigo: " + parts.join(", ") + "."
        : "El equipo enemigo está equilibrado; build base de tu campeón.",
      boots,
      core,
      situational,
      order,
      runes,
      spells
    };
  }

  return { recommend, countTraits, buildStyle, getChamp, fmt, pickRunes, pickSpells };
});
