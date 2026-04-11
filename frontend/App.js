// App.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import HomeScreen from './src/screens/HomeScreen';

export default function App() {
  return (
    <AuthProvider>
      <View style={styles.container}>
        <HomeScreen />
      </View>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
