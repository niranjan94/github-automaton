import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as logger from 'morgan';
import * as expressHandlebars from 'express-handlebars';
import { IndexRoute } from './routes/index';
import { EventsRoute } from './routes/events';
import * as mongoose from 'mongoose';
import errorHandler = require('errorhandler');

/**
 * The server.
 *
 * @class Server
 */
export class Server {

  public app: express.Application;

  /**
   * Bootstrap the application.
   *
   * @class Server
   * @method bootstrap
   * @static
   * @return Server
   */
  public static bootstrap(): Server {
    return new Server();
  }

  /**
   * Constructor.
   *
   * @class Server
   * @constructor
   */
  constructor() {
    //create expressjs application
    this.app = express();

    //configure application
    this.config();

    //add routes
    this.routes();

    //add api
    this.api();
  }

  /**
   * Create REST API routes
   *
   * @class Server
   * @method api
   */
  public api() {
    //empty for now
  }

  /**
   * Configure application
   *
   * @class Server
   * @method config
   */
  public config() {
    mongoose.connect(process.env.MONGODB_URI);

    //add static paths
    this.app.use(express.static('public'));

    this.app.engine('.hbs', expressHandlebars({extname: '.hbs', defaultLayout: 'main'}));
    this.app.set('view engine', '.hbs');

    //mount logger
    //noinspection TypeScriptValidateTypes
    this.app.use(logger('dev'));

    //mount json form parser
    this.app.use(bodyParser.json());

    //mount query string parser
    this.app.use(bodyParser.urlencoded({
      extended: true
    }));

    // catch 404 and forward to error handler
    this.app.use(function (err: any, req: express.Request, res: express.Response, next: express.NextFunction) {
      err.status = 404;
      next(err);
    });

    //error handling
    this.app.use(errorHandler());
  }

  /**
   * Create and return Router.
   *
   * @class Server
   * @method config
   * @return void
   */
  private routes() {
    let router: express.Router;
    router = express.Router();

    //IndexRoute
    IndexRoute.create(router);
    EventsRoute.create(router);

    //use router middleware
    this.app.use(router);
  }

}