const errorHandler = require('../middlewares/errorHandler');

const actionWrapper = cb => async (req, res, next) => {
  try {
    return await cb.call(req.app, req, res, next);
  } catch (e) {
    return errorHandler(e, req, res, next);
  }
};

module.exports = actionWrapper;
