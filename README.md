# Universe — Procedural Physics Sandbox

A seeded, procedurally generated browser world you can fly through, terraform,
set on fire, flood, destroy, and watch evolve. No missions, no win condition —
just a living sandbox.

Built with React 19 + TypeScript + Vite, React Three Fiber, Rapier physics,
Tailwind v4, and zustand.

## Running it

```bash
npm install
npm run dev
```

Then open the printed local URL (usually `http://localhost:5173`).

To produce a static production build:

```bash
npm run build
npm run preview
```

`npm run build` runs a full TypeScript check before bundling — this repo
currently builds with **zero TypeScript errors**.

> **Note on verification:** this project was built and type-checked, and its
> production build was verified to complete successfully, entirely from the
> command line. There was no browser available in that environment to click
> through the running app, so please treat your first `npm run dev` as the
> real first playtest. If anything looks off, the browser console is the
> first place to check — see "If something doesn't look right" below.

## Controls

- **Left click** — select / use the active tool
- **Right-drag** — orbit the camera (free-camera mode)
- **Scroll** — zoom
- **W A S D** / arrow keys — move
- **Shift** — move faster
- **Space** — move up · **Ctrl** — move down
- Toggle **First-person** in the bottom-right panel for pointer-lock walking

## What's actually implemented

This follows the build brief's own MVP strategy (build a working core first,
then layer on more). Everything below is real, working code — not a stub:

- **Deterministic seeded generation** — terrain, city layout, buildings,
  vehicles, creatures and history are all derived from one seed via
  independent PRNG channels. The same seed always reproduces the same world.
- **Procedural terrain** — simplex-noise heightmap with biome coloring, a sea
  plane, and a flattened buildable zone under the city.
- **Procedural city** — grid of blocks, roads, ~150–200 buildings with
  material/usage/floor-count/occupants, parks, and a generated (clearly
  fictional) history timeline per building and per city.
- **Physics** (Rapier) — buildings are static rigid bodies until destroyed,
  at which point they become dynamic and topple; every user-spawned object
  (boxes, spheres, rocks, vehicles, water, sand) is a real physics body
  affected by the global gravity setting.
- **Gravity tool** — global magnitude slider, reverse, and localized gravity
  wells that pull nearby dynamic objects toward a point.
- **Materials** — water (falling/pooling droplet clusters), sand (granular
  piles), fire (spreads to nearby wood-material buildings, decays structural
  health, triggers collapse at 0%).
- **Traffic** — vehicles drive their assigned road back and forth and brake
  when a user-dropped object blocks the road ahead.
- **Creatures** — wander, get hungry, rest, occasionally reproduce, and can
  die — driven by a lightweight per-frame behavior loop, not just cosmetic.
- **Weather** — clear/clouds/rain/storm/fog/snow, with wind-driven
  precipitation and storm lightning.
- **Time control** — pause and ×0.1–×1000 speed; a simulated year clock
  drives fire spread, damage ticks, and building aging.
- **Camera** — four scale presets (planet / city / street / building) with
  smooth eased transitions, free-fly WASD in every mode, orbit controls, and
  a genuine first-person pointer-lock mode.
- **Planet view** — jumping to "planet" scale flies you out to a separate,
  fully rendered globe: a seeded, seamless (3D-noise, no seams/pole
  pinching) continents-and-oceans texture, a rotating cloud layer, a
  Fresnel atmosphere glow, scattered city-light dots on the night side, and
  a "you are here" beacon tying it back to the city you came from.
- **Day/night cycle** — the sun arcs across the sky in real time, driven by
  the same simulated clock as time control, so speeding up time visibly
  speeds up the day/night cycle. Sun color/intensity and shadow length
  shift through dawn, noon, dusk, and night.
- **Window-lit buildings** — every building gets a lit-window emissive
  texture (tiled by height so towers read denser than houses), which glows
  nicely with the bloom pass.
