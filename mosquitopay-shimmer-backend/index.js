const { default: Busboy } = require('@fastify/busboy');
const fastifyCors = require('@fastify/cors');
const fastifyFormbody = require('@fastify/formbody');
const fastifyHelmet = require('@fastify/helmet');
const appRootPath = require('app-root-path');
const archiver = require('archiver');
const fastify = require('fastify');
const { existsSync, readFileSync, cpSync, createWriteStream, rmSync, createReadStream } = require('fs');
const { dispatch, spawnStateless, start } = require('nact');
const path = require('path');
const { replaceInFileSync } = require('replace-in-file');
const { Server } = require('rpc-websockets');
const { pipeline } = require('stream/promises');
require('dotenv').config({
  path: path.resolve(appRootPath.path, 'mosquitopay-shimmer-backend', '.env')
});

const app = fastify();
const system = start();

// Actor delay and reset
const actorDelay = (duration) =>
  new Promise((resolve) => setTimeout(() => resolve(), duration));
const actorReset = async (_msg, _error, ctx) => {
  await actorDelay(500);
  return ctx.reset;
};

// RPC Server
// Handles connection btw pay with iota part
const server = new Server({
  port: 9999,
  host: '0.0.0.0',
});

let clients = {};
let shimmerExchange = 0.02; // exchange shimmer coin for euro = 0.02 euro/shimmer or we can check the exchange from the api like coingecko

const webhookOrganizerActor = spawnStateless(
  system,
  async (msg, _ctx) => {
    try {
      const user = msg.tag;
      const baseUrl = msg.shop.shopName;

      console.log({
        user,
        baseUrl
      });

      fetch(baseUrl + '/?wc-api=WC_Gateway_Mosquitopay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cc-webhook-signature': msg.shop.webhookKey,
        },
        body: JSON.stringify({
          event: {
            data: {
              metadata: {
                order_id: msg.metadata,
              },
              timeline: {
                mosquitopay_status: 'COMPLETED',
              },
            },
          },
        }),
      })
        .then((_) => {
          server
            .of(`/shopid/${msg.shop.shopName}/user/${user}`)
            .emit('transaction', 'FINISHED');
        })
        .catch((e) =>
          console.error(
            'RESPONSE FAILED ON WEBHOOK ORGANIZER ACTOR: ', e
          )
        );
    } catch (err) {
      console.error('GENERAL ERROR ON WEBHOOK ORGANIZER ACTOR: ', err);
    }
  },
  'webhookOrganizerActor',
  { onCrash: actorReset }
);

