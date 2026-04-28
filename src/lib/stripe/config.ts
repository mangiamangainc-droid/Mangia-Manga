import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-10-28.acacia",
  typescript: true,
});

export const formatAmountForStripe = (amount: number, currency: string) => {
  const zeroDecimalCurrencies = ["JPY", "KRW", "BIF", "CLP", "GNF", "MGA", "PYG", "RWF", "UGX", "VND", "VUV", "XAF", "XOF"];
  const isZeroDecimal = zeroDecimalCurrencies.includes(currency.toUpperCase());
  return isZeroDecimal ? amount : Math.round(amount * 100);
};

export const formatAmountFromStripe = (amount: number, currency: string) => {
  const zeroDecimalCurrencies = ["JPY", "KRW"];
  const isZeroDecimal = zeroDecimalCurrencies.includes(currency.toUpperCase());
  return isZeroDecimal ? amount : amount / 100;
};
