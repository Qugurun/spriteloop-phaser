import { unzipSync } from 'fflate';
import type {
    ParsedSplaPackage,
    ResolvedPartImage,
    SplaAnimation,
    SplaFramePart,
    SplaFramePartRender,
    SplaPackageData,
    SplaPart,
    SplaResolvedPartRender,
    SplaSkin,
    SplaSkinPartOverride,
    SplaSpriteState,
    SplaVariant
} from './types';

function numberOr(value: unknown, fallback: number): number
{
    return typeof value === 'number' && !Number.isNaN(value) ? value : fallback;
}

function asciiCaseInsensitiveEqual(left: string, right: string): boolean
{
    return left.localeCompare(right, undefined, { sensitivity: 'accent' }) === 0;
}

export function findAnimationIndex(packageData: SplaPackageData, animationIdOrName: string): number
{
    if (!packageData || !animationIdOrName)
    {
        return -1;
    }

    const exactIndex = packageData.animations.findIndex((animation) => animation.id === animationIdOrName);

    if (exactIndex >= 0)
    {
        return exactIndex;
    }

    return packageData.animations.findIndex((animation) => asciiCaseInsensitiveEqual(animation.name, animationIdOrName));
}

export function findSkinIndex(packageData: SplaPackageData, skinIdOrName: string): number
{
    if (!packageData || !skinIdOrName)
    {
        return -1;
    }

    const exactIndex = packageData.skins.findIndex((skin) => skin.id === skinIdOrName);

    if (exactIndex >= 0)
    {
        return exactIndex;
    }

    return packageData.skins.findIndex((skin) => asciiCaseInsensitiveEqual(skin.name, skinIdOrName));
}

export function findPartIndex(packageData: SplaPackageData, partIdKeyOrName: string): number
{
    if (!packageData || !partIdKeyOrName)
    {
        return -1;
    }

    const exactIdIndex = packageData.parts.findIndex((part) => part.id === partIdKeyOrName);

    if (exactIdIndex >= 0)
    {
        return exactIdIndex;
    }

    const keyIndex = packageData.parts.findIndex((part) => part.key === partIdKeyOrName);

    if (keyIndex >= 0)
    {
        return keyIndex;
    }

    return packageData.parts.findIndex((part) => asciiCaseInsensitiveEqual(part.name, partIdKeyOrName));
}

export function findVariantIndex(packageData: SplaPackageData, partIndex: number, variantIdKeyOrName: string): number
{
    if (!packageData || partIndex < 0 || !variantIdKeyOrName)
    {
        return -1;
    }

    if (asciiCaseInsensitiveEqual(variantIdKeyOrName, 'default'))
    {
        return -1;
    }

    const part = packageData.parts[partIndex];

    if (!part)
    {
        return -1;
    }

    const exactIdIndex = packageData.variants.findIndex(
        (variant) => variant.id === variantIdKeyOrName && variant.partId === part.id
    );

    if (exactIdIndex >= 0)
    {
        return exactIdIndex;
    }

    const keyIndex = packageData.variants.findIndex(
        (variant) => variant.key === variantIdKeyOrName && variant.partId === part.id
    );

    if (keyIndex >= 0)
    {
        return keyIndex;
    }

    return packageData.variants.findIndex(
        (variant) => asciiCaseInsensitiveEqual(variant.name, variantIdKeyOrName) && variant.partId === part.id
    );
}

function normalizeTransform(framePart: Record<string, unknown>)
{
    const tintValue = framePart.tint;

    return {
        x: numberOr(framePart.x, 0),
        y: numberOr(framePart.y, 0),
        rotation: numberOr(framePart.rotation, 0),
        skewX: numberOr(framePart.skewX, 0),
        skewY: numberOr(framePart.skewY, 0),
        scaleX: numberOr(framePart.scaleX, 1),
        scaleY: numberOr(framePart.scaleY, 1),
        opacity: numberOr(framePart.opacity, 1),
        zOffset: numberOr(framePart.zOffset, 0),
        tint: Array.isArray(tintValue) && tintValue.length === 3
            ? tintValue.map((channel) => Math.max(0, Math.min(1, Number(channel)))) as [ number, number, number ]
            : [ 1, 1, 1 ] as [ number, number, number ]
    };
}

