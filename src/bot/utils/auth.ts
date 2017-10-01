import * as crypto from 'crypto';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import * as moment from 'moment';
import * as winston from 'winston';

import { IInstallationModel, Installation } from '../../models/installation';
import { GitHub } from './github';

export class Auth {

  /**
   * Test if the received event payload body is valid
   * @param rawBody
   * @param signature
   * @param secret
   * @return {boolean}
   */
  public static isBodyValid(rawBody: string, signature: string, secret: string): boolean {
    const newSignature = crypto
      .createHmac('sha1', secret)
      .update(new Buffer(rawBody, 'utf-8'))
      .digest('hex');

    winston.info(`Received sha was ${signature}, new sha is ${newSignature}`);

    return crypto.timingSafeEqual(
      new Buffer(signature),
      new Buffer(`sha1=${newSignature}`)
    );
  }

  /**
   * Get the integration JWT using the private key
   * @return {string}
   */
  public static getIntegrationToken(): string {
    const privateKeyFileName = process.env.KEY_FILE_NAME || 'bot.private-key.pem';
    const cert = fs.readFileSync(privateKeyFileName);  // get private key

    const payload = {
      exp: moment().utc().add(4, 'minutes').unix(),
      iat: moment().utc().unix(),
      iss: parseInt(process.env.BOT_ID)
    };

    return jwt.sign(payload, cert, {algorithm: 'RS256'});
  }

  /**
   * Get the integration access token using the JWT and identifier info
   * @param installationId
   * @param username
   * @return {Promise<string>}
   */
  public static getIntegrationAccessToken(installationId: number, username?: string): Promise<string> {
    return new Promise((resolve) => {
      Installation.findOne({installationId}, (err, installation: IInstallationModel) => {
        if (!err && installation && installation.hasOwnProperty('expiresAt') && installation.expiresAt) {
          const expiresAt = moment(installation.expiresAt);
          if (expiresAt.isAfter(moment().add(5, 'minutes'))) {
            return resolve(installation.token);
          }
        }

        winston.info('Requesting integration access token for ID ' + installationId);

        const github = GitHub.createInstance();
        github.authenticate({
          token: Auth.getIntegrationToken(),
          type: 'integration'
        });

        github.integrations
          .createInstallationToken({
            installation_id: String(installationId)
          })
          .then((response) => {
            const {data} = response;
            if (!installation) {
              installation = new Installation();
            }
            winston.info(`New integration token obtained. Expires at ${data.expires_at}`);
            installation.installationId = installationId;
            installation.token = data.token;
            installation.expiresAt = data.expires_at;
            if (username) {
              installation.username = username;
            }
            installation.save().then(() => {
              resolve(data.token);
            });
          })
          .catch((e) => {
            winston.error(`error while requesting integration token. ${e}`);
          });
      });
    });
  }
}
