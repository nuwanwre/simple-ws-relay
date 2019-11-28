require('dotenv').config();
const 
    testSocket = require('socket.io-client'),
    endpoint = `http://localhost:${process.env.PORT}`,
    clientId1 = '9b44d19c-7f6e-4ea1-8366-e554c3c3ab1d',
    clientId2 = 'a49feea4-c958-4b80-b80f-c22909add703';

let 
    testClient1,
    testClient2;

beforeAll(done => {
    // testClient = testSocket(endpoint);
    done();
});


afterAll(done => {
    testClient1.disconnect();
    testClient2.disconnect();
    done();
})

// beforeEach((done) => {
//     // Setup
//     // Do not hardcode server port and address, square brackets are used for IPv6
//     socket = io.connect(`http://[${httpServerAddr.address}]:${httpServerAddr.port}`, {
//         'reconnection delay': 0,
//         'reopen delay': 0,
//         'force new connection': true,
//         transports: ['websocket'],
//     });
//     socket.on('connect', () => {
//         done();
//     });
// });

// afterEach((done) => {
//     // Cleanup
//     if (socket.connected) {
//         socket.disconnect();
//     }
//     done();
// });

describe('Socket Client Tests', () => {
    test('Valid Authentication for Client1', done => {
        testClient1 = testSocket(endpoint);

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
            });
            
        }, 1)

        testClient2.on('message', (data) => {
            expect(data).toBe(clientData.payload);
            done();
        })
    });
});