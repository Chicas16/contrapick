/**
 * Motor de reglas Wild Rift MX — explicable y sin inventar ítems.
 * Contable en Node (require) o en el navegador (window.WR_RULES).
 */
(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = factory();
  } else {
    root.WR_RULES = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  function getTraits(data, name) {
    return (data.traits && data.traits[name]) || [];
  }

  function countTraits(data, enemies) {
    const counts = {
      AP: 0, AD: 0, tanque: 0, curacion: 0, control: 0, asesino: 0, escudo: 0, tagged: 0, neutral: 0
    };
    enemies.forEach((name) => {
      const t = getTraits(data, name);
      if (!t.length) {
        counts.neutral += 1;
        return;
      }
      counts.tagged += 1;
      t.forEach((tag) => {
        if (tag === "curación") counts.curacion += 1;
        else if (counts[tag] !== undefined) counts[tag] += 1;
      });
    });
    return counts;
  }

  /** Roles tipicamente AP vs AD para elegir anti-heal / pen. */
  function roleDamageType(role) {
    if (role === "mid" || role === "support") return "AP";
    return "AD";
  }

  function pickBoots(I, c, role) {
    // Prioridad: mucho control → Mercurio; mucho AD → Punteras; mucho AP → Mercurio;
    // ADC → Berserker; mid AP → Maná; jungla/barón AD → Dinamismo; soporte → Jonias
    if (c.control >= 3) {
      return {
        item: I.boots.mercury,
        reason: "Hay mucho control en el enemigo: tenacidad de Botas de Mercurio."
      };
    }
    if (c.AD >= 3 && c.AP < 2) {
      return {
        item: I.boots.steelcaps,
        reason: "Mucho daño físico enemigo: Punteras de Acero reducen el impacto de autos."
      };
    }
    if (c.AP >= 3) {
      return {
        item: I.boots.mercury,
        reason: "Composición enemiga cargada de AP: Botas de Mercurio dan RM y tenacidad."
      };
    }
    if (role === "adc") {
      return {
        item: I.boots.berserker,
        reason: "Rol ADC: Grebas del Berserker para velocidad de ataque."
      };
    }
    if (role === "mid") {
      return {
        item: I.boots.mana,
        reason: "Rol Mid: Botas de Maná aportan AP y penetración mágica."
      };
    }
    if (role === "support") {
      return {
        item: I.boots.ionian,
        reason: "Rol Soporte: Botas Jonias para más velocidad de habilidades."
      };
    }
    if (role === "jungle" || role === "baron") {
      return {
        item: I.boots.dynamism,
        reason: "Rol Barón/Jungla AD: Botas de Dinamismo con pen. de armadura."
      };
    }
    return {
      item: I.boots.ionian,
      reason: "Opción general: Botas Jonias de la Lucidez."
    };
  }

  function pickCore(I, role, c, dmgType) {
    const base = (I.core_by_role[role] || I.core_by_role.mid).slice(0, 2);
    const out = base.map((it, idx) => ({
      item: it,
      reason: idx === 0
        ? "Núcleo típico del rol (punto de partida del build)."
        : "Segundo núcleo habitual para escalar poder."
    }));

    // Sustituir/añadir según enemigo
    if (c.tanque >= 2 && dmgType === "AD") {
      out[1] = {
        item: I.pen.black_cleaver,
        reason: "Hay varios tanques: Cuchilla Oscura reduce su armadura."
      };
    }
    if (c.tanque >= 2 && dmgType === "AP") {
      out[1] = {
        item: I.pen.liandry,
        reason: "Hay varios tanques: Tormento de Liandry quema vida máxima."
      };
    }
    if (c.curacion >= 2 && dmgType === "AP") {
      out.push({
        item: I.antiheal.morello,
        reason: "Varios curadores/sustain: Morellonomicón aplica heridas graves."
      });
    }
    if (c.curacion >= 2 && dmgType === "AD") {
      out.push({
        item: role === "adc" ? I.antiheal.mortal : I.antiheal.chempunk,
        reason: role === "adc"
          ? "Curación enemiga alta: Recordatorio Mortal (anti-heal + pen.)."
          : "Curación enemiga alta: Espada Sierra Quimopunk aplica heridas graves."
      });
    }
    return out.slice(0, 3);
  }

  function pickSituational(I, role, c, dmgType) {
    const sit = [];
    const push = (item, reason) => {
      if (sit.length >= 4) return;
      if (sit.some((s) => s.item.name === item.name)) return;
      sit.push({ item, reason });
    };

    if (c.curacion >= 2) {
      if (dmgType === "AP") push(I.antiheal.morello, "Anti-curación mágica contra healers/sustain.");
      else push(I.antiheal.mortal, "Anti-curación física contra healers/sustain.");
      if (c.AD >= 2) push(I.defensive.thornmail, "Cota de Espinas: armadura + heridas graves al ser atacado.");
    }
    if (c.AP >= 3) {
      if (dmgType === "AD") push(I.defensive.maw, "Mucho AP enemigo: Fauces de Malmortius (salvavidas mágico).");
      else push(I.defensive.banshee, "Mucho AP enemigo: Velo de la Banshee bloquea una habilidad.");
      push(I.defensive.fon, "Fuerza de la Naturaleza escala RM contra magos.");
    }
    if (c.AD >= 3) {
      push(I.defensive.randuin, "Mucho AD/crítico: Presagio de Randuin mitiga críticos.");
      push(I.defensive.frozen_heart, "Corazón de Hielo baja la velocidad de ataque enemiga.");
    }
    if (c.tanque >= 2) {
      if (dmgType === "AD") {
        push(I.pen.dominik, "Tanques: Recuerdos de Lord Dominik (pen. % + daño vs vida).");
        push(I.pen.serylda, "Alternativa: Rencor de Serylda (pen. + ralentizar).");
        push(I.pen.botk, "Espada del Rey Arruinado pega % de vida actual.");
      } else {
        push(I.pen.void, "Tanques: Báculo del Vacío para pen. mágica %.");
        push(I.pen.liandry, "Liandry quema tanques en peleas largas.");
      }
    }
    if (c.control >= 3) {
      if (dmgType === "AD") push(I.defensive.mercurial, "Mucho CC: Cimitarra Mercurial limpia control.");
      else push(I.defensive.zhonya, "Mucho CC/burst: Reloj de Arena de Zhonya para estasis.");
    }
    if (c.asesino >= 2) {
      push(I.defensive.ga, "Asesinos enemigos: Ángel Guardián da una segunda vida.");
      if (role === "mid" || role === "adc") {
        push(dmgType === "AP" ? I.defensive.zhonya : I.defensive.edge_night,
          dmgType === "AP"
            ? "Vs asesinos: Zhonya para negar el burst."
            : "Vs asesinos: Filo de la Noche bloquea una habilidad clave.");
      }
    }
    if (c.escudo >= 2) {
      if (dmgType === "AD") push(I.anti_shield.fang, "Muchos escudos: Colmillo de Serpiente.");
      else push(I.anti_shield.oceanid, "Muchos escudos: Tridente del Oceánida.");
    }

    // Relleno sensato si faltan
    if (sit.length < 2) {
      if (role === "adc") push(I.defensive.ga, "Situacional de supervivencia para ADC.");
      else if (role === "support") push(I.defensive.gargoyle, "Armadura Pétrea para aguantar engage.");
      else push(I.defensive.ga, "Ángel Guardián como seguro en teamfights.");
    }
    return sit.slice(0, 4);
  }

  function recommend(data, opts) {
    const { role, myChampion, enemies } = opts;
    if (!role || !myChampion || !enemies || enemies.length !== 5) {
      throw new Error("Se requieren rol, tu campeón y exactamente 5 enemigos.");
    }
    const uniq = new Set(enemies);
    if (uniq.size !== 5) throw new Error("Los 5 enemigos deben ser distintos.");
    if (enemies.includes(myChampion)) {
      // permitido en teoría (espejo), no bloqueamos
    }

    const I = data.items;
    const c = countTraits(data, enemies);
    const dmgType = roleDamageType(role);
    const boots = pickBoots(I, c, role);
    const core = pickCore(I, role, c, dmgType);
    const situational = pickSituational(I, role, c, dmgType).filter((s) => {
      // evitar duplicar ítems ya en core/boots
      const names = new Set([boots.item.name, ...core.map((x) => x.item.name)]);
      return !names.has(s.item.name);
    });

    const summaryParts = [];
    if (c.AP >= 2) summaryParts.push(`${c.AP} con AP`);
    if (c.AD >= 2) summaryParts.push(`${c.AD} con AD`);
    if (c.tanque >= 2) summaryParts.push(`${c.tanque} tanques`);
    if (c.curacion >= 2) summaryParts.push(`${c.curacion} con curación`);
    if (c.control >= 2) summaryParts.push(`${c.control} con control`);
    if (c.asesino >= 2) summaryParts.push(`${c.asesino} asesinos`);
    if (c.escudo >= 2) summaryParts.push(`${c.escudo} con escudos`);
    if (c.neutral) summaryParts.push(`${c.neutral} sin traits (neutros)`);

    return {
      myChampion,
      role,
      enemies: enemies.slice(),
      traitCounts: c,
      summary: summaryParts.length
        ? "Lectura del enemigo: " + summaryParts.join(", ") + "."
        : "Enemigo sin traits fuertes etiquetados; build base del rol.",
      boots,
      core,
      situational
    };
  }

  return { recommend, countTraits, getTraits };
});
