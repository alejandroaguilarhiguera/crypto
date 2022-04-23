const includeAll = require('include-all');
const path = require('path');
const chalk = require('chalk');

/**
 * Carga todos los archivos .js de la carpeta src/models
 *
 * @returns {Promise<Array>}
 */
function includeModels() {
  return new Promise((resolve, reject) => {
    includeAll.optional(
      {
        dirname: path.resolve(__dirname, '..', 'models'),
        filter: /(.+)\.js$/,
        identity: false,
      },
      (err, response) => {
        if (err) return reject(err);
        return resolve(response);
      },
    );
  });
}

module.exports = includeModels;
