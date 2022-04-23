const Boom = require('@hapi/boom');

module.exports = () => {
  throw Boom.tooManyRequests(
    'Has excedido el límite de solicitudes por minuto, espera unos momentos para intentarlo',
  );
};
