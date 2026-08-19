import { GameObjects } from 'phaser';

const { TransformMatrix } = GameObjects.Components;

type Matrix = InstanceType<typeof TransformMatrix>;

export interface SkewableGameObject extends Phaser.GameObjects.GameObject {
    skew: { x: number; y: number };
}

const SKEW_ENABLED = Symbol('spriteloopSkewEnabled');

type RenderCanvasFn = (
    renderer: Phaser.Renderer.Canvas.CanvasRenderer,
    src: Phaser.GameObjects.GameObject,
    camera: Phaser.Cameras.Scene2D.Camera,
    parentMatrix?: Matrix
) => void;

/**
 * Enables matrix-based shear on a Phaser 4 Game Object (WebGL + Canvas).
 * Call once per object; update `gameObject.skew.x` / `gameObject.skew.y` in radians afterward.
 */
export function enableSkew<T extends Phaser.GameObjects.GameObject & { x: number; y: number }>(
    gameObject: T,
    skewX = 0,
    skewY = 0
): T & SkewableGameObject
{
    const skewable = gameObject as T & SkewableGameObject & { [SKEW_ENABLED]?: boolean };

    if (skewable[SKEW_ENABLED])
    {
        skewable.skew.x = skewX;
        skewable.skew.y = skewY;
        return skewable;
    }

    skewable[SKEW_ENABLED] = true;
    skewable.skew = { x: skewX, y: skewY };

    const shearMatrix = new TransformMatrix();
    const parentAndShearMatrix = new TransformMatrix();

    const getSkewMatrix = (parentMatrix?: Matrix): Matrix => {
        const shearX = Math.tan(skewable.skew.x);
        const shearY = Math.tan(skewable.skew.y);

        // T(x, y) * Shear * T(-x, -y) keeps the object's origin fixed.
        shearMatrix.setTransform(
            1,
            shearY,
            shearX,
            1,
            -shearX * skewable.y,
            -shearY * skewable.x
        );

        if (parentMatrix)
        {
            parentAndShearMatrix.copyFrom(parentMatrix);
            parentAndShearMatrix.multiply(shearMatrix);
            return parentAndShearMatrix;
        }

        return shearMatrix;
    };

    gameObject.addRenderStep((
        renderer,
        object,
        drawingContext,
        parentMatrix,
        renderStep,
        displayList,
        displayListIndex
    ) => {
        object.renderWebGLStep(
            renderer,
            object,
            drawingContext,
            getSkewMatrix(parentMatrix),
            (renderStep ?? 0) + 1,
            displayList,
            displayListIndex
        );
    }, 0);

    const renderable = gameObject as T & { renderCanvas: RenderCanvasFn };
    const renderCanvas = renderable.renderCanvas.bind(renderable);

    renderable.renderCanvas = function (...args: Parameters<RenderCanvasFn>): ReturnType<RenderCanvasFn> {
        args[3] = getSkewMatrix(args[3]);
        return renderCanvas(...args);
    };

    return skewable;
}

export function isSkewEnabled(gameObject: Phaser.GameObjects.GameObject): gameObject is SkewableGameObject
{
    return Boolean((gameObject as SkewableGameObject & { [SKEW_ENABLED]?: boolean })[SKEW_ENABLED]);
}
