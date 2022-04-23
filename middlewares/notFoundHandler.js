module.exports = (req, res) => {
  res.status(404).json({
    error: `Cannot ${req.method} ${req.originalUrl}`,
    message: 'La acción no existe',
  });
};