import { initStripe, createPaymentMethod } from '@stripe/stripe-react-native';
import { STRIPE_PUBLISHABLE_KEY } from '@env';

export const initializeStripe = async () => {
  await initStripe({
    publishableKey: STRIPE_PUBLISHABLE_KEY,
    merchantIdentifier: 'merchant.com.orbe.uberclone',
  });
};

export const createCardPaymentMethod = async (cardDetails) => {
  const { paymentMethod, error } = await createPaymentMethod({
    paymentMethodType: 'Card',
    paymentMethodData: {
      billingDetails: cardDetails.billingDetails,
    },
  });

  if (error) throw new Error(error.message);
  return paymentMethod;
};

export const processPayment = async ({ paymentIntentClientSecret, paymentMethodId }) => {
  const { confirmPayment } = await import('@stripe/stripe-react-native');
  const { paymentIntent, error } = await confirmPayment(paymentIntentClientSecret, {
    paymentMethodType: 'Card',
    paymentMethodData: { paymentMethodId },
  });

  if (error) throw new Error(error.message);
  return paymentIntent;
};
