"use strict";

process.title = 'ecrx-relay';

const webSocketsServerPort = 1337;
const webSocketServer = require('websocket').server;
const http = require('http');

let clients = [ ];
let cache = [ ];

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

    connection.on('open', function() {
        cache.forEach(function(msg){
            if(msg.requestId === id) {
                client.send(JSON.stringify(msg));
                cache.pop(msg);
                console.log((new Date()) + `: cache released for client: ${id}`)
            }
        })
    })

    connection.on('message', function(message) {
        if (message.type === 'utf8') { // accept only text
            let clientMsg = JSON.parse(message.utf8Data);
            console.log(clientMsg);
            clients.forEach(function(client){
                if (client.id === clientMsg.requestId) {
                    client.send(JSON.stringify(clientMsg));
                    return;
                }
            });
            cache.push(clientMsg);
        }
    });

    connection.on('close', function(connection) {
        clients.pop(index);
        console.log((new Date()) + `: Connection closed for client: ${id}\nClients connected: ${clients.length}`)
    });
});