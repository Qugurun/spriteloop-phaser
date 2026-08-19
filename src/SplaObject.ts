import Phaser, { GameObjects, type Scene } from 'phaser';
import { ensureSplaCache } from './SplaCache';
import { enableSkew } from './Skew';
import {
    applyImageTransform,
    findFramePartForPart,
    getPartTransform as computePartTransform
} from './SplaPartTransform';
import { SplaPlayer } from './SplaPlayer';
import {
    createSplaCacheKey,
    findPartIndex,
    findSkinIndex,
    findVariantIndex,
    resolvePartFrameRender
} from './SplaPackage';
import type {
    CachedSplaPackage,
    SplaObjectInfo,
    SplaObjectOptions,
    SplaPartTransform,
    SplaPartTransformOptions,
    SplaPlayOptions,
    SplaPlaybackEvent,
    SplaResolvedPartRender,
    SplaRgb
} from './types';

export class SplaObject extends GameObjects.Container
{
    readonly splaKey: string;
    readonly package: CachedSplaPackage;
    readonly player: SplaPlayer;

    skinIndex: number;
    readonly variantOverrides = new Map<string, number>();
    tint: SplaRgb = { r: 1, g: 1, b: 1 };
    readonly partImages = new Map<string, Phaser.GameObjects.Image>();
    readonly partMixImages = new Map<string, Phaser.GameObjects.Image>();
    playbackRate = 1;

    constructor(scene: Scene, x: number, y: number, splaKey: string, options: SplaObjectOptions = {})
    {
        super(scene, x, y);

        this.splaKey = splaKey;
        const cached = ensureSplaCache(scene.game).get(splaKey) as CachedSplaPackage | undefined;

        if (!cached)
        {
            throw new Error(`SpriteLoop package '${splaKey}' is not loaded`);
        }

        this.package = cached;
        this.player = new SplaPlayer(this.package, options.maxPendingEvents);
        this.player.emitter = this;
        this.skinIndex = findSkinIndex(this.package, options.skin || 'default');

        scene.add.existing(this);
        this.setSize(this.package.canvasWidth, this.package.canvasHeight);

        this.createPartImages();
        this.applyFrame();

        if (options.autoplay !== false && this.package.animations.length > 0)
        {
            this.play(options.animation || this.package.animations[0].id, {
                loop: options.loop,
                emitEvents: options.emitEvents
            });
        }
    }

    private createPartImages(): void
    {
        for (const part of this.package.parts)
        {
            if (part.transformOnly)
            {
                continue;
            }

            const primary = enableSkew(this.scene.add.image(0, 0, '__WHITE'));
            primary.setName(`${part.id}__primary`);
            primary.setVisible(false);
            this.add(primary);
            this.partImages.set(part.id, primary);

            const mix = enableSkew(this.scene.add.image(0, 0, '__WHITE'));
            mix.setName(`${part.id}__mix`);
            mix.setVisible(false);
            this.add(mix);
            this.partMixImages.set(part.id, mix);
        }
    }

    play(animationIdOrName: string, options: SplaPlayOptions = {}): boolean
    {
        return this.player.play(animationIdOrName, options);
    }

    stop(): void
    {
        this.player.stop();
    }

    setSkin(skinIdOrName: string): boolean
    {
        const skinIndex = findSkinIndex(this.package, skinIdOrName);

        if (skinIndex < 0)
        {
            return false;
        }

        this.skinIndex = skinIndex;
        this.applyFrame();
        return true;
    }

    setVariant(partIdKeyOrName: string, variantIdKeyOrName: string): boolean
    {
        const partIndex = findPartIndex(this.package, partIdKeyOrName);

        if (partIndex < 0)
        {
            return false;
        }

        const part = this.package.parts[partIndex];

        if (isDefaultKeyword(variantIdKeyOrName))
        {
            this.variantOverrides.set(part.id, -1);
            this.applyFrame();
            return true;
        }

        const variantIndex = findVariantIndex(this.package, partIndex, variantIdKeyOrName);

        if (variantIndex < 0)
        {
            return false;
        }

        this.variantOverrides.set(part.id, variantIndex);
        this.applyFrame();
        return true;
    }

    clearVariant(partIdKeyOrName: string): boolean
    {
        const partIndex = findPartIndex(this.package, partIdKeyOrName);

        if (partIndex < 0)
        {
            return false;
        }

        this.variantOverrides.delete(this.package.parts[partIndex].id);
        this.applyFrame();
        return true;
    }

    clearVariants(): void
    {
        this.variantOverrides.clear();
        this.applyFrame();
    }

    setTint(r: number, g: number, b: number): void
    {
        this.tint = {
            r: clamp01(r),
            g: clamp01(g),
            b: clamp01(b)
        };
        this.applyFrame();
    }

