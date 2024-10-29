import { Graphics } from 'pixi.js';

export const createRectangle = (width: number, height: number, color: number): Graphics => {
    const graphics = new Graphics();
    graphics.beginFill(color);
    graphics.drawRect(0, 0, width, height);
    graphics.endFill();
    return graphics;
};
