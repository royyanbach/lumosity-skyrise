import { CONFIG } from "../config/game-config";
import { GamePhase, GameLevel, Box, Position } from "../types/game-types";
import { generateRandomPosition } from "../utils/position-utils";
import { Assets } from 'pixi.js';
import { Howl } from 'howler';
import { BackgroundManager } from '../managers/background-manager';

export class GameState {
    private currentLevel: number = 1;
    private phase: GamePhase = 'memorization';
    private gameData: GameLevel;
    private timer: number = CONFIG.GAME.MEMORIZATION_TIME;
    private score: number = 0;
    private highScore: number = 0;
    private totalCorrectBoxes: number = 0;
    private sounds: { [key: string]: Howl } = {};
    private readonly backgroundManager?: BackgroundManager;

    constructor(backgroundManager?: BackgroundManager) {
        this.backgroundManager = backgroundManager;
        this.gameData = this.generateLevel(this.currentLevel);
        this.loadHighScore();
    }

    private loadHighScore(): void {
        const savedScore = localStorage.getItem('highScore');
        this.highScore = savedScore ? parseInt(savedScore) : 0;
    }

    private updateHighScore(): void {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('highScore', this.score.toString());
        }
    }

    public getHighScore(): number {
        return this.highScore;
    }

    private initializeSounds(): void {
        if (Object.keys(this.sounds).length > 0) return; // Already initialized

        console.log('Initializing sounds...');
        this.sounds = {
            [CONFIG.ASSETS.SOUNDS.CORRECT]: new Howl({
                src: [Assets.get(CONFIG.ASSETS.SOUNDS.CORRECT)],
                format: 'mp3',
                volume: 0.5,
                html5: true // Add this to help with mobile playback
            }),
            [CONFIG.ASSETS.SOUNDS.WRONG]: new Howl({
                src: [Assets.get(CONFIG.ASSETS.SOUNDS.WRONG)],
                format: 'mp3',
                volume: 0.5,
                html5: true
            }),
            [CONFIG.ASSETS.SOUNDS.LEVEL_COMPLETE]: new Howl({
                src: [Assets.get(CONFIG.ASSETS.SOUNDS.LEVEL_COMPLETE)],
                format: 'mp3',
                volume: 0.5,
                html5: true
            }),
            [CONFIG.ASSETS.SOUNDS.GAME_COMPLETE]: new Howl({
                src: [Assets.get(CONFIG.ASSETS.SOUNDS.GAME_COMPLETE)],
                format: 'mp3',
                volume: 0.7,
                html5: true
            })
        };
    }

    public playSound(soundKey: string): void {
        if (Object.keys(this.sounds).length === 0) {
            console.log('Initializing sounds first...');
            this.initializeSounds();
        }

        if (this.sounds[soundKey]) {
            this.sounds[soundKey].play();
        } else {
            console.warn('Sound not found:', soundKey);
            console.log('Available sounds:', Object.keys(this.sounds));
        }
    }

    public reset(): void {
        this.updateHighScore();
        this.currentLevel = 1;
        this.phase = 'memorization';
        this.timer = CONFIG.GAME.MEMORIZATION_TIME;
        this.score = 0;
        this.totalCorrectBoxes = 0;

        // Reset the game data with fresh boxes
        this.gameData = this.generateLevel(this.currentLevel);

        // Reset all box states
        this.gameData.boxes.forEach(box => {
            box.isSelected = false;
            box.isCorrect = undefined;
        });

        // Clear player sequence
        this.gameData.playerSequence = [];
        this.gameData.correctBoxes = 0;

        // Reset background if available
        if (this.backgroundManager) {
            this.backgroundManager.reset();
        }
    }

    private generateNumbers(level: number): number[] {
        const numbers: number[] = [];
        const maxNumber = 5 + (level - 1) * 3; // Increase max number by 3 each level
        const usedNumbers = new Set<number>();

        // Always generate 5 unique numbers
        while (numbers.length < 5) {
            const num = Math.floor(Math.random() * maxNumber) + 1;
            if (!usedNumbers.has(num)) {
                numbers.push(num);
                usedNumbers.add(num);
            }
        }

        // Sort numbers for the correct sequence
        return numbers.sort((a, b) => a - b);
    }

    private generateLevel(level: number): GameLevel {
        const numbers = this.generateNumbers(level);
        const boxes: Box[] = [];
        const usedPositions: Position[] = [];

        // Create 5 boxes with the generated numbers
        for (let i = 0; i < 5; i++) {
            const position = generateRandomPosition(
                CONFIG.GAME.WIDTH,
                CONFIG.GAME.HEIGHT,
                CONFIG.GAME.BOX.WIDTH,
                CONFIG.GAME.BOX.HEIGHT,
                usedPositions
            );

            boxes.push({
                id: i,
                number: numbers[i],
                x: position.x,
                y: position.y,
                isSelected: false,
                isCorrect: undefined  // Add this property to track correct/incorrect selections
            });
        }

        return {
            level,
            boxes,
            sequence: numbers,
            playerSequence: [],
            correctBoxes: 0
        };
    }

    public getCurrentLevel(): number {
        return this.currentLevel;
    }

    public getPhase(): GamePhase {
        return this.phase;
    }

    public setPhase(phase: GamePhase): void {
        this.phase = phase;
    }

    public getGameData(): GameLevel {
        return this.gameData;
    }

    public getTimer(): number {
        return this.timer;
    }

    public updateTimer(delta: number): void {
        if (this.phase === 'memorization') {
            this.timer -= delta;
            if (this.timer <= 0) {
                this.phase = 'input';
                this.timer = 0;
            }
        }
    }

    public getScore(): number {
        return this.score;
    }

    public getTotalCorrectBoxes(): number {
        return this.totalCorrectBoxes;
    }

    public selectBox(boxId: number): boolean {
        const box = this.gameData.boxes.find(b => b.id === boxId);
        if (!box || this.phase !== 'input') return false;

        box.isSelected = true;
        this.gameData.playerSequence.push(box.number);

        const isCorrect = this.checkCurrentSelection();
        box.isCorrect = isCorrect;

        if (isCorrect) {
            this.gameData.correctBoxes++;
            this.totalCorrectBoxes++;
            this.score += 10;
            this.playSound(CONFIG.ASSETS.SOUNDS.CORRECT);

            if (this.gameData.playerSequence.length === this.gameData.sequence.length) {
                if (this.currentLevel === CONFIG.GAME.TOTAL_LEVELS) {
                    this.playSound(CONFIG.ASSETS.SOUNDS.GAME_COMPLETE);
                    this.phase = 'gameOver';
                    return false; // Mark as incorrect to prevent further selection
                } else {
                    this.currentLevel++;
                    this.phase = 'transition';
                    this.playSound(CONFIG.ASSETS.SOUNDS.LEVEL_COMPLETE);
                }
                if (this.backgroundManager) {
                    this.backgroundManager.updateLevel(this.currentLevel, this.totalCorrectBoxes);
                }
            }
            return true;
        } else {
            this.playSound(CONFIG.ASSETS.SOUNDS.WRONG);

            // Mark remaining boxes as unselected and undefined correctness
            this.gameData.boxes.forEach(b => {
                if (!b.isSelected) {
                    b.isSelected = false;
                    b.isCorrect = undefined;
                }
            });

            if (this.gameData.playerSequence.length === 1) {
                this.playSound(CONFIG.ASSETS.SOUNDS.GAME_COMPLETE);
                this.phase = 'gameOver';
                return false;
            } else {
                if (this.gameData.correctBoxes > 0) {
                    if (this.currentLevel === CONFIG.GAME.TOTAL_LEVELS) {
                        this.playSound(CONFIG.ASSETS.SOUNDS.GAME_COMPLETE);
                        this.phase = 'gameOver';
                    } else {
                        this.currentLevel++;
                        this.phase = 'transition';
                        this.playSound(CONFIG.ASSETS.SOUNDS.LEVEL_COMPLETE);
                    }
                }
                return false;
            }
        }
    }

    private checkCurrentSelection(): boolean {
        const currentIndex = this.gameData.playerSequence.length - 1;
        return this.gameData.playerSequence[currentIndex] === this.gameData.sequence[currentIndex];
    }

    public nextLevel(): void {
        this.timer = CONFIG.GAME.MEMORIZATION_TIME;
        this.phase = 'memorization';
        this.gameData = this.generateLevel(this.currentLevel);
        if (this.backgroundManager) {
            this.backgroundManager.updateLevel(this.currentLevel, this.totalCorrectBoxes);
        }
    }
}
