# Fuentes de datos — Wild Rift MX (beta)

Proyecto de fans, no afiliado a Riot Games. Los builds son aproximados.
El arte de campeones e ítems pertenece a Riot Games. No se usan logos de Riot.

## Campeones

- Lista completa (141 campeones): [WR:Champion — League of Legends Wiki](https://wiki.leagueoflegends.com/en-us/WR:Champion) (consultado 2026-10-05).
- Clase, subclase, tipo adaptativo (físico/mágico), ratings (daño/dureza/utilidad) y posiciones:
  [Module:ChampionDataWR/data](https://wiki.leagueoflegends.com/en-us/Module:ChampionDataWR/data) de la WR Wiki
  (la misma fuente que alimenta el recuadro de cada página `WR:<Campeón>`).
- Referencia cruzada de builds por rol: [wildriftmeta.com/champions](https://www.wildriftmeta.com/champions/) (parche 7.3a, consultado 2026-10-05).
- Referencia adicional: [sitio oficial Wild Rift — Champions](https://wildrift.leagueoflegends.com/en-us/champions/).

## Traits de campeones (los 141, aproximado)

Desde esta versión **los 141 campeones** tienen tipo de daño y traits en `champions.js`
(generado con `tools/build_champions.py` a partir de los JSON en `tools/sources/`). Siguen siendo **aproximados**:
resumen el estilo típico del campeón, no cada build posible.

- **Tipo de daño (`AP` / `AD` / `mixto`)**: se toma la mayoría de ítems con Poder de Habilidad vs Daño de Ataque en las
  builds finales de wildriftmeta para ese campeón; si su build es solo de tanque, se usa el tipo adaptativo de la WR Wiki.
  Discrepancias wiki vs builds resueltas a favor de las builds: Akali (AP), Gwen (AP), Smolder (AD).
  Excepciones documentadas: Kai'Sa y Kayle = `mixto` (builds AP y AD viables); Leona, Thresh, Nunu & Willump y Rammus = `AP`
  (la wiki los marca "Physical", pero sus habilidades hacen daño mágico). En el conteo, `mixto` vale 0,5 AP + 0,5 AD.
- **tanque**: dureza 3/3 en la WR Wiki (excepto tiradores) **o** su build en wildriftmeta es mayoritariamente defensiva.
- **asesino**: subclase "Assassin" en la WR Wiki o clase principal "Assassin" (+ Kayn por su forma de asesino).
- **control**, **curación**, **escudo**: lista curada a mano (en `tools/build_champions.py`) con este criterio:
  - control = 2 o más controles duros (aturdir, lanzar por los aires, enraizar, encantar, miedo, suprimir, provocar, dormir)
    o una definitiva de control que decide peleas; incluye todas las subclases Vanguard/Warden/Catcher de la wiki.
  - curación = la curación/robo de vida es central en su kit (no solo por ítems).
  - escudo = sus escudos son centrales en su kit (para decidir Colmillo de Serpiente / Tridente del Oceánida).
- Correcciones a errores evidentes del módulo de la wiki (campos vacíos o con erratas) están en `FIX` dentro del script
  (p. ej. Nocturne aparecía como "Tank/Mage").
- También se guarda por campeón: clase (para filtrar en la UI), roles típicos (para sugerir rol) y estilo de build por rol
  (AP / AD / tanque, crítico, encantador) para elegir el núcleo.

Conteo actual: AD 71 · AP 68 · mixto 2 · tanque 34 · control 58 · curación 25 · asesino 19 · escudo 17.

## Objetos (nombres Wild Rift, no PC LoL)

- Catálogo EN: [wildriftmeta.com/items](https://www.wildriftmeta.com/items/)
- Catálogo ES-419: [wildriftmeta.com/es-419/items](https://www.wildriftmeta.com/es-419/items/)
- Verificación adicional: [wr-meta.com/items](https://wr-meta.com/items/), [wildriftes.com/objetos](https://wildriftes.com/objetos)

Solo se usan ítems que aparecen en esas listas (58 ítems). Los núcleos por estilo (crítico, letalidad, luchador, AP,
encantador, tanque, soporte) se eligieron a partir de los ítems más frecuentes en las builds de wildriftmeta (parche 7.3a).

## Imágenes

Descargadas al repo (`assets/`) para no depender de enlaces externos; redimensionadas y comprimidas a WebP.

- **Retratos de campeones (141/141)**: archivos `<Campeón>_OriginalSquare_WR.png` de la
  [WR Wiki](https://wiki.leagueoflegends.com/en-us/WR:Champion) → `assets/champions/<slug>.webp` (80×80).
- **Íconos de ítems (58/58)**: `/assets/item/icon/item-<slug>-icon.png` de
  [wildriftmeta.com](https://www.wildriftmeta.com/es-419/items/) → `assets/items/<slug>.webp` (64×64).
- Total ≈ 350 KB. Si una imagen falta o no carga, la UI muestra las iniciales.
- Mapa nombre → archivo → URL de origen: `tools/sources/asset_map.json`.

Arte © Riot Games. League of Legends: Wild Rift © Riot Games. Uso no comercial de fans.

## Motor de reglas

Simple y explicable (`rules.js`):
1. Se cuenta el equipo enemigo: daño AP/AD, tanques, curación, control, asesinos, escudos.
2. Se decide el **estilo de tu campeón en ese rol** (tanque, AP, encantador, crítico, letalidad o luchador).
3. Botas: según control/daño enemigo; si no hay una amenaza clara, las típicas del estilo.
4. Núcleo: 3 ítems del estilo; contra 2+ tanques el tercero se cambia por penetración.
5. Situacionales: cada candidato tiene un puntaje = cuántos enemigos lo justifican; se muestran los mejores.
6. Orden de compra mostrado: núcleo 1 → botas → núcleo 2 → núcleo 3 → 2 situacionales.
