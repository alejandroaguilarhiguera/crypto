const Joi = require('@hapi/joi');
const getAgent = require('../utils/agent');

const headers = {
  'Content-Type': 'application/json',
  'x-test': 'true',
};

const getCoinsSchema = Joi.array().items(
  Joi.object().keys({
    symbol: Joi.string().required(),
    priceChangePercent: Joi.number().required(),
  })
);

const accountSchema = Joi.object().keys({
  makerCommission: Joi.number().required(),
  takerCommission: Joi.number().required(),
  buyerCommission: Joi.number().required(),
  sellerCommission: Joi.number().required(),
  canTrade: Joi.boolean().required(),
  canWithdraw: Joi.boolean().required(),
  canDeposit: Joi.boolean().required(),
  updateTime: Joi.number().required(),
  accountType: Joi.string().required(),
  balances: Joi.array().items(
    Joi.object().keys({
      asset: Joi.string().required(),
      free: Joi.string().required(),
      locked: Joi.string().required(),
    }),
  ),
  permissions: Joi.array().items(
    Joi.string().required()
  ),
});

let agent;

beforeAll(async () => {
  agent = await getAgent();
});

describe('BINANCE', () => {
  
  test('Consultar las 10 monedas más bajas', async () => {
    const limit = 10;
    const response = await agent.get(`/binance`).set(headers);
    expect(response.status).toBe(200);
    const { body: coins } = response;
    const { error } = getCoinsSchema.validate(coins);
    expect(error).toBeUndefined();
    expect(coins.length).toBe(limit);
    const [firstCoin] = coins;
    let { priceChangePercent } = firstCoin;
    coins.forEach((coin) => {
      expect(coin.priceChangePercent).toBeGreaterThanOrEqual(priceChangePercent);
    });
  }, 10000);

  test('Consultar 12 monedas más bajas', async () => {
    const limit = 12;
    const response = await agent.get(`/binance?limit=${limit}`).set(headers);
    expect(response.status).toBe(200);
    const { body: coins } = response;
    const { error } = getCoinsSchema.validate(coins);
    expect(error).toBeUndefined();
    expect(coins.length).toBe(limit);
    const [firstCoin] = coins;
    let { priceChangePercent } = firstCoin;
    coins.forEach((coin) => {
      expect(coin.priceChangePercent).toBeGreaterThanOrEqual(priceChangePercent);
    });
  }, 10000);

  // Endpoint extra
  test('Se consulta el precio de bitcoin en dolares', async () => {
    const symbol = 'BTCBUSD';
    const response = await agent.get(`/binance/exchange-info?symbol=${symbol}`).set(headers);
    expect(response.status).toBe(200);
  }, 10000);

  test('Consultar la cuenta del usuario', async () => {
    const response = await agent.get(`/binance/get-account`).set(headers);
    expect(response.status).toBe(200);
    const { error } = accountSchema.validate(response.body);
    expect(error).toBeUndefined();
  }, 10000);

  test('Comprar la moneda más baja', async () => {
    const response = await agent.post(`/binance/new-order`).set(headers).send({
      side: 'BUY',
      timeInForce: 'GTC',
      quantity: '1',
      price: 0.1,
      type: 'LIMIT'
    });
    expect(response.status).toBe(201);
  }, 10000);

  test('Crear una orden con bitcoin', async () => {
    const response = await agent.post(`/binance/new-order`).set(headers).send({
      symbol: 'BTCBUSD',
      side: 'BUY',
      timeInForce: 'GTC',
      quantity: '1',
      price: 0.1,
      type: 'LIMIT'
    });
    expect(response.status).toBe(201);
  }, 10000);

});
