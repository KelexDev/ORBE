import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchImageLibrary } from 'react-native-image-picker';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearAuthError } from '../../store/slices/authSlice';
import { validateRegisterForm, hasValidationErrors } from '../../utils/validation';

const TABS = ['Personal Info', 'Contact', 'Preferences'];
const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

const RegisterScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { loading } = useSelector((s) => s.auth);
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState(0);
  const [photo, setPhoto] = useState(null);
  const [fullName, setFullName] = useState('');
  const [showGenderMenu, setShowGenderMenu] = useState(false);
  const [gender, setGender] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [language, setLanguage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const handlePickPhoto = useCallback(async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
    if (!result.didCancel && result.assets?.length > 0) {
      setPhoto(result.assets[0]);
      setFieldErrors((prev) => ({ ...prev, photo: null }));
    }
  }, []);

  const handleRegister = useCallback(async () => {
    dispatch(clearAuthError());
    const errors = validateRegisterForm({
      photo,
      fullName,
      phone,
      gender,
      email,
      language,
      password: 'demo123',
    });
    setFieldErrors(errors);
    if (hasValidationErrors(errors)) {
      // Jump to the tab that has errors
      if (errors.fullName || errors.gender || errors.photo) setActiveTab(0);
      else if (errors.phone || errors.email) setActiveTab(1);
      else setActiveTab(2);
      return;
    }
    const result = await dispatch(
      registerUser({
        email: email.trim(),
        password: 'demo123',
        profileData: {
          fullName: fullName.trim(),
          phone: phone.trim(),
          gender,
          language,
          photoUri: photo?.uri || null,
        },
      }),
    );
    if (registerUser.rejected.match(result)) {
      Alert.alert('Registration Failed', result.payload || 'Something went wrong. Try again.');
    }
  }, [dispatch, photo, fullName, phone, gender, email, language]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={22} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create account</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Tab bar — black 2px underline on active, no fill */}
      <View style={styles.tabBar}>
        {TABS.map((tab, idx) => (
          <TouchableOpacity
            key={tab}
            style={styles.tab}
            onPress={() => setActiveTab(idx)}>
            <Text style={[styles.tabText, activeTab === idx && styles.tabTextActive]}>
              {tab}
            </Text>
            <View style={[styles.tabUnderline, activeTab === idx && styles.tabUnderlineActive]} />
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        {/* ── TAB 0: Personal Info ─────────────────────────────── */}
        {activeTab === 0 && (
          <View>
            {/* Circular avatar with dashed border + camera overlay */}
            <TouchableOpacity style={styles.avatarWrap} onPress={handlePickPhoto}>
              {photo ? (
                <Image source={{ uri: photo.uri }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Icon name="camera" size={26} color="#999999" />
                </View>
              )}
            </TouchableOpacity>
            {fieldErrors.photo ? (
              <Text style={styles.errorText}>{fieldErrors.photo}</Text>
            ) : null}

            {/* Full name with counter */}
            <View style={styles.fieldWrap}>
              <TextInput
                style={[
                  styles.underlineInput,
                  fieldErrors.fullName && styles.underlineInputError,
                ]}
                value={fullName}
                onChangeText={(t) => {
                  if (t.length <= 50) setFullName(t);
                  setFieldErrors((prev) => ({ ...prev, fullName: null }));
                }}
                placeholder="Full name"
                placeholderTextColor="#999999"
                autoCapitalize="words"
              />
              <Text style={styles.counter}>{fullName.length}/50</Text>
              {fieldErrors.fullName ? (
                <Text style={styles.errorText}>{fieldErrors.fullName}</Text>
              ) : null}
            </View>

            {/* Gender dropdown row */}
            <TouchableOpacity
              style={[styles.dropdownRow, fieldErrors.gender && styles.dropdownRowError]}
              onPress={() => setShowGenderMenu(!showGenderMenu)}>
              <Text style={[styles.dropdownText, !gender && styles.dropdownPlaceholder]}>
                {gender || 'Gender'}
              </Text>
              <Icon name="chevron-right" size={18} color="#545454" />
            </TouchableOpacity>
            {fieldErrors.gender ? (
              <Text style={styles.errorText}>{fieldErrors.gender}</Text>
            ) : null}
            {showGenderMenu && (
              <View style={styles.dropdownMenu}>
                {GENDERS.map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setGender(g);
                      setShowGenderMenu(false);
                      setFieldErrors((prev) => ({ ...prev, gender: null }));
                    }}>
                    <Text style={styles.dropdownItemText}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ── TAB 1: Contact ───────────────────────────────────── */}
        {activeTab === 1 && (
          <View>
            {/* Phone field */}
            <View style={styles.fieldWrap}>
              <View style={styles.phoneInputRow}>
                <Text style={styles.countryCodeText}>+57</Text>
                <View style={styles.phoneSep} />
                <TextInput
                  style={[
                    styles.phoneTextInput,
                    fieldErrors.phone && styles.underlineInputError,
                  ]}
                  value={phone}
                  onChangeText={(t) => {
                    if (/^\d*$/.test(t)) setPhone(t);
                    setFieldErrors((prev) => ({ ...prev, phone: null }));
                  }}
                  placeholder="Phone number"
                  placeholderTextColor="#999999"
                  keyboardType="phone-pad"
                />
              </View>
              <View
                style={[
                  styles.phoneBorder,
                  fieldErrors.phone && styles.phoneBorderError,
                ]}
              />
              {fieldErrors.phone ? (
                <Text style={styles.errorText}>{fieldErrors.phone}</Text>
              ) : null}
            </View>

            {/* Email field */}
            <View style={styles.fieldWrap}>
              <TextInput
                style={[
                  styles.underlineInput,
                  fieldErrors.email && styles.underlineInputError,
                ]}
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  setFieldErrors((prev) => ({ ...prev, email: null }));
                }}
                placeholder="Email"
                placeholderTextColor="#999999"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {fieldErrors.email ? (
                <Text style={styles.errorText}>{fieldErrors.email}</Text>
              ) : null}
            </View>
          </View>
        )}

        {/* ── TAB 2: Preferences ───────────────────────────────── */}
        {activeTab === 2 && (
          <View>
            <Text style={styles.prefLabel}>Language</Text>
            <View style={styles.langRow}>
              <TouchableOpacity
                style={[
                  styles.langCard,
                  language === 'Spanish' && styles.langCardSelected,
                ]}
                onPress={() => setLanguage('Spanish')}>
                <Text style={styles.langFlag}>🇪🇸</Text>
                <Text
                  style={[
                    styles.langText,
                    language === 'Spanish' && styles.langTextSelected,
                  ]}>
                  Español
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.langCard,
                  language === 'English' && styles.langCardSelected,
                ]}
                onPress={() => setLanguage('English')}>
                <Text style={styles.langFlag}>🇺🇸</Text>
                <Text
                  style={[
                    styles.langText,
                    language === 'English' && styles.langTextSelected,
                  ]}>
                  English
                </Text>
              </TouchableOpacity>
            </View>
            {fieldErrors.language ? (
              <Text style={styles.errorText}>{fieldErrors.language}</Text>
            ) : null}
          </View>
        )}
      </ScrollView>

      {/* Fixed bottom button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {activeTab < TABS.length - 1 ? (
          <TouchableOpacity
            style={styles.nextBtn}
            onPress={() => setActiveTab((t) => t + 1)}
            activeOpacity={0.9}>
            <Text style={styles.nextBtnText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.nextBtn, loading && styles.nextBtnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.9}>
            <Text style={styles.nextBtnText}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  // Tab bar
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#999999',
  },
  tabTextActive: {
    color: '#000000',
    fontWeight: '600',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 8,
    right: 8,
    height: 2,
    backgroundColor: 'transparent',
  },
  tabUnderlineActive: {
    backgroundColor: '#000000',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  // Avatar
  avatarWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignSelf: 'center',
    marginBottom: 24,
    overflow: 'hidden',
  },
  avatarImg: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#CCCCCC',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F6F6F6',
  },
  // Fields
  fieldWrap: {
    marginBottom: 24,
  },
  underlineInput: {
    fontSize: 15,
    fontWeight: '400',
    color: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC',
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  underlineInputError: {
    borderBottomColor: '#E11900',
  },
  counter: {
    fontSize: 11,
    color: '#999999',
    textAlign: 'right',
    marginTop: 4,
  },
  errorText: {
    fontSize: 11,
    color: '#E11900',
    marginTop: 4,
  },
  // Gender dropdown
  dropdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC',
    paddingVertical: 12,
    marginBottom: 4,
  },
  dropdownRowError: {
    borderBottomColor: '#E11900',
  },
  dropdownText: {
    fontSize: 15,
    color: '#000000',
  },
  dropdownPlaceholder: {
    color: '#999999',
  },
  dropdownMenu: {
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F6F6F6',
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#000000',
  },
  // Phone (contact tab)
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  countryCodeText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
    marginRight: 12,
  },
  phoneSep: {
    width: 1,
    height: 20,
    backgroundColor: '#CCCCCC',
    marginRight: 12,
  },
  phoneTextInput: {
    flex: 1,
    fontSize: 15,
    color: '#000000',
    padding: 0,
  },
  phoneBorder: {
    height: 1,
    backgroundColor: '#CCCCCC',
  },
  phoneBorderError: {
    backgroundColor: '#E11900',
  },
  // Preferences (language cards)
  prefLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#545454',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  langRow: {
    flexDirection: 'row',
    gap: 12,
  },
  langCard: {
    flex: 1,
    height: 72,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
  },
  langCardSelected: {
    borderWidth: 2,
    borderColor: '#000000',
  },
  langFlag: {
    fontSize: 22,
  },
  langText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#545454',
  },
  langTextSelected: {
    color: '#000000',
    fontWeight: '600',
  },
  // Footer
  footer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F6F6F6',
  },
  nextBtn: {
    height: 56,
    borderRadius: 4,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnDisabled: {
    backgroundColor: '#EEEEEE',
  },
  nextBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default RegisterScreen;
