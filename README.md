# Wild Rift MX — Ayuda de builds

Sitio estático (HTML/CSS/JS) en español (México): eliges tu campeón (rejilla de retratos con búsqueda y filtro por clase),
tu rol y 5 enemigos, y recibes un build en orden de compra (botas, núcleo y situacionales) con íconos y una razón corta
ligada al equipo rival. La selección se guarda en la URL (`#c=…&r=…&e=…`) para compartirla.

**Beta.** Builds aproximados. Proyecto de fans **no afiliado a Riot Games**. El arte de campeones e ítems pertenece a Riot Games.

## Demo

GitHub Pages: https://chicas16.github.io/wildrift-mx/

## Desarrollo

Abre `index.html` o sirve la carpeta (`python3 -m http.server`). Pruebas del motor:

```bash
node test-rules.js
```

Regenerar `champions.js` (traits de los 141 campeones):

```bash
python3 tools/build_champions.py tools/sources/wiki_champion_data.json tools/sources/wildriftmeta_builds.json tools/sources/asset_map.json
```

## Archivos

- `data.js` — roles, lista de campeones, ítems (nombres ES-419 + íconos) y núcleos por estilo.
- `champions.js` — tipo de daño, traits, clase, roles y retrato de cada campeón (generado).
- `rules.js` — motor de reglas (Node y navegador).
- `app.js`, `index.html`, `styles.css` — interfaz.
- `assets/` — retratos e íconos descargados (WebP).

## Datos

Ver [DATA_SOURCES.md](./DATA_SOURCES.md).
