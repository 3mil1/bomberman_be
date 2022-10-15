const numRows = 13;
const numCols = 15;

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
    [types.bombsNumber, types.bombRadius, types.speedUp].forEach(t => {
        addPowerUp(t, template);
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

export function fire(x, y, radius, map) {
    map[y][x] = types.detonatedBomb;
    let stopRight = false;
    let stopLeft = false;
    let stopUp = false;
    let stopDown = false;
    for (let i = 1; i <= radius; i++) {
        if (x + i < numCols) {
            stopRight = stopRight || map[y][x + i] === types.wall;
            map[y][x + i] = stopRight ? map[y][x + i] : types.detonatedBomb;
        }
        if (x - i > 0) {
            stopLeft = stopLeft || map[y][x - i] === types.wall;
            map[y][x - i] = stopLeft ? map[y][x - i] : types.detonatedBomb;
        }
        if (y + i < numRows) {
            stopUp = stopUp || map[y + i][x] === types.wall;
            map[y + i][x] = stopUp ? map[y + i][x] : types.detonatedBomb;
        }
        if (y - 1 > 0) {
            stopDown = stopDown || map[y - i][x] === types.wall;
            map[y - i][x] = stopDown ? map[y - i][x] : types.detonatedBomb;
        }
    }
    return map;
}

export function changeMapAfterExplosion(x, y, radius, map) {
    map[y][x] = types.blank;
    for (let i = 1; i <= radius; i++) {
        if (x + i < numCols) map[y][x + i] = switchType(x + i, y, map);
        if (x - i > 0) map[y][x - i] = switchType(x - i, y, map);
        if (y + i < numRows) map[y + i][x] = switchType(x, y + i, map);
        if (y - 1 > 0) map[y - i][x] = switchType(x, y - i, map);
    }
    return map
}

function switchType(x, y, map) {
    switch (map[y][x]) {
        case types.destroyableWall:
        case types.emptyCell:
        case types.detonatedBomb:
            return types.blank;
        case types.speedUp:
            return types.speedUpOpened;
        case types.bombsNumber:
            return types.bombsNumberOpened;
        case types.bombRadius:
            return types.bombRadiusOpened;
        default:
            return map[y][x];
    }
}
