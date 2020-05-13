const express = require('express');
const config = require('../../config');
const logger = require('./src/logger');


const app = express();

logger.debug(require('../../config'));

/*
  This app.use is just for debugging and if you want a default user.
  Not necessary.

  config.defaultUser is nice if you need to test JSON API with postman or
  something.

  req.user WILL be replaced by the authenticated passport user if you login.
  So this won't hurt any app functionality.
*/
app.use((req, res, next) => {
  req.user = config.defaultUser;
  logger.debug(req.method, req.url);
  logger.debug(req.headers, req.headers);
  next();
});

app.use(require('helmet')());

app.use(express.json({ limit: '50mb' }));

async function run() {
  
  await require('./src/routes').async(app);

  app.use(express.static('../public'));
  app.get('/*', (req, res) => {
    res.sendFile('../public/index.html');
  });

  app.listen(config.port);

  process
    .on('unhandledRejection', (reason, p) => {
      logger.error((new Date()).toUTCString(), reason, 'Unhandled Rejection at Promise', p);
    })
    .on('uncaughtException', (err) => {
      logger.error((new Date()).toUTCString(), err.stack || err, 'Uncaught Exception thrown');
      process.exit(13);
    });
}

run()
  .then(() => {
    logger.info(`listening on ${config.port}`);
  })
  .catch((error) => {
    logger.error(error);
    process.exit(13);
  });
