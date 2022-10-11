// const grid = 64;
const numRows = 13;
const numCols = 15;

// const ELEMENTS = {
//     WALL: 'wall',
//     DESTROYABLE_WALL: 'destroyable-wall',
//     EMPTY_CELL: 'empty-cell',
//     FIELD: 'field',
// }

export const types = {
    wall: '▉',
    destroyableWall: 1,
    emptyCell: 'x',
    blank: '.',

    speedUp: 2,
    bombRadius: 3,
    bombsNumber: 4,

    speedUpOpened: 's',
    bombsNumberOpened: 'n',
    bombRadiusOpened: 'r',

    bomb: 'b',
    detonatedBomb: 'd',
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
    [ types.bombsNumber, types.bombRadius, types.speedUp].forEach(t => {
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
    1: {x: 50, y: 50},
    2: {x: 650, y: 550},
    3: {x: 650, y: 50},
    4: {x: 50, y: 550},
}
