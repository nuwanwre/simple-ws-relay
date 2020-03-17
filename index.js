require('dotenv').config();
var fs = require('fs');
const app = require('express')();
const rootServer = process.env.HTTPS === "true" ? require('https') : require('http');
const socketAuth = require('socketio-auth');
const adapter = require('socket.io-redis');

const redis = require('./redis');

const PORT = process.env.PORT || 1337;

const server = process.env.HTTPS === "true" ? 
                rootServer.createServer({
                    key: fs.readFileSync('./certs/key.pem'),
                    cert: fs.readFileSync('./certs/cert.pem'),
                    ca: fs.readFileSync('./certs/rootCA.crt')
                }, app) 
                :
                rootServer.createServer();

const io = require('socket.io').listen(server);

const redisAdapter = adapter({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASS || 'password',
});

console.log(`Server started on port: ${process.env.PORT} with HTTPS: ${process.env.HTTPS}\n`);

//io.attach(server);
io.adapter(redisAdapter);

// Placeholder function to authenticate users that are connecting to Web Socket
async function authenticateClient(token) {
    return new Promise((resolve, reject) => {

        setTimeout(() => {
            const users = [{
                id: 1,
                name: 'ibct',
                token: 'secret',
            }, ];

            const user = users.find((user) => user.token === token);

            if (!user) {
                return reject('USER_NOT_FOUND');
            }

            return resolve(user);
        }, 200);
    });
}

socketAuth(io, {
    authenticate: async (socket, data, callback) => {
        const {
            // token,
            clientId,
        } = data;

        try {
            //const user = await authenticateClient(token);
            const canConnect = await redis
                .setAsync(`users:${clientId}`, socket.id, 'NX', 'EX', 30);

            socket.clientId = clientId;

            if (!canConnect) {
                return callback({
                    message: 'ALREADY_CONNECTED'
                });
            }

            // Check Cache
            redis.getAsync(`cache:${clientId}`).then(r => {
                if (r !== null) {
                    io.to(`${socket.id}`).emit('message', JSON.parse(r));
                    redis.delAsync(`cache:${clientId}`);
                    console.log(`Cache released for Client: ${clientId} with SocketId: ${socket.id}`);
                }
            });

            return callback(null, true);
        } catch (e) {
            console.log(`Client: ${socket.clientId} with SocketId: ${socket.id} unauthorized.`);
            return callback({
                message: 'UNAUTHORIZED'
            });
        }
    },
    postAuthenticate: async (socket) => {
        console.log(`Client: ${socket.clientId} with SocketId: ${socket.id} authenticated.`);

        socket.conn.on('packet', async (packet) => {
            if (socket.auth && packet.type === 'ping') {
                await redis.setAsync(`users:${socket.clientId}`, socket.id, 'XX', 'EX', 30);
            }

            if (socket.auth && packet.type === 'message') {
                const rawData = packet.data.substring(2, packet.data.length-1);
                data = JSON.parse(rawData);
                // console.log(data);

                if (typeof data.payload !== "undefined")
                    redis.getAsync(`users:${data.payload.requestId}`).then(r => {
                        // console.log(`clientId: ${data.payload.requestId} with socketId: ${r}`);
                        if (r === null) {
                            redis.setAsync(`cache:${data.payload.requestId}`, JSON.stringify(data.payload.payload), 'NX', 'EX', 600);
                        } else {
                            socket.to(`${r}`).emit('message', data.payload.payload);
                        }
                    })
            }
        });
    },
    disconnect: async (socket) => {
        console.log(`Client: ${socket.clientId} with SocketId: ${socket.id} disconnected`);

        if (socket.id) {
            await redis.delAsync(`users:${socket.clientId}`);
        }
    },
})

server.listen(PORT, "0.0.0.0");