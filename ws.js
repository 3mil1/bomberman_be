import {WebSocketServer} from "ws";
import {addPowerUps, generateLevel, playerPositions, template} from "./game_map.js";

const matchPlayerIPWithRoomId = {}

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

const Direction = {
    Up: 'Up',
    Down: 'Down',
    Left: 'Left',
    Right: 'Right'
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
        this.server.get(roomId)["numberOfPlayers"] = 0
        this.server.get(roomId)["messages"] = [];
        return roomId
    }

    setPlayer({name, roomId = ""}) {
        if (roomId === "") {
          roomId = this.#setRoom({name})
        }
        const room = this.server.get(roomId)
        if (!room) return
        addPowerUps(room["map"]);
        room["numberOfPlayers"] += 1
        //добавить высчитывание позиции по осям x y
        room[name] = new Player(playerPositions[room["numberOfPlayers"]])
        return {roomId, name}
    }
    setBomb(name, roomId) {
        const room = this.server.get(roomId)
        for (let y = 0; y < room["map"].length; y++) {
            for (let x = 0; x < room["map"][y].length; x++) {
                if (room[name].position.x === x && room[name].position.y === y && room[name].bombCount > 0 ) {
                    room["map"][y][x] = "b"
                    room[name].bombCount--
                    return {x, y, "timer": 5000}
                }
            }
        }
    }

//нужно вернуть бомбу игроку после детонации
    //для изменения карты после взрыва нужно знать дальность взрыва
    detonateBomb(x, y, roomId) {
        const room = this.server.get(roomId)
        room["map"][y][x] = 'd'
    }

    startGame(roomId) {
        return this.server.get(roomId).started = true
    }

    //Messages
    addMessage(name, text, roomId){
        this.server.get(roomId).messages.push(
                name,
                text,
                // date: new Date(),
    )}
}

export const
    server = (port) => {
        const fps = 1;
        const ws = new WebSocketServer({port});
        const game = new Game();
        let trackedBombs = trackBombs()
        let startTrackingBomb

        const commands = (method, args, playerIP) => {
            switch (method) {
                case 'setPosition' : {
                    const {roomId, name} = matchPlayerIPWithRoomId[playerIP]
                    const {x, y} = args
                    return game.server.get(roomId)[name].setPosition(x, y)
                }
                case 'setPlayer' : {
                    const {roomId, name} = game.setPlayer(args)
                    matchPlayerIPWithRoomId[playerIP] = {roomId, name}
                    return {roomId, name}
                }
                case 'decreaseHealth': {
                    const {roomId, name} = matchPlayerIPWithRoomId[playerIP]
                    return game.server.get(roomId)[name].decreaseHealth()
                }
                case 'setPower': {
                    const {roomId, name} = matchPlayerIPWithRoomId[playerIP]
                    const {power} = args
                    return game.server.get(roomId)[name].setPower(power)
                }
                case "setBomb": {
                    const {roomId, name} = matchPlayerIPWithRoomId[playerIP]
                    const {x, y, timer} = game.setBomb(name, roomId)
                    startTrackingBomb.placeBomb(x, y, timer, roomId, name) //нужно передавать имя игрока, который помещает бомбу
                    return {x, y}
                }
                case 'startGame': {
                    const {roomId} = args
                    return game.startGame(roomId)
                }
                case 'newMessage': {
                    const {roomId, name} = matchPlayerIPWithRoomId[playerIP];
                    const {text} = args;
                    game.addMessage(name, text, roomId);
                }
            }
        }

        ws.on('connection', (connection, req) => {
            const playerIP = req.socket.remoteAddress;
            console.log(playerIP);
            connection.on('message', async (message) => {
                const obj = JSON.parse(message);
                console.log(obj);
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

