// src/App.js (UPDATED)  
import React from 'react';  
import { View, StyleSheet, ActivityIndicator } from 'react-native';  
import { AuthProvider, useAuth } from './src/context/AuthContext';  
import { OnboardingProvider, useOnboarding } from './src/context/OnboardingContext';
import AuthScreen from './src/screens/AuthScreen';  
import OnboardingScreen from './src/screens/OnboardingScreen';
import MainTabNavigator from './src/navigation/MainTabNavigator';  

function RootNavigator() {  
  const { user, isLoading } = useAuth();  
  const { isLoading: onboardingLoading, isVisible, openOnboarding } = useOnboarding();

  if (isLoading || onboardingLoading) {  
    return (  
      <View style={styles.loadingContainer}>  
        <ActivityIndicator size="large" color="#0000ff" />  
      </View>  
    );  
  }  

  if (!user) {
    return <AuthScreen />;
  }

  if (isVisible) {
    return <OnboardingScreen />;
  }

  return <MainTabNavigator onOpenTutorial={openOnboarding} />;  
}  

export default function App() {  
  return (  
    <AuthProvider>  
      <OnboardingProvider>
        <RootNavigator />  
      </OnboardingProvider>
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
