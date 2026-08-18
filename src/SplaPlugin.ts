import { Plugins } from 'phaser';
import { ensureSplaCache } from './SplaCache';
import { SPLA_EVENT, SplaEvents } from './SplaEvents';
import { splaFileCallback } from './SplaFile';
import { parseSplaBytes } from './SplaPackage';
import { SplaObject } from './SplaObject';
import { SplaPlayer } from './SplaPlayer';

export { ensureSplaCache, SPLA_EVENT, SplaEvents };

export default class SplaPlugin extends Plugins.BasePlugin
{
    constructor(pluginManager: Phaser.Plugins.PluginManager)
    {
        super(pluginManager);

        pluginManager.registerFileType('spla', splaFileCallback);
    }

    boot(): void
    {
        ensureSplaCache(this.game);
    }
}

export {
    SplaObject,
    SplaPlayer,
    parseSplaBytes
};

export * from './SplaPackage';