(async () => {
  try {
    // await import
    const { createCharge } = await import(
      '../mosquitopay-shimmer-charge-package/src/main.js'
    );

    // console.log(path.resolve(appRootPath.path, 'mosquitopay-shimmer-backend', 'shop.json'));

    // CORS class config
    app.register(fastifyCors);

    // helmet security config
    app.register(fastifyHelmet);

    // using x-www-form-urlencoded
    app.register(fastifyFormbody);

    // register wallet and tx event
    server.event('transaction');

    server.on('connection', (socket, request) => {
      //  logging
      console.log(`SOCKET ID: ${socket._id}`);
      // console.log(`REQ URL: ${request.url}`);
      console.log(request.headers);

      // wss://thesite/shopid/{{shopid}}/user/{{uniqueuserid}}
      if (request.url.includes('shopid')) {
        const shopId = request.url.split('/shopid/')[1].split('/user/')[0];
        const userId = request.url.split('/shopid/')[1].split('/user/')[1];
        clients[socket._id] = shopId + ':' + userId;
      }
    });

    server.on('disconnection', async function (socket) {
      // checking disconnected server
      console.log(socket._id);

      // deleting connected client
      if (clients[socket._id]) {
        server.closeNamespace(
          `/shopid/${clients[socket._id].split(':')[0]}/user/${
            clients[socket._id].split(':')[1]
          }`,
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
      if (existsSync(path.resolve(appRootPath.path, 'mosquitopay-shimmer-backend', 'sample.shop.json'))) {
        const shopJson = JSON.parse(readFileSync(path.resolve(appRootPath.path, 'mosquitopay-shimmer-backend', 'sample.shop.json')).toString());
        const shop = readFileSync(path.resolve(appRootPath.path, 'mosquitopay-shimmer-backend', 'sample.shop.json')).toString();
        console.log({ shopJson });
        return reply.status(200).send(shopJson);
      }
      return reply.status(200).send({});
    });

    app.delete('/shop', (_request, reply) => {
      if (existsSync(path.resolve(appRootPath.path, 'mosquitopay-shimmer-backend', 'shop.json'))) {
        rmSync(path.resolve(appRootPath.path, 'mosquitopay-shimmer-backend', 'shop.json'));
        rmSync(path.resolve(appRootPath.path, 'mosquitopay-shimmer-backend', 'templates', 'MP.Woocommerce.zip'));
      }
      return reply.status(204).send();
    });

    app.post('/transaction', (request, reply) => {
      console.log({
        body: request.body
      });
      // if (existsSync(path.resolve(appRootPath.path, 'mosquitopay-shimmer-backend', 'shop.json'))) {
      //   const shopJson = JSON.parse(readFileSync(path.resolve(appRootPath.path, 'mosquitopay-shimmer-backend', 'shop.json')).toString());
      //   // console.log({ shopJson });
      //   dispatch(webhookOrganizerActor, {
      //     shop: shopJson,
      //     tag: request.body.tag,
      //     metadata: request.body.metadata,
      //   })
      // }
      return reply
        .status(200)
        .send();
    });

    app.post('/charge', (request, reply) => {
      const bodyOrder = request.body;
      const cartString = request.body.metadata.cart;
      return reply
        .status(200)
        .send(
          createCharge(
            process.env.PAYMENT_PAGE,
            bodyOrder,
            cartString,
            shimmerExchange,
          ),
        );
    });

    app.get('/plugin', (_request, reply) => {
      const plugin = createReadStream(path.resolve(appRootPath.path, 'mosquitopay-shimmer-backend', 'templates', 'MP.Woocommerce.zip'));
              
      console.log('SENDING STREAM PLUGIN');

      reply.header('Content-Disposition', 'attachment; filename=MP.Woocommerce.zip');
      return reply.send(plugin).type('application/zip');
    });

    app.addContentTypeParser('multipart/form-data', {
      bodyLimit: 4096000
    }, function (_request, payload, done) {
      // console.log('REQ: ', request);
      done(null, payload);
    });

    app.post('/upload', async (request, reply) => {
      try {
        //
        const busboy = new Busboy({ headers: request.raw.headers });
        busboy.on('file', function (fieldname, file, _filename, _encoding, _mimetype) {
          try {
            if (fieldname === 'shop') {
              // optionaly stream file to disk
              // [!] never use original filename
              const saveTo = path.resolve(appRootPath.path, 'mosquitopay-shimmer-backend', 'shop.json');
      
              // await pipeline(file, createWriteStream(saveTo));
              file.pipe(createWriteStream(saveTo));
            } 

            file.on('data', function (data) {
              console.log('FILE[' + fieldname + '] SIZE: ' + data.length + ' BYTES');
            });
    
            file.on('end', function () {
              console.log('FILE[' + fieldname + '] FINISHED');
            });

            file.on('error', function (error) {
              console.error(error);
            });
          } catch (error) {
            console.error('BUSBOY FILE ERROR: ' + error.message);
          }
        });

        busboy.on('field', function (fieldname, val) {
          console.log('FIELD[' + fieldname + '] VALUE: ' + val);
        });

        busboy.on('finish', async function () {
          cpSync(path.resolve(appRootPath.path, 'mosquitopay-shimmer-backend', 'templates', 'MP.Woocommerce.Template'), path.resolve(appRootPath.path, 'mosquitopay-shimmer-backend', 'templates', 'MP.Woocommerce'), { recursive: true });
          const configOptions = {
            files: path.resolve(appRootPath.path, 'mosquitopay-shimmer-backend', 'templates', 'MP.Woocommerce', 'includes', 'class-mosquitopay-api-handler.php'),
            from: [/{{API_URL}}/g],
            to: [process.env.API_URL],
          };
          replaceInFileSync(configOptions);
          const output = createWriteStream(path.resolve(appRootPath.path, 'mosquitopay-shimmer-backend', 'templates', 'MP.Woocommerce.zip'));
          const archive = archiver('zip', {
            zlib: { level: 9 } // Sets the compression level.
          });

          // This event is fired when the data source is drained no matter what was the data source.
          // It is not part of this library but rather from the NodeJS Stream API.
          // @see: https://nodejs.org/api/stream.html#stream_event_end
          output.on('end', function () {
            console.log('DATA HAS BEEN DRAINED');
          });

          // listen for all archive data to be written
          // 'close' event is fired only when a file descriptor is involved
          output.on('close', async function () {
            try {
              console.log(archive.pointer() + ' TOTAL BYTES');
              console.log('ARCHIVER HAS BEEN FINALIZED AND THE OUTPUT FILE DESCRIPTOR HAS CLOSED.');
              rmSync(path.resolve(appRootPath.path, 'mosquitopay-shimmer-backend', 'templates', 'MP.Woocommerce'), { recursive: true });
              return reply.status(200).send();
            } catch (e) {
              console.error('ERROR ON OUTPUT CLOSE:', e);
              return reply.status(500).send();
            }
          });

          // good practice to catch warnings (ie stat failures and other non-blocking errors)
          archive.on('warning', function (err) {
            console.error('ARCHIVE ON WARNING: ', err);
          });

          // good practice to catch this error explicitly
          archive.on('error', function (err) {
            console.error('ARCHIVE ON ERROR: ', err);
          });

          // pipe archive data to the file
          archive.pipe(output);

          // append files from a sub-directory, putting its contents at the root of archive
          archive.directory(path.resolve(appRootPath.path, 'mosquitopay-shimmer-backend', 'templates', 'MP.Woocommerce'), false);

          // finalize the archive (ie we are done appending files but streams have to finish yet)
          // 'close', 'end' or 'finish' may be fired right after calling this method so register to them beforehand
          await archive.finalize();
        });

        busboy.on('error', function (err) {
          console.error('BUSBOY ERROR: ' + err.message);
          return reply.status(500).send();
        });

        //
        await pipeline(request.raw, busboy);
      } catch (error) {
        console.error(`${request.method} ${request.url} ERROR: `, error);
      }
    });

    app.get('/health', (request, reply) => {
      try {
        return reply.status(200).send({ message: 'Healthy' });
      } catch (err) {
        console.error(`${request.method} ${request.url} ERROR: ${err.message}`);
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
