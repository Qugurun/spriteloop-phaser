import T, { GameObjects as Y, Plugins as U } from "phaser";
import { unzipSync as W } from "fflate";
function F(s) {
  const t = s.cache.custom;
  return t.spla || s.cache.addCustom("spla"), t.spla;
}
const E = "spriteloop", rt = {
  EVENT: E
};
function d(s, t) {
  return typeof s == "number" && !Number.isNaN(s) ? s : t;
}
function I(s, t) {
  return s.localeCompare(t, void 0, { sensitivity: "accent" }) === 0;
}
function q(s, t) {
  if (!s || !t)
    return -1;
  const e = s.animations.findIndex((n) => n.id === t);
  return e >= 0 ? e : s.animations.findIndex((n) => I(n.name, t));
}
function A(s, t) {
  if (!s || !t)
    return -1;
  const e = s.skins.findIndex((n) => n.id === t);
  return e >= 0 ? e : s.skins.findIndex((n) => I(n.name, t));
}
function g(s, t) {
  if (!s || !t)
    return -1;
  const e = s.parts.findIndex((i) => i.id === t);
  if (e >= 0)
    return e;
  const n = s.parts.findIndex((i) => i.key === t);
  return n >= 0 ? n : s.parts.findIndex((i) => I(i.name, t));
}
function b(s, t, e) {
  if (!s || t < 0 || !e || I(e, "default"))
    return -1;
  const n = s.parts[t];
  if (!n)
    return -1;
  const i = s.variants.findIndex(
    (c) => c.id === e && c.partId === n.id
  );
  if (i >= 0)
    return i;
  const r = s.variants.findIndex(
    (c) => c.key === e && c.partId === n.id
  );
  return r >= 0 ? r : s.variants.findIndex(
    (c) => I(c.name, e) && c.partId === n.id
  );
}
function $(s) {
  const t = s.tint;
  return {
    x: d(s.x, 0),
    y: d(s.y, 0),
    rotation: d(s.rotation, 0),
    skewX: d(s.skewX, 0),
    skewY: d(s.skewY, 0),
    scaleX: d(s.scaleX, 1),
    scaleY: d(s.scaleY, 1),
    opacity: d(s.opacity, 1),
    zOffset: d(s.zOffset, 0),
    tint: Array.isArray(t) && t.length === 3 ? t.map((e) => Math.max(0, Math.min(1, Number(e)))) : [1, 1, 1]
  };
}
function H(s) {
  if (s.format !== "spla" || s.version !== 1)
    throw new Error("Unsupported SpriteLoop package manifest");
  const t = s.canvas, e = d(t == null ? void 0 : t.width, 0), n = d(t == null ? void 0 : t.height, 0);
  if (e <= 0 || n <= 0)
    throw new Error("SpriteLoop package canvas size is invalid");
  const i = (s.parts || []).map((o) => {
    var u, h;
    return {
      id: String(o.id),
      key: String(o.key || o.id),
      name: String(o.name || o.key || o.id),
      asset: o.asset ? String(o.asset) : void 0,
      transformOnly: o.kind === "empty" || o.transformOnly === !0,
      width: d(o.width, 0),
      height: d(o.height, 0),
      pivot: {
        x: d((u = o.pivot) == null ? void 0 : u.x, d(o.width, 0) * 0.5),
        y: d((h = o.pivot) == null ? void 0 : h.y, d(o.height, 0) * 0.5)
      },
      drawOrder: d(o.drawOrder, 0),
      visible: o.visible !== !1
    };
  }), r = (s.variants || []).map((o) => ({
    id: String(o.id),
    key: String(o.key || o.id),
    name: String(o.name || o.key || o.id),
    partId: String(o.part),
    asset: o.asset ? String(o.asset) : void 0,
    width: d(o.width, 0),
    height: d(o.height, 0),
    offsetX: d(o.offsetX, 0),
    offsetY: d(o.offsetY, 0),
    rotationDegrees: d(o.rotation, 0),
    zOffset: d(o.zOffset, 0)
  })), c = (s.skins || []).map((o) => ({
    id: String(o.id),
    name: String(o.name || o.id),
    parts: B(o.parts)
  })), l = (s.states || []).map((o) => ({
    id: String(o.id),
    key: String(o.key || o.id),
    name: String(o.name || o.key || o.id),
    partId: String(o.part)
  })), a = (s.animations || []).map((o) => ({
    id: String(o.id),
    name: String(o.name || o.id),
    fps: d(o.fps, 24),
    loop: o.loop !== !1,
    frames: (o.frames || []).map((u) => ({
      index: d(u.index, 0),
      sourceFrame: d(u.sourceFrame, d(u.index, 0)),
      parts: (u.parts || []).map((h) => ({
        partId: String(h.part),
        stateIndex: C(l, h.state ?? h.stateIndex),
        nextStateIndex: C(l, h.nextState ?? h.nextStateIndex),
        hasNextState: h.hasNextState === !0 || h.nextState !== void 0 || h.nextStateIndex !== void 0,
        stateMix: j(d(h.stateMix, 0)),
        ...$(h)
      })),
      events: (u.events || []).map((h) => ({
        name: String(h.name || h.eventName || ""),
        data: String(h.data || "")
      }))
    }))
  }));
  return {
    name: String(s.name || "spla"),
    canvasWidth: e,
    canvasHeight: n,
    parts: i,
    variants: r,
    skins: c,
    states: l,
    animations: a
  };
}
function _(s, t, e, n) {
  return {
    x: s - e * 0.5,
    y: t - n * 0.5
  };
}
function ot(s, t) {
  if (!s || !t)
    return -1;
  const e = s.states.findIndex((i) => i.id === t);
  if (e >= 0)
    return e;
  const n = s.states.findIndex((i) => i.key === t);
  return n >= 0 ? n : s.states.findIndex((i) => I(i.name, t));
}
function C(s, t) {
  if (typeof t == "number" && t >= 0)
    return t < s.length ? t : -1;
  if (typeof t == "string" && t.length > 0) {
    const e = s.findIndex((i) => i.id === t);
    if (e >= 0)
      return e;
    const n = s.findIndex((i) => i.key === t);
    return n >= 0 ? n : s.findIndex((i) => I(i.name, t));
  }
  return -1;
}
function B(s) {
  const t = {};
  for (const [e, n] of Object.entries(s || {})) {
    if (typeof n != "object" || n === null)
      continue;
    const i = n, r = i.states, c = {};
    for (const [l, a] of Object.entries(r || {}))
      a != null && (c[l] = String(a));
    t[e] = {
      variant: i.variant ? String(i.variant) : void 0,
      visible: i.visible === !1 ? !1 : i.visible === !0 ? !0 : void 0,
      states: Object.keys(c).length > 0 ? c : void 0
    };
  }
  return t;
}
function j(s) {
  return Math.max(0, Math.min(1, s));
}
function k(s, t) {
  const e = t || s, n = s.width, i = s.height, r = d(e.width, n), c = d(e.height, i), l = s.pivot.x, a = s.pivot.y;
  return {
    asset: e.asset,
    width: r,
    height: c,
    pivotX: t ? l + (r - n) * 0.5 - t.offsetX : l,
    pivotY: t ? a + (c - i) * 0.5 - t.offsetY : a,
    rotationDegrees: t ? t.rotationDegrees : 0,
    zOffset: t ? t.zOffset : 0
  };
}
function N(s, t) {
  return !s || !s.parts ? null : s.parts[t] || s.parts[t.replace(/-/g, "_")] || null;
}
function O(s, t, e, n, i, r) {
  var o, u, h;
  const c = r.get(t.id);
  if (c !== void 0) {
    if (c < 0)
      return k(t, null);
    const p = s.variants[c];
    return k(t, p);
  }
  const l = i >= 0 ? s.skins[i] : null, a = N(l, t.id);
  if ((a == null ? void 0 : a.visible) === !1)
    return null;
  if (n >= 0) {
    const p = s.states[n];
    if (p && p.partId === t.id) {
      const f = ((o = a == null ? void 0 : a.states) == null ? void 0 : o[p.id]) ?? ((u = a == null ? void 0 : a.states) == null ? void 0 : u[p.key]) ?? ((h = a == null ? void 0 : a.states) == null ? void 0 : h[p.name]);
      if (f) {
        const x = b(s, e, f);
        if (x >= 0)
          return k(t, s.variants[x]);
      }
    }
  }
  if (a != null && a.variant) {
    const p = b(s, e, a.variant);
    if (p >= 0)
      return k(t, s.variants[p]);
  }
  return k(t, null);
}
function G(s, t, e, n, i) {
  const r = g(s, t), c = r >= 0 ? s.parts[r] : null;
  if (!c || c.transformOnly)
    return { current: null, next: null, mix: 0 };
  const l = O(
    s,
    c,
    r,
    (e == null ? void 0 : e.stateIndex) ?? -1,
    n,
    i
  );
  if (!e || !e.hasNextState || e.nextStateIndex < 0 || e.stateMix <= 0)
    return { current: l, next: null, mix: 0 };
  const a = O(
    s,
    c,
    r,
    e.nextStateIndex,
    n,
    i
  );
  return !l && a ? { current: a, next: null, mix: 0 } : a ? {
    current: l,
    next: a,
    mix: j(e.stateMix)
  } : { current: l, next: null, mix: 0 };
}
function J(s, t = "") {
  const e = s instanceof Uint8Array ? s : new Uint8Array(s), n = W(e), i = n["manifest.json"];
  if (!i)
    throw new Error(`SpriteLoop package '${t}' is missing manifest.json`);
  const r = JSON.parse(new TextDecoder().decode(i)), c = H(r), l = {};
  for (const [a, o] of Object.entries(n))
    a.endsWith("/") || a === "manifest.json" || (l[a] = o);
  for (const a of c.parts)
    if (a.asset && !l[a.asset])
      throw new Error(`SpriteLoop package '${t}' is missing asset '${a.asset}'`);
  for (const a of c.variants)
    if (a.asset && !l[a.asset])
      throw new Error(`SpriteLoop package '${t}' is missing asset '${a.asset}'`);
  return {
    path: t,
    byteCount: e.byteLength,
    ...c,
    assets: l
  };
}
function z(s, t) {
  return `${s}!${t}`;
}
class Q extends T.Loader.File {
  constructor(t, e, n, i) {
    if (typeof e == "object") {
      const r = e;
      e = r.key, n = r.url, i = r.xhrSettings;
    }
    super(t, {
      type: "spla",
      cache: !1,
      extension: "spla",
      responseType: "arraybuffer",
      key: e,
      url: n,
      xhrSettings: i
    });
  }
  onProcess() {
    this.state = T.Loader.FILE_PROCESSING;
    try {
      const t = new Uint8Array(this.xhrLoader.response), e = J(t, String(this.url || this.key)), n = this.loader.scene.game, i = F(n), r = this.loader.scene.textures, c = Object.entries(e.assets);
      if (c.length === 0) {
        i.add(this.key, {
          ...e,
          assets: []
        }), this.data = i.get(this.key), this.onProcessComplete();
        return;
      }
      let l = c.length, a = !1;
      const o = () => {
        i.add(this.key, {
          ...e,
          assets: Object.keys(e.assets)
        }), this.data = i.get(this.key), this.onProcessComplete();
      }, u = (h) => {
        a || (a = !0, console.error(h), this.onProcessError());
      };
      for (const [h, p] of c) {
        const f = z(this.key, h), x = new Blob([Uint8Array.from(p)], { type: "image/png" }), m = URL.createObjectURL(x), y = new Image();
        y.onload = () => {
          URL.revokeObjectURL(m), !a && (r.exists(f) && r.remove(f), r.addImage(f, y), l -= 1, l === 0 && o());
        }, y.onerror = () => {
          URL.revokeObjectURL(m), u(new Error(`Failed to decode SpriteLoop texture '${h}'`));
        }, y.src = m;
      }
    } catch (t) {
      console.error(t), this.onProcessError();
    }
  }
}
function Z(s, t, e) {
  if (Array.isArray(t)) {
    this.multiFile(this.spla, s, t, e);
    return;
  }
  this.addFile(new Q(this, s, t, e));
}
const { TransformMatrix: L } = Y.Components, w = Symbol("spriteloopSkewEnabled");
function V(s, t = 0, e = 0) {
  const n = s;
  if (n[w])
    return n.skew.x = t, n.skew.y = e, n;
  n[w] = !0, n.skew = { x: t, y: e };
  const i = new L(), r = new L(), c = (o) => {
    const u = Math.tan(n.skew.x), h = Math.tan(n.skew.y);
    return i.setTransform(
      1,
      h,
      u,
      1,
      -u * n.y,
      -h * n.x
    ), o ? (r.copyFrom(o), r.multiply(i), r) : i;
  };
  s.addRenderStep((o, u, h, p, f, x, m) => {
    u.renderWebGLStep(
      o,
      u,
      h,
      c(p),
      (f ?? 0) + 1,
      x,
      m
    );
  }, 0);
  const l = s, a = l.renderCanvas.bind(l);
  return l.renderCanvas = function(...o) {
    return o[3] = c(o[3]), a(...o);
  }, n;
}
function K(s) {
  return !!s[w];
}
const v = Math.PI / 180;
function D(s, t, e, n = {}) {
  if (!t)
    return null;
  const i = g(s, e), r = i >= 0 ? s.parts[i] : null;
  if (!r || t.partId !== r.id)
    return null;
  const c = n.origin === "center", l = _(
    t.x,
    t.y,
    s.canvasWidth,
    s.canvasHeight
  ), a = {
    position: {
      x: l.x,
      y: -l.y
    },
    rotation: -t.rotation,
    scale: {
      x: t.scaleX,
      y: t.scaleY
    },
    skew: {
      x: -t.skewX,
      y: -t.skewY
    },
    opacity: t.opacity
  };
  if (c && !r.transformOnly) {
    const o = (r.width * 0.5 - r.pivot.x) * t.scaleX, u = (r.pivot.y - r.height * 0.5) * t.scaleY, h = Math.tan(-t.skewX * v), p = Math.tan(-t.skewY * v), f = o + h * u, x = p * o + u, m = -t.rotation * v, y = Math.cos(m), M = Math.sin(m);
    a.position.x += f * y - x * M, a.position.y += f * M + x * y;
  }
  return a;
}
function P(s, t, e) {
  const n = g(s, e), i = n >= 0 ? s.parts[n] : null;
  return i && t.find((r) => r.partId === i.id) || null;
}
function X(s, t, e, n, i, r) {
  const c = _(
    t.x,
    t.y,
    i.canvasWidth,
    i.canvasHeight
  );
  s.setVisible(!0), s.setOrigin(n.pivotX / n.width, n.pivotY / n.height), s.setPosition(c.x, c.y), s.setRotation((t.rotation + n.rotationDegrees) * v), s.setScale(t.scaleX, t.scaleY), K(s) && (s.skew.x = t.skewX * v, s.skew.y = t.skewY * v);
  const [l, a, o] = t.tint, u = tt(l * r.r, a * r.g, o * r.b);
  s.setAlpha(t.opacity), u === 16777215 ? s.clearTint() : s.setTint(u);
}
function tt(s, t, e) {
  const n = (l) => Math.max(0, Math.min(1, l)), i = Math.floor(n(s) * 255), r = Math.floor(n(t) * 255), c = Math.floor(n(e) * 255);
  return i << 16 | r << 8 | c;
}
const R = 256;
class et {
  constructor(t, e = R) {
    this.pendingEvents = [], this.droppedEventCount = 0, this.playbackRate = 1, this.playing = !1, this.playbackEventsEnabled = !0, this.loopOverride = null, this.elapsedSeconds = 0, this.currentAnimationIndex = -1, this.currentFrameIndex = 0, this.emitter = null, this.package = t, this.maxPendingEvents = e > 0 ? e : R;
  }
  get currentAnimation() {
    return this.currentAnimationIndex >= 0 ? this.package.animations[this.currentAnimationIndex] : null;
  }
  get currentFrame() {
    const t = this.currentAnimation;
    if (!t || t.frames.length === 0)
      return null;
    const e = Math.max(0, Math.min(this.currentFrameIndex, t.frames.length - 1));
    return t.frames[e];
  }
  get effectiveLoop() {
    const t = this.currentAnimation;
    return t ? this.loopOverride !== null ? this.loopOverride : t.loop : !1;
  }
  play(t, e = {}) {
    const n = q(this.package, t);
    if (n < 0)
      return !1;
    const i = e.emitEvents !== !1;
    return this.currentAnimationIndex = n, this.elapsedSeconds = 0, this.currentFrameIndex = 0, this.playing = !0, this.playbackEventsEnabled = i, this.loopOverride = typeof e.loop == "boolean" ? e.loop : null, i && this.queueFrameEvents(this.currentAnimation, 0), !0;
  }
  stop() {
    this.playing = !1;
  }
  update(t) {
    const e = this.currentAnimation;
    if (!this.playing || !e || e.frames.length === 0 || e.fps <= 0)
      return;
    const n = this.rawFrameIndexForTime(e);
    this.elapsedSeconds += t * this.playbackRate;
    const i = this.rawFrameIndexForTime(e);
    this.playbackEventsEnabled && this.queueCrossedEvents(e, n, i), this.currentFrameIndex = this.frameIndexForTime(e);
  }
  setTime(t, e = {}) {
    const n = this.currentAnimation;
    if (!n || n.frames.length === 0)
      return;
    const i = e.emitEvents !== !1;
    this.elapsedSeconds = Math.max(0, t);
    const r = this.frameIndexForTime(n);
    i && this.playbackEventsEnabled && this.queueFrameEvents(n, r), this.currentFrameIndex = r;
  }
  setFrame(t, e = {}) {
    const n = this.currentAnimation;
    if (!n || n.frames.length === 0)
      return;
    const i = e.emitEvents !== !1, r = Math.max(0, Math.min(t, n.frames.length - 1));
    this.elapsedSeconds = r / n.fps, this.currentFrameIndex = r, i && this.playbackEventsEnabled && this.queueFrameEvents(n, r);
  }
  consumeEvents() {
    const t = this.pendingEvents.slice();
    return this.pendingEvents.length = 0, t;
  }
  rawFrameIndexForTime(t = this.currentAnimation) {
    return !t || t.frames.length === 0 || t.fps <= 0 ? 0 : Math.floor(this.elapsedSeconds * t.fps);
  }
  frameIndexForTime(t = this.currentAnimation) {
    if (!t || t.frames.length === 0)
      return 0;
    const e = this.rawFrameIndexForTime(t);
    if (this.effectiveLoop) {
      const n = t.frames.length;
      return (e % n + n) % n;
    }
    return Math.max(0, Math.min(e, t.frames.length - 1));
  }
  queueCrossedEvents(t, e, n) {
    if (!t || t.frames.length === 0)
      return;
    if (this.effectiveLoop) {
      const c = t.frames.length;
      if (n >= e)
        for (let l = e + 1; l <= n; l++)
          this.queueFrameEvents(t, (l % c + c) % c);
      else
        for (let l = e + 1; l < e + c; l++)
          this.queueFrameEvents(t, (l % c + c) % c);
      return;
    }
    const i = t.frames.length - 1, r = Math.min(n, i);
    for (let c = e + 1; c <= r; c++)
      this.queueFrameEvents(t, c);
  }
  queueFrameEvents(t, e) {
    const n = t.frames[e];
    if (n)
      for (const i of n.events)
        this.queueEvent({
          animationId: t.id,
          animationName: t.name,
          frameIndex: n.index,
          sourceFrame: n.sourceFrame,
          name: i.name,
          eventName: i.name,
          data: i.data
        });
  }
  queueEvent(t) {
    this.pendingEvents.length >= this.maxPendingEvents && (this.pendingEvents.shift(), this.droppedEventCount += 1), this.pendingEvents.push(t), this.emitPlaybackEvent(t);
  }
  emitPlaybackEvent(t) {
    if (!this.emitter)
      return;
    const e = t.eventName || t.name;
    this.emitter.emit(e, t), e !== E && this.emitter.emit(E, t);
  }
}
class at extends Y.Container {
  constructor(t, e, n, i, r = {}) {
    super(t, e, n), this.variantOverrides = /* @__PURE__ */ new Map(), this.tint = { r: 1, g: 1, b: 1 }, this.partImages = /* @__PURE__ */ new Map(), this.partMixImages = /* @__PURE__ */ new Map(), this.playbackRate = 1, this.splaKey = i;
    const c = F(t.game).get(i);
    if (!c)
      throw new Error(`SpriteLoop package '${i}' is not loaded`);
    this.package = c, this.player = new et(this.package, r.maxPendingEvents), this.player.emitter = this, this.skinIndex = A(this.package, r.skin || "default"), t.add.existing(this), this.setSize(this.package.canvasWidth, this.package.canvasHeight), this.createPartImages(), this.applyFrame(), r.autoplay !== !1 && this.package.animations.length > 0 && this.play(r.animation || this.package.animations[0].id, {
      loop: r.loop,
      emitEvents: r.emitEvents
    });
  }
  createPartImages() {
    for (const t of this.package.parts) {
      if (t.transformOnly)
        continue;
      const e = V(this.scene.add.image(0, 0, "__WHITE"));
      e.setName(`${t.id}__primary`), e.setVisible(!1), this.add(e), this.partImages.set(t.id, e);
      const n = V(this.scene.add.image(0, 0, "__WHITE"));
      n.setName(`${t.id}__mix`), n.setVisible(!1), this.add(n), this.partMixImages.set(t.id, n);
    }
  }
  play(t, e = {}) {
    return this.player.play(t, e);
  }
  stop() {
    this.player.stop();
  }
  setSkin(t) {
    const e = A(this.package, t);
    return e < 0 ? !1 : (this.skinIndex = e, this.applyFrame(), !0);
  }
  setVariant(t, e) {
    const n = g(this.package, t);
    if (n < 0)
      return !1;
    const i = this.package.parts[n];
    if (nt(e))
      return this.variantOverrides.set(i.id, -1), this.applyFrame(), !0;
    const r = b(this.package, n, e);
    return r < 0 ? !1 : (this.variantOverrides.set(i.id, r), this.applyFrame(), !0);
  }
  clearVariant(t) {
    const e = g(this.package, t);
    return e < 0 ? !1 : (this.variantOverrides.delete(this.package.parts[e].id), this.applyFrame(), !0);
  }
  clearVariants() {
    this.variantOverrides.clear(), this.applyFrame();
  }
  setTint(t, e, n) {
    this.tint = {
      r: S(t),
      g: S(e),
      b: S(n)
    }, this.applyFrame();
  }
  clearTint() {
    this.tint = { r: 1, g: 1, b: 1 }, this.applyFrame();
  }
  consumeEvents() {
    return this.player.consumeEvents();
  }
  getPartTransform(t, e = {}) {
    const n = this.player.currentFrame;
    if (!n)
      return null;
    const i = P(this.package, n.parts, t);
    return i ? D(this.package, i, t, e) : null;
  }
  preUpdate(t, e) {
    this.player.playing && (this.player.update(e / 1e3), this.applyFrame());
  }
  applyResolvedTexture(t, e) {
    if (!(e != null && e.asset))
      return t.setVisible(!1), !1;
    const n = z(this.splaKey, e.asset);
    return this.scene.textures.exists(n) ? (t.setTexture(n), !0) : (t.setVisible(!1), !1);
  }
  applyFrame() {
    const t = this.player.currentFrame;
    if (!t)
      return;
    const e = t.parts.slice().sort((n, i) => {
      const r = this.package.parts[g(this.package, n.partId)], c = this.package.parts[g(this.package, i.partId)], l = ((r == null ? void 0 : r.drawOrder) || 0) + n.zOffset, a = ((c == null ? void 0 : c.drawOrder) || 0) + i.zOffset;
      return l - a;
    });
    for (const n of e) {
      const i = this.partImages.get(n.partId), r = this.partMixImages.get(n.partId), c = g(this.package, n.partId), l = c >= 0 ? this.package.parts[c] : null, a = G(
        this.package,
        n.partId,
        n,
        this.skinIndex,
        this.variantOverrides
      );
      if (!i || !r || !l) {
        i == null || i.setVisible(!1), r == null || r.setVisible(!1);
        continue;
      }
      if (!a.current) {
        i.setVisible(!1), r.setVisible(!1);
        continue;
      }
      const o = a.next !== null && a.mix > 0 && a.mix < 1;
      if (!this.applyResolvedTexture(i, a.current)) {
        r.setVisible(!1);
        continue;
      }
      X(i, n, l, a.current, this.package, this.tint), i.setAlpha(n.opacity * (o ? 1 - a.mix : 1)), o && a.next && this.applyResolvedTexture(r, a.next) ? (X(r, n, l, a.next, this.package, this.tint), r.setAlpha(n.opacity * a.mix)) : r.setVisible(!1);
    }
    for (const n of e) {
      const i = this.partMixImages.get(n.partId), r = this.partImages.get(n.partId);
      i != null && i.visible && this.bringToTop(i), r != null && r.visible && this.bringToTop(r);
    }
  }
  getInfo() {
    var t;
    return {
      path: this.package.path,
      byteCount: this.package.byteCount,
      name: this.package.name,
      canvasWidth: this.package.canvasWidth,
      canvasHeight: this.package.canvasHeight,
      skinIndex: this.skinIndex,
      playing: this.player.playing,
      animationId: ((t = this.player.currentAnimation) == null ? void 0 : t.id) || null,
      frameIndex: this.player.currentFrameIndex,
      pendingEventCount: this.player.pendingEvents.length,
      droppedEventCount: this.player.droppedEventCount,
      animations: this.package.animations.map((e) => ({
        id: e.id,
        name: e.name,
        frameCount: e.frames.length,
        fps: e.fps,
        loop: e.loop
      })),
      skins: this.package.skins.map((e) => ({
        id: e.id,
        name: e.name
      }))
    };
  }
}
function nt(s) {
  return s.localeCompare("default", void 0, { sensitivity: "accent" }) === 0;
}
function S(s) {
  return Math.max(0, Math.min(1, s));
}
class ct extends U.BasePlugin {
  constructor(t) {
    super(t), t.registerFileType("spla", Z);
  }
  boot() {
    F(this.game);
  }
}
export {
  E as SPLA_EVENT,
  rt as SplaEvents,
  at as SplaObject,
  et as SplaPlayer,
  ct as SplaPlugin,
  _ as canvasToLocal,
  z as createSplaCacheKey,
  ct as default,
  V as enableSkew,
  F as ensureSplaCache,
  q as findAnimationIndex,
  P as findFramePartForPart,
  g as findPartIndex,
  A as findSkinIndex,
  ot as findStateIndex,
  b as findVariantIndex,
  D as getPartTransform,
  K as isSkewEnabled,
  J as parseSplaBytes,
  J as parseSplaPackageBytes,
  G as resolvePartFrameRender,
  k as resolvePartImage,
  N as resolveSkinPartOverride
};
//# sourceMappingURL=spriteloop-phaser.js.map
