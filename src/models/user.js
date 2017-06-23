import Model from './model'

export default class extends Model{
    getLogin() {
        return this.login;
    }
    getId() {
        return this.id;
    }
    getAvatarUrl() {
        return this.avatar_url;
    }
}