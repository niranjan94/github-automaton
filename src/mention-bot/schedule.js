/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */

'use strict';

var minimatch = require('minimatch');
var nodeSchedule = require('node-schedule');

var schedule = {
  jobs: [],

  work: function (time, callback) {
    var promise = new Promise(function (resolve, reject) {
      callback(resolve, reject);
    });

    var job = nodeSchedule.scheduleJob(time, promise);
    this.jobs.push(job);

    return promise;
  },

  performAt: function _callee(time, callback) {
    return regeneratorRuntime.async(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          _context.next = 3;
          return regeneratorRuntime.awrap(this.work(time, callback));

        case 3:
          _context.next = 8;
          break;

        case 5:
          _context.prev = 5;
          _context.t0 = _context['catch'](0);

          console.error(_context.t0);

        case 8:
        case 'end':
          return _context.stop();
      }
    }, null, this, [[0, 5]]);
  },

  parse: function (delayTime) {
    var moment = ['m', 'min', 'mins', 'minute', 'minutes', 'h', 'hour', 'hours', 'd', 'day', 'days'];
    var invalidTimeMsg = 'Invalid delay time setting, it should in following format:\n' + '3m, 3 m, or 3 min\naccepted moments are: ' + moment.join(', ') + '\n instead got ' + delayTime + '\n';

    if (!minimatch(delayTime, '*+(' + moment.join('|') + ')')) {
      throw new Error(invalidTimeMsg);
    }

    var curTime = new Date();
    var minutes = curTime.getMinutes();
    var hours = curTime.getHours();
    var day = curTime.getDate();
    var month = curTime.getMonth();
    var year = curTime.getFullYear();
    var parsedTime = delayTime.match(/(\d+)\s?(\w*)/);
    var time = false;

    if (parsedTime) {
      time = parseInt(parsedTime[1]);
    }

    if (!parsedTime || !time) {
      throw new Error(invalidTimeMsg);
    }

    switch (parsedTime[2][0]) {
      case 'm':
        minutes += time;
        break;
      case 'h':
        hours += time;
        break;
      case 'd':
        day += time;
        break;
      default:
        throw new Error(invalidTimeMsg);
    }

    return new Date(year, month, day, hours, minutes, curTime.getSeconds(), 0);
  }
};

module.exports = schedule;