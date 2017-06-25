import { NextFunction, Request, Response, Router } from 'express';
import { BaseRoute } from './route';

/**
 * / route
 *
 * @class User
 */
export class EventsRoute extends BaseRoute {

  /**
   * Create the routes.
   *
   * @class IndexRoute
   * @method create
   * @static
   */
  public static create(router: Router) {
    console.log('[EventsRoute::create] Creating events route.');

    router.post('/events', (req: Request, res: Response, next: NextFunction) => {
      new EventsRoute().processEvent(req, res, next);
    });
  }

  /**
   * Constructor
   *
   * @class IndexRoute
   * @constructor
   */
  constructor() {
    super();
  }

  /**
   * Process an incoming event
   * @param req
   * @param res
   * @param next
   */
  public processEvent(req: Request, res: Response, next: NextFunction) {

    res.set('Content-Type', 'text/plain');
    if (process.env.USER_AGENT) {
      res.set('User-Agent', process.env.USER_AGENT);
    }
    res.send('ok');
  }
}
