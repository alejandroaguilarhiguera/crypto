const Boom = require('@hapi/boom');
const { resolve } = require('path');

module.exports = function setupUserModel(mongoose) {
  const schema = mongoose.Schema({
    email: {
      type: String,
      lowercase: true,
      required: true,
      validate: {
        validator: function (value) {
          const self = this;
          const errorMsg = 'El email ya fue registrado!';
          return new Promise((resolve, reject) => {
            self.constructor
              .findOne({ email: value })
              .then((model) => {
                if (model._id) {
                  reject(new Error(errorMsg));
                }
                resolve(true);
                model._id ? reject(new Error(errorMsg)) : resolve(true);
              }) // if _id found then email already in use
              .catch((err) => resolve(true)); // make sure to check for db errors here
          });
        },
      },
    },
    code: String,
    createdAt: {
      type: String,
      default: Date.now,
    },
  });

  const RecoveryCode = mongoose.model('RecoveryCode', schema, 'recoveryCodes');

  // Sobre escribe la función toJSON default para quitar el password de la respuesta
  RecoveryCode.prototype.toJSON = function toJSON() {
    const result = this.toObject();
    delete result.__v;
    return result;
  };

  return RecoveryCode;
};
