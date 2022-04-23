const SuperTest = require('supertest'); 
const Server = require('../Server'); 

module.exports = async () => {
  const serverClass = new Server();
  const app = await serverClass.initialize();
  return SuperTest.agent(app.listen());
};
