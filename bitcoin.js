/* eslint no-console: ["error", { allow: ["error"] }] */
const coinbase = require('coinbase');
const _ = require('lodash');
const bitbar = require('bitbar');
const rp = require('request-promise-native');

try {
  // uses the bitfinex API http://docs.bitfinex.com/
  const baseApiUrl = 'https://api.bitfinex.com/v1';

  // const statusUrl = `${baseApiUrl}/stats/BTCUSD`;
  const bitcoinSymbol = 'Ƀ';
  const ethereumSymbol = 'Ξ';
  const bigmoneyAmount = 2400.0;

  // # Coinbase API - https://www.coinbase.com/settings/api
  const coinbaseApiKey = process.env.COINBASE_API_KEY;
  const coinbaseApiSecret = process.env.COINBASE_API_SECRET;
  const coinbaseAccountId = process.env.COINBASE_ACCOUNT_ID;

  if (_.some([coinbaseApiKey, coinbaseApiSecret, coinbaseAccountId], _.isUndefined)) {
    throw new Error('Could not grab ENV!');
  }

  const client = new coinbase.Client({ apiKey: coinbaseApiKey, apiSecret: coinbaseApiSecret });

  const getTickerUrl = function getTickerUrl(baseUrl, symbol) {
    // FIXME: add check that symbol in this list
    // ["btcusd","ltcusd","ltcbtc","ethusd","ethbtc","etcbtc","etcusd","rrtusd",
    // "rrtbtc","zecusd","zecbtc","xmrusd","xmrbtc","dshusd","dshbtc","bccbtc",
    // "bcubtc","bccusd","bcuusd","xrpusd","xrpbtc","iotusd","iotbtc"]
    return `${baseUrl}/pubticker/${symbol}`;
  };

  const tickerUrl = getTickerUrl(baseApiUrl, 'btcusd');
  // const ethTickerUrl = getTickerUrl(baseApiUrl, 'ethusd');

  const parseLastPrice = function parseLastPrice(data) {
    // { mid: '769.795', bid: '769.79', ask: '769.8', last_price: '769.8',
    // low: '765.0', high: '772.72', volume: '3675.99258378', timestamp: '1481316120.69769026' }
    const responseJson = JSON.parse(data);
    const lastPrice = responseJson.last_price;
    return lastPrice;
  };

  const prettyPrintLastPrice = function prettyPrintLastPrice(symbol, lastPrice, bigMoneyAmount, bigMoneySymbol = '🤑') {
    const lastPriceParsed = parseFloat(lastPrice).toFixed(2);
    const currentPrice = `${symbol} ${lastPriceParsed || lastPrice}${lastPriceParsed > bigMoneyAmount ? `${bigMoneySymbol}` : ''}`;
    return currentPrice;
  };

  const handleCoinbaseResponse = function handleCoinbaseResponse(account, data) {
    const lastPrice = parseLastPrice(data);
    const currentPrice = prettyPrintLastPrice(bitcoinSymbol, lastPrice, bigmoneyAmount);
    bitbar([
      {
        text: currentPrice,
      },
      bitbar.sep,
      { text: 'Bitcoin' },
      { text: `Wallet Balance: ${bitcoinSymbol}${account.balance.amount}` },
      { text: `Wallet Balance: $${account.balance.amount * lastPrice}` },
      bitbar.sep,
      { text: 'Ether' },
      { text: `Wallet Balance: ${ethereumSymbol}${'TODO'}` },
      { text: `Wallet Balance: $${'TODO'}` },
      bitbar.sep,
      { text: 'Coinbase', href: 'https://coinbase.com' },
      { text: 'Coindesk', href: 'https://coindesk.com' },
      { text: 'GDAX', href: 'https://www.gdax.com/trade/BTC-USD' },
    ]);
  };

  client.getAccount(coinbaseAccountId, (err, account) => {
    const options = {
      method: 'GET',
      uri: tickerUrl,
      resolveWithFullResponse: true,
    };
    rp(options)
      .then((res) => {
        if (res.headers['content-type'] !== 'application/json; charset=utf-8') {
          throw new Error(`Did not return JSON! Response type: ${res.headers['content-type']}`);
        }
        handleCoinbaseResponse(account, res.body);
      })
      .catch((httpErr) => {
        console.error('Here i am');
        console.error(httpErr);
        throw httpErr;
      });
  });
} catch (err) {
  console.error(err);
}
