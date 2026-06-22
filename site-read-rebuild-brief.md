# Site Read — Rebuild Brief & Architecture Decision Record

**Date:** 2026-06-19
**Subject:** `site-analysis.html` → "Site Read" v2
**Status:** Ready for implementation (hand to Claude Code)

---

## 1. Context

`site-analysis.html` is a working, single-file prototype: an address search that returns a desk-based due-diligence report for any Australian site — zoning, FSR, height, lot size, heritage, bushfire/flood/landslide overlays, cadastre, Wikipedia-sourced site history, a hand-rolled sun-path diagram, a Leaflet landmarks map, and an auto-generated opportunities/constraints list. Full regulatory lookups currently only work for NSW (NSW Spatial Services ArcGIS layers); other states get generic planning links.

It runs entirely client-side: no backend, no build step, no API keys, no database. All data comes from live public fetch() calls to government and open-data endpoints at request time.

This brief covers the v2 rebuild: closing three data gaps (named heritage items, native flora, real climate data), consolidating the map stack, and re-skinning the UI to the Cohere-derived design system (`DESIGN-cohere.md`) rather than the current ad-hoc Inter/blue-accent look. It is written as an ADR so the reasoning behind each decision is traceable, plus a concrete action list a coding agent can execute directly.

**Hard constraint:** total *additional* operating cost must stay under $2 (ideally $0). No new paid APIs, no API-key-gated tiers, no server infrastructure.

---

## 2. User & Workflow (unchanged)

A user — architecture student, designer, or anyone doing early desk-based site research — types an address, hits "Analyse site," and gets:

1. Geocode → overview chips (state, council, lot/DP, heritage flag, hazard flag)
2. Site map with sun-path overlay (today / solstices / equinox)
3. Council & government links
4. Nearby landmarks map (toggle: landmarks / heritage areas / hazard areas)
5. Accordion detail: site history, heritage, regulatory controls, hazards, climate & sun, opportunities & constraints

v2 adds two new accordions (named heritage items, flora & fauna nearby) and replaces the climate heuristic with live data. The workflow itself does not change — this is a data and visual upgrade, not a UX rethink.

---

## 3. Architecture Decisions

### ADR-1: Keep the runtime model — static, client-side, zero backend

**Decision:** Stay single-file (or split into `index.html` / `style.css` / `app.js` if the file gets unwieldy) static HTML/CSS/JS. No framework, no build step, no server.

**Why:** Every data source in this brief is free and CORS-permitting for direct browser fetch. A backend would add hosting cost and complexity for zero functional benefit, and risks breaking the $2 cap. Deployability stays trivial — GitHub Pages, Cloudflare Pages, or Netlify's free tiers all serve static files at $0.

**Consequence:** API keys can never be used (anything requiring a key is visible in client JS). This is already true of the current prototype and rules out a couple of "nicer" options below — that's an acceptable trade for $0 cost.

### ADR-2: Consolidate the map stack onto a single Leaflet instance

**Decision:** Replace the Google Maps `<iframe>` embed in the "Site & sun path" panel with the same Leaflet map technology already used for the landmarks panel. Layer the sun-path SVG as a Leaflet pane/overlay on top of that map instead of an absolutely-positioned `<div>` over an unrelated iframe.

**Why:** The current build runs two different mapping technologies for two panels that are conceptually the same map at different zoom levels and purposes. The Google embed is keyless but undocumented/rate-limited for production use, doesn't match the new monochrome visual language, and can't be styled. One map engine means one basemap style, one set of overlay primitives (polygons for heritage/hazard, markers for landmarks/flora), and less code to maintain.

**Basemap tile choice:** default OpenStreetMap raster tiles (already used for the landmarks map) are saturated — green parks, yellow main roads — and clash with the Cohere near-monochrome system. Recommend switching to **CartoDB Positron** light tiles (`{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png`), which are free, keyless, and intentionally desaturated. This is a lower-confidence pick than the three data sources below (Carto's free-tier usage limits aren't independently re-verified here) — flag it for a quick live check, but it's a drop-in tile URL swap with no other code impact, so the risk is low and reversible.

**Consequence:** the sun-path SVG math (`solarPosition`, `sunPathPoints`, `buildSunPathSVG`) is reused as-is, just rendered into a Leaflet overlay pane positioned over the map's pixel bounds instead of a standalone div.

### ADR-3: Add named heritage items via the NSW Heritage MapServer (separate from the existing LEP layer)

