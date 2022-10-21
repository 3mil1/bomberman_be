import {WebSocketServer} from "ws";
import {GameMap, playerPositions, powerUps, template, types} from "./game_map.js";
import {
    ACTIVE,
    LOOSER,
    NEW_MESSAGE,
    SET_BOMB,
    SET_PLAYER,
    SET_POSITION,
    SET_POWER,
    START_GAME,
    TIE, WINNER
} from "./constants.js";
import checkCollision from './collision_map.js';

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
let stop = false

const trackBombs = () => {
    const trackedBombs = {}

    return {
        setCallback: (afterPlace, afterExplosion) => {
            return {
                placeBomb: (x, y, timer, roomId, name) => {
                    trackedBombs[`${x}:${y}`] = "someValue"//name?
                    setTimeout(() => {
                        afterPlace(x, y, roomId, name);
                        setTimeout(() => {
                            afterExplosion(x, y, roomId, name);
                        }, 1000);
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
        this.position = {x, y};
        this.speed = 1;
        this.health = 3;
        // this.power = new Set();
        this.bombCount = 1;
        this.direction = DIRECTION.DOWN;
        this.flame = 1;
        this.newPosition = {x, y}
        this.moving = false;
        this.status = ACTIVE;
    }

    #speedUp() {
        this.speed *= 1.1;
    }

    setPosition(map, direction) {
        if (direction != null) this.direction = direction;
        let newPosition = Object.assign({}, this.position);
        switch (this.direction) {
            case DIRECTION.DOWN: {
                newPosition.y = this.position.y + this.speed;
                break;
            }
            case DIRECTION.UP: {
                newPosition.y = this.position.y - this.speed;
                break;
            }
            case DIRECTION.LEFT: {
                newPosition.x = this.position.x - this.speed;
                break;
            }
            case DIRECTION.RIGHT: {
                newPosition.x = this.position.x + this.speed;
                break;
            }
        }
        if (checkCollision(map, newPosition, this.direction)) {
            this.position = newPosition;
            return newPosition;
        }
    }

    getCell() {
        const x = Math.round(this.position.x / 50);
        const y = Math.round(this.position.y / 50);
        return {x, y};
    }

    decreaseHealth() {
        this.health -= 1;
        if (this.health === 0) {
            this.status = LOOSER;
        }
    }

    setPower(power) {
        switch (power) {
            case types.speedUp: {
                return this.#speedUp();
            }
            case types.bombNumber: {
                return (this.bombCount += 1);
            }
            case types.bombRadius: {
                return (this.flame += 1);
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
        this.server.get(roomId)["map"] = new GameMap(template);
        this.server.get(roomId)["started"] = false
        this.server.get(roomId)["numberOfPlayers"] = 0
        this.server.get(roomId)["messages"] = [];
        this.server.get(roomId)["players"] = {};
        this.server.get(roomId)["gameOver"] = false;
        this.server.get(roomId)["20SecTimer"] = 0;
        this.server.get(roomId)["10SecTimer"] = 0;
        return roomId
    }

    setPlayer({name, roomId = ""}) {
        if (roomId === "") {
            roomId = this.#setRoom()
        }
        const room = this.server.get(roomId)
        if (!room) return //что возвращается фронту в этом случае?
        room["map"].addPowerUps();
        room["numberOfPlayers"] += 1
        room.players[name] = new Player(playerPositions[room["numberOfPlayers"]])

        return {roomId, name}
    }

    setBomb(name, roomId) {
        const room = this.server.get(roomId)

        const x = Math.round(room.players[name].position.x / 50);
        const y = Math.round(room.players[name].position.y / 50);
        if (room.players[name].bombCount > 0) {
            room["map"].template[y][x] = types.bomb;
            room.players[name].bombCount--
            return {x, y, "timer": 3000}
        }
        return {x, y, "timer": 0};
    }

    detonateBomb(x, y, roomId, name) {
        const room = this.server.get(roomId);
        let player = room.players[name];
        player.bombCount++;
        let flameRadius = player.flame;

        room["map"].explosion(x, y, flameRadius);

        this.#changeStats(room);
    }

    #changeStats(room) {
        Object.keys(room.players).forEach((p) => {
            let player = room.players[p];
            const {x, y} = player.getCell();
            if (room["map"].template[y][x] === types.detonatedBomb) {
                player.decreaseHealth();
            }
        });
        const leftPlayers = Object.keys(room.players).filter((p) => {
            const player = room.players[p];
            if (player.health > 0) {
                return player;
            }
        });
        switch (leftPlayers.length) {
            case 0:
                Object.keys(room.players).forEach((player) => {
                    room.players[player].status = TIE;
                    room.numberOfPlayers = 0;
                    room['gameOver'] = true;
                });
                break;
            case 1:
                room.players[leftPlayers[0]].status = WINNER;
                room['gameOver'] = true;
                break;
            default:
                room.numberOfPlayers = leftPlayers.length;
        }
    }

    changeMap(x, y, roomId, name) {
        const room = this.server.get(roomId);
        let player = room.players[name];
        let flameRadius = player.flame;
        room["map"].changeMapAfterExplosion(x, y, flameRadius);
    }

    checkForPowerUps(name, roomId) {
        const room = this.server.get(roomId);
        let player = room.players[name];
        const {x, y} = player.getCell();
        const gameMap = room["map"];
        const power = gameMap.hasPowerUp(x, y)
        if (power) {
            player.setPower(power);
            gameMap.deletePowerUp(x, y);
            // console.log("after power added", player);
        }
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
                case SET_POSITION : {
                    const {roomId, name} = matchPlayerIPWithRoomId[playerIP]
                    const {move, direction} = args
                    const player = game.server.get(roomId).players[name]

                    if (move) {
                        player.moving = true;
                        if (!playerMoving.includes(playerIP)) playerMoving.push(playerIP)
                    } else {
                        player.moving = false;
                        playerMoving.remove(playerIP)
                    }

                    const newPosition = game.server.get(roomId).players[name].setPosition(game.server.get(roomId).map.template, direction);
                    game.checkForPowerUps(name, roomId);
                    return newPosition;
                }

                case SET_PLAYER : {
                    const {roomId, name} = game.setPlayer(args)
                    matchPlayerIPWithRoomId[playerIP] = {roomId, name}
                    return {roomId, name}
                }

                case SET_BOMB: {
                    const {roomId, name} = matchPlayerIPWithRoomId[playerIP]
                    const {x, y, timer} = game.setBomb(name, roomId)
                    if (timer > 0) startTrackingBomb.placeBomb(x, y, timer, roomId, name);
                    return {x, y}
                }
                case START_GAME: {
                    stop = false
                    const {roomId} = args
                    return game.startGame(roomId)
                }
                case NEW_MESSAGE : {
                    const {roomId, name} = matchPlayerIPWithRoomId[playerIP]
                    const {text} = args;
                    return game.addMessage(name, text, roomId);
                    //add broadcast
                }
                case "CLOSE_CONNECTION": {
                    const {roomId} = matchPlayerIPWithRoomId[playerIP]
                    delete matchPlayerIPWithRoomId[playerIP]
                    if (game.server.get(roomId).numberOfPlayers === 1) {
                        delete game.server.delete(roomId)
                    }
                    stop = true
                    return
                }
                default:
                    console.log("Unknown case");
                    return undefined;
            }
        }

        ws.on('connection', (connection, req) => {

            const playerIP = req.socket.remoteAddress;
            connection.on('message', async (message) => {
                const obj = JSON.parse(message);
                const {method, args = []} = obj;

                const fromCmd = commands(method, args, playerIP)

                if (method === SET_PLAYER) {
                    const {roomId, name} = fromCmd
                    connection.send(JSON.stringify({roomId, name}), {binary: false});
                }

                const {roomId} = args
                if (roomId) {
                    const gameClass = game.server
                    const gameObj = Object.fromEntries(gameClass);
                    if (gameObj[roomId].started && !gameObj[roomId].gameOver) animate(gameObj, playerIP, connection);
                    //add case for game over
                }
            });
        })

        function animate(obj) {
            ws.broadcast(obj);

            playerMoving.forEach(ip => {
                commands('setPosition', {move: true, direction: null}, ip)
            })

            let gameLoop = setTimeout(() => {
                startTrackingBomb = trackedBombs.setCallback(game.detonateBomb.bind(game), game.changeMap.bind(game))
                animate(obj)
            }, 1000 / fps);

            if (stop) {
                clearTimeout(gameLoop)
            }
        }

        ws.broadcast = function broadcast(obj) {
            ws.clients.forEach(function each(client) {
                const ip = client["_socket"]["_peername"].address
                if (matchPlayerIPWithRoomId.hasOwnProperty(ip)) {
                    const roomId = matchPlayerIPWithRoomId[ip].roomId
                    if (!roomId) return
                    if (obj.hasOwnProperty(roomId)) {
                        client.send(JSON.stringify({
                            ...obj[roomId],
                            map: obj[roomId]['map'].template
                        }), {binary: false});
                    }
                }
            });
        };

        ws.on('close', () => {
            console.log("Here")
        })

        console.log(`API on port ${port}`);
    };


function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        let r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

