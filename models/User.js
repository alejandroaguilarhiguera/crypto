const Boom = require('@hapi/boom');
const { resolve } = require('path');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const { auth } = require('../config');
const { checkPassword, generatePassword } = require('../utils/crypto');
const config = require('../config');

module.exports = function setupUserModel(mongoose) {
  const schema = mongoose.Schema({
    name: String,
    lastName: String,
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
    password: String,
    role: {
      type: String,
      default: 'public',
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    confirmed: {
      type: Boolean,
      default: false,
    },
    wizardCompleted: {
      type: Boolean,
      default: false,
    },
    devicesRequests: [
      {
        machineId: {
          type: String,
          required: true,
        },
        status: {
          type: String,
          required: true,
          default: 'pending',
        },
      },
    ],
    permissions: [{ type: String, required: true }],
    devices: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Devices' }],
    actions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Actions' }],
    createdAt: { type: Date, default: moment().format() },
    updatedAt: { type: Date, default: moment().format() },
  });
  schema.pre('save', function (next) {
    if (this.password) {
      let val = this.password || Date.now();
      this.password = generatePassword(val);
    }
    next();
  });
  schema.pre('updateOne', function () {
    const user = this;
    const val = user.getUpdate().password || Date.now();
    user.getUpdate().password = generatePassword(val);
    user.getUpdate().updatedAt = moment().format();
  });

  const User = mongoose.model('Users', schema, 'users');

  // Sobre escribe la función toJSON default para quitar el password de la respuesta
  User.prototype.toJSON = function toJSON() {
    const result = this.toObject();
    delete result.password;
    delete result.__v;
    return result;
  };

  User.login = async (email, password) => {
    const user = await User.findOne({ email });
    if (!user) throw Boom.conflict('El email ingresado no esta registrado');
    if (!user.enabled) throw Boom.conflict('Usuario inactivo');
    if (!user.confirmed) throw Boom.conflict('Primero debe confirmar su correo');
    if (!(await checkPassword(password, user.password))) {
      throw Boom.conflict('Contraseña incorrecta');
    }
    return user;
  };
  User.session = async (user) => {
    const { _id, email } = user;
    const payload = await User.findOne({ _id })
      .populate({ path: 'Actions' })
      .populate({ path: 'Devices' });
    const token = jwt.sign(
      JSON.stringify({
        _id,
        email,
      }),
      config.auth.secret,
    );

    return { token, user: payload };
  };
  return User;
};
