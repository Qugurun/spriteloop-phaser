import Phaser from 'phaser';
import { ensureSplaCache } from './SplaCache';
import { createSplaCacheKey, parseSplaBytes } from './SplaPackage';
import type { CachedSplaPackage } from './types';

const File = Phaser.Loader.File;
const CONST = Phaser.Loader;

type SplaFileConfig = {
    key: string;
    url?: string;
    xhrSettings?: Phaser.Types.Loader.XHRSettingsObject;
};

interface SplaFileInstance extends Phaser.Loader.File {
    key: string;
    url: string;
    xhrLoader: XMLHttpRequest;
    loader: Phaser.Loader.LoaderPlugin;
    onProcessComplete(): void;
    onProcessError(): void;
}

type SkewableImage = Phaser.GameObjects.Image & {
    setSkew?: (skewX: number, skewY: number) => void;
};

// Phaser.Class is declared globally in phaser.d.ts
declare const Class: new (definition: object) => unknown;

const SplaFile = new Class({

    Extends: File,

    initialize: function (
        this: SplaFileInstance,
        loader: Phaser.Loader.LoaderPlugin,
        key: string | SplaFileConfig,
        url?: string,
        xhrSettings?: Phaser.Types.Loader.XHRSettingsObject
    )
    {
        if (typeof key === 'object')
        {
            const config = key;
            key = config.key;
            url = config.url;
            xhrSettings = config.xhrSettings;
        }

        File.call(this, loader, {
            type: 'spla',
            cache: false,
            extension: 'spla',
            responseType: 'arraybuffer',
            key,
            url,
            xhrSettings
        });
    },

    onProcess: function (this: SplaFileInstance)
    {
        this.state = CONST.FILE_PROCESSING;

        try
        {
            const bytes = new Uint8Array(this.xhrLoader.response as ArrayBuffer);
            const packageData = parseSplaBytes(bytes, this.url);
            const game = this.loader.scene.game;
            const cache = ensureSplaCache(game);
            const textureManager = this.loader.scene.textures;
            const assetEntries = Object.entries(packageData.assets);

            if (assetEntries.length === 0)
            {
                cache.add(this.key, {
                    ...packageData,
                    assets: []
                } satisfies CachedSplaPackage);
                this.data = cache.get(this.key);
                this.onProcessComplete();
                return;
            }

            let pending = assetEntries.length;
            let failed = false;

            const finish = () =>
            {
                cache.add(this.key, {
                    ...packageData,
                    assets: Object.keys(packageData.assets)
                } satisfies CachedSplaPackage);
                this.data = cache.get(this.key);
                this.onProcessComplete();
            };

            const fail = (error: unknown) =>
            {
                if (failed)
                {
                    return;
                }

                failed = true;
                console.error(error);
                this.onProcessError();
            };

            for (const [ assetPath, assetBytes ] of assetEntries)
            {
                const textureKey = createSplaCacheKey(this.key, assetPath);
                const blob = new Blob([ Uint8Array.from(assetBytes) ], { type: 'image/png' });
                const objectUrl = URL.createObjectURL(blob);
                const image = new Image();

                image.onload = () =>
                {
                    URL.revokeObjectURL(objectUrl);

                    if (failed)
                    {
                        return;
                    }

                    if (textureManager.exists(textureKey))
                    {
                        textureManager.remove(textureKey);
                    }

                    textureManager.addImage(textureKey, image);
                    pending -= 1;

                    if (pending === 0)
                    {
                        finish();
                    }
                };

                image.onerror = () =>
                {
                    URL.revokeObjectURL(objectUrl);
                    fail(new Error(`Failed to decode SpriteLoop texture '${assetPath}'`));
                };

                image.src = objectUrl;
            }
        }
        catch (error)
        {
            console.error(error);
            this.onProcessError();
        }
    }

}) as new (
    loader: Phaser.Loader.LoaderPlugin,
    key: string | SplaFileConfig,
    url?: string,
    xhrSettings?: Phaser.Types.Loader.XHRSettingsObject
) => SplaFileInstance;

export function splaFileCallback(
    this: Phaser.Loader.LoaderPlugin,
    key: string | SplaFileConfig,
    url?: string | string[],
    xhrSettings?: Phaser.Types.Loader.XHRSettingsObject
): void
{
    if (Array.isArray(url))
    {
        this.multiFile(this.spla, key as string, url, xhrSettings);
        return;
    }

    this.addFile(new SplaFile(this, key, url, xhrSettings));
}

export { SplaFile };
