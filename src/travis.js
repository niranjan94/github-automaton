import winston from 'winston-color'
import request from 'sync-request'

const API_BASE = 'https://api.travis-ci.org';

const headers = {
    'Accept': 'application/vnd.travis-ci.2+json',
    'User-Agent': process.env.USER_AGENT
};


export const buildIdRe = /.+\/(\d+)/;

export const getBuildInfo = function (repoOwner, repo, buildId) {
    winston.info(`${repoOwner}/${repo} -> Getting build info of build ID: ${buildId}.`);
    const body = request('GET', `${API_BASE}/repos/${repoOwner}/${repo}/builds/${buildId}`, { headers }).getBody();
    if (!body) {
        return null;
    }
    return JSON.parse(body);
};

export const getBuildId = function (identifier) {
    if (isNaN(identifier)) {
        const [, buildID] = identifier.match(buildIdRe) || [];
        identifier = buildID;
    }
    return identifier;
};

export const getFailedJobs = function (buildIdentifier, repoOwner, repoName) {
    buildIdentifier = getBuildId(buildIdentifier);
    if (buildIdentifier) {
        const buildInfo = getBuildInfo(repoOwner, repoName, buildIdentifier);
        if (buildInfo) {
            const prNumber = buildInfo.build.pull_request_number;
            if (prNumber) {
                return {
                    prNumber,
                    failedJobs: buildInfo.jobs.filter(build => build.state === 'failed')
                };
            }
        }
    }
    return null;
};