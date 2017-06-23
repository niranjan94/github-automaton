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
        let repoName = null;
        if (this.hasOwnProperty('repository')) {
            repoName = this.repository.full_name;
        }
        return getIntegrationAccessToken(this.installation.id, repoName);
    }
}