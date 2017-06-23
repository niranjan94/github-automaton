import _ from 'lodash'

const config = {
    USER_AGENT: 'GithubBot/1.0.0'
};

/**
 * Assign the config to the env object
 */
export default function () {
    _.forOwn(config, (value, key) => {
        if (!process.env.hasOwnProperty(key)) {
            process.env[key] = value;
        }
    });
};
