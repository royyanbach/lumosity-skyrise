import { Assets } from 'pixi.js';
import { CONFIG } from '../config/game-config';

export class AssetLoader {
    private static readonly ASSET_MANIFEST = {
        bundles: [
            {
                name: 'game-bundle',
                assets: [
                    {
                        name: CONFIG.ASSETS.SOUNDS.CORRECT,
                        srcs: 'assets/sounds/correct.mp3'
                    },
                    {
                        name: CONFIG.ASSETS.SOUNDS.WRONG,
                        srcs: 'assets/sounds/wrong.mp3'
                    },
                    {
                        name: CONFIG.ASSETS.SOUNDS.LEVEL_COMPLETE,
                        srcs: 'assets/sounds/level-complete.mp3'
                    },
                    {
                        name: CONFIG.ASSETS.SOUNDS.GAME_COMPLETE,
                        srcs: 'assets/sounds/game-complete.mp3'
                    }
                ]
            }
        ]
    };

    public async loadGameAssets(): Promise<void> {
        try {
            // Load assets directly without using the sound parser
            const assets = AssetLoader.ASSET_MANIFEST.bundles[0].assets;
            const loadPromises = assets.map(asset =>
                fetch(asset.srcs)
                    .then(response => response.blob())
                    .then(blob => {
                        const url = URL.createObjectURL(blob);
                        Assets.cache.set(asset.name, url);
                        return url;
                    })
            );

            await Promise.all(loadPromises);
            console.log('Assets loaded successfully');
        } catch (error) {
            console.error('Error loading assets:', error);
            throw error;
        }
    }
}