function normalizeManifest(manifest: Record<string, unknown>): SplaPackageData
{
    if (manifest.format !== 'spla' || manifest.version !== 1)
    {
        throw new Error('Unsupported SpriteLoop package manifest');
    }

    const canvas = manifest.canvas as Record<string, unknown> | undefined;
    const canvasWidth = numberOr(canvas?.width, 0);
    const canvasHeight = numberOr(canvas?.height, 0);

    if (canvasWidth <= 0 || canvasHeight <= 0)
    {
        throw new Error('SpriteLoop package canvas size is invalid');
    }

    const parts = ((manifest.parts as Record<string, unknown>[]) || []).map((part) => ({
        id: String(part.id),
        key: String(part.key || part.id),
        name: String(part.name || part.key || part.id),
        asset: part.asset ? String(part.asset) : undefined,
        transformOnly: part.kind === 'empty' || part.transformOnly === true,
        width: numberOr(part.width, 0),
        height: numberOr(part.height, 0),
        pivot: {
            x: numberOr((part.pivot as Record<string, unknown> | undefined)?.x, numberOr(part.width, 0) * 0.5),
            y: numberOr((part.pivot as Record<string, unknown> | undefined)?.y, numberOr(part.height, 0) * 0.5)
        },
        drawOrder: numberOr(part.drawOrder, 0),
        visible: part.visible !== false
    }));

    const variants = ((manifest.variants as Record<string, unknown>[]) || []).map((variant) => ({
        id: String(variant.id),
        key: String(variant.key || variant.id),
        name: String(variant.name || variant.key || variant.id),
        partId: String(variant.part),
        asset: variant.asset ? String(variant.asset) : undefined,
        width: numberOr(variant.width, 0),
        height: numberOr(variant.height, 0),
        offsetX: numberOr(variant.offsetX, 0),
        offsetY: numberOr(variant.offsetY, 0),
        rotationDegrees: numberOr(variant.rotation, 0),
        zOffset: numberOr(variant.zOffset, 0)
    }));

    const skins = ((manifest.skins as Record<string, unknown>[]) || []).map((skin) => ({
        id: String(skin.id),
        name: String(skin.name || skin.id),
        parts: normalizeSkinParts(skin.parts as Record<string, unknown> | undefined)
    }));

    const states = ((manifest.states as Record<string, unknown>[]) || []).map((state) => ({
        id: String(state.id),
        key: String(state.key || state.id),
        name: String(state.name || state.key || state.id),
        partId: String(state.part)
    }));

    const animations = ((manifest.animations as Record<string, unknown>[]) || []).map((animation) => ({
        id: String(animation.id),
        name: String(animation.name || animation.id),
        fps: numberOr(animation.fps, 24),
        loop: animation.loop !== false,
        frames: ((animation.frames as Record<string, unknown>[]) || []).map((frame) => ({
            index: numberOr(frame.index, 0),
            sourceFrame: numberOr(frame.sourceFrame, numberOr(frame.index, 0)),
            parts: ((frame.parts as Record<string, unknown>[]) || []).map((framePart) => ({
                partId: String(framePart.part),
                stateIndex: resolveStateReference(states, framePart.state ?? framePart.stateIndex),
                nextStateIndex: resolveStateReference(states, framePart.nextState ?? framePart.nextStateIndex),
                hasNextState: framePart.hasNextState === true
                    || framePart.nextState !== undefined
                    || framePart.nextStateIndex !== undefined,
                stateMix: clamp01(numberOr(framePart.stateMix, 0)),
                ...normalizeTransform(framePart)
            })),
            events: ((frame.events as Record<string, unknown>[]) || []).map((event) => ({
                name: String(event.name || event.eventName || ''),
                data: String(event.data || '')
            }))
        }))
    }));

    return {
        name: String(manifest.name || 'spla'),
        canvasWidth,
        canvasHeight,
        parts,
        variants,
        skins,
        states,
        animations
    };
}

