import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { launchImageLibrary } from 'react-native-image-picker';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile } from '../../store/slices/userSlice';
import { logoutUser } from '../../store/slices/authSlice';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  validateFullName,
  validatePhone,
  validateGender,
  validateLanguage,
  validatePhoto,
  hasValidationErrors,
} from '../../utils/validation';
import colors from '../../constants/colors';
import theme from '../../constants/theme';

const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
const LANGUAGES = ['English', 'Spanish'];

const ProfileScreen = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { profile, loading } = useSelector((state) => state.user);

  const [photo, setPhoto] = useState(profile?.photoUri || null);
  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [gender, setGender] = useState(profile?.gender || '');
  const [language, setLanguage] = useState(profile?.language || '');
  const [fieldErrors, setFieldErrors] = useState({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setPhoto(profile.photoUri || null);
      setFullName(profile.fullName || '');
      setPhone(profile.phone || '');
      setGender(profile.gender || '');
      setLanguage(profile.language || '');
    }
  }, [profile]);

  const handlePickPhoto = useCallback(async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
    if (!result.didCancel && result.assets?.length > 0) {
      setPhoto(result.assets[0].uri);
      setFieldErrors((prev) => ({ ...prev, photo: null }));
    }
  }, []);

  const validate = useCallback(() => {
    const errors = {
      photo: validatePhoto(photo),
      fullName: validateFullName(fullName),
      phone: validatePhone(phone),
      gender: validateGender(gender),
      language: validateLanguage(language),
    };
    setFieldErrors(errors);
    return !hasValidationErrors(errors);
  }, [photo, fullName, phone, gender, language]);

  const handleSave = useCallback(async () => {
    if (!validate()) return;
    setSaved(false);

    const result = await dispatch(
      updateProfile({
        uid: user?.uid,
        profileData: { fullName: fullName.trim(), phone: phone.trim(), gender, language, photoUri: photo },
      }),
    );

    if (updateProfile.fulfilled.match(result)) {
      setSaved(true);
      Alert.alert('Profile Updated', 'Your profile has been saved successfully.');
    } else {
      Alert.alert('Error', result.payload || 'Failed to update profile.');
    }
  }, [dispatch, validate, user, fullName, phone, gender, language, photo]);

  const handleLogout = useCallback(() => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => dispatch(logoutUser()),
      },
    ]);
  }, [dispatch]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.title}>My Profile</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutBtn}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.photoContainer} onPress={handlePickPhoto}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.photoImage} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.photoIcon}>👤</Text>
          </View>
        )}
        <View style={styles.photoEditBadge}>
          <Text style={styles.photoEditIcon}>✏️</Text>
        </View>
      </TouchableOpacity>
      {fieldErrors.photo ? (
        <Text style={styles.photoError}>{fieldErrors.photo}</Text>
      ) : null}

      <Text style={styles.emailLabel}>{user?.email}</Text>

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

      {loading ? <LoadingSpinner message="Saving..." size="small" /> : null}

      <Button
        title="Save Changes"
        onPress={handleSave}
        loading={loading}
        style={styles.saveBtn}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: colors.text,
  },
  logoutBtn: {
    fontSize: theme.fontSize.sm,
    color: colors.error,
    fontWeight: theme.fontWeight.medium,
  },
  photoContainer: {
    alignSelf: 'center',
    marginBottom: theme.spacing.sm,
    position: 'relative',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoIcon: {
    fontSize: 40,
  },
  photoEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.accent,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoEditIcon: {
    fontSize: 14,
  },
  photoError: {
    fontSize: theme.fontSize.xs,
    color: colors.error,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  emailLabel: {
    fontSize: theme.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
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
  saveBtn: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xxl,
  },
});

export default ProfileScreen;
