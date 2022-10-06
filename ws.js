import {WebSocketServer} from "ws";
import {generateLevel, template} from "./game_map.js";

class Player {
    constructor() {
        this.position = {x: 0, y: 0}
        this.health = 3
        this.power = new Set()
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
        return this.power.add(power)
    }
}

class Game {
    constructor() {
        this.world = new Map();
    }

    #setRoom({name}) {
        const roomId = uuidv4()
        let player = new Player()
        this.world.set(roomId, {[name]: player})
        this.world.get(roomId)["map"] = generateLevel(template)
        return roomId
    }

    setPlayer({name, roomId = ""}) {
        if (roomId === "") {
            return this.#setRoom({name})
        }
        const room = this.world.get(roomId)
        if (!room) return
        room[name] = new Player()
        return roomId
    }

}


export const
    server = (port) => {
        const ws = new WebSocketServer({port});
        const game = new Game();

        const cmd = (mehtod, args) => {
            switch (mehtod) {
                case 'setPosition' : {
                    const {roomId, name, position} = args
                    const {x, y} = position
                    return game.world.get(roomId)[name].setPosition(x, y)
                }
                case 'setPlayer' : {
                    return game[mehtod](args)
                }
                case 'decreaseHealth': {
                    const {roomId, name} = args
                    return game.world.get(roomId)[name].decreaseHealth()
                }
                case 'setPower':
                    const {roomId, name, power} = args
                    return game.world.get(roomId)[name].setPower(power)
            }
        }

        ws.on('connection', (connection, req) => {
            // const ip = req.socket.remoteAddress;

            connection.on('message', async (message) => {
                const obj = JSON.parse(message);
                const {method, args = []} = obj;

                const fromCmd = cmd(method, args)
                console.log("ANSWER", fromCmd)

                const response = game.world
                const entries = Object.fromEntries(response);
                const str = JSON.stringify(entries)

                connection.send(str, {binary: false});
            });
        })


        // ws.on('close', () => {
        //     clients.delete(ws)
        // })

        console.log(`API on port ${port}`);
    };


function

uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        let r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
