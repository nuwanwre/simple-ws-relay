# Simple Websocket based Relay

This simple Websocket server acts as a relay between two clients. A typical usecase would be
a web-app to native mobile app communication. The target of this relay is to eliminate complicated REST APIs to do
facilitate barebones communication between two clients.

Credits: Gists from [martinsik](https://gist.github.com/martinsik/2031681)

### How it works

1. Each client connects to the Websocket relay with a unique ID. A UUID in this case.
	
	`ws://192.168.1.2:1337/?id=47dd72d9-32b9-414a-95e0-c05adb0ee200`

2. The connection is then stored respective to each client ID. 

3. When a message is sent from a client, the *requestId* is used to identify the recieving client.
	```
	{
		requestId: 47dd72d9-32b9-414a-95e0-c05adb0ee200,
		data: {
			payload: 'somepayload'
		}
	}
	```

4. On connection close, clients are removed from temporary collection and memory is free-ed.

### To Run

Simply, `npm install && node index.js`

