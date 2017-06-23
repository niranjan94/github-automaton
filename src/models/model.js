import _ from 'lodash'

export default class {
    constructor(payload) {
        _.assign(this, payload)
    }
}