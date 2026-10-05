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
      order
    };
  }

  return { recommend, countTraits, buildStyle, getChamp, fmt };
});
