import { Cache as Cache_2 } from 'phaser';
import { default as default_2 } from 'phaser';
import { Game } from 'phaser';
import { GameObjects } from 'phaser';
import { Plugins } from 'phaser';
import { Scene } from 'phaser';

export declare interface CachedSplaPackage extends SplaPackageData {
    path: string;
    byteCount: number;
    assets: string[];
}

export declare function canvasToLocal(x: number, y: number, canvasWidth: number, canvasHeight: number): {
    x: number;
    y: number;
};

export declare function createSplaCacheKey(splaKey: string, assetPath: string): string;

export declare function ensureSplaCache(game: Game): Cache_2.BaseCache;

export declare function findAnimationIndex(packageData: SplaPackageData, animationIdOrName: string): number;

export declare function findFramePartForPart(packageData: SplaPackageData, frameParts: SplaFramePart[], partIdKeyOrName: string): SplaFramePart | null;

export declare function findPartIndex(packageData: SplaPackageData, partIdKeyOrName: string): number;

export declare function findSkinIndex(packageData: SplaPackageData, skinIdOrName: string): number;

export declare function findStateIndex(packageData: SplaPackageData, stateIdKeyOrName: string): number;

export declare function findVariantIndex(packageData: SplaPackageData, partIndex: number, variantIdKeyOrName: string): number;

export declare function getPartTransform(packageData: SplaPackageData, framePart: SplaFramePart | null, partIdKeyOrName: string, options?: SplaPartTransformOptions): SplaPartTransform | null;

export declare interface ParsedSplaPackage extends SplaPackageData {
    path: string;
    byteCount: number;
    assets: Record<string, Uint8Array>;
}

declare function parseSplaBytes(bytes: ArrayBuffer | Uint8Array, path?: string): ParsedSplaPackage;
export { parseSplaBytes }
export { parseSplaBytes as parseSplaPackageBytes }

export declare interface ResolvedPartImage {
    asset?: string;
    width: number;
    height: number;
    pivotX: number;
    pivotY: number;
    rotationDegrees: number;
    zOffset: number;
}

export declare function resolvePartFrameRender(packageData: SplaPackageData, partId: string, framePart: SplaFramePart | null, skinIndex: number, variantOverrides: Map<string, number>): SplaFramePartRender;

export declare function resolvePartImage(part: SplaPart, variant: SplaVariant | null): SplaResolvedPartRender;

export declare function resolveSkinPartOverride(skin: SplaSkin | null, partId: string): SplaSkinPartOverride | null;

export declare const SPLA_EVENT = "spriteloop";

export declare interface SplaAnimation {
    id: string;
    name: string;
    fps: number;
    loop: boolean;
    frames: SplaFrame[];
}

export declare interface SplaEvent {
    name: string;
    data: string;
}

export declare type SplaEventCallback = (event: SplaPlaybackEvent) => void;

export declare const SplaEvents: {
    readonly EVENT: "spriteloop";
};

export declare interface SplaFrame {
    index: number;
    sourceFrame: number;
    parts: SplaFramePart[];
    events: SplaEvent[];
}

export declare interface SplaFramePart {
    partId: string;
    x: number;
    y: number;
    rotation: number;
    skewX: number;
    skewY: number;
    scaleX: number;
    scaleY: number;
    opacity: number;
    zOffset: number;
    tint: [number, number, number];
    stateIndex: number;
    nextStateIndex: number;
    hasNextState: boolean;
    stateMix: number;
}

export declare interface SplaFramePartRender {
    current: SplaResolvedPartRender | null;
    next: SplaResolvedPartRender | null;
    mix: number;
}

export declare class SplaObject extends GameObjects.Container {
    readonly splaKey: string;
    readonly package: CachedSplaPackage;
    readonly player: SplaPlayer;
    skinIndex: number;
    readonly variantOverrides: Map<string, number>;
    tint: SplaRgb;
    readonly partImages: Map<string, GameObjects.Image>;
    readonly partMixImages: Map<string, GameObjects.Image>;
    playbackRate: number;
    constructor(scene: Scene, x: number, y: number, splaKey: string, options?: SplaObjectOptions);
    private createPartImages;
    play(animationIdOrName: string, options?: SplaPlayOptions): boolean;
    stop(): void;
    setSkin(skinIdOrName: string): boolean;
    setVariant(partIdKeyOrName: string, variantIdKeyOrName: string): boolean;
    clearVariant(partIdKeyOrName: string): boolean;
    clearVariants(): void;
    setTint(r: number, g: number, b: number): void;
    clearTint(): void;
    consumeEvents(): SplaPlaybackEvent[];
    getPartTransform(partIdKeyOrName: string, options?: SplaPartTransformOptions): SplaPartTransform | null;
    preUpdate(_time: number, delta: number): void;
    private applyResolvedTexture;
    private applyFrame;
    getInfo(): SplaObjectInfo;
}

