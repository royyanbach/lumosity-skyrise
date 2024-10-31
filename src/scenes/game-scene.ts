import { Container, Application, Graphics, Text } from 'pixi.js';
import { GameState } from '../state/game-state';
import { CONFIG } from '../config/game-config';
import { Box } from '../types/game-types';
import { BackgroundManager } from '../managers/background-manager';
import { Howler } from 'howler';

export class GameScene extends Container {
    private readonly app: Application;
    private readonly gameState: GameState;
    private boxes: Map<number, { container: Container, box: Graphics, text: Text }> = new Map();
    private levelText: Text;
    private scoreText: Text;
    private highScoreText: Text;
    private backgroundManager: BackgroundManager;
    private memorizeText: Text;
    private startScreen: Container;
    private gameOverScreen: Container;

    constructor(app: Application) {
        super();
        this.app = app;

        // Create background manager first
        this.backgroundManager = new BackgroundManager();
        this.addChild(this.backgroundManager);

        // Create game state with background manager
        this.gameState = new GameState(this.backgroundManager);

        // Create start screen first
        this.createStartScreen();

        // Setup UI elements (but don't show them yet)
        this.setupUI();
        this.hideGameUI();

        // Don't setup level until start button is clicked
    }

    private createStartScreen(): void {
        this.startScreen = new Container();

        // Create semi-transparent background
        const bg = new Graphics();
        bg.beginFill(0x000000, 0.7);
        bg.drawRect(0, 0, CONFIG.GAME.WIDTH, CONFIG.GAME.HEIGHT);
        bg.endFill();
        this.startScreen.addChild(bg);

        // Create title text
        const titleText = new Text('Mind-Eye\nChallenge', {
            fontFamily: CONFIG.ASSETS.FONTS.MAIN,
            fontSize: 48,
            fill: CONFIG.UI.COLORS.TEXT,
            fontWeight: 'bold'
        });
        titleText.anchor.set(0.5);
        titleText.position.set(CONFIG.GAME.WIDTH / 2, CONFIG.GAME.HEIGHT / 3);
        this.startScreen.addChild(titleText);

        // Create start button
        const button = new Graphics();
        button.beginFill(0x4CAF50);
        button.drawRoundedRect(-100, -30, 200, 60, 10);
        button.endFill();
        button.position.set(CONFIG.GAME.WIDTH / 2, CONFIG.GAME.HEIGHT / 2);
        button.eventMode = 'static';
        button.cursor = 'pointer';

        const buttonText = new Text('Start Game', {
            fontFamily: CONFIG.ASSETS.FONTS.MAIN,
            fontSize: 24,
            fill: CONFIG.UI.COLORS.TEXT
        });
        buttonText.anchor.set(0.5);
        button.addChild(buttonText);

        button.on('pointerdown', () => this.startGame());
        this.startScreen.addChild(button);

        this.addChild(this.startScreen);
    }

    private hideGameUI(): void {
        if (this.levelText) this.levelText.visible = false;
        if (this.scoreText) this.scoreText.visible = false;
        if (this.highScoreText) this.highScoreText.visible = false;
        if (this.memorizeText) this.memorizeText.visible = false;
        this.boxes.forEach(({ container }) => {
            container.visible = false;
        });
    }

    private showGameUI(): void {
        if (this.levelText) this.levelText.visible = true;
        if (this.scoreText) this.scoreText.visible = true;
        if (this.memorizeText) this.memorizeText.visible = true;
        this.boxes.forEach(({ container }) => {
            container.visible = true;
        });
        if (this.highScoreText) this.highScoreText.visible = false;
    }

    private startGame(): void {
        // Initialize Howler context if needed
        if (!Howler.ctx) {
            // Create a temporary sound to initialize the context
            // @ts-ignore
            const initSound = new Howl({ src: ['data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAACAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV6urq6urq6urq6urq6urq6urq6urq6urq6v////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAASDs90hvAAAAAAAAAAAAAAAAAAAA//MUZAAAAAGkAAAAAAAAA0gAAAAATEFN//MUZAMAAAGkAAAAAAAAA0gAAAAARTMu//MUZAYAAAGkAAAAAAAAA0gAAAAAOTku//MUZAkAAAGkAAAAAAAAA0gAAAAANVVV'] });
        }

        // Now we can safely check and resume the context
        if (Howler.ctx?.state === 'suspended') {
            Howler.ctx.resume().then(() => {
                console.log('Audio context resumed successfully');
            }).catch(err => {
                console.error('Failed to resume audio context:', err);
            });
        }

        // Reset and update score display
        this.scoreText.text = 'Score: 0';

        // Remove start screen
        this.removeChild(this.startScreen);

        // Show background and UI
        this.backgroundManager.visible = true;
        this.showGameUI();

        // Setup initial level
        this.setupLevel();
    }

