# Prompt for Claude Code — restructure Groundwork into multi-page app

Paste everything below into a Claude Code session opened at the project root (`new app/`).

---

I want to restructure this React/Vite app ("groundwork") from a single scrolling page into a multi-page app with a persistent sidebar, while reusing all existing data-fetching and rendering logic. No new APIs, no new paid services — keep everything free/keyless as it already is.

## Target structure

- **Home page** (`/`) — hero copy + a rule-separated list linking to each category page, plus a distinct "Full site analysis" CTA band.
- **Persistent sidebar** (all pages except possibly home) listing every category as its own link.
- **Category pages** (`/search/:category`) — one per category. Each has its own address search form. Submitting fetches and renders *only that category's* data (map + accordion content + government links). No other category's data should be fetched.
- **Full analysis page** (`/full-analysis`) — today's existing behavior, completely unchanged: hero, overview chips, map, all accordions, opportunities & constraints synthesis.

## Categories for the sidebar (confirmed — do not deviate)

7 categories, each gets its own page:

1. Zoning & planning controls (`zoning`) — NSW-only
2. Lot & cadastre (`lot`) — NSW-only — **new dedicated page**, see below
3. Heritage (`heritage`) — NSW-only
4. Hazards (`hazards`) — NSW-only
5. Climate & sun (`climate`) — works everywhere
6. Flora & fauna (`flora`) — works everywhere
7. Site history (`history`) — works everywhere

**"Opportunities & constraints" is explicitly excluded from the sidebar.** It stays only on the full-analysis page, unchanged, because it's a synthesis of all other categories, not a standalone lookup.

## Step 1 — install routing

```
npm install react-router-dom
```

Verify it actually lands in `package.json` dependencies before moving on.

## Step 2 — `src/data/categories.js` (new)

Export a `CATEGORIES` array, one entry per category above:

```js
export const CATEGORIES = [
  { key: 'zoning',   path: 'zoning',   code: '01', label: 'Zoning & planning', sub: 'Land use, FSR, height, minimum lot size', nswOnly: true },
  { key: 'lot',      path: 'lot',      code: '02', label: 'Lot & cadastre',    sub: 'Lot/DP, plan, boundaries, area',          nswOnly: true },
  { key: 'heritage', path: 'heritage', code: '03', label: 'Heritage',         sub: 'Heritage listings and conservation areas', nswOnly: true },
  { key: 'hazards',  path: 'hazards',  code: '04', label: 'Hazards',          sub: 'Bushfire, flood, landslide risk',          nswOnly: true },
  { key: 'climate',  path: 'climate',  code: '05', label: 'Climate & sun',    sub: 'Sun path, seasonal climate data',          nswOnly: false },
  { key: 'flora',    path: 'flora',    code: '06', label: 'Flora & fauna',    sub: 'Threatened species and ecology',          nswOnly: false },
  { key: 'history',  path: 'history',  code: '07', label: 'Site history',     sub: 'Wikipedia and landmark context',          nswOnly: false },
];
```

