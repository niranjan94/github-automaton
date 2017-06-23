import _ from 'lodash'
import fs from 'fs'
import winston from 'winston-color'

const config = {
    USER_AGENT: 'GithubBot/1.0.0'
};

/**
 * Assign the config to the env object
 */
export default function () {
    _.forOwn(config, (value, key) => {
        if (!process.env.hasOwnProperty(key)) {
            process.env[key] = value;
        }
    });

    if (process.env.BASE64_PRIVATE_KEY) {
        winston.info('Decoding and saving private key from env var');
        fs.writeFileSync('bot.private-key.pem', Buffer.from(process.env.BASE64_PRIVATE_KEY, 'base64'));
    }
};
