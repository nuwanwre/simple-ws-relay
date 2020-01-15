require('dotenv').config();
const 
    testSocket = require('socket.io-client'),
    endpoint = `${process.env.HTTPS === "true" ? 'https' : 'http'}://${process.env.HOST}:${process.env.PORT}`,
    clientId1 = '9b44d19c-7f6e-4ea1-8366-e554c3c3ab1d',
    clientId2 = 'a49feea4-c958-4b80-b80f-c22909add703';

let 
    testClient1,
    testClient2;

afterAll(done => {
    testClient1.disconnect();
    testClient2.disconnect();
    done();
})

console.log(`Running tests on: ${endpoint}`);

describe('Socket Client Tests', () => {
    test('Valid Authentication for Client1', done => {
        testClient1 = testSocket(endpoint, {secure: true, reconnect: true});

        testClient1.on('connect', () => {
            testClient1.emit('authentication', {
                token: 'testSecret',
                clientId: clientId1
            });
        });

        testClient1.on('authenticated', (auth) => {
            expect(auth).toBe(true);
            done();
        });
    });
    test('Valid Authentication for Client2', done => {
        testClient2 = testSocket(endpoint);

        testClient2.on('connect', () => {
            testClient2.emit('authentication', {
                token: 'testSecret',
                clientId: clientId2
            });
        });

        testClient2.on('authenticated', (auth) => {
            expect(auth).toBe(true);
            done();
        });
    });
    test('Dispatch from Client1 to Client2', done => {
        const clientData = {
            requestId: clientId2,
            payload: 'Hello from Client1'
        }

        testClient1.emit({
            payload: clientData
        })

        testClient2.on('message', (data) => {
            expect(data).toBe(clientData.payload);
            done();
        })
    });
    test('Check Cached Data from Client1 to Client2', done => {
        testClient2.disconnect();

        const clientData = {
            requestId: clientId2,
            payload: 'A Cached Hello from Client1'
        }

        // let Redis clear keys, and disconnect websocket connections
        setTimeout(() => {
            testClient1.emit({
                payload: clientData
            })

            testClient2 = testSocket(endpoint);
        
            testClient2.on('connect', () => {
                testClient2.emit('authentication', {
                    token: 'testSecret',
                    clientId: clientId2
                });

                testClient2.on('message', (data) => {
                    expect(data).toBe(clientData.payload);
                    done();
                })
            });
            
        }, 100)

    });
});