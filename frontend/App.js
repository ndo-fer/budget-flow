// App.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import client from './src/api/client';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkApiConnection();
  }, []);

  const checkApiConnection = async () => {
    try {
      const response = await client.get('/');
      setApiStatus(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
      setApiStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Budget Flow</Text>
      
      {error ? (
        <Text style={styles.error}>❌ API Error: {error}</Text>
      ) : (
        <Text style={styles.success}>✅ {apiStatus?.message}</Text>
      )}
      
      <Text style={styles.subtitle}>Frontend Ready!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
  success: {
    fontSize: 16,
    color: 'green',
    marginTop: 10,
  },
  error: {
    fontSize: 16,
    color: 'red',
    marginTop: 10,
  },
});