(Adjust wording to match the app's existing voice — check `Hero.jsx` and the accordion `sub` props for tone.)

## Step 3 — `src/hooks/useSiteSearch.js` (new)

Extract `App.jsx`'s existing `handleSearch` function into a reusable hook. It should:

- Take no required args; return `{ ctx, loading, error, search, reset }`.
- `search(addressString)` runs the exact same sequence `App.jsx` currently runs: geocode → derive state/suburb/postcode → parallel-fetch `resolveLGA`, `gatherNSWData`, `fetchWikiSummary`, `fetchClimate`, `fetchFloraFauna` → derive `council`, `cadastre`, `ocItems` → set the same unified `ctx` object shape `App.jsx` currently builds.
- Do not split this per category — `gatherNSWData` already batches zoning + FSR + height + lot size + heritage + hazards + cadastre in one parallel call, so every category page can call the same hook and just render a subset of `ctx`.
- Move the loading-message cycling state here too if it currently lives alongside `handleSearch`, since `LoadingBar` needs it on every page that searches.

This hook is the single source of truth for search behavior — `Home`, `CategoryPage`, and `FullAnalysisPage` should all use it instead of duplicating fetch logic.

## Step 4 — `src/components/accordions/Lot.jsx` (new)

This is the one genuinely new content component, and it directly addresses a real bug report: lot area frequently comes back blank because the NSW Cadastre ArcGIS layer (`MapServer/9`) often has null `planlotarea`/`planlotareaunits` for real parcels — this is a known gap in the underlying NSW Digital Cadastral Database (DCDB), not a fetch bug.

- Use `cadastreSummary(d)` from `src/utils/summaries.js` exactly as `Regulatory.jsx` does today for the land-and-title block — same field reads (`lotidstring`, `planlabel`, `planlotarea`, `planlotareaunits`).
- Render lot/DP, plan label, and area+units in a `kv-grid` (match the existing visual pattern from `Regulatory.jsx`).
- **When area/units come back null/falsy, show an explicit `note-box warn`** stating that lot area isn't published for this parcel in the NSW Digital Cadastral Database, and link out to the NSW Planning Portal Spatial Viewer (`https://www.planningportal.nsw.gov.au/`, already in `STATE_LINKS['New South Wales']`) so the user can confirm manually. This turns a silent data gap into an honest, useful in-product notice instead of a blank field.
- Wrap this component's content in `<Accordion num="02" title="Lot & cadastre" sub="...">` on the category page (this component itself should stay a bare content component like `Regulatory.jsx`/`Hazards.jsx`, not self-wrapping).
- Also render `<MapPanel ctx={ctx} />` on the Lot category page (above or beside the accordion) — it already draws the live surveyed lot boundary polygon from `EP.cadastre`, which is useful context even when the attribute fields are null.

## Step 5 — `src/components/Sidebar.jsx` (new)

- Render a rule-separated (not boxed/card) vertical list of `NavLink`s from `CATEGORIES`, each showing `code` (uppercase mono, matching the existing `acc-num` style used in accordions) + `label` + `sub`.
- Active route gets the existing accent color (`--accent`), not a background fill — keep it flat per the design system (no drop shadows, no boxed active state).
- Below a divider, add a "Full site analysis" link to `/full-analysis`, styled distinctly using `--good` (deep green) to mark it as the complete/premium option, matching how `DESIGN-cohere.md` reserves deep green for full-width feature bands.
- Collapses to a horizontal scrollable row below the existing `880px` breakpoint already used in `index.css` (`.grid-main`) — don't invent a new breakpoint.

## Step 6 — `src/layouts/AppShell.jsx` (new)

- `<SiteHeader />` at top (reuse as-is, unchanged).
- A flex container (`.app-shell`): `<Sidebar />` + `<main className="app-content"><Outlet /></main>`.
- Site footer at the bottom (check how the footer currently renders in `App.jsx` and move it here so it persists across all pages).

## Step 7 — `src/pages/Home.jsx` (new)

- Hero copy (reuse/adapt `Hero.jsx`'s copy style, but this is a navigation landing page, not a search form — the search forms live on category/full-analysis pages).
- A rule-separated list (`.home-grid`) of links to each category — same visual language as the sidebar, not boxed cards (`DESIGN-cohere.md` explicitly says: don't make every section card-based).
- A full-width deep-green (`--good`) CTA band linking to `/full-analysis`, using the 22px feature-card radius (`--radius-map`) reserved for major media/feature elements per the design doc.

## Step 8 — `src/pages/CategoryPage.jsx` (new)

- Read the category key from `useParams()`, look up its metadata in `CATEGORIES`.
- Own address search form (reuse styling from the existing `.search-form` in `index.css`), wired to `useSiteSearch().search`.
- Show `<LoadingBar />` while loading, error box on failure (reuse existing pattern from `App.jsx`).
- **NSW-only gating**: if the category's `nswOnly` is true and `ctx.isNSW` is false after a successful search, show a clear fallback message ("this data source only covers NSW") plus `<LinksPanel ctx={ctx} />` so the user still gets council/state/national links for their address instead of a dead end.
- Otherwise render the category's content:
  - `zoning` → wrap `Regulatory.jsx` content in `<Accordion num="01" title="Zoning & planning" sub="...">`.
  - `lot` → the new `Lot.jsx` from Step 4, plus `<MapPanel ctx={ctx} />`.
  - `heritage` → render `<HeritageAccordion num="03" ctx={ctx} />` **directly, with no extra `<Accordion>` wrapper** — it already self-wraps internally (check `src/components/accordions/Heritage.jsx`, it imports and renders `<Accordion>` itself). Also render `<LandmarksMap ctx={ctx} />` for the heritage/SHR overlay toggles.
  - `hazards` → wrap `Hazards.jsx` content in `<Accordion num="04" ...>`, plus `<LandmarksMap ctx={ctx} />` for the hazard-layer toggles.
  - `climate` → wrap `Climate.jsx` content in `<Accordion num="05" ...>`, plus `<MapPanel ctx={ctx} />` for the sun-path overlay.
  - `flora` → wrap `FloraFauna.jsx` content in `<Accordion num="06" ...>`. No map.
  - `history` → wrap `History.jsx` content in `<Accordion num="07" ...>`, plus `<LandmarksMap ctx={ctx} />` for Wikipedia landmark markers.
- Always render `<LinksPanel ctx={ctx} />` at the bottom of every category page, NSW or not.

## Step 9 — `src/pages/FullAnalysisPage.jsx` (new)

Move `App.jsx`'s current body here almost verbatim — `Hero`, `LoadingBar`, error box, the `Overview` + `MapPanel` + `LinksPanel` grid, `LandmarksMap`, then `Accordions` (which still includes Opportunities & constraints, unchanged). Just swap the inline search/fetch logic for the `useSiteSearch` hook from Step 3. Visually and functionally this page should be identical to what the app does today.

## Step 10 — routing

- `src/main.jsx`: wrap `<App />` in `<BrowserRouter>`.
- `src/App.jsx`: replace its current body with:

```jsx
<Routes>
  <Route element={<AppShell />}>
    <Route index element={<Home />} />
    <Route path="search/:category" element={<CategoryPage />} />
    <Route path="full-analysis" element={<FullAnalysisPage />} />
  </Route>
</Routes>
```

## Step 11 — CSS

Append to `src/index.css` (don't create a new CSS file — everything else lives here): `.app-shell`, `.sidebar` + its link/divider states, `.home-grid` + `.home-full` CTA band, `.category-page` + `.cat-*` helper classes for the search form/fallback message on category pages. Follow `DESIGN-cohere.md` precisely:

- Rule-separated, unframed rows — not boxed cards — for the sidebar and home list.
- Pill-shaped buttons (`--radius-pill`) for CTAs, near-black fill, matching existing `.search-form button` styling.
- 22px radius (`--radius-map`) reserved for the home page's full-analysis feature band and the map panels — not for every container.
- Deep green (`--good: #003c33`) only for that one full-width feature band, not used elsewhere.
- Uppercase mono labels (`--mono`) for category codes/numbers, matching the existing `acc-num` treatment.
- Flat elevation throughout — no box-shadows anywhere new.
- Sidebar collapses to a horizontal scrollable row at the existing `880px` breakpoint, consistent with `.grid-main`'s current responsive behavior.

## Cleanup

Delete `src/App.css` — confirmed via `grep -rn "App.css" src/` that it's never imported anywhere and is fully dead.

## Acceptance check

After implementing, run `npm run build` and `npm run lint` and fix anything that breaks. Manually verify: home page links to all 7 categories + full analysis; each category page fetches only its own data; non-NSW addresses on NSW-only categories show the fallback + links instead of crashing; the full-analysis page behaves exactly as it did before this change; the Lot page shows the null-area notice when `planlotarea` is missing.
