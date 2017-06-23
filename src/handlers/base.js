import github from '../github'
import Parser from '../parser'

export default class {
    constructor(payload) {
        this.payload = new Parser(payload);
    }

    create() {
        this.payload.token.then((token) => {
            github.authenticate({
                type: "token",
                token: token,
            });
            this.handle();
        })
    }
}