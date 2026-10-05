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


  const ESTADOS = {
    parejo: { id: "parejo", label: "Parejo" },
    ganando: { id: "ganando", label: "Vas ganando" },
    perdiendo: { id: "perdiendo", label: "Vas perdiendo" }
  };

  function normalizeEstado(raw) {
    const id = String(raw || "parejo").toLowerCase();
    return ESTADOS[id] ? id : "parejo";
  }

  /** Ítem defensivo según daño enemigo dominante (solo nombres ya en data). */
  function pickSafetyItem(I, c, style, dmg) {
    if (c.AD >= c.AP) {
      if (dmg === "AP") return { item: I.defensive.zhonya, why: "armadura + estasis vs AD" };
      if (style === "crit" || style === "letal") return { item: I.defensive.ga, why: "segunda vida vs AD" };
      if (style === "tanque" || style === "encantador" || style === "luchador") {
        return { item: I.defensive.randuin, why: "armadura vs AD" };
      }
      return { item: I.defensive.ga, why: "salvavidas vs AD" };
    }
    // más AP
    if (dmg === "AD") return { item: I.defensive.maw, why: "RM + salvavidas vs AP" };
    if (style === "tanque" || style === "encantador") return { item: I.defensive.kaenic, why: "escudo mágico vs AP" };
    if (dmg === "AP") return { item: I.defensive.banshee, why: "escudo de hechizo vs AP" };
    return { item: I.defensive.zhonya, why: "estasis vs ráfaga" };
  }

  /** Ítem de daño/penetración para cerrar (solo data existente). */
  function pickSnowballItem(I, c, style, dmg, core) {
    if (dmg === "AP") {
      if (c.tanque >= 2) return { item: I.pen.void, why: "pen. mágica para rematar tanques" };
      if (c.curacion >= 2) return { item: I.antiheal.morello, why: "heridas graves para cerrar" };
      return { item: I.pen.void, why: "pen. mágica para snowball" };
    }
    if (style === "crit") {
      if (c.tanque >= 2) return { item: I.pen.dominik, why: "pen. armadura para cerrar vs tanques" };
      if (c.curacion >= 2) return { item: I.antiheal.mortal, why: "anti-curación + pen. para cerrar" };
      // segundo núcleo crítico (daño) si existe
      if (core[1]) return { item: core[1].item, why: "pico de daño crítico más temprano" };
      return { item: I.pen.dominik, why: "pen. armadura ofensiva" };
    }
    if (style === "letal") {
      return { item: I.pen.serylda, why: "letalidad/pen. para cazar" };
    }
    if (style === "luchador") {
      if (c.tanque >= 1) return { item: I.pen.black_cleaver, why: "reducir armadura y pelear" };
      return { item: I.pen.botk, why: "daño % vida para snowball" };
    }
    // tanque / encantador: poco snowball de daño; usa núcleo 2 si hay
    if (core[1]) return { item: core[1].item, why: "adelantar el segundo núcleo con ventaja" };
    return { item: I.defensive.gargoyle, why: "presión con escudo activo" };
  }

  function entryOf(item, reason, kind) {
    return { item, reason, kind: kind || "sit" };
  }

  /**
   * Reescribe orden (y opcionalmente runas/hechizos) según estado de la partida.
   * Parejo = sin cambios. Solo usa ítems ya en data.js.
   */
  function applyEstado(ctx) {
    const { I, c, style, dmg, boots, core, situational, order, runes, spells, estado, data, role } = ctx;
    const id = normalizeEstado(estado);
    const label = ESTADOS[id].label;

    if (id === "parejo") {
      return {
        order: order.slice(),
        situational,
        runes,
        spells,
        estado: id,
        estadoLabel: label,
        estadoNote: "Partida pareja: build estándar según el enemigo."
      };
    }

    // Clonar entradas para no mutar razones base al reusar referencias
    const clone = (e) => ({ item: e.item, reason: e.reason });
    let ord = order.map(clone);
    let sits = situational.map(clone);
    let rn = {
      keystone: { rune: runes.keystone.rune, reason: runes.keystone.reason },
      minors: runes.minors.map((m) => ({ rune: m.rune, reason: m.reason }))
    };
    let sp = spells.map((s) => ({ spell: s.spell, reason: s.reason }));
    let note = "";

    const usedNames = () => new Set(ord.map((e) => e.item.name));
    const idxOf = (name) => ord.findIndex((e) => e.item.name === name);
    const placeAfterBoots = (entry) => {
      // orden objetivo: núcleo1, botas, ENTRY, … (sin duplicar)
      const name = entry.item.name;
      const without = ord.filter((e) => e.item.name !== name && e.item.name !== boots.item.name && e.item.name !== (core[0] && core[0].item.name));
      const head = [];
      if (core[0]) head.push(clone(core[0]));
      head.push(clone(boots));
      head.push(entry);
      const rest = without.filter((e) => !head.some((h) => h.item.name === e.item.name));
      ord = [...head, ...rest].slice(0, 6);
      // asegurar sits lista
      if (!sits.some((s) => s.item.name === name) && entry !== core[0] && entry !== boots && !(core[1] && core[1].item.name === name) && !(core[2] && core[2].item.name === name)) {
        sits = [entry, ...sits.filter((s) => s.item.name !== name)].slice(0, 4);
      }
    };

    if (id === "ganando") {
      note = "Vas adelante: compra daño para cerrar la partida rápido.";
      const spike = pickSnowballItem(I, c, style, dmg, core);
      const reason = `${note} ${spike.why.charAt(0).toUpperCase() + spike.why.slice(1)}.`;
      // Si el spike ya es core[1], adelantar core[1] tras botas (ya está en pos 2 en orden base… base es c0,boots,c1 → ya).
      // Forzar spike en posición 2 (índice 2) con razón de estado.
      placeAfterBoots(entryOf(spike.item, reason, "sit"));
      // Marcar razón en la entrada colocada
      const i = idxOf(spike.item.name);
      if (i >= 0) ord[i] = entryOf(spike.item, reason, "sit");

      // Runas: snowball menor
      const M = data.runes.minors;
      if (style === "letal" || style === "AP") {
        rn.minors[2] = { rune: M.hubris, reason: "Vas adelante: Soberbia te potencia tras cada eliminación." };
      } else if (style === "crit" || style === "luchador") {
        rn.minors[2] = { rune: M.coup_de_grace, reason: "Vas adelante: Golpe de gracia remata para cerrar." };
      } else {
        rn.minors[2] = { rune: M.demolish, reason: "Vas adelante: Demolición acelera derribar torres." };
      }
      // Hechizos: Ignición si no jungla
      if (role !== "jungle") {
        const S = data.spells;
        if (sp[1].spell.name !== S.ignite.name && sp[0].spell.name !== S.ignite.name) {
          sp[1] = { spell: S.ignite, reason: "Vas adelante: Ignición asegura kills para cerrar." };
        } else if (sp[1].spell.name === S.ignite.name) {
          sp[1] = { spell: S.ignite, reason: "Vas adelante: Ignición asegura kills para cerrar." };
        }
      }
    } else {
      // perdiendo
      note = "Vas atrás: sobrevive primero y escala.";
      const safe = pickSafetyItem(I, c, style, dmg);
      const reason = `${note} Prioriza ${safe.why}.`;
      placeAfterBoots(entryOf(safe.item, reason, "sit"));
      const i = idxOf(safe.item.name);
      if (i >= 0) ord[i] = entryOf(safe.item, reason, "sit");

      const M = data.runes.minors;
      rn.minors[0] = { rune: M.bone_plating, reason: "Vas atrás: Revestimiento de Huesos mitiga ráfagas." };
      if (c.control >= 2) {
        rn.minors[2] = { rune: M.perseverance, reason: "Vas atrás: Perseverancia ayuda bajo control." };
      } else {
        rn.minors[2] = { rune: M.second_wind, reason: "Vas atrás: Segundo Aire regenera tras el daño." };
      }
      // Hechizos defensivos
      if (role !== "jungle") {
        const S = data.spells;
        if (c.control >= 3) {
          sp[1] = { spell: S.cleanse, reason: "Vas atrás: Purificar para no morir al CC." };
        } else if (c.asesino >= 2 || style === "crit" || style === "encantador") {
          sp[1] = { spell: S.exhaust, reason: "Vas atrás: Extenuación recorta el daño enemigo." };
        } else if (style === "crit" || role === "adc") {
          sp[1] = { spell: S.barrier, reason: "Vas atrás: Barrera te da margen para escalar." };
        } else {
          sp[1] = { spell: S.barrier, reason: "Vas atrás: Barrera prioriza supervivencia." };
        }
      }
    }

    // Deduplicar runas menores si chocan con keystone / entre sí
    const seenR = new Set([rn.keystone.rune.name]);
    const cleanM = [];
    for (const m of rn.minors) {
      if (seenR.has(m.rune.name)) continue;
      seenR.add(m.rune.name);
      cleanM.push(m);
    }
    const fill = [data.runes.minors.brutal, data.runes.minors.transcendence, data.runes.minors.bone_plating, data.runes.minors.eyeball, data.runes.minors.gathering_storm];
    for (const f of fill) {
      if (cleanM.length >= 3) break;
      if (seenR.has(f.name)) continue;
      seenR.add(f.name);
      cleanM.push({ rune: f, reason: "Complemento según el estado de la partida." });
    }
    rn.minors = cleanM.slice(0, 3);

    // Dedup spells
    if (sp[0].spell.name === sp[1].spell.name) {
      sp[1] = { spell: data.spells.ignite, reason: "Segundo hechizo ofensivo." };
    }

    // Orden final 6 únicos
    const seenI = new Set();
    const final = [];
    for (const e of ord) {
      if (seenI.has(e.item.name)) continue;
      seenI.add(e.item.name);
      final.push(e);
      if (final.length === 6) break;
    }
    // rellenar desde core/sits/boots si faltan
    for (const e of [boots, ...core, ...sits]) {
      if (final.length >= 6) break;
      if (seenI.has(e.item.name)) continue;
      seenI.add(e.item.name);
      final.push(clone(e));
    }

    return {
      order: final,
      situational: sits,
      runes: rn,
      spells: sp,
      estado: id,
      estadoLabel: label,
      estadoNote: note
    };
  }

  function recommend(data, champs, opts) {
    const { role, myChampion, enemies } = opts;
    const estado = normalizeEstado(opts && opts.estado);
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

    const adj = applyEstado({
      I, c, style, dmg, boots, core, situational, order, runes, spells, estado, data, role
    });

    const summaryBase = parts.length
      ? "Lectura del enemigo: " + parts.join(", ") + "."
      : "El equipo enemigo está equilibrado; build base de tu campeón.";

    const result = {
      myChampion,
      role,
      style,
      styleLabel: STYLE_LABEL[style],
      enemies: enemies.slice(),
      traitCounts: c,
      summary: summaryBase + (adj.estado !== "parejo" ? " " + adj.estadoNote : ""),
      boots,
      core,
      situational: adj.situational,
      order: adj.order,
      runes: adj.runes,
      spells: adj.spells,
      estado: adj.estado,
      estadoLabel: adj.estadoLabel,
      estadoNote: adj.estadoNote
    };
    result.enemyCards = buildEnemyCards(champs, myChampion, role, enemies, result, estado);
    return result;
  }



  /* ---- Tarjetas por enemigo (amenaza + contra del build actual) ---- */

  /** Líneas de amenaza por clase/trait (tono gamer casual ES-MX). */
  const THREAT_BY_TRAIT = {
    asesino: "te revienta de golpe",
    curación: "no para de curar a su equipo",
    control: "te controla y te cancela la pelea",
    tanque: "te come en pelea larga",
    escudo: "se pone escudos y aguanta de más"
  };
  const THREAT_BY_CLASS = {
    "Asesino": "te cae encima y te borra",
    "Tirador": "te derrite de lejos",
    "Mago": "te funde con magia",
    "Tanque": "se te planta en la cara y no se muere",
    "Luchador": "te gana en el mano a mano",
    "Soporte": "arma a su equipo y te complica la vida"
  };
  /** Overrides donde la clase genérica engaña (kits icónicos). */
  const THREAT_OVERRIDE = {
    "Zed": "te revienta de golpe",
    "Malphite": "te encierra con su ulti",
    "Pyke": "te ejecuta cuando bajas de vida",
    "Blitzcrank": "te jala y te deja vendido",
    "Thresh": "te engancha y te deja para el equipo",
    "Nautilus": "te atrapa y no te suelta",
    "Rell": "te engagéa y te deja sin escape",
    "Leona": "te stunéa y te abre al ADC",
    "Amumu": "te envuelve a todos con su ulti",
    "Rammus": "te refleja el daño si le pegas",
    "Master Yi": "te llega y te corta en segundos",
    "Yasuo": "entra al combo y te destroza",
    "Yone": "te persigue y te parte a dos",
    "Kha'Zix": "te aísla y te elimina",
    "Rengar": "salta desde la maleza y te borra",
    "Talon": "te cruza y te remata",
    "Evelynn": "sale del stealth y te funde",
    "Fizz": "te unta el tiburón y adiós",
    "Akali": "entra, sale y te deja en nada",
    "Jhin": "te clava el cuarto tiro",
    "Jinx": "te limpia si se pone a farmear kills",
    "Lux": "te rootéa y te funde",
    "Morgana": "te ata y te niega escapes",
    "Lulu": "te polimorfea y te anula",
    "Soraka": "cura todo lo que le haces a su carry",
    "Sona": "potencia a su equipo a full",
    "Nami": "te burbujea y empuja peleas",
    "Seraphine": "te ultimá en área y cura a los suyos",
    "Garen": "te silencia y te ejecuta",
    "Darius": "te apila hemorragias y te parte",
    "Sett": "te levanta y te estrella",
    "Vayne": "te true damagea aunque seas tanque",
    "Kayn": "te alcanza sí o sí en mid/late",
    "Vi": "te apunta con la ulti y te saca",
    "Warwick": "te huele con poca vida y te caza",
    "Nocturne": "apaga el mapa y te llega",
    "Annie": "te stunéa con Tibbers encima",
    "Veigar": "te one-shotea si stackea",
    "Brand": "te prende y te derrite en área",
    "Swain": "te jala y se cura en la pelea",
    "Vladimir": "se cura un montón y te drena",
    "Sion": "revive y te sigue zonificando",
    "Ornn": "te knockupea y te destroza en engage",
    "K'Sante": "te all-inea y te saca de posición",
    "Alistar": "te comboa y te deja sin moverte",
    "Braum": "bloquea tu daño al carry",
    "Shen": "tauntea y salva a su equipo",
    "Galio": "llega con ulti y te tauntea",
    "Gragas": "te empuja y te rompe la formación",
    "Lee Sin": "te kicks y te aísla",
    "Jarvan IV": "te encierra en la arena",
    "Skarner": "te arrastra lejos de tu equipo",
    "Urgot": "te ejecuta y controla la pelea",
    "Cho'Gath": "te silencía y te come stacks",
    "Dr. Mundo": "no se muere y te tira cleavers",
    "Singed": "te trolleá con veneno y flips",
    "Teemo": "te ciega y te mina el mapa",
    "Shaco": "te confunde con clones y stealth",
    "Twitch": "te invisiblea y te limpia de atrás",
    "Kog'Maw": "te derrite a distancia absurda",
    "Varus": "te rootéa y te pega poke brutal",
    "Ashe": "te ralentiza y te ultimá de lejos",
    "Caitlyn": "te trampa y te pega de francotiradora",
    "Samira": "te entra al melee y te limpia",
    "Nilah": "se mete al lio y te críticos",
    "Senna": "te pokea y cura a distancia",
    "Zyra": "te atrapa con plantas y te quema",
    "Heimerdinger": "te zonifica con torretas",
    "Anivia": "te walléa y te congela",
    "Lissandra": "te ultimá y te saca de la pelea",
    "Orianna": "te balléa y define teamfights",
    "Syndra": "te stunéa y te estrella de lejos",
    "Viktor": "te zonifica y escala absurdo",
    "Azir": "te empuja con soldados y shurima",
    "Aurelion Sol": "te estrellá con el mapa entero",
    "Karma": "te shieldéa/rootéa y empuja lane",
    "Zilean": "revive a su carry y te bomba",
    "Bard": "te ultimá a todos y te descolocá",
    "Rakan": "engagea y te charmés",
    "Yuumi": "pega al carry y no la alcanzas",
    "Milio": "limpia CC y pelea con su ADC",
    "Renata Glasc": "te vuelve loco contra tu equipo",
    "Nunu & Willump": "te snowballéa y controla objetivos",
    "Ivern": "escuda a su jungla/carry y te atrapa",
    "Kindred": "niega muertes en su área",
    "Elise": "te stunéa y te burstéa en stun",
    "Rek'Sai": "te unburrowéa y te saca",
    "Diana": "te ultimá en área y te burstea",
    "Ekko": "te stunéa y se rebobina",
    "Kassadin": "te salta encima en late",
    "Katarina": "resetéa kills y te limpia",
    "Qiyana": "te ultimá en wall y te borra",
    "Pantheon": "te stunéa y te llega del cielo",
    "Xin Zhao": "te challengea y no te suelta",
    "Wukong": "clonea y te ultimá en área",
    "Camille": "te engancha a la pared",
    "Fiora": "te true damagea los vitals",
    "Irelia": "te markea y te remata en resets",
    "Riven": "te comboa móvil y te estalla",
    "Aatrox": "te drena y te revive la pelea",
    "Mordekaiser": "te lleva al reino de la muerte",
    "Volibear": "te torreá y te stunéa",
    "Trundle": "te roba stats y te pisa",
    "Olaf": "ignora tu CC y te corre encima",
    "Tryndamere": "no se muere en ulti y te corta",
    "Gwen": "te true damagea en su niebla",
    "Lillia": "te dormís a todos en teamfight",
    "Hecarim": "te cargá encima a full velocidad",
    "Sejuani": "te stunéa en área y abre peleas",
    "Maokai": "te rootéa y te sapitos a full",
    "Poppy": "te niega dashes y te paredes",
    "Tahm Kench": "te engulle y te saca",
    "Sion": "carga y te zonifica aunque muera"
  };

  function threatLine(name, enemy) {
    if (THREAT_OVERRIDE[name]) return name + ": " + THREAT_OVERRIDE[name];
    if (!enemy) return name + ": amenaza desconocida (sin datos)";
    const traits = enemy.traits || [];
    // prioridad de traits más específicos
    for (const t of ["asesino", "curación", "control", "escudo", "tanque"]) {
      if (traits.includes(t) && THREAT_BY_TRAIT[t]) return name + ": " + THREAT_BY_TRAIT[t];
    }
    const clase = enemy.clase || [];
    for (const c of clase) {
      if (THREAT_BY_CLASS[c]) return name + ": " + THREAT_BY_CLASS[c];
    }
    if (enemy.dmg === "AP") return name + ": te pega daño mágico fuerte";
    if (enemy.dmg === "AD") return name + ": te pega daño físico fuerte";
    return name + ": pelea versátil, cuídate el matchup";
  }

  /** Busca en el build (orden) el mejor ítem que contrapique al enemigo. */
  function findBuildCounter(enemy, buildItems) {
    if (!enemy || !buildItems || !buildItems.length) return null;
    const byName = (names) => {
      for (const n of names) {
        const hit = buildItems.find((it) => it && it.name === n);
        if (hit) return hit;
      }
      return null;
    };
    const traits = enemy.traits || [];
    const clase = enemy.clase || [];
    const isAssassin = traits.includes("asesino") || clase.includes("Asesino");
    const isTank = traits.includes("tanque") || clase.includes("Tanque");
    const isHeal = traits.includes("curación");
    const isShield = traits.includes("escudo");
    const isCC = traits.includes("control");
    const isAdc = clase.includes("Tirador");
    const isMage = clase.includes("Mago");
    const isFighter = clase.includes("Luchador");

    if (isAssassin) {
      const it = byName([
        "Reloj de Arena de Zhonya", "Ángel Guardián", "Filo de la Noche",
        "Velo de la Banshee", "Fauces de Malmortius", "Guantelete de Sterak",
        "Protección de Amaranth", "Armadura Pétrea", "Danza de la Muerte",
        "Punteras de Acero", "Botas de Mercurio"
      ]);
      if (it) return { item: it, why: "te salva de su ráfaga" };
    }
    if (isHeal) {
      const it = byName([
        "Morellonomicón", "Recordatorio Mortal", "Espada Sierra Quimopunk", "Cota de Espinas"
      ]);
      if (it) return { item: it, why: "le corta la curación" };
      // Sin anti-curación en el build: mejor tip que un ítem flojo
      return null;
    }
    if (isShield) {
      const it = byName(["Colmillo de Serpiente", "Tridente del Oceánida"]);
      if (it) return { item: it, why: "le rompe los escudos" };
    }
    // CC antes que tanque: hooks/engage importan más que "perforar"
    if (isCC) {
      const it = byName(["Botas de Mercurio", "Cimitarra Mercurial", "Reloj de Arena de Zhonya"]);
      if (it) return { item: it, why: "te saca de su control o lo niega" };
    }
    if (isTank) {
      const it = byName([
        "Báculo del Vacío", "Recuerdos de Lord Dominik", "Tormento de Liandry",
        "Cuchilla Oscura", "Espada del Rey Arruinado", "Rencor de Serylda"
      ]);
      if (it) return { item: it, why: "le perfora la tanquez" };
    }
    if (isAdc || (enemy.dmg === "AD" && !isAssassin)) {
      const it = byName([
        "Punteras de Acero", "Presagio de Randuin", "Corazón de Hielo",
        "Cota de Espinas", "Reloj de Arena de Zhonya", "Danza de la Muerte",
        "Ángel Guardián"
      ]);
      if (it) return { item: it, why: "aguantas mejor su DPS físico" };
    }
    if (isMage || enemy.dmg === "AP") {
      const it = byName([
        "Botas de Mercurio", "Velo de la Banshee", "Rookern Kaénico",
        "Fuerza de la Naturaleza", "Fauces de Malmortius", "Al Filo de la Cordura"
      ]);
      if (it) return { item: it, why: "te blindás contra su magia" };
    }
    if (isFighter) {
      const it = byName([
        "Punteras de Acero", "Botas de Mercurio", "Presagio de Randuin",
        "Ángel Guardián", "Guantelete de Sterak", "Danza de la Muerte",
        "Cuchilla Oscura", "Espada del Rey Arruinado"
      ]);
      if (it) return { item: it, why: "te ayuda en el duelo contra él" };
    }
    return null;
  }

  function tipForEnemy(name, enemy, estado) {
    const traits = (enemy && enemy.traits) || [];
    const clase = (enemy && enemy.clase) || [];
    if (traits.includes("asesino") || clase.includes("Asesino")) {
      return "Tip: pelea cerca de tu equipo; no le des el 1v1 cuando tenga ulti.";
    }
    if (traits.includes("control")) {
      return "Tip: guarda tu escape/Destello para su engage; no camines en su rango de hook.";
    }
    if (traits.includes("tanque")) {
      return "Tip: no gastes todo el combo en él primero; prioriza a los carries.";
    }
    if (traits.includes("curación")) {
      return "Tip: enfócala / al carry que cura antes de pelear largo.";
    }
    if (clase.includes("Tirador")) {
      return "Tip: flanquea o espera su compromiso; no pelees en su kiting.";
    }
    if (estado === "perdiendo") {
      return "Tip: farmea seguro y pelea solo con visión; no fuerces su all-in.";
    }
    if (estado === "ganando") {
      return "Tip: fuerza objetivos; no le des free kills para que se recupere.";
    }
    return "Tip: respeta su cooldown clave y pelea cuando esté gastado.";
  }

  /**
   * Tarjetas 1:1 por enemigo: amenaza + ítem del build que lo contrapica (o tip).
   * @returns {{ name, img, threat, counterKind, item?, counter }}
   */
  function buildEnemyCards(champs, myChampion, role, enemies, build, gameState) {
    const estado = normalizeEstado(gameState || (build && build.estado) || "parejo");
    const order = (build && build.order) || [];
    const buildItems = order.map((e) => e && e.item).filter(Boolean);
    const list = (enemies || []).filter(Boolean).slice(0, 5);

    return list.map((name) => {
      const enemy = getChamp(champs, name);
      const threat = threatLine(name, enemy);
      const hit = findBuildCounter(enemy, buildItems);
      if (hit) {
        return {
          name,
          img: (enemy && enemy.img) || "",
          threat,
          counterKind: "item",
          item: hit.item,
          counter: "Te lo para: " + hit.item.name + " — " + hit.why + "."
        };
      }
      return {
        name,
        img: (enemy && enemy.img) || "",
        threat,
        counterKind: "tip",
        item: null,
        counter: tipForEnemy(name, enemy, estado)
      };
    });
  }

  /** Hash compartible (#c=&r=&e=&g=) a partir del estado del build. */
  function buildShareHash(opts) {
    opts = opts || {};
    const p = new URLSearchParams();
    if (opts.myChampion) p.set("c", opts.myChampion);
    if (opts.role) p.set("r", opts.role);
    const enemies = (opts.enemies || []).filter(Boolean);
    if (enemies.length) p.set("e", enemies.join(","));
    const est = normalizeEstado(opts.estado);
    if (est !== "parejo") p.set("g", est);
    const q = p.toString();
    return q ? "#" + q : "";
  }

  /** URL absoluta o relativa + hash de build. */
  function buildShareUrl(base, opts) {
    const root = String(base == null ? "" : base).split("#")[0];
    return root + buildShareHash(opts);
  }

  return {
    recommend, countTraits, buildStyle, getChamp, fmt, pickRunes, pickSpells,
    ESTADOS, normalizeEstado, applyEstado, pickSafetyItem, pickSnowballItem,
    buildShareHash, buildShareUrl, buildEnemyCards, threatLine, findBuildCounter
  };
});
