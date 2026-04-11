// src/App.js (UPDATED)  
import React from 'react';  
import { View, StyleSheet, ActivityIndicator } from 'react-native';  
import { AuthProvider, useAuth } from './src/context/AuthContext';  
import AuthScreen from './src/screens/AuthScreen';  
import MainTabNavigator from './src/navigation/MainTabNavigator';  

function RootNavigator() {  
  const { user, isLoading } = useAuth();  

  if (isLoading) {  
    return (  
      <View style={styles.loadingContainer}>  
        <ActivityIndicator size="large" color="#0000ff" />  
      </View>  
    );  
  }  

  return user ? <MainTabNavigator /> : <AuthScreen />;  
}  

export default function App() {  
  return (  
    <AuthProvider>  
      <RootNavigator />  
    </AuthProvider>  
  );  
}  

const styles = StyleSheet.create({  
  loadingContainer: {  
    flex: 1,  
    justifyContent: 'center',  
    alignItems: 'center',  
    backgroundColor: '#fff',  
  },  
});
