import {WebSocketServer} from "ws";
import {
    GameMap,
    playerPositions,
    template,
    types
} from "./game_map.js";
import {
    ACTIVE,
    DECREASE_HEALTH,
    NEW_MESSAGE,
    SET_BOMB,
    SET_PLAYER,
    SET_POSITION,
    SET_POWER,
    START_GAME
} from "./constants.js";

const matchPlayerIPWithRoomId = {}

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
        this.position = {x: x, y: y,}
        this.speed = 1;
        this.health = 3;
        this.power = new Set();
        this.bombCount = 1;
        this.direction = DIRECTION.DOWN;
        this.flame = 1;
        this.status = ACTIVE;
    }

    #speedUp() {
        this.speed *= 1.10;
    }

    setPosition(x, y, direction) {
        this.direction = direction;
        return this.position = {
            x, y
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
        this.server.get(roomId)["map"] = new GameMap(template);
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
        room["map"].addPowerUps();
        room["numberOfPlayers"] += 1
        room.players[name] = new Player(playerPositions[room["numberOfPlayers"]])
        return {roomId, name}
    }

    setBomb(name, roomId) {
        const room = this.server.get(roomId)
        const x = Math.round(room.players[name].position.x/50);
        const y = Math.round(room.players[name].position.y/50);

        if ( room.players[name].bombCount > 0 ) {
                    room["map"].template[y][x] = types.bomb;
                    room.players[name].bombCount--
                    return {x, y, "timer": 5000}
                }
        return {x, y, "timer": 0};
    }

    detonateBomb(x, y, roomId, name) {
        const room = this.server.get(roomId);
        let player = room.players[name];
        player.bombCount++;
        let flameRadius = player.flame;
        room["map"].explosion(x, y, flameRadius);
    }

    changeMap(x, y, roomId, name) {
        const room = this.server.get(roomId);
        let player = room.players[name];
        let flameRadius = player.flame;
        room["map"].changeMapAfterExplosion(x, y, flameRadius);
    }

    startGame(roomId) {
        return this.server.get(roomId).started = true
    }

    //Messages
    addMessage(name, text, roomId){
        this.server.get(roomId).messages.push(
                name,
                text,
    )}
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
                    const {x, y, direction} = args
                    return game.server.get(roomId).players[name].setPosition(x, y, direction);
                }
                case SET_PLAYER : {
                    const {roomId, name} = game.setPlayer(args)
                    matchPlayerIPWithRoomId[playerIP] = {roomId, name}
                    return {roomId, name}
                }
                case DECREASE_HEALTH: {
                    const {roomId, name} = matchPlayerIPWithRoomId[playerIP]
                    //add a check for 0 lives
                    return game.server.get(roomId).players[name].decreaseHealth()
                }
                case SET_POWER: {
                    const {roomId, name} = matchPlayerIPWithRoomId[playerIP]
                    const {power} = args
                    return game.server.get(roomId).players[name].setPower(power)
                }
                case SET_BOMB: {
                    const {roomId, name} = matchPlayerIPWithRoomId[playerIP]
                    const {x, y, timer} = game.setBomb(name, roomId)
                    if (timer > 0) startTrackingBomb.placeBomb(x, y, timer, roomId, name);
                    return {x, y}
                }
                case START_GAME: {
                    const {roomId} = args
                    return game.startGame(roomId)
                }
                case NEW_MESSAGE : {
                    const {roomId, name} = matchPlayerIPWithRoomId[playerIP];
                    const {text} = args;
                    game.addMessage(name, text, roomId);
                    //add broadcast
                }
            }
        }

        ws.on('connection', (connection, req) => {
            const playerIP = req.socket.remoteAddress;
            console.log(playerIP);
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
                startTrackingBomb = trackedBombs.setCallback(game.detonateBomb.bind(game), game.changeMap.bind(game))
                animate(obj)
            }, 1000 / fps);
        }

        ws.broadcast = function broadcast(obj) {
            ws.clients.forEach(function each(client) {
                const ip = client["_socket"]["_peername"].address
                const roomId = matchPlayerIPWithRoomId[ip].roomId
                if (!roomId) return
                client.send(JSON.stringify({...obj[roomId], map:obj[roomId]['map'].template}), {binary: false});
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

