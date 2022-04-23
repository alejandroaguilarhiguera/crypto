const mongooseConnection = require('./mongooseConnection');
const loadModels = require('./loadModels');

module.exports = async (config) => {
  const mongoose = await mongooseConnection(config);
  const models = await loadModels(mongoose);

  return { mongoose, models };
};