**Decision:** Query `https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/HMS/Heritage/MapServer`, layer **5** (State Heritage Register, point geometry) for on-site/nearby named items, and layer **6** (State Heritage Register, polygon) for the landmarks-map overlay. Keep the existing `EP.heritage` layer (`EPI_Primary_Planning_Layers/MapServer/0`) as-is — it reports the *LEP heritage class/area* a site sits in, not the name of an individual listed item, and the two are complementary, not redundant.

**Why:** This was the explicit gap — the current heritage accordion can say "this site is in a heritage conservation area" but never the actual item name (e.g. "Former Mortuary Station" or a listed terrace). Layer 5 carries item-level attributes (name, significance, listing date) the LEP layer doesn't. Confirmed live and keyless:

```
GET https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/HMS/Heritage/MapServer?f=json
→ 200 OK, layer 5 "State Heritage Register" (point), layer 6 "State Heritage Register" (polygon)
```

Query pattern matches the existing `arcgisQuery()` helper exactly (same ArcGIS REST `/query` shape, `inSR:4283`, point + distance buffer) — no new fetch logic needed, just a new `EP` entry and a render function.

**Consequence:** none — this is additive and reuses existing helpers.

### ADR-4: Add native flora/fauna context via the Atlas of Living Australia

**Decision:** Query `https://api.ala.org.au/occurrences/occurrences/search?lat={lat}&lon={lon}&radius={km}&pageSize=20` (no auth — the majority of ALA endpoints are open). Filter client-side to `kingdom === 'Plantae'` for the flora-specific list; surface fauna separately or omit per design call.

**Why & verification:** Confirmed live and keyless against a real point (Sydney CBD, 2 km radius → 177,773 total records, real specimen/observation data with scientific names, vernacular names, and herbarium/BirdLife source attribution). This is real biodiversity-database occurrence data, not a curated flora survey — **the accordion copy must say so explicitly** ("species recorded near this site by museums, herbaria and citizen-science projects — not a site flora survey") to avoid implying ecological-assessment-grade accuracy.

**Consequence:** Occurrence density varies wildly by location (dense in inner Sydney, sparse in regional areas) — design the empty state for "no records nearby" rather than assuming every search returns results.

### ADR-5: Replace the climate heuristic with live Open-Meteo data

**Decision:** Replace `classifyClimate(lat)` (a five-bucket latitude guess) with a real call to Open-Meteo:

```
GET https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}
    &daily=precipitation_sum,wind_speed_10m_max,wind_direction_10m_dominant,sunshine_duration,uv_index_max
    &timezone=Australia/Sydney
```

(or the historical archive endpoint at `archive-api.open-meteo.com/v1/archive` for a multi-year seasonal average, if a single 7–16 day forecast snapshot feels too point-in-time for "indicative climate").

**Why:** The current function is a hardcoded latitude-band guess with no real wind, rain, or sun data at all — it's the weakest part of the existing report. Open-Meteo is free with **no API key**, JSON over plain HTTP GET, and the free non-commercial tier covers up to 10,000 calls/day — effectively unlimited for this use case. It directly answers the brief's "wind, rain, sun" ask: `wind_speed_10m_max` / `wind_direction_10m_dominant` for prevailing wind, `precipitation_sum` for rain, `sunshine_duration` and `uv_index_max` for sun.

**Consequence:** decide forecast vs. historical-average framing before implementation — a 16-day forecast is *current weather*, not *climate*. Recommend the historical archive averaged over the last 5–10 years for the stated daily variables, presented as "typical" figures, which is a more honest replacement for the old heuristic's "typical summer/winter" framing.

---

## 4. Confirmed Data Source Catalog

