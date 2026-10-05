/* Datos Wild Rift — ver DATA_SOURCES.md. No inventar ítems.
 * Nombres ES-419 e íconos: wildriftmeta.com/es-419/items (íconos descargados en assets/items, arte © Riot Games).
 * Traits / tipo de daño / retratos de campeones: champions.js (generado). */
(function (root) {
  const icon = (slug) => "assets/items/" + slug + ".webp";
  const it = (name, slug, tag) => ({ name, tag, icon: icon(slug) });

  root.WR_DATA = {
    roles: [
      { id: "baron", label: "Barón", long: "Barón (Top)" },
      { id: "jungle", label: "Jungla", long: "Jungla" },
      { id: "mid", label: "Mid", long: "Mid" },
      { id: "adc", label: "Dragón", long: "ADC (Dragón)" },
      { id: "support", label: "Soporte", long: "Soporte" }
    ],

    /* 141 campeones — wiki.leagueoflegends.com/en-us/WR:Champion */
    champions: [
      "Aatrox","Ahri","Akali","Akshan","Alistar","Ambessa","Amumu","Annie","Ashe",
      "Aurelion Sol","Aurora","Bard","Blitzcrank","Brand","Braum","Caitlyn","Camille",
      "Cho'Gath","Corki","Darius","Diana","Dr. Mundo","Draven","Ekko","Evelynn","Ezreal",
      "Fiddlesticks","Fiora","Fizz","Galio","Garen","Gnar","Gragas","Graves","Gwen",
      "Hecarim","Heimerdinger","Irelia","Janna","Jarvan IV","Jax","Jayce","Jhin","Jinx",
      "K'Sante","Kai'Sa","Kalista","Karma","Kassadin","Katarina","Kayle","Kayn","Kennen",
      "Kha'Zix","Kindred","Kog'Maw","Lee Sin","Leona","Lillia","Lissandra","Lucian","Lulu",
      "Lux","Malphite","Maokai","Master Yi","Mel","Milio","Miss Fortune","Mordekaiser",
      "Morgana","Nami","Nasus","Nautilus","Nidalee","Nilah","Nocturne","Norra",
      "Nunu & Willump","Olaf","Orianna","Ornn","Pantheon","Poppy","Pyke","Rakan","Rammus",
      "Rell","Renekton","Rengar","Riven","Rumble","Ryze","Samira","Senna","Seraphine",
      "Sett","Shen","Shyvana","Singed","Sion","Sivir","Skarner","Smolder","Sona","Soraka",
      "Swain","Syndra","Taliyah","Talon","Teemo","Thresh","Tristana","Tryndamere",
      "Twisted Fate","Twitch","Urgot","Varus","Vayne","Veigar","Vel'Koz","Vex","Vi",
      "Viego","Viktor","Vladimir","Volibear","Warwick","Wukong","Xayah","Xin Zhao",
      "Yasuo","Yone","Yunara","Yuumi","Zed","Zeri","Ziggs","Zilean","Zoe","Zyra"
    ],

    /* Ítems verificados (ES-419 wildriftmeta). Solo finished / útiles. */
    items: {
      boots: {
        mercury: it("Botas de Mercurio", "mercurys-treads", "RM + tenacidad"),
        steelcaps: it("Punteras de Acero", "plated-steelcaps", "Armadura vs AD"),
        berserker: it("Grebas del Berserker", "berserkers-greaves", "Vel. de ataque"),
        gluttonous: it("Grebas Glotonas", "gluttonous-greaves", "Succión de vida"),
        ionian: it("Botas Jonias de la Lucidez", "ionian-boots-of-lucidity", "Vel. de habilidades"),
        dynamism: it("Botas de Dinamismo", "boots-of-dynamism", "AD + pen. armadura"),
        mana: it("Botas de Maná", "boots-of-mana", "AP + pen. mágica"),
        lucidity_up: it("Lucidez Carmesí", "crimson-lucidity", "Haste mejorada")
      },
      defensive: {
        fon: it("Fuerza de la Naturaleza", "force-of-nature", "RM vs AP"),
        thornmail: it("Cota de Espinas", "thornmail", "Anti-curación + armadura"),
        randuin: it("Presagio de Randuin", "randuins-omen", "Anti-críticos AD"),
        frozen_heart: it("Corazón de Hielo", "frozen-heart", "Reduce vel. ataque"),
        kaenic: it("Rookern Kaénico", "kaenic-rookern", "Escudo mágico"),
        gargoyle: it("Armadura Pétrea", "gargoyle-stoneplate", "Escudo activo"),
        zhonya: it("Reloj de Arena de Zhonya", "zhonyas-hourglass", "Estasis"),
        banshee: it("Velo de la Banshee", "banshees-veil", "Escudo de hechizo"),
        maw: it("Fauces de Malmortius", "maw-of-malmortius", "RM + salvavidas"),
        ga: it("Ángel Guardián", "guardian-angel", "Revive"),
        mercurial: it("Cimitarra Mercurial", "mercurial-scimitar", "Quita control"),
        edge_night: it("Filo de la Noche", "edge-of-night", "Escudo de hechizo AD"),
        wits_end: it("Al Filo de la Cordura", "wits-end", "RM + on-hit"),
        amaranth: it("Protección de Amaranth", "amaranths-twinguard", "Resistencias + salvavidas"),
        deaths_dance: it("Danza de la Muerte", "deaths-dance", "Retrasa daño recibido")
      },
      antiheal: {
        morello: it("Morellonomicón", "morellonomicon", "Anti-curación AP"),
        mortal: it("Recordatorio Mortal", "mortal-reminder", "Anti-curación AD + pen."),
        chempunk: it("Espada Sierra Quimopunk", "chempunk-chainsword", "Anti-curación AD")
      },
      pen: {
        void: it("Báculo del Vacío", "void-staff", "Pen. mágica %"),
        dominik: it("Recuerdos de Lord Dominik", "dominiks-regards", "Pen. armadura vs tanques"),
        serylda: it("Rencor de Serylda", "seryldas-grudge", "Pen. armadura + ralentizar"),
        black_cleaver: it("Cuchilla Oscura", "black-cleaver", "Reduce armadura"),
        liandry: it("Tormento de Liandry", "liandrys-torment", "Quemadura vs tanques"),
        botk: it("Espada del Rey Arruinado", "blade-of-the-ruined-king", "% vida actual")
      },
      anti_shield: {
        fang: it("Colmillo de Serpiente", "serpents-fang", "Anti-escudos AD"),
        oceanid: it("Tridente del Oceánida", "oceanids-trident", "Anti-escudos AP")
      },
      /* Núcleos por estilo de build (orientados por las builds más comunes de wildriftmeta, parche 7.3a).
       * Clave: "<rol>:<estilo>" o "*:<estilo>" como respaldo. */
      core_sets: {
        "*:crit": [
          it("Filo del Infinito", "infinity-edge", "Núcleo crítico"),
          it("La Sanguinaria", "bloodthirster", "Succión + daño"),
          it("Matakrakens", "kraken-slayer", "DPS sostenido")
        ],
        "*:letal": [
          it("Espada Crepuscular de Draktharr", "duskblade-of-draktharr", "Núcleo asesino AD"),
          it("Espada Fantasma de Youmuu", "youmuus-ghostblade", "Letalidad + movilidad"),
          it("Rencor de Serylda", "seryldas-grudge", "Pen. armadura + ralentizar")
        ],
        "baron:luchador": [
          it("Cercenador Divino", "divine-sunderer", "Núcleo bruiser"),
          it("Cuchilla Oscura", "black-cleaver", "Reduce armadura"),
          it("Guantelete de Sterak", "steraks-gage", "Supervivencia")
        ],
        "*:luchador": [
          it("Fuerza de la Trinidad", "trinity-force", "Núcleo combate"),
          it("Eclipse", "eclipse", "Daño + escudo"),
          it("Cuchilla Oscura", "black-cleaver", "Reduce armadura")
        ],
        "baron:AP": [
          it("Creador de Grietas", "riftmaker", "Núcleo AP de combate"),
          it("Tormento de Liandry", "liandrys-torment", "Quemadura en peleas largas"),
          it("Sombrero Mortífero de Rabadon", "rabadons-deathcap", "Escala AP")
        ],
        "jungle:AP": [
          it("Maldición del Liche", "lich-bane", "Burst AP"),
          it("Orbe del Infinito", "infinity-orb", "AP + pen. mágica"),
          it("Sombrero Mortífero de Rabadon", "rabadons-deathcap", "Escala AP")
        ],
        "*:AP": [
          it("Orbe del Infinito", "infinity-orb", "AP + pen. mágica"),
          it("Eco de Luden", "ludens-echo", "Burst AP"),
          it("Sombrero Mortífero de Rabadon", "rabadons-deathcap", "Escala AP")
        ],
        "support:AP": [
          it("Hoz de Niebla Negra", "black-mist-scythe", "Objeto de soporte"),
          it("Tormento de Liandry", "liandrys-torment", "Daño sostenido"),
          it("Sombrero Mortífero de Rabadon", "rabadons-deathcap", "Escala AP")
        ],
        "*:encantador": [
          it("Eco armónico", "harmonic-echo", "Curación a aliados"),
          it("Pebetero Ardiente", "ardent-censer", "Potencia a tu carry"),
          it("Redención", "redeeming", "Curación de área")
        ],
        "support:tanque": [
          it("Baluarte de la Montaña", "bulwark-of-the-mountain", "Objeto de soporte"),
          it("Relicario de los Solari de Hierro", "locket-of-the-iron-solari", "Escudo de equipo"),
          it("Promesa del Caballero", "knights-vow", "Protege a tu carry")
        ],
        "*:tanque": [
          it("Égida de Fuego Solar", "sunfire-aegis", "Núcleo tanque"),
          it("Corazón de acero", "heartsteel", "Vida que escala"),
          it("Desesperación Eterna", "unending-despair", "Aguante en peleas")
        ]
      }
    },

    /* Runas Wild Rift (ES-419 wildriftmeta / WR Wiki). Estructura usada: 1 clave + 3 menores. */
    runes: (() => {
      const icon = (slug) => "assets/runes/" + slug + ".webp";
      const k = (name, slug, tag) => ({ name, slug, tag, kind: "keystone", icon: icon(slug) });
      const m = (name, slug, path, tag) => ({ name, slug, path, tag, kind: "minor", icon: icon(slug) });
      return {
        keystones: {
          electrocute: k("Electrocutar", "electrocute", "Ráfaga adaptable"),
          dark_harvest: k("Cosecha oscura", "dark-harvest", "Daño a poca vida"),
          empowerment: k("Potenciación", "empowerment", "Daño sostenido en básicos"),
          lethal_tempo: k("Cadencia Letal", "lethal-tempo", "Vel. de ataque acumulable"),
          fleet_footwork: k("Pies veloces", "fleet-footwork", "Curación + movilidad"),
          conqueror: k("Conquistador", "conqueror", "Daño adaptable + omnivampirismo"),
          grasp: k("Garras del Inmortal", "grasp-of-undying", "Vida y daño en combate"),
          guardian: k("Protector", "guardian", "Escudo a ti y a un aliado"),
          aery: k("Aery", "aery", "Daño o escudo de apoyo"),
          arcane_comet: k("Cometa Arcano", "arcane-comet", "Cometa al acertar habilidad"),
          phase_rush: k("Fase Veloz", "phase-rush", "Velocidad tras combo"),
          first_strike: k("Primer golpe", "first-strike", "Oro y daño al pegar primero"),
          ice_overlord: k("Señor del Hielo", "ice-overlord", "Engage con control")
        },
        minors: {
          brutal: m("Brutal", "brutal", "precision", "Daño extra en ataques"),
          triumph: m("Triunfo", "triumph", "precision", "Curación al derribar"),
          battle_zeal: m("Celo de Batalla", "battle-zeal", "precision", "Daño de habilidades básicas"),
          last_stand: m("Última Batalla", "last-stand", "precision", "Más daño a poca vida"),
          cut_down: m("Corte", "cut-down", "precision", "Más daño vs mucha vida"),
          coup_de_grace: m("Golpe de gracia", "coup-de-grace", "precision", "Más daño a heridos"),
          legend_alacrity: m("Leyenda: Presteza", "legend-alacrity", "precision", "Vel. de ataque por derribos"),
          legend_tenacity: m("Leyenda: Aceleración", "legend-tenacity", "precision", "Aceleración de habilidades"),
          legend_bloodline: m("Leyenda: Linaje", "legend-bloodline", "precision", "Omnivampirismo por derribos"),
          cheap_shot: m("Golpe bajo", "cheap-shot", "domination", "Daño verdadero con CC"),
          sudden_impact: m("Impacto Súbito", "sudden-impact", "domination", "Daño tras dash/sigilo"),
          empowered_attack: m("Ataque potenciado", "empowered-attack", "domination", "Ataque reforzado periódico"),
          chain_assault: m("Asalto Encadenado", "chain-assault", "domination", "Daño tras habilidad"),
          tyrant: m("Tirano", "tyrant", "domination", "Daño a poca vida"),
          hubris: m("Soberbia", "hubris", "domination", "Poder temporal al eliminar"),
          eyeball: m("Colección de ojos", "eyeball-collection", "domination", "Fuerza adaptable por derribos"),
          relentless: m("Cazador Implacable", "relentless-hunter", "domination", "MS fuera de combate"),
          zombie_ward: m("Centinela Zombi", "zombie-ward", "domination", "Centinelas + fuerza"),
          demolish: m("Demolición", "demolish", "resolve", "Daño a torres"),
          font_of_life: m("Fuente de vida", "font-of-life", "resolve", "Cura a aliados"),
          courage: m("Coraje del coloso", "courage-of-the-colossus", "resolve", "Escudo al inmovilizar"),
          unshakeable: m("Inquebrantable", "unshakeable", "resolve", "Tenacidad y resistencias"),
          second_wind: m("Segundo Aire", "second-wind", "resolve", "Regeneración tras daño"),
          nullifying_orb: m("Orbe Anulador", "nullifying-orb", "resolve", "Escudo a poca vida"),
          bone_plating: m("Revestimiento de Huesos", "bone-plating", "resolve", "Mitiga ráfaga"),
          overgrowth: m("Sobrecrecimiento", "overgrowth", "resolve", "Vida máxima"),
          revitalize: m("Revitalizar", "revitalize", "resolve", "Curaciones y escudos más fuertes"),
          perseverance: m("Perseverancia", "perseverance", "resolve", "Tenacidad / resistencias con CC"),
          axiom: m("Arcanista de Axioma", "axiom-arcanist", "sorcery", "Definitiva más fuerte"),
          manaflow: m("Banda de Maná", "manaflow-band", "sorcery", "Maná que escala"),
          botanist: m("Botánica", "botanist", "sorcery", "Plantas dan oro"),
          hexflash: m("Destello Hextech", "hextech-flashtraption", "sorcery", "Segundo Destello"),
          transcendence: m("Trascendencia", "transcendence", "sorcery", "Aceleración de habilidades"),
          celerity: m("Celeridad", "celerity", "sorcery", "Más provecho de MS"),
          absolute_focus: m("Concentración Absoluta", "absolute-focus", "sorcery", "Daño con vida alta"),
          scorch: m("Piroláser", "scorch", "sorcery", "Quemadura con habilidades"),
          nimbus: m("Manto del Nimbus", "nimbus-cloak", "sorcery", "Sprint tras hechizo"),
          gathering_storm: m("Tormenta creciente", "gathering-storm", "sorcery", "Daño que escala con el tiempo"),
          seedjar: m("Semillero de Ixtal", "ixtali-seedjar", "sorcery", "Replantar semillas")
        }
      };
    })(),

    /* Hechizos de invocador (ES-419 wildriftmeta / soporte oficial Riot). */
    spells: (() => {
      const icon = (slug) => "assets/spells/" + slug + ".webp";
      const s = (name, slug, tag) => ({ name, slug, tag, icon: icon(slug) });
      return {
        flash: s("Destello", "flash", "Teletransporte corto"),
        ignite: s("Ignición", "ignite", "Daño verdadero + heridas graves"),
        smite: s("Castigo", "smite", "Daño a monstruos / objetivos"),
        exhaust: s("Extenuación", "exhaust", "Reduce daño y MS enemigo"),
        barrier: s("Barrera", "barrier", "Escudo temporal"),
        heal: s("Curación", "heal", "Cura a ti y a un aliado"),
        ghost: s("Fantasma", "ghost", "Velocidad de movimiento"),
        cleanse: s("Purificar", "cleanse", "Quita control de masas"),
        teleport: s("Teleportación", "teleport", "Viaje a aliado/estructura")
      };
    })()
  };
})(typeof window !== "undefined" ? window : globalThis);
