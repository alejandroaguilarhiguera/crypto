const chalk = require( 'chalk');
/**
* Se ejecuta cuando un error fatal ocurre
* @param err
*/
module.exports = (err, app) => {
  console.error(chalk.redBright(`>> Fatal error: ${err.message}`));
  console.error(err.stack);
  if (app?.sequelize) {
    app.sequelize.close();
  }
  process.exit(1);
};
