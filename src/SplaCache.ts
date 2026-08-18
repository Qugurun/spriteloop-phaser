import type { Game } from 'phaser';

export function ensureSplaCache(game: Game)
{
    const custom = game.cache.custom as { spla?: Phaser.Cache.BaseCache };

    if (!custom.spla)
    {
        game.cache.addCustom('spla');
    }

    return custom.spla!;
}
