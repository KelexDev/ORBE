import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearAuthError } from '../../store/slices/authSlice';

const LoginScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { loading } = useSelector((s) => s.auth);
  const insets = useSafeAreaInsets();

  const [phone, setPhone] = useState('');

  const canContinue = phone.trim().length > 0;

  const handleContinue = useCallback(async () => {
    dispatch(clearAuthError());
    if (!phone.trim()) return;
    // Uses phone input as the email identifier — user should enter their registered email here
    const result = await dispatch(loginUser({ email: phone.trim(), password: 'demo123' }));
    if (loginUser.rejected.match(result)) {
      Alert.alert('Login Failed', result.payload || 'Check your credentials and try again.');
    }
  }, [phone, dispatch]);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={22} color="#000000" />
        </TouchableOpacity>
      </View>

      {/* Body */}
      <View style={styles.body}>
        <Text style={styles.title}>{"What's your\nphone number?"}</Text>

        {/* Phone row with bottom-only border */}
        <View style={styles.phoneRow}>
          <TouchableOpacity style={styles.countrySelector}>
            <Text style={styles.flagEmoji}>🇨🇴</Text>
            <Text style={styles.countryCode}>+57</Text>
            <Icon name="chevron-down" size={14} color="#545454" style={styles.chevron} />
          </TouchableOpacity>
          <View style={styles.phoneDivider} />
          <TextInput
            style={styles.phoneInput}
            value={phone}
            onChangeText={setPhone}
            placeholder="000 000 0000"
            placeholderTextColor="#999999"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <View style={styles.phoneBorder} />

        {/* Divider */}
        <View style={styles.orRow}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>or</Text>
          <View style={styles.orLine} />
        </View>

        {/* Social buttons */}
        <TouchableOpacity
          style={styles.socialBtn}
          onPress={() => navigation.navigate('Register')}>
          <Text style={styles.googleLetter}>G</Text>
          <Text style={styles.socialText}>Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.socialBtn}>
          <Icon name="apple" size={18} color="#000000" />
          <Text style={styles.socialText}>Continue with Apple</Text>
        </TouchableOpacity>
      </View>

      {/* Footer — Continue button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.continueBtn, !canContinue && styles.continueBtnDisabled]}
          onPress={handleContinue}
          disabled={loading || !canContinue}
          activeOpacity={0.9}>
          <Text
            style={[
              styles.continueBtnText,
              !canContinue && styles.continueBtnTextDisabled,
            ]}>
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 32,
    lineHeight: 32,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
  },
  flagEmoji: {
    fontSize: 22,
    marginRight: 6,
  },
  countryCode: {
    fontSize: 32,
    fontWeight: '300',
    color: '#000000',
  },
  chevron: {
    marginLeft: 4,
  },
  phoneDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#CCCCCC',
    marginHorizontal: 12,
  },
  phoneInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '300',
    color: '#000000',
    padding: 0,
  },
  phoneBorder: {
    height: 1,
    backgroundColor: '#000000',
    marginBottom: 32,
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#EEEEEE',
  },
  orText: {
    fontSize: 13,
    color: '#545454',
    marginHorizontal: 16,
  },
  socialBtn: {
    height: 52,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
  },
  googleLetter: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000000',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  socialText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  continueBtn: {
    height: 56,
    borderRadius: 4,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnDisabled: {
    backgroundColor: '#EEEEEE',
  },
  continueBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  continueBtnTextDisabled: {
    color: '#999999',
  },
});

export default LoginScreen;