| Source | Endpoint | Auth | Cost | Status | Used for |
|---|---|---|---|---|---|
| NSW Planning ArcGIS (existing) | `mapprod3.environment.nsw.gov.au/.../EPI_Primary_Planning_Layers/MapServer` | None | Free | In use | Zoning, FSR, height, lot size, LEP heritage area |
| NSW Hazard ArcGIS (existing) | `mapprod3.environment.nsw.gov.au/.../Fire/BFPL`, `.../Hazard/MapServer` | None | Free | In use | Bushfire, flood, landslide |
| NSW Cadastre/Admin (existing) | `maps.six.nsw.gov.au/.../NSW_Cadastre`, `NSW_Administrative_Boundaries` | None | Free | In use | Lot/DP, LGA/council |
| **NSW Heritage MapServer (new)** | `mapprod3.environment.nsw.gov.au/.../HMS/Heritage/MapServer` (layers 5, 6) | None | Free | **Verified live, this session** | Named State Heritage Register items |
| **Atlas of Living Australia (new)** | `api.ala.org.au/occurrences/occurrences/search` | None for read | Free | **Verified live, this session** | Native flora/fauna occurrence records near point |
| **Open-Meteo (new)** | `api.open-meteo.com/v1/forecast`, `archive-api.open-meteo.com/v1/archive` | None | Free, ≤10,000 calls/day | **Verified via official docs** | Wind, rain, sun, UV |
| Nominatim (existing) | `nominatim.openstreetmap.org/search` | None | Free | In use | Geocoding |
| Wikipedia REST/API (existing) | `en.wikipedia.org/api/rest_v1`, `/w/api.php` | None | Free | In use | Site history, nearby landmarks |
| CartoDB Positron tiles (new, basemap) | `*.basemaps.cartocdn.com/light_all/...` | None | Free | Recommended, spot-check before relying at volume | Monochrome basemap for unified Leaflet map |

---

## 5. Cost Analysis vs. the $2 Cap