    private setupUI(): void {
        // Create UI background container
        const uiBackground = new Graphics();
        uiBackground.beginFill(0x000000, 0.2);
        uiBackground.drawRect(0, 0, CONFIG.GAME.WIDTH, 50);
        uiBackground.endFill();
        this.addChild(uiBackground);

        // Score text (left aligned)
        this.scoreText = new Text('Score: 0', {
            fontFamily: CONFIG.ASSETS.FONTS.MAIN,
            fontSize: CONFIG.UI.FONT_SIZES.LEVEL,
            fill: CONFIG.UI.COLORS.TEXT,
            fontWeight: 'bold'
        });
        this.scoreText.anchor.set(0, 0.5);
        this.scoreText.position.set(20, 25);
        this.addChild(this.scoreText);

        // High Score text (center aligned)
        this.highScoreText = new Text(`Best: ${this.gameState.getHighScore()}`, {
            fontFamily: CONFIG.ASSETS.FONTS.MAIN,
            fontSize: CONFIG.UI.FONT_SIZES.LEVEL,
            fill: CONFIG.UI.COLORS.TEXT,
            fontWeight: 'bold'
        });
        this.highScoreText.anchor.set(0.5, 0.5);
        this.highScoreText.position.set(CONFIG.GAME.WIDTH / 2, 25);
        this.addChild(this.highScoreText);

        // Level text (right aligned)
        this.levelText = new Text('', {
            fontFamily: CONFIG.ASSETS.FONTS.MAIN,
            fontSize: CONFIG.UI.FONT_SIZES.LEVEL,
            fill: CONFIG.UI.COLORS.TEXT,
            fontWeight: 'bold'
        });
        this.levelText.anchor.set(1, 0.5);
        this.levelText.position.set(CONFIG.GAME.WIDTH - 20, 25);
        this.addChild(this.levelText);

        // Memorize text (below UI bar)
        this.memorizeText = new Text('Memorize!', {
            fontFamily: CONFIG.ASSETS.FONTS.MAIN,
            fontSize: CONFIG.UI.FONT_SIZES.LEVEL,
            fill: CONFIG.UI.COLORS.TEXT,
            fontWeight: 'bold'
        });
        this.memorizeText.anchor.set(0.5);
        this.memorizeText.position.set(CONFIG.GAME.WIDTH / 2, 90);
        this.memorizeText.visible = false;
        this.addChild(this.memorizeText);
    }

    private setupLevel(): void {
        // Clear existing boxes
        this.boxes.forEach(({ container }) => {
            this.removeChild(container);
        });
        this.boxes.clear();

        // Create new boxes for current level
        const gameData = this.gameState.getGameData();
        gameData.boxes.forEach(boxData => {
            this.createBox(boxData);
        });

        // Update level text
        this.levelText.text = `Level ${this.gameState.getCurrentLevel()}`;

        // Show memorize text and start memorization phase
        this.memorizeText.visible = true;
        this.memorizeText.text = 'Memorize!';

        // Update background for new level with total correct boxes
        this.backgroundManager.updateLevel(
            this.gameState.getCurrentLevel(),
            this.gameState.getTotalCorrectBoxes()
        );

        // Start memorization phase timer
        setTimeout(() => {
            this.startInputPhase();
        }, CONFIG.GAME.MEMORIZATION_TIME);
    }

    private startInputPhase(): void {
        // Hide numbers and memorize text
        this.boxes.forEach(({ text }) => {
            text.visible = false;
        });
        this.memorizeText.text = 'Go!';

        // Change game phase
        this.gameState.setPhase('input');
    }

    private createBox(boxData: Box): void {
        const container = new Container();
        container.position.set(boxData.x, boxData.y);
        container.eventMode = 'static';
        container.cursor = 'pointer';

        // Create shadow
        const shadow = new Graphics();
        shadow.beginFill(0x000000, 0.3);
        shadow.drawRoundedRect(4, 4, CONFIG.GAME.BOX.WIDTH, CONFIG.GAME.BOX.HEIGHT, 8);
        shadow.endFill();
        container.addChild(shadow);

        // Create main box with rounded corners
        const box = new Graphics();
        box.lineStyle(2, 0x000000, 0.1); // Subtle border
        box.beginFill(CONFIG.GAME.BOX.COLORS.DEFAULT);
        box.drawRoundedRect(0, 0, CONFIG.GAME.BOX.WIDTH, CONFIG.GAME.BOX.HEIGHT, 8);
        box.endFill();

        // Add highlight
        box.lineStyle(2, 0xFFFFFF, 0.2);
        box.moveTo(2, CONFIG.GAME.BOX.HEIGHT - 2);
        box.lineTo(2, 2);
        box.lineTo(CONFIG.GAME.BOX.WIDTH - 2, 2);
        container.addChild(box);

        const text = new Text(boxData.number.toString(), {
            fontFamily: CONFIG.ASSETS.FONTS.MAIN,
            fontSize: CONFIG.UI.FONT_SIZES.BOX_NUMBER,
            fill: CONFIG.UI.COLORS.TEXT,
            fontWeight: 'bold',
            dropShadow: true,
            dropShadowColor: 0x000000,
            dropShadowDistance: 1,
            dropShadowAlpha: 0.3
        });
        text.anchor.set(0.5);
        text.position.set(CONFIG.GAME.BOX.WIDTH / 2, CONFIG.GAME.BOX.HEIGHT / 2);

        container.addChild(text);
        this.addChild(container);

        this.boxes.set(boxData.id, { container, box, text });

        container.on('pointerdown', () => {
            if (this.gameState.getPhase() === 'input') {
                this.onBoxClick(boxData.id);
            }
        });
    }

