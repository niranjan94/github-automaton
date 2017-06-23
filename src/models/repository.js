import Model from './model'
import User from './user'

export default class extends Model {
    getName() {
        return this.name;
    }

    getFullName() {
        return this.full_name;
    }

    set owner(owner) {
        this._owner = new User(owner);
    }

    get owner() {
        return this._owner;
    }
}