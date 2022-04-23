const { Op } = require('sequelize');
const Boom = require('@hapi/boom');
const { Spot } = require('@binance/connector');
const orderCoins = require('../utils/orderCoins');

module.exports = {
  /**
   * Obtener las 10 monedas con mayores perdidas en el mercado
   * @param {*} req
   * @param {*} res
   * @returns
   */
  async index(req, res) {
    const { limit = 10 } = req.query;
    const nameOfCache = `ticker24hrLimit=${limit}`;
    let coins = req.app.cache.get(nameOfCache);
    if (coins) {
      return res.json(coins);
    }

    try {
      const { data } = await req.app.binance.ticker24hr();
      coins = data;
    } catch (error) {
      throw Boom.conflict('Problemas al consultar las monedas', error.response?.data);
    }

    // Order coins
    coins.sort(orderCoins);

    // Show only symbol and percent
    coins = coins.map(({ symbol, priceChangePercent }) => ({
      symbol,
      priceChangePercent: Number(priceChangePercent),
    }));

    // apply limit default 10
    coins = coins.slice(0, limit);

    req.app.cache.set(nameOfCache, coins, 5);

    return res.json(coins);
  },
  async exchangeInfo(req, res) {
    try {
      const { data } = await req.app.binance.exchangeInfo(req.query);
      return res.json(data);
    } catch (error) {
      throw Boom.conflict('Problemas al consultar la cuenta', error.response?.data);
    }
  },

  /**
   * if id is undefined then find the current account
   * @param {*} req
   * @param {*} res
   * @returns
   */
  getAccount: {
    route: ':id?',
    async handler(req, res) {
      const nameOfCache = 'account';
      const account = req.app.cache.get(nameOfCache);
      if (account) {
        return res.json(account);
      }

      try {
        const { data } = await req.app.binance.account({ recvWindow: 50000 });
        req.app.cache.set(nameOfCache, data, 10);

        return res.json(data);
      } catch (error) {
        throw Boom.conflict('Problemas al consultar la cuenta', error.response?.data);
      }
    },
  },
  newOrder: {
    method: 'POST',
    async handler(req, res) {
      const limit = 10;
      let lowestCoin = null;

      if (!req.body.symbol) {
        // No se especificó el tipo de moneda
        // Entonces busquemos en cache
        const nameOfCache = `ticker24hrLimit=${limit}`;
        let coins = req.app.cache.get(nameOfCache);
        if (!coins) {
          // No hay monedas en cache
          try {
            // Consultemos al servidor binance
            const { data } = await req.app.binance.ticker24hr();
            coins = data;
          } catch (error) {
            throw Boom.conflict('Problemas al consultar las monedas', error.response?.data);
          }

          // Ordenar monedas
          coins.sort(orderCoins);

          // Almacenar en cache por 5 segundos
          req.app.cache.set(nameOfCache, coins, 5);

          [lowestCoin] = coins;
        }
      }
      const { symbol = lowestCoin?.symbol, side, type } = req.body;
      try {
        const { data } = await req.app.binance.newOrder(symbol, side, type, {
          ...req.body,
        });
        return res.status(201).json(data);
      } catch (error) {
        throw Boom.conflict('Problemas al realizar la orden', error.response?.data);
      }
    },
  },
};
