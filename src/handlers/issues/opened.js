import Base from '../base'
import github from '../../github'

export default class extends Base {
    handle() {
        github.issues.createComment({
            owner: this.payload.repository.owner.login,
            repo: this.payload.repository.name,
            number: this.payload.issue.number,
            body: 'test comment'
        });
    }
};