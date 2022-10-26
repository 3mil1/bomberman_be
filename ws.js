import {WebSocketServer} from "ws";
import {GameMap, playerPositions, template, types} from "./game_map.js";
import {
    ACTIVE,
    ALPHA_REGEX,
    CLOSE_CONNECTION,
    COUNTDOWN_TIMER,
    GET_ROOMS,
    LOOSER,
    NEW_MESSAGE,
    SET_BOMB,
    SET_PLAYER,
    SET_POSITION,
    START_GAME,
    TIE,
    WAITING_TIMER,
    WINNER
} from "./constants.js";
import checkCollision from './collision_map.js';
import {Timer} from "./timer.js";

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

const matchPlayerIDWithRoomId = {}
const playerMoving = [];
// let stop = false

const trackBombs = () => {
    return {
        setCallback: (afterPlace, afterExplosion) => {
            return {
                placeBomb: (x, y, timer, roomId, name) => {
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
        this.kills = 0;
        this.takenLives = 0;
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
        this.server.get(roomId)["numberOfPlayers"] = 0;
        this.server.get(roomId)["chat"] = [{"author": "Bot", "text": "Welcome!", "id": Date.now()}];
        this.server.get(roomId)["players"] = {};
        this.server.get(roomId)["gameOver"] = false;
        this.server.get(roomId)["timer"] = null;
        return roomId
    }

    setPlayer({name, roomId = ""}) {
        if (roomId === "") {
            roomId = this.#setRoom()
        }
        const room = this.server.get(roomId);
        if (!room) return {roomId: "room does not exist", name}
        const t = room.timer ? room.timer.getCountdown() : null;
        if (room.numberOfPlayers === 4 || room.started || t) return {roomId: "the game already started", name};

        room["map"].addPowerUps();
        room["numberOfPlayers"] += 1
        room.players[name] = new Player(playerPositions[room["numberOfPlayers"]])
        if (room.numberOfPlayers > 1) {
            this.#setTimer(room, roomId);
        }
        return {roomId, name}
    }

    #setTimer(room, roomId) {
        if (!room.timer) {
            room.timer = new Timer(WAITING_TIMER, COUNTDOWN_TIMER, () => {
                this.startGame(roomId);
            });
        }
        if (room.numberOfPlayers === 4) {
            room.timer.startCountdownTimer();
        }
    }

    setBomb(name, roomId) {
        const room = this.server.get(roomId)
        const x = Math.round(room.players[name].position.x / 50);
        const y = Math.round(room.players[name].position.y / 50);
        if (room.players[name].bombCount > 0) {
            room.map.template[y][x] = types.bomb;
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

        this.#changeStats(room, name);
    }

    #changeStats(room, name) {
        // console.log(room.players);
        Object.keys(room.players).forEach((key) => {
            let player = room.players[key];
            const {x, y} = player.getCell();
            if (room["map"].template[y][x] === types.detonatedBomb) {
                player.decreaseHealth();
                if (key !== name) {
                    if (player.health === 0) {
                        room.players[name].kills++
                    }
                    room.players[name].takenLives++;
                    console.log("after decrease health", room.players[name]);
                }
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
        }
    }

    startGame(roomId) {
        return this.server.get(roomId).started = true;
    }

    //Messages
    addMessage(name, text, roomId) {
        return this.server.get(roomId).chat.push(
            {"author": name, "text": text, "id": Date.now()}
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

        const commands = (method, args, playerID) => {
            switch (method) {
                case SET_POSITION : {
                    const {roomId, name} = matchPlayerIDWithRoomId[playerID]
                    const {move, direction} = args
                    const player = game.server.get(roomId).players[name]

                    if (move) {
                        player.moving = true;
                        if (!playerMoving.includes(playerID)) playerMoving.push(playerID)
                    } else {
                        player.moving = false;
                        playerMoving.remove(playerID)
                    }

                    const newPosition = game.server.get(roomId).players[name].setPosition(game.server.get(roomId).map.template, direction);
                    game.checkForPowerUps(name, roomId);
                    return newPosition;
                }

                case SET_PLAYER : {
                    const {roomId, name} = game.setPlayer(args)
                    matchPlayerIDWithRoomId[playerID] = {roomId, name}
                    return {roomId, name}
                }

                case GET_ROOMS : {
                    const rooms = [];
                    game.server.forEach((room, key) => {
                        const t = room.timer ? room.timer.getCountdown() : null;
                        if (room.numberOfPlayers < 4 && !t && !room.started) {
                            const r =
                                {
                                    roomId: key,
                                    numberOfPlayers: room.numberOfPlayers
                                }
                            rooms.push(r);
                        }
                    })
                    return rooms;
                }

                case SET_BOMB: {
                    const {roomId, name} = matchPlayerIDWithRoomId[playerID]
                    const {x, y, timer} = game.setBomb(name, roomId)
                    if (timer > 0) startTrackingBomb.placeBomb(x, y, timer, roomId, name);
                    return {x, y}
                }
                case START_GAME: {
                    const {roomId} = args
                    return game.startGame(roomId)
                }
                case NEW_MESSAGE : {
                    const {roomId, name} = matchPlayerIDWithRoomId[playerID]
                    return game.addMessage(name, args, roomId);
                }
                case CLOSE_CONNECTION: {
                    if (!matchPlayerIDWithRoomId[playerID]) return
                    const {roomId} = matchPlayerIDWithRoomId[playerID]
                    delete matchPlayerIDWithRoomId[playerID]

                    game.server.get(roomId)["numberOfPlayers"] -= 1

                    if (game.server.get(roomId).numberOfPlayers === 0) {
                        delete game.server.delete(roomId)
                    }
                    return
                }
                default:
                    return undefined;
            }
        }

        ws.on('connection', (connection, req) => {

            // client.send(JSON.stringify({...obj[roomId], chat: obj[roomId].chat}), {binary: false});

            // const playerIP = req.socket.remoteAddress;
            const playerID = req.url.split('=')[1];
            connection.playerID = playerID;

            connection.on('message', async (message) => {
                const obj = JSON.parse(message);
                const {method, args = []} = obj;

                const fromCmd = commands(method, args, playerID)
                if (method === GET_ROOMS) {
                    // console.log("2", JSON.stringify({games: fromCmd}));
                    connection.send(JSON.stringify({games: fromCmd}));
                }
                if (method === SET_PLAYER) {
                    const {roomId, name} = fromCmd
                    if (roomId.match(ALPHA_REGEX)) {
                        connection.send(JSON.stringify({error: `${roomId}`}));
                    } else {
                        connection.send(JSON.stringify({roomId, name}), {binary: false});
                    }
                }

                // const {roomId} = args
                // if (roomId) {
                //     const gameClass = game.server
                //     const gameObj = Object.fromEntries(gameClass);
                //     if (!gameObj[roomId].gameOver && gameObj[roomId].started) animate(gameObj, playerID, connection);
                //     //add case for game over
                // }
            });
        })

        function animate(obj) {
            if (obj.server.size > 0) {
                ws.broadcast(obj);

                playerMoving.forEach(id => {
                    commands('setPosition', {move: true, direction: null}, id)
                })

                let gameLoop = setTimeout(() => {
                    startTrackingBomb = trackedBombs.setCallback(game.detonateBomb.bind(game), game.changeMap.bind(game))
                    animate(obj)
                }, 1000 / fps);
            } else {
                setTimeout(() => {
                    animate(obj);
                }, 1000);
            }
        }

        ws.broadcast = function broadcast(obj) {
            ws.clients.forEach(function each(client) {
                const id = client.playerID;
                if (!matchPlayerIDWithRoomId[id]) return;
                const roomId = matchPlayerIDWithRoomId[id].roomId
                if (!roomId) return
                const g = game.server.get(roomId);
                client.send(JSON.stringify({
                    ...g,
                    map: g['map'].template,
                    timer: g['timer'] ? g['timer'].getTimer() : null
                }), {binary: false});
            });
        };

        ws.on('close', () => {
            console.log("Here")
        })
        animate(game);

        console.log(`API on port ${port}`);
    };


function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        let r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

