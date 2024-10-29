import { Position } from '../types/game-types';
import { CONFIG } from '../config/game-config';

const RANDOM_OFFSET = 100; // Maximum distance from center
const MIN_DISTANCE = 80; // Minimum distance between boxes
const TOP_MARGIN = 90; // Adjusted from 120 to 90 to match new UI height
const PLAY_AREA_HEIGHT = 300; // Height of the play area where boxes appear

export const generateRandomPosition = (
    maxWidth: number,
    maxHeight: number,
    boxWidth: number,
    boxHeight: number,
    usedPositions: Position[]
): Position => {
    let attempts = 0;
    const maxAttempts = 100;

    // Calculate the vertical play area
    const playAreaTop = TOP_MARGIN;
    const playAreaBottom = playAreaTop + PLAY_AREA_HEIGHT;

    while (attempts < maxAttempts) {
        // Generate position around the center of the play area
        const centerX = maxWidth / 2;
        const centerY = playAreaTop + PLAY_AREA_HEIGHT / 2;

        const position = {
            x: centerX + (Math.random() * 2 - 1) * RANDOM_OFFSET,
            y: centerY + (Math.random() * 2 - 1) * (PLAY_AREA_HEIGHT / 3)
        };

        // Ensure the position is within bounds
        position.x = Math.max(boxWidth / 2, Math.min(position.x, maxWidth - boxWidth / 2));
        position.y = Math.max(playAreaTop, Math.min(position.y, playAreaBottom - boxHeight));

        // Check if position is valid (not overlapping with other boxes)
        if (isValidPosition(position, boxWidth, boxHeight, usedPositions)) {
            usedPositions.push(position); // Add to used positions
            return position;
        }

        attempts++;
    }

    // Fallback: If no valid position found, place in a grid pattern
    return getFallbackPosition(usedPositions.length, boxWidth, boxHeight, playAreaTop);
};

const isValidPosition = (
    position: Position,
    boxWidth: number,
    boxHeight: number,
    usedPositions: Position[]
): boolean => {
    for (const usedPos of usedPositions) {
        const distance = Math.sqrt(
            Math.pow(position.x - usedPos.x, 2) +
            Math.pow(position.y - usedPos.y, 2)
        );

        // If boxes are too close, position is invalid
        if (distance < MIN_DISTANCE) {
            return false;
        }
    }
    return true;
};

const getFallbackPosition = (
    index: number,
    boxWidth: number,
    boxHeight: number,
    playAreaTop: number
): Position => {
    const GRID_COLUMNS = 3;
    const spacing = MIN_DISTANCE;

    const row = Math.floor(index / GRID_COLUMNS);
    const col = index % GRID_COLUMNS;

    return {
        x: CONFIG.GAME.WIDTH / 4 + col * spacing,
        y: playAreaTop + row * spacing
    };
};
