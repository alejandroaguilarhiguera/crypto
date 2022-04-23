const dotenv = require('dotenv');
const { Spot } = require('@binance/connector');
dotenv.config({ path: '../.env' });

module.exports = () => {
    const serverOfBinance = process.env.BINANCE_URL;
    const apiKeyOfBinance = process.env.BINANCE_API_KEY;
    const privateApiKeyOfBinance = process.env.BINANCE_SECRET_KEY;
    return new Spot(apiKeyOfBinance, privateApiKeyOfBinance, { baseURL: serverOfBinance });
}