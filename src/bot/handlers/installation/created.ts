import { IInstallationModel, Installation } from '../../../models/installation';
import { User } from '../../../models/user';
import { Auth } from '../../utils/auth';
import { HandlerBase } from '../base';

export default class extends HandlerBase {
  public handle() {
    const {installation} = this.payload;
    Installation.findOne({installationId: installation.id}, (err, installationRecord: IInstallationModel) => {
      if (!installationRecord) {
        installationRecord = new Installation();
      }

      installationRecord.installationId = installation.id;
      installationRecord.username = installation.account.login;
      installationRecord.htmlUrl = installation.html_url;
      installationRecord.appId = installation.app_id;
      installationRecord.targetId = installation.target_id;
      installationRecord.targetType = installation.target_type;

      installationRecord.account = new User({
        avatarUrl: installation.account.avatar_url,
        htmlUrl: installation.account.html_url,
        login: installation.account.login,
        siteAdmin: installation.account.site_admin,
        type: installation.account.type,
        userId: installation.account.id
      });

      installationRecord
        .save()
        .then((record) => {
          this.logger.info('Installation record stored.');
          Auth.getIntegrationAccessToken(record.installationId).then(() => {
            this.logger.info('Installation token obtained & stored.');
          });
        })
        .catch((e) => console.error(e));
    });
  }
}
