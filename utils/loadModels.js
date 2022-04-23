/* eslint-disable no-param-reassign  */
const mongoose = require('mongoose');
const chalk = require('chalk');
const includeModels = require('./includeModels');

/**
 * Ejecuta la definición de los modelos sequelize y sus relaciones
 *
 * @param sequelize
 * @returns {Promise<void>}
 */
async function loadModels(sequelize) {
  const models = await includeModels();
  const modelsInstances = {};
  Object.keys(models).forEach((name) => {
    modelsInstances[name] = models[name](mongoose);
  });
  return modelsInstances;
}

module.exports = loadModels;
