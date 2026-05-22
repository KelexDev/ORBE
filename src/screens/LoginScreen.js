import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

const LoginScreen = ({navigation}) => {
  // Cajas de memoria para guardar lo que escribe el usuario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Función que se ejecuta cuando presiona "Iniciar sesión"
const handleLogin = () => {
  // Validar campos vacíos
  if (!email || !password) {
    setError('Please fill in all fields');
    return;
  }

  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    setError('Please enter a valid email address');
    return;
  }

  // Validar longitud mínima de contraseña
  if (password.length < 6) {
    setError('Password must be at least 6 characters');
    return;
  }

  // Todo bien — navegamos
  setError('');
  navigation.navigate('Home');
};

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

      {/* Título */}
      <Text style={styles.title}>Orbe</Text>
      <Text style={styles.subtitle}>Welcome back</Text>

      {/* Input de email */}
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {/* Input de contraseña */}
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#999"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {/* Mensaje de error */}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* Botón de login */}
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Sign In</Text>
      </TouchableOpacity>

      {/* Link a Register */}
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>Don't have an account? Sign Up</Text>
      </TouchableOpacity>

    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#000',
    marginBottom: 16,
    backgroundColor: '#fafafa',
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
});

export default LoginScreen;