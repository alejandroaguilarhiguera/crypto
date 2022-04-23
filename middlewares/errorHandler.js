const Boom = require('@hapi/boom');

const cleanErrors = (errors) =>
  errors.map(({ properties }) => {
    return properties;
  });

module.exports = (e, req, res, next) => {

  if (Boom.isBoom(e)) {
    return res.status(e.output.statusCode).json({ ...e.output.payload, data: e.data });
  }
  if (e.errors) {
    const errorValues = Object.values(e.errors);
    return res.status(422).json({
      statusCode: 422,
      error: 'Unprocessable Entity',
      message: 'Errores de validación',
      validationErrors: cleanErrors(errorValues),
    });
  }
  if (e.name === 'SequelizeValidationError') {
    return res.status(422).json({
      statusCode: 422,
      error: 'Unprocessable Entity',
      message: 'Errores de validación',
      validationErrors: cleanErrors(e.errors),
    });
  }
  if (process.env.NODE_ENV !== 'production') {
    return res.status(500).json({
      statusCode: 500,
      error: e.name,
      message: e.message,
      stack: e.stack ? e.stack.split('\n') : null,
      sql: e.sql,
    });
  }

  return res.status(500).json({
    statusCode: 500,
    error: e.name || 'Internal Server Error',
    message: e.message || 'An unknown error occurred on the server',
  });
};
