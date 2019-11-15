"use strict";

process.title = 'ecrx-relay';

const webSocketsServerPort = 1337;
const webSocketServer = require('websocket').server;
const http = require('http');
const redis = require('redis');

let clients = [ ];
let cache = [ ];
let redisClient = redis.createClient();

redisClient.on("error", function(err) {
    console.log("Error: " + err);
})

/**
 * HTTP server
 */
const server = http.createServer(function(request, response) {
    // Not important for us. We're writing WebSocket server, not HTTP server
});

server.listen(webSocketsServerPort, function() {
    console.log((new Date()) + " Server is listening on port " + webSocketsServerPort);
});

/**
 * WebSocket server
 */
const wsServer = new webSocketServer({
    httpServer: server
});

wsServer.on('request', function(request) {
    const { resourceURL : { query: { id } } } = request;

    let connection = request.accept(null, request.origin);
    connection.id = id;

    let index = clients.push(connection) - 1;

    console.log((new Date()) + `: Connection accepted from client: ${id}, origin ${request.origin}`);

    cache.forEach(function(msg, msgIndex){
        if(msg.requestId === id) {
            connection.send(JSON.stringify(msg));
            cache.splice(msgIndex, 1);
            console.log((new Date()) + `: cache released for client: ${id}`)
        }
    })

    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            let clientExists = false;
            let clientMsg = JSON.parse(message.utf8Data);
            console.log(clientMsg);
            clients.forEach(function(client){
                if (client.id === clientMsg.requestId) {
                    client.send(JSON.stringify(clientMsg));
                    clientExists = true;
                }
            });
            if (!clientExists) 
                cache.push(clientMsg);
        }
    });

    connection.on('close', function(connection) {
        if (index > -1) {
            console.log((new Date()) + `: Connection closed for client: ${index}\nClients connected: ${clients.length-1}`)
            clients.splice(index, 1);
        }
    });
});