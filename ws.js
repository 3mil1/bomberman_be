import {WebSocketServer} from "ws";
import {generateLevel, template} from "./game_map.js";

const Direction = {
    Up: 'Up',
    Down: 'Down',
    Left: 'Left',
    Right: 'Right'
}

class Bomb {
    constructor({x, y}) {
        this.bomb = {
            x,
            y,
            beforeExplosion: 5
        }
    }
}

class Player {
    constructor() {
        this.position = {x: 0, y: 0, speedX: 0, speedY: 0};
        this.speed = 1;
        this.health = 3;
        this.power = new Set();
        this.bombCount = 1;
        this.spriteDir = Direction.Down
        this.flame = 0;
    }

    #speedUp() {
        this.position.speedX *= 1.10
        this.position.speedY *= 1.10
    }

    setPosition(x, y) {
        return this.position = {
            x, y
        }
    }

    decreaseHealth() {
        return this.health = -1
    }

    setPower(power) {
        switch (power) {
            case "speedUp": {
                return this.#speedUp();
            }
            case "bombIncrease": {
                return this.bombCount += 1;
            }
            case "flameIncrease": {
                return this.flame += 1;
            }
        }
    }
}

class Game {
    constructor() {
        this.server = new Map();
    }

    #setRoom({name}) {
        const roomId = uuidv4()
        let player = new Player()
        this.server.set(roomId, {[name]: player})
        this.server.get(roomId)["map"] = generateLevel(template)
        return roomId
    }

    setPlayer({name, roomId = ""}) {
        if (roomId === "") {
            return this.#setRoom({name})
        }
        const room = this.server.get(roomId)
        if (!room) return
        room[name] = new Player()
        return roomId
    }

    setBomb({name, roomId}) {
        const room = this.server.get(roomId)
        for (let x = 0; x < room["map"].length; x++) {
            for (let y = 0; y < x.length; y++) {
                if (room[name].position.x === x && roomId[name].position.y === y) {
                    // todo
                }
            }
        }
    }

    startGame(roomId) {
        // todo
    }
}

export const
    server = (port) => {
        const ws = new WebSocketServer({port});
        const game = new Game();

        const commands = (method, args) => {
            switch (method) {
                case 'setPosition' : {
                    const {roomId, name, position} = args
                    const {x, y} = position
                    return game.server.get(roomId)[name].setPosition(x, y)
                }
                case 'setPlayer' : {
                    return game[method](args)
                }
                case 'decreaseHealth': {
                    const {roomId, name} = args
                    return game.server.get(roomId)[name].decreaseHealth()
                }
                case 'setPower':
                    const {roomId, name, power} = args
                    return game.server.get(roomId)[name].setPower(power)
            }
        }

        ws.on('connection', (connection, req) => {
            const ip = req.socket.remoteAddress;

            connection.on('message', async (message) => {
                const obj = JSON.parse(message);
                const {method, args = []} = obj;

                const fromCmd = commands(method, args)
                console.log("ANSWER", fromCmd)

                const response = game.server
                const entries = Object.fromEntries(response);
                const str = JSON.stringify(entries)

                connection.send(str, {binary: false});
            });
        })

        ws.on('close', () => {
            // todo
        })

        console.log(`API on port ${port}`);
    };


function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        let r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
