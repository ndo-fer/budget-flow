// src/navigation/MainTabNavigator.js (UPDATED)  
import React from 'react';  
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';  
import HomeScreen from '../screens/HomeScreen';  
import AnalyticsScreen from '../screens/AnalyticsScreen';  
import ExpenseHistoryScreen from '../screens/ExpenseHistoryScreen';  
import SettingsScreen from '../screens/SettingsScreen';  

const TAB_ICONS = {  
  home: '🏠',  
  analytics: '📊',  
  history: '📋',  
  settings: '⚙️',  
};  

export default function MainTabNavigator() {  
  const [activeTab, setActiveTab] = React.useState('home');  

  return (  
    <View style={styles.container}>  
      {/* Active Screen */}  
      {activeTab === 'home' && <HomeScreen />}  
      {activeTab === 'analytics' && <AnalyticsScreen />}  
      {activeTab === 'history' && <ExpenseHistoryScreen />}  
      {activeTab === 'settings' && <SettingsScreen />}  

      {/* Tab Bar */}  
      <View style={styles.tabBar}>  
        <TouchableOpacity  
          style={[styles.tab, activeTab === 'home' && styles.activeTab]}  
          onPress={() => setActiveTab('home')}  
        >  
          <Text style={styles.tabIcon}>{TAB_ICONS.home}</Text>  
          <Text style={[styles.tabLabel, activeTab === 'home' && styles.activeLabel]}>  
            Home  
          </Text>  
        </TouchableOpacity>  

        <TouchableOpacity  
          style={[styles.tab, activeTab === 'analytics' && styles.activeTab]}  
          onPress={() => setActiveTab('analytics')}  
        >  
          <Text style={styles.tabIcon}>{TAB_ICONS.analytics}</Text>  
          <Text  
            style={[styles.tabLabel, activeTab === 'analytics' && styles.activeLabel]}  
          >  
            Analytics  
          </Text>  
        </TouchableOpacity>  

        <TouchableOpacity  
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}  
          onPress={() => setActiveTab('history')}  
        >  
          <Text style={styles.tabIcon}>{TAB_ICONS.history}</Text>  
          <Text style={[styles.tabLabel, activeTab === 'history' && styles.activeLabel]}>  
            History  
          </Text>  
        </TouchableOpacity>  

        <TouchableOpacity  
          style={[styles.tab, activeTab === 'settings' && styles.activeTab]}  
          onPress={() => setActiveTab('settings')}  
        >  
          <Text style={styles.tabIcon}>{TAB_ICONS.settings}</Text>  
          <Text  
            style={[styles.tabLabel, activeTab === 'settings' && styles.activeLabel]}  
          >  
            Settings  
          </Text>  
        </TouchableOpacity>  
      </View>  
    </View>  
  );  
}  

const styles = StyleSheet.create({  
  container: {  
    flex: 1,  
    backgroundColor: '#fff',  
  },  
  tabBar: {  
    flexDirection: 'row',  
    height: 60,  
    borderTopWidth: 1,  
    borderTopColor: '#eee',  
    backgroundColor: 'white',  
  },  
  tab: {  
    flex: 1,  
    justifyContent: 'center',  
    alignItems: 'center',  
  },  
  activeTab: {  
    borderTopWidth: 3,  
    borderTopColor: '#1976d2',  
  },  
  tabIcon: {  
    fontSize: 20,  
    marginBottom: 4,  
  },  
  tabLabel: {  
    fontSize: 9,  
    color: '#999',  
    fontWeight: '500',  
  },  
  activeLabel: {  
    color: '#1976d2',  
    fontWeight: '600',  
  },  
});
