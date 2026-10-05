/* Datos Wild Rift — ver DATA_SOURCES.md. No inventar ítems. */
window.WR_DATA = {
  roles: [
    { id: "baron", label: "Barón (Top)" },
    { id: "jungle", label: "Jungla" },
    { id: "mid", label: "Mid" },
    { id: "adc", label: "ADC (Dragón)" },
    { id: "support", label: "Soporte" }
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

  /* Traits aproximados (hechos a mano) — 74 de uso frecuente; el resto = neutro */
  traits: {
    "Aatrox": ["AD","curación","tanque"],
    "Ahri": ["AP","control"],
    "Akali": ["AP","asesino"],
    "Alistar": ["tanque","control"],
    "Amumu": ["AP","tanque","control"],
    "Annie": ["AP","control"],
    "Ashe": ["AD","control"],
    "Blitzcrank": ["control","tanque"],
    "Braum": ["tanque","control","escudo"],
    "Caitlyn": ["AD"],
    "Darius": ["AD","curación"],
    "Diana": ["AP","asesino"],
    "Dr. Mundo": ["tanque","curación"],
    "Draven": ["AD"],
    "Ekko": ["AP","asesino"],
    "Evelynn": ["AP","asesino"],
    "Ezreal": ["AD"],
    "Fiora": ["AD","curación"],
    "Galio": ["AP","tanque","control"],
    "Garen": ["AD","tanque"],
    "Graves": ["AD"],
    "Irelia": ["AD"],
    "Janna": ["AP","control","escudo"],
    "Jarvan IV": ["AD","tanque","control"],
    "Jax": ["AD"],
    "Jhin": ["AD"],
    "Jinx": ["AD"],
    "Kai'Sa": ["AD","AP"],
    "Katarina": ["AP","asesino"],
    "Kayn": ["AD","asesino"],
    "Kha'Zix": ["AD","asesino"],
    "Lee Sin": ["AD","control"],
    "Leona": ["tanque","control"],
    "Lucian": ["AD"],
    "Lulu": ["AP","control","escudo"],
    "Lux": ["AP","control","escudo"],
    "Malphite": ["AP","tanque","control"],
    "Master Yi": ["AD","asesino","curación"],
    "Miss Fortune": ["AD"],
    "Mordekaiser": ["AP","tanque"],
    "Morgana": ["AP","control","escudo"],
    "Nami": ["AP","control","curación"],
    "Nasus": ["AD","tanque","curación"],
    "Nautilus": ["tanque","control"],
    "Orianna": ["AP","control","escudo"],
    "Pantheon": ["AD","control"],
    "Pyke": ["AD","asesino","control"],
    "Rakan": ["control","escudo"],
    "Rammus": ["tanque","control"],
    "Renekton": ["AD","tanque","curación"],
    "Riven": ["AD"],
    "Samira": ["AD"],
    "Senna": ["AD","curación"],
    "Seraphine": ["AP","curación","escudo"],
    "Sett": ["AD","tanque"],
    "Shen": ["tanque","escudo"],
    "Sona": ["AP","curación","escudo"],
    "Soraka": ["AP","curación"],
    "Syndra": ["AP","control"],
    "Thresh": ["control","tanque"],
    "Tristana": ["AD"],
    "Twitch": ["AD"],
    "Vayne": ["AD"],
    "Vi": ["AD","control","tanque"],
    "Vladimir": ["AP","curación"],
    "Warwick": ["AD","curación","control"],
    "Xin Zhao": ["AD"],
    "Yasuo": ["AD"],
    "Yone": ["AD"],
    "Yuumi": ["AP","curación","escudo"],
    "Zed": ["AD","asesino"],
    "Ziggs": ["AP"],
    "Zoe": ["AP","control"],
    "Zyra": ["AP","control"]
  },

  /* Ítems verificados (ES-419 wildriftmeta). Solo finished / útiles. */
  items: {
    boots: {
      mercury: { name: "Botas de Mercurio", tag: "RM + tenacidad" },
      steelcaps: { name: "Punteras de Acero", tag: "Armadura vs AD" },
      berserker: { name: "Grebas del Berserker", tag: "Vel. de ataque" },
      ionian: { name: "Botas Jonias de la Lucidez", tag: "Vel. de habilidades" },
      dynamism: { name: "Botas de Dinamismo", tag: "AD + pen. armadura" },
      mana: { name: "Botas de Maná", tag: "AP + pen. mágica" },
      lucidity_up: { name: "Lucidez Carmesí", tag: "Haste mejorada" }
    },
    defensive: {
      fon: { name: "Fuerza de la Naturaleza", tag: "RM vs AP" },
      thornmail: { name: "Cota de Espinas", tag: "Anti-curación + armadura" },
      randuin: { name: "Presagio de Randuin", tag: "Anti-críticos AD" },
      frozen_heart: { name: "Corazón de Hielo", tag: "Reduce vel. ataque" },
      kaenic: { name: "Rookern Kaénico", tag: "Escudo mágico" },
      gargoyle: { name: "Armadura Pétrea", tag: "Escudo activo" },
      zhonya: { name: "Reloj de Arena de Zhonya", tag: "Estasis" },
      banshee: { name: "Velo de la Banshee", tag: "Escudo de hechizo" },
      maw: { name: "Fauces de Malmortius", tag: "RM + salvavidas" },
      ga: { name: "Ángel Guardián", tag: "Revive" },
      mercurial: { name: "Cimitarra Mercurial", tag: "Quita control" },
      edge_night: { name: "Filo de la Noche", tag: "Escudo de hechizo AD" },
      wits_end: { name: "Al Filo de la Cordura", tag: "RM + on-hit" }
    },
    antiheal: {
      morello: { name: "Morellonomicón", tag: "Anti-curación AP" },
      mortal: { name: "Recordatorio Mortal", tag: "Anti-curación AD + pen." },
      chempunk: { name: "Espada Sierra Quimopunk", tag: "Anti-curación AD" }
    },
    pen: {
      void: { name: "Báculo del Vacío", tag: "Pen. mágica %" },
      dominik: { name: "Recuerdos de Lord Dominik", tag: "Pen. armadura vs tanques" },
      serylda: { name: "Rencor de Serylda", tag: "Pen. armadura + ralentizar" },
      black_cleaver: { name: "Cuchilla Oscura", tag: "Reduce armadura" },
      liandry: { name: "Tormento de Liandry", tag: "Quemadura vs tanques" },
      botk: { name: "Espada del Rey Arruinado", tag: "% vida actual" }
    },
    anti_shield: {
      fang: { name: "Colmillo de Serpiente", tag: "Anti-escudos AD" },
      oceanid: { name: "Tridente del Oceánida", tag: "Anti-escudos AP" }
    },
    core_by_role: {
      baron: [
        { name: "Cielo Desgarrado", tag: "Núcleo bruiser" },
        { name: "Cuchilla Oscura", tag: "Núcleo vs armadura" },
        { name: "Guantelete de Sterak", tag: "Supervivencia" }
      ],
      jungle: [
        { name: "Eclipse", tag: "Núcleo jungla AD" },
        { name: "Cielo Desgarrado", tag: "Núcleo combate" },
        { name: "Diente de Nashor", tag: "Núcleo AP on-hit" }
      ],
      mid: [
        { name: "Eco de Luden", tag: "Núcleo burst AP" },
        { name: "Sombrero Mortífero de Rabadon", tag: "Escala AP" },
        { name: "Espada Crepuscular de Draktharr", tag: "Núcleo asesino AD" }
      ],
      adc: [
        { name: "Filo del Infinito", tag: "Núcleo crítico" },
        { name: "La Sanguinaria", tag: "Succión" },
        { name: "Matakrakens", tag: "DPS sostenido" }
      ],
      support: [
        { name: "Relicario de los Solari de Hierro", tag: "Escudo de equipo" },
        { name: "Mandato Imperial", tag: "Utilidad control" },
        { name: "Redención", tag: "Curación de área" }
      ]
    }
  }
};
