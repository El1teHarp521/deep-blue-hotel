export const formatPrice = (priceInRub, currency, lang) => {
  // Курсы валют относительно рубля
  const rates = {
    RUB: 1,
    USD: 1 / 90,      // 1 доллар = 90 рублей
    AED: 1 / 24.5     // 1 дирхам = 24.5 рублей
  };

  const symbols = {
    RUB: ' ₽',
    USD: '$',
    AED: ' AED'
  };

  const converted = Math.round(priceInRub * rates[currency]);

  const formattedNumber = converted.toLocaleString(lang === 'RU' ? 'ru-RU' : 'en-US');

  if (currency === 'USD') {
    return `${symbols.USD}${formattedNumber}`;
  }
  return `${formattedNumber}${symbols[currency]}`;
};