const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const httpContext = require('express-http-context');
const apicache = require('apicache');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const chalk = require('chalk');
const asyncify = require('express-asyncify');
const compression = require('compression');
const NodeCache = require('node-cache');
const helmet = require('helmet');

const getClientOfExchange = require('./utils/getClientOfExchange');
const handleFatalError = require('./middlewares/handleFatalError');
const errorRateLimit = require('./middlewares/errorRateLimit');
const errorHandler = require('./middlewares/errorHandler');
const notFoundHandler = require('./middlewares/notFoundHandler');
const mongooseSetup = require('./utils/mongooseSetup');
const mongooseConnection = require('./utils/mongooseConnection');
const loadRoutes = require('./utils/loadRoutes');


dotenv.config({ path: './.env'});

module.exports = class Server {

  app;
  startDate;

  constructor() {
    this.startDate = Date.now();
    this.app = asyncify(express());
    this.config();
  }

  /**
   * Pone las configuraciones de express y sus middlewares por default
   */
    config() {
      const { NODE_ENV, MAX_LIMIT_REQUESTS } = process.env;
      this.app.use(compression());
      this.app.use(cors());
  
  
      // only if you're behind a reverse proxy (Heroku, Bluemix, AWS if you use an ELB, custom Nginx setup, etc)
      process.env.NODE_ENV === 'production' && this.app.enable('trust proxy')
      
      
      // This...
      // this.app.use(helmet());
  
      // ...is equivalent to this:
      this.app.use(helmet.contentSecurityPolicy());
      this.app.use(helmet.dnsPrefetchControl());
      this.app.use(helmet.expectCt());
      this.app.use(helmet.frameguard());
      this.app.use(helmet.hidePoweredBy());
      this.app.use(helmet.hsts());
      this.app.use(helmet.ieNoOpen());
      this.app.use(helmet.noSniff());
      this.app.use(helmet.permittedCrossDomainPolicies());
      this.app.use(helmet.referrerPolicy());
      this.app.use(helmet.xssFilter());
      this.app.use(express.json());
      
      this.app.use(httpContext.middleware);
      this.app.use(
        slowDown({
          windowMs: 60 * 1000,
          delayAfter: 25,
          delayMs: 500,
        }),
      );
      this.app.use(
        rateLimit({
          windowMs: 60 * 1000, // 1 minuto
          max: NODE_ENV !== 'test' ? Number(MAX_LIMIT_REQUESTS || 40) : null, // Solo 15 solicitudes por minuto
          headers: true,
          handler: errorRateLimit,
        }),
      );
      
      this.app.use((req, res, next) => {
        if (NODE_ENV !== 'test') {
          console.info('');
          console.info(
            chalk.yellow.bgBlack(
              `${req.method} - ${req.originalUrl}`,
            ),
          );
          console.info('');
        }
        next();
      });
      
      this.app.use(
        apicache
          .options({
            appendKey: (req) => `${req.method} ${req.path} ${req.headers.authorization}`,
            statusCodes: {
              include: [
                401,
                // 403,
                // 404, // Hay problemas cuando eliminar y restauras de inmediato
              ],
            },
          })
          .middleware('5 minutes'),
      );

      // Agrega el hook a todos los modelos que se encarga de asignar los campos createdBy y updatedBy
    }



  /**
   * Pone las rutas del API
   * @param sequelize
   */
  async routes() {
    const routes = await loadRoutes();
    this.app.use(process.env.API_PREFIX, routes);
    this.app.use(errorHandler);
    this.app.use(notFoundHandler);
  }

  static handleRejection(reason, promise) {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  }

  /**
   * Inicia el server http de express
   */
   async serve() {
    const { models, mongoose} = mongooseSetup();
    const port = process.env.PORT;
    this.app.mongoose = mongoose;
    this.app.models = models;
    this.app.listen(port, () => {
      console.info(
        chalk.black.bgCyanBright(` >> Server cryptocurrencies ready on ${process.env.SERVER_URL} `),
        `in ${(Date.now() - this.startDate) / 1000} seconds`,
      );
    });
  }




  async initialize() {
    process.on('uncaughtException', handleFatalError);
    process.on('unhandledRejection', Server.handleRejection);
    try {
      const dbConnection = await mongooseConnection();
      this.app.dbConnection = dbConnection;
      this.app.binance = getClientOfExchange();
      this.app.cache = new NodeCache();
      await this.routes(dbConnection);
      return this.app;
    } catch (error) {
      handleFatalError(error);
      return null;
    }
  }

}
