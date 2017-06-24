/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */

'use strict';

var githubAuthCookies = require('./githubAuthCookies');
var fs = require('fs');
var minimatch = require('minimatch');

function downloadFileAsync(url, cookies) {
  console.log(url);
  return regeneratorRuntime.async(function downloadFileAsync$(_context) {
    while (1) switch (_context.prev = _context.next) {
      case 0:
        return _context.abrupt('return', new Promise(function (resolve, reject) {
          var args = ['--silent', '-L', url];

          if (cookies) {
            args.push('-H', `Cookie: ${cookies}`);
          }

            console.log(cookies);

            require('child_process').execFile('curl', args, { encoding: 'utf8', maxBuffer: 1000 * 1024 * 10 }, function (error, stdout, stderr) {
            if (error) {
              reject(error);
            } else {
                console.log(cookies);

                resolve(stdout.toString());
            }
          });
        }));

      case 1:
      case 'end':
        return _context.stop();
    }
  }, null, this);
}

function readFileAsync(name, encoding) {
  return regeneratorRuntime.async(function readFileAsync$(_context2) {
    while (1) switch (_context2.prev = _context2.next) {
      case 0:
        return _context2.abrupt('return', new Promise(function (resolve, reject) {
          fs.readFile(name, encoding, function (err, data) {
            if (err) {
              reject(err);
            } else {
              resolve(data);
            }
          });
        }));

      case 1:
      case 'end':
        return _context2.stop();
    }
  }, null, this);
}

function startsWith(str, start) {
  return str.substr(0, start.length) === start;
}