export declare interface SplaObjectInfo {
    path: string;
    byteCount: number;
    name: string;
    canvasWidth: number;
    canvasHeight: number;
    skinIndex: number;
    playing: boolean;
    animationId: string | null;
    frameIndex: number;
    pendingEventCount: number;
    droppedEventCount: number;
    animations: Array<{
        id: string;
        name: string;
        frameCount: number;
        fps: number;
        loop: boolean;
    }>;
    skins: Array<{
        id: string;
        name: string;
    }>;
}

export declare interface SplaObjectOptions {
    animation?: string;
    skin?: string;
    loop?: boolean;
    autoplay?: boolean;
    emitEvents?: boolean;
    maxPendingEvents?: number;
}

export declare interface SplaPackageData {
    name: string;
    canvasWidth: number;
    canvasHeight: number;
    parts: SplaPart[];
    variants: SplaVariant[];
    skins: SplaSkin[];
    states: SplaSpriteState[];
    animations: SplaAnimation[];
}

export declare interface SplaPart {
    id: string;
    key: string;
    name: string;
    asset?: string;
    transformOnly: boolean;
    width: number;
    height: number;
    pivot: SplaPivot;
    drawOrder: number;
    visible: boolean;
}

export declare interface SplaPartTransform {
    position: {
        x: number;
        y: number;
    };
    rotation: number;
    scale: {
        x: number;
        y: number;
    };
    skew: {
        x: number;
        y: number;
    };
    opacity: number;
}

export declare interface SplaPartTransformOptions {
    origin?: 'pivot' | 'center';
}

export declare interface SplaPivot {
    x: number;
    y: number;
}

export declare interface SplaPlaybackEvent {
    animationId: string;
    animationName: string;
    frameIndex: number;
    sourceFrame: number;
    name: string;
    eventName: string;
    data: string;
}

export declare class SplaPlayer {
    readonly package: SplaPackageData | CachedSplaPackage;
    readonly maxPendingEvents: number;
    pendingEvents: SplaPlaybackEvent[];
    droppedEventCount: number;
    playbackRate: number;
    playing: boolean;
    playbackEventsEnabled: boolean;
    loopOverride: boolean | null;
    elapsedSeconds: number;
    currentAnimationIndex: number;
    currentFrameIndex: number;
    emitter: default_2.Events.EventEmitter | null;
    constructor(packageData: SplaPackageData | CachedSplaPackage, maxPendingEvents?: number);
    get currentAnimation(): SplaAnimation | null;
    get currentFrame(): SplaFrame | null;
    get effectiveLoop(): boolean;
    play(animationIdOrName: string, options?: SplaPlayOptions): boolean;
    stop(): void;
    update(deltaSeconds: number): void;
    setTime(seconds: number, options?: SplaPlayOptions): void;
    setFrame(frameIndex: number, options?: SplaPlayOptions): void;
    consumeEvents(): SplaPlaybackEvent[];
    rawFrameIndexForTime(animation?: SplaAnimation | null): number;
    frameIndexForTime(animation?: SplaAnimation | null): number;
    private queueCrossedEvents;
    private queueFrameEvents;
    private queueEvent;
    private emitPlaybackEvent;
}

export declare interface SplaPlayOptions {
    loop?: boolean;
    emitEvents?: boolean;
}

declare class SplaPlugin extends Plugins.BasePlugin {
    constructor(pluginManager: Phaser.Plugins.PluginManager);
    boot(): void;
}
export { SplaPlugin }
export default SplaPlugin;

export declare interface SplaResolvedPartRender {
    asset?: string;
    width: number;
    height: number;
    pivotX: number;
    pivotY: number;
    rotationDegrees: number;
    zOffset: number;
}

export declare interface SplaRgb {
    r: number;
    g: number;
    b: number;
}

export declare interface SplaSkin {
    id: string;
    name: string;
    parts: Record<string, SplaSkinPartOverride>;
}

export declare interface SplaSkinPartOverride {
    variant?: string;
    visible?: boolean;
    states?: Record<string, string>;
}

export declare interface SplaSpriteState {
    id: string;
    key: string;
    name: string;
    partId: string;
}

export declare interface SplaVariant {
    id: string;
    key: string;
    name: string;
    partId: string;
    asset?: string;
    width: number;
    height: number;
    offsetX: number;
    offsetY: number;
    rotationDegrees: number;
    zOffset: number;
}

export { }


declare module 'phaser' {
    namespace Loader {
        interface LoaderPlugin {
            spla(key: string, url?: string): this;
            spla(config: {
                key: string;
                url?: string;
                xhrSettings?: Phaser.Types.Loader.XHRSettingsObject;
            }): this;
            multiFile(fileType: (key: string, url: string, xhrSettings?: Phaser.Types.Loader.XHRSettingsObject) => void, key: string, url: string[], xhrSettings?: Phaser.Types.Loader.XHRSettingsObject): this;
        }
    }
    namespace Cache {
        interface CustomCache {
            spla?: Phaser.Cache.BaseCache;
        }
    }
}
