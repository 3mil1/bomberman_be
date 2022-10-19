export const types = {
    wall: '▉',
    destroyableWall: 1,
    emptyCell: 'x',
    blank: '.',

    speedUp: 2,
    bombRadius: 3,
    bombNumber: 4,

    bomb: 'b',
    detonatedBomb: 'd',
}

export const powerUps = [types.speedUp, types.bombRadius, types.bombNumber];

export class GameMap {
    constructor(template) {
        this.template = template;
        this.numRows = this.template.length;
        this.numCols = this.template[0].length;
        this.#generateLevel();
        this.powerUps = {};
    }

    #generateLevel() {
        for (let row = 0; row < this.numRows; row++) {
            for (let col = 0; col < this.numCols; col++) {
                if (this.template[row][col] === "." && Math.random() < 0.9) {
                    this.template[row][col] = types.destroyableWall;
                }
            }
        }
    }

    addPowerUps() {
        powerUps.forEach(t => {
            this.#addPowerUp(t);
        })
    }

    #addPowerUp(type) {
        while (true) {
            const i = Math.floor(Math.random() * this.numRows);
            const j = Math.floor(Math.random() * this.numCols);
            const key = `${i}:${j}`;
            if (this.template[i][j] === types.destroyableWall && !this.powerUps[key]) {
                this.powerUps[key] = type;
                return
            }
        }
    }

    explosion(x, y, radius) {
        this.template[y][x] = types.detonatedBomb;
        let stopRight = false;
        let stopLeft = false;
        let stopUp = false;
        let stopDown = false;
        for (let i = 1; i <= radius; i++) {
            if (x + i < this.numCols) {
                stopRight = stopRight || this.template[y][x + i] === types.wall;
                this.template[y][x + i] = stopRight ? this.template[y][x + i] : types.detonatedBomb;
            }
            if (x - i > 0) {
                stopLeft = stopLeft || this.template[y][x - i] === types.wall;
                this.template[y][x - i] = stopLeft ? this.template[y][x - i] : types.detonatedBomb;
            }
            if (y + i < this.numRows) {
                stopUp = stopUp || this.template[y + i][x] === types.wall;
                this.template[y + i][x] = stopUp ? this.template[y + i][x] : types.detonatedBomb;
            }
            if (y - 1 > 0) {
                stopDown = stopDown || this.template[y - i][x] === types.wall;
                this.template[y - i][x] = stopDown ? this.template[y - i][x] : types.detonatedBomb;
            }
        }
        return this.template;
    }

    changeMapAfterExplosion(x, y, radius) {
        this.template[y][x] = types.blank;
        for (let i = 1; i <= radius; i++) {
            if (x + i < this.numCols) this.template[y][x + i] = this.#switchType(x + i, y);
            if (x - i > 0) this.template[y][x - i] = this.#switchType(x - i, y);
            if (y + i < this.numRows) this.template[y + i][x] = this.#switchType(x, y + i);
            if (y - 1 > 0) this.template[y - i][x] = this.#switchType(x, y - i);
        }
        return this.template
    }

    #switchType(x, y) {
        switch (this.template[y][x]) {
            case types.destroyableWall:
            case types.emptyCell:
                return types.blank;
            case types.detonatedBomb:
                let type = types.blank;
                let key = `${y}:${x}`;
                if (this.powerUps[key]) {
                    type = this.powerUps[key];
                    this.powerUps[key] = null;//надо чтоб не поставить два раза
                }
               return type;
            default:
                return this.template[y][x];
        }
    }

    hasPowerUp(x, y) {
        return powerUps.includes(this.template[y][x]) ? this.template[y][x] : null ;
    }

    deletePowerUp(x, y) {
        this.template[y][x] = types.blank;
    }

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