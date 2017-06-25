import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as expressHandlebars from 'express-handlebars';
import * as mongoose from 'mongoose';
import * as logger from 'morgan';
import { EventsRoute } from './routes/events';
import { IndexRoute } from './routes/index';
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
    // create expressjs application
    this.app = express();

    // configure application
    this.config();

    // add routes
    this.routes();
  }

  /**
   * Configure application
   *
   * @class Server
   * @method config
   */
  public config() {
    mongoose.connect(process.env.MONGODB_URI);

    this.app.use(express.static('public'));

    this.app.engine('.hbs', expressHandlebars({extname: '.hbs', defaultLayout: 'main'}));
    this.app.set('view engine', '.hbs');

    this.app.use(logger('dev'));

    this.app.use(bodyParser.json());

    this.app.use(bodyParser.urlencoded({
      extended: true,
    }));

    this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      err.status = 404;
      next(err);
    });

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

    IndexRoute.create(router);
    EventsRoute.create(router);

    this.app.use(router);
  }

}
