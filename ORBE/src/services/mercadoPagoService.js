import { MERCADOPAGO_PUBLIC_KEY } from '@env';

const MP_API = 'https://api.mercadopago.com';

/**
 * Tokenizes a card using MercadoPago's public key.
 * The token is safe to send to your backend for payment processing.
 */
export const tokenizeCard = async ({
  cardNumber,
  expirationMonth,
  expirationYear,
  securityCode,
  cardholderName,
}) => {
  const response = await fetch(
    `${MP_API}/v1/card_tokens?public_key=${MERCADOPAGO_PUBLIC_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        card_number: cardNumber.replace(/\s/g, ''),
        expiration_month: parseInt(expirationMonth, 10),
        expiration_year: parseInt(`20${expirationYear}`, 10),
        security_code: securityCode,
        cardholder: {
          name: cardholderName.toUpperCase(),
        },
      }),
    },
  );

  const data = await response.json();

  if (!response.ok || data.error) {
    const msg = data.cause?.[0]?.description || data.message || 'Error al tokenizar la tarjeta.';
    throw new Error(msg);
  }

  return data; // { id: 'card_token_id', ... }
};

/**
 * Returns the card brand based on the first digits.
 */
export const detectCardBrand = (cardNumber) => {
  const n = cardNumber.replace(/\s/g, '');
  if (/^4/.test(n)) return 'Visa';
  if (/^5[1-5]/.test(n)) return 'Mastercard';
  if (/^3[47]/.test(n)) return 'Amex';
  return '';
};

/**
 * Formats a card number string with spaces every 4 digits.
 */
export const formatCardNumber = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
};

/**
 * Formats expiry input as MM/YY.
 */
export const formatExpiry = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return digits;
};