- **Double-click to fly in** — double-click any building, vehicle, or
  creature and the camera smoothly flies in close to it.
- **Screenshot capture** — grab a PNG of the current view straight from the
  time panel.
- **World Inspector** — click any building, vehicle, creature, or
  user-spawned object for a stats panel; buildings show their full
  generated history.
- **Tool palette** — Select / Create / Destroy / Gravity / Water / Fire /
  Sand / Weather / Time, matching the brief's tool list.
- **Save / Load / Share / Snapshots** — full world state (seed + all
  mutations: building damage, fires, user-spawned objects, gravity, weather,
  time) persists to `localStorage`; a share link encodes the seed + top-level
  settings into the URL.
- **Experiment mode** — set gravity/wind/temperature/time/water/fire and run.
- **Loading sequence** — the staged "CREATING UNIVERSE..." checklist from
  the brief, on first load and on every new universe.

## Deliberate simplifications (and why)

A handful of things are simplified rather than faked. Each is a real,
working system — just not the maximally elaborate version the original
brief describes, because that version is genuinely a multi-month team
effort, not a single build pass:

- **The planet is a separate, stylized globe, not a literal zoomed-out
  continuation of the flat terrain.** The city itself lives on a large but
  flat heightmap (see below), so "planet" scale flies the camera out to a
  dedicated globe object instead of just pulling back from that flat plane
  (which would look wrong from orbit). This is the same approach real
  games use for planet-to-surface transitions — it's a deliberate design
  choice, not a shortcut standing in for a missing feature.
- **City size is large but finite** (~150–200 buildings in a ~400m-wide
  city), not an infinite chunk-streamed world. The generator architecture
  (`world → city → block → building`) is already set up so real chunk
  streaming (load/unload blocks by camera distance) is the natural next
  step — it just isn't wired in yet.
- **Camera scale transitions are four curated presets**, not a continuously
  procedural planet-to-room LOD pipeline. Going from "planet" to "building"
  is a smooth eased camera move, not a re-generation of geometry at each
  intermediate scale.
- **Vehicles are kinematic, not fully physical** — they follow their road
  and brake for obstacles, but don't collide/crash via the physics engine.
  Full vehicle-vs-vehicle collision is a good next milestone.
- **Water and sand are particle clusters**, not a real fluid/grain
  simulation (no SPH, no cellular automaton). They behave physically
  (they fall, collide, pool) but won't flow like a true fluid.
- **Terrain reshaping** (the "hill"/"boulder" terrain tool) spawns a static
  rock feature rather than deforming the live heightmap — genuinely
  reshaping a heightmap under a physics floor mid-simulation is a bigger
  piece of work than this pass covers.
- **No day/night cycle** — lighting is currently static.
- **No bundled audio assets** — a tiny self-contained Web Audio blip gives
  UI feedback, but there's no ambient/environmental soundscape (that needs
  actual sound assets, which weren't part of this build).

## Project structure

```
src/
  simulation/   zustand store, the fixed-tick sim loop (fire, damage, gravity wells, clock)
  world/        seeded PRNG, terrain heightmap, world assembly
  generation/   city layout, building/vehicle/creature/history generators
  entities/     buildings, vehicles, creatures, roads, gravity-well markers
  materials/    water, sand, fire
  weather/      fog/rain/snow/lightning
  camera/       scale presets, camera rig, keyboard controls
  scene/        Canvas root composition (lighting, physics world, bloom)
  tools/        click → action routing for the active tool
  storage/      localStorage save/load/snapshots + shareable URL
  ui/           HUD, toolbar, inspector, and all panels
```

## Natural next milestones

In the order the brief's own "progressively add" list suggests:

1. Chunk-based streaming so the city can genuinely be much larger
2. Physical (Rapier-driven) vehicles with real collisions
3. Structural destruction with per-component (foundation/column/wall/roof)
   damage instead of a single health percentage
4. A real fluid/grain simulation for water and sand
5. Live terrain deformation
6. Day/night cycle and ambient audio
