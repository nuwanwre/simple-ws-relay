# Websocket Relay Server

This is a ready-to-deploy Websocket based relay server with caching support. Please refer to the flow diagram at the end of this document for a detailed overview. Additionally, the relay server also supports basic authentication of clients. This authentication mechanism can be extended to integrate a regular client authorization techniques such as OAuth. 

### Technical Details

Client connection status, and caching is done in conjuction with Redis. The Redis Server can be configured to have a username, and password. But default implementation assumes such mechanisms are not in use. 

The relay server also supports HTTPS, given proper Key, Certificate and Certficate Authority. Self-signed certificates maybe used, but connections are not guaranteed to work with major browser clients. In such cases HTTP deployments are also possible.

### Setting Up

1. Install `redis-server` on your deployment platform
2. Start `redis-server`
3. Clone this repo and navigate to the directory
4. Open `.env` on a text editor
	```
	REDIS_HOST=localhost
	REDIS_PORT=6379
	REDIS_PASS=password
	PORT=1337
	HOST=localhost
	HTTPS=true
	```
5. Alter the configurations to suit your configuration
	
	The `HOST` config is for running tests. `PORT` is which the relay server listens to incoming connections.

6. Starting the server.

	You may use `node index.js`, but on production it is advised to use `pm2`. If so, simply, `pm2 start index.js`. Monitoring can be done at `pm2 monit`.

Credits: Gists from [mariotacke](https://github.com/mariotacke/blog-single-user-websocket)

### Testing

The tests are designed to emulate most client scenarios from Authentication, relaying a message, and testing the cache releasing functions. 

The `HOST` config on `.env` enables you to test the relay server locally, or remotely pointing to a deployed relay server. 

To run tests, simply, `npm run tests`


### Detailed Flow

![WebSocket Flow](docs/Websocket-Relay-Server.png)

