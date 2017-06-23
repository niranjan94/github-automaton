import jwt from 'jsonwebtoken'
import crypto from 'crypto';
import winston from 'winston-color'
import fs from 'fs'
import request from 'sync-request'
import db from './db'
import moment from 'moment'

/**
 * Check if the body is valid using the signature
 *
 * @param rawBody
 * @param signature
 * @param secret
 * @return {boolean}
 */
exports.isBodyValid = (rawBody, signature, secret) => {
    const newSignature = crypto
        .createHmac('sha1', secret)
        .update(new Buffer(rawBody, 'utf-8'))
        .digest('hex');

    winston.info(`Received sha was ${signature}, new sha is ${newSignature}`);

    return crypto.timingSafeEqual(
        new Buffer(signature),
        new Buffer(`sha1=${newSignature}`)
    );
};

/**
 * Generate the JWT for integration using the private key
 *
 * @return {String}
 */
exports.getIntegrationToken = () => {
    const cert = fs.readFileSync('bot.private-key.pem');  // get private key
    return jwt.sign({
        iat: moment().utc().unix(),
        exp: moment().utc().add(4, 'minutes').unix(),
        iss: 3267
    }, cert, { algorithm: 'RS256'});
};

/**
 *
 * @param installationId
 * @return {Promise}
 */
exports.getIntegrationAccessToken = (installationId) => {
    return new Promise((resolve, reject) => {
        db.findOne({ installationId: installationId },  (err, doc) => {
            if (doc) {
                const expiresAt = moment(doc.expires_at);
                if (expiresAt.isAfter(moment().add(5, 'minutes'))) {
                    return resolve(doc.token);
                }
            }
            winston.info('Requesting integration access token for ID ' + installationId);
            const jwt = exports.getIntegrationToken();
            const res = request('POST', `https://api.github.com/installations/${installationId}/access_tokens`, {
                'headers': {
                    'User-Agent': process.env.USER_AGENT,
                    'Authorization': 'Bearer ' + jwt,
                    'Accept': 'application/vnd.github.machine-man-preview+json'
                }
            });

            const token = JSON.parse(res.getBody());

            db
                .update(
                    {
                        installationId: installationId
                    },
                    {
                        installationId: installationId,
                        token: token.token,
                        expires_at: token.expires_at
                    },
                    {
                        upsert: true,
                    },
                    function () {
                        return resolve(token.token);
                    }
                )
        });
    });
};