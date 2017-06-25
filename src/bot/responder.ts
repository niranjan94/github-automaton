import { Error } from 'mongoose';
import * as winston from 'winston';
import { HandlerBase } from './handlers/base';
import { Auth } from './utils/auth';

export const responder = (signature, data, type) => {
  winston.info('Validating auth');
  const isAuthValid = Auth.isBodyValid(
    JSON.stringify(data),
    signature,
    process.env.GITHUB_SECRET || '',
  );

  if (!isAuthValid) {
    return new Error('Invalid Auth');
  }

  if (type === 'integration_installation') {
    type = 'installation';
  }

  winston.info('Auth Valid');
  const event = data.action || data.state || 'UNKNOWN';
  const possibleHandlerPath = `./handlers/${type}/${event}`;
  let eventHandler;

  try {
    eventHandler = require(possibleHandlerPath);
  } catch (e) {
    if (e.message.includes('Cannot find module')) {
      winston.warn(e.message);
      winston.warn(`No matching handler found for ${type}:${event}`, 'verbose');
      winston.warn(`Tried looking in ${possibleHandlerPath}`, 'verbose');
    } else {
      winston.warn(e);
    }
    return;
  }

  winston.info(`Invoking handler for ${type}:${event}`);
  // Support module.exports or transpiled `export default`
  const instance = (eventHandler.default ? new eventHandler.default(data) :  new eventHandler(data)) as HandlerBase;
  instance.initialize();
  winston.info(` Handler for ${type}:${event} invoked.`);
};
