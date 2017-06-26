import { HandlerBase } from '../base';
import { IssueLinkingAction } from './actions/issue-linking';

export default class extends HandlerBase {
  public handle() {
    IssueLinkingAction.perform(this);
  }
}
