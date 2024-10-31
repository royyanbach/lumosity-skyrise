import { Application } from 'pixi.js';
import { GameScene } from './scenes/game-scene';
import { CONFIG } from './config/game-config';
import { AssetLoader } from './services/asset-loader';
import { GameState } from './state/game-state';

const initGame = async (): Promise<void> => {
    // Create Pixi application with WebGPU support (fallback to WebGL)
    const app = new Application({
        width: CONFIG.GAME.WIDTH,
        height: CONFIG.GAME.HEIGHT,
        backgroundColor: CONFIG.GAME.BACKGROUND_COLOR,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        powerPreference: 'high-performance',
        antialias: true,
    });

    // Add canvas to document
    document.body.appendChild(app.view as HTMLCanvasElement);

    // Initialize game state
    const gameState = new GameState();

    // Load assets
    const assetLoader = new AssetLoader();
    await assetLoader.loadGameAssets();

    // Create and add game scene
    const gameScene = new GameScene(app, gameState);
    app.stage.addChild(gameScene);

    // Handle window resize
    window.addEventListener('resize', () => {
        const scaleX = window.innerWidth / CONFIG.GAME.WIDTH;
        const scaleY = window.innerHeight / CONFIG.GAME.HEIGHT;
        const scale = Math.min(scaleX, scaleY);

        if (app.view && app.view.style) {
            app.view.style.width = `${CONFIG.GAME.WIDTH * scale}px`;
            app.view.style.height = `${CONFIG.GAME.HEIGHT * scale}px`;
        }
    });
};

// Start the game when DOM is loaded
window.addEventListener('load', () => {
    initGame().catch(console.error);
});
