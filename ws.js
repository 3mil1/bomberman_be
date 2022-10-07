import {WebSocketServer} from "ws";
import {generateLevel, playerPositions, template} from "./game_map.js";

const matchPlayerIPWithRoomId = {}

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
    constructor({x, y}) {
        this.position = {x: x, y: y, speedX: 0, speedY: 0};
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
        this.server.set(roomId, {[name]: {}})
        this.server.get(roomId)["map"] = generateLevel(template)
        this.server.get(roomId)["started"] = false
        return roomId
    }

    setPlayer({name, roomId = ""}) {
        if (roomId === "") {
            const roomId = this.#setRoom({name})
            const room = this.server.get(roomId)
            room["numberOfPlayers"] = 1
            room[name] = new Player(playerPositions["1"])
            return {roomId, name}
        }
        const room = this.server.get(roomId)
        if (!room) return
        room["numberOfPlayers"] += 1
        room[name] = new Player(playerPositions[room["numberOfPlayers"]])
        return {roomId, name}
    }

    setBomb({name, roomId}) {
        const room = this.server.get(roomId)
        for (let y = 0; y < room["map"].length; y++) {
            for (let x = 0; x < x.length; x++) {
                if (room[name].position.x === x && roomId[name].position.y === x) {
                    room["map"][y][x] = "b"
                }
            }
        }
    }

    startGame(roomId) {
        return this.server.get(roomId).started = true
    }
}

export const
    server = (port) => {
        const fps = 1;
        const ws = new WebSocketServer({port});
        const game = new Game();

        const commands = (method, args, playerIP) => {
            switch (method) {
                case 'setPosition' : {
                    const {roomId, name, position} = args
                    const {x, y} = position
                    return game.server.get(roomId)[name].setPosition(x, y)
                }
                case 'setPlayer' : {
                    const {roomId, name} = game.setPlayer(args)
                    matchPlayerIPWithRoomId[playerIP] = {roomId, name}
                    return {roomId, name}
                }
                case 'decreaseHealth': {
                    const {roomId, name} = args
                    return game.server.get(roomId)[name].decreaseHealth()
                }
                case 'setPower': {
                    const {roomId, name, power} = args
                    return game.server.get(roomId)[name].setPower(power)
                }
                case 'startGame': {
                    const {roomId} = args
                    return game.startGame(roomId)
                }
                case "setBomb": {

                }

            }
        }

        ws.on('connection', (connection, req) => {
            const playerIP = req.socket.remoteAddress;

            connection.on('message', async (message) => {
                const obj = JSON.parse(message);
                const {method, args = []} = obj;

                const fromCmd = commands(method, args, playerIP)

                if (method === 'setPlayer') {
                    const {roomId, name} = fromCmd
                    connection.send(JSON.stringify({roomId, name}), {binary: false});
                }

                const {roomId} = args
                if (roomId) {
                    const gameClass = game.server
                    const gameObj = Object.fromEntries(gameClass);
                    if (gameObj[roomId].started) animate(gameObj);
                }
            });
        })


        function animate(obj) {
            ws.broadcast(obj);

            setTimeout(() => {
                animate(obj)
            }, 1000 / fps);
        }

        ws.broadcast = function broadcast(obj) {
            ws.clients.forEach(function each(client) {
                const ip = client["_socket"]["_peername"].address
                const roomId = matchPlayerIPWithRoomId[ip].roomId
                if (!roomId) return
                client.send(JSON.stringify(obj[matchPlayerIPWithRoomId[ip]]), {binary: false});
            });
        };

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
