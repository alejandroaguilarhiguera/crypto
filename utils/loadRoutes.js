const express = require('express');
const asyncify = require('express-asyncify');
const controllerToRoutes = require('./controllerToRoutes');
const loadControllers = require('./includeControllers');
const actionWrapper = require('./actionWrapper');

const router = asyncify(express.Router());

module.exports = async () => {
  const ctrls = await loadControllers();
  await controllerToRoutes(router, ctrls, { middlewares: [] });
  // WELCOME REQUEST
  router.get(
    '/',
    actionWrapper(async (req, res) => {
      const dev = process.env.NODE_ENV === 'development';
      const env = dev ? { env: process.env } : {};
      const routes = dev
      ? {
        routes: router.stack.map(item => {
          return `${item.route.stack[0].method.toUpperCase()} ${item.route.path}`;
        }),
      }
      : {};
      const controllersName = Object.keys(ctrls);
      const controllers = dev ? { controllers: controllersName } : {};
      res.send({
        version: '2.0',
        ...controllers,
        // ...models,
        ...routes,
        ...env,
      });
    }),
  );

  return router;
};