    private createGameOverScreen(): void {
        this.gameOverScreen = new Container();

        // Create semi-transparent background
        const bg = new Graphics();
        bg.beginFill(0x000000, 0.8);
        bg.drawRect(0, 0, CONFIG.GAME.WIDTH, CONFIG.GAME.HEIGHT);
        bg.endFill();
        this.gameOverScreen.addChild(bg);

        // Game Over text
        const gameOverText = new Text('Game Over!', {
            fontFamily: CONFIG.ASSETS.FONTS.MAIN,
            fontSize: 48,
            fill: CONFIG.UI.COLORS.TEXT,
            fontWeight: 'bold'
        });
        gameOverText.anchor.set(0.5);
        gameOverText.position.set(CONFIG.GAME.WIDTH / 2, CONFIG.GAME.HEIGHT / 3);
        this.gameOverScreen.addChild(gameOverText);

        // Final Score text
        const finalScore = new Text(`Final Score: ${this.gameState.getScore()}`, {
            fontFamily: CONFIG.ASSETS.FONTS.MAIN,
            fontSize: 32,
            fill: CONFIG.UI.COLORS.TEXT
        });
        finalScore.anchor.set(0.5);
        finalScore.position.set(CONFIG.GAME.WIDTH / 2, CONFIG.GAME.HEIGHT / 2 - 40);
        this.gameOverScreen.addChild(finalScore);

        // High Score text (create new text object for game over screen)
        const highScoreText = new Text(`Best: ${this.gameState.getHighScore()}`, {
            fontFamily: CONFIG.ASSETS.FONTS.MAIN,
            fontSize: 32,
            fill: CONFIG.UI.COLORS.LEVEL
        });
        highScoreText.anchor.set(0.5);
        highScoreText.position.set(CONFIG.GAME.WIDTH / 2, CONFIG.GAME.HEIGHT / 2 + 10);
        this.gameOverScreen.addChild(highScoreText);

        // Create restart button
        const button = new Graphics();
        button.beginFill(0x4CAF50);
        button.drawRoundedRect(-100, -30, 200, 60, 10);
        button.endFill();
        button.position.set(CONFIG.GAME.WIDTH / 2, CONFIG.GAME.HEIGHT / 2 + 80);
        button.eventMode = 'static';
        button.cursor = 'pointer';

        const buttonText = new Text('Play Again', {
            fontFamily: CONFIG.ASSETS.FONTS.MAIN,
            fontSize: 24,
            fill: CONFIG.UI.COLORS.TEXT
        });
        buttonText.anchor.set(0.5);
        button.addChild(buttonText);

        button.on('pointerdown', () => {
            this.removeChild(this.gameOverScreen);
            this.gameState.reset();
            this.createStartScreen();
            this.addChild(this.startScreen);
        });

        this.gameOverScreen.addChild(button);
        this.addChild(this.gameOverScreen);
    }

    private onBoxClick(boxId: number): void {
        const isCorrect = this.gameState.selectBox(boxId);
        const boxGraphics = this.boxes.get(boxId);

        if (boxGraphics) {
            const { box, text } = boxGraphics;

            if (isCorrect) {
                box.tint = CONFIG.GAME.BOX.COLORS.HIGHLIGHTED;
                text.visible = true;

                // Update only score display, not high score
                this.scoreText.text = `Score: ${this.gameState.getScore()}`;

                if (this.gameState.getPhase() === 'transition') {
                    this.memorizeText.text = 'Next Level!';
                    this.backgroundManager.celebrateLevel();

                    setTimeout(() => {
                        this.gameState.nextLevel();
                        this.setupLevel();
                    }, 1000);
                }
            } else {
                box.tint = CONFIG.GAME.BOX.COLORS.WRONG;
                text.visible = true;

                if (this.gameState.getPhase() === 'gameOver') {
                    this.createGameOverScreen();
                } else if (this.gameState.getPhase() === 'transition') {
                    this.memorizeText.text = 'Next Level!';
                    setTimeout(() => {
                        this.gameState.nextLevel();
                        this.setupLevel();
                    }, 1000);
                }
            }
        }
    }
}
