export type GamePhase = 'memorization' | 'input' | 'transition' | 'gameOver' | 'complete';

export interface Box {
    id: number;
    number: number;
    x: number;
    y: number;
    isSelected: boolean;
    isCorrect?: boolean;
}

export interface GameLevel {
    level: number;
    boxes: Box[];
    sequence: number[];
    playerSequence: number[];
    correctBoxes: number;
}

export interface Position {
    x: number;
    y: number;
}