export function canvasToLocal(x: number, y: number, canvasWidth: number, canvasHeight: number)
{
    return {
        x: x - canvasWidth * 0.5,
        y: y - canvasHeight * 0.5
    };
}

export function findStateIndex(packageData: SplaPackageData, stateIdKeyOrName: string): number
{
    if (!packageData || !stateIdKeyOrName)
    {
        return -1;
    }

    const exactIdIndex = packageData.states.findIndex((state) => state.id === stateIdKeyOrName);

    if (exactIdIndex >= 0)
    {
        return exactIdIndex;
    }

    const keyIndex = packageData.states.findIndex((state) => state.key === stateIdKeyOrName);

    if (keyIndex >= 0)
    {
        return keyIndex;
    }

    return packageData.states.findIndex((state) => asciiCaseInsensitiveEqual(state.name, stateIdKeyOrName));
}

function resolveStateReference(states: SplaSpriteState[], value: unknown): number
{
    if (typeof value === 'number' && value >= 0)
    {
        return value < states.length ? value : -1;
    }

    if (typeof value === 'string' && value.length > 0)
    {
        const exactIdIndex = states.findIndex((state) => state.id === value);

        if (exactIdIndex >= 0)
        {
            return exactIdIndex;
        }

        const keyIndex = states.findIndex((state) => state.key === value);

        if (keyIndex >= 0)
        {
            return keyIndex;
        }

        return states.findIndex((state) => asciiCaseInsensitiveEqual(state.name, value));
    }

    return -1;
}

function normalizeSkinParts(raw: Record<string, unknown> | undefined): Record<string, SplaSkinPartOverride>
{
    const parts: Record<string, SplaSkinPartOverride> = {};

    for (const [ partId, overrideValue ] of Object.entries(raw || {}))
    {
        if (typeof overrideValue !== 'object' || overrideValue === null)
        {
            continue;
        }

        const override = overrideValue as Record<string, unknown>;
        const statesRaw = override.states as Record<string, unknown> | undefined;
        const states: Record<string, string> = {};

        for (const [ stateKey, variantValue ] of Object.entries(statesRaw || {}))
        {
            if (variantValue !== undefined && variantValue !== null)
            {
                states[stateKey] = String(variantValue);
            }
        }

        parts[partId] = {
            variant: override.variant ? String(override.variant) : undefined,
            visible: override.visible === false ? false : override.visible === true ? true : undefined,
            states: Object.keys(states).length > 0 ? states : undefined
        };
    }

    return parts;
}

function clamp01(value: number): number
{
    return Math.max(0, Math.min(1, value));
}

export function resolvePartImage(part: SplaPart, variant: SplaVariant | null): SplaResolvedPartRender
{
    const imageSource = variant || part;
    const partWidth = part.width;
    const partHeight = part.height;
    const imageWidth = numberOr(imageSource.width, partWidth);
    const imageHeight = numberOr(imageSource.height, partHeight);
    const pivotX = part.pivot.x;
    const pivotY = part.pivot.y;

    return {
        asset: imageSource.asset,
        width: imageWidth,
        height: imageHeight,
        pivotX: variant
            ? pivotX + (imageWidth - partWidth) * 0.5 - variant.offsetX
            : pivotX,
        pivotY: variant
            ? pivotY + (imageHeight - partHeight) * 0.5 - variant.offsetY
            : pivotY,
        rotationDegrees: variant ? variant.rotationDegrees : 0,
        zOffset: variant ? variant.zOffset : 0
    };
}

export function resolveSkinPartOverride(skin: SplaSkin | null, partId: string): SplaSkinPartOverride | null
{
    if (!skin || !skin.parts)
    {
        return null;
    }

    return skin.parts[partId] || skin.parts[partId.replace(/-/g, '_')] || null;
}

