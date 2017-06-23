import Model from './models/model'
import { getIntegrationAccessToken } from './auth'

/**
 * @param ds
 */
export default class extends Model {
    /**
     * Get the promise that resolves into the current token
     *
     * @return Promise
     */
    get token() {
        if (!this.hasOwnProperty('installation')) {
            return null;
        }
        return getIntegrationAccessToken(this.installation.id);
    }
}