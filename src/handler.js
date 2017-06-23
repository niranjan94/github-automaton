import winston from 'winston-color'
import { isBodyValid } from './auth'

/**
 * Validate a webhook payload and pass to the appropriate handler if it passes signature verfication
 *
 * @param signature
 * @param data
 * @param type
 * @return {*}
 */
export default (signature, data, type) => {
    winston.info('Validating auth');
    const isAuthValid = isBodyValid(
        JSON.stringify(data),
        signature,
        process.env.GITHUB_SECRET || ''
    );

    if (!isAuthValid) {
        return callback(new Error('Invalid Auth'));
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
        winston.warn(e.message);
        winston.warn(`No matching handler found for ${type}:${event}`, 'verbose');
        winston.warn(`Tried looking in ${possibleHandlerPath}`, 'verbose');
        return;
    }

    winston.info(`Invoking handler for ${type}:${event}`);
    // Support module.exports or transpiled `export default`
    const instance = eventHandler.default ? new eventHandler.default(data) :  new eventHandler(data);
    instance.create();
};
