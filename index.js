const http = require('http');
const io = require('socket.io')();
const socketAuth = require('socketio-auth');
const adapter = require('socket.io-redis');

const redis = require('./redis');

const PORT = process.env.PORT || 1337;

const server = http.createServer();

const redisAdapter = adapter({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASS || 'password',
});

io.attach(server);
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

            if (!canConnect) {
                return callback({
                    message: 'ALREADY_CONNECTED'
                }, false);
            }

            socket.clientId = clientId;

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
                console.log(JSON.parse(packet.data.substring(2, packet.data.length-1)));
                // console.log(JSON.parse(packet.data));
            }
        });
    },
    disconnect: async (socket) => {
        
        console.log(`SocketId: ${socket.id} disconnected`);

        if (socket.id) {
            await redis.delAsync(`users:${socket.clientId}`);
        }
    },
})

server.listen(PORT);