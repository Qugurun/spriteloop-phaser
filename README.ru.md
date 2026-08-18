# SpriteLoop для Phaser

[![npm version](https://img.shields.io/badge/npm-v0.1.2-4f7cff?style=for-the-badge)](#установка)

> Ошибки и пожелания по десктопному приложению SpriteLoop отправляйте в
> [трекер SpriteLoop app](https://github.com/Balkan-Ram-Games/spriteloop-app/issues).

SpriteLoop для Phaser 4.2.1 добавляет воспроизведение анимационных пакетов `.spla`,
экспортированных из редактора [SpriteLoop](https://github.com/Balkan-Ram-Games/spriteloop-app).
Плагин регистрирует свой тип файла в загрузчике, разбирает manifest, загружает
текстуры частей и рисует персонажа через `SplaObject`.

## Установка

```bash
npm install spriteloop-phaser
```

Phaser 4 — peer dependency:

```bash
npm install phaser
```

Для локальной разработки из этого репозитория:

```bash
npm install ../spriteloop-phaser
```

## Быстрый старт

Зарегистрируйте глобальный плагин при создании игры:

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

## Использование

Загрузите `.spla` в `preload()` и создайте `SplaObject` в `create()`.
Анимация задаётся по экспортированному ID или по отображаемому имени.
Сначала ищется точное совпадение по ID, затем по имени.

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

Управление воспроизведением из сцены:

```javascript
this.hero.play("walk", { loop: true });
this.hero.stop();

// Перемотка через внутренний player
this.hero.player.setFrame(10);
this.hero.player.setTime(0.5);
this.hero.player.playbackRate = 1.5;
```

### Опции SplaObject

| Опция              | Тип       | По умолчанию    | Описание                                      |
| ------------------ | --------- | --------------- | --------------------------------------------- |
| `animation`        | `string`  | первая анимация | ID или имя начальной анимации                 |
| `skin`             | `string`  | `"default"`     | ID или имя начального скина                   |
| `loop`             | `boolean` | из пакета       | Переопределение loop для первого `play()`     |
| `autoplay`         | `boolean` | `true`          | Запуск анимации в конструкторе                |
| `emitEvents`       | `boolean` | `true`          | Генерация событий кадров для первого `play()` |
| `maxPendingEvents` | `number`  | `256`           | Размер очереди событий player                 |

## События анимации

SpriteLoop генерирует события кадров при входе в кадр. Старт анимации создаёт
события на кадре 0, обычное воспроизведение — для каждого пройденного кадра,
а `setFrame()` и `setTime()` — только для целевого кадра.

По умолчанию события включены. Отключить их для сессии воспроизведения:

```javascript
this.hero.play("idle", {
  loop: true,
  emitEvents: false,
});
```

Для прямого позиционирования `emitEvents` влияет только на текущую операцию:

```javascript
this.hero.player.setFrame(10, { emitEvents: false });
this.hero.player.setTime(0.5, { emitEvents: false });
```

`SplaObject` — это Game Object Phaser, поэтому использует встроенный
[EventEmitter](https://docs.phaser.io/phaser/concepts/events): `on()`, `once()`,
`off()` и `emit()`. События кадров срабатывают сразу, когда воспроизведение
доходит до них. Каждое authored-событие эмитится дважды:

1. Под экспортированным именем, например `'step'`
2. Под общим именем `'spriteloop'` (`SplaEvents.EVENT`)

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

Не используйте служебные имена Phaser вроде `'update'` или `'destroy'` как
имена SpriteLoop-событий. Подписывайтесь до `play()`, если нужны события кадра
0: `autoplay` в конструкторе может эмитнуть их до того, как в `create()`
повесятся обработчики. Тогда `{ autoplay: false }`, затем `on()`, затем
`play()`.

`consumeEvents()` остаётся, если нужно вручную забрать очередь вместо (или
вместе с) Phaser-слушателями. `emit` очередь не очищает:

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

Каждый объект события содержит:

- `name` и `eventName` — имя экспортированного события
- `data` — строковая нагрузка события или пустая строка
- `animationId` — ID анимации, которая сгенерировала событие
- `animationName` — отображаемое имя анимации
- `frameIndex` — индекс кадра внутри анимации, с нуля
- `sourceFrame` — исходный номер кадра из редактора

Когда очередь переполнена, SpriteLoop удаляет самое старое событие, сохраняет
новое и увеличивает `droppedEventCount`. Состояние очереди доступно через
`getInfo()`:

```javascript
const info = this.hero.getInfo();

console.log(info.pendingEventCount, info.droppedEventCount);
```

## Трансформы частей

Получите текущий трансформ отрисовываемой части по key, name или internal ID:

```javascript
const pivot = this.hero.getPartTransform("right_hand");
const centered = this.hero.getPartTransform("right_hand", { origin: "center" });

console.log(pivot.position.x, pivot.position.y, pivot.rotation);
```

Координаты: локальное пространство с центром на
canvas пакета, Y вверх. Передайте `{ origin: 'center' }`, чтобы получить
визуальный центр изображения части вместо authored pivot.

## Смешивание sprite states

Если кадр ссылается на текущий sprite state и следующий state с `stateMix`
между `0` и `1`, `SplaObject` плавно смешивает варианты изображений для этих
состояний. Карта `states` в скине выбирает, какой variant соответствует
каждому exported state ID.

Ручной `setVariant()` по-прежнему имеет приоритет над state map скина.

## Скины и варианты частей

`SplaObject` по умолчанию использует экспортированный скин `default`, если в
опциях конструктора не указан другой. Во время игры можно менять скин и
переопределять варианты отдельных частей:

```javascript
// Применяет варианты и видимость частей выбранного скина.
this.hero.setSkin("blue_robot");

// Переопределяет одну часть поверх активного скина.
this.hero.setVariant("head", "head_helmet");

this.hero.play("idle", { loop: true });
```

API скинов и частей принимает runtime key, display name и внутренний ID из
`.spla`. Сначала ищется точный ID, затем key, затем name:

```javascript
const changed = this.hero.setSkin(skinIdOrName);
const changed = this.hero.setVariant(partKeyOrName, variantKeyOrName);
const changed = this.hero.clearVariant(partKeyOrName);
this.hero.clearVariants();
```

- `setSkin()` возвращает `true`, если скин найден.
- `setVariant()` возвращает `true`, если часть и её вариант найдены. Передайте
  `"default"` (без учёта регистра), чтобы сбросить ручное переопределение части.
- `clearVariant()` возвращает `true`, если часть найдена.
- `clearVariants()` снимает все ручные переопределения.

Пункт **Default** в SpriteLoop обычно не является экспортированным вариантом.
Это состояние «без ручного override». Используйте `setVariant(part, 'default')`
или `clearVariant()` для одной части и `clearVariants()` для всех частей.

Ручные варианты частей имеют приоритет над активным скином. Сброс override
возвращает вариант из скина или базовое изображение части. Смена скина не
очищает ручные переопределения.

Через `getInfo()` можно узнать доступные анимации и скины:

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

Можно умножить цвет всего персонажа поверх tint из `.spla`. По умолчанию —
белый:

```javascript
this.hero.setTint(1, 0.45, 0.45);
this.hero.clearTint();
```

Каналы tint ограничиваются диапазоном `0..1`. Множитель комбинируется с
покадровым tint из пакета перед передачей в систему tint Phaser.

## Ручной разбор пакета

Можно разобрать `.spla` вне загрузчика — для инструментов и превью:

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

Загрузчик по-прежнему создаёт текстуры и регистрирует кеш. Ручной разбор
удобен для инспекторов, валидации и утилит вне Phaser.

## Формат `.spla`

Файл `.spla` — ZIP-архив, экспортированный из SpriteLoop:

```text
manifest.json
assets/
  part_001.png
  part_002.png
```

`manifest.json` использует:

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

Координаты в manifest заданы в canvas-space. Плагин переводит их в локальные
координаты контейнера с центром на canvas пакета, затем применяет трансформы
частей.

## Сборка

Из корня репозитория:

```bash
npm install
npm run build
```

Результат:

```text
dist/spriteloop-phaser.js     # ESM
dist/spriteloop-phaser.cjs    # CommonJS
dist/index.d.ts               # TypeScript-декларации
```

Watch-режим:

```bash
npm run dev
```

Только проверка типов:

```bash
npm run typecheck
```

## Структура проекта

```text
src/
  index.ts          Публичные экспорты
  SplaPlugin.ts     Глобальный плагин Phaser
  SplaFile.ts       Loader file type для .spla
  SplaObject.ts     Игровой объект для отрисовки
  SplaPlayer.ts     Воспроизведение и очередь событий
  SplaPackage.ts    Парсер manifest
  SplaCache.ts      Хелпер custom cache
  types.ts          Общие TypeScript-типы
vite.config.ts      Конфиг library-сборки
tsconfig.json
```

## Краткий обзор API

| Экспорт                         | Описание                                                  |
| ------------------------------- | --------------------------------------------------------- |
| `SplaPlugin`                    | Глобальный плагин Phaser; регистрирует `this.load.spla()` |
| `SplaObject`                    | `Container`, который рисует загруженный пакет             |
| `SplaPlayer`                    | Отдельный контроллер воспроизведения                      |
| `parseSplaBytes()`              | Разбор сырых байт `.spla`                                 |
| `ensureSplaCache()`             | Гарантирует наличие `game.cache.custom.spla`              |
| `SplaEvents` / `SPLA_EVENT`     | Общее имя события `'spriteloop'`                          |
| `SplaObject.getPartTransform()` | Текущий трансформ части                                   |

API загрузчика после регистрации плагина:

```javascript
this.load.spla(key, url);
this.load.spla({ key: "hero", url: "hero.spla" });
```

## Текущие ограничения

По сравнению со SpriteLoop for Defold этот Phaser-плагин пока не реализует:

- упаковку текстур частей в общий atlas (каждый PNG — отдельная текстура)

Эти возможности могут появиться в следующих версиях.

## Связанные проекты

- [SpriteLoop app](https://github.com/Balkan-Ram-Games/spriteloop-app)

## Лицензия

MIT
