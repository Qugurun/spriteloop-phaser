export interface SplaRgb {
    r: number;
    g: number;
    b: number;
}

export interface SplaPivot {
    x: number;
    y: number;
}

export interface SplaPart {
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

export interface SplaVariant {
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

export interface SplaSkinPartOverride {
    variant?: string;
    visible?: boolean;
    states?: Record<string, string>;
}

export interface SplaSkin {
    id: string;
    name: string;
    parts: Record<string, SplaSkinPartOverride>;
}

export interface SplaSpriteState {
    id: string;
    key: string;
    name: string;
    partId: string;
}

export interface SplaFramePart {
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
    tint: [ number, number, number ];
    stateIndex: number;
    nextStateIndex: number;
    hasNextState: boolean;
    stateMix: number;
}

export interface SplaEvent {
    name: string;
    data: string;
}

export interface SplaFrame {
    index: number;
    sourceFrame: number;
    parts: SplaFramePart[];
    events: SplaEvent[];
}

export interface SplaAnimation {
    id: string;
    name: string;
    fps: number;
    loop: boolean;
    frames: SplaFrame[];
}

export interface SplaPackageData {
    name: string;
    canvasWidth: number;
    canvasHeight: number;
    parts: SplaPart[];
    variants: SplaVariant[];
    skins: SplaSkin[];
    states: SplaSpriteState[];
    animations: SplaAnimation[];
}

export interface ParsedSplaPackage extends SplaPackageData {
    path: string;
    byteCount: number;
    assets: Record<string, Uint8Array>;
}

export interface CachedSplaPackage extends SplaPackageData {
    path: string;
    byteCount: number;
    assets: string[];
}

export interface ResolvedPartImage {
    asset?: string;
    width: number;
    height: number;
    pivotX: number;
    pivotY: number;
    rotationDegrees: number;
    zOffset: number;
}

export interface SplaPlaybackEvent {
    animationId: string;
    animationName: string;
    frameIndex: number;
    sourceFrame: number;
    name: string;
    eventName: string;
    data: string;
}

export type SplaEventCallback = (event: SplaPlaybackEvent) => void;

export interface SplaPlayOptions {
    loop?: boolean;
    emitEvents?: boolean;
}

export interface SplaObjectOptions {
    animation?: string;
    skin?: string;
    loop?: boolean;
    autoplay?: boolean;
    emitEvents?: boolean;
    maxPendingEvents?: number;
}

export interface SplaPartTransform {
    position: { x: number; y: number };
    rotation: number;
    scale: { x: number; y: number };
    skew: { x: number; y: number };
    opacity: number;
}

export interface SplaPartTransformOptions {
    origin?: 'pivot' | 'center';
}

export interface SplaResolvedPartRender {
    asset?: string;
    width: number;
    height: number;
    pivotX: number;
    pivotY: number;
    rotationDegrees: number;
    zOffset: number;
}

export interface SplaFramePartRender {
    current: SplaResolvedPartRender | null;
    next: SplaResolvedPartRender | null;
    mix: number;
}

export interface SplaObjectInfo {
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

declare module 'phaser' {
    namespace Loader {
        interface LoaderPlugin {
            spla(key: string, url?: string): this;
            spla(config: { key: string; url?: string; xhrSettings?: Phaser.Types.Loader.XHRSettingsObject }): this;
            multiFile(
                fileType: (key: string, url: string, xhrSettings?: Phaser.Types.Loader.XHRSettingsObject) => void,
                key: string,
                url: string[],
                xhrSettings?: Phaser.Types.Loader.XHRSettingsObject
            ): this;
        }
    }

    namespace Cache {
        interface CustomCache {
            spla?: Phaser.Cache.BaseCache;
        }
    }
}