    clearTint(): void
    {
        this.tint = { r: 1, g: 1, b: 1 };
        this.applyFrame();
    }

    consumeEvents(): SplaPlaybackEvent[]
    {
        return this.player.consumeEvents();
    }

    getPartTransform(partIdKeyOrName: string, options: SplaPartTransformOptions = {}): SplaPartTransform | null
    {
        const frame = this.player.currentFrame;

        if (!frame)
        {
            return null;
        }

        const framePart = findFramePartForPart(this.package, frame.parts, partIdKeyOrName);

        if (!framePart)
        {
            return null;
        }

        return computePartTransform(this.package, framePart, partIdKeyOrName, options);
    }

    preUpdate(_time: number, delta: number): void
    {
        if (this.player.playing)
        {
            this.player.update(delta / 1000);
            this.applyFrame();
        }
    }

    private applyResolvedTexture(image: Phaser.GameObjects.Image, resolved: SplaResolvedPartRender | null): boolean
    {
        if (!resolved?.asset)
        {
            image.setVisible(false);
            return false;
        }

        const textureKey = createSplaCacheKey(this.splaKey, resolved.asset);

        if (!this.scene.textures.exists(textureKey))
        {
            image.setVisible(false);
            return false;
        }

        image.setTexture(textureKey);
        return true;
    }

    private applyFrame(): void
    {
        const frame = this.player.currentFrame;

        if (!frame)
        {
            return;
        }

        const sortedParts = frame.parts.slice().sort((left, right) => {
            const leftPart = this.package.parts[findPartIndex(this.package, left.partId)];
            const rightPart = this.package.parts[findPartIndex(this.package, right.partId)];
            const leftOrder = (leftPart?.drawOrder || 0) + left.zOffset;
            const rightOrder = (rightPart?.drawOrder || 0) + right.zOffset;
            return leftOrder - rightOrder;
        });

        for (const framePart of sortedParts)
        {
            const image = this.partImages.get(framePart.partId);
            const mixImage = this.partMixImages.get(framePart.partId);
            const partIndex = findPartIndex(this.package, framePart.partId);
            const part = partIndex >= 0 ? this.package.parts[partIndex] : null;
            const render = resolvePartFrameRender(
                this.package,
                framePart.partId,
                framePart,
                this.skinIndex,
                this.variantOverrides
            );

            if (!image || !mixImage || !part)
            {
                image?.setVisible(false);
                mixImage?.setVisible(false);
                continue;
            }

            if (!render.current)
            {
                image.setVisible(false);
                mixImage.setVisible(false);
                continue;
            }

            const hasMix = render.next !== null && render.mix > 0 && render.mix < 1;

            if (!this.applyResolvedTexture(image, render.current))
            {
                mixImage.setVisible(false);
                continue;
            }

            applyImageTransform(image, framePart, part, render.current, this.package, this.tint);
            image.setAlpha(framePart.opacity * (hasMix ? 1 - render.mix : 1));

            if (hasMix && render.next && this.applyResolvedTexture(mixImage, render.next))
            {
                applyImageTransform(mixImage, framePart, part, render.next, this.package, this.tint);
                mixImage.setAlpha(framePart.opacity * render.mix);
            }
            else
            {
                mixImage.setVisible(false);
            }
        }

        for (const framePart of sortedParts)
        {
            const mixImage = this.partMixImages.get(framePart.partId);
            const image = this.partImages.get(framePart.partId);

            if (mixImage?.visible)
            {
                this.bringToTop(mixImage);
            }

            if (image?.visible)
            {
                this.bringToTop(image);
            }
        }
    }

    getInfo(): SplaObjectInfo
    {
        return {
            path: this.package.path,
            byteCount: this.package.byteCount,
            name: this.package.name,
            canvasWidth: this.package.canvasWidth,
            canvasHeight: this.package.canvasHeight,
            skinIndex: this.skinIndex,
            playing: this.player.playing,
            animationId: this.player.currentAnimation?.id || null,
            frameIndex: this.player.currentFrameIndex,
            pendingEventCount: this.player.pendingEvents.length,
            droppedEventCount: this.player.droppedEventCount,
            animations: this.package.animations.map((animation) => ({
                id: animation.id,
                name: animation.name,
                frameCount: animation.frames.length,
                fps: animation.fps,
                loop: animation.loop
            })),
            skins: this.package.skins.map((skin) => ({
                id: skin.id,
                name: skin.name
            }))
        };
    }
}

function isDefaultKeyword(value: string): boolean
{
    return value.localeCompare('default', undefined, { sensitivity: 'accent' }) === 0;
}

function clamp01(value: number): number
{
    return Math.max(0, Math.min(1, value));
}