function resolvePartRenderInternal(
    packageData: SplaPackageData,
    part: SplaPart,
    partIndex: number,
    stateIndex: number,
    skinIndex: number,
    variantOverrides: Map<string, number>
): SplaResolvedPartRender | null
{
    const manualVariantIndex = variantOverrides.get(part.id);

    if (manualVariantIndex !== undefined)
    {
        if (manualVariantIndex < 0)
        {
            return resolvePartImage(part, null);
        }

        const variant = packageData.variants[manualVariantIndex];
        return resolvePartImage(part, variant);
    }

    const skin = skinIndex >= 0 ? packageData.skins[skinIndex] : null;
    const override = resolveSkinPartOverride(skin, part.id);

    if (override?.visible === false)
    {
        return null;
    }

    if (stateIndex >= 0)
    {
        const state = packageData.states[stateIndex];

        if (state && state.partId === part.id)
        {
            const variantRef = override?.states?.[state.id]
                ?? override?.states?.[state.key]
                ?? override?.states?.[state.name];

            if (variantRef)
            {
                const variantIndex = findVariantIndex(packageData, partIndex, variantRef);

                if (variantIndex >= 0)
                {
                    return resolvePartImage(part, packageData.variants[variantIndex]);
                }
            }
        }
    }

    if (override?.variant)
    {
        const variantIndex = findVariantIndex(packageData, partIndex, override.variant);

        if (variantIndex >= 0)
        {
            return resolvePartImage(part, packageData.variants[variantIndex]);
        }
    }

    return resolvePartImage(part, null);
}

export function resolvePartFrameRender(
    packageData: SplaPackageData,
    partId: string,
    framePart: SplaFramePart | null,
    skinIndex: number,
    variantOverrides: Map<string, number>
): SplaFramePartRender
{
    const partIndex = findPartIndex(packageData, partId);
    const part = partIndex >= 0 ? packageData.parts[partIndex] : null;

    if (!part || part.transformOnly)
    {
        return { current: null, next: null, mix: 0 };
    }

    const current = resolvePartRenderInternal(
        packageData,
        part,
        partIndex,
        framePart?.stateIndex ?? -1,
        skinIndex,
        variantOverrides
    );

    if (!framePart || !framePart.hasNextState || framePart.nextStateIndex < 0 || framePart.stateMix <= 0)
    {
        return { current, next: null, mix: 0 };
    }

    const next = resolvePartRenderInternal(
        packageData,
        part,
        partIndex,
        framePart.nextStateIndex,
        skinIndex,
        variantOverrides
    );

    if (!current && next)
    {
        return { current: next, next: null, mix: 0 };
    }

    if (!next)
    {
        return { current, next: null, mix: 0 };
    }

    return {
        current,
        next,
        mix: clamp01(framePart.stateMix)
    };
}

export function parseSplaBytes(bytes: ArrayBuffer | Uint8Array, path = ''): ParsedSplaPackage
{
    const input = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    const entries = unzipSync(input);
    const manifestBytes = entries['manifest.json'];

    if (!manifestBytes)
    {
        throw new Error(`SpriteLoop package '${path}' is missing manifest.json`);
    }

    const manifest = JSON.parse(new TextDecoder().decode(manifestBytes)) as Record<string, unknown>;
    const packageData = normalizeManifest(manifest);
    const assets: Record<string, Uint8Array> = {};

    for (const [ entryName, entryBytes ] of Object.entries(entries))
    {
        if (entryName.endsWith('/') || entryName === 'manifest.json')
        {
            continue;
        }

        assets[entryName] = entryBytes;
    }

    for (const part of packageData.parts)
    {
        if (part.asset && !assets[part.asset])
        {
            throw new Error(`SpriteLoop package '${path}' is missing asset '${part.asset}'`);
        }
    }

    for (const variant of packageData.variants)
    {
        if (variant.asset && !assets[variant.asset])
        {
            throw new Error(`SpriteLoop package '${path}' is missing asset '${variant.asset}'`);
        }
    }

    return {
        path,
        byteCount: input.byteLength,
        ...packageData,
        assets
    };
}

export function createSplaCacheKey(splaKey: string, assetPath: string): string
{
    return `${splaKey}!${assetPath}`;
}
