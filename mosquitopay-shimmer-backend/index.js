const fastifyCors = require('@fastify/cors');
const fastifyFormbody = require('@fastify/formbody');
const fastifyHelmet = require('@fastify/helmet');
const appRootPath = require('app-root-path');
const { randomUUID } = require('crypto');
const fastify = require('fastify');
const { Server } = require('rpc-websockets');

const app = fastify();

// RPC Server
// Handles connection btw pay with iota part
const server = new Server({
    port: 9999,
    host: '0.0.0.0',
});

let clients = {};
let shimmerExchange = 0.02; // exchange shimmer coin for euro = 0.02 euro/shimmer or we can check the exchange from the api like coingecko

(async () => {
    try {
        // await import
        const { createCharge } = await import('../mosquitopay-shimmer-charge-package/src/main.js');

        // CORS class config
        app.register(fastifyCors);

        // helmet security config
        app.register(fastifyHelmet);

        // using x-www-form-urlencoded
        app.register(fastifyFormbody);

        // register wallet and tx event
        server.event('transaction');

        server.on('connection', (socket, request) => {
            // debug logging
            console.log(`SOCKET ID: ${socket._id}`);
            // console.log(`REQ URL: ${request.url}`);
            console.log(request.headers);

            // wss://thesite/shopid/{{shopid}}/user/{{uniqueuserid}}
            if (request.url.includes('shopid')) {
                const shopId = request.url.split('/shopid/')[1].split('/user/')[0];
                const userId = request.url.split('/shopid/')[1].split('/user/')[1];
                clients[socket._id] = shopId + ':' + userId;

                // event for wallet
                server.of(`/shopid/${shopId}/user/${userId}`).emit(
                    'wallet',
                    JSON.stringify({
                        shimmer: app.shimmerWallets[shopId],
                    }),
                );

                server.register('wallet', function (params) {
                    try {
                        console.log('WALLET CALL PARAMS: ', params);
                        console.log(
                            'SHIMMER WALLET: ',
                            app.shimmerWallets[Buffer.from(params[0]).toString('base64')],
                        );
                        
                        const walletAddresses = {
                            shimmer: app.shimmerWallets[Buffer.from(params[0]).toString('base64')],
                        };
                        return walletAddresses;
                    } catch (e) {
                        console.error(`RPC SHOP METHOD WALLET ERROR: ${e.message}`);
                        return 'ERROR';
                    }
                }, `/shopid/${shopId}/user/${userId}`);
            }
        });

        server.on('disconnection', async function (socket) {
            // checking disconnected server
            console.log(socket._id);

            // deleting connected client
            if (clients[socket._id]) {
                server.closeNamespace(
                    `/shop/${clients[socket._id].split(':')[0]}/user/${clients[socket._id].split(':')[1]}`
                );
                delete clients[socket._id];
            }
        });

        server.on('socket-error', async function (socket, error) {
            // checking error on server
            console.log(`SOCKET ID: ${socket._id}`);
            console.error(`SOCKET ERROR: ${error.message || error}`);
        });

        server.on('error', async function (error) {
            // checking error on server
            console.error(`RPC ERROR: ${error.message || error}`);
        });

        // not found error handler
        app.setNotFoundHandler(
            {
                preValidation: (_req, _reply, done) => {
                    done();
                },
                preHandler: (_req, _reply, done) => {
                    done();
                },
            },
            (_request, reply) => {
                // default not found handler with preValidation and preHandler hooks
                return reply.status(404).send();
            },
        );

        // error handler
        app.setErrorHandler(function (error, _request, reply) {
            if (error instanceof fastify.errorCodes.FST_ERR_BAD_STATUS_CODE) {
                // log error
                console.error(`ERROR HANDLER: ${error.message}`);

                // send error response
                return reply.status(500).send();
            } else {
                // log error
                console.error(error);

                // fastify will use parent error handler to handle this
                if (error.statusCode) {
                    return reply.status(error.statusCode).send(error.message);
                }

                // error return
                return reply.status(500).send();
            }
        });

        // ================== ROUTES FOR API REQUESTS =================== //
        // ============================================================== //
        app.get('/shop', (_request, reply) => {
            return reply.status(200).send({
                shop: 'http://test.local',
                api: 'http://localhost:8888',
            });
        });

        app.post('/charge', (request, reply) => {
            const bodyOrder = request.body;
            const cartString = request.body.metadata.cart;
            let tag = randomUUID();
            let metadata = randomUUID();
            return reply.status(200).send(
                createCharge('http://localhost:5173', bodyOrder, cartString, tag, metadata, shimmerExchange),
            );
        });

        app.post('/upload', (_request, reply) => {
            // processing to read json and creating templates
            return reply.status(200).send('OK');
        });

        app.get('/health', (request, reply) => {
            try {
                return reply.status(200).send({ message: 'Healthy' });
            } catch (err) {
                console.error(
                    `${request.method} ${request.url} ERROR: ${err.message}`,
                );
                return reply.status(500).send();
            }
        });

        app.listen({ port: 8888, host: '0.0.0.0' }, (err) => {
            if (err) {
                console.error(`SERVER LISTEN ERROR: ${err.message}`);
                process.exit(1);
            }
            console.log(`RPC SERVER IS RUNNING ON PORT 9999`);
            console.log(`SERVER IS RUNNING ON PORT 8888`);
        });
    } catch (error) {
        console.error(`MAIN FUNCTION ERROR: ${error.message}`);
    }
})();

process.on('uncaughtException', function (err) {
    // catch error
    console.error(`ON UNCAUGHT EXCEPTION: ${err.message}`);
});