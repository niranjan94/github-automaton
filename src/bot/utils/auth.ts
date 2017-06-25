import * as crypto from 'crypto';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import * as moment from 'moment';
import * as request from 'request-promise-native';
import * as winston from 'winston';
import { IInstallationModel, Installation } from '../../models/installation';

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
      new Buffer(`sha1=${newSignature}`),
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
      iat: moment().utc().unix().toString() as string,
      iss: parseInt(process.env.BOT_ID),
    };

    return jwt.sign(payload, cert, {algorithm: 'RS256'});
  }

  /**
   * Get the integration access token using the JWT and identifier info
   * @param installationId
   * @param username
   * @return {Promise<string>}
   */
  public static getIntegrationAccessToken(installationId: number, username: string): Promise<string> {
    return new Promise((resolve) => {
      Installation.findOne({installationId}, (e, installation: IInstallationModel) => {
        if (!e && installation) {
          const expiresAt = moment(installation.expiresAt);
          if (expiresAt.isAfter(moment().add(5, 'minutes'))) {
            return resolve(installation.token);
          }
        }

        winston.info('Requesting integration access token for ID ' + installationId);

        const jwt = Auth.getIntegrationToken();

        request({
          headers: {
            'Accept': 'application/vnd.github.machine-man-preview+json',
            'Authorization': 'Bearer ' + jwt,
            'User-Agent': process.env.USER_AGENT,
          },
          json: true,
          method: 'POST',
          uri: `https://api.github.com/installations/${installationId}/access_tokens`,
        }).then((response: { expires_at: number, token: string }) => {
          if (!installation) {
            installation = new Installation();
          }
          installation.installationId = installationId;
          installation.token = response.token;
          installation.expiresAt = response.expires_at;
          installation.username = username;
          installation.save().then(() => {
            resolve(response.token);
          });
        });
      });
    });
  }
}
