import Model from './model'
import User from './user'

export default class extends Model {
    set user(user) {
        this._user = new User(user);
    }

    get user() {
        return this._user;
    }
}