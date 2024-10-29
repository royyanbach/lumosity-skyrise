import { Container, Graphics } from 'pixi.js';
import { CONFIG } from '../config/game-config';
import gsap from 'gsap';

export class BackgroundManager extends Container {
    private readonly sky: Graphics;
    private readonly gradientSteps = 200; // Increased further for even smoother gradient
    private readonly sections: Graphics[] = [];
    private readonly ground: Graphics;
    private readonly buildingContainer: Container;
    private currentLevel: number = 1;
    private readonly TOTAL_HEIGHT: number = CONFIG.GAME.HEIGHT * 3;
    private currentProgress: number = 0;

    private createLegoSection(width: number, height: number, color: number): Graphics {
        const section = new Graphics();

        // Main block
        section.beginFill(color);
        section.drawRect(0, 0, width, height);
        section.endFill();

        // Standard LEGO stud measurements (based on game width for consistency)
        const studWidth = CONFIG.GAME.WIDTH * 0.06;
        const studHeight = CONFIG.GAME.WIDTH * 0.03; // Fixed stud height relative to game width
        const numberOfStuds = 4;
        const totalStudsWidth = studWidth * numberOfStuds * 1.5;
        const startX = (width - totalStudsWidth) / 2;

        // Add studs with 3D effect as separate graphics objects
        for (let i = 0; i < numberOfStuds; i++) {
            const x = startX + (i * studWidth * 1.5) + studWidth/2;

            const stud = new Graphics();

            // Stud base (darker)
            stud.beginFill(this.adjustColor(color, -30));
            stud.drawRect(x - studWidth/2, -studHeight, studWidth, studHeight);
            stud.endFill();

            // Stud right side (darker shadow)
            stud.beginFill(this.adjustColor(color, -40));
            stud.drawRect(x + studWidth/2 - 2, -studHeight, 2, studHeight);
            stud.endFill();

            // Stud top (highlight)
            stud.beginFill(this.adjustColor(color, 20));
            stud.drawRect(x - studWidth/2, -studHeight, studWidth, 2);
            stud.endFill();

            section.addChild(stud);
        }

        return section;
    }

    private adjustColor(color: number, amount: number): number {
        const r = Math.min(255, Math.max(0, ((color >> 16) & 0xFF) + amount));
        const g = Math.min(255, Math.max(0, ((color >> 8) & 0xFF) + amount));
        const b = Math.min(255, Math.max(0, (color & 0xFF) + amount));
        return (r << 16) | (g << 8) | b;
    }

    constructor() {
        super();

        // Create sky background
        this.sky = new Graphics();
        this.drawSkyGradient(0);
        this.addChild(this.sky);

        // Create building container
        this.buildingContainer = new Container();
        this.addChild(this.buildingContainer);

        // Calculate section height
        const sectionHeight = (this.TOTAL_HEIGHT - CONFIG.GAME.BACKGROUND.GROUND_HEIGHT)
                            / CONFIG.GAME.BACKGROUND.SECTIONS;

        // Create LEGO sections
        for (let i = 0; i < CONFIG.GAME.BACKGROUND.SECTIONS; i++) {
            const section = this.createLegoSection(
                CONFIG.GAME.WIDTH * 0.6,
                sectionHeight,
                CONFIG.GAME.BACKGROUND.COLORS.BUILDING_HIGHLIGHT
            );

            section.position.set(
                CONFIG.GAME.WIDTH * 0.2,
                this.TOTAL_HEIGHT - CONFIG.GAME.BACKGROUND.GROUND_HEIGHT - (i + 1) * sectionHeight
            );
            section.alpha = 0;
            this.buildingContainer.addChild(section);
            this.sections.push(section);
        }

        // Create LEGO ground base
        this.ground = this.createLegoSection(
            CONFIG.GAME.WIDTH,
            CONFIG.GAME.BACKGROUND.GROUND_HEIGHT,
            CONFIG.GAME.BACKGROUND.COLORS.GROUND
        );
        this.ground.position.set(
            0,
            this.TOTAL_HEIGHT - CONFIG.GAME.BACKGROUND.GROUND_HEIGHT
        );
        this.buildingContainer.addChild(this.ground);

        // Position building container
        this.buildingContainer.y = CONFIG.GAME.HEIGHT - this.TOTAL_HEIGHT;
    }

