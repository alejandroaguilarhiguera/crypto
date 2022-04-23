const chalk = require('chalk');
const { compose } = require('compose-middleware');
const actionWrapper = require('./actionWrapper');
const camelToKebab = require('./camelToKebab');

const handler = (req, res) => res.send(`${req.method} - ${req.originalUrl}`);

const defaultOptions = {
  method: 'get',
  handler,
  route: null,
  globalMiddlewares: true,
  controllerMiddlewares: true,
  middlewares: [],
};

const defaultActionsOptions = {
  index: defaultOptions,
  show: { ...defaultOptions, route: ':id' },
  add: { ...defaultOptions, method: 'post' },
  edit: { ...defaultOptions, method: 'patch', route: ':id' },
  delete: { ...defaultOptions, method: 'delete', route: ':id' },
  restore: { ...defaultOptions, method: 'put', route: 'restore/:id' },
  destroy: { ...defaultOptions, method: 'delete', route: 'destroy/:id' },
  trashed: { ...defaultOptions, route: 'trashed' },
};

const defaultActions = ['index', 'show', 'add', 'edit', 'delete', 'restore', 'destroy', 'trashed'];

module.exports = async function controllerToRoutes(router, ctrls, global) {
  Object.keys(ctrls).forEach((controllerName) => {
    const controller = ctrls[controllerName];
    if (!Array.isArray(controller.middlewares)) controller.middlewares = [];
    // Se obtienen las acciones de los controllers, filtrando el array de middlewares
    const actions = Object.keys(controller).filter((item) => item !== 'middlewares');
    actions.forEach((actionName) => {
      const action = controller[actionName];
      let controllerAction = defaultActionsOptions[actionName]
        ? defaultActionsOptions[actionName]
        : {
            method: 'get',
            handler,
            middlewares: controller.middlewares,
            globalMiddlewares: true,
            controllerMiddlewares: true,
          };

      if (typeof action === 'function') {
        controllerAction.handler = action;
      } else {
        controllerAction = { ...controllerAction, ...action };
      }
      const ctrlMiddlewares = controllerAction.controllerMiddlewares
        ? [...controller.middlewares, ...controllerAction.middlewares]
        : [];

      const { method, route, globalMiddlewares } = controllerAction;

      let url = `/${camelToKebab(controllerName)}`;
      if (route) {
        if (route.match(/^\//)) {
          // Si inicia con diagonal
          url = route;
        } else if (defaultActions.includes(actionName)) {
          url += `/${route}`;
        } else {
          url += `/${camelToKebab(actionName)}/${route}`;
        }
      } else if (!defaultActions.includes(actionName)) {
        url += `/${camelToKebab(actionName)}`;
      }

      const middlewares = globalMiddlewares
        ? [
            ...(Array.isArray(global.middlewares) ? global.middlewares : []),
            ...(Array.isArray(ctrlMiddlewares) ? ctrlMiddlewares : []),
          ]
        : ctrlMiddlewares;
      router[method.toLowerCase()](
        url,
        compose(middlewares.map((middleware) => actionWrapper(middleware))),
        actionWrapper(controllerAction.handler),
      );
    });
  });
  return router;
};
