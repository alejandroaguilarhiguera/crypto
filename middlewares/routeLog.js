module.exports = (req, res, next) => {
  console.info(
    `${req.isAuthenticated() ? `[${req.user._id}] ` : ''}${req.method} - ${req.originalUrl}`,
  );
  console.info('------------------------');
  next();
};
