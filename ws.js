import {WebSocketServer} from "ws";


class Player {
    constructor() {
        this.position = {x: 0, y: 0}
        this.health = 3
        this.power = new Set()
    }

    setPosition(x, y) {
        this.position = {
            x, y
        }
    }

    setHealth() {
        this.health = -1
    }

    setPower(power) {
        this.power.add(power)
    }
}

class Game {
    constructor() {
        this.world = new Map();
    }

    setRoom(playerName) {
        const roomId = uuidv4()
        let player = new Player()
        this.world.set(roomId, {[playerName]: player})
        return roomId
    }

    setPlayer(name, roomId = "") {
        if (roomId === "") {
            const roomId = this.setRoom()
            const room = this.world.get(roomId)
            room.set(name, new Player())
            return
        }
        this[roomId].set(name, new Player())

    }
}

const commands = new Set(['setRoom', 'setPlayer', 'setPosition', 'setHealth', 'setPower'])

export const
    server = (port) => {
        const ws = new WebSocketServer({port});
        const game = new Game();

        ws.on('connection', (connection, req) => {
            const ip = req.socket.remoteAddress;

            const id = uuidv4();
            const metadata = {id};

            connection.on('message', async (message) => {
                const m = JSON.parse(message);
                // const metadata = clients.get(ws);
                //
                // m.sender = metadata.id;
                //
                // [...clients.keys()].forEach((client) => {
                //     client.send(JSON.stringify(m));
                // });


                const command = commands.has(Object.keys(m)[0])
                if (!command) return connection.send('"Not found"', {binary: false});

                let roomId
                switch (Object.keys(m)[0]) {
                    case "setRoom":
                        roomId = game.setRoom(m[Object.keys(m)[0]]);
                        break;
                }

                const response = game.world
                const obj = Object.fromEntries(response);
                const str = JSON.stringify(obj)
                connection.send(str, {binary: false});

            });
        });

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
