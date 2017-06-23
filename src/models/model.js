import _ from 'lodash'

/**
 * Very basic ORM-like class.
 */
export default class {
    constructor(payload) {
        _.assign(this, payload)
    }
}