    private drawSkyGradient(progress: number): void {
        this.sky.clear();
        const stepHeight = CONFIG.GAME.HEIGHT / this.gradientSteps;

        for (let i = 0; i < this.gradientSteps; i++) {
            const verticalRatio = i / this.gradientSteps;
            // Simply use verticalRatio + progress without inverting
            const adjustedRatio = Math.min(1, Math.max(0, verticalRatio + progress));

            const color = this.interpolateColor(
                CONFIG.GAME.BACKGROUND.COLORS.SKY_BOTTOM, // Light blue (bottom)
                CONFIG.GAME.BACKGROUND.COLORS.SKY_TOP,    // Dark blue (top)
                adjustedRatio
            );

            this.sky.beginFill(color);
            this.sky.drawRect(
                0,
                i * stepHeight,
                CONFIG.GAME.WIDTH,
                stepHeight + 1
            );
            this.sky.endFill();
        }
    }

    private updateSkyGradient(progress: number): void {
        // Smoothly animate to new progress
        gsap.to(this, {
            currentProgress: progress,
            duration: 1,
            ease: 'power2.inOut',
            onUpdate: () => {
                this.drawSkyGradient(this.currentProgress);
            }
        });
    }

    private interpolateColor(color1: number, color2: number, ratio: number): number {
        const r1 = (color1 >> 16) & 0xFF;
        const g1 = (color1 >> 8) & 0xFF;
        const b1 = color1 & 0xFF;

        const r2 = (color2 >> 16) & 0xFF;
        const g2 = (color2 >> 8) & 0xFF;
        const b2 = color2 & 0xFF;

        const r = Math.round(r1 + (r2 - r1) * ratio);
        const g = Math.round(g1 + (g2 - g1) * ratio);
        const b = Math.round(b1 + (b2 - b1) * ratio);

        return (r << 16) | (g << 8) | b;
    }

    public updateLevel(level: number, totalCorrectBoxes: number): void {
        this.currentLevel = level;

        // Calculate progress based on total correct boxes instead of level
        const maxPossibleBoxes = CONFIG.GAME.TOTAL_LEVELS * 5;
        const progress = Math.min(1, totalCorrectBoxes / maxPossibleBoxes);

        // Smoothly update sky gradient
        this.updateSkyGradient(progress);

        // Calculate building movement
        const totalScrollDistance = this.TOTAL_HEIGHT - CONFIG.GAME.HEIGHT;
        const scrollPerLevel = totalScrollDistance / (CONFIG.GAME.TOTAL_LEVELS - 1);
        let targetY = CONFIG.GAME.HEIGHT - this.TOTAL_HEIGHT + (scrollPerLevel * (level - 1));

        // Hide studs of covered sections immediately
        this.sections.forEach((section, index) => {
            // Hide studs for all sections except the current top one
            if (index < level - 2) {
                const studs = section.children;
                studs.forEach(stud => {
                    stud.visible = false;
                });
            } else {
                // Show studs for the current top section
                const studs = section.children;
                studs.forEach(stud => {
                    stud.visible = true;
                });
            }
        });

        // Animate building movement
        gsap.to(this.buildingContainer, {
            y: targetY + 50,
            duration: 1,
            ease: 'power2.inOut'
        });

        // Update section visibility with animation
        this.sections.forEach((section, index) => {
            if (index < level - 1) {
                gsap.to(section, {
                    alpha: 0.6,
                    duration: 0.5,
                    ease: 'power2.out'
                });
            }
        });
    }

    public celebrateLevel(): void {
        const currentSection = this.sections[this.currentLevel - 2];
        if (currentSection) {
            // Store current stud visibility
            const studs = currentSection.children.filter(child => child.y < 0);
            const studVisibility = studs.map(stud => stud.visible);

            gsap.to(currentSection, {
                alpha: 1,
                duration: 0.2,
                yoyo: true,
                repeat: 3,
                ease: 'power2.inOut',
                onComplete: () => {
                    // Restore stud visibility after celebration
                    studs.forEach((stud, i) => {
                        stud.visible = studVisibility[i];
                    });
                }
            });
        }
    }

    public reset(): void {
        // Reset all sections to initial state
        this.sections.forEach((section) => {
            section.alpha = 0;
            // Show all studs
            const studs = section.children;
            studs.forEach(stud => {
                stud.visible = true;
            });
        });

        // Reset building container position
        this.buildingContainer.y = CONFIG.GAME.HEIGHT - this.TOTAL_HEIGHT;

        // Reset sky gradient
        this.updateSkyGradient(0);

        // Reset current level
        this.currentLevel = 1;
    }
}
