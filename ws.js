import {WebSocketServer} from "ws";
import {addPowerUps, generateLevel, playerPositions, template, types} from "./game_map.js";

Array.prototype.remove = function () {
    let what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};

const matchPlayerIPWithRoomId = {}
const playerMoving = [];

const trackBombs = () => {
    const trackedBombs = {}

    return {
        setCallback: (callback) => {
            return {
                placeBomb: (x, y, timer, roomId) => {
                    trackedBombs[`${x}:${y}`] = "someValue"
                    setTimeout(() => {
                        callback(x, y, roomId)
                    }, timer);
                }
            }
        }
    }
}

const DIRECTION = {
    UP: 'up',
    DOWN: 'down',
    LEFT: 'left',
    RIGHT: 'right',
};

class Player {
    constructor({x, y}) {
        this.position = {x: x, y: y,};
        this.speed = 1;
        this.health = 3;
        this.power = new Set();
        this.bombCount = 1;
        this.direction = DIRECTION.DOWN;
        this.flame = 1;
    }

    #speedUp() {
        this.speed *= 1.10;
    }

    setPosition(direction) {
        if (direction != null) this.direction = direction;

        switch (this.direction) {
            case DIRECTION.DOWN: {
                return this.position.y += this.speed;
            }
            case DIRECTION.UP: {
                return this.position.y -= this.speed;
            }
            case DIRECTION.LEFT: {
                return this.position.x -= this.speed;
            }
            case DIRECTION.RIGHT: {
                return this.position.x += this.speed;
            }
        }
    }

    decreaseHealth() {
        return this.health -= 1
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

    #setRoom() {
        const roomId = uuidv4()
        this.server.set(roomId, {})
        this.server.get(roomId)["map"] = generateLevel(template)
        this.server.get(roomId)["started"] = false
        this.server.get(roomId)["numberOfPlayers"] = 0
        this.server.get(roomId)["messages"] = [];
        this.server.get(roomId)["players"] = {};
        return roomId
    }

    setPlayer({name, roomId = ""}) {
        if (roomId === "") {
            roomId = this.#setRoom()
        }
        const room = this.server.get(roomId)
        if (!room) return //что возвращается фронту в этом случае?
        addPowerUps(room["map"]);
        room["numberOfPlayers"] += 1
        room.players[name] = new Player(playerPositions[room["numberOfPlayers"]])
        return {roomId, name}
    }

    setBomb(name, roomId) {
        //что здесь происходит???
        const room = this.server.get(roomId)
        // for (let y = 0; y < room["map"].length; y++) {
        //     for (let x = 0; x < room["map"][y].length; x++) {
        //         if (room.players[name].position.x === x && room[name].position.y === y && room[name].bombCount > 0 ) {
        //             room["map"][y][x] = "b"
        //             room.players[name].bombCount--
        //             return {x, y, "timer": 5000}
        //         }
        //     }
        // }
        if (room.players[name].bombCount > 0) {
            const x = Math.round(room.players[name].position.x / 50);
            const y = Math.round(room.players[name].position.y / 50);
            room["map"][y][x] = types.bomb;
            room.players[name].bombCount--
            return {x, y, "timer": 5000}
        }


    }

//нужно вернуть бомбу игроку после детонации
    //для изменения карты после взрыва нужно знать дальность взрыва
    detonateBomb(x, y, roomId) {
        const room = this.server.get(roomId)
        room["map"][y][x] = types.detonatedBomb;
    }

    startGame(roomId) {
        return this.server.get(roomId).started = true
    }

    //Messages
    addMessage(name, text, roomId) {
        this.server.get(roomId).messages.push(
            name,
            text,
        )
    }
}

export const
    server = (port) => {
        const fps = 60;
        const ws = new WebSocketServer({port});
        const game = new Game();
        let trackedBombs = trackBombs()
        let startTrackingBomb

        const commands = (method, args, playerIP) => {
            switch (method) {
                case 'setPosition' : {
                    const {roomId, name} = matchPlayerIPWithRoomId[playerIP]
                    const {move, direction} = args

                    if (move) {
                        if (!playerMoving.includes(playerIP)) playerMoving.push(playerIP)
                    } else {
                        playerMoving.remove(playerIP)
                    }

                    return game.server.get(roomId).players[name].setPosition(direction);
                }
                case 'setPlayer' : {
                    const {roomId, name} = game.setPlayer(args)
                    matchPlayerIPWithRoomId[playerIP] = {roomId, name}
                    return {roomId, name}
                }
                case 'decreaseHealth': {
                    const {roomId, name} = matchPlayerIPWithRoomId[playerIP]
                    return game.server.get(roomId).players[name].decreaseHealth()
                }
                case 'setPower': {
                    const {roomId, name} = matchPlayerIPWithRoomId[playerIP]
                    const {power} = args
                    return game.server.get(roomId).players[name].setPower(power)
                }
                case "setBomb": {
                    const {roomId, name} = matchPlayerIPWithRoomId[playerIP]
                    //???
                    const {x, y, timer} = game.setBomb(name, roomId)
                    startTrackingBomb.placeBomb(x, y, timer, roomId, name) //нужно передавать имя игрока, который помещает бомбу
                    return {x, y}
                }
                case 'startGame': {
                    const {roomId} = args
                    return game.startGame(roomId)
                }
                case 'newMessage': {
                    const {roomId, name} = matchPlayerIPWithRoomId[playerIP]
                    const {text} = args;
                    game.addMessage(name, text, roomId);
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
                    if (gameObj[roomId].started) animate(gameObj, playerIP, connection);
                }
            });
        })

        function animate(obj) {
            ws.broadcast(obj);

            playerMoving.forEach(ip => {
                commands('setPosition', {move: true, direction: null}, ip)
            })

            setTimeout(() => {
                startTrackingBomb = trackedBombs.setCallback(game.detonateBomb.bind(game))
                animate(obj)
            }, 1000 / fps);
        }

        ws.broadcast = function broadcast(obj) {
            ws.clients.forEach(function each(client) {
                const ip = client["_socket"]["_peername"].address
                const roomId = matchPlayerIPWithRoomId[ip].roomId
                if (!roomId) return
                client.send(JSON.stringify(obj[roomId]), {binary: false});
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

