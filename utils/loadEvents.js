const includeAll = require('include-all');
const path = require('path');
const chalk = require('chalk');

module.exports = function loadEvents(location) {
  return new Promise((resolve, reject) => {
    includeAll.optional(
      {
        dirname: path.resolve(process.cwd(), 'events/' + location),
        filter: /(.+)\.js$/,
        identity: false,
      },
      (err, response) => {
        if (err) return reject(err);
        return resolve(response);
      },
    );
  });
};