function parseDiffFile(lines) {
  var deletedLines = [];
  var fromFile = "";

  // diff --git "a/path" "b/path" or rename to path/file or rename from path/file
  var line = lines.pop();
  if (line.match(/^rename to "?/)) {
    // rename from path/file
    line = lines.pop();
  }

  if (line.match(/^diff --git "?a\//)) {
    fromFile = line.replace(/^diff --git "?a\/(.+)"? "?b\/.+"?/g, '$1');
  } else if (line.match(/^rename from "?/)) {
    fromFile = line.replace(/^rename from "?(.+)"?/g, '$1');
  } else {
    throw new Error('Invalid line, should start with something like `diff --git a/`, instead got \n' + line + '\n');
  }

  // index sha..sha mode
  line = lines.pop();
  if (startsWith(line, 'deleted file') || startsWith(line, 'new file') || startsWith(line, 'rename')) {
    line = lines.pop();
  }

  if (startsWith(line, 'index ')) {
    line = lines.pop();
  } else if (startsWith(line, 'similarity index')) {
    line = lines.pop();
    while (startsWith(line, 'rename')) {
      line = lines.pop();
    }
    // index sha..sha mode
    line = lines.pop();
  }
  if (!line) {
    // If the diff ends in an empty file with 0 additions or deletions, line will be null
  } else if (startsWith(line, 'diff --git')) {
    lines.push(line);
  } else if (startsWith(line, 'Binary files')) {
    // We just ignore binary files (mostly images). If we want to improve the
    // precision in the future, we could look at the history of those files
    // to get more names.
  } else if (startsWith(line, '--- ')) {
    // +++ path
    line = lines.pop();
    if (!line.match(/^\+\+\+ /)) {
      throw new Error('Invalid line, should start with `+++`, instead got \n' + line + '\n');
    }

    var currentFromLine = 0;
    while (lines.length > 0) {
      line = lines.pop();
      if (startsWith(line, 'diff --git')) {
        lines.push(line);
        break;
      }

      // @@ -from_line,from_count +to_line,to_count @@ first line
      if (startsWith(line, '@@')) {
        var matches = line.match(/^\@\@ -([0-9]+),?([0-9]+)? \+([0-9]+),?([0-9]+)? \@\@/);
        if (!matches) {
          continue;
        }

        var from_line = matches[1];
        var from_count = matches[2];
        var to_line = matches[3];
        var to_count = matches[4];

        currentFromLine = +from_line;
        continue;
      }

      if (startsWith(line, '-')) {
        deletedLines.push(currentFromLine);
      }
      if (!startsWith(line, '+')) {
        currentFromLine++;
      }
    }
  }

  return {
    path: fromFile,
    deletedLines: deletedLines
  };
}

function parseDiff(diff) {
  var files = [];
  // The algorithm is designed to be best effort. If the http request failed
  // for some reason and we get an empty file, we should not crash.
  if (!diff || !diff.match(/^diff/)) {
    return files;
  }

  var lines = diff.trim().split('\n');
  // Hack Array doesn't have shift/unshift to work from the beginning of the
  // array, so we reverse the entire array in order to be able to use pop/add.
  lines.reverse();

  while (lines.length > 0) {
    files.push(parseDiffFile(lines));
  }

  return files;
}

/**
 * Sadly, github doesn't have an API to get line by line blame for a file.
 * We could git clone the repo and blame, but it's annoying to have to
 * maintain a local git repo and the blame is going to be name + email instead
 * of the github username, so we'll have to do a http request anyway.
 *
 * There are two main ways to extract information from an HTML file:
 *   - First is to work like a browser: parse the html, build a DOM tree and
 *     use a jQuery-like API to traverse the DOM and extract what you need.
 *     The big issue is that creating the DOM is --extremely-- slow.
 *   - Second is to use regex to analyze the outputted html and find whatever
 *     we want.
 *
 * I(vjeux)'ve scraped hundreds of websites using both techniques and both of
 * them have the same reliability when it comes to the website updating their
 * markup. If they change what you are extracting you are screwed and if they
 * change something around, both are resistant to it when written properly.
 * So, might as well use the fastest one of the two: regex :)
 */
function parseBlame(blame) {
  // The way the document is structured is that commits and lines are
  // interleaved. So every time we see a commit we grab the author's name
  // and every time we see a line we log the last seen author.
  var re = /(<img alt="@([^"]+)" class="avatar blame-commit-avatar"|<tr class="blame-line")/g;

  var currentAuthor = 'none';
  var lines = [];
  var match;
  while (match = re.exec(blame)) {
    if (match[2]) {
      currentAuthor = match[2];
    } else {
      lines.push(currentAuthor);
    }
  }

  return lines;
}

function getDeletedOwners(files, blames) {
  var owners = {};
  files.forEach(function (file) {
    var blame = blames[file['path']];
    if (!blame) {
      return;
    }
    file.deletedLines.forEach(function (line) {
      // In a perfect world, this should never fail. However, in practice, the
      // blame request may fail, the blame is checking against master and the
      // pull request isn't, the blame file was too big and the curl wrapper
      // only read the first n bytes...
      // Since the output of the algorithm is best effort, it's better to just
      // swallow errors and have a less accurate implementation than to crash.
      var name = blame[line - 1];
      if (!name) {
        return;
      }
      owners[name] = (owners[name] || 0) + 1;
    });
  });
  return owners;
}

function getAllOwners(files, blames) {
  var owners = {};
  files.forEach(function (file) {
    var blame = blames[file.path];
    if (!blame) {
      return;
    }
    for (var i = 0; i < blame.length; ++i) {
      var name = blame[i];
      if (!name) {
        return;
      }
      owners[name] = (owners[name] || 0) + 1;
    }
  });
  return owners;
}

function getSortedOwners(owners) {
  var sorted_owners = Object.keys(owners);
  sorted_owners.sort(function (a, b) {
    var countA = owners[a];
    var countB = owners[b];
    return countA > countB ? -1 : countA < countB ? 1 : 0;
  });
  return sorted_owners;
}

function getDiffForPullRequest(owner, repo, id, github) {
  return regeneratorRuntime.async(function getDiffForPullRequest$(_context3) {
    while (1) switch (_context3.prev = _context3.next) {
      case 0:
        return _context3.abrupt('return', new Promise(function (resolve, reject) {
          github.pullRequests.get({
            owner: owner,
            repo: repo,
            number: id,
            headers: { Accept: 'application/vnd.github.diff' }
          }, function (err, result) {
            if (err) {
              reject(err);
            } else {
              resolve(result.data);
            }
          });
        }));

      case 1:
      case 'end':
        return _context3.stop();
    }
  }, null, this);
}

function getMatchingOwners(files, whitelist, creator, org, github) {
  var owners, users;
  return regeneratorRuntime.async(function getMatchingOwners$(_context4) {
    while (1) switch (_context4.prev = _context4.next) {
      case 0:
        owners = [];
        users = whitelist || [];


        users.forEach(function (user) {
          let userHasChangedFile = false;

          user.files.forEach(function (pattern) {
            if (!userHasChangedFile) {
              userHasChangedFile = files.find(function (file) {
                return minimatch(file.path, pattern, { dot: true });
              });
            }
          });

          if (userHasChangedFile && owners.indexOf(user.name) === -1) {
            owners.push(user.name);
          }
        });

        if (!org) {
          _context4.next = 7;
          break;
        }

        _context4.next = 6;
        return regeneratorRuntime.awrap(filterOwnTeam(users, owners, creator, org, github));

      case 6:
        owners = _context4.sent;

      case 7:
        return _context4.abrupt('return', owners);

      case 8:
      case 'end':
        return _context4.stop();
    }
  }, null, this);
}

function filterOwnTeam(users, owners, creator, org, github) {
  var teamData, promises, teamMemberships;
  return regeneratorRuntime.async(function filterOwnTeam$(_context5) {
    while (1) switch (_context5.prev = _context5.next) {
      case 0:
        if (users.some(function (user) {
          return user.skipTeamPrs;
        })) {
          _context5.next = 2;
          break;
        }

        return _context5.abrupt('return', owners);

      case 2:
        _context5.next = 4;
        return regeneratorRuntime.awrap(getTeams(org, github, 0));

      case 4:
        teamData = _context5.sent;

        teamData = teamData.filter(function (team) {
          return users.some(function (user) {
            return user.skipTeamPrs && user.name === team.name;
          });
        });
        promises = teamData.map(function (teamInfo) {
          return getTeamMembership(creator, teamInfo, github);
        });
        _context5.next = 9;
        return regeneratorRuntime.awrap(Promise.all(promises));

      case 9:
        teamMemberships = _context5.sent;

        teamMemberships = teamMemberships.filter(function (membership) {
          return membership.state === 'active';
        });
        return _context5.abrupt('return', owners.filter(function (owner) {
          return !teamMemberships.find(function (membership) {
            return owner === membership.name;
          });
        }));

      case 12:
      case 'end':
        return _context5.stop();
    }
  }, null, this);
}

/**
 * While developing/debugging the algorithm itself, it's very important not to
 * make http requests to github. Not only it's going to make the reload cycle
 * much slower, it's also going to temporary/permanently ban your ip and
 * you won't be able to get anymore work done when it happens :(
 */
function fetch(url) {
  var cacheKey;
  return regeneratorRuntime.async(function fetch$(_context6) {
    while (1) switch (_context6.prev = _context6.next) {
      case 0:
        cacheKey = url.replace(/[^a-zA-Z0-9-_\.]/g, '-');
        return _context6.abrupt('return', cacheGet(cacheKey, () => downloadFileAsync(url, githubAuthCookies)));

      case 2:
      case 'end':
        return _context6.stop();
    }
  }, null, this);
}

function cacheGet(cacheKey, getFn) {
  var cacheDir, contents;
  return regeneratorRuntime.async(function cacheGet$(_context7) {
    while (1) switch (_context7.prev = _context7.next) {
      case 0:
        if (module.exports.enableCachingForDebugging) {
          _context7.next = 2;
          break;
        }

        return _context7.abrupt('return', getFn());

      case 2:
        cacheDir = __dirname + '/cache/';

        if (!fs.existsSync(cacheDir)) {
          fs.mkdir(cacheDir);
        }

        cacheKey = cacheDir + cacheKey;

        if (fs.existsSync(cacheKey)) {
          _context7.next = 10;
          break;
        }

        _context7.next = 8;
        return regeneratorRuntime.awrap(getFn());

      case 8:
        contents = _context7.sent;

        fs.writeFileSync(cacheKey, contents);

      case 10:
        return _context7.abrupt('return', readFileAsync(cacheKey, 'utf8'));

      case 11:
      case 'end':
        return _context7.stop();
    }
  }, null, this);
}

function getTeams(org, github, page) {
  var perPage;
  return regeneratorRuntime.async(function getTeams$(_context8) {
    while (1) switch (_context8.prev = _context8.next) {
      case 0:
        perPage = 100;
        return _context8.abrupt('return', new Promise(function (resolve, reject) {
          github.orgs.getTeams({
            org: org,
            page: page,
            per_page: perPage
          }, function (err, teams) {
            if (err) {
              reject(err);
            } else {
              var teamData = teams.map(function (team) {
                return {
                  name: org + "/" + team.slug,
                  id: team.id
                };
              });
              if (teamData.length === perPage) {
                getTeams(org, github, ++page).then(function (results) {
                  resolve(teamData.concat(results));
                }).catch(reject);
              } else {
                resolve(teamData);
              }
            }
          });
        }));

      case 2:
      case 'end':
        return _context8.stop();
    }
  }, null, this);
}

function getOwnerOrgs(username, github) {
  return regeneratorRuntime.async(function getOwnerOrgs$(_context9) {
    while (1) switch (_context9.prev = _context9.next) {
      case 0:
        return _context9.abrupt('return', new Promise(function (resolve, reject) {
          github.orgs.getForUser({ username: username }, function (err, result) {
            if (err) {
              reject(err);
            } else {
              resolve(result.map(function (obj) {
                return obj.login;
              }));
            }
          });
        }));

      case 1:
      case 'end':
        return _context9.stop();
    }
  }, null, this);
}

function getMembersOfOrg(org, github, page) {
  var perPage;
  return regeneratorRuntime.async(function getMembersOfOrg$(_context10) {
    while (1) switch (_context10.prev = _context10.next) {
      case 0:
        perPage = 100;
        return _context10.abrupt('return', new Promise(function (resolve, reject) {
          github.orgs.getMembers({
            org: org,
            page: page,
            per_page: perPage
          }, function (err, members) {
            if (err) {
              reject(err);
            } else {
              var logins = members.map(function (obj) {
                return obj.login;
              });
              if (logins.length === perPage) {
                getMembersOfOrg(org, github, ++page).then(function (results) {
                  resolve(logins.concat(results));
                }).catch(reject);
              } else {
                resolve(logins);
              }
            }
          });
        }));

      case 2:
      case 'end':
        return _context10.stop();
    }
  }, null, this);
}

function filterRequiredOrgs(owners, config, github) {
  var promises, currentMembers;
  return regeneratorRuntime.async(function filterRequiredOrgs$(_context11) {
    while (1) switch (_context11.prev = _context11.next) {
      case 0:
        promises = config.requiredOrgs.map(function (reqOrg) {
          return getMembersOfOrg(reqOrg, github, 0);
        });
        _context11.t0 = [].concat;
        _context11.t1 = [];
        _context11.next = 5;
        return regeneratorRuntime.awrap(Promise.all(promises));

      case 5:
        _context11.t2 = _context11.sent;
        currentMembers = _context11.t0.apply.call(_context11.t0, _context11.t1, _context11.t2);
        return _context11.abrupt('return', owners.filter(function (owner) {
          // User passes if they are in any of the required organizations
          return currentMembers.indexOf(owner) >= 0;
        }));

      case 8:
      case 'end':
        return _context11.stop();
    }
  }, null, this);
}

function getTeamMembership(creator, teamData, github) {
  return regeneratorRuntime.async(function getTeamMembership$(_context12) {
    while (1) switch (_context12.prev = _context12.next) {
      case 0:
        return _context12.abrupt('return', new Promise(function (resolve, reject) {
          github.orgs.getTeamMembership({
            id: teamData.id,
            owner: creator
          }, function (err, data) {
            if (err) {
              if (err.code === 404 && err.message === '{"message":"Not Found","documentation_url":"https://developer.github.com/v3"}') {
                resolve({ name: teamData.name, state: 'nonmember' });
              } else {
                reject(err);
              }
            } else {
              resolve({ name: teamData.name, state: data.state });
            }
          });
        }));

      case 1:
      case 'end':
        return _context12.stop();
    }
  }, null, this);
}

/**
 * If the repo is private than we should only mention users that are still part
 * of that org.
 * Otherwise we could end up with a situation where all the people mentioned have
 * left the org and none of the current staff get notified
**/

function filterPrivateRepo(owners, org, github) {
  var currentMembers;
  return regeneratorRuntime.async(function filterPrivateRepo$(_context13) {
    while (1) switch (_context13.prev = _context13.next) {
      case 0:
        _context13.next = 2;
        return regeneratorRuntime.awrap(getMembersOfOrg(org, github, 0));

      case 2:
        currentMembers = _context13.sent;
        return _context13.abrupt('return', owners.filter(function (owner, index) {
          // user passes if they are still in the org
          return currentMembers.some(function (member) {
            return member === owner;
          });
        }));

      case 4:
      case 'end':
        return _context13.stop();
    }
  }, null, this);
}

/**
 * The problem at hand is to find a set of three best effort people that have
 * context on a pull request. It doesn't (and actually can't) be perfect.
 *
 * The most precise information we have is when someone deletes or modifies
 * a line of code. We know who last touched those lines and they are most
 * likely good candidates for reviewing the code.
 * This is of course not always the case, people can codemod big number of
 * lines and have very little context on that particular one, people move
 * file around and absorb all the blame...
 *
 * But, not all pull requests modify code, many of them just add new lines.
 * I first played with giving credit to people that blamed the lines around
 * but it was unclear how to spread out the credit.
 * A much dumber strategy but which has proven to be effective is to
 * completely ignore new lines and instead find the people that are blamed
 * for the biggest number of lines in the file.
 *
 * Given those two observations, the algorithm is as follow:
 *  - For each line that has been deleted, give 1 ponumber to the blamed author
 *    in a 'deletedOwners' pool.
 *  - For each file that has been touched, for each line in that file, give 1
 *    ponumber to the blamed author in a 'allOwners' pool.
 *  Once you've got those two pools, sort them by number of points, dedupe
 *  them, concat them and finally take the first 3 names.
 */
function guessOwners(files, blames, creator, defaultOwners, fallbackOwners, privateRepo, org, config, github) {
  var deletedOwners, allOwners, deletedOwnersSet, owners;
  return regeneratorRuntime.async(function guessOwners$(_context14) {
    while (1) switch (_context14.prev = _context14.next) {
      case 0:
        deletedOwners = getDeletedOwners(files, blames);
        allOwners = getAllOwners(files, blames);


        deletedOwners = getSortedOwners(deletedOwners);
        allOwners = getSortedOwners(allOwners);

        // Remove owners that are also in deletedOwners
        deletedOwnersSet = new Set(deletedOwners);
        allOwners = allOwners.filter(function (element) {
          return !deletedOwnersSet.has(element);
        });
        owners = [].concat(deletedOwners).concat(allOwners).filter(function (owner) {
          return owner !== 'none';
        }).filter(function (owner) {
          return owner !== creator;
        }).filter(function (owner) {
          return config.userBlacklist.indexOf(owner) === -1;
        });

        if (!(config.requiredOrgs.length > 0)) {
          _context14.next = 11;
          break;
        }

        _context14.next = 10;
        return regeneratorRuntime.awrap(filterRequiredOrgs(owners, config, github));

      case 10:
        owners = _context14.sent;

      case 11:
        if (!(privateRepo && org != null)) {
          _context14.next = 15;
          break;
        }

        _context14.next = 14;
        return regeneratorRuntime.awrap(filterPrivateRepo(owners, org, github));

      case 14:
        owners = _context14.sent;

      case 15:

        if (owners.length === 0) {
          defaultOwners = defaultOwners.concat(fallbackOwners);
        }

        return _context14.abrupt('return', owners.slice(0, config.maxReviewers).concat(defaultOwners).filter(function (owner, index, ownersFound) {
          return ownersFound.indexOf(owner) === index;
        }));

      case 17:
      case 'end':
        return _context14.stop();
    }
  }, null, this);
}

function guessOwnersForPullRequest(repoURL, id, creator, targetBranch, privateRepo, org, config, github) {
  var ownerAndRepo, cacheKey, diff, files, defaultOwners, fallbackOwners, blames, promises, results;
  return regeneratorRuntime.async(function guessOwnersForPullRequest$(_context15) {
    while (1) switch (_context15.prev = _context15.next) {
      case 0:
        ownerAndRepo = repoURL.split('/').slice(-2);
        cacheKey = `${repoURL}-pull-${id}.diff`.replace(/[^a-zA-Z0-9-_\.]/g, '-');
        _context15.next = 4;
        return regeneratorRuntime.awrap(cacheGet(cacheKey, () => getDiffForPullRequest(ownerAndRepo[0], ownerAndRepo[1], id, github)));

      case 4:
        diff = _context15.sent;
        files = parseDiff(diff);
        _context15.next = 8;
        return regeneratorRuntime.awrap(getMatchingOwners(files, config.alwaysNotifyForPaths, creator, org, github));

      case 8:
        defaultOwners = _context15.sent;
        _context15.next = 11;
        return regeneratorRuntime.awrap(getMatchingOwners(files, config.fallbackNotifyForPaths, creator, org, github));

      case 11:
        fallbackOwners = _context15.sent;

        if (config.findPotentialReviewers) {
          _context15.next = 14;
          break;
        }

        return _context15.abrupt('return', defaultOwners);

      case 14:

        // There are going to be degenerated changes that end up modifying hundreds
        // of files. In theory, it would be good to actually run the algorithm on
        // all of them to get the best set of reviewers. In practice, we don't
        // want to do hundreds of http requests. Using the top 5 files is enough
        // to get us 3 people that may have context.
        files.sort(function (a, b) {
          var countA = a.deletedLines.length;
          var countB = b.deletedLines.length;
          return countA > countB ? -1 : countA < countB ? 1 : 0;
        });
        // remove files that match any of the globs in the file blacklist config
        config.fileBlacklist.forEach(function (glob) {
          files = files.filter(function (file) {
            return !minimatch(file.path, glob);
          });
        });
        files = files.slice(0, config.numFilesToCheck);

        blames = {};
        // create blame promises (allows concurrent loading)

        promises = files.map(function (file) {
          return fetch(repoURL + '/blame/' + targetBranch + '/' + file.path);
        });

        // wait for all promises to resolve

        _context15.next = 21;
        return regeneratorRuntime.awrap(Promise.all(promises));

      case 21:
        results = _context15.sent;

        results.forEach(function (result, index) {
          blames[files[index].path] = parseBlame(result);
        });

        // This is the line that implements the actual algorithm, all the lines
        // before are there to fetch and extract the data needed.
        return _context15.abrupt('return', guessOwners(files, blames, creator, defaultOwners, fallbackOwners, privateRepo, org, config, github));

      case 24:
      case 'end':
        return _context15.stop();
    }
  }, null, this);
}

module.exports = {
  enableCachingForDebugging: false,
  parseDiff: parseDiff,
  parseBlame: parseBlame,
  guessOwnersForPullRequest: guessOwnersForPullRequest
};