Every data source above — existing and new — is free and keyless. There is no metered API in this stack; the only theoretical cost is hosting, and every realistic static host (GitHub Pages, Cloudflare Pages, Netlify free tier) covers this at $0. Projected ongoing cost: **$0/month**, comfortably under the $2 cap with no near-term risk of crossing it even under heavy personal testing volume (Open-Meteo's 10,000-call/day ceiling alone is far beyond what manual testing or a small personal tool will hit).

The only cost-relevant judgment call is the Carto basemap tile usage policy, which is why ADR-2 flags it as "verify, don't assume" rather than fully confirmed — if it ever turned out to need a key or paid tier, the fallback is simply reverting to the existing free OSM raster tiles with no other architectural change.

---

## 6. Feature-Parity Checklist

Everything in the current prototype must survive the rebuild unless explicitly superseded below.

**Carry over unchanged:**
- [ ] Address search → Nominatim geocode → AU-only results
- [ ] Overview chips: state, council, lot/DP, heritage flag, hazard flag
- [ ] Council & government links panel (state-specific + national + NSW LGA directory)
- [ ] Sun-path SVG: solar position math, summer/winter/equinox arcs, live "now" marker, date selector
- [ ] Nearby landmarks map: Wikipedia geosearch markers, toggle layers
- [ ] Regulatory accordion: zoning, FSR, height, lot size (NSW)
- [ ] Hazards accordion: bushfire, flood, landslide, with graceful per-layer failure messaging
- [ ] Site history accordion: Wikipedia summary + Trove fallback link
- [ ] Opportunities & constraints auto-generated list with filter
- [ ] Graceful non-NSW fallback (state-level links only)
- [ ] Skeleton/loading states, error handling per the existing `safe()`/`safeStatus()` pattern

**Superseded / upgraded:**
- [ ] Heritage accordion gains named items (ADR-3) — old behaviour (LEP class/area only) becomes a sub-section, not a replacement
- [ ] Climate accordion replaced with live Open-Meteo data (ADR-5) — drop `classifyClimate()`'s heuristic bands entirely
- [ ] Site map panel's Google iframe replaced by the unified Leaflet map (ADR-2)

**New:**
- [ ] Flora & fauna nearby accordion (ADR-4), with explicit "occurrence records, not a survey" caveat
- [ ] Heritage landmarks-map layer extended to show named SHR points/polygons distinctly from LEP heritage-area polygons (different marker/fill so the two heritage concepts stay visually distinct)

---

## 7. Visual Restyle — Cohere System → Site Read

Translating `DESIGN-cohere.md` into this product's specific surfaces (not a literal Cohere clone — adapted to a data-dense civic-data tool rather than a marketing site):

| Old token | New token | Notes |
|---|---|---|
| `--bg: #f6f6f2` | Canvas white `#ffffff` | White editorial canvas is the Cohere default surface |
| `--ink: #15161a` | Primary `#17171c` | Near-identical — minimal disruption to existing copy contrast |
| `--accent: #3d4eff` (blue) | Action blue `#1863dc` for links; near-black pill for primary CTA | Cohere reserves bright blue for editorial links, not the main action color |
| `--warn: #ff5a36` | Coral `#ff7759` | Constraint chips, hazard flags — Cohere's coral is the closest semantic match to "flagged/warning" |
| `--good: #0fa968` | Deep enterprise green `#003c33` (band) / pale green wash `#edfce9` (chip) | Use deep green as a rare full-width "all clear" band treatment on the overview, pale green for inline "clear" chips |
| `--radius: 3px` | `8px` (cards, chips) / `22px` (map panel, hero search card) / `32px` (pill CTA) | This is the single biggest visual shift — Cohere's signature 22px media-card radius should apply to the map panel specifically |
| Inter (body) | Keep Inter | Already loaded; matches Cohere's documented fallback for Unica77 |
| IBM Plex Mono (mono labels) | Keep IBM Plex Mono | Already loaded; matches Cohere's documented fallback for CohereMono — and continuity with Blythe's existing architectural house-style mono identity layer |
| Hero `<h1>` weight 800 | Display headline, tighter line-height (≈1.0), negative letter-spacing (~-1px at this scale), lighter weight (400–500) | Cohere headlines read as carved/compact, not bold-heavy; consider Space Grotesk as the display fallback per the design doc |
| Boxed mono uppercase accordion headers | Rule-separated rows, generous vertical padding, no box | Closer to Cohere's `research-table` pattern — accordions are dense civic data, the closest Cohere analogue is the research/publication list, not a marketing card |
| `button-form` filled ink rectangle | Pill CTA (`button-primary`), 32px radius, 12px/24px padding | Direct lift from the design system |

Keep the existing chip/`kv` semantic structure (constraint = warn, opportunity/clear = good) — only the colors and radii move, not the information architecture.

---

## 8. Action Items for Claude Code

Sequenced so each step is independently testable:

1. **Restyle pass first, logic untouched.** Swap the CSS variable block per Section 7, update radii on `.panel`, `.chip`, `.overview`, `.accordion`, `.kv`, `.heritage-card`; convert the search button and any future CTA to the pill style. Verify nothing in the JS broke (it shouldn't — none of it touches these class names' meaning).
2. **Consolidate the map stack (ADR-2).** Remove the Google iframe from `renderMap()`; render a Leaflet map into `#mapStage` instead, switch tile layer to CartoDB Positron (spot-check the tile URL loads before committing to it; fall back to the existing OSM raster URL if not), and re-attach the sun-path SVG as an overlay pane sized to the map container rather than a sibling div over an iframe.
3. **Add the State Heritage Register layer (ADR-3).** New `EP.heritageNamed` (layer 5) and `EP.heritageNamedPoly` (layer 6) entries; extend `gatherNSWData()` to fetch on-site + within-radius named items; extend `heritageSummary()`/`renderHeritage()` to list item names where present; add the polygon layer to the landmarks-map heritage toggle with a visually distinct style from the existing LEP heritage-area fill.
4. **Add the flora & fauna accordion (ADR-4).** New fetch helper hitting the ALA occurrence search endpoint with the site's lat/lon and a sensible radius (start at 1 km, make it adjustable like the heritage radius selector); filter/group by kingdom; render as a new accordion with the "not a survey" caveat copy from ADR-4 baked in; handle the empty-result case explicitly.
5. **Replace the climate heuristic (ADR-5).** Drop `classifyClimate()`; add an Open-Meteo fetch (decide forecast-snapshot vs. historical-average per the ADR-5 consequence note — historical average is the more defensible default); update `renderClimate()` to show real wind speed/direction, rainfall, sunshine duration, and UV alongside the existing zone-style framing if still useful as a one-line summary.
6. **Re-verify feature parity** against Section 6's checklist end to end on at least one NSW address and one non-NSW address before calling the rebuild done.
7. **Update the footer attribution line** to add Heritage NSW, the Atlas of Living Australia, and Open-Meteo alongside the existing source list.

---

## 9. Open Risks / Known Gaps

- CartoDB Positron tile usage limits aren't independently re-verified in this session — confirm before relying on it at any real volume; trivially reversible if wrong.
- ALA occurrence density is uneven (urban inner-Sydney vs. regional NSW) — the flora/fauna accordion needs a real "no nearby records" state, not just an empty list.
- Open-Meteo historical-average vs. forecast-snapshot framing needs a final call before implementation — recommended historical average, but either is technically free and keyless.
- Cohere's actual fonts (CohereText, Unica77, CohereMono) are proprietary and not bundled — this brief already designs around the documented fallbacks (Inter, IBM Plex Mono, optionally Space Grotesk for display), so no font-licensing follow-up is needed.
