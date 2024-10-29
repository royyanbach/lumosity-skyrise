export const CONFIG = {
    GAME: {
        WIDTH: 390,
        HEIGHT: 844,
        BACKGROUND_COLOR: 0x1099bb,
        TOTAL_LEVELS: 10,
        INITIAL_BOXES: 5,
        MEMORIZATION_TIME: 2000, // 2 seconds in milliseconds
        BOX: {
            WIDTH: 60,
            HEIGHT: 60,
            MARGIN: 10,
            COLORS: {
                DEFAULT: 0x2196F3,  // Brighter blue
                HIGHLIGHTED: 0x4CAF50,  // Material green
                WRONG: 0xFF5252     // Bright red
            }
        },
        BACKGROUND: {
            SECTIONS: 10,
            COLORS: {
                SKY_TOP: 0x1a237e,    // Dark blue
                SKY_BOTTOM: 0x64b5f6,  // Light blue
                BUILDING_HIGHLIGHT: 0xf44336, // LEGO red
                GROUND: 0x4CAF50      // LEGO green base
            },
            GROUND_HEIGHT: 100,
            SECTION_HEIGHT: 74.4,
        }
    },
    ASSETS: {
        FONTS: {
            MAIN: 'Arial'
        },
        SOUNDS: {
            CORRECT: 'correct',
            WRONG: 'wrong',
            LEVEL_COMPLETE: 'level-complete',
            GAME_COMPLETE: 'game-complete'
        }
    },
    UI: {
        COLORS: {
            TEXT: 0xFFFFFF,
            TIMER: 0xe74c3c,
            LEVEL: 0x2ecc71
        },
        FONT_SIZES: {
            BOX_NUMBER: 32,
            TIMER: 48,
            LEVEL: 24,
            GAME_OVER: 36
        }
    }
} as const;
