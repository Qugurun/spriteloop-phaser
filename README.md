# SpriteLoop for Phaser

[![npm version](https://img.shields.io/badge/npm-v0.1.2-4f7cff?style=for-the-badge)](#install)

> For SpriteLoop desktop app bugs and feature requests, use the
> [SpriteLoop app issue tracker](https://github.com/Balkan-Ram-Games/spriteloop-app/issues).

SpriteLoop for Phaser 4.2.1 adds playback for `.spla` animation packages exported from
the [SpriteLoop](https://github.com/Balkan-Ram-Games/spriteloop-app) editor. The
plugin registers a custom loader file type, parses package manifests, uploads
part textures, and renders animated characters through `SplaObject`.

## Install

```bash
npm install spriteloop-phaser
```

Phaser 4 is a peer dependency:

```bash
npm install phaser
```

For local development against this repository:

```bash
npm install ../spriteloop-phaser
```

## Quick start

Register the global plugin when creating the game:

```javascript
import { AUTO, Game } from "phaser";
import SplaPlugin, { SplaObject } from "spriteloop-phaser";

const game = new Game({
  type: AUTO,
  width: 1024,
  height: 768,
  parent: "game-container",
  plugins: {
    global: [
      {
        key: "SplaPlugin",
        plugin: SplaPlugin,
        start: true,
      },
    ],
  },
  scene: {
    preload() {
      this.load.setPath("assets");
      this.load.spla("robot", "robot_idle.spla");
    },
    create() {
      this.robot = new SplaObject(this, 512, 400, "robot", {
        animation: "idle",
        loop: true,
        autoplay: true,
      });
    },
  },
});
```

TypeScript:

```typescript
import { AUTO, Game } from "phaser";
import SplaPlugin, { SplaObject } from "spriteloop-phaser";

const game = new Game({
  type: AUTO,
  width: 1024,
  height: 768,
  parent: "game-container",
  plugins: {
    global: [{ key: "SplaPlugin", plugin: SplaPlugin, start: true }],
  },
  scene: {
    preload() {
      this.load.setPath("assets");
      this.load.spla("robot", "robot_idle.spla");
    },
    create() {
      this.robot = new SplaObject(this, 512, 400, "robot", {
        animation: "idle",
        loop: true,
      });
    },
  },
});
```

## Use

Load a `.spla` package in `preload()` and create a `SplaObject` in `create()`.
The animation argument may be either the exported animation ID or the display
name. Exact IDs are matched before names.

```javascript
import { SplaObject } from "spriteloop-phaser";

export class GameScene extends Phaser.Scene {
  preload() {
    this.load.spla("hero", "characters/hero.spla");
  }

  create() {
    this.hero = new SplaObject(this, 400, 300, "hero", {
      skin: "default",
      animation: "idle",
      loop: true,
      autoplay: true,
    });
  }
}
```

Control playback from scene code:

```javascript
this.hero.play("walk", { loop: true });
this.hero.stop();

// Seek through the underlying player
this.hero.player.setFrame(10);
this.hero.player.setTime(0.5);
this.hero.player.playbackRate = 1.5;
```

### SplaObject options

| Option             | Type      | Default         | Description                                     |
| ------------------ | --------- | --------------- | ----------------------------------------------- |
| `animation`        | `string`  | first animation | Initial animation ID or name                    |
| `skin`             | `string`  | `"default"`     | Initial skin ID or name                         |
| `loop`             | `boolean` | package default | Loop override passed to the first `play()` call |
| `autoplay`         | `boolean` | `true`          | Start playback in the constructor               |
| `emitEvents`       | `boolean` | `true`          | Emit frame events for the first `play()` call   |
| `maxPendingEvents` | `number`  | `256`           | Event queue size for the internal player        |

## Animation events

SpriteLoop emits frame events when playback enters a frame. Starting an animation
emits events on frame 0, normal playback emits events for every crossed frame,
and `setFrame()` or `setTime()` emits only events on the destination frame.

Event emission is enabled by default. Disable it for a playback session with:

```javascript
this.hero.play("idle", {
  loop: true,
  emitEvents: false,
});
```

For direct positioning, `emitEvents` affects only that operation:

```javascript
this.hero.player.setFrame(10, { emitEvents: false });
this.hero.player.setTime(0.5, { emitEvents: false });
```

`SplaObject` is a Phaser Game Object, so it uses the built-in
[EventEmitter](https://docs.phaser.io/phaser/concepts/events): `on()`, `once()`,
`off()`, and `emit()`. Frame events fire immediately when playback reaches them.
Each authored event is emitted twice:

1. Under the exported event name, for example `'step'`
2. Under the catch-all `'spriteloop'` (`SplaEvents.EVENT`)

```javascript
import { SplaEvents } from "spriteloop-phaser";

this.hero.on("step", (event) => {
  console.log(event.name, event.data, event.frameIndex);
});

this.hero.on(SplaEvents.EVENT, (event) => {
  console.log(event.eventName, event.data);
});

this.hero.off("step");
```

Do not reuse Phaser's own Game Object event names such as `'update'` or
`'destroy'` as SpriteLoop event names. Attach listeners before `play()` if you
need frame 0 events; constructor `autoplay` can emit those before `create()`
finishes wiring handlers. Use `{ autoplay: false }` then `on()` then `play()`.

`consumeEvents()` is still available when you want to drain the queue manually
instead of (or in addition to) Phaser listeners. Emitting does not empty the
queue:

```javascript
update() {
    for (const event of this.hero.consumeEvents()) {
        console.log(
            event.name,
            event.data,
            event.animationId,
            event.animationName,
            event.frameIndex,
            event.sourceFrame
        );
    }
}
```

Each event object contains:

- `name` and `eventName`: the exported event name
- `data`: the exported event payload string, or an empty string
- `animationId`: the exported ID of the animation that emitted the event
- `animationName`: the display name of the animation that emitted the event
- `frameIndex`: the zero-based frame index inside the exported animation
- `sourceFrame`: the original editor/source frame number

When the queue is full, SpriteLoop drops the oldest event, keeps the newest
event, and increments `droppedEventCount`. Inspect queue state through
`getInfo()`:

```javascript
const info = this.hero.getInfo();

console.log(info.pendingEventCount, info.droppedEventCount);
```

## Part transforms

Read the current rendered transform for any part by key, name, or internal ID:

```javascript
const pivot = this.hero.getPartTransform("right_hand");
const centered = this.hero.getPartTransform("right_hand", { origin: "center" });

console.log(pivot.position.x, pivot.position.y, pivot.rotation);
```

Coordinates match the Defold plugin: local space centered on the package canvas,
with Y-up values in the returned `position`. Pass `{ origin: 'center' }` to get
the visual center of the part image instead of its authored pivot.

## Sprite state mixing

When a frame references both a current sprite state and a next state with
`stateMix` between `0` and `1`, `SplaObject` cross-fades between the resolved
variant images for those states. Skin `states` maps select which variant belongs
to each exported state ID.

Manual `setVariant()` overrides still take precedence over skin state maps.

## Skins and part variants

A `SplaObject` selects the exported `default` skin unless another skin is passed
in the constructor options. Runtime code can change the active skin and override
individual part variants:

```javascript
// Applies the skin's part variants and visibility settings.
this.hero.setSkin("blue_robot");

// Overrides one part after applying the skin.
this.hero.setVariant("head", "head_helmet");

this.hero.play("idle", { loop: true });
```

Skin and part APIs accept runtime keys, display names, and the internal IDs
exported in the `.spla` package. Exact IDs are matched first, then keys, then
names:

```javascript
const changed = this.hero.setSkin(skinIdOrName);
const changed = this.hero.setVariant(partKeyOrName, variantKeyOrName);
const changed = this.hero.clearVariant(partKeyOrName);
this.hero.clearVariants();
```

- `setSkin()` returns `true` when the skin ID or name exists.
- `setVariant()` returns `true` when the part resolves and the variant resolves
  to a variant belonging to that part. Pass `"default"` (case-insensitive) to
  clear that part's manual override.
- `clearVariant()` returns `true` when the part resolves.
- `clearVariants()` removes every manual part override.

The **Default** option shown for a part in SpriteLoop is not normally an exported
variant. It means that the part has no manual variant override. Use
`setVariant(part, 'default')` or `clearVariant()` to select this state for one
part, and `clearVariants()` to restore it for every part.

Manual part variants take precedence over the active skin. Clearing an override
restores the variant selected by the active skin, or the part's base image when
the skin does not override it. Changing skins does not clear manual part
overrides.

Use `getInfo()` to discover the skins and animations available in the loaded
package:

```javascript
const info = this.hero.getInfo();

console.log("active skin index", info.skinIndex);

for (const animation of info.animations) {
  console.log(
    animation.id,
    animation.name,
    animation.frameCount,
    animation.fps,
  );
}

for (const skin of info.skins) {
  console.log(skin.id, skin.name);
}
```

## Runtime tint

Apply a whole-character RGB multiplier on top of the tint authored in the
`.spla` package. The default is white:

```javascript
this.hero.setTint(1, 0.45, 0.45);
this.hero.clearTint();
```

Tint channels are clamped to the `0..1` range. The multiplier combines with
per-frame tint data from the package before being sent to Phaser's tint system.

## Manual package parsing

You can parse `.spla` bytes outside the loader when building tools or previews:

```javascript
import { parseSplaBytes } from "spriteloop-phaser";

const response = await fetch("assets/robot_idle.spla");
const bytes = new Uint8Array(await response.arrayBuffer());
const packageData = parseSplaBytes(bytes, "robot_idle.spla");

console.log(
  packageData.name,
  packageData.animations.map((a) => a.id),
);
```

The loader still handles texture creation and cache registration. Manual parsing
is useful for inspectors, validation, or non-Phaser tooling.

## `.spla` package format

A `.spla` file is a ZIP archive exported by SpriteLoop:

```text
manifest.json
assets/
  part_001.png
  part_002.png
```

`manifest.json` uses:

```json
{
  "format": "spla",
  "version": 1,
  "canvas": { "width": 512, "height": 512 },
  "parts": [],
  "variants": [],
  "skins": [],
  "states": [],
  "animations": []
}
```

Coordinates in the manifest are canvas-space values. The plugin converts them to
local container space centered on the package canvas before applying part
transforms.

## Build

From the repository root:

```bash
npm install
npm run build
```

Outputs:

```text
dist/spriteloop-phaser.js     # ESM
dist/spriteloop-phaser.cjs    # CommonJS
dist/index.d.ts               # TypeScript declarations
```

Watch mode:

```bash
npm run dev
```

Typecheck only:

```bash
npm run typecheck
```

## Layout

```text
src/
  index.ts          Public exports
  SplaPlugin.ts     Phaser global plugin
  SplaFile.ts       Loader file type for .spla
  SplaObject.ts     Renderable game object
  SplaPlayer.ts     Playback and event queue
  SplaPackage.ts    Manifest parser
  SplaCache.ts      Custom cache helper
  types.ts          Shared TypeScript types
vite.config.ts      Library build config
tsconfig.json
```

## API summary

| Export                          | Description                                        |
| ------------------------------- | -------------------------------------------------- |
| `SplaPlugin`                    | Global Phaser plugin; registers `this.load.spla()` |
| `SplaObject`                    | `Container` that renders a loaded package          |
| `SplaPlayer`                    | Standalone playback controller                     |
| `parseSplaBytes()`              | Parse raw `.spla` bytes                            |
| `ensureSplaCache()`             | Ensure `game.cache.custom.spla` exists             |
| `SplaEvents` / `SPLA_EVENT`     | Catch-all event name `'spriteloop'`                |
| `SplaObject.getPartTransform()` | Read current part transform                        |

Loader API after plugin registration:

```javascript
this.load.spla(key, url);
this.load.spla({ key: "hero", url: "hero.spla" });
```

## Current limitations

Compared with SpriteLoop for Defold, this Phaser plugin currently does not
implement:

- texture atlas packing across parts (each PNG becomes its own texture)

These areas may be added in future releases.

## Related projects

- [SpriteLoop app](https://github.com/Balkan-Ram-Games/spriteloop-app)

## License

MIT
