const dotenv = require('dotenv');
const Server = require('./Server');

dotenv.config({ path: '../.env' });
const server = new Server();
server.initialize().then(() => {
  server.serve();
});
