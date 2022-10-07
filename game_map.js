// const grid = 64;
const numRows = 13;
const numCols = 15;

const ELEMENTS = {
    WALL: 'wall',
    DESTROYABLE_WALL: 'destroyable-wall',
    EMPTY_CELL: 'empty-cell',
    FIELD: 'field',
}

const types = {
    wall: '▉',
    destroyableWall: 1,
    emptyCell: 'x',
    blank: '.',
    speedUp: 2,
    bombRadius: 3,
    bombs: 4,
}

function addPowerUp(type, template) {
    while (true) {
        let i = Math.floor(Math.random() * numRows);
        let j = Math.floor(Math.random() * numCols);
        if (template[i][j] === types.destroyableWall) {
            template[i][j] = type;
            return
        }
    }
}

export function addPowerUps(template) {
    [ types.bombs, types.bombRadius, types.speedUp].forEach(t => {
        addPowerUp( t, template);
    })
}

export function generateLevel(template) {
    for (let row = 0; row < numRows; row++) {
        for (let col = 0; col < numCols; col++) {
            if (template[row][col] === "." && Math.random() < 0.9) {
                template[row][col] = types.destroyableWall;
            }
        }
    }
    addPowerUps(template);
    return template;
}

export const template = [
    ['▉', '▉', '▉', '▉', '▉', '▉', '▉', '▉', '▉', '▉', '▉', '▉', '▉', '▉', '▉'],
    ['▉', 'x', 'x', '.', '.', '.', '.', '.', '.', '.', '.', '.', 'x', 'x', '▉'],
    ['▉', 'x', '▉', '.', '▉', '.', '▉', '.', '▉', '.', '▉', '.', '▉', 'x', '▉'],
    ['▉', 'x', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', 'x', '▉'],
    ['▉', '.', '▉', '.', '▉', '.', '▉', '.', '▉', '.', '▉', '.', '▉', '.', '▉'],
    ['▉', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '▉'],
    ['▉', '.', '▉', '.', '▉', '.', '▉', '.', '▉', '.', '▉', '.', '▉', '.', '▉'],
    ['▉', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '▉'],
    ['▉', '.', '▉', '.', '▉', '.', '▉', '.', '▉', '.', '▉', '.', '▉', '.', '▉'],
    ['▉', 'x', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', 'x', '▉'],
    ['▉', 'x', '▉', '.', '▉', '.', '▉', '.', '▉', '.', '▉', '.', '▉', 'x', '▉'],
    ['▉', 'x', 'x', '.', '.', '.', '.', '.', '.', '.', '.', '.', 'x', 'x', '▉'],
    ['▉', '▉', '▉', '▉', '▉', '▉', '▉', '▉', '▉', '▉', '▉', '▉', '▉', '▉', '▉']
];

export const playerPositions = {
    1: {x: 1, y: 1},
    2: {x: 13, y: 11},
    3: {x: 13, y: 1},
    4: {x: 1, y: 11},
}
