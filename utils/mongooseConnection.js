const chalk = require('chalk');
const mongoose = require('mongoose');
const sleep = require('./sleep');

async function mongooseConnection() {
  let time = 1;
  let connectSuccess = false;
  let connection;
  const { MONGO_HOST, MONGO_NAME } = process.env;
  if (!MONGO_HOST) {
    return null;
  }
  
  do {
    try {
      const message = await new Promise((resolve, reject) => {
        const host = 'mongodb://' + MONGO_HOST + '/' + MONGO_NAME;
        mongoose.connect(host, {
          useNewUrlParser: true,
        });
        const db = mongoose.connection;
        connection = db;
        db.on('error', function (err) {
          console.error('connection error', err);
          return reject(err);
        });

        db.once('open', async function () {
          console.info('Connection to DB successful');
          return resolve({ mongoose });
        });
      });

      connectSuccess = true;
    } catch (exception) {
      time += time;
      await sleep(time * 1000);
    }
  } while (!connectSuccess && time < 10);

  return connection;
}

module.exports = mongooseConnection;
