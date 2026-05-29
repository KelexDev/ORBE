import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const WelcomeScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View style={styles.center}>
        <Text style={styles.logo}>Uber</Text>
        <Text style={styles.tagline}>Move the way you want</Text>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={styles.btnLogin}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Login')}>
          <Text style={styles.btnLoginText}>Log in</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnSignup}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Register')}>
          <Text style={styles.btnSignupText}>Sign up</Text>
        </TouchableOpacity>

        <Text style={styles.legal}>
          By proceeding, you consent to get calls, WhatsApp or SMS messages,
          including by automated means, from Uber and its affiliates to the number
          provided.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'space-between',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logo: {
    fontSize: 64,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -2,
    marginBottom: 16,
  },
  tagline: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 38,
  },
  bottom: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  btnLogin: {
    height: 56,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  btnLoginText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  btnSignup: {
    height: 56,
    borderRadius: 4,
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  btnSignupText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  legal: {
    fontSize: 11,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 8,
  },
});

export default WelcomeScreen;
