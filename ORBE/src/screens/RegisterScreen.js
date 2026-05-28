import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Modal,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

const RegisterScreen = ({ navigation }) => {
  const [photo, setPhoto] = useState(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [email, setEmail] = useState('');
  const [language, setLanguage] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Controlan si el modal está abierto o cerrado
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  const handleRegister = () => {
    if (!fullName || !phone || !gender || !email || !password || !language) {
      setError('Please fill in all fields');
      return;
    }
    if (fullName.length > 50) {
      setError('Full name must be 50 characters or less');
      return;
    }
    if (!/^\d+$/.test(phone)) {
      setError('Phone number must contain only digits');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError('');
    navigation.navigate('Home');
  };

  // Etiquetas legibles para mostrar en el campo
  const genderLabel = {
    male: 'Male',
    female: 'Female',
    other: 'Prefer not to say',
  };

  const languageLabel = {
    es: '🇨🇴 Español',
    en: '🇺🇸 English',
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Join Orbe today</Text>

      {/* Photo */}
      <TouchableOpacity style={styles.photoContainer}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.photo} />
        ) : (
          <Text style={styles.photoText}>+ Add Photo</Text>
        )}
      </TouchableOpacity>

      {/* Full name */}
      <TextInput
        style={styles.input}
        placeholder="Full name"
        placeholderTextColor="#999"
        value={fullName}
        onChangeText={text => {
          if (text.length <= 50) setFullName(text);
        }}
      />
      <Text style={styles.counter}>{fullName.length}/50</Text>

      {/* Phone */}
      <TextInput
        style={styles.input}
        placeholder="Phone number"
        placeholderTextColor="#999"
        value={phone}
        onChangeText={setPhone}
        keyboardType="numeric"
      />

      {/* Gender — abre modal al tocar */}
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setShowGenderPicker(true)}
      >
        <Text style={gender ? styles.selectorText : styles.selectorPlaceholder}>
          {gender ? genderLabel[gender] : 'Select gender...'}
        </Text>
        <Text style={styles.arrow}>▾</Text>
      </TouchableOpacity>

      {/* Email */}
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {/* Language — abre modal al tocar */}
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setShowLanguagePicker(true)}
      >
        <Text
          style={language ? styles.selectorText : styles.selectorPlaceholder}
        >
          {language ? languageLabel[language] : 'Select language...'}
        </Text>
        <Text style={styles.arrow}>▾</Text>
      </TouchableOpacity>

      {/* Password */}
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#999"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Create Account</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Already have an account? Sign In</Text>
      </TouchableOpacity>

      {/* Modal de género */}
      <Modal visible={showGenderPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Gender</Text>
              <TouchableOpacity onPress={() => setShowGenderPicker(false)}>
                <Text style={styles.modalDone}>Done</Text>
              </TouchableOpacity>
            </View>
            <Picker
              selectedValue={gender}
              onValueChange={value => setGender(value)}
              itemStyle={styles.pickerItem}
            >
              <Picker.Item label="Select gender..." value="" />
              <Picker.Item label="Male" value="male" />
              <Picker.Item label="Female" value="female" />
              <Picker.Item label="Prefer not to say" value="other" />
            </Picker>
          </View>
        </View>
      </Modal>

      {/* Modal de idioma */}
      <Modal visible={showLanguagePicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Language</Text>
              <TouchableOpacity onPress={() => setShowLanguagePicker(false)}>
                <Text style={styles.modalDone}>Done</Text>
              </TouchableOpacity>
            </View>
            <Picker
              selectedValue={language}
              onValueChange={value => setLanguage(value)}
              itemStyle={styles.pickerItem}
            >
              <Picker.Item label="🇨🇴 Español" value="es" />
              <Picker.Item label="🇺🇸 English" value="en" />
            </Picker>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  photoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  photoText: {
    color: '#999',
    fontSize: 14,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#000',
    marginBottom: 8,
    backgroundColor: '#fafafa',
  },
  counter: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginBottom: 8,
  },
  selector: {
    height: 52,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fafafa',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorText: {
    fontSize: 16,
    color: '#000',
  },
  selectorPlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  arrow: {
    fontSize: 16,
    color: '#999',
  },
  error: {
    color: 'red',
    fontSize: 14,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#000',
    height: 52,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  link: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  modalDone: {
    fontSize: 16,
    color: '#000',
    fontWeight: 'bold',
  },
  pickerItem: {
    fontSize: 18,
    color: '#000',
  },
});

export default RegisterScreen;
