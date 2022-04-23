module.exports = (app, err) => {
  console.error(`>> Fatal error: ${err.message}`);
  console.error(err.stack);
  if (app.mongoose) {
    app.mongoose.close();
  }
  process.exit(1);
};
