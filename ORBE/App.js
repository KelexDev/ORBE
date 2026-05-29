import React from 'react';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StripeProvider } from '@stripe/stripe-react-native';
import { STRIPE_PUBLISHABLE_KEY } from '@env';
import store from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider } from './src/context/ThemeContext';

const App = () => {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Provider store={store}>
          <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY || ''}>
            <AppNavigator />
          </StripeProvider>
        </Provider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

export default App;