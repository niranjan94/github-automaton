import winston from 'winston-color'
import request from 'sync-request'

const API_BASE = 'https://api.travis-ci.org';

const headers = {
    'Accept': 'application/vnd.travis-ci.2+json',
    'User-Agent': process.env.USER_AGENT
};


export const buildIdRe = /.+\/(\d+)/;

export const getBuildInfo = function (repoOwner, repo, buildId) {
    winston.info(`${repoOwner}/${repo} -> Getting build info of build ID: ${buildId}.`)
    const body = request('GET', `${API_BASE}/repos/${repoOwner}/${repo}/builds/${buildId}`, { headers }).getBody();
    if (!body) {
        return null;
    }
    return JSON.parse(body);
};
