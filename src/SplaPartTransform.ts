import { canvasToLocal, findPartIndex } from './SplaPackage';
import { isSkewEnabled } from './Skew';
import type { SplaFramePart, SplaPackageData, SplaPart, SplaPartTransform, SplaPartTransformOptions } from './types';

const DEG_TO_RAD = Math.PI / 180;

export function getPartTransform(
    packageData: SplaPackageData,
    framePart: SplaFramePart | null,
    partIdKeyOrName: string,
    options: SplaPartTransformOptions = {}
): SplaPartTransform | null
{
    if (!framePart)
    {
        return null;
    }

    const partIndex = findPartIndex(packageData, partIdKeyOrName);
    const part = partIndex >= 0 ? packageData.parts[partIndex] : null;

    if (!part || framePart.partId !== part.id)
    {
        return null;
    }

    const useCenter = options.origin === 'center';
    const centered = canvasToLocal(
        framePart.x,
        framePart.y,
        packageData.canvasWidth,
        packageData.canvasHeight
    );

    const transform: SplaPartTransform = {
        position: {
            x: centered.x,
            y: -centered.y
        },
        rotation: -framePart.rotation,
        scale: {
            x: framePart.scaleX,
            y: framePart.scaleY
        },
        skew: {
            x: -framePart.skewX,
            y: -framePart.skewY
        },
        opacity: framePart.opacity
    };

    if (useCenter && !part.transformOnly)
    {
        const localX = (part.width * 0.5 - part.pivot.x) * framePart.scaleX;
        const localY = (part.pivot.y - part.height * 0.5) * framePart.scaleY;
        const skewX = Math.tan(-framePart.skewX * DEG_TO_RAD);
        const skewY = Math.tan(-framePart.skewY * DEG_TO_RAD);
        const skewedX = localX + skewX * localY;
        const skewedY = skewY * localX + localY;
        const radians = -framePart.rotation * DEG_TO_RAD;
        const cosR = Math.cos(radians);
        const sinR = Math.sin(radians);

        transform.position.x += skewedX * cosR - skewedY * sinR;
        transform.position.y += skewedX * sinR + skewedY * cosR;
    }

    return transform;
}

export function findFramePartForPart(
    packageData: SplaPackageData,
    frameParts: SplaFramePart[],
    partIdKeyOrName: string
): SplaFramePart | null
{
    const partIndex = findPartIndex(packageData, partIdKeyOrName);
    const part = partIndex >= 0 ? packageData.parts[partIndex] : null;

    if (!part)
    {
        return null;
    }

    return frameParts.find((framePart) => framePart.partId === part.id) || null;
}

export function applyImageTransform(
    image: Phaser.GameObjects.Image,
    framePart: SplaFramePart,
    part: SplaPart,
    resolved: { pivotX: number; pivotY: number; width: number; height: number; rotationDegrees: number },
    packageData: SplaPackageData,
    runtimeTint: { r: number; g: number; b: number }
): void
{
    const position = canvasToLocal(
        framePart.x,
        framePart.y,
        packageData.canvasWidth,
        packageData.canvasHeight
    );

    image.setVisible(true);
    image.setOrigin(resolved.pivotX / resolved.width, resolved.pivotY / resolved.height);
    image.setPosition(position.x, position.y);
    image.setRotation((framePart.rotation + resolved.rotationDegrees) * DEG_TO_RAD);
    image.setScale(framePart.scaleX, framePart.scaleY);

    if (isSkewEnabled(image))
    {
        image.skew.x = framePart.skewX * DEG_TO_RAD;
        image.skew.y = framePart.skewY * DEG_TO_RAD;
    }

    const [ tr, tg, tb ] = framePart.tint;
    const tintColor = rgbToHex(tr * runtimeTint.r, tg * runtimeTint.g, tb * runtimeTint.b);

    image.setAlpha(framePart.opacity);

    if (tintColor === 0xffffff)
    {
        image.clearTint();
    }
    else
    {
        image.setTint(tintColor);
    }
}

function rgbToHex(r: number, g: number, b: number): number
{
    const clamp = (value: number) => Math.max(0, Math.min(1, value));
    const red = Math.floor(clamp(r) * 255);
    const green = Math.floor(clamp(g) * 255);
    const blue = Math.floor(clamp(b) * 255);

    return (red << 16) | (green << 8) | blue;
}
