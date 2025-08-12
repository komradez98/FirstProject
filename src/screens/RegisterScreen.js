import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  TextInput,
  Button,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function RegisterScreen({ navigation }) {
  const { theme, toggleTheme } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = () => {
    alert(`Register dengan: ${email} / ${password}`);
  };
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Register</Text>

      <TextInput
        placeholder="Name"
        placeholderTextColor="#888"
        value={name}
        onChangeText={setName}
        style={[
          styles.input,
          { backgroundColor: theme.inputBackground, color: theme.inputText },
        ]}
      />

      <TextInput
        placeholder="Email"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        style={[
          styles.input,
          { backgroundColor: theme.inputBackground, color: theme.inputText },
        ]}
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#888"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={[
          styles.input,
          { backgroundColor: theme.inputBackground, color: theme.inputText },
        ]}
      />

      <Button title="Register" onPress={handleRegister} color={theme.primary} />

      <View>
        <Text
          style={[styles.linkText, { color: theme.text }]}
          onPress={() => navigation.navigate('Login')}
        >
          Sudah punya akun? Login
        </Text>
      </View>
      <View>
        <TouchableOpacity
          style={[styles.circleButton, { top: 20, right: 10 }]}
          title="Toggle Theme"
          onPress={toggleTheme}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  input: { padding: 10, borderRadius: 5, marginBottom: 10 },
  circleButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    elevation: 5,
  },
  linkText: {
    marginTop: 10,
    marginBottom: 2,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});
