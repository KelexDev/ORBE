import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { launchImageLibrary } from 'react-native-image-picker';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearAuthError } from '../../store/slices/authSlice';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import {
  validateRegisterForm,
  hasValidationErrors,
} from '../../utils/validation';
import colors from '../../constants/colors';
import theme from '../../constants/theme';

const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
const LANGUAGES = ['English', 'Spanish'];

const RegisterScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const [photo, setPhoto] = useState(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [email, setEmail] = useState('');
  const [language, setLanguage] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const handlePickPhoto = useCallback(async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
    if (!result.didCancel && result.assets?.length > 0) {
      setPhoto(result.assets[0]);
      setFieldErrors((prev) => ({ ...prev, photo: null }));
    }
  }, []);

  const validate = useCallback(() => {
    const errors = validateRegisterForm({
      photo,
      fullName,
      phone,
      gender,
      email,
      language,
      password,
    });
    setFieldErrors(errors);
    return !hasValidationErrors(errors);
  }, [photo, fullName, phone, gender, email, language, password]);

  const handleRegister = useCallback(async () => {
    dispatch(clearAuthError());
    if (!validate()) return;

    const profileData = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      gender,
      language,
      photoUri: photo?.uri || null,
    };

    const result = await dispatch(
      registerUser({ email: email.trim(), password, profileData }),
    );

    if (registerUser.rejected.match(result)) {
      Alert.alert('Registration Failed', result.payload || 'Something went wrong. Please try again.');
    }
  }, [dispatch, validate, fullName, phone, gender, email, language, password, photo]);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Fill in all fields to get started</Text>
        </View>

        {/* Photo */}
        <TouchableOpacity style={styles.photoContainer} onPress={handlePickPhoto}>
          {photo ? (
            <Image source={{ uri: photo.uri }} style={styles.photoImage} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoIcon}>📷</Text>
              <Text style={styles.photoText}>Add Photo</Text>
            </View>
          )}
        </TouchableOpacity>
        {fieldErrors.photo ? (
          <Text style={styles.photoError}>{fieldErrors.photo}</Text>
        ) : null}

        {/* Full Name */}
        <Input
          label="Full Name"
          value={fullName}
          onChangeText={(text) => {
            if (text.length <= 50) setFullName(text);
          }}
          placeholder="Your full name"
          autoCapitalize="words"
          error={fieldErrors.fullName}
          rightElement={
            <Text style={styles.counter}>{fullName.length}/50</Text>
          }
        />

        {/* Phone */}
        <Input
          label="Phone Number"
          value={phone}
          onChangeText={(text) => {
            if (/^\d*$/.test(text)) setPhone(text);
          }}
          placeholder="e.g. 5551234567"
          keyboardType="numeric"
          error={fieldErrors.phone}
        />

        {/* Gender */}
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerLabel}>Gender</Text>
          <View
            style={[
              styles.pickerWrapper,
              fieldErrors.gender ? styles.pickerError : null,
            ]}>
            <Picker
              selectedValue={gender}
              onValueChange={(value) => {
                setGender(value);
                setFieldErrors((prev) => ({ ...prev, gender: null }));
              }}
              style={styles.picker}>
              <Picker.Item label="Select gender..." value="" color={colors.textLight} />
              {GENDERS.map((g) => (
                <Picker.Item key={g} label={g} value={g} />
              ))}
            </Picker>
          </View>
          {fieldErrors.gender ? (
            <Text style={styles.pickerErrorText}>{fieldErrors.gender}</Text>
          ) : null}
        </View>

        {/* Email */}
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          error={fieldErrors.email}
        />

        {/* Language */}
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerLabel}>Language</Text>
          <View
            style={[
              styles.pickerWrapper,
              fieldErrors.language ? styles.pickerError : null,
            ]}>
            <Picker
              selectedValue={language}
              onValueChange={(value) => {
                setLanguage(value);
                setFieldErrors((prev) => ({ ...prev, language: null }));
              }}
              style={styles.picker}>
              <Picker.Item label="Select language..." value="" color={colors.textLight} />
              {LANGUAGES.map((l) => (
                <Picker.Item key={l} label={l} value={l} />
              ))}
            </Picker>
          </View>
          {fieldErrors.language ? (
            <Text style={styles.pickerErrorText}>{fieldErrors.language}</Text>
          ) : null}
        </View>

        {/* Password */}
        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Minimum 6 characters"
          secureTextEntry
          error={fieldErrors.password}
        />

        {error ? <Text style={styles.serverError}>{error}</Text> : null}

        <Button
          title="Create Account"
          onPress={handleRegister}
          loading={loading}
          style={styles.submitBtn}
        />

        <View style={styles.loginRow}>
          <Text style={styles.loginLabel}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.loginLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xl,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: colors.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: colors.textSecondary,
  },
  photoContainer: {
    alignSelf: 'center',
    marginBottom: theme.spacing.md,
  },
  photoImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoIcon: {
    fontSize: 28,
  },
  photoText: {
    fontSize: theme.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 4,
  },
  photoError: {
    fontSize: theme.fontSize.xs,
    color: colors.error,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  counter: {
    fontSize: theme.fontSize.xs,
    color: colors.textLight,
  },
  pickerContainer: {
    marginBottom: theme.spacing.md,
  },
  pickerLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: colors.text,
    marginBottom: theme.spacing.xs,
  },
  pickerWrapper: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: theme.borderRadius.md,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  pickerError: {
    borderColor: colors.error,
  },
  picker: {
    height: 52,
    color: colors.text,
  },
  pickerErrorText: {
    fontSize: theme.fontSize.xs,
    color: colors.error,
    marginTop: theme.spacing.xs,
  },
  serverError: {
    fontSize: theme.fontSize.sm,
    color: colors.error,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  submitBtn: {
    marginTop: theme.spacing.sm,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  loginLabel: {
    fontSize: theme.fontSize.sm,
    color: colors.textSecondary,
  },
  loginLink: {
    fontSize: theme.fontSize.sm,
    color: colors.accent,
    fontWeight: theme.fontWeight.semibold,
  },
});

export default RegisterScreen;
