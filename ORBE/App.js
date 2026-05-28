import React from 'react';
import { Provider } from 'react-redux';
import { StripeProvider } from '@stripe/stripe-react-native';
import { STRIPE_PUBLISHABLE_KEY } from '@env';
import store from './src/store';
import AppNavigator from './src/navigation/AppNavigator';

const App = () => {
  return (
    <Provider store={store}>
      <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY || ''}>
        <AppNavigator />
      </StripeProvider>
    </Provider>
  );
};

export default App;